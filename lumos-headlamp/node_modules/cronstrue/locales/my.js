(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/my", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/my"] = factory(require("cronstrue"));
	else
		root["locales/my"] = factory(root["cronstrue"]);
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
exports.my = void 0;
var my = (function () {
    function my() {
    }
    my.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    my.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    my.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    my.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    my.prototype.use24HourTimeFormatByDefault = function () {
        return false;
    };
    my.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Terdapat ralat semasa menjana penerangan ungkapan. Sila periksa sintaks ungkapan cron.";
    };
    my.prototype.everyMinute = function () {
        return "setiap minit";
    };
    my.prototype.everyHour = function () {
        return "setiap jam";
    };
    my.prototype.atSpace = function () {
        return "Pada ";
    };
    my.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Setiap minit antara %s dan %s";
    };
    my.prototype.at = function () {
        return "Pada";
    };
    my.prototype.spaceAnd = function () {
        return " dan";
    };
    my.prototype.everySecond = function () {
        return "setiap saat";
    };
    my.prototype.everyX0Seconds = function () {
        return "setiap %s saat";
    };
    my.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "saat ke %s hingga %s selepas minit";
    };
    my.prototype.atX0SecondsPastTheMinute = function () {
        return "pada %s saat selepas minit";
    };
    my.prototype.everyX0Minutes = function () {
        return "setiap %s minit";
    };
    my.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "minit ke %s hingga %s selepas jam";
    };
    my.prototype.atX0MinutesPastTheHour = function () {
        return "pada %s minit selepas jam";
    };
    my.prototype.everyX0Hours = function () {
        return "setiap %s jam";
    };
    my.prototype.betweenX0AndX1 = function () {
        return "antara %s dan %s";
    };
    my.prototype.atX0 = function () {
        return "pada %s";
    };
    my.prototype.commaEveryDay = function () {
        return ", setiap hari";
    };
    my.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", setiap %s hari dalam minggu";
    };
    my.prototype.commaX0ThroughX1 = function () {
        return ", %s hingga %s";
    };
    my.prototype.commaAndX0ThroughX1 = function () {
        return ", dan %s hingga %s";
    };
    my.prototype.first = function () {
        return "pertama";
    };
    my.prototype.second = function () {
        return "kedua";
    };
    my.prototype.third = function () {
        return "ketiga";
    };
    my.prototype.fourth = function () {
        return "keempat";
    };
    my.prototype.fifth = function () {
        return "kelima";
    };
    my.prototype.commaOnThe = function () {
        return ", pada ";
    };
    my.prototype.spaceX0OfTheMonth = function () {
        return " %s pada bulan";
    };
    my.prototype.lastDay = function () {
        return "hari terakhir";
    };
    my.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", pada %s terakhir bulan";
    };
    my.prototype.commaOnlyOnX0 = function () {
        return ", hanya pada %s";
    };
    my.prototype.commaAndOnX0 = function () {
        return ", dan pada %s";
    };
    my.prototype.commaEveryX0Months = function () {
        return ", setiap bulan %s";
    };
    my.prototype.commaOnlyInX0 = function () {
        return ", hanya pada %s";
    };
    my.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", pada hari terakhir bulan";
    };
    my.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", pada minggu terakhir bulan";
    };
    my.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s hari sebelum hari terakhir bulan";
    };
    my.prototype.firstWeekday = function () {
        return "hari pertama minggu bekerja";
    };
    my.prototype.weekdayNearestDayX0 = function () {
        return "hari bekerja yang terdekat dengan %s";
    };
    my.prototype.commaOnTheX0OfTheMonth = function () {
        return ", pada %s bulan";
    };
    my.prototype.commaEveryX0Days = function () {
        return ", setiap %s hari";
    };
    my.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", antara hari %s dan %s dalam bulan";
    };
    my.prototype.commaOnDayX0OfTheMonth = function () {
        return ", pada hari %s dalam bulan";
    };
    my.prototype.commaEveryHour = function () {
        return ", setiap jam";
    };
    my.prototype.commaEveryX0Years = function () {
        return ", setiap %s tahun";
    };
    my.prototype.commaStartingX0 = function () {
        return ", bermula %s";
    };
    my.prototype.daysOfTheWeek = function () {
        return ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    };
    my.prototype.monthsOfTheYear = function () {
        return [
            "Januari",
            "Februari",
            "Mac",
            "April",
            "Mei",
            "Jun",
            "Julai",
            "Ogos",
            "September",
            "Oktober",
            "November",
            "Disember",
        ];
    };
    return my;
}());
exports.my = my;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["my"] = new my();

/******/ 	return __webpack_exports__;
/******/ })()
;
});