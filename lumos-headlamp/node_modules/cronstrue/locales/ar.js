(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/ar", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/ar"] = factory(require("cronstrue"));
	else
		root["locales/ar"] = factory(root["cronstrue"]);
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
exports.ar = void 0;
var ar = (function () {
    function ar() {
    }
    ar.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    ar.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    ar.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    ar.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    ar.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    ar.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "حدث خطأ في إنشاء وصف المصطلح٠ تأكد من تركيب مصطلح الكرون";
    };
    ar.prototype.everyMinute = function () {
        return "كل دقيقة";
    };
    ar.prototype.everyHour = function () {
        return "كل ساعة";
    };
    ar.prototype.atSpace = function () {
        return " ";
    };
    ar.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "كل دقيقة بين %s و %s";
    };
    ar.prototype.at = function () {
        return "";
    };
    ar.prototype.spaceAnd = function () {
        return " و";
    };
    ar.prototype.everySecond = function () {
        return "كل ثانية";
    };
    ar.prototype.everyX0Seconds = function () {
        return "كل %s ثواني";
    };
    ar.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "الثواني %s حتى %s من بداية الدقيقة";
    };
    ar.prototype.atX0SecondsPastTheMinute = function () {
        return "الثانية %s من بداية الدقيقة";
    };
    ar.prototype.everyX0Minutes = function () {
        return "كل %s دقائق";
    };
    ar.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "الدقائق %s حتى %s من بداية الساعة";
    };
    ar.prototype.atX0MinutesPastTheHour = function () {
        return "الدقيقة %s من بداية الساعة";
    };
    ar.prototype.everyX0Hours = function () {
        return "كل %s ساعات";
    };
    ar.prototype.betweenX0AndX1 = function () {
        return "بين %s و %s";
    };
    ar.prototype.atX0 = function () {
        return "%s";
    };
    ar.prototype.commaEveryDay = function () {
        return "، كل يوم";
    };
    ar.prototype.commaEveryX0DaysOfTheWeek = function () {
        return "، كل %s من أيام الأسبوع";
    };
    ar.prototype.commaX0ThroughX1 = function () {
        return "، %s حتى %s";
    };
    ar.prototype.commaAndX0ThroughX1 = function () {
        return "، و %s حتى %s";
    };
    ar.prototype.first = function () {
        return "أول";
    };
    ar.prototype.second = function () {
        return "ثاني";
    };
    ar.prototype.third = function () {
        return "ثالث";
    };
    ar.prototype.fourth = function () {
        return "رابع";
    };
    ar.prototype.fifth = function () {
        return "خامس";
    };
    ar.prototype.commaOnThe = function () {
        return "، في ال";
    };
    ar.prototype.spaceX0OfTheMonth = function () {
        return " %s من الشهر";
    };
    ar.prototype.lastDay = function () {
        return "اليوم الأخير";
    };
    ar.prototype.commaOnTheLastX0OfTheMonth = function () {
        return "، في اخر %s من الشهر";
    };
    ar.prototype.commaOnlyOnX0 = function () {
        return "، %s فقط";
    };
    ar.prototype.commaAndOnX0 = function () {
        return "، وفي %s";
    };
    ar.prototype.commaEveryX0Months = function () {
        return "، كل %s أشهر";
    };
    ar.prototype.commaOnlyInX0 = function () {
        return "، %s فقط";
    };
    ar.prototype.commaOnTheLastDayOfTheMonth = function () {
        return "، في اخر يوم من الشهر";
    };
    ar.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return "، في اخر يوم أسبوع من الشهر";
    };
    ar.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return "، %s أيام قبل اخر يوم من الشهر";
    };
    ar.prototype.firstWeekday = function () {
        return "اول ايام الأسبوع";
    };
    ar.prototype.weekdayNearestDayX0 = function () {
        return "يوم الأسبوع الأقرب ليوم %s";
    };
    ar.prototype.commaOnTheX0OfTheMonth = function () {
        return "، في %s من الشهر";
    };
    ar.prototype.commaEveryX0Days = function () {
        return "، كل %s أيام";
    };
    ar.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return "، بين يوم %s و %s من الشهر";
    };
    ar.prototype.commaOnDayX0OfTheMonth = function () {
        return "، في اليوم %s من الشهر";
    };
    ar.prototype.commaEveryHour = function () {
        return "، كل ساعة";
    };
    ar.prototype.commaEveryX0Years = function () {
        return "، كل %s سنوات";
    };
    ar.prototype.commaStartingX0 = function () {
        return "، بداية من %s";
    };
    ar.prototype.daysOfTheWeek = function () {
        return ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    };
    ar.prototype.monthsOfTheYear = function () {
        return [
            "يناير",
            "فبراير",
            "مارس",
            "ابريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
        ];
    };
    return ar;
}());
exports.ar = ar;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["ar"] = new ar();

/******/ 	return __webpack_exports__;
/******/ })()
;
});