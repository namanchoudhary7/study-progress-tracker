from datetime import date

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.stats import CompletionItem, HeatmapCell, OverdueSummary, OverviewStats, StreakStats, TimeSpentPoint
from app.services import stats as stats_service


def get_overview(db: Session, user: User) -> OverviewStats:
    return stats_service.get_overview(db, user.id)


def get_completion(db: Session, user: User) -> list[CompletionItem]:
    return stats_service.get_completion(db, user.id)


def get_time_spent(
    db: Session, user: User, date_from: date | None = None, date_to: date | None = None, group_by: str = "day"
) -> list[TimeSpentPoint]:
    return stats_service.get_time_spent(db, user.id, date_from, date_to, group_by)


def get_streaks(db: Session, user: User) -> StreakStats:
    return stats_service.get_streaks(db, user.id)


def get_overdue(db: Session, user: User) -> OverdueSummary:
    return stats_service.get_overdue(db, user.id)


def get_heatmap_year(db: Session, user: User, year: int) -> list[HeatmapCell]:
    return stats_service.get_heatmap_year(db, user.id, year)
