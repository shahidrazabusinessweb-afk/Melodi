import express from "express";
import { isAdmin, requireSignIN } from "../middlewares/authMiddleware.js";
import {
  braintreePaymentController,
  braintreeTokenController,
  createBookingController,
  createProductController,
  deleteProductController,
  getProductByIdController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  relatedProductController,
  searchProductController,
  updateProductController,
} from "../controllers/productController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/create-product",
  requireSignIN,
  isAdmin,
  upload.array("photos", 10),
  createProductController,
);

router.get("/get-product", getProductController);
router.get("/get-product/:slug", getSingleProductController);
router.get("/get-product-by-id/:pid", getProductByIdController);

router.delete("/delete-product/:pid", deleteProductController);

router.put(
  "/update-product/:pid",
  requireSignIN,
  isAdmin,
  upload.array("photos", 10),
  updateProductController,
);

router.post("/product-filters", productFiltersController);
router.get("/product-count", productCountController);
router.get("/product-list/:page", productListController);
router.get("/search/:keyword", searchProductController);
router.get("/related-product/:pid/:cid", relatedProductController);
router.get("/product-category/:slug", productCategoryController);

router.get("/braintree/token", braintreeTokenController);
router.post("/book", requireSignIN, createBookingController);
router.post("/braintree/payment", requireSignIN, braintreePaymentController);
export default router;
