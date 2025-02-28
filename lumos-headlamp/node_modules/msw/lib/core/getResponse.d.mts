import { R as RequestHandler } from './HttpResponse-Gtw1lt3H.mjs';
import './utils/internal/isIterable.mjs';
import './typeUtils.mjs';

/**
 * Finds a response for the given request instance
 * in the array of request handlers.
 * @param handlers The array of request handlers.
 * @param request The `Request` instance.
 * @returns {Response} A mocked response, if any.
 */
declare const getResponse: (handlers: Array<RequestHandler>, request: Request) => Promise<Response | undefined>;

export { getResponse };
