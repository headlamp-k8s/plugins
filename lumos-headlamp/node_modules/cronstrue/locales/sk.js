(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/sk", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/sk"] = factory(require("cronstrue"));
	else
		root["locales/sk"] = factory(root["cronstrue"]);
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
exports.sk = void 0;
var sk = (function () {
    function sk() {
    }
    sk.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    sk.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    sk.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    sk.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    sk.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    sk.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Pri vytváraní popisu došlo k chybe. Skontrolujte prosím správnosť syntaxe cronu.";
    };
    sk.prototype.everyMinute = function () {
        return "každú minútu";
    };
    sk.prototype.everyHour = function () {
        return "každú hodinu";
    };
    sk.prototype.atSpace = function () {
        return "V ";
    };
    sk.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Každú minútu medzi %s a %s";
    };
    sk.prototype.at = function () {
        return "V";
    };
    sk.prototype.spaceAnd = function () {
        return " a";
    };
    sk.prototype.everySecond = function () {
        return "každú sekundu";
    };
    sk.prototype.everyX0Seconds = function () {
        return "každých %s sekúnd";
    };
    sk.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "sekundy od %s do %s";
    };
    sk.prototype.atX0SecondsPastTheMinute = function () {
        return "v %s sekúnd";
    };
    sk.prototype.everyX0Minutes = function () {
        return "každých %s minút";
    };
    sk.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minúty od %s do %s";
    };
    sk.prototype.atX0MinutesPastTheHour = function () {
        return "v %s minút";
    };
    sk.prototype.everyX0Hours = function () {
        return "každých %s hodín";
    };
    sk.prototype.betweenX0AndX1 = function () {
        return "medzi %s a %s";
    };
    sk.prototype.atX0 = function () {
        return "v %s";
    };
    sk.prototype.commaEveryDay = function () {
        return ", každý deň";
    };
    sk.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", každých %s dní v týždni";
    };
    sk.prototype.commaX0ThroughX1 = function () {
        return ", od %s do %s";
    };
    sk.prototype.commaAndX0ThroughX1 = function () {
        return ", a od %s do %s";
    };
    sk.prototype.first = function () {
        return "prvý";
    };
    sk.prototype.second = function () {
        return "druhý";
    };
    sk.prototype.third = function () {
        return "tretí";
    };
    sk.prototype.fourth = function () {
        return "štvrtý";
    };
    sk.prototype.fifth = function () {
        return "piaty";
    };
    sk.prototype.commaOnThe = function () {
        return ", ";
    };
    sk.prototype.spaceX0OfTheMonth = function () {
        return " %s v mesiaci";
    };
    sk.prototype.lastDay = function () {
        return "posledný deň";
    };
    sk.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", posledný %s v mesiaci";
    };
    sk.prototype.commaOnlyOnX0 = function () {
        return ", iba v %s";
    };
    sk.prototype.commaAndOnX0 = function () {
        return ", a v %s";
    };
    sk.prototype.commaEveryX0Months = function () {
        return ", každých %s mesiacov";
    };
    sk.prototype.commaOnlyInX0 = function () {
        return ", iba v %s";
    };
    sk.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", posledný deň v mesiaci";
    };
    sk.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", posledný pracovný deň v mesiaci";
    };
    sk.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dní pred posledným dňom v mesiaci";
    };
    sk.prototype.firstWeekday = function () {
        return "prvý pracovný deň";
    };
    sk.prototype.weekdayNearestDayX0 = function () {
        return "pracovný deň najbližšie %s. dňu";
    };
    sk.prototype.commaOnTheX0OfTheMonth = function () {
        return ", v %s v mesiaci";
    };
    sk.prototype.commaEveryX0Days = function () {
        return ", každých %s dní";
    };
    sk.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", medzi dňami %s a %s v mesiaci";
    };
    sk.prototype.commaOnDayX0OfTheMonth = function () {
        return ", %s. deň v mesiaci";
    };
    sk.prototype.commaEveryX0Years = function () {
        return ", každých %s rokov";
    };
    sk.prototype.commaStartingX0 = function () {
        return ", začínajúcich %s";
    };
    sk.prototype.daysOfTheWeek = function () {
        return ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
    };
    sk.prototype.monthsOfTheYear = function () {
        return [
            "Január",
            "Február",
            "Marec",
            "Apríl",
            "Máj",
            "Jún",
            "Júl",
            "August",
            "September",
            "Október",
            "November",
            "December",
        ];
    };
    return sk;
}());
exports.sk = sk;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["sk"] = new sk();

/******/ 	return __webpack_exports__;
/******/ })()
;
});