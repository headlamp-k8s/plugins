// src/glossary.ts
var IS_PATCHED_MODULE = Symbol("isPatchedModule");

// src/utils/isPropertyAccessible.ts
function isPropertyAccessible(obj, key) {
  try {
    obj[key];
    return true;
  } catch (e) {
    return false;
  }
}

// src/utils/responseUtils.ts
var RESPONSE_STATUS_CODES_WITHOUT_BODY = /* @__PURE__ */ new Set([
  101,
  103,
  204,
  205,
  304
]);
var RESPONSE_STATUS_CODES_WITH_REDIRECT = /* @__PURE__ */ new Set([
  301,
  302,
  303,
  307,
  308
]);
function isResponseWithoutBody(status) {
  return RESPONSE_STATUS_CODES_WITHOUT_BODY.has(status);
}
function createServerErrorResponse(body) {
  return new Response(
    JSON.stringify(
      body instanceof Error ? {
        name: body.name,
        message: body.message,
        stack: body.stack
      } : body
    ),
    {
      status: 500,
      statusText: "Unhandled Exception",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
function isResponseError(response) {
  return isPropertyAccessible(response, "type") && response.type === "error";
}

export {
  IS_PATCHED_MODULE,
  RESPONSE_STATUS_CODES_WITH_REDIRECT,
  isResponseWithoutBody,
  createServerErrorResponse,
  isResponseError
};
//# sourceMappingURL=chunk-XVPRNJO7.mjs.map