import React, { useState } from 'react';
import { X, DollarSign, CheckCircle } from 'lucide-react';

interface LeadFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  leadId: string;
}

export interface FeedbackData {
  booked: boolean;
  leadResponsive: 'responsive' | 'ghosted' | 'partial';
  timeToBook?: string;
  amountCharged?: number;
}

export const LeadFeedbackModal: React.FC<LeadFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leadId,
}) => {
  const [formData, setFormData] = useState<FeedbackData>({
    booked: false,
    leadResponsive: 'responsive',
    timeToBook: '',
    amountCharged: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.booked && !formData.timeToBook) {
      setError('Please specify how long it took to book');
      return;
    }
    if (formData.booked && !formData.amountCharged) {
      setError('Please specify the amount charged');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        booked: false,
        leadResponsive: 'responsive',
        timeToBook: '',
        amountCharged: undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-black transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-5 pr-6 sm:pr-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Provide Lead Feedback</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">Earn $2.00 for Your Feedback!</p>
                <p className="text-xs text-blue-800">
                  Your insights help us source better quality leads for all vendors. Complete this quick survey to receive $2.00 credit instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Question 1: Did they book? */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
              Did this lead book your services?
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, booked: true })}
                className={`flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg border-2 transition-all ${
                  formData.booked
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                ✓ Yes, They Booked
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, booked: false, timeToBook: '', amountCharged: undefined })}
                className={`flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg border-2 transition-all ${
                  !formData.booked
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                ✗ No, They Didn't Book
              </button>
            </div>
          </div>

          {/* Question 2: Lead responsiveness */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
              How responsive was the lead?
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, leadResponsive: 'responsive' })}
                className={`w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-left rounded-lg border-2 transition-all ${
                  formData.leadResponsive === 'responsive'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <span className="font-semibold">Responsive</span>
                <span className="block text-xs sm:text-sm opacity-75 mt-0.5">Replied promptly and engaged with my inquiry</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, leadResponsive: 'partial' })}
                className={`w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-left rounded-lg border-2 transition-all ${
                  formData.leadResponsive === 'partial'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <span className="font-semibold">Partially Responsive</span>
                <span className="block text-xs sm:text-sm opacity-75 mt-0.5">Slow responses or limited engagement</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, leadResponsive: 'ghosted' })}
                className={`w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-left rounded-lg border-2 transition-all ${
                  formData.leadResponsive === 'ghosted'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <span className="font-semibold">Ghosted</span>
                <span className="block text-xs sm:text-sm opacity-75 mt-0.5">No response or stopped replying</span>
              </button>
            </div>
          </div>

          {/* Conditional: If booked, show additional fields */}
          {formData.booked && (
            <>
              {/* Question 3: Time to book */}
              <div>
                <label htmlFor="timeToBook" className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  How long did it take to book? <span className="text-red-500">*</span>
                </label>
                <select
                  id="timeToBook"
                  value={formData.timeToBook}
                  onChange={(e) => setFormData({ ...formData, timeToBook: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  required={formData.booked}
                >
                  <option value="">Select timeframe...</option>
                  <option value="same_day">Same day (within 24 hours)</option>
                  <option value="2_3_days">2-3 days</option>
                  <option value="4_7_days">4-7 days</option>
                  <option value="1_2_weeks">1-2 weeks</option>
                  <option value="2_4_weeks">2-4 weeks</option>
                  <option value="over_month">Over a month</option>
                </select>
              </div>

              {/* Question 4: Amount charged */}
              <div>
                <label htmlFor="amountCharged" className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  How much did you charge for your services? <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-gray-600" />
                  </div>
                  <input
                    type="number"
                    id="amountCharged"
                    value={formData.amountCharged || ''}
                    onChange={(e) => setFormData({ ...formData, amountCharged: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="0.00"
                    required={formData.booked}
                  />
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">Enter the total package price you charged</p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
              <p className="text-xs sm:text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
