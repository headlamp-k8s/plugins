"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _forwardRef = require("./forwardRef");
Object.keys(_forwardRef).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _forwardRef[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _forwardRef[key];
    }
  });
});