from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

# =======================
# Account Schemas
# =======================
class AccountBase(BaseModel):
    account_id: str
    holder_name: str
    bank_name: str
    account_age_days: int
    kyc_level: str
    status: str = "clear"  # clear | flagged | on_hold

class AccountDetail(AccountBase):
    model_config = ConfigDict(from_attributes=True)

# =======================
# Device Schemas
# =======================
class AccountDeviceMap(BaseModel):
    account_id: str
    device_id: str

# =======================
# Transaction Schemas
# =======================
class TransactionCreate(BaseModel):
    sender_account_id: str
    receiver_account_id: str
    amount: float
    channel: str
    device_id: Optional[str] = None
    timestamp: datetime = datetime.now()

class TransactionResponse(TransactionCreate):
    txn_id: str
    model_config = ConfigDict(from_attributes=True)

# =======================
# Risk & ML Schemas
# =======================
class RiskScoreResponse(BaseModel):
    account_id: str
    score: int
    top_features: Dict[str, Any]
    explanation_text: Optional[str] = None
    ring_id: Optional[str] = None
    computed_at: datetime

# =======================
# Officer Action Schemas
# =======================
class HoldActionRequest(BaseModel):
    account_id: str
    reason: str
    officer_id: str

class HoldActionResponse(BaseModel):
    action_id: str
    account_id: str
    officer_id: str
    reason: str
    hold_start: datetime
    hold_expiry: datetime
    status: str  # active | released | expired

# =======================
# Chat Schemas
# =======================
class ChatRequest(BaseModel):
    account_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
