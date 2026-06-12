import { Router, Request, Response, NextFunction } from 'express';
import { Module } from '../models/Module.js';
import { moduleValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, applicationIds } = req.query;
    let filter: any = {};

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

import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';

router.post('/', moduleValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Module.findOne({
      applicationId: req.body.applicationId,
      ...getCaseInsensitiveQuery(req.body.name)
    });
    if (existing) throw new ApiError(400, 'Já existe um módulo com este nome para esta aplicação.');

    const module = new Module(req.body);
    await module.save();
    await module.populate('applicationId');
    res.status(201).json(module);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, moduleValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Module.findOne({
      applicationId: req.body.applicationId,
      ...getCaseInsensitiveQuery(req.body.name),
      _id: { $ne: req.params.id }
    });
    if (existing) throw new ApiError(400, 'Já existe um módulo com este nome para esta aplicação.');

    const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('applicationId');
    if (!module) throw new ApiError(404, 'Module not found');
    res.json(module);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) throw new ApiError(404, 'Module not found');
    res.json({ message: 'Module deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
