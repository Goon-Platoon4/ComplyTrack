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
    Boolean(sessionStorage.getItem("complytrack_access_token")),
  );

  const signOut = useCallback(async () => {
    try {
      if (sessionStorage.getItem("complytrack_access_token"))
        await api.post("/auth/logout");
    } catch {
      /* Always clear local state even if the API is unavailable. */
    }
    sessionStorage.removeItem("complytrack_access_token");
    setUser(null);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    if (data.token)
      sessionStorage.setItem("complytrack_access_token", data.token);
    const nextUser = presentUser(data.user);
    setUser(nextUser);
    return nextUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = sessionStorage.getItem("complytrack_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(presentUser(data.user));
    } catch {
      sessionStorage.removeItem("complytrack_access_token");
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
      sessionStorage.removeItem("complytrack_access_token");
      setUser(null);
    };
    window.addEventListener("complytrack:session-expired", onExpired);
    return () =>
      window.removeEventListener("complytrack:session-expired", onExpired);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser, setUser }),
    [user, loading, signIn, signOut, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
