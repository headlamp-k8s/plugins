(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/sl", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/sl"] = factory(require("cronstrue"));
	else
		root["locales/sl"] = factory(root["cronstrue"]);
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
exports.sl = void 0;
var sl = (function () {
    function sl() {
    }
    sl.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    sl.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Pri generiranju opisa izraza je prišlo do napake. Preverite sintakso izraza cron.";
    };
    sl.prototype.at = function () {
        return "Ob";
    };
    sl.prototype.atSpace = function () {
        return "Ob ";
    };
    sl.prototype.atX0 = function () {
        return "ob %s";
    };
    sl.prototype.atX0MinutesPastTheHour = function () {
        return "ob %s.";
    };
    sl.prototype.atX0SecondsPastTheMinute = function () {
        return "ob %s.";
    };
    sl.prototype.betweenX0AndX1 = function () {
        return "od %s do %s";
    };
    sl.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", od %s. do %s. dne v mesecu";
    };
    sl.prototype.commaEveryDay = function () {
        return ", vsak dan";
    };
    sl.prototype.commaEveryX0Days = function () {
        return ", vsakih %s dni";
    };
    sl.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", vsakih %s dni v tednu";
    };
    sl.prototype.commaEveryX0Months = function () {
        return ", vsakih %s mesecev";
    };
    sl.prototype.commaEveryX0Years = function () {
        return ", vsakih %s let";
    };
    sl.prototype.commaOnDayX0OfTheMonth = function () {
        return ", %s. dan v mesecu";
    };
    sl.prototype.commaOnlyInX0 = function () {
        return ", samo v %s";
    };
    sl.prototype.commaOnlyOnX0 = function () {
        return ", samo v %s";
    };
    sl.prototype.commaAndOnX0 = function () {
        return "in naprej %s";
    };
    sl.prototype.commaOnThe = function () {
        return ", ";
    };
    sl.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", zadnji %s v mesecu";
    };
    sl.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", zadnji delovni dan v mesecu";
    };
    sl.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dni pred koncem meseca";
    };
    sl.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", zadnji %s v mesecu";
    };
    sl.prototype.commaOnTheX0OfTheMonth = function () {
        return ", %s v mesecu";
    };
    sl.prototype.commaX0ThroughX1 = function () {
        return ", od %s do %s";
    };
    sl.prototype.commaAndX0ThroughX1 = function () {
        return ", in od %s do %s";
    };
    sl.prototype.everyHour = function () {
        return "vsako uro";
    };
    sl.prototype.everyMinute = function () {
        return "vsako minuto";
    };
    sl.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Vsako minuto od %s do %s";
    };
    sl.prototype.everySecond = function () {
        return "vsako sekundo";
    };
    sl.prototype.everyX0Hours = function () {
        return "vsakih %s ur";
    };
    sl.prototype.everyX0Minutes = function () {
        return "vsakih %s minut";
    };
    sl.prototype.everyX0Seconds = function () {
        return "vsakih %s sekund";
    };
    sl.prototype.fifth = function () {
        return "peti";
    };
    sl.prototype.first = function () {
        return "prvi";
    };
    sl.prototype.firstWeekday = function () {
        return "prvi delovni dan";
    };
    sl.prototype.fourth = function () {
        return "četrti";
    };
    sl.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minute od %s do %s";
    };
    sl.prototype.second = function () {
        return "drugi";
    };
    sl.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "sekunde od %s do %s";
    };
    sl.prototype.spaceAnd = function () {
        return " in";
    };
    sl.prototype.spaceX0OfTheMonth = function () {
        return " %s v mesecu";
    };
    sl.prototype.lastDay = function () {
        return "zadnjič";
    };
    sl.prototype.third = function () {
        return "tretji";
    };
    sl.prototype.weekdayNearestDayX0 = function () {
        return "delovni dan, najbližji %s. dnevu";
    };
    sl.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    sl.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    sl.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    sl.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    sl.prototype.commaStartingX0 = function () {
        return ", začenši %s";
    };
    sl.prototype.daysOfTheWeek = function () {
        return ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];
    };
    sl.prototype.monthsOfTheYear = function () {
        return [
            "januar",
            "februar",
            "marec",
            "april",
            "maj",
            "junij",
            "julij",
            "avgust",
            "september",
            "oktober",
            "november",
            "december",
        ];
    };
    return sl;
}());
exports.sl = sl;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["sl"] = new sl();

/******/ 	return __webpack_exports__;
/******/ })()
;
});