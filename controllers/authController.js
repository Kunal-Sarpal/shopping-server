import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/Auth.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fashion_erp_jwt_secret_key_2025_suraj';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Try manager@fashionco.com' });
    }

    // Check password — if password is provided, verify with bcrypt
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, name: user.name, initials: user.initials },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
