import axios from 'axios';
import logger from '../utils/logger.js';
import { generateLeadId } from '../utils/leadIdGeneratorV2.js';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Field key mappings from Pipedrive
const FIELD_KEYS = {
  // Deal fields
  weddingDate: '48d02678bc42b89d4899408183ca63194a968a2f',
  city: 'bb1b06f9856098ab1fff967789d2a34cf8c32071',
  state: 'ab8da96fa06f5bba3ed7a744abd1808bca457c2a',
  description: '3edd86479b253c3d1974945fead02517ec2cce2c',
  ethnicReligious: '137b84c97a24ee17c40306b80ad3ec87ad8b4057',
  comments: 'a81743f0fbba22cfbe4af307bdba520923dd6d4f',
  
  // Person fields
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
  conversionPageUrl: 'a5fda325cf12108a3156d8572d3e5df1b1157c8f'
};

/**
 * Fetch deals from Pipedrive with pagination support
 * @param {Object} params - Query parameters
 * @param {boolean} fetchAll - If true, fetches all deals using pagination (default: false)
 * @returns {Object} Response data with deals array
 */
export const fetchDeals = async (params = {}, fetchAll = false) => {
  try {
    const allDeals = [];
    let start = params.start || 0;
    const limit = Math.min(params.limit || 500, 500); // Max 500 per request
    let hasMore = true;

    // If fetchAll is true, paginate through all results
    if (fetchAll) {
      while (hasMore) {
        const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            status: params.status || 'all',
            limit,
            start,
            ...params
          }
        });

        if (response.data.success && response.data.data) {
          allDeals.push(...response.data.data);

          // Check if there are more results
          const pagination = response.data.additional_data?.pagination;
          if (pagination && pagination.more_items_in_collection) {
            start += limit;
            logger.debug(`Fetched ${allDeals.length} deals so far, fetching more...`);
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      logger.info(`Fetched total of ${allDeals.length} deals from Pipedrive`);
      return {
        success: true,
        data: allDeals,
        additional_data: {
          pagination: {
            more_items_in_collection: false,
            start: 0,
            limit: allDeals.length
          }
        }
      };
    }

    // Single request (original behavior)
    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN,
        status: params.status || 'open',
        limit,
        start,
        ...params
      }
    });

    return response.data;
  } catch (error) {
    logger.error('Error fetching deals from Pipedrive:', error);
    throw error;
  }
};

/**
 * Fetch person details from Pipedrive
 */
export const fetchPerson = async (personId) => {
  try {
    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/persons/${personId}`, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN
      }
    });

    return response.data.data;
  } catch (error) {
    logger.error(`Error fetching person ${personId} from Pipedrive:`, error);
    throw error;
  }
};

/**
 * Normalize Pipedrive deal data to handle both API and Webhook v2 formats
 * API format: deal[fieldKey] = value
 * Webhook v2: deal.custom_fields[fieldKey] = { type: "varchar", value: "actualValue" }
 */
const normalizePipedriveDeal = (deal) => {
  if (!deal) return deal;
  
  // If custom_fields exists (webhook v2 format), flatten it
  if (deal.custom_fields && typeof deal.custom_fields === "object") {
    const normalized = { ...deal };
    
    for (const [key, fieldData] of Object.entries(deal.custom_fields)) {
      if (fieldData === null || fieldData === undefined) {
        normalized[key] = null;
      } else if (typeof fieldData === "object" && "value" in fieldData) {
        normalized[key] = fieldData.value;
      } else if (typeof fieldData === "object" && "id" in fieldData && "type" in fieldData) {
        normalized[key] = fieldData;
      } else {
        normalized[key] = fieldData;
      }
    }
    
    logger.debug("Normalized Pipedrive deal from webhook v2 format", {
      dealId: deal.id,
      customFieldsCount: Object.keys(deal.custom_fields).length
    });
    
    return normalized;
  }
  
  return deal;
};

/**
 * Transform Pipedrive deal to our Lead model
 */
export const transformDealToLead = async (deal) => {
  try {
    // Normalize deal to handle both API and Webhook v2 formats
    deal = normalizePipedriveDeal(deal);

    // Fetch person data if person_id exists
    let person = null;
    if (deal.person_id && typeof deal.person_id === 'object') {
      person = deal.person_id;
    } else if (deal.person_id) {
      person = await fetchPerson(deal.person_id);
    }

    // Extract location from comments or title
    const comments = deal[FIELD_KEYS.comments] || '';
    const title = deal.title || '';
    
    // Parse services from description
    const description = deal[FIELD_KEYS.description] || '';
    const servicesNeeded = parseServicesFromDescription(description);
    
    // Extract state from title (format: "MM/DD/YY | Name | W/Location")
    const stateFromTitle = extractStateFromTitle(title);
    
    // Build location string
    const city = deal[FIELD_KEYS.city] || extractCityFromComments(comments);
    const state = deal[FIELD_KEYS.state] || stateFromTitle;
    const location = buildLocationString(city, state, comments);

    // Generate new ID based on state and city
    const leadId = generateLeadId(state, city);

    // Transform to our Lead model
    const lead = {
      id: leadId,
      pipedriveDealId: deal.id,
      
      // Deal fields
      weddingDate: deal[FIELD_KEYS.weddingDate] ? new Date(deal[FIELD_KEYS.weddingDate]) : null,
      city: city || null,
      state: state || null,
      location: location || 'Location TBD',
      description: description || null,
      ethnicReligious: deal[FIELD_KEYS.ethnicReligious] || null,
      
      // Person fields (hidden until purchase)
      firstName: person?.first_name || null,
      lastName: person?.last_name || null,
      personName: person?.name || null,
      email: person?.email?.[0]?.value || null,
      phone: person?.phone?.[0]?.value || null,
      
      // Marketing fields
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
      
      // Legacy fields
      servicesNeeded: servicesNeeded,
      budgetMax: deal.value || 2000,
      
      // Marketplace fields
      price: 20.00, // Default price
      status: 'AVAILABLE',
      active: true,
      
      // Legacy JSON fields (for backward compatibility)
      maskedInfo: {
        weddingDate: deal[FIELD_KEYS.weddingDate] || null,
        location: location,
        servicesNeeded: servicesNeeded
      },
      fullInfo: {
        coupleName: person?.name || 'N/A',
        email: person?.email?.[0]?.value || 'N/A',
        phone: person?.phone?.[0]?.value || 'N/A',
        notes: comments || ''
      }
    };

    return lead;
  } catch (error) {
    logger.error('Error transforming deal to lead:', error);
    throw error;
  }
};

/**
 * Parse services from description text
 */
const parseServicesFromDescription = (description) => {
  if (!description) return [];
  
  const services = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('photography')) services.push('Photography');
  if (lowerDesc.includes('videography') || lowerDesc.includes('video')) services.push('Videography');
  if (lowerDesc.includes('drone')) services.push('Drone');
  if (lowerDesc.includes('multi-day')) services.push('Multi-Day');
  if (lowerDesc.includes('raw')) services.push('RAW Files');
  
  return services.length > 0 ? services : ['Photography'];
};

/**
 * Extract state from title (format: "MM/DD/YY | Name | W/Location")
 */
const extractStateFromTitle = (title) => {
  if (!title) return null;
  
  const parts = title.split('|');
  if (parts.length < 3) return null;
  
  const locationPart = parts[2].trim();
  
  // Common state abbreviations
  const stateMap = {
    'FL': 'Florida', 'NY': 'New York', 'NJ': 'New Jersey', 'PA': 'Pennsylvania',
    'MA': 'Massachusetts', 'CT': 'Connecticut', 'NH': 'New Hampshire',
    'MD': 'Maryland', 'VA': 'Virginia', 'DC': 'District of Columbia',
    'CA': 'California', 'TX': 'Texas', 'IL': 'Illinois'
  };
  
  // Extract state abbreviation
  for (const [abbr, fullName] of Object.entries(stateMap)) {
    if (locationPart.includes(abbr)) {
      return abbr;
    }
  }
  
  return null;
};

/**
 * Extract city from comments
 */


/**
 * Build location string
 */
const buildLocationString = (city, state, comments) => {
  // First priority: Extract full venue location from comments (handles metro areas)
  const venueMatch = comments?.match(/Venue Location:\s*([^\n]+)/i);
  if (venueMatch) {
    const venueLocation = venueMatch[1].trim();
    // If we have a full venue location, use it directly (don't append state)
    return venueLocation;
  }
  
  // Second priority: If city contains commas (metro area), don't append state
  if (city && city.includes(',')) {
    return city;
  }
  
  // Third priority: Build from city + state
  if (city && state) {
    // Check if city already contains the state abbreviation to avoid duplication
    const stateRegex = new RegExp(`\\b${state}\\b`, 'i');
    if (stateRegex.test(city)) {
      return city; // City already contains state, don't append
    }
    return `${city}, ${state}`;
  }
  
  if (state) return state;
  if (city) return city;
  
  return null;
};


const extractCityFromComments = (comments) => {
  if (!comments) return null;
  
  const match = comments.match(/Venue Location:\s*([^\n]+)/i);
  if (!match) return null;
  
  const venueLocation = match[1].trim();
  
  // Parse city from location string
  const parts = venueLocation.split(",").map(p => p.trim());
  
  // If last part is a 2-letter state code, second-to-last is likely the city
  if (parts.length >= 2 && parts[parts.length - 1].length === 2) {
    const city = parts[parts.length - 2];
    // Skip generic terms like "Other Destinations", "Metro", etc.
    const skipTerms = ["other destinations", "metro", "destinations", "area", "region"];
    if (!skipTerms.some(term => city.toLowerCase().includes(term))) {
      return city;
    }
  }
  
  // If only 2 parts and second is state, first is city
  if (parts.length === 2 && parts[1].length === 2) {
    return parts[0];
  }
  
  // For metro areas, return null
  if (venueLocation.toLowerCase().includes("metro") || parts.length > 3) {
    return null;
  }
  
  // Fallback
  if (parts.length > 0 && parts[0].length > 2 && !parts[0].toLowerCase().includes("other")) {
    return parts[0];
  }
  
  return null;
};
export default {
  fetchDeals,
  fetchPerson,
  transformDealToLead,
  FIELD_KEYS
};
