import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { markHomeTourPending } from "../components/HomeTour";
import {
  getProfile,
  loginUser,
  resendRegistrationCode,
  startRegistration,
  updateProfile,
  verifyRegistration,
} from "../services/api";
import type { ProfileUpdate, RegisterPayload, User, VerificationStarted } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  startRegister: (payload: RegisterPayload) => Promise<VerificationStarted>;
  completeRegister: (email: string, code: string, password: string) => Promise<void>;
  resendRegisterCode: (email: string) => Promise<VerificationStarted>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserProfile: (payload: ProfileUpdate) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "internroute_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const currentUser = await getProfile(token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      const currentUser = await getProfile(response.access_token);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      setToken(response.access_token);
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    const currentUser = await getProfile(token);
    setUser(currentUser);
  }, [token]);

  const updateUserProfile = useCallback(
    async (payload: ProfileUpdate) => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const updated = await updateProfile(token, payload);
      setUser(updated);
      return updated;
    },
    [token],
  );

  const startRegister = useCallback(async (payload: RegisterPayload) => {
    return startRegistration(payload);
  }, []);

  const completeRegister = useCallback(
    async (email: string, code: string, password: string) => {
      await verifyRegistration({ email, code });
      markHomeTourPending();
      await login(email, password);
    },
    [login],
  );

  const resendRegisterCode = useCallback(async (email: string) => {
    return resendRegistrationCode(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      startRegister,
      completeRegister,
      resendRegisterCode,
      logout,
      refreshUser,
      updateUserProfile,
    }),
    [
      user,
      token,
      loading,
      login,
      startRegister,
      completeRegister,
      resendRegisterCode,
      logout,
      refreshUser,
      updateUserProfile,
    ],
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
