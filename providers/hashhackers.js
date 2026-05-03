/**
 * Hashhackers - Pure Promise Version
 * Bypasses the need for Nuvio's build.js transpiler
 */

function fetchJson(url, options) {
    return fetch(url, options || {}).then(function(res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
    if (mediaType !== 'movie') return Promise.resolve([]);

    console.log("[Hashhackers] Starting search for TMDB: " + tmdbId);

    // 1. Get TMDB info
    return fetchJson("https://tmdb.vidsrc.wtf/tmdb/3/movie/" + tmdbId)
        .then(function(tmdbData) {
            var title = tmdbData.title;
            var year = tmdbData.release_date ? tmdbData.release_date.split('-')[0] : '';
            var query = encodeURIComponent((title + " " + year).trim());

            // 2. Get Token from Vercel
            return fetchJson("https://hashhackers.vercel.app/api/token")
                .then(function(tokenData) {
                    var token = tokenData.token;
                    if (!token) return [];

                    var HASH_HEADERS = {
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1",
                        "Accept": "*/*",
                        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
                        "Authorization": "Bearer " + token,
                        "Origin": "https://bollywood.eu.org",
                        "Referer": "https://bollywood.eu.org/"
                    };

                    // 3. Search Hashhackers
                    return fetchJson("https://tga-hd.api.hashhackers.com/mix_media_files/search?q=" + query + "&page=1", { headers: HASH_HEADERS })
                        .then(function(searchData) {
                            var files = searchData.files || [];
                            if (files.length === 0) return [];

                            var topFiles = files.slice(0, 5);
                            var streamPromises = topFiles.map(function(file) {
                                
                                // 4. Generate Links
                                return fetchJson("https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=" + file.id, { headers: HASH_HEADERS })
                                    .then(function(linkData) {
                                        if (linkData.success && linkData.url) {
                                            var quality = "Auto";
                                            var fn = file.file_name.toLowerCase();
                                            if (fn.includes("2160p") || fn.includes("4k")) quality = "4K";
                                            else if (fn.includes("1080p")) quality = "1080p";
                                            else if (fn.includes("720p")) quality = "720p";

                                            return {
                                                name: "Hashhackers",
                                                title: file.file_name.substring(0, 35) + "...",
                                                url: linkData.url,
                                                quality: quality
                                            };
                                        }
                                        return null;
                                    }).catch(function(e) {
                                        return null;
                                    });
                            });

                            return Promise.all(streamPromises).then(function(results) {
                                return results.filter(function(r) { return r !== null; });
                            });
                        });
                });
        }).catch(function(error) {
            console.error("[Hashhackers] Error: ", error);
            return [];
        });
}

// Ensure Nuvio can read it
module.exports = { getStreams: getStreams };
