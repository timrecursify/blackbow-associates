import axios from 'axios';
import logger from '../utils/logger.js';
import { generateLeadId } from '../utils/leadIdGeneratorV2.js';
import * as pipedriveMetadata from './pipedrive-metadata.service.js';

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
 * Transform Pipedrive deal to our Lead model
 */
export const transformDealToLead = async (deal) => {
  try {
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
const extractCityFromComments = (comments) => {
  if (!comments) return null;
  
  const match = comments.match(/Venue Location:\s*([^,\n]+)/i);
  return match ? match[1].trim() : null;
};

/**
 * Build location string
 */
const buildLocationString = (city, state, comments) => {
  if (city && state) return `${city}, ${state}`;
  if (state) return state;
  if (city) return city;
  
  // Try to extract from comments
  const venueMatch = comments?.match(/Venue Location:\s*([^\n]+)/i);
  if (venueMatch) return venueMatch[1].trim();
  
  return null;
};

/**
 * Fetch deals by stage IDs
 */
export const fetchDealsByStages = async (stageIds, sinceDate = null) => {
  try {
    const allDeals = await fetchDeals({ limit: 500 });

    if (!allDeals.success || !allDeals.data) {
      throw new Error('Failed to fetch deals from Pipedrive');
    }

    // Filter by stage IDs
    let filtered = allDeals.data.filter(deal => stageIds.includes(deal.stage_id));

    // Filter by date if provided
    if (sinceDate) {
      filtered = filtered.filter(deal => {
        const addTime = deal.add_time?.split(' ')[0];
        return addTime >= sinceDate;
      });
    }

    logger.info(`Fetched ${filtered.length} deals from stages ${stageIds.join(', ')}`);
    return filtered;
  } catch (error) {
    logger.error('Error fetching deals by stages:', error);
    throw error;
  }
};

/**
 * Fetch eligible deals for automated sync
 *
 * Criteria:
 * - Any status (open, closed, lost)
 * - NOT in "Production" pipeline
 * - NOT in specific stages: "Lead In", "In Contact", "Quote Sent", "Quote Accepted", "Invoice sent" (Lorena & Maureen pipelines)
 * - Created between 3 days and 2 months ago (add_time)
 */
export const fetchEligibleDeals = async () => {
  try {
    logger.info('Fetching eligible deals for sync');

    // Calculate date range (3 days to 2 months old)
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(now.getMonth() - 2);

    // Format dates for Pipedrive API (YYYY-MM-DD)
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];

    logger.info('Date range for eligible deals', {
      from: twoMonthsAgoStr,
      to: threeDaysAgoStr
    });

    // Fetch exclusion lists
    const excludedPipelineIds = await pipedriveMetadata.getExcludedPipelineIds();
    const excludedStageIds = await pipedriveMetadata.getExcludedStageIds();

    logger.info('Exclusion filters', {
      excludedPipelines: excludedPipelineIds,
      excludedStages: excludedStageIds
    });

    // Fetch ALL deals with pagination, sorted by add_time descending (most recent first)
    // This is more efficient - we can stop once we go past the 2-month window
    logger.info('Fetching all deals from Pipedrive (this may take a minute for large datasets)...');
    const response = await fetchDeals({
      status: 'all',
      sort: 'add_time DESC' // Sort by creation date, newest first
    }, true); // fetchAll = true

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch deals from Pipedrive');
    }

    const allDeals = response.data;
    logger.info(`Fetched ${allDeals.length} total deals from Pipedrive`);

    // Filter deals by criteria
    const eligibleDeals = [];
    let countNoAddTime = 0;
    let countTooOld = 0;
    let countTooNew = 0;
    let countProductionPipeline = 0;
    let countExcludedStage = 0;

    for (const deal of allDeals) {
      // 1. Check if deal has add_time
      if (!deal.add_time) {
        countNoAddTime++;
        continue;
      }

      // 2. Parse add_time (format: "YYYY-MM-DD HH:MM:SS")
      const dealAddTime = new Date(deal.add_time.split(' ')[0]);

      // 3. Check if too new (< 3 days old)
      if (dealAddTime > threeDaysAgo) {
        countTooNew++;
        continue;
      }

      // 4. Check if too old (> 2 months old)
      // Since sorted by add_time DESC, once we hit deals older than 2 months, we can stop
      if (dealAddTime < twoMonthsAgo) {
        countTooOld++;
        // Early exit optimization: all remaining deals will also be too old
        logger.debug(`Reached deals older than 2 months, stopping filter loop`);
        break;
      }

      // 5. Exclude deals in "Production" pipeline
      if (excludedPipelineIds.includes(deal.pipeline_id)) {
        countProductionPipeline++;
        continue;
      }

      // 6. Exclude deals in specific stages (Lorena & Maureen pipelines)
      if (excludedStageIds.includes(deal.stage_id)) {
        countExcludedStage++;
        continue;
      }

      // Deal passed all filters
      eligibleDeals.push(deal);
    }

    logger.info('Eligible deals filtered', {
      totalFetched: allDeals.length,
      eligible: eligibleDeals.length,
      filtered: {
        noAddTime: countNoAddTime,
        tooNew: countTooNew,
        tooOld: countTooOld,
        productionPipeline: countProductionPipeline,
        excludedStage: countExcludedStage
      }
    });

    return eligibleDeals;
  } catch (error) {
    logger.error('Error fetching eligible deals:', error.message);
    throw error;
  }
};

export default {
  fetchDeals,
  fetchPerson,
  transformDealToLead,
  fetchDealsByStages,
  fetchEligibleDeals
};
