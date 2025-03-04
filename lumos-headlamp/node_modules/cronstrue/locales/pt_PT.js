(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("cronstrue"));
	else if(typeof define === 'function' && define.amd)
		define("locales/pt_PT", ["cronstrue"], factory);
	else if(typeof exports === 'object')
		exports["locales/pt_PT"] = factory(require("cronstrue"));
	else
		root["locales/pt_PT"] = factory(root["cronstrue"]);
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
exports.pt_PT = void 0;
var pt_PT = (function () {
    function pt_PT() {
    }
    pt_PT.prototype.atX0SecondsPastTheMinuteGt20 = function () {
        return null;
    };
    pt_PT.prototype.atX0MinutesPastTheHourGt20 = function () {
        return null;
    };
    pt_PT.prototype.commaMonthX0ThroughMonthX1 = function () {
        return null;
    };
    pt_PT.prototype.commaYearX0ThroughYearX1 = function () {
        return null;
    };
    pt_PT.prototype.use24HourTimeFormatByDefault = function () {
        return true;
    };
    pt_PT.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function () {
        return "Ocorreu um erro ao gerar a descrição da expressão Cron.";
    };
    pt_PT.prototype.at = function () {
        return "às";
    };
    pt_PT.prototype.atSpace = function () {
        return "às ";
    };
    pt_PT.prototype.atX0 = function () {
        return "Às %s";
    };
    pt_PT.prototype.atX0MinutesPastTheHour = function () {
        return "aos %s minutos da hora";
    };
    pt_PT.prototype.atX0SecondsPastTheMinute = function () {
        return "aos %s segundos do minuto";
    };
    pt_PT.prototype.betweenX0AndX1 = function () {
        return "entre %s e %s";
    };
    pt_PT.prototype.commaBetweenDayX0AndX1OfTheMonth = function () {
        return ", entre os dias %s e %s do mês";
    };
    pt_PT.prototype.commaEveryDay = function () {
        return ", a cada dia";
    };
    pt_PT.prototype.commaEveryX0Days = function () {
        return ", a cada %s dias";
    };
    pt_PT.prototype.commaEveryX0DaysOfTheWeek = function () {
        return ", a cada %s dias de semana";
    };
    pt_PT.prototype.commaEveryX0Months = function () {
        return ", a cada %s meses";
    };
    pt_PT.prototype.commaOnDayX0OfTheMonth = function () {
        return ", no dia %s do mês";
    };
    pt_PT.prototype.commaOnlyInX0 = function () {
        return ", somente em %s";
    };
    pt_PT.prototype.commaOnlyOnX0 = function () {
        return ", somente de %s";
    };
    pt_PT.prototype.commaAndOnX0 = function () {
        return ", e de %s";
    };
    pt_PT.prototype.commaOnThe = function (s, day) {
        return day === '6' || day === '0' ? ", no" : ", na ";
    };
    pt_PT.prototype.commaOnTheLastDayOfTheMonth = function () {
        return ", no último dia do mês";
    };
    pt_PT.prototype.commaOnTheLastWeekdayOfTheMonth = function () {
        return ", no último dia da semana do mês";
    };
    pt_PT.prototype.commaDaysBeforeTheLastDayOfTheMonth = function () {
        return ", %s dias antes do último dia do mês";
    };
    pt_PT.prototype.commaOnTheLastX0OfTheMonth = function () {
        return ", na última %s do mês";
    };
    pt_PT.prototype.commaOnTheX0OfTheMonth = function () {
        return ", no %s do mês";
    };
    pt_PT.prototype.commaX0ThroughX1 = function () {
        return ", de %s a %s";
    };
    pt_PT.prototype.commaAndX0ThroughX1 = function () {
        return ", e de %s a %s";
    };
    pt_PT.prototype.everyHour = function () {
        return "a cada hora";
    };
    pt_PT.prototype.everyMinute = function () {
        return "a cada minuto";
    };
    pt_PT.prototype.everyMinuteBetweenX0AndX1 = function () {
        return "a cada minuto entre %s e %s";
    };
    pt_PT.prototype.everySecond = function () {
        return "a cada segundo";
    };
    pt_PT.prototype.everyX0Hours = function () {
        return "a cada %s horas";
    };
    pt_PT.prototype.everyX0Minutes = function () {
        return "a cada %s minutos";
    };
    pt_PT.prototype.everyX0Seconds = function () {
        return "a cada %s segundos";
    };
    pt_PT.prototype.fifth = function (s) {
        return s === '6' || s === '0' ? "quinto" : "quinta";
    };
    pt_PT.prototype.first = function (s) {
        return s === '6' || s === '0' ? "primeiro" : "primeira";
    };
    pt_PT.prototype.firstWeekday = function () {
        return "primeiro dia da semana";
    };
    pt_PT.prototype.fourth = function (s) {
        return s === '6' || s === '0' ? "quarto" : "quarta";
    };
    pt_PT.prototype.minutesX0ThroughX1PastTheHour = function () {
        return "do minuto %s até %s de cada hora";
    };
    pt_PT.prototype.second = function (s) {
        return s === '6' || s === '0' ? "segundo" : "segunda";
    };
    pt_PT.prototype.secondsX0ThroughX1PastTheMinute = function () {
        return "No segundo %s até %s de cada minuto";
    };
    pt_PT.prototype.spaceAnd = function () {
        return " e";
    };
    pt_PT.prototype.spaceX0OfTheMonth = function () {
        return " %s do mês";
    };
    pt_PT.prototype.lastDay = function () {
        return "o último dia";
    };
    pt_PT.prototype.third = function (s) {
        return s === '6' || s === '0' ? "terceiro" : "terceira";
    };
    pt_PT.prototype.weekdayNearestDayX0 = function () {
        return "dia da semana mais próximo do dia %s";
    };
    pt_PT.prototype.commaEveryX0Years = function () {
        return ", a cada %s anos";
    };
    pt_PT.prototype.commaStartingX0 = function () {
        return ", iniciando %s";
    };
    pt_PT.prototype.daysOfTheWeek = function () {
        return ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    };
    pt_PT.prototype.monthsOfTheYear = function () {
        return [
            "janeiro",
            "fevereiro",
            "março",
            "abril",
            "maio",
            "junho",
            "julho",
            "agosto",
            "setembro",
            "outubro",
            "novembro",
            "dezembro",
        ];
    };
    return pt_PT;
}());
exports.pt_PT = pt_PT;


(cronstrue__WEBPACK_IMPORTED_MODULE_0___default().locales)["pt_PT"] = new pt_PT();

/******/ 	return __webpack_exports__;
/******/ })()
;
});