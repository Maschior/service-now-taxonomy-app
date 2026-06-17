import { Router, Response, NextFunction } from 'express';
import { Application } from '../models/Application.js';
import { appValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const apps = await Application.find({
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    }).sort({ name: 1 });
    res.json(apps);
  } catch (error) {
    next(error);
  }
});

router.post('/', appValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existing = await Application.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    
    if (existing) throw new ApiError(400, 'Já existe uma aplicação ativa com este nome no workspace atual ou global.');

    const app = new Application({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await app.save();
    res.status(201).json(app);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, appValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetApp = await Application.findById(req.params.id);
    if (!targetApp || !targetApp.isActive) throw new ApiError(404, 'Aplicação não encontrada ou inativa');

    if (targetApp.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    if (targetApp.workspaceId.toString() !== req.currentWorkspaceId && targetApp.workspaceId.toString() !== req.globalWorkspaceId) {
       throw new ApiError(403, 'Sem permissão para editar esta aplicação.');
    }

    const existing = await Application.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });

    if (existing) throw new ApiError(400, 'Já existe uma aplicação com este nome.');

    const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(app);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetApp = await Application.findById(req.params.id);
    if (!targetApp || !targetApp.isActive) throw new ApiError(404, 'Aplicação não encontrada ou já inativa');

    if (targetApp.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    if (targetApp.workspaceId.toString() !== req.currentWorkspaceId && targetApp.workspaceId.toString() !== req.globalWorkspaceId) {
      throw new ApiError(403, 'Sem permissão para excluir esta aplicação.');
    }

    targetApp.isActive = false;
    await targetApp.save(); // triggers pre-save hook

    res.json({ message: 'Aplicação inativada com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
