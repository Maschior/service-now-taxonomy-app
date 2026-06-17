import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/db.js';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';
import { TagCategory } from '../models/TagCategory.js';
import { Tag } from '../models/Tag.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const performSeed = async () => {
  const dataPath = join(__dirname, '../../seeds/initialData.json');
  const initialData = JSON.parse(readFileSync(dataPath, 'utf-8'));

  console.log('Seeding database...');
  await Workspace.deleteMany({});
  await User.deleteMany({});
  await Application.deleteMany({});
  await Module.deleteMany({});
  await Incident.deleteMany({});
  await Action.deleteMany({});
  await TagCategory.deleteMany({});
  await Tag.deleteMany({});

  console.log('Creating Global Workspace...');
  const globalWorkspace = await Workspace.create({
    name: 'Global',
    isGlobal: true,
    isActive: true
  });

  console.log('Creating Admin User...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'Super Admin',
    email: 'admin@taxonomy.local',
    passwordHash,
    role: 'ADMIN',
    workspaces: [globalWorkspace._id]
  });


  const appMap: Record<string, string> = {};
  for (const appName of initialData.applications) {
    const app = await Application.create({ name: appName });
    appMap[appName] = app._id.toString();
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

  for (const appName in initialData.relations) {
    const appId = appMap[appName];
    if (!appId) continue;

    const data = initialData.relations[appName] as any;

    const moduleMap: Record<string, string> = {};
    for (const moduleName of data.modules) {
      const mod = await Module.create({ name: moduleName, applicationId: appId });
      moduleMap[moduleName] = mod._id.toString();
    }

    const incidentMap: Record<string, string> = {};
    for (const incidentName in data.incidents) {
      const moduleNames: string[] = data.incidents[incidentName];
      const moduleIds = moduleNames.map((name: string) => {
        const id = moduleMap[name];
        if (!id) throw new Error(`Module "${name}" not found for incident "${incidentName}" in app "${appName}"`);
        return id;
      });
      const incident = await Incident.create({ name: incidentName, moduleIds });
      incidentMap[incidentName] = incident._id.toString();
    }

    for (const actionName in data.actions) {
      const incidentNames: string[] = data.actions[actionName];
      const incidentIds = incidentNames.map((name: string) => {
        const id = incidentMap[name];
        if (!id) throw new Error(`Incident "${name}" not found for action "${actionName}" in app "${appName}"`);
        return id;
      });
      await Action.create({ name: actionName, incidentIds });
    }
  }
  console.log('✓ Database seeded successfully');
};

const seed = async () => {
  try {
    await connectDB();
    await performSeed();
    await disconnectDB();
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
};

// Only run automatically if this script is executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed();
}
