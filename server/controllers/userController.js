import User from '../models/User.js';
import { signToken, cookieOptions } from '../utils/jwt.js';
import { realtime } from '../sockets.js';
import mongoose from 'mongoose';

export async function listUsers(req, res) {
  const users = await User.find().select('-password');
  res.json({ users });
}

export async function createUser(req, res) {
  const { username, password, name, phone, avatarUrl, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  const exists = await User.findOne({ username: username.toLowerCase() });
  if (exists) return res.status(400).json({ message: 'Username already registered' });
  const user = await User.create({ username: username.toLowerCase(), password, name, phone, avatarUrl, role: role || 'viewer' });
  res.status(201).json({ user: { _id: user._id, username: user.username, role: user.role, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl, isBlocked: user.isBlocked } });
}

export async function patchUser(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  const updates = { ...req.body };

  // Non-admins can only update themselves
  if (req.user.role !== 'admin' && req.user._id !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Non-admins cannot change protected fields
  if (req.user.role !== 'admin') {
    delete updates.username;
    delete updates.role;
    delete updates.isBlocked;
  }

  if (updates.password) delete updates.password; // use changePassword

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // If the current user updated themselves, refresh cookie/jwt
  if (req.user._id === user._id.toString()) {
    const fresh = await User.findById(user._id);
    const token = signToken(fresh);
    res.cookie('token', token, cookieOptions());
  }

  res.json({ user });
}

export async function changePassword(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  const { currentPassword, newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password required' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // If not admin, require correct current password and must be self
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (req.user._id !== user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    const ok = await user.comparePassword(currentPassword || '');
    if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
  }

  user.password = newPassword;
  await user.save();

  if (req.user._id === user._id.toString()) {
    const token = signToken(user);
    res.cookie('token', token, cookieOptions());
  }
  res.json({ message: 'Password updated' });
}

export async function toggleBlock(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  // If current user just blocked themselves, clear cookie
  if (req.user && req.user._id === user._id.toString() && user.isBlocked) {
    res.clearCookie('token');
  }
  res.json({ user: { _id: user._id, username: user.username, role: user.role, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl, isBlocked: user.isBlocked } });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  if (req.user._id === id) return res.status(400).json({ message: 'Cannot delete yourself' });
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Deleted' });
}
