export const publishTreeViewEvent = (instance, eventName, params) => {
  instance.$$publishEvent(eventName, params);
};