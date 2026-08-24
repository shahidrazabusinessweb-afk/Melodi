import CategoryModel from "../models/CategoryModel.js";
import slugify from "slugify";
import fs from "fs";

export const createCategoryController = async (req, res) => {
  try {
    const { name, brandName, sizeType } = req.fields || {};
    const { image } = req.files || {};

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Name is required",
      });
    }

    const category = new CategoryModel({
      name,
      brandName,
      sizeType: ["none", "dimensions", "apparel"].includes(sizeType)
        ? sizeType
        : "none",
      slug: slugify(name),
    });

    if (image) {
      category.image.data = fs.readFileSync(image.path);
      category.image.contentType = image.type;
    }

    await category.save();

    res.status(201).send({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Error creating category",
      error,
    });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { name, brandName, sizeType } = req.fields || {};
    const { image } = req.files || {};

    const category = await CategoryModel.findById(req.params.id);

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    category.name = name;
    category.brandName = brandName;
    category.sizeType = ["none", "dimensions", "apparel"].includes(sizeType)
      ? sizeType
      : "none";
    category.slug = slugify(name);

    if (image) {
      category.image.data = fs.readFileSync(image.path);
      category.image.contentType = image.type;
    }

    await category.save();

    res.status(200).send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating category",
      error,
    });
  }
};

export const categorController = async (req, res) => {
  try {
    const category = await CategoryModel.find({})
      .select("-image")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};

export const singleCategorController = async (req, res) => {
  try {
    const category = await CategoryModel.findOne({
      slug: req.params.slug,
    }).select("-image");

    res.status(200).send({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};

export const categoryPhotoController = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.id).select(
      "image",
    );

    if (category?.image?.data) {
      res.set("Content-Type", category.image.contentType);

      res.set("Cache-Control", "no-store");

      return res.send(category.image.data);
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};
export const deleteCategoryController = async (req, res) => {
  try {
    await CategoryModel.findByIdAndDelete(req.params.id);

    res.status(200).send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
};
