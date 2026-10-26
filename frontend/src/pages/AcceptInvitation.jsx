import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const token = params.get("invitationToken") || "";
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Accepting invitation…");
  const [busy, setBusy] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    if (!token) {
      setError("Invitation token is missing.");
      setMessage("");
      return;
    }
    setBusy(true);
    api
      .post("/auth/accept-invitation", { invitationToken: token })
      .then(async ({ data }) => {
        if (!active) return;
        setMessage(data.message);
        await refreshUser();
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to accept invitation.",
          );
          setMessage("");
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Join organization</h1>
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
        {!busy && !error && (
          <button
            className="primary-button full"
            onClick={() => navigate("/dashboard", { replace: true })}
          >
            Continue to workspace
          </button>
        )}
        {error && (
          <p>
            Check that you're signed in with the email address the invitation
            was sent to. <Link to="/login">Sign in</Link> or{" "}
            <Link to="/signup">create an account</Link> using the invitation
            link.
          </p>
        )}
      </section>
    </main>
  );
}
