import { ArrowLeft, BarChart3, Database, Download, FileBarChart2, FileDown, Filter, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const columns = ["Contractor", "Tax PIN", "COIDA", "B-BBEE", "Liability", "OHS s37(2)", "Overall"];

export default function Reports() {
  return (
    <section className="mx-auto max-w-[1600px] space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <BlueprintLabel text="Blueprint · Compliance Reports" />
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft size={15} /> Back to Dashboard</Link>

      <header className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">01 · Reporting workspace</span><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Compliance Reports</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Define filters, report data, compliance status presentation and export behaviour.</p></div><BarChart3 size={28} className="text-slate-400" /></div></header>

      <BlueprintPanel number="02" title="Report Filters" description="Controls that determine the reporting scope." icon={Filter}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Report type" value="Compliance Overview" /><Field label="Status" value="All statuses" /><Field label="Category" value="All categories" /><Field label="Date range" value="DD / MM / YYYY → DD / MM / YYYY" /></div>
        <div className="mt-4 flex justify-end"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-teal-700 text-white hover:bg-teal-800">Generate Report</button></div>
      </BlueprintPanel>

      <BlueprintPanel number="03" title="Report Preview" description="The report preview displayed before the user exports or downloads it." icon={FileBarChart2}>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["REPORT TYPE", "Compliance Overview"], ["REPORT DATE", "DD / MM / YYYY"], ["CONTRACTORS", "XX"], ["DOCUMENTS", "XX"]].map(([label, value]) => <div key={label} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"><span className="text-[10px] font-bold tracking-[0.12em] text-slate-500">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><div className="min-w-[900px]"><div className="grid grid-cols-7 gap-3 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{columns.map((column) => <span key={column}>{column}</span>)}</div>{[1,2,3].map((row) => <div key={row} className="grid grid-cols-7 gap-3 border-t border-slate-100 px-4 py-4 text-xs"><span>Contractor name</span><span>STATUS</span><span>STATUS</span><span>STATUS</span><span>STATUS</span><span>Required / N/A</span><span>STATUS</span></div>)}</div></div>
        <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"><FileDown size={16} /> Export CSV</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-teal-700 text-white hover:bg-teal-800"><Download size={16} /> Export PDF</button></div>
      </BlueprintPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <BlueprintPanel number="04" title="Report Data Flow" description="Where report information should come from." icon={Database}>
          <Flow items={["React Reports Page", "GET /api/reports/...", "Express Report Controller", "PostgreSQL / Neon", "Report Data"]} />
        </BlueprintPanel>
        <BlueprintPanel number="05" title="Export Workflow" description="How users should obtain a generated report." icon={Download}>
          <div className="grid gap-3 sm:grid-cols-2">{[[1,"Select filters","User defines reporting scope."],[2,"Generate report","Backend retrieves relevant data."],[3,"Preview","User reviews the report."],[4,"Export","Generate CSV or PDF."]].map(([n,title,desc]) => <div key={n} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"><span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-xs font-bold">{n}</span><strong className="mt-3 block text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-slate-500">{desc}</small></div>)}</div>
        </BlueprintPanel>
      </div>

      <BlueprintPanel number="06" title="Audit & Security Considerations" description="Important behaviour for the eventual production reporting system." icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["DATA ACCESS","Only authorised users can generate reports."],["FILTER VALIDATION","Backend validates report parameters."],["AUDIT TRAIL","Report generation can be recorded."],["DATA ACCURACY","Reports use current database compliance state."]].map(([label,value]) => <Field key={label} label={label} value={value} />)}</div>
      </BlueprintPanel>

      <BlueprintNotes items={[
        "Report filters should eventually be connected to the backend API.",
        "Report results should come from PostgreSQL rather than frontend demo data.",
        "Compliance status should be calculated consistently with the dashboard and contractor pages.",
        "CSV export can be implemented before PDF export because it is simpler to validate.",
        "PDF generation should eventually produce an audit-friendly document containing the report date, filters and organisation information.",
        "Do not allow the frontend to decide whether a contractor is compliant; the backend should provide the authoritative status.",
        "The report page should eventually support pagination when an organisation has a large number of contractors.",
      ]} />
    </section>
  );
}

function BlueprintLabel({ text }) { return <div className="inline-flex rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{text}</div>; }
function BlueprintPanel({ number, title, description, icon: Icon, children }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">{number}</span><h2 className="mt-1 text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div><Icon size={21} className="shrink-0 text-slate-400" /></div>{children}</section>; }
function Field({ label, value }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span><strong className="mt-1 block text-xs leading-5 text-slate-700">{value}</strong></div>; }
function Flow({ items }) { return <div className="space-y-1 text-center">{items.map((item, i) => <div key={item}><div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold">{item}</div>{i < items.length - 1 && <div className="py-1 text-slate-400">↓</div>}</div>)}</div>; }
function BlueprintNotes({ items }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><strong className="text-sm">Development notes</strong><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
