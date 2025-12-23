/**
 * Utility functions for type-safe error handling.
 * These functions help extract error messages from unknown error types
 * thrown by API calls, network requests, or other operations.
 */

/**
 * Extracts a user-friendly error message from an unknown error type.
 *
 * This function handles various error formats that can be thrown:
 * - Standard Error objects
 * - String errors
 * - Objects with a message property
 * - Unknown types
 *
 * @param error - The error of unknown type to extract a message from
 * @returns A string error message suitable for display to the user
 *
 * @example
 * ```typescript
 * try {
 *   await ApiProxy.request('/api/endpoint');
 * } catch (err: unknown) {
 *   const message = getErrorMessage(err);
 *   setError(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with a message property (common in API responses)
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  // Fallback for unknown error types
  return 'An unknown error occurred';
}
