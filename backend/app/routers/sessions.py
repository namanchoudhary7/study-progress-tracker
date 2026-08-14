from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import sessions as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.study_session import StudySessionCreate, StudySessionRead, StudySessionUpdate

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[StudySessionRead])
def list_sessions(
    subject_id: int | None = None,
    topic_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StudySession]:
    return tools.list_sessions(
        db, current_user, subject_id=subject_id, topic_id=topic_id, date_from=date_from, date_to=date_to
    )


@router.post("", response_model=StudySessionRead, status_code=201)
def create_session(
    payload: StudySessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StudySession:
    return tools.create_session(db, current_user, **payload.model_dump())


@router.get("/{session_id}", response_model=StudySessionRead)
def get_session(
    session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StudySession:
    return tools.get_session(db, current_user, session_id)


@router.patch("/{session_id}", response_model=StudySessionRead)
def update_session(
    session_id: int,
    payload: StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudySession:
    return tools.update_session(db, current_user, session_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    tools.delete_session(db, current_user, session_id)
