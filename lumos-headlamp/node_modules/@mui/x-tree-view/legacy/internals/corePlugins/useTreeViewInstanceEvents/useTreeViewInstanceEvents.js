import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import * as React from 'react';
import { EventManager } from '../../utils/EventManager';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
var isSyntheticEvent = function isSyntheticEvent(event) {
  return event.isPropagationStopped !== undefined;
};

/**
 * Plugin responsible for the registration of the nodes defined as JSX children of the TreeView.
 * When we will have both a SimpleTreeView using JSX children and a TreeView using a data prop,
 * this plugin will only be used by SimpleTreeView.
 */
export var useTreeViewInstanceEvents = function useTreeViewInstanceEvents(_ref) {
  var instance = _ref.instance;
  var _React$useState = React.useState(function () {
      return new EventManager();
    }),
    _React$useState2 = _slicedToArray(_React$useState, 1),
    eventManager = _React$useState2[0];
  var publishEvent = React.useCallback(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var name = args[0],
      params = args[1],
      _args$ = args[2],
      event = _args$ === void 0 ? {} : _args$;
    event.defaultMuiPrevented = false;
    if (isSyntheticEvent(event) && event.isPropagationStopped()) {
      return;
    }
    eventManager.emit(name, params, event);
  }, [eventManager]);
  var subscribeEvent = React.useCallback(function (event, handler) {
    eventManager.on(event, handler);
    return function () {
      eventManager.removeListener(event, handler);
    };
  }, [eventManager]);
  populateInstance(instance, {
    $$publishEvent: publishEvent,
    $$subscribeEvent: subscribeEvent
  });
};