import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import { getCorsOriginValidator } from './cors.js';

const buildApp = async () => {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: getCorsOriginValidator(),
    credentials: true
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
    sign: { expiresIn: '48h' }
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Non autorisé.' });
    }
  });

  fastify.get('/health', { logLevel: 'silent' }, async () => ({ status: 'ok' }));
  fastify.get('/api/health', async () => ({ status: 'ok' }));
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(gameRoutes, { prefix: '/api' });

  return fastify;
};

export default buildApp;
