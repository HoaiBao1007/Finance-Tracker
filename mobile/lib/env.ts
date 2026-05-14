import { Platform } from 'react-native';

const defaultApiBaseUrl = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || defaultApiBaseUrl || 'http://localhost:4000/api/v1',
};