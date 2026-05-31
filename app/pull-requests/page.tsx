'use client';

import { 
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
import { DocumentTasks, Checkmark, Time, Branch } from '@carbon/icons-react';

const mockPRs = [
  {
    id: '1',
    title: 'Security fix: Update axios to 1.6.0',
    repo: 'owner/app',
    status: 'open',
    created: '2 hours ago',
    number: '#234',
    changes: '+12 -8'
  },
  {
    id: '2',
    title: 'Security fix: Update lodash to 4.17.21',
    repo: 'owner/backend',
    status: 'merged',
    created: '1 day ago',
    number: '#233',
    changes: '+5 -3'
  },
  {
    id: '3',
    title: 'Security fix: Update express to 4.18.2',
    repo: 'owner/api',
    status: 'open',
    created: '3 hours ago',
    number: '#232',
    changes: '+8 -4'
  },
];

export default function PullRequestsPage() {
  const headers = [
    { key: 'title', header: 'Pull Request' },
    { key: 'repo', header: 'Repository' },
    { key: 'changes', header: 'Changes' },
    { key: 'status', header: 'Status' },
    { key: 'created', header: 'Created' },
  ];

  const rows = mockPRs.map((pr) => ({
    id: pr.id,
    title: pr.title,
    repo: pr.repo,
    changes: pr.changes,
    status: pr.status,
    created: pr.created,
  }));

  const summary = [
    { label: 'Open PRs', value: '2', icon: DocumentTasks },
    { label: 'Merged', value: '1', icon: Checkmark },
    { label: 'Total', value: '3', icon: Branch },
  ];

  return (
    
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 600, 
            marginBottom: '0.5rem',
            color: 'var(--cds-text-primary)',
          }}>
            Pull Requests
          </h1>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cds-text-secondary)',
          }}>
            Track automated security fix pull requests across repositories
          </p>
        </div>

        {/* Summary Cards */}
        <Grid narrow style={{ marginBottom: '2rem' }}>
          {summary.map((item, index) => {
            const Icon = item.icon;
            return (
              <Column key={index} sm={4} md={8} lg={5}>
                <Tile style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--cds-layer-accent-01)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={24} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 600,
                      color: 'var(--cds-text-primary)',
                    }}>
                      {item.value}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--cds-text-secondary)',
                    }}>
                      {item.label}
                    </div>
                  </div>
                </Tile>
              </Column>
            );
          })}
        </Grid>

        {/* Pull Requests Table */}
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
                    const pr = mockPRs[index];
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableCell>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem',
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'var(--cds-layer-accent-01)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <DocumentTasks size={20} />
                            </div>
                            <div>
                              <div style={{ 
                                fontWeight: 500,
                                color: 'var(--cds-text-primary)',
                              }}>
                                {pr.title}
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem',
                                fontFamily: 'IBM Plex Mono, monospace',
                                color: 'var(--cds-text-secondary)',
                              }}>
                                {pr.number}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                          }}>
                            <Branch size={14} style={{ color: 'var(--cds-text-secondary)' }} />
                            <span style={{ fontSize: '0.875rem' }}>
                              {pr.repo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ 
                            fontFamily: 'IBM Plex Mono, monospace',
                            fontSize: '0.875rem',
                            color: 'var(--cds-support-success)',
                          }}>
                            {pr.changes}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Tag
                            type={pr.status === 'merged' ? 'purple' : 'blue'}
                            size="sm"
                            renderIcon={pr.status === 'merged' ? Checkmark : undefined}
                          >
                            {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
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
                              fontSize: '0.875rem',
                              color: 'var(--cds-text-secondary)',
                            }}>
                              {pr.created}
                            </span>
                          </div>
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
