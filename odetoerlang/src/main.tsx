import { StrictMode, Component, type ReactNode } from 'react'
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
          background: '#000',
          color: '#ff3333',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#0ff', marginBottom: '1rem' }}>Application Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ marginTop: '1rem', color: '#888', fontSize: '12px' }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0ff', color: '#000', border: 'none', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
