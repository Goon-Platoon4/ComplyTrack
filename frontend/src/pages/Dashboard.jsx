


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

/* =========================================================
   DEMO DATA
   ========================================================= */
const ATTENTION_DATA = [
  { id: 1, contractor: "Botha & Sons Construction", doc: "COIDA Letter of Good Standing", expiry: "30 Sep 2026", status: "expired" },
  { id: 2, contractor: "SecureGuard Bloem (Pty) Ltd", doc: "Tax Compliance Status PIN", expiry: "2 Oct 2026", status: "expiring" },
  { id: 3, contractor: "Rose City Cleaning Services", doc: "Public liability insurance", expiry: "4 Oct 2026", status: "missing" },
];

const COVERAGE_DATA = [
  { type: "Tax Compliance Status PIN", valid: 18, required: 20 },
  { type: "COIDA Letter of Good Standing", valid: 15, required: 20 },
  { type: "B-BBEE sworn affidavit", valid: 12, required: 20 },
  { type: "Public liability insurance", valid: 20, required: 20 },
];

const ACTIVITY_DATA = [
  { user: "TN", text: "Uploaded document for Mokoena Electrical", time: "2 hours ago" },
  { user: "SY", text: "Sent reminder for 7-day expiry", time: "5 hours ago" },
  { user: "LD", text: "Changed role of P. Nel to Viewer", time: "Yesterday" },
];

const TREND_DATA = [
  { month: "May", height: 65 },
  { month: "Jun", height: 70 },
  { month: "Jul", height: 75 },
  { month: "Aug", height: 80 },
  { month: "Sep", height: 85 },
  { month: "Oct", height: 92 },
];


export default function Dashboard() {
  return (
    <section className="page dashboard-blueprint pb-12">
      
      {/* 1. PAGE HEADER */}
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

      {/* 2. SUMMARY STAT CARDS */}
      <div className="stats-grid">
        <StatCard label="Compliant" value="18" helper="Contractors with all required documents valid" status="good" icon={CheckCircle2} trend="↑ 12% vs last month" />
        <StatCard label="Expiring soon" value="4" helper="Contractors with documents expiring within 30 days" status="warning" icon={Clock3} trend="2 require attention" />
        <StatCard label="Expired" value="3" helper="Contractors with expired required documents" status="danger" icon={AlertTriangle} trend="↑ 1 since yesterday" />
        <StatCard label="Missing" value="2" helper="Contractors missing required documents" status="neutral" icon={FileWarning} trend="Connect missing-document checks" />
      </div>

      {/* We will use lg:col-span-2 for the wide panels */}
      <div className="dashboard-grid">
        
        {/* ROW 1: Wide + Narrow */}

        {/* 3. NEEDS ATTENTION TABLE (Wide) */}
        <div className="panel blueprint-panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h2><AlertTriangle size={18} /> Needs attention</h2>
              <p>Contractors and documents that require follow-up.</p>
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
                {ATTENTION_DATA.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td><strong>{row.contractor}</strong></td>
                    <td>{row.doc}</td>
                    <td>{row.expiry}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      <Link to={`/contractors/${row.id}`} className="table-action">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. COMPLIANCE TREND (Narrow) */}
        <div className="panel blueprint-panel">
          <div className="panel-header">
            <div>
              <h2><Activity size={18} /> Compliance trend</h2>
              <p>Compliance performance over the last six months.</p>
            </div>
          </div>
          
          <div className="mini-chart mt-6 flex items-end gap-2 sm:gap-4 h-48">
            {TREND_DATA.map((item, i) => (
              <div key={item.month} className="chart-col group flex-1 flex flex-col items-center justify-end h-full">
                <div 
                  className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[var(--navy)] to-[var(--teal-2)] opacity-80 group-hover:opacity-100 transition-all duration-300 animate-rise-up"
                  style={{ height: `${item.height}%`, animationDelay: `${i * 100}ms` }}
                ></div>
                <span className="mt-3 text-xs font-semibold text-slate-500 group-hover:text-[var(--navy)] transition-colors">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: Wide + Narrow */}

        {/* 5. RECENT ACTIVITY (Wide) */}
        <div className="panel blueprint-panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h2><Activity size={18} /> Recently updated</h2>
              <p>Latest contractor and document activity.</p>
            </div>
            <Link to="/audit-log" className="link-button">
              View audit log <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="activity-list">
            {ACTIVITY_DATA.map((act, i) => (
              <div key={i} className="activity-row">
                <div className="activity-avatar">{act.user}</div>
                <div>
                  <strong>{act.text}</strong>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. DOCUMENT COVERAGE (Narrow) */}
        <div className="panel blueprint-panel">
          <div className="panel-header">
            <div>
              <h2><FileCheck2 size={18} /> Document coverage</h2>
              <p>Required documents currently valid.</p>
            </div>
          </div>
          <div className="coverage-list mt-4">
            {COVERAGE_DATA.map((item, i) => (
              <div key={item.type} className="coverage-row">
                <div>
                  <span>{item.type}</span>
                  <strong>{item.valid} / {item.required}</strong>
                </div>
                <div className="progress">
                  <span 
                    className="animate-fill-bar"
                    style={{ 
                      '--target-width': `${(item.valid / item.required) * 100}%`,
                      animationDelay: `${i * 150}ms` 
                    }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3: Full Width */}
        
        {/* 7. REMINDERS (Wide) */}
        <div className="panel blueprint-panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h2><BellRing size={18} className="animate-pulse text-[var(--teal-2)]" /> Reminders</h2>
              <p>Document expiry reminder status.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <strong className="block text-slate-800 text-lg">3 reminders scheduled</strong>
              <span className="text-slate-500 text-sm">Next run: Tomorrow at 08:00</span>
            </div>
            <Link to="/settings" className="secondary-button mt-3 sm:mt-0 inline-block">
              Configure reminders
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
