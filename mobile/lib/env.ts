import { Platform } from 'react-native';

const productionApiBaseUrl = 'https://api-production-9dae.up.railway.app/api/v1';

const developmentApiBaseUrl =
  Platform.select({
    android: 'http://10.0.2.2:4000/api/v1',
    default: 'http://localhost:4000/api/v1',
  }) || 'http://localhost:4000/api/v1';

const fallbackApiBaseUrl = __DEV__ ? developmentApiBaseUrl : productionApiBaseUrl;

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || fallbackApiBaseUrl,
};