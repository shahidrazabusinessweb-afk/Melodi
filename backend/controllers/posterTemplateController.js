import PosterTemplate from "../models/PosterTemplateModel.js";
import cloudinary from "../config/cloudinary.js";

export const uploadPosterTemplate = async (req, res) => {
  try {
    const name = req.fields?.name?.trim();
    const image = req.files?.image;

    if (!name || !image) {
      return res.status(400).send({
        success: false,
        message: "Template name and image are required",
      });
    }

    const result = await cloudinary.uploader.upload(image.path, {
      folder: "poster-templates",
    });

    const template = await PosterTemplate.create({
      name,
      image: result.secure_url,
      cloudinary_id: result.public_id,
    });

    res.status(201).send({
      success: true,
      message: "Poster template uploaded successfully",
      template,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Template upload failed" });
  }
};

export const getPosterTemplates = async (req, res) => {
  try {
    const templates = await PosterTemplate.find({}).sort({ createdAt: -1 });
    res.status(200).send({ success: true, templates });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Unable to load templates" });
  }
};

export const deletePosterTemplate = async (req, res) => {
  try {
    const template = await PosterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).send({ success: false, message: "Template not found" });
    }

    await cloudinary.uploader.destroy(template.cloudinary_id);
    await PosterTemplate.findByIdAndDelete(req.params.id);

    res.status(200).send({ success: true, message: "Poster template deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Unable to delete template" });
  }
};