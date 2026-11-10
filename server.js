import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.disable("x-powered-by");

app.get("/healthz", (req, res) => res.json({ ok: true }));

// Faqat /public papka ochiq. .env, server.js va boshqa fayllar tashqariga chiqmaydi.
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`36 School server: http://localhost:${PORT}`);
});
