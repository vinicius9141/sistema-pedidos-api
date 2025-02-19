import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes.js';

const fastify = Fastify({ logger: true });

// habilita CORS
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
});

// registra as rotas
fastify.register(routes);


const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Servidor rodando em http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
