import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";

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

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  for (const [unit, duration] of units) {
    if (Math.abs(seconds) >= duration) {
      return formatter.format(Math.round(seconds / duration), unit);
    }
  }
  return formatter.format(seconds, "second");
}

function formatAction(action) {
  if (!action) return "Updated organization records";
  return action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SY"
  );
}

function getDocumentCoverage(complianceItems) {
  const coverage = new Map();
  for (const contractor of complianceItems) {
    for (const issue of contractor.compliance?.issues || []) {
      if (!issue.required) continue;
      const key = issue.documentTypeId || issue.documentType;
      const item = coverage.get(key) || {
        type: issue.documentType,
        valid: 0,
        required: 0,
      };
      item.required += 1;
      if (issue.status === "Compliant") item.valid += 1;
      coverage.set(key, item);
    }
  }
  return [...coverage.values()].sort((a, b) => a.type.localeCompare(b.type));
}

const statusMetrics = [
  { key: "compliant", label: "Compliant", color: "good" },
  { key: "expiring_soon", label: "Expiring", color: "warning" },
  { key: "expired", label: "Expired", color: "danger" },
  { key: "missing", label: "Missing", color: "neutral" },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(emptySummary);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    try {
      const [summaryResponse, alertResponse, complianceResponse, activityResponse] =
        await Promise.all([
          api.get("/reports/summary"),
          api.get("/operations/alerts"),
          api.get("/reports/compliance"),
          api.get("/operations/audit-logs?limit=5"),
        ]);
      setSummary(summaryResponse.data);
      setAlerts(alertResponse.data.items || []);
      setCoverage(getDocumentCoverage(complianceResponse.data.items || []));
      setActivity(activityResponse.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load live dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateAlert(alertKey, action) {
    try {
      await api.post("/operations/alerts/state", { alertKey, action });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update alert.");
    }
  }

  const maxStatusCount = Math.max(
    ...statusMetrics.map(({ key }) => summary[key] || 0),
    1,
  );
  const expiringAlerts = alerts.filter((alert) => alert.status === "Expiring soon");
  const nextExpiry = expiringAlerts
    .map((alert) => alert.expiryDate)
    .filter(Boolean)
    .sort()[0];

  return (
    <section className="page dashboard-blueprint">
      <PageHeader
        eyebrow="DASHBOARD"
        title="Compliance overview"
        description="A central overview of contractor compliance across the organisation."
        actions={
          <Link to="/contractors" className="primary-button">
            <Plus size={17} />
            Add contractor
          </Link>
        }
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="stats-grid" aria-busy={loading}>
        <StatCard
          label="Compliant"
          value={loading ? "—" : (summary.compliant ?? 0)}
          helper="Contractors with all required documents valid"
          status="good"
          icon={CheckCircle2}
        />
        <StatCard
          label="Expiring soon"
          value={loading ? "—" : (summary.expiring_soon ?? 0)}
          helper="Contractors with documents nearing expiry"
          status="warning"
          icon={Clock3}
        />
        <StatCard
          label="Expired"
          value={loading ? "—" : (summary.expired ?? 0)}
          helper="Contractors with expired required documents"
          status="danger"
          icon={AlertTriangle}
        />
        <StatCard
          label="Missing"
          value={loading ? "—" : (summary.missing ?? 0)}
          helper="Contractors missing required documents"
          status="neutral"
          icon={FileWarning}
        />
      </div>

      <div className="dashboard-blueprint-grid">
        <div className="panel dashboard-blueprint-panel dashboard-blueprint-wide">
          <div className="panel-header">
            <div>
              <h2>
                <AlertTriangle size={18} /> Needs attention
              </h2>
              <p>Contractors and documents that require follow-up.</p>
            </div>
            <Link to="/reports" className="link-button">
              View full report <ArrowUpRight size={15} />
            </Link>
          </div>

          {loading ? (
            <p className="dashboard-empty-state">Loading compliance alerts…</p>
          ) : alerts.length === 0 ? (
            <p className="dashboard-empty-state">
              No outstanding compliance alerts.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th>Document</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((item) => (
                    <tr key={item.key}>
                      <td>
                        <Link to={`/contractors/${item.contractorId}`}>
                          <strong>{item.contractorName}</strong>
                        </Link>
                      </td>
                      <td>{item.documentType}</td>
                      <td>{formatDate(item.expiryDate)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="dashboard-alert-actions">
                        <Link
                          to={`/contractors/${item.contractorId}`}
                          className="table-action"
                        >
                          Review
                        </Link>
                        {!item.readAt && (
                          <button
                            className="table-action"
                            onClick={() => updateAlert(item.key, "read")}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          className="table-action"
                          onClick={() => updateAlert(item.key, "dismiss")}
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel dashboard-blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <Activity size={18} /> Compliance snapshot
              </h2>
              <p>Current contractor status across the organisation.</p>
            </div>
          </div>
          {loading ? (
            <p className="dashboard-empty-state">Loading status summary…</p>
          ) : (
            <div className="dashboard-status-chart" aria-label="Contractor status counts">
              {statusMetrics.map(({ key, label, color }) => {
                const count = summary[key] || 0;
                return (
                  <div className="dashboard-status-column" key={key}>
                    <strong>{count}</strong>
                    <div
                      className={`dashboard-status-bar ${color}`}
                      style={{
                        height: `${Math.max((count / maxStatusCount) * 100, 4)}%`,
                      }}
                      title={`${label}: ${count}`}
                    />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel dashboard-blueprint-panel dashboard-blueprint-wide">
          <div className="panel-header">
            <div>
              <h2>
                <Activity size={18} /> Recently updated
              </h2>
              <p>Latest contractor and document activity.</p>
            </div>
            <Link to="/audit-log" className="link-button">
              View audit log <ArrowUpRight size={15} />
            </Link>
          </div>
          {loading ? (
            <p className="dashboard-empty-state">Loading recent activity…</p>
          ) : activity.length === 0 ? (
            <p className="dashboard-empty-state">No recent activity to show.</p>
          ) : (
            <div className="activity-list">
              {activity.map((item) => (
                <div className="activity-row" key={item.id}>
                  <div className="activity-avatar">
                    {getInitials(item.actorName)}
                  </div>
                  <div>
                    <strong>
                      {formatAction(item.action)}
                      {item.entityType ? ` · ${item.entityType}` : ""}
                    </strong>
                    <span>
                      {item.actorName || "System"} ·{" "}
                      <time dateTime={item.createdAt}>
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel dashboard-blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <FileCheck2 size={18} /> Document coverage
              </h2>
              <p>Required documents currently valid.</p>
            </div>
          </div>
          {loading ? (
            <p className="dashboard-empty-state">Loading document coverage…</p>
          ) : coverage.length === 0 ? (
            <p className="dashboard-empty-state">
              No required documents are configured yet.
            </p>
          ) : (
            <div className="coverage-list">
              {coverage.map((item) => (
                <div className="coverage-row" key={item.type}>
                  <div>
                    <span>{item.type}</span>
                    <strong>
                      {item.valid} / {item.required}
                    </strong>
                  </div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label={`${item.type} valid documents`}
                    aria-valuemin={0}
                    aria-valuemax={item.required}
                    aria-valuenow={item.valid}
                  >
                    <span
                      style={{
                        width: `${(item.valid / item.required) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel dashboard-blueprint-panel dashboard-blueprint-wide">
          <div className="panel-header">
            <div>
              <h2>
                <BellRing size={18} /> Reminders
              </h2>
              <p>Expiry reminders based on your compliance rules.</p>
            </div>
          </div>
          <div className="dashboard-reminder-box">
            <div>
              <strong>
                {loading ? "Loading reminders…" : `${expiringAlerts.length} expiring documents`}
              </strong>
              <span>
                {nextExpiry
                  ? `Next expiry: ${formatDate(nextExpiry)}`
                  : "No upcoming document expiries are currently reported."}
              </span>
            </div>
            <Link to="/document-rules" className="secondary-button">
              Configure document rules
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
