import User from '../models/User.js';
import { signToken, cookieOptions } from '../utils/jwt.js';

export async function login(req, res) {
  const { username, password, remember } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.isBlocked) return res.status(401).json({ message: 'Account blocked' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions({ remember }));
  res.json({ user: { _id: user._id, username: user.username, role: user.role, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl, isBlocked: user.isBlocked } });
}

export async function me(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ user: req.user });
}

export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}
