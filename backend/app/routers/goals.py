from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import goals as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import GoalStatus
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalRead])
def list_goals(
    status: GoalStatus | None = None,
    overdue: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Goal]:
    return tools.list_goals(db, current_user, status=status, overdue=overdue)


@router.post("", response_model=GoalRead, status_code=201)
def create_goal(
    payload: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Goal:
    return tools.create_goal(db, current_user, **payload.model_dump())


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Goal:
    return tools.get_goal(db, current_user, goal_id)


@router.patch("/{goal_id}", response_model=GoalRead)
def update_goal(
    goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Goal:
    return tools.update_goal(db, current_user, goal_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    tools.delete_goal(db, current_user, goal_id)
