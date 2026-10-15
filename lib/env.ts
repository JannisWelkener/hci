/**
 * Environment variable utilities
 * - Server-side: Runtime env vars (Docker-friendly)
 * - Client-side: Direct access for Next.js inlining
 */

/**
 * Detects if we're in a Docker build context (server-side, no env vars)
 */
function isServerBuildContext(): boolean {
  if (typeof window !== "undefined") return false;

  const hasAnyEnvVars = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.OPENAI_API_KEY
  );

  return !hasAnyEnvVars;
}

// only used in the old get api key so probably can be deleted too
/**
 * Server-side env getter with fallback for Docker builds
 */
function getServerEnv(key: string, fallback: string): string {
  const value = process.env[key];

  // Return the value if it exists and is not empty
  if (value && value.trim()) {
    return value.trim();
  }

  // In production/Docker, log warning but allow fallback
  if (process.env.NODE_ENV === "production") {
    console.warn(`Missing environment variable: ${key}, using fallback`);
    return fallback;
  }

  // In development, throw error to alert developer
  throw new Error(
    `Missing environment variable: ${key}\n` +
      `- For local dev: Add to .env.local\n` +
      `- For Docker: Pass via docker run -e ${key}=...`,
  );
}

/**
 * Gets Supabase URL
 * Uses direct access for Next.js to inline in browser
 */
export function getSupabaseUrl(): string {
  // Browser: Direct access for Next.js inlining
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // Remove any whitespace/newlines that may have been introduced during Docker build
  return url.replace(/\s/g, "");
}

/**
 * Gets Supabase Anonymous Key
 * Uses direct access for Next.js to inline in browser
 */
export function getSupabaseAnonKey(): string {
  // Browser: Direct access for Next.js inlining
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  // Remove any whitespace/newlines that may have been introduced during Docker build
  // JWT tokens must be continuous strings without any whitespace
  return key.replace(/\s/g, "");
}

// Probably not being used anymore
/**
 * Gets OpenAI API Key (server-side only)
 */
export function getOpenAIKey(): string {
  /*if (typeof window !== "undefined") {
    throw new Error("OPENAI_API_KEY should not be accessed in browser!");
  }*/

  const key = getServerEnv("OPENAI_API_KEY", "sk-placeholder-key");
  // Remove any whitespace/newlines that may have been introduced
  // API keys must be continuous strings without any whitespace
  return key.replace(/\s/g, "");
}

/**
 * Gets API Key Encryption Secret (server-side only)
 * Used for encrypting user API keys stored in database
 */
export function getEncryptionSecret(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET should not be accessed in browser!",
    );
  }

  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET is not set.\n" +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return secret;
}
