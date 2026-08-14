from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


def _get_tag_or_404(db: Session, tag_id: int, current_user: User) -> Tag:
    tag = db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id))
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.get("", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Tag]:
    return list(db.scalars(select(Tag).where(Tag.user_id == current_user.id).order_by(Tag.name)))


@router.post("", response_model=TagRead, status_code=201)
def create_tag(
    payload: TagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Tag:
    if db.scalar(select(Tag).where(Tag.user_id == current_user.id, Tag.name == payload.name)):
        raise HTTPException(status_code=409, detail="A tag with this name already exists")
    tag = Tag(**payload.model_dump(), user_id=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: int, payload: TagUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Tag:
    tag = _get_tag_or_404(db, tag_id, current_user)
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] != tag.name:
        if db.scalar(select(Tag).where(Tag.user_id == current_user.id, Tag.name == updates["name"])):
            raise HTTPException(status_code=409, detail="A tag with this name already exists")

    for field, value in updates.items():
        setattr(tag, field, value)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    tag = _get_tag_or_404(db, tag_id, current_user)
    db.delete(tag)
    db.commit()
