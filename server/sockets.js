import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let ioRef = null;

function parseAuthCookie(socket) {
  const raw = socket.handshake.headers?.cookie;
  if (!raw) return null;
  const parsed = cookie.parse(raw);
  const token = parsed?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (_e) {
    return null;
  }
}

export function attachRealtime(io) {
  ioRef = io.of('/realtime');

  // Socket-level auth
  ioRef.use(async (socket, next) => {
    const payload = parseAuthCookie(socket);
    if (!payload?._id) return next(new Error('Unauthorized'));
    const user = await User.findById(payload._id).lean();
    if (!user || user.isBlocked) return next(new Error('Unauthorized'));
    socket.data.user = {
      _id: user._id.toString(),
      username: user.username,
      role: user.role
    };
    next();
  });

  ioRef.on('connection', (socket) => {
    const user = socket.data.user;
    // Join role-specific rooms for scoped emits later
    socket.join(`role:${user.role}`);
    socket.emit('connected', { ok: true, user: { username: user.username, role: user.role } });
  });
}

export const realtime = {
  emitCustomer(event, payload, roles = ['admin', 'manager', 'viewer']) {
    if (!ioRef) return;
    roles.forEach((r) => ioRef.to(`role:${r}`).emit(`customer:${event}`, payload));
  },
  emitTransaction(event, payload, roles = ['admin', 'manager', 'viewer']) {
    if (!ioRef) return;
    roles.forEach((r) => ioRef.to(`role:${r}`).emit(`transaction:${event}`, payload));
  },
  emitStatsUpdated(roles = ['admin', 'manager', 'viewer']) {
    if (!ioRef) return;
    roles.forEach((r) => ioRef.to(`role:${r}`).emit('stats:updated', {}));
  }
};
