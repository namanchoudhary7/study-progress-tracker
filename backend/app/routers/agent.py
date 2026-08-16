import json
import logging
import time
import uuid
from datetime import date
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agent_tools.registry import TOOLS, get_tool
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import RateLimiter
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.llm.base import TextDelta, TurnComplete
from app.services.llm.router import build_default_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])

MAX_TOOL_ITERATIONS = 8

# Every agent turn — whether starting a new chat or resuming after a confirmation —
# makes at least one LLM call, so both endpoints share the same limiter buckets.
_minute_limiter = RateLimiter(max_requests=settings.agent_rate_limit_per_minute, window_seconds=60)
_day_limiter = RateLimiter(max_requests=settings.agent_rate_limit_per_day, window_seconds=86400)


def _rate_limited_user(current_user: User = Depends(get_current_user)) -> User:
    _minute_limiter.check(current_user.id)
    _day_limiter.check(current_user.id)
    return current_user

# Tools destructive enough that the agent must pause and get explicit user approval
# before executing them, rather than acting on the model's say-so alone.
CONFIRM_REQUIRED_TOOLS = {"delete_subject", "delete_topic", "delete_session", "delete_goal", "delete_flashcard"}
PENDING_CONFIRMATION_TTL_SECONDS = 600

# In-memory store of paused tool calls awaiting user confirmation, keyed by a one-time
# token handed to the frontend. Single-process only — fine at this app's scale, but a
# multi-worker deployment would need this moved to a shared store (e.g. Redis).
_pending_confirmations: dict[str, dict[str, Any]] = {}


def _purge_expired_confirmations() -> None:
    cutoff = time.time() - PENDING_CONFIRMATION_TTL_SECONDS
    for token in [t for t, entry in _pending_confirmations.items() if entry["created_at"] < cutoff]:
        _pending_confirmations.pop(token, None)


def _system_prompt() -> str:
    today = date.today().isoformat()
    return f"""\
You are the study coach built into the Study Progress Tracker app, talking to the currently \
signed-in user about their own data. Today's date is {today} (server clock, UTC) — use this for \
"today"/"yesterday"/relative-date requests instead of guessing. You can:
- act as a study coach: surface time imbalances, overdue goals, review backlog, and give advice
- perform natural-language data entry: log sessions, create/update subjects, topics, goals, tags, plans
- help plan and adjust study schedules given the user's subjects, topics, and goals
- help with review/quiz prep: read a topic's notes/resources, then use create_flashcards to save practice \
question/answer pairs as real flashcards the user can review later (check list_flashcards first so you don't \
duplicate what's already saved) — don't just state practice questions in the chat reply and let them vanish
- answer general questions, using tools to ground answers in the user's real data whenever relevant

Always use the provided tools to read or change data — never invent subjects, topics, sessions, dates, or \
numbers. If a tool call fails (e.g. not found), tell the user plainly instead of guessing. Deleting a \
subject, topic, session, goal, or flashcard requires the user's explicit confirmation, which the app collects \
automatically when you call a delete tool — just call it and wait for the result. Keep replies concise \
and concrete.\
"""

TOOL_SPECS: list[dict[str, Any]] = [
    {"name": t.name, "description": t.description, "parameters": t.parameters} for t in TOOLS
]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ConfirmRequest(BaseModel):
    token: str
    approved: bool


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _process_tool_calls(
    db: Session,
    user: User,
    working_messages: list[dict[str, Any]],
    tool_calls: list[dict[str, Any]],
    pause_state: dict[str, bool],
) -> AsyncIterator[str]:
    """Executes tool_calls in order, appending each result to working_messages.

    If a destructive tool is encountered, stashes it (and anything after it in this
    batch) for later and sets pause_state["paused"] = True instead of running it.
    """
    for i, tc in enumerate(tool_calls):
        if tc["name"] in CONFIRM_REQUIRED_TOOLS:
            _purge_expired_confirmations()
            token = uuid.uuid4().hex
            _pending_confirmations[token] = {
                "user_id": user.id,
                "working_messages": working_messages,
                "remaining_tool_calls": tool_calls[i:],
                "created_at": time.time(),
            }
            yield _sse("confirm_required", {"token": token, "name": tc["name"], "arguments": tc["arguments"]})
            pause_state["paused"] = True
            return

        yield _sse("tool_call", {"name": tc["name"], "arguments": tc["arguments"]})
        try:
            tool = get_tool(tc["name"])
            result = tool.call(db, user, tc["arguments"])
        except Exception as exc:  # noqa: BLE001 — fed back to the model as a tool error, not raised
            logger.warning("Tool %s failed: %s", tc["name"], exc)
            result = {"error": str(exc)}
        yield _sse("tool_result", {"name": tc["name"], "result": result})
        working_messages.append(
            {"role": "tool", "tool_call_id": tc["id"], "name": tc["name"], "content": json.dumps(result)}
        )


async def _run_agent(db: Session, user: User, working_messages: list[dict[str, Any]]) -> AsyncIterator[str]:
    try:
        llm_router = build_default_router()
        for _ in range(MAX_TOOL_ITERATIONS):
            final: TurnComplete | None = None
            async for event in llm_router.stream_chat(working_messages, TOOL_SPECS, _system_prompt()):
                if isinstance(event, TextDelta):
                    yield _sse("delta", {"text": event.text})
                elif isinstance(event, TurnComplete):
                    final = event

            if final is None:
                yield _sse("error", {"message": "The assistant returned no response."})
                return

            if not final.tool_calls:
                yield _sse("done", {"text": final.text, "model": final.provider_name})
                return

            working_messages.append(
                {
                    "role": "assistant",
                    "content": final.text,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "name": tc.name,
                            "arguments": tc.arguments,
                            "thought_signature": tc.thought_signature,
                        }
                        for tc in final.tool_calls
                    ],
                }
            )

            tool_calls = [{"id": tc.id, "name": tc.name, "arguments": tc.arguments} for tc in final.tool_calls]
            pause_state = {"paused": False}
            async for chunk in _process_tool_calls(db, user, working_messages, tool_calls, pause_state):
                yield chunk
            if pause_state["paused"]:
                return

        yield _sse("error", {"message": "The assistant used too many tool calls without finishing. Try rephrasing."})
    except Exception as exc:  # noqa: BLE001 — surfaced to the client as a stream event, not a raw 500
        logger.exception("Agent chat failed")
        yield _sse("error", {"message": str(exc)})


async def _resume_agent(db: Session, user: User, token: str, approved: bool) -> AsyncIterator[str]:
    _purge_expired_confirmations()
    entry = _pending_confirmations.pop(token, None)
    if entry is None or entry["user_id"] != user.id:
        yield _sse("error", {"message": "This confirmation has expired. Please try again."})
        return

    working_messages: list[dict[str, Any]] = entry["working_messages"]
    remaining_tool_calls: list[dict[str, Any]] = entry["remaining_tool_calls"]
    tc = remaining_tool_calls[0]

    if approved:
        yield _sse("tool_call", {"name": tc["name"], "arguments": tc["arguments"]})
        try:
            tool = get_tool(tc["name"])
            result = tool.call(db, user, tc["arguments"])
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tool %s failed: %s", tc["name"], exc)
            result = {"error": str(exc)}
    else:
        result = {"declined": True, "message": "The user did not confirm this action, so it was not performed."}
    yield _sse("tool_result", {"name": tc["name"], "result": result})
    working_messages.append(
        {"role": "tool", "tool_call_id": tc["id"], "name": tc["name"], "content": json.dumps(result)}
    )

    rest = remaining_tool_calls[1:]
    if rest:
        pause_state = {"paused": False}
        async for chunk in _process_tool_calls(db, user, working_messages, rest, pause_state):
            yield chunk
        if pause_state["paused"]:
            return

    async for chunk in _run_agent(db, user, working_messages):
        yield chunk


@router.post("/chat")
def chat(
    payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(_rate_limited_user)
) -> StreamingResponse:
    messages = [m.model_dump() for m in payload.messages]
    return StreamingResponse(_run_agent(db, current_user, messages), media_type="text/event-stream")


@router.post("/confirm")
def confirm(
    payload: ConfirmRequest, db: Session = Depends(get_db), current_user: User = Depends(_rate_limited_user)
) -> StreamingResponse:
    return StreamingResponse(
        _resume_agent(db, current_user, payload.token, payload.approved), media_type="text/event-stream"
    )
