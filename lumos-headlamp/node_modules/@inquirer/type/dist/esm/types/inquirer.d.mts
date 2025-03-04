import * as readline from 'node:readline';
import MuteStream from 'mute-stream';
export declare class CancelablePromise<T> extends Promise<T> {
    cancel: () => void;
    static withResolver<T>(): {
        promise: CancelablePromise<T>;
        resolve: (value: T) => void;
        reject: (error: unknown) => void;
    };
}
export type InquirerReadline = readline.ReadLine & {
    output: MuteStream;
    input: NodeJS.ReadableStream;
    clearLine: (dir: 0 | 1 | -1) => void;
};
export type Context = {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    clearPromptOnDone?: boolean;
    signal?: AbortSignal;
};
export type Prompt<Value, Config> = (config: Config, context?: Context) => CancelablePromise<Value>;
