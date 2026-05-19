const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/docs");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const ext = path.extname(file.originalname).toLowerCase();

    // cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    cb(null, `${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, PNG, PDF, DOC, DOCX files are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;