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
import { Security } from '@carbon/icons-react';

const mockVulnerabilities = [
  { id: '1', cve: 'CVE-2024-1234', package: 'axios', severity: 'critical', status: 'open' },
  { id: '2', cve: 'CVE-2024-5678', package: 'lodash', severity: 'high', status: 'fixed' },
  { id: '3', cve: 'CVE-2024-9012', package: 'express', severity: 'medium', status: 'open' },
  { id: '4', cve: 'CVE-2024-3456', package: 'react', severity: 'low', status: 'open' },
];

export default function VulnerabilitiesPage() {
  const headers = [
    { key: 'cve', header: 'CVE ID' },
    { key: 'package', header: 'Package' },
    { key: 'severity', header: 'Severity' },
    { key: 'status', header: 'Status' },
  ];

  const rows = mockVulnerabilities.map((vuln) => ({
    id: vuln.id,
    cve: vuln.cve,
    package: vuln.package,
    severity: vuln.severity,
    status: vuln.status,
  }));

  const getSeverityTag = (severity: string) => {
    const types: Record<string, 'red' | 'magenta' | 'purple' | 'blue'> = {
      critical: 'red',
      high: 'magenta',
      medium: 'purple',
      low: 'blue',
    };
    return (
      <Tag
        type={types[severity]}
        size="sm"
      >
        {severity.toUpperCase()}
      </Tag>
    );
  };

  const summary = [
    { label: 'Critical', count: 1, color: 'red' },
    { label: 'High', count: 1, color: 'magenta' },
    { label: 'Medium', count: 1, color: 'purple' },
    { label: 'Low', count: 1, color: 'blue' },
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
            Vulnerabilities
          </h1>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cds-text-secondary)',
          }}>
            Track and manage security vulnerabilities across your infrastructure
          </p>
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
                  {item.count}
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

        {/* Vulnerabilities Table */}
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
                    const vuln = mockVulnerabilities[index];
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
                              <Security size={20} />
                            </div>
                            <span style={{ 
                              fontFamily: 'IBM Plex Mono, monospace',
                              fontWeight: 500,
                            }}>
                              {vuln.cve}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tag type="blue" size="sm">
                            {vuln.package}
                          </Tag>
                        </TableCell>
                        <TableCell>
                          {getSeverityTag(vuln.severity)}
                        </TableCell>
                        <TableCell>
                          <Tag
                            type={vuln.status === 'fixed' ? 'green' : 'gray'}
                            size="sm"
                          >
                            {vuln.status.charAt(0).toUpperCase() + vuln.status.slice(1)}
                          </Tag>
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
