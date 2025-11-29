import createApp from './lib/fastify-app.js';

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

// Export for local development
export { getApp };
