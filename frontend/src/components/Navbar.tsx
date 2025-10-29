import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { DollarSign, ShoppingCart, User, Shield } from 'lucide-react';
import { usersAPI } from '../services/api';

export const Navbar: React.FC = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserProfile();
    }
  }, [isSignedIn]);

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      setBalance(response.data.balance);
      setIsAdmin(response.data.isAdmin && response.data.adminVerifiedAt);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="font-handwritten text-2xl md:text-3xl text-black">
              Black Bow Associates
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* Balance Display */}
                {balance !== null && (
                  <div className="hidden sm:flex items-center bg-gray-100 px-4 py-2 rounded-lg">
                    <DollarSign size={18} className="text-gray-700 mr-1" />
                    <span className="font-bold text-gray-900">
                      ${balance.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Marketplace Link */}
                <Link
                  to="/marketplace"
                  className="flex items-center space-x-1 text-gray-700 hover:text-black font-medium transition-colors"
                >
                  <ShoppingCart size={18} />
                  <span className="hidden sm:inline">Marketplace</span>
                </Link>

                {/* Account Link */}
                <Link
                  to="/account"
                  className="flex items-center space-x-1 text-gray-700 hover:text-black font-medium transition-colors"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Account</span>
                </Link>

                {/* Admin Link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-gray-700 hover:text-black font-medium transition-colors"
                  >
                    <Shield size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* User Button */}
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-gray-700 hover:text-black font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
