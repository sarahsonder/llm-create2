import express from "express";
import cors from "cors";
import llmRoutes from "./routes/llmAPI";
import firebaseRoutes from "./routes/firebaseAPI";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ===== API ROUTES =====
app.use("/api/llm", llmRoutes);
app.use("/api/firebase", firebaseRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
