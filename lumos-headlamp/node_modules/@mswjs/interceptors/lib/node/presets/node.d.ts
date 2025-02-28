import { ClientRequestInterceptor } from '../interceptors/ClientRequest/index.js';
import { XMLHttpRequestInterceptor } from '../interceptors/XMLHttpRequest/index.js';
import { FetchInterceptor } from '../interceptors/fetch/index.js';
import '../Interceptor-a31b1217.js';
import '@open-draft/deferred-promise';
import '@open-draft/logger';
import 'strict-event-emitter';
import 'node:net';

/**
 * The default preset provisions the interception of requests
 * regardless of their type (http/https/XMLHttpRequest).
 */
declare const _default: readonly [ClientRequestInterceptor, XMLHttpRequestInterceptor, FetchInterceptor];

export { _default as default };
