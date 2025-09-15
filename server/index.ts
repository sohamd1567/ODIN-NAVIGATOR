import { createApp } from "./app";

// Export the Express app for Vercel's Node runtime
export default async function handler(req: any, res: any) {
  const { app } = await createApp();
  return app(req, res);
}
