import React, { useEffect, useState } from 'react';
import { logger } from './utils/logger';
import { captureReferralCode, getReferralCode } from './utils/referral';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, ExternalLink, UserX, Sparkles, DollarSign, Target, Shield, BookOpen } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { usersAPI } from './services/api';
import { isAuthenticated, authAPI as customAuthAPI, getAccessToken } from './services/authAPI';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { AboutPage } from './pages/AboutPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AccountPage } from './pages/AccountPage';
import { LeadDetailsPage } from './pages/LeadDetailsPage';
import { AdminVerificationPage } from './pages/AdminVerificationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AccountBlocked } from './pages/AccountBlocked';
import { CustomSignInPage } from './pages/CustomSignInPage';
import { CustomSignUpPage } from './pages/CustomSignUpPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ScrollToTop } from './components/ScrollToTop';
import { BlogPage } from './pages/BlogPage';
import { BlogArticlePage } from './pages/BlogArticlePage';
import { EmailConfirmationPage } from './pages/EmailConfirmationPage';
import { ConfirmEmailSuccessPage } from './pages/ConfirmEmailSuccessPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import CRMPage from './pages/CRMPage';
import QRPage from './pages/QRPage';

const LandingPage: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Capture referral code on page load
  useEffect(() => {
    captureReferralCode();
  }, []);

  useEffect(() => {
    // Check if user is authenticated via JWT
    setIsSignedIn(isAuthenticated());

    // Listen for storage events to detect login/logout in other tabs
    const handleStorageChange = () => {
      setIsSignedIn(isAuthenticated());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refCode = getReferralCode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col relative ">
      {/* Video Background - Optimized Loading */}
      <video
        key="homepage-video"
        autoPlay
        loop
        muted
        playsInline
        preload={typeof window !== 'undefined' && window.innerWidth < 768 ? 'metadata' : 'auto'}
        className="video-background"
        style={{ objectFit: 'cover' }}
        onLoadStart={(e) => {
          const isMobile = window.innerWidth < 768;

          // Skip video on slow connections
          if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g')) {
              e.currentTarget.style.display = 'none';
              return;
            }

            // On mobile with 4g, delay load slightly
            if (isMobile && conn.effectiveType === '4g') {
              setTimeout(() => {
                e.currentTarget.load();
              }, 500);
            }
          }
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      >
        <source src="/videos/Demo_Reel_New.mp4" type="video/mp4" />
      </video>

      {/* Video Overlay */}
      <div className="video-overlay"></div>

      {/* Simple Auth Header */}
      <header className="absolute top-0 right-0 z-20 p-4 sm:p-4 md:p-6">
        <div className="flex gap-2 sm:gap-3">
          {!isSignedIn ? (
            <>
              <Link
                to="/sign-in"
                className="px-4 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2 text-sm sm:text-sm md:text-base font-medium text-gray-700 hover:text-black transition-colors min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
              <Link
                to={refCode ? `/sign-up?ref=${refCode}` : '/sign-up'}
                className="px-4 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2 text-sm sm:text-sm md:text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors shadow-md rounded-lg min-h-[44px] flex items-center"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link
              to="/marketplace"
              className="px-4 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2 text-sm sm:text-sm md:text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors shadow-md rounded-lg min-h-[44px] flex items-center"
            >
              Marketplace
            </Link>
          )}
        </div>
      </header>

      {/* Floating Geometric Shapes Animation */}
      <div className="floating-shapes" style={{zIndex: 2}}>
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      {/* Wave Animation */}
      <div className="wave-container" style={{zIndex: 2}}>
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-4 py-20 sm:py-20 md:py-24 lg:py-8 relative z-10 pt-24 sm:pt-20 lg:pt-16">
        <div className="text-center max-w-4xl mx-auto w-full">
          <h1 className="font-handwritten text-7xl sm:text-7xl md:text-8xl lg:text-8xl text-black mb-6 sm:mb-6 md:mb-8 lg:mb-4 leading-tight px-2 transition-colors duration-200">
            Black Bow Associates
          </h1>

          <h2 className="font-handwritten-script text-3xl sm:text-3xl md:text-4xl lg:text-4xl text-black mb-8 sm:mb-8 md:mb-10 lg:mb-4 leading-relaxed px-2 transition-colors duration-200">
            Professional Wedding Vendor Association
          </h2>

          <p className="text-base sm:text-base md:text-lg lg:text-lg text-gray-600 mb-10 sm:mb-10 md:mb-12 lg:mb-6 max-w-3xl mx-auto leading-relaxed px-4 transition-colors duration-200">
            We connect premium wedding vendors with qualified couples. Purchase high-quality leads matched to your expertise
            and grow your business. <strong className="text-black">Pay only for the leads you want.</strong>
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-4 mb-10 sm:mb-12 lg:mb-6 max-w-4xl mx-auto px-4">
            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-5 sm:p-6 lg:p-4 shadow-2xl border border-white/30">
              <Sparkles className="mx-auto mb-3 sm:mb-3 lg:mb-2 text-black lg:w-7 lg:h-7" size={36} strokeWidth={1.5} />
              <h3 className="font-bold text-lg sm:text-lg lg:text-base mb-2 sm:mb-2 lg:mb-1 text-gray-900 glass-text-shadow">Quality Leads</h3>
              <p className="text-gray-900 text-sm lg:text-xs leading-relaxed">
                Pre-qualified couples actively planning their weddings
              </p>
            </div>

            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-5 sm:p-6 lg:p-4 shadow-2xl border border-white/30">
              <DollarSign className="mx-auto mb-3 sm:mb-3 lg:mb-2 text-black lg:w-7 lg:h-7" size={36} strokeWidth={1.5} />
              <h3 className="font-bold text-lg sm:text-lg lg:text-base mb-2 sm:mb-2 lg:mb-1 text-gray-900 glass-text-shadow">Pay Per Lead</h3>
              <p className="text-gray-900 text-sm lg:text-xs leading-relaxed">
                Affordable pricing for each qualified lead you receive
              </p>
            </div>

            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-5 sm:p-6 lg:p-4 shadow-2xl border border-white/30">
              <Target className="mx-auto mb-3 sm:mb-3 lg:mb-2 text-black lg:w-7 lg:h-7" size={36} strokeWidth={1.5} />
              <h3 className="font-bold text-lg sm:text-lg lg:text-base mb-2 sm:mb-2 lg:mb-1 text-gray-900 glass-text-shadow">Targeted Matching</h3>
              <p className="text-gray-900 text-sm lg:text-xs leading-relaxed">
                Receive only leads that match your expertise and preferences
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6 sm:mb-8 lg:mb-4 px-4">
            <Link
              to={refCode ? `/sign-up?ref=${refCode}` : '/sign-up'}
              className="inline-flex items-center justify-center space-x-2 sm:space-x-3 bg-black text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span>Get Started Today</span>
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
          <div className="bg-white/35 backdrop-blur-lg rounded-xl p-5 sm:p-6 lg:p-3 max-w-2xl mx-4 sm:mx-auto border border-white/40 shadow-2xl">
            <p className="text-gray-900 text-sm md:text-base lg:text-xs leading-relaxed">
              <strong className="text-black">Who can join?</strong> Wedding photographers, videographers, planners, florists, caterers, DJs, venues, and all wedding service providers committed to excellence. <strong className="text-black">Membership is completely free.</strong> You only pay for the high-quality leads you choose to purchase, earn complimentary leads by providing valuable feedback to improve our marketplace, and gain access to the most qualified wedding couples actively seeking premium services.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/25 backdrop-blur-md border-t border-white/30 py-2 sm:py-3 md:py-4 lg:py-2">
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
              className="text-gray-600 hover:text-black transition-colors duration-200 text-center text-sm no-underline"
            >
              © 2025 Precious Pics Production Inc
            </a>

            {/* Links - Bottom on mobile */}
            <div className="flex items-center space-x-6">
              <Link
                to="/blog"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-black transition-colors duration-200 text-sm min-h-[44px]"
              >
                <BookOpen size={16} />
                <span>Blog</span>
              </Link>
              <Link
                to="/crm"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-black transition-colors duration-200 text-sm min-h-[44px]"
              >
                <Sparkles size={16} />
                <span>CRM</span>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wide bg-black text-white rounded uppercase">
                  New
                </span>
              </Link>
              <Link
                to="/unsubscribe"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-black transition-colors duration-200 text-sm min-h-[44px]"
              >
                <UserX size={16} />
                <span>Unsubscribe</span>
              </Link>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden sm:flex items-center justify-between text-sm">
            {/* Links - Left */}
            <div className="flex items-center space-x-6">
              <Link
                to="/blog"
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <BookOpen size={16} />
                <span>Blog</span>
              </Link>
              <Link
                to="/crm"
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <Sparkles size={16} />
                <span>CRM</span>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide bg-black text-white rounded uppercase">
                  New
                </span>
              </Link>
              <Link
                to="/unsubscribe"
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <UserX size={16} />
                <span>Unsubscribe</span>
              </Link>
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

// Onboarding Route Wrapper - requires auth but allows loading
// Fixed to support both localStorage tokens AND OAuth cookies
const OnboardingRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // First quick check for localStorage token
      const hasLocalToken = isAuthenticated();

      if (hasLocalToken) {
        setIsSignedIn(true);
        setCheckingAuth(false);
        return;
      }

      // If no localStorage token, try API call (works with OAuth cookies)
      try {
        await usersAPI.getProfile();
        // API succeeded - user is authenticated via cookies
        setIsSignedIn(true);
      } catch (error: any) {
        // Don't log cookies/tokens; keep errors minimal in production
        logger.warn('OnboardingRoute auth check failed', {
          component: 'OnboardingRoute',
          status: error?.response?.status
        });
        // API failed - user is not authenticated
        setIsSignedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Wait for auth check to complete
  if (checkingAuth || isSignedIn === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

// Protected Route Wrapper - checks authentication and onboarding status
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // First check localStorage token (email/password login)
      const hasLocalToken = isAuthenticated();

      // Try to load cached status first for faster UX (especially on mobile)
      const cachedStatus = localStorage.getItem('onboardingCompleted');
      if (cachedStatus !== null) {
        setOnboardingCompleted(cachedStatus === 'true');
      }

      // Fetch fresh status from API (works with both localStorage tokens AND cookies from OAuth)
      try {
        const response = await usersAPI.getProfile();
        const onboardingStatus = response.data?.user?.onboardingCompleted;

        const isCompleted = onboardingStatus === true;
        setOnboardingCompleted(isCompleted);

        // User is authenticated (either via localStorage token OR OAuth cookies)
        setIsSignedIn(true);

        // Cache the status for faster subsequent loads
        localStorage.setItem('onboardingCompleted', String(isCompleted));
      } catch (error) {
        logger.error('Failed to check onboarding status:', error);

        // API call failed - user is NOT authenticated
        setIsSignedIn(false);
        localStorage.removeItem('onboardingCompleted');
      } finally {
        setLoading(false);
      }
    };

    // Run check immediately
    checkAuthAndOnboarding();

    // Listen for storage events to detect login/logout in other tabs
    const handleStorageChange = () => {
      checkAuthAndOnboarding();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  // No Supabase auth setup needed - using JWT tokens from localStorage

  return (
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />

          {/* Auth Routes */}
          <Route path="/sign-in" element={<CustomSignInPage />} />
          <Route path="/sign-up" element={<CustomSignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailSuccessPage />} />
          <Route path="/account-blocked" element={<AccountBlocked />} />

          {/* Onboarding Route - requires auth but not onboarding completion */}
          <Route
            path="/onboarding"
            element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>}
          />

          {/* Protected Routes - require auth AND onboarding completion */}
          <Route
            path="/marketplace"
            element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>}
          />
          <Route
            path="/account"
            element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
          />
          <Route
            path="/leads/:id"
            element={<ProtectedRoute><LeadDetailsPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/verify"
            element={<ProtectedRoute><AdminVerificationPage /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
  );
}

export default App;
