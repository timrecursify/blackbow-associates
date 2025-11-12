/**
 * BlackBow Associates - CRM Page (Professional Redesign)
 * Version: 2.0.0
 *
 * Follows DeSaaS design-ux-playbook standards:
 * - WCAG 2.2 AA accessibility
 * - Semantic HTML5
 * - Modern CSS patterns (Nesting, Popover API)
 * - Performance optimized (lazy loading, Suspense)
 * - Motion with reduced-motion support
 * - Matches homepage design language
 */

import React, { useState, useRef, Suspense, lazy } from 'react';
import {
  Sparkles,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  PlayCircle,
  Heart,
  Calendar,
  X
} from 'lucide-react';

// Lazy load heavy components for better performance
const BetaSignupForm = lazy(() => import('../components/BetaSignupForm'));

interface CRMPageProps {}

const CRMPage: React.FC<CRMPageProps> = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSignupSuccess = (data: any) => {
    setSubmittedData(data);
    setShowSuccessModal(true);
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Skip to content link (accessibility) */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Video Background - Optimized */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="metadata"
        poster="/images/crm-video-poster.jpg"
        className="video-background"
        aria-label="BlackBow CRM demonstration background video"
      >
        <source src="/videos/Demo_Reel_New.mp4" type="video/mp4" />
      </video>

      {/* Video Play Button (only if not playing) */}
      {!isVideoPlaying && (
        <button
          onClick={handlePlayVideo}
          className="fixed bottom-4 right-4 z-10 bg-black/80 text-white p-3 rounded-full hover:bg-black transition-colors shadow-lg"
          aria-label="Play background video"
        >
          <PlayCircle size={24} />
        </button>
      )}

      {/* Video Overlay */}
      <div className="video-overlay" aria-hidden="true"></div>

      {/* Floating shapes background */}
      <div className="floating-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* MAIN CONTENT */}
      <main id="main-content" className="relative z-10">

        {/* HERO SECTION */}
        <section
          className="relative min-h-screen flex items-center pt-20 md:pt-0"
          aria-labelledby="hero-heading"
        >
          <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">

                {/* Left: Hero Content - 60% */}
                <div className="lg:col-span-7">
                  <div className="transform -rotate-1">
                    <div className="inline-block mb-6 md:mb-8 bg-white/40 backdrop-blur-lg px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/40 shadow-lg transform rotate-1">
                      <span className="text-black font-semibold text-sm sm:text-base">Your AI Employee</span>
                    </div>
                  </div>

                  <h1
                    id="hero-heading"
                    className="font-handwritten text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-black mb-6 md:mb-8 leading-tight transform -rotate-1"
                  >
                    Stop Drowning<br />in Client Chaos
                  </h1>

                  <div className="transform rotate-1 mb-8 md:mb-10">
                    <p className="font-handwritten-script text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-800 mb-4 md:mb-6 leading-relaxed max-w-xl">
                      Your AI assistant handles leads, follow-ups, and paperwork
                    </p>
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-lg">
                      So you can focus on creating unforgettable weddings
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 transform -rotate-1">
                    <a
                      href="#crm-demo"
                      className="btn btn-primary btn-large"
                      aria-label="Scroll to see CRM demonstration"
                    >
                      <span>Watch Your AI Handle a Real Lead</span>
                      <ArrowRight aria-hidden="true" />
                    </a>
                    <a
                      href="#beta-signup"
                      className="btn btn-secondary btn-large"
                      aria-label="Scroll to join beta program"
                    >
                      <span>Lock Beta Pricing (50% Off)</span>
                    </a>
                  </div>

                  <div className="mt-8 md:mt-12 text-gray-600 transform rotate-1">
                    <p className="text-xs sm:text-sm">Join the private beta • Limited spots • Save 8+ hours/week</p>
                  </div>
                </div>

                {/* Right: AI Chat Preview - Full Journey */}
                <div className="lg:col-span-5 mt-8 lg:mt-0">
                  <div className="transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="glass-card shadow-2xl border-2 border-white/70">
                      <div className="bg-gradient-to-r from-gray-900 to-black px-4 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-sm sm:text-base">AI Assistant</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                              role="status"
                              aria-label="AI is active"
                            ></div>
                            <span className="text-white/90 text-xs">Working now</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="ai-chat-container max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2"
                        role="log"
                        aria-label="AI assistant conversation example"
                      >
                        {/* Chat messages */}
                        <div className="chat-message">
                          <div className="avatar" aria-hidden="true">
                            <Sparkles />
                          </div>
                          <div className="message-content">
                            <div className="bubble">
                              <p>Hi Sarah! Thanks for reaching out about photography for your October 2026 wedding. I'd love to help! What style are you envisioning?</p>
                            </div>
                            <p className="message-time">2 days ago</p>
                          </div>
                        </div>

                        <div className="chat-message message-user">
                          <div className="message-content">
                            <div className="bubble">
                              <p>We want romantic, natural light photos. Budget is around $4,500. Are you available?</p>
                            </div>
                            <p className="message-time">2 days ago</p>
                          </div>
                        </div>

                        <div className="chat-message">
                          <div className="avatar" aria-hidden="true">
                            <Sparkles />
                          </div>
                          <div className="message-content">
                            <div className="bubble">
                              <p>Perfect! I just checked - fully available for Oct 12, 2026. I've sent you our romantic portfolio and package details. Should we schedule a quick call?</p>
                            </div>
                            <p className="message-time">2 days ago</p>
                          </div>
                        </div>

                        {/* Status updates */}
                        <div className="my-3 px-4 py-2 border-l-4 border-green-600 bg-green-50 rounded">
                          <p className="text-xs font-semibold text-green-700">Contract sent & signed</p>
                          <p className="text-xs text-green-600">Premium Package - $4,500</p>
                        </div>

                        <div className="my-3 px-4 py-2 border-l-4 border-purple-600 bg-purple-50 rounded">
                          <p className="text-xs font-semibold text-purple-700">5-star review + 2 referrals received</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CRM SHOWCASE SECTION */}
        <section
          id="crm-demo"
          className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12"
          aria-labelledby="crm-showcase-heading"
        >
          <div className="max-w-7xl mx-auto">

            <div className="text-center mb-12 sm:mb-16 transform md:-rotate-1">
              <h2
                id="crm-showcase-heading"
                className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-black mb-4 sm:mb-6"
              >
                Your AI-Powered CRM
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Watch your AI assistant work with real leads in real-time
              </p>
            </div>

            {/* Lazy load the showcase for better performance */}
            <Suspense fallback={<CRMShowcaseSkeleton />}>
              <CRMShowcase />
            </Suspense>

            {/* Bottom CTA */}
            <div className="text-center mt-12 sm:mt-16 transform md:-rotate-1 px-4">
              <p className="font-handwritten-script text-xl sm:text-2xl md:text-3xl text-gray-700 mb-4 sm:mb-6">
                Your AI handles everything while you create magic
              </p>
              <a
                href="#beta-signup"
                className="btn btn-primary btn-large"
              >
                <span>Get Your AI Assistant</span>
                <ArrowRight aria-hidden="true" />
              </a>
            </div>

          </div>
        </section>

        {/* PROBLEMS SECTION */}
        <section
          className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12"
          aria-labelledby="problems-heading"
        >
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-12 sm:mb-16 md:mb-20 transform md:rotate-1">
              <h2
                id="problems-heading"
                className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-black mb-4 sm:mb-6"
              >
                Sound Familiar?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 px-4">
                Every wedding vendor faces these challenges
              </p>
            </div>

            <div className="space-y-6 md:space-y-0 md:relative" style={{ minHeight: '0px' }}>

              {/* Problem cards */}
              <article className="md:absolute md:top-0 md:left-0 lg:left-[5%] w-full lg:w-[55%] transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="glass-card shadow-2xl border-2 border-white/70 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-black/5 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" aria-hidden="true"></div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 relative z-10">No time to respond</h3>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed relative z-10">
                    You're shooting weddings and editing photos while 20 leads are waiting for a response you haven't had time to write.
                  </p>
                </div>
              </article>

              <article className="md:absolute md:top-32 md:right-0 lg:right-[5%] w-full lg:w-[55%] transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="glass-card shadow-2xl border-2 border-white/70 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-black/5 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16" aria-hidden="true"></div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 relative z-10">Drowning in paperwork</h3>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed relative z-10">
                    Contracts, invoices, timelines, vendor sheets... You became a wedding pro to be creative, not a paperwork machine.
                  </p>
                </div>
              </article>

              <article className="md:absolute md:top-64 md:left-0 lg:left-[10%] w-full lg:w-[55%] transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="glass-card shadow-2xl border-2 border-white/70 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-black/5 rounded-full -ml-12 sm:-ml-16 -mt-12 sm:-mt-16" aria-hidden="true"></div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 relative z-10">Leads going cold</h3>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed relative z-10">
                    By the time you respond to Tuesday's inquiry, they've already booked someone else. You're leaving money on the table.
                  </p>
                </div>
              </article>

            </div>

            {/* Solution */}
            <div className="mt-6 md:mt-[550px] lg:mt-[450px] transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl border-3 sm:border-4 border-black relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-black/5 rounded-full -mr-16 sm:-mr-24 md:-mr-32 -mt-16 sm:-mt-24 md:-mt-32" aria-hidden="true"></div>
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-black/5 rounded-full -ml-16 sm:-ml-24 md:-ml-32 -mb-16 sm:-mb-24 md:-mb-32" aria-hidden="true"></div>
                <h3 className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black mb-4 sm:mb-6 text-center relative z-10">
                  What if AI handled all of this?
                </h3>
                <p className="font-handwritten-script text-lg sm:text-xl md:text-2xl text-gray-800 text-center max-w-3xl mx-auto leading-relaxed relative z-10">
                  An assistant that responds instantly, sends contracts automatically, tracks every detail, and never sleeps. That's what we built.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS SECTION - Lazy loaded */}
        <Suspense fallback={<HowItWorksSkeleton />}>
          <HowItWorksSection />
        </Suspense>

        {/* PRICING SECTION - Lazy loaded */}
        <Suspense fallback={<PricingSkeleton />}>
          <PricingSection />
        </Suspense>

        {/* BETA SIGNUP */}
        <section
          id="beta-signup"
          className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12"
          aria-labelledby="beta-signup-heading"
        >
          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-12 sm:mb-16 transform md:-rotate-1">
              <h2
                id="beta-signup-heading"
                className="font-handwritten text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-black mb-4 sm:mb-6"
              >
                Join the Private Beta
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
                Be among the first wedding vendors to experience AI-powered client management
              </p>
            </div>

            <div className="transform md:rotate-1">
              <Suspense fallback={<FormSkeleton />}>
                <BetaSignupForm onSuccess={handleSignupSuccess} />
              </Suspense>
            </div>

          </div>
        </section>

        {/* FAQ SECTION - Lazy loaded */}
        <Suspense fallback={<FAQSkeleton />}>
          <FAQSection />
        </Suspense>

      </main>

      {/* Success Modal (Native Popover API) */}
      {showSuccessModal && (
        <>
          <button
            id="success-trigger"
            popovertarget="success-modal"
            hidden
            aria-hidden="true"
          />
          <div
            id="success-modal"
            popover="manual"
            role="dialog"
            aria-labelledby="success-modal-title"
            aria-modal="true"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 id="success-modal-title" className="modal-title">
                  Welcome to the Beta!
                </h2>
                <button
                  className="close-button"
                  popovertarget="success-modal"
                  popovertargetaction="hide"
                  aria-label="Close dialog"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>Thank you {submittedData?.name}, we'll be in touch soon with your beta access details.</p>
                <p className="mt-4 text-sm text-gray-600">Check your email for next steps.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  popovertarget="success-modal"
                  popovertargetaction="hide"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ===== LAZY LOADED COMPONENTS =====

// CRM Showcase Component (separate for better code splitting)
const CRMShowcase: React.FC = () => {
  return (
    <div className="transform md:rotate-1 hover:rotate-0 transition-transform duration-700">
      <div className="glass-card shadow-2xl border-2 border-white/60 overflow-hidden">

        {/* CRM Header */}
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-700">
          <h3 className="text-white font-semibold text-base sm:text-lg">BlackBow CRM</h3>
          <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" role="status" aria-label="AI is active"></div>
            <span className="text-white text-xs sm:text-sm">AI Active</span>
          </div>
        </div>

        {/* Main Split: Pipeline + AI Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12">

          {/* LEFT: Pipeline View */}
          <div className="lg:col-span-7 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white lg:border-r border-gray-200">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-4 sm:mb-6">Pipeline</h4>

            <div className="md:grid md:grid-cols-3 md:gap-6 flex md:flex-none overflow-x-auto md:overflow-x-visible gap-4 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">

              {/* New Leads Column */}
              <div className="min-w-[280px] md:min-w-0">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-2 h-6 sm:h-8 bg-gray-800 rounded" aria-hidden="true"></div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">New Leads</h5>
                  <span className="bg-gray-100 text-gray-700 text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">3</span>
                </div>
                <div className="space-y-3">
                  <LeadCard
                    name="Jessica Martinez"
                    service="Photography"
                    budget={3500}
                    date="Oct 12, 2026"
                    status="hot"
                    aiAction="Sent portfolio + scheduled call"
                  />
                </div>
              </div>

              {/* In Progress Column */}
              <div className="min-w-[280px] md:min-w-0">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-2 h-6 sm:h-8 bg-gray-800 rounded" aria-hidden="true"></div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">In Progress</h5>
                  <span className="bg-gray-100 text-gray-700 text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">2</span>
                </div>
                <div className="space-y-3">
                  <LeadCard
                    name="Sarah Johnson"
                    service="Photo + Video"
                    budget={6800}
                    date="Sep 5, 2026"
                    status="progress"
                    aiAction="Call scheduled: Thu 3pm"
                  />
                </div>
              </div>

              {/* Booked Column */}
              <div className="min-w-[280px] md:min-w-0">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-2 h-6 sm:h-8 bg-green-600 rounded" aria-hidden="true"></div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">Booked</h5>
                  <span className="bg-green-100 text-green-700 text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">8</span>
                </div>
                <div className="space-y-3">
                  <LeadCard
                    name="Rachel Green"
                    service="Premium Package"
                    budget={5800}
                    date="Jul 18, 2026"
                    status="booked"
                    aiAction="Contract signed ✓"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: AI Chat */}
          <div className="lg:col-span-5 p-4 sm:p-6 md:p-8 bg-white border-t lg:border-t-0 border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500">AI Assistant</h4>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" role="status" aria-label="AI is working"></div>
                <span className="hidden sm:inline">Working now</span>
              </div>
            </div>

            <div className="ai-chat-container mb-6 sm:mb-8">
              <div className="chat-message">
                <div className="avatar" aria-hidden="true">
                  <Sparkles />
                </div>
                <div className="message-content">
                  <div className="bubble">
                    <p>Hi Jessica! Thanks for reaching out about photography for your October 2026 wedding. I'd love to help capture your special day!</p>
                  </div>
                  <p className="message-time">2 minutes ago</p>
                </div>
              </div>

              <div className="chat-message message-user">
                <div className="message-content">
                  <div className="bubble">
                    <p>Hi! We're looking for natural, romantic style photography. Do you have availability for our date?</p>
                  </div>
                  <p className="message-time">Just now</p>
                </div>
              </div>

              <div className="chat-message">
                <div className="avatar" aria-hidden="true">
                  <Sparkles />
                </div>
                <div className="message-content">
                  <div className="bubble typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <p className="message-time">AI is typing...</p>
                </div>
              </div>
            </div>

            {/* AI Actions */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-4">Recent Actions</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700">Added lead to pipeline</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700">Checked calendar availability</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-500">Preparing portfolio link...</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Lead Card Component
interface LeadCardProps {
  name: string;
  service: string;
  budget: number;
  date: string;
  status: 'hot' | 'progress' | 'booked';
  aiAction: string;
}

const LeadCard: React.FC<LeadCardProps> = ({ name, service, budget, date, status, aiAction }) => {
  return (
    <article className="pipeline-card">
      <div className="pipeline-card-header">
        <div>
          <h6 className="client-name">{name}</h6>
          <p className="timestamp">Added 2 min ago</p>
        </div>
        {status === 'hot' && <Sparkles className="w-5 h-5 text-green-600" aria-label="Hot lead" />}
        {status === 'booked' && <Heart className="w-5 h-5 text-green-600" aria-label="Booked client" />}
      </div>

      <div className="pipeline-card-details">
        <div className="detail-row">
          <span className="label">Service:</span>
          <span className="value">{service}</span>
        </div>
        <div className="detail-row">
          <span className="label">Budget:</span>
          <span className="value">${budget.toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span className="label">Wedding:</span>
          <span className="value">{date}</span>
        </div>
      </div>

      <div className="pipeline-card-action">
        <p className="action-label">
          <Zap className="w-3 h-3" aria-hidden="true" />
          AI: {aiAction}
        </p>
      </div>

      {status === 'hot' && (
        <div className="pipeline-card-tags">
          <span className="tag tag-hot">Hot Lead</span>
          <span className="tag">Qualified</span>
        </div>
      )}
    </article>
  );
};

// ===== LAZY LOADED SECTIONS =====

const HowItWorksSection = lazy(() => import('../components/crm/HowItWorksSection'));
const PricingSection = lazy(() => import('../components/crm/PricingSection'));
const FAQSection = lazy(() => import('../components/crm/FAQSection'));

// ===== LOADING SKELETONS =====

const CRMShowcaseSkeleton: React.FC = () => (
  <div className="glass-card h-96 animate-pulse" aria-busy="true" aria-label="Loading CRM showcase">
    <div className="bg-gray-200 h-full rounded-xl"></div>
  </div>
);

const HowItWorksSkeleton: React.FC = () => (
  <div className="py-16 px-4" aria-busy="true" aria-label="Loading how it works section">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const PricingSkeleton: React.FC = () => (
  <div className="py-16 px-4" aria-busy="true" aria-label="Loading pricing section">
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const FAQSkeleton: React.FC = () => (
  <div className="py-16 px-4" aria-busy="true" aria-label="Loading FAQ section">
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const FormSkeleton: React.FC = () => (
  <div className="glass-card space-y-4" aria-busy="true" aria-label="Loading form">
    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

export default CRMPage;
