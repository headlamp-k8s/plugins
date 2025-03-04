import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";import _defineProperty from "@babel/runtime/helpers/defineProperty";import _typeof from "@babel/runtime/helpers/typeof";import _regeneratorRuntime from "@babel/runtime/regenerator";function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}import { pathToFileURL } from 'url';
import { build } from 'esbuild';
import { rmSync } from 'fs';
import yaml from 'js-yaml';
import { builtinModules } from 'module';

/**
 * Take an entry for the Parser and turn it into a hash,
 * turning the key path 'foo.bar' into an hash {foo: {bar: ""}}
 * The generated hash can be merged with an optional `target`.
 * @returns An `{ target, duplicate, conflict }` object. `target` is the hash
 * that was passed as an argument or a new hash if none was passed. `duplicate`
 * indicates whether the entry already existed in the `target` hash. `conflict`
 * is `"key"` if a parent of the key was already mapped to a string (e.g. when
 * merging entry {one: {two: "bla"}} with target {one: "bla"}) or the key was
 * already mapped to a map (e.g. when merging entry {one: "bla"} with target
 * {one: {two: "bla"}}), `"value"` if the same key already exists with a
 * different value, or `false`.
 */
function dotPathToHash(entry) {var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var conflict = false;
  var duplicate = false;
  var path = entry.keyWithNamespace;
  if (options.suffix) {
    path += options.suffix;
  }

  var separator = options.separator || '.';

  var key = entry.keyWithNamespace.substring(
    entry.keyWithNamespace.indexOf(separator) + separator.length,
    entry.keyWithNamespace.length
  );

  // There is no key to process so we return an empty object
  if (!key) {
    if (!target[entry.namespace]) {
      target[entry.namespace] = {};
    }
    return { target: target, duplicate: duplicate, conflict: conflict };
  }

  var defaultValue =
  entry["defaultValue".concat(options.suffix)] || entry.defaultValue || '';

  var newValue =
  typeof options.value === 'function' ?
  options.value(options.locale, entry.namespace, key, defaultValue) :
  options.value || defaultValue;

  if (path.endsWith(separator)) {
    path = path.slice(0, -separator.length);
  }

  var segments = path.split(separator);
  var inner = target;
  for (var i = 0; i < segments.length - 1; i += 1) {
    var segment = segments[i];
    if (segment) {
      if (typeof inner[segment] === 'string') {
        conflict = 'key';
      }
      if (inner[segment] === undefined || conflict) {
        inner[segment] = {};
      }
      inner = inner[segment];
    }
  }

  var lastSegment = segments[segments.length - 1];
  var oldValue = inner[lastSegment];
  if (oldValue !== undefined && oldValue !== newValue) {
    if (_typeof(oldValue) !== _typeof(newValue)) {
      conflict = 'key';
    } else if (oldValue !== '') {
      if (newValue === '') {
        newValue = oldValue;
      } else {
        conflict = 'value';
      }
    }
  }
  duplicate = oldValue !== undefined || conflict !== false;

  if (options.customValueTemplate) {
    inner[lastSegment] = {};

    var entries = Object.entries(options.customValueTemplate);
    entries.forEach(function (valueEntry) {
      if (valueEntry[1] === '${defaultValue}') {
        inner[lastSegment][valueEntry[0]] = newValue;
      } else if (valueEntry[1] === '${filePaths}') {
        inner[lastSegment][valueEntry[0]] = entry.filePaths;
      } else {
        inner[lastSegment][valueEntry[0]] =
        entry[valueEntry[1].replace(/\${(\w+)}/, '$1')] || '';
      }
    });
  } else {
    inner[lastSegment] = newValue;
  }

  return { target: target, duplicate: duplicate, conflict: conflict };
}

/**
 * Takes a `source` hash and makes sure its value
 * is pasted in the `target` hash, if the target
 * hash has the corresponding key (or if `options.keepRemoved` is true).
 * @returns An `{ old, new, mergeCount, pullCount, oldCount, reset, resetCount }` object.
 * `old` is a hash of values that have not been merged into `target`.
 * `new` is `target`. `mergeCount` is the number of keys merged into
 * `new`, `pullCount` is the number of context and plural keys added to
 * `new` and `oldCount` is the number of keys that were either added to `old` or
 * `new` (if `options.keepRemoved` is true and `target` didn't have the corresponding
 * key) and `reset` is the keys that were reset due to not matching default values,
 *  and `resetCount` which is the number of keys reset.
 */
function mergeHashes(source, target) {var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};var resetValues = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var old = {};
  var reset = {};
  var mergeCount = 0;
  var pullCount = 0;
  var oldCount = 0;
  var resetCount = 0;

  var keepRemoved =
  typeof options.keepRemoved === 'boolean' && options.keepRemoved || false;
  var keepRemovedPatterns =
  typeof options.keepRemoved !== 'boolean' && options.keepRemoved || [];
  var fullKeyPrefix = options.fullKeyPrefix || '';
  var keySeparator = options.keySeparator || '.';
  var pluralSeparator = options.pluralSeparator || '_';
  var contextSeparator = options.contextSeparator || '_';var _loop = function _loop(key)

  {
    var hasNestedEntries =
    _typeof(target[key]) === 'object' && !Array.isArray(target[key]);

    if (hasNestedEntries) {
      var nested = mergeHashes(
        source[key],
        target[key], _objectSpread(_objectSpread({},
        options), {}, { fullKeyPrefix: fullKeyPrefix + key + keySeparator }),
        resetValues[key]
      );
      mergeCount += nested.mergeCount;
      pullCount += nested.pullCount;
      oldCount += nested.oldCount;
      resetCount += nested.resetCount;
      if (Object.keys(nested.old).length) {
        old[key] = nested.old;
      }
      if (Object.keys(nested.reset).length) {
        reset[key] = nested.reset;
      }
    } else if (target[key] !== undefined) {
      if (typeof source[key] !== 'string' && !Array.isArray(source[key])) {
        old[key] = source[key];
        oldCount += 1;
      } else {
        if (
        options.resetAndFlag &&
        !isPlural(key) &&
        typeof source[key] === 'string' &&
        source[key] !== target[key] ||
        resetValues[key])
        {
          old[key] = source[key];
          oldCount += 1;
          reset[key] = true;
          resetCount += 1;
        } else {
          target[key] = source[key];
          mergeCount += 1;
        }
      }
    } else {
      // support for plural in keys
      var singularKey = getSingularForm(key, pluralSeparator);
      var pluralMatch = key !== singularKey;

      // support for context in keys
      var contextRegex = new RegExp("\\".concat(
        contextSeparator, "([^\\").concat(contextSeparator, "]+)?$")
      );
      var contextMatch = contextRegex.test(singularKey);
      var rawKey = singularKey.replace(contextRegex, '');

      if (
      contextMatch && target[rawKey] !== undefined ||
      pluralMatch &&
      hasRelatedPluralKey("".concat(singularKey).concat(pluralSeparator), target))
      {
        target[key] = source[key];
        pullCount += 1;
      } else {
        var keepKey =
        keepRemoved ||
        keepRemovedPatterns.some(function (pattern) {return (
            pattern.test(fullKeyPrefix + key));}
        );
        if (keepKey) {
          target[key] = source[key];
        } else {
          old[key] = source[key];
        }
        oldCount += 1;
      }
    }
  };for (var key in source) {_loop(key);}

  return {
    old: old,
    "new": target,
    mergeCount: mergeCount,
    pullCount: pullCount,
    oldCount: oldCount,
    reset: reset,
    resetCount: resetCount
  };
}

/**
 * Merge `source` into `target` by merging nested dictionaries.
 */
function transferValues(source, target) {
  for (var key in source) {
    var sourceValue = source[key];
    var targetValue = target[key];
    if (
    _typeof(sourceValue) === 'object' &&
    _typeof(targetValue) === 'object' &&
    !Array.isArray(sourceValue))
    {
      transferValues(sourceValue, targetValue);
    } else {
      target[key] = sourceValue;
    }
  }
}

var pluralSuffixes = ['zero', 'one', 'two', 'few', 'many', 'other'];

function isPlural(key) {
  return pluralSuffixes.some(function (suffix) {return key.endsWith(suffix);});
}

function hasRelatedPluralKey(rawKey, source) {
  return pluralSuffixes.some(
    function (suffix) {return source["".concat(rawKey).concat(suffix)] !== undefined;}
  );
}

function getSingularForm(key, pluralSeparator) {
  var pluralRegex = new RegExp("(\\".concat(
    pluralSeparator, "(?:zero|one|two|few|many|other))$")
  );

  return key.replace(pluralRegex, '');
}

function getPluralSuffixPosition(key) {
  for (var i = 0, len = pluralSuffixes.length; i < len; i++) {
    if (key.endsWith(pluralSuffixes[i])) return i;
  }

  return -1;
}

function makeDefaultSort(pluralSeparator) {
  return function defaultSort(key1, key2) {
    var singularKey1 = getSingularForm(key1, pluralSeparator);
    var singularKey2 = getSingularForm(key2, pluralSeparator);

    if (singularKey1 === singularKey2) {
      return getPluralSuffixPosition(key1) - getPluralSuffixPosition(key2);
    }

    return singularKey1.localeCompare(singularKey2, 'en');
  };
}function

esConfigLoader(_x) {return _esConfigLoader.apply(this, arguments);}function _esConfigLoader() {_esConfigLoader = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(filepath) {return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) switch (_context.prev = _context.next) {case 0:_context.next = 2;return (
            import(pathToFileURL(filepath)));case 2:return _context.abrupt("return", _context.sent["default"]);case 3:case "end":return _context.stop();}}, _callee);}));return _esConfigLoader.apply(this, arguments);}function


tsConfigLoader(_x2) {return _tsConfigLoader.apply(this, arguments);}function _tsConfigLoader() {_tsConfigLoader = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(filepath) {var outfile, config;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) switch (_context2.prev = _context2.next) {case 0:
          outfile = filepath + '.bundle.mjs';_context2.next = 3;return (
            build({
              absWorkingDir: process.cwd(),
              entryPoints: [filepath],
              outfile: outfile,
              write: true,
              target: ['node14.18', 'node16'],
              platform: 'node',
              bundle: true,
              format: 'esm',
              sourcemap: 'inline',
              external: [].concat(_toConsumableArray(
                builtinModules), _toConsumableArray(
                builtinModules.map(function (mod) {return 'node:' + mod;})))

            }));case 3:_context2.next = 5;return (
            esConfigLoader(outfile));case 5:config = _context2.sent;
          rmSync(outfile);return _context2.abrupt("return",
          config);case 8:case "end":return _context2.stop();}}, _callee2);}));return _tsConfigLoader.apply(this, arguments);}


function yamlConfigLoader(filepath, content) {
  return yaml.load(content);
}

// unescape common html entities
// code from react-18next taken from
// https://github.com/i18next/react-i18next/blob/d3247b5c232f5d8c1a154fe5dd0090ca88c82dcf/src/unescape.js
function unescape(text) {
  var matchHtmlEntity =
  /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
  var htmlEntities = {
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&quot;': '"',
    '&#34;': '"',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&copy;': '©',
    '&#169;': '©',
    '&reg;': '®',
    '&#174;': '®',
    '&hellip;': '…',
    '&#8230;': '…',
    '&#x2F;': '/',
    '&#47;': '/'
  };

  var unescapeHtmlEntity = function unescapeHtmlEntity(m) {return htmlEntities[m];};

  return text.replace(matchHtmlEntity, unescapeHtmlEntity);
}

export {
  dotPathToHash,
  mergeHashes,
  transferValues,
  hasRelatedPluralKey,
  getSingularForm,
  getPluralSuffixPosition,
  makeDefaultSort,
  esConfigLoader,
  tsConfigLoader,
  yamlConfigLoader,
  unescape };
//# sourceMappingURL=helpers.js.map