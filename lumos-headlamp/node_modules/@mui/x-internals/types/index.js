"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _RefObject = require("./RefObject");
Object.keys(_RefObject).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _RefObject[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _RefObject[key];
    }
  });
});