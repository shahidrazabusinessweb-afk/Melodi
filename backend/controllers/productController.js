import ProductModel from "../models/ProductModel.js";
import CategoryModel from "../models/CategoryModel.js";
import OrderModel from "../models/OrderModel.js";
import CouponModel from "../models/CouponModel.js";
import UserModel from "../models/UserModel.js";
import fs from "fs";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import gateway from "../config/braintree.js";
import getGateway from "../utils/getGateway.js";
import PosterTemplate from "../models/PosterTemplateModel.js";

const shouldSendToN8n = (value) => value === true || value === "true";

// Helper: Send product details to n8n
const sendProductToN8n = async (product, selectedTemplate = "template_1") => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    console.log("N8N_WEBHOOK_URL is not configured");
    return;
  }

  const template = selectedTemplate?.match?.(/^[a-f\d]{24}$/i)
    ? await PosterTemplate.findById(selectedTemplate).lean()
    : null;

  await axios.post(
    n8nWebhookUrl,
    {
      productId: product._id.toString(),
      productName: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount,
      imageUrl: product.photos?.[0]?.url || null,
      images: product.photos || [],
      category: product.category,
      colors: product.colors,
      sizes: product.sizes,
      dimensions: product.dimensions,
      selectedTemplate: selectedTemplate || "template_1",
      selectedTemplateImage: template?.image || null,
    },
    { timeout: 30000 },
  );

  console.log("Product successfully sent to n8n with template:", selectedTemplate);
};

// Helper: Send new order / booking details to n8n
const sendOrderToN8n = async (orderId) => {
  const n8nOrderWebhookUrl = process.env.N8N_ORDER_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

  if (!n8nOrderWebhookUrl) {
    console.log("N8N_ORDER_WEBHOOK_URL is not configured");
    return;
  }

  const populatedOrder = await OrderModel.findById(orderId)
    .populate("buyer", "name email phone address")
    .populate("products")
    .lean();

  if (!populatedOrder) return;

  await axios.post(
    n8nOrderWebhookUrl,
    {
      event: "new_order_booking",
      orderId: populatedOrder._id.toString(),
      status: populatedOrder.status,
      paymentStatus: populatedOrder.paymentStatus,
      deliveryAddress: populatedOrder.deliveryAddress,
      buyer: {
        id: populatedOrder.buyer?._id,
        name: populatedOrder.buyer?.name,
        email: populatedOrder.buyer?.email,
        phone: populatedOrder.buyer?.phone,
      },
      products: populatedOrder.products?.map((prod) => ({
        id: prod._id,
        name: prod.name,
        price: prod.price,
        imageUrl: prod.photos?.[0]?.url || null,
      })),
      createdAt: populatedOrder.createdAt,
    },
    { timeout: 30000 }
  );

  console.log("Order successfully sent to n8n:", orderId);
};

export const createProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      category,
      shipping,
      shippingCost,
      colors,
      sizes,
      dimensions,
      sendToN8n,
      selectedTemplate,
    } = req.body;

    const photos = req.files;
    const numericPrice = Number(price);
    const numericDiscount = Number(discount ?? 0);
    const numericShippingCost = Number(shippingCost ?? 0);

    // Validation
    if (!name)
      return res.status(400).send({
        success: false,
        message: "Name is required",
      });

    if (!description)
      return res.status(400).send({
        success: false,
        message: "Description is required",
      });

    if (!price || !Number.isFinite(numericPrice) || numericPrice <= 0)
      return res.status(400).send({
        success: false,
        message: "Price is required",
      });

    if (!category)
      return res.status(400).send({
        success: false,
        message: "Category is required",
      });

    if (!photos || photos.length === 0)
      return res.status(400).send({
        success: false,
        message: "At least one product image is required",
      });

    const product = new ProductModel({
      name,
      slug: slugify(name),
      description,
      price: numericPrice,
      discount: Number.isFinite(numericDiscount) ? numericDiscount : 0,
      category,
      shipping: shipping === true || shipping === "true",
      shippingCost: Number.isFinite(numericShippingCost) ? numericShippingCost : 0,
      colors: colors
        ? JSON.parse(colors).map(({ color, quantity }) => ({
            color,
            quantity: Math.max(0, Number(quantity) || 0),
          }))
        : [],
      sizes: sizes ? JSON.parse(sizes) : [],
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
      photos: [],
    });

    // Upload every image
    for (const file of photos) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "ecommerce-products",
      });

      product.photos.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      // delete temporary file
      fs.unlinkSync(file.path);
    }

    await product.save();

    if (shouldSendToN8n(sendToN8n)) {
      try {
        await sendProductToN8n(product, selectedTemplate);
      } catch (n8nError) {
        console.error("Failed to send product to n8n:", n8nError.message);
      }
    }

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Error Creating Product",
      error: error.message,
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      discount,
      shipping,
      shippingCost,
      colors,
      sizes,
      dimensions,
      sendToN8n,
      selectedTemplate,
    } = req.body;

    const files = req.files;

    const product = await ProductModel.findById(req.params.pid);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Update fields
    product.name = name || product.name;
    product.slug = name ? slugify(name) : product.slug;
    product.description = description || product.description;
    product.price = Number(price) || product.price;
    product.category = category || product.category;
    product.discount =
      discount !== undefined && discount !== "" ? Number(discount) || product.discount : product.discount;
    product.shipping = shipping !== undefined ? shipping : product.shipping;
    product.shippingCost =
      shippingCost !== undefined && shippingCost !== ""
        ? Number(shippingCost) || product.shippingCost
        : product.shippingCost;

    if (colors) {
      product.colors = JSON.parse(colors).map(({ color, quantity }) => ({
        color,
        quantity: Math.max(0, Number(quantity) || 0),
      }));
    }

    if (sizes !== undefined) {
      product.sizes = JSON.parse(sizes);
    }

    if (dimensions !== undefined) {
      product.dimensions = JSON.parse(dimensions);
    }

    if (req.files && req.files.length > 0) {
      // Delete old Cloudinary images
      for (const image of product.photos) {
        await cloudinary.uploader.destroy(image.public_id);
      }

      product.photos = [];

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "ecommerce-products",
        });

        product.photos.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        fs.unlinkSync(file.path);
      }
    }
    await product.save();

    if (shouldSendToN8n(sendToN8n)) {
      try {
        await sendProductToN8n(product, selectedTemplate);
      } catch (n8nError) {
        console.error("Failed to send product to n8n:", n8nError.message);
      }
    }

    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Error Updating Product",
      error: error.message,
    });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Delete images from Cloudinary
    if (product.photos.length > 0) {
      for (const image of product.photos) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await ProductModel.findByIdAndDelete(req.params.pid);

    res.status(200).send({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

export const getProductController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await ProductModel.find({})
      .populate("category")
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ProductModel.countDocuments();

    res.status(200).send({
      success: true,
      message: "Fetched all products",
      total,
      totalProducts: total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

export const getSingleProductController = async (req, res) => {
  try {
    const slug = req.params.slug;

    const product = await ProductModel.findOne({
      slug: slug,
    })
      .populate("category")
      .lean();

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Fetched single Product successfully",
      product,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error getting product",
      error,
    });
  }
};

export const getProductByIdController = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid)
      .populate("category")
      .lean();

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error getting product",
      error,
    });
  }
};

export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    const page = Number(req.body.page) || 1;
    const limit = Number(req.body.limit) || 12;
    const skip = (page - 1) * limit;

    let args = {};

    if (checked?.length) {
      args.category = {
        $in: checked,
      };
    }

    if (radio?.length) {
      args.price = {
        $gte: radio[0],
        $lte: radio[1],
      };
    }

    const products = await ProductModel.find(args)
      .populate("category")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductModel.countDocuments(args);

    res.status(200).send({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error Filtering data",
      error,
    });
  }
};

export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        {
          name: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          description: {
            $regex: keyword,
            $options: "i",
          },
        },
      ],
    };

    const result = await ProductModel.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductModel.countDocuments(query);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      result,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error searching Product",
      error,
    });
  }
};

export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;

    const products = await ProductModel.find({
      category: cid,
      _id: {
        $ne: pid,
      },
    })
      .populate("category")
      .limit(3)
      .lean();

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error loading similar products",
      error,
    });
  }
};

export const productCategoryController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const category = await CategoryModel.findOne({
      slug: req.params.slug,
    }).lean();

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    const products = await ProductModel.find({
      category: category._id,
    })
      .populate("category")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductModel.countDocuments({
      category: category._id,
    });

    res.status(200).send({
      success: true,
      category,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error getting Product category",
      error,
    });
  }
};

export const productCountController = async (req, res) => {
  try {
    const total = await ProductModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error in Product count",
      error,
    });
  }
};

export const productListController = async (req, res) => {
  try {
    const perPage = 8;
    const page = Number(req.params.page) || 1;
    const products = await ProductModel.find({})
      .select("-photo")
      .lean()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "Error in per page ctrl",
      error,
    });
  }
};

export const braintreeTokenController = async (req, res) => {
  try {
    const gateway = await getGateway();

    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        return res.status(500).send(err);
      }

      res.send(response);
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      error,
    });
  }
};

export const braintreePaymentController = async (req, res) => {
  try {
    const { cart, nonce, couponCode } = req.body;
    let total = 0;

    cart.forEach((item) => {
      const qty = item.quantity || 1;

      total += Number(item.price) * qty;

      if (item.shipping) {
        total += Number(item.shippingCost || 0) * qty;
      }
    });

    if (couponCode) {
      const coupon = await CouponModel.findOne({
        code: couponCode,
        active: true,
      });

      if (coupon) {
        const user = await UserModel.findById(req.user._id);

        if (!user.usedCoupons.includes(couponCode)) {
          total = total - total * (coupon.percentage / 100);

          user.usedCoupons.push(couponCode);

          await user.save();

          coupon.usedBy.push(req.user._id);

          await coupon.save();
        }
      }
    }
    const gateway = await getGateway();

    gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      async function (error, result) {
        if (result) {
          const order = await new OrderModel({
            products: cart.map((item) => item._id || item),
            payment: result,
            paymentStatus: "Success",
            buyer: req.user._id,
            deliveryAddress: req.body.deliveryAddress,
            status: "Not Processed",
          }).save();

          // Trigger n8n for paid orders
          sendOrderToN8n(order._id).catch((err) =>
            console.error("Failed to send order to n8n:", err.message)
          );

          res.json({ ok: true, order });
        } else {
          res.status(500).send(error);
        }
      },
    );
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  }
};

export const createBookingController = async (req, res) => {
  try {
    const { cart, deliveryAddress } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    if (!deliveryAddress?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const order = await OrderModel.create({
      products: cart.map((item) => item._id || item),
      payment: [],
      paymentStatus: "Pending",
      buyer: req.user._id,
      deliveryAddress,
      status: "Pending Payment",
    });

    // Trigger n8n notification asynchronously
    sendOrderToN8n(order._id).catch((err) =>
      console.error("Failed to send booking order to n8n:", err.message)
    );

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
};