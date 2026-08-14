from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import TopicStatus
from app.models.review import ReviewSchedule
from app.models.subject import Subject
from app.models.tag import Tag
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import TopicBulkCreate, TopicCreate, TopicRead, TopicUpdate

router = APIRouter(prefix="/topics", tags=["topics"])


def _get_topic_or_404(db: Session, topic_id: int, current_user: User) -> Topic:
    topic = db.scalar(select(Topic).where(Topic.id == topic_id, Topic.user_id == current_user.id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


def _get_owned_tags(db: Session, tag_ids: list[int], current_user: User) -> list[Tag]:
    if not tag_ids:
        return []
    tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == current_user.id)))
    if len(tags) != len(set(tag_ids)):
        raise HTTPException(status_code=404, detail="One or more tags not found")
    return tags


@router.get("", response_model=list[TopicRead])
def list_topics(
    subject_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Topic]:
    stmt = select(Topic).where(Topic.user_id == current_user.id).order_by(Topic.order_index, Topic.id)
    if subject_id is not None:
        stmt = stmt.where(Topic.subject_id == subject_id)
    return list(db.scalars(stmt))


@router.post("", response_model=TopicRead, status_code=201)
def create_topic(
    payload: TopicCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Topic:
    owns_subject = db.scalar(
        select(Subject.id).where(Subject.id == payload.subject_id, Subject.user_id == current_user.id)
    )
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    topic = Topic(**payload.model_dump(exclude={"tag_ids"}), user_id=current_user.id)
    if payload.tag_ids is not None:
        topic.tags = _get_owned_tags(db, payload.tag_ids, current_user)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.post("/bulk", response_model=list[TopicRead], status_code=201)
def bulk_create_topics(
    payload: TopicBulkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Topic]:
    owns_subject = db.scalar(
        select(Subject.id).where(Subject.id == payload.subject_id, Subject.user_id == current_user.id)
    )
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")

    names = [line.strip() for line in payload.text.splitlines() if line.strip()]
    if not names:
        return []

    next_order = db.scalar(
        select(func.coalesce(func.max(Topic.order_index), -1) + 1).where(Topic.subject_id == payload.subject_id)
    )
    topics = [
        Topic(subject_id=payload.subject_id, user_id=current_user.id, name=name, order_index=next_order + i)
        for i, name in enumerate(names)
    ]
    db.add_all(topics)
    db.commit()
    for topic in topics:
        db.refresh(topic)
    return topics


@router.get("/{topic_id}", response_model=TopicRead)
def get_topic(topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Topic:
    return _get_topic_or_404(db, topic_id, current_user)


@router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Topic:
    topic = _get_topic_or_404(db, topic_id, current_user)
    updates = payload.model_dump(exclude_unset=True, exclude={"tag_ids"})

    was_done = topic.status == TopicStatus.done
    for field, value in updates.items():
        setattr(topic, field, value)

    if payload.tag_ids is not None:
        topic.tags = _get_owned_tags(db, payload.tag_ids, current_user)

    if "status" in updates:
        if topic.status == TopicStatus.done and not was_done:
            topic.completed_at = datetime.now(timezone.utc)
            if topic.review_schedule is None:
                db.add(
                    ReviewSchedule(
                        topic_id=topic.id,
                        user_id=current_user.id,
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
def delete_topic(
    topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    topic = _get_topic_or_404(db, topic_id, current_user)
    db.delete(topic)
    db.commit()
