import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl || '');
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
  const b64 = m[3];
  return { mime, ext, b64 };
}

export async function uploadImage(req, res) {
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ message: 'Missing data' });
  const parsed = parseDataUrl(data);
  if (!parsed) return res.status(400).json({ message: 'Invalid image data' });
  const buf = Buffer.from(parsed.b64, 'base64');
  if (buf.length > 4 * 1024 * 1024) return res.status(400).json({ message: 'Image too large (max 4MB)' });
  ensureDir();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`;
  const filePath = path.join(uploadDir, name);
  await fs.promises.writeFile(filePath, buf);
  const url = `/uploads/${name}`;
  res.status(201).json({ url });
}

