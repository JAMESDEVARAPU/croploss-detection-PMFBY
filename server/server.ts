import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // ✅ import cors
import { storage } from "./storage";

const app = express();

// ✅ enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // your React app URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());

// ----- USERS -----
app.get("/api/users", async (req, res) => {
  const users = await storage.getAllUsers ? await storage.getAllUsers() : [];
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await storage.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/users", async (req, res) => {
  const newUser = await storage.createUser(req.body);
  res.json(newUser);
});

// ----- CROP ANALYSES -----
app.get("/api/crop-analyses", async (req, res) => {
  res.json(await storage.getAllCropAnalyses ? await storage.getAllCropAnalyses() : []);
});

app.get("/api/crop-analyses/user/:userId", async (req, res) => {
  const analyses = await storage.getCropAnalysesByUser(req.params.userId);
  res.json(analyses);
});

app.post("/api/crop-analyses", async (req, res) => {
  const newAnalysis = await storage.createCropAnalysis(req.body);
  res.json(newAnalysis);
});

// ----- PMFBY RULES -----
app.get("/api/pmfby-rules", async (req, res) => {
  const rules = await storage.getAllPMFBYRules();
  res.json(rules);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
