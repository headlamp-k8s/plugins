import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import JavascriptLexer from './javascript-lexer.js';
import ts from 'typescript';
import { unescape } from '../helpers.js';var

JsxLexer = /*#__PURE__*/function (_JavascriptLexer) {
  function JsxLexer() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, JsxLexer);
    _this = _callSuper(this, JsxLexer, [options]);

    _this.componentFunctions = options.componentFunctions || ['Trans'];
    _this.transSupportBasicHtmlNodes =
    options.transSupportBasicHtmlNodes || false;
    _this.transKeepBasicHtmlNodesFor = options.transKeepBasicHtmlNodesFor || [
    'br',
    'strong',
    'i',
    'p'];

    _this.omitAttributes = [_this.attr, 'ns', 'defaults'];
    _this.transIdentityFunctionsToIgnore =
    options.transIdentityFunctionsToIgnore || [];return _this;
  }_inherits(JsxLexer, _JavascriptLexer);return _createClass(JsxLexer, [{ key: "extract", value:

    function extract(content) {var _this2 = this;var filename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '__default.jsx';
      var keys = [];

      var parseCommentNode = this.createCommentNodeParser();

      var _parseTree = function parseTree(node) {
        var entry;

        parseCommentNode(keys, node, content);

        switch (node.kind) {
          case ts.SyntaxKind.VariableDeclaration:
            _this2.variableDeclarationExtractor.call(_this2, node);
            break;
          case ts.SyntaxKind.CallExpression:
            var entries = _this2.expressionExtractor.call(_this2, node);
            if (entries) {
              keys.push.apply(keys, _toConsumableArray(entries));
            }
            break;
          case ts.SyntaxKind.TaggedTemplateExpression:
            entry = _this2.taggedTemplateExpressionExtractor.call(_this2, node);
            break;
          case ts.SyntaxKind.JsxElement:
            entry = _this2.jsxExtractor.call(_this2, node, content);
            break;
          case ts.SyntaxKind.JsxSelfClosingElement:
            entry = _this2.jsxExtractor.call(_this2, node, content);
            break;
        }

        if (entry) {
          keys.push(entry);
        }

        node.forEachChild(_parseTree);
      };

      var sourceFile = ts.createSourceFile(
        filename,
        content,
        ts.ScriptTarget.Latest
      );
      _parseTree(sourceFile);

      var keysWithNamespace = this.setNamespaces(keys);
      var keysWithPrefixes = this.setKeyPrefixes(keysWithNamespace);

      return keysWithPrefixes;
    } }, { key: "jsxExtractor", value:

    function jsxExtractor(node, sourceText) {var _this3 = this;
      var tagNode = node.openingElement || node;

      var getPropValue = function getPropValue(node, attributeName) {var _attribute$initialize;
        var attribute = node.attributes.properties.find(
          function (attr) {return attr.name !== undefined && attr.name.text === attributeName;}
        );
        if (!attribute) {
          return undefined;
        }

        if (((_attribute$initialize = attribute.initializer.expression) === null || _attribute$initialize === void 0 ? void 0 : _attribute$initialize.kind) === ts.SyntaxKind.Identifier) {
          _this3.emit(
            'warning', "\"".concat(
              attributeName, "\" prop is not a string literal: ").concat(attribute.initializer.expression.text)
          );

          return undefined;
        }

        return attribute.initializer.expression ?
        attribute.initializer.expression.text :
        attribute.initializer.text;
      };

      var getKey = function getKey(node) {return getPropValue(node, _this3.attr);};

      if (
      this.componentFunctions.includes(this.expressionToName(tagNode.tagName)))
      {
        var entry = {};
        entry.key = getKey(tagNode);

        var namespace = getPropValue(tagNode, 'ns');
        if (namespace) {
          entry.namespace = namespace;
        }

        tagNode.attributes.properties.forEach(function (property) {
          if (property.kind === ts.SyntaxKind.JsxSpreadAttribute) {
            _this3.emit(
              'warning', "Component attribute is a JSX spread attribute : ".concat(
                property.expression.text)
            );
            return;
          }

          if (_this3.omitAttributes.includes(property.name.text)) {
            return;
          }

          if (property.initializer) {
            if (property.initializer.expression) {
              if (
              property.initializer.expression.kind === ts.SyntaxKind.TrueKeyword)
              {
                entry[property.name.text] = true;
              } else if (
              property.initializer.expression.kind ===
              ts.SyntaxKind.FalseKeyword)
              {
                entry[property.name.text] = false;
              } else {
                entry[property.name.text] = "{".concat(
                  property.initializer.expression.text ||
                  _this3.cleanMultiLineCode(
                    sourceText.slice(
                      property.initializer.expression.pos,
                      property.initializer.expression.end
                    )
                  ), "}");

              }
            } else {
              entry[property.name.text] = property.initializer.text;
            }
          } else entry[property.name.text] = true;
        });

        var nodeAsString = this.nodeToString.call(this, node, sourceText);
        var defaultsProp = getPropValue(tagNode, 'defaults');
        var defaultValue = defaultsProp || nodeAsString;

        // If `shouldUnescape` is not true, it means the value cannot contain HTML entities,
        // so we need to unescape these entities now so that they can be properly rendered later
        if (entry.shouldUnescape !== true) {
          defaultValue = unescape(defaultValue);
        }

        if (defaultValue !== '') {
          entry.defaultValue = defaultValue;

          if (!entry.key) {
            // If there's no key, default to the stringified unescaped node, then to the default value:
            // https://github.com/i18next/react-i18next/blob/95f9c6a7b602a7b1fd33c1ded6dcfc23a52b853b/src/TransWithoutContext.js#L337
            entry.key = unescape(nodeAsString) || entry.defaultValue;
          }
        }

        return entry.key ? entry : null;
      } else if (tagNode.tagName.text === 'Interpolate') {
        var _entry = {};
        _entry.key = getKey(tagNode);
        return _entry.key ? _entry : null;
      } else if (tagNode.tagName.text === 'Translation') {
        var _namespace = getPropValue(tagNode, 'ns');
        if (_namespace) {
          this.defaultNamespace = _namespace;
        }
      }
    } }, { key: "nodeToString", value:

    function nodeToString(node, sourceText) {var _this4 = this;
      var children = this.parseChildren.call(
        this,
        node,
        node.children,
        sourceText
      );

      var _elemsToString = function elemsToString(children) {return (
          children.
          map(function (child, index) {
            switch (child.type) {
              case 'js':
              case 'text':
                return child.content;
              case 'tag':
                var useTagName =
                child.isBasic &&
                _this4.transSupportBasicHtmlNodes &&
                _this4.transKeepBasicHtmlNodesFor.includes(child.name);
                var elementName = useTagName ? child.name : index;
                var childrenString = _elemsToString(child.children);
                return childrenString || !(useTagName && child.selfClosing) ? "<".concat(
                  elementName, ">").concat(childrenString, "</").concat(elementName, ">") : "<".concat(
                  elementName, " />");
              default:
                throw new Error('Unknown parsed content: ' + child.type);
            }
          }).
          join(''));};

      return _elemsToString(children);
    } }, { key: "cleanMultiLineCode", value:

    function cleanMultiLineCode(text) {
      return text.
      replace(/(^(\n|\r)\s*)|((\n|\r)\s*$)/g, '').
      replace(/(\n|\r)\s*/g, ' ');
    } }, { key: "parseChildren", value:

    function parseChildren(node) {var _this5 = this;var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];var sourceText = arguments.length > 2 ? arguments[2] : undefined;
      return children.
      map(function (child) {
        if (child.kind === ts.SyntaxKind.JsxText) {
          return {
            type: 'text',
            content: _this5.cleanMultiLineCode(child.text)
          };
        } else if (
        child.kind === ts.SyntaxKind.JsxElement ||
        child.kind === ts.SyntaxKind.JsxSelfClosingElement)
        {
          var element = child.openingElement || child;
          var name = element.tagName.escapedText;
          var isBasic = !element.attributes.properties.length;
          var hasDynamicChildren = element.attributes.properties.find(
            function (prop) {return (
                prop.kind === ts.SyntaxKind.JsxAttribute &&
                prop.name.escapedText === 'i18nIsDynamicList');}
          );
          return {
            type: 'tag',
            children: hasDynamicChildren ?
            [] :
            _this5.parseChildren(child, child.children, sourceText),
            name: name,
            isBasic: isBasic,
            selfClosing: child.kind === ts.SyntaxKind.JsxSelfClosingElement
          };
        } else if (child.kind === ts.SyntaxKind.JsxExpression) {
          // strip empty expressions
          if (!child.expression) {
            return {
              type: 'text',
              content: ''
            };
          }

          // simplify trivial expressions, like TypeScript typecasts
          while (child.expression.kind === ts.SyntaxKind.AsExpression) {
            child = child.expression;
          }

          // Sometimes, we might want to wrap ObjectExpressions in a function
          // for typechecker compatibility: e.g.,
          //
          // Instead of
          // `<Trans>Hello, <Link to="/">{{ name }}</Link></Trans>`
          // we might want:
          // `<Trans>Hello, <Link to="/">{castToString({ name })}</Link></Trans>`
          //
          // because that way, we can have {castToString(...)} be typed
          // in a a way to return a string, which would be type-compatible
          // with `children?: React.ReactNode`
          //
          // In these cases, we want to look at the object expressions within
          // the function call to extract the variables
          if (
          child.expression.kind === ts.SyntaxKind.CallExpression &&
          child.expression.expression.kind === ts.SyntaxKind.Identifier &&
          _this5.transIdentityFunctionsToIgnore.includes(
            child.expression.expression.escapedText
          ) &&
          child.expression.arguments.length >= 1)
          {
            child = { expression: child.expression.arguments[0] };
          }

          if (child.expression.kind === ts.SyntaxKind.StringLiteral) {
            return {
              type: 'text',
              content: child.expression.text
            };
          }

          // strip properties from ObjectExpressions
          // annoying (and who knows how many other exceptions we'll need to write) but necessary
          else if (
          child.expression.kind === ts.SyntaxKind.ObjectLiteralExpression)
          {
            // i18next-react only accepts two props, any random single prop, and a format prop

            var nonFormatProperties = child.expression.properties.filter(
              function (prop) {return prop.name.text !== 'format';}
            );
            var formatProperty = child.expression.properties.find(
              function (prop) {return prop.name.text === 'format';}
            );

            // more than one property throw a warning in i18next-react, but still works as a key
            if (nonFormatProperties.length > 1) {
              _this5.emit(
                'warning', "The passed in object contained more than one variable - the object should look like {{ value, format }} where format is optional."

              );

              return {
                type: 'text',
                content: ''
              };
            }

            // This matches the behaviour of the Trans component in i18next as of v13.0.2:
            // https://github.com/i18next/react-i18next/blob/0a4681e428c888fe986bcc0109eb19eab6ff2eb3/src/TransWithoutContext.js#L88
            var value = formatProperty ? "".concat(
              nonFormatProperties[0].name.text, ", ").concat(formatProperty.initializer.text) :
            nonFormatProperties[0].name.text;

            return {
              type: 'js',
              content: "{{".concat(value, "}}")
            };
          }

          // slice on the expression so that we ignore comments around it
          var slicedExpression = sourceText.slice(
            child.expression.pos,
            child.expression.end
          );

          var tagNode = node.openingElement || node;
          var attrValues = tagNode.attributes.properties.
          filter(function (attr) {var _attr$name;return [_this5.attr, 'defaults'].includes((_attr$name = attr.name) === null || _attr$name === void 0 ? void 0 : _attr$name.text);}).
          map(
            function (attr) {var _attr$initializer$exp, _attr$initializer$exp2;return (_attr$initializer$exp = (_attr$initializer$exp2 =
              attr.initializer.expression) === null || _attr$initializer$exp2 === void 0 ? void 0 : _attr$initializer$exp2.text) !== null && _attr$initializer$exp !== void 0 ? _attr$initializer$exp : attr.initializer.text;}
          );

          if (attrValues.some(function (attr) {return !attr;})) {
            _this5.emit('warning', "Child is not literal: ".concat(slicedExpression));
          }

          return {
            type: 'js',
            content: "{".concat(slicedExpression, "}")
          };
        } else {
          throw new Error('Unknown ast element when parsing jsx: ' + child.kind);
        }
      }).
      filter(function (child) {return child.type !== 'text' || child.content;});
    } }]);}(JavascriptLexer);export { JsxLexer as default };
//# sourceMappingURL=jsx-lexer.js.map