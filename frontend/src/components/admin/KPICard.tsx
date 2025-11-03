import { Card } from '@tremor/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  loading = false
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm md:text-base text-gray-700 mb-1 font-medium">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className="flex items-center mt-2 text-sm">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-gray-600 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
