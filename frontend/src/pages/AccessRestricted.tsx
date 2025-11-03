import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessRestricted: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 rounded-full">
              <ShieldAlert className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-handwritten text-4xl text-black mb-4">
            Access Restricted
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-700 mb-2">
            This area is restricted to authorized administrators only.
          </p>
          <p className="text-gray-600 mb-8">
            If you believe you should have access, please contact support.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go to Homepage
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-black hover:bg-gray-800 transition-colors"
            >
              Browse Leads
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Administrator access is granted by the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessRestricted;
