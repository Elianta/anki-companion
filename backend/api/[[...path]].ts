import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import { buildAppFromEnv } from '../src/app-factory.js';

// Build the Express app once for all invocations.
const app = buildAppFromEnv();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
