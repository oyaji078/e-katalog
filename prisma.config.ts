import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` only reads the schema -- it never opens a connection -- but
// prisma/config's env() throws PrismaConfigEnvError when DATABASE_URL is unset.
// That broke `npm run build` on hosts that expose env vars to the running app
// but not to the build step. Pass the datasource through only when the variable
// is actually present, so generate succeeds during a build while migrate
// commands still fail loudly instead of silently targeting the wrong database.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
