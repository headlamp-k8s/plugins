import {
  BatchInterceptor
} from "./chunk-3NMVZQIH.mjs";
import {
  decodeBuffer,
  encodeBuffer
} from "./chunk-6HYIRFX2.mjs";
import {
  IS_PATCHED_MODULE
} from "./chunk-BZ3Y7YV5.mjs";
import {
  INTERNAL_REQUEST_ID_HEADER_NAME,
  Interceptor,
  InterceptorReadyState,
  createRequestId,
  deleteGlobalSymbol,
  getGlobalSymbol,
  isResponseWithoutBody
} from "./chunk-FQQAJBI2.mjs";

// src/utils/getCleanUrl.ts
function getCleanUrl(url, isAbsolute = true) {
  return [isAbsolute && url.origin, url.pathname].filter(Boolean).join("");
}
export {
  BatchInterceptor,
  INTERNAL_REQUEST_ID_HEADER_NAME,
  IS_PATCHED_MODULE,
  Interceptor,
  InterceptorReadyState,
  createRequestId,
  decodeBuffer,
  deleteGlobalSymbol,
  encodeBuffer,
  getCleanUrl,
  getGlobalSymbol,
  isResponseWithoutBody
};
//# sourceMappingURL=index.mjs.map