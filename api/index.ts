// Vercel serverless entry point.
//
// Vercel routes every request matching the "/api/(.*)" rewrite in vercel.json
// to this function. The Express app (server.ts) already exposes all backend
// routes under /api/*, and it only calls app.listen() when process.env.VERCEL
// is unset, so importing it here is safe.
//
// The static frontend is served by Vercel's CDN from the `public/` build
// output; server.ts skips its own static/dev middleware when VERCEL is set.

import app from "../server";

export default app;
