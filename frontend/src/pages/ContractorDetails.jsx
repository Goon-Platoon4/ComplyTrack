import {
  ArrowLeft,
  Bell,
  Building2,
  Edit3,
  FileText,
  History,
  MoreHorizontal,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const documents = ["Tax Compliance Status PIN", "COIDA Letter of Good Standing", "B-BBEE Certificate / Affidavit", "Public Liability Insurance", "OHS Act s37(2) Agreement"];

export default function ContractorDetails() {
  const { id } = useParams();

  return (
    <section className="mx-auto max-w-[1600px] space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <BlueprintLabel text="Blueprint · Contractor Details" />
      <Link to="/contractors" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft size={15} /> Back to Contractors</Link>

      <header className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600"><Building2 size={23} /></div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">01 · Contractor identity</span>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Contractor Name</h1>
              <p className="mt-2 text-sm text-slate-500">Registration REG-XXXXXX · Contractor ID {id || "X"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"><Edit3 size={16} /> Edit Contractor</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-teal-700 text-white hover:bg-teal-800"><Upload size={16} /> Upload Document</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 px-3"><MoreHorizontal size={17} /></button></div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <BlueprintPanel number="02" title="Contractor Profile" description="Core information stored against the contractor record." icon={UserRound}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Legal name", "Contractor Name"], ["Registration number", "REG-XXXXXX"], ["Contact person", "Contact person"],
              ["Email", "contractor@email.com"], ["Phone", "+27 XX XXX XXXX"], ["Service category", "Construction"],
              ["Works on site", "Yes / No"], ["Contract start", "DD / MM / YYYY"], ["Contract end", "DD / MM / YYYY"],
            ].map(([label, value]) => <Field key={label} label={label} value={value} />)}
          </div>
        </BlueprintPanel>

        <BlueprintPanel number="03" title="Compliance Summary" description="Overall compliance state should be calculated from documents." icon={ShieldCheck}>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Overall status</span><strong className="mt-2 block text-xl font-extrabold text-slate-600">STATUS</strong><p className="mt-1 text-xs text-slate-500">Backend-authoritative compliance result</p></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><MiniStat label="Documents" value="X / X" /><MiniStat label="Expiring" value="X" /><MiniStat label="Expired" value="X" /><MiniStat label="Missing" value="X" /></div>
        </BlueprintPanel>
      </div>

      <BlueprintPanel number="04" title="Compliance Documents" description="The complete document set required for this contractor." icon={FileText}>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><div className="min-w-[850px]">
          <div className="grid grid-cols-[1.6fr_0.9fr_1fr_0.9fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><span>Document</span><span>Status</span><span>Expiry</span><span>Version</span><span>Action</span></div>
          {documents.map((document) => <div key={document} className="grid grid-cols-[1.6fr_0.9fr_1fr_0.9fr_0.8fr] gap-3 border-t border-slate-100 px-4 py-4 text-xs"><strong>{document}</strong><span className="font-semibold text-slate-500">STATUS</span><span>DD / MM / YYYY</span><span>vX</span><span className="font-semibold text-teal-700">View</span></div>)}
        </div></div>
      </BlueprintPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <BlueprintPanel number="05" title="Reminder Workflow" description="How upcoming document expiry should trigger action." icon={Bell}>
          <div className="space-y-3">{["Document reaches reminder threshold", "System creates or queues reminder", "Responsible user receives notification", "Reminder is recorded for audit history"].map((step, i) => <FlowStep key={step} number={i + 1} title={step} />)}</div>
        </BlueprintPanel>
        <BlueprintPanel number="06" title="Audit History" description="Track important changes to the contractor and document record." icon={History}>
          <div className="space-y-3">{["Contractor record created", "Document uploaded or replaced", "Compliance status changed", "Reminder or action recorded"].map((event) => <div key={event} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">{event} · <span className="text-slate-400">timestamp / user</span></div>)}</div>
        </BlueprintPanel>
      </div>

      <BlueprintNotes items={[
        "Contractor data should eventually load from GET /api/contractors/:id.",
        "Upload Document should navigate to the document upload workflow for this contractor.",
        "Compliance status must be calculated consistently across dashboard, contractors and reports.",
        "Document history and audit events should come from the backend rather than placeholder values.",
      ]} />
    </section>
  );
}

function BlueprintLabel({ text }) { return <div className="inline-flex rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{text}</div>; }
function BlueprintPanel({ number, title, description, icon: Icon, children }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">{number}</span><h2 className="mt-1 text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div><Icon size={21} className="shrink-0 text-slate-400" /></div>{children}</section>; }
function Field({ label, value }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span><strong className="mt-1 block text-sm text-slate-700">{value}</strong></div>; }
function MiniStat({ label, value }) { return <div className="rounded-lg border border-slate-200 p-3"><span className="text-[10px] text-slate-400">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>; }
function FlowStep({ number, title }) { return <div className="flex gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 text-[10px] font-bold">{number}</span><span className="text-xs font-semibold text-slate-700">{title}</span></div>; }
function BlueprintNotes({ items }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><strong className="text-sm">Development notes</strong><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
