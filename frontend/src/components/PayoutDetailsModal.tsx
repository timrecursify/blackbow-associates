import React, { useState, useEffect } from 'react';
import { X, CreditCard, Mail, Building2, AlertCircle, Check } from 'lucide-react';

interface PayoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingDetails?: {
    method: string | null;
    email: string | null;
    bankName: string | null;
    routingNumber: string | null;
    accountNumber: string | null;
    isSet: boolean;
  } | null;
}

export const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingDetails
}) => {
  const [method, setMethod] = useState<'ZELLE' | 'ACH'>('ZELLE');
  const [formData, setFormData] = useState({
    email: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && existingDetails?.isSet) {
      setMethod(existingDetails.method as 'ZELLE' | 'ACH' || 'ZELLE');
      if (existingDetails.method === 'ZELLE' && existingDetails.email) {
        setFormData(prev => ({ ...prev, email: existingDetails.email || '' }));
      }
      if (existingDetails.method === 'ACH' && existingDetails.bankName) {
        setFormData(prev => ({ ...prev, bankName: existingDetails.bankName || '' }));
      }
    }
  }, [isOpen, existingDetails]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (method === 'ZELLE') {
      if (!formData.email) {
        newErrors.email = 'Email is required for Zelle';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.routingNumber) {
        newErrors.routingNumber = 'Routing number is required';
      } else if (!/^\d{9}$/.test(formData.routingNumber)) {
        newErrors.routingNumber = 'Routing number must be 9 digits';
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^\d{4,17}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number must be 4-17 digits';
      }
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        newErrors.confirmAccountNumber = 'Account numbers do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = method === 'ZELLE'
        ? { method: 'ZELLE', email: formData.email }
        : {
            method: 'ACH',
            bankName: formData.bankName,
            routingNumber: formData.routingNumber,
            accountNumber: formData.accountNumber
          };

      const response = await fetch('/api/referrals/payout-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save payout details');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payout Details</h2>
            <p className="text-sm text-gray-500 mt-1">Set up how you want to receive payouts</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payout Details Saved!</h3>
            <p className="text-gray-600">You can now request payouts.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Payout Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('ZELLE')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    method === 'ZELLE'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail size={24} className={method === 'ZELLE' ? 'text-black' : 'text-gray-400'} />
                  <span className={`font-medium ${method === 'ZELLE' ? 'text-black' : 'text-gray-600'}`}>Zelle</span>
                  <span className="text-xs text-gray-500">Instant transfers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('ACH')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    method === 'ACH'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 size={24} className={method === 'ACH' ? 'text-black' : 'text-gray-400'} />
                  <span className={`font-medium ${method === 'ACH' ? 'text-black' : 'text-gray-600'}`}>Bank (ACH)</span>
                  <span className="text-xs text-gray-500">1-3 business days</span>
                </button>
              </div>
            </div>

            {/* Zelle Fields */}
            {method === 'ZELLE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zelle Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your-zelle-email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.email}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Make sure this email is registered with Zelle for instant transfers.
                  </p>
                </div>
              </div>
            )}

            {/* ACH Fields */}
            {method === 'ACH' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all ${
                      errors.bankName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Chase, Bank of America"
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.bankName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                  <input
                    type="text"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all ${
                      errors.routingNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="9-digit routing number"
                    maxLength={9}
                  />
                  {errors.routingNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.routingNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all ${
                      errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Account number"
                    maxLength={17}
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.accountNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number</label>
                  <input
                    type="text"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all ${
                      errors.confirmAccountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Re-enter account number"
                    maxLength={17}
                  />
                  {errors.confirmAccountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.confirmAccountNumber}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ACH transfers typically take 1-3 business days to process.
                  </p>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} /> {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 px-4 rounded-xl font-semibold text-white transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              {loading ? 'Saving...' : 'Save Payout Details'}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">
              Your banking information is encrypted and secure.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PayoutDetailsModal;
