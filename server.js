const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const artworkRoutes = require("./routes/artworks");
const orderRoutes = require("./routes/orders");
const reportRoutes = require("./routes/reports");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads folder so images can be accessed from frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
