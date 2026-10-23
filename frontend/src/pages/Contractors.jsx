import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileWarning,
  Search,
  Users,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { contractors, getComplianceStatus, requiredDocuments } from "../data/contractors";

export default function Contractors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredContractors = useMemo(() => {
    return contractors.filter((contractor) => {
      const matchesSearch =
        contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || getComplianceStatus(contractor) === statusFilter;
      const matchesCategory =
        categoryFilter === "All" || contractor.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchTerm, statusFilter, categoryFilter]);

  const totalCompliant = contractors.filter(
    (contractor) => getComplianceStatus(contractor) === "Compliant"
  ).length;
  const totalExpiring = contractors.filter(
    (contractor) => getComplianceStatus(contractor) === "Expiring soon"
  ).length;
  const totalExpired = contractors.filter(
    (contractor) => getComplianceStatus(contractor) === "Expired"
  ).length;
  return (
    <section className="page">
      <PageHeader
        eyebrow="Contractors"
        title="Contractors"
        description="Browse the contractor roster, review compliance status, and open contractor profiles."
      />

      <div className="stats-grid">
        <StatCard
          label="Total"
          value={String(contractors.length)}
          helper="Active contractor records"
          status="neutral"
          icon={Users}
          trend="Across all service categories"
        />
        <StatCard
          label="Compliant"
          value={String(totalCompliant)}
          helper="Contractors with all required documents valid"
          status="good"
          icon={CheckCircle2}
          trend="Ready for site access"
        />
        <StatCard
          label="Expiring soon"
          value={String(totalExpiring)}
          helper="Required documents renewing within 30 days"
          status="warning"
          icon={Clock3}
          trend="Needs follow-up"
        />
        <StatCard
          label="Expired"
          value={String(totalExpired)}
          helper="Contractors with overdue compliance items"
          status="danger"
          icon={FileWarning}
          trend="Action required"
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <Search size={17} />
              Search & filters
            </h2>
            <p>Find contractors quickly and narrow the list by status or service category.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="relative block">
            <span className="sr-only">Search contractors</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, company or contact"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[var(--teal)] focus:ring-3 focus:ring-emerald-100"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[var(--teal)] focus:ring-3 focus:ring-emerald-100"
          >
            <option value="All">All statuses</option>
            <option value="Compliant">Compliant</option>
            <option value="Expiring soon">Expiring soon</option>
            <option value="Expired">Expired</option>
            <option value="Missing">Missing documents</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[var(--teal)] focus:ring-3 focus:ring-emerald-100"
          >
            <option value="All">All categories</option>
            <option value="Construction">Construction</option>
            <option value="Electrical">Electrical</option>
            <option value="Security">Security</option>
            <option value="Facilities">Facilities</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <Building2 size={17} />
              Contractor list
            </h2>
            <p>Current contractor roster and compliance position.</p>
          </div>

          <Link to="/reports" className="link-button">
            View report <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Registration</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Documents</th>
                <th>Next expiry</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractors.length > 0 ? (
                filteredContractors.map((contractor) => (
                  <tr key={contractor.id}>
                    <td>
                      <div className="flex flex-col">
                        <strong>{contractor.name}</strong>
                        <span className="text-[10px] text-slate-500">{contractor.id}</span>
                      </div>
                    </td>
                    <td>{contractor.regNo}</td>
                    <td>
                      <div className="font-medium text-slate-700">{contractor.contactPerson}</div>
                      <div className="text-[10px] text-slate-500">{contractor.email}</div>
                    </td>
                    <td>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {contractor.category}
                      </span>
                    </td>
                    <td>
                      {contractor.documents.filter((document) => document.status !== "Missing").length}
                      {" / "}
                      {requiredDocuments.length}
                    </td>
                    <td>
                      {contractor.documents
                        .filter((document) => document.expiry)
                        .sort((first, second) => new Date(first.expiry) - new Date(second.expiry))[0]
                        ?.expiry || "—"}
                    </td>
                    <td>
                      <StatusBadge status={getComplianceStatus(contractor)} />
                    </td>
                    <td className="text-right">
                      <Link to={`/contractors/${contractor.id}`} className="table-action">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    No contractors match the current search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
