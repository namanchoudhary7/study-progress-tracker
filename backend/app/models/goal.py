from datetime import datetime, date

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import GoalStatus
from app.models.mixins import TimestampMixin


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"
    __table_args__ = (
        CheckConstraint(
            "(subject_id IS NOT NULL AND topic_id IS NULL) OR (subject_id IS NULL AND topic_id IS NOT NULL)",
            name="ck_goals_exactly_one_target",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[GoalStatus] = mapped_column(
        Enum(GoalStatus, name="goal_status"), default=GoalStatus.open, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    subject: Mapped["Subject | None"] = relationship(back_populates="goals")
    topic: Mapped["Topic | None"] = relationship(back_populates="goals")
