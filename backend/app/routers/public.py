from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.public import PublicProfile
from app.services import badges as badges_service
from app.services import stats as stats_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/{share_token}", response_model=PublicProfile)
def get_public_profile(share_token: str, db: Session = Depends(get_db)) -> PublicProfile:
    user = db.scalar(select(User).where(User.share_token == share_token))
    if user is None:
        raise HTTPException(status_code=404, detail="Share link not found")

    return PublicProfile(
        username=user.username,
        display_name=user.display_name,
        overview=stats_service.get_overview(db, user.id),
        streaks=stats_service.get_streaks(db, user.id),
        badges=badges_service.get_badges(db, user.id),
    )
