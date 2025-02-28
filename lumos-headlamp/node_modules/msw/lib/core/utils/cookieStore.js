"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cookieStore_exports = {};
__export(cookieStore_exports, {
  cookieStore: () => cookieStore
});
module.exports = __toCommonJS(cookieStore_exports);
var import_outvariant = require("outvariant");
var import_is_node_process = require("is-node-process");
var import_tough_cookie = __toESM(require("@bundled-es-modules/tough-cookie"));
const { Cookie, CookieJar, Store, MemoryCookieStore, domainMatch, pathMatch } = import_tough_cookie.default;
class WebStorageCookieStore extends Store {
  storage;
  storageKey;
  constructor() {
    super();
    (0, import_outvariant.invariant)(
      typeof localStorage !== "undefined",
      "Failed to create a WebStorageCookieStore: `localStorage` is not available in this environment. This is likely an issue with MSW. Please report it on GitHub: https://github.com/mswjs/msw/issues"
    );
    this.synchronous = true;
    this.storage = localStorage;
    this.storageKey = "__msw-cookie-store__";
  }
  findCookie(domain, path, key, callback) {
    try {
      const store2 = this.getStore();
      const cookies = this.filterCookiesFromList(store2, { domain, path, key });
      callback(null, cookies[0] || null);
    } catch (error) {
      if (error instanceof Error) {
        callback(error, null);
      }
    }
  }
  findCookies(domain, path, allowSpecialUseDomain, callback) {
    if (!domain) {
      callback(null, []);
      return;
    }
    try {
      const store2 = this.getStore();
      const results = this.filterCookiesFromList(store2, {
        domain,
        path
      });
      callback(null, results);
    } catch (error) {
      if (error instanceof Error) {
        callback(error, []);
      }
    }
  }
  putCookie(cookie, callback) {
    try {
      if (cookie.maxAge === 0) {
        return;
      }
      const store2 = this.getStore();
      store2.push(cookie);
      this.updateStore(store2);
    } catch (error) {
      if (error instanceof Error) {
        callback(error);
      }
    }
  }
  updateCookie(oldCookie, newCookie, callback) {
    if (newCookie.maxAge === 0) {
      this.removeCookie(
        newCookie.domain || "",
        newCookie.path || "",
        newCookie.key,
        callback
      );
      return;
    }
    this.putCookie(newCookie, callback);
  }
  removeCookie(domain, path, key, callback) {
    try {
      const store2 = this.getStore();
      const nextStore = this.deleteCookiesFromList(store2, { domain, path, key });
      this.updateStore(nextStore);
      callback(null);
    } catch (error) {
      if (error instanceof Error) {
        callback(error);
      }
    }
  }
  removeCookies(domain, path, callback) {
    try {
      const store2 = this.getStore();
      const nextStore = this.deleteCookiesFromList(store2, { domain, path });
      this.updateStore(nextStore);
      callback(null);
    } catch (error) {
      if (error instanceof Error) {
        callback(error);
      }
    }
  }
  getAllCookies(callback) {
    try {
      callback(null, this.getStore());
    } catch (error) {
      if (error instanceof Error) {
        callback(error, []);
      }
    }
  }
  getStore() {
    try {
      const json = this.storage.getItem(this.storageKey);
      if (json == null) {
        return [];
      }
      const rawCookies = JSON.parse(json);
      const cookies = [];
      for (const rawCookie of rawCookies) {
        const cookie = Cookie.fromJSON(rawCookie);
        if (cookie != null) {
          cookies.push(cookie);
        }
      }
      return cookies;
    } catch {
      return [];
    }
  }
  updateStore(nextStore) {
    this.storage.setItem(
      this.storageKey,
      JSON.stringify(nextStore.map((cookie) => cookie.toJSON()))
    );
  }
  filterCookiesFromList(cookies, matches) {
    const result = [];
    for (const cookie of cookies) {
      if (matches.domain && !domainMatch(matches.domain, cookie.domain || "")) {
        continue;
      }
      if (matches.path && !pathMatch(matches.path, cookie.path || "")) {
        continue;
      }
      if (matches.key && cookie.key !== matches.key) {
        continue;
      }
      result.push(cookie);
    }
    return result;
  }
  deleteCookiesFromList(cookies, matches) {
    const matchingCookies = this.filterCookiesFromList(cookies, matches);
    return cookies.filter((cookie) => !matchingCookies.includes(cookie));
  }
}
const store = (0, import_is_node_process.isNodeProcess)() ? new MemoryCookieStore() : new WebStorageCookieStore();
const cookieStore = new CookieJar(store);
//# sourceMappingURL=cookieStore.js.map