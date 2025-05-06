// controllers/tutorController.js
import User from "../models/studentUserModel.js"; // Updated to point to merged schema

const becomeTutor = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Please log in to apply as a tutor." });
    }

    const userId = req.user.id;

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
        role: "tutor",
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

export { becomeTutor };
