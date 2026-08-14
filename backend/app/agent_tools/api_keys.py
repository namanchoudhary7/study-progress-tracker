import secrets
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.api_key import ApiKey
from app.models.user import User

KEY_PREFIX = "spt_"


def list_api_keys(db: Session, user: User) -> list[ApiKey]:
    return list(db.scalars(select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())))


def create_api_key(db: Session, user: User, name: str) -> tuple[ApiKey, str]:
    secret = KEY_PREFIX + secrets.token_urlsafe(32)
    api_key = ApiKey(
        user_id=user.id,
        name=name,
        key_prefix=secret[: len(KEY_PREFIX) + 6],
        key_hash=hash_password(secret),
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, secret


def delete_api_key(db: Session, user: User, api_key_id: int) -> None:
    api_key = db.scalar(select(ApiKey).where(ApiKey.id == api_key_id, ApiKey.user_id == user.id))
    if api_key is None:
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(api_key)
    db.commit()


def resolve_user_id_from_key(db: Session, secret: str) -> int | None:
    """Look up the user id a bearer secret belongs to, without returning a User bound to this
    session (the caller may commit/close before using it). We narrow by the stored prefix first,
    then verify the hash, since bcrypt comparisons are relatively expensive."""
    prefix = secret[: len(KEY_PREFIX) + 6]
    candidates = list(db.scalars(select(ApiKey).where(ApiKey.key_prefix == prefix)))
    for candidate in candidates:
        if verify_password(secret, candidate.key_hash):
            candidate.last_used_at = datetime.now(timezone.utc)
            db.commit()
            return candidate.user_id
    return None
