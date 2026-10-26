import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Download,
  FileCheck2,
  LockKeyhole,
  Save,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "compliance", label: "Compliance", icon: FileCheck2 },
  { id: "team", label: "Team & access", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "data", label: "Data & exports", icon: Database },
];

const emptyForm = {
  name: "",
  registrationNo: "",
  contactEmail: "",
  contactPhone: "",
  timezone: "Africa/Johannesburg",
  dateFormat: "DD/MM/YYYY",
  settings: {
    sessionTimeoutMinutes: 30,
    reminderMode: "in_app",
    preferredExportFormat: "CSV",
  },
};

function Field({
  label,
  name,
  value,
  onChange,
  disabled,
  placeholder = "",
  type = "text",
  required = false,
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value || ""}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, disabled, children }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select disabled={disabled} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="settings-section-heading">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function InfoBox({ icon: Icon = AlertCircle, children }) {
  return (
    <div className="settings-info-box">
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function PolicyRow({ title, description, action }) {
  return (
    <div className="settings-policy-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action && <div className="settings-policy-action">{action}</div>}
    </div>
  );
}

function MemberRow({ member }) {
  const initials =
    member.fullName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CT";

  return (
    <div className="settings-member-row">
      <span className="settings-member-avatar" aria-hidden="true">
        {initials}
      </span>
      <div className="settings-member-details">
        <strong>{member.fullName || "ComplyTrack user"}</strong>
        <span>{member.email}</span>
      </div>
      <div className="settings-member-badges">
        <span className="settings-role-badge">{member.role}</span>
        {member.status && (
          <span className="settings-member-status">{member.status}</span>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("organisation");
  const [form, setForm] = useState(emptyForm);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [membersError, setMembersError] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = user?.role === "Administrator";
  const activeLabel =
    sections.find((section) => section.id === activeSection)?.label ||
    "Organisation";

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/operations/organization");
        if (mounted) {
          setForm({
            ...emptyForm,
            ...data,
            settings: {
              ...emptyForm.settings,
              ...(data.settings || {}),
            },
          });
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load organization settings.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeSection !== "team") return undefined;
    let mounted = true;
    async function loadMembers() {
      setMembersLoading(true);
      setMembersError("");
      try {
        const { data } = await api.get("/operations/members");
        if (mounted) setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) {
          setMembersError(
            err.response?.data?.message ||
              "Unable to load organization members.",
          );
        }
      } finally {
        if (mounted) setMembersLoading(false);
      }
    }
    loadMembers();
    return () => {
      mounted = false;
    };
  }, [activeSection]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }

  function updateSetting(key, value) {
    setForm((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
    setMessage("");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    if (!isAdmin) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data } = await api.patch("/operations/organization", {
        name: form.name,
        registrationNo: form.registrationNo,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        timezone: form.timezone,
        dateFormat: form.dateFormat,
        settings: form.settings,
      });
      setForm((current) => ({ ...current, ...data }));
      setMessage("Organization settings saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function reloadSettings() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.get("/operations/organization");
      setForm({
        ...emptyForm,
        ...data,
        settings: { ...emptyForm.settings, ...(data.settings || {}) },
      });
      setMessage("Latest saved settings reloaded.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to reload organization settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeSection(id) {
    setActiveSection(id);
    setMessage("");
  }

  const organizationStatus =
    form.status === "active" ? "Active organization" : "Organization settings";

  return (
    <section className="page settings-blueprint">
      <PageHeader
        eyebrow="ORGANIZATION ADMINISTRATION"
        title="Settings"
        description="Manage organization details, compliance policies, notifications and access controls."
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          <CheckCircle2 size={17} />
          {message}
        </p>
      )}

      <div className="settings-overview">
        <span className="settings-overview-icon">
          <Settings2 size={23} aria-hidden="true" />
        </span>
        <div className="settings-overview-copy">
          <h2>Organization configuration</h2>
          <p>
            Configure ComplyTrack for your organization. Changes are saved to
            the organization settings service.
          </p>
        </div>
        <span className="settings-live-badge">
          <span aria-hidden="true" />
          {loading ? "Loading" : organizationStatus}
        </span>
      </div>

      {loading ? (
        <div className="panel settings-loading" role="status">
          Loading organization settings…
        </div>
      ) : (
        <div className="settings-layout">
          <aside className="settings-navigation">
            <p>Workspace settings</p>
            <nav aria-label="Settings sections">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`settings-nav-item ${activeSection === id ? "active" : ""}`}
                  aria-current={activeSection === id ? "page" : undefined}
                  onClick={() => changeSection(id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  {activeSection === id && (
                    <ChevronRight size={16} aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>

            <div className="settings-access-note">
              <LockKeyhole size={16} aria-hidden="true" />
              <strong>Access control</strong>
              <p>
                Only authorized administrators can change organization-wide
                settings.
              </p>
            </div>
            <Link to="/audit-log" className="settings-audit-link">
              <Clock3 size={16} aria-hidden="true" />
              View audit log
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </aside>

          <form className="settings-content" onSubmit={save} aria-busy={busy}>
            <div className="settings-content-header">
              <div>
                <span>Configuration</span>
                <h2>{activeLabel}</h2>
              </div>
              <span className="settings-saved-state">
                <span aria-hidden="true" />
                Live organization data
              </span>
            </div>

            <div className="settings-content-body">
              {activeSection === "organisation" && (
                <>
                  <SectionHeading
                    title="Organization profile"
                    description="Legal and contact details used to identify your organization in ComplyTrack."
                  />
                  <div className="settings-fields-grid">
                    <Field
                      label="Legal organization name"
                      name="name"
                      value={form.name}
                      onChange={update}
                      disabled={!isAdmin}
                      required
                    />
                    <Field
                      label="Registration number"
                      name="registrationNo"
                      value={form.registrationNo}
                      onChange={update}
                      disabled={!isAdmin}
                    />
                    <Field
                      label="Organization email"
                      name="contactEmail"
                      type="email"
                      value={form.contactEmail}
                      onChange={update}
                      disabled={!isAdmin}
                      placeholder="compliance@organization.co.za"
                    />
                    <Field
                      label="Contact number"
                      name="contactPhone"
                      type="tel"
                      value={form.contactPhone}
                      onChange={update}
                      disabled={!isAdmin}
                      placeholder="+27"
                    />
                  </div>
                  <InfoBox icon={Building2}>
                    The organization name and contact details are shared across
                    authorized users in your workspace.
                  </InfoBox>
                </>
              )}

              {activeSection === "notifications" && (
                <>
                  <SectionHeading
                    title="Reminder and escalation policy"
                    description="Review how document expiry notifications are currently delivered."
                  />
                  <div className="settings-readonly-policy">
                    <div className="settings-policy-icon">
                      <BellRing size={19} aria-hidden="true" />
                    </div>
                    <div>
                      <strong>In-app compliance reminders</strong>
                      <p>
                        Reminder delivery is currently in-app only. Automatic
                        reminder emails and scheduled escalation notifications
                        are not enabled.
                      </p>
                    </div>
                    <span className="settings-policy-badge">Enabled</span>
                  </div>
                  <PolicyRow
                    title="Expiry warning periods"
                    description="Reminder timing is configured individually for each document requirement."
                    action={
                      <Link to="/document-rules" className="settings-inline-link">
                        Manage document rules <ChevronRight size={15} />
                      </Link>
                    }
                  />
                  <InfoBox icon={Clock3}>
                    Changing rule reminder periods affects compliance tracking;
                    configure them in Document rules.
                  </InfoBox>
                </>
              )}

              {activeSection === "compliance" && (
                <>
                  <SectionHeading
                    title="Compliance configuration"
                    description="Manage organization-specific document requirements applied by the live compliance engine."
                  />
                  <PolicyRow
                    title="Required document rules"
                    description="Set required documents, on-site requirements, expiry tracking and reminder periods."
                    action={
                      <Link to="/document-rules" className="settings-inline-link">
                        Manage rules <ChevronRight size={15} />
                      </Link>
                    }
                  />
                  <PolicyRow
                    title="Compliance reports"
                    description="Review current contractor compliance and export organization reports."
                    action={
                      <Link to="/reports" className="settings-inline-link">
                        Open reports <ChevronRight size={15} />
                      </Link>
                    }
                  />
                  <InfoBox icon={FileCheck2}>
                    Active document rules are enforced by the backend when
                    contractor compliance is calculated.
                  </InfoBox>
                </>
              )}

              {activeSection === "team" && (
                <>
                  <SectionHeading
                    title="Team and access"
                    description="Organization members and their assigned access roles."
                  />
                  {membersError && (
                    <p className="form-error" role="alert">
                      {membersError}
                    </p>
                  )}
                  {membersLoading ? (
                    <p className="settings-inline-loading" role="status">
                      Loading organization members…
                    </p>
                  ) : members.length ? (
                    <div className="settings-members-list">
                      {members.map((member) => (
                        <MemberRow key={member.id} member={member} />
                      ))}
                    </div>
                  ) : (
                    !membersError && (
                      <p className="settings-inline-loading">
                        No organization members were returned.
                      </p>
                    )
                  )}
                  <InfoBox icon={ShieldCheck}>
                    Access permissions are enforced by the backend for each
                    protected operation.
                  </InfoBox>
                </>
              )}

              {activeSection === "security" && (
                <>
                  <SectionHeading
                    title="Security preferences"
                    description="Configure the supported organization session preference."
                  />
                  <div className="settings-fields-grid settings-fields-narrow">
                    <SelectField
                      label="Session inactivity timeout"
                      value={String(
                        form.settings?.sessionTimeoutMinutes || 30,
                      )}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        updateSetting(
                          "sessionTimeoutMinutes",
                          Number(event.target.value),
                        )
                      }
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                    </SelectField>
                  </div>
                  <PolicyRow
                    title="Authentication"
                    description="Account authentication and multi-factor requirements are enforced by the secure sign-in flow."
                    action={
                      <span className="settings-policy-badge">Protected</span>
                    }
                  />
                  <InfoBox icon={ShieldCheck}>
                    Session timeout changes apply to new authenticated requests.
                    Backend authorization remains authoritative for protected
                    data and actions.
                  </InfoBox>
                </>
              )}

              {activeSection === "data" && (
                <>
                  <SectionHeading
                    title="Data and exports"
                    description="Set organization-wide timezone and date display preferences."
                  />
                  <div className="settings-fields-grid">
                    <SelectField
                      label="Default timezone"
                      value={form.timezone || "Africa/Johannesburg"}
                      disabled={!isAdmin}
                      onChange={(event) => update("timezone", event.target.value)}
                    >
                      <option value="Africa/Johannesburg">
                        South Africa (SAST)
                      </option>
                      <option value="UTC">UTC</option>
                    </SelectField>
                    <SelectField
                      label="Date format"
                      value={form.dateFormat || "DD/MM/YYYY"}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        update("dateFormat", event.target.value)
                      }
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </SelectField>
                    <SelectField
                      label="Preferred export format"
                      value={form.settings?.preferredExportFormat || "CSV"}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        updateSetting("preferredExportFormat", event.target.value)
                      }
                    >
                      <option value="CSV">CSV spreadsheet</option>
                      <option value="JSON">JSON data</option>
                    </SelectField>
                  </div>
                  <div className="settings-policy-spacer">
                    <PolicyRow
                      title="Audit history"
                      description="Review recorded system activity and sensitive changes."
                      action={
                        <Link to="/audit-log" className="settings-inline-link">
                          View history <ChevronRight size={15} />
                        </Link>
                      }
                    />
                    <PolicyRow
                      title="Backups and retention"
                      description="Backup and retention controls are managed outside this settings screen."
                      action={
                        <span className="settings-policy-badge pending">
                          Not configured
                        </span>
                      }
                    />
                  </div>
                  <InfoBox icon={Download}>
                    Export format is saved as a preference. Use Reports or
                    Contractors to generate available exports.
                  </InfoBox>
                </>
              )}

              {!isAdmin && (
                <p className="settings-readonly-notice" role="note">
                  Only an Administrator can change organization settings.
                </p>
              )}
            </div>

            <div className="settings-form-actions">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={reloadSettings}
                    disabled={busy || loading}
                  >
                    Reload saved values
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={busy}
                  >
                    <Save size={17} />
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </>
              ) : (
                <span className="settings-form-hint">
                  Settings are read-only for your role.
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
