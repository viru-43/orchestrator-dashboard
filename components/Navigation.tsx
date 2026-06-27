'use client';

import {
  SideNav,
  SideNavItems,
  SideNavLink,
} from '@carbon/react';
import {
  Dashboard,
  Bot,
  Flow,
  DocumentTasks,
  Security,
  Settings,
  Light,
  Asleep,
  Time,
  Events,
} from '@carbon/icons-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useSyncExternalStore } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  // Prevent hydration mismatch
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Dashboard },
    { href: '/agents', label: 'Agents', icon: Bot },
    { href: '/workflows', label: 'Workflows', icon: Flow },
    { href: '/scheduled', label: 'Scheduled', icon: Time },
    { href: '/webhooks', label: 'Webhooks', icon: Events },
    { href: '/pull-requests', label: 'Pull Requests', icon: DocumentTasks },
    { href: '/vulnerabilities', label: 'Vulnerabilities', icon: Security },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <SideNav 
      aria-label="Side navigation" 
      isFixedNav
      expanded
      style={{
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
      }}
    >
      {/* Logo/Brand */}
      <div style={{
        padding: '1.5rem 1rem',
        borderBottom: '1px solid var(--cds-border-subtle-01)',
        marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--cds-interactive-01) 0%, var(--cds-interactive-02) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'white',
          }}>
            O
          </div>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--cds-text-primary)',
              lineHeight: 1.2,
            }}>
              Orchestrator
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}>
              Dashboard
            </div>
          </div>
        </div>
      </div>

      <SideNavItems>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <SideNavLink
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              renderIcon={Icon}
              style={{
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </SideNavLink>
          );
        })}
        
        {/* Theme Toggle as Navigation Item */}
        <div style={{
          borderTop: '1px solid var(--cds-border-subtle-01)',
          marginTop: '1rem',
          paddingTop: '1rem',
        }}>
          {!mounted ? (
            <button
              disabled
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--cds-text-primary)',
                cursor: 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '4px',
                margin: '0 0.75rem',
                opacity: 0.5,
              }}
            >
              <Light size={20} style={{ flexShrink: 0 }} />
              <span>Theme</span>
            </button>
          ) : (
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--cds-text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background 0.15s',
                borderRadius: '4px',
                margin: '0 0.75rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cds-layer-hover-01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Light size={20} style={{ flexShrink: 0 }} />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Asleep size={20} style={{ flexShrink: 0 }} />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </SideNavItems>
    </SideNav>
  );
}

// Made with Bob
