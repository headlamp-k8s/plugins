import _typeof from "@babel/runtime/helpers/typeof";import _slicedToArray from "@babel/runtime/helpers/slicedToArray";import _objectWithoutProperties from "@babel/runtime/helpers/objectWithoutProperties";import _defineProperty from "@babel/runtime/helpers/defineProperty";import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";var _excluded = ["functionName"];function _createForOfIteratorHelper(o, allowArrayLike) {var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];if (!it) {if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {if (it) o = it;var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion = true,didErr = false,err;return { s: function s() {it = it.call(o);}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it["return"] != null) it["return"]();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import BaseLexer from './base-lexer.js';
import ts from 'typescript';var

JavascriptLexer = /*#__PURE__*/function (_BaseLexer) {
  function JavascriptLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, JavascriptLexer);
    _this = _callSuper(this, JavascriptLexer, [options]);

    _this.callPattern = '(?<=^|\\s|\\.)' + _this.functionPattern() + '\\(.*\\)';
    _this.functions = options.functions || ['t'];
    _this.namespaceFunctions = options.namespaceFunctions || [
    'useTranslation',
    'withTranslation'];

    _this.attr = options.attr || 'i18nKey';
    _this.parseGenerics = options.parseGenerics || false;
    _this.typeMap = options.typeMap || {};
    _this.translationFunctionsWithArgs = {};return _this;
  }_inherits(JavascriptLexer, _BaseLexer);return _createClass(JavascriptLexer, [{ key: "createCommentNodeParser", value:

    function createCommentNodeParser() {var _this2 = this;
      var visitedComments = new Set();

      return function (keys, node, content) {
        ts.forEachLeadingCommentRange(
          content,
          node.getFullStart(),
          function (pos, end, kind) {
            var commentId = "".concat(pos, "_").concat(end);
            if (
            (kind === ts.SyntaxKind.MultiLineCommentTrivia ||
            kind === ts.SyntaxKind.SingleLineCommentTrivia) &&
            !visitedComments.has(commentId))
            {
              visitedComments.add(commentId);
              var text = content.slice(pos, end);
              var commentKeys = _this2.commentExtractor.call(_this2, text);
              if (commentKeys) {
                keys.push.apply(keys, _toConsumableArray(commentKeys));
              }
            }
          }
        );
      };
    } }, { key: "setNamespaces", value:

    function setNamespaces(keys) {var _this3 = this;
      return keys.map(function (entry) {var _ref, _entry$ns, _this3$translationFun;
        var namespace = (_ref = (_entry$ns =
        entry.ns) !== null && _entry$ns !== void 0 ? _entry$ns : (_this3$translationFun =
        _this3.translationFunctionsWithArgs) === null || _this3$translationFun === void 0 || (_this3$translationFun = _this3$translationFun[entry.functionName]) === null || _this3$translationFun === void 0 ? void 0 : _this3$translationFun.ns) !== null && _ref !== void 0 ? _ref :
        _this3.defaultNamespace;
        return namespace ? _objectSpread(_objectSpread({},

        entry), {}, {
          namespace: namespace }) :

        entry;
      });
    } }, { key: "setKeyPrefixes", value:

    function setKeyPrefixes(keys) {var _this4 = this;
      return keys.map(function (_ref2) {var _this4$translationFun, _this4$translationFun2;var functionName = _ref2.functionName,key = _objectWithoutProperties(_ref2, _excluded);
        var keyPrefix = (_this4$translationFun = (_this4$translationFun2 =
        _this4.translationFunctionsWithArgs) === null || _this4$translationFun2 === void 0 || (_this4$translationFun2 = _this4$translationFun2[functionName]) === null || _this4$translationFun2 === void 0 ? void 0 : _this4$translationFun2.keyPrefix) !== null && _this4$translationFun !== void 0 ? _this4$translationFun :
        _this4.keyPrefix;
        return keyPrefix ? _objectSpread(_objectSpread({},

        key), {}, {
          keyPrefix: keyPrefix }) :

        key;
      });
    } }, { key: "variableDeclarationExtractor", value:

    function variableDeclarationExtractor(node) {var _node$name$elements, _ref3, _firstDeconstructedPr, _firstDeconstructedPr2, _node$initializer$exp;
      var firstDeconstructedProp = (_node$name$elements = node.name.elements) === null || _node$name$elements === void 0 ? void 0 : _node$name$elements[0];
      if (
      ((_ref3 = (_firstDeconstructedPr = firstDeconstructedProp === null || firstDeconstructedProp === void 0 ? void 0 : firstDeconstructedProp.propertyName) !== null && _firstDeconstructedPr !== void 0 ? _firstDeconstructedPr : firstDeconstructedProp === null || firstDeconstructedProp === void 0 ? void 0 : firstDeconstructedProp.name) === null || _ref3 === void 0 ? void 0 : _ref3.
      escapedText) === 't' &&
      this.functions.includes(firstDeconstructedProp === null || firstDeconstructedProp === void 0 || (_firstDeconstructedPr2 = firstDeconstructedProp.name) === null || _firstDeconstructedPr2 === void 0 ? void 0 : _firstDeconstructedPr2.escapedText) &&
      this.namespaceFunctions.includes((_node$initializer$exp = node.initializer.expression) === null || _node$initializer$exp === void 0 ? void 0 : _node$initializer$exp.escapedText))
      {var _firstDeconstructedPr3;
        this.translationFunctionsWithArgs[
        firstDeconstructedProp.name.escapedText] =
        {
          pos: node.initializer.pos,
          storeGlobally: !((_firstDeconstructedPr3 = firstDeconstructedProp.propertyName) !== null && _firstDeconstructedPr3 !== void 0 && _firstDeconstructedPr3.escapedText)
        };
      }
    } }, { key: "extract", value:

    function extract(content) {var _this5 = this;var filename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '__default.js';
      var keys = [];

      var parseCommentNode = this.createCommentNodeParser();

      var _parseTree = function parseTree(node) {
        parseCommentNode(keys, node, content);

        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
          _this5.variableDeclarationExtractor.call(_this5, node);
        }
        if (
        node.kind === ts.SyntaxKind.ArrowFunction ||
        node.kind === ts.SyntaxKind.FunctionDeclaration)
        {
          _this5.functionParamExtractor.call(_this5, node);
        }

        if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
          var entry = _this5.taggedTemplateExpressionExtractor.call(_this5, node);
          if (entry) {
            keys.push(entry);
          }
        }

        if (node.kind === ts.SyntaxKind.CallExpression) {
          var entries = _this5.expressionExtractor.call(_this5, node);
          if (entries) {
            keys.push.apply(keys, _toConsumableArray(entries));
          }
        }

        node.forEachChild(_parseTree);
      };

      var sourceFile = ts.createSourceFile(
        filename,
        content,
        ts.ScriptTarget.Latest
      );
      _parseTree(sourceFile);

      return this.setKeyPrefixes(this.setNamespaces(keys));
    }

    /** @param {ts.FunctionLikeDeclaration} node */ }, { key: "functionParamExtractor", value:
    function functionParamExtractor(node) {var _this6 = this;
      var tFunctionParam =
      node.parameters &&
      node.parameters.find(
        function (param) {return (
            param.name &&
            param.name.kind === ts.SyntaxKind.Identifier &&
            _this6.functions.includes(param.name.text));}
      );

      if (
      tFunctionParam &&
      tFunctionParam.type &&
      tFunctionParam.type.typeName &&
      tFunctionParam.type.typeName.text === 'TFunction')
      {
        var typeArguments = tFunctionParam.type.typeArguments;
        if (
        typeArguments &&
        typeArguments.length &&
        typeArguments[0].kind === ts.SyntaxKind.LiteralType)
        {
          this.defaultNamespace = typeArguments[0].literal.text;
        }
      }
    } }, { key: "taggedTemplateExpressionExtractor", value:

    function taggedTemplateExpressionExtractor(node) {
      var entry = {};

      var tag = node.tag,template = node.template;

      var isTranslationFunction =
      tag.text && this.functions.includes(tag.text) ||
      tag.name && this.functions.includes(tag.name.text);

      if (!isTranslationFunction) return null;

      if (template.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
        entry.key = template.text;
      } else if (template.kind === ts.SyntaxKind.TemplateExpression) {
        this.emit(
          'warning',
          'A key that is a template string must not have any interpolations.'
        );
        return null;
      }

      return entry;
    } }, { key: "expressionExtractor", value:

    function expressionExtractor(node) {var _functionDefinition$,_this7 = this;
      var entries = [{}];

      var functionDefinition = Object.entries(
        this.translationFunctionsWithArgs
      ).find(function (_ref4) {var _ref5 = _slicedToArray(_ref4, 2),name = _ref5[0],translationFunc = _ref5[1];return (translationFunc === null || translationFunc === void 0 ? void 0 : translationFunc.pos) === node.pos;});
      var storeGlobally = (_functionDefinition$ = functionDefinition === null || functionDefinition === void 0 ? void 0 : functionDefinition[1].storeGlobally) !== null && _functionDefinition$ !== void 0 ? _functionDefinition$ : true;

      var isNamespaceFunction =
      this.namespaceFunctions.includes(node.expression.escapedText) ||
      // Support matching the namespace as well, i.e. match `i18n.useTranslation('ns')`
      this.namespaceFunctions.includes(this.expressionToName(node.expression));

      if (isNamespaceFunction && node.arguments.length) {
        storeGlobally |= node.expression.escapedText === 'withTranslation';
        var namespaceArgument = node.arguments[0];
        var optionsArgument = node.arguments[1];
        // The namespace argument can be either an array of namespaces or a single namespace,
        // so we convert it to an array in the case of a single namespace so that we can use
        // the same code in both cases
        var namespaces = namespaceArgument.elements || [namespaceArgument];

        // Find the first namespace that is a string literal, or is `undefined`. In the case
        // of `undefined`, we do nothing (see below), leaving the default namespace unchanged
        var namespace = namespaces.find(
          function (ns) {return (
              ns.kind === ts.SyntaxKind.StringLiteral ||
              ns.kind === ts.SyntaxKind.Identifier && ns.text === 'undefined');}
        );

        if (!namespace) {
          // We know that the namespace argument was provided, so if we're unable to find a
          // namespace, emit a warning since this will likely cause issues for the user
          this.emit(
            'warning',
            namespaceArgument.kind === ts.SyntaxKind.Identifier ? "Namespace is not a string literal nor an array containing a string literal: ".concat(
              namespaceArgument.text) :
            'Namespace is not a string literal nor an array containing a string literal'
          );
        } else if (namespace.kind === ts.SyntaxKind.StringLiteral) {
          // We found a string literal namespace, so we'll use this instead of the default
          if (storeGlobally) {
            this.defaultNamespace = namespace.text;
          }
          entries[0].ns = namespace.text;
        }

        if (
        optionsArgument &&
        optionsArgument.kind === ts.SyntaxKind.ObjectLiteralExpression)
        {
          var keyPrefixNode = optionsArgument.properties.find(
            function (p) {return p.name.escapedText === 'keyPrefix';}
          );
          if (keyPrefixNode != null) {
            if (storeGlobally) {
              this.keyPrefix = keyPrefixNode.initializer.text;
            }
            entries[0].keyPrefix = keyPrefixNode.initializer.text;
          }
        }
      }

      var isTranslationFunction =
      // If the expression is a string literal, we can just check if it's in the
      // list of functions
      node.expression.text && this.functions.includes(node.expression.text) ||
      // Support the case where the function is contained in a namespace, i.e.
      // match `i18n.t()` when this.functions = ['t'].
      node.expression.name &&
      this.functions.includes(node.expression.name.text) ||
      // Support matching the namespace as well, i.e. match `i18n.t()` but _not_
      // `l10n.t()` when this.functions = ['i18n.t']
      this.functions.includes(this.expressionToName(node.expression));

      if (isTranslationFunction) {
        var keyArgument = node.arguments.shift();

        if (!keyArgument) {
          return null;
        }

        if (
        keyArgument.kind === ts.SyntaxKind.StringLiteral ||
        keyArgument.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
        {
          entries[0].key = keyArgument.text;
        } else if (keyArgument.kind === ts.SyntaxKind.BinaryExpression) {
          var concatenatedString = this.concatenateString(keyArgument);
          if (!concatenatedString) {
            this.emit(
              'warning', "Key is not a string literal: ".concat(
                keyArgument.text)
            );
            return null;
          }
          entries[0].key = concatenatedString;
        } else {
          this.emit(
            'warning',
            keyArgument.kind === ts.SyntaxKind.Identifier ? "Key is not a string literal: ".concat(
              keyArgument.text) :
            'Key is not a string literal'
          );
          return null;
        }

        if (this.parseGenerics && node.typeArguments) {
          var typeArgument = node.typeArguments.shift();

          var _parseTypeArgument = function parseTypeArgument(typeArg) {
            if (!typeArg) {
              return;
            }
            if (typeArg.kind === ts.SyntaxKind.TypeLiteral) {var _iterator = _createForOfIteratorHelper(
                  typeArg.members),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var member = _step.value;
                  entries[0][member.name.text] = '';
                }} catch (err) {_iterator.e(err);} finally {_iterator.f();}
            } else if (
            typeArg.kind === ts.SyntaxKind.TypeReference &&
            typeArg.typeName.kind === ts.SyntaxKind.Identifier)
            {
              var typeName = typeArg.typeName.text;
              if (typeName in _this7.typeMap) {
                Object.assign(entries[0], _this7.typeMap[typeName]);
              }
            } else if (Array.isArray(typeArg.types)) {
              typeArgument.types.forEach(function (tp) {return _parseTypeArgument(tp);});
            }
          };

          _parseTypeArgument(typeArgument);
        }

        var _optionsArgument = node.arguments.shift();

        // Second argument could be a (concatenated) string default value
        if (
        _optionsArgument && (
        _optionsArgument.kind === ts.SyntaxKind.StringLiteral ||
        _optionsArgument.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral))
        {
          entries[0].defaultValue = _optionsArgument.text;
          _optionsArgument = node.arguments.shift();
        } else if (
        _optionsArgument &&
        _optionsArgument.kind === ts.SyntaxKind.BinaryExpression)
        {
          var _concatenatedString = this.concatenateString(_optionsArgument);
          if (!_concatenatedString) {
            this.emit(
              'warning', "Default value is not a string literal: ".concat(
                _optionsArgument.text)
            );
            return null;
          }
          entries[0].defaultValue = _concatenatedString;
          _optionsArgument = node.arguments.shift();
        }

        if (
        _optionsArgument &&
        _optionsArgument.kind === ts.SyntaxKind.ObjectLiteralExpression)
        {var _iterator2 = _createForOfIteratorHelper(
              _optionsArgument.properties),_step2;try {for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {var p = _step2.value;
              if (p.kind === ts.SyntaxKind.SpreadAssignment) {
                this.emit(
                  'warning', "Options argument is a spread operator : ".concat(
                    p.expression.text)
                );
              } else if (p.initializer) {
                if (p.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                  entries[0][p.name.text] = true;
                } else if (p.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                  entries[0][p.name.text] = false;
                } else if (p.initializer.kind === ts.SyntaxKind.CallExpression) {
                  var nestedEntries = this.expressionExtractor(p.initializer);
                  if (nestedEntries) {
                    entries.push.apply(entries, _toConsumableArray(nestedEntries));
                  } else {
                    entries[0][p.name.text] = p.initializer.text || '';
                  }
                } else {
                  entries[0][p.name.text] = p.initializer.text || '';
                }
              } else {
                entries[0][p.name.text] = '';
              }
            }} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}
        }

        if (entries[0].ns) {
          if (typeof entries[0].ns === 'string') {
            entries[0].namespace = entries[0].ns;
          } else if (_typeof(entries.ns) === 'object' && entries.ns.length) {
            entries[0].namespace = entries[0].ns[0];
          }
        }
        entries[0].functionName = node.expression.escapedText;

        return entries;
      }

      var isTranslationFunctionCreation =
      node.expression.escapedText &&
      this.namespaceFunctions.includes(node.expression.escapedText);
      if (isTranslationFunctionCreation) {
        this.translationFunctionsWithArgs[functionDefinition === null || functionDefinition === void 0 ? void 0 : functionDefinition[0]] = entries[0];
      }
      return null;
    } }, { key: "commentExtractor", value:

    function commentExtractor(commentText) {var _this8 = this;
      var regexp = new RegExp(this.callPattern, 'g');
      var expressions = commentText.match(regexp);

      if (!expressions) {
        return null;
      }

      var keys = [];
      expressions.forEach(function (expression) {
        var expressionKeys = _this8.extract(expression);
        if (expressionKeys) {
          keys.push.apply(keys, _toConsumableArray(expressionKeys));
        }
      });
      return keys;
    } }, { key: "concatenateString", value:

    function concatenateString(binaryExpression) {var string = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      if (binaryExpression.operatorToken.kind !== ts.SyntaxKind.PlusToken) {
        return;
      }

      if (binaryExpression.left.kind === ts.SyntaxKind.BinaryExpression) {
        string += this.concatenateString(binaryExpression.left, string);
      } else if (binaryExpression.left.kind === ts.SyntaxKind.StringLiteral) {
        string += binaryExpression.left.text;
      } else {
        return;
      }

      if (binaryExpression.right.kind === ts.SyntaxKind.BinaryExpression) {
        string += this.concatenateString(binaryExpression.right, string);
      } else if (binaryExpression.right.kind === ts.SyntaxKind.StringLiteral) {
        string += binaryExpression.right.text;
      } else {
        return;
      }

      return string;
    }

    /**
     * Recursively computes the name of a dot-separated expression, e.g. `t` or `t.ns`
     * @type {(expression: ts.LeftHandSideExpression | ts.JsxTagNameExpression) => string}
     */ }, { key: "expressionToName", value:
    function expressionToName(expression) {
      if (expression) {
        if (expression.text) {
          return expression.text;
        } else if (expression.name) {
          return [
          this.expressionToName(expression.expression),
          this.expressionToName(expression.name)].

          filter(function (s) {return s && s.length > 0;}).
          join('.');
        }
      }
      return undefined;
    } }]);}(BaseLexer);export { JavascriptLexer as default };
//# sourceMappingURL=javascript-lexer.js.map