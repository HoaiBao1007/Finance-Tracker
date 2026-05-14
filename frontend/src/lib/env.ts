const productionFallbackApiBaseUrl =
  "https://api-production-9dae.up.railway.app/api/v1";
const developmentFallbackApiBaseUrl = "http://localhost:4000/api/v1";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? productionFallbackApiBaseUrl
    : developmentFallbackApiBaseUrl)
).replace(/\/$/, "");

export const env = {
  apiBaseUrl,
};