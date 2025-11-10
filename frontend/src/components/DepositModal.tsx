import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';
import { X, DollarSign, CheckCircle, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, usersAPI } from '../services/api';

// Lazy load Stripe only when needed - prevents loading on pages that don't use the modal
let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (!stripePromise) {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (stripeKey) {
      stripePromise = loadStripe(stripeKey);
    } else {
      // Return a rejected promise if no key is configured
      stripePromise = Promise.reject(new Error('Stripe publishable key not configured'));
    }
  }
  return stripePromise;
};

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  redirectUrl?: string; // Optional redirect after successful deposit (deprecated, kept for compatibility)
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
}

const DepositForm: React.FC<{ onClose: () => void; onSuccess: () => void; redirectUrl?: string; isOpen: boolean }> = ({
  onClose,
  onSuccess,
  redirectUrl,
  isOpen,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState<string>('20');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Track if we've loaded profile for this modal session
  const profileLoadedRef = React.useRef(false);

  // Load user profile and check for existing billing address
  // Only run when modal opens (when isOpen becomes true)
  useEffect(() => {
    // Reset form state when modal closes
    if (!isOpen) {
      setAmount('20');
      setSuccess(false);
      setError(null);
      setLoadingProfile(true);
      profileLoadedRef.current = false;
      return;
    }

    // Only load profile once when modal opens
    if (profileLoadedRef.current) {
      return;
    }

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        profileLoadedRef.current = true;
        const response = await usersAPI.getProfile();
        const userData = response.data.user || response.data;
        const billing = userData.billing;
        // Billing address validation is now handled in AccountPage
        // Billing address validation is now handled in AccountPage
        // Proceed to payment
        setLoadingProfile(false);
        setLoadingProfile(false);
        
        // Billing address validation is now handled in AccountPage
        // Proceed to payment
        // Billing address validation is now handled in AccountPage

