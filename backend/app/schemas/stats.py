from datetime import date

from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_subjects: int
    total_topics: int
    topics_done: int
    completion_pct: float
    total_minutes: int


class CompletionItem(BaseModel):
    subject_id: int
    subject_name: str
    total_topics: int
    done_topics: int
    completion_pct: float


class TimeSpentPoint(BaseModel):
    label: str
    minutes: int


class StreakStats(BaseModel):
    current_streak: int
    longest_streak: int


class OverdueGoal(BaseModel):
    id: int
    title: str
    target_date: date


class OverdueSummary(BaseModel):
    overdue_goals: list[OverdueGoal]
    due_reviews_count: int
