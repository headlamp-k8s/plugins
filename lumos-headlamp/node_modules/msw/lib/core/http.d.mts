import { D as DefaultBodyType, c as RequestHandlerOptions, a as ResponseResolver } from './HttpResponse-Gtw1lt3H.mjs';
import { HttpHandler, HttpRequestResolverExtras } from './handlers/HttpHandler.mjs';
import { PathParams, Path } from './utils/matching/matchRequestUrl.mjs';
import './utils/internal/isIterable.mjs';
import './typeUtils.mjs';

type HttpRequestHandler = <Params extends PathParams<keyof Params> = PathParams, RequestBodyType extends DefaultBodyType = DefaultBodyType, ResponseBodyType extends DefaultBodyType = undefined, RequestPath extends Path = Path>(path: RequestPath, resolver: HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>, options?: RequestHandlerOptions) => HttpHandler;
type HttpResponseResolver<Params extends PathParams<keyof Params> = PathParams, RequestBodyType extends DefaultBodyType = DefaultBodyType, ResponseBodyType extends DefaultBodyType = DefaultBodyType> = ResponseResolver<HttpRequestResolverExtras<Params>, RequestBodyType, ResponseBodyType>;
/**
 * A namespace to intercept and mock HTTP requests.
 *
 * @example
 * http.get('/user', resolver)
 * http.post('/post/:id', resolver)
 *
 * @see {@link https://mswjs.io/docs/api/http `http` API reference}
 */
declare const http: {
    all: HttpRequestHandler;
    head: HttpRequestHandler;
    get: HttpRequestHandler;
    post: HttpRequestHandler;
    put: HttpRequestHandler;
    delete: HttpRequestHandler;
    patch: HttpRequestHandler;
    options: HttpRequestHandler;
};

export { type HttpRequestHandler, type HttpResponseResolver, http };
