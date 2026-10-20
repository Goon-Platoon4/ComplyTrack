
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  Plus,
  ArrowUpRight,
  BellRing,
  Activity,
  FileCheck2,
  CircleHelp,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  return (
    <section className="page dashboard-blueprint">
      {/* ==================================================
          1. PAGE HEADER
          Developer: connect the date to the current date.
          Add contractor should open the contractor workflow.
         ================================================== */}
      <PageHeader
        eyebrow="DASHBOARD BLUEPRINT · IMPLEMENTATION REQUIRED"
        title="Compliance overview"
        description="A central overview of contractor compliance across the organisation."
        actions={
          <Link to="/contractors" className="primary-button">
            <Plus size={17} />
            Add contractor
          </Link>
        }
      />

      {/* ==================================================
          2. COMPLIANCE SUMMARY CARDS
          Developer: replace placeholders with API data.
          Each card should link to a relevant filtered view.
         ================================================== */}
      <div className="stats-grid">
        <StatCard
          label="Compliant"
          value="—"
          helper="Contractors with all required documents valid"
          status="good"
          icon={CheckCircle2}
          trend="Implementation required"
        />

        <StatCard
          label="Expiring soon"
          value="—"
          helper="Contractors with documents expiring within 30 days"
          status="warning"
          icon={Clock3}
          trend="Connect expiry calculations"
        />

        <StatCard
          label="Expired"
          value="—"
          helper="Contractors with expired required documents"
          status="danger"
          icon={AlertTriangle}
          trend="Connect expiry calculations"
        />

        <StatCard
          label="Missing"
          value="—"
          helper="Contractors missing required documents"
          status="neutral"
          icon={FileWarning}
          trend="Connect missing-document checks"
        />
      </div>

      <div className="dashboard-grid">
        {/* ==================================================
            3. NEEDS ATTENTION
            Developer:
            - Load actual contractor and document records.
            - Show expired, expiring and missing requirements.
            - Link each row to the correct contractor.
            - Do not hardcode contractor IDs.
           ================================================== */}
        <div className="panel panel-wide blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <AlertTriangle size={18} />
                Needs attention
              </h2>
              <p>
                Contractors and documents that require follow-up.
              </p>
            </div>

            <Link to="/reports" className="link-button">
              View full report <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="blueprint-placeholder">
            <FileWarning size={30} />
            <strong>Contractor compliance table</strong>
            <span>
              Implement the table using live backend data.
            </span>
            <span>
              Required columns: Contractor, Document, Expiry,
              Status and Action.
            </span>
          </div>

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
                <tr>
                  <td colSpan={5} className="blueprint-table-note">
                    Developer: render one row per outstanding
                    compliance issue. Include a loading state,
                    an empty state and an error state.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            4. COMPLIANCE TREND
            Developer: use historical database data.
            Do not use fabricated production statistics.
           ================================================== */}
        <div className="panel blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <Activity size={18} />
                Compliance trend
              </h2>
              <p>Compliance performance over the last six months.</p>
            </div>
          </div>

          <div className="blueprint-placeholder">
            <Activity size={30} />
            <strong>Historical compliance chart</strong>
            <span>
              Missing: historical data source and chart implementation.
            </span>
            <span>
              Display monthly compliance percentages when available.
            </span>
          </div>

          <div className="blueprint-requirements">
            <strong>Developer requirements</strong>
            <ul>
              <li>Retrieve historical compliance data.</li>
              <li>Display monthly changes.</li>
              <li>Show a useful empty state if history is unavailable.</li>
            </ul>
          </div>
        </div>

        {/* ==================================================
            5. DOCUMENT COVERAGE
            Developer: calculate coverage per document type.
           ================================================== */}
        <div className="panel blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <FileCheck2 size={18} />
                Document coverage
              </h2>
              <p>Required documents currently valid.</p>
            </div>
          </div>

          <div className="blueprint-placeholder">
            <FileCheck2 size={30} />
            <strong>Document coverage breakdown</strong>
            <span>
              Missing: live counts, coverage percentages and progress bars.
            </span>
            <span>
              Group records by the configured document rules.
            </span>
          </div>

          <div className="blueprint-requirements">
            <strong>Each coverage row must include</strong>
            <ul>
              <li>Document type</li>
              <li>Number of applicable contractors</li>
              <li>Number with valid documents</li>
              <li>Calculated coverage percentage</li>
            </ul>
          </div>
        </div>

        {/* ==================================================
            6. RECENT ACTIVITY
            Developer: connect to real activity/audit records.
           ================================================== */}
        <div className="panel panel-wide blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <Activity size={18} />
                Recently updated
              </h2>
              <p>Latest contractor and document activity.</p>
            </div>

            <Link to="/audit-log" className="link-button">
              View audit log <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="blueprint-placeholder">
            <Activity size={30} />
            <strong>Recent activity list</strong>
            <span>
              Missing: activity API integration and timestamps.
            </span>
            <span>
              Show who changed what, which record was affected
              and when the action occurred.
            </span>
          </div>
        </div>

        {/* ==================================================
            7. REMINDERS
            Developer: connect to reminder configuration and
            actual scheduled/sent reminder records.
           ================================================== */}
        <div className="panel blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <BellRing size={18} />
                Reminders
              </h2>
              <p>Document expiry reminder status.</p>
            </div>
          </div>

          <div className="blueprint-placeholder">
            <BellRing size={30} />
            <strong>Reminder status</strong>
            <span>
              Missing: reminder scheduling and delivery integration.
            </span>
            <span>
              Display actual pending, sent and failed reminders.
            </span>
          </div>

          <Link to="/settings" className="secondary-button">
            Configure reminders
          </Link>
        </div>

        {/* ==================================================
            8. IMPLEMENTATION CHECKLIST
            Remove this panel when implementation is complete.
           ================================================== */}
        <div className="panel panel-wide blueprint-panel">
          <div className="panel-header">
            <div>
              <h2>
                <CircleHelp size={18} />
                Dashboard implementation checklist
              </h2>
              <p>
                Guidance for the developer assigned to this page.
              </p>
            </div>
            <StatusBadge status="warning" />
          </div>

          <div className="blueprint-requirements">
            <ul>
              <li>Connect the dashboard to the existing API service.</li>
              <li>Replace placeholder values with database-backed results.</li>
              <li>Use consistent compliance rules across all pages.</li>
              <li>Connect actions to the correct contractor and document.</li>
              <li>Implement loading, error and empty states.</li>
              <li>Ensure the layout works on desktop and mobile.</li>
              <li>Remove blueprint labels when the feature is implemented.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
