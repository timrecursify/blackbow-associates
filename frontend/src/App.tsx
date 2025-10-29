import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, ExternalLink, UserX, Sparkles, DollarSign, Target } from 'lucide-react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { setAuthToken } from './services/api';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { LeadsSignupPage } from './pages/LeadsSignupPage';
import { AboutPage } from './pages/AboutPage';
import { ThankYouPage } from './pages/ThankYouPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AccountPage } from './pages/AccountPage';
import { LeadDetailsPage } from './pages/LeadDetailsPage';
import { AdminVerificationPage } from './pages/AdminVerificationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col relative overflow-hidden">
      {/* Floating Geometric Shapes Animation */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      {/* Wave Animation */}
      <div className="wave-container">
        <svg className="wave wave-1" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
        </svg>
        <svg className="wave wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
        </svg>
        <svg className="wave wave-3" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
        </svg>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12 relative z-10">
        <div className="text-center max-w-4xl mx-auto w-full">
          <h1 className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black mb-4 sm:mb-6 leading-tight px-2">
            Black Bow Associates
          </h1>
          
          <h2 className="font-handwritten-script text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 mb-4 sm:mb-6 leading-relaxed px-2">
            Professional Wedding Vendor Association
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            We connect premium wedding vendors with qualified couples. Get exclusive leads, grow your business, 
            and only pay when you book. <strong className="text-black">Join free during our launch!</strong>
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-4xl mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <Sparkles className="mx-auto mb-2 sm:mb-3 text-black" size={32} strokeWidth={1.5} />
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Quality Leads</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Pre-qualified couples actively planning their weddings
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <DollarSign className="mx-auto mb-2 sm:mb-3 text-black" size={32} strokeWidth={1.5} />
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Commission Only</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Pay only when you successfully book a client
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <Target className="mx-auto mb-2 sm:mb-3 text-black" size={32} strokeWidth={1.5} />
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Free Membership</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Launch special: Join free with no monthly fees
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6 sm:mb-8 px-4">
            <Link
              to="/leads-signup"
              className="inline-flex items-center justify-center space-x-2 sm:space-x-3 bg-black text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span>Join Free Now</span>
              <ExternalLink size={18} className="sm:w-5 sm:h-5" />
            </Link>
            
            <Link
              to="/about"
              className="inline-flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 border-2 border-gray-300"
            >
              <span>Learn More</span>
              <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>
          </div>

          {/* Additional Info */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-2xl mx-4 sm:mx-auto border border-gray-200">
            <p className="text-gray-700 text-xs sm:text-sm md:text-base">
              <strong className="text-black">Who can join?</strong> Wedding photographers, videographers, planners, 
              florists, caterers, DJs, venues, and all wedding service providers committed to excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-gray-100 py-2 sm:py-3 md:py-4">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Mobile Layout - Stack vertically */}
          <div className="flex flex-col items-center gap-3 sm:hidden">
            {/* Social Icons - Top on mobile */}
            <div className="flex items-center space-x-4">
              <a
                href="https://www.instagram.com/preciouspicspro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram size={14} />
              </a>
              <a
                href="https://www.facebook.com/PreciousPicsPro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook size={14} />
              </a>
              <a
                href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube size={14} />
              </a>
              <a
                href="https://www.pinterest.com/preciouspicsproduction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Pinterest"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.713-1.227l.388-.731s.296.564 1.167.564c2.442 0 4.133-2.239 4.133-5.229 0-2.257-1.912-4.4-4.818-4.4-3.619 0-5.45 2.592-5.45 4.75 0 1.305.497 2.466 1.567 2.903.175.072.333.003.384-.19.037-.142.125-.498.164-.647.053-.202.033-.272-.114-.449-.324-.389-.531-.892-.531-1.607 0-2.067 1.547-3.918 4.028-3.918 2.194 0 3.402 1.34 3.402 3.133 0 2.359-1.043 4.347-2.591 4.347-.853 0-1.491-.705-1.287-1.57.244-.103.244-.103.244-.103z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@preciouspicspro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="TikTok"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://vimeo.com/preciouspicsproduction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Vimeo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                </svg>
              </a>
            </div>
            
            {/* Copyright - Center on mobile */}
            <a 
              href="https://www.preciouspicspro.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors duration-200 text-center text-xs no-underline"
            >
              © 2025 Precious Pics Production Inc
            </a>
            
            {/* Unsubscribe - Bottom on mobile */}
            <div className="flex items-center space-x-4">
              <a
                href="/unsubscribe"
                className="flex items-center space-x-1 text-gray-600 hover:text-black transition-colors duration-200 text-xs"
              >
                <UserX size={12} />
                <span>Unsubscribe</span>
              </a>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden sm:flex items-center justify-between text-sm">
            {/* Unsubscribe - Left */}
            <div className="flex items-center space-x-4">
              <a
                href="/unsubscribe"
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <UserX size={16} />
                <span>Unsubscribe</span>
              </a>
            </div>
            
            {/* Copyright - Center */}
            <a 
              href="https://www.preciouspicspro.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors duration-200 text-center flex-1 no-underline"
            >
              © 2025 Precious Pics Production Inc
            </a>
            
            {/* Social Icons - Right */}
            <div className="flex items-center space-x-3">
              <a
                href="https://www.instagram.com/preciouspicspro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.facebook.com/PreciousPicsPro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
              <a
                href="https://www.pinterest.com/preciouspicsproduction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Pinterest"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.713-1.227l.388-.731s.296.564 1.167.564c2.442 0 4.133-2.239 4.133-5.229 0-2.257-1.912-4.4-4.818-4.4-3.619 0-5.45 2.592-5.45 4.75 0 1.305.497 2.466 1.567 2.903.175.072.333.003.384-.19.037-.142.125-.498.164-.647.053-.202.033-.272-.114-.449-.324-.389-.531-.892-.531-1.607 0-2.067 1.547-3.918 4.028-3.918 2.194 0 3.402 1.34 3.402 3.133 0 2.359-1.043 4.347-2.591 4.347-.853 0-1.491-.705-1.287-1.57.244-.103.244-.103.244-.103z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@preciouspicspro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://vimeo.com/preciouspicsproduction/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors duration-200"
                aria-label="Vimeo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  const { getToken, isSignedIn } = useAuth();

  // Set up auth token getter for API calls
  useEffect(() => {
    if (isSignedIn && getToken) {
      setAuthToken(getToken);
    }
  }, [isSignedIn, getToken]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/leads-signup" element={<LeadsSignupPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />

        {/* Auth Routes */}
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />} />

        {/* Protected Routes */}
        <Route
          path="/marketplace"
          element={isSignedIn ? <MarketplacePage /> : <Navigate to="/sign-in" replace />}
        />
        <Route
          path="/account"
          element={isSignedIn ? <AccountPage /> : <Navigate to="/sign-in" replace />}
        />
        <Route
          path="/leads/:id"
          element={isSignedIn ? <LeadDetailsPage /> : <Navigate to="/sign-in" replace />}
        />
        <Route
          path="/admin/verify"
          element={isSignedIn ? <AdminVerificationPage /> : <Navigate to="/sign-in" replace />}
        />
        <Route
          path="/admin"
          element={isSignedIn ? <AdminDashboardPage /> : <Navigate to="/sign-in" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;