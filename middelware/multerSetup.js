const multer = require("multer");
const path = require("path");
const fs = require("fs");

const configureMulter = (subfolder, maxFiles) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join("uploads", subfolder);
      // Check if the subfolder exists, if not, create it
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."));
      cb(
        {
          message: "Invalid file type. Only JPEG, PNG, and GIF are allowed.",
        },
        false
      );
    }
  };

  return multer({
    storage: storage,
    limits: {
      files: maxFiles,
      fileSize: 1 * 1024 * 1024, // 1MB limit
    },
    fileFilter: fileFilter,
  });
};

module.exports = (subfolder, maxFiles) => {
  const upload = configureMulter(subfolder, maxFiles);

  return (req, res, next) => {
    const maxFilesLimit = parseInt(maxFiles, 10);

    // Check if the number of files exceeds the limit
    if (req.files && req.files.length > maxFilesLimit) {
      return res.status(400).send({
        message: `Exceeded the maximum number of files. Maximum allowed: ${maxFilesLimit}`,
      });
    }

    // Use upload.array('pictures', maxFiles) to enforce the limit at the Multer level
    upload.array("pictures")(req, res, (err) => {
      if (err) {
        if (
          err instanceof multer.MulterError &&
          err.code === "LIMIT_FILE_COUNT"
        ) {
          return res.status(400).send({
            message: `Exceeded the maximum number of files. Maximum allowed: ${maxFilesLimit}. But the system received: ${req.files.length} files. Try to limit your files to a maximum of ${maxFilesLimit}`,
          });
        } else if (
          err instanceof multer.MulterError &&
          err.code === "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).send({
            message: `File size exceeded. Maximum allowed size: 1MB.`,
          });
        } else if (err.message) {
          // Handle other errors with a message property
          return res.status(400).json({
            message: err.message,
          });
        } else {
          return res
            .status(500)
            .send({ message: "Internal Server Error in multer" });
        }
      }
      next();
    });
  };
};
