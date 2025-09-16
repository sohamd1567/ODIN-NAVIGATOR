import { createApp } from "./app";

// Vercel serverless handler - exports the Express app without calling listen()
export default await createApp();
