from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FlashcardCreate(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=2000)


class FlashcardUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1, max_length=2000)
    answer: str | None = Field(default=None, min_length=1, max_length=2000)


class FlashcardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    question: str
    answer: str
    created_at: datetime
