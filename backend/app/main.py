from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.cookies import CSRF_COOKIE
from app.mcp_server import mcp_app
from app.routers import (
    agent,
    api_keys,
    auth,
    export,
    flashcards,
    goals,
    import_,
    internal,
    plans,
    public,
    resources,
    reviews,
    sessions,
    stats,
    subjects,
    tags,
    topics,
    users,
)

mcp_asgi_app = mcp_app.streamable_http_app()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with mcp_app.session_manager.run():
        yield


app = FastAPI(title="Study Progress Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret, same_site="lax", https_only=settings.is_production)

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_EXEMPT_PREFIXES = ("/api/v1/auth", "/api/v1/internal", "/mcp")


@app.middleware("http")
async def csrf_protect(request: Request, call_next):
    if request.method not in SAFE_METHODS and not request.url.path.startswith(CSRF_EXEMPT_PREFIXES):
        cookie_token = request.cookies.get(CSRF_COOKIE)
        header_token = request.headers.get("x-csrf-token")
        if not cookie_token or not header_token or cookie_token != header_token:
            return JSONResponse(status_code=403, content={"detail": "CSRF token missing or invalid"})
    return await call_next(request)


API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(subjects.router, prefix=API_PREFIX)
app.include_router(topics.router, prefix=API_PREFIX)
app.include_router(sessions.router, prefix=API_PREFIX)
app.include_router(goals.router, prefix=API_PREFIX)
app.include_router(stats.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(tags.router, prefix=API_PREFIX)
app.include_router(resources.router, prefix=API_PREFIX)
app.include_router(flashcards.router, prefix=API_PREFIX)
app.include_router(public.router, prefix=API_PREFIX)
app.include_router(internal.router, prefix=API_PREFIX)
app.include_router(plans.router, prefix=API_PREFIX)
app.include_router(import_.router, prefix=API_PREFIX)
app.include_router(agent.router, prefix=API_PREFIX)
app.include_router(api_keys.router, prefix=API_PREFIX)

app.mount("/mcp", mcp_asgi_app)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
