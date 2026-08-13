from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stats import CompletionItem, HeatmapCell, OverdueSummary, OverviewStats, StreakStats, TimeSpentPoint
from app.services import stats as stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> OverviewStats:
    return stats_service.get_overview(db, current_user.id)


@router.get("/completion", response_model=list[CompletionItem])
def completion(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[CompletionItem]:
    return stats_service.get_completion(db, current_user.id)


@router.get("/time-spent", response_model=list[TimeSpentPoint])
def time_spent(
    date_from: date | None = None,
    date_to: date | None = None,
    group_by: Literal["day", "week", "subject"] = "day",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TimeSpentPoint]:
    return stats_service.get_time_spent(db, current_user.id, date_from, date_to, group_by)


@router.get("/streaks", response_model=StreakStats)
def streaks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> StreakStats:
    return stats_service.get_streaks(db, current_user.id)


@router.get("/overdue", response_model=OverdueSummary)
def overdue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> OverdueSummary:
    return stats_service.get_overdue(db, current_user.id)


@router.get("/heatmap", response_model=list[HeatmapCell])
def heatmap(
    year: int | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[HeatmapCell]:
    return stats_service.get_heatmap_year(db, current_user.id, year or date.today().year)


@router.get("/heatmap/years", response_model=list[int])
def heatmap_years(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[int]:
    return stats_service.get_available_years(db, current_user.id)
