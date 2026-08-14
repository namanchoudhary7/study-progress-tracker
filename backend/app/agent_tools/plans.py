from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recurring_plan import RecurringPlan
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.recurring_plan import TodayPlanItem


def _get_plan_or_404(db: Session, plan_id: int, user: User) -> RecurringPlan:
    plan = db.scalar(select(RecurringPlan).where(RecurringPlan.id == plan_id, RecurringPlan.user_id == user.id))
    if plan is None:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    return plan


def list_plans(db: Session, user: User) -> list[RecurringPlan]:
    return list(db.scalars(select(RecurringPlan).where(RecurringPlan.user_id == user.id)))


def list_today_plans(db: Session, user: User) -> list[TodayPlanItem]:
    today_bit = 1 << date.today().weekday()
    rows = db.execute(
        select(RecurringPlan, Subject, Topic)
        .join(Subject, Subject.id == RecurringPlan.subject_id)
        .outerjoin(Topic, Topic.id == RecurringPlan.topic_id)
        .where(RecurringPlan.user_id == user.id, RecurringPlan.days_of_week.op("&")(today_bit) != 0)
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


def create_plan(
    db: Session, user: User, subject_id: int, days_of_week: int, topic_id: int | None = None
) -> RecurringPlan:
    owns_subject = db.scalar(select(Subject.id).where(Subject.id == subject_id, Subject.user_id == user.id))
    if owns_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    if topic_id is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == topic_id, Topic.user_id == user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    plan = RecurringPlan(subject_id=subject_id, topic_id=topic_id, days_of_week=days_of_week, user_id=user.id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update_plan(db: Session, user: User, plan_id: int, **updates) -> RecurringPlan:
    """`updates` should only contain keys the caller actually wants to change."""
    plan = _get_plan_or_404(db, plan_id, user)

    if "topic_id" in updates and updates["topic_id"] is not None:
        owns_topic = db.scalar(select(Topic.id).where(Topic.id == updates["topic_id"], Topic.user_id == user.id))
        if owns_topic is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    for field, value in updates.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


def delete_plan(db: Session, user: User, plan_id: int) -> None:
    plan = _get_plan_or_404(db, plan_id, user)
    db.delete(plan)
    db.commit()
