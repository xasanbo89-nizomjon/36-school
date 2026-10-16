import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import api from "./lib/api-app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(api);

app.get("/healthz", (req, res) => res.redirect("/api/health"));

// Faqat /public papka ochiq. .env va boshqa fayllar tashqariga chiqmaydi.
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.listen(PORT, () => {
  console.log(`36 School server: http://localhost:${PORT}`);
});
