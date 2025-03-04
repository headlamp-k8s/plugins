import { ChildProcess } from 'child_process';
import { f as Interceptor, H as HttpRequestEventMap } from './Interceptor-a31b1217.js';
import { a as BatchInterceptor } from './BatchInterceptor-13d40c95.js';
import { ClientRequestInterceptor } from './interceptors/ClientRequest/index.js';
import { XMLHttpRequestInterceptor } from './interceptors/XMLHttpRequest/index.js';
import '@open-draft/deferred-promise';
import '@open-draft/logger';
import 'strict-event-emitter';
import 'node:net';

interface SerializedRequest {
    id: string;
    url: string;
    method: string;
    headers: Array<[string, string]>;
    credentials: RequestCredentials;
    body: string;
}
interface SerializedResponse {
    status: number;
    statusText: string;
    headers: Array<[string, string]>;
    body: string;
}
declare class RemoteHttpInterceptor extends BatchInterceptor<[
    ClientRequestInterceptor,
    XMLHttpRequestInterceptor
]> {
    constructor();
    protected setup(): void;
}
declare function requestReviver(key: string, value: any): any;
interface RemoveResolverOptions {
    process: ChildProcess;
}
declare class RemoteHttpResolver extends Interceptor<HttpRequestEventMap> {
    static symbol: symbol;
    private process;
    constructor(options: RemoveResolverOptions);
    protected setup(): void;
}

export { RemoteHttpInterceptor, RemoteHttpResolver, RemoveResolverOptions, SerializedRequest, SerializedResponse, requestReviver };
