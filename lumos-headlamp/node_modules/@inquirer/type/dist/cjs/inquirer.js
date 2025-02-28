"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelablePromise = void 0;
class CancelablePromise extends Promise {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "cancel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => { }
        });
    }
    static withResolver() {
        let resolve;
        let reject;
        const promise = new CancelablePromise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve: resolve, reject: reject };
    }
}
exports.CancelablePromise = CancelablePromise;
