/**
 * QR Code Page - Simple page with QR code pointing to CRM landing
 * Optimized for mobile and printing
 */

import React from 'react';

const QRPage: React.FC = () => {
  // QR Code generated using Google Charts API pointing to the CRM page
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    'https://blackbowassociates.com/crm'
  )}`;

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="max-w-2xl w-full text-center flex flex-col items-center justify-center">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight mb-3 sm:mb-4">
          AI-Native CRM For
          <br />
          <span className="italic font-serif font-normal">Wedding Vendors</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 max-w-xl mx-auto leading-relaxed">
          Stop drowning in client chaos. Let AI handle leads, follow-ups, and paperwork while you focus on creating magic.
        </p>

        {/* QR Code */}
        <div className="inline-block p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border border-black/5 mb-4 sm:mb-6">
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
          className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl text-xs sm:text-sm font-medium"
        >
          View on this device →
        </a>

        {/* Footer */}
        <p className="text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6">
          © 2025 Black Bow Associates • Crafted for wedding professionals
        </p>
      </div>
    </div>
  );
};

export default QRPage;

