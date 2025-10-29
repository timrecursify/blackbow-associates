import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { DepositModal } from '../components/DepositModal';
import { DollarSign, Calendar, MapPin, Mail, Phone, User as UserIcon, Briefcase, ExternalLink } from 'lucide-react';
import { usersAPI } from '../services/api';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  businessName: string | null;
  vendorType: string | null;
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

interface PurchasedLead {
  id: string;
  leadId: string;
  purchasedAt: string;
  lead: {
    id: string;
    weddingDate: string | null;
    location: string;
    budgetMin: number | null;
    budgetMax: number | null;
    servicesNeeded: string[];
    fullInfo: any;
  };
}

export const AccountPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'leads'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, transactionsRes, leadsRes] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getTransactions(1, 50),
        usersAPI.getPurchasedLeads(1, 50),
      ]);

      setProfile(profileRes.data);
      setTransactions(transactionsRes.data.transactions);
      setPurchasedLeads(leadsRes.data.purchases);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-700 text-lg">Loading account data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-black mb-2">
            My Account
          </h1>
          <p className="text-gray-700 text-lg">Manage your profile, balance, and leads</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-bold transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 px-4 font-bold transition-colors ${
              activeTab === 'transactions'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 px-4 font-bold transition-colors ${
              activeTab === 'leads'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            My Leads
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && profile && (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Account Balance</h2>
                  <p className="text-4xl font-bold text-black mb-4">
                    ${profile.balance.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-bold"
                >
                  <DollarSign size={18} />
                  <span>Add Funds</span>
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail size={18} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{profile.email}</p>
                  </div>
                </div>
                {profile.businessName && (
                  <div className="flex items-center space-x-3">
                    <Briefcase size={18} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Business Name</p>
                      <p className="text-sm text-gray-900 font-medium">{profile.businessName}</p>
                    </div>
                  </div>
                )}
                {profile.vendorType && (
                  <div className="flex items-center space-x-3">
                    <UserIcon size={18} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Vendor Type</p>
                      <p className="text-sm text-gray-900 font-medium">{profile.vendorType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm text-gray-600 font-medium mb-2">Total Leads Purchased</h3>
                <p className="text-3xl font-bold text-black">{purchasedLeads.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm text-gray-600 font-medium mb-2">Recent Transactions</h3>
                <p className="text-3xl font-bold text-black">{transactions.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-700">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Balance After
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${
                              transaction.type === 'DEPOSIT'
                                ? 'bg-green-100 text-green-800'
                                : transaction.type === 'PURCHASE'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description || '-'}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                            transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'DEPOSIT' ? '+' : '-'}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ${transaction.balanceAfter.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* My Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                Purchased Leads ({purchasedLeads.length})
              </h2>
            </div>

            {purchasedLeads.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-700 mb-4">You haven't purchased any leads yet</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-bold"
                >
                  <span>Browse Marketplace</span>
                  <ExternalLink size={18} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchasedLeads.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lead Info */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Calendar size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Wedding Date</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {purchase.lead.weddingDate
                                ? format(new Date(purchase.lead.weddingDate), 'MMMM dd, yyyy')
                                : 'TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Location</p>
                            <p className="text-sm text-gray-900 font-medium">{purchase.lead.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Budget</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {purchase.lead.budgetMin && purchase.lead.budgetMax
                                ? `$${purchase.lead.budgetMin.toLocaleString()} - $${purchase.lead.budgetMax.toLocaleString()}`
                                : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Briefcase size={18} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Services Needed</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {purchase.lead.servicesNeeded.join(', ') || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info (from fullInfo) */}
                      <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-900 mb-2">Contact Information</h3>
                        {purchase.lead.fullInfo?.coupleName && (
                          <div className="flex items-center space-x-2">
                            <UserIcon size={18} className="text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Couple</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {purchase.lead.fullInfo.coupleName}
                              </p>
                            </div>
                          </div>
                        )}
                        {purchase.lead.fullInfo?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail size={18} className="text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Email</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {purchase.lead.fullInfo.email}
                              </p>
                            </div>
                          </div>
                        )}
                        {purchase.lead.fullInfo?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone size={18} className="text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Phone</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {purchase.lead.fullInfo.phone}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600">Purchased On</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {format(new Date(purchase.purchasedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Link
                          to={`/leads/${purchase.leadId}`}
                          className="inline-flex items-center space-x-2 text-sm text-black hover:text-gray-700 font-medium"
                        >
                          <span>View Full Details</span>
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          fetchData();
          alert('Funds added successfully!');
        }}
      />
    </div>
  );
};
