/**
 * Extractor Logic
 * Finds base domains, retrieves titles, and extracts final .m3u8 files.
 */

import { getHeaders, safeFetchText, safeFetchJson, USER_AGENT } from './http.js';

let cachedBaseUrl = null;
let cachedStreamBaseUrl = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600 * 1000;

async function getBaseUrls() {
    if (cachedBaseUrl && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return { baseUrl: cachedBaseUrl, streamBaseUrl: cachedStreamBaseUrl };
    }
    try {
        const html = await safeFetchText("https://netmirror.gg/2/en", {
            headers: { "User-Agent": USER_AGENT, "Accept": "text/html" }
        });
        const match = html.match(/onclick="location\.href='([^']+)'"[^>]*>Go to Home/);
        
        if (match && match[1]) {
            const parsedUrl = new URL(match[1]);
            cachedBaseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
            const numMatch = cachedBaseUrl.match(/net(\d+)\.cc/);
            if (numMatch) {
                cachedStreamBaseUrl = cachedBaseUrl.replace(parseInt(numMatch[1]), parseInt(numMatch[1]) + 30);
            }
        }
        cacheTimestamp = Date.now();
    } catch (e) {
        console.error("[Extractor] Init Error:", e);
    }
    return { 
        baseUrl: cachedBaseUrl || "https://net22.cc", 
        streamBaseUrl: cachedStreamBaseUrl || "https://net52.cc"
    };
}

async function fetchServer1(title, baseUrl, streamBaseUrl) {
    const streams = [];
    const timestamp = Math.floor(Date.now() / 1000);

    try {
        const searchUrl = `${baseUrl}/search.php?s=${encodeURIComponent(title)}&t=${timestamp}`;
        const searchHeaders = getHeaders(searchUrl, '/home', 'nf');
        const searchData = await safeFetchJson(searchUrl, { headers: searchHeaders });
        
        if (!searchData.searchResult || searchData.searchResult.length === 0) return streams;
        const movieId = searchData.searchResult[0].id;

        const hashUrl = `${baseUrl}/play.php`;
        const hashData = await safeFetchJson(hashUrl, {
            method: 'POST',
            headers: { ...searchHeaders, "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: `id=${movieId}`
        });
        if (!hashData.h) return streams;

        const actualHash = hashData.h.startsWith("in=") ? hashData.h.substring(3) : hashData.h;

        const playlistUrl = `${streamBaseUrl}/playlist.php?id=${movieId}&t=${encodeURIComponent(title)}&tm=${timestamp}&h=${actualHash}`;
        const playlistHeaders = getHeaders(playlistUrl, '/', 'nf'); 
        const playlistData = await safeFetchJson(playlistUrl, { headers: playlistHeaders });
        
        playlistData.forEach(item => {
            if (item.sources) {
                item.sources.forEach(source => {
                    streams.push({
                        name: "NetMirror [S1]",
                        title: `Netflix Server - ${source.label || 'HD'}`,
                        url: `${streamBaseUrl}${source.file}`,
                        quality: source.label || "1080p",
                        headers: {
                            "Referer": `${streamBaseUrl}/`,
                            "Origin": streamBaseUrl,
                            "User-Agent": USER_AGENT
                        }
                    });
                });
            }
        });
    } catch (e) {
        console.error(`[S1 Error]: ${e.message}`);
    }
    return streams;
}

async function fetchServer2(title, streamBaseUrl) {
    const streams = [];
    const timestamp = Math.floor(Date.now() / 1000);
    
    try {
        const searchUrl = `${streamBaseUrl}/pv/search.php?s=${encodeURIComponent(title)}`;
        const s2Headers = getHeaders(searchUrl, '/search', 'pv');
        const searchData = await safeFetchJson(searchUrl, { headers: s2Headers });
        
        if (!searchData.searchResult || searchData.searchResult.length === 0) return streams;
        const movieId = searchData.searchResult[0].id;

        const playlistUrl = `${streamBaseUrl}/pv/playlist.php?id=${movieId}&tm=${timestamp}`;
        const playlistData = await safeFetchJson(playlistUrl, { headers: s2Headers });
        
        playlistData.forEach(item => {
            if (item.sources) {
                item.sources.forEach(source => {
                    streams.push({
                        name: "NetMirror [S2]",
                        title: `Prime Server - ${source.label || 'HD'}`,
                        url: `${streamBaseUrl}${source.file}`,
                        quality: source.label || "1080p",
                        headers: {
                            "Referer": `${streamBaseUrl}/`,
                            "Origin": streamBaseUrl,
                            "User-Agent": USER_AGENT
                        }
                    });
                });
            }
        });
    } catch (e) {
        console.error(`[S2 Error]: ${e.message}`);
    }
    return streams;
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
    if (mediaType !== 'movie') return [];

    let title = "";
    try {
        const res = await fetch(`https://v3-cinemeta.strem.io/meta/movie/tmdb:${tmdbId}.json`);
        const data = await res.json();
        title = data.meta ? data.meta.name : "";
    } catch (e) {
        console.error("[Extractor] Title fetch error:", e);
    }
    
    if (!title) return [];

    const { baseUrl, streamBaseUrl } = await getBaseUrls();

    const [streamsS1, streamsS2] = await Promise.all([
        fetchServer1(title, baseUrl, streamBaseUrl),
        fetchServer2(title, streamBaseUrl)
    ]);

    return [...streamsS1, ...streamsS2];
}
