(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/en", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/en"] = factory(require("cronstrue"));
	else
		root["locales/en"] = factory(root["cronstrue"]);
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
exports.en = void 0;
var en = (function () {
    function en() {
    }
    en.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    en.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    en.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    en.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    en.prototype.use24HourTimeFormatByDefault = function () {
        return false;
    };
    en.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "An error occured when generating the expression description.  Check the cron expression syntax.";
    };
    en.prototype.everyMinute = function () {
        return "every minute";
    };
    en.prototype.everyHour = function () {
        return "every hour";
    };
    en.prototype.atSpace = function () {
        return "At ";
    };
    en.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Every minute between %s and %s";
    };
    en.prototype.at = function () {
        return "At";
    };
    en.prototype.spaceAnd = function () {
        return " and";
    };
    en.prototype.everySecond = function () {
        return "every second";
    };
    en.prototype.everyX0Seconds = function () {
        return "every %s seconds";
    };
    en.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "seconds %s through %s past the minute";
    };
    en.prototype.atX0SecondsPastTheMinute = function () {
        return "at %s seconds past the minute";
    };
    en.prototype.everyX0Minutes = function () {
        return "every %s minutes";
    };
    en.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minutes %s through %s past the hour";
    };
    en.prototype.atX0MinutesPastTheHour = function () {
        return "at %s minutes past the hour";
    };
    en.prototype.everyX0Hours = function () {
        return "every %s hours";
    };
    en.prototype.betweenX0AndX1 = function () {
        return "between %s and %s";
    };
    en.prototype.atX0 = function () {
        return "at %s";
    };
    en.prototype.commaEveryDay = function () {
        return ", every day";
    };
    en.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", every %s days of the week";
    };
    en.prototype.commaX0ThroughX1 = function () {
        return ", %s through %s";
    };
    en.prototype.commaAndX0ThroughX1 = function () {
        return ", %s through %s";
    };
    en.prototype.first = function () {
        return "first";
    };
    en.prototype.second = function () {
        return "second";
    };
    en.prototype.third = function () {
        return "third";
    };
    en.prototype.fourth = function () {
        return "fourth";
    };
    en.prototype.fifth = function () {
        return "fifth";
    };
    en.prototype.commaOnThe = function () {
        return ", on the ";
    };
    en.prototype.spaceX0OfTheMonth = function () {
        return " %s of the month";
    };
    en.prototype.lastDay = function () {
        return "the last day";
    };
    en.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", on the last %s of the month";
    };
    en.prototype.commaOnlyOnX0 = function () {
        return ", only on %s";
    };
    en.prototype.commaAndOnX0 = function () {
        return ", and on %s";
    };
    en.prototype.commaEveryX0Months = function () {
        return ", every %s months";
    };
    en.prototype.commaOnlyInX0 = function () {
        return ", only in %s";
    };
    en.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", on the last day of the month";
    };
    en.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", on the last weekday of the month";
    };
    en.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s days before the last day of the month";
    };
    en.prototype.firstWeekday = function () {
        return "first weekday";
    };
    en.prototype.weekdayNearestDayX0 = function () {
        return "weekday nearest day %s";
    };
    en.prototype.commaOnTheX0OfTheMonth = function () {
        return ", on the %s of the month";
    };
    en.prototype.commaEveryX0Days = function () {
        return ", every %s days";
    };
    en.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", between day %s and %s of the month";
    };
    en.prototype.commaOnDayX0OfTheMonth = function () {
        return ", on day %s of the month";
    };
    en.prototype.commaEveryHour = function () {
        return ", every hour";
    };
    en.prototype.commaEveryX0Years = function () {
        return ", every %s years";
    };
    en.prototype.commaStartingX0 = function () {
        return ", starting %s";
    };
    en.prototype.daysOfTheWeek = function () {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    };
    en.prototype.monthsOfTheYear = function () {
        return [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
    };
    return en;
}());
exports.en = en;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["en"] = new en();

/******/ 	return __webpack_exports__;
/******/ })()
;
});