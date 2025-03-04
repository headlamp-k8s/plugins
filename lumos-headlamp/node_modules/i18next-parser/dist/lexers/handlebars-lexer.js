import _defineProperty from "@babel/runtime/helpers/defineProperty";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import BaseLexer from './base-lexer.js';var

HandlebarsLexer = /*#__PURE__*/function (_BaseLexer) {
  function HandlebarsLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, HandlebarsLexer);
    _this = _callSuper(this, HandlebarsLexer, [options]);

    _this.functions = options.functions || ['t'];

    _this.createFunctionRegex();
    _this.createArgumentsRegex();return _this;
  }_inherits(HandlebarsLexer, _BaseLexer);return _createClass(HandlebarsLexer, [{ key: "extract", value:

    function extract(content) {
      var matches;

      while (matches = this.functionRegex.exec(content)) {
        var args = this.parseArguments(matches[1] || matches[2]);
        this.populateKeysFromArguments(args);
      }

      return this.keys;
    } }, { key: "parseArguments", value:

    function parseArguments(args) {
      var matches;
      var result = {
        arguments: [],
        options: {}
      };
      while (matches = this.argumentsRegex.exec(args)) {
        var arg = matches[1];
        var parts = arg.split('=');
        result.arguments.push(arg);
        if (parts.length === 2 && this.validateString(parts[1])) {
          var value = parts[1].slice(1, -1);
          if (value === 'true') {
            result.options[parts[0]] = true;
          } else if (value === 'false') {
            result.options[parts[0]] = false;
          } else {
            result.options[parts[0]] = value;
          }
        }
      }
      return result;
    } }, { key: "populateKeysFromArguments", value:

    function populateKeysFromArguments(args) {
      var firstArgument = args.arguments[0];
      var secondArgument = args.arguments[1];
      var isKeyString = this.validateString(firstArgument);
      var isDefaultValueString = this.validateString(secondArgument);

      if (!isKeyString) {
        this.emit('warning', "Key is not a string literal: ".concat(firstArgument));
      } else {
        var result = _objectSpread(_objectSpread({},
        args.options), {}, {
          key: firstArgument.slice(1, -1) });

        if (isDefaultValueString) {
          result.defaultValue = secondArgument.slice(1, -1);
        }
        this.keys.push(result);
      }
    } }, { key: "createFunctionRegex", value:

    function createFunctionRegex() {
      var functionPattern = this.functionPattern();
      var curlyPattern = '(?:{{)' + functionPattern + '\\s+(.*?)(?:}})';
      var parenthesisPattern = '(?:\\()' + functionPattern + '\\s+(.*)(?:\\))';
      var pattern = curlyPattern + '|' + parenthesisPattern;
      this.functionRegex = new RegExp(pattern, 'gi');
      return this.functionRegex;
    } }, { key: "createArgumentsRegex", value:

    function createArgumentsRegex() {
      var pattern =
      '(?:\\s+|^)' +
      '(' +
      '(?:' +
      BaseLexer.variablePattern +
      '(?:=' +
      BaseLexer.stringOrVariablePattern +
      ')?' +
      ')' +
      '|' +
      BaseLexer.stringPattern +
      ')';
      this.argumentsRegex = new RegExp(pattern, 'gi');
      return this.argumentsRegex;
    } }]);}(BaseLexer);export { HandlebarsLexer as default };
//# sourceMappingURL=handlebars-lexer.js.map