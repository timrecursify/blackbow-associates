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
    about: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

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
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await usersAPI.completeOnboarding(formData);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Set!</h2>
          <p className="text-gray-600">Redirecting you to the marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl text-black mb-2">
            Tell Us About Your Business
          </h1>
          <p className="text-gray-600">Just a few more details to get you started</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Error */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 text-sm">{errors.form}</p>
              </div>
            )}

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.businessName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="Your Business Name"
                  disabled={loading}
                />
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location (City, State) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                    placeholder={detectingLocation ? "Detecting..." : "e.g., Miami, FL"}
                    disabled={loading || detectingLocation}
                  />
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={loading || detectingLocation}
                  className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  title="Auto-detect my location"
                >
                  {detectingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      <span className="text-sm hidden sm:inline">Detect</span>
                    </>
                  )}
                </button>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
              {detectingLocation && (
                <p className="mt-1 text-xs text-gray-500">📍 Detecting your location automatically...</p>
              )}
            </div>

            {/* Vendor Type */}
            <div>
              <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 mb-2">
                What services do you provide? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
                <select
                  id="vendorType"
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.vendorType ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors appearance-none bg-white`}
                  disabled={loading}
                >
                  <option value="">Select your service type</option>
                  {vendorTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {errors.vendorType && (
                <p className="mt-1 text-sm text-red-600">{errors.vendorType}</p>
              )}
            </div>

            {/* About */}
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                About Your Business <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.about ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none`}
                  placeholder="Tell us about your business, your experience, and what makes you unique..."
                  disabled={loading}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.about ? (
                  <p className="text-sm text-red-600">{errors.about}</p>
                ) : (
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                )}
                <p className="text-xs text-gray-500">{formData.about.length}/1000</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
          </form>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          This information helps us match you with the right leads for your business.
        </p>
      </div>
    </div>
  );
};
