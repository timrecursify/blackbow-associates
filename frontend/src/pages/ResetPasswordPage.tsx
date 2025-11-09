import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3450';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);

  useEffect(() => {
    // Verify reset token is valid
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided. Please request a new password reset link.');
        setValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Invalid or expired reset token. Please request a new one.');
        }

        setValidatingToken(false);
      } catch (err) {
        setError('Failed to validate reset link. Please try again.');
        setValidatingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password. Please try again.');
      }

      setSuccess(true);

      // Redirect to sign-in page after 3 seconds
      setTimeout(() => {
        navigate('/sign-in');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 transition-colors duration-200 text-sm mt-2">Create a new password</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 lg:p-8 transition-colors duration-200">
          {!success ? (
            <>
              {/* Instructions */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4">
                  <KeyRound className="text-gray-700" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Reset your password</h2>
                <p className="text-sm text-gray-600 text-center">
                  Choose a strong password to secure your account.
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
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 transition-colors duration-200 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 transition-colors duration-200 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
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
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={20} />
                      <span>Reset Password</span>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password reset successful!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Redirecting you to sign in in a few seconds...
              </p>
              <Link
                to="/sign-in"
                className="inline-block w-full bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Go to Sign In
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
