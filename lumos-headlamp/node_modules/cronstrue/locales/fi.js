(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/fi", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/fi"] = factory(require("cronstrue"));
	else
		root["locales/fi"] = factory(root["cronstrue"]);
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
exports.fi = void 0;
var fi = (function () {
    function fi() {
    }
    fi.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    fi.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Virhe kuvauksen generoinnissa. Tarkista cron-syntaksi.";
    };
    fi.prototype.at = function () {
        return "Klo";
    };
    fi.prototype.atSpace = function () {
        return "Klo ";
    };
    fi.prototype.atX0 = function () {
        return "klo %s";
    };
    fi.prototype.atX0MinutesPastTheHour = function () {
        return "%s minuuttia yli";
    };
    fi.prototype.atX0MinutesPastTheHourGt20 = function () {
        return "%s minuuttia yli";
    };
    fi.prototype.atX0SecondsPastTheMinute = function () {
        return "%s sekunnnin jälkeen";
    };
    fi.prototype.betweenX0AndX1 = function () {
        return "%s - %s välillä";
    };
    fi.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", kuukauden päivien %s ja %s välillä";
    };
    fi.prototype.commaEveryDay = function () {
        return ", joka päivä";
    };
    fi.prototype.commaEveryHour = function () {
        return ", joka tunti";
    };
    fi.prototype.commaEveryMinute = function () {
        return ", joka minuutti";
    };
    fi.prototype.commaEveryX0Days = function () {
        return ", joka %s. päivä";
    };
    fi.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", joka %s. viikonpäivä";
    };
    fi.prototype.commaEveryX0Months = function () {
        return ", joka %s. kuukausi";
    };
    fi.prototype.commaEveryX0Years = function () {
        return ", joka %s. vuosi";
    };
    fi.prototype.commaOnDayX0OfTheMonth = function () {
        return ", kuukauden %s päivä";
    };
    fi.prototype.commaOnlyInX0 = function () {
        return ", vain %s";
    };
    fi.prototype.commaOnlyOnX0 = function () {
        return ", vain %s";
    };
    fi.prototype.commaOnThe = function () {
        return ",";
    };
    fi.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", kuukauden viimeisenä päivänä";
    };
    fi.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", kuukauden viimeisenä viikonpäivänä";
    };
    fi.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", kuukauden viimeinen %s";
    };
    fi.prototype.commaOnTheX0OfTheMonth = function () {
        return ", kuukauden %s";
    };
    fi.prototype.commaX0ThroughX1 = function () {
        return ", %s - %s";
    };
    fi.prototype.commaAndX0ThroughX1 = function () {
        return ", %s - %s";
    };
    fi.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s päivää ennen kuukauden viimeistä päivää";
    };
    fi.prototype.commaStartingX0 = function () {
        return ", alkaen %s";
    };
    fi.prototype.everyHour = function () {
        return "joka tunti";
    };
    fi.prototype.everyMinute = function () {
        return "joka minuutti";
    };
    fi.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "joka minuutti %s - %s välillä";
    };
    fi.prototype.everySecond = function () {
        return "joka sekunti";
    };
    fi.prototype.everyX0Hours = function () {
        return "joka %s. tunti";
    };
    fi.prototype.everyX0Minutes = function () {
        return "joka %s. minuutti";
    };
    fi.prototype.everyX0Seconds = function () {
        return "joka %s. sekunti";
    };
    fi.prototype.fifth = function () {
        return "viides";
    };
    fi.prototype.first = function () {
        return "ensimmäinen";
    };
    fi.prototype.firstWeekday = function () {
        return "ensimmäinen viikonpäivä";
    };
    fi.prototype.fourth = function () {
        return "neljäs";
    };
    fi.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "joka tunti minuuttien %s - %s välillä";
    };
    fi.prototype.second = function () {
        return "toinen";
    };
    fi.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "joka minuutti sekunttien %s - %s välillä";
    };
    fi.prototype.spaceAnd = function () {
        return " ja";
    };
    fi.prototype.spaceAndSpace = function () {
        return " ja ";
    };
    fi.prototype.spaceX0OfTheMonth = function () {
        return " %s kuukaudessa";
    };
    fi.prototype.third = function () {
        return "kolmas";
    };
    fi.prototype.weekdayNearestDayX0 = function () {
        return "viikonpäivä lähintä %s päivää";
    };
    fi.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    fi.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    fi.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    fi.prototype.lastDay = function () {
        return "viimeinen päivä";
    };
    fi.prototype.commaAndOnX0 = function () {
        return ", ja edelleen %s";
    };
    fi.prototype.daysOfTheWeek = function () {
        return ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"];
    };
    fi.prototype.monthsOfTheYear = function () {
        return [
            "tammikuu",
            "helmikuu",
            "maaliskuu",
            "huhtikuu",
            "toukokuu",
            "kesäkuu",
            "heinäkuu",
            "elokuu",
            "syyskuu",
            "lokakuu",
            "marraskuu",
            "joulukuu",
        ];
    };
    return fi;
}());
exports.fi = fi;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["fi"] = new fi();

/******/ 	return __webpack_exports__;
/******/ })()
;
});