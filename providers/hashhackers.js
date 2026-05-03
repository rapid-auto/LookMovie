/**
 * Hashhackers - Pure Promise Version (with Cloudflare Bypass)
 */

var IOS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8"
};

function fetchJson(url, options) {
    console.log("[Hashhackers] Fetching: " + url);
    return fetch(url, options || {}).then(function(res) {
        if (!res.ok) {
            console.error("[Hashhackers] HTTP Error: " + res.status + " for " + url);
            throw new Error("HTTP " + res.status);
        }
        return res.json();
    }).catch(function(err) {
        console.error("[Hashhackers] Fetch Failed: " + err.message);
        throw err;
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
    console.log("[Hashhackers] getStreams called for: " + tmdbId + " | Type: " + mediaType);
    if (mediaType !== 'movie') return Promise.resolve([]);

    // 1. Get TMDB info (NOW WITH HEADERS TO BYPASS CLOUDFLARE)
    return fetchJson("https://tmdb.vidsrc.wtf/tmdb/3/movie/" + tmdbId, { headers: IOS_HEADERS })
        .then(function(tmdbData) {
            console.log("[Hashhackers] TMDB Success: " + tmdbData.title);
            var title = tmdbData.title;
            var year = tmdbData.release_date ? tmdbData.release_date.split('-')[0] : '';
            var query = encodeURIComponent((title + " " + year).trim());

            // 2. Get Token from Vercel
            return fetchJson("https://multi-source-two.vercel.app/api/token")
                .then(function(tokenData) {
                    console.log("[Hashhackers] Token Fetched Successfully");
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

                    var searchUrl = "https://tga-hd.api.hashhackers.com/mix_media_files/search?q=" + query + "&page=1";
                    
                    // 3. Search Hashhackers
                    return fetchJson(searchUrl, { headers: HASH_HEADERS })
                        .then(function(searchData) {
                            var files = searchData.files || [];
                            console.log("[Hashhackers] Search Results Found: " + files.length);
                            if (files.length === 0) return [];

                            var topFiles = files.slice(0, 5);
                            var streamPromises = topFiles.map(function(file) {
                                
                                // 4. Generate Links
                                return fetchJson("https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=" + file.id, { headers: HASH_HEADERS })
                                    .then(function(linkData) {
                                        if (linkData.success && linkData.url) {
                                            console.log("[Hashhackers] Link Generated!");
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
                                    }).catch(function() { return null; });
                            });

                            return Promise.all(streamPromises).then(function(results) {
                                var finalStreams = results.filter(function(r) { return r !== null; });
                                console.log("[Hashhackers] Final Streams Sent to App: " + finalStreams.length);
                                return finalStreams;
                            });
                        });
                });
        }).catch(function(error) {
            console.error("[Hashhackers] Master Catch Error: " + error.message);
            return [];
        });
}

module.exports = { getStreams: getStreams };
