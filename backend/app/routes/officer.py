from fastapi import APIRouter, Depends, HTTPException
from app.schemas.domain import HoldActionRequest, HoldActionResponse
from app.db.supabase import get_db, Client
from datetime import datetime, timedelta
import uuid
import logging

router = APIRouter(prefix="/actions", tags=["Officer Actions"])
logger = logging.getLogger(__name__)

@router.post("/hold", response_model=HoldActionResponse)
def place_hold(
    payload: HoldActionRequest,
    db: Client = Depends(get_db)
):
    """
    RBI-compliant 60-day hold action.
    Places account on hold and automatically calculates expiry (+60 days).
    """
    action_id = str(uuid.uuid4())
    hold_start = datetime.now()
    hold_expiry = hold_start + timedelta(days=60)

    hold_data = {
        "action_id": action_id,
        "account_id": payload.account_id,
        "officer_id": payload.officer_id,
        "reason": payload.reason,
        "hold_start": hold_start.isoformat(),
        "hold_expiry": hold_expiry.isoformat(),
        "status": "active"
    }

    try:
        # Insert hold action
        db.table("hold_actions").insert(hold_data).execute()

        # Update account status
        db.table("accounts").update({"status": "on_hold"}).eq("account_id", payload.account_id).execute()

        return HoldActionResponse(**hold_data)
    except Exception as e:
        logger.error(f"Failed to place hold on account {payload.account_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to place hold.")

@router.post("/release/{action_id}")
def release_hold(
    action_id: str,
    db: Client = Depends(get_db)
):
    """
    Releases a hold before the 60-day expiry.
    """
    try:
        # Update hold action
        res = db.table("hold_actions").update({"status": "released"}).eq("action_id", action_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Hold action not found.")

        # Update account status back to clear
        account_id = res.data[0]['account_id']
        db.table("accounts").update({"status": "clear"}).eq("account_id", account_id).execute()

        return {"message": f"Hold {action_id} released successfully.", "account_id": account_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to release hold {action_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to release hold.")

@router.get("/holds/expired")
def check_expired_holds(db: Client = Depends(get_db)):
    """
    Maintenance endpoint to check and auto-expire holds past their 60-day window.
    """
    try:
        now = datetime.now().isoformat()

        # Find expired holds
        res = db.table("hold_actions")\
            .select("*")\
            .eq("status", "active")\
            .lt("hold_expiry", now)\
            .execute()

        expired_count = 0
        for hold in res.data:
            # Mark as expired
            db.table("hold_actions").update({"status": "expired"}).eq("action_id", hold['action_id']).execute()

            # Release account
            db.table("accounts").update({"status": "clear"}).eq("account_id", hold['account_id']).execute()
            expired_count += 1

        return {"message": f"Processed {expired_count} expired holds."}
    except Exception as e:
        logger.error(f"Failed to process expired holds: {e}")
        raise HTTPException(status_code=500, detail="Failed to process expired holds.")
