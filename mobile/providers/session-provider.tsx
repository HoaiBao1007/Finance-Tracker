import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const SESSION_KEY = 'finance-tracker.mobile.session-token';
const LEGACY_DEMO_SESSION_TOKEN = 'demo-mobile-session';

type SessionContextValue = {
  isLoading: boolean;
  sessionToken: string | null;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_KEY);
        const normalizedToken = storedToken === LEGACY_DEMO_SESSION_TOKEN ? null : storedToken;

        if (storedToken === LEGACY_DEMO_SESSION_TOKEN) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }

        if (mounted) {
          setSessionToken(normalizedToken);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(accessToken: string) {
    await SecureStore.setItemAsync(SESSION_KEY, accessToken);
    setSessionToken(accessToken);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSessionToken(null);
  }

  return (
    <SessionContext.Provider value={{ isLoading, sessionToken, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}