import { ArrowLeft, Building2, Download, Filter, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  ["TOTAL CONTRACTORS", "XX", "Active contractor records"],
  ["COMPLIANT", "XX", "Fully compliant contractors"],
  ["EXPIRING SOON", "XX", "Require attention"],
  ["NON-COMPLIANT", "XX", "Expired or missing documents"],
];

const rows = ["Construction", "Electrical", "Security"];

export default function Contractors() {
  return (
    <section className="mx-auto max-w-[1600px] space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <BlueprintLabel text="Blueprint · Contractor Management" />
      <BackLink />

      <header className="flex flex-col gap-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">01</span>
          <div className="mt-2 flex items-start gap-3">
            <Users size={27} className="mt-1 text-slate-600" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Contractors</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage contractor profiles, compliance records, documents and contract information.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"><Download size={16} /> Export</button>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-teal-700 text-white hover:bg-teal-800"><Plus size={16} /> Add Contractor</button>
        </div>
      </header>

      <BlueprintPanel number="02" title="Contractor Overview" description="High-level information about the organisation's contractor population." icon={Building2}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, helper]) => <div key={label} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="text-[10px] font-bold tracking-[0.12em] text-slate-500">{label}</span>
            <strong className="mt-2 block text-2xl font-extrabold">{value}</strong>
            <small className="mt-1 block text-xs text-slate-500">{helper}</small>
          </div>)}
        </div>
      </BlueprintPanel>

      <BlueprintPanel number="03" title="Search & Filters" description="Allow users to quickly find contractors and narrow the results by compliance criteria." icon={Filter}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-400"><Search size={17} /> Search contractor name, registration number, contact person or email...</div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">All statuses</div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">All service categories</div>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"><Filter size={16} /> Advanced Filters</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {['Status = Expiring Soon', 'Category = Construction', 'Works On Site = Yes'].map((tag) => <span key={tag} className="rounded-full border border-dashed border-slate-300 px-3 py-1.5">Example: {tag}</span>)}
        </div>
      </BlueprintPanel>

      <BlueprintPanel number="04" title="Contractor List" description="The primary contractor management table." icon={MoreHorizontal}>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_1fr_0.9fr_0.7fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <span>Contractor</span><span>Registration</span><span>Contact</span><span>Category</span><span>Documents</span><span>Next Expiry</span><span>Status</span><span>Actions</span>
            </div>
            {rows.map((category, index) => <div key={category} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_1fr_0.9fr_0.7fr] gap-3 border-b border-slate-100 px-4 py-4 text-xs last:border-b-0">
              <div><strong className="block text-sm">Contractor Name</strong><small className="text-slate-400">contractor@email.com</small></div>
              <span className="text-slate-600">REG-XXXXXX</span><span>Contact person</span><span>{category}</span><span>X / X</span><span>DD / MM / YYYY</span><span className="font-semibold text-slate-500">STATUS</span><Link className="font-semibold text-teal-700" to={`/contractors/${index + 1}`}>View</Link>
            </div>)}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Pagination: page X of Y</span><div className="flex gap-2"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 px-3 py-2">Previous</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 px-3 py-2">Next</button></div>
        </div>
      </BlueprintPanel>

      <BlueprintNotes items={[
        "Add Contractor should open a validated contractor creation form.",
        "Search and filters should eventually query the backend rather than demo data.",
        "Contractor status should be derived from authoritative document compliance data.",
        "Rows should link to the contractor details page.",
        "Export should use the selected filters and current result set.",
      ]} />
    </section>
  );
}

function BlueprintLabel({ text }) { return <div className="inline-flex rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{text}</div>; }
function BackLink() { return <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft size={15} /> Back to Dashboard</Link>; }
function BlueprintPanel({ number, title, description, icon: Icon, children }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">{number}</span><h2 className="mt-1 text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div><Icon size={21} className="shrink-0 text-slate-400" /></div>{children}</section>; }
function BlueprintNotes({ items }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><strong className="text-sm">Development notes</strong><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
