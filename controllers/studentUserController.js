import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/studentUserModel.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Google login
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required.' });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ email });

    // If user doesn't exist, create new one
    if (!user) {
      let baseUsername = email.split('@')[0];
      let username = baseUsername;
      let suffix = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${suffix++}`;
      }

      user = new User({
        email,
        firstName: given_name,
        lastName: family_name,
        username,
        image: picture || '/default-avatar.png',
        isGoogleUser: true,
        password: undefined, // Avoid saving password for Google login
      });

      await user.save();
    } else {
      // Update user with the Google image
      user.image = picture || user.image;  // Keep existing custom image if Google image is not provided
      await user.save();
    }

    // Generate a JWT token with 7 days expiry
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
      },
    });

  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ success: false, message: 'Google login failed.', error: error.message });
  }
};

// ✅ User registration
const signup = async (req, res) => {
  const { firstName, lastName, username, email, password, confirmPassword, title = "Student" } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Required fields are missing.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    // Check if email or username already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: userExists.email === email 
          ? 'User already exists with that email.' 
          : 'Username is already taken.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      title,
      password: hashedPassword,
      image: '', // Initialize empty image
      role: 'student' // Explicitly set role
    });

    await newUser.save();

    // Generate JWT token with 7 days expiry
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      token, // Send token to frontend
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        title: newUser.title,
        image: newUser.image,
        role: newUser.role
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
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
