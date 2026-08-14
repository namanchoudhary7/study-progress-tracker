import json
import logging
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agent_tools.registry import TOOLS, get_tool
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.llm.base import TextDelta, TurnComplete
from app.services.llm.router import build_default_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])

MAX_TOOL_ITERATIONS = 8

SYSTEM_PROMPT = """\
You are the study coach built into the Study Progress Tracker app, talking to the currently \
signed-in user about their own data. You can:
- act as a study coach: surface time imbalances, overdue goals, review backlog, and give advice
- perform natural-language data entry: log sessions, create/update subjects, topics, goals, tags, plans
- help plan and adjust study schedules given the user's subjects, topics, and goals
- help with review/quiz prep: read a topic's notes/resources and generate practice questions or explanations
- answer general questions, using tools to ground answers in the user's real data whenever relevant

Always use the provided tools to read or change data — never invent subjects, topics, sessions, dates, or \
numbers. If a tool call fails (e.g. not found), tell the user plainly instead of guessing. Keep replies \
concise and concrete.\
"""

TOOL_SPECS: list[dict[str, Any]] = [
    {"name": t.name, "description": t.description, "parameters": t.parameters} for t in TOOLS
]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _run_agent(db: Session, user: User, messages: list[dict[str, Any]]) -> AsyncIterator[str]:
    llm_router = build_default_router()
    working_messages = list(messages)

    try:
        for _ in range(MAX_TOOL_ITERATIONS):
            final: TurnComplete | None = None
            async for event in llm_router.stream_chat(working_messages, TOOL_SPECS, SYSTEM_PROMPT):
                if isinstance(event, TextDelta):
                    yield _sse("delta", {"text": event.text})
                elif isinstance(event, TurnComplete):
                    final = event

            if final is None:
                yield _sse("error", {"message": "The assistant returned no response."})
                return

            if not final.tool_calls:
                yield _sse("done", {"text": final.text})
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

            for tc in final.tool_calls:
                yield _sse("tool_call", {"name": tc.name, "arguments": tc.arguments})
                try:
                    tool = get_tool(tc.name)
                    result = tool.call(db, user, tc.arguments)
                except Exception as exc:  # noqa: BLE001 — fed back to the model as a tool error, not raised
                    logger.warning("Tool %s failed: %s", tc.name, exc)
                    result = {"error": str(exc)}
                yield _sse("tool_result", {"name": tc.name, "result": result})
                working_messages.append(
                    {"role": "tool", "tool_call_id": tc.id, "name": tc.name, "content": json.dumps(result)}
                )

        yield _sse("error", {"message": "The assistant used too many tool calls without finishing. Try rephrasing."})
    except Exception as exc:  # noqa: BLE001 — surfaced to the client as a stream event, not a raw 500
        logger.exception("Agent chat failed")
        yield _sse("error", {"message": str(exc)})


@router.post("/chat")
def chat(
    payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StreamingResponse:
    messages = [m.model_dump() for m in payload.messages]
    return StreamingResponse(_run_agent(db, current_user, messages), media_type="text/event-stream")
