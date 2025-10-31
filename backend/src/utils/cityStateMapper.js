/**
 * City to State Mapping
 * Maps major US cities to their state codes
 */

const cityStateMap = {
  // Major cities by state (lowercase for case-insensitive matching)

  // Alabama
  'birmingham': 'AL',
  'montgomery': 'AL',
  'mobile': 'AL',

  // Alaska
  'anchorage': 'AK',
  'juneau': 'AK',

  // Arizona
  'phoenix': 'AZ',
  'tucson': 'AZ',
  'scottsdale': 'AZ',
  'mesa': 'AZ',

  // Arkansas
  'little rock': 'AR',

  // California
  'los angeles': 'CA',
  'san francisco': 'CA',
  'san diego': 'CA',
  'sacramento': 'CA',
  'san jose': 'CA',
  'oakland': 'CA',
  'fresno': 'CA',
  'long beach': 'CA',
  'santa barbara': 'CA',
  'santa monica': 'CA',
  'pasadena': 'CA',
  'irvine': 'CA',
  'anaheim': 'CA',

  // Colorado
  'denver': 'CO',
  'colorado springs': 'CO',
  'aurora': 'CO',
  'boulder': 'CO',

  // Connecticut
  'hartford': 'CT',
  'new haven': 'CT',
  'stamford': 'CT',
  'bridgeport': 'CT',

  // Delaware
  'wilmington': 'DE',
  'dover': 'DE',

  // Florida
  'miami': 'FL',
  'tampa': 'FL',
  'orlando': 'FL',
  'jacksonville': 'FL',
  'tallahassee': 'FL',
  'fort lauderdale': 'FL',
  'west palm beach': 'FL',
  'naples': 'FL',
  'sarasota': 'FL',
  'south florida': 'FL',

  // Georgia
  'atlanta': 'GA',
  'savannah': 'GA',
  'augusta': 'GA',

  // Hawaii
  'honolulu': 'HI',

  // Idaho
  'boise': 'ID',

  // Illinois
  'chicago': 'IL',
  'springfield': 'IL',
  'naperville': 'IL',

  // Indiana
  'indianapolis': 'IN',
  'fort wayne': 'IN',

  // Iowa
  'des moines': 'IA',

  // Kansas
  'wichita': 'KS',
  'kansas city': 'KS',

  // Kentucky
  'louisville': 'KY',
  'lexington': 'KY',

  // Louisiana
  'new orleans': 'LA',
  'baton rouge': 'LA',

  // Maine
  'portland': 'ME',
  'augusta': 'ME',

  // Maryland
  'baltimore': 'MD',
  'annapolis': 'MD',
  'bethesda': 'MD',
  'rockville': 'MD',
  'silver spring': 'MD',

  // Massachusetts
  'boston': 'MA',
  'worcester': 'MA',
  'springfield': 'MA',
  'cambridge': 'MA',
  'lowell': 'MA',

  // Michigan
  'detroit': 'MI',
  'grand rapids': 'MI',
  'lansing': 'MI',

  // Minnesota
  'minneapolis': 'MN',
  'st. paul': 'MN',
  'saint paul': 'MN',

  // Mississippi
  'jackson': 'MS',

  // Missouri
  'st. louis': 'MO',
  'saint louis': 'MO',
  'kansas city': 'MO',
  'springfield': 'MO',

  // Montana
  'billings': 'MT',
  'missoula': 'MT',

  // Nebraska
  'omaha': 'NE',
  'lincoln': 'NE',

  // Nevada
  'las vegas': 'NV',
  'reno': 'NV',

  // New Hampshire
  'manchester': 'NH',
  'concord': 'NH',

  // New Jersey
  'newark': 'NJ',
  'jersey city': 'NJ',
  'paterson': 'NJ',
  'trenton': 'NJ',

  // New Mexico
  'albuquerque': 'NM',
  'santa fe': 'NM',

  // New York
  'new york': 'NY',
  'buffalo': 'NY',
  'rochester': 'NY',
  'albany': 'NY',
  'syracuse': 'NY',
  'yonkers': 'NY',
  'brooklyn': 'NY',
  'queens': 'NY',
  'manhattan': 'NY',
  'bronx': 'NY',
  'staten island': 'NY',

  // North Carolina
  'charlotte': 'NC',
  'raleigh': 'NC',
  'greensboro': 'NC',
  'durham': 'NC',

  // North Dakota
  'fargo': 'ND',
  'bismarck': 'ND',

  // Ohio
  'columbus': 'OH',
  'cleveland': 'OH',
  'cincinnati': 'OH',
  'toledo': 'OH',
  'akron': 'OH',

  // Oklahoma
  'oklahoma city': 'OK',
  'tulsa': 'OK',

  // Oregon
  'portland': 'OR',
  'salem': 'OR',
  'eugene': 'OR',

  // Pennsylvania
  'philadelphia': 'PA',
  'pittsburgh': 'PA',
  'harrisburg': 'PA',
  'allentown': 'PA',
  'erie': 'PA',
  'bridgewater': 'PA',

  // Rhode Island
  'providence': 'RI',

  // South Carolina
  'charleston': 'SC',
  'columbia': 'SC',

  // South Dakota
  'sioux falls': 'SD',

  // Tennessee
  'nashville': 'TN',
  'memphis': 'TN',
  'knoxville': 'TN',

  // Texas
  'houston': 'TX',
  'dallas': 'TX',
  'austin': 'TX',
  'san antonio': 'TX',
  'fort worth': 'TX',
  'el paso': 'TX',

  // Utah
  'salt lake city': 'UT',
  'provo': 'UT',

  // Vermont
  'burlington': 'VT',
  'montpelier': 'VT',

  // Virginia
  'virginia beach': 'VA',
  'norfolk': 'VA',
  'richmond': 'VA',
  'arlington': 'VA',
  'alexandria': 'VA',
  'mclean': 'VA',
  'reston': 'VA',

  // Washington
  'seattle': 'WA',
  'spokane': 'WA',
  'tacoma': 'WA',

  // Washington DC
  'washington': 'DC',
  'dc': 'DC',
  'dmv': 'DC',
  'dc & dmv metro': 'DC',

  // West Virginia
  'charleston': 'WV',

  // Wisconsin
  'milwaukee': 'WI',
  'madison': 'WI',

  // Wyoming
  'cheyenne': 'WY'
};

/**
 * Get state code from city name
 * @param {string} city - City name
 * @returns {string|null} - State code or null if not found
 */
export const getStateFromCity = (city) => {
  if (!city || typeof city !== 'string') {
    return null;
  }

  const cleanCity = city.toLowerCase().trim();
  return cityStateMap[cleanCity] || null;
};

/**
 * Determine state from city or state fields
 * @param {string|null} state - State code or name
 * @param {string|null} city - City name
 * @returns {string} - 2-letter state code or 'XX' if unknown
 */
export const determineState = (state, city) => {
  // First try to use the state field if it's valid
  if (state && typeof state === 'string') {
    const cleanState = state.trim().toUpperCase();
    // Valid 2-letter state code
    if (cleanState.length === 2 && /^[A-Z]{2}$/.test(cleanState)) {
      return cleanState;
    }
  }

  // Try to determine from city
  if (city) {
    const stateFromCity = getStateFromCity(city);
    if (stateFromCity) {
      return stateFromCity;
    }
  }

  // Unknown state
  return 'XX';
};

export default {
  getStateFromCity,
  determineState,
  cityStateMap
};
