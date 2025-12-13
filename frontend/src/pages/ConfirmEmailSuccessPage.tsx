import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { authAPI } from '../services/api';
import { setTokens } from '../services/authAPI';


export const ConfirmEmailSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        const response = await authAPI.confirmEmail(token);

        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email confirmed successfully!');

          // Store tokens if returned (auto-login)
          if (response.data.accessToken && response.data.refreshToken) {
            setTokens(response.data.accessToken, response.data.refreshToken);
          }

          // Determine redirect destination based on onboarding status
          const destination = response.data.user?.onboardingCompleted
            ? '/marketplace'
            : '/onboarding';

          // Start countdown
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                navigate(destination);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (error: any) {
        const errorData = error.response?.data;
        
        if (errorData?.expired) {
          setStatus('expired');
          setMessage(errorData.message || 'Confirmation link has expired');
        } else {
          setStatus('error');
          setMessage(errorData?.message || 'Failed to confirm email');
        }
      }
    };

    confirmEmail();
  }, [token, navigate]);

  const handleGoToMarketplace = () => {
    // Use same logic - check if we have user info from confirmation
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl text-black mb-2">Black Bow Associates</h1>
          <p className="text-gray-600">Professional Wedding Vendor Association</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Loader className="w-16 h-16 text-black animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Confirming Your Email...
              </h2>
              <p className="text-gray-600">Please wait a moment</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Email Confirmed!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Redirecting to your dashboard in <span className="font-bold text-black">{countdown}</span> seconds...
                </p>
              </div>

              <button
                onClick={handleGoToMarketplace}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Go to Onboarding
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Confirmation Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <button
                onClick={() => navigate('/sign-in')}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Link Expired
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <button
                onClick={() => navigate('/email-confirmation')}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Request New Confirmation Email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="mailto:ceo@blackbowassociates.com" className="text-black underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};
