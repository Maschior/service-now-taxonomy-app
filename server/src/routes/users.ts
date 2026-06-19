import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { body } from 'express-validator';
import { validateRequest, idValidation } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

// ==========================================
// ROTA DE PERFIL (Para o próprio usuário logado)
// ==========================================

router.get('/me', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash').populate('workspaces');
    if (!user) throw new ApiError(404, 'Usuário não encontrado.');
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/me', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email válido é obrigatório'),
  body('photoUrl').optional().isString()
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, photoUrl } = req.body;
    
    const existingUser = await User.findOne({ email, _id: { $ne: req.user?.id } });
    if (existingUser) throw new ApiError(400, 'Este email já está em uso.');

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      { name, email, photoUrl }, // Prevent role/workspaces injection
      { new: true }
    ).select('-passwordHash').populate('workspaces');

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.put('/me/password', [
  body('currentPassword').notEmpty().withMessage('A senha atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('A nova senha deve ter no mínimo 6 caracteres')
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, 'Usuário não encontrado.');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'A senha atual está incorreta.');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    next(error);
  }
});


// ==========================================
// ROTA DE GERENCIAMENTO (Restrito a ADMINs)
// ==========================================

// Conjunto de workspaces que o admin logado tem permissão de atribuir a outros usuários.
// - Admin no contexto Global: pode atribuir qualquer workspace ativo.
// - Admin local: pode atribuir apenas os workspaces aos quais ele próprio pertence.
const getAssignableWorkspaceIds = async (req: WorkspaceRequest): Promise<string[]> => {
  const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
  if (isGlobalContext) {
    const all = await Workspace.find({ isActive: true }).select('_id');
    return all.map((w) => w._id.toString());
  }
  const admin = await User.findById(req.user?.id).select('workspaces');
  const ids = (admin?.workspaces || []).map((w) => w.toString());
  if (req.currentWorkspaceId) ids.push(req.currentWorkspaceId);
  return Array.from(new Set(ids));
};

// Listar todos os usuários pertencentes ao Workspace Atual
router.get('/', requireAdmin, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    // If not global admin, only fetch users that have access to current workspace
    const filter = req.currentWorkspaceId === req.globalWorkspaceId 
      ? {} 
      : { workspaces: req.currentWorkspaceId };

    const users = await User.find(filter).select('-passwordHash').populate('workspaces').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Criar novo usuário e anexar ao Workspace Atual
router.post('/', requireAdmin, [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email válido é obrigatório'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres'),
  body('role').optional().isIn(['ADMIN', 'USER']).withMessage('Papel deve ser ADMIN ou USER'),
  body('workspaces').optional().isArray().withMessage('Workspaces deve ser uma lista'),
  body('workspaces.*').optional().isMongoId().withMessage('Cada workspace deve ter um ID válido')
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, workspaces } = req.body;

    // Apenas Admins do workspace Global podem criar outros ADMINS.
    const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
    const finalRole = (role === 'ADMIN' && isGlobalContext) ? 'ADMIN' : 'USER';

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'Já existe um usuário com este email.');

    // Resolve os workspaces solicitados contra o que o admin pode atribuir.
    const assignable = await getAssignableWorkspaceIds(req);
    let finalWorkspaces = Array.isArray(workspaces)
      ? workspaces.filter((w: string) => assignable.includes(w))
      : [];
    if (finalWorkspaces.length === 0 && req.currentWorkspaceId) {
      finalWorkspaces = [req.currentWorkspaceId];
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      passwordHash,
      role: finalRole,
      workspaces: finalWorkspaces
    });

    await user.save();
    const populated = await User.findById(user._id).select('-passwordHash').populate('workspaces');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, idValidation, [
  body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('Email válido é obrigatório'),
  body('role').optional().isIn(['ADMIN', 'USER']).withMessage('Papel deve ser ADMIN ou USER'),
  body('workspaces').optional().isArray().withMessage('Workspaces deve ser uma lista'),
  body('workspaces.*').optional().isMongoId().withMessage('Cada workspace deve ter um ID válido')
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, 'Usuário não encontrado.');

    // Segurança: Garantir que o locatário não tente modificar alguém fora do seu workspace
    const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
    if (!isGlobalContext && !targetUser.workspaces.includes(req.currentWorkspaceId as any)) {
      throw new ApiError(403, 'Você não tem permissão para editar este usuário.');
    }

    const { name, email, role, workspaces } = req.body;
    if (email && email !== targetUser.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new ApiError(400, 'Este email já está em uso.');
    }

    // Segurança de Escalonamento:
    let finalRole = targetUser.role;
    if (role && role !== targetUser.role) {
      if (isGlobalContext) {
        finalRole = role; // Apenas admin global altera papel administrativo
      } else {
        throw new ApiError(403, 'Somente administradores da camada Global podem alterar níveis de acesso.');
      }
    }

    // Atribuição de workspaces: o admin só pode (des)atribuir os workspaces que controla.
    // Workspaces fora do seu alcance (ex.: Global ou de outro locatário) são preservados.
    if (Array.isArray(workspaces)) {
      const assignable = await getAssignableWorkspaceIds(req);
      const existing = targetUser.workspaces.map((w) => w.toString());
      const preserved = existing.filter((w) => !assignable.includes(w));
      const requested = workspaces.filter((w: string) => assignable.includes(w));
      const merged = Array.from(new Set([...preserved, ...requested]));
      if (merged.length === 0) {
        throw new ApiError(400, 'O usuário deve pertencer a pelo menos um workspace.');
      }
      targetUser.workspaces = merged as any;
    }

    targetUser.name = name || targetUser.name;
    targetUser.email = email || targetUser.email;
    targetUser.role = finalRole;

    await targetUser.save();
    const populated = await User.findById(targetUser._id).select('-passwordHash').populate('workspaces');
    res.json(populated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, 'Usuário não encontrado.');

    if (targetUser._id.toString() === req.user?.id) {
      throw new ApiError(400, 'Você não pode excluir sua própria conta.');
    }

    const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;

    if (isGlobalContext) {
      // Exclusão completa se feito no painel Global
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'Usuário deletado permanentemente.' });
    } else {
      // Remoção apenas do Workspace atual
      targetUser.workspaces = targetUser.workspaces.filter(wsId => wsId.toString() !== req.currentWorkspaceId);
      if (targetUser.workspaces.length === 0) {
        // Se ficou sem nenhum, deleção completa
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuário removido deste workspace e apagado do sistema por não ter mais acessos.' });
      } else {
        await targetUser.save();
        res.json({ message: 'Acesso do usuário removido deste workspace.' });
      }
    }
  } catch (error) {
    next(error);
  }
});

export default router;
