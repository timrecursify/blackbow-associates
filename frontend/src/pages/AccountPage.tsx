import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { DepositModal } from '../components/DepositModal';
import Notification from '../components/Notification';
import { DollarSign, Calendar, MapPin, Mail, Phone, User as UserIcon, Briefcase, ExternalLink, Camera, Edit2, Save, X, FileText } from 'lucide-react';
import { usersAPI } from '../services/api';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  businessName: string | null;
  vendorType: string | null;
  balance: number;
  billing?: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    isCompany: boolean;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
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
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'leads'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [editForm, setEditForm] = useState({ businessName: '', vendorType: '' });
  const [billingForm, setBillingForm] = useState({
    isCompany: false,
    firstName: '',
    lastName: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: ''
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchData();

    // Handle tab parameter from URL (e.g., /account?tab=leads)
    const tabParam = searchParams.get('tab');
    if (tabParam === 'leads' || tabParam === 'transactions' || tabParam === 'overview') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
      
      // Set billing form from profile billing data
      if (userData.billing) {
        setBillingForm({
          isCompany: userData.billing.isCompany || false,
          firstName: userData.billing.firstName || '',
          lastName: userData.billing.lastName || '',
          companyName: userData.billing.companyName || '',
          addressLine1: userData.billing.addressLine1 || '',
          addressLine2: userData.billing.addressLine2 || '',
          city: userData.billing.city || '',
          state: userData.billing.state || '',
          zip: userData.billing.zip || ''
        });
      }
      
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
      setNotification({ message: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setNotification({ message: 'Failed to update profile', type: 'error' });
    }
  };

  const handleSaveBilling = async () => {
    try {
      // Validate required fields based on company/individual
      if (billingForm.isCompany) {
        if (!billingForm.companyName || !billingForm.addressLine1 ||
            !billingForm.city || !billingForm.state || !billingForm.zip) {
          setNotification({ message: 'Please fill in all required billing address fields', type: 'error' });
          return;
        }
      } else {
        if (!billingForm.firstName || !billingForm.lastName || !billingForm.addressLine1 ||
            !billingForm.city || !billingForm.state || !billingForm.zip) {
          setNotification({ message: 'Please fill in all required billing address fields', type: 'error' });
          return;
        }
      }

      // Validate ZIP code format
      if (!/^\d{5}(-\d{4})?$/.test(billingForm.zip)) {
        setNotification({ message: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)', type: 'error' });
        return;
      }

      // Validate state code
      if (!/^[A-Z]{2}$/i.test(billingForm.state)) {
        setNotification({ message: 'Please enter a valid 2-letter state code (e.g., NY, CA)', type: 'error' });
        return;
      }

      await usersAPI.updateBillingAddress({
        firstName: billingForm.isCompany ? '' : billingForm.firstName,
        lastName: billingForm.isCompany ? '' : billingForm.lastName,
        companyName: billingForm.isCompany ? billingForm.companyName : '',
        isCompany: billingForm.isCompany,
        addressLine1: billingForm.addressLine1,
        addressLine2: billingForm.addressLine2 || undefined,
        city: billingForm.city,
        state: billingForm.state.toUpperCase(),
        zip: billingForm.zip
      });
      
      await fetchData();
      setIsEditingBilling(false);
      setNotification({ message: 'Billing address updated successfully', type: 'success' });
    } catch (error: any) {
      console.error('Failed to update billing address:', error);
      setNotification({ message: error.response?.data?.message || 'Failed to update billing address', type: 'error' });
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
      setNoteText('');
      setNotification({ message: 'Note saved successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to save note:', error);
      setNotification({ message: 'Failed to save note', type: 'error' });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-700 transition-colors duration-200">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="font-handwritten text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-black mb-2 transition-colors duration-200">My Account</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 transition-colors duration-200">Manage your profile, balance, and purchased leads</p>
        </div>

        {/* Balance Card */}
        <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 transition-colors duration-200">Account Balance</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-black transition-colors duration-200">
                ${((profile?.balance !== undefined && profile?.balance !== null) ? profile.balance : 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-black text-white sm:text-base font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200 transition-colors duration-200">
          <div className="flex gap-4 sm:gap-8 min-w-max">
            {['overview', 'transactions', 'leads'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 sm:pb-4 text-xs sm:text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-black'
                    : 'text-gray-600'
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
            <div className="bg-white sm:p-6 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-black transition-colors duration-200">Profile Information</h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white sm:text-sm rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Save size={14} className="sm:w-4 sm:h-4" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Email</label>
                  <p className="text-sm sm:text-base text-blacks transition-colors duration-200">{profile?.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Business Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editForm.businessName}
                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                      placeholder="Enter business name"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-black transition-colors duration-200">{profile?.businessName || <span className="text-gray-400">Not set</span>}</p>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Vendor Type</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editForm.vendorType}
                      onChange={(e) => setEditForm({ ...editForm, vendorType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                      placeholder="e.g., Photographer, Videographer"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-black transition-colors duration-200">{profile?.vendorType || <span className="text-gray-400">Not set</span>}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="bg-white sm:p-6 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-black transition-colors duration-200">Billing Address</h2>
                {!isEditingBilling ? (
                  <button
                    onClick={() => setIsEditingBilling(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                    {profile?.billing?.firstName ? 'Edit Address' : 'Add Address'}
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setIsEditingBilling(false);
                        // Reset form to profile data
                        if (profile?.billing) {
                          setBillingForm({
                            isCompany: profile.billing.isCompany || false,
                            firstName: profile.billing.firstName || '',
                            lastName: profile.billing.lastName || '',
                            companyName: profile.billing.companyName || '',
                            addressLine1: profile.billing.addressLine1 || '',
                            addressLine2: profile.billing.addressLine2 || '',
                            city: profile.billing.city || '',
                            state: profile.billing.state || '',
                            zip: profile.billing.zip || ''
                          });
                        } else {
                          setBillingForm({
                            isCompany: false,
                            firstName: '',
                            lastName: '',
                            companyName: '',
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            zip: ''
                          });
                        }
                      }}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBilling}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-black text-white sm:text-sm rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Save size={14} className="sm:w-4 sm:h-4" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              {!isEditingBilling ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {profile?.billing?.firstName || profile?.billing?.companyName ? (
                    <>  
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                          {profile.billing.isCompany ? 'Company Name' : 'Name'}
                        </label>
                        <p className="text-sm sm:text-base text-black transition-colors duration-200">
                          {profile.billing.isCompany 
                            ? profile.billing.companyName 
                            : `${profile.billing.firstName} ${profile.billing.lastName}`}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Address</label>
                        <p className="text-sm sm:text-base text-black transition-colors duration-200">
                          {profile.billing.addressLine1}
                          {profile.billing.addressLine2 && <><br />{profile.billing.addressLine2}</>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">City</label>
                        <p className="text-sm sm:text-base text-black transition-colors duration-200">{profile.billing.city}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">State</label>
                        <p className="text-sm sm:text-base text-black transition-colors duration-200">{profile.billing.state}</p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">ZIP Code</label>
                        <p className="text-sm sm:text-base text-black transition-colors duration-200">{profile.billing.zip}</p>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500 transition-colors duration-200">No billing address on file. Please add one to make deposits.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Company/Individual Toggle */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50sition-colors duration-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billingForm.isCompany}
                        onChange={(e) => setBillingForm({ ...billingForm, isCompany: e.target.checked })}
                        className="w-4 h-4 text-black focus:ring-2 focus:ring-black transition-colors duration-200"
                      />
                      <span className="text-sm font-medium text-gray-900 transition-colors duration-200">This is a company</span>
                    </label>
                  </div>

                  {/* Company Name (if company) */}
                  {billingForm.isCompany ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billingForm.companyName}
                        onChange={(e) => setBillingForm({ ...billingForm, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                        placeholder="Acme Inc."
                      />
                    </div>
                  ) : (
                    /* Name Fields (if individual) */
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={billingForm.firstName}
                          onChange={(e) => setBillingForm({ ...billingForm, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={billingForm.lastName}
                          onChange={(e) => setBillingForm({ ...billingForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingForm.addressLine1}
                      onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={billingForm.addressLine2}
                      onChange={(e) => setBillingForm({ ...billingForm, addressLine2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                      placeholder="Apt, suite, unit, etc."
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billingForm.city}
                        onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                        placeholder="New York"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billingForm.state}
                        onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                        placeholder="NY"
                        maxLength={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">
                        ZIP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billingForm.zip}
                        onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 sm:text-base text-black outline-none focus:border-black focus:ring-2 focus:ring-black transition-colors duration-200"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="bg-white sm:p-12 text-center transition-colors duration-200">
                <p className="text-sm sm:text-base text-gray-700 transition-colors duration-200">No transactions yet</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative transition-colors duration-200">
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
                            <span className="text-xs text-gray-500 transition-colors duration-200">
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-black transition-colors duration-200">
                            {transaction.description || transaction.metadata?.description || 'Transaction'}
                            {transaction.type === 'PURCHASE' && transaction.metadata?.leadId && (
                              <span className="ml-2 text-xs text-gray-500 transition-colors duration-200">
                                (Lead: {transaction.metadata.leadId.substring(0, 8)})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className={`text-sm font-bold ${
                            transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? '+' : '-'}${Math.abs(transaction.amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 transition-colors duration-200">
                            Balance: ${((transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) ? transaction.balanceAfter : 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative transition-colors duration-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50sition-colors duration-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Lead ID</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100sition-colors duration-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50sition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black transition-colors duration-200">
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
                          <td className="px-6 py-4 text-sm text-black transition-colors duration-200">
                            {transaction.description || transaction.metadata?.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 transition-colors duration-200">
                            {transaction.type === 'PURCHASE' && transaction.metadata?.leadId ? (
                              transaction.metadata.leadId.substring(0, 8)
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                            transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? '+' : '-'}$
                            {Math.abs(transaction.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black transition-colors duration-200">
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
              <h2 className="text-base sm:text-lg font-bold text-black transition-colors duration-200">
                Purchased Leads ({purchasedLeads.length})
              </h2>
            </div>

            {purchasedLeads.length === 0 ? (
              <div className="bg-white sm:p-12 text-center transition-colors duration-200">
                <p className="text-sm sm:text-base text-gray-700 transition-colors duration-200">You haven't purchased any leads yet</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 bg-blacksm:px-6 py-2.5 sm:py-3 rounded hover:bg-gray-800sm sm:text-base font-medium transition-colors duration-200"
                >
                  Browse Marketplace
                  <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchasedLeads.map((lead) => (
                  <div key={lead.id} className="bg-white sm:p-6 transition-colors duration-200">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 transition-colors duration-200">Wedding Date</p>
                          <p className="text-sm font-semibold text-black transition-colors duration-200">
                            {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMM dd, yyyy') : 'TBD'}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-xs text-gray-500 transition-colors duration-200">Purchased</p>
                          <p className="text-xs text-gray-600 transition-colors duration-200">
                            {format(new Date(lead.purchasedAt), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 transition-colors duration-200">Location</p>
                        <p className="text-sm text-black transition-colors duration-200">{lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 transition-colors duration-200">Services Needed</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.servicesNeeded.map((service, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-blue-50sition-colors duration-200">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      {lead.description && (
                        <div className="pt-2 border-t border-gray-100sition-colors duration-200">
                          <p className="text-xs text-gray-500 transition-colors duration-200">Description</p>
                          <p className="text-sm text-gray-700 transition-colors duration-200">{lead.description}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200sition-colors duration-200">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Contact Information</p>
                        {lead.personName && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 transition-colors duration-200">Name</p>
                            <p className="text-sm text-black transition-colors duration-200">{lead.personName}</p>
                          </div>
                        )}
                        {lead.email && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 transition-colors duration-200">Email</p>
                            <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 transition-colors duration-200">{lead.email}</a>
                          </div>
                        )}
                        {lead.phone && (
                          <div>
                            <p className="text-xs text-gray-500 transition-colors duration-200">Phone</p>
                            <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 transition-colors duration-200">{lead.phone}</a>
                          </div>
                        )}
                      </div>

                      {/* Notes Section Mobile */}
                      <div className="pt-3 border-t border-gray-200sition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 transition-colors duration-200">
                            <FileText size={14} />
                            My Notes
                          </label>
                          {editingNoteId !== lead.leadId && (
                            <button
                              onClick={() => handleEditNote(lead)}
                              className="text-xs text-gray-600 transition-colors duration-200"
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
                              className="w-full px-3 py-2 border border-gray-200 text-black outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-colors duration-200"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(lead.leadId)}
                                disabled={savingNote}
                                className="flex-1 px-4 py-2 bg-blacksm rounded hover:bg-gray-800sabled:bg-gray-400sabled:bg-gray-600 font-medium transition-colors duration-200"
                              >
                                {savingNote ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelNote}
                                className="flex-1 px-4 py-2 bg-gray-100sm rounded hover:bg-gray-200sition-colors duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700space-pre-wrap min-h-[2rem] transition-colors duration-200">
                            {lead.notes || <span className="text-gray-400">No notes yet</span>}
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
                            <p className="text-xs text-gray-600semibold uppercase tracking-wide mb-1 transition-colors duration-200">Wedding Date</p>
                            <p className="text-sm text-black transition-colors duration-200">
                              {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMMM dd, yyyy') : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600semibold uppercase tracking-wide mb-1 transition-colors duration-200">Location</p>
                            <p className="text-sm text-black transition-colors duration-200">{lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600semibold uppercase tracking-wide mb-1 transition-colors duration-200">Services</p>
                            <div className="flex flex-wrap gap-1">
                              {lead.servicesNeeded.map((service, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs font-medium bg-blue-50sition-colors duration-200">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                          {lead.description && (
                            <div>
                              <p className="text-xs text-gray-600semibold uppercase tracking-wide mb-1 transition-colors duration-200">Package Description</p>
                              <p className="text-sm text-gray-700 transition-colors duration-200">{lead.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 bg-gray-50sition-colors duration-200">
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide transition-colors duration-200">Contact Information</h3>
                          {lead.personName && (
                            <div>
                              <p className="text-xs text-gray-600 transition-colors duration-200">Name</p>
                              <p className="text-sm text-black transition-colors duration-200">{lead.personName}</p>
                            </div>
                          )}
                          {lead.email && (
                            <div>
                              <p className="text-xs text-gray-600 transition-colors duration-200">Email</p>
                              <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 transition-colors duration-200">{lead.email}</a>
                            </div>
                          )}
                          {lead.phone && (
                            <div>
                              <p className="text-xs text-gray-600 transition-colors duration-200">Phone</p>
                              <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 transition-colors duration-200">{lead.phone}</a>
                            </div>
                          )}
                          <div className="pt-3 border-t border-gray-200sition-colors duration-200">
                            <p className="text-xs text-gray-600 transition-colors duration-200">Purchased On</p>
                            <p className="text-sm text-black transition-colors duration-200">{format(new Date(lead.purchasedAt), 'MMM dd, yyyy HH:mm')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section Desktop */}
                      <div className="mt-4 pt-4 border-t border-gray-200sition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 transition-colors duration-200">
                            <FileText size={14} />
                            My Notes
                          </label>
                          {editingNoteId !== lead.leadId && (
                            <button
                              onClick={() => handleEditNote(lead)}
                              className="text-xs text-gray-600 transition-colors duration-200"
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
                              className="w-full px-3 py-2 border border-gray-200 text-black outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-colors duration-200"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(lead.leadId)}
                                disabled={savingNote}
                                className="px-4 py-2 bg-blacksm rounded hover:bg-gray-800sabled:bg-gray-400sabled:bg-gray-600 font-medium transition-colors duration-200"
                              >
                                {savingNote ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelNote}
                                className="px-4 py-2 bg-gray-100sm rounded hover:bg-gray-200sition-colors duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700space-pre-wrap min-h-[2rem] transition-colors duration-200">
                            {lead.notes || <span className="text-gray-400">No notes yet</span>}
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
        onClose={() => {
          // Close modal FIRST, then fetch data to prevent reopening
          setShowDepositModal(false);
        }}
        onSuccess={async () => {
          // Fetch data AFTER modal is closed to prevent reopening
          await fetchData();
        }}
      />
      <Notification
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        isOpen={!!notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};
