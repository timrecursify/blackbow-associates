/**
 * Beta Application Form Section (replaces pricing)
 * For private beta - not selling, inviting to test
 */

import React, { useState } from 'react';
import { CheckCircle2, Bot, Sparkles } from 'lucide-react';

const PricingSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    vendorType: '',
    monthlyLeads: '',
    biggestChallenge: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with actual backend
    console.log('Beta application:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs tracking-wider font-medium">LIMITED BETA SPOTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-light mb-4 sm:mb-6 tracking-tight">
            Apply for <span className="italic font-serif">Early Access</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Help us build the perfect AI assistant for wedding vendors. Beta partners get lifetime benefits.
          </p>
        </div>

        {!submitted ? (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-black/10 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="jane@florals.com"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Jane's Floral Design"
                />
              </div>

              {/* Vendor Type & Monthly Leads */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vendorType" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    What do you do? *
                  </label>
                  <select
                    id="vendorType"
                    name="vendorType"
                    required
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="photographer">Wedding Photographer</option>
                    <option value="florist">Florist</option>
                    <option value="planner">Wedding Planner</option>
                    <option value="videographer">Videographer</option>
                    <option value="venue">Venue Owner</option>
                    <option value="caterer">Caterer</option>
                    <option value="other">Other Wedding Vendor</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="monthlyLeads" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Monthly inquiries *
                  </label>
                  <select
                    id="monthlyLeads"
                    name="monthlyLeads"
                    required
                    value={formData.monthlyLeads}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="0-10">0-10 inquiries</option>
                    <option value="10-25">10-25 inquiries</option>
                    <option value="25-50">25-50 inquiries</option>
                    <option value="50+">50+ inquiries</option>
                  </select>
                </div>
              </div>

              {/* Biggest Challenge */}
              <div>
                <label htmlFor="biggestChallenge" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  What's your biggest challenge with client management? *
                </label>
                <textarea
                  id="biggestChallenge"
                  name="biggestChallenge"
                  required
                  value={formData.biggestChallenge}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                  placeholder="e.g., I can't respond to leads fast enough during busy season..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 sm:py-4 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                Apply for Beta Access
              </button>

              <p className="text-[10px] sm:text-xs text-center text-gray-500">
                We'll contact you when the beta opens
              </p>
            </form>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 border border-green-200 shadow-xl text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-light mb-3 sm:mb-4">Application Received!</h3>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto">
              Thanks for applying, {formData.name}. We'll contact you when the beta opens with next steps and early access details.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Check your spam folder just in case. We're excited to have you help shape Black Bow!
            </p>
          </div>
        )}

        {/* System benefits */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-light mb-2">24/7</div>
            <div className="text-sm text-gray-600">AI responds instantly while you sleep</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-light mb-2">Zero Admin</div>
            <div className="text-sm text-gray-600">Contracts & invoices auto-generated</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-light mb-2">3x More</div>
            <div className="text-sm text-gray-600">Leads captured without extra work</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

