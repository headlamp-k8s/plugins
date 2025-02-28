(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/fa", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/fa"] = factory(require("cronstrue"));
	else
		root["locales/fa"] = factory(root["cronstrue"]);
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
exports.fa = void 0;
var fa = (function () {
    function fa() {
    }
    fa.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    fa.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    fa.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    fa.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    fa.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    fa.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "خطایی در نمایش توضیحات این وظیفه رخ داد. لطفا ساختار آن را بررسی کنید.";
    };
    fa.prototype.everyMinute = function () {
        return "هر دقیقه";
    };
    fa.prototype.everyHour = function () {
        return "هر ساعت";
    };
    fa.prototype.atSpace = function () {
        return "در ";
    };
    fa.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "هر دقیقه بین %s و %s";
    };
    fa.prototype.at = function () {
        return "در";
    };
    fa.prototype.spaceAnd = function () {
        return " و";
    };
    fa.prototype.everySecond = function () {
        return "هر ثانیه";
    };
    fa.prototype.everyX0Seconds = function () {
        return "هر %s ثانیه";
    };
    fa.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "ثانیه %s تا %s دقیقه گذشته";
    };
    fa.prototype.atX0SecondsPastTheMinute = function () {
        return "در %s قانیه از دقیقه گذشته";
    };
    fa.prototype.everyX0Minutes = function () {
        return "هر %s دقیقه";
    };
    fa.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "دقیقه %s تا %s ساعت گذشته";
    };
    fa.prototype.atX0MinutesPastTheHour = function () {
        return "در %s دقیقه پس از ساعت";
    };
    fa.prototype.everyX0Hours = function () {
        return "هر %s ساعت";
    };
    fa.prototype.betweenX0AndX1 = function () {
        return "بین %s و %s";
    };
    fa.prototype.atX0 = function () {
        return "در %s";
    };
    fa.prototype.commaEveryDay = function () {
        return ", هر روز";
    };
    fa.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", هر %s روز از هفته";
    };
    fa.prototype.commaX0ThroughX1 = function () {
        return ", %s تا %s";
    };
    fa.prototype.commaAndX0ThroughX1 = function () {
        return ", و %s تا %s";
    };
    fa.prototype.first = function () {
        return "اول";
    };
    fa.prototype.second = function () {
        return "دوم";
    };
    fa.prototype.third = function () {
        return "سوم";
    };
    fa.prototype.fourth = function () {
        return "چهارم";
    };
    fa.prototype.fifth = function () {
        return "پنجم";
    };
    fa.prototype.commaOnThe = function () {
        return ", در ";
    };
    fa.prototype.spaceX0OfTheMonth = function () {
        return " %s ماه";
    };
    fa.prototype.lastDay = function () {
        return "آخرین روز";
    };
    fa.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", در %s ماه";
    };
    fa.prototype.commaOnlyOnX0 = function () {
        return ", فقط در %s";
    };
    fa.prototype.commaAndOnX0 = function () {
        return ", و در %s";
    };
    fa.prototype.commaEveryX0Months = function () {
        return ", هر %s ماه";
    };
    fa.prototype.commaOnlyInX0 = function () {
        return ", فقط در %s";
    };
    fa.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", در آخرین روز ماه";
    };
    fa.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", در آخرین روز ماه";
    };
    fa.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s روز قبل از آخرین روز ماه";
    };
    fa.prototype.firstWeekday = function () {
        return "اولین روز";
    };
    fa.prototype.weekdayNearestDayX0 = function () {
        return "روز نزدیک به روز %s";
    };
    fa.prototype.commaOnTheX0OfTheMonth = function () {
        return ", در %s ماه";
    };
    fa.prototype.commaEveryX0Days = function () {
        return ", هر %s روز";
    };
    fa.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", بین روز %s و %s ماه";
    };
    fa.prototype.commaOnDayX0OfTheMonth = function () {
        return ", در %s ماه";
    };
    fa.prototype.commaEveryMinute = function () {
        return ", هر minute";
    };
    fa.prototype.commaEveryHour = function () {
        return ", هر ساعت";
    };
    fa.prototype.commaEveryX0Years = function () {
        return ", هر %s سال";
    };
    fa.prototype.commaStartingX0 = function () {
        return ", آغاز %s";
    };
    fa.prototype.daysOfTheWeek = function () {
        return ["یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
    };
    fa.prototype.monthsOfTheYear = function () {
        return ["ژانویه", "فوریه", "مارس", "آپریل", "مه", "ژوئن", "ژوئیه", "آگوست", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
    };
    return fa;
}());
exports.fa = fa;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["fa"] = new fa();

/******/ 	return __webpack_exports__;
/******/ })()
;
});