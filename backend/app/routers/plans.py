from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.recurring_plan import RecurringPlan
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.recurring_plan import RecurringPlanCreate, RecurringPlanRead, RecurringPlanUpdate, TodayPlanItem

router = APIRouter(prefix="/plans", tags=["plans"])


def _get_plan_or_404(db: Session, plan_id: int, current_user: User) -> RecurringPlan:
    plan = db.scalar(select(RecurringPlan).where(RecurringPlan.id == plan_id, RecurringPlan.user_id == current_user.id))
    if plan is None:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    return plan


@router.get("", response_model=list[RecurringPlanRead])
def list_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[RecurringPlan]:
    return list(db.scalars(select(RecurringPlan).where(RecurringPlan.user_id == current_user.id)))


@router.get("/today", response_model=list[TodayPlanItem])
def list_today_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[TodayPlanItem]:
    today_bit = 1 << date.today().weekday()
    rows = db.execute(
        select(RecurringPlan, Subject, Topic)
        .join(Subject, Subject.id == RecurringPlan.subject_id)
        .outerjoin(Topic, Topic.id == RecurringPlan.topic_id)
        .where(RecurringPlan.user_id == current_user.id, RecurringPlan.days_of_week.op("&")(today_bit) != 0)
    ).all()

    return [
        TodayPlanItem(
            id=plan.id,
            subject_id=subject.id,
            subject_name=subject.name,
            topic_id=topic.id if topic else None,
            topic_name=topic.name if topic else None,
        )
        for plan, subject, topic in rows
    ]


@router.post("", response_model=RecurringPlanRead, status_code=201)
def create_plan(
    payload: RecurringPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> RecurringPlan:
    owns_subject = db.scalar(select(Subject.id).where(Subject.id == payload.subject_id, Subject.user_id == current_user.id))
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    if payload.topic_id is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == payload.topic_id, Topic.user_id == current_user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    plan = RecurringPlan(**payload.model_dump(), user_id=current_user.id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/{plan_id}", response_model=RecurringPlanRead)
def update_plan(
    plan_id: int,
    payload: RecurringPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecurringPlan:
    plan = _get_plan_or_404(db, plan_id, current_user)
    updates = payload.model_dump(exclude_unset=True)

    if "topic_id" in updates and updates["topic_id"] is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == updates["topic_id"], Topic.user_id == current_user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    for field, value in updates.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    plan = _get_plan_or_404(db, plan_id, current_user)
    db.delete(plan)
    db.commit()
