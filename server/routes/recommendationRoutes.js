import express from "express";
import multer from "multer";
import { requireAuth } from "@clerk/express";
import { recommendFromCv } from "../controller/recommendationController.js";

const router = express.Router();

const ALLOWED_MIMETYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Unsupported file type"), { code: "INVALID_TYPE" })
      );
    }
  },
});

// POST /api/recommendations/from-cv
router.post(
  "/from-cv",
  requireAuth(),
  (req, res, next) => {
    upload.single("cv")(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, message: "Tệp quá lớn. Kích thước tối đa là 10MB" });
      }
      if (err.code === "INVALID_TYPE") {
        return res
          .status(400)
          .json({ success: false, message: "Định dạng tệp không được hỗ trợ. Chỉ hỗ trợ PDF, DOCX, PNG, JPG" });
      }
      next(err);
    });
  },
  recommendFromCv
);

export default router;
