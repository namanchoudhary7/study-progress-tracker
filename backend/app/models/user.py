from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import DigestFrequency
from app.models.mixins import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(200))
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    share_token: Mapped[str | None] = mapped_column(String(32), unique=True, index=True)
    digest_frequency: Mapped[DigestFrequency] = mapped_column(
        Enum(DigestFrequency, name="digest_frequency"), default=DigestFrequency.off, nullable=False, server_default="off"
    )
    last_digest_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    subjects: Mapped[list["Subject"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    topics: Mapped[list["Topic"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    recurring_plans: Mapped[list["RecurringPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    @property
    def has_password(self) -> bool:
        return self.hashed_password is not None
