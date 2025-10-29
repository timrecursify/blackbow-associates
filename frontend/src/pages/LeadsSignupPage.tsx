import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Briefcase, Mail, Phone, Globe, Image, MessageCircle } from 'lucide-react';

export const LeadsSignupPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Parse URL parameters on component mount
  const getInitialFormData = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      name: params.get('name') || '',
      businessName: params.get('business_name') || params.get('businessName') || '',
      businessEmail: params.get('business_email') || params.get('businessEmail') || params.get('email') || '',
      businessPhone: params.get('business_phone') || params.get('businessPhone') || params.get('phone') || '',
      businessWebsite: params.get('business_website') || params.get('businessWebsite') || params.get('website') || '',
      vendorType: params.get('vendor_type') || params.get('vendorType') || '',
      portfolioUrls: params.get('portfolio_urls') || params.get('portfolioUrls') || '',
      comments: params.get('comments') || '',
      preferredCommunication: params.get('preferred_communication')?.split(',').filter(Boolean) || 
                              params.get('preferredCommunication')?.split(',').filter(Boolean) || 
                              [] as string[],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorTypes = [
    'Photographer',
    'Videographer',
    'Photo & Video',
    'Wedding Planner',
    'Event Coordinator',
    'Venue',
    'Caterer',
    'DJ',
    'Live Band',
    'Musician',
    'Florist',
    'Baker / Cake Designer',
    'Hair Stylist',
    'Makeup Artist',
    'Beauty Services',
    'Wedding Dress / Bridal Shop',
    'Tuxedo / Suit Rental',
    'Jewelry',
    'Officiant',
    'Transportation',
    'Invitations & Stationery',
    'Calligrapher',
    'Lighting & Sound',
    'Rental Company',
    'Photo Booth',
    'Bartending Service',
    'Wedding Favors',
    'Dance Instructor',
    'Other',
  ];

  const communicationOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'text', label: 'Text', icon: MessageCircle },
    { value: 'telegram', label: 'Telegram', icon: Send },
    { value: 'facebook', label: 'Facebook', icon: MessageCircle },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'blackbow_website', label: 'BlackBow Site', icon: Globe },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleCommunicationToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCommunication: prev.preferredCommunication.includes(value)
        ? prev.preferredCommunication.filter(v => v !== value)
        : [...prev.preferredCommunication, value],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.businessName.trim()) {
      setError('Please enter your business name');
      return false;
    }
    if (!formData.vendorType) {
      setError('Please select your vendor type');
      return false;
    }
    if (!formData.businessEmail.trim() || !formData.businessEmail.includes('@')) {
      setError('Please enter a valid business email');
      return false;
    }
    if (!formData.businessPhone.trim()) {
      setError('Please enter your business phone');
      return false;
    }
    if (formData.preferredCommunication.length === 0) {
      setError('Please select at least one communication method');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Zapier webhook URL from environment or fallback
      const zapierWebhookUrl = import.meta.env.VITE_ZAPIER_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-webhook-id/';

      // Format data for Zapier webhook
      const zapierPayload = {
        name: formData.name,
        business_name: formData.businessName,
        vendor_type: formData.vendorType,
        business_email: formData.businessEmail,
        business_phone: formData.businessPhone,
        business_website: formData.businessWebsite,
        portfolio_urls: formData.portfolioUrls.split('\n').filter(url => url.trim()).join(', '),
        preferred_communication: formData.preferredCommunication.join(', '),
        comments: formData.comments || 'No additional comments',
        submitted_at: new Date().toISOString(),
      };

      const response = await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapierPayload),
      });

      // Zapier webhooks return 200 on success
      if (response.ok || response.status === 200) {
        // Redirect to thank you page
        navigate('/thank-you');
      } else {
        throw new Error('Failed to submit form. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center py-4 px-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full h-full flex flex-col justify-center">
        {/* Header - More compact */}
        <div className="text-center mb-3">
          <h1 className="font-handwritten text-2xl md:text-4xl text-black mb-1">
            Join Black Bow Associates
          </h1>
          <p className="text-sm text-gray-600">
            Get qualified leads for free. Commission only.
          </p>
        </div>

        {/* Form - Compact layout */}
        <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name, Business, Vendor Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none"
                  placeholder="John Smith"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-xs font-semibold text-gray-700 mb-1">
                  Business <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none"
                  placeholder="Smith Photography"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="vendorType" className="block text-xs font-semibold text-gray-700 mb-1">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="vendorType"
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                  disabled={loading}
                  required
                >
                  <option value="">Select type...</option>
                  {vendorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Email, Phone, Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="businessEmail" className="block text-xs font-semibold text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessEmail"
                  name="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none"
                  placeholder="info@smithphoto.com"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="businessPhone" className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessPhone"
                  name="businessPhone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none"
                  placeholder="(555) 123-4567"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="businessWebsite" className="block text-xs font-semibold text-gray-700 mb-1">
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessWebsite"
                  name="businessWebsite"
                  type="url"
                  value={formData.businessWebsite}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none"
                  placeholder="https://www.yourwebsite.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Portfolio */}
              <div>
                <label htmlFor="portfolioUrls" className="block text-xs font-semibold text-gray-700 mb-1">
                  Portfolio URLs <span className="text-red-500">*</span> <span className="text-gray-500 font-normal">(one per line)</span>
                </label>
                <textarea
                  id="portfolioUrls"
                  name="portfolioUrls"
                  value={formData.portfolioUrls}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none resize-none"
                  placeholder="https://instagram.com/yourportfolio&#10;https://yourwebsite.com/gallery"
                  disabled={loading}
                  required
                />
              </div>

              {/* Communication */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lead Communication <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {communicationOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleCommunicationToggle(value)}
                      disabled={loading}
                      className={`
                        flex items-center justify-center space-x-1 px-2 py-1.5 border-2 rounded-md transition-all text-xs
                        ${formData.preferredCommunication.includes(value)
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <Icon size={14} />
                      <span className="font-medium hidden sm:inline">{label}</span>
                      <span className="font-medium sm:hidden">{label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-xs font-semibold text-gray-700 mb-1">
                Comments (Optional)
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none resize-none"
                placeholder="Anything else we should know..."
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Join Free Now</span>
                  </>
                )}
              </button>
              
              <Link
                to="/"
                className="sm:w-auto flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400">
              Free membership. Commission only when you book.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

