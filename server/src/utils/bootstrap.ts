import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

export const ensureDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('✓ Admin already exists, skipping bootstrap');
      return;
    }

    let globalWorkspace = await Workspace.findOne({ isGlobal: true });
    if (!globalWorkspace) {
      globalWorkspace = await Workspace.create({
        name: 'Global',
        isGlobal: true,
        isActive: true
      });
    }

    const passwordHash = await bcrypt.hash('admin', 10);
    await User.create({
      name: 'Administrador',
      email: 'admin@admin.com',
      passwordHash,
      role: 'ADMIN',
      workspaces: [globalWorkspace._id]
    });

    console.log('✓ Usuário admin padrão criado (admin@admin.com / admin) — altere a senha após o primeiro login.');
  } catch (error) {
    console.error('Erro ao criar usuário admin padrão:', error);
    throw error;
  }
};
