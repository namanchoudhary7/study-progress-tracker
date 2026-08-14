from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import TopicStatus
from app.schemas.tag import TagRead


class TopicBase(BaseModel):
    name: str
    description: str | None = None
    order_index: int | None = None
    notes: str | None = None
    target_date: date | None = None


class TopicCreate(TopicBase):
    subject_id: int
    tag_ids: list[int] | None = None


class TopicBulkCreate(BaseModel):
    subject_id: int
    text: str


class TopicUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: TopicStatus | None = None
    order_index: int | None = None
    notes: str | None = None
    target_date: date | None = None
    tag_ids: list[int] | None = None


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    status: TopicStatus
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead]
