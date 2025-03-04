(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/cs", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/cs"] = factory(require("cronstrue"));
	else
		root["locales/cs"] = factory(root["cronstrue"]);
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
exports.cs = void 0;
var cs = (function () {
    function cs() {
    }
    cs.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    cs.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    cs.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    cs.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    cs.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    cs.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Při vytváření popisu došlo k chybě. Zkontrolujte prosím správnost syntaxe cronu.";
    };
    cs.prototype.everyMinute = function () {
        return "každou minutu";
    };
    cs.prototype.everyHour = function () {
        return "každou hodinu";
    };
    cs.prototype.atSpace = function () {
        return "V ";
    };
    cs.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Každou minutu mezi %s a %s";
    };
    cs.prototype.at = function () {
        return "V";
    };
    cs.prototype.spaceAnd = function () {
        return " a";
    };
    cs.prototype.everySecond = function () {
        return "každou sekundu";
    };
    cs.prototype.everyX0Seconds = function () {
        return "každých %s sekund";
    };
    cs.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "sekundy od %s do %s";
    };
    cs.prototype.atX0SecondsPastTheMinute = function () {
        return "v %s sekund";
    };
    cs.prototype.everyX0Minutes = function () {
        return "každých %s minut";
    };
    cs.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minuty od %s do %s";
    };
    cs.prototype.atX0MinutesPastTheHour = function () {
        return "v %s minut";
    };
    cs.prototype.everyX0Hours = function () {
        return "každých %s hodin";
    };
    cs.prototype.betweenX0AndX1 = function () {
        return "mezi %s a %s";
    };
    cs.prototype.atX0 = function () {
        return "v %s";
    };
    cs.prototype.commaEveryDay = function () {
        return ", každý den";
    };
    cs.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", každých %s dní v týdnu";
    };
    cs.prototype.commaX0ThroughX1 = function () {
        return ", od %s do %s";
    };
    cs.prototype.commaAndX0ThroughX1 = function () {
        return ", a od %s do %s";
    };
    cs.prototype.first = function () {
        return "první";
    };
    cs.prototype.second = function () {
        return "druhý";
    };
    cs.prototype.third = function () {
        return "třetí";
    };
    cs.prototype.fourth = function () {
        return "čtvrtý";
    };
    cs.prototype.fifth = function () {
        return "pátý";
    };
    cs.prototype.commaOnThe = function () {
        return ", ";
    };
    cs.prototype.spaceX0OfTheMonth = function () {
        return " %s v měsíci";
    };
    cs.prototype.lastDay = function () {
        return "poslední den";
    };
    cs.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", poslední %s v měsíci";
    };
    cs.prototype.commaOnlyOnX0 = function () {
        return ", pouze v %s";
    };
    cs.prototype.commaAndOnX0 = function () {
        return ", a v %s";
    };
    cs.prototype.commaEveryX0Months = function () {
        return ", každých %s měsíců";
    };
    cs.prototype.commaOnlyInX0 = function () {
        return ", pouze v %s";
    };
    cs.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", poslední den v měsíci";
    };
    cs.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", poslední pracovní den v měsíci";
    };
    cs.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dní před posledním dnem v měsíci";
    };
    cs.prototype.firstWeekday = function () {
        return "první pracovní den";
    };
    cs.prototype.weekdayNearestDayX0 = function () {
        return "pracovní den nejblíže %s. dni";
    };
    cs.prototype.commaOnTheX0OfTheMonth = function () {
        return ", v %s v měsíci";
    };
    cs.prototype.commaEveryX0Days = function () {
        return ", každých %s dnů";
    };
    cs.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", mezi dny %s a %s v měsíci";
    };
    cs.prototype.commaOnDayX0OfTheMonth = function () {
        return ", %s. den v měsíci";
    };
    cs.prototype.commaEveryX0Years = function () {
        return ", každých %s roků";
    };
    cs.prototype.commaStartingX0 = function () {
        return ", začínající %s";
    };
    cs.prototype.daysOfTheWeek = function () {
        return ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
    };
    cs.prototype.monthsOfTheYear = function () {
        return [
            "Leden",
            "Únor",
            "Březen",
            "Duben",
            "Květen",
            "Červen",
            "Červenec",
            "Srpen",
            "Září",
            "Říjen",
            "Listopad",
            "Prosinec",
        ];
    };
    return cs;
}());
exports.cs = cs;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["cs"] = new cs();

/******/ 	return __webpack_exports__;
/******/ })()
;
});