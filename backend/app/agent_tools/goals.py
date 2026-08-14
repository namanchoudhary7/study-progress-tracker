from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import GoalStatus
from app.models.goal import Goal
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User


def _get_goal_or_404(db: Session, goal_id: int, user: User) -> Goal:
    goal = db.scalar(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def list_goals(
    db: Session, user: User, status: GoalStatus | str | None = None, overdue: bool | None = None
) -> list[Goal]:
    stmt = select(Goal).where(Goal.user_id == user.id).order_by(Goal.target_date)
    if status is not None:
        stmt = stmt.where(Goal.status == GoalStatus(status))
    if overdue:
        stmt = stmt.where(Goal.status == GoalStatus.open, Goal.target_date < date.today())
    return list(db.scalars(stmt))


def get_goal(db: Session, user: User, goal_id: int) -> Goal:
    return _get_goal_or_404(db, goal_id, user)


def create_goal(
    db: Session,
    user: User,
    title: str,
    target_date: date,
    subject_id: int | None = None,
    topic_id: int | None = None,
) -> Goal:
    if (subject_id is None) == (topic_id is None):
        raise HTTPException(status_code=400, detail="Exactly one of subject_id or topic_id must be set")
    if subject_id is not None:
        owns = db.scalar(select(Subject.id).where(Subject.id == subject_id, Subject.user_id == user.id))
        if owns is None:
            raise HTTPException(status_code=404, detail="Subject not found")
    if topic_id is not None:
        owns = db.scalar(select(Topic.id).where(Topic.id == topic_id, Topic.user_id == user.id))
        if owns is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    goal = Goal(subject_id=subject_id, topic_id=topic_id, title=title, target_date=target_date, user_id=user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(db: Session, user: User, goal_id: int, **updates) -> Goal:
    """`updates` should only contain keys the caller actually wants to change."""
    goal = _get_goal_or_404(db, goal_id, user)
    if "status" in updates:
        updates["status"] = GoalStatus(updates["status"])
    for field, value in updates.items():
        setattr(goal, field, value)

    if "status" in updates:
        goal.completed_at = datetime.now(timezone.utc) if goal.status == GoalStatus.completed else None

    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, user: User, goal_id: int) -> None:
    goal = _get_goal_or_404(db, goal_id, user)
    db.delete(goal)
    db.commit()
