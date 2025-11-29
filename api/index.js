// Vercel Serverless Function Entry Point
// This file re-exports the Fastify app from vercel/api

import createApp from '../vercel/api/lib/fastify-app.js';

// Create the Fastify app
let app;

const getApp = async () => {
  if (!app) {
    app = await createApp();
    await app.ready();
  }
  return app;
};

// Export handler for Vercel serverless
export default async function handler(req, res) {
  const fastifyApp = await getApp();
  fastifyApp.server.emit('request', req, res);
}
