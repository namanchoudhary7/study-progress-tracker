from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TopicStatus
from app.models.mixins import TimestampMixin
from app.models.tag import topic_tags


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TopicStatus] = mapped_column(
        Enum(TopicStatus, name="topic_status"), default=TopicStatus.todo, nullable=False
    )
    order_index: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="topics")
    subject: Mapped["Subject"] = relationship(back_populates="topics")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="topic")
    goals: Mapped[list["Goal"]] = relationship(back_populates="topic")
    review_schedule: Mapped["ReviewSchedule | None"] = relationship(
        back_populates="topic", uselist=False, cascade="all, delete-orphan"
    )
    review_logs: Mapped[list["ReviewLog"]] = relationship(back_populates="topic", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship(secondary=topic_tags, back_populates="topics")
