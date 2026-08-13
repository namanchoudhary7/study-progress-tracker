from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.study_session import StudySession
from app.schemas.study_session import StudySessionCreate, StudySessionRead, StudySessionUpdate

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_session_or_404(db: Session, session_id: int) -> StudySession:
    session = db.get(StudySession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found")
    return session


@router.get("", response_model=list[StudySessionRead])
def list_sessions(
    subject_id: int | None = None,
    topic_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
) -> list[StudySession]:
    stmt = select(StudySession).order_by(StudySession.session_date.desc(), StudySession.id.desc())
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
def create_session(payload: StudySessionCreate, db: Session = Depends(get_db)) -> StudySession:
    session = StudySession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=StudySessionRead)
def get_session(session_id: int, db: Session = Depends(get_db)) -> StudySession:
    return _get_session_or_404(db, session_id)


@router.patch("/{session_id}", response_model=StudySessionRead)
def update_session(session_id: int, payload: StudySessionUpdate, db: Session = Depends(get_db)) -> StudySession:
    session = _get_session_or_404(db, session_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)) -> None:
    session = _get_session_or_404(db, session_id)
    db.delete(session)
    db.commit()
