import { Router, Request, Response, NextFunction } from 'express';
import { Action } from '../models/Action.js';
import { Incident } from '../models/Incident.js';
import { Module } from '../models/Module.js';
import { actionValidation, idValidation, validateRequest } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { incidentId, incidentIds: incidentIdsParam, moduleId, applicationId } = req.query;
    let filter: any = {};

    if (incidentId) {
      filter.incidentIds = incidentId;
    } else if (incidentIdsParam) {
      const ids = (incidentIdsParam as string).split(',');
      filter.incidentIds = { $in: ids };
    } else if (moduleId) {
      const incidents = await Incident.find({ moduleIds: moduleId }).select('_id');
      const incIds = incidents.map(i => i._id);
      filter.incidentIds = { $in: incIds };
    } else if (applicationId) {
      const modules = await Module.find({ applicationId }).select('_id');
      const modIds = modules.map(m => m._id);
      const incidents = await Incident.find({ moduleIds: { $in: modIds } }).select('_id');
      const incIds = incidents.map(i => i._id);
      filter.incidentIds = { $in: incIds };
    }

    const actions = await Action.find(filter)
      .populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } })
      .sort({ name: 1 });
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

import { getCaseInsensitiveQuery } from '../utils/validationHelper.js';

router.post('/', actionValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Action.findOne(getCaseInsensitiveQuery(req.body.name));
    if (existing) throw new ApiError(400, 'Já existe uma ação com este nome.');

    const action = new Action(req.body);
    await action.save();
    await action.populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } });
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', idValidation, actionValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Action.findOne({
      ...getCaseInsensitiveQuery(req.body.name),
      _id: { $ne: req.params.id }
    });
    if (existing) throw new ApiError(400, 'Já existe uma ação com este nome.');

    const action = await Action.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'incidentIds', populate: { path: 'moduleIds', populate: { path: 'applicationId' } } });
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
