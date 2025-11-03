import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import AccessRestricted from '../pages/AccessRestricted';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard Component
 *
 * Protects admin routes by checking if the current user has admin privileges.
 *
 * Security:
 * - Fetches current user from backend API (/api/auth/me)
 * - Backend verifies JWT token and returns user.isAdmin flag
 * - Shows AccessRestricted page if user is not admin
 * - Shows loading state while checking authentication
 * - Redirects to sign-in if not authenticated
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Fetch current user from backend (requires authentication)
      const response = await authAPI.getCurrentUser();
      console.log('AdminGuard - API Response:', response.data);
      const user = response.data.user;
      console.log('AdminGuard - User data:', user);
      console.log('AdminGuard - isAdmin value:', user?.isAdmin);
      console.log('AdminGuard - isAdmin type:', typeof user?.isAdmin);

      // Check if user has admin privileges
      // Check if user is blocked first
      if (user && user.isBlocked) {
        console.log('AdminGuard - User is BLOCKED');
        navigate('/account-blocked', { replace: true });
        return;
      }

      if (user && user.isAdmin === true) {
        console.log('AdminGuard - Access GRANTED');
        setIsAdmin(true);
      } else {
        console.log('AdminGuard - Access DENIED');
        setIsAdmin(false);
      }
    } catch (error: any) {
      console.error('AdminGuard - Error:', error);
      console.error('AdminGuard - Error response:', error.response);
      // If authentication fails (401), redirect to sign-in
      if (error.response?.status === 401) {
        navigate('/signin', { state: { from: '/admin' } });
      } else {
        // For any other error, assume not admin
        setIsAdmin(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Access restricted for non-admins
  if (!isAdmin) {
    return <AccessRestricted />;
  }

  // Authorized admin - render children
  return <>{children}</>;
};

export default AdminGuard;
