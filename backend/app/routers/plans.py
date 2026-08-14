from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import plans as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.recurring_plan import RecurringPlan
from app.models.user import User
from app.schemas.recurring_plan import RecurringPlanCreate, RecurringPlanRead, RecurringPlanUpdate, TodayPlanItem

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[RecurringPlanRead])
def list_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[RecurringPlan]:
    return tools.list_plans(db, current_user)


@router.get("/today", response_model=list[TodayPlanItem])
def list_today_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[TodayPlanItem]:
    return tools.list_today_plans(db, current_user)


@router.post("", response_model=RecurringPlanRead, status_code=201)
def create_plan(
    payload: RecurringPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> RecurringPlan:
    return tools.create_plan(db, current_user, **payload.model_dump())


@router.patch("/{plan_id}", response_model=RecurringPlanRead)
def update_plan(
    plan_id: int,
    payload: RecurringPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecurringPlan:
    return tools.update_plan(db, current_user, plan_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    tools.delete_plan(db, current_user, plan_id)
