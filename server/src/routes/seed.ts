import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/db.js';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';
import { TagCategory } from '../models/TagCategory.js';
import { Tag } from '../models/Tag.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../../seeds/initialData.json');
const initialData = JSON.parse(readFileSync(dataPath, 'utf-8'));

const seed = async () => {
  try {
    await connectDB();
    console.log('Seeding database...');

    await Application.deleteMany({});
    await Module.deleteMany({});
    await Incident.deleteMany({});
    await Action.deleteMany({});
    await TagCategory.deleteMany({});
    await Tag.deleteMany({});

    const appMap: Record<string, string> = {};
    for (const appName of initialData.applications) {
      const app = await Application.create({ name: appName });
      appMap[appName] = app._id.toString();
    }

    for (const appName in initialData.relations) {
      const appId = appMap[appName];
      if (!appId) continue;

      const data = initialData.relations[appName as keyof typeof initialData.relations];

      for (const moduleName of (data as any).modules) {
        await Module.create({ name: moduleName, applicationId: appId });
      }

      for (const incidentName of (data as any).incidents) {
        await Incident.create({ name: incidentName, applicationId: appId });
      }

      for (const actionName of (data as any).actions) {
        await Action.create({ name: actionName, applicationId: appId });
      }
    }

    const categoryMap: Record<string, string> = {};
    for (const categoryName of initialData.tagCategories) {
      const category = await TagCategory.create({ name: categoryName });
      categoryMap[categoryName] = category._id.toString();
    }

    for (const categoryName in initialData.tags) {
      const categoryId = categoryMap[categoryName];
      const tagNames = initialData.tags[categoryName as keyof typeof initialData.tags];

      for (const tagName of tagNames) {
        await Tag.create({ name: tagName, categoryId });
      }
    }

    console.log('✓ Database seeded successfully');
    await disconnectDB();
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
};

seed();
