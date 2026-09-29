from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.schemas.domain import TransactionCreate, TransactionResponse
from app.db.supabase import get_db, Client
import uuid
import logging

router = APIRouter(prefix="/transactions", tags=["Transactions"])
logger = logging.getLogger(__name__)

def trigger_graph_recalculation(txn_id: str):
    """
    Background worker to asynchronously trigger the graph engine recalculation
    so we do not block synchronous real-time payload paths.
    """
    logger.info(f"Triggering graph recalculation for new transaction {txn_id}...")
    # In a real app, this might publish to a Redis queue or Kafka topic.
    # Here, we note it for now, as updating the whole graph per-transaction needs orchestration.
    pass

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    payload: TransactionCreate,
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db)
):
    """
    Real-time ingestion for a single transaction.
    """
    txn_id = str(uuid.uuid4())
    insert_data = {
        "txn_id": txn_id,
        "sender_account_id": payload.sender_account_id,
        "receiver_account_id": payload.receiver_account_id,
        "amount": payload.amount,
        "channel": payload.channel,
        "device_id": payload.device_id,
        "timestamp": payload.timestamp.isoformat()
    }

    try:
        res = db.table("transactions").insert(insert_data).execute()

        # Enqueue background recalculation per ML constraint
        background_tasks.add_task(trigger_graph_recalculation, txn_id)

        return res.data[0]
    except Exception as e:
        logger.error(f"Failed to insert transaction: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed.")
