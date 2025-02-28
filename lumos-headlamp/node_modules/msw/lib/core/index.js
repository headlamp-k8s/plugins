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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var core_exports = {};
__export(core_exports, {
  GraphQLHandler: () => import_GraphQLHandler.GraphQLHandler,
  HttpHandler: () => import_HttpHandler.HttpHandler,
  HttpMethods: () => import_HttpHandler.HttpMethods,
  RequestHandler: () => import_RequestHandler.RequestHandler,
  SetupApi: () => import_SetupApi.SetupApi,
  bypass: () => import_bypass.bypass,
  cleanUrl: () => import_cleanUrl.cleanUrl,
  getResponse: () => import_getResponse.getResponse,
  graphql: () => import_graphql.graphql,
  http: () => import_http.http,
  matchRequestUrl: () => import_matchRequestUrl.matchRequestUrl,
  passthrough: () => import_passthrough.passthrough
});
module.exports = __toCommonJS(core_exports);
var import_checkGlobals = require("./utils/internal/checkGlobals.js");
var import_SetupApi = require("./SetupApi.js");
var import_RequestHandler = require("./handlers/RequestHandler.js");
var import_http = require("./http.js");
var import_HttpHandler = require("./handlers/HttpHandler.js");
var import_graphql = require("./graphql.js");
var import_GraphQLHandler = require("./handlers/GraphQLHandler.js");
var import_matchRequestUrl = require("./utils/matching/matchRequestUrl.js");
__reExport(core_exports, require("./utils/handleRequest.js"), module.exports);
var import_getResponse = require("./getResponse.js");
var import_cleanUrl = require("./utils/url/cleanUrl.js");
__reExport(core_exports, require("./HttpResponse.js"), module.exports);
__reExport(core_exports, require("./delay.js"), module.exports);
var import_bypass = require("./bypass.js");
var import_passthrough = require("./passthrough.js");
(0, import_checkGlobals.checkGlobals)();
//# sourceMappingURL=index.js.map