import { until } from "@open-draft/until";
import { executeHandlers } from './executeHandlers.mjs';
import { onUnhandledRequest } from './request/onUnhandledRequest.mjs';
import { storeResponseCookies } from './request/storeResponseCookies.mjs';
async function handleRequest(request, requestId, handlers, options, emitter, handleRequestOptions) {
  emitter.emit("request:start", { request, requestId });
  if (request.headers.get("x-msw-intention") === "bypass") {
    emitter.emit("request:end", { request, requestId });
    handleRequestOptions?.onPassthroughResponse?.(request);
    return;
  }
  const lookupResult = await until(() => {
    return executeHandlers({
      request,
      requestId,
      handlers,
      resolutionContext: handleRequestOptions?.resolutionContext
    });
  });
  if (lookupResult.error) {
    emitter.emit("unhandledException", {
      error: lookupResult.error,
      request,
      requestId
    });
    throw lookupResult.error;
  }
  if (!lookupResult.data) {
    await onUnhandledRequest(request, options.onUnhandledRequest);
    emitter.emit("request:unhandled", { request, requestId });
    emitter.emit("request:end", { request, requestId });
    handleRequestOptions?.onPassthroughResponse?.(request);
    return;
  }
  const { response } = lookupResult.data;
  if (!response) {
    emitter.emit("request:end", { request, requestId });
    handleRequestOptions?.onPassthroughResponse?.(request);
    return;
  }
  if (response.status === 302 && response.headers.get("x-msw-intention") === "passthrough") {
    emitter.emit("request:end", { request, requestId });
    handleRequestOptions?.onPassthroughResponse?.(request);
    return;
  }
  storeResponseCookies(request, response);
  emitter.emit("request:match", { request, requestId });
  const requiredLookupResult = lookupResult.data;
  const transformedResponse = handleRequestOptions?.transformResponse?.(response) || response;
  handleRequestOptions?.onMockedResponse?.(
    transformedResponse,
    requiredLookupResult
  );
  emitter.emit("request:end", { request, requestId });
  return transformedResponse;
}
export {
  handleRequest
};
//# sourceMappingURL=handleRequest.mjs.map