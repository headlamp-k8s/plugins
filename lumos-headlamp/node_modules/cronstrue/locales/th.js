(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/th", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/th"] = factory(require("cronstrue"));
	else
		root["locales/th"] = factory(root["cronstrue"]);
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
exports.th = void 0;
var th = (function () {
    function th() {
    }
    th.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    th.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    th.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    th.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    th.prototype.use24HourTimeFormatByDefault = function () {
        return false;
    };
    th.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "เกิดข้อผิดพลาดขณะสร้างคำอธิบายนิพจน์ ตรวจสอบไวยากรณ์นิพจน์ครอน";
    };
    th.prototype.everyMinute = function () {
        return "ทุกๆ นาที";
    };
    th.prototype.everyHour = function () {
        return "ทุกๆ ชั่วโมง";
    };
    th.prototype.atSpace = function () {
        return "เมื่อ ";
    };
    th.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "ทุกๆ นาที %s และ %s";
    };
    th.prototype.at = function () {
        return "เมื่อ";
    };
    th.prototype.spaceAnd = function () {
        return " และ";
    };
    th.prototype.everySecond = function () {
        return "ทุกๆ วินาที";
    };
    th.prototype.everyX0Seconds = function () {
        return "ทุกๆ %s วินาที";
    };
    th.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "วินาที %s ถึง %s นาทีที่ผ่านมา";
    };
    th.prototype.atX0SecondsPastTheMinute = function () {
        return "เมื่อ %s วินาที นาทีที่ผ่านมา";
    };
    th.prototype.everyX0Minutes = function () {
        return "ทุกๆ %s นาที";
    };
    th.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "นาที %s ถึง %s ชั่วโมงที่ผ่านมา";
    };
    th.prototype.atX0MinutesPastTheHour = function () {
        return "เมื่อ %s นาที ชั่วโมงที่ผ่านมา";
    };
    th.prototype.everyX0Hours = function () {
        return "ทุกๆ %s ชั่วโมง";
    };
    th.prototype.betweenX0AndX1 = function () {
        return "ระหว่าง %s ถึง %s";
    };
    th.prototype.atX0 = function () {
        return "เมื่อ %s";
    };
    th.prototype.commaEveryDay = function () {
        return ", ทุกๆ วัน";
    };
    th.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", ทุกๆ %s วันของสัปดาห์";
    };
    th.prototype.commaX0ThroughX1 = function () {
        return ", %s ถึง %s";
    };
    th.prototype.commaAndX0ThroughX1 = function () {
        return ", %s ถึง %s";
    };
    th.prototype.first = function () {
        return "แรก";
    };
    th.prototype.second = function () {
        return "ที่สอง";
    };
    th.prototype.third = function () {
        return "ที่สาม";
    };
    th.prototype.fourth = function () {
        return "ที่สี่";
    };
    th.prototype.fifth = function () {
        return "ที่ห้า";
    };
    th.prototype.commaOnThe = function () {
        return ", ในวัน ";
    };
    th.prototype.spaceX0OfTheMonth = function () {
        return " %s ของเดือน";
    };
    th.prototype.lastDay = function () {
        return "วันสุดท้าย";
    };
    th.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", ณ สุดท้าย %s ของเดือน";
    };
    th.prototype.commaOnlyOnX0 = function () {
        return ", เท่านั้น %s";
    };
    th.prototype.commaAndOnX0 = function () {
        return ", และใน %s";
    };
    th.prototype.commaEveryX0Months = function () {
        return ", ทุกๆ %s เดือน";
    };
    th.prototype.commaOnlyInX0 = function () {
        return ", เท่านั้น %s";
    };
    th.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", ในวันสิ้นเดือน";
    };
    th.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", ในวันธรรมดาสุดท้ายของเดือน";
    };
    th.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s วันก่อนวันสุดท้ายของเดือน";
    };
    th.prototype.firstWeekday = function () {
        return "วันธรรมดาวันแรก";
    };
    th.prototype.weekdayNearestDayX0 = function () {
        return "วันธรรมดาที่ใกล้ที่สุด %s";
    };
    th.prototype.commaOnTheX0OfTheMonth = function () {
        return ", ในวัน %s ของเดือน";
    };
    th.prototype.commaEveryX0Days = function () {
        return ", ทุกๆ %s วัน";
    };
    th.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", ระหว่างวัน %s และ %s ของเดือน";
    };
    th.prototype.commaOnDayX0OfTheMonth = function () {
        return ", ในวัน %s ของเดือน";
    };
    th.prototype.commaEveryHour = function () {
        return ", ทุกๆ ชั่วโมง";
    };
    th.prototype.commaEveryX0Years = function () {
        return ", ทุกๆ %s ปี";
    };
    th.prototype.commaStartingX0 = function () {
        return ", เริ่ม %s";
    };
    th.prototype.daysOfTheWeek = function () {
        return ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    };
    th.prototype.monthsOfTheYear = function () {
        return [
            "มกราคม",
            "กุมภาพันธ์",
            "มีนาคม",
            "เมษายน",
            "พฤษภาคม",
            "มิถุนายน",
            "กรกฎาคม",
            "สิงหาคม",
            "กันยายน",
            "ตุลาคม",
            "พฤศจิกายน",
            "ธันวาคม",
        ];
    };
    return th;
}());
exports.th = th;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["th"] = new th();

/******/ 	return __webpack_exports__;
/******/ })()
;
});