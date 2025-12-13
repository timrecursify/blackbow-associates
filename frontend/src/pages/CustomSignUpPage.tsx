import React, { useState } from 'react';
import { logger } from '../utils/logger';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/authAPI';
import { getReferralCode, clearReferralCode } from '../utils/referral';

export const CustomSignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // Get referral code from URL query parameter or stored referral code
      const referralCode = searchParams.get('ref') || getReferralCode();

      // Register using custom JWT authentication
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        referralCode: referralCode || undefined,
      });

      if (response.user) {
        // Clear referral code after successful registration
        clearReferralCode();
        // Redirect to email confirmation page
        navigate('/email-confirmation', {
          state: { email: formData.email }
        });
      }
    } catch (err: any) {
      // Improved error handling
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create account. Please try again.';
      setError(errorMessage);
      logger.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'At least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'At least 2 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'At least 8 characters required';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/3' };
    if (score <= 4) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/3' };
    return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleOAuthSignUp = async (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      // Get referral code to pass along
      const referralCode = searchParams.get('ref');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.blackbowassociates.com';
      const googleAuthUrl = referralCode
        ? `${apiBaseUrl}/api/auth/google/login?ref=${referralCode}`
        : `${apiBaseUrl}/api/auth/google/login`;
      window.location.href = googleAuthUrl;
      return;
    }
    setError('Facebook sign-up is coming soon. Please use email/password or Google for now.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="font-handwritten text-4xl text-black transition-colors duration-200">
              Black Bow Associates
            </h1>
          </Link>
          <p className="text-gray-600 transition-colors duration-200">Create your account</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 sm:p-8 transition-colors duration-200">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3 transition-colors duration-200 mb-6">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 transition-colors duration-200" size={18} />
              <p className="text-red-800 text-sm transition-colors duration-200">{error}</p>
            </div>
          )}

          {/* OAuth Buttons - MOVED TO TOP - COMING SOON */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignUp('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700 transition-colors duration-200">Continue with Google</span>
            </button>

            <button
              onClick={() => handleOAuthSignUp('facebook')}
              disabled={true}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed text-sm sm:text-base relative"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-medium text-gray-700 transition-colors duration-200">Continue with Facebook</span>
              <span className="absolute top-1 right-2 text-[10px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Coming Soon</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 transition-colors duration-200"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full pl-11 pr-4 py-3 border ${touched.firstName && fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              {touched.firstName && fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full pl-11 pr-4 py-3 border ${touched.lastName && fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
              {touched.lastName && fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full pl-11 pr-4 py-3 border ${touched.email && fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 transition-colors duration-200">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  minLength={8}
                  className={`w-full pl-11 pr-4 py-3 border ${touched.password && fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              {passwordStrength ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`} />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
              )}
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200 transition-colors duration-200">
            <p className="text-center text-sm text-gray-600 transition-colors duration-200">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-black transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 transition-colors duration-200">
          <p>© 2025 Black Bow Associates. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
