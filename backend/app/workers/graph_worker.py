"""Database-backed graph job worker with lease and retry semantics."""

from __future__ import annotations

import logging
import os
import time
import uuid
from dataclasses import dataclass
from typing import Any, Callable, Protocol

logger = logging.getLogger(__name__)


class GraphJobStore(Protocol):
    def claim_graph_job(self, worker_id: str, lease_seconds: int) -> dict[str, Any] | None: ...
    def complete_graph_job(self, job_id: str) -> None: ...
    def fail_graph_job(self, job_id: str, error: str, retry_delay_seconds: int) -> None: ...


@dataclass(frozen=True)
class WorkerConfig:
    lease_seconds: int = 120
    max_attempts: int = 5
    retry_base_seconds: int = 30


class GraphWorker:
    def __init__(
        self,
        store: GraphJobStore,
        process_job: Callable[[dict[str, Any]], None],
        config: WorkerConfig | None = None,
        worker_id: str | None = None,
    ) -> None:
        self.store = store
        self.process_job = process_job
        self.config = config or WorkerConfig()
        self.worker_id = worker_id or f"graph-worker-{uuid.uuid4()}"

    def run_once(self) -> bool:
        job = self.store.claim_graph_job(self.worker_id, self.config.lease_seconds)
        if not job:
            return False
        job_id = str(job["job_id"])
        try:
            self.process_job(job)
        except Exception as exc:
            attempts = int(job.get("attempts", 1))
            delay = self.config.retry_base_seconds * (2 ** max(attempts - 1, 0))
            delay = min(delay, 3600)
            self.store.fail_graph_job(job_id, str(exc), delay)
            logger.exception("Graph job %s failed", job_id)
        else:
            self.store.complete_graph_job(job_id)
        return True

    def run_forever(self, poll_seconds: float = 1.0) -> None:
        while True:
            if not self.run_once():
                time.sleep(poll_seconds)


def worker_id_from_env() -> str:
    return os.getenv("DHANOVA_GRAPH_WORKER_ID", f"graph-worker-{uuid.uuid4()}")


class SupabaseGraphJobStore:
    """Maps worker transitions to the migration's Supabase RPC functions."""

    def __init__(self, db: Any) -> None:
        self.db = db

    def claim_graph_job(self, worker_id: str, lease_seconds: int) -> dict[str, Any] | None:
        result = self.db.rpc("claim_graph_job", {
            "p_worker_id": worker_id,
            "p_lease_seconds": lease_seconds,
        }).execute()
        return _first_row(result)

    def complete_graph_job(self, job_id: str) -> None:
        self.db.rpc("complete_graph_job", {"p_job_id": job_id}).execute()

    def fail_graph_job(self, job_id: str, error: str, retry_delay_seconds: int) -> None:
        self.db.rpc("fail_graph_job", {
            "p_job_id": job_id,
            "p_error": error[:2000],
            "p_retry_delay_seconds": retry_delay_seconds,
        }).execute()


def _first_row(result: Any) -> dict[str, Any] | None:
    data = getattr(result, "data", None)
    if isinstance(data, list):
        return data[0] if data else None
    return data or None
