import { Router, Response, NextFunction } from 'express';
import { Module } from '../models/Module.js';
import { moduleValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest, resolveWorkspaceScope, getVisibleWorkspaceIds } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId, applicationIds } = req.query;
    const workspaceIds = await resolveWorkspaceScope(req);
    let filter: any = {
      workspaceId: { $in: workspaceIds },
      isActive: true
    };

    if (applicationId) {
      filter.applicationId = applicationId;
    } else if (applicationIds) {
      const ids = (applicationIds as string).split(',');
      filter.applicationId = { $in: ids };
    }

    const modules = await Module.find(filter).populate('applicationId').sort({ name: 1 });
    res.json(modules);
  } catch (error) {
    next(error);
  }
});

router.post('/', moduleValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existing = await Module.findOne({
      applicationId: req.body.applicationId,
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    
    if (existing) throw new ApiError(400, 'Já existe um módulo ativo com este nome para esta aplicação no workspace atual ou global.');

    const newModule = new Module({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await newModule.save();
    await newModule.populate('applicationId');
    res.status(201).json(newModule);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, moduleValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetModule = await Module.findById(req.params.id);
    if (!targetModule || !targetModule.isActive) throw new ApiError(404, 'Módulo não encontrado ou inativo');

    if (targetModule.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetModule.workspaceId.toString())) {
       throw new ApiError(403, 'Sem permissão para editar este módulo.');
    }

    const existing = await Module.findOne({
      applicationId: req.body.applicationId,
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });

    if (existing) throw new ApiError(400, 'Já existe um módulo com este nome para esta aplicação.');

    const updatedModule = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('applicationId');
    res.json(updatedModule);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetModule = await Module.findById(req.params.id);
    if (!targetModule || !targetModule.isActive) throw new ApiError(404, 'Módulo não encontrado ou já inativo');

    if (targetModule.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetModule.workspaceId.toString())) {
      throw new ApiError(403, 'Sem permissão para excluir este módulo.');
    }

    targetModule.isActive = false;
    await targetModule.save(); // triggers pre-save hook

    res.json({ message: 'Módulo inativado com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
