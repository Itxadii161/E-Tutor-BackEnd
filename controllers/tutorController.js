import User from '../models/userModel.js';

const becomeTutor = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Please log in to apply as a tutor." });
    }

    const userId = req.user._id;
    let {
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      city,
      country,
      highestQualification,
      institutionName,
      graduationYear,
      subjectsOfExpertise,
      experienceYears,
      pastInstitutions,
      certifications,
      availability,
      hourlyRate,
    } = req.body;

    // Normalize gender to lowercase for enum validation
    if (gender) {
      gender = gender.toLowerCase();
    }

    // Validate availability (ensure it's an object)
    let availabilityObj = {};
    try {
      availabilityObj = availability ? JSON.parse(availability) : { days: [], timeSlots: [] };
    } catch {
      availabilityObj = { days: [], timeSlots: [] };
    }

    // Get uploaded files URLs from req.files (Cloudinary URLs)
    const resumeFile = req.files['resumeUrl']?.[0];
    const idProofFile = req.files['idProofUrl']?.[0];
    const educationFiles = req.files['educationCertificates'] || [];

    if (!resumeFile || educationFiles.length === 0) {
      return res.status(400).json({ error: "Resume and at least one education certificate are required." });
    }

    const resumeUrl = resumeFile.path;
    const idProofUrl = idProofFile ? idProofFile.path : null;
    const educationCertificates = educationFiles.map(file => file.path);

    const address = { city, country };

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
        subjectsOfExpertise: subjectsOfExpertise?.split(',').map(s => s.trim()),
        experienceYears,
        pastInstitutions: pastInstitutions?.split(',').map(s => s.trim()),
        certifications: certifications?.split(',').map(s => s.trim()),
        availability: availabilityObj,
        resumeUrl,
        educationCertificates,
        idProofUrl,
        hourlyRate,
        role: "Pending-Tutor",
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Tutor application submitted successfully and pending admin approval.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Apply as tutor error:", err);
    res.status(500).json({ error: "Server error while submitting tutor application." });
  }
}

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
  const { id } = req.params;

  try {
    const tutor = await User.findById(id).select('-password');
    
    if (!tutor) {
      return res.status(404).json({ msg: 'Tutor not found' });
    }

    let hasRated = false;

    if (req.user && Array.isArray(tutor.ratings)) {
      hasRated = tutor.ratings.some(r => r.userId && r.userId.toString() === req.user._id.toString());
    }

    res.json({ tutor, hasRated });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


// Hire a tutor (add user to tutor's hiredBy array)
// const hireTutor = async (req, res) => {
//   const { tutorId, userId } = req.body;
  
//   try {
//     const tutor = await User.findById(tutorId);
//     if (!tutor || tutor.role !== 'Tutor') {
//       return res.status(404).json({ msg: 'Tutor not found or invalid role' });
//     }

//     if (tutor.hiredBy.some(id => id.toString() === userId.toString())) {
//       return res.status(400).json({ message: 'You have already hired this tutor' });
//     }
    

//     tutor.hiredBy.push(userId);
//     await tutor.save();

//     res.json({ msg: 'Hiring request sent successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// };
// Rate a tutor

// Rate Tutor Controller (Updated)
const rateTutor = async (req, res) => {
  const { tutorId,  rating, review } = req.body;
  const userId = req.user.id;
  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'Tutor') {
      return res.status(404).json({ msg: 'Tutor not found or invalid role' });
    }

    // Ensure the user cannot rate themselves
    if (userId.toString() === tutorId.toString()) {
      return res.status(400).json({ msg: 'You cannot rate yourself.' });
    }

    // Ensure the rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if the user has already rated this tutor
   const existingRating = tutor.ratings.find(r => r.userId.toString() === userId.toString());

if (existingRating) {
  // Just update the rating/review
  existingRating.rating = rating;
  existingRating.review = review;
} else {
  // Add a new rating
  tutor.ratings.push({ userId, rating, review });
}

// Recalculate average rating
const totalRatings = tutor.ratings.length;
const totalRatingValue = tutor.ratings.reduce((acc, r) => acc + r.rating, 0);
tutor.averageRating = totalRatingValue / totalRatings;


    // Save the updated tutor
    await tutor.save();

    res.status(200).json({ msg: 'Rating submitted successfully', tutor });
  } catch (err) {
    console.error("Rate tutor error:", err);
    res.status(500).json({ msg: 'Server error while submitting rating.' });
  }
};


export {
  becomeTutor,
  getTutors,
  // checkUserRating,
  getTutorById,
  rateTutor,
  // hireTutor
};
