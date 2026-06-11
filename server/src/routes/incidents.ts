import { Router, Request, Response, NextFunction } from 'express';
import { Incident } from '../models/Incident.js';
import { incidentValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = req.query.applicationId ? { applicationId: req.query.applicationId } : {};
    const incidents = await Incident.find(filter).populate('applicationId').sort({ name: 1 });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

router.post('/', incidentValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = new Incident(req.body);
    await incident.save();
    await incident.populate('applicationId');
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, incidentValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('applicationId');
    if (!incident) throw new ApiError(404, 'Incident not found');
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) throw new ApiError(404, 'Incident not found');
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
