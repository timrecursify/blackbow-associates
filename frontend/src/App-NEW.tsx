import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { setAuthToken } from './services/api';

/*
 * BlackBow Associates - Wedding Lead Marketplace
 *
 * FRONTEND STRUCTURE (Ready for implementation):
 *
 * Pages to create:
 * - LoginPage: <SignIn /> from Clerk
 * - RegisterPage: <SignUp /> from Clerk with custom fields
 * - MarketplacePage: Browse and purchase leads
 * - AccountPage: User profile, balance, transactions, purchased leads
 * - LeadDetailsPage: Full lead info after purchase
 * - AdminVerificationPage: Admin code entry
 * - AdminDashboardPage: Admin panel
 *
 * Components to create:
 * - Navbar: Navigation with auth state + balance display
 * - LeadCard: Lead preview card (masked data)
 * - DepositModal: Stripe deposit flow
 * - BalanceDisplay: Account balance widget
 *
 * All API calls are ready in src/services/api.ts
 */

// Placeholder components (replace with actual implementations)
const Marketplace = () => <div className="p-8 text-black"><h1 className="text-2xl font-bold">Marketplace</h1><p>Browse and purchase wedding leads here. API integration ready.</p></div>;
const Account = () => <div className="p-8 text-black"><h1 className="text-2xl font-bold">Account</h1><p>View your balance, transactions, and purchased leads.</p></div>;
const Home = () => <div className="p-8 text-black"><h1 className="text-2xl font-bold">BlackBow Associates</h1><p>Welcome to the wedding lead marketplace.</p></div>;

function App() {
  const { getToken, isSignedIn } = useAuth();

  // Set up auth token getter for API calls
  useEffect(() => {
    if (isSignedIn) {
      setAuthToken(getToken);
    }
  }, [isSignedIn, getToken]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        <Route path="/marketplace" element={isSignedIn ? <Marketplace /> : <Navigate to="/sign-in" />} />
        <Route path="/account" element={isSignedIn ? <Account /> : <Navigate to="/sign-in" />} />
      </Routes>
    </Router>
  );
}

export default App;
