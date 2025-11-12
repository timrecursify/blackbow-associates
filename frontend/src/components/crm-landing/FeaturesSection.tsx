/**
 * Features Section - What we're building and problems it solves
 * Beta-appropriate: focus on vision and capabilities, not fake success stories
 */

import React from 'react';
import { Bot, MessageSquare, FileText, Zap, CheckCircle2, Clock } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-32 px-4 sm:px-6 bg-black text-white relative overflow-hidden" id="features">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-8 sm:mb-12 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4 sm:mb-6">
            <Bot className="w-4 h-4" />
            <span className="text-xs tracking-wider font-medium">WHAT WE'RE BUILDING</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light mb-6 sm:mb-8 tracking-tight">
            Three Core <span className="italic font-serif">Capabilities</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto">
            The features that will transform how you run your wedding business
          </p>
        </div>

        {/* Capability 1: AI Client Communication */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          <div className="lg:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-light mb-2">AI Client Communication</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Never miss an inquiry. Your AI responds instantly, 24/7, learning your style and capturing every opportunity while you focus on creating magic.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">The Goal</div>
                <div className="text-sm text-gray-400">Respond to every lead within 2 minutes</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">The Vision</div>
                <div className="text-sm text-gray-400">Capture 3x more leads without extra work</div>
              </div>
            </div>

            {/* Example conversation showing what AI will do */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">Potential Client</div>
                  <div className="text-xs text-gray-400">Hi! Do you have availability for August 2025?</div>
                </div>
                <span className="text-xs text-gray-500">11:43 PM</span>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-white text-black rounded-xl p-3 max-w-[85%]">
                  <div className="text-xs mb-1 opacity-60 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Your AI • 2 min later
                  </div>
                  <div className="text-sm">Great to hear from you! Yes, I have August 12, 19, and 26 available. I've sent you our portfolio and package details. Looking forward to discussing your special day!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Why this matters */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="mb-4">
              <div className="text-lg font-light mb-2">Why This Matters</div>
              <div className="w-12 h-0.5 bg-white/20" />
            </div>
            <p className="text-base leading-relaxed mb-6 text-gray-300">
              Wedding vendors lose 40% of potential bookings simply because they don't respond fast enough. Couples are shopping around, and the first to respond often wins.
            </p>
            <p className="text-sm text-gray-400 italic">
              Your AI learns your communication style, understands your availability, and handles initial conversations—so every lead gets a response while you sleep.
            </p>
          </div>
        </div>

        {/* Capability 2: Smart Document Generation */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* Why this matters */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="mb-4">
              <div className="text-lg font-light mb-2">The Problem</div>
              <div className="w-12 h-0.5 bg-white/20" />
            </div>
            <p className="text-base leading-relaxed mb-6 text-gray-300">
              You spend hours every week creating contracts, proposals, and invoices. Each one needs to be customized, proofread, and sent at the right time.
            </p>
            <p className="text-sm text-gray-400 italic">
              What if these documents created themselves based on your client conversations, perfectly formatted and branded?
            </p>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-light mb-2">Smart Document Generation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Contracts, proposals, and invoices created in seconds—perfectly branded, legally sound, and ready to send.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">From Hours</div>
                <div className="text-sm text-gray-400">To seconds per document</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">Zero Errors</div>
                <div className="text-sm text-gray-400">AI double-checks everything</div>
              </div>
            </div>

            {/* Document examples */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Wedding Contract - [Client Name].pdf</div>
                    <div className="text-xs text-gray-400">Auto-generated from conversation</div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Custom Proposal.pdf</div>
                    <div className="text-xs text-gray-400">Branded with your style</div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Capability 3: Intelligent Workflow Automation */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-light mb-2">Intelligent Workflow Automation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your CRM updates itself. Tasks complete automatically. Follow-ups happen on time. You focus on weddings, not admin work.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">40hrs/mo</div>
                <div className="text-sm text-gray-400">Time we aim to save you</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">Auto</div>
                <div className="text-sm text-gray-400">Updates & reminders</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-light mb-1 text-gray-300">Zero</div>
                <div className="text-sm text-gray-400">Missed follow-ups</div>
              </div>
            </div>

            {/* Workflow automation examples */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">Consultation completed → Contract sent</div>
                  <div className="text-xs text-gray-400">Automatic workflow</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">CRM updated with venue details</div>
                  <div className="text-xs text-gray-400">Synced across all systems</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">Payment reminder scheduled</div>
                  <div className="text-xs text-gray-400">Intelligent timing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Why automation matters */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="mb-4">
              <div className="text-lg font-light mb-2">The Big Picture</div>
              <div className="w-12 h-0.5 bg-white/20" />
            </div>
            <p className="text-base leading-relaxed mb-6 text-gray-300">
              The average wedding vendor spends 8+ hours weekly on admin tasks that could be automated. That's 400+ hours per year not spent on your craft.
            </p>
            <p className="text-sm text-gray-400 italic">
              We're building AI that handles the busywork, so you can focus on what you actually love about your job.
            </p>
          </div>
        </div>

        {/* Beta program call-out */}
        <div className="mt-12 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 lg:p-12 border border-white/10">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-2xl lg:text-3xl font-light mb-4">
              Help Us Build This <span className="italic font-serif">Together</span>
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We're looking for wedding professionals to join our private beta. You'll get early access, shape the product roadmap, and help us build the AI assistant that actually understands your business.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-sm">
              <Bot className="w-4 h-4" />
              <span>Limited beta spots available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
