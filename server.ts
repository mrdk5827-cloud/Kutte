import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/geminiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// API routes handled by FIXA Gemini handler
app.use('/api/fixa', (req, res) => {
  handleApiRequest(req, res).catch((err) => {
    console.error('API Error in production server:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

// Serve static frontend files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[FIXA CORE] Neural server active on port ${PORT}`);
});
