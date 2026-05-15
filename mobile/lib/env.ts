const productionApiBaseUrl = 'https://api-production-9dae.up.railway.app/api/v1';

export const env = {
  // Always default to production API so real devices do not accidentally target localhost.
  // Use EXPO_PUBLIC_API_BASE_URL to opt in to local emulator endpoints during development.
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    productionApiBaseUrl,
};