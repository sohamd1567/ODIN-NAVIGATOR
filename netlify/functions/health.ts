import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { 
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type"
    },
    body: JSON.stringify({ 
      ok: true, 
      ts: new Date().toISOString(),
      service: "ODIN Navigator Health Check",
      status: "operational"
    })
  };
};
