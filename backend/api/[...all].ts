import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildAppFromEnv } from "../src/app.js";

const app = buildAppFromEnv();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}
