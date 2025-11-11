import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface BetaSignupFormProps {
  onSuccess: (data: any) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  vendorType: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

const BetaSignupForm: React.FC<BetaSignupFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyWebsite: '',
    vendorType: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const vendorTypes = [
    'Photographer',
    'Videographer',
    'Florist',
    'Wedding Planner',
    'Venue',
    'Caterer',
    'DJ / Band',
    'Hair & Makeup',
    'Other'
  ];

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return '';

      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return 'Invalid phone number format';
        if (value.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
        return '';

      case 'companyName':
        if (!value.trim()) return 'Company name is required';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters';
        return '';

      case 'companyWebsite':
        if (value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) {
          return 'Invalid website URL';
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // Clear API error
    if (apiError) {
      setApiError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      if (key !== 'vendorType' && key !== 'message' && key !== 'companyWebsite') {
        const error = validateField(key, formData[key as keyof FormData]);
        if (error) newErrors[key] = error;
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

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('https://api.blackbowassociates.com/api/crm-beta/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess(data.signup);
      } else {
        setApiError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('Unable to submit your application. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 max-w-3xl mx-auto">
      <div className="space-y-6">

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
            placeholder="John Smith"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
            placeholder="john@yourweddingbusiness.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
            placeholder="(555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border ${errors.companyName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
            placeholder="Your Wedding Business"
            disabled={isSubmitting}
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        {/* Company Website */}
        <div>
          <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-2">
            Company Website
          </label>
          <input
            type="url"
            id="companyWebsite"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 border ${errors.companyWebsite ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
            placeholder="https://yourweddingbusiness.com"
            disabled={isSubmitting}
          />
          {errors.companyWebsite && (
            <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>
          )}
        </div>

        {/* Vendor Type */}
        <div>
          <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 mb-2">
            Vendor Type
          </label>
          <select
            id="vendorType"
            name="vendorType"
            value={formData.vendorType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            disabled={isSubmitting}
          >
            <option value="">Select your type...</option>
            {vendorTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Why are you interested in the CRM beta?
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
            placeholder="Tell us a bit about your business and what you're looking for in a CRM..."
            disabled={isSubmitting}
          />
        </div>

        {/* API Error */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting Application...
            </>
          ) : (
            'Join Private Beta'
          )}
        </button>

        <p className="text-sm text-gray-600 text-center">
          By submitting, you agree to receive updates about the Black Bow CRM beta program.
        </p>
      </div>
    </form>
  );
};

export default BetaSignupForm;
