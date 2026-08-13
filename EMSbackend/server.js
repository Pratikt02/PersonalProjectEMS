import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import http from "http";
import dns from 'dns';
dns.setServers(["1.1.1.1","8.8.8.8"]);

// ROUTES
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import dashboardRoute from "./routes/dashboardRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import taskRoutes from "./routes/tasks.Routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import employeeDocumentRoutes from "./routes/documentRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import messengerRoutes from "./routes/messengerRoutes.js";

// CONTROLLER
import { autoPunchOutCron } from "./controllers/attendanceController.js";


// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ================= RENDER =================
app.set("trust proxy", 1);

// ================= CORS =================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "https://ems.wordlanetech.com",
  "https://wordlanetech.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// ✅ Node 22 SAFE preflight handler
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ================= MIDDLEWARE =================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================

app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/projects", projectRoutes);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", employeeDocumentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/messenger", messengerRoutes);

// ================= CRON =================

cron.schedule(
  "0 19 * * *",
  () => {
    console.log("⏰ Auto Punch Out Running...");
    autoPunchOutCron();
  },
  { timezone: "Asia/Kolkata" }
);

// ================= HEALTH =================

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ================= ERROR =================

app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS blocked",
      origin: req.headers.origin
    });
  }

  res.status(500).json({ message: "Server error" });
});

// ================= 404 =================

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= DB =================

if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo Connected"))
  .catch((err) => console.log(err));

// ================= START =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});