/**
 * HTTP Utilities for LookMovie2
 */

export const COMMON_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Site": "same-origin",
    "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Fetch-Mode": "cors",
    "Accept": "*/*",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Connection": "keep-alive",
    "Referer": "https://www.lookmovie2.to/",
    "Sec-Fetch-Dest": "empty"
};

export async function fetchText(url, options = {}) {
    console.log(`[LookMovie2] Fetching: ${url}`);
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return await response.text();
}

export async function fetchJson(url, options = {}) {
    const raw = await fetchText(url, options);
    return JSON.parse(raw);
}
