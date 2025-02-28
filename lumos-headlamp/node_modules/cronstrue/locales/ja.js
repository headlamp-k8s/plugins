(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/ja", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/ja"] = factory(require("cronstrue"));
	else
		root["locales/ja"] = factory(root["cronstrue"]);
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
exports.ja = void 0;
var ja = (function () {
    function ja() {
    }
    ja.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    ja.prototype.everyMinute = function () {
        return "毎分";
    };
    ja.prototype.everyHour = function () {
        return "毎時";
    };
    ja.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "式の記述を生成する際にエラーが発生しました。Cron 式の構文を確認してください。";
    };
    ja.prototype.atSpace = function () {
        return "次において実施";
    };
    ja.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "%s から %s まで毎分";
    };
    ja.prototype.at = function () {
        return "次において実施";
    };
    ja.prototype.spaceAnd = function () {
        return "と";
    };
    ja.prototype.everySecond = function () {
        return "毎秒";
    };
    ja.prototype.everyX0Seconds = function () {
        return "%s 秒ごと";
    };
    ja.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "毎分 %s 秒から %s 秒まで";
    };
    ja.prototype.atX0SecondsPastTheMinute = function () {
        return "毎分 %s 秒過ぎ";
    };
    ja.prototype.everyX0Minutes = function () {
        return "%s 分ごと";
    };
    ja.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "毎時 %s 分から %s 分まで";
    };
    ja.prototype.atX0MinutesPastTheHour = function () {
        return "毎時 %s 分過ぎ";
    };
    ja.prototype.everyX0Hours = function () {
        return "%s 時間ごと";
    };
    ja.prototype.betweenX0AndX1 = function () {
        return "%s と %s の間";
    };
    ja.prototype.atX0 = function () {
        return "次において実施 %s";
    };
    ja.prototype.commaEveryDay = function () {
        return "、毎日";
    };
    ja.prototype.commaEveryX0DaysOfTheWeek = function () {
        return "、週のうち %s 日ごと";
    };
    ja.prototype.commaX0ThroughX1 = function () {
        return "、%s から %s まで";
    };
    ja.prototype.commaAndX0ThroughX1 = function () {
        return "、%s から %s まで";
    };
    ja.prototype.first = function () {
        return "1 番目";
    };
    ja.prototype.second = function () {
        return "2 番目";
    };
    ja.prototype.third = function () {
        return "3 番目";
    };
    ja.prototype.fourth = function () {
        return "4 番目";
    };
    ja.prototype.fifth = function () {
        return "5 番目";
    };
    ja.prototype.commaOnThe = function () {
        return "次に";
    };
    ja.prototype.spaceX0OfTheMonth = function () {
        return "月のうち %s";
    };
    ja.prototype.commaOnTheLastX0OfTheMonth = function () {
        return "月の最後の %s に";
    };
    ja.prototype.commaOnlyOnX0 = function () {
        return "%s にのみ";
    };
    ja.prototype.commaEveryX0Months = function () {
        return "、%s か月ごと";
    };
    ja.prototype.commaOnlyInX0 = function () {
        return "%s でのみ";
    };
    ja.prototype.commaOnTheLastDayOfTheMonth = function () {
        return "次の最終日に";
    };
    ja.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return "月の最後の平日に";
    };
    ja.prototype.firstWeekday = function () {
        return "最初の平日";
    };
    ja.prototype.weekdayNearestDayX0 = function () {
        return "%s 日の直近の平日";
    };
    ja.prototype.commaOnTheX0OfTheMonth = function () {
        return "月の %s に";
    };
    ja.prototype.commaEveryX0Days = function () {
        return "、%s 日ごと";
    };
    ja.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return "、月の %s 日から %s 日の間";
    };
    ja.prototype.commaOnDayX0OfTheMonth = function () {
        return "、月の %s 日目";
    };
    ja.prototype.spaceAndSpace = function () {
        return "と";
    };
    ja.prototype.commaEveryMinute = function () {
        return "、毎分";
    };
    ja.prototype.commaEveryHour = function () {
        return "、毎時";
    };
    ja.prototype.commaEveryX0Years = function () {
        return "、%s 年ごと";
    };
    ja.prototype.commaStartingX0 = function () {
        return "、%s に開始";
    };
    ja.prototype.aMPeriod = function () {
        return "AM";
    };
    ja.prototype.pMPeriod = function () {
        return "PM";
    };
    ja.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return "月の最終日の %s 日前";
    };
    ja.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    ja.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    ja.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    ja.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    ja.prototype.lastDay = function () {
        return "最終日";
    };
    ja.prototype.commaAndOnX0 = function () {
        return "、〜と %s";
    };
    ja.prototype.daysOfTheWeek = function () {
        return ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
    };
    ja.prototype.monthsOfTheYear = function () {
        return ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    };
    return ja;
}());
exports.ja = ja;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["ja"] = new ja();

/******/ 	return __webpack_exports__;
/******/ })()
;
});