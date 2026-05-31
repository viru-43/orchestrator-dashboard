'use client';

import { Tile, Tag, ProgressBar, Accordion, AccordionItem } from '@carbon/react';
import { CheckmarkFilled, InProgress, Pending } from '@carbon/icons-react';

interface SequentialStage {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'current' | 'incomplete' | 'error';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  details?: string[];
  progress?: number;
}

interface SequentialStagesProps {
  title: string;
  stages: SequentialStage[];
}

export default function SequentialStages({ title, stages }: SequentialStagesProps) {
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
        
        <div className="sequential-stages">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="relative">
                <Tile
                  className="transition-all duration-300"
                  style={{
                    borderLeft: stage.status === 'current' ? '4px solid var(--interactive-primary)' :
                               stage.status === 'complete' ? '4px solid var(--agent-complete)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      style={{
                        color: stage.status === 'complete' ? 'var(--agent-complete)' :
                               stage.status === 'current' ? 'var(--interactive-primary)' :
                               'var(--text-tertiary)'
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4
                          className="text-lg font-semibold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {stage.label}
                        </h4>
                        
                        {stage.status === 'complete' && (
                          <Tag type="green" renderIcon={CheckmarkFilled} size="sm">
                            Complete
                          </Tag>
                        )}
                        
                        {stage.status === 'current' && (
                          <Tag type="blue" renderIcon={InProgress} size="sm">
                            Running
                          </Tag>
                        )}
                        
                        {stage.status === 'incomplete' && (
                          <Tag type="gray" renderIcon={Pending} size="sm">
                            Pending
                          </Tag>
                        )}
                      </div>
                      
                      <p
                        className="text-sm mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {stage.description}
                      </p>
                      
                      {stage.status === 'current' && stage.progress !== undefined && (
                        <ProgressBar
                          label="Progress"
                          value={stage.progress}
                          hideLabel={false}
                          size="small"
                          className="mb-3"
                        />
                      )}
                      
                      {stage.details && stage.details.length > 0 && (
                        <Accordion>
                          <AccordionItem title="Details">
                            <ul className="space-y-1">
                              {stage.details.map((detail, idx) => (
                                <li
                                  key={idx}
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
                    </div>
                  </div>
                </Tile>
                
                {/* Connector line to next stage */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div
                      className="w-0.5 h-4 transition-colors duration-300"
                      style={{ background: 'var(--border-subtle)' }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
