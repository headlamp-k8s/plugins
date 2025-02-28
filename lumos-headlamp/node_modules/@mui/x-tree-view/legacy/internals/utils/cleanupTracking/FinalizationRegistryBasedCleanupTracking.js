import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
export var FinalizationRegistryBasedCleanupTracking = /*#__PURE__*/function () {
  function FinalizationRegistryBasedCleanupTracking() {
    _classCallCheck(this, FinalizationRegistryBasedCleanupTracking);
    this.registry = new FinalizationRegistry(function (unsubscribe) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  }
  _createClass(FinalizationRegistryBasedCleanupTracking, [{
    key: "register",
    value: function register(object, unsubscribe, unregisterToken) {
      this.registry.register(object, unsubscribe, unregisterToken);
    }
  }, {
    key: "unregister",
    value: function unregister(unregisterToken) {
      this.registry.unregister(unregisterToken);
    }

    // eslint-disable-next-line class-methods-use-this
  }, {
    key: "reset",
    value: function reset() {}
  }]);
  return FinalizationRegistryBasedCleanupTracking;
}();