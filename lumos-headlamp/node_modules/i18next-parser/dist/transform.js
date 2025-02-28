import _defineProperty from "@babel/runtime/helpers/defineProperty";import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function _createForOfIteratorHelper(o, allowArrayLike) {var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];if (!it) {if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {if (it) o = it;var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion = true,didErr = false,err;return { s: function s() {it = it.call(o);}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it["return"] != null) it["return"]();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import { Transform } from 'stream';
import eol from 'eol';
import fs from 'fs';
import path from 'path';
import VirtualFile from 'vinyl';
import yaml from 'js-yaml';
import i18next from 'i18next';
import sortKeys from 'sort-keys';

import {
  dotPathToHash,
  mergeHashes,
  transferValues,
  makeDefaultSort } from
'./helpers.js';
import Parser from './parser.js';var

i18nTransform = /*#__PURE__*/function (_Transform) {
  function i18nTransform() {var _this;var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};_classCallCheck(this, i18nTransform);
    options.objectMode = true;
    _this = _callSuper(this, i18nTransform, [options]);

    _this.defaults = {
      contextSeparator: '_',
      createOldCatalogs: true,
      defaultNamespace: 'translation',
      defaultValue: '',
      indentation: 2,
      keepRemoved: false,
      keySeparator: '.',
      lexers: {},
      lineEnding: 'auto',
      locales: ['en', 'fr'],
      namespaceSeparator: ':',
      pluralSeparator: '_',
      output: 'locales/$LOCALE/$NAMESPACE.json',
      resetDefaultValueLocale: null,
      sort: false,
      verbose: false,
      customValueTemplate: null,
      failOnWarnings: false,
      yamlOptions: null
    };

    _this.options = _objectSpread(_objectSpread({}, _this.defaults), options);
    _this.options.i18nextOptions = _objectSpread(_objectSpread({},
    options.i18nextOptions), {}, {
      pluralSeparator: _this.options.pluralSeparator,
      nsSeparator: _this.options.namespaceSeparator });


    if (_this.options.keySeparator === false) {
      _this.options.keySeparator = '__!NO_KEY_SEPARATOR!__';
    }
    if (_this.options.namespaceSeparator === false) {
      _this.options.namespaceSeparator = '__!NO_NAMESPACE_SEPARATOR!__';
    }
    _this.entries = [];

    _this.parserHadWarnings = false;
    _this.parserHadUpdate = false;
    _this.parser = new Parser(_this.options);
    _this.parser.on('error', function (error) {return _this.error(error);});
    _this.parser.on('warning', function (warning) {return _this.warn(warning);});

    _this.localeRegex = /\$LOCALE/g;
    _this.namespaceRegex = /\$NAMESPACE/g;

    _this.i18next = i18next.createInstance();
    _this.i18next.init(_this.options.i18nextOptions);

    // Track where individual keys are found, for use in customValueTemplate
    // substitution into "${filePath}"
    _this.keyToFilePaths = {};return _this;
  }_inherits(i18nTransform, _Transform);return _createClass(i18nTransform, [{ key: "error", value:

    function error(_error) {
      this.emit('error', _error);
      if (this.options.verbose) {
        console.error('\x1b[31m%s\x1b[0m', _error);
      }
    } }, { key: "warn", value:

    function warn(warning) {
      this.emit('warning', warning);
      this.parserHadWarnings = true;
      if (this.options.verbose) {
        console.warn('\x1b[33m%s\x1b[0m', warning);
      }
    } }, { key: "_transform", value:

    function _transform(file, encoding, done) {
      var content;
      if (file.isBuffer()) {
        content = file.contents.toString('utf8');
      } else if (fs.lstatSync(file.path).isDirectory()) {
        var warning = "".concat(file.path, " is a directory: skipping");
        this.warn(warning);
        done();
        return;
      } else {
        content = fs.readFileSync(file.path, encoding || 'utf-8');
      }

      this.emit('reading', file);
      if (this.options.verbose) {
        console.log("Parsing ".concat(file.path));
      }

      var filename = path.basename(file.path);
      var entries = this.parser.parse(content, filename);var _iterator = _createForOfIteratorHelper(

          entries),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var entry = _step.value;
          var key = entry.key;

          if (entry.keyPrefix) {
            key = entry.keyPrefix + this.options.keySeparator + key;
          }

          var parts = key.split(this.options.namespaceSeparator);

          // make sure we're not pulling a 'namespace' out of a default value
          if (parts.length > 1 && key !== entry.defaultValue) {
            entry.namespace = parts.shift();
          }
          entry.namespace = entry.namespace || this.options.defaultNamespace;

          key = parts.join(this.options.namespaceSeparator);
          key = key.replace(/\\('|"|`)/g, '$1');
          key = key.replace(/\\n/g, '\n');
          key = key.replace(/\\r/g, '\r');
          key = key.replace(/\\t/g, '\t');
          key = key.replace(/\\\\/g, '\\');
          entry.key = key;
          entry.keyWithNamespace = entry.namespace + this.options.keySeparator + key;
          // Add the filename so that we can use it in customValueTemplate
          this.keyToFilePaths[key] = this.keyToFilePaths[key] || [];
          if (!this.keyToFilePaths[key].includes(file.path)) {
            this.keyToFilePaths[key].push(file.path);
          }
          entry.filePaths = this.keyToFilePaths[key];

          this.addEntry(entry);
        }} catch (err) {_iterator.e(err);} finally {_iterator.f();}

      done();
    } }, { key: "_flush", value:

    function _flush(done) {var _this2 = this;
      var maybeSortedLocales = this.options.locales;
      if (this.options.resetDefaultValueLocale) {
        // ensure we process the reset locale first
        maybeSortedLocales.sort(function (a) {return (
            a === _this2.options.resetDefaultValueLocale ? -1 : 1);}
        );
      }

      // Tracks keys to reset by namespace
      var resetValues = {};var _iterator2 = _createForOfIteratorHelper(

          maybeSortedLocales),_step2;try {var _loop = function _loop() {var locale = _step2.value;
          var catalog = {};
          var resetAndFlag = _this2.options.resetDefaultValueLocale === locale;

          var uniqueCount = {};
          var uniquePluralsCount = {};

          var transformEntry = function transformEntry(entry, suffix) {
            if (uniqueCount[entry.namespace] === undefined) {
              uniqueCount[entry.namespace] = 0;
            }
            if (uniquePluralsCount[entry.namespace] === undefined) {
              uniquePluralsCount[entry.namespace] = 0;
            }

            var _dotPathToHash = dotPathToHash(entry, catalog, {
                suffix: suffix,
                locale: locale,
                separator: _this2.options.keySeparator,
                pluralSeparator: _this2.options.pluralSeparator,
                value: _this2.options.defaultValue,
                customValueTemplate: _this2.options.customValueTemplate
              }),duplicate = _dotPathToHash.duplicate,conflict = _dotPathToHash.conflict;

            if (duplicate) {
              if (conflict === 'key') {
                _this2.warn(
                  "Found translation key already mapped to a map or parent of " + "new key already mapped to a string: ".concat(

                    entry.namespace + _this2.options.namespaceSeparator + entry.key)

                );
              } else if (conflict === 'value') {
                _this2.warn("Found same keys with different values: ".concat(

                  entry.namespace + _this2.options.namespaceSeparator + entry.key)

                );
              }
            } else {
              uniqueCount[entry.namespace] += 1;
              if (suffix) {
                uniquePluralsCount[entry.namespace] += 1;
              }
            }
          };

          // generates plurals according to i18next rules: key_zero, key_one, key_two, key_few, key_many and key_other
          var _iterator3 = _createForOfIteratorHelper(_this2.entries),_step3;try {var _loop2 = function _loop2() {var entry = _step3.value;
              if (
              _this2.options.pluralSeparator !== false &&
              entry.count !== undefined)
              {
                _this2.i18next.services.pluralResolver.
                getSuffixes(locale, { ordinal: entry.ordinal }).
                forEach(function (suffix) {
                  transformEntry(entry, suffix);
                });
              } else {
                transformEntry(entry);
              }
            };for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {_loop2();}} catch (err) {_iterator3.e(err);} finally {_iterator3.f();}

          var outputPath = path.resolve(_this2.options.output);

          for (var namespace in catalog) {
            var namespacePath = outputPath;
            namespacePath = namespacePath.replace(_this2.localeRegex, locale);
            namespacePath = namespacePath.replace(_this2.namespaceRegex, namespace);

            var parsedNamespacePath = path.parse(namespacePath);

            var namespaceOldPath = path.join(
              parsedNamespacePath.dir, "".concat(
                parsedNamespacePath.name, "_old").concat(parsedNamespacePath.ext)
            );

            var existingCatalog = _this2.getCatalog(namespacePath);
            var existingOldCatalog = _this2.getCatalog(namespaceOldPath);

            // merges existing translations with the new ones
            var _mergeHashes =






              mergeHashes(
                existingCatalog,
                catalog[namespace], _objectSpread(_objectSpread({},

                _this2.options), {}, {
                  resetAndFlag: resetAndFlag,
                  fullKeyPrefix: namespace + _this2.options.namespaceSeparator }),

                resetValues[namespace]
              ),newCatalog = _mergeHashes["new"],oldKeys = _mergeHashes.old,mergeCount = _mergeHashes.mergeCount,oldCount = _mergeHashes.oldCount,resetFlags = _mergeHashes.reset,resetCount = _mergeHashes.resetCount;

            // record values to be reset
            // assumes that the 'default' namespace is processed first
            if (resetAndFlag && !resetValues[namespace]) {
              resetValues[namespace] = resetFlags;
            }

            // restore old translations
            var _mergeHashes2 = mergeHashes(
                existingOldCatalog,
                newCatalog, _objectSpread(_objectSpread({},
                _this2.options), {}, { keepRemoved: false })
              ),oldCatalog = _mergeHashes2.old,restoreCount = _mergeHashes2.mergeCount;

            // backup unused translations
            transferValues(oldKeys, oldCatalog);

            if (_this2.options.verbose) {
              console.log("[".concat(locale, "] ").concat(namespace));
              console.log("Unique keys: ".concat(
                uniqueCount[namespace], " (").concat(uniquePluralsCount[namespace], " are plurals)")
              );
              var addCount = uniqueCount[namespace] - mergeCount;
              console.log("Added keys: ".concat(addCount));
              console.log("Restored keys: ".concat(restoreCount));
              if (_this2.options.keepRemoved) {
                console.log("Unreferenced keys: ".concat(oldCount));
              } else {
                console.log("Removed keys: ".concat(oldCount));
              }
              if (_this2.options.resetDefaultValueLocale) {
                console.log("Reset keys: ".concat(resetCount));
              }
              console.log('');
            }

            if (_this2.options.failOnUpdate) {
              var _addCount = uniqueCount[namespace] - mergeCount;
              var refCount =
              _addCount + restoreCount + (_this2.options.keepRemoved ? 0 : oldCount);
              if (refCount !== 0) {
                _this2.parserHadUpdate = true;
                continue;
              }
            }

            if (_this2.options.failOnWarnings && _this2.parserHadWarnings) {
              continue;
            }

            var maybeSortedNewCatalog = newCatalog;
            var maybeSortedOldCatalog = oldCatalog;
            var sort = _this2.options.sort;
            if (sort) {
              var compare =
              typeof sort === 'function' ?
              sort :
              makeDefaultSort(_this2.options.pluralSeparator);
              maybeSortedNewCatalog = sortKeys(newCatalog, {
                deep: true,
                compare: compare
              });

              maybeSortedOldCatalog = sortKeys(oldCatalog, { deep: true, compare: compare });

              if (_this2.options.failOnUpdate && !_this2.parserHadUpdate) {
                // No updates to the catalog, so we do the deeper check to ensure it is also sorted.
                // This is easiest to accomplish by simply converting both objects to JSON, as we'd have
                // to do a deep comparison anyway
                _this2.parserHadSortUpdate =
                JSON.stringify(maybeSortedNewCatalog) !==
                JSON.stringify(existingCatalog);
              }
            }

            // push files back to the stream
            _this2.pushFile(namespacePath, maybeSortedNewCatalog);
            if (
            _this2.options.createOldCatalogs && (
            Object.keys(oldCatalog).length || existingOldCatalog))
            {
              _this2.pushFile(namespaceOldPath, maybeSortedOldCatalog);
            }
          }
        };for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {_loop();}} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}

      if (this.options.failOnWarnings && this.parserHadWarnings) {
        this.emit(
          'error',
          'Warnings were triggered and failOnWarnings option is enabled. Exiting...'
        );
        process.exit(1);
      }

      if (this.options.failOnUpdate) {
        if (this.parserHadUpdate) {
          this.emit(
            'error',
            'Some translations was updated and failOnUpdate option is enabled. Exiting...'
          );
          process.exit(1);
        }
        if (this.parserHadSortUpdate) {
          this.emit(
            'error',
            'Some keys were sorted and failOnUpdate option is enabled. Exiting...'
          );
          process.exit(1);
        }
      }

      done();
    } }, { key: "addEntry", value:

    function addEntry(entry) {
      if (entry.context) {
        var contextEntry = Object.assign({}, entry);
        delete contextEntry.context;
        contextEntry.key += this.options.contextSeparator + entry.context;
        contextEntry.keyWithNamespace +=
        this.options.contextSeparator + entry.context;
        this.entries.push(contextEntry);
      } else {
        this.entries.push(entry);
      }
    } }, { key: "getCatalog", value:

    function getCatalog(path) {
      try {
        var content;
        if (path.endsWith('yml')) {
          content = yaml.load(fs.readFileSync(path).toString());
        } else {
          content = JSON.parse(fs.readFileSync(path));
        }
        return content;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.emit('error', error);
        }
      }

      return null;
    } }, { key: "pushFile", value:

    function pushFile(path, contents) {
      var text;
      if (path.endsWith('yml')) {
        text = yaml.dump(contents, _objectSpread({
          indent: this.options.indentation },
        this.options.yamlOptions)
        );
      } else {
        text = JSON.stringify(contents, null, this.options.indentation) + '\n';
        // Convert non-printable Unicode characters to unicode escape sequence
        // https://unicode.org/reports/tr18/#General_Category_Property
        text = text.replace(/(?:[\0- \x7F-\xA0\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F-\u2064\u2066-\u206F\u3000\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F])/g, function (chr) {
          var n = chr.charCodeAt(0);
          return n < 128 ? chr : "\\u".concat("0000".concat(n.toString(16)).substr(-4));
        });
      }

      if (this.options.lineEnding === 'auto') {
        text = eol.auto(text);
      } else if (
      this.options.lineEnding === '\r\n' ||
      this.options.lineEnding === 'crlf')
      {
        text = eol.crlf(text);
      } else if (
      this.options.lineEnding === '\r' ||
      this.options.lineEnding === 'cr')
      {
        text = eol.cr(text);
      } else {
        // Defaults to LF, aka \n
        text = eol.lf(text);
      }

      var file = new VirtualFile({
        path: path,
        contents: Buffer.from(text)
      });
      this.push(file);
    } }]);}(Transform);export { i18nTransform as default };
//# sourceMappingURL=transform.js.map