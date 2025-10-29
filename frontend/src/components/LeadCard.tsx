import React from 'react';
import { Calendar, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  weddingDate: string | null;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  servicesNeeded: string[];
  price: number;
  status: string;
}

interface LeadCardProps {
  lead: Lead;
  onPurchase: (leadId: string) => void;
  isPurchasing?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPurchase, isPurchasing = false }) => {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Wedding Date */}
        <div className="flex items-start space-x-2">
          <Calendar size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Wedding Date</p>
            <p className="text-sm text-gray-900 font-semibold">
              {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMM dd, yyyy') : 'TBD'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2">
          <MapPin size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Location</p>
            <p className="text-sm text-gray-900 font-semibold">{lead.location}</p>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-start space-x-2">
          <DollarSign size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Budget</p>
            <p className="text-sm text-gray-900 font-semibold">{formatBudget()}</p>
          </div>
        </div>

        {/* Services */}
        <div className="flex items-start space-x-2">
          <Briefcase size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Services</p>
            <p className="text-sm text-gray-900 font-semibold">
              {lead.servicesNeeded.join(', ') || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Purchase Button */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
            <p className="text-xs text-gray-600">Lead Price</p>
            <p className="text-2xl font-bold text-black">${lead.price.toFixed(2)}</p>
          </div>
          <button
            onClick={() => onPurchase(lead.id)}
            disabled={isPurchasing || lead.status !== 'AVAILABLE'}
            className={`w-full md:w-auto px-6 py-2 rounded-lg font-bold transition-all ${
              lead.status !== 'AVAILABLE'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : isPurchasing
                ? 'bg-gray-400 text-gray-700 cursor-wait'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isPurchasing ? 'Purchasing...' : lead.status !== 'AVAILABLE' ? 'Sold' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
