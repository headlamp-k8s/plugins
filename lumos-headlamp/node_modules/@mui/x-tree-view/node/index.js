/**
 * @mui/x-tree-view v6.17.0
 *
 * @license MIT
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  unstable_resetCleanupTracking: true
};
Object.defineProperty(exports, "unstable_resetCleanupTracking", {
  enumerable: true,
  get: function () {
    return _useInstanceEventHandler.unstable_resetCleanupTracking;
  }
});
var _TreeItem = require("./TreeItem");
Object.keys(_TreeItem).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TreeItem[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TreeItem[key];
    }
  });
});
var _TreeView = require("./TreeView");
Object.keys(_TreeView).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TreeView[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TreeView[key];
    }
  });
});
var _useInstanceEventHandler = require("./internals/hooks/useInstanceEventHandler");