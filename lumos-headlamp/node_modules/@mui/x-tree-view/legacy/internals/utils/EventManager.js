import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
// Used https://gist.github.com/mudge/5830382 as a starting point.
// See https://github.com/browserify/events/blob/master/events.js for
// the Node.js (https://nodejs.org/api/events.html) polyfill used by webpack.
export var EventManager = /*#__PURE__*/function () {
  function EventManager() {
    _classCallCheck(this, EventManager);
    this.maxListeners = 20;
    this.warnOnce = false;
    this.events = {};
  }
  _createClass(EventManager, [{
    key: "on",
    value: function on(eventName, listener) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var collection = this.events[eventName];
      if (!collection) {
        collection = {
          highPriority: new Map(),
          regular: new Map()
        };
        this.events[eventName] = collection;
      }
      if (options.isFirst) {
        collection.highPriority.set(listener, true);
      } else {
        collection.regular.set(listener, true);
      }
      if (process.env.NODE_ENV !== 'production') {
        var collectionSize = collection.highPriority.size + collection.regular.size;
        if (collectionSize > this.maxListeners && !this.warnOnce) {
          this.warnOnce = true;
          console.warn(["Possible EventEmitter memory leak detected. ".concat(collectionSize, " ").concat(eventName, " listeners added.")].join('\n'));
        }
      }
    }
  }, {
    key: "removeListener",
    value: function removeListener(eventName, listener) {
      if (this.events[eventName]) {
        this.events[eventName].regular.delete(listener);
        this.events[eventName].highPriority.delete(listener);
      }
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners() {
      this.events = {};
    }
  }, {
    key: "emit",
    value: function emit(eventName) {
      var collection = this.events[eventName];
      if (!collection) {
        return;
      }
      var highPriorityListeners = Array.from(collection.highPriority.keys());
      var regularListeners = Array.from(collection.regular.keys());
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      for (var i = highPriorityListeners.length - 1; i >= 0; i -= 1) {
        var listener = highPriorityListeners[i];
        if (collection.highPriority.has(listener)) {
          listener.apply(this, args);
        }
      }
      for (var _i = 0; _i < regularListeners.length; _i += 1) {
        var _listener = regularListeners[_i];
        if (collection.regular.has(_listener)) {
          _listener.apply(this, args);
        }
      }
    }
  }, {
    key: "once",
    value: function once(eventName, listener) {
      // eslint-disable-next-line consistent-this
      var that = this;
      this.on(eventName, function oneTimeListener() {
        that.removeListener(eventName, oneTimeListener);
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        listener.apply(that, args);
      });
    }
  }]);
  return EventManager;
}();