import { Component, StrictMode } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#000', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          <div style={{
            maxWidth: 480, width: '100%', padding: '32px 28px',
            background: '#1c1c1e', borderRadius: 16, border: '1px solid #3a3a3c',
            color: '#f5f5f7',
          }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, color: '#ff453a' }}>Something went wrong</h2>
            <pre style={{ margin: 0, fontSize: 12, color: '#a1a1a6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(this.state.error as Error).message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20, padding: '10px 20px', background: '#0071e3',
                color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
