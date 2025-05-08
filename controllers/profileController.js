import fs from 'fs';
import path from 'path';
import User from '../models/studentUserModel.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';  // <-- make sure bcrypt is imported

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (bio) user.bio = bio;

    // Handle new image upload
    if (req.file) {
      // Delete old image
      if (user.image) {
        const oldImagePath = path.join(__dirname, '..', user.image);
        console.log('Old Image Path:', oldImagePath);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Old image deleted successfully.');
        }
      }

      // Save new image as relative path
      const relativeImagePath = path.join('uploads', req.file.filename);
      console.log('New image relative path:', relativeImagePath);
      user.image = relativeImagePath;
    }

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Failed to save the updated user.' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Both current and new passwords are required.'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password.',
      error: error.message
    });
  }
};

export { updateProfile, changePassword };
