import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, handleApiError } from '../services/api';
import { User, Key, Save, Lock } from 'lucide-react';
import { Alert, Button, Card, CardBody, Input } from '../components/ui';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhotoUrl(user.photoUrl || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const updatedUser = await userApi.updateProfile({ name, email, photoUrl });
      updateUser({ name: updatedUser.data.name, email: updatedUser.data.email, photoUrl: updatedUser.data.photoUrl });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'A nova senha e a confirmação não conferem.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setPwdLoading(true);
    setPwdMessage(null);
    try {
      await userApi.updatePassword({ currentPassword, newPassword });
      setPwdMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPwdMessage({ type: 'error', text: handleApiError(error) });
    } finally {
      setPwdLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">Meu Perfil</h1>
          <p className="text-ink-500 mt-1">Gerencie suas informações pessoais e a segurança da conta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Informações Pessoais */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardBody className="p-6">
                <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2 mb-6">
                  <User className="text-brand" size={20} strokeWidth={1.5} />
                  Informações Pessoais
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {message && (
                    <Alert variant={message.type === 'success' ? 'success' : 'danger'}>{message.text}</Alert>
                  )}

                  <div className="flex items-center gap-6">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-line" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-on-brand text-2xl font-bold">
                        {getInitials(name)}
                      </div>
                    )}
                    <Input
                      containerClassName="flex-1"
                      label="URL da Foto de Perfil (opcional)"
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://exemplo.com/minha-foto.jpg"
                    />
                  </div>

                  <Input
                    label="Nome Completo"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    label="E-mail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" loading={loading} leftIcon={<Save size={16} strokeWidth={2} />}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Segurança */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardBody className="p-6">
                <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2 mb-6">
                  <Lock className="text-ink-500" size={20} strokeWidth={1.5} />
                  Segurança
                </h2>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  {pwdMessage && (
                    <Alert variant={pwdMessage.type === 'success' ? 'success' : 'danger'}>{pwdMessage.text}</Alert>
                  )}

                  <Input
                    label="Senha Atual"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <Input
                    label="Nova Senha"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="Mínimo de 6 caracteres."
                  />

                  <Input
                    label="Confirmar Nova Senha"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="secondary"
                    fullWidth
                    loading={pwdLoading}
                    leftIcon={<Key size={16} strokeWidth={2} />}
                  >
                    {pwdLoading ? 'Atualizando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
