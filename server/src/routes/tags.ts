import { Router, Request, Response, NextFunction } from 'express';
import { Tag } from '../models/Tag.js';
import { TagCategory } from '../models/TagCategory.js';
import { tagValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Tag Category routes
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await TagCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', [body('name').trim().notEmpty()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = new TagCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', idValidation, [body('name').trim().notEmpty()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await TagCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw new ApiError(404, 'Category not found');
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Tag.deleteMany({ categoryId: req.params.id });
    const category = await TagCategory.findByIdAndDelete(req.params.id);
    if (!category) throw new ApiError(404, 'Category not found');
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

// Tag routes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = req.query.categoryId ? { categoryId: req.query.categoryId } : {};
    const tags = await Tag.find(filter).populate('categoryId').sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

router.post('/', tagValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();
    await tag.populate('categoryId');
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, tagValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categoryId');
    if (!tag) throw new ApiError(404, 'Tag not found');
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) throw new ApiError(404, 'Tag not found');
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
