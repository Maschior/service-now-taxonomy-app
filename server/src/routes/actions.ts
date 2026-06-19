import { Router, Response, NextFunction } from 'express';
import { Action } from '../models/Action.js';
import { Incident } from '../models/Incident.js';
import { Module } from '../models/Module.js';
import { actionValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest, resolveWorkspaceScope, getVisibleWorkspaceIds } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { incidentId, incidentIds: incidentIdsParam, moduleId, applicationId } = req.query;
    const workspaceIds = await resolveWorkspaceScope(req);
    let filter: any = {
      workspaceId: { $in: workspaceIds },
      isActive: true
    };

    if (incidentId) {
      filter.incidentIds = incidentId;
    } else if (incidentIdsParam) {
      const ids = (incidentIdsParam as string).split(',');
      filter.incidentIds = { $in: ids };
    } else if (moduleId) {
      const incidents = await Incident.find({ 
        moduleIds: moduleId,
        workspaceId: { $in: req.accessibleWorkspaceIds },
        isActive: true
      }).select('_id');
      const incIds = incidents.map(i => i._id);
      filter.incidentIds = { $in: incIds };
    } else if (applicationId) {
      const modules = await Module.find({ 
        applicationId,
        workspaceId: { $in: req.accessibleWorkspaceIds },
        isActive: true
      }).select('_id');
      const modIds = modules.map(m => m._id);
      const incidents = await Incident.find({ 
        moduleIds: { $in: modIds },
        workspaceId: { $in: req.accessibleWorkspaceIds },
        isActive: true
      }).select('_id');
      const incIds = incidents.map(i => i._id);
      filter.incidentIds = { $in: incIds };
    }

    const actions = await Action.find(filter)
      .populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } })
      .sort({ name: 1 });
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

router.post('/', actionValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existing = await Action.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    if (existing) throw new ApiError(400, 'Já existe uma ação ativa com este nome no workspace atual ou global.');

    const action = new Action({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await action.save();
    await action.populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } });
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, actionValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetAction = await Action.findById(req.params.id);
    if (!targetAction || !targetAction.isActive) throw new ApiError(404, 'Ação não encontrada ou inativa');

    if (targetAction.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetAction.workspaceId.toString())) {
       throw new ApiError(403, 'Sem permissão para editar esta ação.');
    }

    const existing = await Action.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existing) throw new ApiError(400, 'Já existe uma ação com este nome.');

    const action = await Action.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } });
    res.json(action);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetAction = await Action.findById(req.params.id);
    if (!targetAction || !targetAction.isActive) throw new ApiError(404, 'Ação não encontrada ou já inativa');

    if (targetAction.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetAction.workspaceId.toString())) {
      throw new ApiError(403, 'Sem permissão para excluir esta ação.');
    }

    targetAction.isActive = false;
    await targetAction.save(); // triggers pre-save hook

    res.json({ message: 'Ação inativada com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
