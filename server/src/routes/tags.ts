import { Router, Response, NextFunction } from 'express';
import { Tag } from '../models/Tag.js';
import { TagCategory } from '../models/TagCategory.js';
import { tagValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';
import { ApiError } from '../middleware/errorHandler.js';
import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest, resolveWorkspaceScope, getVisibleWorkspaceIds } from '../middleware/workspace.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

// Tag Category routes
router.get('/categories', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceIds = await resolveWorkspaceScope(req);
    const categories = await TagCategory.find({
      workspaceId: { $in: workspaceIds },
      isActive: true
    }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', [body('name').trim().notEmpty()], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existingCat = await TagCategory.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    if (existingCat) throw new ApiError(400, 'Já existe uma categoria ativa com este nome no workspace atual ou global.');

    const category = new TagCategory({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', idValidation, [body('name').trim().notEmpty()], validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetCat = await TagCategory.findById(req.params.id);
    if (!targetCat || !targetCat.isActive) throw new ApiError(404, 'Categoria não encontrada ou inativa');

    if (targetCat.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetCat.workspaceId.toString())) {
       throw new ApiError(403, 'Sem permissão para editar esta categoria.');
    }

    const existingCat = await TagCategory.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existingCat) throw new ApiError(400, 'Já existe uma categoria com este nome.');

    const category = await TagCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetCat = await TagCategory.findById(req.params.id);
    if (!targetCat || !targetCat.isActive) throw new ApiError(404, 'Categoria não encontrada ou já inativa');

    if (targetCat.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetCat.workspaceId.toString())) {
      throw new ApiError(403, 'Sem permissão para excluir esta categoria.');
    }

    targetCat.isActive = false;
    await targetCat.save(); // triggers pre-save cascade hook to tags

    res.json({ message: 'Categoria inativada com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Tag routes
router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceIds = await resolveWorkspaceScope(req);
    const filter: any = {
      workspaceId: { $in: workspaceIds },
      isActive: true
    };
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }
    const tags = await Tag.find(filter).populate('categoryId').sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

router.post('/', tagValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const isGlobal = req.body.isGlobal === true;
    if (isGlobal && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem criar registros globais.');
    }

    const targetWorkspaceId = isGlobal ? req.globalWorkspaceId : req.currentWorkspaceId;

    const existingTag = await Tag.findOne({
      categoryId: req.body.categoryId,
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true
    });
    if (existingTag) throw new ApiError(400, 'Já existe uma tag ativa com este nome nesta categoria no workspace atual ou global.');

    const tag = new Tag({
      ...req.body,
      workspaceId: targetWorkspaceId
    });
    await tag.save();
    await tag.populate('categoryId');
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, tagValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetTag = await Tag.findById(req.params.id);
    if (!targetTag || !targetTag.isActive) throw new ApiError(404, 'Tag não encontrada ou inativa');

    if (targetTag.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem editar registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetTag.workspaceId.toString())) {
       throw new ApiError(403, 'Sem permissão para editar esta tag.');
    }

    const existingTag = await Tag.findOne({
      categoryId: req.body.categoryId,
      ...getCaseInsensitiveQuery(req.body.name),
      workspaceId: { $in: req.accessibleWorkspaceIds },
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existingTag) throw new ApiError(400, 'Já existe uma tag com este nome nesta categoria.');

    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categoryId');
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const targetTag = await Tag.findById(req.params.id);
    if (!targetTag || !targetTag.isActive) throw new ApiError(404, 'Tag não encontrada ou já inativa');

    if (targetTag.workspaceId.toString() === req.globalWorkspaceId && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Apenas administradores podem excluir registros globais.');
    }

    const visible = await getVisibleWorkspaceIds(req);
    if (!visible.includes(targetTag.workspaceId.toString())) {
      throw new ApiError(403, 'Sem permissão para excluir esta tag.');
    }

    targetTag.isActive = false;
    await targetTag.save(); // triggers pre-save hook

    res.json({ message: 'Tag inativada com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
