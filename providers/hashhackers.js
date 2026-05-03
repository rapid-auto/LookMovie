/**
 * hashhackers - Built from src/hashhackers/
 * Generated: 2026-05-03T20:58:04.715Z
 */
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/hashhackers/http.js
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return yield response.json();
  });
}

// src/hashhackers/extractor.js
function extractStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType !== "movie") return [];
    try {
      const tmdbData = yield fetchJson(`https://tmdb.vidsrc.wtf/tmdb/3/movie/${tmdbId}`);
      const title = tmdbData.title;
      const year = tmdbData.release_date ? tmdbData.release_date.split("-")[0] : "";
      const query = encodeURIComponent(`${title} ${year}`.trim());
      const tokenData = yield fetchJson(`https://hashhackers.vercel.app/api/token`);
      const token = tokenData.token;
      if (!token) return [];
      const HASH_HEADERS = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1",
        "Accept": "*/*",
        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
        "Authorization": `Bearer ${token}`,
        "Origin": "https://bollywood.eu.org",
        "Referer": "https://bollywood.eu.org/"
      };
      const searchData = yield fetchJson(`https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`, {
        headers: HASH_HEADERS
      });
      const files = searchData.files || [];
      if (files.length === 0) return [];
      const topFiles = files.slice(0, 5);
      const streams = [];
      yield Promise.all(topFiles.map((file) => __async(null, null, function* () {
        try {
          const linkData = yield fetchJson(`https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`, {
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
              quality
            });
          }
        } catch (e) {
          console.error("Link Gen Error for ID", file.id, e);
        }
      })));
      return streams;
    } catch (error) {
      console.error("Hashhackers Extractor Error:", error);
      return [];
    }
  });
}

// src/hashhackers/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[Hashhackers] Request: ${mediaType} ${tmdbId}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      console.error(`[Hashhackers] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
