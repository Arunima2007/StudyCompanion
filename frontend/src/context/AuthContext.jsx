import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { completeTour, getMe, googleLogin, logout as logoutRequest } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((sessionUser) => setUser(sessionUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle: async (credential) => {
        const data = await googleLogin(credential);
        setUser(data.user);
        return data;
      },
      logout: async () => {
        await logoutRequest();
        setUser(null);
      },
      finishTour: async () => {
        const nextUser = await completeTour();
        setUser(nextUser);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
