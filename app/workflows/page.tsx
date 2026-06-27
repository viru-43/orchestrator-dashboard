'use client';

import { useEffect, useState } from 'react';
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
} from '@carbon/react';
import { Add, Chemistry, CheckmarkFilled, InProgress, WarningAlt, Time, Security } from '@carbon/icons-react';
import Link from 'next/link';
import { getWorkflows, type Workflow } from '@/lib/api';

const getStatusTag = (status: string) => {
  switch (status) {
    case 'completed':
      return <Tag type="green" size="sm" renderIcon={CheckmarkFilled}>Completed</Tag>;
    case 'running':
      return <Tag type="blue" size="sm" renderIcon={InProgress}>Running</Tag>;
    case 'failed':
      return <Tag type="red" size="sm" renderIcon={WarningAlt}>Failed</Tag>;
    default:
      return <Tag size="sm">Unknown</Tag>;
  }
};

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = Math.round((end.getTime() - new Date(startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkflows(50)
      .then((res) => {
        setWorkflows(res.workflows);
        setTotal(res.total);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const running = workflows.filter((w) => w.status === 'running').length;
  const completed = workflows.filter((w) => w.status === 'completed').length;
  const failed = workflows.filter((w) => w.status === 'failed').length;

  const summary = [
    { label: 'Total Workflows', value: total },
    { label: 'Running', value: running },
    { label: 'Completed', value: completed },
    { label: 'Failed', value: failed },
  ];

  const headers = [
    { key: 'repo', header: 'Repository' },
    { key: 'branch', header: 'Branch' },
    { key: 'duration', header: 'Duration' },
    { key: 'vulnerabilities', header: 'Findings Fixed' },
    { key: 'status', header: 'Status' },
  ];

  const rows = workflows.map((wf) => ({
    id: wf.id,
    repo: wf.repo_url,
    branch: wf.branch,
    duration: formatDuration(wf.started_at, wf.completed_at),
    vulnerabilities: `${wf.total_remediated}/${wf.total_findings}`,
    status: wf.status,
  }));

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
            Workflows
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Monitor and manage security remediation workflows
          </p>
        </div>
        <Link href="/workflows/execute">
          <Button kind="primary" size="md" renderIcon={Add}>New Workflow</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        {summary.map((item, index) => (
          <Column key={index} sm={4} md={2} lg={4}>
            <Tile style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: '0.25rem' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                {item.label}
              </div>
            </Tile>
          </Column>
        ))}
      </Grid>

      {loading && (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
          <InlineLoading description="Loading workflows…" />
        </div>
      )}

      {error && (
        <InlineNotification
          kind="error"
          title="Could not load workflows"
          subtitle={error}
          hideCloseButton
        />
      )}

      {!loading && !error && (
        <DataTable rows={rows} headers={headers}>
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
                    const wf = workflows[index];
                    const repoLabel = wf.repo_url.replace('https://github.com/', '');
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableCell key={`${row.id}-repo`}>
                          <Link
                            href={`/workflows/${wf.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
                          >
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '8px',
                              background: 'var(--cds-layer-accent-01)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Chemistry size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>
                                {repoLabel}
                              </div>
                              <div style={{
                                fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cds-text-secondary)',
                              }}>
                                {wf.id.slice(0, 24)}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell key={`${row.id}-branch`}>
                          <Tag type="blue" size="sm">{wf.branch}</Tag>
                        </TableCell>
                        <TableCell key={`${row.id}-duration`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Time size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                              {formatDuration(wf.started_at, wf.completed_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell key={`${row.id}-vulnerabilities`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Security size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                              <span style={{ color: 'var(--cds-support-success)' }}>{wf.total_remediated}</span>
                              <span style={{ color: 'var(--cds-text-secondary)' }}>/</span>
                              {wf.total_findings}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell key={`${row.id}-status`}>{getStatusTag(wf.status)}</TableCell>
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
  );
}
