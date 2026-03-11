// lib/measure-text.ts

// A tiny LRU Cache to store previously measured strings.
const cache = new Map<string, number>();

/**
 * Returns the exact pixel width of the given text.
 * Falls back to an approximate character measurement calculation
 * if running in an SSR environment (server-side).
 */
export function measureTextWidth(text: string, font: string = '12px sans-serif'): number {
    const cacheKey = `${text}-${font}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    if (typeof document === 'undefined') {
        // Fallback for SSR
        // Assume roughly 7px average for 12px font
        const approxSize = parseFloat(font) || 12;
        const avgCharWidth = approxSize * 0.6;
        const fallbackWidth = text.length * avgCharWidth;
        cache.set(cacheKey, fallbackWidth);
        return fallbackWidth;
    }

    // Create a singleton canvas element across function calls
    const canvas = (window as any).__measureContextCanvas || ((window as any).__measureContextCanvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    if (!context) return text.length * 6; // Safety fallback

    context.font = font;
    const metrics = context.measureText(text);

    // Add small buffer so we don't word wrap too aggressively
    const width = metrics.width + 1;

    // Ensure cache doesn't grow infinitely
    if (cache.size > 1000) {
        // delete oldest map entries (Map iterates in insertion order)
        const entriesToDelete = Math.max(1, Math.floor(cache.size / 10));
        let i = 0;
        for (const key of cache.keys()) {
            if (i++ >= entriesToDelete) break;
            cache.delete(key);
        }
    }

    cache.set(cacheKey, width);
    return width;
}
