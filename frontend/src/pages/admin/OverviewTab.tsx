import { useState, useEffect } from 'react';
import { Card, Title } from '@tremor/react';
import { DollarSign, Users, FileText, TrendingUp, RefreshCw, Activity } from 'lucide-react';
import KPICard from '../../components/admin/KPICard';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { subDays } from 'date-fns';
import { adminAPI } from '../../services/api';

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

interface UserGrowthData {
  date: string;
  count: number;
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
  activeUsersTrend: UserGrowthData[];
}

export default function OverviewTab() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
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
      setUserGrowth(userRes.data.growth || []);
      setVendorTypes(userRes.data.vendorTypes || []);
      setTopLocations(leadRes.data.topLocations || []);
      setRevenueGrowth(revenueGrowthRes.data.growth || []);
      setRevenueByVendorType(revenueGrowthRes.data.revenueByVendorType || []);
      setArpu(revenueGrowthRes.data.arpu || 0);
      setRefundRate(revenueGrowthRes.data.refundRate || 0);
      setUserEngagement(userEngagementRes.data || null);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
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

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, indexKey, valueKey, title, color = 'blue' }: { data: any[], indexKey: string, valueKey: string, title: string, color?: string }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <div className="space-y-3">
        {data.slice(0, 10).map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 truncate max-w-[200px]">{item[indexKey]}</span>
              <span className="text-gray-900 font-semibold">{typeof item[valueKey] === 'number' ? item[valueKey].toLocaleString() : item[valueKey]}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`${colorClasses[color as keyof typeof colorClasses]} h-2.5 rounded-full transition-all`}
                style={{ width: `${((item[valueKey] || 0) / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple Line Chart Component
  const SimpleLineChart = ({ data, indexKey, valueKeys, title, colors = ['blue', 'green'] }: { data: any[], indexKey: string, valueKeys: string[], title: string, colors?: string[] }) => {
    if (!data || data.length === 0) return null;
    
    const width = 800;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const allValues = data.flatMap(d => valueKeys.map(k => d[k] || 0));
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1;

    const colorClasses = {
      blue: 'stroke-blue-500',
      green: 'stroke-green-500',
      red: 'stroke-red-500',
      purple: 'stroke-purple-500'
    };

    return (
      <div className="relative overflow-x-auto">
        <svg width={width} height={height + 60} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (chartHeight - (i * chartHeight / 4));
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Data lines */}
          {valueKeys.map((key, keyIdx) => {
            const points = data.map((item, idx) => {
              const x = padding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
              const y = padding + chartHeight - (((item[key] || 0) - minValue) / range) * chartHeight;
              return `${x},${y}`;
            }).join(' ');

            return (
              <polyline
                key={key}
                points={points}
                fill="none"
                strokeWidth="2"
                className={colorClasses[colors[keyIdx] as keyof typeof colorClasses] || 'stroke-blue-500'}
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
          {data.length > 0 && <span>{new Date(data[0][indexKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
          {data.length > 0 && <span>{new Date(data[data.length - 1][indexKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-sm flex-wrap">
          {valueKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClasses[colors[idx] as keyof typeof colorClasses]?.replace('stroke-', 'bg-') || 'bg-blue-500'}`} />
              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple Donut Chart Component
  const SimpleDonutChart = ({ data, indexKey, valueKey, title }: { data: any[], indexKey: string, valueKey: string, title: string }) => {
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    if (total === 0) return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div className="relative flex-shrink-0" style={{ width: '200px', height: '200px' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {data.map((item, idx) => {
              const value = item[valueKey] || 0;
              const percentage = value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={idx}
                  d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[idx % colors.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((item, idx) => {
            const value = item[valueKey] || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 truncate">{item[indexKey]}</span>
                    <span className="text-gray-900 font-semibold ml-2">{value.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with date range and refresh */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Title className="text-xl md:text-2xl font-bold">Dashboard Overview</Title>
          <p className="text-base text-gray-600 mt-1">
            Key performance indicators and analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Deposits"
          value={`$${overview?.totalDeposits?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
        />
        <KPICard
          title="Deposit Leftovers"
          value={`$${overview?.totalBalance?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        />
        <KPICard
          title="Net Profit"
          value={`$${overview?.netProfit?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
        <KPICard
          title="Active Users"
          value={`${overview?.users.active || 0} / ${overview?.users.total || 0}`}
          changeLabel="onboarded"
          loading={loading}
          icon={<Users className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">Avg. Order Value</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${overview?.revenue.avgOrderValue.toFixed(2) || '0.00'}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">ARPU</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${arpu.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">Conversion Rate</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{overview?.conversionRate.toFixed(1) || '0'}%</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">Booking Rate</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{overview?.bookingRate.toFixed(1) || '0'}%</p>
        </Card>
      </div>

      {/* New Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Revenue Growth"
          value={revenueGrowth.length > 0 && revenueGrowth[revenueGrowth.length - 1].momGrowth !== null
            ? `${revenueGrowth[revenueGrowth.length - 1].momGrowth > 0 ? '+' : ''}${revenueGrowth[revenueGrowth.length - 1].momGrowth.toFixed(1)}%`
            : 'N/A'}
          loading={loading}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          change={revenueGrowth.length > 0 && revenueGrowth[revenueGrowth.length - 1].momGrowth !== null
            ? revenueGrowth[revenueGrowth.length - 1].momGrowth
            : undefined}
          changeLabel="MoM"
        />
        <KPICard
          title="User Retention"
          value={`${userEngagement?.retentionRate.toFixed(1) || '0'}%`}
          loading={loading}
          icon={<Activity className="w-6 h-6 text-green-600" />}
        />
        <KPICard
          title="Avg Purchases/User"
          value={userEngagement?.avgPurchasesPerUser.toFixed(2) || '0.00'}
          loading={loading}
          icon={<Users className="w-6 h-6 text-purple-600" />}
        />
        <Card className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">Refund Rate</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{refundRate.toFixed(2)}%</p>
        </Card>
      </div>

      {/* Charts Row 1: Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Revenue Over Time</Title>
          <p className="text-base text-gray-600 mb-4">Deposits vs. Purchases</p>
          {revenueData.length > 0 ? (
            <SimpleLineChart
              data={revenueData}
              indexKey="date"
              valueKeys={['deposits', 'purchases']}
              title="Revenue"
              colors={['green', 'red']}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>

        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">User Growth</Title>
          <p className="text-base text-gray-600 mb-4">New registrations over time</p>
          {userGrowth.length > 0 ? (
            <SimpleBarChart
              data={userGrowth}
              indexKey="date"
              valueKey="count"
              title="User Growth"
              color="purple"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>
      </div>

      {/* Charts Row 2: Vendor Types & Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Users by Vendor Type</Title>
          <p className="text-base text-gray-600 mb-4">Distribution of vendor categories</p>
          {vendorTypes.length > 0 ? (
            <SimpleDonutChart
              data={vendorTypes}
              indexKey="vendorType"
              valueKey="count"
              title="Vendor Types"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>

        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Top Lead Locations</Title>
          <p className="text-base text-gray-600 mb-4">Most purchased lead locations</p>
          {topLocations.length > 0 ? (
            <SimpleBarChart
              data={topLocations}
              indexKey="location"
              valueKey="count"
              title="Locations"
              color="blue"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>
      </div>

      {/* Charts Row 3: Revenue Growth & Revenue by Vendor Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Revenue Growth Trend</Title>
          <p className="text-base text-gray-600 mb-4">Month-over-month revenue</p>
          {revenueGrowth.length > 0 ? (
            <SimpleBarChart
              data={revenueGrowth}
              indexKey="month"
              valueKey="revenue"
              title="Revenue Growth"
              color="green"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>

        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Revenue by Vendor Type</Title>
          <p className="text-base text-gray-600 mb-4">Total revenue generated by vendor category</p>
          {revenueByVendorType.length > 0 ? (
            <SimpleBarChart
              data={revenueByVendorType}
              indexKey="vendorType"
              valueKey="revenue"
              title="Revenue by Vendor"
              color="blue"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>
      </div>

      {/* Charts Row 4: Active Users Trend */}
      {userEngagement && userEngagement.activeUsersTrend.length > 0 && (
        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Active Users Trend</Title>
          <p className="text-base text-gray-600 mb-4">Daily active users (users who made purchases)</p>
          <SimpleBarChart
            data={userEngagement.activeUsersTrend}
            indexKey="date"
            valueKey="count"
            title="Active Users"
            color="purple"
          />
        </Card>
      )}
    </div>
  );
}
