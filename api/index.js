import buildApp from '../server/app.js';

const app = await buildApp();
await app.ready();

export default function handler(req, res) {
  app.server.emit('request', req, res);
}
