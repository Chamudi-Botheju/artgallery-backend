// routes/reports.js
const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Get sales report for an artist
router.get("/artist/:artist_id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total_orders,
              SUM(CASE WHEN status='accepted' THEN price ELSE 0 END) AS total_revenue,
              SUM(CASE WHEN type='custom' THEN 1 ELSE 0 END) AS custom_orders
       FROM orders WHERE artist_id = ?`,
      [req.params.artist_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
