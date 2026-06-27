/**
 * Typed API client for the Sentinel backend.
 * All functions are async and throw on non-2xx responses.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  total_workflows: number;
  completed_workflows: number;
  failed_workflows: number;
  running_workflows: number;
  success_rate: number;
  avg_mttr_seconds: number;
  total_findings: number;
  total_fixed: number;
  open_prs: number;
}

export interface Workflow {
  id: string;
  repo_url: string;
  branch: string;
  commit_sha: string;
  triggered_by: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  report_path: string | null;
  pr_url: string | null;
  total_findings: number;
  total_remediated: number;
  validation_passed: boolean | null;
  remediation_attempts: number;
}

export interface WorkflowsResponse {
  total: number;
  limit: number;
  offset: number;
  workflows: Workflow[];
}

export interface Vulnerability {
  id: number;
  workflow_id: string;
  ecosystem: string;
  package: string;
  severity: string;
  cve: string;
  cwe: string;
  overview: string;
  vulnerable_version: string;
  patched_version: string;
  recommendation: string;
  file_path: string;
  line_number: number;
  rule_id: string;
  created_at: string | null;
}

export interface VulnerabilitiesResponse {
  limit: number;
  offset: number;
  vulnerabilities: Vulnerability[];
}

export interface PullRequest {
  id: number;
  workflow_id: string;
  pr_url: string;
  pr_number: number | null;
  branch: string;
  base_branch: string;
  status: string;
  created_at: string | null;
}

export interface PullRequestsResponse {
  limit: number;
  offset: number;
  pull_requests: PullRequest[];
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const getDashboardMetrics = () =>
  get<DashboardMetrics>('/api/dashboard/metrics');

export const getWorkflows = (limit = 50, offset = 0, status?: string, triggered_by?: string) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) params.set('status', status);
  if (triggered_by) params.set('triggered_by', triggered_by);
  return get<WorkflowsResponse>(`/api/dashboard/workflows?${params}`);
};

export const getWorkflowById = (id: string) =>
  get<Workflow & {
    findings: Vulnerability[];
    analyses: unknown[];
    validations: unknown[];
    pull_requests: unknown[];
  }>(`/api/dashboard/workflows/${id}`);

export const getVulnerabilities = (limit = 100, offset = 0, severity?: string, ecosystem?: string) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (severity) params.set('severity', severity);
  if (ecosystem) params.set('ecosystem', ecosystem);
  return get<VulnerabilitiesResponse>(`/api/dashboard/vulnerabilities?${params}`);
};

export const getPullRequests = (limit = 50, offset = 0) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return get<PullRequestsResponse>(`/api/dashboard/pull-requests?${params}`);
};

// ── Scheduler types ────────────────────────────────────────────────────────

export interface ScheduledRepoRecord {
  id: number;
  repo_url: string;
  branch: string;
  label: string;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ScheduledRepoWithStatus extends ScheduledRepoRecord {
  job_id: string;
  next_run: string | null;
  trigger: string | null;
  last_scan: Workflow | null;
}

export interface SchedulerConfigRecord {
  id: number;
  trigger_mode: 'interval' | 'cron';
  interval_minutes: number;
  cron_expr: string | null;
  enabled: boolean;
  updated_at: string | null;
}

export interface SchedulerStatus {
  running: boolean;
  config: SchedulerConfigRecord;
  repos: ScheduledRepoWithStatus[];
}

export interface SchedulerHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  workflows: Workflow[];
}

export interface RepoCreatePayload {
  repo_url: string;
  branch?: string;
  label?: string;
}

export interface RepoUpdatePayload {
  repo_url?: string;
  branch?: string;
  label?: string;
  enabled?: boolean;
}

export interface ConfigUpdatePayload {
  trigger_mode?: 'interval' | 'cron';
  interval_minutes?: number;
  cron_expr?: string | null;
  enabled?: boolean;
}

// ── Scheduler endpoints ────────────────────────────────────────────────────

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
}

export const getSchedulerStatus = () =>
  get<SchedulerStatus>('/api/scheduler/status');

export const getScheduledRepos = () =>
  get<{ repos: ScheduledRepoRecord[] }>('/api/scheduler/repos');

export const createScheduledRepo = (body: RepoCreatePayload) =>
  post<ScheduledRepoRecord>('/api/scheduler/repos', body);

export const updateScheduledRepo = (id: number, body: RepoUpdatePayload) =>
  put<ScheduledRepoRecord>(`/api/scheduler/repos/${id}`, body);

export const deleteScheduledRepo = (id: number) =>
  del(`/api/scheduler/repos/${id}`);

export const triggerRepoScan = (id: number) =>
  post<{ status: string; repo_id: number; repo_url: string }>(`/api/scheduler/repos/${id}/scan`);

export const getSchedulerConfig = () =>
  get<SchedulerConfigRecord>('/api/scheduler/config');

export const updateSchedulerConfig = (body: ConfigUpdatePayload) =>
  put<SchedulerConfigRecord>('/api/scheduler/config', body);

export const getSchedulerHistory = (limit = 50, offset = 0) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return get<SchedulerHistoryResponse>(`/api/scheduler/history?${params}`);
};

// ── Webhook event types ────────────────────────────────────────────────────

export interface WebhookEvent {
  id: number;
  delivery_id: string | null;
  event_type: string;
  repo_url: string;
  repo_name: string;
  branch: string;
  commit_sha: string;
  pusher: string;
  status: 'accepted' | 'ignored' | 'failed';
  reason: string | null;
  workflow_id: string | null;
  received_at: string | null;
}

export interface WebhookEventsResponse {
  total: number;
  limit: number;
  offset: number;
  events: WebhookEvent[];
}

export interface WebhookStats {
  total: number;
  accepted: number;
  ignored: number;
  failed: number;
}

// ── Webhook endpoints ──────────────────────────────────────────────────────

export const getWebhookEvents = (limit = 50, offset = 0, status?: string) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) params.set('status', status);
  return get<WebhookEventsResponse>(`/api/webhooks/events?${params}`);
};

export const getWebhookStats = () =>
  get<WebhookStats>('/api/webhooks/stats');

export const WEBHOOK_STREAM_URL = `${typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') : ''}/api/webhooks/stream`;

// ── Workflow actions ───────────────────────────────────────────────────────

export interface RerunResponse {
  status: string;
  new_workflow_id: string;
  source_workflow_id: string;
}

export const rerunWorkflow = (id: string) =>
  post<RerunResponse>(`/api/workflow/${id}/rerun`);
