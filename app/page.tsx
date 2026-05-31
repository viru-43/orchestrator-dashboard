'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@carbon/react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard on load
    router.push('/dashboard');
  }, [router]);

  return (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center' }} className="animate-fade-in">
          <div style={{
            marginBottom: '2rem',
            display: 'inline-flex',
            padding: '1.5rem',
            borderRadius: '50%',
            background: 'var(--cds-layer-01)',
            border: '2px solid var(--cds-border-subtle-01)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L4 8v8c0 7.732 5.373 14.988 12 16.708 6.627-1.72 12-8.976 12-16.708V8L16 2z"
                fill="var(--cds-interactive-01)"
              />
              <path
                d="M16 8L10 11v4c0 3.866 2.686 7.494 6 8.354 3.314-.86 6-4.488 6-8.354v-4l-6-3z"
                fill="var(--cds-background)"
              />
            </svg>
          </div>
          
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--cds-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Orchestrator Dashboard
          </h1>
          
          <p style={{
            fontSize: '1.125rem',
            marginBottom: '2rem',
            color: 'var(--cds-text-secondary)',
          }}>
            Redirecting to dashboard...
          </p>
          
          <Loading withOverlay={false} />
        </div>
      </div>
  );
}

// Made with Bob
