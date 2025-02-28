import _defineProperty from "@babel/runtime/helpers/defineProperty";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _createForOfIteratorHelper(o, allowArrayLike) {var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];if (!it) {if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {if (it) o = it;var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion = true,didErr = false,err;return { s: function s() {it = it.call(o);}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it["return"] != null) it["return"]();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import BaseLexer from './base-lexer.js';
import * as cheerio from 'cheerio';var

HTMLLexer = /*#__PURE__*/function (_BaseLexer) {
  function HTMLLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, HTMLLexer);
    _this = _callSuper(this, HTMLLexer, [options]);

    _this.attr = options.attr || 'data-i18n';
    _this.optionAttr = options.optionAttr || 'data-i18n-options';return _this;
  }_inherits(HTMLLexer, _BaseLexer);return _createClass(HTMLLexer, [{ key: "extract", value:

    function extract(content) {var _this2 = this;
      var that = this;
      var $ = cheerio.load(content);
      $("[".concat(that.attr, "]")).each(function (index, node) {
        var $node = cheerio.load(node);

        // the attribute can hold multiple keys
        var keys = node.attribs[that.attr].split(';');
        var options = node.attribs[that.optionAttr];

        if (options) {
          try {
            options = JSON.parse(options);
          } finally {
          }
        }var _iterator = _createForOfIteratorHelper(

            keys),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var key = _step.value;
            // remove any leading [] in the key
            key = key.replace(/^\[[a-zA-Z0-9_-]*\]/, '');

            // if empty grab innerHTML from regex
            key = key || $node.text();

            if (key) {
              _this2.keys.push(_objectSpread(_objectSpread({}, options), {}, { key: key }));
            }
          }} catch (err) {_iterator.e(err);} finally {_iterator.f();}
      });

      return this.keys;
    } }]);}(BaseLexer);export { HTMLLexer as default };
//# sourceMappingURL=html-lexer.js.map