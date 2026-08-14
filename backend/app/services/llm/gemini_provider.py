import json
from typing import Any, AsyncIterator

from google import genai
from google.genai import errors, types

from app.services.llm.base import LLMEvent, ProviderUnavailable, TextDelta, ToolCall, TurnComplete

DEFAULT_MODEL = "gemini-flash-latest"


class GeminiProvider:
    """Fallback provider. Non-streaming under the hood (simpler/safer tool-call handling);
    emits its full answer as a single TextDelta before the final TurnComplete."""

    name = "gemini"

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

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
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=_to_gemini_contents(messages),
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    tools=gemini_tools,
                    max_output_tokens=2048,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
        except errors.APIError as exc:
            raise ProviderUnavailable(str(exc)) from exc

        text_parts: list[str] = []
        tool_calls: list[ToolCall] = []
        parts = response.candidates[0].content.parts if response.candidates and response.candidates[0].content else []
        for part in parts:
            if part.text:
                text_parts.append(part.text)
            elif part.function_call:
                fc = part.function_call
                tool_calls.append(ToolCall(id=fc.id or fc.name, name=fc.name, arguments=dict(fc.args or {})))

        text = "".join(text_parts)
        if text:
            yield TextDelta(text=text)
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
                parts.append(types.Part(function_call=types.FunctionCall(id=tc["id"], name=tc["name"], args=tc["arguments"])))
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
