import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("complytrack_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Allow document uploads additional time for storage and malware scanning.
  if (String(config.url || "").includes("/documents/upload")) {
    config.timeout = 120000;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || "");

    const isLoginRequest = requestUrl.includes("/auth/login");
    const isMfaVerificationRequest = requestUrl.includes(
      "/auth/mfa/verify-login",
    );

    // MFA verification happens before an authenticated session exists.
    // Invalid codes must not trigger the general session-expired handler.
    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isMfaVerificationRequest
    ) {
      sessionStorage.removeItem("complytrack_access_token");
      window.dispatchEvent(new CustomEvent("complytrack:session-expired"));
    }

    return Promise.reject(error);
  },
);

export default api;