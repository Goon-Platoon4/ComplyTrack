import { useMemo, useState } from "react";
import {
  FileCheck2,
  Plus,
  Search,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

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
    reminderDays: 30,
    active: true,
  },
];

export default function DocumentRules() {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
  });

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(search.toLowerCase()) ||
        rule.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && rule.active) ||
        (filter === "inactive" && !rule.active) ||
        (filter === "required" && rule.required);

      return matchesSearch && matchesFilter;
    });
  }, [rules, search, filter]);

  function openNewRule() {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      required: true,
      expiryTracked: true,
      reminderDays: 30,
    });
    setMessage("");
    setShowForm(true);
  }

  function openEditRule(rule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      category: rule.category,
      required: rule.required,
      expiryTracked: rule.expiryTracked,
      reminderDays: rule.reminderDays,
    });
    setMessage("");
    setShowForm(true);
  }

  function saveRule(event) {
    event.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const reminderDays = Number(form.reminderDays);

    if (!name || !category) {
      setMessage("Enter a document name and category.");
      return;
    }

    if (
      form.expiryTracked &&
      (!Number.isInteger(reminderDays) || reminderDays < 1)
    ) {
      setMessage("Enter a reminder period of at least 1 day.");
      return;
    }

    if (
      rules.some(
        (rule) =>
          rule.name.toLowerCase() === name.toLowerCase() &&
          rule.id !== editingId
      )
    ) {
      setMessage("A rule with this document name already exists.");
      return;
    }

    if (editingId !== null) {
      setRules((current) =>
        current.map((rule) =>
          rule.id === editingId
            ? {
                ...rule,
                ...form,
                name,
                category,
                reminderDays: form.expiryTracked ? reminderDays : 0,
              }
            : rule
        )
      );
    } else {
      setRules((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((rule) => rule.id)) + 1,
          ...form,
          name,
          category,
          reminderDays: form.expiryTracked ? reminderDays : 0,
          active: true,
        },
      ]);
    }

    setShowForm(false);
    setMessage("");
  }

  function toggleRule(id) {
    setRules((current) =>
      current.map((rule) =>
        rule.id === id ? { ...rule, active: !rule.active } : rule
      )
    );
  }

   return (
    <section className="page">
      <PageHeader
        eyebrow="Administration"
        title="Document rules"
        description="Define the documents contractors must provide and how expiry warnings are handled."
        actions={
          <button className="primary-button" onClick={openNewRule}>
            <Plus size={17} /> Add document rule
          </button>
        }
      />

      <div className="stats-grid">
        <div className="panel">
          <FileCheck2 size={20} />
          <p>Total rules</p>
          <h2>{rules.length}</h2>
        </div>
        <div className="panel">
          <ShieldCheck size={20} />
          <p>Active rules</p>
          <h2>{rules.filter((rule) => rule.active).length}</h2>
        </div>
        <div className="panel">
          <FileCheck2 size={20} />
          <p>Required rules</p>
          <h2>
            {rules.filter((rule) => rule.active && rule.required).length}
          </h2>
        </div>
      </div>

      {message && !showForm && (
        <div className="panel" role="status">
          {message}
        </div>
      )}

      {showForm && (
        <form className="panel" onSubmit={saveRule}>
          <div className="panel-header">
            <div>
              <h2>{editingId === null ? "Add document rule" : "Edit document rule"}</h2>
              <p>Complete the requirement details below.</p>
            </div>
          </div>

          {message && <p role="alert">{message}</p>}

          <div className="rule-form-grid">
            <label>
              Document name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Professional indemnity insurance"
                required
              />
            </label>

            <label>
              Category
              <input
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                placeholder="e.g. Insurance"
                required
              />
            </label>

            <label>
              Expiry reminder (days before expiry)
              <input
                type="number"
                min="1"
                disabled={!form.expiryTracked}
                value={form.reminderDays}
                onChange={(event) =>
                  setForm({ ...form, reminderDays: event.target.value })
                }
              />
            </label>
          </div>

          <div className="rule-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={form.required}
                onChange={(event) =>
                  setForm({ ...form, required: event.target.checked })
                }
              />
              Required document
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.expiryTracked}
                onChange={(event) =>
                  setForm({
                    ...form,
                    expiryTracked: event.target.checked,
                  })
                }
              />
              Track expiry date
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              Save rule
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setShowForm(false);
                setMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Configured requirements</h2>
            <p>Search, edit and enable or disable document rules.</p>
          </div>
        </div>

        <div className="table-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search document rules..."
              aria-label="Search document rules"
            />
          </label>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter document rules"
          >
            <option value="all">All rules</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="required">Required</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Requirement</th>
                <th>Expiry tracking</th>
                <th>Reminder</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td><strong>{rule.name}</strong></td>
                  <td>{rule.category}</td>
                  <td>{rule.required ? "Required" : "Optional"}</td>
                  <td>{rule.expiryTracked ? "Tracked" : "Not tracked"}</td>
                  <td>
                    {rule.expiryTracked ? `${rule.reminderDays} days` : "—"}
                  </td>
                  <td>
                    <StatusBadge
                      status={rule.active ? "good" : "neutral"}
                    />
                    <span>{rule.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        onClick={() => openEditRule(rule)}
                        aria-label={`Edit ${rule.name}`}
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      <button
                        className="table-action"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan="7">No document rules match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}