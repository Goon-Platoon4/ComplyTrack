
import { useState } from "react";
import {
  Building2,
  BellRing,
  FileCheck2,
  Users,
  ShieldCheck,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Clock3,
  LockKeyhole,
  Download,
  ChevronRight,
  Settings2,
  CircleHelp,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

const initialOrganisation = {
  organisationName: "Example South African Organisation",
  tradingName: "",
  registrationNumber: "2018/123456/07",
  vatNumber: "",
  complianceOfficer: "Thandi Nkosi",
  email: "",
  phone: "",
  address: "",
};

const initialNotifications = {
  reminder30: true,
  reminder14: true,
  reminder7: true,
  expiredEscalation: true,
  notifyContractor: true,
  notifyOfficer: true,
  weeklySummary: false,
};

const initialSecurity = {
  sessionTimeout: "30",
  requireStrongPasswords: true,
  notifyOnSensitiveChanges: true,
  restrictExports: true,
};

const sections = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "compliance", label: "Compliance", icon: FileCheck2 },
  { id: "team", label: "Team & access", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "data", label: "Data & exports", icon: Database },
];

function Toggle({ checked, onChange, title, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 border-b border-slate-100 py-4 last:border-b-0">
      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors
          after:absolute after:left-1 after:top-1 after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow-sm after:transition-transform
          peer-checked:bg-teal-600 peer-checked:after:translate-x-5
          peer-focus-visible:outline-none peer-focus-visible:ring-4
          peer-focus-visible:ring-teal-100
          ${
            checked
              ? "bg-teal-600 after:translate-x-5"
              : "bg-slate-300"
          }`}
      />
    </label>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3
          text-sm text-slate-800 outline-none transition
          placeholder:text-slate-400 hover:border-slate-300
          focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3
          text-sm text-slate-800 outline-none transition
          hover:border-slate-300 focus:border-teal-600
          focus:ring-4 focus:ring-teal-600/10"
      >
        {children}
      </select>
    </label>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-bold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="mt-7 border-t border-slate-100 pt-5">
      <h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function InfoBox({ children, icon: Icon = Info }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
      <Icon size={18} className="mt-0.5 shrink-0 text-sky-700" />
      <p className="text-xs leading-5 text-sky-900">{children}</p>
    </div>
  );
}

function PolicyRow({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function RoleRow({ icon: Icon, title, description, access }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
        {access}
      </span>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("organisation");
  const [organisation, setOrganisation] = useState(initialOrganisation);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [security, setSecurity] = useState(initialSecurity);
  const [savedMessage, setSavedMessage] = useState("");
  const [timezone, setTimezone] = useState("Africa/Johannesburg");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [exportFormat, setExportFormat] = useState("CSV");

  const updateOrganisation = (name, value) => {
    setOrganisation((current) => ({ ...current, [name]: value }));
    setSavedMessage("");
  };

  const updateNotification = (name, value) => {
    setNotifications((current) => ({ ...current, [name]: value }));
    setSavedMessage("");
  };

  const updateSecurity = (name, value) => {
    setSecurity((current) => ({ ...current, [name]: value }));
    setSavedMessage("");
  };

  const handleSave = (event) => {
    event.preventDefault();
    setSavedMessage(
      "Demo only: your changes have not been saved to the database."
    );
  };

  const handleReset = () => {
    setOrganisation({ ...initialOrganisation });
    setNotifications({ ...initialNotifications });
    setSecurity({ ...initialSecurity });
    setTimezone("Africa/Johannesburg");
    setDateFormat("DD/MM/YYYY");
    setExportFormat("CSV");
    setSavedMessage("Demo settings have been reset.");
  };

  const activeLabel =
    sections.find((section) => section.id === activeSection)?.label ||
    "Organisation";

  return (
    <section className="min-w-0 space-y-6 pb-8">
      <PageHeader
        title="Settings"
        description="Manage organisation details, compliance policies, notifications and access controls."
      />

      {/* Workspace overview */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Settings2 size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">
            Organisation configuration
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Configure how ComplyTrack works for your organisation. Review
            policy changes before applying them to live compliance records.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Demo configuration
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Settings navigation */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace settings
          </p>

          <nav aria-label="Settings sections" className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;

              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setActiveSection(id);
                    setSavedMessage("");
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15
                    ${
                      isActive
                        ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={15} />}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2 text-slate-700">
              <LockKeyhole size={15} />
              <span className="text-xs font-bold">Access control</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Organisation-wide settings should only be changed by authorised
              administrators.
            </p>
          </div>

          <Link
            to="/audit-log"
            className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-700"
          >
            <Clock3 size={16} />
            View audit log
            <ChevronRight size={14} className="ml-auto" />
          </Link>
        </aside>

        {/* Active settings section */}
        <form
          onSubmit={handleSave}
          className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
                Configuration
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {activeLabel}
              </h2>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Local demo state
            </span>
          </div>

          <div className="p-5 sm:p-7">
            {activeSection === "organisation" && (
              <>
                <SectionHeading
                  title="Organisation profile"
                  description="The legal and contact information used to identify your organisation in the workspace and reports."
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="Legal organisation name"
                    name="organisationName"
                    value={organisation.organisationName}
                    onChange={updateOrganisation}
                  />
                  <Field
                    label="Trading name (optional)"
                    name="tradingName"
                    value={organisation.tradingName}
                    onChange={updateOrganisation}
                    placeholder="Trading name"
                  />
                  <Field
                    label="CIPC registration number"
                    name="registrationNumber"
                    value={organisation.registrationNumber}
                    onChange={updateOrganisation}
                  />
                  <Field
                    label="VAT number (optional)"
                    name="vatNumber"
                    value={organisation.vatNumber}
                    onChange={updateOrganisation}
                    placeholder="VAT registration number"
                  />
                  <Field
                    label="Primary compliance officer"
                    name="complianceOfficer"
                    value={organisation.complianceOfficer}
                    onChange={updateOrganisation}
                  />
                  <Field
                    label="Organisation email"
                    name="email"
                    value={organisation.email}
                    onChange={updateOrganisation}
                    type="email"
                    placeholder="compliance@organisation.co.za"
                  />
                  <Field
                    label="Contact number"
                    name="phone"
                    value={organisation.phone}
                    onChange={updateOrganisation}
                    placeholder="+27"
                  />
                  <Field
                    label="Physical address"
                    name="address"
                    value={organisation.address}
                    onChange={updateOrganisation}
                    placeholder="Street, suburb, city, province"
                  />
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <>
                <SectionHeading
                  title="Reminder and escalation policy"
                  description="Choose which reminder rules should apply to upcoming and expired documents."
                />

                <Subsection title="Expiry reminders">
                  <Toggle
                    title="30-day reminder"
                    description="Send an early warning before a document expires."
                    checked={notifications.reminder30}
                    onChange={(value) => updateNotification("reminder30", value)}
                  />
                  <Toggle
                    title="14-day reminder"
                    description="Send a follow-up for outstanding renewals."
                    checked={notifications.reminder14}
                    onChange={(value) => updateNotification("reminder14", value)}
                  />
                  <Toggle
                    title="7-day urgent reminder"
                    description="Highlight documents that are close to expiry."
                    checked={notifications.reminder7}
                    onChange={(value) => updateNotification("reminder7", value)}
                  />
                  <Toggle
                    title="Expired-document escalation"
                    description="Flag overdue documents for compliance officer attention."
                    checked={notifications.expiredEscalation}
                    onChange={(value) =>
                      updateNotification("expiredEscalation", value)
                    }
                  />
                </Subsection>

                <Subsection title="Recipients and summaries">
                  <Toggle
                    title="Notify contractors"
                    description="Include the relevant contractor in reminder notifications."
                    checked={notifications.notifyContractor}
                    onChange={(value) =>
                      updateNotification("notifyContractor", value)
                    }
                  />
                  <Toggle
                    title="Notify compliance officers"
                    description="Notify the officer responsible for the contractor."
                    checked={notifications.notifyOfficer}
                    onChange={(value) =>
                      updateNotification("notifyOfficer", value)
                    }
                  />
                  <Toggle
                    title="Weekly compliance summary"
                    description="Prepare a weekly overview of outstanding compliance items."
                    checked={notifications.weeklySummary}
                    onChange={(value) =>
                      updateNotification("weeklySummary", value)
                    }
                  />
                </Subsection>

                <InfoBox icon={Clock3}>
                  These settings currently change frontend state only. Sending
                  real emails requires a backend notification service and a
                  scheduled worker.
                </InfoBox>
              </>
            )}

            {activeSection === "compliance" && (
              <>
                <SectionHeading
                  title="Compliance configuration"
                  description="Review the policies that determine how contractor document compliance is managed."
                />

                <Subsection title="Policy defaults">
                  <PolicyRow
                    title="Expiring soon threshold"
                    description="The current default window for documents approaching expiry."
                    action={
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                        30 days
                      </span>
                    }
                  />

                  <PolicyRow
                    title="Required document rules"
                    description="Define which documents each contractor must provide."
                    action={
                      <Link
                        to="/document-rules"
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                      >
                        Manage rules <ChevronRight size={14} />
                      </Link>
                    }
                  />

                  <PolicyRow
                    title="Accepted document formats"
                    description="Proposed formats for contractor document uploads."
                    action={
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                        PDF, JPG, PNG
                      </span>
                    }
                  />
                </Subsection>

                <InfoBox>
                  These are informational defaults, not live policy controls.
                  Connect them to the backend before relying on them for
                  compliance decisions.
                </InfoBox>
              </>
            )}

            {activeSection === "team" && (
              <>
                <SectionHeading
                  title="Team and access"
                  description="Define appropriate access levels for people working with sensitive contractor compliance records."
                />

                <Subsection title="Proposed access roles">
                  <RoleRow
                    icon={ShieldCheck}
                    title="Administrator"
                    description="Manage users, organisation settings and records."
                    access="Full access"
                  />
                  <RoleRow
                    icon={FileCheck2}
                    title="Compliance Officer"
                    description="Manage contractors, documents, reminders and reports."
                    access="Operational"
                  />
                  <RoleRow
                    icon={Users}
                    title="Reviewer"
                    description="Review submitted documents and record review outcomes."
                    access="Limited"
                  />
                  <RoleRow
                    icon={LockKeyhole}
                    title="Read-only Auditor"
                    description="View records, reports and audit history without editing."
                    access="Read only"
                  />
                </Subsection>

                <InfoBox>
                  These roles are illustrative. Invitations, role assignments
                  and server-side authorisation must be implemented before
                  access restrictions are enforced.
                </InfoBox>
              </>
            )}

            {activeSection === "security" && (
              <>
                <SectionHeading
                  title="Security preferences"
                  description="Review proposed security defaults for user sessions and sensitive activity."
                />

                <div className="max-w-md">
                  <SelectField
                    label="Session timeout"
                    value={security.sessionTimeout}
                    onChange={(event) =>
                      updateSecurity("sessionTimeout", event.target.value)
                    }
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                  </SelectField>
                </div>

                <Subsection title="Security controls">
                  <Toggle
                    title="Strong password policy"
                    description="Require stronger passwords when account authentication is implemented."
                    checked={security.requireStrongPasswords}
                    onChange={(value) =>
                      updateSecurity("requireStrongPasswords", value)
                    }
                  />
                  <Toggle
                    title="Sensitive-change alerts"
                    description="Plan alerts for changes to roles, policies and organisation details."
                    checked={security.notifyOnSensitiveChanges}
                    onChange={(value) =>
                      updateSecurity("notifyOnSensitiveChanges", value)
                    }
                  />
                  <Toggle
                    title="Restrict data exports"
                    description="Limit exports to authorised roles when permissions are implemented."
                    checked={security.restrictExports}
                    onChange={(value) => updateSecurity("restrictExports", value)}
                  />
                </Subsection>

                <InfoBox icon={ShieldCheck}>
                  Frontend controls cannot enforce security on their own. Apply
                  authentication, session rules and permissions in the backend
                  and validate them on every protected API request.
                </InfoBox>
              </>
            )}

            {activeSection === "data" && (
              <>
                <SectionHeading
                  title="Data and exports"
                  description="Configure display preferences and review data governance requirements."
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <SelectField
                    label="Default timezone"
                    value={timezone}
                    onChange={(event) => {
                      setTimezone(event.target.value);
                      setSavedMessage("");
                    }}
                  >
                    <option value="Africa/Johannesburg">
                      South Africa (SAST)
                    </option>
                    <option value="UTC">UTC</option>
                  </SelectField>

                  <SelectField
                    label="Date format"
                    value={dateFormat}
                    onChange={(event) => {
                      setDateFormat(event.target.value);
                      setSavedMessage("");
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </SelectField>

                  <SelectField
                    label="Preferred export format"
                    value={exportFormat}
                    onChange={(event) => {
                      setExportFormat(event.target.value);
                      setSavedMessage("");
                    }}
                  >
                    <option value="CSV">CSV spreadsheet</option>
                    <option value="JSON">JSON data</option>
                  </SelectField>
                </div>

                <Subsection title="Data governance">
                  <PolicyRow
                    title="Audit history"
                    description="Review recorded system activity and sensitive changes."
                    action={
                      <Link
                        to="/audit-log"
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                      >
                        View history <ChevronRight size={14} />
                      </Link>
                    }
                  />

                  <PolicyRow
                    title="Backups and retention"
                    description="Define retention periods and verify backup procedures before enabling automated cleanup."
                    action={
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        Not configured
                      </span>
                    }
                  />
                </Subsection>

                <InfoBox icon={Download}>
                  Export preferences currently remain in page state. Actual
                  exports, backups and retention enforcement require backend
                  implementation.
                </InfoBox>
              </>
            )}
          </div>

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <RotateCcw size={16} />
              Reset demo values
            </button>

            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20"
            >
              <Save size={16} />
              Save changes
            </button>
          </div>

          {savedMessage && (
            <div
              role="status"
              className="flex items-start gap-3 border-t border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900 sm:px-7"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}
        </form>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <CircleHelp size={18} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-xs leading-5 text-slate-500">
          Settings are currently a frontend prototype. Changes reset when the
          page reloads. Connect the settings API and enforce administrator
          permissions before using this page with real organisation data.
        </p>
      </div>
    </section>
  );
}
