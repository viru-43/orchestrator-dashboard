'use client';

import WorkflowPipeline from '@/components/workflow/WorkflowPipeline';
import { Button, TextInput, Select, SelectItem } from '@carbon/react';
import { Play } from '@carbon/icons-react';
import { useState } from 'react';

export default function ExecuteWorkflowPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const handleExecute = () => {
    setIsExecuting(true);
    // Generate mock workflow ID
    const id = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z_${Math.random().toString(36).substr(2, 8)}`;
    setWorkflowId(id);
  };

  return (
    
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-5xl font-semibold mb-3 tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Execute Workflow
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Trigger security remediation workflow for a repository
          </p>
        </div>

        {/* Configuration Form */}
        {!isExecuting && (
          <div
            className="p-8 rounded-lg mb-8 transition-all duration-200"
            style={{
              background: 'var(--background-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              Repository Configuration
            </h2>
            
            <div className="space-y-6 max-w-2xl">
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
              
              <Button
                kind="primary"
                size="lg"
                renderIcon={Play}
                onClick={handleExecute}
                disabled={!repoUrl}
                className="mt-4"
              >
                Start Workflow
              </Button>
            </div>
          </div>
        )}

        {/* Workflow Visualization */}
        {isExecuting && workflowId && (
          <WorkflowPipeline workflowId={workflowId} repoUrl={repoUrl} branch={branch} />
        )}
      </div>
    
  );
}

// Made with Bob
