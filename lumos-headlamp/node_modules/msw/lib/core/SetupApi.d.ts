import { EventMap, Emitter } from 'strict-event-emitter';
import { R as RequestHandler, g as RequestHandlerDefaultInfo } from './HttpResponse-DE19n76Q.js';
import { LifeCycleEventEmitter } from './sharedOptions.js';
import { Disposable } from './utils/internal/Disposable.js';
import './utils/internal/isIterable.js';
import './typeUtils.js';
import './utils/request/onUnhandledRequest.js';

declare abstract class HandlersController {
    abstract prepend(runtimeHandlers: Array<RequestHandler>): void;
    abstract reset(nextHandles: Array<RequestHandler>): void;
    abstract currentHandlers(): Array<RequestHandler>;
}
declare class InMemoryHandlersController implements HandlersController {
    private initialHandlers;
    private handlers;
    constructor(initialHandlers: Array<RequestHandler>);
    prepend(runtimeHandles: Array<RequestHandler>): void;
    reset(nextHandlers: Array<RequestHandler>): void;
    currentHandlers(): Array<RequestHandler>;
}
/**
 * Generic class for the mock API setup.
 */
declare abstract class SetupApi<EventsMap extends EventMap> extends Disposable {
    protected handlersController: HandlersController;
    protected readonly emitter: Emitter<EventsMap>;
    protected readonly publicEmitter: Emitter<EventsMap>;
    readonly events: LifeCycleEventEmitter<EventsMap>;
    constructor(...initialHandlers: Array<RequestHandler>);
    private validateHandlers;
    use(...runtimeHandlers: Array<RequestHandler>): void;
    restoreHandlers(): void;
    resetHandlers(...nextHandlers: Array<RequestHandler>): void;
    listHandlers(): ReadonlyArray<RequestHandler<RequestHandlerDefaultInfo, any, any>>;
    private createLifeCycleEvents;
}

export { HandlersController, InMemoryHandlersController, SetupApi };
