import jwt from 'jsonwebtoken';

export function signToken(user) {
  const payload = {
    _id: user._id.toString(),
    username: user.username,
    name: user.name || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    role: user.role,
    isBlocked: user.isBlocked
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function cookieOptions(opts = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const remember = opts.remember !== undefined ? !!opts.remember : true;
  const base = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
  };
  return remember ? { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 } : base;
}
