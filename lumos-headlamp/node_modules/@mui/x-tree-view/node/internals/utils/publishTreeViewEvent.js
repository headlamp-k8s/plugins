"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.publishTreeViewEvent = void 0;
const publishTreeViewEvent = (instance, eventName, params) => {
  instance.$$publishEvent(eventName, params);
};
exports.publishTreeViewEvent = publishTreeViewEvent;