import { Response, NextFunction } from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { AuthRequest } from './auth.js';
import { ApiError } from './errorHandler.js';

export interface WorkspaceRequest extends AuthRequest {
  currentWorkspaceId?: string;
  globalWorkspaceId?: string;
  accessibleWorkspaceIds?: string[];
}

export const requireWorkspace = async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] as string;
    
    // We assume there is exactly one Global workspace
    let globalWorkspace = await Workspace.findOne({ isGlobal: true });
    
    if (!globalWorkspace) {
      // Create it if it doesn't exist to prevent crash in fresh env
      globalWorkspace = await Workspace.create({ name: 'Global', isGlobal: true, isActive: true });
    }

    req.globalWorkspaceId = globalWorkspace._id.toString();

    // If request contains workspace ID, validate it belongs to user
    // (If not provided, we can default to global or throw error depending on strictness.
    // For now, if no workspace is provided, user only accesses Global)
    if (workspaceId && /^[0-9a-fA-F]{24}$/.test(workspaceId)) {
      req.currentWorkspaceId = workspaceId;
      req.accessibleWorkspaceIds = Array.from(new Set([req.globalWorkspaceId, req.currentWorkspaceId])).filter(Boolean) as string[];
    } else {
      req.currentWorkspaceId = req.globalWorkspaceId;
      req.accessibleWorkspaceIds = [req.globalWorkspaceId as string];
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve workspace context' });
  }
};

// Workspaces que o usuário pode ver/gerenciar nas telas de management:
// admin no contexto Global vê todos os workspaces ativos; qualquer outro
// usuário vê apenas os workspaces aos quais pertence (mais o Global).
export const getVisibleWorkspaceIds = async (req: WorkspaceRequest): Promise<string[]> => {
  const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
  if (req.user?.role === 'ADMIN' && isGlobalContext) {
    const all = await Workspace.find({ isActive: true }).select('_id');
    return all.map((w) => w._id.toString());
  }
  const me = await User.findById(req.user?.id).select('workspaces');
  const ids = (me?.workspaces || []).map((w) => w.toString());
  if (req.globalWorkspaceId) ids.push(req.globalWorkspaceId);
  return Array.from(new Set(ids));
};

// Resolve a lista de workspaceIds para um GET de listagem, a partir dos query
// params `scope` (opt-in para o conjunto ampliado, usado pelas telas de
// management) e `workspaceId` (restringe a um único workspace, validado
// contra o conjunto resolvido). Sem `scope=all`, comportamento idêntico ao
// padrão atual (accessibleWorkspaceIds) — quem não envia o parâmetro nunca é
// afetado por esta mudança.
export const resolveWorkspaceScope = async (req: WorkspaceRequest): Promise<string[]> => {
  const base = req.query.scope === 'all' ? await getVisibleWorkspaceIds(req) : (req.accessibleWorkspaceIds as string[]);
  const requested = req.query.workspaceId as string | undefined;
  if (!requested) return base;
  if (!base.includes(requested)) {
    throw new ApiError(400, 'Workspace inválido ou fora do seu alcance.');
  }
  return [requested];
};
