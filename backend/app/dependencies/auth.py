import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cookies import ACCESS_COOKIE
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

_CREDENTIALS_ERROR = HTTPException(status_code=401, detail="Not authenticated")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise _CREDENTIALS_ERROR

    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise _CREDENTIALS_ERROR

    if payload.get("type") != "access":
        raise _CREDENTIALS_ERROR

    user = db.scalar(select(User).where(User.id == int(payload["sub"])))
    if user is None:
        raise _CREDENTIALS_ERROR
    return user
