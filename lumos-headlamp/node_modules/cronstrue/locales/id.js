(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/id", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/id"] = factory(require("cronstrue"));
	else
		root["locales/id"] = factory(root["cronstrue"]);
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
exports.id = void 0;
var id = (function () {
    function id() {
    }
    id.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    id.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    id.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    id.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    id.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    id.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Terjadi kesalahan saat membuat deskripsi ekspresi. Periksa sintaks ekspresi cron.";
    };
    id.prototype.everyMinute = function () {
        return "setiap menit";
    };
    id.prototype.everyHour = function () {
        return "setiap jam";
    };
    id.prototype.atSpace = function () {
        return "Pada ";
    };
    id.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Setiap menit diantara %s dan %s";
    };
    id.prototype.at = function () {
        return "Pada";
    };
    id.prototype.spaceAnd = function () {
        return " dan";
    };
    id.prototype.everySecond = function () {
        return "setiap detik";
    };
    id.prototype.everyX0Seconds = function () {
        return "setiap %s detik";
    };
    id.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "detik ke %s sampai %s melewati menit";
    };
    id.prototype.atX0SecondsPastTheMinute = function () {
        return "pada %s detik lewat satu menit";
    };
    id.prototype.everyX0Minutes = function () {
        return "setiap %s menit";
    };
    id.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "menit ke %s sampai %s melewati jam";
    };
    id.prototype.atX0MinutesPastTheHour = function () {
        return "pada %s menit melewati jam";
    };
    id.prototype.everyX0Hours = function () {
        return "setiap %s jam";
    };
    id.prototype.betweenX0AndX1 = function () {
        return "diantara %s dan %s";
    };
    id.prototype.atX0 = function () {
        return "pada %s";
    };
    id.prototype.commaEveryDay = function () {
        return ", setiap hari";
    };
    id.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", setiap hari %s  dalam seminggu";
    };
    id.prototype.commaX0ThroughX1 = function () {
        return ", %s sampai %s";
    };
    id.prototype.commaAndX0ThroughX1 = function () {
        return ", dan %s sampai %s";
    };
    id.prototype.first = function () {
        return "pertama";
    };
    id.prototype.second = function () {
        return "kedua";
    };
    id.prototype.third = function () {
        return "ketiga";
    };
    id.prototype.fourth = function () {
        return "keempat";
    };
    id.prototype.fifth = function () {
        return "kelima";
    };
    id.prototype.commaOnThe = function () {
        return ", di ";
    };
    id.prototype.spaceX0OfTheMonth = function () {
        return " %s pada bulan";
    };
    id.prototype.lastDay = function () {
        return "hari terakhir";
    };
    id.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", pada %s terakhir bulan ini";
    };
    id.prototype.commaOnlyOnX0 = function () {
        return ", hanya pada %s";
    };
    id.prototype.commaAndOnX0 = function () {
        return ", dan pada %s";
    };
    id.prototype.commaEveryX0Months = function () {
        return ", setiap bulan %s ";
    };
    id.prototype.commaOnlyInX0 = function () {
        return ", hanya pada %s";
    };
    id.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", pada hari terakhir bulan ini";
    };
    id.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", pada hari kerja terakhir setiap bulan";
    };
    id.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s hari sebelum hari terakhir setiap bulan";
    };
    id.prototype.firstWeekday = function () {
        return "hari kerja pertama";
    };
    id.prototype.weekdayNearestDayX0 = function () {
        return "hari kerja terdekat %s";
    };
    id.prototype.commaOnTheX0OfTheMonth = function () {
        return ", pada %s bulan ini";
    };
    id.prototype.commaEveryX0Days = function () {
        return ", setiap %s hari";
    };
    id.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", antara hari %s dan %s dalam sebulan";
    };
    id.prototype.commaOnDayX0OfTheMonth = function () {
        return ", pada hari %s dalam sebulan";
    };
    id.prototype.commaEveryHour = function () {
        return ", setiap jam";
    };
    id.prototype.commaEveryX0Years = function () {
        return ", setiap %s tahun";
    };
    id.prototype.commaStartingX0 = function () {
        return ", mulai pada %s";
    };
    id.prototype.daysOfTheWeek = function () {
        return ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    };
    id.prototype.monthsOfTheYear = function () {
        return [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];
    };
    return id;
}());
exports.id = id;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["id"] = new id();

/******/ 	return __webpack_exports__;
/******/ })()
;
});