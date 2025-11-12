/**
 * CRM Dashboard Section - Interactive dashboard showcase
 */

import React from 'react';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import CRMPipelineView from './CRMPipelineView';
import AIConversationPanel from './AIConversationPanel';

const CRMDashboardSection: React.FC = () => {
  return (
    <section 
      id="crm-demo"
      className="py-12 sm:py-16 lg:py-32 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-full shadow-sm">
              <Bot className="w-4 h-4" />
              <span className="text-xs tracking-wider font-medium">THE PRODUCT</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] sm:text-xs tracking-wider font-medium">BETA</span>
            </div>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light mb-6 sm:mb-8 tracking-tight">
            Meet Your <span className="italic font-serif">AI Employee</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
            A glimpse at how your AI assistant will manage leads and conversations
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Shadow layer for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl shadow-2xl" />

          {/* Main CRM card (no tilt) */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 hover:shadow-3xl transition-shadow duration-500">
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-2 sm:p-3 border-b border-black/5 flex items-center gap-2">
              <div className="flex gap-1 sm:gap-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-[10px] sm:text-xs text-gray-500 font-medium">Black Bow AI-Native CRM</div>
            </div>

            <div className="flex flex-col xl:flex-row h-[900px] md:h-[600px] xl:h-[630px] overflow-hidden">
              {/* Pipeline - scrollable on mobile */}
              <div className="h-[400px] md:h-full xl:flex-1 min-w-0">
                <CRMPipelineView />
              </div>
              
              {/* Chat - fixed height on mobile */}
              <div className="h-[500px] md:h-full xl:w-80 flex-shrink-0">
                <AIConversationPanel />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16 px-4">
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-4 sm:mb-6 italic font-serif">
            Imagine an AI that handles all of this for you
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl"
          >
            <span>Apply for Beta Access</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CRMDashboardSection;

