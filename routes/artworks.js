const express = require("express");
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Ensure uploads folder exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload artwork
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "artist") {
      return res.status(403).json({ message: "Only artists can upload paintings" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const { title, description, price } = req.body;
    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const [result] = await pool.query(
      "INSERT INTO artworks (artist_id, title, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, 'available')",
      [req.user.id, title, description, price, imageUrl]
    );

    res.status(201).json({
      message: "Artwork uploaded successfully",
      artworkId: result.insertId,
      imageUrl,
    });
  } catch (err) {
    console.error("Upload Artwork Error:", err);
    res.status(500).json({ message: "Error uploading artwork" });
  }
});

// Get all artworks
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM artworks WHERE status = 'available'");
    res.json(rows);
  } catch (err) {
    console.error("Fetch Artworks Error:", err);
    res.status(500).json({ message: "Error fetching artworks" });
  }
});

// Get artwork details by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT a.*, u.full_name as artist_name FROM artworks a JOIN users u ON a.artist_id = u.id WHERE a.id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    // Fetch highest bid (if auction type)
    const [bids] = await pool.query(
      "SELECT MAX(amount) as highest_bid FROM bids WHERE artwork_id = ?",
      [id]
    );

    res.json({
      ...rows[0],
      highest_bid: bids[0].highest_bid || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
