import _classCallCheck from "@babel/runtime/helpers/classCallCheck";import _createClass from "@babel/runtime/helpers/createClass";import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";import _inherits from "@babel/runtime/helpers/inherits";function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}import colors from 'colors';
import fse from 'fs-extra';
import Plugin from 'broccoli-plugin';
import rsvp from 'rsvp';
import sort from 'gulp-sort';
import vfs from 'vinyl-fs';

import i18nTransform from './transform.js';

var Promise = rsvp.Promise;var

i18nextParser = /*#__PURE__*/function (_Plugin) {
  function i18nextParser(inputNodes) {var _this;var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};_classCallCheck(this, i18nextParser);
    _this = _callSuper(this, i18nextParser, arguments);
    _this.options = options;return _this;
  }_inherits(i18nextParser, _Plugin);return _createClass(i18nextParser, [{ key: "build", value:

    function build() {var _this2 = this;
      var outputPath = this.outputPath;
      return new Promise(function (resolve, reject) {
        var files = [];
        var count = 0;

        vfs.
        src(_this2.inputPaths.map(function (x) {return x + '/**/*.{js,hbs}';})).
        pipe(sort()).
        pipe(
          new i18nTransform(_this2.options).
          on('reading', function (file) {
            if (!this.options.silent) {
              console.log('  [read]  '.green + file.path);
            }
            count++;
          }).
          on('data', function (file) {
            files.push(fse.outputFile(file.path, file.contents));
            if (!this.options.silent) {
              console.log('  [write] '.green + file.path);
            }
          }).
          on('error', function (message, region) {
            if (typeof region === 'string') {
              message += ': ' + region.trim();
            }
            console.log('  [error] '.red + message);
          }).
          on('finish', function () {
            if (!this.options.silent) {
              console.log();
              console.log(
                '  Stats:  '.yellow + String(count) + ' files were parsed'
              );
            }

            Promise.all(files).then(function () {
              resolve(files);
            });
          })
        );
      });
    } }]);}(Plugin);export { i18nextParser as default };
//# sourceMappingURL=broccoli.js.map