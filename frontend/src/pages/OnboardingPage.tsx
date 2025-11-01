import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, MapPin, Briefcase, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { usersAPI } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    location: '',
    vendorType: '',
    about: '',
    // Billing address fields (Step 2)
    billingFirstName: '',
    billingLastName: '',
    billingCompanyName: '',
    billingIsCompany: false,
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingZip: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    // Pre-fill business name with user's name from Supabase metadata
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const firstName = user.user_metadata.first_name || user.user_metadata.firstName || '';
        const lastName = user.user_metadata.last_name || user.user_metadata.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          setFormData(prev => ({ ...prev, businessName: fullName }));
        }
      }
    });

    // Auto-detect location on component mount
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      // Use IP-based geolocation (more reliable than browser geolocation)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.city && data.region_code) {
        const locationString = `${data.city}, ${data.region_code}`;
        setFormData(prev => ({ ...prev, location: locationString }));
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
      // Silently fail - user can still enter manually
    } finally {
      setDetectingLocation(false);
    }
  };

  const vendorTypes = [
    'Photographer',
    'Videographer',
    'Caterer',
    'DJ / Music',
    'Venue',
    'Florist',
    'Wedding Planner',
    'Baker / Cake Designer',
    'Hair & Makeup',
    'Decorator',
    'Transportation',
    'Other'
  ];

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        if (value.length < 2) return 'Business name must be at least 2 characters';
        if (value.length > 100) return 'Business name must be less than 100 characters';
        return null;
      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.length < 2) return 'Location must be at least 2 characters';
        return null;
      case 'vendorType':
        if (!value) return 'Please select a vendor type';
        return null;
      case 'about':
        if (!value.trim()) return 'About section is required';
        if (value.length < 10) return 'About must be at least 10 characters';
        if (value.length > 1000) return 'About must be less than 1000 characters';
        return null;
      // Billing address validation
      case 'billingFirstName':
        if (!value.trim()) return 'First name is required';
        return null;
      case 'billingLastName':
        if (!value.trim()) return 'Last name is required';
        return null;
      case 'billingCompanyName':
        if (!value.trim()) return 'Company name is required';
        return null;
      case 'billingAddressLine1':
        if (!value.trim()) return 'Address is required';
        return null;
      case 'billingCity':
        if (!value.trim()) return 'City is required';
        return null;
      case 'billingState':
        if (!value.trim()) return 'State is required';
        if (!/^[A-Z]{2}$/i.test(value)) return 'Please enter a valid 2-letter state code (e.g., NY, CA)';
        return null;
      case 'billingZip':
        if (!value.trim()) return 'ZIP code is required';
        if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate current step fields
    if (currentStep === 1) {
      // Step 1: Business info
      ['businessName', 'location', 'vendorType', 'about'].forEach(key => {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          newErrors[key] = error;
        }
      });
    } else {
      // Step 2: Billing address
      const billingFields = ['billingAddressLine1', 'billingCity', 'billingState', 'billingZip'];
      
      // Check if company or individual
      const isCompany = formData.billingIsCompany;
      if (isCompany) {
        billingFields.push('billingCompanyName');
      } else {
        billingFields.push('billingFirstName', 'billingLastName');
      }
      
      billingFields.forEach(key => {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          newErrors[key] = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // If on step 1, go to step 2
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    // Step 2: Submit all data
    setLoading(true);

    try {
      // Prepare data for API - separate business info from billing address
      const onboardingData = {
        businessName: formData.businessName,
        location: formData.location,
        vendorType: formData.vendorType,
        about: formData.about
        // Note: billing address fields are sent separately via updateBillingAddress
      };

      // Update profile with business info and mark onboarding as completed
      await usersAPI.completeOnboarding(onboardingData);
      
      // Update billing address separately
      await usersAPI.updateBillingAddress({
        firstName: formData.billingIsCompany ? '' : formData.billingFirstName,
        lastName: formData.billingIsCompany ? '' : formData.billingLastName,
        companyName: formData.billingIsCompany ? formData.billingCompanyName : '',
        isCompany: formData.billingIsCompany,
        addressLine1: formData.billingAddressLine1,
        addressLine2: formData.billingAddressLine2 || undefined,
        city: formData.billingCity,
        state: formData.billingState.toUpperCase(),
        zip: formData.billingZip
      });

      // Cache onboarding completion immediately to prevent re-showing form
      localStorage.setItem('onboardingCompleted', 'true');

      setSuccess(true);

      // Redirect to marketplace after short delay
      setTimeout(() => {
        navigate('/marketplace');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to complete onboarding';
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full transition-colors duration-200">
            <CheckCircle className="w-8 h-8 text-green-600 transition-colors duration-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 transition-colors duration-200">All Set!</h2>
          <p className="text-gray-600 transition-colors duration-200">Redirecting you to the marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50s-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl text-black transition-colors duration-200">
            {currentStep === 1 ? 'Tell Us About Your Business' : 'Billing Address'}
          </h1>
          <p className="text-gray-600 transition-colors duration-200">
            {currentStep === 1 ? 'Just a few more details to get you started' : 'We need your billing address for payment processing'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${currentStep === 1 ? 'bg-black' : 'bg-gray-300'}`}>
              1
            </div>
            <div className={`w-16 h-0.5 transition-colors duration-200 ${currentStep === 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${currentStep === 2 ? 'bg-black' : 'bg-gray-300'}`}>
              2
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Error */}
            {errors.form && (
              <div className="bg-red-50 flex items-start gap-3 transition-colors duration-200">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 transition-colors duration-200" size={20} />
                <p className="text-red-800 text-sm transition-colors duration-200">{errors.form}</p>
              </div>
            )}

            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <>
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.businessName ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="Your Business Name"
                  disabled={loading}
                />
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600 transition-colors duration-200">{errors.businessName}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                Location (City, State) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder={detectingLocation ? "Detecting your location..." : "e.g., Miami, FL"}
                  disabled={loading || detectingLocation}
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600 transition-colors duration-200">{errors.location}</p>
              )}
              {detectingLocation && (
                <p className="mt-1 text-xs text-gray-500 transition-colors duration-200">?? Detecting your location automatically...</p>
              )}
            </div>

            {/* Vendor Type */}
            <div>
              <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                What services do you provide? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400s-none z-10 transition-colors duration-200" size={20} />
                <select
                  id="vendorType"
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.vendorType ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors appearance-none`}
                  disabled={loading}
                >
                  <option value="">Select your service type</option>
                  {vendorTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {errors.vendorType && (
                <p className="mt-1 text-sm text-red-600 transition-colors duration-200">{errors.vendorType}</p>
              )}
            </div>

            {/* About */}
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                About Your Business <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 transition-colors duration-200" size={20} />
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.about ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none`}
                  placeholder="Tell us about your business, your experience, and what makes you unique..."
                  disabled={loading}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.about ? (
                  <p className="text-sm text-red-600 transition-colors duration-200">{errors.about}</p>
                ) : (
                  <p className="text-xs text-gray-500 transition-colors duration-200">Minimum 10 characters</p>
                )}
                <p className="text-xs text-gray-500 transition-colors duration-200">{formData.about.length}/1000</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Completing setup...</span>
                </>
              ) : (
                <span>{currentStep === 1 ? 'Continue to Billing Address' : 'Complete Setup & Get Started'}</span>
              )}
            </button>
              </>
            )}

            {/* Step 2: Billing Address */}
            {currentStep === 2 && (
              <>
                {/* Company/Individual Toggle */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="billingIsCompany"
                      checked={formData.billingIsCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingIsCompany: e.target.checked }))}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-900">This is a company</span>
                  </label>
                </div>

                {/* Company Name (if company) */}
                {formData.billingIsCompany ? (
                  <div>
                    <label htmlFor="billingCompanyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="billingCompanyName"
                      name="billingCompanyName"
                      type="text"
                      value={formData.billingCompanyName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.billingCompanyName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                      placeholder="Acme Inc."
                      disabled={loading}
                    />
                    {errors.billingCompanyName && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingCompanyName}</p>
                    )}
                  </div>
                ) : (
                  /* Name Fields (if individual) */
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billingFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="billingFirstName"
                        name="billingFirstName"
                        type="text"
                        value={formData.billingFirstName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.billingFirstName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                        placeholder="John"
                        disabled={loading}
                      />
                      {errors.billingFirstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.billingFirstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="billingLastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="billingLastName"
                        name="billingLastName"
                        type="text"
                        value={formData.billingLastName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${errors.billingLastName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                        placeholder="Doe"
                        disabled={loading}
                      />
                      {errors.billingLastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.billingLastName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Line 1 */}
                <div>
                  <label htmlFor="billingAddressLine1" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="billingAddressLine1"
                    name="billingAddressLine1"
                    type="text"
                    value={formData.billingAddressLine1}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.billingAddressLine1 ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                    placeholder="123 Main St"
                    disabled={loading}
                  />
                  {errors.billingAddressLine1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.billingAddressLine1}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label htmlFor="billingAddressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    id="billingAddressLine2"
                    name="billingAddressLine2"
                    type="text"
                    value={formData.billingAddressLine2}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Apt, suite, unit, etc."
                    disabled={loading}
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="billingCity"
                      name="billingCity"
                      type="text"
                      value={formData.billingCity}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.billingCity ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                      placeholder="New York"
                      disabled={loading}
                    />
                    {errors.billingCity && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="billingState"
                      name="billingState"
                      type="text"
                      value={formData.billingState}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingState: e.target.value.toUpperCase() }))}
                      className={`w-full px-4 py-3 border ${errors.billingState ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                      placeholder="NY"
                      maxLength={2}
                      disabled={loading}
                    />
                    {errors.billingState && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingState}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="billingZip" className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="billingZip"
                      name="billingZip"
                      type="text"
                      value={formData.billingZip}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.billingZip ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                      placeholder="12345"
                      disabled={loading}
                    />
                    {errors.billingZip && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingZip}</p>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Completing setup...</span>
                      </>
                    ) : (
                      <span>Complete Setup & Get Started</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 transition-colors duration-200">
          This information helps us match you with the right leads for your business.
        </p>
      </div>
    </div>
  );
};
