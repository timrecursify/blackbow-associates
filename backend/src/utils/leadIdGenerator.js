/**
 * Lead ID Generator
 * Format: [STATE][TIMESTAMP][RANDOM]
 * Example: MD202510311030451234 (2-char state + 14-digit timestamp + 4-digit random)
 * Total length: 20 characters
 */

/**
 * Normalize state code to 2 uppercase letters or "XX" if invalid
 * @param {string|null} state - State abbreviation
 * @returns {string} - 2-character state code
 */
export const normalizeStateCode = (state) => {
  if (!state || typeof state !== 'string') {
    return 'XX';
  }

  const cleaned = state.trim().toUpperCase();

  // Must be exactly 2 letters
  if (cleaned.length === 2 && /^[A-Z]{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Invalid format - use XX
  return 'XX';
};

/**
 * Generate random suffix for uniqueness (4 digits)
 * @returns {string} - 4-digit random number
 */
const generateRandomSuffix = () => {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
};

/**
 * Generate timestamp portion of ID (YYYYMMDDHHmmss - 14 digits)
 * @param {Date} date - Date to use for timestamp (default: now)
 * @returns {string} - 14-digit timestamp
 */
export const generateTimestamp = (date = new Date()) => {
  const year = date.getFullYear().toString(); // 4 digits
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 2 digits
  const day = date.getDate().toString().padStart(2, '0'); // 2 digits
  const hours = date.getHours().toString().padStart(2, '0'); // 2 digits
  const minutes = date.getMinutes().toString().padStart(2, '0'); // 2 digits
  const seconds = date.getSeconds().toString().padStart(2, '0'); // 2 digits

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Generate new lead ID
 * @param {string|null} state - State abbreviation
 * @param {Date} date - Date to use for timestamp (default: now)
 * @returns {string} - New lead ID in format: MD202510311030451234 (2 + 14 + 4 = 20 chars)
 */
export const generateLeadId = (state, date = new Date()) => {
  const stateCode = normalizeStateCode(state);
  const timestamp = generateTimestamp(date);
  const randomSuffix = generateRandomSuffix();
  return `${stateCode}${timestamp}${randomSuffix}`;
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

  // Must be exactly 20 characters (2-char state + 14-digit timestamp + 4-digit random)
  if (id.length !== 20) {
    return false;
  }

  // First 2 characters must be letters
  const stateCode = id.substring(0, 2);
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    return false;
  }

  // Remaining 18 characters must be digits (14 timestamp + 4 random)
  const numbers = id.substring(2);
  if (!/^\d{18}$/.test(numbers)) {
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
 * Extract timestamp from lead ID
 * @param {string} id - Lead ID
 * @returns {Date|null} - Date object or null if invalid
 */
export const extractDateFromId = (id) => {
  if (!validateLeadId(id)) {
    return null;
  }

  // Extract timestamp portion (14 digits, skip last 4 random digits)
  const timestamp = id.substring(2, 16);
  const year = parseInt(timestamp.substring(0, 4), 10);
  const month = parseInt(timestamp.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(timestamp.substring(6, 8), 10);
  const hours = parseInt(timestamp.substring(8, 10), 10);
  const minutes = parseInt(timestamp.substring(10, 12), 10);
  const seconds = parseInt(timestamp.substring(12, 14), 10);

  return new Date(year, month, day, hours, minutes, seconds);
};

export default {
  generateLeadId,
  normalizeStateCode,
  generateTimestamp,
  validateLeadId,
  extractStateFromId,
  extractDateFromId
};
