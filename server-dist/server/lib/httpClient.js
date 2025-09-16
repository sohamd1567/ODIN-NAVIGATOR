import fetch from 'node-fetch';
/**
 * Small HTTP client wrapper around node-fetch that adds timeout and retry logic.
 * - timeoutMs: aborts the request after the given milliseconds
 * - retries: number of retry attempts on network errors or 5xx responses
 */
export async function fetchWithTimeoutAndRetry(url, opts = {}, timeoutMs = 8000, retries = 2) {
    let attempt = 0;
    let lastErr = null;
    while (attempt <= retries) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            // cast signal to any to avoid type mismatch between DOM AbortSignal and node-fetch externals types
            const res = await fetch(url, { ...opts, // eslint-disable-line @typescript-eslint/no-explicit-any
                // node-fetch expects its own AbortSignal type; cast through any for compatibility
                signal: controller.signal });
            clearTimeout(id);
            // Retry on 5xx server errors
            if (res.status >= 500 && attempt < retries) {
                attempt += 1;
                const backoff = 200 * Math.pow(2, attempt);
                await new Promise((r) => setTimeout(r, backoff));
                continue;
            }
            return res;
        }
        catch (err) {
            clearTimeout(id);
            lastErr = err;
            // abort errors are not retriable beyond the allowed retries
            if (attempt < retries) {
                attempt += 1;
                const backoff = 200 * Math.pow(2, attempt);
                await new Promise((r) => setTimeout(r, backoff));
                continue;
            }
            throw lastErr;
        }
    }
    throw lastErr;
}
export async function getJson(url, opts = {}, timeoutMs = 8000, retries = 2) {
    const res = await fetchWithTimeoutAndRetry(url, { ...opts, method: 'GET' }, timeoutMs, retries);
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} when fetching ${url}: ${body}`);
    }
    return res.json();
}
export default {
    fetchWithTimeoutAndRetry,
    getJson,
};
