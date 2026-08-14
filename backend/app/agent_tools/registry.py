"""Single source of truth for every tool the in-app agent and the MCP server can call.

Each Tool wraps a plain (db, user, **kwargs) function from app.agent_tools.* and knows how to
serialize its ORM/schema result to plain JSON-able data, so both consumers get identical behavior.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Any, Callable

from sqlalchemy.orm import Session

from app.agent_tools import goals, plans, reviews, sessions, stats, subjects, tags, topics
from app.models.user import User
from app.schemas.goal import GoalRead
from app.schemas.recurring_plan import RecurringPlanRead, TodayPlanItem
from app.schemas.review import DueReviewItem, ReviewScheduleRead, TopicReviewDetail
from app.schemas.stats import CompletionItem, HeatmapCell, OverdueSummary, OverviewStats, StreakStats, TimeSpentPoint
from app.schemas.study_session import StudySessionRead
from app.schemas.subject import SubjectRead
from app.schemas.tag import TagRead
from app.schemas.topic import TopicRead


def _one(schema):
    return lambda obj: schema.model_validate(obj).model_dump(mode="json")


def _many(schema):
    return lambda objs: [schema.model_validate(o).model_dump(mode="json") for o in objs]


def _passthrough(obj):
    return obj.model_dump(mode="json") if hasattr(obj, "model_dump") else obj


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[..., Any]
    serialize: Callable[[Any], Any] = field(default=_passthrough)

    def _date_fields(self) -> set[str]:
        props = self.parameters.get("properties", {})
        return {name for name, spec in props.items() if spec.get("format") == "date"}

    def call(self, db: Session, user: User, args: dict[str, Any]) -> Any:
        coerced = dict(args)
        for name in self._date_fields():
            if isinstance(coerced.get(name), str):
                coerced[name] = date.fromisoformat(coerced[name])
        result = self.handler(db, user, **coerced)
        return self.serialize(result)


TOOLS: list[Tool] = [
    # --- subjects ---
    Tool("list_subjects", "List all of the user's subjects.", {"type": "object", "properties": {}}, subjects.list_subjects, _many(SubjectRead)),
    Tool(
        "get_subject",
        "Get a single subject by id.",
        {"type": "object", "properties": {"subject_id": {"type": "integer"}}, "required": ["subject_id"]},
        subjects.get_subject,
        _one(SubjectRead),
    ),
    Tool(
        "create_subject",
        "Create a new subject (top-level area of study, e.g. 'Organic Chemistry').",
        {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "color": {"type": "string", "description": "Hex color like #3b82f6"},
                "target_date": {"type": "string", "format": "date"},
            },
            "required": ["name"],
        },
        subjects.create_subject,
        _one(SubjectRead),
    ),
    Tool(
        "update_subject",
        "Update fields on an existing subject. Only pass fields you want changed.",
        {
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "color": {"type": "string"},
                "target_date": {"type": "string", "format": "date"},
                "sr_initial_interval_days": {"type": "integer"},
                "sr_ease_factor": {"type": "number"},
            },
            "required": ["subject_id"],
        },
        lambda db, user, subject_id, **updates: subjects.update_subject(db, user, subject_id, **updates),
        _one(SubjectRead),
    ),
    Tool(
        "delete_subject",
        "Delete a subject and everything under it (topics, sessions, goals).",
        {"type": "object", "properties": {"subject_id": {"type": "integer"}}, "required": ["subject_id"]},
        subjects.delete_subject,
        lambda _: {"deleted": True},
    ),
    # --- topics ---
    Tool(
        "list_topics",
        "List topics, optionally filtered to one subject.",
        {"type": "object", "properties": {"subject_id": {"type": "integer"}}},
        topics.list_topics,
        _many(TopicRead),
    ),
    Tool(
        "get_topic",
        "Get a single topic by id.",
        {"type": "object", "properties": {"topic_id": {"type": "integer"}}, "required": ["topic_id"]},
        topics.get_topic,
        _one(TopicRead),
    ),
    Tool(
        "create_topic",
        "Create a topic under a subject (e.g. a chapter or concept to study).",
        {
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "order_index": {"type": "integer"},
                "notes": {"type": "string"},
                "target_date": {"type": "string", "format": "date"},
                "tag_ids": {"type": "array", "items": {"type": "integer"}},
                "parent_topic_id": {"type": "integer", "description": "Set to nest this as a sub-topic."},
            },
            "required": ["subject_id", "name"],
        },
        topics.create_topic,
        _one(TopicRead),
    ),
    Tool(
        "bulk_create_topics",
        "Create many topics at once from a newline-delimited list of names (e.g. a pasted syllabus).",
        {
            "type": "object",
            "properties": {"subject_id": {"type": "integer"}, "text": {"type": "string"}},
            "required": ["subject_id", "text"],
        },
        topics.bulk_create_topics,
        _many(TopicRead),
    ),
    Tool(
        "update_topic",
        "Update fields on a topic, including marking it todo/in_progress/done. Only pass fields you want changed.",
        {
            "type": "object",
            "properties": {
                "topic_id": {"type": "integer"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "status": {"type": "string", "enum": ["todo", "in_progress", "done"]},
                "order_index": {"type": "integer"},
                "notes": {"type": "string"},
                "target_date": {"type": "string", "format": "date"},
                "tag_ids": {"type": "array", "items": {"type": "integer"}},
                "parent_topic_id": {"type": "integer"},
            },
            "required": ["topic_id"],
        },
        lambda db, user, topic_id, **updates: topics.update_topic(db, user, topic_id, **updates),
        _one(TopicRead),
    ),
    Tool(
        "delete_topic",
        "Delete a topic.",
        {"type": "object", "properties": {"topic_id": {"type": "integer"}}, "required": ["topic_id"]},
        topics.delete_topic,
        lambda _: {"deleted": True},
    ),
    # --- study sessions ---
    Tool(
        "list_sessions",
        "List logged study sessions, optionally filtered by subject, topic, or date range.",
        {
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "topic_id": {"type": "integer"},
                "date_from": {"type": "string", "format": "date"},
                "date_to": {"type": "string", "format": "date"},
            },
        },
        sessions.list_sessions,
        _many(StudySessionRead),
    ),
    Tool(
        "log_session",
        "Log a study session (how long the user studied something, and when).",
        {
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "topic_id": {"type": "integer"},
                "session_date": {"type": "string", "format": "date"},
                "duration_minutes": {"type": "integer"},
                "notes": {"type": "string"},
            },
            "required": ["subject_id", "session_date", "duration_minutes"],
        },
        sessions.create_session,
        _one(StudySessionRead),
    ),
    Tool(
        "update_session",
        "Update fields on a logged study session. Only pass fields you want changed.",
        {
            "type": "object",
            "properties": {
                "session_id": {"type": "integer"},
                "topic_id": {"type": "integer"},
                "session_date": {"type": "string", "format": "date"},
                "duration_minutes": {"type": "integer"},
                "notes": {"type": "string"},
            },
            "required": ["session_id"],
        },
        lambda db, user, session_id, **updates: sessions.update_session(db, user, session_id, **updates),
        _one(StudySessionRead),
    ),
    Tool(
        "delete_session",
        "Delete a logged study session.",
        {"type": "object", "properties": {"session_id": {"type": "integer"}}, "required": ["session_id"]},
        sessions.delete_session,
        lambda _: {"deleted": True},
    ),
    # --- goals ---
    Tool(
        "list_goals",
        "List goals, optionally filtered by status or overdue-only.",
        {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["open", "completed", "missed"]},
                "overdue": {"type": "boolean"},
            },
        },
        goals.list_goals,
        _many(GoalRead),
    ),
    Tool(
        "create_goal",
        "Create a goal with a target date, attached to exactly one of a subject or a topic.",
        {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "target_date": {"type": "string", "format": "date"},
                "subject_id": {"type": "integer"},
                "topic_id": {"type": "integer"},
            },
            "required": ["title", "target_date"],
        },
        goals.create_goal,
        _one(GoalRead),
    ),
    Tool(
        "update_goal",
        "Update fields on a goal. Only pass fields you want changed.",
        {
            "type": "object",
            "properties": {
                "goal_id": {"type": "integer"},
                "title": {"type": "string"},
                "target_date": {"type": "string", "format": "date"},
                "status": {"type": "string", "enum": ["open", "completed", "missed"]},
            },
            "required": ["goal_id"],
        },
        lambda db, user, goal_id, **updates: goals.update_goal(db, user, goal_id, **updates),
        _one(GoalRead),
    ),
    Tool(
        "delete_goal",
        "Delete a goal.",
        {"type": "object", "properties": {"goal_id": {"type": "integer"}}, "required": ["goal_id"]},
        goals.delete_goal,
        lambda _: {"deleted": True},
    ),
    # --- spaced-repetition reviews ---
    Tool(
        "list_due_reviews",
        "List topics due for spaced-repetition review today or earlier, with their notes and resources.",
        {"type": "object", "properties": {}},
        reviews.list_due_reviews,
        _many(DueReviewItem),
    ),
    Tool(
        "get_topic_review",
        "Get the review schedule and full review history for a topic.",
        {"type": "object", "properties": {"topic_id": {"type": "integer"}}, "required": ["topic_id"]},
        reviews.get_topic_review,
        _one(TopicReviewDetail),
    ),
    Tool(
        "complete_review",
        "Record the outcome of reviewing a topic (again/good/easy) and advance its review schedule.",
        {
            "type": "object",
            "properties": {
                "topic_id": {"type": "integer"},
                "outcome": {"type": "string", "enum": ["again", "good", "easy"]},
            },
            "required": ["topic_id", "outcome"],
        },
        reviews.complete_review,
        _one(ReviewScheduleRead),
    ),
    # --- tags ---
    Tool("list_tags", "List all of the user's tags.", {"type": "object", "properties": {}}, tags.list_tags, _many(TagRead)),
    Tool(
        "create_tag",
        "Create a tag that can be attached to topics.",
        {
            "type": "object",
            "properties": {"name": {"type": "string"}, "color": {"type": "string"}},
            "required": ["name"],
        },
        tags.create_tag,
        _one(TagRead),
    ),
    # --- recurring plans ---
    Tool("list_plans", "List all recurring study plans.", {"type": "object", "properties": {}}, plans.list_plans, _many(RecurringPlanRead)),
    Tool("list_today_plans", "List recurring plans scheduled for today.", {"type": "object", "properties": {}}, plans.list_today_plans, _many(TodayPlanItem)),
    Tool(
        "create_plan",
        "Create a recurring study plan for specific days of the week.",
        {
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "topic_id": {"type": "integer"},
                "days_of_week": {
                    "type": "integer",
                    "description": "Bitmask, bit 0 = Monday .. bit 6 = Sunday, e.g. 31 = weekdays.",
                },
            },
            "required": ["subject_id", "days_of_week"],
        },
        plans.create_plan,
        _one(RecurringPlanRead),
    ),
    # --- stats / dashboard ---
    Tool("get_overview_stats", "Get headline stats: subject/topic counts, completion %, total minutes studied.", {"type": "object", "properties": {}}, stats.get_overview, _one(OverviewStats)),
    Tool("get_completion_stats", "Get per-subject completion percentages.", {"type": "object", "properties": {}}, stats.get_completion, _many(CompletionItem)),
    Tool(
        "get_time_spent_stats",
        "Get time studied grouped by day, week, or subject, optionally within a date range.",
        {
            "type": "object",
            "properties": {
                "date_from": {"type": "string", "format": "date"},
                "date_to": {"type": "string", "format": "date"},
                "group_by": {"type": "string", "enum": ["day", "week", "subject"]},
            },
        },
        stats.get_time_spent,
        _many(TimeSpentPoint),
    ),
    Tool("get_streaks", "Get the user's current and longest study streaks.", {"type": "object", "properties": {}}, stats.get_streaks, _one(StreakStats)),
    Tool("get_overdue", "Get overdue goals and the count of due reviews.", {"type": "object", "properties": {}}, stats.get_overdue, _one(OverdueSummary)),
    Tool(
        "get_heatmap",
        "Get daily minutes-studied heatmap data for a given year.",
        {"type": "object", "properties": {"year": {"type": "integer"}}, "required": ["year"]},
        stats.get_heatmap_year,
        _many(HeatmapCell),
    ),
]

TOOLS_BY_NAME: dict[str, Tool] = {tool.name: tool for tool in TOOLS}


def get_tool(name: str) -> Tool:
    if name not in TOOLS_BY_NAME:
        raise KeyError(f"Unknown tool: {name}")
    return TOOLS_BY_NAME[name]
