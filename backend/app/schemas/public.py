from pydantic import BaseModel

from app.schemas.stats import BadgeRead, OverviewStats, StreakStats


class PublicProfile(BaseModel):
    username: str
    display_name: str | None
    overview: OverviewStats
    streaks: StreakStats
    badges: list[BadgeRead]
