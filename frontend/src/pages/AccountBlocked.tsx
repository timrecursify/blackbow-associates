import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldOff, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountBlockedProps {
  reason?: string;
}

export const AccountBlocked: React.FC<AccountBlockedProps> = ({ reason }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 rounded-full">
              <ShieldOff className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-handwritten text-4xl text-black mb-4">
            Account Restricted
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-700 mb-2">
            Your account has been temporarily restricted.
          </p>

          {reason && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 font-medium mb-1">Reason:</p>
              <p className="text-gray-800">{reason}</p>
            </div>
          )}

          <p className="text-gray-600 mb-8">
            If you believe this is an error or would like to discuss your account status,
            please contact our support team.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Go to Homepage
            </button>
            <a
              href="mailto:support@blackbowassociates.com"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-black hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Support
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              For immediate assistance, please email{' '}
              <a href="mailto:support@blackbowassociates.com" className="text-blue-600 hover:underline">
                support@blackbowassociates.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBlocked;
