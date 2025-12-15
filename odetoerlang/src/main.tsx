import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast'

// Simple error boundary that doesn't depend on any UI components
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#09090b',
          color: '#ef4444',
          padding: '2rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#22d3ee', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Application Error</h1>
          <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #27272a', maxWidth: '40rem', width: '100%' }}>
            <p style={{ marginBottom: '1rem', color: '#fff' }}>{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#22d3ee',
                color: '#09090b',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <ToastProvider>
      <App />
    </ToastProvider>
  </RootErrorBoundary>
)
