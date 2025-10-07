import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import doctorRecommendationRoutes from "./routes/doctorRecommendationRoutes.js";
import dialogflowRoutes from "./routes/dialogflowRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";
import Product from "./models/Product.js";
import { sendReorderEmail } from "./utils/mailer.js";

dotenv.config(); // Load .env first

const app = express();
const PORT = process.env.PORT || 5001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
// Relax CORS to avoid Failed to fetch from different dev hosts
app.use(cors());
app.use(rateLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint to verify file serving
app.get('/test-uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ message: 'Uploads directory accessible', files });
  } catch (error) {
    res.json({ error: error.message, uploadsDir });
  }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/doctor-recommendations", doctorRecommendationRoutes);
app.use("/api/dialogflow", dialogflowRoutes);

// Connect DB and start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  // Lightweight periodic low-stock check (every 30 minutes)
  setInterval(async () => {
    try {
      const candidates = await Product.find({ reorderLevel: { $gt: 0 } })
      const eligible = candidates.filter(p => (p.stock ?? 0) <= (p.reorderLevel ?? 0))
      const groups = new Map()
      for (const p of eligible) {
        const key = (p.supplierEmail || '').trim().toLowerCase()
        if (!key) continue
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(p)
      }
      for (const [email, products] of groups.entries()) {
        await sendReorderEmail(email, {
          items: products.map(p => ({ name: p.name, stock: p.stock, reorderLevel: p.reorderLevel, packSize: p.packSize }))
        })
      }
      if (eligible.length > 0) console.info(`[reorder] Notified ${groups.size} suppliers for ${eligible.length} low-stock products`)
    } catch (err) {
      console.error('[reorder] periodic check failed:', err.message)
    }
  }, 30 * 60 * 1000)
});
