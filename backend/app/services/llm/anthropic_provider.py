from typing import Any, AsyncIterator

import anthropic

from app.services.llm.base import LLMEvent, ProviderUnavailable, TextDelta, ToolCall, TurnComplete

DEFAULT_MODEL = "claude-sonnet-4-5-20250929"


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key, timeout=20.0)
        self._model = model

    async def stream_chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]], system: str
    ) -> AsyncIterator[LLMEvent]:
        anthropic_tools = [
            {"name": t["name"], "description": t["description"], "input_schema": t["parameters"]} for t in tools
        ]
        try:
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=2048,
                system=system,
                messages=_to_anthropic_messages(messages),
                tools=anthropic_tools,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        yield TextDelta(text=event.delta.text)
                final = await stream.get_final_message()
        except (anthropic.RateLimitError, anthropic.APIStatusError, anthropic.APIConnectionError) as exc:
            raise ProviderUnavailable(str(exc)) from exc

        text_parts: list[str] = []
        tool_calls: list[ToolCall] = []
        for block in final.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_calls.append(ToolCall(id=block.id, name=block.name, arguments=block.input))

        yield TurnComplete(text="".join(text_parts), tool_calls=tool_calls, stop_reason=final.stop_reason or "end_turn")


def _to_anthropic_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in messages:
        role = m["role"]
        if role == "user":
            out.append({"role": "user", "content": m["content"]})
        elif role == "assistant":
            content: list[dict[str, Any]] = []
            if m.get("content"):
                content.append({"type": "text", "text": m["content"]})
            for tc in m.get("tool_calls", []):
                content.append({"type": "tool_use", "id": tc["id"], "name": tc["name"], "input": tc["arguments"]})
            out.append({"role": "assistant", "content": content})
        elif role == "tool":
            out.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "tool_result", "tool_use_id": m["tool_call_id"], "content": str(m["content"])}
                    ],
                }
            )
    return out
