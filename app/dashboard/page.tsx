'use client';

import { 
  Grid, 
  Column,
  Tile,
  ProgressBar,
  Tag,
  Button,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react';
import { 
  Activity,
  CheckmarkFilled,
  WarningAlt,
  ErrorFilled,
  ArrowRight,
  Renew,
  Time,
} from '@carbon/icons-react';

export default function DashboardPage() {
  const metrics = [
    {
      title: 'Active Workflows',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: Activity,
      color: 'blue',
      description: 'Currently running',
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: CheckmarkFilled,
      color: 'green',
      description: 'Last 30 days',
    },
    {
      title: 'Pending Tasks',
      value: '8',
      change: '-2',
      trend: 'down',
      icon: Time,
      color: 'orange',
      description: 'Awaiting execution',
    },
    {
      title: 'Failed Jobs',
      value: '3',
      change: '+1',
      trend: 'up',
      icon: ErrorFilled,
      color: 'red',
      description: 'Requires attention',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      workflow: 'Data Processing Pipeline',
      status: 'completed',
      time: '2 minutes ago',
      duration: '3m 24s',
    },
    {
      id: 2,
      workflow: 'ML Model Training',
      status: 'running',
      time: '5 minutes ago',
      duration: '12m 45s',
    },
    {
      id: 3,
      workflow: 'API Integration Test',
      status: 'completed',
      time: '15 minutes ago',
      duration: '1m 12s',
    },
    {
      id: 4,
      workflow: 'Database Backup',
      status: 'failed',
      time: '1 hour ago',
      duration: '0m 45s',
    },
    {
      id: 5,
      workflow: 'Report Generation',
      status: 'completed',
      time: '2 hours ago',
      duration: '5m 33s',
    },
  ];

  const getStatusTag = (status: string) => {
    const statusConfig = {
      completed: { type: 'green' as const, label: 'Completed' },
      running: { type: 'blue' as const, label: 'Running' },
      failed: { type: 'red' as const, label: 'Failed' },
      pending: { type: 'gray' as const, label: 'Pending' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Tag type={config.type} size="sm">{config.label}</Tag>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success)' }} />;
      case 'running':
        return <Renew size={16} style={{ color: 'var(--cds-support-info)' }} />;
      case 'failed':
        return <ErrorFilled size={16} style={{ color: 'var(--cds-support-error)' }} />;
      default:
        return <Time size={16} style={{ color: 'var(--cds-support-warning)' }} />;
    }
  };

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
          Dashboard
        </h1>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--cds-text-secondary)',
        }}>
          Monitor your workflows and system performance
        </p>
      </div>

      {/* Metrics Grid */}
      <Grid narrow>
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Column key={index} sm={4} md={4} lg={4}>
              <Tile style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `var(--cds-${metric.color}-20)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={24} style={{ color: `var(--cds-${metric.color}-60)` }} />
                  </div>
                  <Tag 
                    type={metric.trend === 'up' ? 'green' : 'red'} 
                    size="sm"
                  >
                    {metric.change}
                  </Tag>
                </div>
                
                <div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: '0.25rem',
                    color: 'var(--cds-text-primary)',
                  }}>
                    {metric.value}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--cds-text-secondary)',
                    marginBottom: '0.25rem',
                  }}>
                    {metric.title}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--cds-text-secondary)',
                  }}>
                    {metric.description}
                  </div>
                </div>
              </Tile>
            </Column>
          );
        })}
      </Grid>

      {/* Recent Activity */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: 'var(--cds-text-primary)',
          }}>
            Recent Activity
          </h2>
          <Button 
            kind="ghost" 
            size="sm"
            renderIcon={ArrowRight}
          >
            View all
          </Button>
        </div>

        <Tile>
          <StructuredListWrapper>
            <StructuredListHead>
              <StructuredListRow head>
                <StructuredListCell head>Workflow</StructuredListCell>
                <StructuredListCell head>Status</StructuredListCell>
                <StructuredListCell head>Duration</StructuredListCell>
                <StructuredListCell head>Time</StructuredListCell>
              </StructuredListRow>
            </StructuredListHead>
            <StructuredListBody>
              {recentActivity.map((activity) => (
                <StructuredListRow key={activity.id}>
                  <StructuredListCell>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                    }}>
                      {getStatusIcon(activity.status)}
                      <span style={{ fontWeight: 500 }}>
                        {activity.workflow}
                      </span>
                    </div>
                  </StructuredListCell>
                  <StructuredListCell>
                    {getStatusTag(activity.status)}
                  </StructuredListCell>
                  <StructuredListCell>
                    <span style={{ 
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '0.875rem',
                      color: 'var(--cds-text-secondary)',
                    }}>
                      {activity.duration}
                    </span>
                  </StructuredListCell>
                  <StructuredListCell>
                    <span style={{ color: 'var(--cds-text-secondary)' }}>
                      {activity.time}
                    </span>
                  </StructuredListCell>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        </Tile>
      </div>

      {/* System Health */}
      <Grid narrow style={{ marginTop: '2rem' }}>
        <Column sm={4} md={8} lg={8}>
          <Tile>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              marginBottom: '1.5rem',
              color: 'var(--cds-text-primary)',
            }}>
              System Health
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    CPU Usage
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: 'var(--cds-text-secondary)',
                  }}>
                    45%
                  </span>
                </div>
                <ProgressBar value={45} label="" />
              </div>
              
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Memory Usage
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: 'var(--cds-text-secondary)',
                  }}>
                    68%
                  </span>
                </div>
                <ProgressBar value={68} label="" />
              </div>
              
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Storage Usage
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: 'var(--cds-text-secondary)',
                  }}>
                    82%
                  </span>
                </div>
                <ProgressBar value={82} label="" />
              </div>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={8}>
          <Tile>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              marginBottom: '1.5rem',
              color: 'var(--cds-text-primary)',
            }}>
              Quick Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button kind="primary" style={{ justifyContent: 'flex-start' }}>
                Create New Workflow
              </Button>
              <Button kind="secondary" style={{ justifyContent: 'flex-start' }}>
                View All Agents
              </Button>
              <Button kind="tertiary" style={{ justifyContent: 'flex-start' }}>
                System Settings
              </Button>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}

// Made with Bob
