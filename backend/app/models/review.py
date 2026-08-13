from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ReviewOutcome
from app.models.mixins import TimestampMixin


class ReviewSchedule(Base, TimestampMixin):
    __tablename__ = "review_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), unique=True, nullable=False)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_review_date: Mapped[date | None] = mapped_column(Date)
    interval_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Numeric(4, 2), default=2.0, nullable=False)

    topic: Mapped["Topic"] = relationship(back_populates="review_schedule")


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    outcome: Mapped[ReviewOutcome] = mapped_column(Enum(ReviewOutcome, name="review_outcome"), nullable=False)
    interval_days_before: Mapped[int] = mapped_column(Integer, nullable=False)
    interval_days_after: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topic: Mapped["Topic"] = relationship(back_populates="review_logs")
