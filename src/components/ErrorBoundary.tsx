import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Grace Application Error Boundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0b0c14 0%, #11121d 100%)',
          color: '#ffffff',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '24px',
          textAlign: 'center',
          zIndex: 999999
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(243, 139, 168, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#f38ba8'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p style={{ margin: '0 0 20px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the interface.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'rgba(137, 180, 250, 0.25)',
                  border: '1px solid rgba(137, 180, 250, 0.4)',
                  color: '#89b4fa',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                Reload Grace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
