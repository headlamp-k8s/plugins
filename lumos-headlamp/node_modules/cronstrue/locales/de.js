(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/de", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/de"] = factory(require("cronstrue"));
	else
		root["locales/de"] = factory(root["cronstrue"]);
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
exports.de = void 0;
var de = (function () {
    function de() {
    }
    de.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    de.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    de.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    de.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    de.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    de.prototype.everyMinute = function () {
        return "jede Minute";
    };
    de.prototype.everyHour = function () {
        return "jede Stunde";
    };
    de.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Beim Generieren der Ausdrucksbeschreibung ist ein Fehler aufgetreten. Überprüfen Sie die Syntax des Cron-Ausdrucks.";
    };
    de.prototype.atSpace = function () {
        return "Um ";
    };
    de.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Jede Minute zwischen %s und %s";
    };
    de.prototype.at = function () {
        return "Um";
    };
    de.prototype.spaceAnd = function () {
        return " und";
    };
    de.prototype.everySecond = function () {
        return "Jede Sekunde";
    };
    de.prototype.everyX0Seconds = function () {
        return "alle %s Sekunden";
    };
    de.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "Sekunden %s bis %s";
    };
    de.prototype.atX0SecondsPastTheMinute = function () {
        return "bei Sekunde %s";
    };
    de.prototype.everyX0Minutes = function () {
        return "alle %s Minuten";
    };
    de.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "Minuten %s bis %s";
    };
    de.prototype.atX0MinutesPastTheHour = function () {
        return "bei Minute %s";
    };
    de.prototype.everyX0Hours = function () {
        return "alle %s Stunden";
    };
    de.prototype.betweenX0AndX1 = function () {
        return "zwischen %s und %s";
    };
    de.prototype.atX0 = function () {
        return "um %s";
    };
    de.prototype.commaEveryDay = function () {
        return ", jeden Tag";
    };
    de.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", alle %s Tage der Woche";
    };
    de.prototype.commaX0ThroughX1 = function () {
        return ", %s bis %s";
    };
    de.prototype.commaAndX0ThroughX1 = function () {
        return ", und %s bis %s";
    };
    de.prototype.first = function () {
        return "ersten";
    };
    de.prototype.second = function () {
        return "zweiten";
    };
    de.prototype.third = function () {
        return "dritten";
    };
    de.prototype.fourth = function () {
        return "vierten";
    };
    de.prototype.fifth = function () {
        return "fünften";
    };
    de.prototype.commaOnThe = function () {
        return ", am ";
    };
    de.prototype.spaceX0OfTheMonth = function () {
        return " %s des Monats";
    };
    de.prototype.lastDay = function () {
        return "der letzte Tag";
    };
    de.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", am letzten %s des Monats";
    };
    de.prototype.commaOnlyOnX0 = function () {
        return ", nur jeden %s";
    };
    de.prototype.commaAndOnX0 = function () {
        return ", und jeden %s";
    };
    de.prototype.commaEveryX0Months = function () {
        return ", alle %s Monate";
    };
    de.prototype.commaOnlyInX0 = function () {
        return ", nur im %s";
    };
    de.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", am letzten Tag des Monats";
    };
    de.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", am letzten Werktag des Monats";
    };
    de.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s tage vor dem letzten Tag des Monats";
    };
    de.prototype.firstWeekday = function () {
        return "ersten Werktag";
    };
    de.prototype.weekdayNearestDayX0 = function () {
        return "Werktag am nächsten zum %s Tag";
    };
    de.prototype.commaOnTheX0OfTheMonth = function () {
        return ", am %s des Monats";
    };
    de.prototype.commaEveryX0Days = function () {
        return ", alle %s Tage";
    };
    de.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", zwischen Tag %s und %s des Monats";
    };
    de.prototype.commaOnDayX0OfTheMonth = function () {
        return ", an Tag %s des Monats";
    };
    de.prototype.commaEveryX0Years = function () {
        return ", alle %s Jahre";
    };
    de.prototype.commaStartingX0 = function () {
        return ", beginnend %s";
    };
    de.prototype.daysOfTheWeek = function () {
        return ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    };
    de.prototype.monthsOfTheYear = function () {
        return [
            "Januar",
            "Februar",
            "März",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Dezember",
        ];
    };
    return de;
}());
exports.de = de;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["de"] = new de();

/******/ 	return __webpack_exports__;
/******/ })()
;
});