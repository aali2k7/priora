import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { initBetterAuthDb } from "./db-init";

// Programmatically ensure database schema tables exist before initializing Better Auth
initBetterAuthDb("./sqlite.db");

const db = new Database("./sqlite.db");

const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const isPlaceholderId = !googleClientId || googleClientId.includes("your-google-client-id");

if (isPlaceholderId) {
  console.warn(
    "\n⚠️ [Better Auth Warning]: GOOGLE_CLIENT_ID is set to a placeholder string or missing in .env.local.\n" +
    "To enable live Google OAuth sign-in, update .env.local with your real Google OAuth Client ID and Secret.\n" +
    "Required Authorized Redirect URI in Google Cloud Console:\n" +
    "  http://localhost:3000/api/auth/callback/google\n"
  );
}

export const auth = betterAuth({
  database: db,
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || "priora_executive_better_auth_secret_key_2026",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
