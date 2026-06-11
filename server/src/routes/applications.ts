import { Router, Request, Response, NextFunction } from 'express';
import { Application } from '../models/Application.js';
import { appValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await Application.find().sort({ name: 1 });
    res.json(apps);
  } catch (error) {
    next(error);
  }
});

router.post('/', appValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = new Application(req.body);
    await app.save();
    res.status(201).json(app);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, appValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!app) throw new ApiError(404, 'Application not found');
    res.json(app);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await Application.findByIdAndDelete(req.params.id);
    if (!app) throw new ApiError(404, 'Application not found');
    res.json({ message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
