// import mongoose from 'mongoose';
import User from '../models/userModel.js';
// import TutorRating from '../models/tutorRatingModel.js';
// import TutorHire from '../models/tutorHireModel.js';

const becomeTutor = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Please log in to apply as a tutor." });
    }

    const userId = req.user._id;
    const {
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      highestQualification,
      institutionName,
      graduationYear,
      subjectsOfExpertise,
      experienceYears,
      pastInstitutions,
      certifications,
      availability,
      resumeUrl,
      educationCertificates,
      idProofUrl,
      hourlyRate,
    } = req.body;

    if (!resumeUrl || !educationCertificates || educationCertificates.length === 0) {
      return res.status(400).json({ error: "Resume and at least one education certificate are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        dateOfBirth,
        gender,
        phoneNumber,
        address,
        highestQualification,
        institutionName,
        graduationYear,
        subjectsOfExpertise,
        experienceYears,
        pastInstitutions,
        certifications,
        availability,
        resumeUrl,
        educationCertificates,
        idProofUrl,
        hourlyRate,
        role: "Tutor",
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Tutor application submitted successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Apply as tutor error:", err);
    res.status(500).json({ error: "Server error while submitting tutor application." });
  }
};

// import User from '../models/userModel';

// Get all tutors (Only users with role "Tutor")
const getTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'Tutor' }).select('-password'); // Exclude password field
    if (!tutors) {
      return res.status(404).json({ msg: 'No tutors found' });
    }
    res.json(tutors);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Get single tutor's full profile by ID
const getTutorById = async (req, res) => {
  const { tutorId } = req.params;
  
  try {
    const tutor = await User.findById(tutorId).select('-password'); // Exclude password
    if (!tutor) {
      return res.status(404).json({ msg: 'Tutor not found' });
    }
    res.json(tutor);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Hire a tutor (add user to tutor's hiredBy array)
const hireTutor = async (req, res) => {
  const { tutorId } = req.params;
  const { userId } = req.body; // The userId of the student

  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'Tutor') {
      return res.status(404).json({ msg: 'Tutor not found or invalid role' });
    }

    // Check if the user has already hired the tutor
    if (tutor.hiredBy.includes(userId)) {
      return res.status(400).json({ msg: 'You have already hired this tutor' });
    }

    // Add student (user) to the tutor's hiredBy array
    tutor.hiredBy.push(userId);
    await tutor.save();

    res.json({ msg: 'Hiring request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Rate a tutor
const rateTutor = async (req, res) => {
  const { tutorId } = req.params;
  const { userId, rating, review } = req.body; // Rating and optional review
  
  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'Tutor') {
      return res.status(404).json({ msg: 'Tutor not found or invalid role' });
    }

    // Check if the user has already rated this tutor
    const existingRating = tutor.ratings.find(r => r.userId.toString() === userId.toString());
    if (existingRating) {
      return res.status(400).json({ msg: 'You have already rated this tutor' });
    }

    // Add the rating to the tutor's ratings array
    tutor.ratings.push({ userId, rating, review });
    tutor.totalReviews += 1;

    // Recalculate the average rating
    const averageRating = tutor.ratings.reduce((acc, r) => acc + r.rating, 0) / tutor.totalReviews;
    tutor.averageRating = averageRating;

    await tutor.save();

    res.json({ msg: 'Rating submitted successfully', averageRating });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


export {
  becomeTutor,
  getTutors,
  // checkUserRating,
  getTutorById,
  rateTutor,
  hireTutor
};
