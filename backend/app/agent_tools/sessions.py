from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.study_session import StudySession
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User


def _get_session_or_404(db: Session, session_id: int, user: User) -> StudySession:
    session = db.scalar(select(StudySession).where(StudySession.id == session_id, StudySession.user_id == user.id))
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found")
    return session


def _assert_owns_subject_and_topic(db: Session, user: User, subject_id: int, topic_id: int | None) -> None:
    owns_subject = db.scalar(select(Subject.id).where(Subject.id == subject_id, Subject.user_id == user.id))
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    if topic_id is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == topic_id, Topic.user_id == user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")


def list_sessions(
    db: Session,
    user: User,
    subject_id: int | None = None,
    topic_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[StudySession]:
    stmt = (
        select(StudySession)
        .where(StudySession.user_id == user.id)
        .order_by(StudySession.session_date.desc(), StudySession.id.desc())
    )
    if subject_id is not None:
        stmt = stmt.where(StudySession.subject_id == subject_id)
    if topic_id is not None:
        stmt = stmt.where(StudySession.topic_id == topic_id)
    if date_from is not None:
        stmt = stmt.where(StudySession.session_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(StudySession.session_date <= date_to)
    return list(db.scalars(stmt))


def get_session(db: Session, user: User, session_id: int) -> StudySession:
    return _get_session_or_404(db, session_id, user)


def create_session(
    db: Session,
    user: User,
    subject_id: int,
    session_date: date,
    duration_minutes: int,
    topic_id: int | None = None,
    notes: str | None = None,
) -> StudySession:
    _assert_owns_subject_and_topic(db, user, subject_id, topic_id)
    session = StudySession(
        subject_id=subject_id,
        topic_id=topic_id,
        session_date=session_date,
        duration_minutes=duration_minutes,
        notes=notes,
        user_id=user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_session(db: Session, user: User, session_id: int, **updates) -> StudySession:
    """`updates` should only contain keys the caller actually wants to change."""
    session = _get_session_or_404(db, session_id, user)
    if "topic_id" in updates and updates["topic_id"] is not None:
        _assert_owns_subject_and_topic(db, user, session.subject_id, updates["topic_id"])
    for field, value in updates.items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, user: User, session_id: int) -> None:
    session = _get_session_or_404(db, session_id, user)
    db.delete(session)
    db.commit()
