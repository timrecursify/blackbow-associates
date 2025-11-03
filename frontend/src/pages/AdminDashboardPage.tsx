import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { BarChart3, Users, Package, MessageSquare, DollarSign, Upload } from 'lucide-react';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';
import OverviewTab from './admin/OverviewTab';
import FeedbackTab from './admin/FeedbackTab';
import AdminGuard from '../components/AdminGuard';

interface User {
  id: string;
  email: string;
  businessName: string | null;
  vendorType: string | null;
  balance: number;
  isAdmin: boolean;
  isBlocked?: boolean;
  blockedReason?: string | null;
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

type TabType = 'overview' | 'users' | 'leads' | 'feedback';

const AdminDashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  // Balance adjustment
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // CSV import
  const [csvData, setCsvData] = useState('');

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'leads') {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers(1, 100);
        setUsers(response.data.users);
      } else if (activeTab === 'leads') {
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

  const handleBlockUser = async (userId: string) => {
    const reason = prompt('Enter reason for blocking this user:');
    if (!reason) return;

    try {
      await adminAPI.blockUser(userId, reason);
      alert('User blocked successfully');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    try {
      await adminAPI.unblockUser(userId);
      alert('User unblocked successfully');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await adminAPI.updateLeadStatus(leadId, newStatus);
      setStatusDropdownOpen(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update lead status');
    }
  };

  const handleStatusClick = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusDropdownOpen(statusDropdownOpen === lead.id ? null : lead.id);
  };

  const statusOptions = ['AVAILABLE', 'SOLD', 'EXPIRED', 'HIDDEN', 'REMOVED'];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'SOLD': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'HIDDEN': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'REMOVED': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Notion-style Status Tag Component
  const StatusTag = ({ lead }: { lead: Lead }) => {
    const isOpen = statusDropdownOpen === lead.id;
    
    return (
      <div className="relative inline-block">
        <button
          onClick={(e) => handleStatusClick(lead, e)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${getStatusColor(lead.status)}`}
        >
          <span>{lead.status}</span>
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setStatusDropdownOpen(null)}
            />
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateLeadStatus(lead.id, status);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors ${
                    status === lead.status ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                    <span>{status}</span>
                    {status === lead.status && (
                      <svg className="w-3 h-3 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const confirmDeleteUser = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!userToDelete) return;

    try {
      await adminAPI.deleteUser(userToDelete.id);
      alert('User deleted successfully');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'leads' as TabType, label: 'Leads', icon: Package },
    { id: 'feedback' as TabType, label: 'Feedback', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-handwritten text-3xl md:text-4xl lg:text-5xl text-black">
            Admin Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-700">
            Comprehensive analytics and system management
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 md:space-x-4 mb-4 md:mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 md:px-4 font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm md:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'feedback' && <FeedbackTab />}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Balance Adjustment Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <DollarSign size={20} />
                <span>Adjust User Balance</span>
              </h2>
              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={adjustUserId}
                      onChange={(e) => setAdjustUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Adjust Balance
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">All Users ({users.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                            {user.id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.businessName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.vendorType || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-semibold">${user.balance.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">
                            {user.isAdmin ? (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Admin
                              </span>
                            ) : user.isBlocked ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Blocked
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {!user.isAdmin && (
                              <div className="flex gap-1">
                                {user.isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user.id)}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(user.id)}
                                    className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                  >
                                    Block
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* CSV Import Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Upload size={20} />
                <span>Import Leads (CSV)</span>
              </h2>
              <form onSubmit={handleImportCSV} className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Paste CSV Data
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="id,location,weddingDate,price,status&#10;MD123456,Maryland,2025-06-15,20.00,AVAILABLE"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 md:px-6 py-2 text-sm md:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Import Leads
                </button>
              </form>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 md:p-4 border-b border-gray-200">
                <h2 className="text-base md:text-lg font-bold text-gray-900">All Leads ({leads.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Wedding Date
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No leads found
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900">{lead.id}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">{lead.location}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                            {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMM d, yyyy') : '-'}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-semibold">${lead.price.toFixed(2)}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <StatusTag lead={lead} />
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Delete User</h3>
            <p className="text-sm md:text-base text-gray-700 mb-4">
              Are you sure you want to delete <strong>{userToDelete?.email}</strong>?
              This action cannot be undone.
            </p>
            <p className="text-xs md:text-sm text-gray-600 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm md:text-base"
              placeholder="Type DELETE"
            />
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleteConfirmText !== 'DELETE'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main exported component with AdminGuard protection
export const AdminDashboardPage: React.FC = () => {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
};
