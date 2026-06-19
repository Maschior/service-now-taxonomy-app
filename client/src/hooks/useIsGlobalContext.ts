import { useAuth } from '../contexts/AuthContext';

export function useIsGlobalContext(): boolean {
  const { user, currentWorkspaceId } = useAuth();
  return user?.workspaces?.some((w) => w.isGlobal && w._id === currentWorkspaceId) ?? false;
}
