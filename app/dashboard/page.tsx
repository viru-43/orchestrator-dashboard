'use client';

import { useEffect, useState } from 'react';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  InlineLoading,
  InlineNotification,
} from '@carbon/react';
import {
  Activity,
  CheckmarkFilled,
  ErrorFilled,
  ArrowRight,
  Renew,
  Time,
  Security,
  PullRequest,
} from '@carbon/icons-react';
import Link from 'next/link';
import {
  getDashboardMetrics,
  getWorkflows,
  type DashboardMetrics,
  type Workflow,
} from '@/lib/api';

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = Math.round((end.getTime() - new Date(startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_TAG: Record<string, { type: 'green' | 'blue' | 'red' | 'gray'; label: string }> = {
  completed: { type: 'green', label: 'Completed' },
  running: { type: 'blue', label: 'Running' },
  failed: { type: 'red', label: 'Failed' },
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboardMetrics(), getWorkflows(5)])
      .then(([m, w]) => {
        setMetrics(m);
        setWorkflows(w.workflows);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
        <InlineLoading description="Loading dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <InlineNotification
          kind="error"
          title="Could not load dashboard"
          subtitle={error}
          hideCloseButton
        />
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Running Workflows',
      value: String(metrics?.running_workflows ?? 0),
      icon: Activity,
      color: 'blue',
      description: 'Currently in progress',
    },
    {
      title: 'Success Rate',
      value: `${metrics?.success_rate ?? 0}%`,
      icon: CheckmarkFilled,
      color: 'green',
      description: 'All time',
    },
    {
      title: 'Open PRs',
      value: String(metrics?.open_prs ?? 0),
      icon: PullRequest,
      color: 'purple',
      description: 'Awaiting review',
    },
    {
      title: 'Total Findings',
      value: String(metrics?.total_findings ?? 0),
      icon: Security,
      color: 'red',
      description: `${metrics?.total_fixed ?? 0} fixed`,
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Real-time security remediation overview
        </p>
      </div>

      {/* KPI Cards */}
      <Grid narrow>
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Column key={i} sm={4} md={4} lg={4}>
              <Tile style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: `var(--cds-${card.color}-20)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={24} style={{ color: `var(--cds-${card.color}-60)` }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.25rem', color: 'var(--cds-text-primary)' }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    {card.description}
                  </div>
                </div>
              </Tile>
            </Column>
          );
        })}
      </Grid>

      {/* Recent Workflows */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
            Recent Workflows
          </h2>
          <Link href="/workflows">
            <Button kind="ghost" size="sm" renderIcon={ArrowRight}>View all</Button>
          </Link>
        </div>

        {workflows.length === 0 ? (
          <Tile>
            <p style={{ color: 'var(--cds-text-secondary)', padding: '1rem 0' }}>
              No workflows yet. Trigger one from the <Link href="/workflows/execute">Execute Workflow</Link> page.
            </p>
          </Tile>
        ) : (
          <Tile>
            <StructuredListWrapper>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>Repository</StructuredListCell>
                  <StructuredListCell head>Status</StructuredListCell>
                  <StructuredListCell head>Findings</StructuredListCell>
                  <StructuredListCell head>Duration</StructuredListCell>
                  <StructuredListCell head>Started</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {workflows.map((wf) => {
                  const tagCfg = STATUS_TAG[wf.status] ?? { type: 'gray' as const, label: wf.status };
                  return (
                    <StructuredListRow key={wf.id}>
                      <StructuredListCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {wf.status === 'completed'
                            ? <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success)' }} />
                            : wf.status === 'running'
                              ? <Renew size={16} style={{ color: 'var(--cds-support-info)' }} />
                              : <ErrorFilled size={16} style={{ color: 'var(--cds-support-error)' }} />}
                          <span style={{ fontWeight: 500 }}>{wf.repo_url.replace('https://github.com/', '')}</span>
                        </div>
                      </StructuredListCell>
                      <StructuredListCell>
                        <Tag type={tagCfg.type} size="sm">{tagCfg.label}</Tag>
                      </StructuredListCell>
                      <StructuredListCell>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                          {wf.total_remediated}/{wf.total_findings}
                        </span>
                      </StructuredListCell>
                      <StructuredListCell>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                          <Time size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {formatDuration(wf.started_at, wf.completed_at)}
                        </span>
                      </StructuredListCell>
                      <StructuredListCell>
                        <span style={{ color: 'var(--cds-text-secondary)' }}>
                          {timeAgo(wf.started_at)}
                        </span>
                      </StructuredListCell>
                    </StructuredListRow>
                  );
                })}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
        )}
      </div>

      {/* MTTR metric */}
      {metrics && metrics.avg_mttr_seconds > 0 && (
        <Grid narrow style={{ marginTop: '2rem' }}>
          <Column sm={4} md={4} lg={4}>
            <Tile>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
                Avg. MTTR
              </h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                {formatDuration(null, null) === '—'
                  ? `${Math.round(metrics.avg_mttr_seconds)}s`
                  : `${Math.floor(metrics.avg_mttr_seconds / 60)}m ${Math.round(metrics.avg_mttr_seconds % 60)}s`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                Mean Time to Remediate
              </div>
            </Tile>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <Tile>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
                Total Workflows
              </h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                {metrics.total_workflows}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                {metrics.completed_workflows} completed · {metrics.failed_workflows} failed
              </div>
            </Tile>
          </Column>
        </Grid>
      )}
    </div>
  );
}
