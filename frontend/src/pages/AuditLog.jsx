
import { useMemo, useState } from "react";
import {
  Search,
  ClipboardList,
  Download,
  Eye,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const initialEvents = [
  {
    id: 1,
    date: "2026-10-20T08:30:00",
    user: "Thandi Nkosi",
    action: "Document uploaded",
    entity: "COIDA Letter of Good Standing",
    contractor: "Botha & Sons Construction",
    details: "A document record was added to the contractor profile.",
    status: "success",
  },
  {
    id: 2,
    date: "2026-10-20T08:05:00",
    user: "Thandi Nkosi",
    action: "Contractor updated",
    entity: "Contractor profile",
    contractor: "SecureGuard Bloem (Pty) Ltd",
    details: "Contractor contact information was updated.",
    status: "success",
  },
  {
    id: 3,
    date: "2026-10-19T15:20:00",
    user: "Thandi Nkosi",
    action: "Document reviewed",
    entity: "Tax Compliance Status PIN",
    contractor: "Rose City Cleaning Services",
    details: "A document review action was recorded.",
    status: "success",
  },
  {
    id: 4,
    date: "2026-10-19T11:45:00",
    user: "System",
    action: "Expiry warning generated",
    entity: "Public liability insurance",
    contractor: "Free State Plumbing CC",
    details: "A document was identified as approaching its expiry date.",
    status: "warning",
  },
];

function formatDate(value) {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function exportCsv(events) {
  const columns = [
    "date",
    "user",
    "action",
    "entity",
    "contractor",
    "details",
  ];

  const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    columns.join(","),
    ...events.map((event) =>
      columns.map((column) => escapeCsv(
        column === "date" ? formatDate(event[column]) : event[column]
      )).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "complytrack-audit-log.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function AuditLog() {
  const [events] = useState(initialEvents);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const searchable = [
        event.user,
        event.action,
        event.entity,
        event.contractor,
        event.details,
      ].join(" ").toLowerCase();

      const eventDate = event.date.slice(0, 10);

      return (
        (!query || searchable.includes(query)) &&
        (actionFilter === "all" || event.action === actionFilter) &&
        (!dateFrom || eventDate >= dateFrom) &&
        (!dateTo || eventDate <= dateTo)
      );
    });
  }, [events, search, actionFilter, dateFrom, dateTo]);

  const actionTypes = [
    ...new Set(events.map((event) => event.action)),
  ];

  return (
    <section className="page">
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Review a history of important actions recorded in ComplyTrack."
        actions={
          <button
            className="secondary-button"
            onClick={() => exportCsv(filteredEvents)}
          >
            <Download size={17} /> Export CSV
          </button>
        }
      />

      <div className="stats-grid">
        <div className="panel">
          <ClipboardList size={20} />
          <p>Recorded events in this view</p>
          <h2>{filteredEvents.length}</h2>
        </div>
        <div className="panel">
          <Eye size={20} />
          <p>Distinct action types</p>
          <h2>{new Set(filteredEvents.map((event) => event.action)).size}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Activity history</h2>
            <p>Filter recorded events by keyword, action or date.</p>
          </div>
        </div>

        <div className="audit-filters">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user, contractor or action..."
              aria-label="Search audit log"
            />
          </label>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            aria-label="Filter by action"
          >
            <option value="all">All actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <label>
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <button
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setActionFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date and time</th>
                <th>User</th>
                <th>Action</th>
                <th>Contractor</th>
                <th>Record</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{event.user}</td>
                  <td>
                    <StatusBadge
                      status={event.status === "warning" ? "warning" : "good"}
                    />
                    {event.action}
                  </td>
                  <td>{event.contractor || "—"}</td>
                  <td>{event.entity}</td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan="6">No audit events match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-backdrop">
          <section
            className="panel audit-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
          >
            <div className="panel-header">
              <div>
                <h2 id="audit-detail-title">Audit event details</h2>
                <p>{selectedEvent.action}</p>
              </div>
              <button
                className="secondary-button"
                onClick={() => setSelectedEvent(null)}
                autoFocus
              >
                Close
              </button>
            </div>

            <dl className="audit-detail-list">
              <dt>Date and time</dt>
              <dd>{formatDate(selectedEvent.date)}</dd>

              <dt>User</dt>
              <dd>{selectedEvent.user}</dd>

              <dt>Action</dt>
              <dd>{selectedEvent.action}</dd>

              <dt>Contractor</dt>
              <dd>{selectedEvent.contractor || "—"}</dd>

              <dt>Record</dt>
              <dd>{selectedEvent.entity}</dd>

              <dt>Details</dt>
              <dd>{selectedEvent.details}</dd>
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}
