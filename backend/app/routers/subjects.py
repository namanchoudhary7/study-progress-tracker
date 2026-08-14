from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import subjects as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectRead])
def list_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Subject]:
    return tools.list_subjects(db, current_user)


@router.post("", response_model=SubjectRead, status_code=201)
def create_subject(
    payload: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Subject:
    return tools.create_subject(db, current_user, **payload.model_dump())


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Subject:
    return tools.get_subject(db, current_user, subject_id)


@router.patch("/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Subject:
    return tools.update_subject(db, current_user, subject_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    tools.delete_subject(db, current_user, subject_id)
