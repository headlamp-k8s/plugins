(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/vi", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/vi"] = factory(require("cronstrue"));
	else
		root["locales/vi"] = factory(root["cronstrue"]);
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
exports.vi = void 0;
var vi = (function () {
    function vi() {
    }
    vi.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    vi.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    vi.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    vi.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    vi.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    vi.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Đã xảy ra lỗi khi tạo mô tả biểu thức. Vui lòng kiểm tra cú pháp biểu thức cron.";
    };
    vi.prototype.everyMinute = function () {
        return "mỗi phút";
    };
    vi.prototype.everyHour = function () {
        return "mỗi giờ";
    };
    vi.prototype.atSpace = function () {
        return "Vào ";
    };
    vi.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Mỗi phút giữa %s and %s";
    };
    vi.prototype.at = function () {
        return "Vào";
    };
    vi.prototype.spaceAnd = function () {
        return " và";
    };
    vi.prototype.everySecond = function () {
        return "mỗi giây";
    };
    vi.prototype.everyX0Seconds = function () {
        return "mỗi %s giây";
    };
    vi.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "giây thứ %s qua phút thứ %s";
    };
    vi.prototype.atX0SecondsPastTheMinute = function () {
        return "tại giây thứ %s của mỗi phút";
    };
    vi.prototype.everyX0Minutes = function () {
        return "mỗi %s phút";
    };
    vi.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "phút thứ %s qua %s tiếng";
    };
    vi.prototype.atX0MinutesPastTheHour = function () {
        return "vào %s phút của mỗi tiếng";
    };
    vi.prototype.everyX0Hours = function () {
        return "mỗi %s tiếng";
    };
    vi.prototype.betweenX0AndX1 = function () {
        return "giữa %s và %s";
    };
    vi.prototype.atX0 = function () {
        return "vào %s";
    };
    vi.prototype.commaEveryDay = function () {
        return ", mỗi ngày";
    };
    vi.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", mỗi %s ngày trong tuần";
    };
    vi.prototype.commaX0ThroughX1 = function () {
        return ", %s đến %s";
    };
    vi.prototype.commaAndX0ThroughX1 = function () {
        return ", %s đến %s";
    };
    vi.prototype.first = function () {
        return "đầu tiên";
    };
    vi.prototype.second = function () {
        return "thứ 2";
    };
    vi.prototype.third = function () {
        return "thứ 3";
    };
    vi.prototype.fourth = function () {
        return "thứ 4";
    };
    vi.prototype.fifth = function () {
        return "thứ 5";
    };
    vi.prototype.commaOnThe = function () {
        return ", trên ";
    };
    vi.prototype.spaceX0OfTheMonth = function () {
        return " %s của tháng";
    };
    vi.prototype.lastDay = function () {
        return "ngày cuối cùng";
    };
    vi.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", vào ngày %s cuối cùng của tháng";
    };
    vi.prototype.commaOnlyOnX0 = function () {
        return ", chỉ trên %s";
    };
    vi.prototype.commaAndOnX0 = function () {
        return ", và hơn %s";
    };
    vi.prototype.commaEveryX0Months = function () {
        return ", mỗi ngày %s tháng";
    };
    vi.prototype.commaOnlyInX0 = function () {
        return ", chỉ trong %s";
    };
    vi.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", vào ngày cuối cùng của tháng";
    };
    vi.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", vào ngày cuối tuần của tháng";
    };
    vi.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s ngày trước ngày cuối cùng của tháng";
    };
    vi.prototype.firstWeekday = function () {
        return "ngày đầu tuần";
    };
    vi.prototype.weekdayNearestDayX0 = function () {
        return "ngày trong tuần ngày gần nhất %s";
    };
    vi.prototype.commaOnTheX0OfTheMonth = function () {
        return ", vào ngày %s của tháng";
    };
    vi.prototype.commaEveryX0Days = function () {
        return ", mỗi %s ngày";
    };
    vi.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", giữa ngày %s và %s trong tháng";
    };
    vi.prototype.commaOnDayX0OfTheMonth = function () {
        return ", vào %s ngày trong tháng";
    };
    vi.prototype.commaEveryHour = function () {
        return ", mỗi tiếng";
    };
    vi.prototype.commaEveryX0Years = function () {
        return ", mỗi %s năm";
    };
    vi.prototype.commaStartingX0 = function () {
        return ", bắt đầu %s";
    };
    vi.prototype.daysOfTheWeek = function () {
        return ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    };
    vi.prototype.monthsOfTheYear = function () {
        return [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
        ];
    };
    return vi;
}());
exports.vi = vi;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["vi"] = new vi();

/******/ 	return __webpack_exports__;
/******/ })()
;
});