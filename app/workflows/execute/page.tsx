'use client';

import WorkflowPipeline from '@/components/workflow/WorkflowPipeline';
import { Button, TextInput, TextInputSkeleton, Select, SelectItem, InlineNotification } from '@carbon/react';
import { Play, Reset } from '@carbon/icons-react';
import { useState } from 'react';

export default function ExecuteWorkflowPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalStatus, setFinalStatus] = useState<'completed' | 'failed' | null>(null);

  const handleExecute = () => {
    if (!repoUrl.trim()) return;
    setFinalStatus(null);
    setIsExecuting(true);
  };

  const handleReset = () => {
    setIsExecuting(false);
    setFinalStatus(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-text-primary)' }}>
          Execute Workflow
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Trigger a security scan and automated remediation workflow for a GitHub repository.
        </p>
      </div>

      {/* Configuration Form */}
      {!isExecuting && (
        <div style={{
          background: 'var(--cds-layer-01)',
          border: '1px solid var(--cds-border-subtle-00)',
          borderRadius: '4px',
          padding: '2rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--cds-text-primary)' }}>
            Repository Configuration
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '560px' }}>
            <TextInput
              id="repo-url"
              labelText="Repository URL"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              size="lg"
            />

            <Select
              id="branch"
              labelText="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="lg"
            >
              <SelectItem value="main" text="main" />
              <SelectItem value="develop" text="develop" />
              <SelectItem value="staging" text="staging" />
            </Select>

            <div>
              <Button
                kind="primary"
                size="lg"
                renderIcon={Play}
                onClick={handleExecute}
                disabled={!repoUrl.trim()}
              >
                Start Workflow
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status banner after completion */}
      {finalStatus === 'completed' && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="success"
            title="Workflow completed successfully."
            subtitle="All findings processed and a pull request has been raised."
            hideCloseButton
          />
        </div>
      )}
      {finalStatus === 'failed' && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="error"
            title="Workflow failed."
            subtitle="Check the event log for details."
            hideCloseButton
          />
        </div>
      )}

      {/* Workflow Visualization (real SSE) */}
      {isExecuting && (
        <>
          <WorkflowPipeline
            repoUrl={repoUrl}
            branch={branch}
            onComplete={(status) => setFinalStatus(status)}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <Button kind="secondary" size="md" renderIcon={Reset} onClick={handleReset}>
              Run Another Workflow
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
