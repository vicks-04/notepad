import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const STORAGE_KEY = "cloud-notepad-auth";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setBootstrapping(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed?.token && parsed?.user) {
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setBootstrapping(false);
    }
  }, []);

  const persistSession = (session) => {
    setToken(session.token);
    setUser(session.user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const clearSession = () => {
    setToken("");
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const register = async (payload) => {
    const response = await api.auth.register(payload);
    persistSession(response);
    return response;
  };

  const login = async (payload) => {
    const response = await api.auth.login(payload);
    persistSession(response);
    return response;
  };

  const logout = () => {
    clearSession();
  };

  const refreshUser = async () => {
    if (!token) return null;

    const response = await api.auth.me(token);
    const nextUser = response.user;
    setUser(nextUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    return nextUser;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      bootstrapping,
      register,
      login,
      logout,
      refreshUser
    }),
    [token, user, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

