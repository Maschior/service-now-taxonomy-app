import { body, param, validationResult, check } from 'express-validator';
import { Response, NextFunction } from 'express';

export const validateRequest = (req: any, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(400).json({ error: errorList[0].msg, errors: errorList });
  }
  next();
};

export const appValidation = [
  body('name').trim().notEmpty().withMessage('Application name is required'),
  body('description').optional().trim()
];

export const moduleValidation = [
  body('name').trim().notEmpty().withMessage('Module name is required'),
  body('applicationId').isMongoId().withMessage('Valid application ID is required')
];

export const incidentValidation = [
  body('name').trim().notEmpty().withMessage('Incident name is required'),
  body('moduleIds').isArray({ min: 1 }).withMessage('At least one module ID is required'),
  body('moduleIds.*').isMongoId().withMessage('Each module ID must be a valid Mongo ID')
];

export const actionValidation = [
  body('name').trim().notEmpty().withMessage('Action name is required'),
  body('incidentIds').isArray({ min: 1 }).withMessage('At least one incident ID is required'),
  body('incidentIds.*').isMongoId().withMessage('Each incident ID must be a valid Mongo ID')
];

export const tagValidation = [
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required')
];

export const closureValidation = [
  body('shortDescription').trim().notEmpty().withMessage('Short description is required'),
  body('resolutionNotes').trim().notEmpty().withMessage('Resolution notes is required'),
  body('ticketNumber').optional({ values: 'falsy' }).trim().matches(/^(INC|SCTASK)\d+$/i).withMessage('Número de chamado inválido (use INC... ou SCTASK...)'),
  body('applicationId').optional().isMongoId().withMessage('Valid application ID is required'),
  body('moduleId').optional().isMongoId().withMessage('Valid module ID is required'),
  body('incidentId').optional().isMongoId().withMessage('Valid incident ID is required'),
  body('actionId').optional().isMongoId().withMessage('Valid action ID is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isMongoId().withMessage('Each tag ID must be a valid Mongo ID'),
  body('motivo').optional().trim(),
  body('analise').optional().trim(),
  body('solucao').optional().trim()
];

export const workspaceValidation = [
  body('name').trim().notEmpty().withMessage('Workspace name is required')
];

export const idValidation = [
  param('id').isMongoId().withMessage('Valid ID is required')
];
