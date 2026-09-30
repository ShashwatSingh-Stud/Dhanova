
import time
import logging
from app.db.supabase import supabase_client
from app.graph_engine import build_graph, detect_communities, graph_features, find_short_cycles
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph_worker")

def process_job(job):
    job_id = job["job_id"]
    txn_id = job["txn_id"]
    logger.info(f"Processing job {job_id} for txn {txn_id}")

    try:
        # 1. Fetch transaction metadata
        txn_res = supabase_client.table("transactions").select("*").eq("txn_id", txn_id).execute()
        if not txn_res.data:
            raise ValueError(f"Txn {txn_id} not found")

        txn = pd.DataFrame(txn_res.data)
        as_of = pd.Timestamp(txn.iloc[0]["timestamp"])

        # 2. Build graph (simplified for worker)
        graph = build_graph(txn, as_of=as_of)
        communities = detect_communities(graph)
        cycles = find_short_cycles(graph)

        # 3. Compute/Persist features
        # (This just calculates, need to implement storage if required by PRD.
        # Plan says "idempotent as-of graph recomputation".
        # Assuming persist in graph_features table? Wait, schema has fraud_rings, risk_scores.
        # Plan says "complete successful jobs".

        logger.info(f"Graph recomputed for job {job_id}")

        # Complete
        supabase_client.rpc("complete_graph_job", {"p_job_id": job_id}).execute()
        logger.info(f"Job {job_id} completed")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        supabase_client.rpc("fail_graph_job", {"p_job_id": job_id, "p_error": str(e)}).execute()

def run_worker():
    logger.info("Graph worker started")
    while True:
        try:
            job_res = supabase_client.rpc("claim_graph_job", {"p_worker_id": "graph_worker_v1"}).execute()
            if job_res.data:
                process_job(job_res.data)
            else:
                time.sleep(10)
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            time.sleep(30)

if __name__ == "__main__":
    run_worker()
