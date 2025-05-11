import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Google login

const googleLogin = async (req, res) => {
  // Set proper CORS headers
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Referrer-Policy', 'no-referrer-when-downgrade');

  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ 
      success: false, 
      message: 'Google credential is required.' 
    });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Validate essential payload data
    if (!payload.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Google email not verified'
      });
    }

    const { email, given_name, family_name, picture, sub: googleId } = payload;

    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    // If user doesn't exist, create new one
    if (!user) {
      let baseUsername = email.split('@')[0];
      let username = baseUsername;
      let suffix = 1;
      
      // Check username availability
      while (await User.findOne({ username })) {
        username = `${baseUsername}${suffix++}`;
      }

      user = new User({
        email,
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        username,
        googleId,
        image: picture || '/default-avatar.png',
        isGoogleUser: true,
        isVerified: true // Google users are automatically verified
      });

      await user.save();
    } else {
      // Update user with Google data if missing
      if (!user.googleId) user.googleId = googleId;
      if (!user.image && picture) user.image = picture;
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        isGoogleUser: true 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Google login successful!',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role || 'student'
      },
    });

  } catch (error) {
    console.error('Google login error:', error);
    
    // Specific error handling
    if (error.message.includes('Malformed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token format'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ User registration
const signup = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword, title = "Student" } = req.body;

    // Validate input
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      title,
      password: hashedPassword,
      image: '',
      role: 'Student'
    });

    await newUser.save();

    // Create token
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message // Include error message for debugging
    });
  }
};

// ✅ Login with email/password
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format.' });
  }

  if (!password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password is required.' 
    });
  }

  try {
    // Find user by email (case insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') }});
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials'
      });
    }

    // Check if user has password (for Google users)
    if (!user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'This account was created with Google. Please sign in with Google.' 
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token with 7 days expiry
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    // Return response with user data (excluding sensitive info)
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role || 'student',
      image: user.image
    };

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// ✅ Get user role from token
const getUserRole = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, role: user.role || 'student' });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ✅ Get user data by token
const getUserData = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ✅ Get total students
const totalStudents = async (req, res) => {
  try {
    const total = await User.countDocuments({ role: 'student' });
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get student count' });
  }
};

export { signup, loginUser, getUserRole, getUserData, googleLogin, totalStudents };
