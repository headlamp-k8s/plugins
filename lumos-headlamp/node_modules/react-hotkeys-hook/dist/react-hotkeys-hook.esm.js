import { useContext, createContext, useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { jsx } from 'react/jsx-runtime';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

var reservedModifierKeywords = ['shift', 'alt', 'meta', 'mod', 'ctrl'];
var mappedKeys = {
  esc: 'escape',
  "return": 'enter',
  '.': 'period',
  ',': 'comma',
  '-': 'slash',
  ' ': 'space',
  '`': 'backquote',
  '#': 'backslash',
  '+': 'bracketright',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  AltLeft: 'alt',
  AltRight: 'alt',
  MetaLeft: 'meta',
  MetaRight: 'meta',
  OSLeft: 'meta',
  OSRight: 'meta',
  ControlLeft: 'ctrl',
  ControlRight: 'ctrl'
};
function mapKey(key) {
  return (key && mappedKeys[key] || key || '').trim().toLowerCase().replace(/key|digit|numpad|arrow/, '');
}
function isHotkeyModifier(key) {
  return reservedModifierKeywords.includes(key);
}
function parseKeysHookInput(keys, splitKey) {
  if (splitKey === void 0) {
    splitKey = ',';
  }
  return keys.split(splitKey);
}
function parseHotkey(hotkey, combinationKey, description) {
  if (combinationKey === void 0) {
    combinationKey = '+';
  }
  var keys = hotkey.toLocaleLowerCase().split(combinationKey).map(function (k) {
    return mapKey(k);
  });
  var modifiers = {
    alt: keys.includes('alt'),
    ctrl: keys.includes('ctrl') || keys.includes('control'),
    shift: keys.includes('shift'),
    meta: keys.includes('meta'),
    mod: keys.includes('mod')
  };
  var singleCharKeys = keys.filter(function (k) {
    return !reservedModifierKeywords.includes(k);
  });
  return _extends({}, modifiers, {
    keys: singleCharKeys,
    description: description,
    hotkey: hotkey
  });
}

(function () {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function (e) {
      if (e.key === undefined) {
        // Synthetic event (e.g., Chrome autofill).  Ignore.
        return;
      }
      pushToCurrentlyPressedKeys([mapKey(e.key), mapKey(e.code)]);
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === undefined) {
        // Synthetic event (e.g., Chrome autofill).  Ignore.
        return;
      }
      removeFromCurrentlyPressedKeys([mapKey(e.key), mapKey(e.code)]);
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('blur', function () {
      currentlyPressedKeys.clear();
    });
  }
})();
var currentlyPressedKeys = /*#__PURE__*/new Set();
// https://github.com/microsoft/TypeScript/issues/17002
function isReadonlyArray(value) {
  return Array.isArray(value);
}
function isHotkeyPressed(key, splitKey) {
  if (splitKey === void 0) {
    splitKey = ',';
  }
  var hotkeyArray = isReadonlyArray(key) ? key : key.split(splitKey);
  return hotkeyArray.every(function (hotkey) {
    return currentlyPressedKeys.has(hotkey.trim().toLowerCase());
  });
}
function pushToCurrentlyPressedKeys(key) {
  var hotkeyArray = Array.isArray(key) ? key : [key];
  /*
  Due to a weird behavior on macOS we need to clear the set if the user pressed down the meta key and presses another key.
  https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
  Otherwise the set will hold all ever pressed keys while the meta key is down which leads to wrong results.
   */
  if (currentlyPressedKeys.has('meta')) {
    currentlyPressedKeys.forEach(function (key) {
      return !isHotkeyModifier(key) && currentlyPressedKeys["delete"](key.toLowerCase());
    });
  }
  hotkeyArray.forEach(function (hotkey) {
    return currentlyPressedKeys.add(hotkey.toLowerCase());
  });
}
function removeFromCurrentlyPressedKeys(key) {
  var hotkeyArray = Array.isArray(key) ? key : [key];
  /*
  Due to a weird behavior on macOS we need to clear the set if the user pressed down the meta key and presses another key.
  https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
  Otherwise the set will hold all ever pressed keys while the meta key is down which leads to wrong results.
   */
  if (key === 'meta') {
    currentlyPressedKeys.clear();
  } else {
    hotkeyArray.forEach(function (hotkey) {
      return currentlyPressedKeys["delete"](hotkey.toLowerCase());
    });
  }
}

function maybePreventDefault(e, hotkey, preventDefault) {
  if (typeof preventDefault === 'function' && preventDefault(e, hotkey) || preventDefault === true) {
    e.preventDefault();
  }
}
function isHotkeyEnabled(e, hotkey, enabled) {
  if (typeof enabled === 'function') {
    return enabled(e, hotkey);
  }
  return enabled === true || enabled === undefined;
}
function isKeyboardEventTriggeredByInput(ev) {
  return isHotkeyEnabledOnTag(ev, ['input', 'textarea', 'select']);
}
function isHotkeyEnabledOnTag(event, enabledOnTags) {
  if (enabledOnTags === void 0) {
    enabledOnTags = false;
  }
  var target = event.target,
    composed = event.composed;
  var targetTagName = null;
  if (isCustomElement(target) && composed) {
    targetTagName = event.composedPath()[0] && event.composedPath()[0].tagName;
  } else {
    targetTagName = target && target.tagName;
  }
  if (isReadonlyArray(enabledOnTags)) {
    return Boolean(targetTagName && enabledOnTags && enabledOnTags.some(function (tag) {
      var _targetTagName;
      return tag.toLowerCase() === ((_targetTagName = targetTagName) == null ? void 0 : _targetTagName.toLowerCase());
    }));
  }
  return Boolean(targetTagName && enabledOnTags && enabledOnTags);
}
function isCustomElement(element) {
  // We just do a basic check w/o any complex RegEx or validation against the list of legacy names containing a hyphen,
  // as none of them is likely to be an event target, and it won't hurt anyway if we miss.
  // see: https://html.spec.whatwg.org/multipage/custom-elements.html#prod-potentialcustomelementname
  return !!element.tagName && !element.tagName.startsWith("-") && element.tagName.includes("-");
}
function isScopeActive(activeScopes, scopes) {
  if (activeScopes.length === 0 && scopes) {
    console.warn('A hotkey has the "scopes" option set, however no active scopes were found. If you want to use the global scopes feature, you need to wrap your app in a <HotkeysProvider>');
    return true;
  }
  if (!scopes) {
    return true;
  }
  return activeScopes.some(function (scope) {
    return scopes.includes(scope);
  }) || activeScopes.includes('*');
}
var isHotkeyMatchingKeyboardEvent = function isHotkeyMatchingKeyboardEvent(e, hotkey, ignoreModifiers) {
  if (ignoreModifiers === void 0) {
    ignoreModifiers = false;
  }
  var alt = hotkey.alt,
    meta = hotkey.meta,
    mod = hotkey.mod,
    shift = hotkey.shift,
    ctrl = hotkey.ctrl,
    keys = hotkey.keys;
  var pressedKeyUppercase = e.key,
    code = e.code,
    ctrlKey = e.ctrlKey,
    metaKey = e.metaKey,
    shiftKey = e.shiftKey,
    altKey = e.altKey;
  var keyCode = mapKey(code);
  var pressedKey = pressedKeyUppercase.toLowerCase();
  if (!(keys != null && keys.includes(keyCode)) && !(keys != null && keys.includes(pressedKey)) && !['ctrl', 'control', 'unknown', 'meta', 'alt', 'shift', 'os'].includes(keyCode)) {
    return false;
  }
  if (!ignoreModifiers) {
    // We check the pressed keys for compatibility with the keyup event. In keyup events the modifier flags are not set.
    if (alt === !altKey && pressedKey !== 'alt') {
      return false;
    }
    if (shift === !shiftKey && pressedKey !== 'shift') {
      return false;
    }
    // Mod is a special key name that is checking for meta on macOS and ctrl on other platforms
    if (mod) {
      if (!metaKey && !ctrlKey) {
        return false;
      }
    } else {
      if (meta === !metaKey && pressedKey !== 'meta' && pressedKey !== 'os') {
        return false;
      }
      if (ctrl === !ctrlKey && pressedKey !== 'ctrl' && pressedKey !== 'control') {
        return false;
      }
    }
  }
  // All modifiers are correct, now check the key
  // If the key is set, we check for the key
  if (keys && keys.length === 1 && (keys.includes(pressedKey) || keys.includes(keyCode))) {
    return true;
  } else if (keys) {
    // Check if all keys are present in pressedDownKeys set
    return isHotkeyPressed(keys);
  } else if (!keys) {
    // If the key is not set, we only listen for modifiers, that check went alright, so we return true
    return true;
  }
  // There is nothing that matches.
  return false;
};

var BoundHotkeysProxyProvider = /*#__PURE__*/createContext(undefined);
var useBoundHotkeysProxy = function useBoundHotkeysProxy() {
  return useContext(BoundHotkeysProxyProvider);
};
function BoundHotkeysProxyProviderProvider(_ref) {
  var addHotkey = _ref.addHotkey,
    removeHotkey = _ref.removeHotkey,
    children = _ref.children;
  return /*#__PURE__*/jsx(BoundHotkeysProxyProvider.Provider, {
    value: {
      addHotkey: addHotkey,
      removeHotkey: removeHotkey
    },
    children: children
  });
}

function deepEqual(x, y) {
  //@ts-ignore
  return x && y && typeof x === 'object' && typeof y === 'object' ? Object.keys(x).length === Object.keys(y).length &&
  //@ts-ignore
  Object.keys(x).reduce(function (isEqual, key) {
    return isEqual && deepEqual(x[key], y[key]);
  }, true) : x === y;
}

var HotkeysContext = /*#__PURE__*/createContext({
  hotkeys: [],
  enabledScopes: [],
  toggleScope: function toggleScope() {},
  enableScope: function enableScope() {},
  disableScope: function disableScope() {}
});
var useHotkeysContext = function useHotkeysContext() {
  return useContext(HotkeysContext);
};
var HotkeysProvider = function HotkeysProvider(_ref) {
  var _ref$initiallyActiveS = _ref.initiallyActiveScopes,
    initiallyActiveScopes = _ref$initiallyActiveS === void 0 ? ['*'] : _ref$initiallyActiveS,
    children = _ref.children;
  var _useState = useState((initiallyActiveScopes == null ? void 0 : initiallyActiveScopes.length) > 0 ? initiallyActiveScopes : ['*']),
    internalActiveScopes = _useState[0],
    setInternalActiveScopes = _useState[1];
  var _useState2 = useState([]),
    boundHotkeys = _useState2[0],
    setBoundHotkeys = _useState2[1];
  var enableScope = useCallback(function (scope) {
    setInternalActiveScopes(function (prev) {
      if (prev.includes('*')) {
        return [scope];
      }
      return Array.from(new Set([].concat(prev, [scope])));
    });
  }, []);
  var disableScope = useCallback(function (scope) {
    setInternalActiveScopes(function (prev) {
      if (prev.filter(function (s) {
        return s !== scope;
      }).length === 0) {
        return ['*'];
      } else {
        return prev.filter(function (s) {
          return s !== scope;
        });
      }
    });
  }, []);
  var toggleScope = useCallback(function (scope) {
    setInternalActiveScopes(function (prev) {
      if (prev.includes(scope)) {
        if (prev.filter(function (s) {
          return s !== scope;
        }).length === 0) {
          return ['*'];
        } else {
          return prev.filter(function (s) {
            return s !== scope;
          });
        }
      } else {
        if (prev.includes('*')) {
          return [scope];
        }
        return Array.from(new Set([].concat(prev, [scope])));
      }
    });
  }, []);
  var addBoundHotkey = useCallback(function (hotkey) {
    setBoundHotkeys(function (prev) {
      return [].concat(prev, [hotkey]);
    });
  }, []);
  var removeBoundHotkey = useCallback(function (hotkey) {
    setBoundHotkeys(function (prev) {
      return prev.filter(function (h) {
        return !deepEqual(h, hotkey);
      });
    });
  }, []);
  return /*#__PURE__*/jsx(HotkeysContext.Provider, {
    value: {
      enabledScopes: internalActiveScopes,
      hotkeys: boundHotkeys,
      enableScope: enableScope,
      disableScope: disableScope,
      toggleScope: toggleScope
    },
    children: /*#__PURE__*/jsx(BoundHotkeysProxyProviderProvider, {
      addHotkey: addBoundHotkey,
      removeHotkey: removeBoundHotkey,
      children: children
    })
  });
};

function useDeepEqualMemo(value) {
  var ref = useRef(undefined);
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

var stopPropagation = function stopPropagation(e) {
  e.stopPropagation();
  e.preventDefault();
  e.stopImmediatePropagation();
};
var useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
function useHotkeys(keys, callback, options, dependencies) {
  var _useState = useState(null),
    ref = _useState[0],
    setRef = _useState[1];
  var hasTriggeredRef = useRef(false);
  var _options = !(options instanceof Array) ? options : !(dependencies instanceof Array) ? dependencies : undefined;
  var _keys = isReadonlyArray(keys) ? keys.join(_options == null ? void 0 : _options.splitKey) : keys;
  var _deps = options instanceof Array ? options : dependencies instanceof Array ? dependencies : undefined;
  var memoisedCB = useCallback(callback, _deps != null ? _deps : []);
  var cbRef = useRef(memoisedCB);
  if (_deps) {
    cbRef.current = memoisedCB;
  } else {
    cbRef.current = callback;
  }
  var memoisedOptions = useDeepEqualMemo(_options);
  var _useHotkeysContext = useHotkeysContext(),
    enabledScopes = _useHotkeysContext.enabledScopes;
  var proxy = useBoundHotkeysProxy();
  useSafeLayoutEffect(function () {
    if ((memoisedOptions == null ? void 0 : memoisedOptions.enabled) === false || !isScopeActive(enabledScopes, memoisedOptions == null ? void 0 : memoisedOptions.scopes)) {
      return;
    }
    var listener = function listener(e, isKeyUp) {
      var _e$target;
      if (isKeyUp === void 0) {
        isKeyUp = false;
      }
      if (isKeyboardEventTriggeredByInput(e) && !isHotkeyEnabledOnTag(e, memoisedOptions == null ? void 0 : memoisedOptions.enableOnFormTags)) {
        return;
      }
      // TODO: SINCE THE EVENT IS NOW ATTACHED TO THE REF, THE ACTIVE ELEMENT CAN NEVER BE INSIDE THE REF. THE HOTKEY ONLY TRIGGERS IF THE
      // REF IS THE ACTIVE ELEMENT. THIS IS A PROBLEM SINCE FOCUSED SUB COMPONENTS WON'T TRIGGER THE HOTKEY.
      if (ref !== null) {
        var rootNode = ref.getRootNode();
        if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement !== ref && !ref.contains(rootNode.activeElement)) {
          stopPropagation(e);
          return;
        }
      }
      if ((_e$target = e.target) != null && _e$target.isContentEditable && !(memoisedOptions != null && memoisedOptions.enableOnContentEditable)) {
        return;
      }
      parseKeysHookInput(_keys, memoisedOptions == null ? void 0 : memoisedOptions.splitKey).forEach(function (key) {
        var _hotkey$keys;
        var hotkey = parseHotkey(key, memoisedOptions == null ? void 0 : memoisedOptions.combinationKey);
        if (isHotkeyMatchingKeyboardEvent(e, hotkey, memoisedOptions == null ? void 0 : memoisedOptions.ignoreModifiers) || (_hotkey$keys = hotkey.keys) != null && _hotkey$keys.includes('*')) {
          if (memoisedOptions != null && memoisedOptions.ignoreEventWhen != null && memoisedOptions.ignoreEventWhen(e)) {
            return;
          }
          if (isKeyUp && hasTriggeredRef.current) {
            return;
          }
          maybePreventDefault(e, hotkey, memoisedOptions == null ? void 0 : memoisedOptions.preventDefault);
          if (!isHotkeyEnabled(e, hotkey, memoisedOptions == null ? void 0 : memoisedOptions.enabled)) {
            stopPropagation(e);
            return;
          }
          // Execute the user callback for that hotkey
          cbRef.current(e, hotkey);
          if (!isKeyUp) {
            hasTriggeredRef.current = true;
          }
        }
      });
    };
    var handleKeyDown = function handleKeyDown(event) {
      if (event.key === undefined) {
        // Synthetic event (e.g., Chrome autofill).  Ignore.
        return;
      }
      pushToCurrentlyPressedKeys(mapKey(event.code));
      if ((memoisedOptions == null ? void 0 : memoisedOptions.keydown) === undefined && (memoisedOptions == null ? void 0 : memoisedOptions.keyup) !== true || memoisedOptions != null && memoisedOptions.keydown) {
        listener(event);
      }
    };
    var handleKeyUp = function handleKeyUp(event) {
      if (event.key === undefined) {
        // Synthetic event (e.g., Chrome autofill).  Ignore.
        return;
      }
      removeFromCurrentlyPressedKeys(mapKey(event.code));
      hasTriggeredRef.current = false;
      if (memoisedOptions != null && memoisedOptions.keyup) {
        listener(event, true);
      }
    };
    var domNode = ref || (_options == null ? void 0 : _options.document) || document;
    // @ts-ignore
    domNode.addEventListener('keyup', handleKeyUp);
    // @ts-ignore
    domNode.addEventListener('keydown', handleKeyDown);
    if (proxy) {
      parseKeysHookInput(_keys, memoisedOptions == null ? void 0 : memoisedOptions.splitKey).forEach(function (key) {
        return proxy.addHotkey(parseHotkey(key, memoisedOptions == null ? void 0 : memoisedOptions.combinationKey, memoisedOptions == null ? void 0 : memoisedOptions.description));
      });
    }
    return function () {
      // @ts-ignore
      domNode.removeEventListener('keyup', handleKeyUp);
      // @ts-ignore
      domNode.removeEventListener('keydown', handleKeyDown);
      if (proxy) {
        parseKeysHookInput(_keys, memoisedOptions == null ? void 0 : memoisedOptions.splitKey).forEach(function (key) {
          return proxy.removeHotkey(parseHotkey(key, memoisedOptions == null ? void 0 : memoisedOptions.combinationKey, memoisedOptions == null ? void 0 : memoisedOptions.description));
        });
      }
    };
  }, [ref, _keys, memoisedOptions, enabledScopes]);
  return setRef;
}

function useRecordHotkeys() {
  var _useState = useState(new Set()),
    keys = _useState[0],
    setKeys = _useState[1];
  var _useState2 = useState(false),
    isRecording = _useState2[0],
    setIsRecording = _useState2[1];
  var handler = useCallback(function (event) {
    if (event.key === undefined) {
      // Synthetic event (e.g., Chrome autofill).  Ignore.
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setKeys(function (prev) {
      var newKeys = new Set(prev);
      newKeys.add(mapKey(event.code));
      return newKeys;
    });
  }, []);
  var stop = useCallback(function () {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handler);
      setIsRecording(false);
    }
  }, [handler]);
  var start = useCallback(function () {
    setKeys(new Set());
    if (typeof document !== 'undefined') {
      stop();
      document.addEventListener('keydown', handler);
      setIsRecording(true);
    }
  }, [handler, stop]);
  var resetKeys = useCallback(function () {
    setKeys(new Set());
  }, []);
  return [keys, {
    start: start,
    stop: stop,
    resetKeys: resetKeys,
    isRecording: isRecording
  }];
}

export { HotkeysProvider, isHotkeyPressed, useHotkeys, useHotkeysContext, useRecordHotkeys };
//# sourceMappingURL=react-hotkeys-hook.esm.js.map
