import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
export default function MfaSetup() {
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  async function begin() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/mfa/enroll");
      setSetup(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to begin MFA setup.");
    } finally {
      setBusy(false);
    }
  }
  async function confirm(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/mfa/confirm", { code });
      setRecovery(data.recoveryCodes || []);
      await refreshUser();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to verify the authenticator code.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Secure your Administrator account</h1>
        <p>
          Administrator access requires an authenticator app and recovery codes.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!setup && !recovery.length && (
          <button
            className="primary-button full"
            disabled={busy}
            onClick={begin}
          >
            {busy ? "Preparing…" : "Set up authenticator"}
          </button>
        )}
        {setup && !recovery.length && (
          <>
            <p>
              Add this key manually in Microsoft Authenticator, Google
              Authenticator, or another TOTP app:
            </p>
            <pre className="mfa-secret">{setup.secret}</pre>
            <button
              className="secondary-button full"
              onClick={() => navigator.clipboard?.writeText(setup.otpauthUrl)}
            >
              Copy setup URI
            </button>
            <form onSubmit={confirm}>
              <label>
                Six-digit authenticator code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
              <button className="primary-button full" disabled={busy}>
                {busy ? "Verifying…" : "Confirm and enable MFA"}
              </button>
            </form>
          </>
        )}
        {recovery.length > 0 && (
          <>
            <h2>Save your recovery codes</h2>
            <p>
              Each code can be used once. Store these somewhere private; they
              will not be shown again.
            </p>
            <pre className="recovery-codes">{recovery.join("\n")}</pre>
            <button
              className="secondary-button full"
              onClick={() =>
                navigator.clipboard?.writeText(recovery.join("\n"))
              }
            >
              Copy recovery codes
            </button>
            <button
              className="primary-button full"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Continue to workspace
            </button>
          </>
        )}
      </section>
    </main>
  );
}
