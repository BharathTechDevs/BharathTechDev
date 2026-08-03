import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error Boundary Exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#011425] text-white flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1F4959]/60 border border-[#5C7C89]/30 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-[#5C7C89]/20 border border-[#5C7C89]/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
              <ShieldAlert className="w-8 h-8 text-amber-300" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-[#5C7C89]/20 border border-[#5C7C89]/30 text-slate-200 font-mono text-xs uppercase tracking-widest mb-4">
              S-CODERS Application Guard
            </span>

            <h2 className="text-2xl font-serif font-bold text-white mb-3">
              Application Session Exception
            </h2>

            <p className="text-slate-300 text-xs font-sans leading-relaxed mb-6">
              An unhandled rendering exception occurred. We have contained the error safely.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-[#011425]/80 border border-[#5C7C89]/20 rounded-xl text-left font-mono text-[11px] text-slate-300 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-[#5C7C89] hover:bg-white hover:text-[#011425] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleResetState}
                className="flex-1 py-3 px-4 bg-[#011425]/60 border border-[#5C7C89]/30 hover:border-white text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Reset & Reload
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
