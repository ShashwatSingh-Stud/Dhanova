import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure the API key if present
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set. Explanation generation will fail.")

def generate_explanation(prompt_text: str) -> str:
    """
    Executes the exact prompt string against the Gemini model.
    The prompt text is pre-constructed by the ML Explainer (gemini_explanation_prompt).
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt_text)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Failed to generate explanation from Gemini: {e}")
        # Graceful fallback text so API doesn't crash completely.
        return "Explanation could not be generated at this time via LLM."
