from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import topics as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import TopicBulkCreate, TopicCreate, TopicRead, TopicUpdate

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=list[TopicRead])
def list_topics(
    subject_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Topic]:
    return tools.list_topics(db, current_user, subject_id=subject_id)


@router.post("", response_model=TopicRead, status_code=201)
def create_topic(
    payload: TopicCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Topic:
    return tools.create_topic(db, current_user, **payload.model_dump())


@router.post("/bulk", response_model=list[TopicRead], status_code=201)
def bulk_create_topics(
    payload: TopicBulkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Topic]:
    return tools.bulk_create_topics(db, current_user, payload.subject_id, payload.text)


@router.get("/{topic_id}", response_model=TopicRead)
def get_topic(topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Topic:
    return tools.get_topic(db, current_user, topic_id)


@router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Topic:
    return tools.update_topic(db, current_user, topic_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    tools.delete_topic(db, current_user, topic_id)
