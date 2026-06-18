import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Login Route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('rememberMe').optional().isBoolean(),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body;
      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail }).populate('workspaces');
      if (!user) {
        console.warn(`[LOGIN] Falha: usuário não encontrado para email="${normalizedEmail}". Total de usuários no banco: ${await User.countDocuments()}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        console.warn(`[LOGIN] Falha: senha não confere para email="${normalizedEmail}". Hash no banco começa com "${user.passwordHash.substring(0, 7)}".`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log(`[LOGIN] Sucesso para email="${normalizedEmail}".`);

      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaces: user.workspaces
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// Register Route
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      // Default behavior: Attach new user to Global Workspace so they can see base taxonomy
      const globalWorkspace = await Workspace.findOne({ isGlobal: true });
      const workspaces = globalWorkspace ? [globalWorkspace._id] : [];

      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        name,
        role: 'USER',
        workspaces
      });

      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaces: workspaces // Send IDs initially
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

export default router;
