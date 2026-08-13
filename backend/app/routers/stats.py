from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.stats import CompletionItem, OverdueSummary, OverviewStats, StreakStats, TimeSpentPoint
from app.services import stats as stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db)) -> OverviewStats:
    return stats_service.get_overview(db)


@router.get("/completion", response_model=list[CompletionItem])
def completion(db: Session = Depends(get_db)) -> list[CompletionItem]:
    return stats_service.get_completion(db)


@router.get("/time-spent", response_model=list[TimeSpentPoint])
def time_spent(
    date_from: date | None = None,
    date_to: date | None = None,
    group_by: Literal["day", "week", "subject"] = "day",
    db: Session = Depends(get_db),
) -> list[TimeSpentPoint]:
    return stats_service.get_time_spent(db, date_from, date_to, group_by)


@router.get("/streaks", response_model=StreakStats)
def streaks(db: Session = Depends(get_db)) -> StreakStats:
    return stats_service.get_streaks(db)


@router.get("/overdue", response_model=OverdueSummary)
def overdue(db: Session = Depends(get_db)) -> OverdueSummary:
    return stats_service.get_overdue(db)
