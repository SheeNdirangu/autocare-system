import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
            
            <div className="w-16 h-16 bg-red-50 text-[#CC0000] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              We encountered an unexpected error. Please refresh the page or return to the homepage to continue.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#CC0000] hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-md uppercase tracking-wider text-sm"
            >
              Return to Home
            </button>
            
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;