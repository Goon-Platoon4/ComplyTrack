import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Database, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function UploadDocument() {
  const { id } = useParams();

  return (
    <section className="mx-auto max-w-[1200px] space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <BlueprintLabel text="Blueprint · Document Upload" />
      <Link to={`/contractors/${id || "1"}`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft size={15} /> Back to Contractor</Link>

      <header className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">01 · Upload workflow</span>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Upload Compliance Document</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Define the fields, validation rules and backend flow required to store a contractor compliance document.</p>
      </header>

      <BlueprintPanel number="02" title="Document Information" description="Metadata required before a file can be stored." icon={FileText}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contractor" value="Contractor Name · REG-XXXXXX" />
          <Field label="Document type" value="Select required document type" />
          <Field label="Issue date" value="DD / MM / YYYY" icon={CalendarDays} />
          <Field label="Expiry date" value="DD / MM / YYYY" icon={CalendarDays} />
        </div>
      </BlueprintPanel>

      <BlueprintPanel number="03" title="File Upload" description="The upload area should accept the supported compliance document formats." icon={UploadCloud}>
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12"><UploadCloud size={34} className="mx-auto text-slate-400" /><strong className="mt-3 block text-sm">Drag and drop file here</strong><span className="mt-1 block text-xs text-slate-500">or choose a file from the user's device</span><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-teal-700 text-white hover:bg-teal-800 mt-5">Choose File</button><p className="mt-4 text-[11px] text-slate-400">Define allowed file types, maximum size and virus/security checks during implementation.</p></div>
      </BlueprintPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <BlueprintPanel number="04" title="Validation Rules" description="Rules that must be checked before accepting the document." icon={ShieldCheck}>
          <div className="space-y-2">{[
            "Document type is required.", "Expiry date is required when applicable.", "File type and file size are validated.", "The contractor exists and the user is authorised.", "Duplicate or replacement behaviour is defined.",
          ].map((rule) => <div key={rule} className="flex gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600"><CheckCircle2 size={15} className="shrink-0 text-teal-700" />{rule}</div>)}</div>
        </BlueprintPanel>
        <BlueprintPanel number="05" title="Backend / Storage Flow" description="The expected path from browser to persistent storage." icon={Database}>
          <div className="space-y-2 text-center">{["React upload form", "POST /api/documents", "Express controller + validation", "File storage + PostgreSQL metadata", "Updated compliance state"].map((step, i, all) => <div key={step}><div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700">{step}</div>{i < all.length - 1 && <div className="py-1 text-slate-400">↓</div>}</div>)}</div>
        </BlueprintPanel>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><div className="flex gap-3"><AlertTriangle size={17} className="shrink-0" /><div><strong>Security consideration</strong><p className="mt-1 leading-5">Do not treat a successful browser upload as proof of compliance. The backend must validate the document metadata and enforce authorisation before persistence.</p></div></div></div>

      <BlueprintNotes items={[
        "The final upload form should use controlled fields and clear validation messages.",
        "The backend should own document validation and compliance calculations.",
        "Storage implementation should be selected before the production upload endpoint is completed.",
        "A successful upload should create the document record and refresh the contractor compliance state.",
      ]} />
    </section>
  );
}

function BlueprintLabel({ text }) { return <div className="inline-flex rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{text}</div>; }
function BlueprintPanel({ number, title, description, icon: Icon, children }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">{number}</span><h2 className="mt-1 text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div><Icon size={21} className="shrink-0 text-slate-400" /></div>{children}</section>; }
function Field({ label, value, icon: Icon }) { return <div><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</span><div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-400">{Icon && <Icon size={16} />}{value}</div></div>; }
function BlueprintNotes({ items }) { return <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><strong className="text-sm">Development notes</strong><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
