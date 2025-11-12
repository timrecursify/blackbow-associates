import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { X, DollarSign, CheckCircle, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, usersAPI } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

        // Check if billing address exists and has required fields
        if (!billing || !billing.addressLine1 ||
            !billing.city || !billing.state || !billing.zip) {
          // No billing address - show error and close modal
          setError('Billing address is required. Please complete your registration first.');
          setLoadingProfile(false);
          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }

        // Check if company or individual name is provided
        if (!billing.isCompany && (!billing.firstName || !billing.lastName)) {
          setError('Billing address is incomplete. Please update your billing address in Account settings.');
          setLoadingProfile(false);
          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }

        if (billing.isCompany && !billing.companyName) {
          setError('Billing address is incomplete. Please update your billing address in Account settings.');
          setLoadingProfile(false);
          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }

        // Billing address exists - proceed to payment
        setLoadingProfile(false);
      } catch (error) {
        logger.error('Failed to load profile:', error);
        setError('Failed to load profile. Please try again.');
        setLoadingProfile(false);
        profileLoadedRef.current = false; // Allow retry on error
      }
    };

    loadProfile();
  }, [isOpen, onClose]);

  // Auto-redirect after successful deposit - REMOVED
  // We handle redirect in the success callback instead to avoid modal reopening issues

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount < 1) {
        setError('Please enter a valid amount (minimum $1)');
        setIsProcessing(false);
        return;
      }

      // Create payment intent
      const { data: depositData } = await paymentsAPI.createDeposit(depositAmount);
      const paymentIntentId = depositData.paymentIntentId;

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(depositData.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        // Payment succeeded - verify payment immediately as fallback
        try {
          // Try to verify payment immediately (fallback if webhook fails)
          const verifyResponse = await paymentsAPI.verifyPayment(paymentIntentId);

          if (verifyResponse.data.success) {
            // Payment verified and credited
            setDepositAmount(depositAmount);
            setSuccess(true);
            setIsProcessing(false);

            // Trigger balance update event
            window.dispatchEvent(new CustomEvent('balanceUpdated'));

            // Call success callback and close modal immediately
            onSuccess();
            // Close modal after a brief delay to show success message
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            // Payment succeeded but not yet credited - poll for webhook
            setDepositAmount(depositAmount);
            setSuccess(true);
            setIsProcessing(false);

            // Get initial balance before polling
            let initialBalance = 0;
            try {
              const profileResponse = await usersAPI.getProfile();
              const userData = profileResponse.data.user || profileResponse.data;
              initialBalance = userData.balance !== undefined && userData.balance !== null ? userData.balance : 0;
            } catch (error) {
              logger.error('Failed to get initial balance:', error);
            }

            // Poll for balance update (webhook is async)
            pollForBalanceUpdate(initialBalance, depositAmount);

            // Call success callback and close modal immediately
            onSuccess();
            // Close modal after a brief delay to show success message
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        } catch (verifyError) {
          logger.error('Payment verification failed, will rely on webhook:', verifyError);
          // If verification fails, rely on webhook polling
          setDepositAmount(depositAmount);
          setSuccess(true);
          setIsProcessing(false);

          // Get initial balance before polling
          let initialBalance = 0;
          try {
            const profileResponse = await usersAPI.getProfile();
            const userData = profileResponse.data.user || profileResponse.data;
            initialBalance = userData.balance !== undefined && userData.balance !== null ? userData.balance : 0;
          } catch (error) {
            logger.error('Failed to get initial balance:', error);
          }

          // Poll for balance update (webhook is async)
          pollForBalanceUpdate(initialBalance, depositAmount);

          // Close modal FIRST to prevent reopening issues
          onClose();
          // Call success callback AFTER closing modal
          setTimeout(() => {
            onSuccess();
          }, 100);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  const pollForBalanceUpdate = async (initialBalance: number, depositAmount: number) => {
    // Poll every 1 second for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 10;

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await usersAPI.getProfile();
        const userData = response.data.user || response.data;
        const currentBalance = userData.balance !== undefined && userData.balance !== null ? userData.balance : 0;

        // Check if balance increased by the deposit amount (indicating webhook processed)
        const expectedBalance = initialBalance + depositAmount;
        if (Math.abs(currentBalance - expectedBalance) < 0.01) { // Allow small rounding differences
          clearInterval(pollInterval);
          // Trigger window event to refresh Navbar balance
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          // Still trigger update in case webhook is delayed
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
        }
      } catch (error) {
        logger.error('Failed to poll balance:', error);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }
    }, 1000);
  };

  // Show success state
  if (success) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center transition-colors duration-200">
            <CheckCircle className="w-10 h-10 text-green-600 transition-colors duration-200" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-200">Payment Successful!</h3>
          <p className="text-gray-600 transition-colors duration-200">
            Your deposit of <span className="font-bold text-black">${depositAmount.toFixed(2)}</span> has been processed.
          </p>
          <p className="text-sm text-gray-500 transition-colors duration-200">
            Your account balance will be updated shortly...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-gray-400 transition-colors duration-200" />
        </div>
        <button
          onClick={() => {
            setSuccess(false);
            onClose();
          }}
          className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 min-h-[48px]"
        >
          Close
        </button>
      </div>
    );
  }

  // Show loading state while checking profile
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-gray-400 transition-colors duration-200" />
        <span className="ml-3 text-sm text-gray-600 hover:text-black transition-colors duration-200">Loading...</span>
      </div>
    );
  }

  // Show error if billing address is missing
  if (error && error.includes('Billing address is required')) {
    return (
      <div className="space-y-4 py-4">
        <div className="p-4 bg-red-50 transition-colors duration-200">
          <p className="text-sm text-red-800 transition-colors duration-200">{error}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 min-h-[48px]"
        >
          Close
        </button>
      </div>
    );
  }

  // Payment Form
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg transition-colors duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex items-center justify-center w-6 h-6 bg-black text-white font-bold rounded-full transition-colors duration-200">1</span>
          <p className="text-sm font-semibold text-gray-900 transition-colors duration-200">
            Payment Details
          </p>
        </div>
        <p className="text-xs text-gray-600 hover:text-black transition-colors duration-200">
          Enter your payment information
        </p>
      </div>

      {/* Amount Input - Mobile Optimized */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-900 transition-colors duration-200 mb-2">
          Deposit Amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign size={18} className="text-gray-600 hover:text-black transition-colors duration-200" />
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-colors duration-200 min-h-[48px] text-base"
            placeholder="0.00"
            required
          />
        </div>
        <p className="text-xs text-gray-600 hover:text-black transition-colors duration-200 mt-1">Minimum deposit: $1.00</p>
      </div>

      {/* Quick Amount Buttons - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setAmount('20')}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[48px]"
        >
          $20
        </button>
        <button
          type="button"
          onClick={() => setAmount('50')}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[48px]"
        >
          $50
        </button>
        <button
          type="button"
          onClick={() => setAmount('100')}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[48px]"
        >
          $100
        </button>
        <button
          type="button"
          onClick={() => setAmount('200')}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[48px]"
        >
          $200
        </button>
      </div>

      {/* Card Element - Mobile Optimized */}
      <div>
        <label className="block text-sm font-medium text-gray-900 transition-colors duration-200 mb-2">Card Details</label>
        <div className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 min-h-[48px]">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111827',
                  '::placeholder': {
                    color: '#6B7280',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 transition-colors duration-200">
          <p className="text-sm text-red-800 transition-colors duration-200">{error}</p>
        </div>
      )}

      {/* Submit Button - Mobile Optimized */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-5 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-5 py-3 bg-black text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md min-h-[48px]"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            `Deposit $${parseFloat(amount || '0').toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
};

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess, redirectUrl }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSuccess = () => {
    // Refresh balance
    onSuccess();
    // Note: Modal will be closed by DepositForm after success
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mobile Optimized */}
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 transition-colors duration-200">Add Funds</h2>
            <p className="text-sm text-gray-600 transition-colors duration-200 mt-1">
              Deposit funds to your account to purchase wedding leads
            </p>
          </div>

          {/* Close Button - Mobile Optimized */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Mobile Optimized */}
        <div className="p-4 sm:p-6">
          <Elements stripe={stripePromise}>
            <DepositForm onClose={handleClose} onSuccess={handleSuccess} redirectUrl={redirectUrl} isOpen={isOpen} />
          </Elements>
        </div>
      </div>
    </div>
  );
};
