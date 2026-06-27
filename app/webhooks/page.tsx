'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  CodeSnippet,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import {
  CheckmarkFilled,
  WarningAlt,
  SubtractAlt,
  Renew,
  Events,
  Link,
  Branch,
  User,
  Flash,
} from '@carbon/icons-react';
import {
  getWebhookEvents,
  getWebhookStats,
  type WebhookEvent,
  type WebhookStats,
} from '@/lib/api';

// ── Constants ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const STREAM_URL = `${BASE_URL}/api/webhooks/stream`;
const WEBHOOK_ENDPOINT = `${BASE_URL}/webhook/github`;
const MAX_LIVE_EVENTS = 30;

// ── Helpers ───────────────────────────────────────────────────────────────

function formatAbsolute(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 5_000) return 'just now';
  if (ms < 60_000) return `${Math.floor(ms / 1_000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return formatAbsolute(iso);
}

const statusConfig = {
  accepted: { type: 'green'     as const, icon: CheckmarkFilled, label: 'Accepted' },
  ignored:  { type: 'gray'      as const, icon: SubtractAlt,     label: 'Ignored'  },
  failed:   { type: 'red'       as const, icon: WarningAlt,      label: 'Failed'   },
};

const getStatusTag = (status: string) => {
  const cfg = statusConfig[status as keyof typeof statusConfig];
  if (!cfg) return <Tag size="sm">{status}</Tag>;
  return <Tag type={cfg.type} size="sm" renderIcon={cfg.icon}>{cfg.label}</Tag>;
};

// ── Live Event Row ────────────────────────────────────────────────────────

function LiveEventRow({ event, isNew }: { event: WebhookEvent; isNew: boolean }) {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setHighlight(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 1fr auto auto',
      gap: '0.75rem',
      alignItems: 'center',
      padding: '0.625rem 1rem',
      borderBottom: '1px solid var(--cds-border-subtle-01)',
      background: highlight ? 'var(--cds-notification-background-success)' : 'transparent',
      transition: 'background 1.2s ease',
    }}>
      {/* Time */}
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
        {formatRelative(event.received_at)}
      </div>

      {/* Repo + branch + commit */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--cds-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.repo_name || event.repo_url.replace('https://github.com/', '')}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem', flexWrap: 'wrap' }}>
          {event.branch && (
            <span style={{ fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Branch size={12} /> {event.branch}
            </span>
          )}
          {event.commit_sha && (
            <span style={{ fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-placeholder)' }}>
              {event.commit_sha.slice(0, 7)}
            </span>
          )}
          {event.pusher && (
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} /> {event.pusher}
            </span>
          )}
        </div>
        {event.reason && (
          <div style={{ fontSize: '0.6875rem', color: 'var(--cds-text-placeholder)', marginTop: '0.125rem', fontStyle: 'italic' }}>
            {event.reason}
          </div>
        )}
      </div>

      {/* Status */}
      <div>{getStatusTag(event.status)}</div>

      {/* Workflow link */}
      <div style={{ width: '80px', textAlign: 'right' }}>
        {event.workflow_id ? (
          <a
            href={`/workflows/${event.workflow_id}`}
            style={{ fontSize: '0.75rem', color: 'var(--cds-link-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}
          >
            <Link size={12} /> Workflow
          </a>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-placeholder)' }}>—</span>
        )}
      </div>
    </div>
  );
}

// ── Live Feed Panel ───────────────────────────────────────────────────────

function LiveFeedPanel() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const connect = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setError(null);

    (async () => {
      try {
        const res = await fetch(STREAM_URL, { signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok || !res.body) {
          setError(`Stream error: ${res.status}`);
          setConnected(false);
          return;
        }
        setConnected(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            if (!block.trim() || block.startsWith(':')) continue;
            const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            try {
              const event: WebhookEvent = JSON.parse(dataLine.slice(5).trim());
              setEvents((prev) => {
                const next = [event, ...prev].slice(0, MAX_LIVE_EVENTS);
                return next;
              });
              setNewIds((prev) => {
                const n = new Set(prev);
                n.add(event.id);
                return n;
              });
              setTimeout(() => {
                setNewIds((prev) => {
                  const n = new Set(prev);
                  n.delete(event.id);
                  return n;
                });
              }, 3000);
            } catch {
              // ignore malformed SSE data
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setError('Stream disconnected — reconnecting in 5s…');
          setConnected(false);
          setTimeout(() => connect(), 5000);
        }
      }
    })();
  }, []);

  useEffect(() => {
    connect();
    return () => abortRef.current?.abort();
  }, [connect]);

  return (
    <div>
      {/* Connection indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: connected ? 'var(--cds-support-success)' : 'var(--cds-support-warning)',
          boxShadow: connected ? '0 0 0 3px rgba(36,161,72,0.25)' : 'none',
          animation: connected ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          {connected ? `Connected — listening for push events` : 'Connecting…'}
        </span>
        {events.length > 0 && (
          <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-placeholder)', marginLeft: 'auto' }}>
            {events.length} event{events.length !== 1 ? 's' : ''} received this session
          </span>
        )}
      </div>

      {error && (
        <InlineNotification kind="warning" title="" subtitle={error} hideCloseButton lowContrast style={{ marginBottom: '0.75rem' }} />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Event stream */}
      <div style={{
        border: '1px solid var(--cds-border-subtle-01)',
        borderRadius: '4px',
        background: 'var(--cds-layer-01)',
        minHeight: '200px',
        maxHeight: '480px',
        overflowY: 'auto',
      }}>
        {events.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Flash size={32} style={{ color: 'var(--cds-text-secondary)', opacity: 0.4, marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              Waiting for push events…
            </p>
            <p style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              Push to any configured GitHub repository to see events appear here in real time.
            </p>
          </div>
        ) : (
          events.map((ev) => (
            <LiveEventRow key={`${ev.id}-${ev.received_at}`} event={ev} isNew={newIds.has(ev.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Setup Guide ───────────────────────────────────────────────────────────

function SetupGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Tile style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--cds-text-primary)' }}>
          1. Webhook endpoint
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.75rem' }}>
          Configure this URL in your GitHub repository under <strong>Settings → Webhooks → Add webhook</strong>.
        </p>
        <CodeSnippet type="single" feedback="Copied!">{WEBHOOK_ENDPOINT}</CodeSnippet>
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Content type', value: 'application/json' },
            { label: 'Events',       value: 'Just the push event' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--cds-text-secondary)', minWidth: '120px' }}>{row.label}</span>
              <code style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-primary)' }}>{row.value}</code>
            </div>
          ))}
        </div>
      </Tile>

      <Tile style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--cds-text-primary)' }}>
          2. Signature secret (recommended)
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.75rem' }}>
          Set a secret in GitHub and the matching env var in your backend. The server will verify every incoming payload using HMAC-SHA256.
        </p>
        <CodeSnippet type="single" feedback="Copied!">GITHUB_WEBHOOK_SECRET=your-secret-here</CodeSnippet>
      </Tile>

      <Tile style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--cds-text-primary)' }}>
          3. What happens on a push
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { step: '1', label: 'GitHub sends a POST to the webhook endpoint' },
            { step: '2', label: 'Signature is verified (if secret configured)' },
            { step: '3', label: 'Event is persisted and broadcast to this live feed' },
            { step: '4', label: 'A full scan workflow is queued in the background' },
            { step: '5', label: 'Scanner → Analyser → Remediation → Validation → PR' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--cds-interactive-01)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: 'white',
              }}>{item.step}</div>
              <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', paddingTop: '3px' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Tile>

      <Tile style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--cds-text-primary)' }}>
          Ignored push events
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            'Pushes to security-fix/* branches (created by this framework)',
            'Branch deletion events (after = 0000…)',
            'Non-branch refs (tags, etc.)',
            'Non-push event types (ping, pull_request, …)',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              <SubtractAlt size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--cds-text-placeholder)' }} />
              {item}
            </div>
          ))}
        </div>
      </Tile>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

const EVENT_HEADERS = [
  { key: 'received',  header: 'Received'   },
  { key: 'repo',      header: 'Repository' },
  { key: 'branch',    header: 'Branch'     },
  { key: 'commit',    header: 'Commit'     },
  { key: 'pusher',    header: 'Pusher'     },
  { key: 'status',    header: 'Status'     },
  { key: 'workflow',  header: 'Workflow'   },
];

export default function WebhooksPage() {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [s, e] = await Promise.all([getWebhookStats(), getWebhookEvents(50)]);
      setStats(s);
      setEvents(e.events);
      setTotal(e.total);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summaryCards = [
    { label: 'Total Events',    value: stats?.total    ?? '—' },
    { label: 'Accepted',        value: stats?.accepted ?? '—', color: 'var(--cds-support-success)'  },
    { label: 'Ignored',         value: stats?.ignored  ?? '—', color: 'var(--cds-text-secondary)'   },
    { label: 'Failed',          value: stats?.failed   ?? '—', color: stats?.failed ? 'var(--cds-support-error)' : undefined },
  ];

  const tableRows = events.map((ev) => ({
    id: String(ev.id),
    received:  formatAbsolute(ev.received_at),
    repo:      ev.repo_name || ev.repo_url.replace('https://github.com/', ''),
    branch:    ev.branch,
    commit:    ev.commit_sha ? ev.commit_sha.slice(0, 7) : '—',
    pusher:    ev.pusher || '—',
    status:    ev.status,
    workflow:  ev.workflow_id,
  }));

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
            GitHub Webhooks
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Real-time push event monitoring and workflow trigger history
          </p>
        </div>
        <Button kind="secondary" size="md" renderIcon={Renew} onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <InlineLoading description="Loading webhook data…" />
        </div>
      )}

      {error && (
        <InlineNotification kind="error" title="Could not load webhook data" subtitle={error} hideCloseButton style={{ marginBottom: '1.5rem' }} />
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <Grid narrow style={{ marginBottom: '2rem' }}>
            {summaryCards.map((card, i) => (
              <Column key={i} sm={4} md={2} lg={4}>
                <Tile style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <div style={{
                    fontSize: '2rem', fontWeight: 600, marginBottom: '0.25rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: (card as { color?: string }).color ?? 'var(--cds-text-primary)',
                  }}>
                    {loading ? '…' : card.value}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{card.label}</div>
                </Tile>
              </Column>
            ))}
          </Grid>

          {/* Tabs: Live Feed / Event History / Setup */}
          <Tabs>
            <TabList aria-label="Webhook views">
              <Tab renderIcon={Flash}>Live Feed</Tab>
              <Tab renderIcon={Events}>Event History ({total})</Tab>
              <Tab renderIcon={Link}>Setup Guide</Tab>
            </TabList>
            <TabPanels>
              {/* Live Feed */}
              <TabPanel>
                <div style={{ paddingTop: '1.5rem' }}>
                  <LiveFeedPanel />
                </div>
              </TabPanel>

              {/* Event History */}
              <TabPanel>
                <div style={{ paddingTop: '1.5rem' }}>
                  {events.length === 0 ? (
                    <Tile>
                      <p style={{ color: 'var(--cds-text-secondary)', padding: '0.5rem 0' }}>
                        No webhook events recorded yet. Configure the webhook in GitHub to get started.
                      </p>
                    </Tile>
                  ) : (
                    <DataTable rows={tableRows} headers={EVENT_HEADERS}>
                      {({ rows: tableRowsR, headers, getTableProps, getHeaderProps, getRowProps, getTableContainerProps }) => (
                        <TableContainer {...getTableContainerProps()}>
                          <Table {...getTableProps()}>
                            <TableHead>
                              <TableRow>
                                {headers.map((h) => (
                                  <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tableRowsR.map((row, idx) => {
                                const ev = events[idx];
                                return (
                                  <TableRow {...getRowProps({ row })} key={row.id}>
                                    <TableCell key={`${row.id}-received`}>
                                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                                        {formatAbsolute(ev.received_at)}
                                      </span>
                                    </TableCell>
                                    <TableCell key={`${row.id}-repo`}>
                                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                        {ev.repo_name || ev.repo_url.replace('https://github.com/', '')}
                                      </div>
                                    </TableCell>
                                    <TableCell key={`${row.id}-branch`}>
                                      {ev.branch ? <Tag type="blue" size="sm">{ev.branch}</Tag> : '—'}
                                    </TableCell>
                                    <TableCell key={`${row.id}-commit`}>
                                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                                        {ev.commit_sha ? ev.commit_sha.slice(0, 7) : '—'}
                                      </span>
                                    </TableCell>
                                    <TableCell key={`${row.id}-pusher`}>
                                      <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        {ev.pusher && <User size={14} style={{ color: 'var(--cds-text-secondary)', flexShrink: 0 }} />}
                                        {ev.pusher || '—'}
                                      </span>
                                    </TableCell>
                                    <TableCell key={`${row.id}-status`}>
                                      <div>
                                        {getStatusTag(ev.status)}
                                        {ev.reason && (
                                          <div style={{ fontSize: '0.6875rem', color: 'var(--cds-text-placeholder)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                            {ev.reason}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell key={`${row.id}-workflow`}>
                                      {ev.workflow_id ? (
                                        <a
                                          href={`/workflows/${ev.workflow_id}`}
                                          style={{ fontSize: '0.8125rem', color: 'var(--cds-link-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                          <Link size={14} />
                                          {ev.workflow_id.slice(0, 16)}…
                                        </a>
                                      ) : (
                                        <span style={{ color: 'var(--cds-text-placeholder)', fontSize: '0.8125rem' }}>—</span>
                                      )}
                                    </TableCell>
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
              </TabPanel>

              {/* Setup Guide */}
              <TabPanel>
                <div style={{ paddingTop: '1.5rem' }}>
                  <SetupGuide />
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      )}
    </div>
  );
}
