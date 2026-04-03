import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getSession,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  setStoredToken,
  signup as signupRequest
} from "../lib/api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  finishOnboarding: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((sessionUser) => setUser(sessionUser))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => {
        const sessionUser = await loginRequest({ email, password });
        setUser(sessionUser);
      },
      signup: async (name, email, password) => {
        const sessionUser = await signupRequest({ name, email, password });
        setUser(sessionUser);
      },
      googleLogin: async (credential) => {
        const sessionUser = await googleLoginRequest(credential);
        setUser(sessionUser);
      },
      logout: () => {
        setStoredToken(null);
        setUser(null);
      },
      finishOnboarding: () => {
        setUser((current) =>
          current
            ? { ...current, isNewUser: false, hasCompletedOnboarding: true }
            : current
        );
      }
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
