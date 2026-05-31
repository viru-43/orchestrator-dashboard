'use client';

import { Tile, Tag, ProgressBar, Accordion, AccordionItem } from '@carbon/react';
import { CheckmarkFilled, InProgress, Pending } from '@carbon/icons-react';

interface ParallelStage {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'current' | 'incomplete' | 'error';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  details?: string[];
  findings?: number;
  progress?: number;
}

interface ParallelStagesProps {
  title: string;
  stages: ParallelStage[];
}

export default function ParallelStages({ title, stages }: ParallelStagesProps) {
  return (
    <div className="my-6">
      <div
        className="p-6 rounded-lg transition-all duration-300"
        style={{
          background: 'var(--background-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </h3>
        
        <div className="parallel-stages">
          {stages.map((stage) => {
            const Icon = stage.icon;
            
            return (
              <Tile
                key={stage.id}
                className="transition-all duration-300"
                style={{
                  borderLeft: stage.status === 'current' ? '4px solid var(--interactive-primary)' :
                             stage.status === 'complete' ? '4px solid var(--agent-complete)' : 'none',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    style={{
                      color: stage.status === 'complete' ? 'var(--agent-complete)' :
                             stage.status === 'current' ? 'var(--interactive-primary)' :
                             'var(--text-tertiary)'
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h4
                    className="text-lg font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {stage.label}
                  </h4>
                </div>
                
                <p
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {stage.description}
                </p>
                
                {stage.status === 'complete' && (
                  <Tag type="green" renderIcon={CheckmarkFilled} size="sm">
                    Complete
                  </Tag>
                )}
                
                {stage.status === 'current' && (
                  <>
                    <Tag type="blue" renderIcon={InProgress} size="sm" className="mb-3">
                      Running
                    </Tag>
                    {stage.progress !== undefined && (
                      <ProgressBar
                        label="Progress"
                        value={stage.progress}
                        hideLabel={false}
                        size="small"
                      />
                    )}
                  </>
                )}
                
                {stage.status === 'incomplete' && (
                  <Tag type="gray" renderIcon={Pending} size="sm">
                    Waiting
                  </Tag>
                )}
                
                {stage.findings !== undefined && stage.findings > 0 && (
                  <div
                    className="mt-3 p-3 rounded transition-all duration-300"
                    style={{
                      background: 'var(--background-tertiary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <strong>{stage.findings}</strong> vulnerabilities found
                    </p>
                  </div>
                )}
                
                {stage.details && stage.details.length > 0 && (
                  <Accordion className="mt-3">
                    <AccordionItem title="Details">
                      <ul className="space-y-1">
                        {stage.details.map((detail, index) => (
                          <li
                            key={index}
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            • {detail}
                          </li>
                        ))}
                      </ul>
                    </AccordionItem>
                  </Accordion>
                )}
              </Tile>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
