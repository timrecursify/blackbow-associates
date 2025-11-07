import React, { useState } from 'react';
import { X, Building2, User, MapPin, AlertCircle } from 'lucide-react';
import { usersAPI } from '../services/api';

interface BillingAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadInfo?: { id: string; price: number };
}

export const BillingAddressModal: React.FC<BillingAddressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadInfo
}) => {
  const [formData, setFormData] = useState({
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

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

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

      // Call success callback to continue with purchase
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save billing address';
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Your Billing Address</h2>
            <p className="text-sm text-gray-600 mt-1">
              Quick step before your first purchase
            </p>
            {leadInfo && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                💳 Lead price: <span className="font-semibold">${leadInfo.price.toFixed(2)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={loading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Mobile Optimized */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Form Error */}
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{errors.form}</p>
            </div>
          )}

          {/* Company/Individual Toggle - Mobile Optimized */}
          <div className="flex items-center gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                name="billingIsCompany"
                checked={formData.billingIsCompany}
                onChange={handleChange}
                className="w-5 h-5 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Building2 size={18} className="hidden sm:inline" />
                This is a company
              </span>
            </label>
          </div>

          {/* Company Name (if company) - Mobile Optimized */}
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
                className={`w-full px-4 py-3 border ${errors.billingCompanyName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
                placeholder="Acme Inc."
                disabled={loading}
              />
              {errors.billingCompanyName && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCompanyName}</p>
              )}
            </div>
          ) : (
            /* Name Fields (if individual) - Mobile Optimized */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`w-full px-4 py-3 border ${errors.billingFirstName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
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
                  className={`w-full px-4 py-3 border ${errors.billingLastName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
                  placeholder="Doe"
                  disabled={loading}
                />
                {errors.billingLastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingLastName}</p>
                )}
              </div>
            </div>
          )}

          {/* Address Line 1 - Mobile Optimized */}
          <div>
            <label htmlFor="billingAddressLine1" className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hidden sm:block" size={18} />
              <input
                id="billingAddressLine1"
                name="billingAddressLine1"
                type="text"
                value={formData.billingAddressLine1}
                onChange={handleChange}
                className={`w-full px-4 sm:pl-10 py-3 border ${errors.billingAddressLine1 ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
                placeholder="123 Main St"
                disabled={loading}
              />
            </div>
            {errors.billingAddressLine1 && (
              <p className="mt-1 text-sm text-red-600">{errors.billingAddressLine1}</p>
            )}
          </div>

          {/* Address Line 2 - Mobile Optimized */}
          <div>
            <label htmlFor="billingAddressLine2" className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 2 <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="billingAddressLine2"
              name="billingAddressLine2"
              type="text"
              value={formData.billingAddressLine2}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]"
              placeholder="Apt, suite, unit, etc."
              disabled={loading}
            />
          </div>

          {/* City, State, ZIP - Mobile Optimized */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            <div className="col-span-12 sm:col-span-6">
              <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="billingCity"
                name="billingCity"
                type="text"
                value={formData.billingCity}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.billingCity ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
                placeholder="New York"
                disabled={loading}
              />
              {errors.billingCity && (
                <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>
              )}
            </div>
            <div className="col-span-5 sm:col-span-2">
              <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="billingState"
                name="billingState"
                type="text"
                value={formData.billingState}
                onChange={(e) => setFormData(prev => ({ ...prev, billingState: e.target.value.toUpperCase() }))}
                className={`w-full px-4 py-3 border ${errors.billingState ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base text-center min-h-[48px]`}
                placeholder="NY"
                maxLength={2}
                disabled={loading}
              />
              {errors.billingState && (
                <p className="mt-1 text-sm text-red-600">{errors.billingState}</p>
              )}
            </div>
            <div className="col-span-7 sm:col-span-4">
              <label htmlFor="billingZip" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP <span className="text-red-500">*</span>
              </label>
              <input
                id="billingZip"
                name="billingZip"
                type="text"
                value={formData.billingZip}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.billingZip ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-base min-h-[48px]`}
                placeholder="12345"
                disabled={loading}
              />
              {errors.billingZip && (
                <p className="mt-1 text-sm text-red-600">{errors.billingZip}</p>
              )}
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save & Continue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
