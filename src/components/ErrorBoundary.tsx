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

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('scoders_temp_reg');
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
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
              Application Guard Recovery
            </h2>

            <p className="text-slate-300 text-xs font-sans leading-relaxed mb-6">
              A temporary interface state was contained safely. Tap below to resume seamlessly.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleRecover}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Resume Application</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#5C7C89]/40 hover:bg-[#5C7C89] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
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
