import SiteSetting from "../models/SiteSettingModel.js";

const getSiteSetting = async () => {
  let setting = await SiteSetting.findOne();

  if (!setting) {
    setting = await SiteSetting.create({});
  }

  return setting;
};

export const getWhatsAppNumber = async (req, res) => {
  try {
    const setting = await getSiteSetting();

    res.status(200).send({
      success: true,
      whatsappNumber: setting.whatsappNumber,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error loading WhatsApp number",
    });
  }
};

export const saveWhatsAppNumber = async (req, res) => {
  try {
    const whatsappNumber = String(req.body.whatsappNumber || "").replace(/\D/g, "");

    if (!whatsappNumber) {
      return res.status(400).send({
        success: false,
        message: "WhatsApp number is required",
      });
    }

    const setting = await SiteSetting.findOneAndUpdate(
      {},
      { whatsappNumber },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).send({
      success: true,
      message: "WhatsApp number updated",
      whatsappNumber: setting.whatsappNumber,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error saving WhatsApp number",
    });
  }
};
