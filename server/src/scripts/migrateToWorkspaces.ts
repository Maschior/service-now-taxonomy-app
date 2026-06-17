import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workspace from '../models/Workspace.js';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';
import { TagCategory } from '../models/TagCategory.js';
import { Tag } from '../models/Tag.js';
import { connectDB } from '../utils/db.js';

dotenv.config();

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting migration...');

    let globalWorkspace = await Workspace.findOne({ isGlobal: true });
    if (!globalWorkspace) {
      console.log('Global workspace not found. Creating...');
      globalWorkspace = await Workspace.create({
        name: 'Global',
        isGlobal: true,
        isActive: true
      });
    }

    const workspaceId = globalWorkspace._id;
    console.log(`Using Global Workspace ID: ${workspaceId}`);

    const updateQuery = { $set: { workspaceId, isActive: true } };
    const filterQuery = { workspaceId: { $exists: false } };

    const apps = await Application.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${apps.modifiedCount} Applications`);

    const mods = await Module.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${mods.modifiedCount} Modules`);

    const incs = await Incident.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${incs.modifiedCount} Incidents`);

    const acts = await Action.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${acts.modifiedCount} Actions`);

    const tcats = await TagCategory.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${tcats.modifiedCount} TagCategories`);

    const tags = await Tag.updateMany(filterQuery, updateQuery);
    console.log(`Migrated ${tags.modifiedCount} Tags`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
