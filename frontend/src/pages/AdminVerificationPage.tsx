import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Shield, Lock } from 'lucide-react';
import { authAPI } from '../services/api';

export const AdminVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authAPI.verifyAdmin(code);
      alert('Admin access granted!');
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-colors duration-200">
      <Navbar />

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200sition-colors duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-black text-white hover:bg-gray-800 transition-colors duration-200">
              <Shield size={32} />
            </div>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 transition-colors duration-200">
            Admin Verification
          </h1>
          <p className="text-gray-700 transition-colors duration-200">
            Enter your verification code to access admin features
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-900 transition-colors duration-200">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-600 transition-colors duration-200" />
                </div>
                <input
                  type="password"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors duration-200"
                  placeholder="Enter verification code"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 transition-colors duration-200">
                <p className="text-sm text-red-800 transition-colors duration-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-black text-white disabled:bg-gray-400sabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <p className="text-xs text-gray-600 transition-colors duration-200">
            Contact support if you don't have a verification code
          </p>
        </div>
      </div>
    </div>
  );
};
