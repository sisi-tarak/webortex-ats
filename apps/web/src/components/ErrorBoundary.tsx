"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: send to Sentry
    // Sentry.captureException(error, { extra: info });
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
            An unexpected error occurred. Your data is safe — please refresh the page or try again.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left max-w-lg overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
