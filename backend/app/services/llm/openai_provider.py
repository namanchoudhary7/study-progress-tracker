import json
from typing import Any, AsyncIterator

import openai

from app.services.llm.base import LLMEvent, ProviderUnavailable, TextDelta, ToolCall, TurnComplete

DEFAULT_MODEL = "gpt-4o"


class OpenAIProvider:
    """Fallback provider. Non-streaming under the hood (simpler/safer tool-call handling);
    emits its full answer as a single TextDelta before the final TurnComplete."""

    name = "openai"

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = openai.AsyncOpenAI(api_key=api_key)
        self._model = model

    async def stream_chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]], system: str
    ) -> AsyncIterator[LLMEvent]:
        openai_tools = [
            {"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}}
            for t in tools
        ]
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                max_tokens=2048,
                messages=[{"role": "system", "content": system}, *_to_openai_messages(messages)],
                tools=openai_tools or None,
            )
        except (openai.RateLimitError, openai.APIStatusError, openai.APIConnectionError) as exc:
            raise ProviderUnavailable(str(exc)) from exc

        choice = response.choices[0]
        text = choice.message.content or ""
        if text:
            yield TextDelta(text=text)

        tool_calls = [
            ToolCall(id=tc.id, name=tc.function.name, arguments=json.loads(tc.function.arguments or "{}"))
            for tc in (choice.message.tool_calls or [])
        ]
        stop_reason = "tool_use" if tool_calls else "end_turn"
        yield TurnComplete(text=text, tool_calls=tool_calls, stop_reason=stop_reason)


def _to_openai_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in messages:
        role = m["role"]
        if role == "user":
            out.append({"role": "user", "content": m["content"]})
        elif role == "assistant":
            msg: dict[str, Any] = {"role": "assistant", "content": m.get("content") or None}
            if m.get("tool_calls"):
                msg["tool_calls"] = [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])},
                    }
                    for tc in m["tool_calls"]
                ]
            out.append(msg)
        elif role == "tool":
            out.append({"role": "tool", "tool_call_id": m["tool_call_id"], "content": str(m["content"])})
    return out
