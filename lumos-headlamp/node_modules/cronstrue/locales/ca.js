(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/ca", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/ca"] = factory(require("cronstrue"));
	else
		root["locales/ca"] = factory(root["cronstrue"]);
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
exports.ca = void 0;
var ca = (function () {
    function ca() {
    }
    ca.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    ca.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    ca.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    ca.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    ca.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    ca.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "S'ha produït un error mentres es generava la descripció de l'expressió. Revisi la sintaxi de la expressió de cron.";
    };
    ca.prototype.at = function () {
        return "A les";
    };
    ca.prototype.atSpace = function () {
        return "A les ";
    };
    ca.prototype.atX0 = function () {
        return "a les %s";
    };
    ca.prototype.atX0MinutesPastTheHour = function () {
        return "als %s minuts de l'hora";
    };
    ca.prototype.atX0SecondsPastTheMinute = function () {
        return "als %s segonds del minut";
    };
    ca.prototype.betweenX0AndX1 = function () {
        return "entre les %s i les %s";
    };
    ca.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", entre els dies %s i %s del mes";
    };
    ca.prototype.commaEveryDay = function () {
        return ", cada dia";
    };
    ca.prototype.commaEveryX0Days = function () {
        return ", cada %s dies";
    };
    ca.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", cada %s dies de la setmana";
    };
    ca.prototype.commaEveryX0Months = function () {
        return ", cada %s mesos";
    };
    ca.prototype.commaOnDayX0OfTheMonth = function () {
        return ", el dia %s del mes";
    };
    ca.prototype.commaOnlyInX0 = function () {
        return ", sólo en %s";
    };
    ca.prototype.commaOnlyOnX0 = function () {
        return ", només el %s";
    };
    ca.prototype.commaAndOnX0 = function () {
        return ", i el %s";
    };
    ca.prototype.commaOnThe = function () {
        return ", en el ";
    };
    ca.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", en l'últim dia del mes";
    };
    ca.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", en l'últim dia de la setmana del mes";
    };
    ca.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dies abans de l'últim dia del mes";
    };
    ca.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", en l'últim %s del mes";
    };
    ca.prototype.commaOnTheX0OfTheMonth = function () {
        return ", en el %s del mes";
    };
    ca.prototype.commaX0ThroughX1 = function () {
        return ", de %s a %s";
    };
    ca.prototype.commaAndX0ThroughX1 = function () {
        return ", i de %s a %s";
    };
    ca.prototype.everyHour = function () {
        return "cada hora";
    };
    ca.prototype.everyMinute = function () {
        return "cada minut";
    };
    ca.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "cada minut entre les %s i les %s";
    };
    ca.prototype.everySecond = function () {
        return "cada segon";
    };
    ca.prototype.everyX0Hours = function () {
        return "cada %s hores";
    };
    ca.prototype.everyX0Minutes = function () {
        return "cada %s minuts";
    };
    ca.prototype.everyX0Seconds = function () {
        return "cada %s segons";
    };
    ca.prototype.fifth = function () {
        return "cinquè";
    };
    ca.prototype.first = function () {
        return "primer";
    };
    ca.prototype.firstWeekday = function () {
        return "primer dia de la setmana";
    };
    ca.prototype.fourth = function () {
        return "quart";
    };
    ca.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "del minut %s al %s passada l'hora";
    };
    ca.prototype.second = function () {
        return "segon";
    };
    ca.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "En els segons %s al %s de cada minut";
    };
    ca.prototype.spaceAnd = function () {
        return " i";
    };
    ca.prototype.spaceX0OfTheMonth = function () {
        return " %s del mes";
    };
    ca.prototype.lastDay = function () {
        return "l'últim dia";
    };
    ca.prototype.third = function () {
        return "tercer";
    };
    ca.prototype.weekdayNearestDayX0 = function () {
        return "dia de la setmana més proper al %s";
    };
    ca.prototype.commaEveryX0Years = function () {
        return ", cada %s anys";
    };
    ca.prototype.commaStartingX0 = function () {
        return ", començant %s";
    };
    ca.prototype.daysOfTheWeek = function () {
        return ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"];
    };
    ca.prototype.monthsOfTheYear = function () {
        return [
            "gener",
            "febrer",
            "març",
            "abril",
            "maig",
            "juny",
            "juliol",
            "agost",
            "setembre",
            "octubre",
            "novembre",
            "desembre",
        ];
    };
    return ca;
}());
exports.ca = ca;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["ca"] = new ca();

/******/ 	return __webpack_exports__;
/******/ })()
;
});