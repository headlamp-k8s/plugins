// src/native/index.ts
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";

// src/node/SetupServerCommonApi.ts
import { invariant } from "outvariant";
import {
  BatchInterceptor,
  InterceptorReadyState
} from "@mswjs/interceptors";
import { SetupApi } from '../core/SetupApi.mjs';
import { handleRequest } from '../core/utils/handleRequest.mjs';
import { mergeRight } from '../core/utils/internal/mergeRight.mjs';
import { InternalError, devUtils } from '../core/utils/internal/devUtils.mjs';
var DEFAULT_LISTEN_OPTIONS = {
  onUnhandledRequest: "warn"
};
var SetupServerCommonApi = class extends SetupApi {
  interceptor;
  resolvedOptions;
  constructor(interceptors, handlers) {
    super(...handlers);
    this.interceptor = new BatchInterceptor({
      name: "setup-server",
      interceptors: interceptors.map((Interceptor) => new Interceptor())
    });
    this.resolvedOptions = {};
    this.init();
  }
  /**
   * Subscribe to all requests that are using the interceptor object
   */
  init() {
    this.interceptor.on(
      "request",
      async ({ request, requestId, controller }) => {
        const response = await handleRequest(
          request,
          requestId,
          this.handlersController.currentHandlers(),
          this.resolvedOptions,
          this.emitter
        );
        if (response) {
          controller.respondWith(response);
        }
        return;
      }
    );
    this.interceptor.on("unhandledException", ({ error }) => {
      if (error instanceof InternalError) {
        throw error;
      }
    });
    this.interceptor.on(
      "response",
      ({ response, isMockedResponse, request, requestId }) => {
        this.emitter.emit(
          isMockedResponse ? "response:mocked" : "response:bypass",
          {
            response,
            request,
            requestId
          }
        );
      }
    );
  }
  listen(options = {}) {
    this.resolvedOptions = mergeRight(
      DEFAULT_LISTEN_OPTIONS,
      options
    );
    this.interceptor.apply();
    this.subscriptions.push(() => {
      this.interceptor.dispose();
    });
    invariant(
      [InterceptorReadyState.APPLYING, InterceptorReadyState.APPLIED].includes(
        this.interceptor.readyState
      ),
      devUtils.formatMessage(
        'Failed to start "setupServer": the interceptor failed to apply. This is likely an issue with the library and you should report it at "%s".'
      ),
      "https://github.com/mswjs/msw/issues/new/choose"
    );
  }
  close() {
    this.dispose();
  }
};

// src/native/index.ts
function setupServer(...handlers) {
  return new SetupServerCommonApi(
    [FetchInterceptor, XMLHttpRequestInterceptor],
    handlers
  );
}
export {
  setupServer
};
//# sourceMappingURL=index.mjs.map