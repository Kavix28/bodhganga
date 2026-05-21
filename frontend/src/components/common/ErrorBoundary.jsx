import { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-3xl font-bold text-emerald-700 mb-3 font-serif">Something went wrong</h1>
                        <p className="text-slate-600 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="btn-emerald"
                            >
                                Try Again
                            </button>
                            <Link to="/" className="btn-outline">
                                Go Home
                            </Link>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="mt-6 text-left text-xs bg-red-50 border border-red-200 rounded-lg p-4 overflow-auto text-red-700">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
