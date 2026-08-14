from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.models.user import User


def _get_tag_or_404(db: Session, tag_id: int, user: User) -> Tag:
    tag = db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == user.id))
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


def list_tags(db: Session, user: User) -> list[Tag]:
    return list(db.scalars(select(Tag).where(Tag.user_id == user.id).order_by(Tag.name)))


def create_tag(db: Session, user: User, name: str, color: str | None = None) -> Tag:
    if db.scalar(select(Tag).where(Tag.user_id == user.id, Tag.name == name)):
        raise HTTPException(status_code=409, detail="A tag with this name already exists")
    tag = Tag(name=name, color=color, user_id=user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag(db: Session, user: User, tag_id: int, **updates) -> Tag:
    """`updates` should only contain keys the caller actually wants to change."""
    tag = _get_tag_or_404(db, tag_id, user)

    if "name" in updates and updates["name"] != tag.name:
        if db.scalar(select(Tag).where(Tag.user_id == user.id, Tag.name == updates["name"])):
            raise HTTPException(status_code=409, detail="A tag with this name already exists")

    for field, value in updates.items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, user: User, tag_id: int) -> None:
    tag = _get_tag_or_404(db, tag_id, user)
    db.delete(tag)
    db.commit()
