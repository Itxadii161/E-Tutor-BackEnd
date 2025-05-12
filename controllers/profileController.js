import User from '../models/userModel.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import bcrypt from 'bcryptjs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dosnrrtpt',
  api_key: '425866147882238',
  api_secret: '17UQYKll8B154KAT7NZP-vORatU',
});

// Multer memory storage for files
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const publicId = fileName.substring(0, fileName.lastIndexOf('.'));
  return `${parts[parts.length - 2]}/${publicId}`;
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updates = {};

    // Text fields
    const textFields = [
      'firstName', 'lastName', 'username', 'email', 'bio',
      'gender', 'phoneNumber', 'highestQualification', 'institutionName',
      'graduationYear', 'experienceYears'
    ];

    textFields.forEach(field => {
      if (req.body[field]) updates[field] = req.body[field];
    });

    // Nested address
    if (req.body.address) {
      try {
        updates.address = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;
      } catch (e) {
        console.error('Error parsing address:', e);
      }
    }

    // Date field
    if (req.body.dateOfBirth) {
      updates.dateOfBirth = new Date(req.body.dateOfBirth);
    }

    // Image upload (replace + delete old)
    if (req.files?.image?.[0]) {
      if (user.image) {
        try {
          const publicId = extractPublicId(user.image);
          await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (err) {
          console.error('Error deleting old image:', err.message);
        }
      }
      const imageResult = await uploadToCloudinary(req.files.image[0].buffer, {
        folder: 'user-images',
        resource_type: 'image',
      });
      updates.image = imageResult.secure_url;
    }

    // Resume upload (replace + delete old)
    if (req.files?.resume?.[0]) {
      if (user.resumeUrl) {
        try {
          const publicId = extractPublicId(user.resumeUrl);
          await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch (err) {
          console.error('Error deleting old resume:', err.message);
        }
      }
      const resumeResult = await uploadToCloudinary(req.files.resume[0].buffer, {
        folder: 'user-resumes',
        resource_type: 'raw',
      });
      updates.resumeUrl = resumeResult.secure_url;
    }

    // Add certificates (additive, don't replace)
    if (req.files?.educationCertificates) {
      const certPromises = req.files.educationCertificates.map(file =>
        uploadToCloudinary(file.buffer, {
          folder: 'user-certificates',
          resource_type: 'auto',
        })
      );
      const certResults = await Promise.all(certPromises);
      const newCerts = certResults.map(res => res.secure_url);
      updates.educationCertificates = [...(user.educationCertificates || []), ...newCerts];
    }
// Handle subjectsOfExpertise (array sent as JSON string)
if (req.body.subjectsOfExpertise) {
  try {
    const parsedSubjects = JSON.parse(req.body.subjectsOfExpertise);
    if (Array.isArray(parsedSubjects)) {
      updates.subjectsOfExpertise = parsedSubjects;
    } else {
      console.warn('subjectsOfExpertise is not an array');
    }
  } catch (e) {
    console.error('Error parsing subjectsOfExpertise:', e.message);
  }
}

    // Final DB update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Upload middleware
const uploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'educationCertificates', maxCount: 10 },
  { name: 'resume', maxCount: 1 },
]);

// Change password function
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

export { updateProfile, uploadMiddleware, changePassword };
