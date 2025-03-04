import _defineProperty from "@babel/runtime/helpers/defineProperty";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function _createForOfIteratorHelper(o, allowArrayLike) {var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];if (!it) {if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {if (it) o = it;var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion = true,didErr = false,err;return { s: function s() {it = it.call(o);}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it["return"] != null) it["return"]();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import path from 'path';
import EventEmitter from 'events';
import HandlebarsLexer from './lexers/handlebars-lexer.js';
import HTMLLexer from './lexers/html-lexer.js';
import JavascriptLexer from './lexers/javascript-lexer.js';
import JsxLexer from './lexers/jsx-lexer.js';

var lexers = {
  hbs: ['HandlebarsLexer'],
  handlebars: ['HandlebarsLexer'],

  htm: ['HTMLLexer'],
  html: ['HTMLLexer'],

  mjs: ['JavascriptLexer'],
  js: ['JavascriptLexer'],
  ts: ['JavascriptLexer'],
  jsx: ['JsxLexer'],
  tsx: ['JsxLexer'],

  vue: ['JavascriptLexer'],

  "default": ['JavascriptLexer']
};

var lexersMap = {
  HandlebarsLexer: HandlebarsLexer,
  HTMLLexer: HTMLLexer,
  JavascriptLexer: JavascriptLexer,
  JsxLexer: JsxLexer
};var

Parser = /*#__PURE__*/function (_EventEmitter) {
  function Parser() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, Parser);
    _this = _callSuper(this, Parser, [options]);
    _this.options = options;
    _this.lexers = _objectSpread(_objectSpread({}, lexers), options.lexers);return _this;
  }_inherits(Parser, _EventEmitter);return _createClass(Parser, [{ key: "parse", value:

    function parse(content, filename) {var _this2 = this;
      var keys = [];
      var extension = path.extname(filename).substr(1);
      var lexers = this.lexers[extension] || this.lexers["default"];var _iterator = _createForOfIteratorHelper(

          lexers),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var lexerConfig = _step.value;
          var lexerName = void 0;
          var lexerOptions = void 0;

          if (
          typeof lexerConfig === 'string' ||
          typeof lexerConfig === 'function')
          {
            lexerName = lexerConfig;
            lexerOptions = {};
          } else {
            lexerName = lexerConfig.lexer;
            lexerOptions = lexerConfig;
          }

          var Lexer = void 0;
          if (typeof lexerName === 'function') {
            Lexer = lexerName;
          } else {
            if (!lexersMap[lexerName]) {
              this.emit('error', new Error("Lexer '".concat(lexerName, "' does not exist")));
            }

            Lexer = lexersMap[lexerName];
          }

          var lexer = new Lexer(lexerOptions);
          lexer.on('warning', function (warning) {return _this2.emit('warning', warning);});
          keys = keys.concat(lexer.extract(content, filename));
        }} catch (err) {_iterator.e(err);} finally {_iterator.f();}

      return keys;
    } }]);}(EventEmitter);export { Parser as default };
//# sourceMappingURL=parser.js.map