-- Target PostgreSQL schema. Do not run until production identity, verifier, and retention rules are approved.
CREATE TYPE provider_availability AS ENUM ('planned', 'template_pending', 'ready', 'degraded', 'disabled');
CREATE TYPE proof_status AS ENUM ('created', 'awaiting_user', 'awaiting_extension', 'generating', 'submitted', 'verifying', 'verified', 'rejected', 'expired', 'cancelled', 'failed');

CREATE TABLE users (
  id uuid PRIMARY KEY,
  external_subject text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE developer_projects (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  allowed_origins text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX developer_projects_owner_idx ON developer_projects(owner_user_id);
CREATE TABLE developer_api_keys (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES developer_projects(id),
  key_prefix text NOT NULL UNIQUE,
  key_hash bytea NOT NULL,
  scopes text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX developer_api_keys_project_idx ON developer_api_keys(project_id);
CREATE TABLE provider_definitions (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text NOT NULL,
  availability provider_availability NOT NULL DEFAULT 'template_pending',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE proof_templates (
  id uuid PRIMARY KEY,
  provider_id text NOT NULL REFERENCES provider_definitions(id),
  claim_id text NOT NULL,
  primus_template_id uuid NOT NULL,
  version text NOT NULL,
  adapter text NOT NULL CHECK (adapter IN ('enterprise', 'network')),
  status text NOT NULL CHECK (status IN ('draft', 'testing', 'active', 'disabled')),
  disclosed_fields text[] NOT NULL,
  supported_conditions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, claim_id, version)
);
CREATE INDEX proof_templates_active_idx ON proof_templates(provider_id, claim_id) WHERE status = 'active';
CREATE TABLE proof_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  provider_id text NOT NULL REFERENCES provider_definitions(id),
  template_id uuid NOT NULL REFERENCES proof_templates(id),
  claim_id text NOT NULL,
  nonce_hash bytea NOT NULL UNIQUE,
  recipient text NOT NULL,
  status proof_status NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  idempotency_key_hash bytea NOT NULL,
  UNIQUE (user_id, idempotency_key_hash),
  CHECK (expires_at > created_at)
);
CREATE INDEX proof_sessions_user_created_idx ON proof_sessions(user_id, created_at DESC);
CREATE INDEX proof_sessions_expiry_idx ON proof_sessions(expires_at) WHERE consumed_at IS NULL;
CREATE TABLE attestation_records (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE REFERENCES proof_sessions(id),
  digest bytea NOT NULL UNIQUE,
  encrypted_payload bytea,
  verification_summary jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  delete_after timestamptz NOT NULL
);
CREATE INDEX attestation_records_retention_idx ON attestation_records(delete_after);
CREATE TABLE webhook_endpoints (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES developer_projects(id),
  url text NOT NULL,
  secret_ciphertext bytea NOT NULL,
  secret_key_version text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webhook_endpoints_project_idx ON webhook_endpoints(project_id);
CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY,
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id),
  event_id uuid NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endpoint_id, event_id)
);
CREATE INDEX webhook_deliveries_retry_idx ON webhook_deliveries(next_attempt_at) WHERE status = 'pending';
CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id),
  project_id uuid REFERENCES developer_projects(id),
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  delete_after timestamptz NOT NULL
);
CREATE INDEX audit_events_retention_idx ON audit_events(delete_after);
