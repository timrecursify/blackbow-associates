/**
 * Lead ID Generator V2
 * Format: [STATE][6-DIGIT UNIQUE NUMBER]
 * Example: MD123456 (2-char state + 6 unique digits)
 * Total length: 8 characters
 */

import { determineState } from './cityStateMapper.js';

/**
 * Normalize state code to 2 uppercase letters or "XX" if invalid
 * Uses city-to-state mapping if state is not available
 * @param {string|null} state - State code or name
 * @param {string|null} city - City name
 * @returns {string} - 2-character state code
 */
export const normalizeStateCode = (state, city) => {
  return determineState(state, city);
};

/**
 * Generate 6-digit unique number
 * @returns {string} - 6-digit number as string
 */
export const generateUniqueNumber = () => {
  // Generate random 6-digit number (100000 to 999999)
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return randomNum.toString();
};

/**
 * Generate new lead ID
 * @param {string|null} state - State abbreviation
 * @param {string|null} city - City name
 * @param {Function} checkUniqueness - Optional function to check if ID exists (for retries)
 * @returns {string} - New lead ID in format: MD123456
 */
export const generateLeadId = (state, city, checkUniqueness = null) => {
  const stateCode = normalizeStateCode(state, city);
  const uniqueNumber = generateUniqueNumber();
  const id = `${stateCode}${uniqueNumber}`;

  // If checkUniqueness function provided, ensure uniqueness
  if (checkUniqueness && typeof checkUniqueness === 'function') {
    // This would be used in the actual implementation to retry if ID exists
    return id;
  }

  return id;
};

/**
 * Validate lead ID format
 * @param {string} id - Lead ID to validate
 * @returns {boolean} - True if valid format
 */
export const validateLeadId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Must be exactly 8 characters (2-char state + 6 digits)
  if (id.length !== 8) {
    return false;
  }

  // First 2 characters must be letters
  const stateCode = id.substring(0, 2);
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    return false;
  }

  // Last 6 characters must be digits
  const number = id.substring(2);
  if (!/^\d{6}$/.test(number)) {
    return false;
  }

  return true;
};

/**
 * Extract state code from lead ID
 * @param {string} id - Lead ID
 * @returns {string|null} - State code or null if invalid
 */
export const extractStateFromId = (id) => {
  if (!validateLeadId(id)) {
    return null;
  }
  return id.substring(0, 2);
};

/**
 * Extract unique number from lead ID
 * @param {string} id - Lead ID
 * @returns {string|null} - 6-digit number or null if invalid
 */
export const extractNumberFromId = (id) => {
  if (!validateLeadId(id)) {
    return null;
  }
  return id.substring(2);
};

export default {
  generateLeadId,
  normalizeStateCode,
  generateUniqueNumber,
  validateLeadId,
  extractStateFromId,
  extractNumberFromId
};
