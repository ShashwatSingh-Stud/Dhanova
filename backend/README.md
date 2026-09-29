# Dhanova Backend

FastAPI backend for the Dhanova fraud detection system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Supabase and Gemini API credentials
```

3. Ensure ML models are available:
```bash
# ML models should be in backend/models/ directory
# Contains: risk_model.joblib, calibrator.joblib, feature_columns.json, model_version.txt
```

4. Run the server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Health Check
- `GET /health` - Check API and model status

### Transactions
- `POST /transactions/` - Ingest a new transaction

### UPI Check (Citizen)
- `GET /upi/check/{account_id}` - Check risk score for an account

### Officer Actions
- `POST /actions/hold` - Place 60-day hold on account
- `POST /actions/release/{action_id}` - Release a hold
- `GET /actions/holds/expired` - Process expired holds

### Chat
- `POST /chat/` - Ask questions about an account

## Testing

```bash
pytest app/test_api.py -v
```

## Architecture

- **ML Integration**: Consumes the ML model via `scorer.py`, `features.py`, `explainer.py`, `graph_engine.py`
- **Database**: Supabase PostgreSQL
- **LLM**: Google Gemini for explanation generation
- **Async**: Background tasks for heavy graph computation

## Notes

- ML model training is handled separately by the ML team
- This backend only integrates and serves the trained model
- Graph features are computed asynchronously to avoid blocking requests
