from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import flashcards as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.flashcard import Flashcard
from app.models.user import User
from app.schemas.flashcard import FlashcardCreate, FlashcardRead, FlashcardUpdate

router = APIRouter(tags=["flashcards"])


@router.get("/topics/{topic_id}/flashcards", response_model=list[FlashcardRead])
def list_flashcards(
    topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Flashcard]:
    return tools.list_flashcards(db, current_user, topic_id)


@router.post("/topics/{topic_id}/flashcards", response_model=FlashcardRead, status_code=201)
def create_flashcard(
    topic_id: int,
    payload: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Flashcard:
    return tools.create_flashcard(db, current_user, topic_id, **payload.model_dump())


@router.patch("/flashcards/{flashcard_id}", response_model=FlashcardRead)
def update_flashcard(
    flashcard_id: int,
    payload: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Flashcard:
    return tools.update_flashcard(db, current_user, flashcard_id, **payload.model_dump(exclude_unset=True))


@router.delete("/flashcards/{flashcard_id}", status_code=204)
def delete_flashcard(
    flashcard_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    tools.delete_flashcard(db, current_user, flashcard_id)
