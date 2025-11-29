// API removed: previously forwarded to the Fastify backend under `vercel/api`.
// The backend directory was removed from the repository; keep a minimal handler
// so Vercel builds don't try to include deleted files. This returns 410 Gone.

export default async function handler(req, res) {
  res.statusCode = 410;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'API removed from this deployment' }));
}
