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


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> str:
    """Sets the access/refresh/CSRF cookies and returns the CSRF token value.

    The CSRF token is also returned (not just set as a cookie) because the
    frontend runs on a different domain than the API — cross-origin cookies
    set by the API response aren't readable via document.cookie on the
    frontend's own origin, so the token must be handed back in the response
    body for the frontend to echo on subsequent requests.
    """
    response.set_cookie(ACCESS_COOKIE, access_token, max_age=settings.access_token_expire_minutes * 60, **_base_kwargs("/"))
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        **_base_kwargs("/api/v1/auth/refresh"),
    )
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        CSRF_COOKIE, csrf_token, max_age=settings.refresh_token_expire_days * 24 * 60 * 60, **_base_kwargs("/")
    )
    return csrf_token


def clear_auth_cookies(response: Response) -> None:
    # Browsers only honor a cookie deletion if secure/samesite/httponly match how it was
    # originally set — otherwise the Set-Cookie is silently ignored and the cookie lingers.
    response.delete_cookie(ACCESS_COOKIE, **_base_kwargs("/"))
    response.delete_cookie(REFRESH_COOKIE, **_base_kwargs("/api/v1/auth/refresh"))
    response.delete_cookie(CSRF_COOKIE, **_base_kwargs("/"))
