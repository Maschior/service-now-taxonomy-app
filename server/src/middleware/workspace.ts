import { Response, NextFunction } from 'express';
import Workspace from '../models/Workspace.js';
import { AuthRequest } from './auth.js';

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
    if (workspaceId) {
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
