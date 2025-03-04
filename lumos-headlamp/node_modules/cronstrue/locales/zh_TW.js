(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/zh_TW", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/zh_TW"] = factory(require("cronstrue"));
	else
		root["locales/zh_TW"] = factory(root["cronstrue"]);
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
exports.zh_TW = void 0;
var zh_TW = (function () {
    function zh_TW() {
    }
    zh_TW.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    zh_TW.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    zh_TW.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    zh_TW.prototype.commaYearX0ThroughYearX1 = function () {
        return ", 從 %s 年至 %s 年";
    };
    zh_TW.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    zh_TW.prototype.everyMinute = function () {
        return "每分鐘";
    };
    zh_TW.prototype.everyHour = function () {
        return "每小時";
    };
    zh_TW.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "產生表達式描述時發生了錯誤，請檢查 cron 表達式語法。";
    };
    zh_TW.prototype.atSpace = function () {
        return "在 ";
    };
    zh_TW.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "在 %s 和 %s 之間的每分鐘";
    };
    zh_TW.prototype.at = function () {
        return "在";
    };
    zh_TW.prototype.spaceAnd = function () {
        return " 和";
    };
    zh_TW.prototype.everySecond = function () {
        return "每秒";
    };
    zh_TW.prototype.everyX0Seconds = function () {
        return "每 %s 秒";
    };
    zh_TW.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "在一分鐘後的 %s 到 %s 秒";
    };
    zh_TW.prototype.atX0SecondsPastTheMinute = function () {
        return "在一分鐘後的 %s 秒";
    };
    zh_TW.prototype.everyX0Minutes = function () {
        return "每 %s 分鐘";
    };
    zh_TW.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "在整點後的 %s 到 %s 分鐘";
    };
    zh_TW.prototype.atX0MinutesPastTheHour = function () {
        return "在整點後的 %s 分";
    };
    zh_TW.prototype.everyX0Hours = function () {
        return "每 %s 小時";
    };
    zh_TW.prototype.betweenX0AndX1 = function () {
        return "在 %s 和 %s 之間";
    };
    zh_TW.prototype.atX0 = function () {
        return "在 %s";
    };
    zh_TW.prototype.commaEveryDay = function () {
        return ", 每天";
    };
    zh_TW.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", 每週的每 %s 天";
    };
    zh_TW.prototype.commaX0ThroughX1 = function () {
        return ", %s 到 %s";
    };
    zh_TW.prototype.commaAndX0ThroughX1 = function () {
        return ", 和 %s 到 %s";
    };
    zh_TW.prototype.first = function () {
        return "第一個";
    };
    zh_TW.prototype.second = function () {
        return "第二個";
    };
    zh_TW.prototype.third = function () {
        return "第三個";
    };
    zh_TW.prototype.fourth = function () {
        return "第四個";
    };
    zh_TW.prototype.fifth = function () {
        return "第五個";
    };
    zh_TW.prototype.commaOnThe = function () {
        return ", 在每月 ";
    };
    zh_TW.prototype.spaceX0OfTheMonth = function () {
        return "%s ";
    };
    zh_TW.prototype.lastDay = function () {
        return "最後一天";
    };
    zh_TW.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", 每月的最後一個 %s ";
    };
    zh_TW.prototype.commaOnlyOnX0 = function () {
        return ", 僅在 %s";
    };
    zh_TW.prototype.commaAndOnX0 = function () {
        return ", 或 %s";
    };
    zh_TW.prototype.commaEveryX0Months = function () {
        return ", 每 %s 月";
    };
    zh_TW.prototype.commaOnlyInX0 = function () {
        return ", 僅在 %s";
    };
    zh_TW.prototype.commaOnlyInMonthX0 = function () {
        return ", 僅在 %s";
    };
    zh_TW.prototype.commaOnlyInYearX0 = function () {
        return ", 僅在 %s 年";
    };
    zh_TW.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", 每月的最後一天";
    };
    zh_TW.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", 每月的最後一個工作日";
    };
    zh_TW.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s 這個月的最後一天的前幾天";
    };
    zh_TW.prototype.firstWeekday = function () {
        return "第一個工作日";
    };
    zh_TW.prototype.weekdayNearestDayX0 = function () {
        return "最接近 %s 號的工作日";
    };
    zh_TW.prototype.commaOnTheX0OfTheMonth = function () {
        return ", 每月的 %s ";
    };
    zh_TW.prototype.commaEveryX0Days = function () {
        return ", 每 %s 天";
    };
    zh_TW.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", 在每月的 %s 和 %s 之間";
    };
    zh_TW.prototype.commaOnDayX0OfTheMonth = function () {
        return ", 每月的 %s";
    };
    zh_TW.prototype.commaEveryX0Years = function () {
        return ", 每 %s 年";
    };
    zh_TW.prototype.commaStartingX0 = function () {
        return ", %s 開始";
    };
    zh_TW.prototype.dayX0 = function () {
        return " %s 號";
    };
    zh_TW.prototype.daysOfTheWeek = function () {
        return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    };
    zh_TW.prototype.monthsOfTheYear = function () {
        return ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    };
    return zh_TW;
}());
exports.zh_TW = zh_TW;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["zh_TW"] = new zh_TW();

/******/ 	return __webpack_exports__;
/******/ })()
;
});