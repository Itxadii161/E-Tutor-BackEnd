import multer from 'multer';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinaryConfig.js';

// Use multer memory storage to store file buffer temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to upload a single file buffer in req.file to Cloudinary
const uploadSingleToCloudinary = (fieldName) => (req, res, next) => {
  if (!req.files || !req.files[fieldName]) {
    return next();
  }

  const files = req.files[fieldName]; // array of files

  // Helper function to upload a file buffer to Cloudinary
  const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'tutors' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      Readable.from(file.buffer).pipe(stream);
    });
  };

  (async () => {
    try {
      // If multiple files, upload all, else single file
      if (Array.isArray(files)) {
        const uploadedUrls = [];
        for (const file of files) {
          const url = await uploadFile(file);
          uploadedUrls.push(url);
        }
        // Save URLs array in req.body[fieldName]
        req.body[fieldName] = uploadedUrls;
      } else {
        // Single file upload
        const url = await uploadFile(files);
        req.body[fieldName] = url;
      }
      next();
    } catch (err) {
      next(err);
    }
  })();
};

export { upload, uploadSingleToCloudinary };
