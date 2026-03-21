// Composable to generate an unique ID for a request
// This composable ensures the request is aborted when the component unmounts

import { Request } from "@asanrom/request-browser";

/**
 * Composable to generate an unique ID for a request
 * This composable ensures the request is aborted when the component unmounts
 * @returns The unique ID for the request
 */
export function useUniqueRequestId(): string {
    const requestId = getUniqueStringId();

    onBeforeUnmount(() => {
        Timeouts.Abort(requestId);
        Request.Abort(requestId);
    });

    return requestId;
}
