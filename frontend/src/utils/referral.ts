const REFERRAL_CODE_KEY = 'bb_referral_code';
const REFERRAL_EXPIRY_KEY = 'bb_referral_expiry';
const EXPIRY_DAYS = 30;

/**
 * Capture referral code from URL and persist to localStorage
 */
export function captureReferralCode(): void {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + EXPIRY_DAYS);

    localStorage.setItem(REFERRAL_CODE_KEY, refCode);
    localStorage.setItem(REFERRAL_EXPIRY_KEY, expiry.toISOString());
  }
}

/**
 * Get stored referral code if not expired
 */
export function getReferralCode(): string | null {
  const code = localStorage.getItem(REFERRAL_CODE_KEY);
  const expiryStr = localStorage.getItem(REFERRAL_EXPIRY_KEY);

  if (!code || !expiryStr) return null;

  const expiry = new Date(expiryStr);
  if (new Date() > expiry) {
    clearReferralCode();
    return null;
  }

  return code;
}

/**
 * Clear stored referral code after successful registration
 */
export function clearReferralCode(): void {
  localStorage.removeItem(REFERRAL_CODE_KEY);
  localStorage.removeItem(REFERRAL_EXPIRY_KEY);
}
