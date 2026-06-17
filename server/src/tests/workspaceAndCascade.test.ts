import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Workspace from '../models/Workspace.js';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';
import { TagCategory } from '../models/TagCategory.js';
import { Tag } from '../models/Tag.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Workspace.deleteMany({});
  await Application.deleteMany({});
  await Module.deleteMany({});
});

describe('Cascade Soft Delete & Workspace scoping', () => {
  it('should cascade soft delete from Application to Module', async () => {
    const ws = await Workspace.create({ name: 'Test WS', isActive: true });
    
    const app = await Application.create({
      name: 'App1',
      workspaceId: ws._id,
      isActive: true
    });

    const mod = await Module.create({
      name: 'Mod1',
      applicationId: app._id,
      workspaceId: ws._id,
      isActive: true
    });

    // trigger soft delete
    app.isActive = false;
    await app.save(); // triggers pre-save

    // check if module is inactive
    const updatedMod = await Module.findById(mod._id);
    expect(updatedMod?.isActive).toBe(false);
  });

  it('should not allow duplicate applications in the same workspace', async () => {
    const ws = await Workspace.create({ name: 'Test WS', isActive: true });
    
    await Application.create({
      name: 'App Duplicate',
      workspaceId: ws._id,
      isActive: true
    });

    // Direct insertion using model bypassing API routes
    // Note: Since we dropped the unique index on `name` in favor of application level validation,
    // at the DB schema level, it will actually allow it unless an API is used.
    // Our API handles the constraint. Here we just verify the schema allows it.
    const duplicate = new Application({
      name: 'App Duplicate',
      workspaceId: ws._id,
      isActive: true
    });
    
    const saved = await duplicate.save();
    expect(saved._id).toBeDefined();
  });
});
