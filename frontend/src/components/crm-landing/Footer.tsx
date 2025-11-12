/**
 * Footer - Clean footer with only active links and real social media
 */

import React from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 sm:py-8 lg:py-10 px-4 sm:px-6 bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        {/* Logo - smaller on mobile */}
        <div className="mb-4 sm:mb-6 text-center sm:text-left">
          <div className="mb-2 flex justify-center sm:justify-start">
            <img 
              src="/logos/BlackBow_Associates_Logo_Site.png" 
              alt="Black Bow Associates"
              className="w-20 sm:w-28 md:w-32 h-auto object-contain"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-snug">
            AI-native CRM for wedding vendors
          </p>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Product Links - compact */}
          <div>
            <h4 className="font-medium mb-2 text-xs sm:text-sm text-black">Product</h4>
            <div className="space-y-1.5 text-xs sm:text-sm text-gray-600">
              <a href="#crm-demo" className="block hover:text-black transition-colors">Demo</a>
              <a href="#features" className="block hover:text-black transition-colors">Features</a>
              <a href="#pricing" className="block hover:text-black transition-colors">Apply</a>
            </div>
          </div>

          {/* Social Links - compact */}
          <div>
            <h4 className="font-medium mb-2 text-xs sm:text-sm text-black">Follow</h4>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <a
                href="https://www.instagram.com/preciouspicspro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://www.facebook.com/PreciousPicsPro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://www.tiktok.com/@preciouspicspro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright - compact */}
        <div className="pt-3 sm:pt-4 border-t border-black/5 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500">
            © 2025 Black Bow Associates
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
