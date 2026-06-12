import { Router } from 'express';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'Missing csvData' });
    }

    const lines = csvData.split('\n');
    let imported = 0;

    for (const line of lines) {
      let cleanLine = line.trim();
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
        continue;
      }

      if (!appName || !moduleName || !incidentName || !actionName) continue;

      let app = await Application.findOne({ name: appName });
      if (!app) {
        app = await Application.create({ name: appName });
      }

      let mod = await Module.findOne({ name: moduleName, applicationId: app._id });
      if (!mod) {
        mod = await Module.create({ name: moduleName, applicationId: app._id });
      }

      let incident = await Incident.findOne({ name: incidentName });
      if (!incident) {
        incident = await Incident.create({ name: incidentName, moduleIds: [mod._id] });
      } else {
        if (!incident.moduleIds.includes(mod._id)) {
          incident.moduleIds.push(mod._id);
          await incident.save();
        }
      }

      let action = await Action.findOne({ name: actionName });
      if (!action) {
        action = await Action.create({ name: actionName, incidentIds: [incident._id] });
      } else {
        if (!action.incidentIds.includes(incident._id)) {
          action.incidentIds.push(incident._id);
          await action.save();
        }
      }

      imported++;
    }

    res.json({ message: `Sucesso! Importados ${imported} registros com sucesso.` });
  } catch (error) {
    next(error);
  }
});

export default router;
