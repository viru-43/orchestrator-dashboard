'use client';

import { Navigation } from './Navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ 
        marginLeft: '256px',
        flex: 1,
        background: 'var(--cds-background)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}

// Made with Bob
