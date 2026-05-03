export async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return await response.json();
}
