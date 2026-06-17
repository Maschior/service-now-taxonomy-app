import { Router, Response, NextFunction } from 'express';
import { Incident } from '../models/Incident.js';
import { Module } from '../models/Module.js';
import { incidentValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { moduleId, moduleIds: moduleIdsParam, applicationId } = req.query;
    let filter: any = {
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    };

    if (moduleId) {
      filter.moduleIds = moduleId;
    } else if (moduleIdsParam) {
      const ids = (moduleIdsParam as string).split(',');
      filter.moduleIds = { $in: ids };
    } else if (applicationId) {
      // Backwards compat: find active modules for this app in this workspace context
      const modules = await Module.find({ 
        applicationId, 
        workspaceId: { $in: req.accessibleWorkspaceIds },
        isActive: true 
      }).select('_id');
      const modIds = modules.map(m => m._id);
      filter.moduleIds = { $in: modIds };
    }

    const incidents = await Incident.find(filter)
      .populate({ path: 'moduleIds', populate: { path: 'applicationId' } })
      .sort({ name: 1 });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

router.post('/', incidentValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existing = await Incident.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    if (existing) throw new ApiError(400, 'Já existe um incidente ativo com este nome no workspace atual ou global.');

    const incident = new Incident({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await incident.save();
    await incident.populate({ path: 'moduleIds', populate: { path: 'applicationId' } });
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, incidentValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetIncident = await Incident.findById(req.params.id);
    if (!targetIncident || !targetIncident.isActive) throw new ApiError(404, 'Incidente não encontrado ou inativo');

    if (targetIncident.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    if (targetIncident.workspaceId.toString() !== req.currentWorkspaceId && targetIncident.workspaceId.toString() !== req.globalWorkspaceId) {
       throw new ApiError(403, 'Sem permissão para editar este incidente.');
    }

    const existing = await Incident.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existing) throw new ApiError(400, 'Já existe um incidente com este nome.');

    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'moduleIds', populate: { path: 'applicationId' } });
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetIncident = await Incident.findById(req.params.id);
    if (!targetIncident || !targetIncident.isActive) throw new ApiError(404, 'Incidente não encontrado ou já inativo');

    if (targetIncident.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    if (targetIncident.workspaceId.toString() !== req.currentWorkspaceId && targetIncident.workspaceId.toString() !== req.globalWorkspaceId) {
      throw new ApiError(403, 'Sem permissão para excluir este incidente.');
    }

    targetIncident.isActive = false;
    await targetIncident.save(); // triggers pre-save hook

    res.json({ message: 'Incidente inativado com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
