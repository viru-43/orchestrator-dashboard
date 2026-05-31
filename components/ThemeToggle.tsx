'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@carbon/react';
import { Light, Asleep } from '@carbon/icons-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  // Prevent hydration mismatch
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <Button
        kind="tertiary"
        size="md"
        style={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: '0.75rem',
          color: 'var(--cds-text-primary)',
          borderTop: '1px solid var(--cds-border-subtle-01)',
          borderRadius: 0,
        }}
        disabled
      >
        <Light size={20} />
        <span style={{ color: 'var(--cds-text-primary)' }}>Theme</span>
      </Button>
    );
  }

  return (
    <Button
      kind="tertiary"
      size="md"
      onClick={toggleTheme}
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: '0.75rem',
        color: 'var(--cds-text-primary)',
        borderTop: '1px solid var(--cds-border-subtle-01)',
        borderRadius: 0,
        padding: '1rem',
      }}
    >
      {theme === 'dark' ? (
        <>
          <Light size={20} style={{ color: 'var(--cds-icon-primary)' }} />
          <span style={{ color: 'var(--cds-text-primary)', fontWeight: 500 }}>
            Light Mode
          </span>
        </>
      ) : (
        <>
          <Asleep size={20} style={{ color: 'var(--cds-icon-primary)' }} />
          <span style={{ color: 'var(--cds-text-primary)', fontWeight: 500 }}>
            Dark Mode
          </span>
        </>
      )}
    </Button>
  );
}

// Made with Bob
