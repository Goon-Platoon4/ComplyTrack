import { useEffect, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
export default function Reports() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
  });
  const [report, setReport] = useState({ items: [], count: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reports/compliance", {
        params: Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v),
        ),
      });
      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to generate the compliance report.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function download(format) {
    try {
      const { data } = await api.get(`/reports/compliance.${format}`, {
        params: Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v),
        ),
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `complytrack-compliance.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.message || `${format.toUpperCase()} export failed.`,
      );
    }
  }
  return (
    <section className="page">
      <PageHeader
        eyebrow="REPORTING & EXPORTS"
        title="Compliance reports"
        description="Generate organization-scoped reports using current backend-calculated compliance status."
        actions={
          <>
            <button
              className="secondary-button"
              onClick={() => download("csv")}
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              className="secondary-button"
              onClick={() => download("pdf")}
            >
              <Download size={16} /> Export PDF
            </button>
          </>
        }
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <FileText size={18} /> Report filters
            </h2>
            <p>Filters apply to the report and CSV export.</p>
          </div>
        </div>
        <div className="filters-row">
          <input
            placeholder="Search contractor or registration"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option>Compliant</option>
            <option>Expiring soon</option>
            <option>Expired</option>
            <option>Missing</option>
          </select>
          <input
            placeholder="Category"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          />
          <button className="primary-button" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            {loading ? "Refreshing…" : "Generate report"}
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Compliance report</h2>
            <p>
              {report.count} records ·{" "}
              {report.generatedAt
                ? `Generated ${new Date(report.generatedAt).toLocaleString()}`
                : "Not generated yet"}
            </p>
          </div>
        </div>
        {loading ? (
          <p>Generating report…</p>
        ) : report.items.length === 0 ? (
          <p>No records match the selected filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Registration</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Next expiry</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.registration}</td>
                    <td>{row.category}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>{row.nextExpiry || "—"}</td>
                    <td>{row.compliance?.issueCount ?? 0}</td>
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
