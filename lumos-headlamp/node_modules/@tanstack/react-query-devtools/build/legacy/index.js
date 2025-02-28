"use client";

// src/index.ts
import * as Devtools from "./ReactQueryDevtools.js";
import * as DevtoolsPanel from "./ReactQueryDevtoolsPanel.js";
var ReactQueryDevtools2 = process.env.NODE_ENV !== "development" ? function() {
  return null;
} : Devtools.ReactQueryDevtools;
var ReactQueryDevtoolsPanel2 = process.env.NODE_ENV !== "development" ? function() {
  return null;
} : DevtoolsPanel.ReactQueryDevtoolsPanel;
export {
  ReactQueryDevtools2 as ReactQueryDevtools,
  ReactQueryDevtoolsPanel2 as ReactQueryDevtoolsPanel
};
//# sourceMappingURL=index.js.map