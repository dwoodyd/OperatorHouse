export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  publicUrl: process.env.PUBLIC_URL ?? "",
};

// Boot-time guard: PUBLIC_URL is required in production so that outgoing
// email links (e-sign, review request, team invite) resolve correctly.
if (ENV.isProduction && !ENV.publicUrl) {
  throw new Error(
    "[boot] PUBLIC_URL env var is required in production. " +
    "Set it to the canonical origin, e.g. https://operatorhouse.click"
  );
}
