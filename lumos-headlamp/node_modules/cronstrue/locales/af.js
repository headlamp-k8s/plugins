(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/af", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/af"] = factory(require("cronstrue"));
	else
		root["locales/af"] = factory(root["cronstrue"]);
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
exports.af = void 0;
var af = (function () {
    function af() {
    }
    af.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    af.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    af.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    af.prototype.commaYearX0ThroughYearX1 = function () {
        return ", jaar %s na %s";
    };
    af.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    af.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Daar was 'n fout om die tydsuitdrukking the genereer. Raadpleeg asb die uitdrukking formaat.";
    };
    af.prototype.everyMinute = function () {
        return "elke minuut";
    };
    af.prototype.everyHour = function () {
        return "elke uur";
    };
    af.prototype.atSpace = function () {
        return "Teen ";
    };
    af.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Elke minuut tussen %s en %s";
    };
    af.prototype.at = function () {
        return "Teen";
    };
    af.prototype.spaceAnd = function () {
        return " en";
    };
    af.prototype.everySecond = function () {
        return "elke sekonde";
    };
    af.prototype.everyX0Seconds = function () {
        return "elke %s sekonde";
    };
    af.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "sekonde %s deur na %s na die minuut";
    };
    af.prototype.atX0SecondsPastTheMinute = function () {
        return "teen %s sekondes na die minuut";
    };
    af.prototype.everyX0Minutes = function () {
        return "elke %s minute";
    };
    af.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minute %s deur na %s na die uur";
    };
    af.prototype.atX0MinutesPastTheHour = function () {
        return "teen %s minute na die uur";
    };
    af.prototype.everyX0Hours = function () {
        return "elke %s ure";
    };
    af.prototype.betweenX0AndX1 = function () {
        return "tussen %s en %s";
    };
    af.prototype.atX0 = function () {
        return "teen %s";
    };
    af.prototype.commaEveryDay = function () {
        return ", elke dag";
    };
    af.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", elke %s dae van die week";
    };
    af.prototype.commaX0ThroughX1 = function () {
        return ", %s deur na %s";
    };
    af.prototype.commaAndX0ThroughX1 = function () {
        return ", en %s deur na %s";
    };
    af.prototype.first = function () {
        return "eerste";
    };
    af.prototype.second = function () {
        return "tweede";
    };
    af.prototype.third = function () {
        return "derde";
    };
    af.prototype.fourth = function () {
        return "vierde";
    };
    af.prototype.fifth = function () {
        return "vyfde";
    };
    af.prototype.commaOnThe = function () {
        return ", op die ";
    };
    af.prototype.spaceX0OfTheMonth = function () {
        return " %s van die maand";
    };
    af.prototype.lastDay = function () {
        return "die laaste dag";
    };
    af.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", op die laaste %s van die maand";
    };
    af.prototype.commaOnlyOnX0 = function () {
        return ", net op %s";
    };
    af.prototype.commaAndOnX0 = function () {
        return ", en op %s";
    };
    af.prototype.commaEveryX0Months = function () {
        return ", elke %s maande";
    };
    af.prototype.commaOnlyInX0 = function () {
        return ", net in %s";
    };
    af.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", op die laaste dag van die maand";
    };
    af.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", op die laaste weeksdag van die maand";
    };
    af.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dae voor die laaste dag van die maand";
    };
    af.prototype.firstWeekday = function () {
        return "eerste weeksdag";
    };
    af.prototype.weekdayNearestDayX0 = function () {
        return "weeksdag naaste aan dag %s";
    };
    af.prototype.commaOnTheX0OfTheMonth = function () {
        return ", op die %s van die maande";
    };
    af.prototype.commaEveryX0Days = function () {
        return ", elke %s dae";
    };
    af.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", tussen dag %s en %s van die maand";
    };
    af.prototype.commaOnDayX0OfTheMonth = function () {
        return ", op dag %s van die maand";
    };
    af.prototype.commaEveryHour = function () {
        return ", elke uur";
    };
    af.prototype.commaEveryX0Years = function () {
        return ", elke %s jare";
    };
    af.prototype.commaStartingX0 = function () {
        return ", beginnende %s";
    };
    af.prototype.daysOfTheWeek = function () {
        return ["Sondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrydag", "Saterdag"];
    };
    af.prototype.monthsOfTheYear = function () {
        return [
            "Januarie",
            "Februarie",
            "Maart",
            "April",
            "Mei",
            "Junie",
            "Julie",
            "Augustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];
    };
    return af;
}());
exports.af = af;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["af"] = new af();

/******/ 	return __webpack_exports__;
/******/ })()
;
});