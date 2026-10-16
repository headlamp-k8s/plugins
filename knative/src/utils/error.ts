/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Unknown API error');
  }
  if (error !== null && error !== undefined) return String(error);
  return 'Unknown API error';
}

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  return (error as { status?: unknown }).status === 404;
}

/**
 * Reads the message of a thrown value. Unlike {@link getErrorMessage}, it trims the message and has
 * no fallback text, so that {@link withDetail} can leave the detail out.
 *
 * @param error - The thrown value.
 * @returns The trimmed message, or undefined when there is none.
 */
export function errorDetail(error: unknown): string | undefined {
  const message = (error as { message?: unknown } | undefined)?.message;
  return (typeof message === 'string' && message.trim()) || undefined;
}

/**
 * Appends a failure's detail to a message.
 *
 * @param message - The message.
 * @param detail - The detail, if any.
 * @returns `message: detail`, or `message` alone.
 */
export function withDetail(message: string, detail: string | undefined): string {
  return detail ? `${message}: ${detail}` : message;
}

/**
 * Tells whether the API server refused a request, so that the request changed nothing. Timeouts,
 * network failures and server errors leave that open.
 *
 * @param error - The error the request failed with.
 * @returns True for a 4xx status other than 408 Request Timeout.
 */
export function wasRefused(error: unknown): boolean {
  const status = (error as { status?: unknown } | undefined)?.status;
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 408;
}
