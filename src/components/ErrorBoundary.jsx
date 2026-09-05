import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-shell" style={{ padding: "2rem" }}>
          <div className="page-card auth-card" style={{ maxWidth: "480px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 className="page-title" style={{ color: "var(--brand)" }}>Something Went Wrong</h2>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>
              An unexpected error occurred in the application. Don't worry, your data is safe.
            </p>
            <button className="primary" onClick={this.handleReload} style={{ width: "100%" }}>
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
