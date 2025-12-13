import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { Gift, Users, DollarSign, TrendingUp, Search, Check, X, Eye, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

interface AdminReferralOverview {
  totalReferrals: number;
  totalCommissionsOwed: number;
  pendingPayoutRequests: number;
  totalPaidOut: number;
}

interface AdminReferrer {
  id: string;
  email: string;
  businessName: string;
  referralCode: string;
  referralEnabled: boolean;
  referralCount: number;
  totalEarned: number;
  pendingAmount: number;
  paidAmount: number;
  createdAt: string;
}

interface AdminPayoutRequest {
  id: string;
  referrer: {
    id: string;
    email: string;
    businessName: string;
  };
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
}

interface ReferredUser {
  id: string;
  email: string;
  businessName: string;
  totalPurchases: number;
  totalCommission: number;
  createdAt: string;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  lead?: {
    id: string;
    location: string;
  };
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
}

interface ReferrerDetails {
  referrer: AdminReferrer;
  referredUsers: ReferredUser[];
  commissions: Commission[];
  payouts: PayoutHistory[];
}

export default function ReferralsTab() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<AdminReferralOverview | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<AdminPayoutRequest[]>([]);
  const [referrers, setReferrers] = useState<AdminReferrer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerDetails | null>(null);
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRequest | null>(null);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, payoutsRes, referrersRes] = await Promise.all([
        adminAPI.getReferralOverview(),
        adminAPI.getPendingPayouts(1, 50),
        adminAPI.getAllReferrers(currentPage, 50, searchTerm || undefined),
      ]);

      setOverview(overviewRes.data);
      setPendingPayouts(payoutsRes.data.payouts || []);
      setReferrers(referrersRes.data.referrers || []);
      setTotalPages(Math.ceil((referrersRes.data.pagination?.total || 0) / 50));
    } catch (error) {
      logger.error('Failed to fetch referral data:', error);
      alert('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReferrer = async (userId: string) => {
    try {
      const response = await adminAPI.getReferrerDetails(userId);
      setSelectedReferrer(response.data);
      setShowReferrerModal(true);
    } catch (error) {
      logger.error('Failed to fetch referrer details:', error);
      alert('Failed to fetch referrer details');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayout) return;

    try {
      await adminAPI.markPayoutAsPaid(selectedPayout.id, payoutNotes || undefined);
      alert('Payout marked as paid successfully');
      setShowPayoutModal(false);
      setSelectedPayout(null);
      setPayoutNotes('');
      fetchData();
    } catch (error: any) {
      logger.error('Failed to mark payout as paid:', error);
      alert(error.response?.data?.message || 'Failed to mark payout as paid');
    }
  };

  const handleToggleReferral = async (userId: string) => {
    if (!confirm('Are you sure you want to toggle this user\'s referral status?')) return;

    try {
      await adminAPI.toggleUserReferral(userId);
      alert('Referral status toggled successfully');
      fetchData();
    } catch (error: any) {
      logger.error('Failed to toggle referral status:', error);
      alert(error.response?.data?.message || 'Failed to toggle referral status');
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Referrals</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : overview?.totalReferrals || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Commissions Owed</p>
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : `$${overview?.totalCommissionsOwed.toFixed(2) || '0.00'}`}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : overview?.pendingPayoutRequests || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : `$${overview?.totalPaidOut.toFixed(2) || '0.00'}`}
          </p>
        </div>
      </div>

      {/* Pending Payouts Section */}
      {pendingPayouts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Pending Payout Requests
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referrer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Requested</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">{payout.referrer.businessName}</td>
                    <td className="py-3 px-4 text-sm">{payout.referrer.email}</td>
                    <td className="py-3 px-4 text-sm font-semibold">${payout.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(payout.requestedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowPayoutModal(true);
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Check size={14} />
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Referrers Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Referrers
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or business"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referrer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700"># Referrals</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Earned</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pending</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paid</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                    <p className="mt-2">Loading referrers...</p>
                  </td>
                </tr>
              ) : referrers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No referrers found
                  </td>
                </tr>
              ) : (
                referrers.map((referrer) => (
                  <tr
                    key={referrer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewReferrer(referrer.id)}
                  >
                    <td className="py-3 px-4 text-sm font-medium">{referrer.businessName}</td>
                    <td className="py-3 px-4 text-sm">{referrer.email}</td>
                    <td className="py-3 px-4 text-sm">{referrer.referralCount}</td>
                    <td className="py-3 px-4 text-sm font-semibold">${referrer.totalEarned.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-orange-600">${referrer.pendingAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-green-600">${referrer.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleReferral(referrer.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          referrer.referralEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {referrer.referralEnabled ? (
                          <>
                            <ToggleRight size={14} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} />
                            Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewReferrer(referrer.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Referrer Details Modal */}
      {showReferrerModal && selectedReferrer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl my-8">
            <div className="flex items-start justify-between mb-6 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Referrer Details</h3>
                <p className="text-sm text-gray-500">{selectedReferrer.referrer.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowReferrerModal(false);
                  setSelectedReferrer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Referrer Info */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Referrer Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Business Name</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{selectedReferrer.referrer.businessName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Referral Code</label>
                  <p className="text-base font-mono font-medium text-gray-900 mt-1">{selectedReferrer.referrer.referralCode}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Total Referrals</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{selectedReferrer.referrer.referralCount}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <p className={`text-base font-medium mt-1 ${selectedReferrer.referrer.referralEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedReferrer.referrer.referralEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Referred Users */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Referred Users ({selectedReferrer.referredUsers.length})</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Email</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Business</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Purchases</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Commission</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReferrer.referredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-gray-100">
                        <td className="py-2 px-4 text-sm">{user.email}</td>
                        <td className="py-2 px-4 text-sm">{user.businessName}</td>
                        <td className="py-2 px-4 text-sm">${user.totalPurchases.toFixed(2)}</td>
                        <td className="py-2 px-4 text-sm font-semibold text-green-600">${user.totalCommission.toFixed(2)}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout History */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Payout History ({selectedReferrer.payouts.length})</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Status</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Requested</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Processed</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReferrer.payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-500">No payout history</td>
                      </tr>
                    ) : (
                      selectedReferrer.payouts.map((payout) => (
                        <tr key={payout.id} className="border-t border-gray-100">
                          <td className="py-2 px-4 text-sm font-semibold">${payout.amount.toFixed(2)}</td>
                          <td className="py-2 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600">{format(new Date(payout.requestedAt), 'MMM dd, yyyy')}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">
                            {payout.processedAt ? format(new Date(payout.processedAt), 'MMM dd, yyyy') : '-'}
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600">{payout.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowReferrerModal(false);
                  setSelectedReferrer(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Payout as Paid Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Payout as Paid</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Referrer:</strong> {selectedPayout.referrer.businessName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Email:</strong> {selectedPayout.referrer.email}
              </p>
              <p className="text-sm text-gray-700 mb-4">
                <strong>Amount:</strong> ${selectedPayout.amount.toFixed(2)}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add any notes about this payout..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedPayout(null);
                  setPayoutNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                <Check size={16} />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
