import React, { useState } from 'react';
import { Search, Download, Filter, RefreshCw, Clock } from 'lucide-react';

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-1001',
    timestamp: '2026-10-20 14:32:10',
    user: 'Thandi Nkosi',
    role: 'Compliance Officer',
    action: 'Approved Document',
    details: 'Approved Tax Pin Certificate for Mokoena Electrical (Pty) Ltd',
    ipAddress: '192.168.1.45',
    severity: 'info'
  },
  {
    id: 'LOG-1002',
    timestamp: '2026-10-19 11:15:22',
    user: 'Pieter Botha',
    role: 'Contractor Admin',
    action: 'Uploaded Document',
    details: 'Uploaded COIDA Certificate (COIDA-2026.pdf)',
    ipAddress: '102.130.42.12',
    severity: 'info'
  },
  {
    id: 'LOG-1003',
    timestamp: '2026-10-18 09:05:00',
    user: 'System Automated',
    role: 'System',
    action: 'Status Change',
    details: 'Marked B-BBEE Certificate as Expiring Soon for Mokoena Electrical',
    ipAddress: 'Internal',
    severity: 'warning'
  },
  {
    id: 'LOG-1004',
    timestamp: '2026-10-15 16:45:12',
    user: 'Johan van Wyk',
    role: 'Compliance Officer',
    action: 'Rejected Document',
    details: 'Rejected Liability Insurance for SecureGuard Bloem: Expired Document',
    ipAddress: '192.168.1.88',
    severity: 'danger'
  },
  {
    id: 'LOG-1005',
    timestamp: '2026-10-14 08:20:19',
    user: 'Sipho Mokoena',
    role: 'Contractor User',
    action: 'User Login',
    details: 'User successfully logged into portal',
    ipAddress: '41.21.192.5',
    severity: 'info'
  }
];

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLogs = MOCK_AUDIT_LOGS.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getBadgeStyle = (severity) => {
    switch (severity) {
      case 'info':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'danger':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit log</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track system activities, compliance changes, and user actions in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition">
            <Download className="w-4 h-4 text-gray-500" />
            Export Log
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search user, action, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Action Type</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="Approved Document">Approved Document</option>
            <option value="Uploaded Document">Uploaded Document</option>
            <option value="Rejected Document">Rejected Document</option>
            <option value="Status Change">Status Change</option>
            <option value="User Login">User Login</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none text-gray-700"
          />
        </div>

        <div className="flex items-end h-full pt-5">
          <button
            onClick={() => { setSearchTerm(''); setActionFilter('ALL'); setDateFilter(''); }}
            className="w-full py-2 px-3 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Details</th>
                <th className="py-3.5 px-6 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 whitespace-nowrap text-gray-700 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{log.user}</div>
                      <div className="text-xs text-gray-400">{log.role}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(log.severity)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 max-w-md">
                      {log.details}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs text-gray-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    No log records match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}