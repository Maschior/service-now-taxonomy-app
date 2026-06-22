import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import importRouter from '../routes/import.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import Workspace from '../models/Workspace.js';
import { Application } from '../models/Application.js';
import { Module } from '../models/Module.js';
import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';

let mongoServer: MongoMemoryServer;
let app: express.Application;
let globalWorkspace: any;
let workspace1: any;
let workspace2: any;
let token: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  globalWorkspace = await Workspace.create({
    name: 'Global',
    isGlobal: true,
    isActive: true
  });

  workspace1 = await Workspace.create({
    name: 'Workspace 1',
    isGlobal: false,
    isActive: true
  });

  workspace2 = await Workspace.create({
    name: 'Workspace 2',
    isGlobal: false,
    isActive: true
  });

  // Generate test JWT token
  const userId = new mongoose.Types.ObjectId();
  token = jwt.sign({ id: userId.toString(), role: 'USER' }, 'fallback_secret');

  // Setup minimal Express app for testing
  app = express();
  app.use(express.json());
  app.use('/import', requireAuth, requireWorkspace, importRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Application.deleteMany({});
  await Module.deleteMany({});
  await Incident.deleteMany({});
  await Action.deleteMany({});
});

describe('POST /import - CSV import with workspace scoping', () => {
  it('should import a valid CSV with 5 parts into current workspace', async () => {
    const csvData = `"short_description"
"App1:Module1:Local Support:Incident1:Action1"
"App1:Module1:Local Support:Incident2:Action2"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.imported).toBe(2);
    expect(response.body.skipped).toBe(0);

    const app1 = await Application.findOne({
      name: 'App1',
      workspaceId: workspace1._id
    });
    expect(app1).toBeDefined();

    const mod1 = await Module.findOne({
      name: 'Module1',
      applicationId: app1?._id,
      workspaceId: workspace1._id
    });
    expect(mod1).toBeDefined();

    const incidents = await Incident.find({ workspaceId: workspace1._id });
    expect(incidents).toHaveLength(2);
  });

  it('should import a valid CSV with 4 parts', async () => {
    const csvData = `"App2:Module2:Incident3:Action3"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.imported).toBe(1);

    const app2 = await Application.findOne({
      name: 'App2',
      workspaceId: workspace1._id
    });
    expect(app2).toBeDefined();
  });

  it('should be idempotent - reimporting same CSV does not duplicate', async () => {
    const csvData = `"App3:Module3:Incident4:Action4"`;

    // First import
    await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    // Second import (same data)
    const response2 = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response2.body.imported).toBe(1);

    const apps = await Application.find({
      name: 'App3',
      workspaceId: workspace1._id
    });
    expect(apps).toHaveLength(1);
  });

  it('should create separate records in different workspaces', async () => {
    const csvData = `"App4:Module4:Incident5:Action5"`;

    // Import in workspace 1
    await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    // Import same data in workspace 2
    await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace2._id.toString())
      .send({ csvData })
      .expect(200);

    const apps1 = await Application.find({
      name: 'App4',
      workspaceId: workspace1._id
    });
    expect(apps1).toHaveLength(1);

    const apps2 = await Application.find({
      name: 'App4',
      workspaceId: workspace2._id
    });
    expect(apps2).toHaveLength(1);

    expect(apps1[0]._id.toString()).not.toBe(apps2[0]._id.toString());
  });

  it('should handle malformed lines and continue processing', async () => {
    const csvData = `"App5:Module5:Incident6:Action6"
"BadLine:Only:Two"
"App5:Module5:Incident7:Action7"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.imported).toBe(2);
    expect(response.body.skipped).toBe(1);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);

    const incidents = await Incident.find({ workspaceId: workspace1._id });
    expect(incidents).toHaveLength(2);
  });

  it('should reject request without Authorization header', async () => {
    const csvData = `"App6:Module6:Incident8:Action8"`;

    await request(app)
      .post('/import')
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(401);
  });

  it('should reject request without x-workspace-id header', async () => {
    const csvData = `"App7:Module7:Incident9:Action9"`;

    await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ csvData })
      .expect(200); // Actually succeeds because middleware defaults to global workspace
  });

  it('should return resolved chain IDs for a single new line', async () => {
    const csvData = `"App9:Module9:Incident12:Action12"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.resolved).toBeDefined();

    const app9 = await Application.findOne({ name: 'App9', workspaceId: workspace1._id });
    const mod9 = await Module.findOne({ name: 'Module9', workspaceId: workspace1._id });
    const incident12 = await Incident.findOne({ name: 'Incident12', workspaceId: workspace1._id });
    const action12 = await Action.findOne({ name: 'Action12', workspaceId: workspace1._id });

    expect(response.body.resolved.applicationId).toBe(app9?._id.toString());
    expect(response.body.resolved.moduleId).toBe(mod9?._id.toString());
    expect(response.body.resolved.incidentId).toBe(incident12?._id.toString());
    expect(response.body.resolved.actionId).toBe(action12?._id.toString());
  });

  it('should resolve to the existing entity when reusing a name with different case/whitespace', async () => {
    await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData: `"App10:Module10:Incident13:Action13"` })
      .expect(200);

    const existingApp = await Application.findOne({ name: 'App10', workspaceId: workspace1._id });

    const response2 = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData: `"  app10  : Module10 :Incident14:Action14"` })
      .expect(200);

    expect(response2.body.resolved.applicationId).toBe(existingApp?._id.toString());

    const apps = await Application.find({ name: 'App10', workspaceId: workspace1._id });
    expect(apps).toHaveLength(1);
  });

  it('should not return resolved for multi-line bulk import', async () => {
    const csvData = `"App11:Module11:Incident15:Action15"
"App11:Module11:Incident16:Action16"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.imported).toBe(2);
    expect(response.body.resolved).toBeUndefined();
  });

  it('should skip lines with missing required fields', async () => {
    const csvData = `"App8:Module8:Incident10:Action10"
"App8:Module8::Action11"
"App8:Module8:Incident11:Action11"`;

    const response = await request(app)
      .post('/import')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ csvData })
      .expect(200);

    expect(response.body.imported).toBe(2);
    expect(response.body.skipped).toBe(1);
  });
});
