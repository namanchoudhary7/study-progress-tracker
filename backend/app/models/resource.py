from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ResourceType
from app.models.mixins import TimestampMixin


class Resource(Base, TimestampMixin):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[ResourceType] = mapped_column(Enum(ResourceType, name="resource_type"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str | None] = mapped_column(String(2000))
    content: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship()
    topic: Mapped["Topic"] = relationship(back_populates="resources")
