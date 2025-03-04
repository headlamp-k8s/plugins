(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/nl", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/nl"] = factory(require("cronstrue"));
	else
		root["locales/nl"] = factory(root["cronstrue"]);
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
exports.nl = void 0;
var nl = (function () {
    function nl() {
    }
    nl.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    nl.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    nl.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    nl.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    nl.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    nl.prototype.everyMinute = function () {
        return "elke minuut";
    };
    nl.prototype.everyHour = function () {
        return "elk uur";
    };
    nl.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Er is een fout opgetreden bij het vertalen van de gegevens. Controleer de gegevens.";
    };
    nl.prototype.atSpace = function () {
        return "Om ";
    };
    nl.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Elke minuut tussen %s en %s";
    };
    nl.prototype.at = function () {
        return "Om";
    };
    nl.prototype.spaceAnd = function () {
        return " en";
    };
    nl.prototype.everySecond = function () {
        return "elke seconde";
    };
    nl.prototype.everyX0Seconds = function () {
        return "elke %s seconden";
    };
    nl.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "seconden %s t/m %s na de minuut";
    };
    nl.prototype.atX0SecondsPastTheMinute = function () {
        return "op %s seconden na de minuut";
    };
    nl.prototype.everyX0Minutes = function () {
        return "elke %s minuten";
    };
    nl.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minuut %s t/m %s na het uur";
    };
    nl.prototype.atX0MinutesPastTheHour = function () {
        return "op %s minuten na het uur";
    };
    nl.prototype.everyX0Hours = function () {
        return "elke %s uur";
    };
    nl.prototype.betweenX0AndX1 = function () {
        return "tussen %s en %s";
    };
    nl.prototype.atX0 = function () {
        return "om %s";
    };
    nl.prototype.commaEveryDay = function () {
        return ", elke dag";
    };
    nl.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", elke %s dagen van de week";
    };
    nl.prototype.commaX0ThroughX1 = function () {
        return ", %s t/m %s";
    };
    nl.prototype.commaAndX0ThroughX1 = function () {
        return ", en %s t/m %s";
    };
    nl.prototype.first = function () {
        return "eerste";
    };
    nl.prototype.second = function () {
        return "tweede";
    };
    nl.prototype.third = function () {
        return "derde";
    };
    nl.prototype.fourth = function () {
        return "vierde";
    };
    nl.prototype.fifth = function () {
        return "vijfde";
    };
    nl.prototype.commaOnThe = function () {
        return ", op de ";
    };
    nl.prototype.spaceX0OfTheMonth = function () {
        return " %s van de maand";
    };
    nl.prototype.lastDay = function () {
        return "de laatste dag";
    };
    nl.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", op de laatste %s van de maand";
    };
    nl.prototype.commaOnlyOnX0 = function () {
        return ", alleen op %s";
    };
    nl.prototype.commaAndOnX0 = function () {
        return ", en op %s";
    };
    nl.prototype.commaEveryX0Months = function () {
        return ", elke %s maanden";
    };
    nl.prototype.commaOnlyInX0 = function () {
        return ", alleen in %s";
    };
    nl.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", op de laatste dag van de maand";
    };
    nl.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", op de laatste werkdag van de maand";
    };
    nl.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dagen vóór de laatste dag van de maand";
    };
    nl.prototype.firstWeekday = function () {
        return "eerste werkdag";
    };
    nl.prototype.weekdayNearestDayX0 = function () {
        return "werkdag dichtst bij dag %s";
    };
    nl.prototype.commaOnTheX0OfTheMonth = function () {
        return ", op de %s van de maand";
    };
    nl.prototype.commaEveryX0Days = function () {
        return ", elke %s dagen";
    };
    nl.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", tussen dag %s en %s van de maand";
    };
    nl.prototype.commaOnDayX0OfTheMonth = function () {
        return ", op dag %s van de maand";
    };
    nl.prototype.commaEveryX0Years = function () {
        return ", elke %s jaren";
    };
    nl.prototype.commaStartingX0 = function () {
        return ", beginnend %s";
    };
    nl.prototype.daysOfTheWeek = function () {
        return ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    };
    nl.prototype.monthsOfTheYear = function () {
        return [
            "januari",
            "februari",
            "maart",
            "april",
            "mei",
            "juni",
            "juli",
            "augustus",
            "september",
            "oktober",
            "november",
            "december",
        ];
    };
    return nl;
}());
exports.nl = nl;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["nl"] = new nl();

/******/ 	return __webpack_exports__;
/******/ })()
;
});