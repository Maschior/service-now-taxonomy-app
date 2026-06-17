import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth, User } from '../contexts/AuthContext';
import { login } from '../services/authApi';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginContext } = useAuth();
  const navigate = useNavigate();

  // Workspace Selection State
  const [step, setStep] = useState<'LOGIN' | 'WORKSPACE'>('LOGIN');
  const [authData, setAuthData] = useState<{user: User, token: string} | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, rememberMe);
      
      // If user has multiple workspaces, ask them to choose
      if (data.user.workspaces && data.user.workspaces.length > 1) {
         setAuthData({ user: data.user, token: data.token });
         const firstWorkspaceId = typeof data.user.workspaces[0] === 'string' 
           ? data.user.workspaces[0] 
           : data.user.workspaces[0]._id;
         setSelectedWorkspace(firstWorkspaceId);
         setStep('WORKSPACE');
      } else {
         loginContext(data.user, data.token);
         navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authData && selectedWorkspace) {
      loginContext(authData.user, authData.token, selectedWorkspace);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)] animate-fade-in-up">
          ServiceNow Taxonomy
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{animationDelay: '100ms'}}>
          {step === 'LOGIN' ? 'Sign in to access your workspace' : 'Selecione o Workspace'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{animationDelay: '200ms'}}>
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-[var(--color-border)]">
          {step === 'LOGIN' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[var(--color-bg)] focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-[var(--color-border)] rounded-md text-[var(--color-text)] p-2.5 transition-colors"
                    placeholder="admin@taxonomy.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[var(--color-bg)] focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-[var(--color-border)] rounded-md text-[var(--color-text)] p-2.5 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-secondary)] hover:text-blue-500 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--color-text)] cursor-pointer select-none">
                    Lembrar-me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Entrando...' : 'Sign in'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6 animate-fade-in-up" onSubmit={handleWorkspaceSubmit}>
              <div className="text-center mb-6">
                <Building2 className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-[var(--color-text)]">Múltiplos Workspaces Encontrados</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Sua conta possui acesso a mais de um ambiente. Selecione qual deseja acessar agora.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Workspace Destino
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {authData?.user.workspaces.map((workspace: any) => {
                    const wid = typeof workspace === 'string' ? workspace : workspace._id;
                    const wname = typeof workspace === 'string' ? 'Workspace ' + workspace.substring(0,6) : workspace.name;
                    const isGlobal = typeof workspace === 'object' && workspace.isGlobal;
                    
                    return (
                      <label 
                        key={wid} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedWorkspace === wid ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
                      >
                        <input
                          type="radio"
                          name="workspace"
                          value={wid}
                          checked={selectedWorkspace === wid}
                          onChange={(e) => setSelectedWorkspace(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="text-sm font-medium text-[var(--color-text)]">{wname}</span>
                          {isGlobal && <span className="text-xs text-blue-500 font-medium">Global</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('LOGIN'); setAuthData(null); }}
                  className="w-full flex justify-center py-2.5 px-4 border border-[var(--color-border)] rounded-md shadow-sm text-sm font-medium text-[var(--color-text)] bg-transparent hover:bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
