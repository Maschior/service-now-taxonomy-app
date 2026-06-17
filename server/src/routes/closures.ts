import { Router, Response, NextFunction } from 'express';
import { Closure } from '../models/Closure.js';
import { closureValidation, validateRequest, idValidation } from '../middleware/validation.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest } from '../middleware/workspace.js';

const router = Router();
router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const { search, shortDescription, tags, startDate, endDate } = req.query;
    let filter: any = {
      workspaceId: { $in: req.accessibleWorkspaceIds }
    };

    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      filter.$or = [
        { resolutionNotes: searchRegex },
        { motivo: searchRegex },
        { analise: searchRegex },
        { solucao: searchRegex }
      ];
    }

    if (shortDescription) {
      filter.shortDescription = { $regex: `^${shortDescription}`, $options: 'i' };
    }

    if (tags) {
      const tagIds = (tags as string).split(',');
      filter.tags = { $all: tagIds };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const total = await Closure.countDocuments(filter);
    const closures = await Closure.find(filter)
      .populate('applicationId')
      .populate('moduleId')
      .populate('incidentId')
      .populate('actionId')
      .populate('tags')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: closures,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', closureValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const closure = new Closure({
      ...req.body,
      workspaceId: req.currentWorkspaceId,
      userId: req.user?.id
    });
    await closure.save();
    await closure.populate(['applicationId', 'moduleId', 'incidentId', 'actionId', 'tags']);
    res.status(201).json(closure);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', idValidation, validateRequest, async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const closure = await Closure.findOneAndDelete({ 
      _id: req.params.id,
      workspaceId: { $in: req.accessibleWorkspaceIds } // or just require exact workspace/admin? Let's just limit to accessible for safety
    });
    if (!closure) throw new ApiError(404, 'Closure not found or access denied');
    res.json({ message: 'Closure deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
