"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkPGTBKPWNjs = require('./chunk-PGTBKPWN.js');



var _chunkLK6DILFKjs = require('./chunk-LK6DILFK.js');


var _chunkIDEEMJ3Fjs = require('./chunk-IDEEMJ3F.js');








var _chunkAABH3XLQjs = require('./chunk-AABH3XLQ.js');

// src/utils/getCleanUrl.ts
function getCleanUrl(url, isAbsolute = true) {
  return [isAbsolute && url.origin, url.pathname].filter(Boolean).join("");
}













exports.BatchInterceptor = _chunkPGTBKPWNjs.BatchInterceptor; exports.INTERNAL_REQUEST_ID_HEADER_NAME = _chunkAABH3XLQjs.INTERNAL_REQUEST_ID_HEADER_NAME; exports.IS_PATCHED_MODULE = _chunkIDEEMJ3Fjs.IS_PATCHED_MODULE; exports.Interceptor = _chunkAABH3XLQjs.Interceptor; exports.InterceptorReadyState = _chunkAABH3XLQjs.InterceptorReadyState; exports.createRequestId = _chunkAABH3XLQjs.createRequestId; exports.decodeBuffer = _chunkLK6DILFKjs.decodeBuffer; exports.deleteGlobalSymbol = _chunkAABH3XLQjs.deleteGlobalSymbol; exports.encodeBuffer = _chunkLK6DILFKjs.encodeBuffer; exports.getCleanUrl = getCleanUrl; exports.getGlobalSymbol = _chunkAABH3XLQjs.getGlobalSymbol; exports.isResponseWithoutBody = _chunkAABH3XLQjs.isResponseWithoutBody;
//# sourceMappingURL=index.js.map