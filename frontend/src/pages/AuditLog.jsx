import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, Clock, RefreshCw, Filter } from "lucide-react";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

const ACTION_OPTIONS = [
  { value: "ALL", label: "All Actions" },
  { value: "Approved Document", label: "Approved Document" },
  { value: "Uploaded Document", label: "Uploaded Document" },
  { value: "Rejected Document", label: "Rejected Document" },
  { value: "Status Change", label: "Status Change" },
  { value: "User Login", label: "User Login" },
  { value: "User Created", label: "User Created" },
  { value: "Organization Created", label: "Organization Created" },
  { value: "Role Changed", label: "Role Changed" },
  { value: "Document Downloaded", label: "Document Downloaded" },
  { value: "Settings Updated", label: "Settings Updated" },
];

function getBadgeStyle(severity) {
  switch (severity) {
    case "warning":
      return "warning";
    case "danger":
    case "critical":
      return "danger";
    case "success":
      return "success";
    default:
      return "info";
  }
}

function formatTimestamp(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getActorName(item) {
  return item.actorName || item.actor_name || item.user || "System";
}

function getActorRole(item) {
  return item.actorRole || item.actor_role || item.role || "";
}

function getAction(item) {
  return item.action || "Unknown action";
}

function getDetails(item) {
  const metadata = item.metadata || {};
  return (
    item.details ||
    metadata.details ||
    metadata.description ||
    metadata.reason ||
    metadata.fileName ||
    metadata.file_name ||
    ""
  );
}

function getSeverity(item) {
  if (item.severity) return item.severity;

  const action = getAction(item).toLowerCase();
  if (/reject|fail|denied|blocked|revoked|suspend/.test(action)) {
    return "danger";
  }
  if (/warning|expired|reset|mfa|security/.test(action)) {
    return "warning";
  }
  return "info";
}

function getIpAddress(item) {
  return item.ipAddress || item.ip_address || "Not recorded";
}

function getTimestamp(item) {
  return item.createdAt || item.created_at || item.timestamp;
}

function getEntity(item) {
  const type = item.entityType || item.entity_type || "";
  const id = item.entityId || item.entity_id;

  if (type && id) return `${type} · ${id}`;
  return type || id || "—";
}

function getSearchText(item) {
  return [
    getActorName(item),
    getActorRole(item),
    getAction(item),
    getDetails(item),
    getEntity(item),
    getIpAddress(item),
    JSON.stringify(item.metadata || {}),
  ]
    .join(" ")
    .toLowerCase();
}

function normalizeLogs(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.logs)) return data.logs;
  if (Array.isArray(data?.events)) return data.events;
  return [];
}

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data } = await api.get("/operations/audit-logs", {
          params: {
            search: searchTerm.trim() || undefined,
            action: actionFilter !== "ALL" ? actionFilter : undefined,
            date: dateFilter || undefined,
            limit: 100,
          },
        });

        setItems(normalizeLogs(data));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load audit history. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchTerm, actionFilter, dateFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);

    return () => clearTimeout(timer);
  }, [load]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch || getSearchText(item).includes(normalizedSearch);

      const matchesAction =
        actionFilter === "ALL" || getAction(item) === actionFilter;

      const timestamp = getTimestamp(item);
      const matchesDate =
        !dateFilter ||
        (timestamp &&
          !Number.isNaN(new Date(timestamp).getTime()) &&
          new Date(timestamp).toISOString().slice(0, 10) === dateFilter);

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [items, searchTerm, actionFilter, dateFilter]);

  const exportFile = async (format) => {
    setError("");

    try {
      const { data } = await api.get(`/operations/audit-logs.${format}`, {
        params: {
          search: searchTerm.trim() || undefined,
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          date: dateFilter || undefined,
        },
        responseType: "blob",
      });

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `complytrack-audit.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Audit ${format.toUpperCase()} export failed.`,
      );
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("ALL");
    setDateFilter("");
  };

  return (
    <section className="page audit-log-blueprint">
      <PageHeader
        eyebrow="ACTIVITY & GOVERNANCE"
        title="Audit log"
        description="Track system activities, compliance changes, and user actions in your organization."
        actions={
          <>
            <button
              type="button"
              onClick={() => load({ quiet: true })}
              disabled={loading || refreshing}
              className="secondary-button audit-log-action"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "audit-log-spinning" : ""}
                aria-hidden="true"
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => exportFile("csv")}
              className="secondary-button audit-log-action"
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => exportFile("pdf")}
              className="primary-button audit-log-action"
            >
              <Download size={16} aria-hidden="true" />
              Export PDF
            </button>
          </>
        }
      />

      <div className="audit-log-overview">
        <span className="audit-log-overview-icon">
          <Clock size={22} aria-hidden="true" />
        </span>
        <div className="audit-log-overview-copy">
          <h2>Organization activity history</h2>
          <p>
            Review recorded actions and download a filtered copy for your
            compliance records.
          </p>
        </div>
        <span className="audit-log-count" aria-live="polite">
          {loading
            ? "Loading records"
            : `${filteredLogs.length} ${
                filteredLogs.length === 1 ? "record" : "records"
              }`}
        </span>
      </div>

      {error && (
        <div role="alert" className="audit-log-error">
          {error}
        </div>
      )}

      <section className="audit-log-filters" aria-label="Filter audit records">
        <label className="audit-log-field" htmlFor="audit-search">
          <span>Search</span>
          <span className="audit-log-search-input">
            <Search size={17} aria-hidden="true" />
            <input
              id="audit-search"
              type="search"
              placeholder="Search user, action, details..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </span>
        </label>

        <label className="audit-log-field" htmlFor="audit-action">
          <span>Action type</span>
          <span className="audit-log-select">
            <Filter size={16} aria-hidden="true" />
            <select
              id="audit-action"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="audit-log-field" htmlFor="audit-date">
          <span>Date</span>
          <input
            id="audit-date"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="secondary-button audit-log-clear"
          disabled={!searchTerm && actionFilter === "ALL" && !dateFilter}
        >
          Clear filters
        </button>
      </section>

      <section className="audit-log-table-card" aria-label="Audit history">
        <div className="audit-log-table-heading">
          <div>
            <h2>Activity records</h2>
            <p>
              {loading
                ? "Loading the latest organization activity."
                : "Most recent activity appears first."}
            </p>
          </div>
          <span className="audit-log-record-limit">Latest 100 records</span>
        </div>

        <div className="audit-log-table-scroll">
          <table className="audit-log-table">
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">User</th>
                <th scope="col">Action</th>
                <th scope="col">Details</th>
                <th scope="col" className="audit-log-ip-heading">
                  IP address
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="audit-log-table-message">
                    Loading audit history...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((item) => {
                  const severity = getSeverity(item);
                  const metadata = item.metadata || {};
                  const details = getDetails(item);

                  return (
                    <tr key={item.id}>
                      <td className="audit-log-timestamp">
                        <Clock size={14} aria-hidden="true" />
                        {formatTimestamp(getTimestamp(item))}
                      </td>
                      <td>
                        <div className="audit-log-user">
                          {getActorName(item)}
                        </div>
                        <div className="audit-log-user-subtitle">
                          {getActorRole(item) || item.actorEmail || ""}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`audit-log-badge ${getBadgeStyle(
                            severity,
                          )}`}
                        >
                          {getAction(item)}
                        </span>
                      </td>
                      <td className="audit-log-details">
                        <div>{details || getEntity(item)}</div>
                        {details && getEntity(item) !== "—" && (
                          <div className="audit-log-entity">
                            {getEntity(item)}
                          </div>
                        )}
                        {Object.keys(metadata).length > 0 && !details && (
                          <details className="audit-log-metadata">
                            <summary>View event metadata</summary>
                            <pre>{JSON.stringify(metadata, null, 2)}</pre>
                          </details>
                        )}
                      </td>
                      <td className="audit-log-ip">{getIpAddress(item)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="audit-log-table-message">
                    {error
                      ? "Audit history could not be loaded."
                      : "No log records match your filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
