import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invitationToken = params.get("invitationToken") || "";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/register", {
        ...form,
        ...(invitationToken ? { invitationToken } : {}),
      });
      setMessage(data.message);
      if (data.developmentVerificationToken)
        setMessage(
          `${data.message} Development verification token: ${data.developmentVerificationToken}`,
        );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your ComplyTrack account</h1>
        <p>
          {invitationToken
            ? "Accept your organization invitation."
            : "Create an organization workspace or sign up through an invitation."}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-success" role="status">
            {message} <Link to="/verify-email">Verify email</Link>
          </p>
        )}
        <label>
          Full name
          <input
            required
            maxLength={120}
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        {!invitationToken && (
          <label>
            Organization name
            <input
              required
              maxLength={180}
              value={form.organizationName}
              onChange={(e) =>
                setForm({ ...form, organizationName: e.target.value })
              }
            />
          </label>
        )}
        <label>
          Password (at least 12 characters)
          <input
            required
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="primary-button full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        {invitationToken && (
          <p>
            Already have an account?{" "}
            <Link
              to={`/accept-invitation?invitationToken=${encodeURIComponent(invitationToken)}`}
            >
              Sign in and accept this invitation
            </Link>
          </p>
        )}
      </form>
    </main>
  );
}
