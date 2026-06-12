import { Router, Request, Response, NextFunction } from 'express';
import { Incident } from '../models/Incident.js';
import { Module } from '../models/Module.js';
import { incidentValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleId, moduleIds: moduleIdsParam, applicationId } = req.query;
    let filter: any = {};

    if (moduleId) {
      filter.moduleIds = moduleId;
    } else if (moduleIdsParam) {
      const ids = (moduleIdsParam as string).split(',');
      filter.moduleIds = { $in: ids };
    } else if (applicationId) {
      // Backwards compat: find modules for this app, then incidents for those modules
      const modules = await Module.find({ applicationId }).select('_id');
      const modIds = modules.map(m => m._id);
      filter.moduleIds = { $in: modIds };
    }

    const incidents = await Incident.find(filter)
      .populate({ path: 'moduleIds', populate: { path: 'applicationId' } })
      .sort({ name: 1 });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';

router.post('/', incidentValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Incident.findOne(getCaseInsensitiveQuery(req.body.name));
    if (existing) throw new ApiError(400, 'Já existe um incidente com este nome.');

    const incident = new Incident(req.body);
    await incident.save();
    await incident.populate({ path: 'moduleIds', populate: { path: 'applicationId' } });
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, incidentValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Incident.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      _id: { $ne: req.params.id }
    });
    if (existing) throw new ApiError(400, 'Já existe um incidente com este nome.');

    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'moduleIds', populate: { path: 'applicationId' } });
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
