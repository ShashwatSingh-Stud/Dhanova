# 🛡️ Dhanova (धनोवा) — AI Mule & Fraud Ring Intelligence Platform

> **Built for the MPOnline Idea & Innovation Hackathon 2026**  
> **Theme 5: AI Innovation for Public Services**  
> *Transforming public safety and financial integrity through graph intelligence, explainable ML, and statutory compliance.*

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Dual-Branch Architecture & Overview](#-dual-branch-architecture--overview)
   - [Branch Comparison Matrix](#branch-comparison-matrix)
   - [How the Branches Complement Each Other](#how-the-branches-complement-each-other)
3. [Deep Dive: `main` Branch (Frontend & User Experience)](#-deep-dive-main-branch-frontend--user-experience)
   - [Frontend Tech Stack](#frontend-tech-stack)
   - [Citizen UPI Shield (`/upi/check`)](#1-citizen-upi-shield-upicheck)
   - [Officer Command Dashboard (`/dashboard`)](#2-law-enforcement-command-dashboard-dashboard)
   - [Account Forensic Dossier (`/accounts/[id]`)](#3-account-forensic-dossier-accountsid)
   - [Fraud Ring Graph Intelligence (`/rings`)](#4-fraud-ring-graph-intelligence-canvas-rings)
   - [RBI 60-Day Statutory Hold Management (`/holds`)](#5-rbi-60-day-statutory-hold-management-holds)
   - [Officer Identity Switcher & RBAC](#6-officer-identity-switcher--rbac)
   - [Zero-CORS Proxy & Hybrid Fallback Architecture](#7-zero-cors-proxy--hybrid-fallback-architecture)
4. [Deep Dive: `deepak-ml-work` Branch (ML Engine, Backend & Operations)](#-deep-dive-deepak-ml-work-branch-ml-engine-backend--operations)
   - [Machine Learning Engine & Pipeline](#1-machine-learning-engine--pipeline)
     - [Realistic Indian UPI Simulation (`data_gen.py`)](#synthetic-data-generation-data_genpy)
     - [Temporal Feature Engineering (`features.py`)](#temporal-feature-engineering-featurespy)
     - [Calibrated XGBoost Risk Scorer (`scorer.py`)](#calibrated-xgboost-risk-scorer-scorerpy)
     - [Graph Intelligence & Ring Mining (`graph_engine.py`)](#graph-intelligence--ring-mining-graph_enginepy)
     - [Explainable AI & Gemini Assistant (`explainer.py`, `gemini.py`)](#explainable-ai--gemini-assistant-explainerpy-geminipy)
   - [Production FastAPI Backend (`backend/`)](#2-production-fastapi-backend-backend)
     - [Clean ML/Backend Boundary Facade (`ml_bridge.py`)](#clean-mlbackend-boundary-facade-ml_bridgepy)
     - [Enterprise Supabase PostgreSQL Schema (`001_initial_schema.sql`)](#enterprise-supabase-postgresql-schema-001_initial_schemasql)
     - [REST API Specifications](#rest-api-specifications)
     - [Durable Leased Graph Worker (`graph_worker.py`)](#durable-leased-graph-worker-graph_workerpy)
     - [Data Ingestion & Migration Tooling](#data-ingestion--migration-tooling)
   - [Test Suite & Quality Verification](#3-comprehensive-test-suite--quality-verification)
   - [CI/CD & Containerization](#4-cicd--containerization)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [Complete Installation & Setup Guide](#-complete-installation--setup-guide)
   - [Prerequisites](#prerequisites)
   - [Running the Backend & ML Engine (`deepak-ml-work`)](#running-the-backend--ml-engine-deepak-ml-work)
   - [Running the Next.js Frontend (`main`)](#running-the-nextjs-frontend-main)
   - [Environment Variables Reference](#environment-variables-reference)
7. [Model Performance & Evaluation Benchmark](#-model-performance--evaluation-benchmark)
8. [Statutory Compliance & Legal Guardrails](#-statutory-compliance--legal-guardrails)
9. [Project Directory Map](#-project-directory-map)

---

## 🏛️ Executive Summary & Problem Statement

India's Unified Payments Interface (UPI) processes billions of instant financial transactions every month. While driving unprecedented financial inclusion, this velocity has been exploited by cybercrime syndicates using **mule account networks** to instantly layer, disperse, and cash out proceeds of crime (phishing, investment frauds, digital arrests, and task scams).

### Key Challenges:
1. **Instantaneous Fund Layering**: Stolen funds are routed across 4–10 mule accounts within 15–30 minutes, rendering manual post-facto police freeze orders ineffective.
2. **Citizen Vulnerability**: Citizens have no pre-transaction risk warning mechanism before transferring money to newly recruited mule VPIs/accounts.
3. **Statutory & Procedural Bottlenecks**: Law enforcement officers (LEOs) face high evidentiary burdens and need explainable AI attribution (TreeSHAP) rather than opaque black-box predictions to support statutory holds under the **RBI 2026 60-Day Account Freeze Framework**.

### Dhanova's Solution:
**Dhanova** is an end-to-end AI platform delivering:
- **Real-Time Citizen Protection**: Sub-second UPI pre-transaction risk query and clear risk rationales paired with the **National Cyber Crime Helpline (1930)**.
- **Explainable Machine Learning**: Calibrated XGBoost with TreeSHAP feature attributions and Google Gemini 2.5 context-aware forensic briefs.
- **Multi-Modal Graph Intelligence**: Detection of 5 distinct syndicate topologies (Fan-out Dispersal, Fan-in Collector, Circular Layering, Burst Mules, Device Farms).
- **Statutory Workflow Enforcement**: Atomic 60-day hold enforcement, early judicial release orders, and automated hold-expiry maintenance.

---

## 🔀 Dual-Branch Architecture & Overview

The Dhanova repository is organized across two primary git branches that represent the two core pillars of the platform:

```
                            ┌────────────────────────────────────────┐
                            │            Dhanova Platform            │
                            └───────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    ┌─────────────────────────┐                                   ┌─────────────────────────┐
    │       main branch       │                                   │   deepak-ml-work branch │
    ├─────────────────────────┤                                   ├─────────────────────────┤
    │  Next.js 15 Frontend    │                                   │  Production ML Pipeline │
    │  Officer Command Center │                                   │  FastAPI Backend (REST) │
    │  Citizen UPI Shield     │                                   │  Supabase PostgreSQL DB │
    │  Interactive SVG Graphs │                                   │  Durable Graph Worker   │
    │  Zero-CORS API Proxy    │                                   │  Gemini Case Assistant  │
    │  Hybrid Mock Fallbacks  │                                   │  15 Automated Pytests   │
    └─────────────────────────┘                                   └─────────────────────────┘
```

### Branch Comparison Matrix

| Capability / Dimension | `main` Branch | `deepak-ml-work` Branch |
| :--- | :--- | :--- |
| **Primary Focus** | User Interface, Officer UX, Citizen Experience, Visualizations | Machine Learning, Temporal Features, Database, REST API, Asynchronous Workers |
| **Frontend Application** | ✅ **Full Next.js 15 App** (`frontend/`) with Tailwind CSS v4, Lucide React, and shadcn primitives | ⚠️ Frontend scope documented (`docs/FRONTEND_SCOPE.md`); relies on API consumers |
| **Backend REST API** | ⚠️ Baseline stubs | ✅ **Full FastAPI Production Server** (`backend/app/main.py`) with 4 distinct router modules |
| **ML Engine & Scoring** | ⚠️ Base training script (`scripts/train.py`) | ✅ **Calibrated XGBoost (0–100 Risk)**, TreeSHAP explainer, feature schema hash verification |
| **Graph Intelligence** | ✅ Interactive SVG frontend canvas with node inspection | ✅ Full NetworkX graph engine with Louvain community detection, temporal cycle mining, hub extraction |
| **Database & Persistence** | ⚠️ Client-side mock store + local storage sync | ✅ **Supabase PostgreSQL** with 8 tables, RLS policies, atomic PL/pgSQL RPCs, and FK constraints |
| **Background Processing** | ⚠️ N/A | ✅ **Durable Leased Graph Worker** (`app/workers/graph_worker.py`) with exponential backoff |
| **Generative AI** | ✅ Slide-over Case Chat UI with contextual prompts | ✅ Backend `google-genai` integration with deterministic template fallback |
| **Automated Testing** | ⚠️ Basic data generation tests | ✅ **15 Comprehensive Pytest Suites** covering API, Auth, Features, Workers, Idempotency, and Contracts |
| **Container & CI/CD** | ⚠️ N/A | ✅ `Dockerfile`, `.dockerignore`, and GitHub Actions (`.github/workflows/ci.yml`) |

### How the Branches Complement Each Other

1. **`main` delivers the Operational Interface**: An officer or citizen interacts directly with the Next.js 15 application. It features pre-configured reverse-proxy rewrites (`/api/backend/*`) that seamlessly tunnel calls to port `8000`. If the backend is running, the frontend consumes live predictions; if running standalone, it falls back gracefully to a schema-identical mock database.
2. **`deepak-ml-work` delivers the Brain & Infrastructure**: It provides the live serving backend, the calibrated XGBoost model, the feature pipeline that protects against temporal data leaks, the database migration scripts, and the resilient worker infrastructure needed for real-time transaction ingestion.

---

## 🎨 Deep Dive: `main` Branch (Frontend & User Experience)

The `main` branch houses the complete Next.js 15 web application located in the `frontend/` directory.

### Frontend Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack enabled)
- **Language**: TypeScript with strict typing matching backend Pydantic schemas
- **Styling**: Tailwind CSS v4 featuring a dark-mode cybercrime command center palette (slate/indigo/crimson/emerald) and glassmorphism cards
- **UI Primitives**: Custom accessible UI components (`Button`, `Badge`, `Card`, `Modal`, `Input`)
- **Icons**: Lucide React

---

### 1. Citizen UPI Shield (`/upi/check`)
Designed for regular Indian citizens before confirming a suspicious payment request:
- **Instant VPI/Account Check**: Input any UPI ID or account number (e.g., `9876543210@paytm`, `mule_acct_4011`).
- **Clear Risk Badges**:
  - 🟢 **Safe / Low Risk (Score 0–40)**: Normal verified recipient profile.
  - 🟡 **Caution / Medium Risk (Score 41–70)**: Elevated transaction velocity, recently modified device, or nocturnal spikes.
  - 🔴 **High Risk / Mule Suspect (Score 71–100)**: Active syndicate member, structuring pattern, or shared fraud device.
- **Plain-Language AI Rationale**: Converts complex SHAP metrics into clear advice (e.g., *"This account was opened 4 days ago and received 32 payments under ₹10,000 in the last 2 hours"*).
- **Helpline 1930 Emergency Card**: Immediate call-to-action button to call the National Cyber Crime Reporting Helpline or navigate to `cybercrime.gov.in`.

---

### 2. Law Enforcement Command Dashboard (`/dashboard`)
The central landing console for Cyber Crime Cells:
- **Executive Metric Counters**:
  - Total Monitored Accounts
  - Flagged Mule Accounts
  - Active Statutory 60-Day Holds
  - Active Syndicate Fraud Rings
- **Filterable Account Register**:
  - Real-time search across Account ID, Holder Name, and Bank.
  - Status filters: `Clear`, `Flagged`, `On Hold`.
  - Risk tier filters: `High`, `Medium`, `Low`.
  - Direct *"Place Hold"* action modal trigger right from each table row.

---

### 3. Account Forensic Dossier (`/accounts/[id]`)
In-depth investigative file for a flagged target:
- **0–100 Interactive Risk Gauge**: SVG speedometer visualization with dynamic needle animation, risk band coloring, and status glow.
- **TreeSHAP Feature Contribution Chart**: Horizontal bar chart visualizing the mathematical contribution of each feature to the risk score. Positive risk drivers (red bars) vs. mitigating factors (green bars).
- **Forensic Transaction Timeline**:
  - Highlighting structuring transactions (amounts ₹9,000–₹9,999 designed to avoid reporting triggers).
  - Rapid dwell time flags (funds withdrawn within minutes of receipt).
  - Nocturnal burst indicators (transactions between 11 PM and 5 AM).
- **Statutory Action Buttons**: Direct triggers for placing 60-day holds or recording early judicial release orders.
- **Gemini Case Chat Drawer**: A slide-over AI assistant panel allowing officers to query case records in natural language (e.g., *"Summarize the flow of funds for this account"* or *"List all linked devices"*).

---

### 4. Fraud Ring Graph Intelligence Canvas (`/rings`)
An interactive SVG visualization engine for multi-account syndicates:
- **Interactive Canvas**: Zoom, pan, drag, and node-focus inspection.
- **Syndicate Archetype Filters**:
  1. **Operation Garuda (Fan-out Dispersal)**: Single victim source funneling large sums to multiple layer-1 mules within 30 minutes.
  2. **Operation Chakra (Circular Layering)**: Multi-hop circular cycles (A → B → C → D → A) designed to break audit trails.
  3. **Operation Vyuh (Device Farm)**: Dozens of accounts controlled via 1–2 physical hardware devices.
  4. **Burst Mule Group**: Rapid sub-₹10,000 structuring bursts within short 2-hour windows.
  5. **Fan-in Collector Group**: Multiple mules consolidating victim deposits into a central cashout account.

---

### 5. RBI 60-Day Statutory Hold Management (`/holds`)
A purpose-built interface for managing compliance with the RBI 2026 statutory freeze guidelines:
- **Live Hold Counters & Progress Bars**: Tracks days remaining (Day 1 of 60) with visual expiration progress bars.
- **Early Judicial Release Modal**: Allows an officer to lift a hold early upon receiving court orders or proof of legitimate ownership, capturing mandatory judicial case references.
- **Expired Hold Maintenance**: Button to trigger backend reconciliation (`GET /actions/holds/expired`), automatically unfreezing accounts whose 60-day statutory window has elapsed without charge-sheeting.

---

### 6. Officer Identity Switcher & RBAC
An officer switcher embedded directly into the top navigation bar, simulating real-world Multi-Agency Cyber Defense:
- **Inspector Vikram Sharma** (`OFF_MP_2026`) — MP Cyber Crime Cell, Bhopal (Default)
- **ACP Neha Verma** (`OFF_DEL_2026`) — Delhi Police IFSO (Special Cell)
- **PI Rajesh Patil** (`OFF_MH_2026`) — Maharashtra Cyber, Mumbai
- **DySP Amitav Sen** (`OFF_CBI_2026`) — CBI Financial Crimes Division
- Custom Officer ID write-in field.
All statutory hold actions, releases, and audit logs are automatically attributed to the active officer profile.

---

### 7. Zero-CORS Proxy & Hybrid Fallback Architecture
- **Next.js Rewrites (`frontend/next.config.ts`)**:
  ```typescript
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  }
  ```
- **Hybrid API Client (`frontend/src/lib/api.ts`)**:
  Attempts to contact the live backend first. If an endpoint is offline or unseeded, it seamlessly switches to the local mock database (`frontend/src/lib/mockData.ts`), ensuring zero UI breakage during demonstrations or offline hackathon pitches.

---

## ⚙️ Deep Dive: `deepak-ml-work` Branch (ML Engine, Backend & Operations)

The `deepak-ml-work` branch houses the full production-grade ML pipeline, FastAPI application, Supabase persistence layer, and background worker infrastructure.

---

### 1. Machine Learning Engine & Pipeline

#### Synthetic Data Generation (`data_gen.py`)
Generates realistic Indian banking activity according to `docs/SIM_SPEC.md`:
- **Scale**: ~6,000 accounts, ~150,000 transactions over a 30-day temporal window.
- **Normal Personas**: Salaried (monthly salary + daily UPI spends), Merchants (high fan-in, small credits), Students (low amounts, hostel device sharing), Dormant accounts, and Family Pooling (shared devices but legitimate transfers).
- **5 Fraud Archetypes**: Fan-out dispersal, Fan-in collectors, Circular layering, Burst structuring mules, and Hardware device farms.
- **Hard Negatives**: Legitimate merchants with high fan-in and salary disbursement accounts with high fan-out, ensuring the model learns nuanced behavioral signals rather than naive transaction counts.

#### Temporal Feature Engineering (`features.py`)
Computes 22 pinned numerical features strictly adhering to an `as_of` timestamp to prevent temporal data leakage:
- **Velocity Features**: `in_count`, `out_count`, `fan_in`, `fan_out`, `max_txn_10min`.
- **Flow & Dwell Features**: `pass_through_ratio` (ratio of outgoing to incoming funds), `median_dwell_minutes` (holding period before transfer).
- **Structuring & Nocturnal Signals**: `near_threshold_ratio` (% of transactions between ₹9,000 and ₹9,999), `night_txn_ratio` (% of transactions between 11 PM and 5 AM).
- **Graph & Device Topology**: `in_degree`, `out_degree`, `pagerank`, `clustering_coef`, `community_size`, `community_internal_flow_ratio`, `community_density`, `in_short_cycle`, `device_count`, `max_accounts_per_device`.

#### Calibrated XGBoost Risk Scorer (`scorer.py`)
- **Base Classifier**: `XGBClassifier` wrapped in `CalibratedClassifierCV` (isotonic/sigmoid) to ensure model outputs reflect true posterior probabilities.
- **Integer Risk Score**: Calibrated probability mapped to an integer from `0` to `100`.
- **Risk Bands**:
  - `0 – 40`: Low Risk (Clear)
  - `41 – 70`: Medium Risk (Caution)
  - `71 – 100`: High Risk (Flagged Mule)
- **Sub-5ms Latency**: Benchmarked single-account scoring latency of **4.29 ms**, well below the 200 ms SLA requirement.

#### Graph Intelligence & Ring Mining (`graph_engine.py`)
- **Seeded Louvain Community Detection**: Partitions the directed transaction network into dense payment communities.
- **Cycle Detection**: Identifies directed cycles of length 3 to 5 (money loops designed to wash stolen funds).
- **Device Bipartite Projections**: Flags accounts that co-occur across the same hardware identifiers.
- **Ring Archetype Recall**: Achieved **100% recall (25/25 ground truth rings detected)** across all 5 test archetypes.

#### Explainable AI & Gemini Assistant (`explainer.py`, `gemini.py`)
- **TreeSHAP Attributions**: Calculates exact Shapley values for tree models, isolating which features drove an account's score above the base value.
- **Deterministic Template Fallback**: Formats human-readable summaries without external API calls if the network or LLM is unavailable.
- **Google Gemini 2.5 / Flash Integration**: Transforms SHAP payloads into structured, legally defensible forensic briefs for investigating officers.

---

### 2. Production FastAPI Backend (`backend/`)

#### Clean ML/Backend Boundary Facade (`ml_bridge.py`)
Following strict hexagonal architecture guidelines (detailed in `backend/ARCHITECTURE.md`):
- **Only `app/services/ml_bridge.py`** imports the ML libraries (`scorer.py`, `features.py`, `explainer.py`).
- API route handlers **never** import ML code directly.
- Route handlers only interact with `ml_bridge.score_account_with_explanation()` or `ml_bridge.get_account_features()`. This allows ML models to be retrained or replaced without touching API contracts.

```
┌────────────────────────────────────────────────────────┐
│                      FastAPI Routes                    │
│    (transactions.py, upi_check.py, officer.py, chat.py)│
└───────────────────────────┬────────────────────────────┘
                            │ (Domain schemas only)
                            ▼
┌────────────────────────────────────────────────────────┐
│              app/services/ml_bridge.py                 │
│        (Isolates Pandas, XGBoost, SHAP, Gemini)        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│     ML Engine Modules        │ │   External Providers  │
│  (scorer, features, graph)   │ │    (Supabase, Gemini) │
└──────────────────────────────┘ └───────────────────────┘
```

#### Enterprise Supabase PostgreSQL Schema (`001_initial_schema.sql`)
A complete relational schema with 8 normalized tables:
1. `accounts`: Account metadata, age, KYC tier, status (`clear`, `flagged`, `on_hold`).
2. `devices`: Unique hardware fingerprint registry.
3. `account_devices`: Many-to-many temporal mapping with `first_seen_at` and `last_seen_at`.
4. `transactions`: Immutable transaction ledger with UUIDs, `numeric(18, 2)` currency precision, UTC timestamps, and idempotency keys.
5. `fraud_rings`: Identified syndicates, member account arrays, total flow, and detection method.
6. `risk_scores`: Historical scores, JSONB top feature attributions, model version, and schema hashes.
7. `graph_jobs`: Durable asynchronous job queue with leasing locks and exponential retry counters.
8. `hold_actions`: Statutory hold ledger enforcing a partial unique index (`one_active_hold_per_account`).

**Atomic Database Functions (RPCs)**:
- `place_hold_atomic()`: Validates account status, verifies no existing active hold exists, checks idempotency, and transitions account status in a single atomic transaction.
- `release_hold_atomic()`: Atomically releases an active hold, recording the officer ID, timestamp, and judicial reason.
- `lease_graph_jobs()`: Acquires pending jobs with a concurrency lease (`locked_until`), preventing duplicate worker execution.
- `process_expired_holds()`: Evaluates all holds where `hold_expiry <= now()` and status is `active`, marking them `expired` and returning account status to `clear`.

#### REST API Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Combined health, model readiness, and runtime metadata | No |
| `GET` | `/health/live` | Kubernetes/container liveness probe | No |
| `GET` | `/health/ready` | Readiness probe verifying loaded ML model & schema hash | No |
| `POST` | `/transactions/` | Ingests transaction, checks idempotency, queues graph job | Yes (when enabled) |
| `GET` | `/upi/check/{account_id}` | Fast-path synchronous citizen score & explanation | No |
| `POST` | `/actions/hold` | Places 60-day statutory hold (calls `place_hold_atomic`) | Officer / Admin |
| `POST` | `/actions/release/{action_id}` | Early judicial release (calls `release_hold_atomic`) | Officer / Admin |
| `GET` | `/actions/holds/expired` | Maintenance worker to release expired holds | Service Role / Admin |
| `POST` | `/chat/` | Natural language case investigation via Gemini LLM | Officer / Admin |

#### Durable Leased Graph Worker (`graph_worker.py`)
To prevent graph recomputation from blocking transaction ingestion:
- Transaction ingestion enqueues a row in `graph_jobs`.
- Background worker daemon (`python -m app.workers.run_graph_worker`) continuously polls `lease_graph_jobs()`.
- Claims batches using database leases (`locked_until`), processes graph neighborhood updates, and retries failures with bounded exponential backoff.

#### Data Ingestion & Migration Tooling
- `scripts/import_parquet_to_supabase.py`: High-throughput batch importer that loads accounts, devices, mappings, and transactions in foreign-key safe order with `--dry-run` validation support.
- `scripts/verify_artifact_manifest.py`: Cryptographically validates model weights and feature column definitions against `feature_schema_hash`.

---

### 3. Comprehensive Test Suite & Quality Verification

The `deepak-ml-work` branch includes 15 automated pytest test modules:
- `test_api.py`: Route contracts, status codes, and payload validation.
- `test_auth.py`: JWT validation, role-based access control, and bypass modes.
- `test_data_gen.py`: Statistical checks on simulated payment distributions.
- `test_features.py`: Feature mathematical logic and boundary conditions.
- `test_feature_pipeline.py`: End-to-end DataFrame feature transformations.
- `test_gemini.py`: Prompt construction, token trimming, and deterministic fallback.
- `test_graph_engine.py`: Louvain partitioning, cycle detection, and hub extraction.
- `test_graph_worker.py`: Lease acquisition, lock expiry, retry policies, and terminal failure states.
- `test_idempotency.py`: Re-submission of transactions and hold requests without duplicate side-effects.
- `test_migration_contract.py`: SQL schema syntax, foreign keys, and RPC signature verification.
- `test_model_loading.py`: Artifact loading, column order checks, and missing file handling.
- `test_observability.py`: Structured logging, request IDs, and latency headers.
- `test_ring_metrics.py`: Syndicate precision, recall, and detection metrics.
- `test_scoring.py`: Calibrated probability verification and score band mapping.
- `test_temporal_graph.py`: Strict validation that features do not leak future transactions.
- `test_training_contract.py`: Reproducibility check with pinned random seed.

---

### 4. CI/CD & Containerization

- **Dockerfile**: Multi-stage production container running Uvicorn with non-root security principles.
- **GitHub Actions Workflow (`.github/workflows/ci.yml`)**:
  - Python 3.11 linting and type verification.
  - Model artifact manifest verification.
  - Parquet data importer dry-run against fixture data.
  - Full pytest test suite execution.
  - Secret scanning to prevent committed API keys or credentials.

---

## 🏗️ System Architecture & Data Flow

```
                                      CITIZEN / OFFICER
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        Citizen UPI Check (/upi/check)                 Officer Command Center (/dashboard)
                     │                                                 │
                     └────────────────────────┬────────────────────────┘
                                              ▼
                             Next.js 15 Frontend (Port 3000)
                              (Rewrites: /api/backend/*)
                                              │
                                              ▼
                             FastAPI Backend (Port 8000)
                                              │
               ┌──────────────────────────────┼──────────────────────────────┐
               ▼                              ▼                              ▼
      Transaction Router               UPI Check Router               Officer Router
     (POST /transactions/)        (GET /upi/check/{id})             (POST /actions/hold)
               │                              │                              │
               ├──────────────────────┐       ├──────────────────────┐       ▼
               ▼                      ▼       ▼                      ▼   Supabase RPC
        Supabase DB              ML Bridge Facade              Gemini LLM (place_hold_atomic)
    (Insert transaction)       (Features + Scorer)        (Forensic Brief)   │
               │                      │                              │       ▼
               ▼                      ▼                              │  Hold Actions
          Graph Job             Calibrated XGBoost                   │  Table Updated
        Enqueued (DB)           (0-100 Risk Score)                   │
               │                      │                              │
               │                      └──────────────┬───────────────┘
               ▼                                     ▼
      Durable Graph Worker                 Aggregated Response
  (Louvain + Cycle Detection)              Returned to Frontend
```

---

## 🚀 Complete Installation & Setup Guide

### Prerequisites
- **Python**: Version 3.11+ (tested on Python 3.11 & 3.13)
- **Node.js**: Version 18+ (tested on Node 20 & 24)
- **Package Managers**: `pip` and `npm`
- **Database**: Supabase account (or local PostgreSQL with `pgcrypto`)
- **API Key**: Google Gemini API key (for AI case explanation)

---

### Running the Backend & ML Engine (`deepak-ml-work`)

1. **Clone and checkout the backend branch**:
   ```bash
   git clone https://github.com/ShashwatSingh-Stud/Dhanova.git
   cd Dhanova
   git checkout deepak-ml-work
   ```

2. **Set up Python Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Configure Environment Variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Supabase credentials and Gemini API key
   ```

5. **Apply Database Migrations**:
   Execute `backend/migrations/001_initial_schema.sql` inside your Supabase project's SQL editor or via Supabase CLI.

6. **Generate Data & Train ML Models (Optional if artifacts exist)**:
   ```bash
   python scripts/train.py
   ```

7. **Start the FastAPI Backend Server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
   Verify readiness at [http://127.0.0.1:8000/health/ready](http://127.0.0.1:8000/health/ready).

8. **Start the Asynchronous Graph Worker (In a separate terminal)**:
   ```bash
   cd backend
   python -m app.workers.run_graph_worker
   ```

---

### Running the Next.js Frontend (`main`)

1. **Checkout the frontend branch** (or work in a cloned workspace):
   ```bash
   git checkout main
   cd frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create `frontend/.env.local`:
   ```env
   BACKEND_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_API_URL=/api/backend
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```

5. **Open the Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
   - **Citizen Check**: [http://localhost:3000/upi/check](http://localhost:3000/upi/check)
   - **Command Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Ring Intelligence Canvas**: [http://localhost:3000/rings](http://localhost:3000/rings)
   - **Statutory Holds Manager**: [http://localhost:3000/holds](http://localhost:3000/holds)

---

### Environment Variables Reference

#### Backend (`backend/.env`)
| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase project HTTPS URL | `https://your-project.supabase.co` | Yes |
| `SUPABASE_KEY` | Supabase service-role or anon key | `your-supabase-key` | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI chat & briefs | `your-gemini-key` | Optional (falls back to template) |
| `MODEL_DIR` | Filesystem path to trained model directory | `models/` | Yes |
| `AUTH_REQUIRED` | Enforces Supabase JWT authentication | `false` (local dev) | Yes (`true`) |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000,http://127.0.0.1:3000` | Yes |

#### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_URL` | Target FastAPI backend URL for server rewrites | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_API_URL` | Client-side API route prefix | `/api/backend` |

---

## 📊 Model Performance & Evaluation Benchmark

All evaluation metrics are documented in `reports/metrics.json` and computed across strict temporal splits:

### Model Comparison Benchmark
| Model / Pipeline | Precision @ 50 | Recall | PR-AUC | ROC-AUC | F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Simple Rule-Based** | 1.000 | 0.061 | — | — | 0.115 |
| **Isolation Forest** | 0.474 | 0.551 | — | — | 0.509 |
| **XGBoost (Without Graph Features)** | 0.700 | 0.727 | 0.728 | 0.968 | 0.713 |
| **Dhanova XGBoost (With Graph Features)** | **0.780** | **0.796** | **0.806** | **0.992** | **0.750** |

*Note: Adding graph topological features (PageRank, clustering coefficient, short cycle indicators) yielded an **+8.0% boost in Precision** and an **+7.8% boost in PR-AUC**.*

### Fraud Ring Detection Benchmark
| Syndicate Archetype | Ground Truth Rings | Detected Rings | Recall | Archetype Status |
| :--- | :--- | :--- | :--- | :--- |
| **Burst Mule Structuring** | 5 | 5 | **100%** | ✅ Fully Detected |
| **Circular Layering Loops** | 5 | 5 | **100%** | ✅ Fully Detected |
| **Hardware Device Farms** | 4 | 4 | **100%** | ✅ Fully Detected |
| **Fan-in Collector Hubs** | 5 | 5 | **100%** | ✅ Fully Detected |
| **Fan-out Dispersal Hubs** | 6 | 6 | **100%** | ✅ Fully Detected |
| **Total Syndicate Metrics** | **25** | **25** | **100.0%** | **Perfect Ring Recall** |

### Single-Account Inference Latency
- Mean Scoring Latency: **4.29 milliseconds** (Exceeds SLA requirements by over 40x).

---

## ⚖️ Statutory Compliance & Legal Guardrails

Dhanova is engineered to adhere strictly to Indian banking and criminal procedure statutes:

1. **RBI 2026 Statutory 60-Day Hold Standard**:
   - Accounts are placed on hold for a strictly bounded 60-calendar-day window.
   - Automatic expiration tracking releases frozen funds if law enforcement does not formally submit charges within the statutory timeframe.
2. **Defensible Evidentiary Trail**:
   - Every score includes a cryptographic `feature_schema_hash` and pinned `model_version`.
   - TreeSHAP feature attributions provide human-interpretable reasons admissible in judicial proceedings.
3. **Data Protection & PII Minimization**:
   - Raw account holder names and Aadhaar/PAN details are never fed to LLM prompts.
   - The citizen UPI endpoint returns minimal risk indicators without exposing private financial history.

---

## 📂 Project Directory Map

```
Dhanova/
├── .github/
│   └── workflows/
│       └── ci.yml                     # [deepak-ml-work] GitHub Actions CI workflow
├── backend/                           # [deepak-ml-work] Production FastAPI Backend
│   ├── app/
│   │   ├── core/                      # Configuration & settings management
│   │   │   └── config.py
│   │   ├── db/                        # Supabase client wrapper & RPC helpers
│   │   │   └── supabase.py
│   │   ├── routes/                    # API route controllers
│   │   │   ├── chat.py                # Gemini LLM case chat endpoint
│   │   │   ├── officer.py             # Statutory hold & release actions
│   │   │   ├── transactions.py        # Transaction ingestion with idempotency
│   │   │   └── upi_check.py           # Synchronous citizen check endpoint
│   │   ├── schemas/                   # Pydantic v2 domain schemas
│   │   │   └── domain.py
│   │   ├── services/                  # Business logic & boundaries
│   │   │   ├── feature_pipeline.py    # Temporal feature pipeline service
│   │   │   ├── gemini.py              # Google GenAI client with fallback
│   │   │   └── ml_bridge.py           # Hexagonal facade isolating ML logic
│   │   ├── workers/                   # Background asynchronous services
│   │   │   ├── graph_worker.py        # Leased queue consumer
│   │   │   └── run_graph_worker.py    # Worker daemon CLI entrypoint
│   │   ├── auth.py                    # JWT authentication & RBAC roles
│   │   ├── data_gen.py                # Realistic Indian UPI payment simulator
│   │   ├── explainer.py               # TreeSHAP explainer & template formatter
│   │   ├── features.py                # Point-in-time temporal feature computation
│   │   ├── graph_engine.py            # Louvain, cycle & graph mining engine
│   │   ├── main.py                    # FastAPI application initialization
│   │   ├── middleware.py              # Request logging & correlation tracking
│   │   ├── scorer.py                  # Calibrated XGBoost risk model wrapper
│   │   └── test_*.py                  # 15 automated pytest test modules
│   ├── migrations/
│   │   └── 001_initial_schema.sql     # Supabase PostgreSQL schema with 8 tables & RPCs
│   ├── ARCHITECTURE.md                # Backend/ML boundary documentation
│   ├── IMPLEMENTATION_SUMMARY.md      # Summary of backend phases 0-6
│   ├── README.md                      # Backend setup and API documentation
│   └── requirements.txt               # Backend Python dependencies
├── frontend/                          # [main] Next.js 15 Cyber Crime Intelligence Portal
│   ├── src/
│   │   ├── app/
│   │   │   ├── accounts/[id]/page.tsx # Account Forensic Dossier & SHAP charts
│   │   │   ├── dashboard/page.tsx     # Officer Command Dashboard
│   │   │   ├── holds/page.tsx         # RBI 60-Day Statutory Hold Management
│   │   │   ├── rings/page.tsx         # Fraud Ring Graph Intelligence Canvas
│   │   │   ├── upi/check/page.tsx     # Citizen UPI Pre-Transaction Check
│   │   │   ├── layout.tsx             # Root layout with Officer Context
│   │   │   └── page.tsx               # Redirect to dashboard
│   │   ├── components/
│   │   │   ├── account/               # RiskGauge, ShapChart, CaseChatDrawer
│   │   │   ├── dashboard/             # OfficerDashboardComponent
│   │   │   ├── holds/                 # HoldManagementComponent
│   │   │   ├── layout/                # Navbar (Officer Switcher), Footer
│   │   │   ├── rings/                 # Interactive SVG RingGraphComponent
│   │   │   ├── ui/                    # Button, Badge, Card, Modal, Input
│   │   │   └── upi/                   # CitizenCheckComponent
│   │   ├── lib/
│   │   │   ├── api.ts                 # Hybrid API client (Live + Mock fallback)
│   │   │   ├── mockData.ts            # Schema-identical demonstration data
│   │   │   ├── officerContext.tsx     # Officer identity provider
│   │   │   └── utils.ts               # Formatting helpers & class mergers
│   │   └── types/
│   │       └── account.ts             # TypeScript definitions matching domain schemas
│   ├── next.config.ts                 # Turbopack & /api/backend/ proxy rewrites
│   ├── package.json                   # Next.js 15 & Tailwind CSS dependencies
│   ├── postcss.config.mjs
│   └── tsconfig.json
├── docs/                              # Project Architecture & Specification Docs
│   ├── FRONTEND_SCOPE.md              # Frontend integration contract
│   ├── ML_HANDOFF.md                  # Machine learning handoff specifications
│   ├── OPERATIONS.md                  # Runbooks, monitoring, and failure modes
│   ├── RELEASE.md                     # Model versioning and release protocol
│   └── SIM_SPEC.md                    # Simulation specifications & archetypes
├── models/                            # Versioned Model Artifacts
│   ├── feature_columns.json           # Pinned list of 22 model features
│   └── model_version.txt              # Model version identifier (1.0)
├── reports/                           # Model Evaluation Artifacts
│   ├── feature_importance.png         # XGBoost feature importance plot
│   ├── metrics.json                   # Complete evaluation benchmark results
│   ├── pr_curve.png                   # Precision-Recall curve
│   └── shap_summary.png               # TreeSHAP summary visualization
├── scripts/                           # Tooling & Maintenance Scripts
│   ├── create_ci_fixture.py           # Generates CI parquet fixtures
│   ├── import_parquet_to_supabase.py  # High-throughput batch database loader
│   ├── train.py                       # End-to-end model training script
│   └── verify_artifact_manifest.py    # Cryptographic model artifact verifier
├── Dockerfile                         # Production container definition
├── CLAUDE.md                          # Repository instructions & commands
└── README.md                          # Master Project Documentation (This file)
```

---

## 👥 Contributors & Acknowledgements

- **Dhanova Project Team**: Developed for the **MPOnline Idea & Innovation Hackathon 2026**.
- **Special Thanks**: Dedicated to public service officers across the Madhya Pradesh Cyber Crime Cell, Delhi Police IFSO, Maharashtra Cyber, and cybercrime defense units nationwide safeguarding India's digital economy.
