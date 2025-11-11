import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Download, Mail, Phone, Globe, Calendar, Filter } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

interface CrmBetaSignup {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite?: string;
  vendorType?: string;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CrmBetaTab() {
  const [signups, setSignups] = useState<CrmBetaSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchSignups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getCrmBetaSignups(page, 20, statusFilter || undefined);
      setSignups(response.data.signups);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      logger.error('Failed to fetch CRM beta signups:', err);
      setError(err.response?.data?.message || 'Failed to load beta signups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, [page, statusFilter]);

  const handleStatusChange = async (signupId: string, newStatus: string) => {
    try {
      await adminAPI.updateCrmBetaStatus(signupId, newStatus);
      // Refresh the list
      await fetchSignups();
    } catch (err: any) {
      logger.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminAPI.exportCrmBetaSignups();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crm-beta-signups-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      logger.error('Failed to export signups:', err);
      alert('Failed to export signups');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CRM Beta Signups</h2>
            <p className="text-gray-600 mt-1">
              {signups.length > 0 ? `Showing ${signups.length} signups` : 'No signups yet'}
            </p>
          </div>

          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Signups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading signups...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchSignups}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : signups.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No beta signups found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{signup.name}</div>
                        <div className="text-gray-500 flex items-center gap-1 mt-1">
                          <Mail size={14} />
                          {signup.email}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <Phone size={14} />
                          {signup.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{signup.companyName}</div>
                        {signup.companyWebsite && (
                          <a
                            href={signup.companyWebsite.startsWith('http') ? signup.companyWebsite : `https://${signup.companyWebsite}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                          >
                            <Globe size={14} />
                            <span className="text-xs">Visit</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {signup.vendorType || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signup.status)}`}>
                        {signup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(signup.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(signup.createdAt), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={signup.status}
                        onChange={(e) => handleStatusChange(signup.id, e.target.value)}
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
