import { R as RequestHandler, g as RequestHandlerDefaultInfo, c as RequestHandlerOptions } from '../../HttpResponse-DE19n76Q.js';
import './isIterable.js';
import '../../typeUtils.js';

declare function use(currentHandlers: Array<RequestHandler>, ...handlers: Array<RequestHandler>): void;
declare function restoreHandlers(handlers: Array<RequestHandler>): void;
declare function resetHandlers(initialHandlers: Array<RequestHandler>, ...nextHandlers: Array<RequestHandler>): RequestHandler<RequestHandlerDefaultInfo, any, any, RequestHandlerOptions>[];

export { resetHandlers, restoreHandlers, use };
