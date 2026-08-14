from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.agent_tools.subjects import _get_subject_or_404
from app.models.enums import TopicStatus
from app.models.review import ReviewSchedule
from app.models.tag import Tag
from app.models.topic import Topic
from app.models.user import User


def _get_topic_or_404(db: Session, topic_id: int, user: User) -> Topic:
    topic = db.scalar(select(Topic).where(Topic.id == topic_id, Topic.user_id == user.id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


def _get_owned_tags(db: Session, tag_ids: list[int], user: User) -> list[Tag]:
    if not tag_ids:
        return []
    tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == user.id)))
    if len(tags) != len(set(tag_ids)):
        raise HTTPException(status_code=404, detail="One or more tags not found")
    return tags


def _validate_parent(
    db: Session, parent_topic_id: int, subject_id: int, user: User, exclude_topic_id: int | None = None
) -> None:
    parent = db.scalar(select(Topic).where(Topic.id == parent_topic_id, Topic.user_id == user.id))
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if parent.subject_id != subject_id:
        raise HTTPException(status_code=400, detail="Parent topic must belong to the same subject")
    if exclude_topic_id is not None:
        cursor = parent
        while cursor is not None:
            if cursor.id == exclude_topic_id:
                raise HTTPException(status_code=400, detail="A topic cannot be nested under itself or its own descendant")
            cursor = cursor.parent


def list_topics(db: Session, user: User, subject_id: int | None = None) -> list[Topic]:
    stmt = select(Topic).where(Topic.user_id == user.id).order_by(Topic.order_index, Topic.id)
    if subject_id is not None:
        stmt = stmt.where(Topic.subject_id == subject_id)
    return list(db.scalars(stmt))


def get_topic(db: Session, user: User, topic_id: int) -> Topic:
    return _get_topic_or_404(db, topic_id, user)


def create_topic(
    db: Session,
    user: User,
    subject_id: int,
    name: str,
    description: str | None = None,
    order_index: int | None = None,
    notes: str | None = None,
    target_date: date | None = None,
    tag_ids: list[int] | None = None,
    parent_topic_id: int | None = None,
) -> Topic:
    _get_subject_or_404(db, subject_id, user)
    if parent_topic_id is not None:
        _validate_parent(db, parent_topic_id, subject_id, user)
    topic = Topic(
        subject_id=subject_id,
        user_id=user.id,
        name=name,
        description=description,
        order_index=order_index,
        notes=notes,
        target_date=target_date,
        parent_topic_id=parent_topic_id,
    )
    if tag_ids is not None:
        topic.tags = _get_owned_tags(db, tag_ids, user)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


def bulk_create_topics(db: Session, user: User, subject_id: int, text: str) -> list[Topic]:
    _get_subject_or_404(db, subject_id, user)

    names = [line.strip() for line in text.splitlines() if line.strip()]
    if not names:
        return []

    next_order = db.scalar(
        select(func.coalesce(func.max(Topic.order_index), -1) + 1).where(Topic.subject_id == subject_id)
    )
    topics = [
        Topic(subject_id=subject_id, user_id=user.id, name=name, order_index=next_order + i)
        for i, name in enumerate(names)
    ]
    db.add_all(topics)
    db.commit()
    for topic in topics:
        db.refresh(topic)
    return topics


def update_topic(db: Session, user: User, topic_id: int, **updates) -> Topic:
    """`updates` should only contain keys the caller actually wants to change."""
    topic = _get_topic_or_404(db, topic_id, user)
    tag_ids = updates.pop("tag_ids", None)

    if "parent_topic_id" in updates and updates["parent_topic_id"] is not None:
        _validate_parent(db, updates["parent_topic_id"], topic.subject_id, user, exclude_topic_id=topic.id)

    if "status" in updates:
        updates["status"] = TopicStatus(updates["status"])

    was_done = topic.status == TopicStatus.done
    for field, value in updates.items():
        setattr(topic, field, value)

    if tag_ids is not None:
        topic.tags = _get_owned_tags(db, tag_ids, user)

    if "status" in updates:
        if topic.status == TopicStatus.done and not was_done:
            topic.completed_at = datetime.now(timezone.utc)
            if topic.review_schedule is None:
                initial_interval = topic.subject.sr_initial_interval_days or 1
                db.add(
                    ReviewSchedule(
                        topic_id=topic.id,
                        user_id=user.id,
                        interval_days=initial_interval,
                        next_review_date=(datetime.now(timezone.utc) + timedelta(days=initial_interval)).date(),
                    )
                )
        elif topic.status != TopicStatus.done:
            topic.completed_at = None

    db.commit()
    db.refresh(topic)
    return topic


def delete_topic(db: Session, user: User, topic_id: int) -> None:
    topic = _get_topic_or_404(db, topic_id, user)
    db.delete(topic)
    db.commit()
