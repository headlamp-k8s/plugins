import { H as HttpResponseInit } from '../../HttpResponse-DE19n76Q.js';
import '../internal/isIterable.js';
import '../../typeUtils.js';

declare const kSetCookie: unique symbol;
interface HttpResponseDecoratedInit extends HttpResponseInit {
    status: number;
    statusText: string;
    headers: Headers;
}
declare function normalizeResponseInit(init?: HttpResponseInit): HttpResponseDecoratedInit;
declare function decorateResponse(response: Response, init: HttpResponseDecoratedInit): Response;

export { type HttpResponseDecoratedInit, decorateResponse, kSetCookie, normalizeResponseInit };
