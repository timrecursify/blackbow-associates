/**
 * Beta Application Form Section (replaces pricing)
 * For private beta - not selling, inviting to test
 */

import React, { useState } from 'react';
import { CheckCircle2, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/api';
import { logger } from '../../utils/logger';

const PricingSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyWebsite: '',
    vendorType: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - silently reject bots
    if (honeypot) {
      setError('Unable to submit your application. Please try again later.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/crm-beta/signup', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        companyWebsite: formData.companyWebsite.trim() || undefined,
        vendorType: formData.vendorType,
        message: formData.message.trim()
      });

      if (response.data.success) {
        logger.info('CRM Beta signup successful', { email: formData.email });
        setSubmitted(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit application');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit application. Please try again.';
      logger.error('CRM Beta signup failed', { error: errorMessage });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs tracking-wider font-medium">LIMITED BETA SPOTS</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light mb-6 sm:mb-8 tracking-tight">
            Apply for <span className="italic font-serif">Early Access</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
            Help us build the perfect AI assistant for wedding vendors. Beta partners get lifetime benefits.
          </p>
        </div>

        {!submitted ? (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-black/10 shadow-xl">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">Application Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

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
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="jane@florals.com"
                  />
                </div>
              </div>

              {/* Phone & Company Name */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    required
                    disabled={loading}
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Jane's Floral Design"
                  />
                </div>
              </div>

              {/* Vendor Type & Website */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="vendorType" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    What do you do? *
                  </label>
                  <select
                    id="vendorType"
                    name="vendorType"
                    required
                    disabled={loading}
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                    style={{ 
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    <option value="">Select your specialty...</option>
                    <optgroup label="Photography & Video">
                      <option value="photographer">Wedding Photographer</option>
                      <option value="videographer">Videographer / Cinematographer</option>
                      <option value="photo-video-combo">Photo + Video (Hybrid)</option>
                      <option value="drone-operator">Drone Operator</option>
                      <option value="photo-booth">Photo Booth Services</option>
                    </optgroup>
                    <optgroup label="Planning & Coordination">
                      <option value="wedding-planner">Wedding Planner</option>
                      <option value="day-of-coordinator">Day-of Coordinator</option>
                      <option value="event-designer">Event Designer</option>
                      <option value="wedding-consultant">Wedding Consultant</option>
                    </optgroup>
                    <optgroup label="Floral & Décor">
                      <option value="florist">Florist</option>
                      <option value="decorator">Decorator / Stylist</option>
                      <option value="lighting-designer">Lighting Designer</option>
                      <option value="balloon-artist">Balloon Artist</option>
                      <option value="event-rentals">Event Rentals</option>
                    </optgroup>
                    <optgroup label="Venues">
                      <option value="venue-owner">Venue Owner</option>
                      <option value="barn-venue">Barn / Rustic Venue</option>
                      <option value="hotel-venue">Hotel / Resort</option>
                      <option value="garden-venue">Garden / Outdoor Venue</option>
                      <option value="historic-venue">Historic Venue</option>
                    </optgroup>
                    <optgroup label="Food & Beverage">
                      <option value="caterer">Caterer</option>
                      <option value="bartender">Bartender / Bar Services</option>
                      <option value="cake-designer">Cake Designer / Baker</option>
                      <option value="dessert-bar">Dessert Bar / Sweet Table</option>
                      <option value="food-truck">Food Truck</option>
                    </optgroup>
                    <optgroup label="Entertainment">
                      <option value="dj">DJ</option>
                      <option value="live-band">Live Band / Musicians</option>
                      <option value="string-quartet">String Quartet / Classical</option>
                      <option value="ceremony-musician">Ceremony Musician</option>
                      <option value="mc-host">MC / Host</option>
                      <option value="magician">Magician / Entertainer</option>
                    </optgroup>
                    <optgroup label="Beauty & Fashion">
                      <option value="hair-stylist">Hair Stylist</option>
                      <option value="makeup-artist">Makeup Artist</option>
                      <option value="beauty-team">Hair + Makeup Team</option>
                      <option value="bridal-boutique">Bridal Boutique</option>
                      <option value="tuxedo-rental">Tuxedo / Suit Rental</option>
                      <option value="jewelry">Jewelry Designer</option>
                    </optgroup>
                    <optgroup label="Stationery & Print">
                      <option value="invitation-designer">Invitation Designer</option>
                      <option value="calligrapher">Calligrapher</option>
                      <option value="signage">Signage / Print Design</option>
                      <option value="favor-designer">Favor Designer</option>
                    </optgroup>
                    <optgroup label="Transportation">
                      <option value="limo-service">Limo / Car Service</option>
                      <option value="vintage-car">Vintage Car Rental</option>
                      <option value="shuttle-service">Shuttle / Bus Service</option>
                      <option value="valet">Valet Parking</option>
                    </optgroup>
                    <optgroup label="Specialized Services">
                      <option value="officiant">Officiant / Celebrant</option>
                      <option value="security">Security Services</option>
                      <option value="live-painter">Live Wedding Painter</option>
                      <option value="fireworks">Fireworks / Pyrotechnics</option>
                      <option value="livestream">Livestream / Virtual Services</option>
                      <option value="travel-agent">Wedding Travel Agent</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="other">Other Wedding Professional</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label htmlFor="companyWebsite" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Website <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    id="companyWebsite"
                    name="companyWebsite"
                    autoComplete="url"
                    disabled={loading}
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  What's your biggest challenge with client management? *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={1000}
                  disabled={loading}
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., I can't respond to leads fast enough during busy season, losing track of contracts and payments, spending too much time on admin work..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.message.length}/1000 characters</p>
              </div>

              {/* Honeypot field - hidden from users, visible to bots */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-black text-white hover:bg-gray-900 transition-all rounded-full shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                    Apply for Beta Access
                  </>
                )}
              </button>

              <p className="text-[10px] sm:text-xs text-center text-gray-500">
                We'll contact you when the beta opens. All information is kept confidential.
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

