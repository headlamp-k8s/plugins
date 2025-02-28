import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
// If no effect ran after this amount of time, we assume that the render was not committed by React
var CLEANUP_TIMER_LOOP_MILLIS = 1000;
export var TimerBasedCleanupTracking = /*#__PURE__*/function () {
  function TimerBasedCleanupTracking() {
    var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : CLEANUP_TIMER_LOOP_MILLIS;
    _classCallCheck(this, TimerBasedCleanupTracking);
    this.timeouts = new Map();
    this.cleanupTimeout = CLEANUP_TIMER_LOOP_MILLIS;
    this.cleanupTimeout = timeout;
  }
  _createClass(TimerBasedCleanupTracking, [{
    key: "register",
    value: function register(object, unsubscribe, unregisterToken) {
      var _this = this;
      if (!this.timeouts) {
        this.timeouts = new Map();
      }
      var timeout = setTimeout(function () {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
        _this.timeouts.delete(unregisterToken.cleanupToken);
      }, this.cleanupTimeout);
      this.timeouts.set(unregisterToken.cleanupToken, timeout);
    }
  }, {
    key: "unregister",
    value: function unregister(unregisterToken) {
      var timeout = this.timeouts.get(unregisterToken.cleanupToken);
      if (timeout) {
        this.timeouts.delete(unregisterToken.cleanupToken);
        clearTimeout(timeout);
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      var _this2 = this;
      if (this.timeouts) {
        this.timeouts.forEach(function (value, key) {
          _this2.unregister({
            cleanupToken: key
          });
        });
        this.timeouts = undefined;
      }
    }
  }]);
  return TimerBasedCleanupTracking;
}();