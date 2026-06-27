'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  InlineLoading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Accordion,
  AccordionItem,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  ProgressIndicator,
  ProgressStep,
} from '@carbon/react';
import {
  ArrowLeft,
  CheckmarkFilled,
  ErrorFilled,
  Renew,
  Security,
  PullRequest,
  Analytics,
  Time,
  InProgress,
  WarningAlt,
} from '@carbon/icons-react';
import Link from 'next/link';
import { getWorkflowById, rerunWorkflow } from '@/lib/api';

// ── Types matching backend serialisers ────────────────────────────────────

interface Finding {
  id: number;
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
}

interface Analysis {
  id: number;
  ecosystem: string;
  dependency: string;
  issue_type: string;
  severity: string;
  cvss_score: number | null;
  cve: string;
  cwe: string;
  fix_strategy: string;
  recommended_version: string;
  explanation: string;
  nvd_enriched: boolean;
}

interface Validation {
  id: number;
  attempt_number: number;
  passed: boolean;
  details: string;
  created_at: string | null;
}

interface PR {
  id: number;
  pr_url: string;
  pr_number: number | null;
  branch: string;
  base_branch: string;
  status: string;
  created_at: string | null;
}

interface WorkflowDetail {
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
  findings: Finding[];
  analyses: Analysis[];
  validations: Validation[];
  pull_requests: PR[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(start: string | null, end: string | null) {
  if (!start) return '—';
  const secs = Math.round((new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatTs(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

const SEV_TAG: Record<string, 'red' | 'magenta' | 'purple' | 'blue' | 'gray'> = {
  critical: 'red', high: 'magenta', medium: 'purple', low: 'blue',
};

const ECO_TAG: Record<string, 'teal' | 'cyan' | 'warm-gray'> = {
  npm: 'teal', python: 'cyan', code: 'warm-gray',
};

const SevTag = ({ s }: { s: string }) => (
  <Tag type={SEV_TAG[s.toLowerCase()] ?? 'gray'} size="sm">{s.toUpperCase()}</Tag>
);

const EcoTag = ({ e }: { e: string }) => (
  <Tag type={ECO_TAG[e] ?? 'gray'} size="sm">{e}</Tag>
);

// ── Agent pipeline inference ──────────────────────────────────────────────

type StepStatus = 'complete' | 'current' | 'incomplete' | 'invalid';

interface PipelineStep {
  label: string;
  secondaryLabel: string;
  status: StepStatus;
}

function inferPipeline(wf: WorkflowDetail): PipelineStep[] {
  const running = wf.status === 'running';
  const failed = wf.status === 'failed';
  const hasFindings = wf.findings.length > 0;
  const hasAnalyses = wf.analyses.length > 0;
  const hasValidations = wf.validations.length > 0;
  const hasPRs = wf.pull_requests.length > 0;
  const lastVal = wf.validations[wf.validations.length - 1];
  const validationPassed = lastVal?.passed ?? false;
  const noVulns = !running && wf.status === 'completed' && wf.total_findings === 0;

  // Scanner
  const scannerDone = hasFindings || noVulns;
  const scannerStatus: StepStatus = scannerDone ? 'complete' : running ? 'current' : failed ? 'invalid' : 'incomplete';

  // Analysis
  const analysisDone = hasAnalyses || noVulns;
  const analysisStatus: StepStatus = analysisDone
    ? 'complete'
    : scannerDone && running ? 'current'
    : scannerDone && failed ? 'invalid'
    : 'incomplete';

  // Remediation
  const remediationDone = hasValidations || noVulns;
  const remediationStatus: StepStatus = remediationDone
    ? 'complete'
    : analysisDone && running ? 'current'
    : analysisDone && failed ? 'invalid'
    : 'incomplete';

  // Validation
  const validationDone = (hasValidations && validationPassed) || noVulns;
  const validationInvalid = hasValidations && !validationPassed && !running;
  const validationStatus: StepStatus = validationDone
    ? 'complete'
    : validationInvalid ? 'invalid'
    : remediationDone && running ? 'current'
    : 'incomplete';

  // PR
  const prStatus: StepStatus = hasPRs
    ? 'complete'
    : validationDone && running ? 'current'
    : validationDone && !hasPRs && !running ? 'incomplete'
    : 'incomplete';

  return [
    {
      label: 'Scanner',
      secondaryLabel: scannerDone && !noVulns ? `${wf.findings.length} finding(s)` : noVulns ? 'Clean' : '',
      status: scannerStatus,
    },
    {
      label: 'Analysis',
      secondaryLabel: analysisDone && !noVulns ? `${wf.analyses.length} record(s)` : '',
      status: analysisStatus,
    },
    {
      label: 'Remediation',
      secondaryLabel: wf.remediation_attempts > 0 ? `${wf.remediation_attempts} attempt(s)` : '',
      status: remediationStatus,
    },
    {
      label: 'Validation',
      secondaryLabel: hasValidations
        ? validationPassed ? 'Passed' : `Failed (${wf.validations.length} attempt(s))`
        : '',
      status: validationStatus,
    },
    {
      label: 'PR Agent',
      secondaryLabel: hasPRs ? 'PR created' : '',
      status: prStatus,
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [wf, setWf] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  const handleRerun = async () => {
    if (!wf) return;
    setRerunning(true);
    setRerunError(null);
    try {
      const res = await rerunWorkflow(wf.id);
      router.push(`/workflows/${res.new_workflow_id}`);
    } catch (err) {
      setRerunError(String(err));
      setRerunning(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    getWorkflowById(id)
      .then((data) => setWf(data as WorkflowDetail))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll every 3 s while the workflow is still running
  useEffect(() => {
    if (!id || !wf || wf.status !== 'running') return;
    const timer = setInterval(() => {
      getWorkflowById(id)
        .then((data) => setWf(data as WorkflowDetail))
        .catch(() => { /* silent — keep showing last known state */ });
    }, 3000);
    return () => clearInterval(timer);
  }, [id, wf?.status]);

  if (loading) return (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <InlineLoading description="Loading workflow…" />
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem' }}>
      <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => router.back()} style={{ marginBottom: '1rem' }}>
        Back
      </Button>
      <InlineNotification kind="error" title="Could not load workflow" subtitle={error} hideCloseButton />
    </div>
  );

  if (!wf) return null;

  const statusColor = wf.status === 'completed' ? 'green' : wf.status === 'failed' ? 'red' : 'blue';
  const StatusIcon = wf.status === 'completed' ? CheckmarkFilled : wf.status === 'failed' ? ErrorFilled : Renew;
  const repoLabel = wf.repo_url.replace('https://github.com/', '');


  return (
    <div style={{ padding: '2rem' }}>

      {/* Back button */}
      <Link href="/workflows">
        <Button kind="ghost" size="sm" renderIcon={ArrowLeft} style={{ marginBottom: '1.5rem' }}>
          All Workflows
        </Button>
      </Link>

      {/* Header tile */}
      <Tile style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <StatusIcon size={24} style={{ color: `var(--cds-support-${statusColor === 'blue' ? 'info' : statusColor === 'green' ? 'success' : 'error'})` }} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--cds-text-primary)', margin: 0 }}>
                {repoLabel}
              </h1>
              <Tag type={statusColor} size="md">
                {wf.status.charAt(0).toUpperCase() + wf.status.slice(1)}
              </Tag>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
              {wf.id}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            {wf.status === 'failed' && (
              <Button
                kind="danger--ghost"
                size="sm"
                renderIcon={Renew}
                onClick={handleRerun}
                disabled={rerunning}
              >
                {rerunning ? 'Starting…' : 'Re-run'}
              </Button>
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>Branch</div>
              <Tag type="blue" size="sm">{wf.branch}</Tag>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>Triggered by</div>
              <Tag type="gray" size="sm">{wf.triggered_by}</Tag>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>Duration</div>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>
                {formatDuration(wf.started_at, wf.completed_at)}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>Started</div>
              <span style={{ fontSize: '0.875rem' }}>{formatTs(wf.started_at)}</span>
            </div>
          </div>
        </div>

        {wf.error_message && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--cds-support-error-inverse)', borderRadius: '4px' }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: 'var(--cds-text-inverse)' }}>
              {wf.error_message}
            </span>
          </div>
        )}
        {rerunError && (
          <InlineNotification
            kind="error"
            title="Re-run failed"
            subtitle={rerunError}
            hideCloseButton={false}
            onCloseButtonClick={() => setRerunError(null)}
            style={{ marginTop: '0.75rem' }}
          />
        )}
      </Tile>

      {/* KPI row */}
      <Grid narrow style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Findings', value: wf.total_findings, icon: Security, color: 'red' },
          { label: 'Remediated', value: wf.total_remediated, icon: CheckmarkFilled, color: 'green' },
          { label: 'Attempts', value: wf.remediation_attempts, icon: Renew, color: 'blue' },
          { label: 'Validation', value: wf.validation_passed === true ? '✅ Passed' : wf.validation_passed === false ? '❌ Failed' : '—', icon: Analytics, color: 'purple' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <Column key={i} sm={4} md={2} lg={4}>
              <Tile style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '8px',
                  background: `var(--cds-${card.color}-20)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={22} style={{ color: `var(--cds-${card.color}-60)` }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.1, color: 'var(--cds-text-primary)' }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>{card.label}</div>
                </div>
              </Tile>
            </Column>
          );
        })}
      </Grid>

      {/* Agent Pipeline */}
      <Tile style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <InProgress size={20} style={{ color: 'var(--cds-interactive-01)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Agent Pipeline</span>
          {wf.status === 'running' && (
            <InlineLoading description="Running…" style={{ marginLeft: 'auto' }} />
          )}
        </div>
        <ProgressIndicator
          currentIndex={inferPipeline(wf).findIndex((s) => s.status === 'current')}
          spaceEqually
        >
          {inferPipeline(wf).map((step) => (
            <ProgressStep
              key={step.label}
              label={step.label}
              secondaryLabel={step.secondaryLabel || undefined}
              complete={step.status === 'complete'}
              current={step.status === 'current'}
              invalid={step.status === 'invalid'}
              disabled={step.status === 'incomplete'}
            />
          ))}
        </ProgressIndicator>
      </Tile>

      {/* Pull Request */}
      {(wf.pr_url || wf.pull_requests?.length > 0) && (
        <Tile style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <PullRequest size={24} style={{ color: 'var(--cds-support-success)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Pull Request Created</div>
            <a
              href={wf.pr_url ?? wf.pull_requests?.[0]?.pr_url ?? '#'}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}
            >
              {wf.pr_url ?? wf.pull_requests?.[0]?.pr_url}
            </a>
          </div>
          {wf.pull_requests?.[0]?.branch && (
            <Tag type="blue" size="sm">{wf.pull_requests[0].branch}</Tag>
          )}
        </Tile>
      )}

      <Accordion>

        {/* Findings */}
        <AccordionItem
          title={
            <span style={{ fontWeight: 600 }}>
              Scan Findings
              <Tag type="red" size="sm" style={{ marginLeft: '0.5rem' }}>{wf.findings.length}</Tag>
            </span>
          }
          open={wf.findings.length > 0}
        >
          {wf.findings.length === 0 ? (
            <p style={{ color: 'var(--cds-text-secondary)', padding: '0.5rem 0' }}>No findings recorded.</p>
          ) : (
            <TableContainer>
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader style={{ width: '14%' }}>CVE / Rule</TableHeader>
                    <TableHeader style={{ width: '14%' }}>Package / Location</TableHeader>
                    <TableHeader style={{ width: '8%' }}>Type</TableHeader>
                    <TableHeader style={{ width: '10%' }}>Severity</TableHeader>
                    <TableHeader>Overview</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wf.findings.map((f, i) => {
                    const identifier = f.cve || f.cwe || f.rule_id || f.package || '—';
                    const location = f.ecosystem === 'code' && f.file_path
                      ? `${f.file_path}:${f.line_number}`
                      : (f.package || '—');
                    return (
                      <TableRow key={f.id ?? i}>
                        <TableCell>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                            {identifier}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                            {location}
                          </span>
                        </TableCell>
                        <TableCell><EcoTag e={f.ecosystem} /></TableCell>
                        <TableCell><SevTag s={f.severity} /></TableCell>
                        <TableCell>
                          <span style={{
                            fontSize: '0.8125rem',
                            color: 'var(--cds-text-secondary)',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '360px',
                          }}>
                            {f.overview || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionItem>

        {/* Analysis */}
        <AccordionItem
          title={
            <span style={{ fontWeight: 600 }}>
              Analysis Results
              <Tag type="purple" size="sm" style={{ marginLeft: '0.5rem' }}>{wf.analyses.length}</Tag>
            </span>
          }
        >
          {wf.analyses.length === 0 ? (
            <p style={{ color: 'var(--cds-text-secondary)', padding: '0.5rem 0' }}>No analysis records.</p>
          ) : (
            <StructuredListWrapper>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>Dependency / Location</StructuredListCell>
                  <StructuredListCell head>Issue Type</StructuredListCell>
                  <StructuredListCell head>Severity</StructuredListCell>
                  <StructuredListCell head>CVSS</StructuredListCell>
                  <StructuredListCell head>Fix Strategy</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {wf.analyses.map((a) => (
                  <StructuredListRow key={a.id}>
                    <StructuredListCell>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                        {a.dependency}
                      </span>
                      {a.nvd_enriched && (
                        <Tag type="green" size="sm" style={{ marginLeft: '0.5rem' }}>NVD</Tag>
                      )}
                    </StructuredListCell>
                    <StructuredListCell>{a.issue_type}</StructuredListCell>
                    <StructuredListCell><SevTag s={a.severity} /></StructuredListCell>
                    <StructuredListCell>
                      {a.cvss_score != null
                        ? <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{a.cvss_score.toFixed(1)}</span>
                        : <span style={{ color: 'var(--cds-text-secondary)' }}>—</span>}
                    </StructuredListCell>
                    <StructuredListCell>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
                        {a.fix_strategy}
                        {a.recommended_version ? ` → ${a.recommended_version}` : ''}
                      </span>
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          )}
        </AccordionItem>

        {/* Validation */}
        <AccordionItem
          title={
            <span style={{ fontWeight: 600 }}>
              Validation Attempts
              <Tag type="blue" size="sm" style={{ marginLeft: '0.5rem' }}>{wf.validations.length}</Tag>
            </span>
          }
        >
          {wf.validations.length === 0 ? (
            <p style={{ color: 'var(--cds-text-secondary)', padding: '0.5rem 0' }}>No validation records.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {wf.validations.map((v) => (
                <div key={v.id} style={{
                  padding: '0.75rem 1rem', borderRadius: '4px',
                  border: `1px solid ${v.passed ? 'var(--cds-support-success)' : 'var(--cds-support-error)'}`,
                  background: v.passed ? 'var(--cds-support-success-inverse)' : 'var(--cds-support-error-inverse)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    {v.passed
                      ? <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success)' }} />
                      : <WarningAlt size={16} style={{ color: 'var(--cds-support-error)' }} />}
                    <span style={{ fontWeight: 600 }}>Attempt {v.attempt_number}</span>
                    <Tag type={v.passed ? 'green' : 'red'} size="sm">{v.passed ? 'Passed' : 'Failed'}</Tag>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginLeft: 'auto' }}>
                      {formatTs(v.created_at)}
                    </span>
                  </div>
                  {v.details && (
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {v.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AccordionItem>

      </Accordion>
    </div>
  );
}
