
import { useMemo, useState } from "react";
import {
  FileCheck2,
  Plus,
  Search,
  Pencil,
  ShieldCheck,
  Clock3,
  FileWarning,
  X,
  CheckCircle2,
  AlertCircle,
  Power,
  ClipboardList,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const initialRules = [
  {
    id: 1,
    name: "Tax Compliance Status PIN",
    category: "Tax",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 2,
    name: "COIDA Letter of Good Standing",
    category: "Health & Safety",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 3,
    name: "B-BBEE Certificate / Affidavit",
    category: "Business Compliance",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 4,
    name: "Public Liability Insurance",
    category: "Insurance",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 5,
    name: "OHS Act s37(2) Agreement",
    category: "Health & Safety",
    required: true,
    expiryTracked: false,
    reminderDays: 0,
    active: true,
  },
];

const categories = [
  "Tax",
  "Health & Safety",
  "Business Compliance",
  "Insurance",
  "Company Registration",
  "Other",
];

const emptyForm = {
  name: "",
  category: "Tax",
  required: true,
  expiryTracked: true,
  reminderDays: "30",
};

function StatCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${colors[color]}`}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>
      </div>
    </article>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RequirementPill({ required }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
        required
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

function Toggle({ checked, onChange, title, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>

        <span className="mt-1.5 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors
          after:absolute after:left-1 after:top-1 after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow-sm after:transition-transform
          peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-teal-100
          ${
            checked
              ? "bg-teal-600 after:translate-x-5"
              : "bg-slate-300"
          }`}
      />
    </label>
  );
}

function RuleForm({
  form,
  setForm,
  editingId,
  onSave,
  onCancel,
  error,
}) {
  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <form
      onSubmit={onSave}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {editingId === null ? <Plus size={22} /> : <Pencil size={20} />}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingId === null ? "Add document rule" : "Edit document rule"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Define the document requirement and how its expiry should be
              managed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close rule form"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-7 p-6 sm:p-8">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2.5 block text-sm font-semibold text-slate-700">
              Document name <span className="text-red-500">*</span>
            </span>

            <input
              autoFocus
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Professional indemnity insurance"
              maxLength={120}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-sm font-semibold text-slate-700">
              Category <span className="text-red-500">*</span>
            </span>

            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 sm:px-6">
          <div className="border-b border-slate-200">
            <Toggle
              title="Required document"
              description="Contractors must provide this document to meet the configured requirement."
              checked={form.required}
              onChange={(value) => update("required", value)}
            />
          </div>

          <Toggle
            title="Track expiry date"
            description="Use the document's expiry date to identify upcoming renewals and expired documents."
            checked={form.expiryTracked}
            onChange={(value) => update("expiryTracked", value)}
          />
        </div>

        <div className="max-w-xl">
          <label className="block">
            <span className="mb-2.5 block text-sm font-semibold text-slate-700">
              Expiry reminder period
            </span>

            <div className="relative">
              <Clock3
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="number"
                min="1"
                max="365"
                step="1"
                disabled={!form.expiryTracked}
                value={form.reminderDays}
                onChange={(event) =>
                  update("reminderDays", event.target.value)
                }
                required={form.expiryTracked}
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-28 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                days before
              </span>
            </div>

            <span className="mt-2.5 block text-sm leading-6 text-slate-500">
              {form.expiryTracked
                ? "Choose how many days before expiry a reminder should be scheduled."
                : "Enable expiry tracking to configure reminders."}
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20"
        >
          <CheckCircle2 size={17} />
          {editingId === null ? "Create rule" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default function DocumentRules() {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const stats = useMemo(
    () => [
      {
        title: "Total rules",
        value: rules.length,
        description: "All configured requirements",
        icon: ClipboardList,
        color: "blue",
      },
      {
        title: "Active rules",
        value: rules.filter((rule) => rule.active).length,
        description: "Currently enabled rules",
        icon: ShieldCheck,
        color: "teal",
      },
      {
        title: "Required rules",
        value: rules.filter((rule) => rule.active && rule.required).length,
        description: "Active mandatory documents",
        icon: FileCheck2,
        color: "violet",
      },
      {
        title: "Expiry tracked",
        value: rules.filter((rule) => rule.active && rule.expiryTracked).length,
        description: "Active rules with expiry tracking",
        icon: Clock3,
        color: "amber",
      },
    ],
    [rules]
  );

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rules
      .filter((rule) => {
        const matchesSearch =
          rule.name.toLowerCase().includes(query) ||
          rule.category.toLowerCase().includes(query);

        const matchesStatus =
          filter === "all" ||
          (filter === "active" && rule.active) ||
          (filter === "inactive" && !rule.active) ||
          (filter === "required" && rule.required);

        const matchesCategory =
          categoryFilter === "all" || rule.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rules, search, filter, categoryFilter]);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  }

  function openNewRule() {
    resetForm();
    setMessage("");
    setShowForm(true);
  }

  function openEditRule(rule) {
    setEditingId(rule.id);

    setForm({
      name: rule.name,
      category: categories.includes(rule.category)
        ? rule.category
        : "Other",
      required: rule.required,
      expiryTracked: rule.expiryTracked,
      reminderDays: String(rule.reminderDays || 30),
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function saveRule(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const name = form.name.trim();
    const category = form.category.trim();
    const reminderDays = Number(form.reminderDays);

    if (!name || !category) {
      setError("Please enter a document name and select a category.");
      return;
    }

    if (name.length > 120) {
      setError("The document name must be 120 characters or fewer.");
      return;
    }

    if (
      form.expiryTracked &&
      (!Number.isInteger(reminderDays) ||
        reminderDays < 1 ||
        reminderDays > 365)
    ) {
      setError("The reminder period must be a whole number between 1 and 365.");
      return;
    }

    const duplicate = rules.some(
      (rule) =>
        rule.name.trim().toLowerCase() === name.toLowerCase() &&
        rule.id !== editingId
    );

    if (duplicate) {
      setError("A rule with this document name already exists.");
      return;
    }

    const ruleData = {
      name,
      category,
      required: form.required,
      expiryTracked: form.expiryTracked,
      reminderDays: form.expiryTracked ? reminderDays : 0,
    };

    if (editingId !== null) {
      setRules((current) =>
        current.map((rule) =>
          rule.id === editingId ? { ...rule, ...ruleData } : rule
        )
      );

      setMessage("Document rule updated successfully.");
    } else {
      setRules((current) => {
        const nextId =
          current.reduce((maxId, rule) => Math.max(maxId, rule.id), 0) + 1;

        return [...current, { id: nextId, ...ruleData, active: true }];
      });

      setMessage("Document rule created successfully.");
    }

    setShowForm(false);
    resetForm();
  }

  function toggleRule(id) {
    const rule = rules.find((item) => item.id === id);

    if (!rule) return;

    if (
      rule.active &&
      !window.confirm(
        `Disable "${rule.name}"? The rule will remain in the list but will be marked inactive.`
      )
    ) {
      return;
    }

    setRules((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );

    setMessage(
      rule.active
        ? `"${rule.name}" has been disabled.`
        : `"${rule.name}" has been enabled.`
    );

    setError("");
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setCategoryFilter("all");
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1800px] space-y-7 px-4 pb-10 pt-5 sm:space-y-8 sm:px-6 sm:pt-7 lg:px-8 xl:px-10">
      {/* Page heading */}
      <div className="space-y-5">
        <PageHeader
          eyebrow="Administration"
          title="Document rules"
          description="Define the documents contractors must provide and how expiry warnings are handled."
          actions={
            <button
              type="button"
              onClick={openNewRule}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20"
            >
              <Plus size={18} />
              Add document rule
            </button>
          }
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Success message */}
      {message && !showForm && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

          <span className="flex-1">{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
            className="rounded-lg p-1 hover:bg-emerald-100"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Add/edit form */}
      {showForm && (
        <RuleForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSave={saveRule}
          onCancel={closeForm}
          error={error}
        />
      )}

      {/* Rules management */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table heading */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Configured requirements
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Search, filter, edit and manage your document rules.
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600">
            {filteredRules.length} of {rules.length} rules
          </span>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-[minmax(240px,1fr)_180px_210px_auto]">
          <label className="relative block min-w-0">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search document name or category..."
              aria-label="Search document rules"
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter by rule status"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="required">Required</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          >
            <option value="all">All categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <RotateCcw size={16} />
            Reset filters
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden min-w-0 overflow-x-auto lg:block">
          <table className="w-full min-w-275 table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {[
                  "Document",
                  "Category",
                  "Requirement",
                  "Expiry tracking",
                  "Reminder",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 first:pl-7 last:pr-7"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-5 align-middle first:pl-7">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <FileCheck2 size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="wrap-break-word text-sm font-semibold leading-6 text-slate-800">
                          {rule.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Rule #{rule.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="wrap-break-word px-4 py-5 text-sm leading-6 text-slate-600">
                    {rule.category}
                  </td>

                  <td className="px-4 py-5">
                    <RequirementPill required={rule.required} />
                  </td>

                  <td className="px-4 py-5">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                      {rule.expiryTracked ? (
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-teal-600"
                        />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                      )}

                      {rule.expiryTracked ? "Tracked" : "Not tracked"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-600">
                    {rule.expiryTracked ? `${rule.reminderDays} days` : "—"}
                  </td>

                  <td className="px-4 py-5">
                    <StatusPill active={rule.active} />
                  </td>

                  <td className="px-4 py-5 last:pr-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditRule(rule)}
                        aria-label={`Edit ${rule.name}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        aria-label={`${rule.active ? "Disable" : "Enable"} ${rule.name}`}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                          rule.active
                            ? "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <Power size={14} />
                        {rule.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-7 py-20 text-center">
                    <Search
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      No matching document rules
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Try another search term or clear your filters.
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile and tablet rule cards */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {filteredRules.map((rule) => (
            <article
              key={rule.id}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <FileCheck2 size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-word text-sm font-bold leading-6 text-slate-900 sm:text-base">
                    {rule.name}
                  </h3>

                  <p className="mt-1.5 text-sm text-slate-500">
                    {rule.category} · Rule #{rule.id}
                  </p>

                  <div className="mt-3">
                    <StatusPill active={rule.active} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Requirement
                  </p>

                  <div className="mt-2">
                    <RequirementPill required={rule.required} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Expiry tracking
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {rule.expiryTracked
                      ? `${rule.reminderDays}-day reminder`
                      : "Not tracked"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openEditRule(rule)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={15} />
                  Edit rule
                </button>

                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Power size={15} />
                  {rule.active ? "Disable rule" : "Enable rule"}
                </button>
              </div>
            </article>
          ))}

          {filteredRules.length === 0 && (
            <div className="px-6 py-16 text-center">
              <FileWarning
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-semibold text-slate-800">
                No matching rules
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Adjust your search or filters to see more results.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-teal-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Table footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredRules.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {rules.length}
            </span>{" "}
            rules
          </p>

          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            Manage organisation settings
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Help panel */}
      <aside className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <AlertCircle size={20} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            How document rules work
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Active rules define the requirements the application should apply
            when checking contractor documents. Required rules identify
            mandatory documents, while expiry tracking supports renewal
            monitoring. The backend must enforce these rules for them to affect
            actual compliance results.
          </p>
        </div>
      </aside>
    </section>
  );
}
