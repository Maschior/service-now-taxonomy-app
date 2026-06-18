import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { ensureDefaultAdmin } from '../utils/bootstrap.js';
import bcrypt from 'bcryptjs';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
});

describe('ensureDefaultAdmin bootstrap', () => {
  it('should create admin@admin.com user in empty database', async () => {
    await ensureDefaultAdmin();

    const admin = await User.findOne({ email: 'admin@admin.com' });
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');
    expect(admin?.name).toBe('Administrador');

    const globalWs = await Workspace.findOne({ isGlobal: true });
    expect(globalWs).toBeDefined();
    const adminWsIds = admin?.workspaces.map(id => id.toString()) || [];
    expect(adminWsIds).toContain(globalWs?._id.toString());
  });

  it('should verify admin password is hashed correctly', async () => {
    await ensureDefaultAdmin();

    const admin = await User.findOne({ email: 'admin@admin.com' });
    const isMatch = await bcrypt.compare('admin', admin!.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('should be idempotent - calling twice does not duplicate admin', async () => {
    await ensureDefaultAdmin();
    await ensureDefaultAdmin();

    const admins = await User.find({ role: 'ADMIN' });
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe('admin@admin.com');
  });

  it('should not create admin if one already exists', async () => {
    const existingWs = await Workspace.create({
      name: 'Existing',
      isGlobal: false,
      isActive: true
    });

    const existingAdmin = await User.create({
      name: 'Other Admin',
      email: 'other@admin.com',
      passwordHash: await bcrypt.hash('password', 10),
      role: 'ADMIN',
      workspaces: [existingWs._id]
    });

    await ensureDefaultAdmin();

    const admins = await User.find({ role: 'ADMIN' });
    expect(admins).toHaveLength(1);
    expect(admins[0]._id.toString()).toBe(existingAdmin._id.toString());
    expect(admins[0].email).toBe('other@admin.com');
  });

  it('should create Global workspace if it does not exist', async () => {
    expect(await Workspace.findOne({ isGlobal: true })).toBeNull();

    await ensureDefaultAdmin();

    const globalWs = await Workspace.findOne({ isGlobal: true });
    expect(globalWs).toBeDefined();
    expect(globalWs?.name).toBe('Global');
  });
});
