import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full relative transition-colors duration-200 max-h-[90vh] overflow-y-auto my-6">
        {/* Close Button - Mobile Optimized */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Header - Mobile Optimized */}
        <div className="flex items-start gap-3 mb-4 pr-10">
          <AlertTriangle className="w-6 h-6 text-yellow-600 transition-colors duration-200 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 transition-colors duration-200">{title}</h2>
            {/* Message */}
            <p className="text-sm text-gray-600 transition-colors duration-200 mt-2">{message}</p>
          </div>
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
