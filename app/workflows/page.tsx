'use client';

import { 
  Button, 
  DataTable, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell, 
  Tag,
  Grid,
  Column,
  Tile,
} from '@carbon/react';
import { Add, Chemistry, CheckmarkFilled, InProgress, WarningAlt, Time, Security } from '@carbon/icons-react';
import Link from 'next/link';

const mockWorkflows = [
  {
    id: '20260530T140740',
    repo: 'owner/vulnerable-repo',
    branch: 'main',
    status: 'completed',
    startTime: '2026-05-30T14:07:40Z',
    duration: '4m 32s',
    vulnerabilities: 3,
    fixed: 3,
  },
  {
    id: '20260530T135713',
    repo: 'owner/test-app',
    branch: 'develop',
    status: 'running',
    startTime: '2026-05-30T13:57:13Z',
    duration: '2m 15s',
    vulnerabilities: 5,
    fixed: 2,
  },
  {
    id: '20260530T133559',
    repo: 'owner/backend-api',
    branch: 'main',
    status: 'failed',
    startTime: '2026-05-30T13:35:59Z',
    duration: '1m 45s',
    vulnerabilities: 2,
    fixed: 0,
  },
];

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

export default function WorkflowsPage() {
  const headers = [
    { key: 'repo', header: 'Repository' },
    { key: 'branch', header: 'Branch' },
    { key: 'duration', header: 'Duration' },
    { key: 'vulnerabilities', header: 'Vulnerabilities' },
    { key: 'status', header: 'Status' },
  ];

  const rows = mockWorkflows.map((workflow) => ({
    id: workflow.id,
    repo: workflow.repo,
    branch: workflow.branch,
    duration: workflow.duration,
    vulnerabilities: `${workflow.fixed}/${workflow.vulnerabilities}`,
    status: workflow.status,
  }));

  const summary = [
    { label: 'Total Workflows', value: '3', color: 'blue' },
    { label: 'Running', value: '1', color: 'blue' },
    { label: 'Completed', value: '1', color: 'green' },
    { label: 'Failed', value: '1', color: 'red' },
  ];

  return (
    
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '2rem',
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem',
              color: 'var(--cds-text-primary)',
            }}>
              Workflows
            </h1>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--cds-text-secondary)',
            }}>
              Monitor and manage security remediation workflows
            </p>
          </div>
          <Link href="/workflows/execute">
            <Button
              kind="primary"
              size="md"
              renderIcon={Add}
            >
              New Workflow
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <Grid narrow style={{ marginBottom: '2rem' }}>
          {summary.map((item, index) => (
            <Column key={index} sm={4} md={2} lg={4}>
              <Tile style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 600,
                  color: 'var(--cds-text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  {item.value}
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--cds-text-secondary)',
                }}>
                  {item.label}
                </div>
              </Tile>
            </Column>
          ))}
        </Grid>

        {/* Workflows Table */}
        <DataTable rows={rows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getTableContainerProps }) => (
            <div {...getTableContainerProps()}>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => {
                    const workflow = mockWorkflows[index];
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableCell>
                          <Link
                            href={`/workflows/${workflow.id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              textDecoration: 'none',
                            }}
                          >
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'var(--cds-layer-accent-01)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Chemistry size={20} />
                            </div>
                            <div>
                              <div style={{ 
                                fontWeight: 500,
                                color: 'var(--cds-text-primary)',
                              }}>
                                {workflow.repo}
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem',
                                fontFamily: 'IBM Plex Mono, monospace',
                                color: 'var(--cds-text-secondary)',
                              }}>
                                ID: {workflow.id}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Tag type="blue" size="sm">
                            {workflow.branch}
                          </Tag>
                        </TableCell>
                        <TableCell>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                          }}>
                            <Time size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                            <span style={{ 
                              fontFamily: 'IBM Plex Mono, monospace',
                              fontSize: '0.875rem',
                            }}>
                              {workflow.duration}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                          }}>
                            <Security size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                            <span style={{ 
                              fontFamily: 'IBM Plex Mono, monospace',
                              fontSize: '0.875rem',
                            }}>
                              <span style={{ color: 'var(--cds-support-success)' }}>
                                {workflow.fixed}
                              </span>
                              <span style={{ color: 'var(--cds-text-secondary)' }}>/</span>
                              {workflow.vulnerabilities}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusTag(workflow.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DataTable>
      </div>
    
  );
}

// Made with Bob
