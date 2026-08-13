from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class StudySessionBase(BaseModel):
    subject_id: int
    topic_id: int | None = None
    session_date: date
    duration_minutes: int
    notes: str | None = None


class StudySessionCreate(StudySessionBase):
    pass


class StudySessionUpdate(BaseModel):
    topic_id: int | None = None
    session_date: date | None = None
    duration_minutes: int | None = None
    notes: str | None = None


class StudySessionRead(StudySessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
