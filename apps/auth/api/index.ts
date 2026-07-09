import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createNestApp } from '../src/main';

const server = express();
let initialized = false;

async function bootstrapServer() {
  if (!initialized) {
    const app = await createNestApp(new ExpressAdapter(server));
    await app.init();
    initialized = true;
  }
  return server;
}

export default async (req: any, res: any) => {
  const server = await bootstrapServer();
  server(req, res);
};