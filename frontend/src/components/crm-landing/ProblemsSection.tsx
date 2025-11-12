/**
 * Problems Section - Shows common pain points and solution
 */

import React from 'react';

const ProblemsSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light mb-4 sm:mb-6 tracking-tight">
            Sound <span className="italic font-serif">Familiar?</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Every wedding vendor faces these challenges
          </p>
        </div>

        {/* Flowing, organic layout - NOT boxes */}
        <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto mb-12 sm:mb-16 px-4">
          <div className="relative">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-gray-800 leading-relaxed">
              You're shooting weddings and editing photos while <span className="italic font-serif text-black">20 leads are waiting</span> for a response you haven't had time to write.
            </p>
          </div>

          <div className="relative pl-4 sm:pl-6 md:pl-8 border-l-2 border-black/20">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-gray-800 leading-relaxed">
              Contracts, invoices, timelines, vendor sheets... You became a wedding pro to be <span className="italic font-serif text-black">creative</span>, not a paperwork machine.
            </p>
          </div>

          <div className="relative">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-gray-800 leading-relaxed">
              By the time you respond to Tuesday's inquiry, they've already <span className="italic font-serif text-black">booked someone else</span>. You're leaving money on the table.
            </p>
          </div>
        </div>

        {/* Solution box with organic shape */}
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10 text-center">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-4 sm:mb-6">
                What if <span className="italic font-serif">AI handled all of this?</span>
              </h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                An assistant that responds instantly, sends contracts automatically, tracks every detail, and never sleeps. That's what we built.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;

