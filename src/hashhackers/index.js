import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        console.log(`[Hashhackers] Request: ${mediaType} ${tmdbId}`);
        const streams = await extractStreams(tmdbId, mediaType, season, episode);
        return streams;
    } catch (error) {
        console.error(`[Hashhackers] Error: ${error.message}`);
        return [];
    }
}

// CRITICAL: Must use module.exports for the Nuvio build system
module.exports = { getStreams };
