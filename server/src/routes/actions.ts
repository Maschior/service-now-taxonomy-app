import { Router, Request, Response, NextFunction } from 'express';
import { Action } from '../models/Action.js';
import { actionValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = req.query.applicationId ? { applicationId: req.query.applicationId } : {};
    const actions = await Action.find(filter).populate('applicationId').sort({ name: 1 });
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

router.post('/', actionValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = new Action(req.body);
    await action.save();
    await action.populate('applicationId');
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, actionValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = await Action.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('applicationId');
    if (!action) throw new ApiError(404, 'Action not found');
    res.json(action);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = await Action.findByIdAndDelete(req.params.id);
    if (!action) throw new ApiError(404, 'Action not found');
    res.json({ message: 'Action deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
