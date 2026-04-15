import { Composition } from './types';

/**
 * Compresses a composition object into a URL-safe Base64 string using gzip.
 */
export async function encodeComposition(comp: Composition): Promise<string> {
    const json = JSON.stringify(comp);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);

    // Use native CompressionStream (GZIP)
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(stream).arrayBuffer();

    // Convert to Base64
    const binary = String.fromCharCode(...new Uint8Array(compressedBuffer));
    const base64 = btoa(binary);

    // Make URL safe (Base64URL)
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Decompresses a Base64URL string back into a Composition object.
 */
export async function decodeComposition(encoded: string): Promise<Composition | null> {
    try {
        // Restore standard Base64
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        // Decompress using DecompressionStream
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressedBuffer = await new Response(stream).arrayBuffer();

        const decoder = new TextDecoder();
        const json = decoder.decode(decompressedBuffer);
        
        return JSON.parse(json);
    } catch (err) {
        console.error('Failed to decode composition:', err);
        return null;
    }
}
