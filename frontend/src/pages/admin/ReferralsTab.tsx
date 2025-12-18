import { useCallback, useEffect, useState } from 'react';
import { logger } from '../../utils/logger';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { Gift, Users, DollarSign, TrendingUp, Search, Check, X, Eye, RefreshCw, ToggleLeft, ToggleRight, Copy, ChevronDown, ChevronUp } from 'lucide-react';

type BackendReferralOverview = {
  totalReferred: number;
  commissions?: {
    pending?: { amount?: number };
  };
  payouts?: {
    pending?: { count?: number };
    paid?: { amount?: number };
  };
};

type BackendReferralOverviewResponse = {
  success: boolean;
  overview?: BackendReferralOverview;
};

type BackendUserLite = {
  id: string;
  email: string;
  businessName: string;
};

type BackendPayout = {
  id: string;
  amount?: number;
  status: string;
  requestedAt: string;
  paidAt?: string | null;
  notes?: string | null;
  user?: BackendUserLite;
};

type BackendPendingPayoutsResponse = {
  success: boolean;
  payouts?: BackendPayout[];
};

type BackendReferrerListItem = {
  id: string;
  email: string;
  businessName: string;
  referralCode: string;
  referralEnabled: boolean;
  signupDate: string;
  stats?: {
    totalReferred?: number;
    totalEarned?: number;
    pendingAmount?: number;
    paidAmount?: number;
  };
};

type BackendReferrersResponse = {
  success: boolean;
  referrers?: BackendReferrerListItem[];
  pagination?: { totalPages?: number };
};

type BackendReferralItem = {
  id: string;
  email: string;
  businessName: string;
  signupDate: string;
  totalPurchases?: number;
  totalSpent?: number;
};

type BackendCommissionItem = {
  id: string;
  amount?: number;
  status: string;
  createdAt: string;
  sourceUser?: { email?: string };
};

type BackendPayoutHistoryItem = {
  id: string;
  amount?: number;
  status: string;
  requestedAt: string;
  paidAt?: string | null;
  notes?: string | null;
};

type BackendReferrerDetailsPayload = {
  id: string;
  email: string;
  businessName: string;
  referralCode: string;
  referralEnabled: boolean;
  signupDate: string;
  stats?: {
    totalReferred?: number;
    totalEarned?: number;
    pendingAmount?: number;
    paidAmount?: number;
  };
  referrals?: BackendReferralItem[];
  commissions?: BackendCommissionItem[];
  payouts?: BackendPayoutHistoryItem[];
};

type BackendReferrerDetailsResponse = {
  success: boolean;
  referrer?: BackendReferrerDetailsPayload;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

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
  totalPurchasesCount: number;
  totalSpent: number;
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, payoutsRes, referrersRes] = await Promise.all([
        adminAPI.getReferralOverview(),
        adminAPI.getPendingPayouts(1, 50),
        adminAPI.getAllReferrers(currentPage, 50, searchTerm || undefined),
      ]);

      // Backend responses are wrapped as { success: true, ... } and have nested objects.
      const overviewPayload = overviewRes.data as BackendReferralOverviewResponse;
      const overviewData = overviewPayload?.overview;
      setOverview({
        totalReferrals: overviewData?.totalReferred ?? 0,
        totalCommissionsOwed: overviewData?.commissions?.pending?.amount ?? 0,
        pendingPayoutRequests: overviewData?.payouts?.pending?.count ?? 0,
        totalPaidOut: overviewData?.payouts?.paid?.amount ?? 0,
      });

      const payoutsPayload = payoutsRes.data as BackendPendingPayoutsResponse;
      const payouts = Array.isArray(payoutsPayload?.payouts) ? payoutsPayload.payouts : [];
      setPendingPayouts(
        payouts.map((p) => ({
          id: p.id,
          referrer: {
            id: p.user?.id ?? '',
            email: p.user?.email ?? '',
            businessName: p.user?.businessName ?? '',
          },
          amount: p.amount ?? 0,
          status: p.status,
          requestedAt: p.requestedAt,
          processedAt: p.paidAt ?? null,
          notes: p.notes ?? null,
        }))
      );

      const referrersPayload = referrersRes.data as BackendReferrersResponse;
      const referrersRaw = Array.isArray(referrersPayload?.referrers) ? referrersPayload.referrers : [];
      setReferrers(
        referrersRaw.map((r) => ({
          id: r.id,
          email: r.email,
          businessName: r.businessName,
          referralCode: r.referralCode,
          referralEnabled: !!r.referralEnabled,
          referralCount: r.stats?.totalReferred ?? 0,
          totalEarned: r.stats?.totalEarned ?? 0,
          pendingAmount: r.stats?.pendingAmount ?? 0,
          paidAmount: r.stats?.paidAmount ?? 0,
          createdAt: r.signupDate,
        }))
      );

      setTotalPages(referrersPayload?.pagination?.totalPages ?? 1);
    } catch (error) {
      logger.error('Failed to fetch referral data', { error: getErrorMessage(error) });
      alert('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewReferrer = async (userId: string) => {
    try {
      const response = await adminAPI.getReferrerDetails(userId);
      const payload = response.data as BackendReferrerDetailsResponse;
      const ref = payload?.referrer;
      const referrals = Array.isArray(ref?.referrals) ? ref.referrals : [];
      const commissions = Array.isArray(ref?.commissions) ? ref.commissions : [];
      const payouts = Array.isArray(ref?.payouts) ? ref.payouts : [];

      const commissionByEmail = new Map<string, number>();
      for (const c of commissions) {
        const email = c?.sourceUser?.email;
        if (!email) continue;
        const prev = commissionByEmail.get(email) ?? 0;
        commissionByEmail.set(email, prev + (c.amount ?? 0));
      }

      setSelectedReferrer({
        referrer: {
          id: ref?.id ?? '',
          email: ref?.email ?? '',
          businessName: ref?.businessName ?? '',
          referralCode: ref?.referralCode ?? '',
          referralEnabled: !!ref?.referralEnabled,
          referralCount: ref?.stats?.totalReferred ?? 0,
          totalEarned: ref?.stats?.totalEarned ?? 0,
          pendingAmount: ref?.stats?.pendingAmount ?? 0,
          paidAmount: ref?.stats?.paidAmount ?? 0,
          createdAt: ref?.signupDate ?? new Date().toISOString(),
        },
        referredUsers: referrals.map((u) => ({
          id: u.id,
          email: u.email,
          businessName: u.businessName,
          totalPurchasesCount: u.totalPurchases ?? 0,
          totalSpent: u.totalSpent ?? 0,
          totalCommission: commissionByEmail.get(u.email) ?? 0,
          createdAt: u.signupDate,
        })),
        commissions: commissions.map((c) => ({
          id: c.id,
          amount: c.amount ?? 0,
          status: c.status,
          createdAt: c.createdAt,
        })),
        payouts: payouts.map((p) => ({
          id: p.id,
          amount: p.amount ?? 0,
          status: p.status,
          requestedAt: p.requestedAt,
          processedAt: p.paidAt ?? null,
          notes: p.notes ?? null,
        })),
      });
      setShowReferrerModal(true);
    } catch (error) {
      logger.error('Failed to fetch referrer details', { error: getErrorMessage(error) });
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
    } catch (error) {
      logger.error('Failed to mark payout as paid', { error: getErrorMessage(error) });
      alert('Failed to mark payout as paid');
    }
  };

  const handleToggleReferral = async (userId: string, currentEnabled: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to toggle this user\'s referral status?')) return;

    try {
      await adminAPI.toggleUserReferral(userId, !currentEnabled);
      alert('Referral status toggled successfully');
      fetchData();
    } catch (error) {
      logger.error('Failed to toggle referral status', { error: getErrorMessage(error) });
      alert('Failed to toggle referral status');
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getReferralLink = (code: string) => `https://blackbowassociates.com/sign-up?ref=${code}`;

  const copyToClipboard = async (text: string, code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      logger.error('Failed to copy', { error: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Stats - Mobile: 2x2 grid, Desktop: 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Referrals</p>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? '...' : overview?.totalReferrals || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Owed</p>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? '...' : `$${(overview?.totalCommissionsOwed ?? 0).toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? '...' : overview?.pendingPayoutRequests || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Paid Out</p>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? '...' : `$${(overview?.totalPaidOut ?? 0).toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Pending Payouts Section */}
      {pendingPayouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              Pending Payouts
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {pendingPayouts.length}
              </span>
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {/* Mobile: Cards, Desktop: Table */}
          <div className="block sm:hidden space-y-3">
            {pendingPayouts.map((payout) => (
              <div key={payout.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{payout.referrer.businessName}</p>
                    <p className="text-xs text-gray-500">{payout.referrer.email}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">${(payout.amount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500">
                    {format(new Date(payout.requestedAt), 'MMM dd, yyyy')}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPayout(payout);
                      setShowPayoutModal(true);
                    }}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Check size={14} />
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
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
                    <td className="py-3 px-4 text-sm font-semibold">${(payout.amount ?? 0).toFixed(2)}</td>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            All Referrers
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-sm">Loading referrers...</p>
          </div>
        ) : referrers.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No referrers found
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            <div className="block lg:hidden space-y-3">
              {referrers.map((referrer) => (
                <div
                  key={referrer.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Card Header - Always visible */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedReferrer(expandedReferrer === referrer.id ? null : referrer.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{referrer.businessName}</p>
                        <p className="text-xs text-gray-500 truncate">{referrer.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">{referrer.referralCount ?? 0}</p>
                          <p className="text-xs text-gray-500">signups</p>
                        </div>
                        {expandedReferrer === referrer.id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Earned</p>
                        <p className="text-sm font-semibold">${(referrer.totalEarned ?? 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="text-sm font-semibold text-orange-600">${(referrer.pendingAmount ?? 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="text-sm font-semibold text-green-600">${(referrer.paidAmount ?? 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedReferrer === referrer.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3 bg-white">
                      {/* Referral Link */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referral Link</label>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
                            {getReferralLink(referrer.referralCode)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(getReferralLink(referrer.referralCode), referrer.referralCode);
                            }}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                              copiedCode === referrer.referralCode
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {copiedCode === referrer.referralCode ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Referral Code */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Code:</span>
                        <span className="font-mono text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {referrer.referralCode}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => handleToggleReferral(referrer.id, referrer.referralEnabled, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                            referrer.referralEnabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {referrer.referralEnabled ? (
                            <><ToggleRight size={14} /> Enabled</>
                          ) : (
                            <><ToggleLeft size={14} /> Disabled</>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReferrer(referrer.id);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referrer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referral Link</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Signups</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Earned</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Pending</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Paid</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((referrer) => (
                    <tr
                      key={referrer.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{referrer.businessName}</p>
                          <p className="text-xs text-gray-500">{referrer.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 max-w-[200px] truncate">
                            ?ref={referrer.referralCode}
                          </code>
                          <button
                            onClick={() => copyToClipboard(getReferralLink(referrer.referralCode), referrer.referralCode)}
                            className={`p-1.5 rounded transition-colors ${
                              copiedCode === referrer.referralCode
                                ? 'bg-green-100 text-green-600'
                                : 'hover:bg-gray-100 text-gray-500'
                            }`}
                            title="Copy full link"
                          >
                            {copiedCode === referrer.referralCode ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {referrer.referralCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right">${(referrer.totalEarned ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-orange-600 font-medium text-right">${(referrer.pendingAmount ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-green-600 font-medium text-right">${(referrer.paidAmount ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleReferral(referrer.id, referrer.referralEnabled)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                            referrer.referralEnabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {referrer.referralEnabled ? (
                            <><ToggleRight size={14} /> On</>
                          ) : (
                            <><ToggleLeft size={14} /> Off</>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewReferrer(referrer.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Referrer Details Modal */}
      {showReferrerModal && selectedReferrer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-4xl w-full mx-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4 sm:mb-6 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Referrer Details</h3>
                <p className="text-sm text-gray-500">{selectedReferrer.referrer.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowReferrerModal(false);
                  setSelectedReferrer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Referrer Info */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Referrer Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Business</label>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">{selectedReferrer.referrer.businessName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Code</label>
                  <p className="text-sm sm:text-base font-mono font-medium text-gray-900 mt-1">{selectedReferrer.referrer.referralCode}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Total Signups</label>
                  <p className="text-sm sm:text-base font-medium text-blue-600 mt-1">{selectedReferrer.referrer.referralCount}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <p className={`text-sm sm:text-base font-medium mt-1 ${selectedReferrer.referrer.referralEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedReferrer.referrer.referralEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              
              {/* Referral Link in Modal */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-xs font-medium text-gray-500">Referral Link</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 border border-gray-200 truncate">
                    {getReferralLink(selectedReferrer.referrer.referralCode)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(getReferralLink(selectedReferrer.referrer.referralCode), selectedReferrer.referrer.referralCode)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      copiedCode === selectedReferrer.referrer.referralCode
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {copiedCode === selectedReferrer.referrer.referralCode ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Referred Users */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                Referred Users ({selectedReferrer.referredUsers?.length ?? 0})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Mobile: Cards */}
                <div className="block sm:hidden divide-y divide-gray-200">
                  {(selectedReferrer.referredUsers?.length ?? 0) === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">No referred users yet</div>
                  ) : (
                    (selectedReferrer.referredUsers ?? []).map((user) => (
                      <div key={user.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.businessName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">${(user.totalCommission ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            Purchases: {user.totalPurchasesCount ?? 0} • Spent: ${(user.totalSpent ?? 0).toFixed(2)}
                          </span>
                          <span>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop: Table */}
                <table className="w-full hidden sm:table">
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
                    {(selectedReferrer.referredUsers?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No referred users yet</td>
                      </tr>
                    ) : (
                      (selectedReferrer.referredUsers ?? []).map((user) => (
                        <tr key={user.id} className="border-t border-gray-100">
                          <td className="py-2 px-4 text-sm">{user.email}</td>
                          <td className="py-2 px-4 text-sm">{user.businessName}</td>
                          <td className="py-2 px-4 text-sm">
                            {user.totalPurchasesCount ?? 0} • ${(user.totalSpent ?? 0).toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-sm font-semibold text-green-600">${(user.totalCommission ?? 0).toFixed(2)}</td>
                          <td className="py-2 px-4 text-sm text-gray-600">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout History */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                Payout History ({selectedReferrer.payouts?.length ?? 0})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Mobile: Cards */}
                <div className="block sm:hidden divide-y divide-gray-200">
                  {(selectedReferrer.payouts?.length ?? 0) === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">No payout history</div>
                  ) : (
                    (selectedReferrer.payouts ?? []).map((payout) => (
                      <div key={payout.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold">${(payout.amount ?? 0).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payout.status}
                          </span>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>Requested: {format(new Date(payout.requestedAt), 'MMM dd')}</span>
                          <span>{payout.processedAt ? `Paid: ${format(new Date(payout.processedAt), 'MMM dd')}` : '-'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop: Table */}
                <table className="w-full hidden sm:table">
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
                    {(selectedReferrer.payouts?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No payout history</td>
                      </tr>
                    ) : (
                      (selectedReferrer.payouts ?? []).map((payout) => (
                        <tr key={payout.id} className="border-t border-gray-100">
                          <td className="py-2 px-4 text-sm font-semibold">${(payout.amount ?? 0).toFixed(2)}</td>
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

            <div className="flex justify-end pt-4 border-t border-gray-200">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto my-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Mark Payout as Paid</h3>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">Referrer:</span> <strong>{selectedPayout.referrer.businessName}</strong>
              </p>
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">Email:</span> {selectedPayout.referrer.email}
              </p>
              <p className="text-lg font-bold text-green-600">
                Amount: ${(selectedPayout.amount ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
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
