import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  Plus,
  ArrowUpRight,
  BellRing,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { attentionItems, contractors } from "../data/demoData";

export default function Dashboard() {
  const compliant = 18,
    expiring = 4,
    expired = 3,
    missing = 2;

  return (
    <section className="page">
      <PageHeader
        eyebrow="Wednesday · 7 October 2026"
        title="Compliance overview"
        description="A live-style view of contractor compliance across your organisation."
        actions={
          <Link to="/contractors" className="primary-button">
            <Plus size={17} /> Add contractor
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Compliant"
          value={compliant}
          helper="contractors with every required document valid"
          status="good"
          icon={CheckCircle2}
          trend="↑ 12% vs last month"
        />
        <StatCard
          label="Expiring soon"
          value={expiring}
          helper="have a document expiring within 30 days"
          status="warning"
          icon={Clock3}
          trend="↑ 2 require attention"
        />
        <StatCard
          label="Expired"
          value={expired}
          helper="are working with an expired document"
          status="danger"
          icon={AlertTriangle}
          trend="↑ 1 since yesterday"
        />
        <StatCard
          label="Missing"
          value={missing}
          helper="have not uploaded a required document"
          status="neutral"
          icon={FileWarning}
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel panel-wide">
          <div className="panel-header">
            <div>
              <h2>Needs attention</h2>
              <p>Items that may affect contractor compliance.</p>
            </div>
            <Link to="/reports" className="link-button">
              View full report <ArrowUpRight size={15} />
            </Link>
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
                {attentionItems.map((item) => (
                  <tr key={`${item.contractor}-${item.document}`}>
                    <td>
                      <strong>{item.contractor}</strong>
                    </td>
                    <td>{item.document}</td>
                    <td>{item.expiry}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <Link className="table-action" to="/contractors/1">
                        {item.action}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Compliance trend</h2>
              <p>Last 6 months</p>
            </div>
          </div>
          <div className="mini-chart">
            {[58, 64, 69, 72, 70, 78].map((h, i) => (
              <div className="chart-col" key={i}>
                <div className="bar" style={{ height: `${h}%` }} />
                <span>{["May", "Jun", "Jul", "Aug", "Sep", "Oct"][i]}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i className="dot good" /> Compliant
            </span>
            <span>
              <i className="dot warning" /> Expiring
            </span>
            <span>
              <i className="dot danger" /> Expired
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Document coverage</h2>
              <p>Required documents currently valid</p>
            </div>
          </div>
          <div className="coverage-list">
            {[
              ["Tax Compliance Status PIN", "25 / 27", 93],
              ["COIDA Letter of Good Standing", "22 / 27", 81],
              ["B-BBEE certificate / affidavit", "24 / 27", 89],
              ["Public liability insurance", "23 / 27", 85],
              ["OHS Act s37(2) agreement", "18 / 19", 95],
            ].map(([name, count, pct]) => (
              <div className="coverage-row" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-wide">
          <div className="panel-header">
            <div>
              <h2>Recently updated</h2>
              <p>Latest compliance activity</p>
            </div>
            <Link to="/contractors" className="link-button">
              View contractors
            </Link>
          </div>
          <div className="activity-list">
            {contractors.slice(0, 5).map((c, i) => (
              <div className="activity-row" key={c.id}>
                <div className="activity-avatar">
                  {c.name
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <strong>{c.name}</strong>
                  <span>
                    {c.category} · record updated {i + 1} hour
                    {i === 0 ? "" : "s"} ago
                  </span>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <BellRing size={18} /> Reminders
              </h2>
              <p>Automated workflow status</p>
            </div>
          </div>
          <div className="reminder-box">
            <strong>4 reminders scheduled</strong>
            <span>30, 14 and 7-day expiry reminders are enabled.</span>
            <button className="secondary-button">Configure reminders</button>
          </div>
        </div>
      </div>
    </section>
  );
}
