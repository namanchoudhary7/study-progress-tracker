from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.goal import Goal
from app.models.review import ReviewLog, ReviewSchedule
from app.models.study_session import StudySession
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.export import ExportData

router = APIRouter(tags=["export"])


@router.get("/export", response_model=ExportData)
def export_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ExportData:
    return ExportData(
        subjects=list(db.scalars(select(Subject).where(Subject.user_id == current_user.id))),
        topics=list(db.scalars(select(Topic).where(Topic.user_id == current_user.id))),
        study_sessions=list(db.scalars(select(StudySession).where(StudySession.user_id == current_user.id))),
        goals=list(db.scalars(select(Goal).where(Goal.user_id == current_user.id))),
        review_schedules=list(db.scalars(select(ReviewSchedule).where(ReviewSchedule.user_id == current_user.id))),
        review_logs=list(db.scalars(select(ReviewLog).where(ReviewLog.user_id == current_user.id))),
    )
