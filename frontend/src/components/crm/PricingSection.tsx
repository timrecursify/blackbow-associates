import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const PricingSection: React.FC = () => {
  return (
    <section
      className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12 sm:mb-16 md:mb-20 transform md:rotate-1">
          <h2
            id="pricing-heading"
            className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-black mb-4 sm:mb-6"
          >
            Simple Pricing
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
            If you spend 10+ hours/week on admin, you're losing bookings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">

          {/* AI Assistant Plan */}
          <article className="transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="glass-card shadow-2xl border-2 border-white/70 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-black/5 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mr-16" aria-hidden="true"></div>
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-3">AI Assistant</h3>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-3 sm:mb-4">
                  $300
                  <span className="text-lg sm:text-xl md:text-2xl text-gray-600">/mo</span>
                </div>
                <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
                  Already getting leads? We handle everything else.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10" role="list">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700">Instant AI responses</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700">Automated paperwork</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700">Complete client tracking</span>
                  </li>
                </ul>
                <a
                  href="#beta-signup"
                  className="btn btn-secondary w-full"
                >
                  Lock Beta Pricing (50% Off)
                </a>
              </div>
            </div>
          </article>

          {/* Full Bundle Plan (Most Popular) */}
          <article className="transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border-3 sm:border-4 border-black h-full relative overflow-hidden">
              <div
                className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-black text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg"
                aria-label="Most popular plan"
              >
                Most Popular
              </div>
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-black/5 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16" aria-hidden="true"></div>
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-3 mt-3 sm:mt-4">Full Bundle</h3>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-3 sm:mb-4">
                  $600
                  <span className="text-lg sm:text-xl md:text-2xl text-gray-600">/mo</span>
                </div>
                <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
                  Need more leads? We bring them AND handle them.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10" role="list">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700"><strong>Everything in AI Assistant</strong></span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700"><strong>$300/mo in ad spend</strong></span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-700">15-20 qualified leads monthly</span>
                  </li>
                </ul>
                <a
                  href="#beta-signup"
                  className="btn btn-primary w-full"
                >
                  Lock Beta Pricing (50% Off)
                </a>
              </div>
            </div>
          </article>

        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Beta pricing locked in for early adopters • Cancel anytime
          </p>
        </div>

      </div>
    </section>
  );
};

export default PricingSection;
