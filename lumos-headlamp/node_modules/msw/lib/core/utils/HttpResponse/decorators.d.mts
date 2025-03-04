import { H as HttpResponseInit } from '../../HttpResponse-Gtw1lt3H.mjs';
import '../internal/isIterable.mjs';
import '../../typeUtils.mjs';

declare const kSetCookie: unique symbol;
interface HttpResponseDecoratedInit extends HttpResponseInit {
    status: number;
    statusText: string;
    headers: Headers;
}
declare function normalizeResponseInit(init?: HttpResponseInit): HttpResponseDecoratedInit;
declare function decorateResponse(response: Response, init: HttpResponseDecoratedInit): Response;

export { type HttpResponseDecoratedInit, decorateResponse, kSetCookie, normalizeResponseInit };
