import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Card, Title } from '@tremor/react';
import { CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import KPICard from '../../components/admin/KPICard';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { subDays } from 'date-fns';
import { adminAPI } from '../../services/api';

interface BookingTrendData {
  date: string;
  total: number;
  booked: number;
  rate: number;
}

interface ResponsivenessData {
  type: string;
  count: number;
}

interface TimeToBookData {
  period: string;
  count: number;
}

interface FeedbackData {
  bookingTrend: BookingTrendData[];
  responsiveness: ResponsivenessData[];
  timeToBook: TimeToBookData[];
  avgRevenuePerBookedLead: number;
  totalFeedback: number;
  totalBooked: number;
  bookingRate: number;
}

export default function FeedbackTab() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const response = await adminAPI.getFeedbackAnalytics(params);
      
      if (response?.data) {
        setData(response.data);
      } else {
        setError('No data received from server');
      }
    } catch (error: any) {
      logger.error('Failed to fetch feedback analytics:', error);
      setError(error.response?.data?.message || 'Failed to load feedback data');
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

  // Format time to book labels
  const formatTimeToBookLabel = (period: string) => {
    const labels: Record<string, string> = {
      'within-week': 'Within 1 Week',
      '1-2-weeks': '1-2 Weeks',
      '2-4-weeks': '2-4 Weeks',
      'over-month': 'Over 1 Month'
    };
    return labels[period] || period;
  };

  const formattedTimeToBook = data?.timeToBook?.map(item => ({
    ...item,
    period: formatTimeToBookLabel(item.period)
  })) || [];

  // Format responsiveness labels
  const formatResponsivenessLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formattedResponsiveness = data?.responsiveness?.map(item => ({
    ...item,
    type: formatResponsivenessLabel(item.type)
  })) || [];

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
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{item[indexKey]}</span>
              <span className="text-gray-900 font-semibold">{item[valueKey]?.toLocaleString() || 0}</span>
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
  const SimpleLineChart = ({ data, indexKey, valueKey, title }: { data: any[], indexKey: string, valueKey: string, title: string }) => {
    if (!data || data.length === 0) return null;
    
    const width = 800;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const values = data.map(d => d[valueKey] || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const points = data.map((item, idx) => {
      const x = padding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding + chartHeight - (((item[valueKey] || 0) - minValue) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

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
          
          {/* Data line */}
          <polyline
            points={points}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
          {data.length > 0 && <span>{new Date(data[0][indexKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
          {data.length > 0 && <span>{new Date(data[data.length - 1][indexKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Title className="text-xl md:text-2xl font-bold">Feedback Analytics</Title>
          <p className="text-base text-gray-600 mt-1">
            Lead quality and conversion insights from vendor feedback
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

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error}</p>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Feedback"
          value={data?.totalFeedback || 0}
          loading={loading}
          icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
        />
        <KPICard
          title="Leads Booked"
          value={data?.totalBooked || 0}
          loading={loading}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        />
        <KPICard
          title="Booking Rate"
          value={`${data?.bookingRate?.toFixed(1) || '0'}%`}
          loading={loading}
          icon={<Clock className="w-6 h-6 text-purple-600" />}
        />
        <KPICard
          title="Avg. Revenue/Booked"
          value={`$${data?.avgRevenuePerBookedLead?.toLocaleString() || '0'}`}
          loading={loading}
          icon={<DollarSign className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Booking Trend Chart */}
      <Card className="p-4 md:p-6">
        <Title className="text-lg md:text-xl font-bold mb-2">Booking Rate Trend</Title>
        <p className="text-base text-gray-600 mb-4">
          Percentage of leads that resulted in bookings over time
        </p>
        {data?.bookingTrend && data.bookingTrend.length > 0 ? (
          <SimpleLineChart
            data={data.bookingTrend}
            indexKey="date"
            valueKey="rate"
            title="Booking Rate"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </Card>

      {/* Responsiveness & Time to Book */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Lead Responsiveness</Title>
          <p className="text-base text-gray-600 mb-4">
            How responsive were leads after purchase?
          </p>
          {formattedResponsiveness.length > 0 ? (
            <SimpleBarChart
              data={formattedResponsiveness}
              indexKey="type"
              valueKey="count"
              title="Responsiveness"
              color="green"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>

        <Card className="p-4 md:p-6">
          <Title className="text-lg md:text-xl font-bold mb-2">Time to Book</Title>
          <p className="text-base text-gray-600 mb-4">
            How long did it take vendors to book clients?
          </p>
          {formattedTimeToBook.length > 0 ? (
            <SimpleBarChart
              data={formattedTimeToBook}
              indexKey="period"
              valueKey="count"
              title="Time to Book"
              color="blue"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </Card>
      </div>

      {/* Insights Summary */}
      <Card className="p-4 md:p-6">
        <Title className="text-lg md:text-xl font-bold mb-4">Key Insights</Title>
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-base md:text-lg mb-1">Feedback Participation</p>
              <p className="text-sm md:text-base text-gray-700">
                {data?.totalFeedback || 0} vendors have provided feedback on their lead purchases
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <DollarSign className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-base md:text-lg mb-1">Average Deal Value</p>
              <p className="text-sm md:text-base text-gray-700">
                Vendors charge an average of ${data?.avgRevenuePerBookedLead?.toLocaleString() || 0} per booked client
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-base md:text-lg mb-1">Lead Quality</p>
              <p className="text-sm md:text-base text-gray-700">
                {data?.bookingRate?.toFixed(1) || 0}% of purchased leads result in bookings, indicating good lead quality
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
