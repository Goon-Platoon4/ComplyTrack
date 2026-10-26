import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const features = [
  "Contractor compliance tracking",
  "Document expiry monitoring",
  "Compliance reporting",
  "Audit-ready activity history",
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", mfaCode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await signIn({
        email: form.email,
        password: form.password,
        ...(form.mfaCode ? { mfaCode: form.mfaCode } : {}),
      });
      navigate(
        user.role === "Administrator" && !user.mfaEnabled
          ? "/mfa-setup"
          : location.state?.from
            ? `${location.state.from.pathname || "/dashboard"}${location.state.from.search || ""}`
            : "/dashboard",
        { replace: true },
      );
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === "MFA_REQUIRED") {
        setNeedsMfa(true);
      }
      setError(
        data?.message ||
          "Unable to sign in. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="comply-login-page">
      <div className="comply-login-card">
        <section className="comply-login-intro">
          <div className="comply-login-curve" aria-hidden="true" />
          <div className="comply-login-intro-content">
            <img
              src="/logo.webp"
              alt="ComplyTrack"
              className="comply-login-logo"
            />
            <h1>
              Secure access to the contractor compliance workspace.
            </h1>
            <div className="comply-login-features">
              {features.map((feature, index) => (
                <div
                  className="comply-login-feature"
                  key={feature}
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="comply-login-footer">
            Built for South African organisations by South African developers
          </p>
        </section>

        <section className="comply-login-form-area">
          <div className="comply-login-mobile-logo">
            <img src="/logo.webp" alt="ComplyTrack" />
          </div>
          <div className="comply-login-form-content">
            <h2>Sign in</h2>
            <p className="comply-login-subtitle">
              Use the account your administrator created.
            </p>

            <form onSubmit={submit} className="comply-login-form">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <label className="comply-login-field">
                <span>Email address</span>
                <span className="comply-login-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                  />
                </span>
              </label>

              <label className="comply-login-field">
                <span>Password</span>
                <span className="comply-login-input-wrap">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="comply-login-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              {needsMfa && (
                <label className="comply-login-field">
                  <span>Authenticator or recovery code</span>
                  <span className="comply-login-input-wrap">
                    <ShieldCheck size={18} aria-hidden="true" />
                    <input
                      autoComplete="one-time-code"
                      placeholder="Enter your verification code"
                      required
                      value={form.mfaCode}
                      onChange={(event) =>
                        setForm({ ...form, mfaCode: event.target.value })
                      }
                    />
                  </span>
                </label>
              )}

              <div className="comply-login-options">
                <label>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button
                type="submit"
                className="comply-login-submit"
                disabled={busy}
              >
                <span className="comply-login-shimmer" aria-hidden="true" />
                <span>{busy ? "Signing in..." : "Sign in"}</span>
                {!busy && <ArrowRight size={17} aria-hidden="true" />}
              </button>
            </form>

            <p className="comply-login-signup">
              Don&apos;t have an account?{" "}
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
