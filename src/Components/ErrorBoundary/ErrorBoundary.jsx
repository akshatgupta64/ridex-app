import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center" role="alert">
          <h2 className="fw-bold mb-3">Something went wrong</h2>
          <p className="text-muted mb-4">
            We hit an unexpected error while rendering this page. Please try again.
          </p>
          <button type="button" className="btn btn-warning fw-bold" onClick={this.handleReload}>
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
