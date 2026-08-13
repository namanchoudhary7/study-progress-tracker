from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class StudySession(Base, TimestampMixin):
    __tablename__ = "study_sessions"
    __table_args__ = (
        Index("ix_study_sessions_subject_date", "subject_id", "session_date"),
        Index("ix_study_sessions_topic_date", "topic_id", "session_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"))
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    subject: Mapped["Subject"] = relationship(back_populates="study_sessions")
    topic: Mapped["Topic | None"] = relationship(back_populates="study_sessions")
