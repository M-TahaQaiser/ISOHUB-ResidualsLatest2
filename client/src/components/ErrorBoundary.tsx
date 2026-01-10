import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "20px", 
          fontFamily: "system-ui, sans-serif",
          maxWidth: "800px",
          margin: "40px auto"
        }}>
          <h1 style={{ color: "#dc2626" }}>Something went wrong</h1>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>
            <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
              Error details
            </summary>
            <div style={{ 
              background: "#f3f4f6", 
              padding: "15px", 
              borderRadius: "4px",
              fontSize: "14px"
            }}>
              <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
              <p><strong>Stack:</strong></p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
