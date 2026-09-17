/**
 * Shared page-size limits for list endpoints (API contract + service clamp).
 * Kept dependency-free so both the Zod schema and the services can import it.
 */
export const DEFAULT_TRANSACTION_LIMIT = 100;
export const MAX_TRANSACTION_LIMIT = 500;
