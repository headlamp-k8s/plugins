(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/bg", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/bg"] = factory(require("cronstrue"));
	else
		root["locales/bg"] = factory(root["cronstrue"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__93__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 93:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__93__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var cronstrue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93);
/* harmony import */ var cronstrue__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cronstrue__WEBPACK_IMPORTED_MODULE_0__);
var exports = __webpack_exports__;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bg = void 0;
var getPhraseByPlural = function (str, words) {
    var strAsNumber = str != null ? Number(str) : 0;
    return strAsNumber < 2 ? words[0] : words[1];
};
var getPhraseByDayOfWeek = function (str, words) {
    var strAsNumber = str != null ? Number(str) : 0;
    return words[[1, 0, 0, 1, 0, 0, 1][strAsNumber]];
};
var getNumberEnding = function (str, gender) {
    var strAsNumber = str != null ? Number(str) : 1;
    strAsNumber = Math.max(Math.min(strAsNumber < 10 || (strAsNumber > 20 && strAsNumber % 10 !== 0) ? strAsNumber % 10 : 3, 3), 1) - 1;
    var genderIndex = ['м', 'ж', 'ср'].indexOf(gender);
    return ['в', 'р', 'т'][strAsNumber] + ['и', 'а', 'о'][genderIndex];
};
var bg = (function () {
    function bg() {
    }
    bg.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    bg.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    bg.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    bg.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    bg.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    bg.prototype.everyMinute = function () {
        return 'всяка минута';
    };
    bg.prototype.everyHour = function () {
        return 'всеки час';
    };
    bg.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return 'Възникна грешка при генериране на описанието на израза. Проверете синтаксиса на cron израза.';
    };
    bg.prototype.atSpace = function () {
        return 'В ';
    };
    bg.prototype.everyMinuteBetweenX0AndX1 = function () {
        return 'Всяка минута от %s до %s';
    };
    bg.prototype.at = function () {
        return 'В';
    };
    bg.prototype.spaceAnd = function () {
        return ' и';
    };
    bg.prototype.everySecond = function () {
        return 'всяка секунда';
    };
    bg.prototype.everyX0Seconds = function (s) {
        return 'всеки %s секунди';
    };
    bg.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return 'секунди от %s до %s';
    };
    bg.prototype.atX0SecondsPastTheMinute = function (s) {
        return "%s-".concat(getNumberEnding(s, 'ж'), " \u0441\u0435\u043A\u0443\u043D\u0434\u0430");
    };
    bg.prototype.everyX0Minutes = function (s) {
        return 'всеки %s минути';
    };
    bg.prototype.minutesX0ThroughX1PastTheHour = function () {
        return 'минути от %s до %s';
    };
    bg.prototype.atX0MinutesPastTheHour = function (s) {
        return "%s-".concat(getNumberEnding(s, 'ж'), " \u043C\u0438\u043D\u0443\u0442a");
    };
    bg.prototype.everyX0Hours = function (s) {
        return 'всеки %s часа';
    };
    bg.prototype.betweenX0AndX1 = function () {
        return 'от %s до %s';
    };
    bg.prototype.atX0 = function () {
        return 'в %s';
    };
    bg.prototype.commaEveryDay = function () {
        return ', всеки ден';
    };
    bg.prototype.commaEveryX0DaysOfTheWeek = function (s) {
        return getPhraseByPlural(s, [', всеки %s ден от седмицата', ', всеки %s дена от седмицата']);
    };
    bg.prototype.commaX0ThroughX1 = function (s) {
        return ', от %s до %s';
    };
    bg.prototype.commaAndX0ThroughX1 = function (s) {
        return ' и от %s до %s';
    };
    bg.prototype.first = function (s) {
        return getPhraseByDayOfWeek(s, ['первият', 'первата']);
    };
    bg.prototype.second = function (s) {
        return getPhraseByDayOfWeek(s, ['вторият', 'втората']);
    };
    bg.prototype.third = function (s) {
        return getPhraseByDayOfWeek(s, ['третият', 'третата']);
    };
    bg.prototype.fourth = function (s) {
        return getPhraseByDayOfWeek(s, ['четвертият', 'четвертата']);
    };
    bg.prototype.fifth = function (s) {
        return getPhraseByDayOfWeek(s, ['петият', 'петата']);
    };
    bg.prototype.commaOnThe = function (s) {
        return ', ';
    };
    bg.prototype.spaceX0OfTheMonth = function () {
        return ' %s на месеца';
    };
    bg.prototype.lastDay = function () {
        return 'последният ден';
    };
    bg.prototype.commaOnTheLastX0OfTheMonth = function (s) {
        return getPhraseByDayOfWeek(s, [', в последният %s от месеца', ', в последната %s отмесеца']);
    };
    bg.prototype.commaOnlyOnX0 = function (s) {
        return ', %s';
    };
    bg.prototype.commaAndOnX0 = function () {
        return ' и %s';
    };
    bg.prototype.commaEveryX0Months = function (s) {
        return ' всеки %s месеца';
    };
    bg.prototype.commaOnlyInMonthX0 = function () {
        return ', %s';
    };
    bg.prototype.commaOnlyInX0 = function () {
        return ', в %s';
    };
    bg.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ', в последният ден на месеца';
    };
    bg.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ', в последния делничен ден от месеца';
    };
    bg.prototype.commaDaysBeforeTheLastDayOfTheMonth = function (s) {
        return getPhraseByPlural(s, [', %s ден преди края на месеца', ', %s дена преди края на месеца']);
    };
    bg.prototype.firstWeekday = function () {
        return 'първият делничен ден';
    };
    bg.prototype.weekdayNearestDayX0 = function () {
        return 'най-близкият делничен ден до %s число';
    };
    bg.prototype.commaOnTheX0OfTheMonth = function () {
        return ', на %s число от месеца';
    };
    bg.prototype.commaEveryX0Days = function (s) {
        return getPhraseByPlural(s, [', всеки %s ден', ', всеки %s дена']);
    };
    bg.prototype.commaBetweenDayX0AndX1OfTheMonth = function (s) {
        var _a;
        var values = (_a = s === null || s === void 0 ? void 0 : s.split('-')) !== null && _a !== void 0 ? _a : [];
        return ", \u043E\u0442 %s-".concat(getNumberEnding(values[0], 'ср'), " \u0434\u043E %s-").concat(getNumberEnding(values[1], 'ср'), " \u0447\u0438\u0441\u043B\u043E \u043D\u0430 \u043C\u0435\u0441\u0435\u0446\u0430");
    };
    bg.prototype.commaOnDayX0OfTheMonth = function (s) {
        return ", \u043D\u0430 %s-".concat(getNumberEnding(s, 'ср'), " \u0447\u0438\u0441\u043B\u043E \u043E\u0442 \u043C\u0435\u0441\u0435\u0446\u0430");
    };
    bg.prototype.commaEveryX0Years = function (s) {
        return getPhraseByPlural(s, [', всяка %s година', ', всеки %s години']);
    };
    bg.prototype.commaStartingX0 = function () {
        return ', започвайки %s';
    };
    bg.prototype.daysOfTheWeek = function () {
        return ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
    };
    bg.prototype.monthsOfTheYear = function () {
        return ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септевмври', 'октомври', 'ноември', 'декември'];
    };
    return bg;
}());
exports.bg = bg;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["bg"] = new bg();

/******/ 	return __webpack_exports__;
/******/ })()
;
});