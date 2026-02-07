const express = require("express");
require("dotenv").config({ path: ".env.local" });

const usernameRoutes = require("./routes/username");

const app = express();

// Parse JSON bodies
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "backend running" });
});

// API routes
app.use("/api", usernameRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});
