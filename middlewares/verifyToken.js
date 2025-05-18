import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const authUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await User.findById(decoded.userId);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);
    console.log('Decoded token userId:', userId);
console.log('Fetched user:', user);

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
      // console.log('something') 
      // console.log(err.message)
    }

    req.user = user; // Make user available in controller
    next();
  } catch (err) {
    // Differentiate token errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else {
      return res.status(401).json({ error: 'Authentication failed.' });
    }
  }
};

export { authUser };
// middleware/authMiddleware.js (continued)
export const isAdmin = (req, res, next) => {
  try {
    // This middleware should be used after authenticate
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    // Check if user is admin
    // Note: You'll need to add an isAdmin field to your User model
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin verification.' 
    });
  }
};