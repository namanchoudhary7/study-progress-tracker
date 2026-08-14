from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None
    target_date: date | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    target_date: date | None = None
    sr_initial_interval_days: int | None = Field(default=None, ge=1, le=90)
    sr_ease_factor: float | None = Field(default=None, ge=1.1, le=5.0)


class SubjectRead(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sr_initial_interval_days: int | None
    sr_ease_factor: float | None
    created_at: datetime
    updated_at: datetime
