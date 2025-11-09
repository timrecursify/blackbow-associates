import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-6 lg:py-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Back to Sign In Button */}
        <div className="mb-4">
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="font-handwritten text-3xl lg:text-4xl text-black transition-colors duration-200">
              Black Bow Associates
            </h1>
          </Link>
          <p className="text-gray-600 transition-colors duration-200 text-sm mt-2">Reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 lg:p-8 transition-colors duration-200">
          {!success ? (
            <>
              {/* Instructions */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4">
                  <KeyRound className="text-gray-700" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Forgot your password?</h2>
                <p className="text-sm text-gray-600 text-center">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 transition-colors duration-200 mb-4">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 transition-colors duration-200" size={18} />
                  <p className="text-red-800 text-sm transition-colors duration-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 transition-colors duration-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and click the link to reset your password.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="text-black font-medium hover:underline"
                >
                  try again
                </button>
              </p>
              <Link
                to="/sign-in"
                className="inline-block w-full bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 transition-colors duration-200">
          <p>© 2025 Black Bow Associates. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
