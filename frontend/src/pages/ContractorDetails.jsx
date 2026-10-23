import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  History,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { contractors, getComplianceStatus, requiredDocuments } from "../data/contractors";

export default function ContractorDetails() {
  const { id } = useParams();
  const contractor = contractors.find(
    (item) => item.id === id || item.id === `CNT-${id.padStart(3, "0")}`
  );

  if (!contractor) {
    return (
      <section className="page">
        <Link to="/contractors" className="link-button mb-5">
          <ArrowLeft size={15} />
          Back to contractors
        </Link>
        <div className="panel">
          <h1 className="text-xl font-bold">Contractor not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            There is no contractor record matching this ID.
          </p>
        </div>
      </section>
    );
  }

  const counts = contractor.documents.reduce(
    (result, document) => {
      result[document.status] = (result[document.status] || 0) + 1;
      return result;
    },
    {}
  );
  const validCount = counts.Valid || 0;
  const complianceScore = Math.round((validCount / requiredDocuments.length) * 100);
  const status = getComplianceStatus(contractor);

  return (
    <section className="page space-y-5">
      <Link to="/contractors" className="link-button">
        <ArrowLeft size={15} />
        Back to contractors
      </Link>

      <div className="panel">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--teal)]">
              <Building2 size={23} />
            </div>
            <div className="min-w-0">
              <div className="eyebrow">Contractor profile</div>
              <h1 className="break-words text-2xl font-bold tracking-tight">{contractor.name}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Registration {contractor.regNo} <span className="mx-2">·</span> ID {contractor.id}
              </p>
              <div className="mt-3">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
          <Link to={`/contractors/${contractor.id}/upload`} className="primary-button shrink-0">
            <Upload size={16} />
            Upload document
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><UserRound size={17} /> Contractor information</h2>
              <p>Company and primary contact details.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoField label="Company name" value={contractor.name} />
            <InfoField label="Registration number" value={contractor.regNo} />
            <InfoField label="Service category" value={contractor.category} />
            <InfoField label="Contact person" value={contractor.contactPerson} />
            <InfoField label="Email" value={contractor.email} icon={Mail} />
            <InfoField label="Phone" value={contractor.phone} icon={Phone} />
            <InfoField label="Works on site" value={contractor.worksOnSite ? "Yes" : "No"} />
            <InfoField label="Contract start" value={contractor.contractStart} icon={CalendarDays} />
            <InfoField label="Contract end" value={contractor.contractEnd} icon={CalendarDays} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><ShieldCheck size={17} /> Compliance score</h2>
              <p>Based on required documents currently valid.</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-end justify-between gap-3">
              <strong className="text-4xl font-extrabold tracking-tight text-[var(--navy)]">{complianceScore}%</strong>
              <span className="pb-1 text-sm text-slate-500">{validCount} of {requiredDocuments.length} valid</span>
            </div>
            <div
              className="progress mt-4"
              role="progressbar"
              aria-label="Compliance score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={complianceScore}
            >
              <span style={{ width: `${complianceScore}%` }} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Expiring soon" value={counts["Expiring soon"] || 0} icon={Clock3} />
            <MiniStat label="Expired" value={counts.Expired || 0} icon={FileCheck2} />
            <MiniStat label="Missing" value={counts.Missing || 0} icon={FileText} />
            <MiniStat label="Overall status" value={status} icon={CheckCircle2} />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2><FileCheck2 size={17} /> Required documents</h2>
            <p>Document validity and renewal dates for this contractor.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Issued</th>
                <th>Expiry</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {contractor.documents.map((document) => (
                <tr key={document.name}>
                  <td><strong>{document.name}</strong></td>
                  <td><StatusBadge status={document.status} /></td>
                  <td>{document.reference || "—"}</td>
                  <td>{document.issued || "—"}</td>
                  <td>{document.expiry || "—"}</td>
                  <td>{document.file || "Not uploaded"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><History size={17} /> Activity</h2>
              <p>Recent updates to this contractor record.</p>
            </div>
          </div>
          {contractor.activity.length ? (
            <div className="activity-list">
              {contractor.activity.map((item) => (
                <div key={`${item.action}-${item.date}`} className="activity-row">
                  <div className="activity-avatar">{item.user === "System" ? "SY" : initials(item.user)}</div>
                  <div>
                    <strong>{item.action}</strong>
                    <span>{item.user} · {item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No activity has been recorded for this contractor.</EmptyState>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><Bell size={17} /> Reminder history</h2>
              <p>Sent and scheduled document expiry reminders.</p>
            </div>
          </div>
          {contractor.reminders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Sent</th>
                    <th>Due</th>
                    <th>Channel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contractor.reminders.map((reminder) => (
                    <tr key={`${reminder.document}-${reminder.sent}`}>
                      <td><strong>{reminder.document}</strong></td>
                      <td>{reminder.sent}</td>
                      <td>{reminder.due}</td>
                      <td>{reminder.channel}</td>
                      <td><StatusBadge status={reminder.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No reminders have been sent or scheduled.</EmptyState>
          )}
        </section>
      </div>
    </section>
  );
}

function InfoField({ label, value, icon: Icon }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700">
        {Icon && <Icon size={15} className="shrink-0 text-slate-400" />}
        <span className="break-all">{value}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={14} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <strong className="mt-2 block text-base">{value}</strong>
    </div>
  );
}

function EmptyState({ children }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{children}</p>;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
