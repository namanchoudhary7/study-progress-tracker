from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import GoalStatus


class GoalCreate(BaseModel):
    subject_id: int | None = None
    topic_id: int | None = None
    title: str
    target_date: date

    @model_validator(mode="after")
    def exactly_one_target(self) -> "GoalCreate":
        if (self.subject_id is None) == (self.topic_id is None):
            raise ValueError("Exactly one of subject_id or topic_id must be set")
        return self


class GoalUpdate(BaseModel):
    title: str | None = None
    target_date: date | None = None
    status: GoalStatus | None = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int | None
    topic_id: int | None
    title: str
    target_date: date
    status: GoalStatus
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
