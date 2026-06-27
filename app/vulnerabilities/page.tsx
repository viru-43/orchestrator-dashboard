'use client';

import { useEffect, useState } from 'react';
import {
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
import { Security } from '@carbon/icons-react';
import { getVulnerabilities, type Vulnerability } from '@/lib/api';

const SEV_TAG: Record<string, 'red' | 'magenta' | 'purple' | 'blue' | 'gray'> = {
  critical: 'red',
  high: 'magenta',
  medium: 'purple',
  low: 'blue',
};

const getSeverityTag = (severity: string) => (
  <Tag type={SEV_TAG[severity.toLowerCase()] ?? 'gray'} size="sm">
    {severity.toUpperCase()}
  </Tag>
);

const getEcosystemTag = (ecosystem: string) => {
  const types: Record<string, 'teal' | 'cyan' | 'warm-gray'> = {
    npm: 'teal',
    python: 'cyan',
    code: 'warm-gray',
  };
  return <Tag type={types[ecosystem] ?? 'gray'} size="sm">{ecosystem}</Tag>;
};

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVulnerabilities(200)
      .then((res) => setVulns(res.vulnerabilities))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const bySeverity = (sev: string) => vulns.filter((v) => v.severity.toLowerCase() === sev).length;

  const summary = [
    { label: 'Critical', count: bySeverity('critical'), color: 'red' as const },
    { label: 'High', count: bySeverity('high'), color: 'magenta' as const },
    { label: 'Medium', count: bySeverity('medium'), color: 'purple' as const },
    { label: 'Low', count: bySeverity('low'), color: 'blue' as const },
  ];

  const headers = [
    { key: 'identifier', header: 'CVE / Rule' },
    { key: 'package', header: 'Package / Location' },
    { key: 'ecosystem', header: 'Type' },
    { key: 'severity', header: 'Severity' },
  ];

  const rows = vulns.map((v, i) => ({
    id: String(v.id ?? i),
    identifier: v.cve || v.rule_id || v.package,
    package: v.ecosystem === 'code' && v.file_path
      ? `${v.file_path}:${v.line_number}`
      : v.package,
    ecosystem: v.ecosystem,
    severity: v.severity,
  }));

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
          Vulnerabilities
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Track security findings across all scanned repositories
        </p>
      </div>

      {/* Summary Cards */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        {summary.map((item, index) => (
          <Column key={index} sm={4} md={2} lg={4}>
            <Tile style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--cds-text-primary)', marginBottom: '0.25rem' }}>
                {loading ? '…' : item.count}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{item.label}</div>
            </Tile>
          </Column>
        ))}
      </Grid>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <InlineLoading description="Loading vulnerabilities…" />
        </div>
      )}

      {error && (
        <InlineNotification
          kind="error"
          title="Could not load vulnerabilities"
          subtitle={error}
          hideCloseButton
        />
      )}

      {!loading && !error && vulns.length === 0 && (
        <Tile>
          <p style={{ color: 'var(--cds-text-secondary)', padding: '1rem 0' }}>
            No vulnerabilities found. Run a workflow to scan a repository.
          </p>
        </Tile>
      )}

      {!loading && !error && vulns.length > 0 && (
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
                    const vuln = vulns[index];
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableCell key={`${row.id}-identifier`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '8px',
                              background: 'var(--cds-layer-accent-01)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Security size={20} />
                            </div>
                            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: '0.875rem' }}>
                              {vuln.cve || vuln.rule_id || vuln.package}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell key={`${row.id}-package`}>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                            {vuln.ecosystem === 'code' && vuln.file_path
                              ? `${vuln.file_path}:${vuln.line_number}`
                              : vuln.package}
                          </span>
                        </TableCell>
                        <TableCell key={`${row.id}-ecosystem`}>{getEcosystemTag(vuln.ecosystem)}</TableCell>
                        <TableCell key={`${row.id}-severity`}>{getSeverityTag(vuln.severity)}</TableCell>
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
