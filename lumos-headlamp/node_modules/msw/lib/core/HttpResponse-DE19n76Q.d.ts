import { Iterable, AsyncIterable } from './utils/internal/isIterable.js';
import { MaybePromise, NoInfer } from './typeUtils.js';

interface HandlersExecutionResult {
    handler: RequestHandler;
    parsedResult?: any;
    response?: Response;
}
interface ResponseResolutionContext {
    baseUrl?: string;
}
/**
 * Executes the list of request handlers against the given request.
 * Returns the execution result object containing any matching request
 * handler and any mocked response it returned.
 */
declare const executeHandlers: <Handlers extends Array<RequestHandler>>({ request, requestId, handlers, resolutionContext, }: {
    request: Request;
    requestId: string;
    handlers: Handlers;
    resolutionContext?: ResponseResolutionContext;
}) => Promise<HandlersExecutionResult | null>;

type DefaultRequestMultipartBody = Record<string, string | File | Array<string | File>>;
type DefaultBodyType = Record<string, any> | DefaultRequestMultipartBody | string | number | boolean | null | undefined;
type JsonBodyType = Record<string, any> | string | number | boolean | null | undefined;
interface RequestHandlerDefaultInfo {
    header: string;
}
interface RequestHandlerInternalInfo {
    callFrame?: string;
}
type ResponseResolverReturnType<ResponseBodyType extends DefaultBodyType = undefined> = ([ResponseBodyType] extends [undefined] ? Response : StrictResponse<ResponseBodyType>) | undefined | void;
type MaybeAsyncResponseResolverReturnType<ResponseBodyType extends DefaultBodyType> = MaybePromise<ResponseResolverReturnType<ResponseBodyType>>;
type AsyncResponseResolverReturnType<ResponseBodyType extends DefaultBodyType> = MaybePromise<ResponseResolverReturnType<ResponseBodyType> | Iterable<MaybeAsyncResponseResolverReturnType<ResponseBodyType>, MaybeAsyncResponseResolverReturnType<ResponseBodyType>, MaybeAsyncResponseResolverReturnType<ResponseBodyType>> | AsyncIterable<MaybeAsyncResponseResolverReturnType<ResponseBodyType>, MaybeAsyncResponseResolverReturnType<ResponseBodyType>, MaybeAsyncResponseResolverReturnType<ResponseBodyType>>>;
type ResponseResolverInfo<ResolverExtraInfo extends Record<string, unknown>, RequestBodyType extends DefaultBodyType = DefaultBodyType> = {
    request: StrictRequest<RequestBodyType>;
    requestId: string;
} & ResolverExtraInfo;
type ResponseResolver<ResolverExtraInfo extends Record<string, unknown> = Record<string, unknown>, RequestBodyType extends DefaultBodyType = DefaultBodyType, ResponseBodyType extends DefaultBodyType = undefined> = (info: ResponseResolverInfo<ResolverExtraInfo, RequestBodyType>) => AsyncResponseResolverReturnType<ResponseBodyType>;
interface RequestHandlerArgs<HandlerInfo, HandlerOptions extends RequestHandlerOptions> {
    info: HandlerInfo;
    resolver: ResponseResolver<any>;
    options?: HandlerOptions;
}
interface RequestHandlerOptions {
    once?: boolean;
}
interface RequestHandlerExecutionResult<ParsedResult extends Record<string, unknown> | undefined> {
    handler: RequestHandler;
    parsedResult?: ParsedResult;
    request: Request;
    requestId: string;
    response?: Response;
}
declare abstract class RequestHandler<HandlerInfo extends RequestHandlerDefaultInfo = RequestHandlerDefaultInfo, ParsedResult extends Record<string, any> | undefined = any, ResolverExtras extends Record<string, unknown> = any, HandlerOptions extends RequestHandlerOptions = RequestHandlerOptions> {
    static cache: WeakMap<StrictRequest<DefaultBodyType>, StrictRequest<DefaultBodyType>>;
    info: HandlerInfo & RequestHandlerInternalInfo;
    /**
     * Indicates whether this request handler has been used
     * (its resolver has successfully executed).
     */
    isUsed: boolean;
    protected resolver: ResponseResolver<ResolverExtras, any, any>;
    private resolverIterator?;
    private resolverIteratorResult?;
    private options?;
    constructor(args: RequestHandlerArgs<HandlerInfo, HandlerOptions>);
    /**
     * Determine if the intercepted request should be mocked.
     */
    abstract predicate(args: {
        request: Request;
        parsedResult: ParsedResult;
        resolutionContext?: ResponseResolutionContext;
    }): boolean;
    /**
     * Print out the successfully handled request.
     */
    abstract log(args: {
        request: Request;
        response: Response;
        parsedResult: ParsedResult;
    }): void;
    /**
     * Parse the intercepted request to extract additional information from it.
     * Parsed result is then exposed to other methods of this request handler.
     */
    parse(_args: {
        request: Request;
        resolutionContext?: ResponseResolutionContext;
    }): Promise<ParsedResult>;
    /**
     * Test if this handler matches the given request.
     *
     * This method is not used internally but is exposed
     * as a convenience method for consumers writing custom
     * handlers.
     */
    test(args: {
        request: Request;
        resolutionContext?: ResponseResolutionContext;
    }): Promise<boolean>;
    protected extendResolverArgs(_args: {
        request: Request;
        parsedResult: ParsedResult;
    }): ResolverExtras;
    private cloneRequestOrGetFromCache;
    /**
     * Execute this request handler and produce a mocked response
     * using the given resolver function.
     */
    run(args: {
        request: StrictRequest<any>;
        requestId: string;
        resolutionContext?: ResponseResolutionContext;
    }): Promise<RequestHandlerExecutionResult<ParsedResult> | null>;
    private wrapResolver;
    private createExecutionResult;
}

interface HttpResponseInit extends ResponseInit {
    type?: ResponseType;
}
declare const bodyType: unique symbol;
interface StrictRequest<BodyType extends DefaultBodyType> extends Request {
    json(): Promise<BodyType>;
}
/**
 * Opaque `Response` type that supports strict body type.
 */
interface StrictResponse<BodyType extends DefaultBodyType> extends Response {
    readonly [bodyType]: BodyType;
}
/**
 * A drop-in replacement for the standard `Response` class
 * to allow additional features, like mocking the response `Set-Cookie` header.
 *
 * @example
 * new HttpResponse('Hello world', { status: 201 })
 * HttpResponse.json({ name: 'John' })
 * HttpResponse.formData(form)
 *
 * @see {@link https://mswjs.io/docs/api/http-response `HttpResponse` API reference}
 */
declare class HttpResponse extends Response {
    constructor(body?: BodyInit | null, init?: HttpResponseInit);
    /**
     * Create a `Response` with a `Content-Type: "text/plain"` body.
     * @example
     * HttpResponse.text('hello world')
     * HttpResponse.text('Error', { status: 500 })
     */
    static text<BodyType extends string>(body?: NoInfer<BodyType> | null, init?: HttpResponseInit): StrictResponse<BodyType>;
    /**
     * Create a `Response` with a `Content-Type: "application/json"` body.
     * @example
     * HttpResponse.json({ firstName: 'John' })
     * HttpResponse.json({ error: 'Not Authorized' }, { status: 401 })
     */
    static json<BodyType extends JsonBodyType>(body?: NoInfer<BodyType> | null, init?: HttpResponseInit): StrictResponse<BodyType>;
    /**
     * Create a `Response` with a `Content-Type: "application/xml"` body.
     * @example
     * HttpResponse.xml(`<user name="John" />`)
     * HttpResponse.xml(`<article id="abc-123" />`, { status: 201 })
     */
    static xml<BodyType extends string>(body?: BodyType | null, init?: HttpResponseInit): Response;
    /**
     * Create a `Response` with a `Content-Type: "text/html"` body.
     * @example
     * HttpResponse.html(`<p class="author">Jane Doe</p>`)
     * HttpResponse.html(`<main id="abc-123">Main text</main>`, { status: 201 })
     */
    static html<BodyType extends string>(body?: BodyType | null, init?: HttpResponseInit): Response;
    /**
     * Create a `Response` with an `ArrayBuffer` body.
     * @example
     * const buffer = new ArrayBuffer(3)
     * const view = new Uint8Array(buffer)
     * view.set([1, 2, 3])
     *
     * HttpResponse.arrayBuffer(buffer)
     */
    static arrayBuffer(body?: ArrayBuffer, init?: HttpResponseInit): Response;
    /**
     * Create a `Response` with a `FormData` body.
     * @example
     * const data = new FormData()
     * data.set('name', 'Alice')
     *
     * HttpResponse.formData(data)
     */
    static formData(body?: FormData, init?: HttpResponseInit): Response;
}

export { type AsyncResponseResolverReturnType as A, type DefaultBodyType as D, type HttpResponseInit as H, type JsonBodyType as J, type MaybeAsyncResponseResolverReturnType as M, RequestHandler as R, type StrictRequest as S, type ResponseResolver as a, type ResponseResolverReturnType as b, type RequestHandlerOptions as c, type DefaultRequestMultipartBody as d, type StrictResponse as e, HttpResponse as f, type RequestHandlerDefaultInfo as g, type HandlersExecutionResult as h, type ResponseResolutionContext as i, executeHandlers as j, type RequestHandlerInternalInfo as k, type ResponseResolverInfo as l, type RequestHandlerArgs as m, type RequestHandlerExecutionResult as n };
