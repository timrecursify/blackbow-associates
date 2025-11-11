import React from 'react';

const FAQSection: React.FC = () => {
  return (
    <section
      className="relative py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-gray-50"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-12 sm:mb-16 transform md:rotate-1">
          <h2
            id="faq-heading"
            className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black mb-3 sm:mb-4"
          >
            Common Questions
          </h2>
          <p className="text-sm sm:text-base text-gray-600">Everything you need to know</p>
        </div>

        <div className="space-y-4 sm:space-y-6">

          <details className="glass-card shadow-xl cursor-pointer group transform md:-rotate-1 hover:rotate-0 transition-all border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-black/5 rounded-full -mr-10 sm:-mr-12 -mt-10 sm:-mt-12" aria-hidden="true"></div>
            <summary className="text-lg sm:text-xl font-semibold text-black flex justify-between items-center relative z-10 list-none">
              <span>How does the AI know what to say?</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform text-sm sm:text-base" aria-hidden="true">▼</span>
            </summary>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg relative z-10">
              Our AI is trained on thousands of successful wedding vendor conversations. You can customize it to match your brand voice and review all conversations before they're sent, giving you complete control.
            </p>
          </details>

          <details className="glass-card shadow-xl cursor-pointer group transform md:rotate-1 hover:rotate-0 transition-all border border-white/60 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-black/5 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12" aria-hidden="true"></div>
            <summary className="text-lg sm:text-xl font-semibold text-black flex justify-between items-center relative z-10 list-none">
              <span>What if a lead wants to talk to me?</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform text-sm sm:text-base" aria-hidden="true">▼</span>
            </summary>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg relative z-10">
              The AI automatically detects when a lead wants human interaction and schedules a call with you through your calendar. It knows when to hand off and makes the transition seamless.
            </p>
          </details>

          <details className="glass-card shadow-xl cursor-pointer group transform md:-rotate-1 hover:rotate-0 transition-all border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-black/5 rounded-full -ml-10 sm:-ml-12 -mt-10 sm:-mt-12" aria-hidden="true"></div>
            <summary className="text-lg sm:text-xl font-semibold text-black flex justify-between items-center relative z-10 list-none">
              <span>When will the CRM be ready?</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform text-sm sm:text-base" aria-hidden="true">▼</span>
            </summary>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg relative z-10">
              We're launching the private beta in Q1 2026. Beta participants will be onboarded in small groups for personalized support. Lock your beta pricing now to save 50% forever.
            </p>
          </details>

          <details className="glass-card shadow-xl cursor-pointer group transform md:rotate-1 hover:rotate-0 transition-all border border-white/60 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-black/5 rounded-full -mr-10 sm:-mr-12 -mb-10 sm:-mb-12" aria-hidden="true"></div>
            <summary className="text-lg sm:text-xl font-semibold text-black flex justify-between items-center relative z-10 list-none">
              <span>Can I cancel anytime?</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform text-sm sm:text-base" aria-hidden="true">▼</span>
            </summary>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg relative z-10">
              Yes, absolutely. No long-term contracts or commitments. Cancel anytime with one click. Your beta pricing is locked in forever if you rejoin later.
            </p>
          </details>

        </div>

      </div>
    </section>
  );
};

export default FAQSection;
