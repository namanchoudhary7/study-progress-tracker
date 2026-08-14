from datetime import datetime, timedelta, timezone

import jwt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.cookies import CSRF_COOKIE, REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import AuthResponse, EmailVerifyRequest, UserCreate, UserLogin
from app.services.email import send_verification_email
from app.services.username import generate_unique_username

router = APIRouter(prefix="/auth", tags=["auth"])

_RESEND_COOLDOWN = timedelta(seconds=60)
_last_verification_sent: dict[int, datetime] = {}

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _auth_response(user: User, csrf_token: str) -> AuthResponse:
    return AuthResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        created_at=user.created_at,
        email_verified=user.email_verified,
        has_password=user.has_password,
        share_token=user.share_token,
        csrf_token=csrf_token,
    )


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(payload: UserCreate, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_email(user.id, user.email)

    csrf_token = set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return _auth_response(user, csrf_token)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(
        select(User).where(or_(User.email == payload.identifier, User.username == payload.identifier))
    )
    if user is None or user.hashed_password is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    csrf_token = set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return _auth_response(user, csrf_token)


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    clear_auth_cookies(response)


@router.post("/refresh", response_model=AuthResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.scalar(select(User).where(User.id == int(payload["sub"])))
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    csrf_token = set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return _auth_response(user, csrf_token)


@router.get("/me", response_model=AuthResponse)
def me(request: Request, current_user: User = Depends(get_current_user)) -> AuthResponse:
    csrf_token = request.cookies.get(CSRF_COOKIE, "")
    return _auth_response(current_user, csrf_token)


@router.post("/verify-email", status_code=204)
def verify_email(payload: EmailVerifyRequest, db: Session = Depends(get_db)) -> None:
    try:
        decoded = decode_token(payload.token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    if decoded.get("type") != "email_verify":
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user = db.scalar(select(User).where(User.id == int(decoded["sub"])))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user.email_verified = True
    db.commit()


@router.post("/resend-verification", status_code=204)
def resend_verification(current_user: User = Depends(get_current_user)) -> None:
    if current_user.email_verified:
        return

    last_sent = _last_verification_sent.get(current_user.id)
    now = datetime.now(timezone.utc)
    if last_sent is not None and now - last_sent < _RESEND_COOLDOWN:
        raise HTTPException(status_code=429, detail="Please wait a bit before requesting another email")

    _last_verification_sent[current_user.id] = now
    send_verification_email(current_user.id, current_user.email)


@router.get("/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, settings.google_redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or await oauth.google.parse_id_token(request, token)
    google_id = userinfo["sub"]
    email = userinfo["email"]

    user = db.scalar(select(User).where(User.google_id == google_id))
    if user is None:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            user.google_id = google_id
        else:
            username = generate_unique_username(db, email.split("@")[0])
            user = User(email=email, username=username, google_id=google_id, display_name=userinfo.get("name"))
            db.add(user)
    # Google has already verified ownership of this email address.
    user.email_verified = True
    db.commit()
    db.refresh(user)

    redirect = RedirectResponse(url=settings.frontend_url)
    set_auth_cookies(redirect, create_access_token(user.id), create_refresh_token(user.id))
    return redirect
