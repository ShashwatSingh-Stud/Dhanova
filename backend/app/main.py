from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging
from pathlib import Path

from app.core.config import settings
from app.scorer import RiskModel

logger = logging.getLogger(__name__)

# Global model instance
ml_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_model
    logger.info("Initializing Dhanova Backend...")

    # ML Contract: Backend is responsible for loading the model state into memory.
    try:
        model_dir = Path(__file__).parent.parent / "models"
        if model_dir.exists():
            ml_model = RiskModel.load(str(model_dir))
            logger.info(f"Loaded ML RiskModel version {ml_model.version}")
        else:
            logger.warning(f"Model directory not found at {model_dir}. Scoring will fail if provoked.")
    except Exception as e:
        logger.error(f"Failed to load ML RiskModel: {e}")
        # We continue starting the app so non-ML routes work

    yield

    logger.info("Shutting down Dhanova Backend...")
    # Clean up resources if needed
    ml_model = None


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Import and include routers
from app.routes import transactions, upi_check, officer, chat

app.include_router(transactions.router)
app.include_router(upi_check.router)
app.include_router(officer.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": ml_model is not None
    }

def get_model():
    """Dependency to inject the loaded ML model into routes."""
    if ml_model is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="ML model not loaded")
    return ml_model
