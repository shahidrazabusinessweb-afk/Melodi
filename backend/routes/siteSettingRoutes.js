import express from "express";

import { isAdmin, requireSignIN } from "../middlewares/authMiddleware.js";
import {
  getWhatsAppNumber,
  saveWhatsAppNumber,
} from "../controllers/siteSettingController.js";

const router = express.Router();

router.get("/whatsapp", getWhatsAppNumber);
router.put("/whatsapp", requireSignIN, isAdmin, saveWhatsAppNumber);

export default router;
