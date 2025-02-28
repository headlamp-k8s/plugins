export { E as ExtractEventNames, H as HttpRequestEventMap, c as INTERNAL_REQUEST_ID_HEADER_NAME, I as IS_PATCHED_MODULE, f as Interceptor, a as InterceptorEventMap, e as InterceptorReadyState, b as InterceptorSubscription, R as RequestCredentials, d as deleteGlobalSymbol, g as getGlobalSymbol } from './Interceptor-a31b1217.js';
export { a as BatchInterceptor, B as BatchInterceptorOptions, E as ExtractEventMapType } from './BatchInterceptor-13d40c95.js';
import '@open-draft/deferred-promise';
import '@open-draft/logger';
import 'strict-event-emitter';

/**
 * Generate a random ID string to represent a request.
 * @example
 * createRequestId()
 * // "f774b6c9c600f"
 */
declare function createRequestId(): string;

/**
 * Removes query parameters and hashes from a given URL.
 */
declare function getCleanUrl(url: URL, isAbsolute?: boolean): string;

declare function encodeBuffer(text: string): Uint8Array;
declare function decodeBuffer(buffer: ArrayBuffer, encoding?: string): string;

/**
 * Returns a boolean indicating whether the given response status
 * code represents a response that cannot have a body.
 */
declare function isResponseWithoutBody(status: number): boolean;

export { createRequestId, decodeBuffer, encodeBuffer, getCleanUrl, isResponseWithoutBody };
