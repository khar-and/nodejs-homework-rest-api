const multer = require("multer");
const path = require("path");

// Створюємо шлях до тимчасової папки temp
const tempDir = path.join(__dirname, "../", "tmp");

// Створюємо об'єкт налаштувань
const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Створюємо мідлвару upload
const upload = multer({
  storage: multerConfig,
});

module.exports = upload;
