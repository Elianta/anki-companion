import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildAppFromEnv } from "../src/app.js";

const app = buildAppFromEnv();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}
