/**
 * Beta Signup Section - Simple CTA pointing to main application form
 * Keeps the section but redirects to the comprehensive form
 */

import React from 'react';
import { ArrowRight, Bot } from 'lucide-react';

interface BetaSignupSectionProps {
  onSuccess: (data: { name?: string }) => void;
}

const BetaSignupSection: React.FC<BetaSignupSectionProps> = () => {
  return (
    <section 
      id="beta-signup"
      className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-gray-50 via-white to-gray-50"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-full shadow-sm mb-8">
          <Bot className="w-4 h-4" />
          <span className="text-xs tracking-wider font-medium">PRIVATE BETA</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-black mb-4 sm:mb-6 tracking-tight">
          Be Part of the <span className="italic font-serif">Future</span>
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          We're building this with wedding professionals, not for them. Your input shapes every feature. Limited beta spots available.
        </p>

        <a 
          href="#pricing"
          className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl text-lg"
        >
          Apply for Beta Access
          <ArrowRight className="w-5 h-5" />
        </a>

        <div className="mt-12 grid sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-light mb-2">0</div>
            <div className="text-sm text-gray-600">Upfront cost</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light mb-2">50%</div>
            <div className="text-sm text-gray-600">Lifetime discount</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light mb-2">100%</div>
            <div className="text-sm text-gray-600">Your voice matters</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BetaSignupSection;

