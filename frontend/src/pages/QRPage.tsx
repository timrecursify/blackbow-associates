/**
 * QR Code Page - Simple page with QR code pointing to CRM landing
 * Optimized for mobile and printing
 */

import React, { useEffect } from 'react';

const QRPage: React.FC = () => {
  // QR Code generated using Google Charts API pointing to the CRM page
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    'https://blackbowassociates.com/crm'
  )}`;

  // Update meta tags for SEO and social sharing
  useEffect(() => {
    // Update title
    document.title = 'Scan to Learn About Our AI CRM - BlackBow Associates';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Scan this QR code to learn about our AI-native CRM for wedding vendors. Stop drowning in client chaos with automated lead management.');
    }
    
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Scan to Learn About Our AI CRM - BlackBow Associates');
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', 'Scan this QR code to learn about our AI-native CRM for wedding vendors. Automated lead management and client communication.');
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://blackbowassociates.com/qr');
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', 'Scan to Learn About Our AI CRM');
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', 'AI-native CRM for wedding vendors. Scan to learn more.');
    
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
    <div className="fixed inset-0 w-screen h-screen bg-white flex items-center justify-center overflow-hidden">
      <div className="max-w-2xl w-full text-center flex flex-col items-center justify-center px-4 sm:px-6">
        {/* Title - Much bigger on mobile! */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-4 sm:mb-6">
          AI-Native CRM For
          <br />
          <span className="italic font-serif font-normal">Wedding Vendors</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
          Stop drowning in client chaos. Let AI handle leads, follow-ups, and paperwork while you focus on creating magic.
        </p>

        {/* QR Code */}
        <div className="inline-block p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border border-black/5 mb-6 sm:mb-8">
          <img
            src={qrCodeUrl}
            alt="QR Code to Black Bow CRM"
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto"
          />
          <div className="mt-3 pt-3 border-t border-black/5">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Scan to learn more</p>
            <p className="text-xs sm:text-sm font-mono text-gray-400">
              blackbowassociates.com/crm
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://blackbowassociates.com/crm"
          className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl text-sm sm:text-base font-medium"
        >
          View on this device →
        </a>

        {/* Footer */}
        <p className="text-xs sm:text-sm text-gray-400 mt-6 sm:mt-8">
          © 2025 Black Bow Associates • Crafted for wedding professionals
        </p>
      </div>
    </div>
  );
};

export default QRPage;

