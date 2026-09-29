"""Bounded Gemini execution with deterministic fallback behavior."""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)
MAX_PROMPT_LENGTH = 12000
MAX_RESPONSE_LENGTH = 4000
FALLBACK_EXPLANATION = "A deterministic risk explanation is available; the language service is temporarily unavailable."


def generate_explanation(prompt_text: str) -> str:
    """Execute a bounded provider call, returning a safe fallback on failure."""
    if not prompt_text or len(prompt_text) > MAX_PROMPT_LENGTH:
        logger.warning("Gemini prompt rejected due to length")
        return FALLBACK_EXPLANATION
    if not settings.GEMINI_API_KEY:
        return FALLBACK_EXPLANATION

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt_text,
            generation_config={"max_output_tokens": 600, "temperature": 0.1},
            request_options={"timeout": 10},
        )
        text = (getattr(response, "text", "") or "").strip()
        if not text:
            return FALLBACK_EXPLANATION
        return text[:MAX_RESPONSE_LENGTH]
    except Exception:
        logger.exception("Gemini explanation provider failed")
        return FALLBACK_EXPLANATION
