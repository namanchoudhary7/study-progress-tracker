import secrets

from fastapi import Response

from app.core.config import settings

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
CSRF_COOKIE = "csrf_token"


def _base_kwargs(path: str) -> dict:
    if settings.is_production:
        return {"httponly": True, "secure": True, "samesite": "none", "path": path}
    return {"httponly": True, "secure": False, "samesite": "lax", "path": path}


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(ACCESS_COOKIE, access_token, max_age=settings.access_token_expire_minutes * 60, **_base_kwargs("/"))
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        **_base_kwargs("/api/v1/auth/refresh"),
    )
    csrf_kwargs = _base_kwargs("/")
    csrf_kwargs["httponly"] = False
    response.set_cookie(CSRF_COOKIE, secrets.token_urlsafe(32), max_age=settings.refresh_token_expire_days * 24 * 60 * 60, **csrf_kwargs)


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth/refresh")
    response.delete_cookie(CSRF_COOKIE, path="/")
