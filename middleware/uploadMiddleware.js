const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "public/img/posters");
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    let movieId = req.params.id;

    if (!movieId) {
      movieId = new mongoose.Types.ObjectId().toString();
      req.generatedId = movieId;
    }

    cb(null, `${movieId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const nameParts = file.originalname.split(".");

  if (nameParts.length > 2) {
    return cb(
      new Error(
        "File name format is invalid. Double extensions are not allowed.",
      ),
      false,
    );
  }

  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, JPEG, and PNG format allowed."), false);
  }

  cb(null, true);
};

const uploadPoster = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = uploadPoster;
