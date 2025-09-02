// routes/orders.js
const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Place direct order
router.post("/order", authenticateToken, async (req, res) => {
  const { artwork_id, price, custom_note } = req.body;
  const collector_id = req.user.id;

  try {
    const [artworkRows] = await pool.query("SELECT * FROM artworks WHERE id = ?", [artwork_id]);
    if (!artworkRows.length) return res.status(404).json({ message: "Artwork not found" });
    const artwork = artworkRows[0];

    // Insert order
    await pool.query(
      "INSERT INTO orders (artwork_id, collector_id, artist_id, price, type, custom_note) VALUES (?, ?, ?, ?, 'direct', ?)",
      [artwork_id, collector_id, artwork.artist_id, price, custom_note || null]
    );

    // Update artwork status
    await pool.query("UPDATE artworks SET status = 'sold' WHERE id = ?", [artwork_id]);

    res.json({ message: "Order placed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error placing order" });
  }
});

// Place a bid
router.post("/bid", authenticateToken, async (req, res) => {
  const { artwork_id, amount } = req.body;
  const collector_id = req.user.id;

  try {
    const [artworkRows] = await pool.query(
      "SELECT * FROM artworks WHERE id = ? AND status = 'available'",
      [artwork_id]
    );
    if (!artworkRows.length) return res.status(404).json({ message: "Artwork not available" });

    await pool.query(
      "INSERT INTO bids (artwork_id, collector_id, amount) VALUES (?, ?, ?)",
      [artwork_id, collector_id, amount]
    );

    res.json({ message: "Bid placed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error placing bid" });
  }
});

// Get highest bid for artwork
router.get("/highest/:artwork_id", async (req, res) => {
  const { artwork_id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT MAX(amount) AS highest_bid FROM bids WHERE artwork_id = ?",
      [artwork_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching highest bid" });
  }
});

// Get artist orders
router.get("/artist-orders", authenticateToken, async (req, res) => {
  if (req.user.role !== "artist") return res.status(403).json({ message: "Forbidden" });

  try {
    const [orders] = await pool.query(
      `SELECT o.*, a.title AS artwork_title, u.full_name AS collector_name 
       FROM orders o 
       JOIN artworks a ON o.artwork_id = a.id 
       JOIN users u ON o.collector_id = u.id 
       WHERE o.artist_id = ?`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

module.exports = router;
