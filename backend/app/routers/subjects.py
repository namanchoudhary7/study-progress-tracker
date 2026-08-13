from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])


def _get_subject_or_404(db: Session, subject_id: int, current_user: User) -> Subject:
    subject = db.scalar(select(Subject).where(Subject.id == subject_id, Subject.user_id == current_user.id))
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.get("", response_model=list[SubjectRead])
def list_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Subject]:
    return list(db.scalars(select(Subject).where(Subject.user_id == current_user.id).order_by(Subject.name)))


@router.post("", response_model=SubjectRead, status_code=201)
def create_subject(
    payload: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Subject:
    subject = Subject(**payload.model_dump(), user_id=current_user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Subject:
    return _get_subject_or_404(db, subject_id, current_user)


@router.patch("/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Subject:
    subject = _get_subject_or_404(db, subject_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    subject = _get_subject_or_404(db, subject_id, current_user)
    db.delete(subject)
    db.commit()
