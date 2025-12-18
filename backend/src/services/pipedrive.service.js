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

const BAD_LOCATION_TERMS = ['other destinations', 'other destination', 'location tbd', 'tbd', 'metro', 'destinations'];
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

const toStateAbbr = (state) => {
  if (!state) return null;
  const s = state.trim();
  if (s.length === 2) return s.toUpperCase();
  return STATE_ABBR[s.toLowerCase()] || s;
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
    const description = deal[FIELD_KEYS.description] || '';
    const servicesNeeded = parseServicesFromDescription(description);
    
    let city = deal[FIELD_KEYS.city] || extractCityFromComments(comments);
    let state = deal[FIELD_KEYS.state] || extractStateFromTitle(title);
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
        
        if (visitorCity) city = visitorCity;
        if (visitorLocation) state = toStateAbbr(visitorLocation);
        
        if (city && state) {
          location = `${city}, ${state}`;
        } else if (city) {
          location = city;
        } else if (state) {
          location = state;
        }
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

export default { fetchDeals, fetchPerson, transformDealToLead, FIELD_KEYS };
