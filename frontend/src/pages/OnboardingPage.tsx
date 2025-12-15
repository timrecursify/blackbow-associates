import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { usersAPI } from '../services/api';
import { authAPI } from '../services/authAPI';
import { searchCities } from '../data/us-cities';

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

  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-fill business name from current user profile
    authAPI.getCurrentUser().then(({ user }) => {
      if (user?.businessName) {
        // Only set if not already filled (e.g., OAuth users may already have it from Google profile)
        setFormData(prev => {
          if (!prev.businessName || prev.businessName.trim() === '' || prev.businessName === 'pending') {
            return { ...prev, businessName: user.businessName };
          }
          return prev;
        });
      }
    }).catch(err => {
      logger.error('Failed to get user profile', err);
    });

    // Auto-detect location on component mount
    detectLocation();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.city && data.region_code) {
        const locationString = `${data.city}, ${data.region_code}`;
        // Only set if user hasn't already typed something
        setFormData(prev => {
          if (!prev.location || prev.location.trim() === '') {
            return { ...prev, location: locationString };
          }
          return prev;
        });
      }
    } catch (error) {
      logger.error('Failed to detect location:', error);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, location: value }));

    // Search cities
    if (value.length >= 2) {
      const results = searchCities(value, 8);
      setCitySuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }

    // Clear error
    if (errors.location) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || citySuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < citySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectCity(citySuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setFormData(prev => ({ ...prev, location: city }));
    setCitySuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    locationInputRef.current?.blur();
  };

  const vendorTypes = [
    'Photographer',
    'Videographer',
    'Photo Booth',
    'DJ / Music',
    'Live Band',
    'Venue',
    'Caterer',
    'Bartending Service',
    'Wedding Planner',
    'Day-of Coordinator',
    'Florist',
    'Baker / Cake Designer',
    'Hair & Makeup',
    'Officiant',
    'Decorator / Stylist',
    'Lighting & AV',
    'Rentals (Tables, Chairs, Linens)',
    'Invitations & Stationery',
    'Transportation / Limo',
    'Photobooth',
    'Jeweler',
    'Bridal Boutique / Attire',
    'Alterations',
    'Travel / Honeymoon',
    'Dance Lessons',
    'Calligrapher',
    'Favors & Gifts',
    'Event Insurance',
    'Security Services',
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

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

    ['businessName', 'location', 'vendorType', 'about'].forEach(key => {
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
      await usersAPI.completeOnboarding({
        businessName: formData.businessName,
        location: formData.location,
        vendorType: formData.vendorType,
        about: formData.about
      });

      localStorage.setItem('onboardingCompleted', 'true');
      setSuccess(true);

      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
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
          <div className="inline-block mb-6">
            <img
              src="/logos/BlackBow_Associates_Logo_Text_Transprent_bg.png"
              alt="BlackBow Associates"
              className="w-48 h-auto md:w-64"
              style={{ animation: 'fadeInBounce 0.8s ease-out' }}
            />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4">Welcome to BlackBow Associates!</h2>
          <p className="text-gray-600 mt-2">Redirecting you to the marketplace...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeInBounce {
            0% { opacity: 0; transform: scale(0.3) translateY(-30px); }
            50% { transform: scale(1.05) translateY(0); }
            70% { transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-black">
            Tell Us About Your Business
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Just a few details to get you started
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 sm:p-8">
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
                  className={`w-full pl-11 pr-4 py-3 border ${errors.businessName ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="Your Business Name"
                  disabled={loading}
                />
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* Location with Autocomplete */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location (City, State) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  ref={locationInputRef}
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleLocationChange}
                  onKeyDown={handleLocationKeyDown}
                  onFocus={() => {
                    if (citySuggestions.length > 0) setShowSuggestions(true);
                  }}
                  className={`w-full pl-11 pr-4 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder={detectingLocation ? "Detecting your location..." : "Start typing a city..."}
                  disabled={loading}
                  autoComplete="off"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && citySuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {citySuggestions.map((city, index) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectCity(city)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                          index === highlightedIndex ? 'bg-gray-100' : ''
                        } ${index !== citySuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                        <span className="text-gray-900">{city}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorType: e.target.value }))}
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
                  className={`w-full pl-11 pr-4 py-3 border ${errors.about ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none`}
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
              className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 font-medium text-base sm:text-lg min-h-[48px]"
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
        <p className="text-center text-sm text-gray-600 mt-6 px-4">
          This information helps us match you with the right leads for your business.
        </p>
      </div>
    </div>
  );
};
