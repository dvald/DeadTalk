// Imports
import { Request } from "@asanrom/request-browser";

/**
 * Wraps an asynchronous request with a timeout.
 * If the request takes longer than the specified duration, it will be aborted using
 * the global `Timeouts.Abort` and `Request.Abort` handlers.
 *
 * @template T - The resolved value type of the original promise.
 * @param id - A unique identifier used to manage the request and timeout handlers.
 * @param promiseFn - A function returning a promise that performs the actual request.
 * @param timeoutMs - Maximum time (in milliseconds) to wait before aborting. Defaults to 5000ms.
 * @param errorMessage - Optional custom error message for timeout rejection.
 *
 * @returns A promise that resolves with the result of `promiseFn`, or rejects if it times out.
 */
export const withTimeout = async <T>(id: string, promiseFn: () => Promise<T>, timeoutMs = 5000, errorMessage?: string): Promise<T> => {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new globalThis.Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            Timeouts.Abort(id);
            Request.Abort(id);

            reject(new Error(errorMessage || `Request "${id}" timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const result = await globalThis.Promise.race([promiseFn(), timeoutPromise]);
        return result;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};
