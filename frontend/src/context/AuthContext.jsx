import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    name: "Thandi Nkosi",
    role: "Compliance Officer",
    initials: "TN",
  });

  const value = useMemo(() => ({
    user,
    signOut: () => setUser(null),
    signInDemo: () => setUser({ name: "Thandi Nkosi", role: "Compliance Officer", initials: "TN" }),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
