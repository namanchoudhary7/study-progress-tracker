from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.models.user import User


def _get_subject_or_404(db: Session, subject_id: int, user: User) -> Subject:
    subject = db.scalar(select(Subject).where(Subject.id == subject_id, Subject.user_id == user.id))
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


def list_subjects(db: Session, user: User) -> list[Subject]:
    return list(db.scalars(select(Subject).where(Subject.user_id == user.id).order_by(Subject.name)))


def get_subject(db: Session, user: User, subject_id: int) -> Subject:
    return _get_subject_or_404(db, subject_id, user)


def create_subject(
    db: Session,
    user: User,
    name: str,
    description: str | None = None,
    color: str | None = None,
    target_date: date | None = None,
) -> Subject:
    subject = Subject(name=name, description=description, color=color, target_date=target_date, user_id=user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update_subject(db: Session, user: User, subject_id: int, **updates) -> Subject:
    """`updates` should only contain keys the caller actually wants to change (values may be None)."""
    subject = _get_subject_or_404(db, subject_id, user)
    for field, value in updates.items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, user: User, subject_id: int) -> None:
    subject = _get_subject_or_404(db, subject_id, user)
    db.delete(subject)
    db.commit()
