import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-static routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server on localhost only
app.listen(PORT, HOST, () => {
  console.log(`✅ BlackBow Frontend server running on http://${HOST}:${PORT}`);
  console.log(`🔒 Security: Bound to localhost only`);
});
