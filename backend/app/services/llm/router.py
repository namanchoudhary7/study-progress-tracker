import logging
from typing import Any, AsyncIterator

from app.core.config import settings
from app.services.llm.anthropic_provider import AnthropicProvider
from app.services.llm.base import LLMEvent, LLMProvider, ProviderUnavailable
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

_PROVIDER_FACTORIES = {
    "anthropic": lambda: AnthropicProvider(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None,
    "openai": lambda: OpenAIProvider(api_key=settings.openai_api_key) if settings.openai_api_key else None,
    "gemini": lambda: GeminiProvider(api_key=settings.gemini_api_key) if settings.gemini_api_key else None,
}


class LLMRouter:
    """Tries providers in priority order, failing over on rate-limit/quota/5xx errors.

    Failover only happens before any content has been emitted for the current turn — once a
    provider starts streaming text back, we commit to it rather than risk a garbled mixed answer.
    """

    def __init__(self, providers: list[LLMProvider]) -> None:
        if not providers:
            raise RuntimeError(
                "No LLM providers configured — set a key for at least one provider named in "
                "LLM_PROVIDER_PRIORITY (e.g. GEMINI_API_KEY)"
            )
        self._providers = providers

    async def stream_chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]], system: str
    ) -> AsyncIterator[LLMEvent]:
        last_exc: Exception | None = None
        for provider in self._providers:
            emitted_any = False
            try:
                async for event in provider.stream_chat(messages, tools, system):
                    emitted_any = True
                    yield event
                return
            except ProviderUnavailable as exc:
                last_exc = exc
                if emitted_any:
                    raise
                logger.warning("LLM provider %s unavailable, falling back: %s", provider.name, exc)
                continue
        raise RuntimeError(f"All LLM providers unavailable: {last_exc}")


def build_default_router() -> LLMRouter:
    providers: list[LLMProvider] = []
    for name in settings.llm_provider_priority_list:
        factory = _PROVIDER_FACTORIES.get(name)
        if factory is None:
            logger.warning("Unknown LLM provider in LLM_PROVIDER_PRIORITY: %s", name)
            continue
        provider = factory()
        if provider is not None:
            providers.append(provider)
    return LLMRouter(providers)
