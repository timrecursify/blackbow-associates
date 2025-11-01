import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Users, Package, Upload, DollarSign } from 'lucide-react';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  businessName: string | null;
  vendorType: string | null;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
}

interface Lead {
  id: string;
  weddingDate: string | null;
  location: string;
  price: number;
  status: string;
  createdAt: string;
}

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'leads'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Balance adjustment
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // CSV import
  const [csvData, setCsvData] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers(1, 100);
        setUsers(response.data.users);
      } else {
        const response = await adminAPI.getAllLeads(1, 100);
        setLeads(response.data.leads);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to fetch data. Ensure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.adjustBalance(adjustUserId, parseFloat(adjustAmount), adjustReason);
      alert('Balance adjusted successfully!');
      setAdjustUserId('');
      setAdjustAmount('');
      setAdjustReason('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to adjust balance');
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse CSV (simple implementation - expects comma-separated values)
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const leadsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const leadObj: any = {};
        headers.forEach((header, index) => {
          leadObj[header] = values[index];
        });
        return leadObj;
      });

      await adminAPI.importLeads(leadsData);
      alert(`Successfully imported ${leadsData.length} leads!`);
      setCsvData('');
      if (activeTab === 'leads') {
        fetchData();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to import CSV');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-black transition-colors duration-200">
            Admin Dashboard
          </h1>
          <p className="text-gray-700 transition-colors duration-200">Manage users, leads, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 transition-colors duration-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-bold transition-colors flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-black'
                : 'text-gray-600'
            }`}
          >
            <Users size={18} />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 px-4 font-bold transition-colors flex items-center space-x-2 ${
              activeTab === 'leads'
                ? 'border-b-2 border-black'
                : 'text-gray-600'
            }`}
          >
            <Package size={18} />
            <span>Leads</span>
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Balance Adjustment Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200sition-colors duration-200">
              <h2 className="text-lg font-bold text-gray-900s-center space-x-2 transition-colors duration-200">
                <DollarSign size={20} />
                <span>Adjust User Balance</span>
              </h2>
              <form onSubmit={handleAdjustBalance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black transition-colors duration-200"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} (${((user.balance !== undefined && user.balance !== null) ? user.balance : 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Amount (+/-)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black transition-colors duration-200"
                  required
                />
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Reason"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black transition-colors duration-200"
                  required
                />
                <button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  Adjust
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200sition-colors duration-200">
              <div className="p-6 border-b border-gray-200sition-colors duration-200">
                <h2 className="text-lg font-bold text-gray-900 transition-colors duration-200">All Users ({users.length})</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-700 transition-colors duration-200">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50sition-colors duration-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Business</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-900se transition-colors duration-200">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200sition-colors duration-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50sition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">{user.businessName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">{user.vendorType || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">
                            ${((user.balance !== undefined && user.balance !== null) ? user.balance : 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {user.isAdmin ? (
                              <span className="px-2 py-1 text-xs font-bold rounded bg-purple-100sition-colors duration-200">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-gray-600 transition-colors duration-200">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* CSV Import Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200sition-colors duration-200">
              <h2 className="text-lg font-bold text-gray-900s-center space-x-2 transition-colors duration-200">
                <Upload size={20} />
                <span>Import Leads (CSV)</span>
              </h2>
              <form onSubmit={handleImportCSV} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 transition-colors duration-200">
                    CSV Data (comma-separated)
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="location,weddingDate,budgetMin,budgetMax,servicesNeeded,coupleName,email,phone&#10;New York NY,2025-06-15,25000,35000,Photography,John & Jane,john@example.com,555-1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black transition-colors duration-200"
                    rows={6}
                    required
                  />
                  <p className="text-xs text-gray-600 transition-colors duration-200">
                    First row should be headers. Each subsequent row is a lead.
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  Import CSV
                </button>
              </form>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200sition-colors duration-200">
              <div className="p-6 border-b border-gray-200sition-colors duration-200">
                <h2 className="text-lg font-bold text-gray-900 transition-colors duration-200">All Leads ({leads.length})</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-700 transition-colors duration-200">Loading leads...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50sition-colors duration-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Wedding Date</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-900se transition-colors duration-200">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-900se transition-colors duration-200">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200sition-colors duration-200">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50sition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">{lead.location}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">
                            {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMM dd, yyyy') : 'TBD'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">
                            ${((lead.price !== undefined && lead.price !== null) ? lead.price : 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors duration-200 ${
                                lead.status === 'AVAILABLE'
                                  ? 'bg-green-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 transition-colors duration-200">
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
