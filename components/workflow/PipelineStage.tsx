'use client';

import { Tile, Tag, Accordion, AccordionItem, ProgressBar } from '@carbon/react';
import { CheckmarkFilled, InProgress, WarningAlt, Pending } from '@carbon/icons-react';

interface Stage {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'current' | 'incomplete' | 'error';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  details?: string[];
  progress?: number;
}

interface PipelineStageProps {
  stage: Stage;
}

export default function PipelineStage({ stage }: PipelineStageProps) {
  const Icon = stage.icon;
  
  const getStatusIcon = () => {
    switch (stage.status) {
      case 'complete':
        return <CheckmarkFilled size={20} className="text-[#24a148]" />;
      case 'current':
        return <InProgress size={20} className="text-[#0f62fe]" />;
      case 'error':
        return <WarningAlt size={20} className="text-[#da1e28]" />;
      default:
        return <Pending size={20} className="text-[#8d8d8d]" />;
    }
  };

  const getStatusTag = () => {
    switch (stage.status) {
      case 'complete':
        return <Tag type="green">Complete</Tag>;
      case 'current':
        return <Tag type="blue">Running</Tag>;
      case 'error':
        return <Tag type="red">Error</Tag>;
      default:
        return <Tag type="gray">Pending</Tag>;
    }
  };

  return (
    <div className="pipeline-stage mb-4">
      <Tile
        className="transition-all duration-300"
        style={{
          borderLeft: stage.status === 'current' ? '4px solid var(--interactive-primary)' :
                     stage.status === 'complete' ? '4px solid var(--agent-complete)' :
                     stage.status === 'error' ? '4px solid var(--agent-error)' : 'none',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div
              style={{
                color: stage.status === 'complete' ? 'var(--agent-complete)' :
                       stage.status === 'current' ? 'var(--interactive-primary)' :
                       stage.status === 'error' ? 'var(--agent-error)' :
                       'var(--text-tertiary)'
              }}
            >
              <Icon size={32} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--foreground)' }}
                >
                  {stage.label}
                </h3>
                {getStatusIcon()}
                {getStatusTag()}
              </div>
              
              <p
                className="mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {stage.description}
              </p>
              
              {stage.status === 'current' && stage.progress !== undefined && (
                <ProgressBar
                  label="Progress"
                  value={stage.progress}
                  hideLabel={false}
                  className="mb-3"
                />
              )}
              
              {stage.details && stage.details.length > 0 && (
                <Accordion>
                  <AccordionItem title="Details">
                    <ul className="space-y-2">
                      {stage.details.map((detail, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-center gap-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <span style={{ color: 'var(--interactive-primary)' }}>•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </Tile>
    </div>
  );
}

// Made with Bob
