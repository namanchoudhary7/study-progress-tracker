from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import reviews as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.review import ReviewSchedule
from app.models.user import User
from app.schemas.review import (
    DueReviewItem,
    ReviewCompleteRequest,
    ReviewScheduleRead,
    TopicReviewDetail,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/due", response_model=list[DueReviewItem])
def list_due_reviews(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[DueReviewItem]:
    return tools.list_due_reviews(db, current_user)


@router.get("/{topic_id}", response_model=TopicReviewDetail)
def get_topic_review(
    topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> TopicReviewDetail:
    return tools.get_topic_review(db, current_user, topic_id)


@router.post("/{topic_id}/complete", response_model=ReviewScheduleRead)
def complete_review(
    topic_id: int,
    payload: ReviewCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewSchedule:
    return tools.complete_review(db, current_user, topic_id, payload.outcome)
