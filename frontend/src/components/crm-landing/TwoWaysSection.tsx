/**
 * Two Ways to Use Section - Dark background with animations
 * NO BOXES (except code snippet) - flowing, elegant design
 */

import React from 'react';
import { Code, Megaphone, Link2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const TwoWaysSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20 animate-in fade-in slide-in-from-bottom-2" style={{ animationDuration: '0.6s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs tracking-wider font-medium">THREE WAYS TO CONNECT</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light mb-6 sm:mb-8 tracking-tight">
            Start Capturing <span className="italic font-serif">Every Lead</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto">
            Choose the setup that works for you—or combine them all
          </p>
        </div>

        {/* Three Options - Flowing layout */}
        <div className="space-y-16 lg:space-y-24 max-w-5xl mx-auto">
          
          {/* Option 1: Website Integration */}
          <div className="animate-in fade-in slide-in-from-left-2" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs tracking-wider mb-3">
                  OPTION 1
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3">
                  Add Pixel to Your <span className="italic font-serif">Website</span>
                </h3>
                <p className="text-lg text-white/70 mb-6 leading-relaxed max-w-2xl">
                  Already have a website? Perfect. Drop in one line of code and every visitor becomes an AI-managed conversation. No redesign, no complexity.
                </p>
              </div>
            </div>

            <div className="pl-0 sm:pl-8 lg:pl-16 space-y-4">
              {/* Code snippet box (ONLY box allowed) */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 sm:p-6 border border-white/10 shadow-2xl max-w-2xl overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-xs text-white/40 font-mono">your-website.com</span>
                </div>
                <div className="font-mono text-sm text-green-400 leading-relaxed overflow-x-auto">
                  <div className="text-white/30">{'<!-- Add before closing </body> tag -->'}</div>
                  <div className="mt-2 text-purple-400">{'<script'}</div>
                  <div className="ml-4">{'  '}<span className="text-white/60">src=</span><span className="text-green-400">"https://blackbow.ai/pixel.js"</span></div>
                  <div className="ml-4">{'  '}<span className="text-white/60">data-key=</span><span className="text-green-400">"YOUR_KEY"</span></div>
                  <div className="text-purple-400">{'>'}</div>
                  <div className="text-purple-400">{'</script>'}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-500 text-xs">✓ Connected • AI Active</span>
                  </div>
                </div>
              </div>

              {/* Benefits - flowing text */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 max-w-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>5-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Works with any platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>24/7 AI responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Full CRM included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 py-2 bg-black text-xs text-white/40 tracking-wider">OR</span>
            </div>
          </div>

          {/* Option 2: Native Landing Page */}
          <div className="animate-in fade-in slide-in-from-right-2" style={{ animationDuration: '0.8s', animationDelay: '0.4s' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Link2 className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs tracking-wider mb-3">
                  OPTION 2
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3">
                  Share Your <span className="italic font-serif">Booking Page</span>
                </h3>
                <p className="text-lg text-white/70 mb-6 leading-relaxed max-w-2xl">
                  No website? No problem. We give you a beautiful branded landing page with an embedded form. Share the link anywhere—social media, ads, email signature—and start collecting leads instantly.
                </p>
              </div>
            </div>

            <div className="pl-0 sm:pl-8 lg:pl-16 space-y-4">
              {/* Example URL - flowing design */}
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                <span className="text-white/40 text-sm font-mono">blackbow.ai/</span>
                <span className="text-white font-mono text-sm">yourname</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>

              {/* Features showcase - flowing text */}
              <div className="space-y-3 text-white/70 max-w-2xl">
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Beautiful mobile-responsive page with your branding, photos, and packages</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Built-in contact form that feeds directly to your AI assistant</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Share on Instagram, Facebook, Google, or anywhere you advertise</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>AI follows up with every submission automatically—24/7</span>
                </p>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 max-w-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Setup in minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Your branding & colors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Custom domain option</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Analytics included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 py-2 bg-black text-xs text-white/40 tracking-wider">OR</span>
            </div>
          </div>

          {/* Option 3: Lead Generation Service */}
          <div className="animate-in fade-in slide-in-from-left-2" style={{ animationDuration: '0.8s', animationDelay: '0.6s' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs tracking-wider mb-3">
                  OPTION 3
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3">
                  We Find <span className="italic font-serif">Clients for You</span>
                </h3>
                <p className="text-lg text-white/70 mb-6 leading-relaxed max-w-2xl">
                  Want us to do the heavy lifting? Our team runs professional ad campaigns on Google and Meta, and qualified leads flow straight into your AI assistant. You just show up to consultations.
                </p>
              </div>
            </div>

            <div className="pl-0 sm:pl-8 lg:pl-16 space-y-4">
              {/* Stats display - flowing design */}
              <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <span className="text-xs sm:text-sm text-white/60">Google Ads</span>
                  <span className="text-xl sm:text-2xl font-light">47</span>
                  <span className="text-xs sm:text-sm text-white/40">leads/mo</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <span className="text-xs sm:text-sm text-white/60">Meta Ads</span>
                  <span className="text-xl sm:text-2xl font-light">62</span>
                  <span className="text-xs sm:text-sm text-white/40">leads/mo</span>
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-300">AI managing all</span>
                </div>
              </div>

              {/* How it works */}
              <div className="space-y-3 text-white/70 max-w-2xl">
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Professionally designed ad campaigns targeted to your location and specialty</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Pre-qualified leads based on budget, date availability, and services needed</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Your AI nurtures each lead from first contact through booking</span>
                </p>
                <p className="flex items-start gap-3 text-sm">
                  <span className="text-xl">→</span>
                  <span>Pay only for qualified opportunities that match your criteria</span>
                </p>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 max-w-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Expert campaign management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Pre-qualified inquiries</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Location-targeted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Performance tracking</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-20 sm:mt-24 lg:mt-32 text-center animate-in fade-in" style={{ animationDuration: '0.8s', animationDelay: '0.8s' }}>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
            <span className="text-white font-medium">Mix and match?</span> Absolutely. 
            Use your website pixel <span className="italic font-serif">plus</span> your booking page 
            <span className="italic font-serif"> plus </span>our lead generation. 
            Your AI employee handles everything seamlessly.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-gray-100 transition-all rounded-full shadow-lg hover:shadow-xl font-medium"
          >
            <span>Apply for Beta Access</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default TwoWaysSection;
