(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/hu", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/hu"] = factory(require("cronstrue"));
	else
		root["locales/hu"] = factory(root["cronstrue"]);
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
exports.hu = void 0;
var hu = (function () {
    function hu() {
    }
    hu.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    hu.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    hu.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    hu.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    hu.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    hu.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Hiba történt a kifejezésleírás generálásakor. Ellenőrizze a cron kifejezés szintaxisát.";
    };
    hu.prototype.everyMinute = function () {
        return "minden percben";
    };
    hu.prototype.everyHour = function () {
        return "minden órában";
    };
    hu.prototype.atSpace = function () {
        return "Ekkor: ";
    };
    hu.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "percenként %s és %s között";
    };
    hu.prototype.at = function () {
        return "Ekkor:";
    };
    hu.prototype.spaceAnd = function () {
        return " és";
    };
    hu.prototype.everySecond = function () {
        return "minden másodpercben";
    };
    hu.prototype.everyX0Seconds = function () {
        return "%s másodpercenként";
    };
    hu.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "%s. másodpercben %s perc után";
    };
    hu.prototype.atX0SecondsPastTheMinute = function () {
        return "%s. másodpercben";
    };
    hu.prototype.everyX0Minutes = function () {
        return "minden %s. percben";
    };
    hu.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "%s. percben %s óra után";
    };
    hu.prototype.atX0MinutesPastTheHour = function () {
        return "%s. percben";
    };
    hu.prototype.everyX0Hours = function () {
        return "minden %s órában";
    };
    hu.prototype.betweenX0AndX1 = function () {
        return "%s és %s között";
    };
    hu.prototype.atX0 = function () {
        return "ekkor %s";
    };
    hu.prototype.commaEveryDay = function () {
        return ", minden nap";
    };
    hu.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", a hét minden %s napján";
    };
    hu.prototype.commaX0ThroughX1 = function () {
        return ", %s - %s";
    };
    hu.prototype.commaAndX0ThroughX1 = function () {
        return ", és %s - %s";
    };
    hu.prototype.first = function () {
        return "első";
    };
    hu.prototype.second = function () {
        return "második";
    };
    hu.prototype.third = function () {
        return "harmadik";
    };
    hu.prototype.fourth = function () {
        return "negyedik";
    };
    hu.prototype.fifth = function () {
        return "ötödik";
    };
    hu.prototype.commaOnThe = function () {
        return ", ";
    };
    hu.prototype.spaceX0OfTheMonth = function () {
        return " %s a hónapban";
    };
    hu.prototype.lastDay = function () {
        return "az utolsó nap";
    };
    hu.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", a hónap utolsó %s";
    };
    hu.prototype.commaOnlyOnX0 = function () {
        return ", csak ekkor: %s";
    };
    hu.prototype.commaAndOnX0 = function () {
        return ", és %s";
    };
    hu.prototype.commaEveryX0Months = function () {
        return ", minden %s hónapban";
    };
    hu.prototype.commaOnlyInX0 = function () {
        return ", csak ekkor: %s";
    };
    hu.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", a hónap utolsó napján";
    };
    hu.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", a hónap utolsó hétköznapján";
    };
    hu.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s nappal a hónap utolsó napja előtt";
    };
    hu.prototype.firstWeekday = function () {
        return "első hétköznap";
    };
    hu.prototype.weekdayNearestDayX0 = function () {
        return "hétköznap legközelebbi nap %s";
    };
    hu.prototype.commaOnTheX0OfTheMonth = function () {
        return ", a hónap %s";
    };
    hu.prototype.commaEveryX0Days = function () {
        return ", %s naponként";
    };
    hu.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", a hónap %s és %s napja között";
    };
    hu.prototype.commaOnDayX0OfTheMonth = function () {
        return ", a hónap %s napján";
    };
    hu.prototype.commaEveryHour = function () {
        return ", minden órában";
    };
    hu.prototype.commaEveryX0Years = function () {
        return ", %s évente";
    };
    hu.prototype.commaStartingX0 = function () {
        return ", %s kezdettel";
    };
    hu.prototype.daysOfTheWeek = function () {
        return ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    };
    hu.prototype.monthsOfTheYear = function () {
        return [
            "január",
            "február",
            "március",
            "április",
            "május",
            "június",
            "július",
            "augusztus",
            "szeptember",
            "október",
            "november",
            "december",
        ];
    };
    return hu;
}());
exports.hu = hu;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["hu"] = new hu();

/******/ 	return __webpack_exports__;
/******/ })()
;
});