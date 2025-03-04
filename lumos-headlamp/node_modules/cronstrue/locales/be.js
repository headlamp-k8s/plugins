(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/be", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/be"] = factory(require("cronstrue"));
	else
		root["locales/be"] = factory(root["cronstrue"]);
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
exports.be = void 0;
var be = (function () {
    function be() {
    }
    be.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    be.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    be.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    be.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    be.prototype.use24HourTimeFormatByDefault = function () {
        return false;
    };
    be.prototype.everyMinute = function () {
        return "кожную хвіліну";
    };
    be.prototype.everyHour = function () {
        return "кожную гадзіну";
    };
    be.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Адбылася памылка падчас генерацыі апісання выразы. Праверце сінтаксіс крон-выразы.";
    };
    be.prototype.atSpace = function () {
        return "У ";
    };
    be.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Кожную хвіліну з %s да %s";
    };
    be.prototype.at = function () {
        return "У";
    };
    be.prototype.spaceAnd = function () {
        return " і";
    };
    be.prototype.everySecond = function () {
        return "кожную секунду";
    };
    be.prototype.everyX0Seconds = function () {
        return "кожныя %s секунд";
    };
    be.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "секунды з %s па %s";
    };
    be.prototype.atX0SecondsPastTheMinute = function () {
        return "у %s секунд";
    };
    be.prototype.everyX0Minutes = function () {
        return "кожныя %s хвілін";
    };
    be.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "хвіліны з %s па %s";
    };
    be.prototype.atX0MinutesPastTheHour = function () {
        return "у %s хвілін";
    };
    be.prototype.everyX0Hours = function () {
        return "кожныя %s гадзін";
    };
    be.prototype.betweenX0AndX1 = function () {
        return "з %s па %s";
    };
    be.prototype.atX0 = function () {
        return "у %s";
    };
    be.prototype.commaEveryDay = function () {
        return ", кожны дзень";
    };
    be.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", кожныя %s дзён тыдня";
    };
    be.prototype.commaX0ThroughX1 = function () {
        return ", %s па %s";
    };
    be.prototype.commaAndX0ThroughX1 = function () {
        return ", і %s па %s";
    };
    be.prototype.first = function () {
        return "першы";
    };
    be.prototype.second = function () {
        return "другі";
    };
    be.prototype.third = function () {
        return "трэці";
    };
    be.prototype.fourth = function () {
        return "чацвёрты";
    };
    be.prototype.fifth = function () {
        return "пяты";
    };
    be.prototype.commaOnThe = function () {
        return ", у ";
    };
    be.prototype.spaceX0OfTheMonth = function () {
        return " %s месяца";
    };
    be.prototype.lastDay = function () {
        return "апошні дзень";
    };
    be.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", у апошні %s месяца";
    };
    be.prototype.commaOnlyOnX0 = function () {
        return ", толькі ў %s";
    };
    be.prototype.commaAndOnX0 = function () {
        return ", і ў %s";
    };
    be.prototype.commaEveryX0Months = function () {
        return ", кожныя %s месяцаў";
    };
    be.prototype.commaOnlyInX0 = function () {
        return ", толькі ў %s";
    };
    be.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", у апошні дзень месяца";
    };
    be.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", у апошні будні дзень месяца";
    };
    be.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s дзён да апошняга дня месяца";
    };
    be.prototype.firstWeekday = function () {
        return "першы будны дзень";
    };
    be.prototype.weekdayNearestDayX0 = function () {
        return "найбліжэйшы будны дзень да %s";
    };
    be.prototype.commaOnTheX0OfTheMonth = function () {
        return ", у %s месяцы";
    };
    be.prototype.commaEveryX0Days = function () {
        return ", кожныя %s дзён";
    };
    be.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", з %s па %s лік месяца";
    };
    be.prototype.commaOnDayX0OfTheMonth = function () {
        return ", у %s лік месяца";
    };
    be.prototype.commaEveryX0Years = function () {
        return ", кожныя %s гадоў";
    };
    be.prototype.commaStartingX0 = function () {
        return ", пачатак %s";
    };
    be.prototype.daysOfTheWeek = function () {
        return ["нядзеля", "панядзелак", "аўторак", "серада", "чацвер", "пятніца", "субота"];
    };
    be.prototype.monthsOfTheYear = function () {
        return [
            "студзень",
            "люты",
            "сакавік",
            "красавік",
            "травень",
            "чэрвень",
            "ліпень",
            "жнівень",
            "верасень",
            "кастрычнік",
            "лістапад",
            "снежань",
        ];
    };
    return be;
}());
exports.be = be;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["be"] = new be();

/******/ 	return __webpack_exports__;
/******/ })()
;
});