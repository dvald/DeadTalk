// Password security utils

"use strict";

/**
 * Checks if the password security must be checked frontend-side
 * @returns True if it must be checked
 */
export function mustCheckPasswordSecurity(): boolean {
    return (import.meta.env.VITE__IGNORE_PASSWORD_SECURITY + "").toUpperCase() !== "NO";
}
