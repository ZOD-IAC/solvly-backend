import bcrypt from 'bcrypt';
import { genToken, genRefreshToken } from '../utils/generateToken.js';
import User from '../models/user.js';
import multiavatar from '@multiavatar/multiavatar/esm';
import { RefreshToken } from '../models/RefreshToken.js';
import { getQuestionRelatedToUser } from '../services/question.services.js';
import {
  getSavedQuestion,
  getUserRelatedtoFilter,
} from '../services/user.services.js';
import { cookieOptions } from '../utils/helper.js';
const isDevelopment = process.env.environment;

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existUser = await User.findOne({ email }).select('-password');

    if (existUser) {
      return res.status(400).json({ message: 'User already exist', ok: false }); // ✅ return added
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const avatar = multiavatar(name, true, { part: '10', theme: 'B' });

    const newUser = await User.create({
      name,
      email,
      password: hashPass,
      reputation: 0,
      avatar,
      role: 'user',
    });

    const token = genToken(newUser._id);
    const refreshToken = genRefreshToken();

    await RefreshToken.create({
      userId: newUser._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.cookie('accessToken', token, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.cookie(
      'refreshToken',
      refreshToken,
      cookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar,
        reputation: newUser.reputation,
      },
      ok: true,
    });
  } catch (error) {
    // ✅ handle duplicate key error separately
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exist', ok: false });
    }

    console.log(error, 'error occurred');
    return res
      .status(500)
      .json({ code: 500, message: 'Something went wrong', ok: false });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: 'User does not exist',
        code: 400,
        ok: false,
      });
    }

    const verify = await bcrypt.compare(password, user.password);
    if (!verify) {
      return res.status(400).json({
        message: 'Email or password is incorrect',
        code: 400,
        ok: false,
      });
    }

    const token = genToken(user._id);
    const refreshToken = genRefreshToken();

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.cookie('accessToken', token, cookieOptions(7 * 24 * 60 * 60 * 1000));

    res.cookie(
      'refreshToken',
      refreshToken,
      cookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    res.status(200).json({
      message: 'User logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        reputation: user.reputation,
        role: user.role,
        avatar: user.avatar,
      },
      ok: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'server error',
      code: 500,
      ok: false,
    });
  }
};

const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  try {
    if (token) {
      await RefreshToken.deleteOne({ token });
    }

    res.clearCookie('accessToken', cookieOptions(0)); // ← same options as when set
    res.clearCookie('refreshToken', cookieOptions(0)); // ← same options as when set

    res.status(200).json({ message: 'Logged out', ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!', ok: false });
  }
};

const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ ok: false });

  const stored = await RefreshToken.findOne({ token });
  if (!stored || stored.expiresAt < new Date()) {
    // Clear the stale cookie too
    res.clearCookie('refreshToken');
    return res.status(403).json({ ok: false });
  }

  // Rotate — delete old, create new
  await RefreshToken.deleteOne({ token });
  const newRefreshToken = genRefreshToken();
  await RefreshToken.create({
    userId: stored.userId,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const newAccessToken = genToken(stored.userId);

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(400).json({
        message: 'User not found',
        ok: false,
      });
    }

    const question = await getQuestionRelatedToUser(userId);

    return res.status(200).json({
      message: 'User fetched successfully',
      data: { user, question },
      ok: true,
    });
  } catch (error) {
    console.warn(error, ': server error');
    return res.status(500).json({
      message: 'something went wrong',
      data: {},
      ok: false,
    });
  }
};

const editUser = async (req, res) => {};

const changeAvater = async (req, res) => {};

const removeAvater = async (req, res) => {};

const getUserList = async (req, res) => {
  try {
    const query = req.query;
    const user = await getUserRelatedtoFilter(query);

    return res.status(200).json({
      message: `${user.total} user found`,
      ok: true,
      data: user,
    });
  } catch (error) {
    console.warn(error, ': server error');
    return res.status(500).json({
      message: 'something went wrong',
      data: {},
      ok: false,
    });
  }
};

const getUserSaveList = async (req, res) => {
  try {
    const { userId } = req.params;
    const saved = await getSavedQuestion(userId);

    res.status(200).json({
      message: `${saved.length} saved Question found`,
      ok: true,
      data: { saved },
    });
  } catch (error) {
    console.warn(error, ': server error');
    return res.status(500).json({
      message: 'Cannot find Question',
      data: null,
      ok: false,
    });
  }
};

export {
  createUser,
  loginUser,
  getUser,
  logout,
  refreshAccessToken,
  getUserList,
  getUserSaveList,
  editUser,
  changeAvater,
  removeAvater,
};
