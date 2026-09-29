-- Dhanova initial Supabase schema.
-- Apply with Supabase CLI or the SQL editor using a service-role migration.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
    account_id text primary key,
    holder_name text not null,
    bank_name text not null,
    account_age_days integer not null check (account_age_days >= 0),
    kyc_level text not null,
    status text not null default 'clear' check (status in ('clear', 'flagged', 'on_hold')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.devices (
    device_id text primary key,
    device_fingerprint text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists public.account_devices (
    account_id text not null references public.accounts(account_id) on delete cascade,
    device_id text not null references public.devices(device_id) on delete cascade,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    primary key (account_id, device_id)
);

create table if not exists public.transactions (
    txn_id uuid primary key,
    idempotency_key text unique,
    sender_account_id text not null references public.accounts(account_id),
    receiver_account_id text not null references public.accounts(account_id),
    amount numeric(18, 2) not null check (amount > 0),
    channel text not null,
    device_id text references public.devices(device_id),
    timestamp timestamptz not null,
    created_at timestamptz not null default now(),
    check (sender_account_id <> receiver_account_id)
);

create table if not exists public.fraud_rings (
    ring_id text primary key,
    member_account_ids text[] not null,
    total_flow_amount numeric(18, 2) not null default 0,
    detection_method text not null,
    detected_at timestamptz not null default now()
);

create table if not exists public.risk_scores (
    score_id uuid primary key default gen_random_uuid(),
    account_id text not null references public.accounts(account_id) on delete cascade,
    score integer not null check (score between 0 and 100),
    top_features jsonb not null default '{}'::jsonb,
    explanation_text text,
    ring_id text references public.fraud_rings(ring_id),
    as_of timestamptz,
    model_version text not null,
    feature_schema_hash text,
    computed_at timestamptz not null default now()
);

create table if not exists public.graph_jobs (
    job_id uuid primary key default gen_random_uuid(),
    txn_id uuid not null references public.transactions(txn_id) on delete cascade,
    dedupe_key text not null unique,
    status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed')),
    attempts integer not null default 0,
    available_at timestamptz not null default now(),
    locked_until timestamptz,
    last_error text,
    created_at timestamptz not null default now()
);

create table if not exists public.hold_actions (
    action_id uuid primary key,
    account_id text not null references public.accounts(account_id) on delete cascade,
    officer_id text not null,
    reason text not null check (length(trim(reason)) > 0),
    hold_start timestamptz not null,
    hold_expiry timestamptz not null,
    status text not null default 'active' check (status in ('active', 'released', 'expired')),
    created_at timestamptz not null default now()
);

create unique index if not exists one_active_hold_per_account
    on public.hold_actions(account_id) where status = 'active';
create index if not exists transactions_timestamp_idx on public.transactions(timestamp);
create index if not exists transactions_sender_idx on public.transactions(sender_account_id);
create index if not exists transactions_receiver_idx on public.transactions(receiver_account_id);
create index if not exists risk_scores_latest_idx on public.risk_scores(account_id, computed_at desc);
create index if not exists hold_actions_expiry_idx on public.hold_actions(status, hold_expiry);

-- Enable RLS; service-role jobs bypass these policies.
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.risk_scores enable row level security;
alter table public.hold_actions enable row level security;

create or replace function public.place_hold_atomic(
    p_account_id text,
    p_officer_id text,
    p_reason text,
    p_action_id uuid,
    p_hold_start timestamptz,
    p_hold_expiry timestamptz
) returns public.hold_actions
language plpgsql security definer set search_path = public as $$
declare result_row public.hold_actions;
begin
    perform 1 from public.accounts where account_id = p_account_id for update;
    if not found then raise exception 'account_not_found'; end if;
    if exists (select 1 from public.hold_actions where account_id = p_account_id and status = 'active') then
        raise exception 'active_hold_exists';
    end if;
    insert into public.hold_actions(action_id, account_id, officer_id, reason, hold_start, hold_expiry, status)
    values (p_action_id, p_account_id, p_officer_id, p_reason, p_hold_start, p_hold_expiry, 'active')
    returning * into result_row;
    update public.accounts set status = 'on_hold', updated_at = now() where account_id = p_account_id;
    return result_row;
end;
$$;

create or replace function public.release_hold_atomic(p_action_id uuid)
returns public.hold_actions
language plpgsql security definer set search_path = public as $$
declare result_row public.hold_actions;
begin
    update public.hold_actions set status = 'released'
    where action_id = p_action_id and status = 'active'
    returning * into result_row;
    if not found then return null; end if;
    perform 1 from public.accounts where account_id = result_row.account_id for update;
    if not exists (select 1 from public.hold_actions where account_id = result_row.account_id and status = 'active') then
        update public.accounts set status = 'clear', updated_at = now() where account_id = result_row.account_id;
    end if;
    return result_row;
end;
$$;

create or replace function public.expire_hold_atomic(p_action_id uuid)
returns public.hold_actions
language plpgsql security definer set search_path = public as $$
declare result_row public.hold_actions;
begin
    update public.hold_actions set status = 'expired'
    where action_id = p_action_id and status = 'active' and hold_expiry <= now()
    returning * into result_row;
    if not found then return null; end if;
    perform 1 from public.accounts where account_id = result_row.account_id for update;
    if not exists (select 1 from public.hold_actions where account_id = result_row.account_id and status = 'active') then
        update public.accounts set status = 'clear', updated_at = now() where account_id = result_row.account_id;
    end if;
    return result_row;
end;
$$;
