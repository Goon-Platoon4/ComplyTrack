
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileDown,
  FileText,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const STATUSES = ["Compliant", "Expiring soon", "Expired", "Missing"];

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleDateString("en-ZA");
}

function statusStyle(status) {
  switch (status?.toLowerCase()) {
    case "compliant":
      return "bg-emerald-100 text-emerald-800";
    case "expiring soon":
      return "bg-amber-100 text-amber-800";
    case "expired":
      return "bg-rose-100 text-rose-800";
    case "missing":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default function Reports() {
  const [allContractors, setAllContractors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reportRows, setReportRows] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [contractors, documentRecords, totals] = await Promise.all([
        apiGet("/contractors"),
        apiGet("/documents"),
        apiGet("/reports/summary"),
      ]);

      setAllContractors(contractors);
      setDocuments(documentRecords);
      setSummary(totals);
      setReportRows(contractors);
      setGeneratedAt(new Date());
    } catch (err) {
      setError(
        `${err.message}. Check that the backend is running and connected to Neon.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(allContractors.map((item) => item.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [allContractors]
  );

  const documentCounts = useMemo(() => {
    const counts = {};

    for (const document of documents) {
      const id = String(document.contractor_id);
      counts[id] = (counts[id] || 0) + 1;
    }

    return counts;
  }, [documents]);

  async function generateReport(event) {
    event.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (category) params.set("category", category);

      const suffix = params.toString();
      const contractors = await apiGet(
        `/contractors${suffix ? `?${suffix}` : ""}`
      );

      // The current API doesn't offer expiry-date filters, so apply
      // those two filters to the returned contractor records here.
      const filtered = contractors.filter((contractor) => {
        const expiry = contractor.nextExpiry
          ? String(contractor.nextExpiry).slice(0, 10)
          : "";

        if (expiryFrom && (!expiry || expiry < expiryFrom)) return false;
        if (expiryTo && (!expiry || expiry > expiryTo)) return false;

        return true;
      });

      setReportRows(filtered);
      setGeneratedAt(new Date());
    } catch (err) {
      setError(`Unable to generate report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  function exportCsv() {
    const headings = [
      "Contractor",
      "Registration",
      "Category",
      "Contact",
      "Email",
      "Phone",
      "Status",
      "Next expiry",
      "Recorded documents",
    ];

    const rows = reportRows.map((contractor) => [
      contractor.name,
      contractor.registration,
      contractor.category,
      contractor.contact,
      contractor.email,
      contractor.phone,
      contractor.status,
      contractor.nextExpiry,
      documentCounts[String(contractor.id)] || 0,
    ]);

    const csv = [
      headings,
      ...rows,
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "complytrack-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const cards = [
    {
      label: "Total contractors",
      value: summary?.total ?? 0,
      icon: BarChart3,
      color: "text-slate-700",
    },
    {
      label: "Compliant",
      value: summary?.compliant ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-700",
    },
    {
      label: "Expiring soon",
      value: summary?.expiring_soon ?? 0,
      icon: Clock3,
      color: "text-amber-700",
    },
    {
      label: "Expired / Missing",
      value: (summary?.expired ?? 0) + (summary?.missing ?? 0),
      icon: AlertTriangle,
      color: "text-rose-700",
    },
  ];

  return (
    <section className="mx-auto max-w-[1600px] space-y-6 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
            Compliance reporting
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Compliance Reports
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Generate reports using contractor and document records from the
            database.
          </p>
        </div>

        <BarChart3 size={30} className="hidden text-teal-700 sm:block" />
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Overall compliance summary</h2>
          <p className="text-sm text-slate-500">
            Database-wide totals. These figures are independent of the filters
            applied to the report below.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {label}
                </span>
                <Icon size={19} className={color} />
              </div>
              <strong className="mt-2 block text-3xl font-extrabold">
                {loading ? "…" : value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Filter size={20} className="text-teal-700" />
          <div>
            <h2 className="text-lg font-bold">Report filters</h2>
            <p className="text-sm text-slate-500">
              Choose which contractor records to include.
            </p>
          </div>
        </div>

        <form onSubmit={generateReport}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-semibold text-slate-700">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, registration or contact"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Compliance status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-700"
              >
                <option value="">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-700"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Next expiry from
              <input
                type="date"
                value={expiryFrom}
                onChange={(event) => setExpiryFrom(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Next expiry to
              <input
                type="date"
                min={expiryFrom || undefined}
                value={expiryTo}
                onChange={(event) => setExpiryTo(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
              />
            </label>
          </div>

          <div className="no-print mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setCategory("");
                setExpiryFrom("");
                setExpiryTo("");
              }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>

            <button
              type="submit"
              disabled={loading || generating}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} />
              {generating ? "Generating…" : "Generate report"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Report preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              {reportRows.length} contractor record(s) match the generated report.
            </p>
            {generatedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Generated {generatedAt.toLocaleString("en-ZA")}
              </p>
            )}
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || reportRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FileDown size={16} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || reportRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              <Download size={16} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading report data…
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Contractor</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next expiry</th>
                  <th className="px-4 py-3">Documents</th>
                </tr>
              </thead>

              <tbody>
                {reportRows.map((contractor) => (
                  <tr
                    key={contractor.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        to={`/contractors/${contractor.id}`}
                        className="hover:text-teal-700 hover:underline"
                      >
                        {contractor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {contractor.registration || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {contractor.category || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {contractor.contact || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(contractor.status)}`}
                      >
                        {contractor.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(contractor.nextExpiry)}
                    </td>
                    <td className="px-4 py-3">
                      {documentCounts[String(contractor.id)] || 0}
                    </td>
                  </tr>
                ))}

                {reportRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      No contractors match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <FileText size={15} className="mt-0.5 shrink-0" />
          <p>
            Document counts include records currently stored in the database.
            The expiry filters use each contractor&apos;s next recorded expiry
            date. CSV export downloads the report data; PDF output uses your
            browser&apos;s print dialog.
          </p>
        </div>
      </section>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </section>
  );
}