import axios from 'axios';
import logger from '../utils/logger.js';
import { generateLeadId } from '../utils/leadIdGeneratorV2.js';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

const logPipedriveError = (message, error, context = {}) => {
  // SECURITY: never log full axios error objects (they may include api_token in params)
  if (axios.isAxiosError(error)) {
    logger.error(message, {
      ...context,
      status: error.response?.status,
      code: error.code,
      // Pipedrive responses sometimes include useful non-sensitive error messages
      responseError: error.response?.data?.error,
      responseMessage: error.response?.data?.error_info || error.response?.data?.message
    });
    return;
  }

  logger.error(message, {
    ...context,
    error: error?.message,
    name: error?.name
  });
};

const FIELD_KEYS = {
  weddingDate: '48d02678bc42b89d4899408183ca63194a968a2f',
  city: 'bb1b06f9856098ab1fff967789d2a34cf8c32071',
  state: 'ab8da96fa06f5bba3ed7a744abd1808bca457c2a',
  description: '3edd86479b253c3d1974945fead02517ec2cce2c',
  ethnicReligious: '137b84c97a24ee17c40306b80ad3ec87ad8b4057',
  comments: 'a81743f0fbba22cfbe4af307bdba520923dd6d4f',
  source: 'b2be79ec6d74810f141ff0c10950d09a251841d5',
  gclid: '9aad4a1b8a9bcd93dc31ec8c4efea5f2d3123c58',
  fbclid: '6d9fa7cac69ac961197fe160a6e0303cc103db3c',
  utmTerm: '69ce2c893d7c87679967b12727805d693463a5fe',
  spUtmCampaign: '0c0266c6a8ca36806465ba11d0a0b7cd01401107',
  utmContent: '8f230578a37b1f6cc9735b2659d00f69a407cedd',
  utmMedium: '793eed228dab55f371b7a463d6272c25c10d2592',
  eventId: '8cf49560ecaa68f90d3e4e103a8267ca5d4dc621',
  sessionId: 'b0067e0f4c9d31fe12a9067ea0c2f728079ada9e',
  pixelId: '5365d081bd139123cdac311b49c9b207f6a2ff7b',
  projectId: '7aea416f749df1c9b88bbf3a75d0377475b771e4',
  conversionPageUrl: 'a5fda325cf12108a3156d8572d3e5df1b1157c8f',
  visitorCity: 'c068cb8babf4d594f68f14bda5093f51c45d6527',
  visitorLocation: 'af8fe5c5442ad675f6f0bffa123fa15f92794842',
  visitorId: '38cf8a494a313dddb37b05eb5230c14470a71208',
  ipAddress: '511d65babf591015ec6be0b58434327933c6f703'
};

const BAD_LOCATION_TERMS = [
  'other destinations',
  'other destination',
  'location tbd',
  'tbd',
  'metro',
  'destinations',
  'south florida',
  'boston, hartford, providence',
  'seattle, spokane'
];
const isBadLocation = (loc) => {
  if (!loc) return true;
  const lower = loc.toLowerCase().trim();
  return BAD_LOCATION_TERMS.some(term => lower.includes(term));
};

const STATE_ABBR = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR'
};

// Map Pipedrive state enum IDs to state abbreviations
const STATE_ENUM_MAP = {
  102: 'AL', 103: 'AK', 104: 'AZ', 105: 'AR', 106: 'CA',
  107: 'CO', 108: 'CT', 156: 'DC', 109: 'DE', 110: 'FL',
  111: 'GA', 112: 'HI', 113: 'ID', 114: 'IL', 115: 'IN',
  116: 'IA', 117: 'KS', 118: 'KY', 119: 'LA', 120: 'ME',
  121: 'MD', 122: 'MA', 123: 'MI', 124: 'MN', 125: 'MS',
  126: 'MO', 127: 'MT', 128: 'NE', 129: 'NV', 130: 'NH',
  131: 'NJ', 132: 'NM', 133: 'NY', 134: 'NC', 135: 'ND',
  136: 'OH', 137: 'OK', 138: 'OR', 139: 'PA', 140: 'RI',
  141: 'SC', 142: 'SD', 143: 'TN', 144: 'TX', 145: 'UT',
  146: 'VT', 147: 'VA', 148: 'WA', 149: 'WV', 150: 'WI',
  151: 'WY', 171: 'MX', 174: 'MX', 172: 'DEST'
};

/**
 * Normalize enum field values from Pipedrive
 * Handles both webhook format {id: 110, type: enum} and API format 110
 */
const normalizeEnumValue = (value, enumMap) => {
  if (!value) return null;
  // Webhook format: {id: 110, type: enum}
  if (typeof value === 'object' && value.id) {
    return enumMap[value.id] || null;
  }
  // API format: 110 or 110
  const numericId = parseInt(value, 10);
  if (!isNaN(numericId)) {
    return enumMap[numericId] || null;
  }
  // Already a string label
  if (typeof value === 'string' && value.length === 2) {
    return value.toUpperCase();
  }
  return null;
};


const toStateAbbr = (state) => {
  if (!state) return null;
  const s = state.trim();
  if (s.length === 2) return s.toUpperCase();
  return STATE_ABBR[s.toLowerCase()] || s;
};

/**
 * Map generic region names to state abbreviations
 */
const REGION_TO_STATE = {
  'south florida': 'FL',
  'boston, hartford, providence': 'MA',
  'boston': 'MA',
  'hartford': 'CT',
  'providence': 'RI',
  'seattle, spokane': 'WA',
  'seattle': 'WA',
  'spokane': 'WA',
  'denver, aspen, vail': 'CO',
  'denver': 'CO',
  'aspen': 'CO',
  'vail': 'CO'
};

/**
 * Infer state from generic region name
 */
const inferStateFromRegion = (region) => {
  if (!region) return null;
  const lower = region.toLowerCase().trim();
  return REGION_TO_STATE[lower] || null;
};

/**
 * Extract state abbreviation from a full location string like "Miami, Florida, US"
 * Returns the 2-letter state code or null if not parseable
 */
const extractStateFromVisitorLocation = (visitorLocation) => {
  if (!visitorLocation) return null;
  
  // First, check if it's a generic region we can map
  const inferredState = inferStateFromRegion(visitorLocation);
  if (inferredState) return inferredState;
  
  // Handle formats like "Miami, Florida, US" or "Pembroke Pines, Florida, US"
  const parts = visitorLocation.split(',').map(p => p.trim());
  
  // Try to find a state name in the parts
  for (const part of parts) {
    const lower = part.toLowerCase();
    // Skip if it's obviously a country or city
    if (lower === 'us' || lower === 'usa' || lower === 'united states') continue;
    
    // Check if this part is a known state name
    if (STATE_ABBR[lower]) {
      return STATE_ABBR[lower];
    }
    // Check if it's already a 2-letter abbreviation
    if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) {
      return part.toUpperCase();
    }
  }
  
  return null;
};

export const fetchDeals = async (params = {}, fetchAll = false) => {
  try {
    const allDeals = [];
    let start = params.start || 0;
    const limit = Math.min(params.limit || 500, 500);
    let hasMore = true;

    if (fetchAll) {
      while (hasMore) {
        const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
          params: { api_token: PIPEDRIVE_API_TOKEN, status: params.status || 'all', limit, start, ...params }
        });
        if (response.data.success && response.data.data) {
          allDeals.push(...response.data.data);
          hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
          start += limit;
        } else {
          hasMore = false;
        }
      }
      return { success: true, data: allDeals };
    }

    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
      params: { api_token: PIPEDRIVE_API_TOKEN, status: params.status || 'open', limit, start, ...params }
    });
    return response.data;
  } catch (error) {
    logPipedriveError('Error fetching deals from Pipedrive', error, { endpoint: '/deals' });
    throw error;
  }
};

export const fetchPerson = async (personId) => {
  try {
    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/persons/${personId}`, {
      params: { api_token: PIPEDRIVE_API_TOKEN }
    });
    return response.data.data;
  } catch (error) {
    logPipedriveError('Error fetching person from Pipedrive', error, { endpoint: '/persons/:id' });
    throw error;
  }
};

const normalizePipedriveDeal = (deal) => {
  if (!deal) return deal;
  if (deal.custom_fields && typeof deal.custom_fields === 'object') {
    const normalized = { ...deal };
    for (const [key, fieldData] of Object.entries(deal.custom_fields)) {
      if (fieldData === null || fieldData === undefined) {
        normalized[key] = null;
      } else if (typeof fieldData === 'object' && 'value' in fieldData) {
        normalized[key] = fieldData.value;
      } else {
        normalized[key] = fieldData;
      }
    }
    return normalized;
  }
  return deal;
};

export const transformDealToLead = async (deal) => {
  try {
    deal = normalizePipedriveDeal(deal);

    // ALWAYS fetch full person to get custom fields (embedded person_id object lacks them)
    let person = null;
    const personId = deal.person_id?.value || deal.person_id;
    if (personId) {
      person = await fetchPerson(personId);
    }

    const comments = deal[FIELD_KEYS.comments] || '';
    const title = deal.title || '';
    const rawDescription = deal[FIELD_KEYS.description] || '';
    // Remove "Type of Coverage" / "Tupe of Coverage" lines from description
    const description = rawDescription
      .split('\n')
      .filter(line => !line.toLowerCase().includes('upe of coverage'))
      .join('\n')
      .trim() || null;
    const servicesNeeded = parseServicesFromDescription(rawDescription);
    
    // Try to extract city and state from comments first
    const cityStateFromComments = extractCityStateFromComments(comments);
    let city = deal[FIELD_KEYS.city] || cityStateFromComments?.city || extractCityFromComments(comments);
    let state = normalizeEnumValue(deal[FIELD_KEYS.state], STATE_ENUM_MAP) || cityStateFromComments?.state || extractStateFromTitle(title);
    let location = buildLocationString(city, state, comments);
    
    // FALLBACK: If location is bad, use visitor data from person
    if (isBadLocation(location) && person) {
      const visitorCity = person[FIELD_KEYS.visitorCity];
      const visitorLocation = person[FIELD_KEYS.visitorLocation];
      
      if (visitorCity || visitorLocation) {
        logger.info('Using visitor location fallback', {
          dealId: deal.id,
          originalLocation: location,
          visitorCity,
          visitorLocation
        });
        
        if (visitorCity && !isBadLocation(visitorCity)) {
          // Only use visitorCity if it's a real city (not generic)
          city = visitorCity;
        }
        
        // Extract proper state abbreviation from visitorLocation
        // Handles both full strings ("Miami, Florida, US" → "FL") and generic regions ("South Florida" → "FL")
        const extractedState = extractStateFromVisitorLocation(visitorLocation);
        if (extractedState) {
          state = extractedState;
          // If we inferred state from a generic region (like "South Florida"), clear city if it's also generic
          // This prevents leads from staying incomplete due to generic city names
          if (isBadLocation(visitorLocation) && isBadLocation(city)) {
            city = null; // Clear generic city when we have state from generic region
          }
        }
        
        // Build location string
        if (city && state) {
          // If city is still generic (like "South Florida"), use state only
          if (isBadLocation(city)) {
            location = state;
            city = null; // Clear generic city
          } else {
            location = `${city}, ${state}`;
          }
        } else if (state) {
          location = state;
        } else if (city && !isBadLocation(city)) {
          location = city;
        }
      }
    }
    
    // FINAL FALLBACK: If we still don't have city/state, try to extract from location string itself
    // Handles cases like "Other Destinations, Tampa" → Tampa, FL
    if ((!city || !state) && location && isBadLocation(location)) {
      const extracted = extractCityStateFromLocation(location);
      if (extracted) {
        if (extracted.city && !city) city = extracted.city;
        if (extracted.state && !state) state = extracted.state;
        // Rebuild location with extracted data
        if (city && state) {
          location = `${city}, ${state}`;
        } else if (state) {
          location = state;
        } else if (city) {
          location = city;
        }
      }
    }

        // FALLBACK: Try to infer state from known region names in location
    if (!state && location) {
      const regionState = inferStateFromRegion(location);
      if (regionState) {
        state = regionState;
        logger.info('Inferred state from region', { dealId: deal.id, location, state });
      }
    }

    const leadId = generateLeadId(state, city);

    return {
      id: leadId,
      pipedriveDealId: deal.id,
      weddingDate: deal[FIELD_KEYS.weddingDate] ? new Date(deal[FIELD_KEYS.weddingDate]) : null,
      city: city || null,
      state: state || null,
      location: location || 'Location TBD',
      description: description || null,
      ethnicReligious: deal[FIELD_KEYS.ethnicReligious] || null,
      firstName: person?.first_name || null,
      lastName: person?.last_name || null,
      personName: person?.name || null,
      email: person?.email?.[0]?.value || null,
      phone: person?.phone?.[0]?.value || null,
      source: person?.[FIELD_KEYS.source] || null,
      gclid: person?.[FIELD_KEYS.gclid] || null,
      fbclid: person?.[FIELD_KEYS.fbclid] || null,
      utmTerm: person?.[FIELD_KEYS.utmTerm] || null,
      spUtmCampaign: person?.[FIELD_KEYS.spUtmCampaign] || null,
      utmContent: person?.[FIELD_KEYS.utmContent] || null,
      utmMedium: person?.[FIELD_KEYS.utmMedium] || null,
      eventId: person?.[FIELD_KEYS.eventId] || null,
      sessionId: person?.[FIELD_KEYS.sessionId] || null,
      pixelId: person?.[FIELD_KEYS.pixelId] || null,
      projectId: person?.[FIELD_KEYS.projectId] || null,
      conversionPageUrl: person?.[FIELD_KEYS.conversionPageUrl] || null,
      servicesNeeded,
      budgetMax: deal.value || 2000,
      price: 20.00,
      status: 'AVAILABLE',
      active: true,
      venueHint: extractVenueHint(comments),
      maskedInfo: { weddingDate: deal[FIELD_KEYS.weddingDate] || null, location, servicesNeeded },
      fullInfo: { coupleName: person?.name || 'N/A', email: person?.email?.[0]?.value || 'N/A', phone: person?.phone?.[0]?.value || 'N/A', notes: comments || '' }
    };
  } catch (error) {
    logger.error('Error transforming deal to lead:', error);
    throw error;
  }
};

const parseServicesFromDescription = (d) => {
  if (!d) return [];
  const s = [], l = d.toLowerCase();
  if (l.includes('photography')) s.push('Photography');
  if (l.includes('videography') || l.includes('video')) s.push('Videography');
  if (l.includes('drone')) s.push('Drone');
  if (l.includes('multi-day')) s.push('Multi-Day');
  if (l.includes('raw')) s.push('RAW Files');
  return s.length > 0 ? s : ['Photography'];
};

/**
 * Extract venue hint from comments/notes
 * Looks for specific venue names in:
 * 1. "Venue Location:" field - after the vague region (e.g., "DC & DMV Metro, Wampanoag country club")
 * 2. "Client's Notes:" field - venue names like "First Baptist Church", "country club", etc.
 * Returns null if no specific venue found
 */
const extractVenueHint = (comments) => {
  if (!comments) return null;

  // Vague location terms to filter out
  const VAGUE_TERMS = [
    'dc & dmv metro', 'dmv metro', 'ny, nj , pa metro', 'ny, nj, pa metro',
    'south florida', 'other destinations', 'location tbd', 'tbd',
    'boston, hartford, providence', 'seattle, spokane', 'denver, aspen, vail',
    'cancun, tulum, vallarta, cabos', 'metro'
  ];

  const isVague = (text) => {
    if (!text) return true;
    const lower = text.toLowerCase().trim();
    if (lower.length < 3) return true;
    return VAGUE_TERMS.some(term => lower === term || lower.startsWith(term + ','));
  };

  let venueHint = null;

  // 1. Try to extract from "Venue Location:" - look for specific venue after vague region
  const venueMatch = comments.match(/Venue Location:\s*([^\n]+)/i);
  if (venueMatch) {
    const venueLine = venueMatch[1].trim();
    const parts = venueLine.split(',').map(p => p.trim()).filter(p => p);

    // Find the first non-vague, non-state part that looks like a venue name
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip vague terms and 2-letter state codes
      if (isVague(part)) continue;
      if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) continue;

      // This might be a venue - check if it's descriptive enough
      // Look for venue-like words or proper nouns (capitalized words)
      const hasVenueKeyword = /club|church|hall|manor|barn|estate|hotel|resort|garden|farm|house|center|museum|library|park|winery|vineyard|brewery|restaurant|ballroom|pavilion|lodge|inn|venue|chapel/i.test(part);
      const isProperNoun = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*/.test(part) && part.length > 5;

      if (hasVenueKeyword || isProperNoun) {
        venueHint = part;
        break;
      }
    }
  }

  // 2. If no venue from Venue Location, try Client's Notes
  if (!venueHint) {
    const clientNotesMatch = comments.match(/Client's Notes:\s*([\s\S]*?)(?=\n\n|$)/i);
    if (clientNotesMatch) {
      const notes = clientNotesMatch[1].trim();

      // Look for venue patterns in client notes
      const venuePatterns = [
        // "at [Venue Name]" or "in [Venue Name]"
        /(?:at|in)\s+(?:the\s+)?([A-Z][A-Za-z\s'-]+(?:church|club|hall|manor|barn|estate|hotel|resort|garden|farm|house|center|museum|venue|chapel|winery|ballroom|pavilion|lodge|inn)[A-Za-z\s'-]*)/i,
        // "ceremony/reception at [Venue]"
        /(?:ceremony|reception|wedding)\s+(?:will be\s+)?(?:at|in)\s+(?:the\s+)?([A-Z][A-Za-z\s'-]+)/i,
        // "[Venue Name] country club" or similar
        /([A-Z][A-Za-z\s'-]+(?:country\s+club|golf\s+club|yacht\s+club|beach\s+club))/i,
        // "Venue location: [specific]" inline
        /venue\s*(?:location)?:?\s*([A-Z][A-Za-z\s'-]+(?:church|club|hall|manor|barn|estate|hotel|resort))/i
      ];

      for (const pattern of venuePatterns) {
        const match = notes.match(pattern);
        if (match && match[1]) {
          const extracted = match[1].trim();
          // Validate it's not too short or too long
          if (extracted.length >= 5 && extracted.length <= 60 && !isVague(extracted)) {
            venueHint = extracted;
            break;
          }
        }
      }
    }
  }

  // Clean up the venue hint
  if (venueHint) {
    // Remove trailing punctuation and clean whitespace
    venueHint = venueHint.replace(/[,.\s]+$/, '').trim();
    // Capitalize properly if all lowercase
    if (venueHint === venueHint.toLowerCase()) {
      venueHint = venueHint.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  return venueHint || null;
};

const extractStateFromTitle = (title) => {
  if (!title) return null;
  const parts = title.split('|');
  if (parts.length < 3) return null;
  const loc = parts[2].trim();
  for (const abbr of ['FL','NY','NJ','PA','MA','CT','NH','MD','VA','DC','CA','TX','IL','GA','NC','SC','WV']) {
    if (loc.includes(abbr)) return abbr;
  }
  return null;
};

const buildLocationString = (city, state, comments) => {
  const m = comments?.match(/Venue Location:\s*([^\n]+)/i);
  if (m) return m[1].trim();
  if (city?.includes(',')) return city;
  if (city && state) return new RegExp(`\\b${state}\\b`, 'i').test(city) ? city : `${city}, ${state}`;
  return state || city || null;
};

const extractCityFromComments = (comments) => {
  if (!comments) return null;
  const m = comments.match(/Venue Location:\s*([^\n]+)/i);
  if (!m) return null;
  const v = m[1].trim(), parts = v.split(',').map(p => p.trim());
  if (parts.length >= 2 && parts[parts.length - 1].length === 2) {
    const c = parts[parts.length - 2];
    if (!BAD_LOCATION_TERMS.some(t => c.toLowerCase().includes(t))) return c;
  }
  if (parts.length === 2 && parts[1].length === 2) return parts[0];
  if (parts.length > 0 && parts[0].length > 2 && !parts[0].toLowerCase().includes('other')) return parts[0];
  return null;
};


/**
 * Extract both city and state from comments
 * Handles formats like:
 * - "Venue Location: Virginia" → { city: null, state: 'VA' }
 * - "Venue Location: Other Destinations, Powhatan, VA" → { city: 'Powhatan', state: 'VA' }
 * - "Venue Location: Other Destinations, Cedar Oaks Farm -  Bedford, VA" → { city: 'Bedford', state: 'VA' }
 */
const extractCityStateFromComments = (comments) => {
  if (!comments) return null;
  const m = comments.match(/Venue Location:\s*([^\n]+)/i);
  if (!m) return null;
  
  const venueLocation = m[1].trim();
  const parts = venueLocation.split(',').map(p => p.trim()).filter(p => p);
  
  if (parts.length === 0) return null;
  
  let extractedCity = null;
  let extractedState = null;
  
  // Check if last part is a 2-letter state code (e.g., "VA", "FL")
  const lastPart = parts[parts.length - 1];
  if (lastPart.length === 2 && /^[A-Z]{2}$/i.test(lastPart)) {
    extractedState = lastPart.toUpperCase();
    // City is the part before the state
    if (parts.length >= 2) {
      // Handle cases like "Cedar Oaks Farm -  Bedford" → extract "Bedford"
      const cityPart = parts[parts.length - 2];
      // Extract city name from compound strings like "Cedar Oaks Farm -  Bedford"
      const cityMatch = cityPart.match(/([^-]+)$/);
      if (cityMatch) {
        extractedCity = cityMatch[1].trim();
        // Filter out bad location terms
        if (isBadLocation(extractedCity)) {
          extractedCity = null;
        }
      } else if (!isBadLocation(cityPart)) {
        extractedCity = cityPart;
      }
    }
  } else {
    // Check if last part is a full state name (e.g., "Virginia", "Florida")
    const stateMatch = Object.entries(STATE_ABBR).find(([name]) => 
      lastPart.toLowerCase() === name.toLowerCase()
    );
    if (stateMatch) {
      extractedState = stateMatch[1];
      // If only one part and it's a state name, no city
      if (parts.length === 1) {
        extractedCity = null;
      } else if (parts.length >= 2) {
        const cityPart = parts[parts.length - 2];
        if (!isBadLocation(cityPart)) {
          extractedCity = cityPart;
        }
      }
    } else {
      // No state found, try to extract city only
      const cityPart = parts[parts.length - 1];
      if (!isBadLocation(cityPart) && cityPart.length > 2) {
        extractedCity = cityPart;
      }
    }
  }
  
  // Filter out bad location terms from city
  if (extractedCity && isBadLocation(extractedCity)) {
    extractedCity = null;
  }
  
  if (extractedCity || extractedState) {
    return { city: extractedCity, state: extractedState };
  }
  
  return null;
};


/**
 * Extract city and state from location strings like "Other Destinations, Tampa" or "Other Destinations, Shelby NC"
 * Returns { city, state } or null if not parseable
 * Note: We still try to extract even if location contains bad terms, as long as it has real city names
 */
const extractCityStateFromLocation = (locationStr) => {
  if (!locationStr) return null;
  
  // Handle patterns like "Other Destinations, Tampa" or "Other Destinations, Shelby NC"
  const parts = locationStr.split(',').map(p => p.trim()).filter(p => p && !isBadLocation(p));
  
  if (parts.length === 0) return null;
  
  // Try to find a state abbreviation in the last part
  const lastPart = parts[parts.length - 1];
  let extractedState = null;
  let extractedCity = null;
  
  // Check if last part is a 2-letter state code
  if (lastPart.length === 2 && /^[A-Z]{2}$/i.test(lastPart)) {
    extractedState = lastPart.toUpperCase();
    // City is the part before it
    if (parts.length >= 2) {
      extractedCity = parts[parts.length - 2];
    }
  } else {
    // Check if last part contains a state name
    const stateMatch = Object.entries(STATE_ABBR).find(([name]) => 
      lastPart.toLowerCase().includes(name.toLowerCase())
    );
    if (stateMatch) {
      extractedState = stateMatch[1];
      // City is everything before the state
      if (parts.length >= 2) {
        extractedCity = parts.slice(0, -1).join(', ');
      }
    } else {
      // No state found, try to infer from known cities
      // Common cities that might appear without state
      const cityOnly = parts[parts.length - 1];
      if (cityOnly && cityOnly.length > 2 && !isBadLocation(cityOnly)) {
        extractedCity = cityOnly;
        // Try to infer state from city name (e.g., "Tampa" → FL, "Shelby" → NC)
        // This is a best-effort guess
        if (cityOnly.toLowerCase().includes('tampa') || cityOnly.toLowerCase().includes('miami') || 
            cityOnly.toLowerCase().includes('orlando') || cityOnly.toLowerCase().includes('jacksonville')) {
          extractedState = 'FL';
        } else if (cityOnly.toLowerCase().includes('shelby')) {
          extractedState = 'NC';
        } else if (cityOnly.toLowerCase().includes('lake mary')) {
          extractedState = 'FL';
        }
      }
    }
  }
  
  if (extractedCity && extractedState) {
    return { city: extractedCity, state: extractedState };
  }
  if (extractedState) {
    return { city: null, state: extractedState };
  }
  if (extractedCity && !isBadLocation(extractedCity)) {
    return { city: extractedCity, state: null };
  }
  
  return null;
};

export { extractVenueHint };
export default { fetchDeals, fetchPerson, transformDealToLead, FIELD_KEYS, extractVenueHint };
