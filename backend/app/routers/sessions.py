from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.study_session import StudySession
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.study_session import StudySessionCreate, StudySessionRead, StudySessionUpdate

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_session_or_404(db: Session, session_id: int, current_user: User) -> StudySession:
    session = db.scalar(
        select(StudySession).where(StudySession.id == session_id, StudySession.user_id == current_user.id)
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found")
    return session


def _assert_owns_subject_and_topic(db: Session, current_user: User, subject_id: int, topic_id: int | None) -> None:
    owns_subject = db.scalar(
        select(Subject.id).where(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    if topic_id is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == topic_id, Topic.user_id == current_user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")


@router.get("", response_model=list[StudySessionRead])
def list_sessions(
    subject_id: int | None = None,
    topic_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StudySession]:
    stmt = (
        select(StudySession)
        .where(StudySession.user_id == current_user.id)
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


@router.post("", response_model=StudySessionRead, status_code=201)
def create_session(
    payload: StudySessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StudySession:
    _assert_owns_subject_and_topic(db, current_user, payload.subject_id, payload.topic_id)
    session = StudySession(**payload.model_dump(), user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=StudySessionRead)
def get_session(
    session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StudySession:
    return _get_session_or_404(db, session_id, current_user)


@router.patch("/{session_id}", response_model=StudySessionRead)
def update_session(
    session_id: int,
    payload: StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudySession:
    session = _get_session_or_404(db, session_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    if "topic_id" in updates and updates["topic_id"] is not None:
        _assert_owns_subject_and_topic(db, current_user, session.subject_id, updates["topic_id"])
    for field, value in updates.items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    session = _get_session_or_404(db, session_id, current_user)
    db.delete(session)
    db.commit()
