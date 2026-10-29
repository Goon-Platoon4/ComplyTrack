import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = "complytrack_access_token";

function presentUser(user) {
  const name =
    user?.fullName || user?.name || user?.email || "ComplyTrack user";

  return {
    ...user,
    name,
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY)),
  );

  const signOut = useCallback(async () => {
    try {
      if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
        await api.post("/auth/logout");
      }
    } catch {
      // Always clear local state even if the API is unavailable.
    }

    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setUser(null);
  }, []);

  const signIn = useCallback(async (credentials) => {
    // Do not retain a previous session while starting a new login.
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setUser(null);

    const { data } = await api.post("/auth/login", credentials);

    // An MFA challenge is not an authenticated session.
    if (data.mfaRequired) {
      if (!data.challengeToken) {
        throw new Error(
          "The server requested MFA but did not provide a verification challenge.",
        );
      }

      return {
        mfaRequired: true,
        challengeToken: data.challengeToken,
        email: data.user?.email || credentials.email,
        expiresIn: data.expiresIn,
      };
    }

    if (!data.token || !data.user) {
      throw new Error("The server did not return a valid login session.");
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.token);

    const nextUser = presentUser(data.user);
    setUser(nextUser);

    return nextUser;
  }, []);

  const verifyMfaLogin = useCallback(async ({ challengeToken, code }) => {
    const { data } = await api.post("/auth/mfa/verify-login", {
      challengeToken,
      code,
    });

    if (!data.token || !data.user) {
      throw new Error(
        "MFA verification succeeded without returning a valid session.",
      );
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.token);

    const nextUser = presentUser(data.user);
    setUser(nextUser);

    return nextUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser(presentUser(data.user));
    } catch {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      setUser(null);
    };

    window.addEventListener("complytrack:session-expired", onExpired);

    return () =>
      window.removeEventListener("complytrack:session-expired", onExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      verifyMfaLogin,
      signOut,
      refreshUser,
      setUser,
    }),
    [user, loading, signIn, verifyMfaLogin, signOut, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}