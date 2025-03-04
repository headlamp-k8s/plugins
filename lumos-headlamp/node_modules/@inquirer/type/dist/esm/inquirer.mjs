export class CancelablePromise extends Promise {
    cancel = () => { };
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
