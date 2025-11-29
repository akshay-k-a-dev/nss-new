// Local development server
import createApp from './lib/fastify-app.js';

const start = async () => {
  try {
    const app = await createApp();
    await app.listen({ port: 5000, host: '0.0.0.0' });
    console.log('🚀 NSS API Server running at http://localhost:5000');
    console.log('📚 API endpoints available at http://localhost:5000/api');
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET    /api/health');
    console.log('  GET    /api/programs');
    console.log('  GET    /api/students');
    console.log('  GET    /api/coordinators');
    console.log('  GET    /api/departments');
    console.log('  POST   /api/officers/login');
    console.log('');
    console.log('Default officer credentials: id="officer", password="officer123"');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
