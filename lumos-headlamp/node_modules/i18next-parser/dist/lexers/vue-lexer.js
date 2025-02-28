import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _inherits from "@babel/runtime/helpers/inherits";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";function _createSuper(Derived) {var hasNativeReflectConstruct = _isNativeReflectConstruct();return function _createSuperInternal() {var Super = _getPrototypeOf(Derived),result;if (hasNativeReflectConstruct) {var NewTarget = _getPrototypeOf(this).constructor;result = Reflect.construct(Super, arguments, NewTarget);} else {result = Super.apply(this, arguments);}return _possibleConstructorReturn(this, result);};}function _isNativeReflectConstruct() {if (typeof Reflect === "undefined" || !Reflect.construct) return false;if (Reflect.construct.sham) return false;if (typeof Proxy === "function") return true;try {Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));return true;} catch (e) {return false;}}import VueTemplateCompiler from 'vue-template-compiler';
import BaseLexer from './base-lexer.js';
import JavascriptLexer from './javascript-lexer.js';var

VueLexer = /*#__PURE__*/function (_BaseLexer) {_inherits(VueLexer, _BaseLexer);var _super = _createSuper(VueLexer);
  function VueLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, VueLexer);
    _this = _super.call(this, options);

    _this.functions = options.functions || ['$t'];return _this;
  }_createClass(VueLexer, [{ key: "extract", value:

    function extract(content, filename) {var _this2 = this;
      var keys = [];

      var Lexer = new JavascriptLexer();
      Lexer.on('warning', function (warning) {return _this2.emit('warning', warning);});
      keys = keys.concat(Lexer.extract(content));

      var compiledTemplate = VueTemplateCompiler.compile(content).render;
      var Lexer2 = new JavascriptLexer({ functions: this.functions });
      Lexer2.on('warning', function (warning) {return _this2.emit('warning', warning);});
      keys = keys.concat(Lexer2.extract(compiledTemplate));

      return keys;
    } }]);return VueLexer;}(BaseLexer);export { VueLexer as default };
//# sourceMappingURL=vue-lexer.js.map