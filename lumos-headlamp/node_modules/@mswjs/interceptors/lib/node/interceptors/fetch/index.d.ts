import { f as Interceptor, H as HttpRequestEventMap } from '../../Interceptor-a31b1217.js';
import '@open-draft/deferred-promise';
import '@open-draft/logger';
import 'strict-event-emitter';

declare class FetchInterceptor extends Interceptor<HttpRequestEventMap> {
    static symbol: symbol;
    constructor();
    protected checkEnvironment(): boolean;
    protected setup(): Promise<void>;
}

export { FetchInterceptor };
