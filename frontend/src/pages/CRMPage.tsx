/**
 * BlackBow Associates - CRM Landing Page
 * Version: 6.0.0 - Modular Component Architecture
 * 
 * Professional refactored version with separate components
 * Each component under 500 lines, following production standards
 */

import React from 'react';

// Import all section components
import HeroSection from '../components/crm-landing/HeroSection';
import CRMDashboardSection from '../components/crm-landing/CRMDashboardSection';
import ProblemsSection from '../components/crm-landing/ProblemsSection';
import TwoWaysSection from '../components/crm-landing/TwoWaysSection';
import VendorTypesSection from '../components/crm-landing/VendorTypesSection';
import FeaturesSection from '../components/crm-landing/FeaturesSection';
import PricingSection from '../components/crm-landing/PricingSection';
import FinalCTASection from '../components/crm-landing/FinalCTASection';
import Footer from '../components/crm-landing/Footer';

const CRMPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Skip to content link (accessibility) */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white px-4 py-2 rounded">
        Skip to main content
      </a>

      <main id="main-content" className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* CRM Dashboard Interactive Showcase */}
        <CRMDashboardSection />

        {/* Problems Section - Sound Familiar? */}
        <ProblemsSection />

        {/* Beta Application Form - Moved above vendor types */}
        <PricingSection />

        {/* Two Ways to Use Section - Integration options */}
        <TwoWaysSection />

        {/* Vendor Types Section - For All Wedding Professionals */}
        <VendorTypesSection />

        {/* Features Section - What We're Building */}
        <FeaturesSection />

        {/* Final CTA Section */}
        <FinalCTASection />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default CRMPage;
