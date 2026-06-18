import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-4 animate-fade-in-up">
          <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-xl border"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="p-4 rounded-full" style={{ background: 'var(--danger-bg)' }}>
              <AlertTriangle size={32} strokeWidth={1.7} style={{ color: 'var(--danger-fg)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ink-900)' }}>
              Ops! Algo deu errado.
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--ink-500)' }}>
              Ocorreu um erro inesperado ao renderizar esta página. Suas abas e progresso devem estar salvos em cache.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              <span>Recarregar a página</span>
            </button>
            {this.state.error && (
              <div className="w-full mt-4 p-3 rounded-lg text-left overflow-auto text-xs font-mono"
                   style={{ background: 'var(--bg-sunken)', color: 'var(--ink-500)' }}>
                {this.state.error.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
