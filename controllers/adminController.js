// controllers/adminController.js
import User from '../models/userModel.js';

// Get all users with role filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
    
    // Count users by role
    const studentCount = await User.countDocuments({ role: 'Student' });
    const tutorCount = await User.countDocuments({ role: 'Tutor' });
    const pendingTutorCount = await User.countDocuments({ role: 'Pending-Tutor' });

    res.status(200).json({
      success: true,
      users,
      counts: {
        students: studentCount,
        tutors: tutorCount,
        pendingTutors: pendingTutorCount
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
};

// Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user details' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
};

// Get pending tutor requests
export const getPendingTutors = async (req, res) => {
  try {
    const pendingTutors = await User.find({ role: 'Pending-Tutor' }).select('-password');
    
    res.status(200).json({ success: true, pendingTutors });
  } catch (error) {
    console.error('Error fetching pending tutors:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching pending tutors' });
  }
};

// Process tutor request (approve/reject)
export const processTutorRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const { id } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const update = action === 'approve' 
      ? { role: 'Tutor' } 
      : { role: 'Student' };

    const updatedUser = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `Tutor request ${action === 'approve' ? 'approved' : 'rejected'}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error processing tutor request:', error);
    res.status(500).json({ success: false, message: 'Server error while processing tutor request' });
  }
};