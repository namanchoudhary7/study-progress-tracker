from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.enums import DigestFrequency
from app.models.user import User
from app.services.email import send_digest_email
from app.services.stats import get_digest_stats

router = APIRouter(prefix="/internal", tags=["internal"])

PAGE_SIZE = 200
PERIOD_DAYS = {DigestFrequency.weekly: 7, DigestFrequency.monthly: 30}


def _check_secret(x_internal_secret: str | None) -> None:
    if not settings.internal_api_secret or x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=403, detail="Invalid internal secret")


def _is_due(user: User, now: datetime) -> bool:
    if user.last_digest_sent_at is None:
        return True
    days = PERIOD_DAYS[user.digest_frequency]
    return now - user.last_digest_sent_at >= timedelta(days=days)


@router.post("/send-digests")
def send_digests(x_internal_secret: str | None = Header(default=None)) -> dict[str, int]:
    _check_secret(x_internal_secret)

    now = datetime.now(timezone.utc)
    today = date.today()
    sent = 0
    db: Session = SessionLocal()
    try:
        last_id = 0
        while True:
            users = list(
                db.scalars(
                    select(User)
                    .where(User.id > last_id, User.digest_frequency != DigestFrequency.off)
                    .order_by(User.id)
                    .limit(PAGE_SIZE)
                )
            )
            if not users:
                break
            last_id = users[-1].id

            for user in users:
                if not _is_due(user, now):
                    continue
                since = today - timedelta(days=PERIOD_DAYS[user.digest_frequency])
                metrics = get_digest_stats(db, user.id, since)
                send_digest_email(
                    user.email,
                    user.digest_frequency.value,
                    metrics["topics_done"],
                    metrics["total_minutes"],
                    metrics["current_streak"],
                )
                user.last_digest_sent_at = now
                sent += 1
            db.commit()
    finally:
        db.close()

    return {"sent": sent}
