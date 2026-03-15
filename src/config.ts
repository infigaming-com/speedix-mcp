const DEFAULT_API_BASE_URL = "https://apiport.xyz";

export interface Config {
  apiBaseUrl: string;
  origin?: string;
  email?: string;
  password?: string;
  totpSecret?: string;
}

export function loadConfig(): Config {
  const apiBaseUrl = (
    process.env.MEEPO_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");

  // Enforce HTTPS for non-localhost URLs to prevent credential leakage
  if (
    !apiBaseUrl.startsWith("https://") &&
    !apiBaseUrl.includes("localhost") &&
    !apiBaseUrl.includes("127.0.0.1")
  ) {
    throw new Error(
      "MEEPO_API_BASE_URL must use HTTPS. Only localhost is exempt."
    );
  }

  return {
    apiBaseUrl,
    origin: process.env.MEEPO_ORIGIN || "https://bo.speedixadm.com",
    email: process.env.MEEPO_EMAIL || undefined,
    password: process.env.MEEPO_PASSWORD || undefined,
    totpSecret: process.env.MEEPO_TOTP_SECRET || undefined,
  };
}
