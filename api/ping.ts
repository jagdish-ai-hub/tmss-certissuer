// Minimal probe: no imports at all. If this fails, the problem is the function
// runtime/module format, not the application code.
export default function handler(req: any, res: any) {
  res.status(200).json({
    pong: true,
    node: process.version,
    hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN)
  });
}
