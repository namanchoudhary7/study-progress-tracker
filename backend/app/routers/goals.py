from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import GoalStatus
from app.models.goal import Goal
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_goal_or_404(db: Session, goal_id: int, current_user: User) -> Goal:
    goal = db.scalar(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id))
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.get("", response_model=list[GoalRead])
def list_goals(
    status: GoalStatus | None = None,
    overdue: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Goal]:
    stmt = select(Goal).where(Goal.user_id == current_user.id).order_by(Goal.target_date)
    if status is not None:
        stmt = stmt.where(Goal.status == status)
    if overdue:
        stmt = stmt.where(Goal.status == GoalStatus.open, Goal.target_date < date.today())
    return list(db.scalars(stmt))


@router.post("", response_model=GoalRead, status_code=201)
def create_goal(
    payload: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Goal:
    if payload.subject_id is not None:
        owns = db.scalar(select(Subject.id).where(Subject.id == payload.subject_id, Subject.user_id == current_user.id))
        if owns is None:
            raise HTTPException(status_code=404, detail="Subject not found")
    if payload.topic_id is not None:
        owns = db.scalar(select(Topic.id).where(Topic.id == payload.topic_id, Topic.user_id == current_user.id))
        if owns is None:
            raise HTTPException(status_code=404, detail="Topic not found")

    goal = Goal(**payload.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Goal:
    return _get_goal_or_404(db, goal_id, current_user)


@router.patch("/{goal_id}", response_model=GoalRead)
def update_goal(
    goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Goal:
    goal = _get_goal_or_404(db, goal_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(goal, field, value)

    if "status" in updates:
        goal.completed_at = datetime.now(timezone.utc) if goal.status == GoalStatus.completed else None

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    goal = _get_goal_or_404(db, goal_id, current_user)
    db.delete(goal)
    db.commit()
