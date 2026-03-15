export interface Config {
  apiBaseUrl: string;
  origin?: string;
  email?: string;
  password?: string;
  totpSecret?: string;
}

export function loadConfig(): Config {
  const apiBaseUrl = process.env.MEEPO_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("MEEPO_API_BASE_URL is required");
  }

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
    origin: process.env.MEEPO_ORIGIN || undefined,
    email: process.env.MEEPO_EMAIL || undefined,
    password: process.env.MEEPO_PASSWORD || undefined,
    totpSecret: process.env.MEEPO_TOTP_SECRET || undefined,
  };
}
