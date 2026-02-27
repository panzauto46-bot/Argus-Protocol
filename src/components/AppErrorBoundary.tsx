import { Component, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Unexpected runtime error",
    };
  }

  componentDidCatch(error: Error): void {
    console.error("AppErrorBoundary caught:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-xl w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <h1 className="text-xl font-bold text-cyan-400">Argus Runtime Recovery</h1>
          <p className="mt-2 text-sm text-slate-300">
            A runtime error happened. Reload the page to recover.
          </p>
          <p className="mt-3 text-xs text-red-300 break-all">{this.state.message}</p>
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-400 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
