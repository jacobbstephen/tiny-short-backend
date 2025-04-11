const express = require("express");
const router = express.Router();
const useragent = require("useragent");
const axios = require("axios");
const QRCode = require("qrcode");

// Dynamic import for nanoid
let nanoid;
(async () => {
  nanoid = (await import("nanoid")).nanoid;
})();

const urlModel = require("../models/URL");
const authMiddleware = require("../middleware/auth");

router.get("/getUrlDetails", authMiddleware, async (req, res) => {
  try {
    const urlDetails = await urlModel.find({
      userId: req.user.userId,
    });

    if (urlDetails.length === 0) {
      return res.status(202).json({
        message: "No URLS Found",
      });
    }
    return res.status(200).json({
      urlDetails,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.post("/shorten", authMiddleware, async (req, res) => {
  try {
    
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({
        message: "Url in body is not present",
      });
    }

    const existingURL = await urlModel.findOne({
      redirectURL: originalUrl,
      userId: req.user.userId,
    });
    if (existingURL) {
      return res.status(200).json({
        shortUrl: `https://tiny-short-backend-production.up.railway.app/url/${existingURL.shortId}`,
      });
    }

    // Generate QR as buffer
    const qrBuffer = await QRCode.toBuffer(originalUrl);

    const shortCode = nanoid(8);

    await urlModel.create({
      redirectURL: originalUrl,
      userId: req.user.userId,
      shortId: shortCode,
      qrCode: qrBuffer,
    });

    const qrCodeBase64 = qrBuffer.toString("base64");

    return res.status(200).json({
      shortUrl: `https://tiny-short-backend-production.up.railway.app/url/${shortCode}`,
      qrCode: `data:image/png;base64,${qrCodeBase64}`,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    const urlEntry = await urlModel.findOne({
      shortId,
    });

    if (!urlEntry) {
      return res.status(404).json({
        message: "Url is not found",
      });
    }
    const ipapiResponse = await axios.get("https://ipapi.co/json");

    const locationData = ipapiResponse.data;
    const country = locationData.country_name || "Unknown";
    const region = locationData.region || "Unknown";
    const city = locationData.city || "Unknown";

    const agent = useragent.parse(req.headers["user-agent"]);
    const deviceType = agent.isMobile ? "Mobile" : "Desktop";
    urlEntry.clickCount += 1;
    urlEntry.clickTimeStamps.push({
      timestamp: new Date(),
      device: deviceType,
      location: {
        country,
        region,
        city,
      },
    });

    await urlEntry.save();
    return res.redirect(urlEntry.redirectURL);
  } catch (err) {
    console.log("Error: ", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/analytics/:shortId", authMiddleware, async (req, res) => {
  try {
    const { shortId } = req.params;
    if (!shortId) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }
    const urlDetails = await urlModel.findOne({
      shortId,
      userId: req.user.userId,
    });

    if (!urlDetails) {
      return res.status(404).json({
        message: "Analytics not Found",
      });
    }

    return res.status(200).json({
      timestamp: urlDetails.clickTimeStamps,
      clickCount: urlDetails.clickCount,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
router.get("/qr/:shortId", authMiddleware, async (req, res) => {
  try {

    const { shortId } = req.params;
    if (!shortId) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }
    const urlDetails = await urlModel.findOne({
      shortId,
      userId: req.user.userId,
    });

    if (!urlDetails) {
      return res.status(404).json({
        message: "QR code not Found",
      });
    }
    const qrCodeBase64 = urlDetails.qrCode.toString("base64")

    


    return res.status(200).json({
      qr: `data:image/png;base64,${qrCodeBase64}`,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
