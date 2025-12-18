import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { logger } from '../../utils/logger';
import { Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type Tx = {
  id: string;
  amount: number;
  type: string;
  description?: string | null;
  balanceAfter: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    businessName: string | null;
    isAdmin: boolean;
  };
};

export default function TransactionsTab() {
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getTransactions(currentPage, 50, { searchEmail: searchEmail || undefined });
      setTransactions(res.data?.transactions || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      logger.error('Failed to fetch admin transactions', err as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchEmail]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-600">All balance + payout ledger events</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchEmail}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchEmail(e.target.value);
              }}
              placeholder="Search email or business"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No transactions</div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.user.businessName || t.user.email}</p>
                  <p className="text-xs text-gray-500 truncate">{t.user.email}</p>
                </div>
                <div className={`text-sm font-bold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {t.amount >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-gray-600">
                <span className="font-mono">{t.type}</span>
                <span>{format(new Date(t.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              {t.description && <p className="text-xs text-gray-500 mt-2">{t.description}</p>}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance After</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-500">Loading…</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-500">No transactions</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">{t.user.businessName || '-'}</p>
                    <p className="text-xs text-gray-500">{t.user.email}</p>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-gray-700">{t.type}</td>
                  <td className={`py-3 px-4 text-sm font-semibold text-right ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {t.amount >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">${Number(t.balanceAfter).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{format(new Date(t.createdAt), 'MMM dd, yyyy')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">{currentPage} / {totalPages}</span>
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
  );
}


