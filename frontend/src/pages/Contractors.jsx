import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  FileWarning,
  Plus,
  Search,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialForm = {
  name: "",
  registration: "",
  category: "",
  contact: "",
  email: "",
  phone: "",
  worksOnSite: false,
};

const emptySummary = {
  total: 0,
  compliant: 0,
  expiring_soon: 0,
  expired: 0,
  missing: 0,
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

export default function Contractors() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [documentCounts, setDocumentCounts] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function loadContractors() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/contractors", {
        params: {
          search: search || undefined,
          status: status || undefined,
          category: category || undefined,
          limit: 100,
        },
      });
      setItems(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load contractors.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    setSummaryLoading(true);
    setOverviewError("");
    try {
      const [{ data: nextSummary }, { data: report }] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/reports/compliance"),
      ]);
      setSummary(nextSummary);
      const contractors = report.items || [];
      setCategoryOptions(
        [...new Set(contractors.map((item) => item.category).filter(Boolean))].sort(
          (first, second) => first.localeCompare(second),
        ),
      );
      setDocumentCounts(
        Object.fromEntries(
          contractors.map((item) => {
            const required = (item.compliance?.issues || []).filter(
              (issue) => issue.required,
            );
            const valid = required.filter(
              (issue) => issue.status === "Compliant",
            ).length;
            return [item.id, { valid, required: required.length }];
          }),
        ),
      );
    } catch (err) {
      setOverviewError(
        err.response?.data?.message ||
          "Unable to load contractor compliance summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadContractors, 250);
    return () => clearTimeout(timer);
  }, [search, status, category]);

  useEffect(() => {
    loadSummary();
  }, []);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/contractors", form);
      setForm(initialForm);
      setShowAdd(false);
      await Promise.all([loadContractors(), loadSummary()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create contractor.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const { data } = await api.get("/reports/compliance.csv", {
        params: {
          status: status || undefined,
          category: category || undefined,
          search: search || undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "complytrack-compliance.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "CSV export failed.");
    } finally {
      setExporting(false);
    }
  }

  const visibleCount = items.length;

  return (
    <section className="page contractors-blueprint">
      <PageHeader
        eyebrow="ORGANIZATION DIRECTORY"
        title="Contractors"
        description="Browse the contractor roster, review compliance status, and open contractor profiles."
        actions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={exportCsv}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            {user?.role !== "Read-only Auditor" && (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowAdd((current) => !current)}
                aria-expanded={showAdd}
              >
                <Plus size={16} />
                Add contractor
              </button>
            )}
          </>
        }
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {overviewError && (
        <p className="form-error" role="alert">
          {overviewError}
        </p>
      )}

      <div className="stats-grid" aria-busy={summaryLoading}>
        <StatCard
          label="Total"
          value={summaryLoading ? "—" : (summary.total ?? 0)}
          helper="Contractor records in your organization"
          status="neutral"
          icon={Users}
        />
        <StatCard
          label="Compliant"
          value={summaryLoading ? "—" : (summary.compliant ?? 0)}
          helper="Contractors with all required documents valid"
          status="good"
          icon={CheckCircle2}
        />
        <StatCard
          label="Expiring soon"
          value={summaryLoading ? "—" : (summary.expiring_soon ?? 0)}
          helper="Contractors with documents nearing expiry"
          status="warning"
          icon={Clock3}
        />
        <StatCard
          label="Expired"
          value={summaryLoading ? "—" : (summary.expired ?? 0)}
          helper="Contractors with expired required documents"
          status="danger"
          icon={FileWarning}
        />
      </div>

      {showAdd && (
        <form
          className="panel contractors-form-panel"
          onSubmit={create}
          aria-busy={busy}
        >
          <div className="panel-header">
            <div>
              <h2>
                <Plus size={18} /> Add contractor
              </h2>
              <p>Enter the organization and primary contact details.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Business name
              <input
                required
                maxLength={180}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label>
              Registration number
              <input
                required
                maxLength={80}
                value={form.registration}
                onChange={(event) =>
                  setForm({ ...form, registration: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <input
                required
                maxLength={100}
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </label>
            <label>
              Contact name
              <input
                required
                maxLength={120}
                value={form.contact}
                onChange={(event) =>
                  setForm({ ...form, contact: event.target.value })
                }
              />
            </label>
            <label>
              Contact email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>
            <label>
              Contact phone
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </label>
          </div>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.worksOnSite}
              onChange={(event) =>
                setForm({ ...form, worksOnSite: event.target.checked })
              }
            />
            Works on site
          </label>
          <div className="blueprint-actions">
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Save contractor"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="panel contractors-filter-panel">
        <div className="panel-header">
          <div>
            <h2>
              <Search size={18} /> Search &amp; filters
            </h2>
            <p>Find contractors by name, registration, contact, status, or category.</p>
          </div>
        </div>
        <div className="contractors-filters">
          <label className="contractors-search">
            <span className="sr-only">Search contractors</span>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search name, company or contact"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Expiring soon">Expiring soon</option>
              <option value="Expired">Expired</option>
              <option value="Missing">Missing documents</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="panel contractors-list-panel">
        <div className="panel-header">
          <div>
            <h2>
              <Building2 size={18} /> Contractor list
            </h2>
            <p>
              {loading
                ? "Loading contractor records…"
                : `${visibleCount} contractor${visibleCount === 1 ? "" : "s"} in this view`}
            </p>
          </div>
          <Link to="/reports" className="link-button">
            View report <ArrowUpRight size={15} />
          </Link>
        </div>

        {loading ? (
          <p className="contractors-empty-state" role="status">
            Loading contractors…
          </p>
        ) : items.length === 0 ? (
          <p className="contractors-empty-state">
            {search || status || category
              ? "No contractors match the current search and filters."
              : "No contractors found. Add your first contractor to get started."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="contractors-table">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Registration</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Documents</th>
                  <th>Next expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const documents = documentCounts[item.id];
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link
                          className="contractor-name-link"
                          to={`/contractors/${item.id}`}
                        >
                          <strong>{item.name}</strong>
                        </Link>
                        <span className="contractors-subtext">
                          {item.worksOnSite
                            ? "Site work"
                            : "No site work"}
                        </span>
                      </td>
                      <td>{item.registration || "—"}</td>
                      <td>
                        <strong className="contractors-contact-name">
                          {item.contact || "—"}
                        </strong>
                        {item.email && (
                          <span className="contractors-subtext">
                            {item.email}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="contractors-category">
                          {item.category || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        {documents
                          ? `${documents.valid} / ${documents.required}`
                          : "—"}
                      </td>
                      <td>{formatDate(item.nextExpiry)}</td>
                      <td>
                        <StatusBadge status={item.status || "Missing"} />
                      </td>
                      <td>
                        <Link
                          to={`/contractors/${item.id}`}
                          className="table-action"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
