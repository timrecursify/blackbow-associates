/**
 * Footer - Professional footer: centered on mobile, 3-column compact on desktop
 */

import React from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 sm:px-6 bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Centered single column | Desktop: 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center md:text-left">
          
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col items-center md:items-start">
            <img 
              src="/logos/BlackBow_Associates_Logo_Site.png" 
              alt="Black Bow Associates"
              className="w-24 h-auto object-contain mb-2"
            />
            <p className="text-xs text-gray-600">
              AI-native CRM for wedding vendors
            </p>
          </div>

          {/* Column 2: Product Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold mb-3 text-sm text-black">Product</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <a href="#crm-demo" className="block hover:text-black transition-colors">AI Demo</a>
              <a href="#features" className="block hover:text-black transition-colors">Features</a>
              <a href="#pricing" className="block hover:text-black transition-colors">Apply for Beta</a>
            </div>
          </div>

          {/* Column 3: Social Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold mb-3 text-sm text-black">Follow Us</h4>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/preciouspicspro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/PreciousPicsPro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://www.pinterest.com/preciouspicsproduction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Pinterest"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.713-1.227l.388-.731s.296.564 1.167.564c2.442 0 4.133-2.239 4.133-5.229 0-2.257-1.912-4.4-4.818-4.4-3.619 0-5.45 2.592-5.45 4.75 0 1.305.497 2.466 1.567 2.903.175.072.333.003.384-.19.037-.142.125-.498.164-.647.053-.202.033-.272-.114-.449-.324-.389-.531-.892-.531-1.607 0-2.067 1.547-3.918 4.028-3.918 2.194 0 3.402 1.34 3.402 3.133 0 2.359-1.043 4.347-2.591 4.347-.853 0-1.491-.705-1.287-1.57.244-.103.244-.103.244-.103z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@preciouspicspro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright - Centered on all screens */}
        <div className="mt-6 pt-4 border-t border-black/5 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Black Bow Associates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
