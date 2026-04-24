import React from 'react'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-group">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M2 20 L8 8 L11 14 L14 6 L20 20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="14" r="2.5" fill="var(--accent)" opacity="0.3"/>
              <circle cx="11" cy="14" r="1.2" fill="var(--accent)"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">NumLab</span>
            <span className="logo-sep">/</span>
            <span className="logo-sub">Métodos Numéricos</span>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge badge-cyan">v1.0</span>
          <span className="badge badge-dim">Bisección · N-R · Secante · +2</span>
        </div>
      </div>

      <style>{`
        .header {
          height: 60px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          max-width: 1600px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }
        .logo-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: var(--accent-dim);
          border: 1px solid rgba(0,229,255,0.25);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-name {
          font-family: var(--font-sans);
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .logo-sep {
          color: var(--text-muted);
          font-weight: 300;
        }
        .logo-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .header-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .badge {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 99px;
          border: 1px solid;
        }
        .badge-cyan {
          background: var(--accent-dim);
          border-color: rgba(0,229,255,0.3);
          color: var(--accent);
        }
        .badge-dim {
          background: transparent;
          border-color: var(--border);
          color: var(--text-muted);
        }
        @media (max-width: 600px) {
          .header-badges { display: none; }
          .logo-sub { display: none; }
        }
      `}</style>
    </header>
  )
}
