const cloudinary = require('../config/cloudinary')
const user = require('../models/User')
const UserProfile = require('../models/UserProfile')

const fs = require("fs");
const path = require("path");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      })
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'cway-admin', // Optional: organize images in a folder
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Resize if needed
        { quality: 'auto' }, // Auto optimize quality
      ],
    })

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
}

exports.deleteImage = async (req, res) => {
  try {
    let { publicId } = req.params

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide image public ID',
      })
    }

    publicId = decodeURIComponent(publicId)

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully',
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found',
      })
    }
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image',
    })
  }
}

exports.profileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an profile image',
      })
    }
    const updatedUser = await user.findById(req.user._id);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'profile', // Optional: organize images in a folder
      resource_type: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto' },
      ],
    })

    if (updatedUser.profileImage) {
      await cloudinary.uploader.destroy(updatedUser.profileImage.split('/').pop().split('.')[0]);
    }
    updatedUser.profileImage = uploadResult.secure_url;
    await updatedUser.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: uploadResult.secure_url
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
}

exports.resumeUpload = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "resumes",
          resource_type: "raw",
          public_id: `resume_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      url: result?.secure_url,
      publicId: result?.public_id
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const userId = req.user?._id || req.user?.id;

    const fileUrl = `/uploads/docs/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      docUrl: fileUrl,
      fileData: req.file
    });

  } catch (error) {
    console.log(error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Max 10MB.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.ProfileDocs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const userId = req.user?._id || req.user?.id;

    const fileUrl = `/uploads/docs/${req.file.filename}`;

    const {
      docKey,
      docName,
      originalName,
    } = req.body;

    const { student } = req.query

    const profile = await UserProfile.findOne({
      user: student,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    let documents = profile.documents ? JSON.parse(profile.documents) || {} : {};

    const existingDoc = documents[docKey] || {};

    documents[docKey] = {
      ...existingDoc,
      docKey,
      docName: existingDoc.docName || docName,
      originalName: originalName || req.file.originalname,
      url: fileUrl,
      status: "pending",
      remarks: "",
      uploadedBy: req.user?.name,
      uploadedAt: new Date(),
      mimeType: req.file.mimetype
    };
    profile.documents = documents;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: documents[docKey],
    });
  } catch (error) {
    console.log(error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed.',
      error: error.message
    });
  }
};


// exports.ProfileDocs = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded.",
//       });
//     }

//     const fileUrl = `/uploads/docs/${req.file.filename}`;

//     const {
//       docKey,
//       docName,
//       originalName,
//     } = req.body;

//     const { student } = req.query;

//     const profile = await UserProfile.findOne({
//       user: student,
//     });

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: "Profile not found",
//       });
//     }

//     let documents = profile.documents || {};

//     // Delete previous file if exists
//     if (documents[docKey]?.url) {
//       const oldFilePath = path.join(
//         process.cwd(),
//         documents[docKey].url.replace(/^\//, "")
//       );

//       if (fs.existsSync(oldFilePath)) {
//         try {
//           fs.unlinkSync(oldFilePath);
//         } catch (err) {
//           console.error("Failed to delete old file:", err.message);
//         }
//       }
//     }

//     const existingDoc = documents[docKey] || {};

//     documents[docKey] = {
//       ...existingDoc,
//       docKey,
//       docName: existingDoc.docName || docName,
//       originalName: originalName || req.file.originalname,
//       url: fileUrl,
//       status: "pending",
//       remarks: "",
//       uploadedBy: req.user?.name,
//       uploadedAt: new Date(),
//       mimeType: req.file.mimetype,
//     };

//     profile.markModified("documents");
//     profile.documents = documents;

//     await profile.save();

//     return res.status(200).json({
//       success: true,
//       message: "Document uploaded successfully",
//       data: documents[docKey],
//     });
//   } catch (error) {
//     console.log(error);

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid ID format.",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Upload failed.",
//       error: error.message,
//     });
//   }
// };

exports.deleteProfileDoc = async (req, res) => {
  try {
    const { student, docKey } = req.query;

    if (!student || !docKey) {
      return res.status(400).json({
        success: false,
        message: "student and docKey are required",
      });
    }

    const profile = await UserProfile.findOne({
      user: student,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    let documents = {};

    try {
      documents = profile.documents
        ? JSON.parse(profile.documents)
        : {};
    } catch (err) {
      documents = {};
    }

    if (!documents[docKey]) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = documents[docKey];

    if (document.url) {
      const filePath = path.join(
        process.cwd(),
        document.url.replace(/^\//, "")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    delete documents[docKey];
    profile.documents = documents;
    await profile.save();
    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};