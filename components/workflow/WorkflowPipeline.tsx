'use client';

import { useState, useEffect, useRef } from 'react';
import { Tile, Tag, InlineLoading } from '@carbon/react';
import {
  Security,
  Analytics,
  Tools,
  CheckmarkFilled,
  PullRequest as GitPullRequest,
  WarningAlt,
  InProgress,
  CircleFill,
} from '@carbon/icons-react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface WorkflowPipelineProps {
  repoUrl: string;
  branch: string;
  onComplete?: (status: 'completed' | 'failed', summary?: Record<string, unknown>) => void;
}

type AgentStatus = 'waiting' | 'running' | 'done' | 'failed';

interface AgentState {
  id: string;
  label: string;
  status: AgentStatus;
  details: string[];
}

const AGENTS: AgentState[] = [
  { id: 'scanner_agent',     label: 'Scanner Agent',     status: 'waiting', details: [] },
  { id: 'github_issue_agent',label: 'GitHub Issues',     status: 'waiting', details: [] },
  { id: 'analysis_agent',    label: 'Analysis Agent',    status: 'waiting', details: [] },
  { id: 'remediation_agent', label: 'Remediation Agent', status: 'waiting', details: [] },
  { id: 'validation_agent',  label: 'Validation Agent',  status: 'waiting', details: [] },
  { id: 'pr_agent',          label: 'PR Agent',          status: 'waiting', details: [] },
];

const StatusIcon = ({ status }: { status: AgentStatus }) => {
  switch (status) {
    case 'running':
      return <InlineLoading style={{ display: 'inline-flex', width: 20, height: 20 }} />;
    case 'done':
      return <CheckmarkFilled size={20} style={{ color: 'var(--cds-support-success)' }} />;
    case 'failed':
      return <WarningAlt size={20} style={{ color: 'var(--cds-support-error)' }} />;
    default:
      return <CircleFill size={20} style={{ color: 'var(--cds-icon-disabled)' }} />;
  }
};

const statusTag = (status: AgentStatus) => {
  const cfg: Record<AgentStatus, { type: 'blue' | 'green' | 'red' | 'gray'; label: string }> = {
    waiting: { type: 'gray', label: 'Waiting' },
    running: { type: 'blue', label: 'Running' },
    done:    { type: 'green', label: 'Done' },
    failed:  { type: 'red', label: 'Failed' },
  };
  const { type, label } = cfg[status];
  return <Tag type={type} size="sm">{label}</Tag>;
};

export default function WorkflowPipeline({ repoUrl, branch, onComplete }: WorkflowPipelineProps) {
  const [agents, setAgents] = useState<AgentState[]>(AGENTS.map((a) => ({ ...a })));
  const [log, setLog] = useState<string[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<'running' | 'completed' | 'failed' | null>('running');
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [prLink, setPrLink] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev.slice(-199), `${new Date().toLocaleTimeString()} — ${msg}`]);

  const patchAgent = (agentId: string, patch: Partial<AgentState>) =>
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, ...patch } : a))
    );

  useEffect(() => {
    const url = `${BASE}/api/workflow/trigger`;
    const body = JSON.stringify({ repo_url: repoUrl, branch, triggered_by: 'ui' });

    // POST → SSE: fetch returns a ReadableStream
    const ctrl = new AbortController();

    (async () => {
      try {
        addLog(`Triggering workflow for ${repoUrl}@${branch}…`);
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body,
          signal: ctrl.signal,
        });

        if (!resp.ok || !resp.body) {
          const text = await resp.text().catch(() => resp.statusText);
          addLog(`Error: ${resp.status} ${text}`);
          setWorkflowStatus('failed');
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double-newlines
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const raw = dataLine.slice(5).trim();
            if (!raw || raw === '[DONE]') continue;

            let evt: Record<string, unknown>;
            try {
              evt = JSON.parse(raw);
            } catch {
              continue;
            }

            const event = evt.event as string | undefined;
            const agent = evt.agent as string | undefined;

            if (event === 'agent_status') {
              const s = evt.status as string;
              if (s === 'started') {
                patchAgent(agent ?? '', { status: 'running' });
                addLog(`[${agent}] started`);
              } else if (s === 'completed') {
                const data = evt.data as Record<string, unknown> | undefined;
                const details: string[] = [];
                if (data?.findings) details.push(`Findings: ${(data.findings as unknown[]).length}`);
                if (data?.analysis) details.push(`Analyses: ${(data.analysis as unknown[]).length}`);
                if (data?.remediation) details.push(`Remediations: ${(data.remediation as unknown[]).length}`);
                if (data?.validation) {
                  const v = data.validation as Record<string, unknown>;
                  details.push(`Validation: ${v.passed ? '✅ passed' : '❌ failed'}`);
                }
                if (data?.pr) {
                  const p = data.pr as Record<string, unknown>;
                  if (p.html_url) {
                    details.push(`PR: ${p.html_url}`);
                    setPrLink(p.html_url as string);
                  }
                }
                patchAgent(agent ?? '', { status: 'done', details });
                addLog(`[${agent}] completed`);
              } else if (s === 'failed') {
                const err = evt.error as Record<string, unknown> | undefined;
                patchAgent(agent ?? '', {
                  status: 'failed',
                  details: [err?.message as string ?? 'unknown error'],
                });
                addLog(`[${agent}] FAILED: ${err?.message ?? ''}`);
              }
            } else if (event === 'workflow_completed') {
              const wfStatus = evt.status as 'completed' | 'failed';
              const wfSummary = evt.summary as Record<string, unknown> | undefined;
              setWorkflowStatus(wfStatus);
              if (wfSummary) setSummary(wfSummary);
              if (wfSummary?.pr_link) setPrLink(wfSummary.pr_link as string);
              addLog(`Workflow ${wfStatus === 'completed' ? '✅ completed' : '❌ failed'}`);
              onComplete?.(wfStatus, wfSummary);
            }
          }
        }
      } catch (err) {
        if (!ctrl.signal.aborted) {
          addLog(`Connection error: ${err}`);
          setWorkflowStatus('failed');
        }
      }
    })();

    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <Tile>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--cds-text-primary)' }}>
              {repoUrl.replace('https://github.com/', '')}
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Branch: {branch}</span>
          </div>
          <div>
            {workflowStatus === 'running' && (
              <Tag type="blue" size="md" renderIcon={InProgress}>Running</Tag>
            )}
            {workflowStatus === 'completed' && (
              <Tag type="green" size="md" renderIcon={CheckmarkFilled}>Completed</Tag>
            )}
            {workflowStatus === 'failed' && (
              <Tag type="red" size="md" renderIcon={WarningAlt}>Failed</Tag>
            )}
          </div>
        </div>
      </Tile>

      {/* Agent Pipeline */}
      <Tile>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--cds-text-primary)' }}>
          Agent Pipeline
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {agents.map((agent, i) => (
            <div key={agent.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              padding: '0.75rem 1rem', borderRadius: '4px',
              background: agent.status === 'running' ? 'var(--cds-layer-02)' : 'transparent',
              border: `1px solid ${agent.status === 'running' ? 'var(--cds-border-interactive)' : 'var(--cds-border-subtle-00)'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{ marginTop: '2px' }}>
                <StatusIcon status={agent.status} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>
                    {i + 1}. {agent.label}
                  </span>
                  {statusTag(agent.status)}
                </div>
                {agent.details.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>
                    {agent.details.map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </Tile>

      {/* Summary on completion */}
      {workflowStatus === 'completed' && summary && (
        <Tile style={{ background: 'var(--cds-support-success-inverse)', color: 'var(--cds-text-inverse)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <CheckmarkFilled size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Workflow Completed</h3>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {String(summary.total_vulnerabilities ?? 0)} vulnerabilities found ·{' '}
            {String(summary.remediated ?? 0)} remediated ·{' '}
            Validation: {summary.validation === 'passed' ? '✅' : '❌'}
          </p>
          {prLink && (
            <a href={prLink} target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
              View Pull Request →
            </a>
          )}
        </Tile>
      )}

      {workflowStatus === 'failed' && (
        <Tile style={{ background: 'var(--cds-support-error-inverse)', color: 'var(--cds-text-inverse)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <WarningAlt size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Workflow Failed</h3>
          </div>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Check the event log below for details.</p>
        </Tile>
      )}

      {/* Event Log */}
      <Tile>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--cds-text-primary)' }}>
          Event Log
        </h3>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem',
          background: 'var(--cds-layer-02)', borderRadius: '4px',
          padding: '1rem', maxHeight: '240px', overflowY: 'auto',
          color: 'var(--cds-text-secondary)',
        }}>
          {log.length === 0
            ? <span style={{ opacity: 0.6 }}>Connecting…</span>
            : log.map((line, i) => <div key={i}>{line}</div>)
          }
          <div ref={logEndRef} />
        </div>
      </Tile>
    </div>
  );
}
