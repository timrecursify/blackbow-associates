import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3450';

export const EmailConfirmationPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/resend-confirmation`, {
        email
      });

      setMessage(response.data.message || 'Confirmation email sent!');
      setMessageType('success');
      
      // Start 60 second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to resend confirmation email';
      setMessage(errorMsg);
      setMessageType('error');
      
      // If rate limited, set cooldown from server response
      if (error.response?.data?.waitSeconds) {
        setResendCooldown(error.response.data.waitSeconds);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setIsResending(false);
    }
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
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Check Your Email
          </h2>

          <p className="text-center text-gray-600 mb-6">
            We've sent a confirmation email to:
          </p>

          <p className="text-center text-lg font-semibold text-black mb-6 break-all">
            {email}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <CheckCircle className="inline w-4 h-4 mr-1 text-green-600" />
              Click the confirmation link in the email to activate your account
            </p>
            <p className="text-sm text-gray-700">
              <CheckCircle className="inline w-4 h-4 mr-1 text-green-600" />
              The link expires in 24 hours
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-3 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm text-center">{message}</p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isResending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 
              ? `Resend in ${resendCooldown}s` 
              : isResending 
                ? 'Sending...' 
                : 'Resend Email'}
          </button>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button onClick={handleResend} className="text-black underline hover:no-underline">
              resend
            </button>
          </p>

          {/* Sign Out Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <Link to="/sign-in" className="text-sm text-gray-600 hover:text-black">
              Sign in with a different account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:ceo@blackbowassociates.com" className="text-black underline">
            ceo@blackbowassociates.com
          </a>
        </p>
      </div>
    </div>
  );
};
