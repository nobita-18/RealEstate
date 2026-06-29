import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#1e293b',
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderTop: '6px solid #ef4444'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
              An unexpected error occurred in this view. You can try reloading the page, or going back.
            </p>
            <div style={{
              textAlign: 'left',
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#dc2626',
              marginBottom: '24px',
              maxHeight: '150px'
            }}>
              <strong>Error:</strong> {this.state.error && this.state.error.toString()}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.history.back()}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#cbd5e1',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
