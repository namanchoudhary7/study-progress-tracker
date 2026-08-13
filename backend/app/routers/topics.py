from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import TopicStatus
from app.models.review import ReviewSchedule
from app.models.topic import Topic
from app.schemas.topic import TopicCreate, TopicRead, TopicUpdate

router = APIRouter(prefix="/topics", tags=["topics"])


def _get_topic_or_404(db: Session, topic_id: int) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.get("", response_model=list[TopicRead])
def list_topics(subject_id: int | None = None, db: Session = Depends(get_db)) -> list[Topic]:
    stmt = select(Topic).order_by(Topic.order_index, Topic.id)
    if subject_id is not None:
        stmt = stmt.where(Topic.subject_id == subject_id)
    return list(db.scalars(stmt))


@router.post("", response_model=TopicRead, status_code=201)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db)) -> Topic:
    topic = Topic(**payload.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.get("/{topic_id}", response_model=TopicRead)
def get_topic(topic_id: int, db: Session = Depends(get_db)) -> Topic:
    return _get_topic_or_404(db, topic_id)


@router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db)) -> Topic:
    topic = _get_topic_or_404(db, topic_id)
    updates = payload.model_dump(exclude_unset=True)

    was_done = topic.status == TopicStatus.done
    for field, value in updates.items():
        setattr(topic, field, value)

    if "status" in updates:
        if topic.status == TopicStatus.done and not was_done:
            topic.completed_at = datetime.now(timezone.utc)
            if topic.review_schedule is None:
                db.add(
                    ReviewSchedule(
                        topic_id=topic.id,
                        interval_days=1,
                        next_review_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
                    )
                )
        elif topic.status != TopicStatus.done:
            topic.completed_at = None

    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204)
def delete_topic(topic_id: int, db: Session = Depends(get_db)) -> None:
    topic = _get_topic_or_404(db, topic_id)
    db.delete(topic)
    db.commit()
