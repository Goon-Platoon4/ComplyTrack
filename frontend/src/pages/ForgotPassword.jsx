import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setResetToken("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      if (data.developmentResetToken) setResetToken(data.developmentResetToken);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to request a password reset.",
      );
    }
  }
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Reset your password</h1>
        <p>We'll send reset instructions if the account matches.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        <label>
          Email address
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="primary-button full">Request reset</button>
        {resetToken && (
          <p>
            Development reset token: <code>{resetToken}</code>
            <br />
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
            >
              Continue to reset password
            </Link>
          </p>
        )}
        <p>
          <Link to="/login">Return to sign in</Link>
        </p>
      </form>
    </main>
  );
}
