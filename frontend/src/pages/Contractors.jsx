import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  Upload, 
  Download, 
  ChevronRight,
  Printer
} from 'lucide-react';

const mockContractors = [
  {
    id: 'CNT-001',
    name: 'Apex Construction Ltd',
    regNo: '2018/482011/07',
    contactPerson: 'Thandi Nkosi',
    email: 'contractor@email.com',
    phone: '+27 82 555 0192',
    category: 'Construction',
    status: 'Compliant',
    nextExpiry: '2026-11-30',
    documents: [
      { id: 1, name: 'Tax Clearance Certificate', type: 'Tax PIN', expiry: '2027-03-15', status: 'Valid' },
      { id: 2, name: 'COIDA Letter of Good Standing', type: 'COIDA', expiry: '2026-11-30', status: 'Valid' },
      { id: 3, name: 'B-BBEE Certificate (Level 2)', type: 'B-BBEE', expiry: '2026-10-28', status: 'Expiring Soon' }
    ]
  },
  {
    id: 'CNT-002',
    name: 'Vanguard Electrical Services',
    regNo: '2015/109382/07',
    contactPerson: 'Johan Pretorius',
    email: 'contractor@email.com',
    phone: '+27 83 444 1209',
    category: 'Electrical',
    status: 'Expiring Soon',
    nextExpiry: '2026-10-14',
    documents: [
      { id: 1, name: 'Tax Clearance Certificate', type: 'Tax PIN', expiry: '2026-09-30', status: 'Expired' },
      { id: 2, name: 'COIDA Letter of Good Standing', type: 'COIDA', expiry: '2027-05-20', status: 'Valid' },
      { id: 3, name: 'Wireman License Certificate', type: 'License', expiry: '2026-10-14', status: 'Expiring Soon' }
    ]
  },
  {
    id: 'CNT-003',
    name: 'Siphumelele Security & Civils',
    regNo: '2020/774912/07',
    contactPerson: 'Siyabonga Dlamini',
    email: 'contractor@email.com',
    phone: '+27 71 987 6543',
    category: 'Security',
    status: 'Expired',
    nextExpiry: '2026-09-10',
    documents: [
      { id: 1, name: 'Tax Clearance Certificate', type: 'Tax PIN', expiry: '2026-09-10', status: 'Expired' },
      { id: 2, name: 'PSIRA Registration Certificate', type: 'PSIRA', expiry: '2026-09-15', status: 'Expired' }
    ]
  }
];

export default function Contractors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter logic meeting development requirements
  const filteredContractors = mockContractors.filter(contractor => {
    const matchesSearch = contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contractor.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contractor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contractor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || contractor.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || contractor.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Compliant':
      case 'Valid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'Expiring Soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'Expired':
      case 'Non-Compliant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-3">
        <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Blueprint • Contractor Management</span>
        <button onClick={() => window.history.back()} className="hover:underline">Back to Dashboard</button>
      </div>

      {/* 01. Contractors Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">01</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Contractors
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage contractor profiles, compliance records, documents and contract information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium px-4 py-2 rounded-xl transition text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-xl transition text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Contractor
          </button>
        </div>
      </div>

      {/* 02. Contractor Overview Metrics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">02</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contractor Overview</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">High-level information about the organisation's contractor population.</p>
          </div>
          <Printer className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Contractors</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{mockContractors.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active contractor records</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Compliant</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {mockContractors.filter(c => c.status === 'Compliant').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Fully compliant contractors</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Expiring Soon</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {mockContractors.filter(c => c.status === 'Expiring Soon').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider">Non-Compliant</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {mockContractors.filter(c => c.status === 'Expired').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Expired or missing documents</p>
          </div>
        </div>
      </div>

      {/* 03. Search & Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm space-y-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">03</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Search & Filters</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Allow users to quickly find contractors and narrow the results by compliance criteria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contractor name, registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired / Non-Compliant</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="All">All service categories</option>
              <option value="Construction">Construction</option>
              <option value="Electrical">Electrical</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* 04. Contractor List Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm space-y-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">04</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contractor List</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">The primary contractor management table.</p>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-400 uppercase font-bold tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3.5">Contractor</th>
                <th className="px-6 py-3.5">Registration</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Documents</th>
                <th className="px-6 py-3.5">Next Expiry</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContractors.length > 0 ? (
                filteredContractors.map((contractor) => (
                  <tr key={contractor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {contractor.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{contractor.regNo}</td>
                    <td className="px-6 py-4">
                      <div>{contractor.contactPerson}</div>
                      <div className="text-[10px] text-gray-400">{contractor.email}</div>
                    </td>
                    <td className="px-6 py-4">{contractor.category}</td>
                    <td className="px-6 py-4 font-medium">{contractor.documents.length} / 4</td>
                    <td className="px-6 py-4 text-gray-500">{contractor.nextExpiry}</td>
                    <td className="px-6 py-4">{getStatusBadge(contractor.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedContractor(contractor)}
                        className="font-medium text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                      >
                        View
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    No matching contractors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Development Notes Footer */}
      <div className="bg-gray-50 dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 space-y-2">
        <p className="font-bold text-gray-700 dark:text-gray-300">Development notes</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Add Contractor opens a validated contractor creation form.</li>
          <li>Search and filters query live state and mock datasets seamlessly.</li>
          <li>Contractor status is derived from authoritative document compliance data.</li>
          <li>Rows link directly to the contractor details drawer view.</li>
          <li>Export uses selected filters and current result set.</li>
        </ul>
      </div>

      {/* Contractor Details Drawer Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 h-full p-6 shadow-xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedContractor.name}</h2>
                <p className="text-xs font-mono text-gray-400">Registration: {selectedContractor.regNo}</p>
              </div>
              <button 
                onClick={() => setSelectedContractor(null)} 
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-xs">
              <div>
                <p className="text-gray-400 font-medium">Contact Person</p>
                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">{selectedContractor.contactPerson}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Service Category</p>
                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">{selectedContractor.category}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Email Address</p>
                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">{selectedContractor.email}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Phone Number</p>
                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">{selectedContractor.phone}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Associated Compliance Documents
                </h3>
                <button className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>

              <div className="space-y-2">
                {selectedContractor.documents.map((doc) => (
                  <div key={doc.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between bg-white dark:bg-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                      <p className="text-xs text-gray-400">Expires: {doc.expiry}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(doc.status)}
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Contractor Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Company Name</label>
                <input required type="text" placeholder="e.g. Acme Builders (Pty) Ltd" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Registration Number</label>
                  <input required type="text" placeholder="YYYY/NNNNNN/07" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700" />
                </div>
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Service Category</label>
                  <select className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700">
                    <option>Construction</option>
                    <option>Electrical</option>
                    <option>Security</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Contact Person</label>
                  <input required type="text" placeholder="Full name" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700" />
                </div>
                <div>
                  <label className="block text-gray-500 font-medium mb-1">Email</label>
                  <input required type="email" placeholder="name@company.co.za" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-700 text-white rounded-xl font-medium">Save Contractor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}