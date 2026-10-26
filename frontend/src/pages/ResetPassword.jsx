import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset your password.");
    }
  }
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Choose a new password</h1>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <label>
          Reset token
          <input
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label>
          New password (at least 12 characters)
          <input
            required
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="primary-button full">Reset password</button>
        <p>
          <Link to="/login">Return to sign in</Link>
        </p>
      </form>
    </main>
  );
}
