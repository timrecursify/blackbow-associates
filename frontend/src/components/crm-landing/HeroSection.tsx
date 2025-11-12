/**
 * CRM Landing Page - Hero Section
 * Beta signup focus - authentic messaging about the problem and vision
 */

import React from 'react';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-20 pb-20 sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-black/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-black/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-white border border-black/10 rounded-full shadow-sm mb-6 sm:mb-8">
            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs tracking-wider font-medium">FIRST AI-NATIVE WEDDING CRM</span>
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-600" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.05] tracking-tight mb-6 sm:mb-8">
            Stop Drowning<br />
            in <span className="italic font-serif font-normal relative inline-block">
              Client Chaos
              <svg className="absolute -bottom-2 sm:-bottom-3 left-0 w-full" height="8" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7C50 3 150 3 199 7" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10">
            We're building an AI assistant that handles leads, follow-ups, and paperwork—so wedding vendors can focus on what they do best
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
            <a
              href="#crm-demo"
              className="group px-6 py-3 sm:px-8 sm:py-4 bg-black text-white hover:bg-gray-900 transition-all flex items-center gap-2 sm:gap-3 justify-center rounded-full shadow-lg hover:shadow-xl text-sm sm:text-base font-medium"
            >
              See How It Works
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#beta-signup"
              className="group px-6 py-3 sm:px-8 sm:py-4 bg-white border-2 border-black text-black hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3 justify-center rounded-full text-sm sm:text-base font-medium"
            >
              Join the Beta
            </a>
          </div>

          <div className="text-xs sm:text-sm text-gray-600 px-4">
            Private beta • Limited spots • Help shape the future of wedding business automation
          </div>
        </div>

        {/* Problem-focused stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-black/5 px-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-light mb-1 sm:mb-2">70%</div>
            <div className="text-xs sm:text-sm text-gray-600 leading-tight">Inquiries Unanswered</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">in first 24 hours*</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-light mb-1 sm:mb-2">8hrs</div>
            <div className="text-xs sm:text-sm text-gray-600 leading-tight">Admin Work Weekly</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">average vendor*</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-light mb-1 sm:mb-2">$30K</div>
            <div className="text-xs sm:text-sm text-gray-600 leading-tight">Lost Revenue/Year</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">from slow response*</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-light mb-1 sm:mb-2">24/7</div>
            <div className="text-xs sm:text-sm text-gray-600 leading-tight">Clients Expect</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">instant responses*</div>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-center text-gray-400 mt-6 sm:mt-8 px-4">
          *Industry research data from Wedding Industry Reports 2024
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
