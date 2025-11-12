/**
 * Vendor Types Section - Diagonal Flow Design
 * NO IMAGES, NO BOXES - Pure typography and elegant spacing
 */

import React from 'react';

const VendorTypesSection: React.FC = () => {
  return (
    <section id="vendor-types" className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-black/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-40 -right-40 w-96 h-96 bg-black/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-20 sm:mb-24 lg:mb-32">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light mb-8 tracking-tight leading-tight">
            Built for <span className="italic font-serif">Every Wedding Professional</span>
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether you capture moments, create beauty, or orchestrate magic
          </p>
        </div>

        {/* Vendors - Diagonal flowing design */}
        <div className="space-y-0">
          
          {/* Photographers */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform -skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Photographers
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Capture memories, not admin</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                    Never miss a lead during wedding season • Contracts and shot lists generated automatically • Portfolios sent instantly • More time shooting, zero time on admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Florists */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 lg:text-right w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Florists
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Design beauty, not schedules</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed lg:text-right">
                    Automated consultations and style questionnaires • Order timelines managed automatically • Proposals with pricing sent instantly • Focus on arrangements, not admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wedding Planners */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform -skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Wedding Planners
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Orchestrate magic, not emails</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                    Vendor coordination on autopilot • Timeline updates sent automatically • Client questions answered 24/7 • Create experiences, not spreadsheets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Videographers */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 lg:text-right w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Videographers
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Tell stories, not chase payments</div>
                </div>
                <div className="lg:w-2/3 space-y-3">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed lg:text-right">
                    Booking management handled automatically • Deliverable tracking and reminders • Contracts sent on time • More time editing, less time emailing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Venues */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform -skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Venues
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Host events, not calendars</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                    Real time availability checking • Site visit scheduling automated • Booking confirmations sent instantly • Focus on hospitality, not logistics
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Makeup Artists */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 lg:text-right w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Makeup Artists
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Create beauty, not schedules</div>
                </div>
                <div className="lg:w-2/3 space-y-3">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed lg:text-right">
                    Trial scheduling on autopilot • Style questionnaires automated • Timeline coordination handled for you • Perfect faces, not perfect spreadsheets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Caterers */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform -skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Caterers
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Perfect menus, not paperwork</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                    Tasting coordination automated • Dietary requirements tracked automatically • Custom menus and proposals generated • Delight palates, not chase emails
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DJs */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 lg:text-right w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    DJs & Entertainment
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Set the vibe, not reminders</div>
                </div>
                <div className="lg:w-2/3 space-y-3">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed lg:text-right">
                    Music preference collection automated • Special requests tracked and organized • Timeline coordination handled seamlessly • Create atmosphere, not admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cake Designers */}
          <div className="relative py-8 sm:py-12 lg:py-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent transform -skew-y-1 group-hover:via-black/[0.04] transition-colors duration-500" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 lg:gap-16">
                <div className="lg:w-1/3 w-full">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight">
                    Cake Designers
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 italic">Bake art, not manage inquiries</div>
                </div>
                <div className="lg:w-2/3 space-y-3 w-full">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                    Tasting appointments scheduled automatically • Custom order details tracked perfectly • Delivery coordination handled seamlessly • Sweeten moments, not workdays
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Closing statement */}
        <div className="text-center mt-24 sm:mt-28 lg:mt-36 max-w-4xl mx-auto">
          <p className="text-2xl sm:text-3xl lg:text-5xl font-light leading-relaxed mb-8">
            One <span className="italic font-serif">AI employee</span> that understands your craft
          </p>
          <p className="text-base sm:text-lg text-gray-600 mb-10 leading-relaxed">
            If you're drowning in admin work instead of doing what you love, this is for you.
          </p>
          <a 
            href="#pricing" 
            className="inline-block text-lg font-medium px-8 py-4 bg-black text-white rounded-full hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl"
          >
            Apply for Beta Access
          </a>
        </div>
      </div>
    </section>
  );
};

export default VendorTypesSection;
