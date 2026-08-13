import jwt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.post("/signup", response_model=UserRead, status_code=201)
def signup(payload: UserCreate, response: Response, db: Session = Depends(get_db)) -> User:
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return user


@router.post("/login", response_model=UserRead)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or user.hashed_password is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return user


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    clear_auth_cookies(response)


@router.post("/refresh", response_model=UserRead)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> User:
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

    set_auth_cookies(response, create_access_token(user.id), create_refresh_token(user.id))
    return user


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


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
            user = User(email=email, google_id=google_id, display_name=userinfo.get("name"))
            db.add(user)
    db.commit()
    db.refresh(user)

    redirect = RedirectResponse(url=settings.frontend_url)
    set_auth_cookies(redirect, create_access_token(user.id), create_refresh_token(user.id))
    return redirect
