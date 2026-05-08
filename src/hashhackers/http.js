/**
 * HTTP Utilities
 * Handles WAF bypass, dynamic cookies, and secure fetching.
 */

export const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1";

/**
 * Automatically generates fresh, slightly randomized tokens with the current timestamp
 * to bypass IP-locking and session expiration.
 */
function generateSpoofedCookies() {
    const now = Math.floor(Date.now() / 1000);
    
    const mutateHex = (hexStr) => {
        let chars = hexStr.split('');
        for(let i = chars.length - 4; i < chars.length; i++) {
            chars[i] = Math.floor(Math.random() * 16).toString(16);
        }
        return chars.join('');
    };

    let baseUserToken = "70616185895ea8507acfe05437a9d4fc";
    let baseHash1 = "779fc597851aa6b05d46d86583ef647d";
    let baseHash2 = "5185938f776f1b181082230868049087";
    let baseHash3 = "a478b84982c0b0920a91838c5df6c5f4";

    let userToken = mutateHex(baseUserToken);
    let tHash = `${mutateHex(baseHash3)}::${now}::ac`;
    let tHashT = `${mutateHex(baseHash1)}::${mutateHex(baseHash2)}::${now}::ac::p`;

    return `t_hash_t=${encodeURIComponent(tHashT)}; t_hash=${encodeURIComponent(tHash)}; user_token=${userToken}`;
}

/**
 * Generates perfectly matching browser headers for the specific domain
 */
export function getHeaders(targetUrl, refererPath, ottTag) {
    const urlObj = new URL(targetUrl);
    const dynamicCookies = generateSpoofedCookies();
    
    return {
        "User-Agent": USER_AGENT, 
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate", 
        "Referer": `${urlObj.origin}${refererPath}`, 
        "Origin": urlObj.origin,
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive",
        "Cookie": `ott=${ottTag}; ${dynamicCookies}`
    };
}

/**
 * Fetch text content with strict timeouts
 */
export async function safeFetchText(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} for ${url}`);
        }
        return await response.text();
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

/**
 * Fetch JSON content
 */
export async function safeFetchJson(url, options = {}) {
    const raw = await safeFetchText(url, options);
    return JSON.parse(raw);
}
