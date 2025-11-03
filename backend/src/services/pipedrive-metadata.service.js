import axios from 'axios';
import logger from '../utils/logger.js';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Cache for metadata (1 hour TTL)
let metadataCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch all pipelines from Pipedrive
 */
export const fetchPipelines = async () => {
  try {
    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/pipelines`, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN
      }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch pipelines from Pipedrive');
    }

    logger.info(`Fetched ${response.data.data.length} pipelines from Pipedrive`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching pipelines from Pipedrive:', error.message);
    throw error;
  }
};

/**
 * Fetch all stages from Pipedrive
 */
export const fetchStages = async () => {
  try {
    const response = await axios.get(`${PIPEDRIVE_BASE_URL}/stages`, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN
      }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch stages from Pipedrive');
    }

    logger.info(`Fetched ${response.data.data.length} stages from Pipedrive`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching stages from Pipedrive:', error.message);
    throw error;
  }
};

/**
 * Build exclusion map of pipeline/stage names to IDs
 *
 * Exclusion criteria:
 * - Pipeline: "Production"
 * - Stages in "Lauren" and "Maureen" pipelines:
 *   - "Lead In"
 *   - "In Contact"
 *   - "Quote Sent"
 *   - "Quote Accepted"
 *   - "Invoice sent"
 */
export const buildExclusionMap = async () => {
  try {
    const pipelines = await fetchPipelines();
    const stages = await fetchStages();

    const exclusionMap = {
      excludedPipelineIds: [],
      excludedStageIds: [],
      pipelineNames: {},
      stageNames: {}
    };

    // Build pipeline name map
    for (const pipeline of pipelines) {
      exclusionMap.pipelineNames[pipeline.id] = pipeline.name;

      // Exclude "Production" pipeline
      if (pipeline.name.toLowerCase().includes('production')) {
        exclusionMap.excludedPipelineIds.push(pipeline.id);
        logger.info(`Excluding pipeline: ${pipeline.name} (ID: ${pipeline.id})`);
      }
    }

    // Find "Lorena" and "Maureen" pipeline IDs
    const lorenaPipeline = pipelines.find(p => p.name.toLowerCase().includes('loren')); // Matches both "Lorena" and "Lauren"
    const maureenPipeline = pipelines.find(p => p.name.toLowerCase().includes('maureen'));

    const targetPipelineIds = [];
    if (lorenaPipeline) {
      targetPipelineIds.push(lorenaPipeline.id);
      logger.info(`Found Lorena pipeline (ID: ${lorenaPipeline.id})`);
    }
    if (maureenPipeline) {
      targetPipelineIds.push(maureenPipeline.id);
      logger.info(`Found Maureen pipeline (ID: ${maureenPipeline.id})`);
    }

    // Excluded stage names (case-insensitive matching)
    const excludedStageNames = [
      'lead in',
      'in contact',
      'quote sent',
      'quote accepted',
      'invoice sent'
    ];

    // Build stage name map and find excluded stages
    for (const stage of stages) {
      exclusionMap.stageNames[stage.id] = stage.name;

      // Check if stage is in Lauren or Maureen pipelines
      if (targetPipelineIds.includes(stage.pipeline_id)) {
        const stageName = stage.name.toLowerCase();

        // Check if stage name matches any excluded stage name
        if (excludedStageNames.some(excluded => stageName.includes(excluded))) {
          exclusionMap.excludedStageIds.push(stage.id);
          logger.info(`Excluding stage: ${stage.name} (ID: ${stage.id}, Pipeline: ${exclusionMap.pipelineNames[stage.pipeline_id]})`);
        }
      }
    }

    // Log summary
    logger.info('Exclusion map built', {
      excludedPipelines: exclusionMap.excludedPipelineIds.length,
      excludedStages: exclusionMap.excludedStageIds.length
    });

    return exclusionMap;
  } catch (error) {
    logger.error('Error building exclusion map:', error.message);
    throw error;
  }
};

/**
 * Get excluded stage IDs (uses cache if available)
 */
export const getExcludedStageIds = async () => {
  try {
    // Check cache validity
    const now = Date.now();
    if (metadataCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
      logger.debug('Using cached exclusion map');
      return metadataCache.excludedStageIds;
    }

    // Fetch and cache new metadata
    logger.info('Fetching fresh exclusion map from Pipedrive');
    metadataCache = await buildExclusionMap();
    cacheTimestamp = now;

    return metadataCache.excludedStageIds;
  } catch (error) {
    logger.error('Error getting excluded stage IDs:', error.message);
    throw error;
  }
};

/**
 * Get excluded pipeline IDs (uses cache if available)
 */
export const getExcludedPipelineIds = async () => {
  try {
    // Check cache validity
    const now = Date.now();
    if (metadataCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
      logger.debug('Using cached exclusion map');
      return metadataCache.excludedPipelineIds;
    }

    // Fetch and cache new metadata
    logger.info('Fetching fresh exclusion map from Pipedrive');
    metadataCache = await buildExclusionMap();
    cacheTimestamp = now;

    return metadataCache.excludedPipelineIds;
  } catch (error) {
    logger.error('Error getting excluded pipeline IDs:', error.message);
    throw error;
  }
};

/**
 * Clear metadata cache (useful for testing or manual refresh)
 */
export const clearCache = () => {
  metadataCache = null;
  cacheTimestamp = null;
  logger.info('Metadata cache cleared');
};

export default {
  fetchPipelines,
  fetchStages,
  buildExclusionMap,
  getExcludedStageIds,
  getExcludedPipelineIds,
  clearCache
};
