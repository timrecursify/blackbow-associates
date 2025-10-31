import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, usersAPI } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DepositForm: React.FC<{ onClose: () => void; onSuccess: (amount: number) => void }> = ({
  onClose,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState<string>('20');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);

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
            console.log('Payment verified immediately', { paymentIntentId });
            // Payment verified and credited
            setDepositAmount(depositAmount);
            setSuccess(true);
            setIsProcessing(false);
            
            // Trigger balance update event
            window.dispatchEvent(new CustomEvent('balanceUpdated'));
            
            // Call success callback
            setTimeout(() => {
              onSuccess(depositAmount);
            }, 1000);
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
              console.error('Failed to get initial balance:', error);
            }
            
            // Poll for balance update (webhook is async)
            pollForBalanceUpdate(initialBalance, depositAmount);
            
            // Call success callback after delay
            setTimeout(() => {
              onSuccess(depositAmount);
            }, 2000);
          }
        } catch (verifyError) {
          console.error('Payment verification failed, will rely on webhook:', verifyError);
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
            console.error('Failed to get initial balance:', error);
          }
          
          // Poll for balance update (webhook is async)
          pollForBalanceUpdate(initialBalance, depositAmount);
          
          // Call success callback after delay
          setTimeout(() => {
            onSuccess(depositAmount);
          }, 2000);
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
        console.error('Failed to poll balance:', error);
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
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your deposit of <span className="font-bold text-black">${depositAmount.toFixed(2)}</span> has been processed.
          </p>
          <p className="text-sm text-gray-500">
            Your account balance will be updated shortly...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
        <button
          onClick={() => {
            setSuccess(false);
            onClose();
          }}
          className="w-full px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-2">
          Deposit Amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign size={18} className="text-gray-600" />
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
            placeholder="0.00"
            required
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">Minimum deposit: $1.00</p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAmount('20')}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
        >
          $20
        </button>
        <button
          type="button"
          onClick={() => setAmount('50')}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
        >
          $50
        </button>
        <button
          type="button"
          onClick={() => setAmount('100')}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
        >
          $100
        </button>
        <button
          type="button"
          onClick={() => setAmount('200')}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
        >
          $200
        </button>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Card Details</label>
        <div className="p-3 border border-gray-300 rounded-lg">
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Deposit $${parseFloat(amount || '0').toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSuccess = (amount: number) => {
    // Refresh balance and show success
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black z-10"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Funds</h2>
        <p className="text-sm text-gray-600 mb-6">
          Deposit funds to your account to purchase wedding leads
        </p>

        {/* Form */}
        <Elements stripe={stripePromise}>
          <DepositForm onClose={handleClose} onSuccess={handleSuccess} />
        </Elements>
      </div>
    </div>
  );
};
