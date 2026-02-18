import { buildApp } from "./app";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = buildApp();

app.listen({ port, host }).catch((err) => {
  console.error(err);
  process.exit(1);
});

console.log(`✅ API running at http://localhost:${port}`);
