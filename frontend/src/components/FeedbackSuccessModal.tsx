import React from 'react';
import { CheckCircle, DollarSign } from 'lucide-react';

interface FeedbackSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackSuccessModal: React.FC<FeedbackSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Thank You for Your Feedback!</h2>
        <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
          Your insights help us improve our lead quality for all vendors.
        </p>

        {/* Reward */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <span className="text-2xl sm:text-3xl font-bold text-green-900">$2.00</span>
          </div>
          <p className="text-xs sm:text-sm text-green-800 font-medium">Added to Your Account Balance</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
