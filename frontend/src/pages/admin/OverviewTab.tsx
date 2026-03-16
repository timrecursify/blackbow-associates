import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Card, Title } from '@tremor/react';
import { DollarSign, Users, TrendingUp, RefreshCw, ShoppingCart, MapPin } from 'lucide-react';
import KPICard from '../../components/admin/KPICard';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { subDays, format } from 'date-fns';
import { adminAPI } from '../../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface OverviewData {
  revenue: { total: number; count: number; avgOrderValue: number };
  purchases: { total: number; count: number };
  netProfit: number;
  users: { total: number; active: number; activePercentage: number };
  leads: { total: number; available: number; availablePercentage: number };
  conversionRate: number;
  bookingRate: number;
  totalBalance: number;
  totalDeposits: number;
  totalDepositsCount: number;
}

interface RevenueData {
  date: string;
  deposits: number;
  purchases: number;
  net: number;
}

interface VendorTypeData {
  vendorType: string;
  count: number;
}

interface LeadLocationData {
  location: string;
  count: number;
}

interface RevenueGrowthData {
  month: string;
  revenue: number;
  momGrowth: number | null;
}

interface RevenueByVendorTypeData {
  vendorType: string;
  revenue: number;
}

interface UserEngagementData {
  retentionRate: number;
  avgPurchasesPerUser: number;
  avgTimeToFirstPurchase: number;
  churnRate: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
};

export default function OverviewTab() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [vendorTypes, setVendorTypes] = useState<VendorTypeData[]>([]);
  const [topLocations, setTopLocations] = useState<LeadLocationData[]>([]);
  const [revenueGrowth, setRevenueGrowth] = useState<RevenueGrowthData[]>([]);
  const [revenueByVendorType, setRevenueByVendorType] = useState<RevenueByVendorTypeData[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagementData | null>(null);
  const [arpu, setArpu] = useState<number>(0);
  const [refundRate, setRefundRate] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const [overviewRes, revenueRes, userRes, leadRes, revenueGrowthRes, userEngagementRes] = await Promise.all([
        adminAPI.getOverview(params),
        adminAPI.getRevenueAnalytics({ ...params, groupBy: 'day' }),
        adminAPI.getUserAnalytics(params),
        adminAPI.getLeadAnalytics(params),
        adminAPI.getRevenueGrowth(params),
        adminAPI.getUserEngagement(params)
      ]);

      setOverview(overviewRes.data);
      setRevenueData(revenueRes.data);
      setVendorTypes(userRes.data.vendorTypes || []);
      setTopLocations(leadRes.data.topLocations || []);
      setRevenueGrowth(revenueGrowthRes.data.growth || []);
      setRevenueByVendorType(revenueGrowthRes.data.revenueByVendorType || []);
      setArpu(revenueGrowthRes.data.arpu || 0);
      setRefundRate(revenueGrowthRes.data.refundRate || 0);
      setUserEngagement(userEngagementRes.data || null);
    } catch (error) {
      logger.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with date range and refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Title className="text-xl md:text-2xl font-bold">Dashboard Overview</Title>
          <p className="text-sm text-gray-600 mt-1">
            Key performance indicators and analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Total Deposits"
          value={`$${overview?.totalDeposits?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />}
        />
        <KPICard
          title="Net Profit"
          value={`$${overview?.netProfit?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />}
        />
        <KPICard
          title="Active Users"
          value={`${overview?.users.active || 0} / ${overview?.users.total || 0}`}
          changeLabel="onboarded"
          loading={loading}
          icon={<Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />}
        />
        <KPICard
          title="Purchases"
          value={`${overview?.purchases.count || 0}`}
          loading={loading}
          icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Avg. Order Value</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            ${overview?.revenue.avgOrderValue?.toFixed(2) || '0.00'}
          </p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">ARPU</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            ${arpu.toFixed(2)}
          </p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Conversion Rate</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {overview?.conversionRate?.toFixed(1) || '0'}%
          </p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Retention Rate</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {userEngagement?.retentionRate?.toFixed(1) || '0'}%
          </p>
        </Card>
      </div>

      {/* Revenue Chart - Full Width */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <Title className="text-base md:text-lg font-bold">Revenue Over Time</Title>
            <p className="text-xs md:text-sm text-gray-500">Deposits vs spending trends</p>
          </div>
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">Deposits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">Purchases</span>
            </div>
          </div>
        </div>
        {revenueData.length > 0 ? (
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Deposits"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDeposits)"
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPurchases)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {loading ? 'Loading...' : 'No data available for selected period'}
          </div>
        )}
      </Card>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Vendor Type Distribution */}
        <Card className="p-4 md:p-6">
          <div className="mb-4">
            <Title className="text-base md:text-lg font-bold">Users by Vendor Type</Title>
            <p className="text-xs md:text-sm text-gray-500">Distribution of registered vendors</p>
          </div>
          {vendorTypes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="vendorType"
                    label={({ vendorType, percent }) =>
                      `${vendorType} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {vendorTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {loading ? 'Loading...' : 'No vendor data available'}
            </div>
          )}
        </Card>

        {/* Top Lead Locations */}
        <Card className="p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <Title className="text-base md:text-lg font-bold">Top Lead Locations</Title>
              <p className="text-xs md:text-sm text-gray-500">Most purchased regions</p>
            </div>
          </div>
          {topLocations.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topLocations.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis
                    type="category"
                    dataKey="location"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    width={100}
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Purchases']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {loading ? 'Loading...' : 'No location data available'}
            </div>
          )}
        </Card>
      </div>

      {/* Revenue by Vendor Type - Full Width */}
      {revenueByVendorType.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="mb-4">
            <Title className="text-base md:text-lg font-bold">Revenue by Vendor Type</Title>
            <p className="text-xs md:text-sm text-gray-500">Total deposits by vendor category</p>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByVendorType} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="vendorType"
                  tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
                  stroke="#9ca3af"
                  interval={0}
                  height={60}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  width={50}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Monthly Revenue Trend */}
      {revenueGrowth.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="mb-4">
            <Title className="text-base md:text-lg font-bold">Monthly Revenue Trend</Title>
            <p className="text-xs md:text-sm text-gray-500">Revenue growth over time</p>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  width={50}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Deposit Leftovers</p>
          <p className="text-lg md:text-2xl font-bold text-blue-600">
            ${overview?.totalBalance?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Unused balance in system</p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Booking Rate</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {overview?.bookingRate?.toFixed(1) || '0'}%
          </p>
          <p className="text-xs text-gray-500 mt-1">From lead feedback</p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Refund Rate</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {refundRate.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Avg Purchases/User</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {userEngagement?.avgPurchasesPerUser?.toFixed(2) || '0.00'}
          </p>
        </Card>
      </div>
    </div>
  );
}
