import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { DepositModal } from '../components/DepositModal';
import { DollarSign, Calendar, MapPin, Mail, Phone, User as UserIcon, Briefcase, ExternalLink, Camera, Edit2, Save, X, FileText } from 'lucide-react';
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
  description?: string | null;
  balanceAfter: number;
  createdAt: string;
  metadata?: any;
}

interface PurchasedLead {
  id: string;
  leadId: string;
  purchasedAt: string;
  weddingDate: string | null;
  location: string;
  city: string | null;
  state: string | null;
  description: string | null;
  servicesNeeded: string[];
  ethnicReligious: string | null;
  firstName: string | null;
  lastName: string | null;
  personName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export const AccountPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'leads'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ businessName: '', vendorType: '' });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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

      const userData = profileRes.data.user || profileRes.data;
      setProfile(userData);
      setEditForm({
        businessName: userData.businessName || '',
        vendorType: userData.vendorType || '',
      });
      
      setTransactions(transactionsRes.data.transactions || []);
      setPurchasedLeads(leadsRes.data.leads || []);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(editForm);
      await fetchData();
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleEditNote = (lead: PurchasedLead) => {
    setEditingNoteId(lead.leadId);
    setNoteText(lead.notes || '');
  };

  const handleSaveNote = async (leadId: string) => {
    try {
      setSavingNote(true);
      await usersAPI.updateLeadNote(leadId, noteText);
      await fetchData();
      setEditingNoteId(null);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCancelNote = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="font-handwritten text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-black mb-1 sm:mb-2">My Account</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">Manage your profile, balance, and purchased leads</p>
        </div>

        {/* Balance Card */}
        <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Account Balance</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">
                ${((profile?.balance !== undefined && profile?.balance !== null) ? profile.balance : 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-black text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-4 sm:gap-8 min-w-max">
            {['overview', 'transactions', 'leads'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 sm:pb-4 text-xs sm:text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-black">Profile Information</h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-black border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white text-xs sm:text-sm rounded-lg hover:bg-gray-800 font-medium"
                    >
                      <Save size={14} className="sm:w-4 sm:h-4" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
                  <p className="text-sm sm:text-base text-black break-words">{profile?.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Business Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editForm.businessName}
                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black"
                      placeholder="Enter business name"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-black">{profile?.businessName || <span className="text-gray-400">Not set</span>}</p>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Vendor Type</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editForm.vendorType}
                      onChange={(e) => setEditForm({ ...editForm, vendorType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black"
                      placeholder="e.g., Photographer, Videographer"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-black">{profile?.vendorType || <span className="text-gray-400">Not set</span>}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-gray-700">No transactions yet</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              transaction.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' :
                              transaction.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {transaction.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-black font-medium truncate">
                            {transaction.description || transaction.metadata?.description || 'Transaction'}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className={`text-sm font-bold ${
                            transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? '+' : '-'}${Math.abs(transaction.amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Balance: ${((transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) ? transaction.balanceAfter : 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              transaction.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' :
                              transaction.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-black">
                            {transaction.description || transaction.metadata?.description || '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                            transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? '+' : '-'}$
                            {Math.abs(transaction.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black text-right">
                            ${((transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) ? transaction.balanceAfter : 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Purchased Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-black">
                Purchased Leads ({purchasedLeads.length})
              </h2>
            </div>

            {purchasedLeads.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-gray-700 mb-4">You haven't purchased any leads yet</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 bg-black text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded hover:bg-gray-800 text-sm sm:text-base font-medium"
                >
                  Browse Marketplace
                  <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchasedLeads.map((lead) => (
                  <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Wedding Date</p>
                          <p className="text-sm font-semibold text-black">
                            {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMM dd, yyyy') : 'TBD'}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-xs text-gray-500 mb-1">Purchased</p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(lead.purchasedAt), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-sm text-black">{lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Services Needed</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.servicesNeeded.map((service, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      {lead.description && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{lead.description}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 bg-gray-50 -mx-4 px-4 py-3 rounded-b-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Contact Information</p>
                        {lead.personName && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-0.5">Name</p>
                            <p className="text-sm text-black font-medium">{lead.personName}</p>
                          </div>
                        )}
                        {lead.email && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-0.5">Email</p>
                            <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 font-medium break-all">{lead.email}</a>
                          </div>
                        )}
                        {lead.phone && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                            <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 font-medium">{lead.phone}</a>
                          </div>
                        )}
                      </div>

                      {/* Notes Section Mobile */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <FileText size={14} />
                            My Notes
                          </label>
                          {editingNoteId !== lead.leadId && (
                            <button
                              onClick={() => handleEditNote(lead)}
                              className="text-xs text-gray-600 hover:text-black font-medium px-2 py-1"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {editingNoteId === lead.leadId ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              rows={3}
                              placeholder="Add notes about this lead..."
                              className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(lead.leadId)}
                                disabled={savingNote}
                                className="flex-1 px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                              >
                                {savingNote ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelNote}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[2rem]">
                            {lead.notes || <span className="text-gray-400 italic">No notes yet</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Lead Info */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Wedding Date</p>
                            <p className="text-sm text-black">
                              {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMMM dd, yyyy') : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Location</p>
                            <p className="text-sm text-black">{lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Services</p>
                            <div className="flex flex-wrap gap-1">
                              {lead.servicesNeeded.map((service, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                          {lead.description && (
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Package Description</p>
                              <p className="text-sm text-gray-700">{lead.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h3>
                          {lead.personName && (
                            <div>
                              <p className="text-xs text-gray-600 mb-0.5">Name</p>
                              <p className="text-sm text-black font-medium">{lead.personName}</p>
                            </div>
                          )}
                          {lead.email && (
                            <div>
                              <p className="text-xs text-gray-600 mb-0.5">Email</p>
                              <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 font-medium break-all">{lead.email}</a>
                            </div>
                          )}
                          {lead.phone && (
                            <div>
                              <p className="text-xs text-gray-600 mb-0.5">Phone</p>
                              <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 font-medium">{lead.phone}</a>
                            </div>
                          )}
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-0.5">Purchased On</p>
                            <p className="text-sm text-black">{format(new Date(lead.purchasedAt), 'MMM dd, yyyy HH:mm')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section Desktop */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <FileText size={14} />
                            My Notes
                          </label>
                          {editingNoteId !== lead.leadId && (
                            <button
                              onClick={() => handleEditNote(lead)}
                              className="text-xs text-gray-600 hover:text-black font-medium px-2 py-1"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {editingNoteId === lead.leadId ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              rows={3}
                              placeholder="Add notes about this lead..."
                              className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(lead.leadId)}
                                disabled={savingNote}
                                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                              >
                                {savingNote ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelNote}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[2rem]">
                            {lead.notes || <span className="text-gray-400 italic">No notes yet</span>}
                          </p>
                        )}
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
        onSuccess={async () => {
          await fetchData();
        }}
      />
    </div>
  );
};
