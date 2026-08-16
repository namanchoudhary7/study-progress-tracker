import asyncio
import json
from typing import Any, AsyncIterator

from google import genai
from google.genai import errors, types

from app.services.llm.base import LLMEvent, ProviderUnavailable, TextDelta, ToolCall, TurnComplete

DEFAULT_MODEL = "gemini-flash-lite-latest"
REQUEST_TIMEOUT_SECONDS = 20


class GeminiProvider:
    """Fallback provider. Streams token-by-token via generate_content_stream; function-call
    parts still arrive whole (Gemini doesn't stream tool-call arguments incrementally), so
    those are only surfaced once complete, in the final TurnComplete."""

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self.name = f"gemini:{model}"

    async def stream_chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]], system: str
    ) -> AsyncIterator[LLMEvent]:
        gemini_tools = (
            [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(name=t["name"], description=t["description"], parameters_json_schema=t["parameters"])
                        for t in tools
                    ]
                )
            ]
            if tools
            else None
        )
        try:
            stream = await asyncio.wait_for(
                self._client.aio.models.generate_content_stream(
                    model=self._model,
                    contents=_to_gemini_contents(messages),
                    config=types.GenerateContentConfig(
                        system_instruction=system,
                        tools=gemini_tools,
                        max_output_tokens=2048,
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    ),
                ),
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except errors.APIError as exc:
            raise ProviderUnavailable(str(exc)) from exc
        except asyncio.TimeoutError as exc:
            raise ProviderUnavailable(f"Timed out after {REQUEST_TIMEOUT_SECONDS}s") from exc

        text_parts: list[str] = []
        tool_calls: list[ToolCall] = []
        stream_iter = stream.__aiter__()
        while True:
            try:
                chunk = await asyncio.wait_for(stream_iter.__anext__(), timeout=REQUEST_TIMEOUT_SECONDS)
            except StopAsyncIteration:
                break
            except errors.APIError as exc:
                if text_parts or tool_calls:
                    raise  # mid-stream failure after content emitted — don't fail over, let it surface as an error
                raise ProviderUnavailable(str(exc)) from exc
            except asyncio.TimeoutError as exc:
                if text_parts or tool_calls:
                    raise
                raise ProviderUnavailable(f"Timed out after {REQUEST_TIMEOUT_SECONDS}s") from exc

            if not chunk.candidates or not chunk.candidates[0].content:
                continue
            for part in chunk.candidates[0].content.parts or []:
                if part.text:
                    text_parts.append(part.text)
                    yield TextDelta(text=part.text)
                elif part.function_call:
                    fc = part.function_call
                    tool_calls.append(
                        ToolCall(
                            id=fc.id or fc.name,
                            name=fc.name,
                            arguments=dict(fc.args or {}),
                            thought_signature=part.thought_signature,
                        )
                    )

        text = "".join(text_parts)
        yield TurnComplete(text=text, tool_calls=tool_calls, stop_reason="tool_use" if tool_calls else "end_turn")


def _to_gemini_contents(messages: list[dict[str, Any]]) -> list[types.Content]:
    out: list[types.Content] = []
    for m in messages:
        role = m["role"]
        if role == "user":
            out.append(types.Content(role="user", parts=[types.Part(text=m["content"])]))
        elif role == "assistant":
            parts: list[types.Part] = []
            if m.get("content"):
                parts.append(types.Part(text=m["content"]))
            for tc in m.get("tool_calls", []):
                parts.append(
                    types.Part(
                        function_call=types.FunctionCall(id=tc["id"], name=tc["name"], args=tc["arguments"]),
                        thought_signature=tc.get("thought_signature"),
                    )
                )
            out.append(types.Content(role="model", parts=parts))
        elif role == "tool":
            try:
                response_dict = json.loads(m["content"])
                if not isinstance(response_dict, dict):
                    response_dict = {"result": response_dict}
            except (TypeError, ValueError):
                response_dict = {"result": m["content"]}
            out.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            function_response=types.FunctionResponse(
                                id=m.get("tool_call_id"), name=m.get("name", ""), response=response_dict
                            )
                        )
                    ],
                )
            )
    return out
