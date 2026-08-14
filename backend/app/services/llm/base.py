from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Protocol


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]
    # Gemini-specific: must be echoed back verbatim on replay or it rejects the next turn.
    # Other providers leave this None; it's opaque to everything except gemini_provider.py.
    thought_signature: bytes | None = None


@dataclass
class TextDelta:
    text: str


@dataclass
class TurnComplete:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    stop_reason: str = "end_turn"


LLMEvent = TextDelta | TurnComplete


class ProviderUnavailable(Exception):
    """Raised when a provider hits a rate limit/quota/5xx/connection error — the router should fail over."""


class LLMProvider(Protocol):
    name: str

    def stream_chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]], system: str
    ) -> AsyncIterator[LLMEvent]: ...
