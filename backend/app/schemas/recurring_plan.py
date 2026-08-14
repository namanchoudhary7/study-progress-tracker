from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecurringPlanCreate(BaseModel):
    subject_id: int
    topic_id: int | None = None
    days_of_week: int = Field(ge=1, le=127)


class RecurringPlanUpdate(BaseModel):
    topic_id: int | None = None
    days_of_week: int | None = Field(default=None, ge=1, le=127)


class RecurringPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    topic_id: int | None
    days_of_week: int
    created_at: datetime
    updated_at: datetime


class TodayPlanItem(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    topic_id: int | None
    topic_name: str | None
