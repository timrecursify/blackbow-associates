import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, ChevronDown, ChevronUp, Heart, Clock, Flame, Zap } from 'lucide-react';
import { format, differenceInMonths, differenceInDays } from 'date-fns';

interface Lead {
  id: string;
  weddingDate: string | null;
  location: string;
  city: string | null;
  state: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  servicesNeeded: string[];
  price: number;
  status: string;
  description: string | null;
  ethnicReligious: string | null;
}

interface LeadCardProps {
  lead: Lead;
  onPurchase: (leadId: string) => void;
  isPurchasing?: boolean;
}

// Timeline urgency configuration
interface UrgencyConfig {
  label: string;
  subLabel?: string;
  bg: string;
  text: string;
  border: string;
  icon: 'flame' | 'zap' | 'clock';
  pulse?: boolean;
}

const getTimelineUrgency = (weddingDate: string | null): UrgencyConfig => {
  if (!weddingDate) {
    return {
      label: 'Date TBD',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
      icon: 'clock'
    };
  }

  const now = new Date();
  const wedding = new Date(weddingDate);
  const daysUntil = differenceInDays(wedding, now);
  const monthsUntil = differenceInMonths(wedding, now);

  if (daysUntil < 0) {
    return {
      label: 'Past Event',
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-300',
      icon: 'clock'
    };
  }

  if (daysUntil <= 30) {
    return {
      label: 'This Month',
      subLabel: 'Book Now!',
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-400',
      icon: 'flame',
      pulse: true
    };
  }

  if (monthsUntil <= 2) {
    return {
      label: '1-2 Months',
      subLabel: 'Urgent',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-400',
      icon: 'zap'
    };
  }

  if (monthsUntil <= 4) {
    return {
      label: '3-4 Months',
      subLabel: 'Planning',
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-400',
      icon: 'clock'
    };
  }

  if (monthsUntil <= 6) {
    return {
      label: '5-6 Months',
      subLabel: 'Good Timing',
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-400',
      icon: 'clock'
    };
  }

  if (monthsUntil <= 12) {
    return {
      label: '6-12 Months',
      subLabel: 'Early Bird',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-400',
      icon: 'clock'
    };
  }

  return {
    label: '1+ Year Out',
    subLabel: 'Long Term',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-400',
    icon: 'clock'
  };
};

const UrgencyIcon: React.FC<{ type: 'flame' | 'zap' | 'clock'; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'flame':
      return <Flame size={16} className={className} />;
    case 'zap':
      return <Zap size={16} className={className} />;
    default:
      return <Clock size={16} className={className} />;
  }
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPurchase, isPurchasing = false }) => {
  const [expanded, setExpanded] = useState(false);

  const formatBudget = () => {
    if (lead.budgetMin && lead.budgetMax) {
      return `$${lead.budgetMin.toLocaleString()} - $${lead.budgetMax.toLocaleString()}`;
    } else if (lead.budgetMin) {
      return `$${lead.budgetMin.toLocaleString()}+`;
    } else if (lead.budgetMax) {
      return `Up to $${lead.budgetMax.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const formatDate = () => {
    if (!lead.weddingDate) return 'TBD';
    try {
      return format(new Date(lead.weddingDate), 'MMM dd, yyyy');
    } catch {
      return lead.weddingDate;
    }
  };

  const urgency = getTimelineUrgency(lead.weddingDate);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Top Color Bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Location Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg transition-colors duration-200">
                <MapPin size={16} className="text-blue-600 transition-colors duration-200" />
                <span className="text-sm font-bold text-blue-900 transition-colors duration-200">
                  {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}
                </span>
              </div>
              {lead.state && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded text-sm transition-colors duration-200">
                  {lead.state}
                </span>
              )}
            </div>

            {/* Wedding Date */}
            <div className="flex items-center gap-2 text-gray-700 transition-colors duration-200">
              <Calendar size={18} className="text-rose-500 transition-colors duration-200" />
              <span className="font-semibold">{formatDate()}</span>
            </div>
          </div>

          {/* Price Tag */}
          <div className="text-right">
            <div className="inline-flex flex-col items-end bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 shadow-sm transition-colors duration-200">
              <span className="text-xs text-green-700 font-semibold uppercase tracking-wide transition-colors duration-200">Lead Price</span>
              <span className="text-3xl font-black text-green-700 transition-colors duration-200">$${(lead.price || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Timeline Urgency Tag */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 ${urgency.bg} ${urgency.text} border-2 ${urgency.border} rounded-full text-sm font-bold shadow-sm ${urgency.pulse ? 'animate-pulse' : ''}`}
            >
              <UrgencyIcon type={urgency.icon} className={urgency.text} />
              <span>{urgency.label}</span>
              {urgency.subLabel && (
                <span className="text-xs opacity-75 font-medium">• {urgency.subLabel}</span>
              )}
            </span>
          </div>
        </div>

        {/* Budget and Ethnic/Religious Tags */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100 transition-colors duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg transition-colors duration-200">
            <DollarSign size={16} className="text-amber-600 transition-colors duration-200" />
            <span className="text-sm font-semibold text-amber-900 transition-colors duration-200">{formatBudget()}</span>
          </div>
          
          {lead.ethnicReligious && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-lg transition-colors duration-200">
              <Heart size={14} className="text-violet-600 transition-colors duration-200" />
              <span className="text-sm font-semibold text-violet-900 transition-colors duration-200">{lead.ethnicReligious}</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {lead.description && (
          <div className="mb-4">
            <div className={`text-sm text-gray-700 ${expanded ? '' : 'line-clamp-2'} transition-colors duration-200`}>
              {lead.description}
            </div>
            {lead.description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors duration-200"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={16} />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Read more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Purchase Button */}
        <div className="pt-4 border-t border-gray-100 transition-colors duration-200">
          <button
            onClick={() => onPurchase(lead.id)}
            disabled={isPurchasing || lead.status !== 'AVAILABLE'}
            className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all transform ${
              lead.status !== 'AVAILABLE'
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isPurchasing
                ? 'bg-gray-400 text-gray-700 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-md hover:shadow-lg'
            }`}
          >
            {isPurchasing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Purchasing...
              </span>
            ) : lead.status !== 'AVAILABLE' ? (
              'Sold'
            ) : (
              'Buy This Lead Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
