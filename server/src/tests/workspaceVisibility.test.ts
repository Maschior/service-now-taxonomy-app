import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import applicationsRouter from '../routes/applications.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import { errorHandler } from '../middleware/errorHandler.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { Application } from '../models/Application.js';

let mongoServer: MongoMemoryServer;
let app: express.Application;

let globalWorkspace: any;
let workspace1: any;
let workspace2: any;
let workspace3: any;

const signToken = (id: string, role: 'ADMIN' | 'USER') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret');

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/applications', requireAuth, requireWorkspace, applicationsRouter);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Workspace.deleteMany({});
  await User.deleteMany({});
  await Application.deleteMany({});

  globalWorkspace = await Workspace.create({ name: 'Global', isGlobal: true, isActive: true });
  workspace1 = await Workspace.create({ name: 'Workspace 1', isActive: true });
  workspace2 = await Workspace.create({ name: 'Workspace 2', isActive: true });
  workspace3 = await Workspace.create({ name: 'Workspace 3', isActive: true });
});

describe('Workspace visibility scoping (scope=all / workspaceId)', () => {
  it('default GET (no scope) only returns current workspace + global', async () => {
    await Application.create({ name: 'App WS1', workspaceId: workspace1._id, isActive: true });
    await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });
    await Application.create({ name: 'App Global', workspaceId: globalWorkspace._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r1@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    const res = await request(app)
      .get('/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(200);

    const names = res.body.map((a: any) => a.name);
    expect(names).toEqual(expect.arrayContaining(['App WS1', 'App Global']));
    expect(names).not.toContain('App WS2');
  });

  it('scope=all for a non-admin user only widens to the workspaces they belong to (tenant isolation)', async () => {
    await Application.create({ name: 'App WS1', workspaceId: workspace1._id, isActive: true });
    await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });
    await Application.create({ name: 'App WS3', workspaceId: workspace3._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r2@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id] // does NOT belong to workspace3
    });
    const token = signToken(user._id.toString(), 'USER');

    const res = await request(app)
      .get('/applications?scope=all')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(200);

    const names = res.body.map((a: any) => a.name);
    expect(names).toEqual(expect.arrayContaining(['App WS1', 'App WS2']));
    expect(names).not.toContain('App WS3');
  });

  it('scope=all for an admin in the Global context returns items from every active workspace', async () => {
    await Application.create({ name: 'App WS1', workspaceId: workspace1._id, isActive: true });
    await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });
    await Application.create({ name: 'App WS3', workspaceId: workspace3._id, isActive: true });

    const admin = await User.create({
      name: 'Admin', email: 'admin@test.com', passwordHash: 'x', role: 'ADMIN',
      workspaces: [globalWorkspace._id]
    });
    const token = signToken(admin._id.toString(), 'ADMIN');

    const res = await request(app)
      .get('/applications?scope=all')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', globalWorkspace._id.toString())
      .expect(200);

    const names = res.body.map((a: any) => a.name);
    expect(names).toEqual(expect.arrayContaining(['App WS1', 'App WS2', 'App WS3']));
  });

  it('workspaceId outside the resolved scope is rejected with 400', async () => {
    const user = await User.create({
      name: 'Regular', email: 'r3@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id] // does not belong to workspace2
    });
    const token = signToken(user._id.toString(), 'USER');

    const res = await request(app)
      .get(`/applications?scope=all&workspaceId=${workspace2._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('workspaceId within the resolved scope filters to only that workspace', async () => {
    await Application.create({ name: 'App WS1', workspaceId: workspace1._id, isActive: true });
    await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r4@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    const res = await request(app)
      .get(`/applications?scope=all&workspaceId=${workspace2._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(200);

    const names = res.body.map((a: any) => a.name);
    expect(names).toEqual(['App WS2']);
  });

  it('PUT on an item in another workspace the user belongs to succeeds', async () => {
    const item = await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r5@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    const res = await request(app)
      .put(`/applications/${item._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString()) // current workspace is WS1, item lives in WS2
      .send({ name: 'App WS2 renamed' })
      .expect(200);

    expect(res.body.name).toBe('App WS2 renamed');
  });

  it('DELETE on an item in another workspace the user belongs to succeeds', async () => {
    const item = await Application.create({ name: 'App WS2', workspaceId: workspace2._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r6@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    await request(app)
      .delete(`/applications/${item._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(200);

    const updated = await Application.findById(item._id);
    expect(updated?.isActive).toBe(false);
  });

  it('PUT/DELETE on an item in a workspace outside the visible set is forbidden', async () => {
    const item = await Application.create({ name: 'App WS3', workspaceId: workspace3._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r7@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id] // not workspace3
    });
    const token = signToken(user._id.toString(), 'USER');

    await request(app)
      .put(`/applications/${item._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ name: 'Hacked' })
      .expect(403);

    await request(app)
      .delete(`/applications/${item._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .expect(403);
  });

  it('a Global item still requires ADMIN to edit even though it is visible', async () => {
    const item = await Application.create({ name: 'Global App', workspaceId: globalWorkspace._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r8@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    await request(app)
      .put(`/applications/${item._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace1._id.toString())
      .send({ name: 'Renamed' })
      .expect(403);
  });

  it('POST duplicate-name check is not widened: same name in two unrelated workspaces is allowed', async () => {
    await Application.create({ name: 'Shared Name', workspaceId: workspace1._id, isActive: true });

    const user = await User.create({
      name: 'Regular', email: 'r9@test.com', passwordHash: 'x', role: 'USER',
      workspaces: [workspace1._id, workspace2._id]
    });
    const token = signToken(user._id.toString(), 'USER');

    // Creating in workspace2 (unrelated to the existing app's workspace1) must
    // succeed: the duplicate-name check stays scoped to accessibleWorkspaceIds
    // (current + global), it is not widened by getVisibleWorkspaceIds.
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspace2._id.toString())
      .send({ name: 'Shared Name' })
      .expect(201);

    expect(res.body.name).toBe('Shared Name');
  });
});
