from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.models.topic import Topic
from app.models.user import User


def _get_owned_topic(db: Session, topic_id: int, user: User) -> Topic:
    topic = db.scalar(select(Topic).where(Topic.id == topic_id, Topic.user_id == user.id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


def _get_flashcard_or_404(db: Session, flashcard_id: int, user: User) -> Flashcard:
    flashcard = db.scalar(select(Flashcard).where(Flashcard.id == flashcard_id, Flashcard.user_id == user.id))
    if flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return flashcard


def list_flashcards(db: Session, user: User, topic_id: int) -> list[Flashcard]:
    _get_owned_topic(db, topic_id, user)
    return list(db.scalars(select(Flashcard).where(Flashcard.topic_id == topic_id).order_by(Flashcard.created_at)))


def create_flashcard(db: Session, user: User, topic_id: int, question: str, answer: str) -> Flashcard:
    _get_owned_topic(db, topic_id, user)
    flashcard = Flashcard(topic_id=topic_id, user_id=user.id, question=question, answer=answer)
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard


def create_flashcards(db: Session, user: User, topic_id: int, cards: list[dict]) -> list[Flashcard]:
    """Bulk-create flashcards, e.g. a batch of AI-generated practice questions for a topic."""
    _get_owned_topic(db, topic_id, user)
    flashcards = [
        Flashcard(topic_id=topic_id, user_id=user.id, question=c["question"], answer=c["answer"]) for c in cards
    ]
    db.add_all(flashcards)
    db.commit()
    for flashcard in flashcards:
        db.refresh(flashcard)
    return flashcards


def update_flashcard(db: Session, user: User, flashcard_id: int, **updates) -> Flashcard:
    """`updates` should only contain keys the caller actually wants to change."""
    flashcard = _get_flashcard_or_404(db, flashcard_id, user)
    for field, value in updates.items():
        setattr(flashcard, field, value)
    db.commit()
    db.refresh(flashcard)
    return flashcard


def delete_flashcard(db: Session, user: User, flashcard_id: int) -> None:
    flashcard = _get_flashcard_or_404(db, flashcard_id, user)
    db.delete(flashcard)
    db.commit()
