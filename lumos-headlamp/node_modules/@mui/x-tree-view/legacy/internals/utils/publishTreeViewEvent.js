export var publishTreeViewEvent = function publishTreeViewEvent(instance, eventName, params) {
  instance.$$publishEvent(eventName, params);
};