import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import EventEmitter from 'events';var

BaseLexer = /*#__PURE__*/function (_EventEmitter) {
  function BaseLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, BaseLexer);
    _this = _callSuper(this, BaseLexer);
    _this.keys = [];
    _this.functions = options.functions || ['t'];return _this;
  }_inherits(BaseLexer, _EventEmitter);return _createClass(BaseLexer, [{ key: "validateString", value:

    function validateString(string) {
      var regex = new RegExp('^' + BaseLexer.stringPattern + '$', 'i');
      return regex.test(string);
    } }, { key: "functionPattern", value:

    function functionPattern() {
      return '(?:' + this.functions.join('|').replace('.', '\\.') + ')';
    } }], [{ key: "singleQuotePattern", get:

    function get() {
      return "'(?:[^'].*?[^\\\\])?'";
    } }, { key: "doubleQuotePattern", get:

    function get() {
      return '"(?:[^"].*?[^\\\\])?"';
    } }, { key: "backQuotePattern", get:

    function get() {
      return '`(?:[^`].*?[^\\\\])?`';
    } }, { key: "variablePattern", get:

    function get() {
      return '(?:[A-Z0-9_.-]+)';
    } }, { key: "stringPattern", get:

    function get() {
      return (
        '(?:' +
        [BaseLexer.singleQuotePattern, BaseLexer.doubleQuotePattern].join('|') +
        ')');

    } }, { key: "stringOrVariablePattern", get:

    function get() {
      return (
        '(?:' +
        [
        BaseLexer.singleQuotePattern,
        BaseLexer.doubleQuotePattern,
        BaseLexer.variablePattern].
        join('|') +
        ')');

    } }]);}(EventEmitter);export { BaseLexer as default };
//# sourceMappingURL=base-lexer.js.map