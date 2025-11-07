import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function optionalAuth(req, _res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
  } catch (_e) {
    // ignore invalid
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    if (payload.isBlocked) return res.status(401).json({ message: 'Account blocked' });
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

export async function refreshUserPayload(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  return {
    _id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    role: user.role,
    isBlocked: user.isBlocked
  };
}
