(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/ru", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/ru"] = factory(require("cronstrue"));
	else
		root["locales/ru"] = factory(root["cronstrue"]);
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
exports.ru = void 0;
var getPhraseByNumber = function (str, words) {
    var number = Number(str);
    return number !== undefined
        ? words[number % 100 > 4 && number % 100 < 20 ? 2 : [2, 0, 1, 1, 1, 2][number % 10 < 5 ? Math.abs(number) % 10 : 5]]
        : words[2];
};
var getPhraseByDayOfWeek = function (str, words) {
    var number = Number(str);
    return number !== undefined
        ? words[number === 0 ? 0 : number === 1 || number === 2 || number === 4 ? 1 : 2]
        : words[1];
};
var ru = (function () {
    function ru() {
    }
    ru.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    ru.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    ru.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    ru.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    ru.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    ru.prototype.everyMinute = function () {
        return "каждую минуту";
    };
    ru.prototype.everyHour = function () {
        return "каждый час";
    };
    ru.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Произошла ошибка во время генерации описания выражения. Проверьте синтаксис крон-выражения.";
    };
    ru.prototype.atSpace = function () {
        return "В ";
    };
    ru.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "Каждую минуту с %s по %s";
    };
    ru.prototype.at = function () {
        return "В";
    };
    ru.prototype.spaceAnd = function () {
        return " и";
    };
    ru.prototype.everySecond = function () {
        return "каждую секунду";
    };
    ru.prototype.everyX0Seconds = function (s) {
        return getPhraseByNumber(s, ["каждую %s секунду", "каждые %s секунды", "каждые %s секунд"]);
    };
    ru.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "секунды с %s по %s";
    };
    ru.prototype.atX0SecondsPastTheMinute = function (s) {
        return getPhraseByNumber(s, ["в %s секунду", "в %s секунды", "в %s секунд"]);
    };
    ru.prototype.everyX0Minutes = function (s) {
        return getPhraseByNumber(s, ["каждую %s минуту", "каждые %s минуты", "каждые %s минут"]);
    };
    ru.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "минуты с %s по %s";
    };
    ru.prototype.atX0MinutesPastTheHour = function (s) {
        return getPhraseByNumber(s, ["в %s минуту", "в %s минуты", "в %s минут"]);
    };
    ru.prototype.everyX0Hours = function (s) {
        return getPhraseByNumber(s, ["каждый %s час", "каждые %s часа", "каждые %s часов"]);
    };
    ru.prototype.betweenX0AndX1 = function () {
        return "с %s по %s";
    };
    ru.prototype.atX0 = function () {
        return "в %s";
    };
    ru.prototype.commaEveryDay = function () {
        return ", каждый день";
    };
    ru.prototype.commaEveryX0DaysOfTheWeek = function (s) {
        return getPhraseByNumber(s, ["", ", каждые %s дня недели", ", каждые %s дней недели"]);
    };
    ru.prototype.commaX0ThroughX1 = function (s) {
        return s && (s[0] == "2" || s[0] == "3") ? ", со %s по %s" : ", с %s по %s";
    };
    ru.prototype.commaAndX0ThroughX1 = function (s) {
        return s && (s[0] == "2" || s[0] == "3") ? " и со %s по %s" : " и с %s по %s";
    };
    ru.prototype.first = function (s) {
        return getPhraseByDayOfWeek(s, ["первое", "первый", "первую"]);
    };
    ru.prototype.second = function (s) {
        return getPhraseByDayOfWeek(s, ["второе", "второй", "вторую"]);
    };
    ru.prototype.third = function (s) {
        return getPhraseByDayOfWeek(s, ["третье", "третий", "третью"]);
    };
    ru.prototype.fourth = function (s) {
        return getPhraseByDayOfWeek(s, ["четвертое", "четвертый", "четвертую"]);
    };
    ru.prototype.fifth = function (s) {
        return getPhraseByDayOfWeek(s, ["пятое", "пятый", "пятую"]);
    };
    ru.prototype.commaOnThe = function (s) {
        return s === "2" ? ", во " : ", в ";
    };
    ru.prototype.spaceX0OfTheMonth = function () {
        return " %s месяца";
    };
    ru.prototype.lastDay = function () {
        return "последний день";
    };
    ru.prototype.commaOnTheLastX0OfTheMonth = function (s) {
        return getPhraseByDayOfWeek(s, [", в последнее %s месяца", ", в последний %s месяца", ", в последнюю %s месяца"]);
    };
    ru.prototype.commaOnlyOnX0 = function (s) {
        return s && s[0] === "2" ? ", только во %s" : ", только в %s";
    };
    ru.prototype.commaAndOnX0 = function () {
        return ", и %s";
    };
    ru.prototype.commaEveryX0Months = function (s) {
        return getPhraseByNumber(s, ["", " каждые %s месяца", " каждые %s месяцев"]);
    };
    ru.prototype.commaOnlyInMonthX0 = function () {
        return ", только %s";
    };
    ru.prototype.commaOnlyInX0 = function () {
        return ", только в %s";
    };
    ru.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", в последний день месяца";
    };
    ru.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", в последний будний день месяца";
    };
    ru.prototype.commaDaysBeforeTheLastDayOfTheMonth = function (s) {
        return getPhraseByNumber(s, [
            ", за %s день до конца месяца",
            ", за %s дня до конца месяца",
            ", за %s дней до конца месяца",
        ]);
    };
    ru.prototype.firstWeekday = function () {
        return "первый будний день";
    };
    ru.prototype.weekdayNearestDayX0 = function () {
        return "ближайший будний день к %s числу";
    };
    ru.prototype.commaOnTheX0OfTheMonth = function () {
        return ", в %s месяца";
    };
    ru.prototype.commaEveryX0Days = function (s) {
        return getPhraseByNumber(s, [", каждый %s день", ", каждые %s дня", ", каждые %s дней"]);
    };
    ru.prototype.commaBetweenDayX0AndX1OfTheMonth = function (s) {
        return s && s.substring(0, s.indexOf("-")) == "2" ? ", со %s по %s число месяца" : ", с %s по %s число месяца";
    };
    ru.prototype.commaOnDayX0OfTheMonth = function (s) {
        return s && s[0] == "2" ? ", во %s число месяца" : ", в %s число месяца";
    };
    ru.prototype.commaEveryX0Years = function (s) {
        return getPhraseByNumber(s, [", каждый %s год", ", каждые %s года", ", каждые %s лет"]);
    };
    ru.prototype.commaStartingX0 = function () {
        return ", начало %s";
    };
    ru.prototype.daysOfTheWeek = function () {
        return ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
    };
    ru.prototype.daysOfTheWeekInCase = function (f) {
        if (f === void 0) { f = 2; }
        return f == 1
            ? ["воскресенья", "понедельника", "вторника", "среды", "четверга", "пятницы", "субботы"]
            : ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"];
    };
    ru.prototype.monthsOfTheYear = function () {
        return [
            "январь",
            "февраль",
            "март",
            "апрель",
            "май",
            "июнь",
            "июль",
            "август",
            "сентябрь",
            "октябрь",
            "ноябрь",
            "декабрь",
        ];
    };
    ru.prototype.monthsOfTheYearInCase = function (f) {
        return f == 1
            ? [
                "января",
                "февраля",
                "марта",
                "апреля",
                "мая",
                "июня",
                "июля",
                "августа",
                "сентября",
                "октября",
                "ноября",
                "декабря",
            ]
            : this.monthsOfTheYear();
    };
    return ru;
}());
exports.ru = ru;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["ru"] = new ru();

/******/ 	return __webpack_exports__;
/******/ })()
;
});