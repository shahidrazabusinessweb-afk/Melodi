import dotenv from "dotenv";
dotenv.config();

import express from "express";
import colors from "colors";
import morgan from "morgan";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs"; // Required to parse index.html template

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import bannerRoute from "./routes/bannerRoute.js";
import paymentConfigRoutes from "./routes/paymentConfigRoutes.js";
import couponRoute from "./routes/couponRoute.js";
import ProductModel from "./models/ProductModel.js";

const app = express();

// Enable gzip compression
app.use(compression());

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Routing
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/banner", bannerRoute);
app.use("/api/v1/admin", paymentConfigRoutes);
app.use("/api/v1/coupon", couponRoute);

// Static uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Helper mapping for dynamic location profiles
const getLocationMetadata = (locationName, siteUrl) => {
  const locations = {
    riyadh: {
      title: "Sweetie Ayman - Riyadh Boutique",
      description:
        "Modern luxury bags curated specifically for Riyadh. Fast regional shipping.",
      logo: `${siteUrl}/uploads/logos/riyadh-logo.png`,
    },
    dubai: {
      title: "Sweetie Ayman - Dubai Handbags",
      description:
        "Chic luxury bags curated for Dubai. Seamless checkout and returns.",
      logo: `${siteUrl}/uploads/logos/dubai-logo.png`,
    },
  };

  return (
    locations[locationName.toLowerCase()] || {
      title: "Sweetie Ayman",
      description:
        "Modern bags, curated for everyday luxury. Fast delivery and easy returns.",
      logo: `${siteUrl}/ShopLogo1.png`,
    }
  );
};

const renderProductMetaHtml = (product, siteUrl, routeType = "product") => {
  const productImageUrl =
    product.photos?.[0]?.url || `${siteUrl}/default-product.png`;
  const shareUrl = `${siteUrl}/${routeType === "share" ? "share/product" : "product"}/${product.slug}`;
  const description = `${product.description || "Premium product"}`
    .replace(/\s+/g, " ")
    .trim();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${product.name}</title>
    <meta property="og:title" content="${product.name}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${productImageUrl}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${product.name}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${productImageUrl}" />
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${shareUrl}" />
  </head>
  <body>
    <h1>${product.name}</h1>
    <p>${description}</p>
    <img src="${productImageUrl}" alt="${product.name}" style="max-width: 400px;" />
  </body>
</html>`;
};

const sendNotFoundHtml = (res) => {
  res.status(404).type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Product not found</title>
  </head>
  <body>
    <h1>Product not found</h1>
  </body>
</html>`);
};

// --- DYNAMIC LOCATION ROUTE ---
app.get("/shop/:location", (req, res) => {
  try {
    const locationName = req.params.location;
    const siteUrl =
      process.env.CLIENT_URL ||
      process.env.APP_URL ||
      "https://sweetieayman.onrender.com";
    const meta = getLocationMetadata(locationName, siteUrl);

    // For Next.js: look in ../client/public/index.html or fallback to ../client/.next
    const templatePath = path.join(process.cwd(), "..", "client", "public", "index.html");

    fs.readFile(templatePath, "utf8", (err, htmlData) => {
      if (err) {
        console.error("Error reading index.html layout:", err);
        return res.status(500).send("Internal Template Error");
      }

      const customizedHtml = htmlData
        .replace(/__DYNAMIC_TITLE__/g, meta.title)
        .replace(/__DYNAMIC_DESC__/g, meta.description)
        .replace(/__DYNAMIC_LOGO__/g, meta.logo);

      res.status(200).type("html").send(customizedHtml);
    });
  } catch (error) {
    console.error("Location route failure", error);
    res.status(500).send("Internal Server Error");
  }
});

// Product Routing
app.get("/product/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const product = await ProductModel.findOne({
      slug: { $regex: new RegExp(`^${escapedSlug}$`, "i") },
    }).lean();

    if (!product) return sendNotFoundHtml(res);

    const siteUrl =
      process.env.CLIENT_URL ||
      process.env.APP_URL ||
      "https://sweetieayman.onrender.com";
    res.status(200).type("html").send(renderProductMetaHtml(product, siteUrl));
  } catch (error) {
    console.error("Product route error", error);
    res.status(500).type("html").send("Unable to load product");
  }
});

app.get("/share/product/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const product = await ProductModel.findOne({
      slug: { $regex: new RegExp(`^${escapedSlug}$`, "i") },
    }).lean();

    if (!product) return sendNotFoundHtml(res);

    const siteUrl =
      process.env.CLIENT_URL ||
      process.env.APP_URL ||
      "https://sweetieayman.onrender.com";
    res
      .status(200)
      .type("html")
      .send(renderProductMetaHtml(product, siteUrl, "share"));
  } catch (error) {
    console.error("Share route error", error);
    res.status(500).type("html").send("Unable to load product");
  }
});

// Serving remaining Next.js static client components
app.use(express.static(path.join(process.cwd(), "..", "client", "public")));

// Global fallback architecture - serve Next.js public folder
app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), "..", "client", "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`.bgCyan.black);
    });
  } catch (error) {
    console.error("Unable to start server: MongoDB connection failed", error);
    process.exit(1);
  }
};

startServer();
