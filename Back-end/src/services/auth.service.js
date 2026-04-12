// src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/user.model');
const TokenBlocklist = require('../models/tokenBlocklist.model');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function register({ username, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed });
  const token = signToken(user);
  return { user, token };
}

async function login({ email, username, password }) {
  // Allow login by either email or username
  // Smart detection: if email field looks like username (no @), use as username
  let loginIdentifier = email || username;
  
  if (!loginIdentifier) throw new Error('Email or username is required');
  if (!password) throw new Error('Password is required');

  console.log('🔐 Auth.login called with:', { loginIdentifier, hasAt: loginIdentifier.includes('@') });

  // Detect if identifier is email (contains @) or username
  const isEmailFormat = loginIdentifier.includes('@');
  
  const whereCondition = isEmailFormat 
    ? { email: loginIdentifier }
    : { username: loginIdentifier };

  const user = await User.findOne({ where: whereCondition });

  console.log('🔍 User lookup result:', { found: !!user, username: user?.username, email: user?.email });

  if (!user) {
    console.error('❌ User not found with:', whereCondition);
    throw new Error('Invalid credentials');
  }
  
  if (!user.password) {
    console.error('❌ User has no password hash:', user.id);
    throw new Error('Account registered without password. Use Google login.');
  }

  console.log('🔑 Comparing password...');
  const ok = await bcrypt.compare(password, user.password);
  console.log('🔐 Password match result:', ok);

  if (!ok) {
    console.error('❌ Password mismatch for user:', user.id);
    throw new Error('Invalid credentials');
  }

  const token = signToken(user);
  console.log('✅ Login successful, token generated for user:', user.id);
  return { user, token };
}

async function googleLogin({ googleId, email, username }) {
  let user = await User.findOne({ where: { googleId } });
  if (!user) {
    user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ username, email, googleId, password: null });
    } else {
      await user.update({ googleId });
    }
  }
  const token = signToken(user);
  return { user, token };
}

async function logout(token) {
  if (!token) throw new Error('No token provided');
  await TokenBlocklist.create({ token });
  return true;
}

async function isBlacklisted(token) {
  if (!token) return false;
  const found = await TokenBlocklist.findOne({ where: { token } });
  return !!found;
}

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  signToken,
  isBlacklisted,
};
