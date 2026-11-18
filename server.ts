// Local / Docker entry point.
//
// The application itself now lives in api/index.ts so that Vercel can load it
// as a self-contained serverless function. Vercel does not resolve relative
// imports that point outside the api/ directory at runtime, which is why the
// app used to crash there with ERR_MODULE_NOT_FOUND.
//
// Importing for side effects starts the HTTP listener (api/index.ts only calls
// app.listen() when process.env.VERCEL is unset).
import "./api/index";
