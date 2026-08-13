from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.review import ReviewLog, ReviewSchedule
from app.models.topic import Topic
from app.schemas.review import (
    DueReviewItem,
    ReviewCompleteRequest,
    ReviewLogRead,
    ReviewScheduleRead,
    TopicReviewDetail,
)
from app.services.spaced_repetition import compute_next_interval

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/due", response_model=list[DueReviewItem])
def list_due_reviews(db: Session = Depends(get_db)) -> list[DueReviewItem]:
    rows = db.execute(
        select(ReviewSchedule, Topic)
        .join(Topic, Topic.id == ReviewSchedule.topic_id)
        .where(ReviewSchedule.next_review_date <= date.today())
        .order_by(ReviewSchedule.next_review_date)
    ).all()

    return [
        DueReviewItem(
            topic_id=topic.id,
            topic_name=topic.name,
            subject_id=topic.subject_id,
            subject_name=topic.subject.name,
            next_review_date=schedule.next_review_date,
            interval_days=schedule.interval_days,
            review_count=schedule.review_count,
        )
        for schedule, topic in rows
    ]


@router.get("/{topic_id}", response_model=TopicReviewDetail)
def get_topic_review(topic_id: int, db: Session = Depends(get_db)) -> TopicReviewDetail:
    schedule = db.scalar(select(ReviewSchedule).where(ReviewSchedule.topic_id == topic_id))
    logs = list(
        db.scalars(select(ReviewLog).where(ReviewLog.topic_id == topic_id).order_by(ReviewLog.reviewed_at.desc()))
    )
    return TopicReviewDetail(
        schedule=ReviewScheduleRead.model_validate(schedule) if schedule else None,
        logs=[ReviewLogRead.model_validate(log) for log in logs],
    )


@router.post("/{topic_id}/complete", response_model=ReviewScheduleRead)
def complete_review(topic_id: int, payload: ReviewCompleteRequest, db: Session = Depends(get_db)) -> ReviewSchedule:
    schedule = db.scalar(select(ReviewSchedule).where(ReviewSchedule.topic_id == topic_id))
    if schedule is None:
        raise HTTPException(status_code=404, detail="No review schedule for this topic")

    interval_before = schedule.interval_days
    interval_after = compute_next_interval(interval_before, payload.outcome)
    now = datetime.now(timezone.utc)

    schedule.last_reviewed_at = now
    schedule.interval_days = interval_after
    schedule.next_review_date = (now + timedelta(days=interval_after)).date()
    schedule.review_count += 1

    db.add(
        ReviewLog(
            topic_id=topic_id,
            outcome=payload.outcome,
            interval_days_before=interval_before,
            interval_days_after=interval_after,
        )
    )
    db.commit()
    db.refresh(schedule)
    return schedule
