from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import tags as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Tag]:
    return tools.list_tags(db, current_user)


@router.post("", response_model=TagRead, status_code=201)
def create_tag(
    payload: TagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Tag:
    return tools.create_tag(db, current_user, **payload.model_dump())


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: int, payload: TagUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Tag:
    return tools.update_tag(db, current_user, tag_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    tools.delete_tag(db, current_user, tag_id)
