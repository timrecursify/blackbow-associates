/**
 * Final CTA Section - Beta-focused call to action
 * Not selling, inviting to help build the future
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 lg:py-32 px-6 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Wedding background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        <h2 className="text-4xl lg:text-6xl font-light mb-6 tracking-tight leading-tight">
          Ready to Help Us<br />
          <span className="italic font-serif">Build This?</span>
        </h2>
        <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
          We're looking for wedding professionals who want to shape the future of wedding business automation. Early access is limited.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a 
            href="#pricing"
            className="group px-10 py-5 bg-white text-black text-lg hover:bg-gray-100 transition-all flex items-center gap-3 justify-center rounded-full shadow-2xl"
          >
            Apply for Beta Access
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a 
            href="#crm-demo"
            className="px-10 py-5 border-2 border-white text-white text-lg hover:bg-white hover:text-black transition-all rounded-full"
          >
            See the Vision
          </a>
        </div>

        <p className="text-sm text-gray-500">
          No credit card • No commitments • Just honest feedback
        </p>

        {/* What makes a good beta partner */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <h3 className="text-2xl font-light mb-8">
            Ideal <span className="italic font-serif">Beta Partners</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-lg font-light mb-3">Active Vendors</div>
              <p className="text-sm text-gray-400">
                Currently running a wedding business with regular client inquiries
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-lg font-light mb-3">Problem-Aware</div>
              <p className="text-sm text-gray-400">
                Feeling the pain of manual client management and admin work
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-lg font-light mb-3">Feedback-Ready</div>
              <p className="text-sm text-gray-400">
                Willing to share honest thoughts and help shape the product
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
