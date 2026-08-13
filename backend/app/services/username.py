import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User

_SANITIZE_RE = re.compile(r"[^a-z0-9_]")


def generate_unique_username(db: Session, seed: str) -> str:
    """Derives a unique username from a seed (e.g. an email's local part).

    Used when no username is supplied by the caller, such as Google OAuth
    signups where Google never provides one.
    """
    base = _SANITIZE_RE.sub("", seed.lower()) or "user"
    base = base[:24]

    candidate = base
    suffix = 1
    while db.scalar(select(User.id).where(User.username == candidate)) is not None:
        suffix += 1
        candidate = f"{base}{suffix}"
    return candidate
