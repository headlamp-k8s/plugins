"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/native/index.ts
var native_exports = {};
__export(native_exports, {
  setupServer: () => setupServer
});
module.exports = __toCommonJS(native_exports);
var import_fetch = require("@mswjs/interceptors/fetch");
var import_XMLHttpRequest = require("@mswjs/interceptors/XMLHttpRequest");

// src/node/SetupServerCommonApi.ts
var import_outvariant = require("outvariant");
var import_interceptors = require("@mswjs/interceptors");
var import_SetupApi = require("../core/SetupApi.js");
var import_handleRequest = require("../core/utils/handleRequest.js");
var import_mergeRight = require("../core/utils/internal/mergeRight.js");
var import_devUtils = require("../core/utils/internal/devUtils.js");
var DEFAULT_LISTEN_OPTIONS = {
  onUnhandledRequest: "warn"
};
var SetupServerCommonApi = class extends import_SetupApi.SetupApi {
  interceptor;
  resolvedOptions;
  constructor(interceptors, handlers) {
    super(...handlers);
    this.interceptor = new import_interceptors.BatchInterceptor({
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
        const response = await (0, import_handleRequest.handleRequest)(
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
      if (error instanceof import_devUtils.InternalError) {
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
    this.resolvedOptions = (0, import_mergeRight.mergeRight)(
      DEFAULT_LISTEN_OPTIONS,
      options
    );
    this.interceptor.apply();
    this.subscriptions.push(() => {
      this.interceptor.dispose();
    });
    (0, import_outvariant.invariant)(
      [import_interceptors.InterceptorReadyState.APPLYING, import_interceptors.InterceptorReadyState.APPLIED].includes(
        this.interceptor.readyState
      ),
      import_devUtils.devUtils.formatMessage(
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
    [import_fetch.FetchInterceptor, import_XMLHttpRequest.XMLHttpRequestInterceptor],
    handlers
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  setupServer
});
//# sourceMappingURL=index.js.map