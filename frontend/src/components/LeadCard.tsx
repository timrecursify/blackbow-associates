import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, Briefcase, ChevronDown, ChevronUp, Heart, Tag } from 'lucide-react';
import { format } from 'date-fns';

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

// Service tag colors
const serviceColors: Record<string, { bg: string; text: string; border: string }> = {
  'Photography': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Videography': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'Drone': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  'Multi-Day': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'RAW Files': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
};

const getServiceColor = (service: string) => {
  for (const [key, color] of Object.entries(serviceColors)) {
    if (service.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 transition-colors duration-200">
                <MapPin size={16} className="text-blue-600 transition-colors duration-200" />
                <span className="text-sm font-bold text-blue-900 transition-colors duration-200">
                  {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.location}
                </span>
              </div>
              {lead.state && (
                <span className="px-2 py-1 bg-blue-600s font-bold rounded transition-colors duration-200">
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
            <div className="inline-flex flex-col items-end bg-gradient-to-br from-green-50 to-emerald-50shadow-sm transition-colors duration-200">
              <span className="text-xs text-green-700semibold uppercase tracking-wide transition-colors duration-200">Lead Price</span>
              <span className="text-3xl font-black text-green-700 transition-colors duration-200">${(lead.price || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Services Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {lead.servicesNeeded.map((service, index) => {
              const colors = getServiceColor(service);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${colors.bg} ${colors.text} border ${colors.border} rounded-full text-sm font-semibold`}
                >
                  <Briefcase size={14} />
                  {service}
                </span>
              );
            })}
            {lead.servicesNeeded.length === 0 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Services not specified
              </span>
            )}
          </div>
        </div>

        {/* Budget and Ethnic/Religious Tags */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100 transition-colors duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 transition-colors duration-200">
            <DollarSign size={16} className="text-amber-600 transition-colors duration-200" />
            <span className="text-sm font-semibold text-amber-900 transition-colors duration-200">{formatBudget()}</span>
          </div>
          
          {lead.ethnicReligious && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50sition-colors duration-200">
              <Heart size={14} className="text-violet-600sition-colors duration-200" />
              <span className="text-sm font-semibold text-violet-900sition-colors duration-200">{lead.ethnicReligious}</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {lead.description && (
          <div className="mb-4">
            <div className={`text-sm text-gray-700 line-clamp-2 transition-colors duration-200`}>
              {lead.description}
            </div>
            {lead.description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-sm text-blue-600 flex items-center gap-1 transition-colors duration-200"
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
              '?? Sold'
            ) : (
              <>
                ?? Buy This Lead Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
