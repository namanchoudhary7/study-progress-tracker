from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReviewOutcome
from app.schemas.resource import ResourceRead


class ReviewScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    last_reviewed_at: datetime | None
    next_review_date: date | None
    interval_days: int
    review_count: int


class DueReviewItem(BaseModel):
    topic_id: int
    topic_name: str
    topic_notes: str | None
    subject_id: int
    subject_name: str
    next_review_date: date
    interval_days: int
    review_count: int
    resources: list[ResourceRead]


class ReviewLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    reviewed_at: datetime
    outcome: ReviewOutcome
    interval_days_before: int
    interval_days_after: int


class ReviewCompleteRequest(BaseModel):
    outcome: ReviewOutcome


class TopicReviewDetail(BaseModel):
    schedule: ReviewScheduleRead | None
    logs: list[ReviewLogRead]
