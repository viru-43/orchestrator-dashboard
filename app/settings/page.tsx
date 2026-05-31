'use client';

import { Tile, Grid, Column } from '@carbon/react';
import { Settings, Integration, Notification, Security } from '@carbon/icons-react';

const settingsCards = [
  {
    icon: Settings,
    title: 'General Settings',
    description: 'Configure general platform settings and preferences',
  },
  {
    icon: Integration,
    title: 'Integrations',
    description: 'Manage GitHub, GitLab, and other integrations',
  },
  {
    icon: Notification,
    title: 'Notifications',
    description: 'Configure alert and notification preferences',
  },
  {
    icon: Security,
    title: 'Security',
    description: 'Manage security policies and access controls',
  },
];

export default function SettingsPage() {
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
            Settings
          </h1>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cds-text-secondary)',
          }}>
            Configure your security platform preferences and integrations
          </p>
        </div>

        {/* Settings Cards Grid */}
        <Grid narrow>
          {settingsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Column key={index} sm={4} md={4} lg={8}>
                <Tile style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  height: '100%',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'var(--cds-layer-accent-01)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        color: 'var(--cds-text-primary)',
                      }}>
                        {card.title}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        color: 'var(--cds-text-secondary)',
                      }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--cds-border-subtle-01)',
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--cds-link-primary)',
                    }}>
                      Configure →
                    </span>
                  </div>
                </Tile>
              </Column>
            );
          })}
        </Grid>

        {/* Additional Info Section */}
        <Tile style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: 'var(--cds-text-primary)',
          }}>
            Need Help?
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--cds-text-secondary)',
          }}>
            Visit our documentation or contact support for assistance with platform configuration.
          </p>
        </Tile>
      </div>
    
  );
}

// Made with Bob
