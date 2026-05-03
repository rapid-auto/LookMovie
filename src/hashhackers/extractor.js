import { fetchJson } from './http.js';

export async function extractStreams(tmdbId, mediaType) {
    if (mediaType !== 'movie') return [];

    try {
        // 1. Convert TMDB ID to Title & Year
        const tmdbData = await fetchJson(`https://tmdb.vidsrc.wtf/tmdb/3/movie/${tmdbId}`);
        const title = tmdbData.title;
        const year = tmdbData.release_date ? tmdbData.release_date.split('-')[0] : '';
        const query = encodeURIComponent(`${title} ${year}`.trim());

        // 2. Fetch the Token from your Vercel App
        // REPLACE THIS WITH YOUR NEW VERCEL URL IF IT CHANGED
        const tokenData = await fetchJson(`https://hashhackers.vercel.app/api/token`);
        const token = tokenData.token;
        if (!token) return [];

        // Exact Safari headers sniffed from your iPhone
        const HASH_HEADERS = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1",
            "Accept": "*/*",
            "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
            "Authorization": `Bearer ${token}`, 
            "Origin": "https://bollywood.eu.org",
            "Referer": "https://bollywood.eu.org/"
        };

        // 3. Search Hashhackers
        const searchData = await fetchJson(`https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`, {
            headers: HASH_HEADERS
        });
        
        const files = searchData.files || [];
        if (files.length === 0) return [];

        // 4. Limit to top 5 files to prevent Hermes engine timeout
        const topFiles = files.slice(0, 5);
        const streams = [];

        // 5. Generate Direct Links Concurrently
        await Promise.all(topFiles.map(async (file) => {
            try {
                const linkData = await fetchJson(`https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`, {
                   headers: HASH_HEADERS
                });
                
                if (linkData.success && linkData.url) {
                    let quality = "Auto";
                    const fn = file.file_name.toLowerCase();
                    if (fn.includes("2160p") || fn.includes("4k")) quality = "4K";
                    else if (fn.includes("1080p")) quality = "1080p";
                    else if (fn.includes("720p")) quality = "720p";

                    streams.push({
                        name: "Hashhackers",
                        title: file.file_name.substring(0, 35) + "...", 
                        url: linkData.url,
                        quality: quality
                    });
                }
            } catch (e) {
                console.error("Link Gen Error for ID", file.id, e);
            }
        }));

        return streams;
    } catch (error) {
        console.error("Hashhackers Extractor Error:", error);
        return [];
    }
}
