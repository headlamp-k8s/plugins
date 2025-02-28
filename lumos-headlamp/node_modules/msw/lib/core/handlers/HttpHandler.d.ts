import { g as RequestHandlerDefaultInfo, R as RequestHandler, a as ResponseResolver, c as RequestHandlerOptions, i as ResponseResolutionContext } from '../HttpResponse-DE19n76Q.js';
import { Path, Match, PathParams } from '../utils/matching/matchRequestUrl.js';
import '../utils/internal/isIterable.js';
import '../typeUtils.js';

type HttpHandlerMethod = string | RegExp;
interface HttpHandlerInfo extends RequestHandlerDefaultInfo {
    method: HttpHandlerMethod;
    path: Path;
}
declare enum HttpMethods {
    HEAD = "HEAD",
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    OPTIONS = "OPTIONS",
    DELETE = "DELETE"
}
type RequestQuery = {
    [queryName: string]: string;
};
type HttpRequestParsedResult = {
    match: Match;
    cookies: Record<string, string>;
};
type HttpRequestResolverExtras<Params extends PathParams> = {
    params: Params;
    cookies: Record<string, string>;
};
/**
 * Request handler for HTTP requests.
 * Provides request matching based on method and URL.
 */
declare class HttpHandler extends RequestHandler<HttpHandlerInfo, HttpRequestParsedResult, HttpRequestResolverExtras<any>> {
    constructor(method: HttpHandlerMethod, path: Path, resolver: ResponseResolver<HttpRequestResolverExtras<any>, any, any>, options?: RequestHandlerOptions);
    private checkRedundantQueryParameters;
    parse(args: {
        request: Request;
        resolutionContext?: ResponseResolutionContext;
    }): Promise<{
        match: Match;
        cookies: Record<string, string>;
    }>;
    predicate(args: {
        request: Request;
        parsedResult: HttpRequestParsedResult;
    }): boolean;
    private matchMethod;
    protected extendResolverArgs(args: {
        request: Request;
        parsedResult: HttpRequestParsedResult;
    }): {
        params: PathParams<string>;
        cookies: Record<string, string>;
    };
    log(args: {
        request: Request;
        response: Response;
    }): Promise<void>;
}

export { HttpHandler, type HttpHandlerInfo, HttpMethods, type HttpRequestParsedResult, type HttpRequestResolverExtras, type RequestQuery };
