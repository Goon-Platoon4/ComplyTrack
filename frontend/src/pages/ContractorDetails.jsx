import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, FileText, Upload } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
export default function ContractorDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contractor, setContractor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/contractors/${id}`),
      api.get(`/documents/contractor/${id}`),
    ])
      .then(([c, d]) => {
        if (active) {
          setContractor(c.data);
          setDocuments(d.data.items || []);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message || "Unable to load contractor details.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <section className="page">
        <p>Loading contractor…</p>
      </section>
    );
  if (error || !contractor)
    return (
      <section className="page">
        <p className="form-error">{error || "Contractor not found."}</p>
        <Link to="/contractors">Back to contractors</Link>
      </section>
    );
  const compliance = contractor.compliance;
  return (
    <section className="page">
      <div className="blueprint-back">
        <Link to="/contractors">
          <ArrowLeft size={16} /> Back to contractors
        </Link>
      </div>
      <div className="page-header">
        <div>
          <span className="eyebrow">CONTRACTOR PROFILE</span>
          <h1>
            <Building2 size={24} /> {contractor.name}
          </h1>
          <p>
            {contractor.registration} · {contractor.category}
          </p>
        </div>
        {user?.role !== "Read-only Auditor" && (
          <Link className="primary-button" to={`/contractors/${id}/upload`}>
            <Upload size={16} /> Upload document
          </Link>
        )}
      </div>
      <div className="stats-grid">
        <div className="panel">
          <span className="muted-label">Overall compliance</span>
          <h2>
            <StatusBadge status={contractor.status} />
          </h2>
        </div>
        <div className="panel">
          <span className="muted-label">Compliant checks</span>
          <h2>{compliance?.compliantCount ?? 0}</h2>
        </div>
        <div className="panel">
          <span className="muted-label">Outstanding issues</span>
          <h2>{compliance?.issueCount ?? 0}</h2>
        </div>
        <div className="panel">
          <span className="muted-label">Next expiry</span>
          <h2>{contractor.nextExpiry || "—"}</h2>
        </div>
      </div>
      <div className="panel">
        <h2>Contractor information</h2>
        <div className="detail-grid">
          <div>
            <span>Contact</span>
            <strong>{contractor.contact || "—"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{contractor.email || "—"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{contractor.phone || "—"}</strong>
          </div>
          <div>
            <span>Works on site</span>
            <strong>{contractor.worksOnSite ? "Yes" : "No"}</strong>
          </div>
          <div>
            <span>Contract start</span>
            <strong>{contractor.contractStart || "—"}</strong>
          </div>
          <div>
            <span>Contract end</span>
            <strong>{contractor.contractEnd || "—"}</strong>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <FileText size={18} /> Required documents
            </h2>
            <p>Each requirement and the current verified version.</p>
          </div>
        </div>
        {!compliance?.issues?.length ? (
          <p>
            No active compliance rules have been configured for this
            organization.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document type</th>
                  <th>Required</th>
                  <th>Status</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {compliance.issues.map((issue) => (
                  <tr key={issue.ruleId}>
                    <td>{issue.documentType}</td>
                    <td>{issue.required ? "Yes" : "No"}</td>
                    <td>
                      <StatusBadge status={issue.status} />
                    </td>
                    <td>{issue.expiryDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="panel">
        <h2>Current document records</h2>
        {documents.length === 0 ? (
          <p>No clean current document versions are available yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Version</th>
                  <th>Expiry</th>
                  <th>Scan status</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.documentId || doc.id}>
                    <td>{doc.documentType}</td>
                    <td>{doc.versionNumber || 1}</td>
                    <td>{doc.expiryDate || "—"}</td>
                    <td>{doc.scanStatus || "clean"}</td>
                    <td>
                      <button
                        className="table-action"
                        onClick={async () => {
                          try {
                            const { data } = await api.get(
                              `/documents/${doc.documentId || doc.id}/download-url`,
                            );
                            window.open(
                              data.url,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } catch (e) {
                            setError(
                              e.response?.data?.message ||
                                "Unable to open document.",
                            );
                          }
                        }}
                      >
                        Open securely
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
