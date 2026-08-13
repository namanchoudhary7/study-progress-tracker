from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import GoalStatus
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_goal_or_404(db: Session, goal_id: int) -> Goal:
    goal = db.get(Goal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.get("", response_model=list[GoalRead])
def list_goals(
    status: GoalStatus | None = None,
    overdue: bool | None = None,
    db: Session = Depends(get_db),
) -> list[Goal]:
    stmt = select(Goal).order_by(Goal.target_date)
    if status is not None:
        stmt = stmt.where(Goal.status == status)
    if overdue:
        stmt = stmt.where(Goal.status == GoalStatus.open, Goal.target_date < date.today())
    return list(db.scalars(stmt))


@router.post("", response_model=GoalRead, status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)) -> Goal:
    goal = Goal(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(goal_id: int, db: Session = Depends(get_db)) -> Goal:
    return _get_goal_or_404(db, goal_id)


@router.patch("/{goal_id}", response_model=GoalRead)
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db)) -> Goal:
    goal = _get_goal_or_404(db, goal_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(goal, field, value)

    if "status" in updates:
        goal.completed_at = datetime.now(timezone.utc) if goal.status == GoalStatus.completed else None

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db)) -> None:
    goal = _get_goal_or_404(db, goal_id)
    db.delete(goal)
    db.commit()
