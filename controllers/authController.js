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

    const cleanEmail = String(email).toLowerCase().trim();
    let user = null;

    if (User.db && User.db.readyState === 1) {
      try {
        user = await User.findOne({ email: cleanEmail, is_active: true });
      } catch (e) {
        console.warn('MongoDB User query fallback:', e.message);
      }
    }

    // Fallback accounts if database doesn't have the user or DB is not populated
    if (!user) {
      const FALLBACK_USERS = [
        { _id: 'user-001', email: 'manager@fashionco.com', role: 'Manager', name: 'Suraj Demo', initials: 'SD' },
        { _id: 'user-002', email: 'admin@fashionco.com', role: 'Manager', name: 'Admin User', initials: 'AU' },
        { _id: 'user-003', email: 'receptionist@fashionco.com', role: 'Receptionist', name: 'Priya Sharma', initials: 'PS' },
        { _id: 'user-004', email: 'designer@fashionco.com', role: 'Designer', name: 'Ananya Verma', initials: 'AV' },
        { _id: 'user-005', email: 'partner@fashionco.com', role: 'Partner', name: 'Vikram Malhotra', initials: 'VM' },
      ];

      const foundFallback = FALLBACK_USERS.find(u => u.email.toLowerCase() === cleanEmail);

      if (foundFallback) {
        user = foundFallback;
      } else {
        return res.status(401).json({ error: 'User does not exist. Please sign up first.' });
      }
    } else {
      if (password && user.password) {
        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid credentials. Password is required.' });
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, name: user.name, initials: user.initials },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
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
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    let user = null;
    if (User.db && User.db.readyState === 1) {
      try {
        user = await User.findById(req.user.userId);
      } catch (e) {}
    }

    if (!user) {
      user = {
        name: req.user.name || 'Suraj Demo',
        email: req.user.email || 'manager@fashionco.com',
        role: req.user.role || 'Manager',
        initials: req.user.initials || 'SD'
      };
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
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (User.db && User.db.readyState === 1) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const namePart = name.trim();
      const initials = namePart.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      const newUser = new User({
        name: namePart,
        email: cleanEmail,
        password: hashedPassword,
        role: 'Customer',
        initials: initials || 'ME'
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name, initials: newUser.initials },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        token,
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          initials: newUser.initials
        }
      });
    } else {
      const namePart = name.trim();
      const initials = namePart.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const mockUser = {
        _id: `user-${Date.now()}`,
        name: namePart,
        email: cleanEmail,
        role: 'Customer',
        initials: initials || 'ME'
      };

      const token = jwt.sign(
        { userId: mockUser._id, email: mockUser.email, role: mockUser.role, name: mockUser.name, initials: mockUser.initials },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        token,
        user: mockUser
      });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
