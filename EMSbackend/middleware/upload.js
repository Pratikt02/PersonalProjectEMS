import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // ✅ 2 MB
  },
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image") ||
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("word");

    if (!allowed) {
      cb(new Error("Unsupported file type"), false);
    } else {
      cb(null, true);
    }
  },
});

export default upload;
