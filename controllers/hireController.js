import mongoose from 'mongoose';
import HireRequest from '../models/hireRequestModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const { ObjectId } = mongoose.Types;

// Send hire request

export const sendHireRequest = async (req, res) => {
  try {
    const { tutorId } = req.body;
    const studentId = req.user._id;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(tutorId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid ID(s)' });
    }

    if (tutorId.toString() === studentId.toString()) {
      return res.status(400).json({ error: 'Cannot hire yourself' });
    }

    const [tutor, student] = await Promise.all([
      User.findById(tutorId),
      User.findById(studentId)
    ]);

    if (!tutor || !student) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (tutor.role !== 'Tutor' || student.role === 'Tutor') {
      return res.status(400).json({ error: 'Invalid hiring roles' });
    }

    // Check for existing active requests
    const activeRequest = await HireRequest.findOne({
      student: studentId,
      tutor: tutorId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (activeRequest) {
      return res.status(400).json({ error: 'Active request exists' });
    }

    // Create new request
    const newRequest = new HireRequest({
      student: studentId,
      tutor: tutorId,
      status: 'pending'
    });

    await newRequest.save();

    // Create notification
    const fullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
    await Notification.create({
      recipient: tutorId,
      sender: studentId,
      type: 'hire-request',
      message: `${fullName} has sent you a hire request`,
      relatedEntity: newRequest._id,
      status: 'unread'
    });

    return res.status(200).json({
      message: 'Hire request sent',
      status: 'pending',
      requestId: newRequest._id
    });

  } catch (error) {
    if (error.name === 'ActiveRequestExists') {
      return res.status(400).json({ error: error.message });
    }

    console.error('Hire request error:', error);
    return res.status(500).json({
      error: 'Failed to send hire request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get all hire requests for tutor
export const getTutorHireRequests = async (req, res) => {
  try {
    const tutorId = req.user._id;

    if (!ObjectId.isValid(tutorId)) {
      return res.status(400).json({ error: 'Invalid tutor ID' });
    }
    
    const requests = await HireRequest.find({
      tutor: tutorId,
      status: 'pending'
    }).populate('student', 'fullName email image');
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching hire requests:', error);
    res.status(500).json({ error: 'Server error while fetching hire requests' });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName fullName email image')
      .populate('recipient', '_id')
      .populate({
        path: 'relatedEntity',
        model: 'HireRequest',
        select: 'status'
      });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error sending hire request:', error);
    return res.status(500).json({ error: 'Server error while sending hire request', details: error.message });
  }
  
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error while marking notification' });
  }
};


// Check hire status (enhanced version)
export const checkHireStatus = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const studentId = req.user._id;

    if (!ObjectId.isValid(tutorId) || !ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid ID(s) provided' });
    }

    // In checkHireStatus controller:
const request = await HireRequest.findOne({
  student: studentId,
  tutor: tutorId
}).sort({ createdAt: -1 });

if (!request || request.status === 'rejected' || request.status === 'cancelled' || request.status === 'superseded') {
  return res.status(200).json({ 
    status: null,
    canSendRequest: true
  });
}
    
    res.status(200).json({ 
      status: request.status,
      requestId: request._id,
      canSendRequest: request.status === 'rejected' || request.status === 'cancelled' || request.status === 'superseded'
    });
    

  } catch (error) {
    console.error('Error checking hire status:', error);
    res.status(500).json({ error: 'Server error while checking hire status' });
  }
};

// Cancel hire request
export const cancelHireRequest = async (req, res) => {
  try {
    const { tutorId } = req.body;
    const studentId = req.user._id;

    if (!ObjectId.isValid(tutorId) || !ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid ID(s) provided' });
    }

    const request = await HireRequest.findOneAndUpdate(
      {
        student: studentId,
        tutor: tutorId,
        status: 'pending'
      },
      { status: 'cancelled' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'No pending request found to cancel' });
    }

    // Create notification for tutor
    const notification = new Notification({
      recipient: tutorId,
      sender: studentId,
      type: 'hire-cancelled',
      message: 'A hire request has been cancelled',
      relatedEntity: request._id,
      status: 'unread'
    });

    await notification.save();

    res.status(200).json({ 
      message: 'Hire request cancelled successfully',
      status: 'cancelled'
    });

  } catch (error) {
    console.error('Error cancelling hire request:', error);
    res.status(500).json({ error: 'Server error while cancelling hire request' });
  }
};

// Accept hire request (called by tutor)
export const acceptHireRequest = async (req, res) => {
  try {
    const { studentId } = req.body;
    const tutorId = req.user._id;
   
   

    if (!ObjectId.isValid(studentId) || !ObjectId.isValid(tutorId)) {
      return res.status(400).json({ error: 'Invalid ID(s) provided' });
    }

    const request = await HireRequest.findOneAndUpdate(
      {
        student: studentId,
        tutor: tutorId,
        status: 'pending'
      },
      { status: 'accepted' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'No pending request found to accept' });
    }

    // Add to tutor's hiredBy array
    await User.findByIdAndUpdate(tutorId, {
      $addToSet: { hiredBy: studentId }
    });

    // Create notification for student
    const notification = new Notification({
      recipient: studentId,
      sender: tutorId,
      type: 'hire-accepted',
      message: 'Your hire request has been accepted',
      relatedEntity: request._id,
      status: 'unread'
    });

    await notification.save();

    res.status(200).json({ 
      message: 'Hire request accepted successfully',
      status: 'accepted'
    });

  } catch (error) {
    console.error('Error accepting hire request:', error);
    res.status(500).json({ error: 'Server error while accepting hire request' });
  }
};

// Reject hire request (called by tutor)
export const rejectHireRequest = async (req, res) => {
  try {
    const { studentId } = req.body;
    const tutorId = req.user._id;

    if (!ObjectId.isValid(studentId) || !ObjectId.isValid(tutorId)) {
      return res.status(400).json({ error: 'Invalid ID(s) provided' });
    }

    // Find and update the request
    const request = await HireRequest.findOneAndUpdate(
      { student: studentId, tutor: tutorId, status: { $in: ['pending', 'accepted'] } },
      { status: 'rejected' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'No active request found to reject' });
    }

    // Create notification
    await Notification.create({
      recipient: studentId,
      sender: tutorId,
      type: 'hire-rejected',
      message: 'Your hire request has been rejected',
      relatedEntity: request._id,
      status: 'unread'
    });

    return res.status(200).json({ 
      message: 'Hire request rejected successfully',
      status: 'rejected',
      requestId: request._id
    });
  } catch (error) {
    console.error('Error rejecting hire request:', error);
    return res.status(500).json({ 
      error: 'Server error while rejecting hire request',
      details: error.message
    });
  }
};
