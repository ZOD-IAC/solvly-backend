import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized, no token',
        ok: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { lastActive: new Date() }, // ← update on every authenticated request
      { new: true, select: '-password' },
    );

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        ok: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: 'Not authorized, token failed',
      ok: false,
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      messages: 'admin access only ',
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { lastActive: new Date() }, // ← update on every authenticated request
      { new: true, select: '-password' },
    );

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};
