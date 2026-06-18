import { Router, Response, NextFunction } from 'express';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace, WorkspaceRequest } from '../middleware/workspace.js';
import { getCaseInsensitiveQuery, normalizeName } from '../utils/validationHelper.js';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', async (req: WorkspaceRequest, res: Response, next: NextFunction) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'Missing csvData' });
    }

    const targetWorkspaceId = req.currentWorkspaceId;
    const lines = csvData.split('\n');
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      try {
        let cleanLine = lines[lineIndex].trim();
        if (!cleanLine || cleanLine.toLowerCase().startsWith('"short_description"')) continue;

        cleanLine = cleanLine.replace(/^"+|"+$/g, '');

        const parts = cleanLine.split(':').map((p: string) => p.trim());

        let appName, moduleName, incidentName, actionName;

        if (parts.length >= 5) {
          // App : Module : Local Support : Incident : Action
          appName = parts[0];
          moduleName = parts[1];
          incidentName = parts[3];
          actionName = parts[4];
        } else if (parts.length === 4) {
          // App : Module : Incident : Action
          appName = parts[0];
          moduleName = parts[1];
          incidentName = parts[2];
          actionName = parts[3];
        } else {
          skipped++;
          if (errors.length < 20) {
            errors.push(`Linha ${lineIndex + 1}: formato inválido (esperado 4 ou 5 partes separadas por ':')`);
          }
          continue;
        }

        if (!appName || !moduleName || !incidentName || !actionName) {
          skipped++;
          if (errors.length < 20) {
            errors.push(`Linha ${lineIndex + 1}: campos obrigatórios vazios`);
          }
          continue;
        }

        let app = await Application.findOne({
          ...getCaseInsensitiveQuery(appName),
          workspaceId: { $in: req.accessibleWorkspaceIds },
          isActive: true
        });
        if (!app) {
          app = await Application.create({
            name: normalizeName(appName),
            workspaceId: targetWorkspaceId
          });
        }

        let mod = await Module.findOne({
          applicationId: app._id,
          ...getCaseInsensitiveQuery(moduleName),
          workspaceId: { $in: req.accessibleWorkspaceIds },
          isActive: true
        });
        if (!mod) {
          mod = await Module.create({
            name: normalizeName(moduleName),
            applicationId: app._id,
            workspaceId: targetWorkspaceId
          });
        }

        let incident = await Incident.findOne({
          ...getCaseInsensitiveQuery(incidentName),
          workspaceId: { $in: req.accessibleWorkspaceIds },
          isActive: true
        });
        if (!incident) {
          incident = await Incident.create({
            name: normalizeName(incidentName),
            moduleIds: [mod._id],
            workspaceId: targetWorkspaceId
          });
        } else {
          if (!incident.moduleIds.includes(mod._id)) {
            incident.moduleIds.push(mod._id);
            await incident.save();
          }
        }

        let action = await Action.findOne({
          ...getCaseInsensitiveQuery(actionName),
          workspaceId: { $in: req.accessibleWorkspaceIds },
          isActive: true
        });
        if (!action) {
          action = await Action.create({
            name: normalizeName(actionName),
            incidentIds: [incident._id],
            workspaceId: targetWorkspaceId
          });
        } else {
          if (!action.incidentIds.includes(incident._id)) {
            action.incidentIds.push(incident._id);
            await action.save();
          }
        }

        imported++;
      } catch (lineError) {
        skipped++;
        if (errors.length < 20) {
          const errorMsg = lineError instanceof Error ? lineError.message : String(lineError);
          errors.push(`Linha ${lineIndex + 1}: ${errorMsg}`);
        }
      }
    }

    res.json({
      message: `Sucesso! Importados ${imported} registros, ignorados ${skipped}.`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
});

export default router;
