'use client';

import { useState, useEffect } from 'react';
import { ProgressIndicator, ProgressStep, Tile, Tag, Accordion, AccordionItem, Loading } from '@carbon/react';
import {
  Webhook,
  CloudApp,
  Network_1 as Network,
  Security,
  Analytics,
  Tools,
  CheckmarkFilled,
  PullRequest as GitPullRequest,
  DocumentTasks,
  WarningAlt,
  InProgress,
} from '@carbon/icons-react';
import PipelineStage from './PipelineStage';
import ParallelStages from './ParallelStages';
import SequentialStages from './SequentialStages';

interface WorkflowPipelineProps {
  workflowId: string;
  repoUrl: string;
  branch: string;
}

type StageStatus = 'complete' | 'current' | 'incomplete' | 'error';

interface Stage {
  id: string;
  label: string;
  description: string;
  status: StageStatus;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  details?: string[];
  progress?: number;
}

export default function WorkflowPipeline({ workflowId, repoUrl, branch }: WorkflowPipelineProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stages, setStages] = useState<Stage[]>([
    {
      id: 'push',
      label: '1. GitHub Push Event',
      description: 'Developer commits + pushes code',
      status: 'complete',
      icon: Webhook,
      details: [`Commit: ${workflowId.split('_')[0]}`, `Branch: ${branch}`, `Repository: ${repoUrl}`],
    },
    {
      id: 'cicd',
      label: '2. GitHub Actions (CI/CD)',
      description: 'Workflow fires, calls FastAPI backend',
      status: 'complete',
      icon: CloudApp,
      details: ['Webhook received', 'Payload validated', 'Workflow queued'],
    },
    {
      id: 'orchestrator',
      label: '3. Orchestrator',
      description: 'FastAPI + LangGraph state machine',
      status: 'current',
      icon: Network,
      details: ['Managing shared state', 'Agent lifecycle + retries', 'Coordinating execution'],
      progress: 45,
    },
  ]);

  const [parallelStages, setParallelStages] = useState({
    scanner: {
      id: 'scanner',
      label: '4a. Scanner Agent',
      description: 'Semgrep + Bandit + AST',
      status: 'current' as StageStatus,
      icon: Security,
      details: ['Semgrep: Complete', 'Bandit: Running', 'AST Analysis: Pending'],
      findings: 3,
      progress: 65,
    },
    analysis: {
      id: 'analysis',
      label: '4b. Analysis Agent',
      description: 'NVD + OSV APIs',
      status: 'incomplete' as StageStatus,
      icon: Analytics,
      details: ['Queries NVD API', 'Queries OSV API', 'Returns CVE ID + CVSS score'],
      progress: 0,
    },
  });

  const [sequentialStages, setSequentialStages] = useState({
    resolution: {
      id: 'resolution',
      label: '5. Resolution Agent',
      description: 'LLM fix generation + Chain-of-Thought',
      status: 'incomplete' as StageStatus,
      icon: Tools,
      details: ['LLM: OpenAI GPT-4', 'Chain-of-Thought reasoning', 'ChromaDB codebase lookup'],
      progress: 0,
    },
    validation: {
      id: 'validation',
      label: '6. Validation Agent',
      description: 'Correctness + compilation + logic preservation',
      status: 'incomplete' as StageStatus,
      icon: CheckmarkFilled,
      details: ['Correctness check', 'Compilation check', 'Logic preservation', 'Retry count: 0/3'],
      progress: 0,
    },
  });

  const [finalStages, setFinalStages] = useState<Stage[]>([
    {
      id: 'pr',
      label: '7. Action Agent - PR Generator',
      description: 'Create branch + commit + raise PR',
      status: 'incomplete',
      icon: GitPullRequest,
      details: ['Create security-fix branch', 'Commit changes', 'Raise pull request'],
    },
    {
      id: 'output',
      label: '8. Pull Request on GitHub',
      description: 'Patched code + CVE IDs + severity + explanation',
      status: 'incomplete',
      icon: DocumentTasks,
      details: ['PR created with fixes', 'CVE IDs documented', 'Severity levels included'],
    },
  ]);

  // Simulate workflow progression
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < 8) {
          // Update stages based on progression
          if (prev === 2) {
            // Start parallel stages
            setParallelStages((ps) => ({
              ...ps,
              scanner: { ...ps.scanner, status: 'current', progress: Math.min((ps.scanner.progress || 0) + 10, 100) },
            }));
          } else if (prev === 3) {
            // Complete scanner, start analysis
            setParallelStages((ps) => ({
              scanner: { ...ps.scanner, status: 'complete', progress: 100 },
              analysis: { ...ps.analysis, status: 'current', progress: 50 },
            }));
          } else if (prev === 4) {
            // Complete parallel stages, start resolution
            setParallelStages((ps) => ({
              ...ps,
              analysis: { ...ps.analysis, status: 'complete', progress: 100 },
            }));
            setSequentialStages((ss) => ({
              ...ss,
              resolution: { ...ss.resolution, status: 'current', progress: 30 },
            }));
          } else if (prev === 5) {
            // Complete resolution, start validation
            setSequentialStages((ss) => ({
              resolution: { ...ss.resolution, status: 'complete', progress: 100 },
              validation: { ...ss.validation, status: 'current', progress: 50 },
            }));
          } else if (prev === 6) {
            // Complete validation, start PR
            setSequentialStages((ss) => ({
              ...ss,
              validation: { ...ss.validation, status: 'complete', progress: 100 },
            }));
            setFinalStages((fs) => [
              { ...fs[0], status: 'current' },
              fs[1],
            ]);
          } else if (prev === 7) {
            // Complete PR, show output
            setFinalStages((fs) => [
              { ...fs[0], status: 'complete' },
              { ...fs[1], status: 'complete' },
            ]);
          }
          return prev + 1;
        }
        return prev;
      });
    }, 3000); // Progress every 3 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="workflow-pipeline">
      {/* Workflow Header */}
      <div
        className="p-6 rounded-lg mb-6 transition-all duration-300"
        style={{
          background: 'var(--background-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--foreground)' }}
        >
          Workflow Execution: {workflowId}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Repository: {repoUrl} • Branch: {branch}
        </p>
      </div>

      {/* Initial Stages */}
      {stages.map((stage) => (
        <PipelineStage key={stage.id} stage={stage} />
      ))}

      {/* Phase A - Parallel Execution */}
      <ParallelStages
        title="Phase A - Parallel Execution"
        stages={[parallelStages.scanner, parallelStages.analysis]}
      />

      {/* Phase B - Sequential Execution */}
      <SequentialStages
        title="Phase B - Sequential Execution"
        stages={[sequentialStages.resolution, sequentialStages.validation]}
      />

      {/* Final Stages */}
      {finalStages.map((stage) => (
        <PipelineStage key={stage.id} stage={stage} />
      ))}

      {/* Workflow Summary */}
      {currentStageIndex >= 8 && (
        <div
          className="p-6 rounded-lg mt-6 transition-all duration-300"
          style={{
            background: 'var(--agent-complete)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex items-center gap-3">
            <CheckmarkFilled size={32} className="text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Workflow Completed Successfully</h3>
              <p className="text-white opacity-90">
                All vulnerabilities have been remediated and a pull request has been created.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
