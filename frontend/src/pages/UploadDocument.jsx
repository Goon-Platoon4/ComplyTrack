import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileUp, ShieldCheck } from "lucide-react";
import api from "../services/api";
export default function UploadDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    documentTypeId: "",
    referenceNo: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      api.get(`/contractors/${id}`),
      api.get(`/documents/contractor/${id}`),
    ])
      .then(([c, d]) => {
        setContractor(c.data);
        const items = d.data.items || [];
        setRules(items);
        if (items.length)
          setForm((old) => ({
            ...old,
            documentTypeId: String(items[0].documentTypeId),
          }));
      })
      .catch((err) =>
        setError(
          err.response?.data?.message || "Unable to load upload requirements.",
        ),
      );
  }, [id]);
  const rule = rules.find(
    (r) => String(r.documentTypeId) === String(form.documentTypeId),
  );
  function update(key, value) {
    setForm((old) => ({ ...old, [key]: value }));
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!file) return setError("Choose a file to upload.");
    if (file.size > 10 * 1024 * 1024)
      return setError("File must be 10 MB or smaller.");
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type))
      return setError("Only PDF, JPEG, and PNG files are accepted.");
    if (rule?.expiryTracked && !form.expiryDate)
      return setError("An expiry date is required for this document type.");
    if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate)
      return setError("Expiry date cannot be before issue date.");
    setBusy(true);
    try {
      await api.post("/documents/upload", file, {
        params: {
          contractorId: id,
          documentTypeId: form.documentTypeId,
          referenceNo: form.referenceNo,
          issueDate: form.issueDate || undefined,
          expiryDate: form.expiryDate || undefined,
          notes: form.notes,
          fileName: file.name,
        },
        headers: { "Content-Type": "application/octet-stream" },
      });
      setMessage("Document uploaded and passed the configured scan.");
      setTimeout(() => navigate(`/contractors/${id}`), 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Upload failed. The file has not been published.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <div className="blueprint-back">
        <Link to={`/contractors/${id}`}>
          <ArrowLeft size={16} /> Back to contractor
        </Link>
      </div>
      <div className="page-header">
        <div>
          <span className="eyebrow">DOCUMENT CONTROL</span>
          <h1>Upload document</h1>
          <p>
            {contractor
              ? `Upload a verified document for ${contractor.name}.`
              : "Loading contractor details…"}
          </p>
        </div>
      </div>
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
      <form className="auth-card upload-form" onSubmit={submit}>
        <div className="security-callout">
          <ShieldCheck size={20} />
          <span>
            Files are private. A file is not published unless the backend
            validates its content and a malware scanner confirms it is clean.
          </span>
        </div>
        <label>
          Document type
          <select
            required
            value={form.documentTypeId}
            onChange={(e) => update("documentTypeId", e.target.value)}
          >
            <option value="">Choose a document type</option>
            {rules.map((r) => (
              <option key={r.documentTypeId} value={r.documentTypeId}>
                {r.documentType}
                {r.required ? " · Required" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          File (PDF, JPEG or PNG, max 10 MB)
          <input
            required
            type="file"
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <div className="form-grid">
          <label>
            Reference number
            <input
              maxLength={120}
              value={form.referenceNo}
              onChange={(e) => update("referenceNo", e.target.value)}
            />
          </label>
          <label>
            Issue date
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => update("issueDate", e.target.value)}
            />
          </label>
          <label>
            Expiry date{rule?.expiryTracked ? " (required)" : " (optional)"}
            <input
              type="date"
              required={Boolean(rule?.expiryTracked)}
              value={form.expiryDate}
              onChange={(e) => update("expiryDate", e.target.value)}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            rows={3}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>
        <div className="blueprint-actions">
          <button className="primary-button" disabled={busy || !rules.length}>
            <FileUp size={16} />
            {busy ? "Uploading and scanning…" : "Upload securely"}
          </button>
          <Link className="secondary-button" to={`/contractors/${id}`}>
            Cancel
          </Link>
        </div>
        {rules.length === 0 && (
          <p>No active document rules are available for this organization.</p>
        )}
      </form>
    </section>
  );
}
