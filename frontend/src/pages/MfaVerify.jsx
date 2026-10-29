import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MfaVerify() {
  const { verifyMfaLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const challengeToken = location.state?.challengeToken;
  const email = location.state?.email || "";
  const destination = location.state?.from;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!challengeToken) {
      setError("Your verification session is missing. Please sign in again.");
      return;
    }

    const submittedCode = code.trim();

    if (!submittedCode) {
      setError("Enter your authenticator or recovery code.");
      return;
    }

    setBusy(true);

    try {
      const user = await verifyMfaLogin({
        challengeToken,
        code: submittedCode,
      });

      const nextPath =
        user.role === "Administrator" && !user.mfaEnabled
          ? "/mfa-setup"
          : destination
            ? `${destination.pathname || "/dashboard"}${destination.search || ""}`
            : "/dashboard";

      navigate(nextPath, { replace: true });
    } catch (err) {
      const data = err.response?.data;

      if (data?.code === "MFA_CHALLENGE_EXPIRED") {
        setError(
          data.message || "Your verification session has expired. Please sign in again.",
        );
      } else {
        setError(
          data?.message ||
            err.message ||
            "Verification failed. Check your code and try again.",
        );
      }
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

            <h1>One more step to secure your workspace.</h1>

            <div className="comply-login-features">
              <div className="comply-login-feature">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Multi-factor authentication</span>
              </div>
              <div className="comply-login-feature">
                <LockKeyhole size={18} aria-hidden="true" />
                <span>Protected account access</span>
              </div>
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
            <h2>Verify your identity</h2>

            <p className="comply-login-subtitle">
              {email
                ? `Enter the authenticator code or an unused recovery code for ${email}.`
                : "Enter the authenticator code or an unused recovery code for your account."}
            </p>

            <form onSubmit={submit} className="comply-login-form">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <label className="comply-login-field">
                <span>Authenticator or recovery code</span>
                <span className="comply-login-input-wrap">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <input
                    type="text"
                    name="mfaCode"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    maxLength={128}
                    placeholder="Enter your verification code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </span>
              </label>

              <button
                type="submit"
                className="comply-login-submit"
                disabled={busy || !challengeToken}
              >
                <span className="comply-login-shimmer" aria-hidden="true" />
                <span>{busy ? "Verifying..." : "Verify and continue"}</span>
                {!busy && (
                  <ArrowRight size={17} aria-hidden="true" />
                )}
              </button>
            </form>

            <p className="comply-login-signup">
              Need to start again? <Link to="/login">Return to sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}