// GALYON Localhost Preview Server (Google AI Studio Render Viewer)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS universal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/' || cleanUrl === '') cleanUrl = '/index.html';
  if (cleanUrl === '/hub') cleanUrl = '/hub.html';
  if (cleanUrl === '/classic' || cleanUrl === '/estatico') cleanUrl = '/index.static.html';

  let filePath = path.join(__dirname, cleanUrl);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Seguridad básica: evitar path traversal
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    return res.end('Acceso denegado');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Si no existe, revisar si está en public/ o assets/
    const altPath = path.join(__dirname, 'public', cleanUrl);
    if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
      filePath = altPath;
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>404 — Archivo no encontrado</h2>
          <p>No se encontró: <code>${cleanUrl}</code></p>
          <p><a href="/">Ir al Render de Google AI Studio</a> | <a href="/hub">Ir al Studio Hub</a></p>
        </div>
      `);
    }
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Soporte para streaming de video (HTTP 206 Partial Content) para video crossfade
  if (ext === '.mp4') {
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      return file.pipe(res);
    }
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` 🚀 GALYON Localhost Server Activo`);
  console.log(` 🔗 Render Google AI Studio: http://localhost:${PORT}/`);
  console.log(` 🎛️  Studio Hub Comparador:  http://localhost:${PORT}/hub`);
  console.log(` 📦 Versión Previa Estática: http://localhost:${PORT}/classic`);
  console.log(`======================================================\n`);
});
