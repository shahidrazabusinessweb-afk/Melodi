import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  getMonthlySalesController,
  getAllUsersController,
  paymentStatusController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIN } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/forgot-password", forgotPasswordController);
router.get("/test", requireSignIN, isAdmin, testController);
router.get("/user-auth", requireSignIN, (req, res) => {
  res.status(200).send({ ok: true });
});
router.get("/admin-auth", requireSignIN, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

router.put("/profile", requireSignIN, updateProfileController);
router.get("/orders", requireSignIN, getOrdersController);
router.get("/user-orders", requireSignIN, getOrdersController);
router.get("/all-orders", requireSignIN, isAdmin, getAllOrdersController);
router.put(
  "/order-status/:orderId",
  requireSignIN,
  isAdmin,
  orderStatusController,
);
router.put(
  "/payment-status/:orderId",
  requireSignIN,
  isAdmin,
  paymentStatusController,
);

router.get("/monthly-sales", requireSignIN, isAdmin, getMonthlySalesController);

router.get("/all-users", requireSignIN, isAdmin, getAllUsersController);

export default router;
