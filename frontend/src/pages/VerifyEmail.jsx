import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function verify(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/verify-email", { token });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    }
  }
  async function resend(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      setMessage(
        data.developmentVerificationToken
          ? `${data.message} Development token: ${data.developmentVerificationToken}`
          : data.message,
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to request verification.",
      );
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Verify your email</h1>
        <p>
          Open the verification link sent to your email, or paste the token
          below.
        </p>
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
        <form onSubmit={verify}>
          <label>
            Verification token
            <input
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button className="primary-button full">Verify email</button>
        </form>
        <hr />
        <form onSubmit={resend}>
          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="secondary-button full">
            Resend verification email
          </button>
        </form>
        <p>
          <Link to="/login">Return to sign in</Link>
        </p>
      </section>
    </main>
  );
}
