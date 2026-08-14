from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ResourceType


class ResourceCreate(BaseModel):
    type: ResourceType
    title: str = Field(min_length=1, max_length=200)
    url: str | None = None
    content: str | None = None

    @model_validator(mode="after")
    def _check_type_fields(self) -> "ResourceCreate":
        if self.type == ResourceType.link and not self.url:
            raise ValueError("url is required for a link resource")
        if self.type == ResourceType.note and not self.content:
            raise ValueError("content is required for a note resource")
        return self


class ResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: str | None = None
    content: str | None = None


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    type: ResourceType
    title: str
    url: str | None
    content: str | None
    created_at: datetime
