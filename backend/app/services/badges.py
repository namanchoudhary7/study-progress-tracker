from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import GoalStatus, TopicStatus
from app.models.goal import Goal
from app.models.review import ReviewLog
from app.models.study_session import StudySession
from app.models.topic import Topic
from app.schemas.stats import BadgeRead
from app.services.stats import get_streaks

BADGES = [
    {"key": "first_topic", "label": "First Steps", "description": "Complete your first topic", "icon": "CheckSquare", "metric": "topics_done", "target": 1},
    {"key": "topics_25", "label": "Quarter Century", "description": "Complete 25 topics", "icon": "CheckSquare", "metric": "topics_done", "target": 25},
    {"key": "topics_100", "label": "Centurion", "description": "Complete 100 topics", "icon": "CheckSquare", "metric": "topics_done", "target": 100},
    {"key": "streak_7", "label": "Week Warrior", "description": "Study 7 days in a row", "icon": "Flame", "metric": "longest_streak", "target": 7},
    {"key": "streak_30", "label": "Monthly Habit", "description": "Study 30 days in a row", "icon": "Flame", "metric": "longest_streak", "target": 30},
    {"key": "streak_100", "label": "Unstoppable", "description": "Study 100 days in a row", "icon": "Flame", "metric": "longest_streak", "target": 100},
    {"key": "first_goal", "label": "Goal Getter", "description": "Complete your first goal", "icon": "Target", "metric": "goals_completed", "target": 1},
    {"key": "first_review", "label": "Memory Lane", "description": "Complete your first spaced review", "icon": "RotateCcw", "metric": "total_reviews", "target": 1},
    {"key": "review_50", "label": "Spaced Repeater", "description": "Complete 50 spaced reviews", "icon": "RotateCcw", "metric": "total_reviews", "target": 50},
    {"key": "hours_10", "label": "10 Hour Club", "description": "Log 10 hours of study time", "icon": "Clock", "metric": "total_minutes", "target": 600},
    {"key": "hours_50", "label": "50 Hour Club", "description": "Log 50 hours of study time", "icon": "Clock", "metric": "total_minutes", "target": 3000},
]


def get_badge_metrics(db: Session, user_id: int) -> dict[str, int]:
    streaks = get_streaks(db, user_id)
    topics_done = (
        db.scalar(
            select(func.count()).select_from(Topic).where(Topic.user_id == user_id, Topic.status == TopicStatus.done)
        )
        or 0
    )
    total_minutes = (
        db.scalar(select(func.coalesce(func.sum(StudySession.duration_minutes), 0)).where(StudySession.user_id == user_id))
        or 0
    )
    goals_completed = (
        db.scalar(
            select(func.count()).select_from(Goal).where(Goal.user_id == user_id, Goal.status == GoalStatus.completed)
        )
        or 0
    )
    total_reviews = (
        db.scalar(select(func.count()).select_from(ReviewLog).where(ReviewLog.user_id == user_id)) or 0
    )

    return {
        "topics_done": topics_done,
        "longest_streak": streaks.longest_streak,
        "goals_completed": goals_completed,
        "total_reviews": total_reviews,
        "total_minutes": total_minutes,
    }


def get_badges(db: Session, user_id: int) -> list[BadgeRead]:
    metrics = get_badge_metrics(db, user_id)
    badges = []
    for b in BADGES:
        current = metrics[b["metric"]]
        badges.append(
            BadgeRead(
                key=b["key"],
                label=b["label"],
                description=b["description"],
                icon=b["icon"],
                earned=current >= b["target"],
                current=min(current, b["target"]),
                target=b["target"],
            )
        )
    return badges
