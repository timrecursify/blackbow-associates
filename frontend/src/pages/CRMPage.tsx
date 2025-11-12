/**
 * BlackBow Associates - CRM Landing Page
 * Version: 6.0.0 - Modular Component Architecture
 * 
 * Professional refactored version with separate components
 * Each component under 500 lines, following production standards
 */

import React, { useEffect } from 'react';

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
  // Update meta tags for SEO and social sharing
  useEffect(() => {
    // Update title
    document.title = 'AI-Native CRM for Wedding Vendors - BlackBow Associates';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Stop drowning in client chaos. AI assistant that handles leads, follow-ups, and paperwork for wedding professionals. Join the private beta.');
    }
    
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'AI-Native CRM for Wedding Vendors - BlackBow Associates');
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', 'Stop drowning in client chaos. AI assistant that handles leads, follow-ups, and paperwork for wedding professionals. Join the private beta.');
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://blackbowassociates.com/crm');
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', 'AI-Native CRM for Wedding Vendors');
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', 'Stop drowning in client chaos. AI assistant for wedding professionals. Join the private beta.');
    
    // Cleanup: restore original tags on unmount
    return () => {
      document.title = 'BlackBow Associates - Premium Wedding Lead Marketplace for Vendors';
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Get qualified wedding leads instantly. Premium marketplace for wedding photographers, videographers, planners, florists, caterers, DJs, and venues. Pay only for leads you want. Join free today.');
      }
      if (ogTitle) ogTitle.setAttribute('content', 'BlackBow Associates - Premium Wedding Lead Marketplace for Vendors');
      if (ogDescription) ogDescription.setAttribute('content', 'Get qualified wedding leads instantly. Premium marketplace for wedding photographers, videographers, planners, florists, caterers, DJs, and venues.');
      if (ogUrl) ogUrl.setAttribute('content', 'https://blackbowassociates.com');
      if (twitterTitle) twitterTitle.setAttribute('content', 'BlackBow Associates - Premium Wedding Lead Marketplace');
      if (twitterDescription) twitterDescription.setAttribute('content', 'Get qualified wedding leads instantly. Premium marketplace for wedding vendors. Pay only for leads you want.');
    };
  }, []);

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
