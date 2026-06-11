import { body, param, validationResult, check } from 'express-validator';
import { Response, NextFunction } from 'express';

export const validateRequest = (req: any, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
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
  body('applicationId').isMongoId().withMessage('Valid application ID is required')
];

export const actionValidation = [
  body('name').trim().notEmpty().withMessage('Action name is required'),
  body('applicationId').isMongoId().withMessage('Valid application ID is required')
];

export const tagValidation = [
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required')
];

export const idValidation = [
  param('id').isMongoId().withMessage('Valid ID is required')
];
