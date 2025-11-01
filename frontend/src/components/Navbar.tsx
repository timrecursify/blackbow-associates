import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, ShoppingCart, User, Shield, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usersAPI } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isMarketplacePage = location.pathname === '/marketplace';

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsSignedIn(!!session);
      setUserEmail(session?.user?.email || null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserProfile();
    }
  }, [isSignedIn, location.pathname]); // Refresh when location changes

  // Listen for balance update events
  useEffect(() => {
    const handleBalanceUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      const userData = response.data.user || response.data;
      setBalance(userData.balance !== undefined && userData.balance !== null ? userData.balance : 0);
      setIsAdmin(userData.isAdmin && userData.adminVerifiedAt);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center min-w-0 flex-1">
            <h1 className="font-handwritten text-xl sm:text-2xl md:text-3xl text-black truncate">
              Black Bow Associates
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

            {isSignedIn ? (
              <>
                {/* Balance Display - Show on mobile in compact form */}
                {balance !== null && balance !== undefined && (
                  <Link
                    to="/account"
                    className="flex items-center bg-gray-100 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer min-w-0"
                  >
                    <DollarSign size={14} className="sm:w-[18px] sm:h-[18px] text-gray-700 mr-1 flex-shrink-0" />
                    <span className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                      ${(balance || 0).toFixed(2)}
                    </span>
                  </Link>
                )}

                {/* Marketplace Link - Icon only on mobile */}
                {!isMarketplacePage && (
                  <Link
                    to="/marketplace"
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:space-x-1 text-gray-700 hover:text-black font-medium transition-colors rounded-lg hover:bg-gray-100 sm:hover:bg-transparent"
                    title="Marketplace"
                  >
                    <ShoppingCart size={18} />
                    <span className="hidden sm:inline ml-1">Marketplace</span>
                  </Link>
                )}

                {/* Account Link - Hidden on mobile (balance + user menu provide access) */}
                <Link
                  to="/account"
                  className={`hidden sm:flex items-center space-x-1 font-medium transition-colors rounded-lg hover:bg-transparent ${
                    location.pathname === '/account'
                      ? 'text-black'
                      : 'text-gray-700'
                  }`}
                  title="Account"
                >
                  <User size={18} />
                  <span className="ml-1">Account</span>
                </Link>

                {/* Admin Link - Icon only on mobile */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:space-x-1 font-medium transition-colors rounded-lg sm:hover:bg-transparent ${
                      location.pathname === '/admin' 
                        ? 'text-black' 
                        : 'text-gray-700 hover:text-black sm:hover:bg-transparent'
                    }`}
                    title="Admin"
                  >
                    <Shield size={18} />
                    <span className="hidden sm:inline ml-1">Admin</span>
                  </Link>
                )}

                {/* User Menu Dropdown - Mobile optimized */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
                    </div>
                    <ChevronDown size={14} className="sm:w-4 sm:h-4 text-gray-600 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 transition-colors duration-200">
                      {userEmail && (
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-xs text-gray-500">Signed in as</p>
                          <p className="text-sm text-black font-medium break-words">{userEmail}</p>
                          {balance !== null && balance !== undefined && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                              <DollarSign size={14} className="text-gray-600" />
                              <span className="text-sm font-semibold text-black">${(balance || 0).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User size={16} />
                          <span>My Account</span>
                        </Link>
                        {!isMarketplacePage && (
                          <Link
                            to="/marketplace"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <ShoppingCart size={16} />
                            <span>Marketplace</span>
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Shield size={16} />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-gray-700 hover:text-black font-medium transition-colors text-sm sm:text-base px-2 sm:px-0"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
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
