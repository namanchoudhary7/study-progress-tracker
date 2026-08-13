from datetime import date

from sqlalchemy import Date, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(20))
    target_date: Mapped[date | None] = mapped_column(Date)

    topics: Mapped[list["Topic"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="subject")
    goals: Mapped[list["Goal"]] = relationship(back_populates="subject")
