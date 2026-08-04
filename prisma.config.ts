import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local and .env
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
