import express from "express";
import formidable from "express-formidable";
import { isAdmin, requireSignIN } from "../middlewares/authMiddleware.js";
import {
  deletePosterTemplate,
  getPosterTemplates,
  uploadPosterTemplate,
} from "../controllers/posterTemplateController.js";

const router = express.Router();

router.get("/templates", getPosterTemplates);
router.post(
  "/upload-template",
  requireSignIN,
  isAdmin,
  formidable(),
  uploadPosterTemplate,
);
router.delete("/delete-template/:id", requireSignIN, isAdmin, deletePosterTemplate);

export default router;