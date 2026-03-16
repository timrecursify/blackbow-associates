import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

const REFERRAL_SERVICES = [
  { label: 'DJ / Music', borderColor: 'border-purple-500', textColor: 'text-purple-600' },
  { label: 'Wedding Planner', borderColor: 'border-pink-500', textColor: 'text-pink-600' },
  { label: 'Florist / Flowers', borderColor: 'border-green-500', textColor: 'text-green-600' },
  { label: 'Caterer', borderColor: 'border-orange-500', textColor: 'text-orange-600' },
  { label: 'Photo Booth', borderColor: 'border-cyan-500', textColor: 'text-cyan-600' },
  { label: 'Hair & Makeup', borderColor: 'border-rose-500', textColor: 'text-rose-600' },
  { label: 'Officiant', borderColor: 'border-indigo-500', textColor: 'text-indigo-600' },
  { label: 'Cake / Bakery', borderColor: 'border-amber-500', textColor: 'text-amber-600' },
  { label: 'Transportation / Limo', borderColor: 'border-slate-500', textColor: 'text-slate-600' },
  { label: 'Rentals / Decor', borderColor: 'border-teal-500', textColor: 'text-teal-600' },
  { label: 'Invitations / Stationery', borderColor: 'border-violet-500', textColor: 'text-violet-600' },
  { label: 'Lighting / AV', borderColor: 'border-yellow-600', textColor: 'text-yellow-700' },
  { label: 'Band / Live Music', borderColor: 'border-fuchsia-500', textColor: 'text-fuchsia-600' },
  { label: 'Bartender / Bar Service', borderColor: 'border-red-500', textColor: 'text-red-600' },
  { label: 'Wedding Favors', borderColor: 'border-lime-500', textColor: 'text-lime-600' },
  { label: 'Jewelry', borderColor: 'border-sky-500', textColor: 'text-sky-600' },
  { label: 'Dress / Attire', borderColor: 'border-pink-400', textColor: 'text-pink-500' },
  { label: 'Event Insurance', borderColor: 'border-gray-500', textColor: 'text-gray-600' },
  { label: 'Honeymoon / Travel', borderColor: 'border-blue-500', textColor: 'text-blue-600' },
  { label: 'Photo / Video Editing', borderColor: 'border-emerald-500', textColor: 'text-emerald-600' },
];

const TOOLTIP_TEXT = "Contact this client and mention Precious Pics referred you. Ask if they need help with any of these services. We only share each lead with one vendor per category.";

interface ServiceReferralTagsProps {
  className?: string;
}

export const ServiceReferralTags: React.FC<ServiceReferralTagsProps> = ({ className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className={`${className}`}>
      {/* Header with info icon */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Services Needed
        </span>
        <div className="relative inline-block">
          <button
            ref={buttonRef}
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            aria-label="More information about referrals"
          >
            <Info size={14} />
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div
              ref={tooltipRef}
              className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-3 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-lg"
            >
              {TOOLTIP_TEXT}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </div>
      </div>

      {/* Service tags */}
      <div className="flex flex-wrap gap-1.5">
        {REFERRAL_SERVICES.map((service) => (
          <span
            key={service.label}
            className={`px-2 py-0.5 text-xs font-medium border rounded ${service.borderColor} ${service.textColor} bg-transparent`}
          >
            {service.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ServiceReferralTags;
