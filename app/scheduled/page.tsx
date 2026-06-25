'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Button,
  DataTable,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  Grid,
  Column,
  Tile,
  InlineLoading,
  InlineNotification,
  Modal,
  TextInput,
  NumberInput,
  RadioButtonGroup,
  RadioButton,
  Toggle,
  OverflowMenu,
  OverflowMenuItem,
} from '@carbon/react';
import {
  Add,
  CheckmarkFilled,
  InProgress,
  WarningAlt,
  Time,
  Renew,
  Chemistry,
  Play,
  Pause,
  Flash,
  Settings,
} from '@carbon/icons-react';
import {
  getSchedulerStatus,
  getSchedulerHistory,
  createScheduledRepo,
  updateScheduledRepo,
  deleteScheduledRepo,
  triggerRepoScan,
  updateSchedulerConfig,
  type SchedulerStatus,
  type ScheduledRepoWithStatus,
  type SchedulerConfigRecord,
  type Workflow,
} from '@/lib/api';

// ── Time helpers ──────────────────────────────────────────────────────────

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const past = ms < 0;
  if (abs < 60_000) return 'just now';
  const mins = Math.floor(abs / 60_000);
  const hrs = Math.floor(abs / 3_600_000);
  const days = Math.floor(abs / 86_400_000);
  let label: string;
  if (mins < 60) label = `${mins}m`;
  else if (hrs < 24) label = `${hrs}h ${mins % 60}m`;
  else label = `${days}d ${hrs % 24}h`;
  return past ? `${label} ago` : `in ${label}`;
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = Math.round((end.getTime() - new Date(startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'completed': return <Tag type="green" size="sm" renderIcon={CheckmarkFilled}>Completed</Tag>;
    case 'running':   return <Tag type="blue"  size="sm" renderIcon={InProgress}>Running</Tag>;
    case 'failed':    return <Tag type="red"   size="sm" renderIcon={WarningAlt}>Failed</Tag>;
    default:          return <Tag size="sm">Unknown</Tag>;
  }
};

// ── Add / Edit Repo Modal ─────────────────────────────────────────────────

interface RepoFormState {
  repo_url: string;
  branch: string;
  label: string;
}

interface RepoModalProps {
  open: boolean;
  editing: ScheduledRepoWithStatus | null;
  onClose: () => void;
  onSaved: () => void;
}

function RepoModal({ open, editing, onClose, onSaved }: RepoModalProps) {
  const [form, setForm] = useState<RepoFormState>({ repo_url: '', branch: 'main', label: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { repo_url: editing.repo_url, branch: editing.branch, label: editing.label }
        : { repo_url: '', branch: 'main', label: '' }
      );
      setError(null);
    }
  }, [open, editing]);

  const handleUrlBlur = () => {
    if (!form.label && form.repo_url) {
      setForm((f) => ({ ...f, label: form.repo_url.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '') }));
    }
  };

  const handleSave = async () => {
    if (!form.repo_url.trim()) { setError('Repository URL is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const label = form.label.trim() || form.repo_url;
      if (editing) {
        await updateScheduledRepo(editing.id, { repo_url: form.repo_url.trim(), branch: form.branch.trim() || 'main', label });
      } else {
        await createScheduledRepo({ repo_url: form.repo_url.trim(), branch: form.branch.trim() || 'main', label });
      }
      onSaved();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading={editing ? 'Edit Repository' : 'Add Repository'}
      primaryButtonText={saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Repository')}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={saving}
      onRequestSubmit={handleSave}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
        {error && (
          <InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton lowContrast />
        )}
        <TextInput
          id="repo-url"
          labelText="Repository URL"
          placeholder="https://github.com/owner/repo"
          value={form.repo_url}
          onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))}
          onBlur={handleUrlBlur}
          invalid={!!error && !form.repo_url.trim()}
          invalidText="Repository URL is required"
        />
        <TextInput
          id="repo-branch"
          labelText="Branch"
          placeholder="main"
          value={form.branch}
          onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          helperText="Leave blank to use 'main'"
        />
        <TextInput
          id="repo-label"
          labelText="Label (display name)"
          placeholder="Auto-filled from URL"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          helperText="Optional — defaults to the repository URL"
        />
      </div>
    </Modal>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  repo: ScheduledRepoWithStatus | null;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteModal({ open, repo, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) setError(null); }, [open]);

  const handleDelete = async () => {
    if (!repo) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteScheduledRepo(repo.id);
      onDeleted();
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      danger
      modalHeading="Remove Repository"
      primaryButtonText={deleting ? 'Removing…' : 'Remove'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={deleting}
      onRequestSubmit={handleDelete}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
    >
      <div style={{ paddingTop: '0.5rem' }}>
        {error && (
          <InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton lowContrast style={{ marginBottom: '1rem' }} />
        )}
        <p style={{ color: 'var(--cds-text-primary)', marginBottom: '0.5rem' }}>
          Remove <strong>{repo?.label}</strong> from scheduled monitoring?
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          The repository will no longer be scanned automatically. Existing scan history is preserved.
        </p>
      </div>
    </Modal>
  );
}

// ── Schedule Config Modal ─────────────────────────────────────────────────

interface ConfigModalProps {
  open: boolean;
  config: SchedulerConfigRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function ConfigModal({ open, config, onClose, onSaved }: ConfigModalProps) {
  const [mode, setMode] = useState<'interval' | 'cron'>('interval');
  const [intervalDays, setIntervalDays] = useState(1);
  const [cron, setCron] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && config) {
      setMode(config.trigger_mode);
      // Convert stored minutes → days (round up to at least 1 day)
      setIntervalDays(Math.max(1, Math.round((config.interval_minutes ?? 1440) / 1440)));
      setCron(config.cron_expr ?? '');
      setEnabled(config.enabled);
      setError(null);
    }
  }, [open, config]);

  const handleSave = async () => {
    if (mode === 'cron' && !cron.trim()) { setError('Cron expression is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateSchedulerConfig({
        trigger_mode: mode,
        // Convert days → minutes for backend storage
        interval_minutes: mode === 'interval' ? intervalDays * 1440 : undefined,
        cron_expr: mode === 'cron' ? cron.trim() : null,
        enabled,
      });
      onSaved();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Scan Schedule Configuration"
      primaryButtonText={saving ? 'Saving…' : 'Save Configuration'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={saving}
      onRequestSubmit={handleSave}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem' }}>
        {error && (
          <InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton lowContrast />
        )}

        <Toggle
          id="scheduler-enabled"
          labelText="Scheduler enabled"
          toggled={enabled}
          onToggle={(v) => setEnabled(v)}
          labelA="Disabled"
          labelB="Enabled"
        />

        <RadioButtonGroup
          legendText="Trigger mode"
          name="trigger-mode"
          valueSelected={mode}
          onChange={(v) => setMode(v as 'interval' | 'cron')}
        >
          <RadioButton id="mode-interval" labelText="Fixed interval" value="interval" />
          <RadioButton id="mode-cron" labelText="Cron expression" value="cron" />
        </RadioButtonGroup>

        {mode === 'interval' ? (
          <NumberInput
            id="interval-days"
            label="Scan every (days)"
            min={1}
            max={365}
            value={intervalDays}
            onChange={(_e, { value }) => setIntervalDays(Math.max(1, Number(value)))}
            helperText="How many days between automatic scans. Minimum 1 day."
          />
        ) : (
          <TextInput
            id="cron-expr"
            labelText="Cron expression (UTC)"
            placeholder="0 2 * * *"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            helperText={'5-field UTC cron: minute hour day month weekday — e.g. "0 2 * * *" = 02:00 daily'}
            invalid={!!error && mode === 'cron' && !cron.trim()}
            invalidText="Cron expression is required"
          />
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ScheduledPage() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [history, setHistory] = useState<Workflow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<ScheduledRepoWithStatus | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState<ScheduledRepoWithStatus | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Scan-now feedback per repo
  const [scanningIds, setScanningIds] = useState<Set<number>>(new Set());

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([getSchedulerStatus(), getSchedulerHistory(20)]);
      setStatus(s);
      setHistory(h.workflows);
      setHistoryTotal(h.total);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScanNow = async (repo: ScheduledRepoWithStatus) => {
    setScanningIds((s) => new Set(s).add(repo.id));
    try {
      await triggerRepoScan(repo.id);
      showToast('success', `Scan triggered for ${repo.label}`);
      setTimeout(() => load(true), 2000);
    } catch (err) {
      showToast('error', String(err));
    } finally {
      setScanningIds((s) => { const n = new Set(s); n.delete(repo.id); return n; });
    }
  };

  const handleToggleEnabled = async (repo: ScheduledRepoWithStatus) => {
    try {
      await updateScheduledRepo(repo.id, { enabled: !repo.enabled });
      showToast('success', `${repo.label} ${!repo.enabled ? 'enabled' : 'disabled'}`);
      load(true);
    } catch (err) {
      showToast('error', String(err));
    }
  };

  const repos = status?.repos ?? [];
  const config = status?.config ?? null;

  const summaryCards = [
    {
      label: 'Scheduler',
      value: status ? (status.running ? 'Running' : 'Stopped') : '—',
      color: status?.running ? 'var(--cds-support-success)' : 'var(--cds-support-warning)',
    },
    { label: 'Monitored Repos', value: repos.length },
    {
      label: 'Schedule',
      value: config
        ? config.trigger_mode === 'cron'
          ? `Cron: ${config.cron_expr}`
          : `Every ${Math.max(1, Math.round(config.interval_minutes / 1440))}d`
        : '—',
    },
    { label: 'Scheduled Runs', value: historyTotal },
  ];

  const historyHeaders = [
    { key: 'repo',     header: 'Repository' },
    { key: 'branch',   header: 'Branch' },
    { key: 'started',  header: 'Started' },
    { key: 'duration', header: 'Duration' },
    { key: 'findings', header: 'Fixed / Found' },
    { key: 'status',   header: 'Status' },
  ];

  const historyRows = history.map((wf) => ({
    id: wf.id,
    repo:     wf.repo_url.replace('https://github.com/', ''),
    branch:   wf.branch,
    started:  formatAbsolute(wf.started_at),
    duration: formatDuration(wf.started_at, wf.completed_at),
    findings: `${wf.total_remediated}/${wf.total_findings}`,
    status:   wf.status,
  }));

  return (
    <div style={{ padding: '2rem' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, minWidth: '320px' }}>
          <InlineNotification
            kind={toast.kind}
            title={toast.kind === 'success' ? 'Success' : 'Error'}
            subtitle={toast.text}
            onCloseButtonClick={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
            Scheduled Monitoring
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Manage repositories for periodic automated security scanning
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button kind="ghost" size="md" renderIcon={Settings} onClick={() => setConfigModalOpen(true)}>
            Schedule Config
          </Button>
          <Button kind="secondary" size="md" renderIcon={Renew} onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button kind="primary" size="md" renderIcon={Add} onClick={() => { setEditingRepo(null); setRepoModalOpen(true); }}>
            Add Repository
          </Button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <InlineLoading description="Loading scheduler status…" />
        </div>
      )}

      {error && (
        <InlineNotification kind="error" title="Could not load scheduler" subtitle={error} hideCloseButton style={{ marginBottom: '1.5rem' }} />
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <Grid narrow style={{ marginBottom: '2rem' }}>
            {summaryCards.map((card, i) => (
              <Column key={i} sm={4} md={2} lg={4}>
                <Tile style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <div style={{
                    fontSize: typeof card.value === 'string' && card.value.length > 10 ? '0.875rem' : '2rem',
                    fontWeight: 600,
                    color: (card as { color?: string }).color ?? 'var(--cds-text-primary)',
                    marginBottom: '0.25rem',
                    fontFamily: typeof card.value === 'number' ? 'IBM Plex Mono, monospace' : undefined,
                    lineHeight: 1.2,
                  }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{card.label}</div>
                </Tile>
              </Column>
            ))}
          </Grid>

          {/* Status banner */}
          {status && !status.running && (
            <Tile style={{
              marginBottom: '2rem', padding: '1rem 1.5rem',
              borderLeft: '4px solid var(--cds-support-warning)',
              background: 'var(--cds-notification-background-warning)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Pause size={20} style={{ color: 'var(--cds-support-warning)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-primary)' }}>
                  {repos.length === 0
                    ? 'No repositories configured. Click "Add Repository" to get started.'
                    : 'Scheduler is stopped. Enable it via "Schedule Config" or enable at least one repository.'}
                </span>
              </div>
            </Tile>
          )}
          {status?.running && (
            <Tile style={{
              marginBottom: '2rem', padding: '0.75rem 1.5rem',
              borderLeft: '4px solid var(--cds-support-success)',
              background: 'var(--cds-notification-background-success)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Play size={20} style={{ color: 'var(--cds-support-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-primary)' }}>
                  Scheduler active — {repos.filter(r => r.enabled).length} repo(s) monitored,{' '}
                  {config?.trigger_mode === 'cron' ? `cron: ${config.cron_expr}` : `every ${Math.max(1, Math.round((config?.interval_minutes ?? 1440) / 1440))} day(s)`}
                </span>
              </div>
            </Tile>
          )}

          {/* Monitored Repos Table */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
                Monitored Repositories
              </h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                {repos.length} configured
              </span>
            </div>

            {repos.length === 0 ? (
              <Tile style={{ padding: '2rem', textAlign: 'center' }}>
                <Chemistry size={32} style={{ marginBottom: '0.75rem', color: 'var(--cds-text-secondary)', opacity: 0.5 }} />
                <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
                  No repositories yet. Add one to start periodic scanning.
                </p>
                <Button kind="primary" size="sm" renderIcon={Add} onClick={() => { setEditingRepo(null); setRepoModalOpen(true); }}>
                  Add Repository
                </Button>
              </Tile>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Repository</TableHeader>
                      <TableHeader>Branch</TableHeader>
                      <TableHeader>Next Scan</TableHeader>
                      <TableHeader>Last Scan</TableHeader>
                      <TableHeader>Fixed / Found</TableHeader>
                      <TableHeader>Enabled</TableHeader>
                      <TableHeader></TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {repos.map((repo) => {
                      const repoLabel = repo.repo_url.replace('https://github.com/', '');
                      const ls = repo.last_scan;
                      const isScanning = scanningIds.has(repo.id);
                      return (
                        <TableRow key={repo.id}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: repo.enabled ? 'var(--cds-layer-accent-01)' : 'var(--cds-layer-01)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                opacity: repo.enabled ? 1 : 0.5,
                              }}>
                                <Chemistry size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--cds-text-primary)' }}>
                                  {repo.label !== repoLabel ? repo.label : repoLabel}
                                </div>
                                {repo.label !== repoLabel && (
                                  <div style={{ fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)' }}>
                                    {repoLabel}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tag type="blue" size="sm">{repo.branch}</Tag>
                          </TableCell>
                          <TableCell>
                            {repo.next_run ? (
                              <div>
                                <div style={{ fontSize: '0.875rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)' }}>
                                  {formatRelative(repo.next_run)}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--cds-text-placeholder)', marginTop: '0.125rem' }}>
                                  {formatAbsolute(repo.next_run)}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-placeholder)' }}>
                                {repo.enabled ? 'Starting…' : 'Disabled'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ls ? (
                              <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                  {formatRelative(ls.started_at)}
                                </div>
                                {getStatusTag(ls.status)}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.875rem' }}>No scans yet</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ls ? (
                              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--cds-support-success)' }}>{ls.total_remediated}</span>
                                <span style={{ color: 'var(--cds-text-secondary)' }}>/{ls.total_findings}</span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--cds-text-placeholder)' }}>—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Toggle
                              id={`toggle-${repo.id}`}
                              toggled={repo.enabled}
                              onToggle={() => handleToggleEnabled(repo)}
                              size="sm"
                              hideLabel
                              labelText={repo.enabled ? 'Enabled' : 'Disabled'}
                            />
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={isScanning ? InProgress : Flash}
                                iconDescription="Scan now"
                                hasIconOnly
                                onClick={() => handleScanNow(repo)}
                                disabled={isScanning}
                                tooltipPosition="left"
                              />
                              <OverflowMenu size="sm" flipped>
                                <OverflowMenuItem
                                  itemText="Edit"
                                  onClick={() => { setEditingRepo(repo); setRepoModalOpen(true); }}
                                />
                                <OverflowMenuItem
                                  itemText="Remove"
                                  isDelete
                                  hasDivider
                                  onClick={() => { setDeletingRepo(repo); setDeleteModalOpen(true); }}
                                />
                              </OverflowMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>

          {/* Scan History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
                Scan History
              </h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                {historyTotal} scheduled run{historyTotal !== 1 ? 's' : ''}
              </span>
            </div>

            {history.length === 0 ? (
              <Tile>
                <p style={{ color: 'var(--cds-text-secondary)', padding: '0.5rem 0' }}>No scheduled scans yet.</p>
              </Tile>
            ) : (
              <DataTable rows={historyRows} headers={historyHeaders}>
                {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps, getTableContainerProps }) => (
                  <TableContainer {...getTableContainerProps()}>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {tableHeaders.map((header) => (
                            <TableHeader {...getHeaderProps({ header })} key={header.key}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row, index) => {
                          const wf = history[index];
                          return (
                            <TableRow {...getRowProps({ row })} key={row.id}>
                              <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'var(--cds-layer-accent-01)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  }}>
                                    <Chemistry size={18} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--cds-text-primary)' }}>
                                      {wf.repo_url.replace('https://github.com/', '')}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)' }}>
                                      {wf.id.slice(0, 20)}…
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><Tag type="blue" size="sm">{wf.branch}</Tag></TableCell>
                              <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Time size={16} style={{ color: 'var(--cds-text-secondary)', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.875rem' }}>{formatAbsolute(wf.started_at)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                                  {formatDuration(wf.started_at, wf.completed_at)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                                  <span style={{ color: 'var(--cds-support-success)' }}>{wf.total_remediated}</span>
                                  <span style={{ color: 'var(--cds-text-secondary)' }}>/{wf.total_findings}</span>
                                </span>
                              </TableCell>
                              <TableCell>{getStatusTag(wf.status)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <RepoModal
        open={repoModalOpen}
        editing={editingRepo}
        onClose={() => setRepoModalOpen(false)}
        onSaved={() => { setRepoModalOpen(false); showToast('success', editingRepo ? 'Repository updated' : 'Repository added'); load(true); }}
      />
      <DeleteModal
        open={deleteModalOpen}
        repo={deletingRepo}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={() => { setDeleteModalOpen(false); showToast('success', 'Repository removed'); load(true); }}
      />
      <ConfigModal
        open={configModalOpen}
        config={config}
        onClose={() => setConfigModalOpen(false)}
        onSaved={() => { setConfigModalOpen(false); showToast('success', 'Schedule configuration saved'); load(true); }}
      />
    </div>
  );
}
