// TEMPORARY diagnostics endpoint.
//
// The serverless function dies at import time, so nothing inside server.ts gets
// a chance to report why. This handler imports each dependency one at a time
// inside try/catch and returns the exact error for whichever one fails.
//
// Remove this file once the deployment is healthy.

export default async function handler(_req: any, res: any) {
  const results: any[] = [];

  const check = async (label: string, fn: () => Promise<any>) => {
    try {
      const info = await fn();
      results.push({ label, ok: true, info });
    } catch (e: any) {
      results.push({
        label,
        ok: false,
        name: e?.name,
        code: e?.code,
        message: String(e?.message ?? e).slice(0, 700)
      });
    }
  };

  await check("node", async () => process.version);
  await check("express", async () => typeof (await import("express")).default);
  await check("@libsql/client", async () => Object.keys(await import("@libsql/client")));
  await check("@libsql/client/web", async () => Object.keys(await import("@libsql/client/web")));
  await check("@vercel/blob/client", async () => Object.keys(await import("@vercel/blob/client")));
  await check("../server", async () => {
    const mod: any = await import("../server");
    return typeof mod?.default === "function" ? "loaded, default is a function" : "loaded, unexpected default";
  });

  res.status(200).json({
    env: {
      vercel: Boolean(process.env.VERCEL),
      nodeEnv: process.env.NODE_ENV,
      hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
      hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    },
    results
  });
}
