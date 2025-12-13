import React, { useState, useEffect } from 'react';
import { Gift, Copy, DollarSign, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { referralAPI } from '../../services/api';
import { format } from 'date-fns';
import Notification from '../../components/Notification';
import { logger } from '../../utils/logger';

interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingAmount: number;
  paidAmount: number;
}

interface Purchase {
  id: string;
  amount: number;
  date: string;
  commission: {
    amount: number;
    status: string;
  } | null;
}

interface ReferredUser {
  id: string;
  businessName: string;
  email: string;
  signupDate: string;
  totalPurchases: number;
  totalSpent: number;
  commissionEarned: number;
  purchases: Purchase[];
}

interface ReferralPayout {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestedAt: string;
  paidAt: string | null;
  notes: string | null;
  commissionsCount: number;
}

export const ReferralsTab: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsPagination, setPayoutsPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, [usersPage, payoutsPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, linkRes, usersRes, payoutsRes] = await Promise.all([
        referralAPI.getStats(),
        referralAPI.getLink(),
        referralAPI.getReferredUsers(usersPage, 20),
        referralAPI.getPayoutHistory(payoutsPage, 20),
      ]);

      setStats(statsRes.data.stats);
      setReferralCode(linkRes.data.referralCode || '');
      setReferredUsers(usersRes.data.referredUsers || []);
      setPayouts(payoutsRes.data.payouts || []);

      if (usersRes.data.pagination) {
        setUsersPagination(usersRes.data.pagination);
      }
      if (payoutsRes.data.pagination) {
        setPayoutsPagination(payoutsRes.data.pagination);
      }
    } catch (error) {
      logger.error('Failed to fetch referral data:', error);
      setNotification({ message: 'Failed to load referral data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const referralLink = `https://blackbowassociates.com/sign-up?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setNotification({ message: 'Referral link copied to clipboard!', type: 'success' });
    } catch (error) {
      logger.error('Failed to copy link:', error);
      setNotification({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleRequestPayout = async () => {
    if (!stats || stats.pendingAmount < 50) {
      setNotification({ message: 'Minimum $50 required for payout', type: 'error' });
      return;
    }

    try {
      setRequestingPayout(true);
      await referralAPI.requestPayout();
      setNotification({ message: 'Payout request submitted successfully!', type: 'success' });
      await fetchData();
    } catch (error: any) {
      logger.error('Failed to request payout:', error);
      setNotification({ message: error.response?.data?.message || 'Failed to request payout', type: 'error' });
    } finally {
      setRequestingPayout(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAID':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  const referralLink = `https://blackbowassociates.com/sign-up?ref=${referralCode}`;

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6" />
          <h3 className="text-lg font-bold">Your Referral Link</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-3 bg-white/10 rounded-lg text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
        <p className="mt-3 text-sm text-white/70">
          Share this link with other vendors and earn 10% commission on their purchases!
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Referred</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalReferred || 0}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Earned</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(stats?.totalEarned || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pending Payout</p>
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(stats?.pendingAmount || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Already Paid</p>
            <DollarSign className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(stats?.paidAmount || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Request Payout Button */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Request Payout</h3>
            <p className="text-sm text-gray-600 mt-1">
              Minimum payout amount: $50.00
              {stats && stats.pendingAmount < 50 && (
                <span className="block text-yellow-600 font-medium mt-1">
                  You need ${(50 - stats.pendingAmount).toFixed(2)} more to request a payout
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={!stats || stats.pendingAmount < 50 || requestingPayout}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !stats || stats.pendingAmount < 50
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {requestingPayout ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Referred Users {usersPagination && `(${usersPagination.total})`}
          </h3>
        </div>

        {referredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No referred users yet. Start sharing your referral link!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {referredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{user.businessName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-green-600">
                        ${user.commissionEarned.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{user.purchases.length} purchases</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Registered: {format(new Date(user.signupDate), 'MMM dd, yyyy')}
                  </p>
                  {user.purchases.length > 0 && (
                    <button
                      onClick={() => toggleUserExpansion(user.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {expandedUserId === user.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Purchases
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Purchases
                        </>
                      )}
                    </button>
                  )}
                  {expandedUserId === user.id && user.purchases.length > 0 && (
                    <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-200">
                      {user.purchases.map((purchase) => (
                        <div key={purchase.id} className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purchase: {purchase.id.substring(0, 8)}</span>
                            <span className="font-medium text-green-600">+${purchase.commission?.amount.toFixed(2) || '0.00'}</span>
                          </div>
                          <p className="text-gray-500">
                            {format(new Date(purchase.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Purchases
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {referredUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {user.businessName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(user.signupDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">
                          {user.purchases.length}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                          ${user.commissionEarned.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.purchases.length > 0 && (
                            <button
                              onClick={() => toggleUserExpansion(user.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {expandedUserId === user.id ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedUserId === user.id && user.purchases.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                Purchase History
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {user.purchases.map((purchase) => (
                                  <div
                                    key={purchase.id}
                                    className="bg-white p-3 rounded border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs text-gray-500">
                                        Purchase: {purchase.id.substring(0, 8)}
                                      </span>
                                      <span className="text-sm font-semibold text-green-600">
                                        +${purchase.commission?.amount.toFixed(2) || '0.00'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      Amount: ${purchase.amount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {format(new Date(purchase.date), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users */}
            {usersPagination && usersPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                  disabled={usersPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    usersPage === 1
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {usersPage} of {usersPagination.totalPages}
                </span>
                <button
                  onClick={() => setUsersPage(prev => Math.min(usersPagination.totalPages, prev + 1))}
                  disabled={usersPage === usersPagination.totalPages}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    usersPage === usersPagination.totalPages
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payout History Table */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Payout History {payoutsPagination && `(${payoutsPagination.total})`}
            </h3>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">${payout.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Requested: {format(new Date(payout.requestedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </div>
                {payout.paidAt && (
                  <p className="text-xs text-gray-500">
                    Processed: {format(new Date(payout.paidAt), 'MMM dd, yyyy')}
                  </p>
                )}
                {payout.notes && (
                  <p className="text-xs text-gray-600 italic">{payout.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date Requested
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(payout.requestedAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                      ${payout.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded border ${getStatusBadgeColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.paidAt ? format(new Date(payout.paidAt), 'MMM dd, yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination for Payouts */}
          {payoutsPagination && payoutsPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setPayoutsPage(prev => Math.max(1, prev - 1))}
                disabled={payoutsPage === 1}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  payoutsPage === 1
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {payoutsPage} of {payoutsPagination.totalPages}
              </span>
              <button
                onClick={() => setPayoutsPage(prev => Math.min(payoutsPagination.totalPages, prev + 1))}
                disabled={payoutsPage === payoutsPagination.totalPages}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  payoutsPage === payoutsPagination.totalPages
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <Notification
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        isOpen={!!notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};
