import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const emptyForm = {
  documentTypeName: "",
  category: "Other",
  required: true,
  requiredForSiteWork: false,
  expiryTracked: true,
  reminderDays: "30",
};

function RuleStatus({ active }) {
  return (
    <span className={`document-rule-status ${active ? "active" : "inactive"}`}>
      <span aria-hidden="true" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RequirementStatus({ required }) {
  return (
    <span
      className={`document-rule-requirement ${required ? "required" : "optional"}`}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

function RuleForm({
  form,
  setForm,
  editingRule,
  onSave,
  onCancel,
  error,
  busy,
}) {
  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <form className="panel document-rule-form" onSubmit={onSave} aria-busy={busy}>
      <div className="document-rule-form-header">
        <div className="document-rule-form-title">
          <span className="document-rule-form-icon">
            {editingRule ? <Pencil size={20} /> : <Plus size={21} />}
          </span>
          <div>
            <h2>{editingRule ? "Edit document rule" : "Add document rule"}</h2>
            <p>
              Define which documents are required and how expiry should be
              managed.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="document-rule-close"
          onClick={onCancel}
          aria-label="Close rule form"
        >
          <X size={19} />
        </button>
      </div>

      <div className="document-rule-form-body">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="document-rule-fields">
          <label>
            <span>Document name</span>
            <input
              autoFocus
              required
              maxLength={150}
              value={form.documentTypeName}
              disabled={Boolean(editingRule)}
              onChange={(event) =>
                update("documentTypeName", event.target.value)
              }
              placeholder="e.g. Professional indemnity insurance"
            />
            {editingRule && (
              <small>
                Document names cannot be changed after a rule is created.
              </small>
            )}
          </label>
          <label>
            <span>Category</span>
            <input
              required
              maxLength={100}
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              placeholder="e.g. Insurance"
            />
          </label>
          <label>
            <span>Expiry reminder period</span>
            <span className="document-rule-reminder-input">
              <Clock3 size={17} aria-hidden="true" />
              <input
                type="number"
                min="0"
                max="365"
                step="1"
                disabled={!form.expiryTracked}
                value={form.reminderDays}
                onChange={(event) =>
                  update("reminderDays", event.target.value)
                }
                required={form.expiryTracked}
              />
              <span>days before</span>
            </span>
            <small>
              {form.expiryTracked
                ? "Set to 0 to turn off advance reminders."
                : "Enable expiry tracking to configure reminders."}
            </small>
          </label>
        </div>

        <div className="document-rule-options">
          <label className="document-rule-toggle-row">
            <span>
              <strong>Required document</strong>
              <small>
                Contractors must provide this document to meet the configured
                requirement.
              </small>
            </span>
            <input
              type="checkbox"
              checked={form.required}
              onChange={(event) => update("required", event.target.checked)}
            />
          </label>
          <label className="document-rule-toggle-row">
            <span>
              <strong>Required for on-site work</strong>
              <small>
                Require this document for contractors who work on site.
              </small>
            </span>
            <input
              type="checkbox"
              checked={form.requiredForSiteWork}
              onChange={(event) =>
                update("requiredForSiteWork", event.target.checked)
              }
            />
          </label>
          <label className="document-rule-toggle-row">
            <span>
              <strong>Track expiry date</strong>
              <small>
                Use expiry dates to identify upcoming renewals and expired
                documents.
              </small>
            </span>
            <input
              type="checkbox"
              checked={form.expiryTracked}
              onChange={(event) => update("expiryTracked", event.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="document-rule-form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button className="primary-button" disabled={busy}>
          <CheckCircle2 size={17} />
          {busy
            ? "Saving…"
            : editingRule
              ? "Save changes"
              : "Create rule"}
        </button>
      </div>
    </form>
  );
}

export default function DocumentRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = user?.role === "Administrator";

  async function loadRules() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/rules");
      const rows = Array.isArray(data) ? data : data?.items;
      if (!Array.isArray(rows)) {
        throw new Error("The compliance rules response was not a list.");
      }
      setRules(
        rows.map((rule) => {
          const documentType = rule?.documentType ?? rule?.document_type;
          if (
            !rule ||
            typeof documentType !== "string" ||
            typeof rule.category !== "string"
          ) {
            throw new Error("A compliance rule is missing its name or category.");
          }
          return {
            ...rule,
            documentType,
            category: rule.category,
            required: Boolean(rule.required ?? rule.is_required),
            requiredForSiteWork: Boolean(
              rule.requiredForSiteWork ?? rule.required_for_site_work,
            ),
            expiryTracked: Boolean(rule.expiryTracked ?? rule.expiry_tracked),
            reminderDays: Number(rule.reminderDays ?? rule.reminder_days ?? 0),
            active: Boolean(rule.active ?? rule.is_active),
          };
        }),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load compliance rules.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(rules.map((rule) => rule.category).filter(Boolean))].sort(
        (first, second) => first.localeCompare(second),
      ),
    [rules],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total rules",
        value: rules.length,
        helper: "All configured requirements",
        status: "neutral",
        icon: FileCheck2,
      },
      {
        label: "Active rules",
        value: rules.filter((rule) => rule.active).length,
        helper: "Currently enabled rules",
        status: "good",
        icon: ShieldCheck,
      },
      {
        label: "Required rules",
        value: rules.filter((rule) => rule.active && rule.required).length,
        helper: "Active mandatory documents",
        status: "warning",
        icon: CheckCircle2,
      },
      {
        label: "Expiry tracked",
        value: rules.filter((rule) => rule.active && rule.expiryTracked).length,
        helper: "Active rules with expiry tracking",
        status: "danger",
        icon: Clock3,
      },
    ],
    [rules],
  );

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rules
      .filter((rule) => {
        const matchesSearch =
          String(rule.documentType || "").toLowerCase().includes(query) ||
          String(rule.category || "").toLowerCase().includes(query);
        const matchesStatus =
          filter === "all" ||
          (filter === "active" && rule.active) ||
          (filter === "inactive" && !rule.active) ||
          (filter === "required" && rule.required);
        const matchesCategory =
          categoryFilter === "all" || rule.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((first, second) =>
        String(first.documentType || "").localeCompare(
          String(second.documentType || ""),
        ),
      );
  }, [rules, search, filter, categoryFilter]);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingRule(null);
    setFormError("");
  }

  function openNewRule() {
    resetForm();
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditRule(rule) {
    setEditingRule(rule);
    setForm({
      documentTypeName: rule.documentType,
      category: rule.category,
      required: rule.required,
      requiredForSiteWork: rule.requiredForSiteWork,
      expiryTracked: rule.expiryTracked,
      reminderDays: String(rule.reminderDays ?? 0),
    });
    setFormError("");
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function saveRule(event) {
    event.preventDefault();
    setFormError("");
    setMessage("");

    const documentTypeName = form.documentTypeName.trim();
    const category = form.category.trim();
    const reminderDays = Number(form.reminderDays);
    if (!documentTypeName || !category) {
      setFormError("Please enter a document name and category.");
      return;
    }
    if (
      form.expiryTracked &&
      (!Number.isInteger(reminderDays) ||
        reminderDays < 0 ||
        reminderDays > 365)
    ) {
      setFormError("Reminder days must be a whole number between 0 and 365.");
      return;
    }

    setBusy(true);
    try {
      if (editingRule) {
        await api.patch(`/rules/${editingRule.id}`, {
          category,
          required: form.required,
          requiredForSiteWork: form.requiredForSiteWork,
          expiryTracked: form.expiryTracked,
          reminderDays: form.expiryTracked ? reminderDays : 0,
        });
        setMessage("Rule updated. Contractor compliance has been recalculated.");
      } else {
        await api.post("/rules", {
          documentTypeName,
          category,
          required: form.required,
          requiredForSiteWork: form.requiredForSiteWork,
          expiryTracked: form.expiryTracked,
          reminderDays: form.expiryTracked ? reminderDays : 0,
        });
        setMessage("Compliance rule created.");
      }
      setShowForm(false);
      resetForm();
      await loadRules();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (editingRule ? "Unable to update rule." : "Unable to create rule."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleRule(rule) {
    const active = !rule.active;
    setError("");
    setMessage("");
    if (
      rule.active &&
      !window.confirm(
        `Disable "${rule.documentType}"? The rule will remain in the list but will be marked inactive.`,
      )
    ) {
      return;
    }
    try {
      await api.patch(`/rules/${rule.id}`, { active });
      setRules((current) =>
        current.map((item) =>
          item.id === rule.id ? { ...item, active } : item,
        ),
      );
      setMessage(
        active
          ? `"${rule.documentType}" has been enabled.`
          : `"${rule.documentType}" has been disabled.`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update rule.");
    }
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setCategoryFilter("all");
  }

  return (
    <section className="page document-rules-page">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Document rules"
        description="Define the documents contractors must provide and how expiry warnings are handled."
        actions={
          isAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={openNewRule}
            >
              <Plus size={17} />
              Add document rule
            </button>
          )
        }
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && !showForm && (
        <div className="document-rules-message" role="status">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="stats-grid document-rules-stats" aria-busy={loading}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            {...stat}
            value={loading ? "—" : stat.value}
          />
        ))}
      </div>

      {showForm && (
        <RuleForm
          form={form}
          setForm={setForm}
          editingRule={editingRule}
          onSave={saveRule}
          onCancel={closeForm}
          error={formError}
          busy={busy}
        />
      )}

      <section className="panel document-rules-panel">
        <div className="document-rules-panel-heading">
          <div>
            <h2>Configured requirements</h2>
            <p>Search, filter, edit, and manage your document rules.</p>
          </div>
          <span className="document-rules-count">
            {filteredRules.length} of {rules.length} rules
          </span>
        </div>

        <div className="document-rules-filters">
          <label className="document-rules-search">
            <span className="sr-only">Search document rules</span>
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search document name or category"
              type="search"
            />
          </label>
          <label>
            <span className="sr-only">Filter by rule status</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="required">Required</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-button document-rules-reset"
            onClick={clearFilters}
          >
            <RotateCcw size={15} />
            Reset filters
          </button>
        </div>

        {loading ? (
          <p className="document-rules-empty" role="status">
            Loading document rules…
          </p>
        ) : filteredRules.length === 0 ? (
          <div className="document-rules-empty">
            <FileWarning size={28} aria-hidden="true" />
            <strong>No matching document rules</strong>
            <span>
              {rules.length
                ? "Try another search term or clear your filters."
                : "No document rules have been configured for this organization."}
            </span>
            {(search || filter !== "all" || categoryFilter !== "all") && (
              <button
                type="button"
                className="table-action"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap document-rules-table-wrap">
              <table className="document-rules-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Requirement</th>
                    <th>Site work</th>
                    <th>Expiry tracking</th>
                    <th>Reminder</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <strong className="document-rules-name">
                          {rule.documentType}
                        </strong>
                      </td>
                      <td>{rule.category}</td>
                      <td>
                        <RequirementStatus required={rule.required} />
                      </td>
                      <td>{rule.requiredForSiteWork ? "Required" : "—"}</td>
                      <td>{rule.expiryTracked ? "Tracked" : "Not tracked"}</td>
                      <td>
                        {rule.expiryTracked
                          ? `${rule.reminderDays} days`
                          : "—"}
                      </td>
                      <td>
                        <RuleStatus active={rule.active} />
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="document-rules-actions">
                            <button
                              type="button"
                              className="document-rules-action"
                              onClick={() => openEditRule(rule)}
                              aria-label={`Edit ${rule.documentType}`}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className={`document-rules-action ${rule.active ? "disable" : "enable"}`}
                              onClick={() => toggleRule(rule)}
                              aria-label={`${rule.active ? "Disable" : "Enable"} ${rule.documentType}`}
                            >
                              <Power size={14} />
                              {rule.active ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="document-rules-mobile-list">
              {filteredRules.map((rule) => (
                <article className="document-rule-mobile-card" key={rule.id}>
                  <div className="document-rule-mobile-title">
                    <span className="document-rule-mobile-icon">
                      <FileCheck2 size={19} />
                    </span>
                    <div>
                      <strong>{rule.documentType}</strong>
                      <span>{rule.category}</span>
                    </div>
                    <RuleStatus active={rule.active} />
                  </div>
                  <div className="document-rule-mobile-meta">
                    <div>
                      <span>Requirement</span>
                      <RequirementStatus required={rule.required} />
                    </div>
                    <div>
                      <span>On-site work</span>
                      <strong>
                        {rule.requiredForSiteWork ? "Required" : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Expiry tracking</span>
                      <strong>
                        {rule.expiryTracked
                          ? `${rule.reminderDays}-day reminder`
                          : "Not tracked"}
                      </strong>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="document-rule-mobile-actions">
                      <button
                        type="button"
                        className="document-rules-action"
                        onClick={() => openEditRule(rule)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`document-rules-action ${rule.active ? "disable" : "enable"}`}
                        onClick={() => toggleRule(rule)}
                      >
                        <Power size={14} />
                        {rule.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        <div className="document-rules-footer">
          <span>
            Showing {filteredRules.length} of {rules.length} rules
          </span>
          <Link to="/settings">
            Manage organization settings <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      <aside className="document-rules-help">
        <span className="document-rules-help-icon">
          <AlertCircle size={19} aria-hidden="true" />
        </span>
        <div>
          <h3>How document rules work</h3>
          <p>
            Active rules define the requirements applied when checking
            contractor documents. Required rules identify mandatory documents,
            while expiry tracking supports renewal monitoring. Compliance
            results are recalculated by the backend when a rule changes.
          </p>
        </div>
      </aside>
    </section>
  );
}
