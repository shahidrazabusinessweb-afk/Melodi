import ProductModel from "../models/ProductModel.js";
import CategoryModel from "../models/CategoryModel.js";
import OrderModel from "../models/OrderModel.js";
import CouponModel from "../models/CouponModel.js";
import UserModel from "../models/UserModel.js";
import fs from "fs";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";

import gateway from "../config/braintree.js";
import getGateway from "../utils/getGateway.js";

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
    } = req.body;

    const photos = req.files;

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

    if (!price)
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
      price,
      discount,
      category,
      shipping: shipping === true || shipping === "true",
      shippingCost: shippingCost || 0,
      colors: colors ? JSON.parse(colors) : [],
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
    product.price = price || product.price;
    product.category = category || product.category;
    product.discount = discount || product.discount;
    product.shipping = shipping !== undefined ? shipping : product.shipping;
    product.shippingCost = shippingCost || product.shippingCost;

    if (colors) {
      product.colors = JSON.parse(colors);
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
      function (error, result) {
        if (result) {
          const order = new OrderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
            deliveryAddress: req.body.deliveryAddress,
          }).save();

          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      },
    );
  } catch (error) {}
};
