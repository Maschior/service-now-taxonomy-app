import { Router, Response, NextFunction } from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { validateRequest, idValidation, workspaceValidation } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getCaseInsensitiveQuery, normalizeName } from '../utils/validationHelper.js';

const router = Router();

// Gerenciamento de workspaces é restrito a administradores.
router.use(requireAuth);
router.use(requireAdmin);

// Listar todos os workspaces (Global primeiro, depois ordem alfabética)
router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaces = await Workspace.find({ isActive: true }).sort({ isGlobal: -1, name: 1 });
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

// Criar novo workspace e dar acesso ao admin que o criou
router.post('/', workspaceValidation, validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const name = normalizeName(req.body.name);

    const existing = await Workspace.findOne({ ...getCaseInsensitiveQuery(name), isActive: true });
    if (existing) {
      throw new ApiError(400, 'Já existe um workspace com este nome.');
    }

    const workspace = await Workspace.create({ name, isGlobal: false, isActive: true });

    // Garante que o admin criador possa acessar/alternar para o novo workspace.
    await User.findByIdAndUpdate(req.user?.id, { $addToSet: { workspaces: workspace._id } });

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

// Renomear um workspace (o flag isGlobal nunca pode ser alterado por aqui)
router.put('/:id', idValidation, workspaceValidation, validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace || !workspace.isActive) {
      throw new ApiError(404, 'Workspace não encontrado.');
    }

    const name = normalizeName(req.body.name);
    const duplicate = await Workspace.findOne({
      ...getCaseInsensitiveQuery(name),
      isActive: true,
      _id: { $ne: workspace._id }
    });
    if (duplicate) {
      throw new ApiError(400, 'Já existe um workspace com este nome.');
    }

    workspace.name = name;
    await workspace.save();
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Desativar (soft delete) um workspace. O workspace Global nunca pode ser desativado.
router.delete('/:id', idValidation, validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace || !workspace.isActive) {
      throw new ApiError(404, 'Workspace não encontrado.');
    }

    if (workspace.isGlobal) {
      throw new ApiError(400, 'O workspace Global não pode ser desativado.');
    }

    workspace.isActive = false;
    await workspace.save();

    // Remove o acesso a este workspace de todos os usuários.
    await User.updateMany(
      { workspaces: workspace._id },
      { $pull: { workspaces: workspace._id } }
    );

    res.json({ message: 'Workspace desativado com sucesso.' });
  } catch (error) {
    next(error);
  }
});

export default router;
