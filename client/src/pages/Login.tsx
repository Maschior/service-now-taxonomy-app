import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth, User } from '../contexts/AuthContext';
import { login } from '../services/authApi';
import { Alert, Badge, Button, Card, CardBody, Checkbox, Input } from '../components/ui';

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
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-on-brand font-bold text-2xl mb-4 animate-fade-in-up">
          T
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.08em] text-brand font-medium animate-fade-in-up">
          ServiceNow Taxonomy
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 animate-fade-in-up">
          {step === 'LOGIN' ? 'Acesse sua conta' : 'Selecione o Workspace'}
        </h2>
        <p className="mt-2 text-sm text-ink-500 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {step === 'LOGIN' ? 'Entre para acessar seu workspace' : 'Sua conta possui mais de um ambiente'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <Card className="shadow-md">
          <CardBody className="py-8 px-6 sm:px-10">
          {step === 'LOGIN' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <Alert variant="danger" title="Não foi possível entrar">{error}</Alert>}

              <Input
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@taxonomy.local"
                leftIcon={<Mail size={18} strokeWidth={1.5} />}
              />

              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={18} strokeWidth={1.5} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink-400 hover:text-brand transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                  </button>
                }
              />

              <Checkbox
                label="Lembrar-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {loading ? 'Entrando...' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form className="space-y-6 animate-fade-in-up" onSubmit={handleWorkspaceSubmit}>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-brand-tint flex items-center justify-center mb-4">
                  <Building2 className="text-brand" size={26} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-ink-900">Múltiplos Workspaces</h3>
                <p className="text-sm text-ink-500 mt-1">Selecione qual ambiente deseja acessar agora.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-ink-700 mb-2">Workspace destino</label>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {authData?.user.workspaces.map((workspace: any) => {
                    const wid = typeof workspace === 'string' ? workspace : workspace._id;
                    const wname = typeof workspace === 'string' ? 'Workspace ' + workspace.substring(0, 6) : workspace.name;
                    const isGlobal = typeof workspace === 'object' && workspace.isGlobal;
                    const selected = selectedWorkspace === wid;

                    return (
                      <label
                        key={wid}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selected ? 'border-brand bg-brand-tint' : 'border-line-strong hover:bg-hover'
                        }`}
                      >
                        <input
                          type="radio"
                          name="workspace"
                          value={wid}
                          checked={selected}
                          onChange={(e) => setSelectedWorkspace(e.target.value)}
                          className="h-4 w-4 accent-[var(--brand)] cursor-pointer"
                        />
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-ink-900">{wname}</span>
                        </span>
                        {isGlobal && (
                          <Badge variant="info" className="ml-auto">Global</Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => { setStep('LOGIN'); setAuthData(null); }}
                >
                  Voltar
                </Button>
                <Button type="submit" variant="primary" fullWidth>
                  Continuar
                </Button>
              </div>
            </form>
          )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;
