import { Router, Request, Response, NextFunction } from 'express';
import { Closure } from '../models/Closure.js';
import { closureValidation, validateRequest } from '../middleware/validation.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const closures = await Closure.find()
      .populate('applicationId')
      .populate('moduleId')
      .populate('incidentId')
      .populate('actionId')
      .populate('tags')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(closures);
  } catch (error) {
    next(error);
  }
});

router.post('/', closureValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closure = new Closure(req.body);
    await closure.save();
    await closure.populate(['applicationId', 'moduleId', 'incidentId', 'actionId', 'tags']);
    res.status(201).json(closure);
  } catch (error) {
    next(error);
  }
});

export default router;
