import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { body } from 'express-validator';
import { validateRequest, idValidation } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
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

const requireAdmin = (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new ApiError(403, 'Apenas administradores podem gerenciar usuários.'));
  }
  next();
};

// Listar todos os usuários pertencentes ao Workspace Atual
router.get('/', requireAdmin, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    // If not global admin, only fetch users that have access to current workspace
    const filter = req.currentWorkspaceId === req.globalWorkspaceId 
      ? {} 
      : { workspaces: req.currentWorkspaceId };

    const users = await User.find(filter).select('-passwordHash').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Criar novo usuário e anexar ao Workspace Atual
router.post('/', requireAdmin, [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['ADMIN', 'USER'])
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    // Apenas Admins do workspace Global podem criar outros ADMINS.
    const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
    const finalRole = (role === 'ADMIN' && isGlobalContext) ? 'ADMIN' : 'USER';

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'Já existe um usuário com este email.');

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      passwordHash,
      role: finalRole,
      workspaces: [req.currentWorkspaceId]
    });

    await user.save();
    const userObj = user.toObject() as any;
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, idValidation, [
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['ADMIN', 'USER'])
], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, 'Usuário não encontrado.');

    // Segurança: Garantir que o locatário não tente modificar alguém fora do seu workspace
    const isGlobalContext = req.currentWorkspaceId === req.globalWorkspaceId;
    if (!isGlobalContext && !targetUser.workspaces.includes(req.currentWorkspaceId as any)) {
      throw new ApiError(403, 'Você não tem permissão para editar este usuário.');
    }

    const { name, email, role } = req.body;
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

    targetUser.name = name || targetUser.name;
    targetUser.email = email || targetUser.email;
    targetUser.role = finalRole;

    await targetUser.save();
    const userObj = targetUser.toObject() as any;
    delete userObj.passwordHash;
    res.json(userObj);
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
