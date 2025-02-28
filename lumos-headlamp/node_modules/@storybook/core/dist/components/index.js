var S4 = Object.create;
var ti = Object.defineProperty;
var A4 = Object.getOwnPropertyDescriptor;
var F4 = Object.getOwnPropertyNames;
var k4 = Object.getPrototypeOf, L4 = Object.prototype.hasOwnProperty;
var a = (e, t) => ti(e, "name", { value: t, configurable: !0 }), na = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(e, {
  get: (t, r) => (typeof require < "u" ? require : t)[r]
}) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var A = (e, t) => () => (e && (t = e(e = 0)), t);
var _ = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), dn = (e, t) => {
  for (var r in t)
    ti(e, r, { get: t[r], enumerable: !0 });
}, T4 = (e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let o of F4(t))
      !L4.call(e, o) && o !== r && ti(e, o, { get: () => t[o], enumerable: !(n = A4(t, o)) || n.enumerable });
  return e;
};
var Ee = (e, t, r) => (r = e != null ? S4(k4(e)) : {}, T4(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? ti(r, "default", { value: e, enumerable: !0 }) : r,
  e
));

// ../node_modules/@babel/runtime/helpers/esm/extends.js
function ve() {
  return ve = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }, ve.apply(null, arguments);
}
var oa = A(() => {
  a(ve, "_extends");
});

// ../node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function lp(e) {
  if (e === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
var sp = A(() => {
  a(lp, "_assertThisInitialized");
});

// ../node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function Zt(e, t) {
  return Zt = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r, n) {
    return r.__proto__ = n, r;
  }, Zt(e, t);
}
var ri = A(() => {
  a(Zt, "_setPrototypeOf");
});

// ../node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function ni(e) {
  return ni = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, ni(e);
}
var cp = A(() => {
  a(ni, "_getPrototypeOf");
});

// ../node_modules/@storybook/global/dist/index.mjs
var fn, ii = A(() => {
  fn = (() => {
    let e;
    return typeof window < "u" ? e = window : typeof globalThis < "u" ? e = globalThis : typeof global < "u" ? e = global : typeof self < "u" ?
    e = self : e = {}, e;
  })();
});

// ../node_modules/memoizerific/memoizerific.js
var la = _((bp, bs) => {
  (function(e) {
    if (typeof bp == "object" && typeof bs < "u")
      bs.exports = e();
    else if (typeof define == "function" && define.amd)
      define([], e);
    else {
      var t;
      typeof window < "u" ? t = window : typeof global < "u" ? t = global : typeof self < "u" ? t = self : t = this, t.memoizerific = e();
    }
  })(function() {
    var e, t, r;
    return (/* @__PURE__ */ a(function n(o, i, l) {
      function u(d, h) {
        if (!i[d]) {
          if (!o[d]) {
            var f = typeof na == "function" && na;
            if (!h && f) return f(d, !0);
            if (c) return c(d, !0);
            var v = new Error("Cannot find module '" + d + "'");
            throw v.code = "MODULE_NOT_FOUND", v;
          }
          var b = i[d] = { exports: {} };
          o[d][0].call(b.exports, function(m) {
            var g = o[d][1][m];
            return u(g || m);
          }, b, b.exports, n, o, i, l);
        }
        return i[d].exports;
      }
      a(u, "s");
      for (var c = typeof na == "function" && na, p = 0; p < l.length; p++) u(l[p]);
      return u;
    }, "e"))({ 1: [function(n, o, i) {
      o.exports = function(l) {
        if (typeof Map != "function" || l) {
          var u = n("./similar");
          return new u();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(n, o, i) {
      function l() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      a(l, "Similar"), l.prototype.get = function(u) {
        var c;
        if (this.lastItem && this.isEqual(this.lastItem.key, u))
          return this.lastItem.val;
        if (c = this.indexOf(u), c >= 0)
          return this.lastItem = this.list[c], this.list[c].val;
      }, l.prototype.set = function(u, c) {
        var p;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? (this.lastItem.val = c, this) : (p = this.indexOf(u), p >= 0 ? (this.lastItem =
        this.list[p], this.list[p].val = c, this) : (this.lastItem = { key: u, val: c }, this.list.push(this.lastItem), this.size++, this));
      }, l.prototype.delete = function(u) {
        var c;
        if (this.lastItem && this.isEqual(this.lastItem.key, u) && (this.lastItem = void 0), c = this.indexOf(u), c >= 0)
          return this.size--, this.list.splice(c, 1)[0];
      }, l.prototype.has = function(u) {
        var c;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? !0 : (c = this.indexOf(u), c >= 0 ? (this.lastItem = this.list[c], !0) :
        !1);
      }, l.prototype.forEach = function(u, c) {
        var p;
        for (p = 0; p < this.size; p++)
          u.call(c || this, this.list[p].val, this.list[p].key, this);
      }, l.prototype.indexOf = function(u) {
        var c;
        for (c = 0; c < this.size; c++)
          if (this.isEqual(this.list[c].key, u))
            return c;
        return -1;
      }, l.prototype.isEqual = function(u, c) {
        return u === c || u !== u && c !== c;
      }, o.exports = l;
    }, {}], 3: [function(n, o, i) {
      var l = n("map-or-similar");
      o.exports = function(d) {
        var h = new l(!1), f = [];
        return function(v) {
          var b = /* @__PURE__ */ a(function() {
            var m = h, g, y, w = arguments.length - 1, D = Array(w + 1), x = !0, C;
            if ((b.numArgs || b.numArgs === 0) && b.numArgs !== w + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (C = 0; C < w; C++) {
              if (D[C] = {
                cacheItem: m,
                arg: arguments[C]
              }, m.has(arguments[C])) {
                m = m.get(arguments[C]);
                continue;
              }
              x = !1, g = new l(!1), m.set(arguments[C], g), m = g;
            }
            return x && (m.has(arguments[w]) ? y = m.get(arguments[w]) : x = !1), x || (y = v.apply(null, arguments), m.set(arguments[w], y)),
            d > 0 && (D[w] = {
              cacheItem: m,
              arg: arguments[w]
            }, x ? u(f, D) : f.push(D), f.length > d && c(f.shift())), b.wasMemoized = x, b.numArgs = w + 1, y;
          }, "memoizerific");
          return b.limit = d, b.wasMemoized = !1, b.cache = h, b.lru = f, b;
        };
      };
      function u(d, h) {
        var f = d.length, v = h.length, b, m, g;
        for (m = 0; m < f; m++) {
          for (b = !0, g = 0; g < v; g++)
            if (!p(d[m][g].arg, h[g].arg)) {
              b = !1;
              break;
            }
          if (b)
            break;
        }
        d.push(d.splice(m, 1)[0]);
      }
      a(u, "moveToMostRecentLru");
      function c(d) {
        var h = d.length, f = d[h - 1], v, b;
        for (f.cacheItem.delete(f.arg), b = h - 2; b >= 0 && (f = d[b], v = f.cacheItem.get(f.arg), !v || !v.size); b--)
          f.cacheItem.delete(f.arg);
      }
      a(c, "removeCachedResult");
      function p(d, h) {
        return d === h || d !== d && h !== h;
      }
      a(p, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function hn(e, t) {
  if (e == null) return {};
  var r = {};
  for (var n in e) if ({}.hasOwnProperty.call(e, n)) {
    if (t.indexOf(n) >= 0) continue;
    r[n] = e[n];
  }
  return r;
}
var li = A(() => {
  a(hn, "_objectWithoutPropertiesLoose");
});

// ../node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js
function yp(e, t) {
  if (e == null) return {};
  var r, n, o = hn(e, t);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (n = 0; n < i.length; n++) r = i[n], t.indexOf(r) >= 0 || {}.propertyIsEnumerable.call(e, r) && (o[r] = e[r]);
  }
  return o;
}
var Dp = A(() => {
  li();
  a(yp, "_objectWithoutProperties");
});

// ../node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
function sa(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = Array(t); r < t; r++) n[r] = e[r];
  return n;
}
var ys = A(() => {
  a(sa, "_arrayLikeToArray");
});

// ../node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js
function xp(e) {
  if (Array.isArray(e)) return sa(e);
}
var Cp = A(() => {
  ys();
  a(xp, "_arrayWithoutHoles");
});

// ../node_modules/@babel/runtime/helpers/esm/iterableToArray.js
function Ep(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
var Rp = A(() => {
  a(Ep, "_iterableToArray");
});

// ../node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js
function Sp(e, t) {
  if (e) {
    if (typeof e == "string") return sa(e, t);
    var r = {}.toString.call(e).slice(8, -1);
    return r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set" ? Array.from(e) : r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.
    test(r) ? sa(e, t) : void 0;
  }
}
var Ap = A(() => {
  ys();
  a(Sp, "_unsupportedIterableToArray");
});

// ../node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js
function Fp() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
var kp = A(() => {
  a(Fp, "_nonIterableSpread");
});

// ../node_modules/@babel/runtime/helpers/esm/toConsumableArray.js
function Lp(e) {
  return xp(e) || Ep(e) || Sp(e) || Fp();
}
var Tp = A(() => {
  Cp();
  Rp();
  Ap();
  kp();
  a(Lp, "_toConsumableArray");
});

// ../node_modules/@babel/runtime/helpers/esm/typeof.js
function Cr(e) {
  "@babel/helpers - typeof";
  return Cr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Cr(e);
}
var Ds = A(() => {
  a(Cr, "_typeof");
});

// ../node_modules/@babel/runtime/helpers/esm/toPrimitive.js
function Bp(e, t) {
  if (Cr(e) != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t || "default");
    if (Cr(n) != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
var Ip = A(() => {
  Ds();
  a(Bp, "toPrimitive");
});

// ../node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
function Mp(e) {
  var t = Bp(e, "string");
  return Cr(t) == "symbol" ? t : t + "";
}
var _p = A(() => {
  Ds();
  Ip();
  a(Mp, "toPropertyKey");
});

// ../node_modules/@babel/runtime/helpers/esm/defineProperty.js
function si(e, t, r) {
  return (t = Mp(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
var xs = A(() => {
  _p();
  a(si, "_defineProperty");
});

// ../node_modules/react-syntax-highlighter/dist/esm/create-element.js
import s6 from "react";
function Pp(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function mn(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Pp(Object(r), !0).forEach(function(n) {
      si(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Pp(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function u6(e) {
  var t = e.length;
  if (t === 0 || t === 1) return e;
  if (t === 2)
    return [e[0], e[1], "".concat(e[0], ".").concat(e[1]), "".concat(e[1], ".").concat(e[0])];
  if (t === 3)
    return [e[0], e[1], e[2], "".concat(e[0], ".").concat(e[1]), "".concat(e[0], ".").concat(e[2]), "".concat(e[1], ".").concat(e[0]), "".concat(
    e[1], ".").concat(e[2]), "".concat(e[2], ".").concat(e[0]), "".concat(e[2], ".").concat(e[1]), "".concat(e[0], ".").concat(e[1], ".").concat(
    e[2]), "".concat(e[0], ".").concat(e[2], ".").concat(e[1]), "".concat(e[1], ".").concat(e[0], ".").concat(e[2]), "".concat(e[1], ".").concat(
    e[2], ".").concat(e[0]), "".concat(e[2], ".").concat(e[0], ".").concat(e[1]), "".concat(e[2], ".").concat(e[1], ".").concat(e[0])];
  if (t >= 4)
    return [e[0], e[1], e[2], e[3], "".concat(e[0], ".").concat(e[1]), "".concat(e[0], ".").concat(e[2]), "".concat(e[0], ".").concat(e[3]),
    "".concat(e[1], ".").concat(e[0]), "".concat(e[1], ".").concat(e[2]), "".concat(e[1], ".").concat(e[3]), "".concat(e[2], ".").concat(e[0]),
    "".concat(e[2], ".").concat(e[1]), "".concat(e[2], ".").concat(e[3]), "".concat(e[3], ".").concat(e[0]), "".concat(e[3], ".").concat(e[1]),
    "".concat(e[3], ".").concat(e[2]), "".concat(e[0], ".").concat(e[1], ".").concat(e[2]), "".concat(e[0], ".").concat(e[1], ".").concat(e[3]),
    "".concat(e[0], ".").concat(e[2], ".").concat(e[1]), "".concat(e[0], ".").concat(e[2], ".").concat(e[3]), "".concat(e[0], ".").concat(e[3],
    ".").concat(e[1]), "".concat(e[0], ".").concat(e[3], ".").concat(e[2]), "".concat(e[1], ".").concat(e[0], ".").concat(e[2]), "".concat(e[1],
    ".").concat(e[0], ".").concat(e[3]), "".concat(e[1], ".").concat(e[2], ".").concat(e[0]), "".concat(e[1], ".").concat(e[2], ".").concat(
    e[3]), "".concat(e[1], ".").concat(e[3], ".").concat(e[0]), "".concat(e[1], ".").concat(e[3], ".").concat(e[2]), "".concat(e[2], ".").concat(
    e[0], ".").concat(e[1]), "".concat(e[2], ".").concat(e[0], ".").concat(e[3]), "".concat(e[2], ".").concat(e[1], ".").concat(e[0]), "".concat(
    e[2], ".").concat(e[1], ".").concat(e[3]), "".concat(e[2], ".").concat(e[3], ".").concat(e[0]), "".concat(e[2], ".").concat(e[3], ".").concat(
    e[1]), "".concat(e[3], ".").concat(e[0], ".").concat(e[1]), "".concat(e[3], ".").concat(e[0], ".").concat(e[2]), "".concat(e[3], ".").concat(
    e[1], ".").concat(e[0]), "".concat(e[3], ".").concat(e[1], ".").concat(e[2]), "".concat(e[3], ".").concat(e[2], ".").concat(e[0]), "".concat(
    e[3], ".").concat(e[2], ".").concat(e[1]), "".concat(e[0], ".").concat(e[1], ".").concat(e[2], ".").concat(e[3]), "".concat(e[0], ".").concat(
    e[1], ".").concat(e[3], ".").concat(e[2]), "".concat(e[0], ".").concat(e[2], ".").concat(e[1], ".").concat(e[3]), "".concat(e[0], ".").concat(
    e[2], ".").concat(e[3], ".").concat(e[1]), "".concat(e[0], ".").concat(e[3], ".").concat(e[1], ".").concat(e[2]), "".concat(e[0], ".").concat(
    e[3], ".").concat(e[2], ".").concat(e[1]), "".concat(e[1], ".").concat(e[0], ".").concat(e[2], ".").concat(e[3]), "".concat(e[1], ".").concat(
    e[0], ".").concat(e[3], ".").concat(e[2]), "".concat(e[1], ".").concat(e[2], ".").concat(e[0], ".").concat(e[3]), "".concat(e[1], ".").concat(
    e[2], ".").concat(e[3], ".").concat(e[0]), "".concat(e[1], ".").concat(e[3], ".").concat(e[0], ".").concat(e[2]), "".concat(e[1], ".").concat(
    e[3], ".").concat(e[2], ".").concat(e[0]), "".concat(e[2], ".").concat(e[0], ".").concat(e[1], ".").concat(e[3]), "".concat(e[2], ".").concat(
    e[0], ".").concat(e[3], ".").concat(e[1]), "".concat(e[2], ".").concat(e[1], ".").concat(e[0], ".").concat(e[3]), "".concat(e[2], ".").concat(
    e[1], ".").concat(e[3], ".").concat(e[0]), "".concat(e[2], ".").concat(e[3], ".").concat(e[0], ".").concat(e[1]), "".concat(e[2], ".").concat(
    e[3], ".").concat(e[1], ".").concat(e[0]), "".concat(e[3], ".").concat(e[0], ".").concat(e[1], ".").concat(e[2]), "".concat(e[3], ".").concat(
    e[0], ".").concat(e[2], ".").concat(e[1]), "".concat(e[3], ".").concat(e[1], ".").concat(e[0], ".").concat(e[2]), "".concat(e[3], ".").concat(
    e[1], ".").concat(e[2], ".").concat(e[0]), "".concat(e[3], ".").concat(e[2], ".").concat(e[0], ".").concat(e[1]), "".concat(e[3], ".").concat(
    e[2], ".").concat(e[1], ".").concat(e[0])];
}
function c6(e) {
  if (e.length === 0 || e.length === 1) return e;
  var t = e.join(".");
  return Cs[t] || (Cs[t] = u6(e)), Cs[t];
}
function p6(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r = arguments.length > 2 ? arguments[2] : void 0, n = e.filter(
  function(i) {
    return i !== "token";
  }), o = c6(n);
  return o.reduce(function(i, l) {
    return mn(mn({}, i), r[l]);
  }, t);
}
function Hp(e) {
  return e.join(" ");
}
function d6(e, t) {
  var r = 0;
  return function(n) {
    return r += 1, n.map(function(o, i) {
      return Er({
        node: o,
        stylesheet: e,
        useInlineStyles: t,
        key: "code-segment-".concat(r, "-").concat(i)
      });
    });
  };
}
function Er(e) {
  var t = e.node, r = e.stylesheet, n = e.style, o = n === void 0 ? {} : n, i = e.useInlineStyles, l = e.key, u = t.properties, c = t.type, p = t.
  tagName, d = t.value;
  if (c === "text")
    return d;
  if (p) {
    var h = d6(r, i), f;
    if (!i)
      f = mn(mn({}, u), {}, {
        className: Hp(u.className)
      });
    else {
      var v = Object.keys(r).reduce(function(y, w) {
        return w.split(".").forEach(function(D) {
          y.includes(D) || y.push(D);
        }), y;
      }, []), b = u.className && u.className.includes("token") ? ["token"] : [], m = u.className && b.concat(u.className.filter(function(y) {
        return !v.includes(y);
      }));
      f = mn(mn({}, u), {}, {
        className: Hp(m) || void 0,
        style: p6(u.className, Object.assign({}, u.style, o), r)
      });
    }
    var g = h(t.children);
    return /* @__PURE__ */ s6.createElement(p, ve({
      key: l
    }, f), g);
  }
}
var Cs, Es = A(() => {
  oa();
  xs();
  a(Pp, "ownKeys");
  a(mn, "_objectSpread");
  a(u6, "powerSetPermutations");
  Cs = {};
  a(c6, "getClassNameCombinations");
  a(p6, "createStyleObject");
  a(Hp, "createClassNameString");
  a(d6, "createChildren");
  a(Er, "createElement");
});

// ../node_modules/react-syntax-highlighter/dist/esm/checkForListedLanguage.js
var zp, Op = A(() => {
  zp = /* @__PURE__ */ a(function(e, t) {
    var r = e.listLanguages();
    return r.indexOf(t) !== -1;
  }, "default");
});

// ../node_modules/react-syntax-highlighter/dist/esm/highlight.js
import Rr from "react";
function Np(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function xt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Np(Object(r), !0).forEach(function(n) {
      si(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Np(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function m6(e) {
  return e.match(h6);
}
function g6(e) {
  var t = e.lines, r = e.startingLineNumber, n = e.style;
  return t.map(function(o, i) {
    var l = i + r;
    return /* @__PURE__ */ Rr.createElement("span", {
      key: "line-".concat(i),
      className: "react-syntax-highlighter-line-number",
      style: typeof n == "function" ? n(l) : n
    }, "".concat(l, `
`));
  });
}
function v6(e) {
  var t = e.codeString, r = e.codeStyle, n = e.containerStyle, o = n === void 0 ? {
    float: "left",
    paddingRight: "10px"
  } : n, i = e.numberStyle, l = i === void 0 ? {} : i, u = e.startingLineNumber;
  return /* @__PURE__ */ Rr.createElement("code", {
    style: Object.assign({}, r, o)
  }, g6({
    lines: t.replace(/\n$/, "").split(`
`),
    style: l,
    startingLineNumber: u
  }));
}
function w6(e) {
  return "".concat(e.toString().length, ".25em");
}
function $p(e, t) {
  return {
    type: "element",
    tagName: "span",
    properties: {
      key: "line-number--".concat(e),
      className: ["comment", "linenumber", "react-syntax-highlighter-line-number"],
      style: t
    },
    children: [{
      type: "text",
      value: e
    }]
  };
}
function jp(e, t, r) {
  var n = {
    display: "inline-block",
    minWidth: w6(r),
    paddingRight: "1em",
    textAlign: "right",
    userSelect: "none"
  }, o = typeof e == "function" ? e(t) : e, i = xt(xt({}, n), o);
  return i;
}
function ui(e) {
  var t = e.children, r = e.lineNumber, n = e.lineNumberStyle, o = e.largestLineNumber, i = e.showInlineLineNumbers, l = e.lineProps, u = l ===
  void 0 ? {} : l, c = e.className, p = c === void 0 ? [] : c, d = e.showLineNumbers, h = e.wrapLongLines, f = typeof u == "function" ? u(r) :
  u;
  if (f.className = p, r && i) {
    var v = jp(n, r, o);
    t.unshift($p(r, v));
  }
  return h & d && (f.style = xt(xt({}, f.style), {}, {
    display: "flex"
  })), {
    type: "element",
    tagName: "span",
    properties: f,
    children: t
  };
}
function Vp(e) {
  for (var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [], r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] :
  [], n = 0; n < e.length; n++) {
    var o = e[n];
    if (o.type === "text")
      r.push(ui({
        children: [o],
        className: Lp(new Set(t))
      }));
    else if (o.children) {
      var i = t.concat(o.properties.className);
      Vp(o.children, i).forEach(function(l) {
        return r.push(l);
      });
    }
  }
  return r;
}
function b6(e, t, r, n, o, i, l, u, c) {
  var p, d = Vp(e.value), h = [], f = -1, v = 0;
  function b(C, E) {
    var R = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
    return ui({
      children: C,
      lineNumber: E,
      lineNumberStyle: u,
      largestLineNumber: l,
      showInlineLineNumbers: o,
      lineProps: r,
      className: R,
      showLineNumbers: n,
      wrapLongLines: c
    });
  }
  a(b, "createWrappedLine");
  function m(C, E) {
    if (n && E && o) {
      var R = jp(u, E, l);
      C.unshift($p(E, R));
    }
    return C;
  }
  a(m, "createUnwrappedLine");
  function g(C, E) {
    var R = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
    return t || R.length > 0 ? b(C, E, R) : m(C, E);
  }
  a(g, "createLine");
  for (var y = /* @__PURE__ */ a(function() {
    var E = d[v], R = E.children[0].value, F = m6(R);
    if (F) {
      var S = R.split(`
`);
      S.forEach(function(k, I) {
        var H = n && h.length + i, M = {
          type: "text",
          value: "".concat(k, `
`)
        };
        if (I === 0) {
          var W = d.slice(f + 1, v).concat(ui({
            children: [M],
            className: E.properties.className
          })), L = g(W, H);
          h.push(L);
        } else if (I === S.length - 1) {
          var T = d[v + 1] && d[v + 1].children && d[v + 1].children[0], P = {
            type: "text",
            value: "".concat(k)
          };
          if (T) {
            var q = ui({
              children: [P],
              className: E.properties.className
            });
            d.splice(v + 1, 0, q);
          } else {
            var N = [P], U = g(N, H, E.properties.className);
            h.push(U);
          }
        } else {
          var z = [M], K = g(z, H, E.properties.className);
          h.push(K);
        }
      }), f = v;
    }
    v++;
  }, "_loop"); v < d.length; )
    y();
  if (f !== d.length - 1) {
    var w = d.slice(f + 1, d.length);
    if (w && w.length) {
      var D = n && h.length + i, x = g(w, D);
      h.push(x);
    }
  }
  return t ? h : (p = []).concat.apply(p, h);
}
function y6(e) {
  var t = e.rows, r = e.stylesheet, n = e.useInlineStyles;
  return t.map(function(o, i) {
    return Er({
      node: o,
      stylesheet: r,
      useInlineStyles: n,
      key: "code-segement".concat(i)
    });
  });
}
function Wp(e) {
  return e && typeof e.highlightAuto < "u";
}
function D6(e) {
  var t = e.astGenerator, r = e.language, n = e.code, o = e.defaultCodeValue;
  if (Wp(t)) {
    var i = zp(t, r);
    return r === "text" ? {
      value: o,
      language: "text"
    } : i ? t.highlight(r, n) : t.highlightAuto(n);
  }
  try {
    return r && r !== "text" ? {
      value: t.highlight(n, r)
    } : {
      value: o
    };
  } catch {
    return {
      value: o
    };
  }
}
function Rs(e, t) {
  return /* @__PURE__ */ a(function(n) {
    var o = n.language, i = n.children, l = n.style, u = l === void 0 ? t : l, c = n.customStyle, p = c === void 0 ? {} : c, d = n.codeTagProps,
    h = d === void 0 ? {
      className: o ? "language-".concat(o) : void 0,
      style: xt(xt({}, u['code[class*="language-"]']), u['code[class*="language-'.concat(o, '"]')])
    } : d, f = n.useInlineStyles, v = f === void 0 ? !0 : f, b = n.showLineNumbers, m = b === void 0 ? !1 : b, g = n.showInlineLineNumbers, y = g ===
    void 0 ? !0 : g, w = n.startingLineNumber, D = w === void 0 ? 1 : w, x = n.lineNumberContainerStyle, C = n.lineNumberStyle, E = C === void 0 ?
    {} : C, R = n.wrapLines, F = n.wrapLongLines, S = F === void 0 ? !1 : F, k = n.lineProps, I = k === void 0 ? {} : k, H = n.renderer, M = n.
    PreTag, W = M === void 0 ? "pre" : M, L = n.CodeTag, T = L === void 0 ? "code" : L, P = n.code, q = P === void 0 ? (Array.isArray(i) ? i[0] :
    i) || "" : P, N = n.astGenerator, U = yp(n, f6);
    N = N || e;
    var z = m ? /* @__PURE__ */ Rr.createElement(v6, {
      containerStyle: x,
      codeStyle: h.style || {},
      numberStyle: E,
      startingLineNumber: D,
      codeString: q
    }) : null, K = u.hljs || u['pre[class*="language-"]'] || {
      backgroundColor: "#fff"
    }, Pe = Wp(N) ? "hljs" : "prismjs", Ce = v ? Object.assign({}, U, {
      style: Object.assign({}, K, p)
    }) : Object.assign({}, U, {
      className: U.className ? "".concat(Pe, " ").concat(U.className) : Pe,
      style: Object.assign({}, p)
    });
    if (S ? h.style = xt(xt({}, h.style), {}, {
      whiteSpace: "pre-wrap"
    }) : h.style = xt(xt({}, h.style), {}, {
      whiteSpace: "pre"
    }), !N)
      return /* @__PURE__ */ Rr.createElement(W, Ce, z, /* @__PURE__ */ Rr.createElement(T, h, q));
    (R === void 0 && H || S) && (R = !0), H = H || y6;
    var ge = [{
      type: "text",
      value: q
    }], Fe = D6({
      astGenerator: N,
      language: o,
      code: q,
      defaultCodeValue: ge
    });
    Fe.language === null && (Fe.value = ge);
    var He = Fe.value.length + D, ze = b6(Fe, R, I, m, y, D, He, E, S);
    return /* @__PURE__ */ Rr.createElement(W, Ce, /* @__PURE__ */ Rr.createElement(T, h, !y && z, H({
      rows: ze,
      stylesheet: u,
      useInlineStyles: v
    })));
  }, "SyntaxHighlighter");
}
var f6, h6, qp = A(() => {
  Dp();
  Tp();
  xs();
  Es();
  Op();
  f6 = ["language", "children", "style", "customStyle", "codeTagProps", "useInlineStyles", "showLineNumbers", "showInlineLineNumbers", "star\
tingLineNumber", "lineNumberContainerStyle", "lineNumberStyle", "wrapLines", "wrapLongLines", "lineProps", "renderer", "PreTag", "CodeTag", "\
code", "astGenerator"];
  a(Np, "ownKeys");
  a(xt, "_objectSpread");
  h6 = /\n/g;
  a(m6, "getNewLines");
  a(g6, "getAllLineNumbers");
  a(v6, "AllLineNumbers");
  a(w6, "getEmWidthOfNumber");
  a($p, "getInlineLineNumber");
  a(jp, "assembleLineNumberStyles");
  a(ui, "createLineElement");
  a(Vp, "flattenCodeTree");
  a(b6, "processLines");
  a(y6, "defaultRenderer");
  a(Wp, "isHighlightJs");
  a(D6, "getCodeTree");
  a(Rs, "default");
});

// ../node_modules/xtend/immutable.js
var Gp = _((BP, Up) => {
  Up.exports = C6;
  var x6 = Object.prototype.hasOwnProperty;
  function C6() {
    for (var e = {}, t = 0; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r)
        x6.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }
  a(C6, "extend");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/schema.js
var As = _((MP, Xp) => {
  "use strict";
  Xp.exports = Yp;
  var Ss = Yp.prototype;
  Ss.space = null;
  Ss.normal = {};
  Ss.property = {};
  function Yp(e, t, r) {
    this.property = e, this.normal = t, r && (this.space = r);
  }
  a(Yp, "Schema");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/merge.js
var Jp = _((PP, Zp) => {
  "use strict";
  var Kp = Gp(), E6 = As();
  Zp.exports = R6;
  function R6(e) {
    for (var t = e.length, r = [], n = [], o = -1, i, l; ++o < t; )
      i = e[o], r.push(i.property), n.push(i.normal), l = i.space;
    return new E6(
      Kp.apply(null, r),
      Kp.apply(null, n),
      l
    );
  }
  a(R6, "merge");
});

// ../node_modules/hastscript/node_modules/property-information/normalize.js
var ci = _((zP, Qp) => {
  "use strict";
  Qp.exports = S6;
  function S6(e) {
    return e.toLowerCase();
  }
  a(S6, "normalize");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/info.js
var Fs = _((NP, td) => {
  "use strict";
  td.exports = ed;
  var Je = ed.prototype;
  Je.space = null;
  Je.attribute = null;
  Je.property = null;
  Je.boolean = !1;
  Je.booleanish = !1;
  Je.overloadedBoolean = !1;
  Je.number = !1;
  Je.commaSeparated = !1;
  Je.spaceSeparated = !1;
  Je.commaOrSpaceSeparated = !1;
  Je.mustUseProperty = !1;
  Je.defined = !1;
  function ed(e, t) {
    this.property = e, this.attribute = t;
  }
  a(ed, "Info");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/types.js
var pi = _((Qt) => {
  "use strict";
  var A6 = 0;
  Qt.boolean = Sr();
  Qt.booleanish = Sr();
  Qt.overloadedBoolean = Sr();
  Qt.number = Sr();
  Qt.spaceSeparated = Sr();
  Qt.commaSeparated = Sr();
  Qt.commaOrSpaceSeparated = Sr();
  function Sr() {
    return Math.pow(2, ++A6);
  }
  a(Sr, "increment");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/defined-info.js
var Ls = _((WP, id) => {
  "use strict";
  var od = Fs(), rd = pi();
  id.exports = ks;
  ks.prototype = new od();
  ks.prototype.defined = !0;
  var ad = [
    "boolean",
    "booleanish",
    "overloadedBoolean",
    "number",
    "commaSeparated",
    "spaceSeparated",
    "commaOrSpaceSeparated"
  ], F6 = ad.length;
  function ks(e, t, r, n) {
    var o = -1, i;
    for (nd(this, "space", n), od.call(this, e, t); ++o < F6; )
      i = ad[o], nd(this, i, (r & rd[i]) === rd[i]);
  }
  a(ks, "DefinedInfo");
  function nd(e, t, r) {
    r && (e[t] = r);
  }
  a(nd, "mark");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/create.js
var gn = _((UP, sd) => {
  "use strict";
  var ld = ci(), k6 = As(), L6 = Ls();
  sd.exports = T6;
  function T6(e) {
    var t = e.space, r = e.mustUseProperty || [], n = e.attributes || {}, o = e.properties, i = e.transform, l = {}, u = {}, c, p;
    for (c in o)
      p = new L6(
        c,
        i(n, c),
        o[c],
        t
      ), r.indexOf(c) !== -1 && (p.mustUseProperty = !0), l[c] = p, u[ld(c)] = c, u[ld(p.attribute)] = c;
    return new k6(l, u, t);
  }
  a(T6, "create");
});

// ../node_modules/hastscript/node_modules/property-information/lib/xlink.js
var cd = _((YP, ud) => {
  "use strict";
  var B6 = gn();
  ud.exports = B6({
    space: "xlink",
    transform: I6,
    properties: {
      xLinkActuate: null,
      xLinkArcRole: null,
      xLinkHref: null,
      xLinkRole: null,
      xLinkShow: null,
      xLinkTitle: null,
      xLinkType: null
    }
  });
  function I6(e, t) {
    return "xlink:" + t.slice(5).toLowerCase();
  }
  a(I6, "xlinkTransform");
});

// ../node_modules/hastscript/node_modules/property-information/lib/xml.js
var dd = _((KP, pd) => {
  "use strict";
  var M6 = gn();
  pd.exports = M6({
    space: "xml",
    transform: _6,
    properties: {
      xmlLang: null,
      xmlBase: null,
      xmlSpace: null
    }
  });
  function _6(e, t) {
    return "xml:" + t.slice(3).toLowerCase();
  }
  a(_6, "xmlTransform");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/case-sensitive-transform.js
var hd = _((JP, fd) => {
  "use strict";
  fd.exports = P6;
  function P6(e, t) {
    return t in e ? e[t] : t;
  }
  a(P6, "caseSensitiveTransform");
});

// ../node_modules/hastscript/node_modules/property-information/lib/util/case-insensitive-transform.js
var Ts = _((eH, md) => {
  "use strict";
  var H6 = hd();
  md.exports = z6;
  function z6(e, t) {
    return H6(e, t.toLowerCase());
  }
  a(z6, "caseInsensitiveTransform");
});

// ../node_modules/hastscript/node_modules/property-information/lib/xmlns.js
var vd = _((rH, gd) => {
  "use strict";
  var O6 = gn(), N6 = Ts();
  gd.exports = O6({
    space: "xmlns",
    attributes: {
      xmlnsxlink: "xmlns:xlink"
    },
    transform: N6,
    properties: {
      xmlns: null,
      xmlnsXLink: null
    }
  });
});

// ../node_modules/hastscript/node_modules/property-information/lib/aria.js
var bd = _((nH, wd) => {
  "use strict";
  var Bs = pi(), $6 = gn(), Ne = Bs.booleanish, Qe = Bs.number, Ar = Bs.spaceSeparated;
  wd.exports = $6({
    transform: j6,
    properties: {
      ariaActiveDescendant: null,
      ariaAtomic: Ne,
      ariaAutoComplete: null,
      ariaBusy: Ne,
      ariaChecked: Ne,
      ariaColCount: Qe,
      ariaColIndex: Qe,
      ariaColSpan: Qe,
      ariaControls: Ar,
      ariaCurrent: null,
      ariaDescribedBy: Ar,
      ariaDetails: null,
      ariaDisabled: Ne,
      ariaDropEffect: Ar,
      ariaErrorMessage: null,
      ariaExpanded: Ne,
      ariaFlowTo: Ar,
      ariaGrabbed: Ne,
      ariaHasPopup: null,
      ariaHidden: Ne,
      ariaInvalid: null,
      ariaKeyShortcuts: null,
      ariaLabel: null,
      ariaLabelledBy: Ar,
      ariaLevel: Qe,
      ariaLive: null,
      ariaModal: Ne,
      ariaMultiLine: Ne,
      ariaMultiSelectable: Ne,
      ariaOrientation: null,
      ariaOwns: Ar,
      ariaPlaceholder: null,
      ariaPosInSet: Qe,
      ariaPressed: Ne,
      ariaReadOnly: Ne,
      ariaRelevant: null,
      ariaRequired: Ne,
      ariaRoleDescription: Ar,
      ariaRowCount: Qe,
      ariaRowIndex: Qe,
      ariaRowSpan: Qe,
      ariaSelected: Ne,
      ariaSetSize: Qe,
      ariaSort: null,
      ariaValueMax: Qe,
      ariaValueMin: Qe,
      ariaValueNow: Qe,
      ariaValueText: null,
      role: null
    }
  });
  function j6(e, t) {
    return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
  }
  a(j6, "ariaTransform");
});

// ../node_modules/hastscript/node_modules/property-information/lib/html.js
var Dd = _((aH, yd) => {
  "use strict";
  var vn = pi(), V6 = gn(), W6 = Ts(), j = vn.boolean, q6 = vn.overloadedBoolean, ua = vn.booleanish, Z = vn.number, Be = vn.spaceSeparated,
  di = vn.commaSeparated;
  yd.exports = V6({
    space: "html",
    attributes: {
      acceptcharset: "accept-charset",
      classname: "class",
      htmlfor: "for",
      httpequiv: "http-equiv"
    },
    transform: W6,
    mustUseProperty: ["checked", "multiple", "muted", "selected"],
    properties: {
      // Standard Properties.
      abbr: null,
      accept: di,
      acceptCharset: Be,
      accessKey: Be,
      action: null,
      allow: null,
      allowFullScreen: j,
      allowPaymentRequest: j,
      allowUserMedia: j,
      alt: null,
      as: null,
      async: j,
      autoCapitalize: null,
      autoComplete: Be,
      autoFocus: j,
      autoPlay: j,
      capture: j,
      charSet: null,
      checked: j,
      cite: null,
      className: Be,
      cols: Z,
      colSpan: null,
      content: null,
      contentEditable: ua,
      controls: j,
      controlsList: Be,
      coords: Z | di,
      crossOrigin: null,
      data: null,
      dateTime: null,
      decoding: null,
      default: j,
      defer: j,
      dir: null,
      dirName: null,
      disabled: j,
      download: q6,
      draggable: ua,
      encType: null,
      enterKeyHint: null,
      form: null,
      formAction: null,
      formEncType: null,
      formMethod: null,
      formNoValidate: j,
      formTarget: null,
      headers: Be,
      height: Z,
      hidden: j,
      high: Z,
      href: null,
      hrefLang: null,
      htmlFor: Be,
      httpEquiv: Be,
      id: null,
      imageSizes: null,
      imageSrcSet: di,
      inputMode: null,
      integrity: null,
      is: null,
      isMap: j,
      itemId: null,
      itemProp: Be,
      itemRef: Be,
      itemScope: j,
      itemType: Be,
      kind: null,
      label: null,
      lang: null,
      language: null,
      list: null,
      loading: null,
      loop: j,
      low: Z,
      manifest: null,
      max: null,
      maxLength: Z,
      media: null,
      method: null,
      min: null,
      minLength: Z,
      multiple: j,
      muted: j,
      name: null,
      nonce: null,
      noModule: j,
      noValidate: j,
      onAbort: null,
      onAfterPrint: null,
      onAuxClick: null,
      onBeforePrint: null,
      onBeforeUnload: null,
      onBlur: null,
      onCancel: null,
      onCanPlay: null,
      onCanPlayThrough: null,
      onChange: null,
      onClick: null,
      onClose: null,
      onContextMenu: null,
      onCopy: null,
      onCueChange: null,
      onCut: null,
      onDblClick: null,
      onDrag: null,
      onDragEnd: null,
      onDragEnter: null,
      onDragExit: null,
      onDragLeave: null,
      onDragOver: null,
      onDragStart: null,
      onDrop: null,
      onDurationChange: null,
      onEmptied: null,
      onEnded: null,
      onError: null,
      onFocus: null,
      onFormData: null,
      onHashChange: null,
      onInput: null,
      onInvalid: null,
      onKeyDown: null,
      onKeyPress: null,
      onKeyUp: null,
      onLanguageChange: null,
      onLoad: null,
      onLoadedData: null,
      onLoadedMetadata: null,
      onLoadEnd: null,
      onLoadStart: null,
      onMessage: null,
      onMessageError: null,
      onMouseDown: null,
      onMouseEnter: null,
      onMouseLeave: null,
      onMouseMove: null,
      onMouseOut: null,
      onMouseOver: null,
      onMouseUp: null,
      onOffline: null,
      onOnline: null,
      onPageHide: null,
      onPageShow: null,
      onPaste: null,
      onPause: null,
      onPlay: null,
      onPlaying: null,
      onPopState: null,
      onProgress: null,
      onRateChange: null,
      onRejectionHandled: null,
      onReset: null,
      onResize: null,
      onScroll: null,
      onSecurityPolicyViolation: null,
      onSeeked: null,
      onSeeking: null,
      onSelect: null,
      onSlotChange: null,
      onStalled: null,
      onStorage: null,
      onSubmit: null,
      onSuspend: null,
      onTimeUpdate: null,
      onToggle: null,
      onUnhandledRejection: null,
      onUnload: null,
      onVolumeChange: null,
      onWaiting: null,
      onWheel: null,
      open: j,
      optimum: Z,
      pattern: null,
      ping: Be,
      placeholder: null,
      playsInline: j,
      poster: null,
      preload: null,
      readOnly: j,
      referrerPolicy: null,
      rel: Be,
      required: j,
      reversed: j,
      rows: Z,
      rowSpan: Z,
      sandbox: Be,
      scope: null,
      scoped: j,
      seamless: j,
      selected: j,
      shape: null,
      size: Z,
      sizes: null,
      slot: null,
      span: Z,
      spellCheck: ua,
      src: null,
      srcDoc: null,
      srcLang: null,
      srcSet: di,
      start: Z,
      step: null,
      style: null,
      tabIndex: Z,
      target: null,
      title: null,
      translate: null,
      type: null,
      typeMustMatch: j,
      useMap: null,
      value: ua,
      width: Z,
      wrap: null,
      // Legacy.
      // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
      align: null,
      // Several. Use CSS `text-align` instead,
      aLink: null,
      // `<body>`. Use CSS `a:active {color}` instead
      archive: Be,
      // `<object>`. List of URIs to archives
      axis: null,
      // `<td>` and `<th>`. Use `scope` on `<th>`
      background: null,
      // `<body>`. Use CSS `background-image` instead
      bgColor: null,
      // `<body>` and table elements. Use CSS `background-color` instead
      border: Z,
      // `<table>`. Use CSS `border-width` instead,
      borderColor: null,
      // `<table>`. Use CSS `border-color` instead,
      bottomMargin: Z,
      // `<body>`
      cellPadding: null,
      // `<table>`
      cellSpacing: null,
      // `<table>`
      char: null,
      // Several table elements. When `align=char`, sets the character to align on
      charOff: null,
      // Several table elements. When `char`, offsets the alignment
      classId: null,
      // `<object>`
      clear: null,
      // `<br>`. Use CSS `clear` instead
      code: null,
      // `<object>`
      codeBase: null,
      // `<object>`
      codeType: null,
      // `<object>`
      color: null,
      // `<font>` and `<hr>`. Use CSS instead
      compact: j,
      // Lists. Use CSS to reduce space between items instead
      declare: j,
      // `<object>`
      event: null,
      // `<script>`
      face: null,
      // `<font>`. Use CSS instead
      frame: null,
      // `<table>`
      frameBorder: null,
      // `<iframe>`. Use CSS `border` instead
      hSpace: Z,
      // `<img>` and `<object>`
      leftMargin: Z,
      // `<body>`
      link: null,
      // `<body>`. Use CSS `a:link {color: *}` instead
      longDesc: null,
      // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
      lowSrc: null,
      // `<img>`. Use a `<picture>`
      marginHeight: Z,
      // `<body>`
      marginWidth: Z,
      // `<body>`
      noResize: j,
      // `<frame>`
      noHref: j,
      // `<area>`. Use no href instead of an explicit `nohref`
      noShade: j,
      // `<hr>`. Use background-color and height instead of borders
      noWrap: j,
      // `<td>` and `<th>`
      object: null,
      // `<applet>`
      profile: null,
      // `<head>`
      prompt: null,
      // `<isindex>`
      rev: null,
      // `<link>`
      rightMargin: Z,
      // `<body>`
      rules: null,
      // `<table>`
      scheme: null,
      // `<meta>`
      scrolling: ua,
      // `<frame>`. Use overflow in the child context
      standby: null,
      // `<object>`
      summary: null,
      // `<table>`
      text: null,
      // `<body>`. Use CSS `color` instead
      topMargin: Z,
      // `<body>`
      valueType: null,
      // `<param>`
      version: null,
      // `<html>`. Use a doctype.
      vAlign: null,
      // Several. Use CSS `vertical-align` instead
      vLink: null,
      // `<body>`. Use CSS `a:visited {color}` instead
      vSpace: Z,
      // `<img>` and `<object>`
      // Non-standard Properties.
      allowTransparency: null,
      autoCorrect: null,
      autoSave: null,
      disablePictureInPicture: j,
      disableRemotePlayback: j,
      prefix: null,
      property: null,
      results: Z,
      security: null,
      unselectable: null
    }
  });
});

// ../node_modules/hastscript/node_modules/property-information/html.js
var Cd = _((iH, xd) => {
  "use strict";
  var U6 = Jp(), G6 = cd(), Y6 = dd(), X6 = vd(), K6 = bd(), Z6 = Dd();
  xd.exports = U6([Y6, G6, X6, K6, Z6]);
});

// ../node_modules/hastscript/node_modules/property-information/find.js
var Sd = _((lH, Rd) => {
  "use strict";
  var J6 = ci(), Q6 = Ls(), e7 = Fs(), Is = "data";
  Rd.exports = n7;
  var t7 = /^data[-\w.:]+$/i, Ed = /-[a-z]/g, r7 = /[A-Z]/g;
  function n7(e, t) {
    var r = J6(t), n = t, o = e7;
    return r in e.normal ? e.property[e.normal[r]] : (r.length > 4 && r.slice(0, 4) === Is && t7.test(t) && (t.charAt(4) === "-" ? n = o7(t) :
    t = a7(t), o = Q6), new o(n, t));
  }
  a(n7, "find");
  function o7(e) {
    var t = e.slice(5).replace(Ed, l7);
    return Is + t.charAt(0).toUpperCase() + t.slice(1);
  }
  a(o7, "datasetToProperty");
  function a7(e) {
    var t = e.slice(4);
    return Ed.test(t) ? e : (t = t.replace(r7, i7), t.charAt(0) !== "-" && (t = "-" + t), Is + t);
  }
  a(a7, "datasetToAttribute");
  function i7(e) {
    return "-" + e.toLowerCase();
  }
  a(i7, "kebab");
  function l7(e) {
    return e.charAt(1).toUpperCase();
  }
  a(l7, "camelcase");
});

// ../node_modules/hast-util-parse-selector/index.js
var kd = _((uH, Fd) => {
  "use strict";
  Fd.exports = s7;
  var Ad = /[#.]/g;
  function s7(e, t) {
    for (var r = e || "", n = t || "div", o = {}, i = 0, l, u, c; i < r.length; )
      Ad.lastIndex = i, c = Ad.exec(r), l = r.slice(i, c ? c.index : r.length), l && (u ? u === "#" ? o.id = l : o.className ? o.className.push(
      l) : o.className = [l] : n = l, i += l.length), c && (u = c[0], i++);
    return { type: "element", tagName: n, properties: o, children: [] };
  }
  a(s7, "parse");
});

// ../node_modules/hastscript/node_modules/space-separated-tokens/index.js
var Td = _((Ms) => {
  "use strict";
  Ms.parse = p7;
  Ms.stringify = d7;
  var Ld = "", u7 = " ", c7 = /[ \t\n\r\f]+/g;
  function p7(e) {
    var t = String(e || Ld).trim();
    return t === Ld ? [] : t.split(c7);
  }
  a(p7, "parse");
  function d7(e) {
    return e.join(u7).trim();
  }
  a(d7, "stringify");
});

// ../node_modules/hastscript/node_modules/comma-separated-tokens/index.js
var Id = _((Ps) => {
  "use strict";
  Ps.parse = f7;
  Ps.stringify = h7;
  var _s = ",", Bd = " ", ca = "";
  function f7(e) {
    for (var t = [], r = String(e || ca), n = r.indexOf(_s), o = 0, i = !1, l; !i; )
      n === -1 && (n = r.length, i = !0), l = r.slice(o, n).trim(), (l || !i) && t.push(l), o = n + 1, n = r.indexOf(_s, o);
    return t;
  }
  a(f7, "parse");
  function h7(e, t) {
    var r = t || {}, n = r.padLeft === !1 ? ca : Bd, o = r.padRight ? Bd : ca;
    return e[e.length - 1] === ca && (e = e.concat(ca)), e.join(o + _s + n).trim();
  }
  a(h7, "stringify");
});

// ../node_modules/hastscript/factory.js
var Nd = _((mH, Od) => {
  "use strict";
  var m7 = Sd(), Md = ci(), g7 = kd(), _d = Td().parse, Pd = Id().parse;
  Od.exports = w7;
  var v7 = {}.hasOwnProperty;
  function w7(e, t, r) {
    var n = r ? C7(r) : null;
    return o;
    function o(l, u) {
      var c = g7(l, t), p = Array.prototype.slice.call(arguments, 2), d = c.tagName.toLowerCase(), h;
      if (c.tagName = n && v7.call(n, d) ? n[d] : d, u && b7(u, c) && (p.unshift(u), u = null), u)
        for (h in u)
          i(c.properties, h, u[h]);
      return zd(c.children, p), c.tagName === "template" && (c.content = { type: "root", children: c.children }, c.children = []), c;
    }
    function i(l, u, c) {
      var p, d, h;
      c == null || c !== c || (p = m7(e, u), d = p.property, h = c, typeof h == "string" && (p.spaceSeparated ? h = _d(h) : p.commaSeparated ?
      h = Pd(h) : p.commaOrSpaceSeparated && (h = _d(Pd(h).join(" ")))), d === "style" && typeof c != "string" && (h = x7(h)), d === "classN\
ame" && l.className && (h = l.className.concat(h)), l[d] = D7(p, d, h));
    }
  }
  a(w7, "factory");
  function b7(e, t) {
    return typeof e == "string" || "length" in e || y7(t.tagName, e);
  }
  a(b7, "isChildren");
  function y7(e, t) {
    var r = t.type;
    return e === "input" || !r || typeof r != "string" ? !1 : typeof t.children == "object" && "length" in t.children ? !0 : (r = r.toLowerCase(),
    e === "button" ? r !== "menu" && r !== "submit" && r !== "reset" && r !== "button" : "value" in t);
  }
  a(y7, "isNode");
  function zd(e, t) {
    var r, n;
    if (typeof t == "string" || typeof t == "number") {
      e.push({ type: "text", value: String(t) });
      return;
    }
    if (typeof t == "object" && "length" in t) {
      for (r = -1, n = t.length; ++r < n; )
        zd(e, t[r]);
      return;
    }
    if (typeof t != "object" || !("type" in t))
      throw new Error("Expected node, nodes, or string, got `" + t + "`");
    e.push(t);
  }
  a(zd, "addChild");
  function D7(e, t, r) {
    var n, o, i;
    if (typeof r != "object" || !("length" in r))
      return Hd(e, t, r);
    for (o = r.length, n = -1, i = []; ++n < o; )
      i[n] = Hd(e, t, r[n]);
    return i;
  }
  a(D7, "parsePrimitives");
  function Hd(e, t, r) {
    var n = r;
    return e.number || e.positiveNumber ? !isNaN(n) && n !== "" && (n = Number(n)) : (e.boolean || e.overloadedBoolean) && typeof n == "stri\
ng" && (n === "" || Md(r) === Md(t)) && (n = !0), n;
  }
  a(Hd, "parsePrimitive");
  function x7(e) {
    var t = [], r;
    for (r in e)
      t.push([r, e[r]].join(": "));
    return t.join("; ");
  }
  a(x7, "style");
  function C7(e) {
    for (var t = e.length, r = -1, n = {}, o; ++r < t; )
      o = e[r], n[o.toLowerCase()] = o;
    return n;
  }
  a(C7, "createAdjustMap");
});

// ../node_modules/hastscript/html.js
var Vd = _((vH, jd) => {
  "use strict";
  var E7 = Cd(), R7 = Nd(), $d = R7(E7, "div");
  $d.displayName = "html";
  jd.exports = $d;
});

// ../node_modules/hastscript/index.js
var qd = _((wH, Wd) => {
  "use strict";
  Wd.exports = Vd();
});

// ../node_modules/refractor/node_modules/character-entities-legacy/index.json
var Ud = _((bH, S7) => {
  S7.exports = {
    AElig: "\xC6",
    AMP: "&",
    Aacute: "\xC1",
    Acirc: "\xC2",
    Agrave: "\xC0",
    Aring: "\xC5",
    Atilde: "\xC3",
    Auml: "\xC4",
    COPY: "\xA9",
    Ccedil: "\xC7",
    ETH: "\xD0",
    Eacute: "\xC9",
    Ecirc: "\xCA",
    Egrave: "\xC8",
    Euml: "\xCB",
    GT: ">",
    Iacute: "\xCD",
    Icirc: "\xCE",
    Igrave: "\xCC",
    Iuml: "\xCF",
    LT: "<",
    Ntilde: "\xD1",
    Oacute: "\xD3",
    Ocirc: "\xD4",
    Ograve: "\xD2",
    Oslash: "\xD8",
    Otilde: "\xD5",
    Ouml: "\xD6",
    QUOT: '"',
    REG: "\xAE",
    THORN: "\xDE",
    Uacute: "\xDA",
    Ucirc: "\xDB",
    Ugrave: "\xD9",
    Uuml: "\xDC",
    Yacute: "\xDD",
    aacute: "\xE1",
    acirc: "\xE2",
    acute: "\xB4",
    aelig: "\xE6",
    agrave: "\xE0",
    amp: "&",
    aring: "\xE5",
    atilde: "\xE3",
    auml: "\xE4",
    brvbar: "\xA6",
    ccedil: "\xE7",
    cedil: "\xB8",
    cent: "\xA2",
    copy: "\xA9",
    curren: "\xA4",
    deg: "\xB0",
    divide: "\xF7",
    eacute: "\xE9",
    ecirc: "\xEA",
    egrave: "\xE8",
    eth: "\xF0",
    euml: "\xEB",
    frac12: "\xBD",
    frac14: "\xBC",
    frac34: "\xBE",
    gt: ">",
    iacute: "\xED",
    icirc: "\xEE",
    iexcl: "\xA1",
    igrave: "\xEC",
    iquest: "\xBF",
    iuml: "\xEF",
    laquo: "\xAB",
    lt: "<",
    macr: "\xAF",
    micro: "\xB5",
    middot: "\xB7",
    nbsp: "\xA0",
    not: "\xAC",
    ntilde: "\xF1",
    oacute: "\xF3",
    ocirc: "\xF4",
    ograve: "\xF2",
    ordf: "\xAA",
    ordm: "\xBA",
    oslash: "\xF8",
    otilde: "\xF5",
    ouml: "\xF6",
    para: "\xB6",
    plusmn: "\xB1",
    pound: "\xA3",
    quot: '"',
    raquo: "\xBB",
    reg: "\xAE",
    sect: "\xA7",
    shy: "\xAD",
    sup1: "\xB9",
    sup2: "\xB2",
    sup3: "\xB3",
    szlig: "\xDF",
    thorn: "\xFE",
    times: "\xD7",
    uacute: "\xFA",
    ucirc: "\xFB",
    ugrave: "\xF9",
    uml: "\xA8",
    uuml: "\xFC",
    yacute: "\xFD",
    yen: "\xA5",
    yuml: "\xFF"
  };
});

// ../node_modules/refractor/node_modules/character-reference-invalid/index.json
var Gd = _((yH, A7) => {
  A7.exports = {
    "0": "\uFFFD",
    "128": "\u20AC",
    "130": "\u201A",
    "131": "\u0192",
    "132": "\u201E",
    "133": "\u2026",
    "134": "\u2020",
    "135": "\u2021",
    "136": "\u02C6",
    "137": "\u2030",
    "138": "\u0160",
    "139": "\u2039",
    "140": "\u0152",
    "142": "\u017D",
    "145": "\u2018",
    "146": "\u2019",
    "147": "\u201C",
    "148": "\u201D",
    "149": "\u2022",
    "150": "\u2013",
    "151": "\u2014",
    "152": "\u02DC",
    "153": "\u2122",
    "154": "\u0161",
    "155": "\u203A",
    "156": "\u0153",
    "158": "\u017E",
    "159": "\u0178"
  };
});

// ../node_modules/refractor/node_modules/is-decimal/index.js
var Hs = _((DH, Yd) => {
  "use strict";
  Yd.exports = F7;
  function F7(e) {
    var t = typeof e == "string" ? e.charCodeAt(0) : e;
    return t >= 48 && t <= 57;
  }
  a(F7, "decimal");
});

// ../node_modules/refractor/node_modules/is-hexadecimal/index.js
var Kd = _((CH, Xd) => {
  "use strict";
  Xd.exports = k7;
  function k7(e) {
    var t = typeof e == "string" ? e.charCodeAt(0) : e;
    return t >= 97 && t <= 102 || t >= 65 && t <= 70 || t >= 48 && t <= 57;
  }
  a(k7, "hexadecimal");
});

// ../node_modules/refractor/node_modules/is-alphabetical/index.js
var Jd = _((RH, Zd) => {
  "use strict";
  Zd.exports = L7;
  function L7(e) {
    var t = typeof e == "string" ? e.charCodeAt(0) : e;
    return t >= 97 && t <= 122 || t >= 65 && t <= 90;
  }
  a(L7, "alphabetical");
});

// ../node_modules/refractor/node_modules/is-alphanumerical/index.js
var ef = _((AH, Qd) => {
  "use strict";
  var T7 = Jd(), B7 = Hs();
  Qd.exports = I7;
  function I7(e) {
    return T7(e) || B7(e);
  }
  a(I7, "alphanumerical");
});

// ../node_modules/refractor/node_modules/parse-entities/decode-entity.browser.js
var rf = _((kH, tf) => {
  "use strict";
  var fi, M7 = 59;
  tf.exports = _7;
  function _7(e) {
    var t = "&" + e + ";", r;
    return fi = fi || document.createElement("i"), fi.innerHTML = t, r = fi.textContent, r.charCodeAt(r.length - 1) === M7 && e !== "semi" ||
    r === t ? !1 : r;
  }
  a(_7, "decodeEntity");
});

// ../node_modules/refractor/node_modules/parse-entities/index.js
var vf = _((TH, gf) => {
  "use strict";
  var nf = Ud(), of = Gd(), P7 = Hs(), H7 = Kd(), uf = ef(), z7 = rf();
  gf.exports = Z7;
  var O7 = {}.hasOwnProperty, wn = String.fromCharCode, N7 = Function.prototype, af = {
    warning: null,
    reference: null,
    text: null,
    warningContext: null,
    referenceContext: null,
    textContext: null,
    position: {},
    additional: null,
    attribute: !1,
    nonTerminated: !0
  }, $7 = 9, lf = 10, j7 = 12, V7 = 32, sf = 38, W7 = 59, q7 = 60, U7 = 61, G7 = 35, Y7 = 88, X7 = 120, K7 = 65533, bn = "named", Os = "hexa\
decimal", Ns = "decimal", $s = {};
  $s[Os] = 16;
  $s[Ns] = 10;
  var hi = {};
  hi[bn] = uf;
  hi[Ns] = P7;
  hi[Os] = H7;
  var cf = 1, pf = 2, df = 3, ff = 4, hf = 5, zs = 6, mf = 7, er = {};
  er[cf] = "Named character references must be terminated by a semicolon";
  er[pf] = "Numeric character references must be terminated by a semicolon";
  er[df] = "Named character references cannot be empty";
  er[ff] = "Numeric character references cannot be empty";
  er[hf] = "Named character references must be known";
  er[zs] = "Numeric character references cannot be disallowed";
  er[mf] = "Numeric character references cannot be outside the permissible Unicode range";
  function Z7(e, t) {
    var r = {}, n, o;
    t || (t = {});
    for (o in af)
      n = t[o], r[o] = n ?? af[o];
    return (r.position.indent || r.position.start) && (r.indent = r.position.indent || [], r.position = r.position.start), J7(e, r);
  }
  a(Z7, "parseEntities");
  function J7(e, t) {
    var r = t.additional, n = t.nonTerminated, o = t.text, i = t.reference, l = t.warning, u = t.textContext, c = t.referenceContext, p = t.
    warningContext, d = t.position, h = t.indent || [], f = e.length, v = 0, b = -1, m = d.column || 1, g = d.line || 1, y = "", w = [], D, x,
    C, E, R, F, S, k, I, H, M, W, L, T, P, q, N, U, z;
    for (typeof r == "string" && (r = r.charCodeAt(0)), q = K(), k = l ? Pe : N7, v--, f++; ++v < f; )
      if (R === lf && (m = h[b] || 1), R = e.charCodeAt(v), R === sf) {
        if (S = e.charCodeAt(v + 1), S === $7 || S === lf || S === j7 || S === V7 || S === sf || S === q7 || S !== S || r && S === r) {
          y += wn(R), m++;
          continue;
        }
        for (L = v + 1, W = L, z = L, S === G7 ? (z = ++W, S = e.charCodeAt(z), S === Y7 || S === X7 ? (T = Os, z = ++W) : T = Ns) : T = bn,
        D = "", M = "", E = "", P = hi[T], z--; ++z < f && (S = e.charCodeAt(z), !!P(S)); )
          E += wn(S), T === bn && O7.call(nf, E) && (D = E, M = nf[E]);
        C = e.charCodeAt(z) === W7, C && (z++, x = T === bn ? z7(E) : !1, x && (D = E, M = x)), U = 1 + z - L, !C && !n || (E ? T === bn ? (C &&
        !M ? k(hf, 1) : (D !== E && (z = W + D.length, U = 1 + z - W, C = !1), C || (I = D ? cf : df, t.attribute ? (S = e.charCodeAt(z), S ===
        U7 ? (k(I, U), M = null) : uf(S) ? M = null : k(I, U)) : k(I, U))), F = M) : (C || k(pf, U), F = parseInt(E, $s[T]), Q7(F) ? (k(mf, U),
        F = wn(K7)) : F in of ? (k(zs, U), F = of[F]) : (H = "", ew(F) && k(zs, U), F > 65535 && (F -= 65536, H += wn(F >>> 10 | 55296), F =
        56320 | F & 1023), F = H + wn(F))) : T !== bn && k(ff, U)), F ? (Ce(), q = K(), v = z - 1, m += z - L + 1, w.push(F), N = K(), N.offset++,
        i && i.call(
          c,
          F,
          { start: q, end: N },
          e.slice(L - 1, z)
        ), q = N) : (E = e.slice(L - 1, z), y += E, m += E.length, v = z - 1);
      } else
        R === 10 && (g++, b++, m = 0), R === R ? (y += wn(R), m++) : Ce();
    return w.join("");
    function K() {
      return {
        line: g,
        column: m,
        offset: v + (d.offset || 0)
      };
    }
    function Pe(ge, Fe) {
      var He = K();
      He.column += Fe, He.offset += Fe, l.call(p, er[ge], He, ge);
    }
    function Ce() {
      y && (w.push(y), o && o.call(u, y, { start: q, end: K() }), y = "");
    }
  }
  a(J7, "parse");
  function Q7(e) {
    return e >= 55296 && e <= 57343 || e > 1114111;
  }
  a(Q7, "prohibited");
  function ew(e) {
    return e >= 1 && e <= 8 || e === 11 || e >= 13 && e <= 31 || e >= 127 && e <= 159 || e >= 64976 && e <= 65007 || (e & 65535) === 65535 ||
    (e & 65535) === 65534;
  }
  a(ew, "disallowed");
});

// ../node_modules/refractor/node_modules/prismjs/components/prism-core.js
var bf = _((IH, mi) => {
  var tw = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  var wf = function(e) {
    var t = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, r = 0, n = {}, o = {
      /**
       * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
       * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
       * additional languages or plugins yourself.
       *
       * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
       *
       * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.manual = true;
       * // add a new <script> to load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      manual: e.Prism && e.Prism.manual,
      /**
       * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
       * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
       * own worker, you don't want it to do this.
       *
       * By setting this value to `true`, Prism will not add its own listeners to the worker.
       *
       * You obviously have to change this value before Prism executes. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.disableWorkerMessageHandler = true;
       * // Load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      disableWorkerMessageHandler: e.Prism && e.Prism.disableWorkerMessageHandler,
      /**
       * A namespace for utility methods.
       *
       * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
       * change or disappear at any time.
       *
       * @namespace
       * @memberof Prism
       */
      util: {
        encode: /* @__PURE__ */ a(function m(g) {
          return g instanceof i ? new i(g.type, m(g.content), g.alias) : Array.isArray(g) ? g.map(m) : g.replace(/&/g, "&amp;").replace(/</g,
          "&lt;").replace(/\u00a0/g, " ");
        }, "encode"),
        /**
         * Returns the name of the type of the given value.
         *
         * @param {any} o
         * @returns {string}
         * @example
         * type(null)      === 'Null'
         * type(undefined) === 'Undefined'
         * type(123)       === 'Number'
         * type('foo')     === 'String'
         * type(true)      === 'Boolean'
         * type([1, 2])    === 'Array'
         * type({})        === 'Object'
         * type(String)    === 'Function'
         * type(/abc+/)    === 'RegExp'
         */
        type: /* @__PURE__ */ a(function(m) {
          return Object.prototype.toString.call(m).slice(8, -1);
        }, "type"),
        /**
         * Returns a unique number for the given object. Later calls will still return the same number.
         *
         * @param {Object} obj
         * @returns {number}
         */
        objId: /* @__PURE__ */ a(function(m) {
          return m.__id || Object.defineProperty(m, "__id", { value: ++r }), m.__id;
        }, "objId"),
        /**
         * Creates a deep clone of the given object.
         *
         * The main intended use of this function is to clone language definitions.
         *
         * @param {T} o
         * @param {Record<number, any>} [visited]
         * @returns {T}
         * @template T
         */
        clone: /* @__PURE__ */ a(function m(g, y) {
          y = y || {};
          var w, D;
          switch (o.util.type(g)) {
            case "Object":
              if (D = o.util.objId(g), y[D])
                return y[D];
              w = /** @type {Record<string, any>} */
              {}, y[D] = w;
              for (var x in g)
                g.hasOwnProperty(x) && (w[x] = m(g[x], y));
              return (
                /** @type {any} */
                w
              );
            case "Array":
              return D = o.util.objId(g), y[D] ? y[D] : (w = [], y[D] = w, /** @type {Array} */
              /** @type {any} */
              g.forEach(function(C, E) {
                w[E] = m(C, y);
              }), /** @type {any} */
              w);
            default:
              return g;
          }
        }, "deepClone"),
        /**
         * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
         *
         * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
         *
         * @param {Element} element
         * @returns {string}
         */
        getLanguage: /* @__PURE__ */ a(function(m) {
          for (; m; ) {
            var g = t.exec(m.className);
            if (g)
              return g[1].toLowerCase();
            m = m.parentElement;
          }
          return "none";
        }, "getLanguage"),
        /**
         * Sets the Prism `language-xxxx` class of the given element.
         *
         * @param {Element} element
         * @param {string} language
         * @returns {void}
         */
        setLanguage: /* @__PURE__ */ a(function(m, g) {
          m.className = m.className.replace(RegExp(t, "gi"), ""), m.classList.add("language-" + g);
        }, "setLanguage"),
        /**
         * Returns the script element that is currently executing.
         *
         * This does __not__ work for line script element.
         *
         * @returns {HTMLScriptElement | null}
         */
        currentScript: /* @__PURE__ */ a(function() {
          if (typeof document > "u")
            return null;
          if ("currentScript" in document)
            return (
              /** @type {any} */
              document.currentScript
            );
          try {
            throw new Error();
          } catch (w) {
            var m = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(w.stack) || [])[1];
            if (m) {
              var g = document.getElementsByTagName("script");
              for (var y in g)
                if (g[y].src == m)
                  return g[y];
            }
            return null;
          }
        }, "currentScript"),
        /**
         * Returns whether a given class is active for `element`.
         *
         * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
         * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
         * given class is just the given class with a `no-` prefix.
         *
         * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
         * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
         * ancestors have the given class or the negated version of it, then the default activation will be returned.
         *
         * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
         * version of it, the class is considered active.
         *
         * @param {Element} element
         * @param {string} className
         * @param {boolean} [defaultActivation=false]
         * @returns {boolean}
         */
        isActive: /* @__PURE__ */ a(function(m, g, y) {
          for (var w = "no-" + g; m; ) {
            var D = m.classList;
            if (D.contains(g))
              return !0;
            if (D.contains(w))
              return !1;
            m = m.parentElement;
          }
          return !!y;
        }, "isActive")
      },
      /**
       * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
       *
       * @namespace
       * @memberof Prism
       * @public
       */
      languages: {
        /**
         * The grammar for plain, unformatted text.
         */
        plain: n,
        plaintext: n,
        text: n,
        txt: n,
        /**
         * Creates a deep copy of the language with the given id and appends the given tokens.
         *
         * If a token in `redef` also appears in the copied language, then the existing token in the copied language
         * will be overwritten at its original position.
         *
         * ## Best practices
         *
         * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
         * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
         * understand the language definition because, normally, the order of tokens matters in Prism grammars.
         *
         * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
         * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
         *
         * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
         * @param {Grammar} redef The new tokens to append.
         * @returns {Grammar} The new language created.
         * @public
         * @example
         * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
         *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
         *     // at its original position
         *     'comment': { ... },
         *     // CSS doesn't have a 'color' token, so this token will be appended
         *     'color': /\b(?:red|green|blue)\b/
         * });
         */
        extend: /* @__PURE__ */ a(function(m, g) {
          var y = o.util.clone(o.languages[m]);
          for (var w in g)
            y[w] = g[w];
          return y;
        }, "extend"),
        /**
         * Inserts tokens _before_ another token in a language definition or any other grammar.
         *
         * ## Usage
         *
         * This helper method makes it easy to modify existing languages. For example, the CSS language definition
         * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
         * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
         * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
         * this:
         *
         * ```js
         * Prism.languages.markup.style = {
         *     // token
         * };
         * ```
         *
         * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
         * before existing tokens. For the CSS example above, you would use it like this:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'cdata', {
         *     'style': {
         *         // token
         *     }
         * });
         * ```
         *
         * ## Special cases
         *
         * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
         * will be ignored.
         *
         * This behavior can be used to insert tokens after `before`:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'comment', {
         *     'comment': Prism.languages.markup.comment,
         *     // tokens after 'comment'
         * });
         * ```
         *
         * ## Limitations
         *
         * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
         * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
         * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
         * deleting properties which is necessary to insert at arbitrary positions.
         *
         * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
         * Instead, it will create a new object and replace all references to the target object with the new one. This
         * can be done without temporarily deleting properties, so the iteration order is well-defined.
         *
         * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
         * you hold the target object in a variable, then the value of the variable will not change.
         *
         * ```js
         * var oldMarkup = Prism.languages.markup;
         * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
         *
         * assert(oldMarkup !== Prism.languages.markup);
         * assert(newMarkup === Prism.languages.markup);
         * ```
         *
         * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
         * object to be modified.
         * @param {string} before The key to insert before.
         * @param {Grammar} insert An object containing the key-value pairs to be inserted.
         * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
         * object to be modified.
         *
         * Defaults to `Prism.languages`.
         * @returns {Grammar} The new grammar object.
         * @public
         */
        insertBefore: /* @__PURE__ */ a(function(m, g, y, w) {
          w = w || /** @type {any} */
          o.languages;
          var D = w[m], x = {};
          for (var C in D)
            if (D.hasOwnProperty(C)) {
              if (C == g)
                for (var E in y)
                  y.hasOwnProperty(E) && (x[E] = y[E]);
              y.hasOwnProperty(C) || (x[C] = D[C]);
            }
          var R = w[m];
          return w[m] = x, o.languages.DFS(o.languages, function(F, S) {
            S === R && F != m && (this[F] = x);
          }), x;
        }, "insertBefore"),
        // Traverse a language definition with Depth First Search
        DFS: /* @__PURE__ */ a(function m(g, y, w, D) {
          D = D || {};
          var x = o.util.objId;
          for (var C in g)
            if (g.hasOwnProperty(C)) {
              y.call(g, C, g[C], w || C);
              var E = g[C], R = o.util.type(E);
              R === "Object" && !D[x(E)] ? (D[x(E)] = !0, m(E, y, null, D)) : R === "Array" && !D[x(E)] && (D[x(E)] = !0, m(E, y, C, D));
            }
        }, "DFS")
      },
      plugins: {},
      /**
       * This is the most high-level function in Prism’s API.
       * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
       * each one of them.
       *
       * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
       *
       * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
       * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
       * @memberof Prism
       * @public
       */
      highlightAll: /* @__PURE__ */ a(function(m, g) {
        o.highlightAllUnder(document, m, g);
      }, "highlightAll"),
      /**
       * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
       * {@link Prism.highlightElement} on each one of them.
       *
       * The following hooks will be run:
       * 1. `before-highlightall`
       * 2. `before-all-elements-highlight`
       * 3. All hooks of {@link Prism.highlightElement} for each element.
       *
       * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
       * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
       * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
       * @memberof Prism
       * @public
       */
      highlightAllUnder: /* @__PURE__ */ a(function(m, g, y) {
        var w = {
          callback: y,
          container: m,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
        };
        o.hooks.run("before-highlightall", w), w.elements = Array.prototype.slice.apply(w.container.querySelectorAll(w.selector)), o.hooks.run(
        "before-all-elements-highlight", w);
        for (var D = 0, x; x = w.elements[D++]; )
          o.highlightElement(x, g === !0, w.callback);
      }, "highlightAllUnder"),
      /**
       * Highlights the code inside a single element.
       *
       * The following hooks will be run:
       * 1. `before-sanity-check`
       * 2. `before-highlight`
       * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
       * 4. `before-insert`
       * 5. `after-highlight`
       * 6. `complete`
       *
       * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
       * the element's language.
       *
       * @param {Element} element The element containing the code.
       * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
       * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
       * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
       * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
       *
       * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
       * asynchronous highlighting to work. You can build your own bundle on the
       * [Download page](https://prismjs.com/download.html).
       * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
       * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
       * @memberof Prism
       * @public
       */
      highlightElement: /* @__PURE__ */ a(function(m, g, y) {
        var w = o.util.getLanguage(m), D = o.languages[w];
        o.util.setLanguage(m, w);
        var x = m.parentElement;
        x && x.nodeName.toLowerCase() === "pre" && o.util.setLanguage(x, w);
        var C = m.textContent, E = {
          element: m,
          language: w,
          grammar: D,
          code: C
        };
        function R(S) {
          E.highlightedCode = S, o.hooks.run("before-insert", E), E.element.innerHTML = E.highlightedCode, o.hooks.run("after-highlight", E),
          o.hooks.run("complete", E), y && y.call(E.element);
        }
        if (a(R, "insertHighlightedCode"), o.hooks.run("before-sanity-check", E), x = E.element.parentElement, x && x.nodeName.toLowerCase() ===
        "pre" && !x.hasAttribute("tabindex") && x.setAttribute("tabindex", "0"), !E.code) {
          o.hooks.run("complete", E), y && y.call(E.element);
          return;
        }
        if (o.hooks.run("before-highlight", E), !E.grammar) {
          R(o.util.encode(E.code));
          return;
        }
        if (g && e.Worker) {
          var F = new Worker(o.filename);
          F.onmessage = function(S) {
            R(S.data);
          }, F.postMessage(JSON.stringify({
            language: E.language,
            code: E.code,
            immediateClose: !0
          }));
        } else
          R(o.highlight(E.code, E.grammar, E.language));
      }, "highlightElement"),
      /**
       * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
       * and the language definitions to use, and returns a string with the HTML produced.
       *
       * The following hooks will be run:
       * 1. `before-tokenize`
       * 2. `after-tokenize`
       * 3. `wrap`: On each {@link Token}.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @param {string} language The name of the language definition passed to `grammar`.
       * @returns {string} The highlighted HTML.
       * @memberof Prism
       * @public
       * @example
       * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
       */
      highlight: /* @__PURE__ */ a(function(m, g, y) {
        var w = {
          code: m,
          grammar: g,
          language: y
        };
        if (o.hooks.run("before-tokenize", w), !w.grammar)
          throw new Error('The language "' + w.language + '" has no grammar.');
        return w.tokens = o.tokenize(w.code, w.grammar), o.hooks.run("after-tokenize", w), i.stringify(o.util.encode(w.tokens), w.language);
      }, "highlight"),
      /**
       * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
       * and the language definitions to use, and returns an array with the tokenized code.
       *
       * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
       *
       * This method could be useful in other contexts as well, as a very crude parser.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @returns {TokenStream} An array of strings and tokens, a token stream.
       * @memberof Prism
       * @public
       * @example
       * let code = `var foo = 0;`;
       * let tokens = Prism.tokenize(code, Prism.languages.javascript);
       * tokens.forEach(token => {
       *     if (token instanceof Prism.Token && token.type === 'number') {
       *         console.log(`Found numeric literal: ${token.content}`);
       *     }
       * });
       */
      tokenize: /* @__PURE__ */ a(function(m, g) {
        var y = g.rest;
        if (y) {
          for (var w in y)
            g[w] = y[w];
          delete g.rest;
        }
        var D = new c();
        return p(D, D.head, m), u(m, D, g, D.head, 0), h(D);
      }, "tokenize"),
      /**
       * @namespace
       * @memberof Prism
       * @public
       */
      hooks: {
        all: {},
        /**
         * Adds the given callback to the list of callbacks for the given hook.
         *
         * The callback will be invoked when the hook it is registered for is run.
         * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
         *
         * One callback function can be registered to multiple hooks and the same hook multiple times.
         *
         * @param {string} name The name of the hook.
         * @param {HookCallback} callback The callback function which is given environment variables.
         * @public
         */
        add: /* @__PURE__ */ a(function(m, g) {
          var y = o.hooks.all;
          y[m] = y[m] || [], y[m].push(g);
        }, "add"),
        /**
         * Runs a hook invoking all registered callbacks with the given environment variables.
         *
         * Callbacks will be invoked synchronously and in the order in which they were registered.
         *
         * @param {string} name The name of the hook.
         * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
         * @public
         */
        run: /* @__PURE__ */ a(function(m, g) {
          var y = o.hooks.all[m];
          if (!(!y || !y.length))
            for (var w = 0, D; D = y[w++]; )
              D(g);
        }, "run")
      },
      Token: i
    };
    e.Prism = o;
    function i(m, g, y, w) {
      this.type = m, this.content = g, this.alias = y, this.length = (w || "").length | 0;
    }
    a(i, "Token"), i.stringify = /* @__PURE__ */ a(function m(g, y) {
      if (typeof g == "string")
        return g;
      if (Array.isArray(g)) {
        var w = "";
        return g.forEach(function(R) {
          w += m(R, y);
        }), w;
      }
      var D = {
        type: g.type,
        content: m(g.content, y),
        tag: "span",
        classes: ["token", g.type],
        attributes: {},
        language: y
      }, x = g.alias;
      x && (Array.isArray(x) ? Array.prototype.push.apply(D.classes, x) : D.classes.push(x)), o.hooks.run("wrap", D);
      var C = "";
      for (var E in D.attributes)
        C += " " + E + '="' + (D.attributes[E] || "").replace(/"/g, "&quot;") + '"';
      return "<" + D.tag + ' class="' + D.classes.join(" ") + '"' + C + ">" + D.content + "</" + D.tag + ">";
    }, "stringify");
    function l(m, g, y, w) {
      m.lastIndex = g;
      var D = m.exec(y);
      if (D && w && D[1]) {
        var x = D[1].length;
        D.index += x, D[0] = D[0].slice(x);
      }
      return D;
    }
    a(l, "matchPattern");
    function u(m, g, y, w, D, x) {
      for (var C in y)
        if (!(!y.hasOwnProperty(C) || !y[C])) {
          var E = y[C];
          E = Array.isArray(E) ? E : [E];
          for (var R = 0; R < E.length; ++R) {
            if (x && x.cause == C + "," + R)
              return;
            var F = E[R], S = F.inside, k = !!F.lookbehind, I = !!F.greedy, H = F.alias;
            if (I && !F.pattern.global) {
              var M = F.pattern.toString().match(/[imsuy]*$/)[0];
              F.pattern = RegExp(F.pattern.source, M + "g");
            }
            for (var W = F.pattern || F, L = w.next, T = D; L !== g.tail && !(x && T >= x.reach); T += L.value.length, L = L.next) {
              var P = L.value;
              if (g.length > m.length)
                return;
              if (!(P instanceof i)) {
                var q = 1, N;
                if (I) {
                  if (N = l(W, T, m, k), !N || N.index >= m.length)
                    break;
                  var Pe = N.index, U = N.index + N[0].length, z = T;
                  for (z += L.value.length; Pe >= z; )
                    L = L.next, z += L.value.length;
                  if (z -= L.value.length, T = z, L.value instanceof i)
                    continue;
                  for (var K = L; K !== g.tail && (z < U || typeof K.value == "string"); K = K.next)
                    q++, z += K.value.length;
                  q--, P = m.slice(T, z), N.index -= T;
                } else if (N = l(W, 0, P, k), !N)
                  continue;
                var Pe = N.index, Ce = N[0], ge = P.slice(0, Pe), Fe = P.slice(Pe + Ce.length), He = T + P.length;
                x && He > x.reach && (x.reach = He);
                var ze = L.prev;
                ge && (ze = p(g, ze, ge), T += ge.length), d(g, ze, q);
                var ta = new i(C, S ? o.tokenize(Ce, S) : Ce, H, Ce);
                if (L = p(g, ze, ta), Fe && p(g, L, Fe), q > 1) {
                  var ra = {
                    cause: C + "," + R,
                    reach: He
                  };
                  u(m, g, y, L.prev, T, ra), x && ra.reach > x.reach && (x.reach = ra.reach);
                }
              }
            }
          }
        }
    }
    a(u, "matchGrammar");
    function c() {
      var m = { value: null, prev: null, next: null }, g = { value: null, prev: m, next: null };
      m.next = g, this.head = m, this.tail = g, this.length = 0;
    }
    a(c, "LinkedList");
    function p(m, g, y) {
      var w = g.next, D = { value: y, prev: g, next: w };
      return g.next = D, w.prev = D, m.length++, D;
    }
    a(p, "addAfter");
    function d(m, g, y) {
      for (var w = g.next, D = 0; D < y && w !== m.tail; D++)
        w = w.next;
      g.next = w, w.prev = g, m.length -= D;
    }
    a(d, "removeRange");
    function h(m) {
      for (var g = [], y = m.head.next; y !== m.tail; )
        g.push(y.value), y = y.next;
      return g;
    }
    if (a(h, "toArray"), !e.document)
      return e.addEventListener && (o.disableWorkerMessageHandler || e.addEventListener("message", function(m) {
        var g = JSON.parse(m.data), y = g.language, w = g.code, D = g.immediateClose;
        e.postMessage(o.highlight(w, o.languages[y], y)), D && e.close();
      }, !1)), o;
    var f = o.util.currentScript();
    f && (o.filename = f.src, f.hasAttribute("data-manual") && (o.manual = !0));
    function v() {
      o.manual || o.highlightAll();
    }
    if (a(v, "highlightAutomaticallyCallback"), !o.manual) {
      var b = document.readyState;
      b === "loading" || b === "interactive" && f && f.defer ? document.addEventListener("DOMContentLoaded", v) : window.requestAnimationFrame ?
      window.requestAnimationFrame(v) : window.setTimeout(v, 16);
    }
    return o;
  }(tw);
  typeof mi < "u" && mi.exports && (mi.exports = wf);
  typeof global < "u" && (global.Prism = wf);
});

// ../node_modules/refractor/lang/markup.js
var Vs = _((_H, yf) => {
  "use strict";
  yf.exports = js;
  js.displayName = "markup";
  js.aliases = ["html", "mathml", "svg", "xml", "ssml", "atom", "rss"];
  function js(e) {
    e.languages.markup = {
      comment: {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: !0
      },
      prolog: {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: !0
      },
      doctype: {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: !0,
        inside: {
          "internal-subset": {
            pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
            lookbehind: !0,
            greedy: !0,
            inside: null
            // see below
          },
          string: {
            pattern: /"[^"]*"|'[^']*'/,
            greedy: !0
          },
          punctuation: /^<!|>$|[[\]]/,
          "doctype-tag": /^DOCTYPE/i,
          name: /[^\s<>'"]+/
        }
      },
      cdata: {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: !0
      },
      tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: !0,
        inside: {
          tag: {
            pattern: /^<\/?[^\s>\/]+/,
            inside: {
              punctuation: /^<\/?/,
              namespace: /^[^\s>\/:]+:/
            }
          },
          "special-attr": [],
          "attr-value": {
            pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
            inside: {
              punctuation: [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                /"|'/
              ]
            }
          },
          punctuation: /\/?>/,
          "attr-name": {
            pattern: /[^\s>\/]+/,
            inside: {
              namespace: /^[^\s>\/:]+:/
            }
          }
        }
      },
      entity: [
        {
          pattern: /&[\da-z]{1,8};/i,
          alias: "named-entity"
        },
        /&#x?[\da-f]{1,8};/i
      ]
    }, e.languages.markup.tag.inside["attr-value"].inside.entity = e.languages.markup.entity, e.languages.markup.doctype.inside["internal-su\
bset"].inside = e.languages.markup, e.hooks.add("wrap", function(t) {
      t.type === "entity" && (t.attributes.title = t.content.value.replace(/&amp;/, "&"));
    }), Object.defineProperty(e.languages.markup.tag, "addInlined", {
      /**
       * Adds an inlined language to markup.
       *
       * An example of an inlined language is CSS with `<style>` tags.
       *
       * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addInlined('style', 'css');
       */
      value: /* @__PURE__ */ a(function(r, n) {
        var o = {};
        o["language-" + n] = {
          pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
          lookbehind: !0,
          inside: e.languages[n]
        }, o.cdata = /^<!\[CDATA\[|\]\]>$/i;
        var i = {
          "included-cdata": {
            pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
            inside: o
          }
        };
        i["language-" + n] = {
          pattern: /[\s\S]+/,
          inside: e.languages[n]
        };
        var l = {};
        l[r] = {
          pattern: RegExp(
            /(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(
              /__/g,
              function() {
                return r;
              }
            ),
            "i"
          ),
          lookbehind: !0,
          greedy: !0,
          inside: i
        }, e.languages.insertBefore("markup", "cdata", l);
      }, "addInlined")
    }), Object.defineProperty(e.languages.markup.tag, "addAttribute", {
      /**
       * Adds an pattern to highlight languages embedded in HTML attributes.
       *
       * An example of an inlined language is CSS with `style` attributes.
       *
       * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addAttribute('style', 'css');
       */
      value: /* @__PURE__ */ a(function(t, r) {
        e.languages.markup.tag.inside["special-attr"].push({
          pattern: RegExp(
            /(^|["'\s])/.source + "(?:" + t + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
            "i"
          ),
          lookbehind: !0,
          inside: {
            "attr-name": /^[^\s=]+/,
            "attr-value": {
              pattern: /=[\s\S]+/,
              inside: {
                value: {
                  pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                  lookbehind: !0,
                  alias: [r, "language-" + r],
                  inside: e.languages[r]
                },
                punctuation: [
                  {
                    pattern: /^=/,
                    alias: "attr-equals"
                  },
                  /"|'/
                ]
              }
            }
          }
        });
      }, "value")
    }), e.languages.html = e.languages.markup, e.languages.mathml = e.languages.markup, e.languages.svg = e.languages.markup, e.languages.xml =
    e.languages.extend("markup", {}), e.languages.ssml = e.languages.xml, e.languages.atom = e.languages.xml, e.languages.rss = e.languages.
    xml;
  }
  a(js, "markup");
});

// ../node_modules/refractor/lang/css.js
var qs = _((HH, Df) => {
  "use strict";
  Df.exports = Ws;
  Ws.displayName = "css";
  Ws.aliases = [];
  function Ws(e) {
    (function(t) {
      var r = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
      t.languages.css = {
        comment: /\/\*[\s\S]*?\*\//,
        atrule: {
          pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
          inside: {
            rule: /^@[\w-]+/,
            "selector-function-argument": {
              pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
              lookbehind: !0,
              alias: "selector"
            },
            keyword: {
              pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
              lookbehind: !0
            }
            // See rest below
          }
        },
        url: {
          // https://drafts.csswg.org/css-values-3/#urls
          pattern: RegExp(
            "\\burl\\((?:" + r.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)",
            "i"
          ),
          greedy: !0,
          inside: {
            function: /^url/i,
            punctuation: /^\(|\)$/,
            string: {
              pattern: RegExp("^" + r.source + "$"),
              alias: "url"
            }
          }
        },
        selector: {
          pattern: RegExp(
            `(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + r.source + ")*(?=\\s*\\{)"
          ),
          lookbehind: !0
        },
        string: {
          pattern: r,
          greedy: !0
        },
        property: {
          pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
          lookbehind: !0
        },
        important: /!important\b/i,
        function: {
          pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
          lookbehind: !0
        },
        punctuation: /[(){};:,]/
      }, t.languages.css.atrule.inside.rest = t.languages.css;
      var n = t.languages.markup;
      n && (n.tag.addInlined("style", "css"), n.tag.addAttribute("style", "css"));
    })(e);
  }
  a(Ws, "css");
});

// ../node_modules/refractor/lang/clike.js
var Cf = _((OH, xf) => {
  "use strict";
  xf.exports = Us;
  Us.displayName = "clike";
  Us.aliases = [];
  function Us(e) {
    e.languages.clike = {
      comment: [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: !0,
          greedy: !0
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: !0,
          greedy: !0
        }
      ],
      string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: !0
      },
      "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: !0,
        inside: {
          punctuation: /[.\\]/
        }
      },
      keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
      boolean: /\b(?:false|true)\b/,
      function: /\b\w+(?=\()/,
      number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      punctuation: /[{}[\];(),.:]/
    };
  }
  a(Us, "clike");
});

// ../node_modules/refractor/lang/javascript.js
var Rf = _(($H, Ef) => {
  "use strict";
  Ef.exports = Gs;
  Gs.displayName = "javascript";
  Gs.aliases = ["js"];
  function Gs(e) {
    e.languages.javascript = e.languages.extend("clike", {
      "class-name": [
        e.languages.clike["class-name"],
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
          lookbehind: !0
        }
      ],
      keyword: [
        {
          pattern: /((?:^|\})\s*)catch\b/,
          lookbehind: !0
        },
        {
          pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
          lookbehind: !0
        }
      ],
      // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
      function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
      number: {
        pattern: RegExp(
          /(^|[^\w$])/.source + "(?:" + // constant
          (/NaN|Infinity/.source + "|" + // binary integer
          /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
          /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
          /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
          /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
          /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
        ),
        lookbehind: !0
      },
      operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    }), e.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/, e.languages.
    insertBefore("javascript", "keyword", {
      regex: {
        // eslint-disable-next-line regexp/no-dupe-characters-character-class
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          "regex-source": {
            pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
            lookbehind: !0,
            alias: "language-regex",
            inside: e.languages.regex
          },
          "regex-delimiter": /^\/|\/$/,
          "regex-flags": /^[a-z]+$/
        }
      },
      // This must be declared before keyword because we use "function" inside the look-forward
      "function-variable": {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: "function"
      },
      parameter: [
        {
          pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
          lookbehind: !0,
          inside: e.languages.javascript
        },
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
          lookbehind: !0,
          inside: e.languages.javascript
        },
        {
          pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
          lookbehind: !0,
          inside: e.languages.javascript
        },
        {
          pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
          lookbehind: !0,
          inside: e.languages.javascript
        }
      ],
      constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    }), e.languages.insertBefore("javascript", "string", {
      hashbang: {
        pattern: /^#!.*/,
        greedy: !0,
        alias: "comment"
      },
      "template-string": {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: !0,
        inside: {
          "template-punctuation": {
            pattern: /^`|`$/,
            alias: "string"
          },
          interpolation: {
            pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
            lookbehind: !0,
            inside: {
              "interpolation-punctuation": {
                pattern: /^\$\{|\}$/,
                alias: "punctuation"
              },
              rest: e.languages.javascript
            }
          },
          string: /[\s\S]+/
        }
      },
      "string-property": {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: !0,
        greedy: !0,
        alias: "property"
      }
    }), e.languages.insertBefore("javascript", "operator", {
      "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: !0,
        alias: "property"
      }
    }), e.languages.markup && (e.languages.markup.tag.addInlined("script", "javascript"), e.languages.markup.tag.addAttribute(
      /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.
      source,
      "javascript"
    )), e.languages.js = e.languages.javascript;
  }
  a(Gs, "javascript");
});

// ../node_modules/refractor/core.js
var kf = _((VH, Ff) => {
  "use strict";
  var pa = typeof globalThis == "object" ? globalThis : typeof self == "object" ? self : typeof window == "object" ? window : typeof global ==
  "object" ? global : {}, rw = vw();
  pa.Prism = { manual: !0, disableWorkerMessageHandler: !0 };
  var nw = qd(), ow = vf(), Sf = bf(), aw = Vs(), iw = qs(), lw = Cf(), sw = Rf();
  rw();
  var Ys = {}.hasOwnProperty;
  function Af() {
  }
  a(Af, "Refractor");
  Af.prototype = Sf;
  var le = new Af();
  Ff.exports = le;
  le.highlight = cw;
  le.register = da;
  le.alias = uw;
  le.registered = pw;
  le.listLanguages = dw;
  da(aw);
  da(iw);
  da(lw);
  da(sw);
  le.util.encode = mw;
  le.Token.stringify = fw;
  function da(e) {
    if (typeof e != "function" || !e.displayName)
      throw new Error("Expected `function` for `grammar`, got `" + e + "`");
    le.languages[e.displayName] === void 0 && e(le);
  }
  a(da, "register");
  function uw(e, t) {
    var r = le.languages, n = e, o, i, l, u;
    t && (n = {}, n[e] = t);
    for (o in n)
      for (i = n[o], i = typeof i == "string" ? [i] : i, l = i.length, u = -1; ++u < l; )
        r[i[u]] = r[o];
  }
  a(uw, "alias");
  function cw(e, t) {
    var r = Sf.highlight, n;
    if (typeof e != "string")
      throw new Error("Expected `string` for `value`, got `" + e + "`");
    if (le.util.type(t) === "Object")
      n = t, t = null;
    else {
      if (typeof t != "string")
        throw new Error("Expected `string` for `name`, got `" + t + "`");
      if (Ys.call(le.languages, t))
        n = le.languages[t];
      else
        throw new Error("Unknown language: `" + t + "` is not registered");
    }
    return r.call(this, e, n, t);
  }
  a(cw, "highlight");
  function pw(e) {
    if (typeof e != "string")
      throw new Error("Expected `string` for `language`, got `" + e + "`");
    return Ys.call(le.languages, e);
  }
  a(pw, "registered");
  function dw() {
    var e = le.languages, t = [], r;
    for (r in e)
      Ys.call(e, r) && typeof e[r] == "object" && t.push(r);
    return t;
  }
  a(dw, "listLanguages");
  function fw(e, t, r) {
    var n;
    return typeof e == "string" ? { type: "text", value: e } : le.util.type(e) === "Array" ? hw(e, t) : (n = {
      type: e.type,
      content: le.Token.stringify(e.content, t, r),
      tag: "span",
      classes: ["token", e.type],
      attributes: {},
      language: t,
      parent: r
    }, e.alias && (n.classes = n.classes.concat(e.alias)), le.hooks.run("wrap", n), nw(
      n.tag + "." + n.classes.join("."),
      gw(n.attributes),
      n.content
    ));
  }
  a(fw, "stringify");
  function hw(e, t) {
    for (var r = [], n = e.length, o = -1, i; ++o < n; )
      i = e[o], i !== "" && i !== null && i !== void 0 && r.push(i);
    for (o = -1, n = r.length; ++o < n; )
      i = r[o], r[o] = le.Token.stringify(i, t, r);
    return r;
  }
  a(hw, "stringifyAll");
  function mw(e) {
    return e;
  }
  a(mw, "encode");
  function gw(e) {
    var t;
    for (t in e)
      e[t] = ow(e[t]);
    return e;
  }
  a(gw, "attributes");
  function vw() {
    var e = "Prism" in pa, t = e ? pa.Prism : void 0;
    return r;
    function r() {
      e ? pa.Prism = t : delete pa.Prism, e = void 0, t = void 0;
    }
  }
  a(vw, "capture");
});

// ../node_modules/react-syntax-highlighter/dist/esm/prism-light.js
var gi, Xs, vi, Lf = A(() => {
  qp();
  gi = Ee(kf()), Xs = Rs(gi.default, {});
  Xs.registerLanguage = function(e, t) {
    return gi.default.register(t);
  };
  Xs.alias = function(e, t) {
    return gi.default.alias(e, t);
  };
  vi = Xs;
});

// ../node_modules/react-syntax-highlighter/dist/esm/index.js
var Tf = A(() => {
  Es();
});

// ../node_modules/refractor/lang/bash.js
var If = _((XH, Bf) => {
  "use strict";
  Bf.exports = Ks;
  Ks.displayName = "bash";
  Ks.aliases = ["shell"];
  function Ks(e) {
    (function(t) {
      var r = "\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE\
|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|G\
DMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HO\
STTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHON\
E|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OST\
YPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS\
|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRE\
NT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_\
SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b", n = {
        pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
        lookbehind: !0,
        alias: "punctuation",
        // this looks reasonably well in all themes
        inside: null
        // see below
      }, o = {
        bash: n,
        environment: {
          pattern: RegExp("\\$" + r),
          alias: "constant"
        },
        variable: [
          // [0]: Arithmetic Environment
          {
            pattern: /\$?\(\([\s\S]+?\)\)/,
            greedy: !0,
            inside: {
              // If there is a $ sign at the beginning highlight $(( and )) as variable
              variable: [
                {
                  pattern: /(^\$\(\([\s\S]+)\)\)/,
                  lookbehind: !0
                },
                /^\$\(\(/
              ],
              number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
              // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
              operator: /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
              // If there is no $ sign at the beginning highlight (( and )) as punctuation
              punctuation: /\(\(?|\)\)?|,|;/
            }
          },
          // [1]: Command Substitution
          {
            pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
            greedy: !0,
            inside: {
              variable: /^\$\(|^`|\)$|`$/
            }
          },
          // [2]: Brace expansion
          {
            pattern: /\$\{[^}]+\}/,
            greedy: !0,
            inside: {
              operator: /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
              punctuation: /[\[\]]/,
              environment: {
                pattern: RegExp("(\\{)" + r),
                lookbehind: !0,
                alias: "constant"
              }
            }
          },
          /\$(?:\w+|[#?*!@$])/
        ],
        // Escape sequences from echo and printf's manuals, and escaped quotes.
        entity: /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
      };
      t.languages.bash = {
        shebang: {
          pattern: /^#!\s*\/.*/,
          alias: "important"
        },
        comment: {
          pattern: /(^|[^"{\\$])#.*/,
          lookbehind: !0
        },
        "function-name": [
          // a) function foo {
          // b) foo() {
          // c) function foo() {
          // but not “foo {”
          {
            // a) and c)
            pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
            lookbehind: !0,
            alias: "function"
          },
          {
            // b)
            pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
            alias: "function"
          }
        ],
        // Highlight variable names as variables in for and select beginnings.
        "for-or-select": {
          pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
          alias: "variable",
          lookbehind: !0
        },
        // Highlight variable names as variables in the left-hand part
        // of assignments (“=” and “+=”).
        "assign-left": {
          pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
          inside: {
            environment: {
              pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + r),
              lookbehind: !0,
              alias: "constant"
            }
          },
          alias: "variable",
          lookbehind: !0
        },
        string: [
          // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
          {
            pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
            lookbehind: !0,
            greedy: !0,
            inside: o
          },
          // Here-document with quotes around the tag
          // → No expansion (so no “inside”).
          {
            pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
            lookbehind: !0,
            greedy: !0,
            inside: {
              bash: n
            }
          },
          // “Normal” string
          {
            // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
            pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
            lookbehind: !0,
            greedy: !0,
            inside: o
          },
          {
            // https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
            pattern: /(^|[^$\\])'[^']*'/,
            lookbehind: !0,
            greedy: !0
          },
          {
            // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
            pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
            greedy: !0,
            inside: {
              entity: o.entity
            }
          }
        ],
        environment: {
          pattern: RegExp("\\$?" + r),
          alias: "constant"
        },
        variable: o.variable,
        function: {
          pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
          lookbehind: !0
        },
        keyword: {
          pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
          lookbehind: !0
        },
        // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
        builtin: {
          pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
          lookbehind: !0,
          // Alias added to make those easier to distinguish from strings.
          alias: "class-name"
        },
        boolean: {
          pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
          lookbehind: !0
        },
        "file-descriptor": {
          pattern: /\B&\d\b/,
          alias: "important"
        },
        operator: {
          // Lots of redirections here, but not just that.
          pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
          inside: {
            "file-descriptor": {
              pattern: /^\d/,
              alias: "important"
            }
          }
        },
        punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
        number: {
          pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
          lookbehind: !0
        }
      }, n.inside = t.languages.bash;
      for (var i = [
        "comment",
        "function-name",
        "for-or-select",
        "assign-left",
        "string",
        "environment",
        "function",
        "keyword",
        "builtin",
        "boolean",
        "file-descriptor",
        "operator",
        "punctuation",
        "number"
      ], l = o.variable[1].inside, u = 0; u < i.length; u++)
        l[i[u]] = t.languages.bash[i[u]];
      t.languages.shell = t.languages.bash;
    })(e);
  }
  a(Ks, "bash");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/bash.js
var Mf, _f, Pf = A(() => {
  Mf = Ee(If()), _f = Mf.default;
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/css.js
var Hf, zf, Of = A(() => {
  Hf = Ee(qs()), zf = Hf.default;
});

// ../node_modules/refractor/lang/graphql.js
var $f = _((QH, Nf) => {
  "use strict";
  Nf.exports = Zs;
  Zs.displayName = "graphql";
  Zs.aliases = [];
  function Zs(e) {
    e.languages.graphql = {
      comment: /#.*/,
      description: {
        pattern: /(?:"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*")(?=\s*[a-z_])/i,
        greedy: !0,
        alias: "string",
        inside: {
          "language-markdown": {
            pattern: /(^"(?:"")?)(?!\1)[\s\S]+(?=\1$)/,
            lookbehind: !0,
            inside: e.languages.markdown
          }
        }
      },
      string: {
        pattern: /"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*"/,
        greedy: !0
      },
      number: /(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
      boolean: /\b(?:false|true)\b/,
      variable: /\$[a-z_]\w*/i,
      directive: {
        pattern: /@[a-z_]\w*/i,
        alias: "function"
      },
      "attr-name": {
        pattern: /\b[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,
        greedy: !0
      },
      "atom-input": {
        pattern: /\b[A-Z]\w*Input\b/,
        alias: "class-name"
      },
      scalar: /\b(?:Boolean|Float|ID|Int|String)\b/,
      constant: /\b[A-Z][A-Z_\d]*\b/,
      "class-name": {
        pattern: /(\b(?:enum|implements|interface|on|scalar|type|union)\s+|&\s*|:\s*|\[)[A-Z_]\w*/,
        lookbehind: !0
      },
      fragment: {
        pattern: /(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,
        lookbehind: !0,
        alias: "function"
      },
      "definition-mutation": {
        pattern: /(\bmutation\s+)[a-zA-Z_]\w*/,
        lookbehind: !0,
        alias: "function"
      },
      "definition-query": {
        pattern: /(\bquery\s+)[a-zA-Z_]\w*/,
        lookbehind: !0,
        alias: "function"
      },
      keyword: /\b(?:directive|enum|extend|fragment|implements|input|interface|mutation|on|query|repeatable|scalar|schema|subscription|type|union)\b/,
      operator: /[!=|&]|\.{3}/,
      "property-query": /\w+(?=\s*\()/,
      object: /\w+(?=\s*\{)/,
      punctuation: /[!(){}\[\]:=,]/,
      property: /\w+/
    }, e.hooks.add("after-tokenize", /* @__PURE__ */ a(function(r) {
      if (r.language !== "graphql")
        return;
      var n = r.tokens.filter(function(g) {
        return typeof g != "string" && g.type !== "comment" && g.type !== "scalar";
      }), o = 0;
      function i(g) {
        return n[o + g];
      }
      a(i, "getToken");
      function l(g, y) {
        y = y || 0;
        for (var w = 0; w < g.length; w++) {
          var D = i(w + y);
          if (!D || D.type !== g[w])
            return !1;
        }
        return !0;
      }
      a(l, "isTokenType");
      function u(g, y) {
        for (var w = 1, D = o; D < n.length; D++) {
          var x = n[D], C = x.content;
          if (x.type === "punctuation" && typeof C == "string") {
            if (g.test(C))
              w++;
            else if (y.test(C) && (w--, w === 0))
              return D;
          }
        }
        return -1;
      }
      a(u, "findClosingBracket");
      function c(g, y) {
        var w = g.alias;
        w ? Array.isArray(w) || (g.alias = w = [w]) : g.alias = w = [], w.push(y);
      }
      for (a(c, "addAlias"); o < n.length; ) {
        var p = n[o++];
        if (p.type === "keyword" && p.content === "mutation") {
          var d = [];
          if (l(["definition-mutation", "punctuation"]) && i(1).content === "(") {
            o += 2;
            var h = u(/^\($/, /^\)$/);
            if (h === -1)
              continue;
            for (; o < h; o++) {
              var f = i(0);
              f.type === "variable" && (c(f, "variable-input"), d.push(f.content));
            }
            o = h + 1;
          }
          if (l(["punctuation", "property-query"]) && i(0).content === "{" && (o++, c(i(0), "property-mutation"), d.length > 0)) {
            var v = u(/^\{$/, /^\}$/);
            if (v === -1)
              continue;
            for (var b = o; b < v; b++) {
              var m = n[b];
              m.type === "variable" && d.indexOf(m.content) >= 0 && c(m, "variable-input");
            }
          }
        }
      }
    }, "afterTokenizeGraphql"));
  }
  a(Zs, "graphql");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/graphql.js
var jf, Vf, Wf = A(() => {
  jf = Ee($f()), Vf = jf.default;
});

// ../node_modules/refractor/lang/js-extras.js
var Uf = _((rz, qf) => {
  "use strict";
  qf.exports = Js;
  Js.displayName = "jsExtras";
  Js.aliases = [];
  function Js(e) {
    (function(t) {
      t.languages.insertBefore("javascript", "function-variable", {
        "method-variable": {
          pattern: RegExp(
            "(\\.\\s*)" + t.languages.javascript["function-variable"].pattern.source
          ),
          lookbehind: !0,
          alias: ["function-variable", "method", "function", "property-access"]
        }
      }), t.languages.insertBefore("javascript", "function", {
        method: {
          pattern: RegExp(
            "(\\.\\s*)" + t.languages.javascript.function.source
          ),
          lookbehind: !0,
          alias: ["function", "property-access"]
        }
      }), t.languages.insertBefore("javascript", "constant", {
        "known-class-name": [
          {
            // standard built-ins
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
            pattern: /\b(?:(?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|(?:Weak)?(?:Map|Set)|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|WebAssembly)\b/,
            alias: "class-name"
          },
          {
            // errors
            pattern: /\b(?:[A-Z]\w*)Error\b/,
            alias: "class-name"
          }
        ]
      });
      function r(c, p) {
        return RegExp(
          c.replace(/<ID>/g, function() {
            return /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/.source;
          }),
          p
        );
      }
      a(r, "withId"), t.languages.insertBefore("javascript", "keyword", {
        imports: {
          // https://tc39.es/ecma262/#sec-imports
          pattern: r(
            /(\bimport\b\s*)(?:<ID>(?:\s*,\s*(?:\*\s*as\s+<ID>|\{[^{}]*\}))?|\*\s*as\s+<ID>|\{[^{}]*\})(?=\s*\bfrom\b)/.source
          ),
          lookbehind: !0,
          inside: t.languages.javascript
        },
        exports: {
          // https://tc39.es/ecma262/#sec-exports
          pattern: r(
            /(\bexport\b\s*)(?:\*(?:\s*as\s+<ID>)?(?=\s*\bfrom\b)|\{[^{}]*\})/.source
          ),
          lookbehind: !0,
          inside: t.languages.javascript
        }
      }), t.languages.javascript.keyword.unshift(
        {
          pattern: /\b(?:as|default|export|from|import)\b/,
          alias: "module"
        },
        {
          pattern: /\b(?:await|break|catch|continue|do|else|finally|for|if|return|switch|throw|try|while|yield)\b/,
          alias: "control-flow"
        },
        {
          pattern: /\bnull\b/,
          alias: ["null", "nil"]
        },
        {
          pattern: /\bundefined\b/,
          alias: "nil"
        }
      ), t.languages.insertBefore("javascript", "operator", {
        spread: {
          pattern: /\.{3}/,
          alias: "operator"
        },
        arrow: {
          pattern: /=>/,
          alias: "operator"
        }
      }), t.languages.insertBefore("javascript", "punctuation", {
        "property-access": {
          pattern: r(/(\.\s*)#?<ID>/.source),
          lookbehind: !0
        },
        "maybe-class-name": {
          pattern: /(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,
          lookbehind: !0
        },
        dom: {
          // this contains only a few commonly used DOM variables
          pattern: /\b(?:document|(?:local|session)Storage|location|navigator|performance|window)\b/,
          alias: "variable"
        },
        console: {
          pattern: /\bconsole(?=\s*\.)/,
          alias: "class-name"
        }
      });
      for (var n = [
        "function",
        "function-variable",
        "method",
        "method-variable",
        "property-access"
      ], o = 0; o < n.length; o++) {
        var i = n[o], l = t.languages.javascript[i];
        t.util.type(l) === "RegExp" && (l = t.languages.javascript[i] = {
          pattern: l
        });
        var u = l.inside || {};
        l.inside = u, u["maybe-class-name"] = /^[A-Z][\s\S]*/;
      }
    })(e);
  }
  a(Js, "jsExtras");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/js-extras.js
var Gf, Yf, Xf = A(() => {
  Gf = Ee(Uf()), Yf = Gf.default;
});

// ../node_modules/refractor/lang/json.js
var Zf = _((az, Kf) => {
  "use strict";
  Kf.exports = Qs;
  Qs.displayName = "json";
  Qs.aliases = ["webmanifest"];
  function Qs(e) {
    e.languages.json = {
      property: {
        pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
        lookbehind: !0,
        greedy: !0
      },
      string: {
        pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
        lookbehind: !0,
        greedy: !0
      },
      comment: {
        pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
        greedy: !0
      },
      number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
      punctuation: /[{}[\],]/,
      operator: /:/,
      boolean: /\b(?:false|true)\b/,
      null: {
        pattern: /\bnull\b/,
        alias: "keyword"
      }
    }, e.languages.webmanifest = e.languages.json;
  }
  a(Qs, "json");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/json.js
var Jf, Qf, eh = A(() => {
  Jf = Ee(Zf()), Qf = Jf.default;
});

// ../node_modules/refractor/lang/jsx.js
var tu = _((sz, th) => {
  "use strict";
  th.exports = eu;
  eu.displayName = "jsx";
  eu.aliases = [];
  function eu(e) {
    (function(t) {
      var r = t.util.clone(t.languages.javascript), n = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source, o = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.
      source, i = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
      function l(p, d) {
        return p = p.replace(/<S>/g, function() {
          return n;
        }).replace(/<BRACES>/g, function() {
          return o;
        }).replace(/<SPREAD>/g, function() {
          return i;
        }), RegExp(p, d);
      }
      a(l, "re"), i = l(i).source, t.languages.jsx = t.languages.extend("markup", r), t.languages.jsx.tag.pattern = l(
        /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.
        source
      ), t.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/, t.languages.jsx.tag.inside["attr-value"].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/,
      t.languages.jsx.tag.inside.tag.inside["class-name"] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/, t.languages.jsx.tag.inside.comment = r.comment, t.languages.
      insertBefore(
        "inside",
        "attr-name",
        {
          spread: {
            pattern: l(/<SPREAD>/.source),
            inside: t.languages.jsx
          }
        },
        t.languages.jsx.tag
      ), t.languages.insertBefore(
        "inside",
        "special-attr",
        {
          script: {
            // Allow for two levels of nesting
            pattern: l(/=<BRACES>/.source),
            alias: "language-javascript",
            inside: {
              "script-punctuation": {
                pattern: /^=(?=\{)/,
                alias: "punctuation"
              },
              rest: t.languages.jsx
            }
          }
        },
        t.languages.jsx.tag
      );
      var u = /* @__PURE__ */ a(function(p) {
        return p ? typeof p == "string" ? p : typeof p.content == "string" ? p.content : p.content.map(u).join("") : "";
      }, "stringifyToken"), c = /* @__PURE__ */ a(function(p) {
        for (var d = [], h = 0; h < p.length; h++) {
          var f = p[h], v = !1;
          if (typeof f != "string" && (f.type === "tag" && f.content[0] && f.content[0].type === "tag" ? f.content[0].content[0].content ===
          "</" ? d.length > 0 && d[d.length - 1].tagName === u(f.content[0].content[1]) && d.pop() : f.content[f.content.length - 1].content ===
          "/>" || d.push({
            tagName: u(f.content[0].content[1]),
            openedBraces: 0
          }) : d.length > 0 && f.type === "punctuation" && f.content === "{" ? d[d.length - 1].openedBraces++ : d.length > 0 && d[d.length -
          1].openedBraces > 0 && f.type === "punctuation" && f.content === "}" ? d[d.length - 1].openedBraces-- : v = !0), (v || typeof f ==
          "string") && d.length > 0 && d[d.length - 1].openedBraces === 0) {
            var b = u(f);
            h < p.length - 1 && (typeof p[h + 1] == "string" || p[h + 1].type === "plain-text") && (b += u(p[h + 1]), p.splice(h + 1, 1)), h >
            0 && (typeof p[h - 1] == "string" || p[h - 1].type === "plain-text") && (b = u(p[h - 1]) + b, p.splice(h - 1, 1), h--), p[h] = new t.
            Token(
              "plain-text",
              b,
              null,
              b
            );
          }
          f.content && typeof f.content != "string" && c(f.content);
        }
      }, "walkTokens");
      t.hooks.add("after-tokenize", function(p) {
        p.language !== "jsx" && p.language !== "tsx" || c(p.tokens);
      });
    })(e);
  }
  a(eu, "jsx");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/jsx.js
var rh, nh, oh = A(() => {
  rh = Ee(tu()), nh = rh.default;
});

// ../node_modules/refractor/lang/markdown.js
var ih = _((pz, ah) => {
  "use strict";
  ah.exports = ru;
  ru.displayName = "markdown";
  ru.aliases = ["md"];
  function ru(e) {
    (function(t) {
      var r = /(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?![\r\n]))/.source;
      function n(h) {
        return h = h.replace(/<inner>/g, function() {
          return r;
        }), RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + "(?:" + h + ")");
      }
      a(n, "createInline");
      var o = /(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source, i = /\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|(?![\s\S]))/.source.
      replace(
        /__/g,
        function() {
          return o;
        }
      ), l = /\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source;
      t.languages.markdown = t.languages.extend("markup", {}), t.languages.insertBefore("markdown", "prolog", {
        "front-matter-block": {
          pattern: /(^(?:\s*[\r\n])?)---(?!.)[\s\S]*?[\r\n]---(?!.)/,
          lookbehind: !0,
          greedy: !0,
          inside: {
            punctuation: /^---|---$/,
            "front-matter": {
              pattern: /\S+(?:\s+\S+)*/,
              alias: ["yaml", "language-yaml"],
              inside: t.languages.yaml
            }
          }
        },
        blockquote: {
          // > ...
          pattern: /^>(?:[\t ]*>)*/m,
          alias: "punctuation"
        },
        table: {
          pattern: RegExp(
            "^" + i + l + "(?:" + i + ")*",
            "m"
          ),
          inside: {
            "table-data-rows": {
              pattern: RegExp(
                "^(" + i + l + ")(?:" + i + ")*$"
              ),
              lookbehind: !0,
              inside: {
                "table-data": {
                  pattern: RegExp(o),
                  inside: t.languages.markdown
                },
                punctuation: /\|/
              }
            },
            "table-line": {
              pattern: RegExp("^(" + i + ")" + l + "$"),
              lookbehind: !0,
              inside: {
                punctuation: /\||:?-{3,}:?/
              }
            },
            "table-header-row": {
              pattern: RegExp("^" + i + "$"),
              inside: {
                "table-header": {
                  pattern: RegExp(o),
                  alias: "important",
                  inside: t.languages.markdown
                },
                punctuation: /\|/
              }
            }
          }
        },
        code: [
          {
            // Prefixed by 4 spaces or 1 tab and preceded by an empty line
            pattern: /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
            lookbehind: !0,
            alias: "keyword"
          },
          {
            // ```optional language
            // code block
            // ```
            pattern: /^```[\s\S]*?^```$/m,
            greedy: !0,
            inside: {
              "code-block": {
                pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
                lookbehind: !0
              },
              "code-language": {
                pattern: /^(```).+/,
                lookbehind: !0
              },
              punctuation: /```/
            }
          }
        ],
        title: [
          {
            // title 1
            // =======
            // title 2
            // -------
            pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
            alias: "important",
            inside: {
              punctuation: /==+$|--+$/
            }
          },
          {
            // # title 1
            // ###### title 6
            pattern: /(^\s*)#.+/m,
            lookbehind: !0,
            alias: "important",
            inside: {
              punctuation: /^#+|#+$/
            }
          }
        ],
        hr: {
          // ***
          // ---
          // * * *
          // -----------
          pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
          lookbehind: !0,
          alias: "punctuation"
        },
        list: {
          // * item
          // + item
          // - item
          // 1. item
          pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
          lookbehind: !0,
          alias: "punctuation"
        },
        "url-reference": {
          // [id]: http://example.com "Optional title"
          // [id]: http://example.com 'Optional title'
          // [id]: http://example.com (Optional title)
          // [id]: <http://example.com> "Optional title"
          pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
          inside: {
            variable: {
              pattern: /^(!?\[)[^\]]+/,
              lookbehind: !0
            },
            string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
            punctuation: /^[\[\]!:]|[<>]/
          },
          alias: "url"
        },
        bold: {
          // **strong**
          // __strong__
          // allow one nested instance of italic text using the same delimiter
          pattern: n(
            /\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\b|\*\*(?:(?!\*)<inner>|\*(?:(?!\*)<inner>)+\*)+\*\*/.source
          ),
          lookbehind: !0,
          greedy: !0,
          inside: {
            content: {
              pattern: /(^..)[\s\S]+(?=..$)/,
              lookbehind: !0,
              inside: {}
              // see below
            },
            punctuation: /\*\*|__/
          }
        },
        italic: {
          // *em*
          // _em_
          // allow one nested instance of bold text using the same delimiter
          pattern: n(
            /\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\b|\*(?:(?!\*)<inner>|\*\*(?:(?!\*)<inner>)+\*\*)+\*/.source
          ),
          lookbehind: !0,
          greedy: !0,
          inside: {
            content: {
              pattern: /(^.)[\s\S]+(?=.$)/,
              lookbehind: !0,
              inside: {}
              // see below
            },
            punctuation: /[*_]/
          }
        },
        strike: {
          // ~~strike through~~
          // ~strike~
          // eslint-disable-next-line regexp/strict
          pattern: n(/(~~?)(?:(?!~)<inner>)+\2/.source),
          lookbehind: !0,
          greedy: !0,
          inside: {
            content: {
              pattern: /(^~~?)[\s\S]+(?=\1$)/,
              lookbehind: !0,
              inside: {}
              // see below
            },
            punctuation: /~~?/
          }
        },
        "code-snippet": {
          // `code`
          // ``code``
          pattern: /(^|[^\\`])(?:``[^`\r\n]+(?:`[^`\r\n]+)*``(?!`)|`[^`\r\n]+`(?!`))/,
          lookbehind: !0,
          greedy: !0,
          alias: ["code", "keyword"]
        },
        url: {
          // [example](http://example.com "Optional title")
          // [example][id]
          // [example] [id]
          pattern: n(
            /!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)|[ \t]?\[(?:(?!\])<inner>)+\])/.source
          ),
          lookbehind: !0,
          greedy: !0,
          inside: {
            operator: /^!/,
            content: {
              pattern: /(^\[)[^\]]+(?=\])/,
              lookbehind: !0,
              inside: {}
              // see below
            },
            variable: {
              pattern: /(^\][ \t]?\[)[^\]]+(?=\]$)/,
              lookbehind: !0
            },
            url: {
              pattern: /(^\]\()[^\s)]+/,
              lookbehind: !0
            },
            string: {
              pattern: /(^[ \t]+)"(?:\\.|[^"\\])*"(?=\)$)/,
              lookbehind: !0
            }
          }
        }
      }), ["url", "bold", "italic", "strike"].forEach(function(h) {
        ["url", "bold", "italic", "strike", "code-snippet"].forEach(function(f) {
          h !== f && (t.languages.markdown[h].inside.content.inside[f] = t.languages.markdown[f]);
        });
      }), t.hooks.add("after-tokenize", function(h) {
        if (h.language !== "markdown" && h.language !== "md")
          return;
        function f(v) {
          if (!(!v || typeof v == "string"))
            for (var b = 0, m = v.length; b < m; b++) {
              var g = v[b];
              if (g.type !== "code") {
                f(g.content);
                continue;
              }
              var y = g.content[1], w = g.content[3];
              if (y && w && y.type === "code-language" && w.type === "code-block" && typeof y.content == "string") {
                var D = y.content.replace(/\b#/g, "sharp").replace(/\b\+\+/g, "pp");
                D = (/[a-z][\w-]*/i.exec(D) || [""])[0].toLowerCase();
                var x = "language-" + D;
                w.alias ? typeof w.alias == "string" ? w.alias = [w.alias, x] : w.alias.push(x) : w.alias = [x];
              }
            }
        }
        a(f, "walkTokens"), f(h.tokens);
      }), t.hooks.add("wrap", function(h) {
        if (h.type === "code-block") {
          for (var f = "", v = 0, b = h.classes.length; v < b; v++) {
            var m = h.classes[v], g = /language-(.+)/.exec(m);
            if (g) {
              f = g[1];
              break;
            }
          }
          var y = t.languages[f];
          if (y)
            h.content = t.highlight(
              d(h.content.value),
              y,
              f
            );
          else if (f && f !== "none" && t.plugins.autoloader) {
            var w = "md-" + (/* @__PURE__ */ new Date()).valueOf() + "-" + Math.floor(Math.random() * 1e16);
            h.attributes.id = w, t.plugins.autoloader.loadLanguages(f, function() {
              var D = document.getElementById(w);
              D && (D.innerHTML = t.highlight(
                D.textContent,
                t.languages[f],
                f
              ));
            });
          }
        }
      });
      var u = RegExp(t.languages.markup.tag.pattern.source, "gi"), c = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"'
      }, p = String.fromCodePoint || String.fromCharCode;
      function d(h) {
        var f = h.replace(u, "");
        return f = f.replace(/&(\w{1,8}|#x?[\da-f]{1,8});/gi, function(v, b) {
          if (b = b.toLowerCase(), b[0] === "#") {
            var m;
            return b[1] === "x" ? m = parseInt(b.slice(2), 16) : m = Number(b.slice(1)), p(m);
          } else {
            var g = c[b];
            return g || v;
          }
        }), f;
      }
      a(d, "textContent"), t.languages.md = t.languages.markdown;
    })(e);
  }
  a(ru, "markdown");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/markdown.js
var lh, sh, uh = A(() => {
  lh = Ee(ih()), sh = lh.default;
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/markup.js
var ch, ph, dh = A(() => {
  ch = Ee(Vs()), ph = ch.default;
});

// ../node_modules/refractor/lang/typescript.js
var ou = _((mz, fh) => {
  "use strict";
  fh.exports = nu;
  nu.displayName = "typescript";
  nu.aliases = ["ts"];
  function nu(e) {
    (function(t) {
      t.languages.typescript = t.languages.extend("javascript", {
        "class-name": {
          pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
          lookbehind: !0,
          greedy: !0,
          inside: null
          // see below
        },
        builtin: /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/
      }), t.languages.typescript.keyword.push(
        /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
        // keywords that have to be followed by an identifier
        /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
        // This is for `import type *, {}`
        /\btype\b(?=\s*(?:[\{*]|$))/
      ), delete t.languages.typescript.parameter, delete t.languages.typescript["literal-property"];
      var r = t.languages.extend("typescript", {});
      delete r["class-name"], t.languages.typescript["class-name"].inside = r, t.languages.insertBefore("typescript", "function", {
        decorator: {
          pattern: /@[$\w\xA0-\uFFFF]+/,
          inside: {
            at: {
              pattern: /^@/,
              alias: "operator"
            },
            function: /^[\s\S]+/
          }
        },
        "generic-function": {
          // e.g. foo<T extends "bar" | "baz">( ...
          pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
          greedy: !0,
          inside: {
            function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
            generic: {
              pattern: /<[\s\S]+/,
              // everything after the first <
              alias: "class-name",
              inside: r
            }
          }
        }
      }), t.languages.ts = t.languages.typescript;
    })(e);
  }
  a(nu, "typescript");
});

// ../node_modules/refractor/lang/tsx.js
var mh = _((vz, hh) => {
  "use strict";
  var ww = tu(), bw = ou();
  hh.exports = au;
  au.displayName = "tsx";
  au.aliases = [];
  function au(e) {
    e.register(ww), e.register(bw), function(t) {
      var r = t.util.clone(t.languages.typescript);
      t.languages.tsx = t.languages.extend("jsx", r), delete t.languages.tsx.parameter, delete t.languages.tsx["literal-property"];
      var n = t.languages.tsx.tag;
      n.pattern = RegExp(
        /(^|[^\w$]|(?=<\/))/.source + "(?:" + n.pattern.source + ")",
        n.pattern.flags
      ), n.lookbehind = !0;
    }(e);
  }
  a(au, "tsx");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/tsx.js
var gh, vh, wh = A(() => {
  gh = Ee(mh()), vh = gh.default;
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/typescript.js
var bh, yh, Dh = A(() => {
  bh = Ee(ou()), yh = bh.default;
});

// ../node_modules/refractor/lang/yaml.js
var Ch = _((Dz, xh) => {
  "use strict";
  xh.exports = iu;
  iu.displayName = "yaml";
  iu.aliases = ["yml"];
  function iu(e) {
    (function(t) {
      var r = /[*&][^\s[\]{},]+/, n = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/, o = "(?:" + n.source +
      "(?:[ 	]+" + r.source + ")?|" + r.source + "(?:[ 	]+" + n.source + ")?)", i = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.
      source.replace(
        /<PLAIN>/g,
        function() {
          return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source;
        }
      ), l = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;
      function u(c, p) {
        p = (p || "").replace(/m/g, "") + "m";
        var d = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source.replace(/<<prop>>/g, function() {
          return o;
        }).replace(/<<value>>/g, function() {
          return c;
        });
        return RegExp(d, p);
      }
      a(u, "createValuePattern"), t.languages.yaml = {
        scalar: {
          pattern: RegExp(
            /([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source.replace(
              /<<prop>>/g,
              function() {
                return o;
              }
            )
          ),
          lookbehind: !0,
          alias: "string"
        },
        comment: /#.*/,
        key: {
          pattern: RegExp(
            /((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source.replace(/<<prop>>/g, function() {
              return o;
            }).replace(/<<key>>/g, function() {
              return "(?:" + i + "|" + l + ")";
            })
          ),
          lookbehind: !0,
          greedy: !0,
          alias: "atrule"
        },
        directive: {
          pattern: /(^[ \t]*)%.+/m,
          lookbehind: !0,
          alias: "important"
        },
        datetime: {
          pattern: u(
            /\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.
            source
          ),
          lookbehind: !0,
          alias: "number"
        },
        boolean: {
          pattern: u(/false|true/.source, "i"),
          lookbehind: !0,
          alias: "important"
        },
        null: {
          pattern: u(/null|~/.source, "i"),
          lookbehind: !0,
          alias: "important"
        },
        string: {
          pattern: u(l),
          lookbehind: !0,
          greedy: !0
        },
        number: {
          pattern: u(
            /[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source,
            "i"
          ),
          lookbehind: !0
        },
        tag: n,
        important: r,
        punctuation: /---|[:[\]{}\-,|>?]|\.\.\./
      }, t.languages.yml = t.languages.yaml;
    })(e);
  }
  a(iu, "yaml");
});

// ../node_modules/react-syntax-highlighter/dist/esm/languages/prism/yaml.js
var Eh, Rh, Sh = A(() => {
  Eh = Ee(Ch()), Rh = Eh.default;
});

// src/components/components/ActionBar/ActionBar.tsx
import Ah from "react";
import { styled as Fh } from "@storybook/core/theming";
var yw, kh, lu, su = A(() => {
  "use strict";
  yw = Fh.div(({ theme: e }) => ({
    position: "absolute",
    bottom: 0,
    right: 0,
    maxWidth: "100%",
    display: "flex",
    background: e.background.content,
    zIndex: 1
  })), kh = Fh.button(
    ({ theme: e }) => ({
      margin: 0,
      border: "0 none",
      padding: "4px 10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      color: e.color.defaultText,
      background: e.background.content,
      fontSize: 12,
      lineHeight: "16px",
      fontFamily: e.typography.fonts.base,
      fontWeight: e.typography.weight.bold,
      borderTop: `1px solid ${e.appBorderColor}`,
      borderLeft: `1px solid ${e.appBorderColor}`,
      marginLeft: -1,
      borderRadius: "4px 0 0 0",
      "&:not(:last-child)": { borderRight: `1px solid ${e.appBorderColor}` },
      "& + *": {
        borderLeft: `1px solid ${e.appBorderColor}`,
        borderRadius: 0
      },
      "&:focus": {
        boxShadow: `${e.color.secondary} 0 -3px 0 0 inset`,
        outline: "0 none"
      }
    }),
    ({ disabled: e }) => e && {
      cursor: "not-allowed",
      opacity: 0.5
    }
  );
  kh.displayName = "ActionButton";
  lu = /* @__PURE__ */ a(({ actionItems: e, ...t }) => /* @__PURE__ */ Ah.createElement(yw, { ...t }, e.map(({ title: r, className: n, onClick: o,
  disabled: i }, l) => /* @__PURE__ */ Ah.createElement(kh, { key: l, className: n, onClick: o, disabled: !!i }, r))), "ActionBar");
});

// ../node_modules/@radix-ui/react-compose-refs/dist/index.mjs
import * as Lh from "react";
function Dw(e, t) {
  typeof e == "function" ? e(t) : e != null && (e.current = t);
}
function uu(...e) {
  return (t) => e.forEach((r) => Dw(r, t));
}
function se(...e) {
  return Lh.useCallback(uu(...e), e);
}
var tr = A(() => {
  a(Dw, "setRef");
  a(uu, "composeRefs");
  a(se, "useComposedRefs");
});

// ../node_modules/@radix-ui/react-slot/dist/index.mjs
import * as Re from "react";
import { Fragment as xw, jsx as cu } from "react/jsx-runtime";
function Ew(e) {
  return Re.isValidElement(e) && e.type === Cw;
}
function Rw(e, t) {
  let r = { ...t };
  for (let n in t) {
    let o = e[n], i = t[n];
    /^on[A-Z]/.test(n) ? o && i ? r[n] = (...u) => {
      i(...u), o(...u);
    } : o && (r[n] = o) : n === "style" ? r[n] = { ...o, ...i } : n === "className" && (r[n] = [o, i].filter(Boolean).join(" "));
  }
  return { ...e, ...r };
}
function Sw(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning;
  return r ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning, r ? e.props.ref :
  e.props.ref || e.ref);
}
var Fr, pu, Cw, wi = A(() => {
  tr();
  Fr = Re.forwardRef((e, t) => {
    let { children: r, ...n } = e, o = Re.Children.toArray(r), i = o.find(Ew);
    if (i) {
      let l = i.props.children, u = o.map((c) => c === i ? Re.Children.count(l) > 1 ? Re.Children.only(null) : Re.isValidElement(l) ? l.props.
      children : null : c);
      return /* @__PURE__ */ cu(pu, { ...n, ref: t, children: Re.isValidElement(l) ? Re.cloneElement(l, void 0, u) : null });
    }
    return /* @__PURE__ */ cu(pu, { ...n, ref: t, children: r });
  });
  Fr.displayName = "Slot";
  pu = Re.forwardRef((e, t) => {
    let { children: r, ...n } = e;
    if (Re.isValidElement(r)) {
      let o = Sw(r);
      return Re.cloneElement(r, {
        ...Rw(n, r.props),
        // @ts-ignore
        ref: t ? uu(t, o) : o
      });
    }
    return Re.Children.count(r) > 1 ? Re.Children.only(null) : null;
  });
  pu.displayName = "SlotClone";
  Cw = /* @__PURE__ */ a(({ children: e }) => /* @__PURE__ */ cu(xw, { children: e }), "Slottable");
  a(Ew, "isSlottable");
  a(Rw, "mergeProps");
  a(Sw, "getElementRef");
});

// ../node_modules/@radix-ui/react-primitive/dist/index.mjs
import * as Th from "react";
import * as Bh from "react-dom";
import { jsx as Aw } from "react/jsx-runtime";
function Ih(e, t) {
  e && Bh.flushSync(() => e.dispatchEvent(t));
}
var Fw, pe, yn = A(() => {
  wi();
  Fw = [
    "a",
    "button",
    "div",
    "form",
    "h2",
    "h3",
    "img",
    "input",
    "label",
    "li",
    "nav",
    "ol",
    "p",
    "span",
    "svg",
    "ul"
  ], pe = Fw.reduce((e, t) => {
    let r = Th.forwardRef((n, o) => {
      let { asChild: i, ...l } = n, u = i ? Fr : t;
      return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ Aw(u, { ...l, ref: o });
    });
    return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
  }, {});
  a(Ih, "dispatchDiscreteCustomEvent");
});

// ../node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
import * as Mh from "react";
var et, Dn = A(() => {
  et = globalThis?.document ? Mh.useLayoutEffect : () => {
  };
});

// ../node_modules/@radix-ui/react-scroll-area/node_modules/@radix-ui/react-presence/dist/index.mjs
import * as $e from "react";
import * as _h from "react-dom";
import * as Ph from "react";
function kw(e, t) {
  return Ph.useReducer((r, n) => t[r][n] ?? r, e);
}
function Lw(e) {
  let [t, r] = $e.useState(), n = $e.useRef({}), o = $e.useRef(e), i = $e.useRef("none"), l = e ? "mounted" : "unmounted", [u, c] = kw(l, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return $e.useEffect(() => {
    let p = bi(n.current);
    i.current = u === "mounted" ? p : "none";
  }, [u]), et(() => {
    let p = n.current, d = o.current;
    if (d !== e) {
      let f = i.current, v = bi(p);
      e ? c("MOUNT") : v === "none" || p?.display === "none" ? c("UNMOUNT") : c(d && f !== v ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, c]), et(() => {
    if (t) {
      let p = /* @__PURE__ */ a((h) => {
        let v = bi(n.current).includes(h.animationName);
        h.target === t && v && _h.flushSync(() => c("ANIMATION_END"));
      }, "handleAnimationEnd"), d = /* @__PURE__ */ a((h) => {
        h.target === t && (i.current = bi(n.current));
      }, "handleAnimationStart");
      return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", p), t.addEventListener("animationend", p), () => {
        t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", p), t.removeEventListener("animationend", p);
      };
    } else
      c("ANIMATION_END");
  }, [t, c]), {
    isPresent: ["mounted", "unmountSuspended"].includes(u),
    ref: $e.useCallback((p) => {
      p && (n.current = getComputedStyle(p)), r(p);
    }, [])
  };
}
function bi(e) {
  return e?.animationName || "none";
}
function Tw(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning;
  return r ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning, r ? e.props.ref :
  e.props.ref || e.ref);
}
var xn, Hh = A(() => {
  "use client";
  tr();
  Dn();
  a(kw, "useStateMachine");
  xn = /* @__PURE__ */ a((e) => {
    let { present: t, children: r } = e, n = Lw(t), o = typeof r == "function" ? r({ present: n.isPresent }) : $e.Children.only(r), i = se(n.
    ref, Tw(o));
    return typeof r == "function" || n.isPresent ? $e.cloneElement(o, { ref: i }) : null;
  }, "Presence");
  xn.displayName = "Presence";
  a(Lw, "usePresence");
  a(bi, "getAnimationName");
  a(Tw, "getElementRef");
});

// ../node_modules/@radix-ui/react-scroll-area/node_modules/@radix-ui/react-context/dist/index.mjs
import * as Mt from "react";
import { jsx as Bw } from "react/jsx-runtime";
function zh(e, t = []) {
  let r = [];
  function n(i, l) {
    let u = Mt.createContext(l), c = r.length;
    r = [...r, l];
    function p(h) {
      let { scope: f, children: v, ...b } = h, m = f?.[e][c] || u, g = Mt.useMemo(() => b, Object.values(b));
      return /* @__PURE__ */ Bw(m.Provider, { value: g, children: v });
    }
    a(p, "Provider");
    function d(h, f) {
      let v = f?.[e][c] || u, b = Mt.useContext(v);
      if (b) return b;
      if (l !== void 0) return l;
      throw new Error(`\`${h}\` must be used within \`${i}\``);
    }
    return a(d, "useContext2"), p.displayName = i + "Provider", [p, d];
  }
  a(n, "createContext3");
  let o = /* @__PURE__ */ a(() => {
    let i = r.map((l) => Mt.createContext(l));
    return /* @__PURE__ */ a(function(u) {
      let c = u?.[e] || i;
      return Mt.useMemo(
        () => ({ [`__scope${e}`]: { ...u, [e]: c } }),
        [u, c]
      );
    }, "useScope");
  }, "createScope");
  return o.scopeName = e, [n, Iw(o, ...t)];
}
function Iw(...e) {
  let t = e[0];
  if (e.length === 1) return t;
  let r = /* @__PURE__ */ a(() => {
    let n = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return /* @__PURE__ */ a(function(i) {
      let l = n.reduce((u, { useScope: c, scopeName: p }) => {
        let h = c(i)[`__scope${p}`];
        return { ...u, ...h };
      }, {});
      return Mt.useMemo(() => ({ [`__scope${t.scopeName}`]: l }), [l]);
    }, "useComposedScopes");
  }, "createScope");
  return r.scopeName = t.scopeName, r;
}
var Oh = A(() => {
  a(zh, "createContextScope");
  a(Iw, "composeContextScopes");
});

// ../node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
import * as Cn from "react";
function de(e) {
  let t = Cn.useRef(e);
  return Cn.useEffect(() => {
    t.current = e;
  }), Cn.useMemo(() => (...r) => t.current?.(...r), []);
}
var En = A(() => {
  a(de, "useCallbackRef");
});

// ../node_modules/@radix-ui/react-direction/dist/index.mjs
import * as yi from "react";
import { jsx as Xz } from "react/jsx-runtime";
function Nh(e) {
  let t = yi.useContext(Mw);
  return e || t || "ltr";
}
var Mw, $h = A(() => {
  Mw = yi.createContext(void 0);
  a(Nh, "useDirection");
});

// ../node_modules/@radix-ui/number/dist/index.mjs
function jh(e, [t, r]) {
  return Math.min(r, Math.max(t, e));
}
var Vh = A(() => {
  a(jh, "clamp");
});

// ../node_modules/@radix-ui/primitive/dist/index.mjs
function we(e, t, { checkForDefaultPrevented: r = !0 } = {}) {
  return /* @__PURE__ */ a(function(o) {
    if (e?.(o), r === !1 || !o.defaultPrevented)
      return t?.(o);
  }, "handleEvent");
}
var Di = A(() => {
  a(we, "composeEventHandlers");
});

// ../node_modules/@radix-ui/react-scroll-area/dist/index.mjs
import * as B from "react";
import * as qh from "react";
import { Fragment as Pw, jsx as Y, jsxs as Hw } from "react/jsx-runtime";
function _w(e, t) {
  return qh.useReducer((r, n) => t[r][n] ?? r, e);
}
function Ci(e) {
  return e ? parseInt(e, 10) : 0;
}
function r5(e, t) {
  let r = e / t;
  return isNaN(r) ? 0 : r;
}
function Ei(e) {
  let t = r5(e.viewport, e.content), r = e.scrollbar.paddingStart + e.scrollbar.paddingEnd, n = (e.scrollbar.size - r) * t;
  return Math.max(n, 18);
}
function Uw(e, t, r, n = "ltr") {
  let o = Ei(r), i = o / 2, l = t || i, u = o - l, c = r.scrollbar.paddingStart + l, p = r.scrollbar.size - r.scrollbar.paddingEnd - u, d = r.
  content - r.viewport, h = n === "ltr" ? [0, d] : [d * -1, 0];
  return n5([c, p], h)(e);
}
function Wh(e, t, r = "ltr") {
  let n = Ei(t), o = t.scrollbar.paddingStart + t.scrollbar.paddingEnd, i = t.scrollbar.size - o, l = t.content - t.viewport, u = i - n, c = r ===
  "ltr" ? [0, l] : [l * -1, 0], p = jh(e, c);
  return n5([0, l], [0, u])(p);
}
function n5(e, t) {
  return (r) => {
    if (e[0] === e[1] || t[0] === t[1]) return t[0];
    let n = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + n * (r - e[0]);
  };
}
function o5(e, t) {
  return e > 0 && e < t;
}
function Ri(e, t) {
  let r = de(e), n = B.useRef(0);
  return B.useEffect(() => () => window.clearTimeout(n.current), []), B.useCallback(() => {
    window.clearTimeout(n.current), n.current = window.setTimeout(r, t);
  }, [r, t]);
}
function Rn(e, t) {
  let r = de(t);
  et(() => {
    let n = 0;
    if (e) {
      let o = new ResizeObserver(() => {
        cancelAnimationFrame(n), n = window.requestAnimationFrame(r);
      });
      return o.observe(e), () => {
        window.cancelAnimationFrame(n), o.unobserve(e);
      };
    }
  }, [e, r]);
}
function Yw(e, t) {
  let { asChild: r, children: n } = e;
  if (!r) return typeof t == "function" ? t(n) : t;
  let o = B.Children.only(n);
  return B.cloneElement(o, {
    children: typeof t == "function" ? t(o.props.children) : t
  });
}
var du, Uh, dO, zw, tt, Gh, Yh, Xh, Ct, Kh, Ow, Nw, Zh, fu, $w, jw, Vw, Jh, Qh, xi, e5, Ww, hu, t5, qw, Gw, a5, i5, l5, s5, u5, c5 = A(() => {
  "use client";
  yn();
  Hh();
  Oh();
  tr();
  En();
  $h();
  Dn();
  Vh();
  Di();
  a(_w, "useStateMachine");
  du = "ScrollArea", [Uh, dO] = zh(du), [zw, tt] = Uh(du), Gh = B.forwardRef(
    (e, t) => {
      let {
        __scopeScrollArea: r,
        type: n = "hover",
        dir: o,
        scrollHideDelay: i = 600,
        ...l
      } = e, [u, c] = B.useState(null), [p, d] = B.useState(null), [h, f] = B.useState(null), [v, b] = B.useState(null), [m, g] = B.useState(
      null), [y, w] = B.useState(0), [D, x] = B.useState(0), [C, E] = B.useState(!1), [R, F] = B.useState(!1), S = se(t, (I) => c(I)), k = Nh(
      o);
      return /* @__PURE__ */ Y(
        zw,
        {
          scope: r,
          type: n,
          dir: k,
          scrollHideDelay: i,
          scrollArea: u,
          viewport: p,
          onViewportChange: d,
          content: h,
          onContentChange: f,
          scrollbarX: v,
          onScrollbarXChange: b,
          scrollbarXEnabled: C,
          onScrollbarXEnabledChange: E,
          scrollbarY: m,
          onScrollbarYChange: g,
          scrollbarYEnabled: R,
          onScrollbarYEnabledChange: F,
          onCornerWidthChange: w,
          onCornerHeightChange: x,
          children: /* @__PURE__ */ Y(
            pe.div,
            {
              dir: k,
              ...l,
              ref: S,
              style: {
                position: "relative",
                // Pass corner sizes as CSS vars to reduce re-renders of context consumers
                "--radix-scroll-area-corner-width": y + "px",
                "--radix-scroll-area-corner-height": D + "px",
                ...e.style
              }
            }
          )
        }
      );
    }
  );
  Gh.displayName = du;
  Yh = "ScrollAreaViewport", Xh = B.forwardRef(
    (e, t) => {
      let { __scopeScrollArea: r, children: n, asChild: o, nonce: i, ...l } = e, u = tt(Yh, r), c = B.useRef(null), p = se(t, c, u.onViewportChange);
      return /* @__PURE__ */ Hw(Pw, { children: [
        /* @__PURE__ */ Y(
          "style",
          {
            dangerouslySetInnerHTML: {
              __html: `
[data-radix-scroll-area-viewport] {
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}
[data-radix-scroll-area-viewport]::-webkit-scrollbar {
  display: none;
}
:where([data-radix-scroll-area-viewport]) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
:where([data-radix-scroll-area-content]) {
  flex-grow: 1;
}
`
            },
            nonce: i
          }
        ),
        /* @__PURE__ */ Y(
          pe.div,
          {
            "data-radix-scroll-area-viewport": "",
            ...l,
            asChild: o,
            ref: p,
            style: {
              /**
               * We don't support `visible` because the intention is to have at least one scrollbar
               * if this component is used and `visible` will behave like `auto` in that case
               * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow#description
               *
               * We don't handle `auto` because the intention is for the native implementation
               * to be hidden if using this component. We just want to ensure the node is scrollable
               * so could have used either `scroll` or `auto` here. We picked `scroll` to prevent
               * the browser from having to work out whether to render native scrollbars or not,
               * we tell it to with the intention of hiding them in CSS.
               */
              overflowX: u.scrollbarXEnabled ? "scroll" : "hidden",
              overflowY: u.scrollbarYEnabled ? "scroll" : "hidden",
              ...e.style
            },
            children: Yw({ asChild: o, children: n }, (d) => /* @__PURE__ */ Y(
              "div",
              {
                "data-radix-scroll-area-content": "",
                ref: u.onContentChange,
                style: { minWidth: u.scrollbarXEnabled ? "fit-content" : void 0 },
                children: d
              }
            ))
          }
        )
      ] });
    }
  );
  Xh.displayName = Yh;
  Ct = "ScrollAreaScrollbar", Kh = B.forwardRef(
    (e, t) => {
      let { forceMount: r, ...n } = e, o = tt(Ct, e.__scopeScrollArea), { onScrollbarXEnabledChange: i, onScrollbarYEnabledChange: l } = o, u = e.
      orientation === "horizontal";
      return B.useEffect(() => (u ? i(!0) : l(!0), () => {
        u ? i(!1) : l(!1);
      }), [u, i, l]), o.type === "hover" ? /* @__PURE__ */ Y(Ow, { ...n, ref: t, forceMount: r }) : o.type === "scroll" ? /* @__PURE__ */ Y(
      Nw, { ...n, ref: t, forceMount: r }) : o.type === "auto" ? /* @__PURE__ */ Y(Zh, { ...n, ref: t, forceMount: r }) : o.type === "always" ?
      /* @__PURE__ */ Y(fu, { ...n, ref: t }) : null;
    }
  );
  Kh.displayName = Ct;
  Ow = B.forwardRef((e, t) => {
    let { forceMount: r, ...n } = e, o = tt(Ct, e.__scopeScrollArea), [i, l] = B.useState(!1);
    return B.useEffect(() => {
      let u = o.scrollArea, c = 0;
      if (u) {
        let p = /* @__PURE__ */ a(() => {
          window.clearTimeout(c), l(!0);
        }, "handlePointerEnter"), d = /* @__PURE__ */ a(() => {
          c = window.setTimeout(() => l(!1), o.scrollHideDelay);
        }, "handlePointerLeave");
        return u.addEventListener("pointerenter", p), u.addEventListener("pointerleave", d), () => {
          window.clearTimeout(c), u.removeEventListener("pointerenter", p), u.removeEventListener("pointerleave", d);
        };
      }
    }, [o.scrollArea, o.scrollHideDelay]), /* @__PURE__ */ Y(xn, { present: r || i, children: /* @__PURE__ */ Y(
      Zh,
      {
        "data-state": i ? "visible" : "hidden",
        ...n,
        ref: t
      }
    ) });
  }), Nw = B.forwardRef((e, t) => {
    let { forceMount: r, ...n } = e, o = tt(Ct, e.__scopeScrollArea), i = e.orientation === "horizontal", l = Ri(() => c("SCROLL_END"), 100),
    [u, c] = _w("hidden", {
      hidden: {
        SCROLL: "scrolling"
      },
      scrolling: {
        SCROLL_END: "idle",
        POINTER_ENTER: "interacting"
      },
      interacting: {
        SCROLL: "interacting",
        POINTER_LEAVE: "idle"
      },
      idle: {
        HIDE: "hidden",
        SCROLL: "scrolling",
        POINTER_ENTER: "interacting"
      }
    });
    return B.useEffect(() => {
      if (u === "idle") {
        let p = window.setTimeout(() => c("HIDE"), o.scrollHideDelay);
        return () => window.clearTimeout(p);
      }
    }, [u, o.scrollHideDelay, c]), B.useEffect(() => {
      let p = o.viewport, d = i ? "scrollLeft" : "scrollTop";
      if (p) {
        let h = p[d], f = /* @__PURE__ */ a(() => {
          let v = p[d];
          h !== v && (c("SCROLL"), l()), h = v;
        }, "handleScroll");
        return p.addEventListener("scroll", f), () => p.removeEventListener("scroll", f);
      }
    }, [o.viewport, i, c, l]), /* @__PURE__ */ Y(xn, { present: r || u !== "hidden", children: /* @__PURE__ */ Y(
      fu,
      {
        "data-state": u === "hidden" ? "hidden" : "visible",
        ...n,
        ref: t,
        onPointerEnter: we(e.onPointerEnter, () => c("POINTER_ENTER")),
        onPointerLeave: we(e.onPointerLeave, () => c("POINTER_LEAVE"))
      }
    ) });
  }), Zh = B.forwardRef((e, t) => {
    let r = tt(Ct, e.__scopeScrollArea), { forceMount: n, ...o } = e, [i, l] = B.useState(!1), u = e.orientation === "horizontal", c = Ri(() => {
      if (r.viewport) {
        let p = r.viewport.offsetWidth < r.viewport.scrollWidth, d = r.viewport.offsetHeight < r.viewport.scrollHeight;
        l(u ? p : d);
      }
    }, 10);
    return Rn(r.viewport, c), Rn(r.content, c), /* @__PURE__ */ Y(xn, { present: n || i, children: /* @__PURE__ */ Y(
      fu,
      {
        "data-state": i ? "visible" : "hidden",
        ...o,
        ref: t
      }
    ) });
  }), fu = B.forwardRef((e, t) => {
    let { orientation: r = "vertical", ...n } = e, o = tt(Ct, e.__scopeScrollArea), i = B.useRef(null), l = B.useRef(0), [u, c] = B.useState(
    {
      content: 0,
      viewport: 0,
      scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 }
    }), p = r5(u.viewport, u.content), d = {
      ...n,
      sizes: u,
      onSizesChange: c,
      hasThumb: p > 0 && p < 1,
      onThumbChange: /* @__PURE__ */ a((f) => i.current = f, "onThumbChange"),
      onThumbPointerUp: /* @__PURE__ */ a(() => l.current = 0, "onThumbPointerUp"),
      onThumbPointerDown: /* @__PURE__ */ a((f) => l.current = f, "onThumbPointerDown")
    };
    function h(f, v) {
      return Uw(f, l.current, u, v);
    }
    return a(h, "getScrollPosition"), r === "horizontal" ? /* @__PURE__ */ Y(
      $w,
      {
        ...d,
        ref: t,
        onThumbPositionChange: /* @__PURE__ */ a(() => {
          if (o.viewport && i.current) {
            let f = o.viewport.scrollLeft, v = Wh(f, u, o.dir);
            i.current.style.transform = `translate3d(${v}px, 0, 0)`;
          }
        }, "onThumbPositionChange"),
        onWheelScroll: /* @__PURE__ */ a((f) => {
          o.viewport && (o.viewport.scrollLeft = f);
        }, "onWheelScroll"),
        onDragScroll: /* @__PURE__ */ a((f) => {
          o.viewport && (o.viewport.scrollLeft = h(f, o.dir));
        }, "onDragScroll")
      }
    ) : r === "vertical" ? /* @__PURE__ */ Y(
      jw,
      {
        ...d,
        ref: t,
        onThumbPositionChange: /* @__PURE__ */ a(() => {
          if (o.viewport && i.current) {
            let f = o.viewport.scrollTop, v = Wh(f, u);
            i.current.style.transform = `translate3d(0, ${v}px, 0)`;
          }
        }, "onThumbPositionChange"),
        onWheelScroll: /* @__PURE__ */ a((f) => {
          o.viewport && (o.viewport.scrollTop = f);
        }, "onWheelScroll"),
        onDragScroll: /* @__PURE__ */ a((f) => {
          o.viewport && (o.viewport.scrollTop = h(f));
        }, "onDragScroll")
      }
    ) : null;
  }), $w = B.forwardRef((e, t) => {
    let { sizes: r, onSizesChange: n, ...o } = e, i = tt(Ct, e.__scopeScrollArea), [l, u] = B.useState(), c = B.useRef(null), p = se(t, c, i.
    onScrollbarXChange);
    return B.useEffect(() => {
      c.current && u(getComputedStyle(c.current));
    }, [c]), /* @__PURE__ */ Y(
      Qh,
      {
        "data-orientation": "horizontal",
        ...o,
        ref: p,
        sizes: r,
        style: {
          bottom: 0,
          left: i.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
          right: i.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
          "--radix-scroll-area-thumb-width": Ei(r) + "px",
          ...e.style
        },
        onThumbPointerDown: /* @__PURE__ */ a((d) => e.onThumbPointerDown(d.x), "onThumbPointerDown"),
        onDragScroll: /* @__PURE__ */ a((d) => e.onDragScroll(d.x), "onDragScroll"),
        onWheelScroll: /* @__PURE__ */ a((d, h) => {
          if (i.viewport) {
            let f = i.viewport.scrollLeft + d.deltaX;
            e.onWheelScroll(f), o5(f, h) && d.preventDefault();
          }
        }, "onWheelScroll"),
        onResize: /* @__PURE__ */ a(() => {
          c.current && i.viewport && l && n({
            content: i.viewport.scrollWidth,
            viewport: i.viewport.offsetWidth,
            scrollbar: {
              size: c.current.clientWidth,
              paddingStart: Ci(l.paddingLeft),
              paddingEnd: Ci(l.paddingRight)
            }
          });
        }, "onResize")
      }
    );
  }), jw = B.forwardRef((e, t) => {
    let { sizes: r, onSizesChange: n, ...o } = e, i = tt(Ct, e.__scopeScrollArea), [l, u] = B.useState(), c = B.useRef(null), p = se(t, c, i.
    onScrollbarYChange);
    return B.useEffect(() => {
      c.current && u(getComputedStyle(c.current));
    }, [c]), /* @__PURE__ */ Y(
      Qh,
      {
        "data-orientation": "vertical",
        ...o,
        ref: p,
        sizes: r,
        style: {
          top: 0,
          right: i.dir === "ltr" ? 0 : void 0,
          left: i.dir === "rtl" ? 0 : void 0,
          bottom: "var(--radix-scroll-area-corner-height)",
          "--radix-scroll-area-thumb-height": Ei(r) + "px",
          ...e.style
        },
        onThumbPointerDown: /* @__PURE__ */ a((d) => e.onThumbPointerDown(d.y), "onThumbPointerDown"),
        onDragScroll: /* @__PURE__ */ a((d) => e.onDragScroll(d.y), "onDragScroll"),
        onWheelScroll: /* @__PURE__ */ a((d, h) => {
          if (i.viewport) {
            let f = i.viewport.scrollTop + d.deltaY;
            e.onWheelScroll(f), o5(f, h) && d.preventDefault();
          }
        }, "onWheelScroll"),
        onResize: /* @__PURE__ */ a(() => {
          c.current && i.viewport && l && n({
            content: i.viewport.scrollHeight,
            viewport: i.viewport.offsetHeight,
            scrollbar: {
              size: c.current.clientHeight,
              paddingStart: Ci(l.paddingTop),
              paddingEnd: Ci(l.paddingBottom)
            }
          });
        }, "onResize")
      }
    );
  }), [Vw, Jh] = Uh(Ct), Qh = B.forwardRef((e, t) => {
    let {
      __scopeScrollArea: r,
      sizes: n,
      hasThumb: o,
      onThumbChange: i,
      onThumbPointerUp: l,
      onThumbPointerDown: u,
      onThumbPositionChange: c,
      onDragScroll: p,
      onWheelScroll: d,
      onResize: h,
      ...f
    } = e, v = tt(Ct, r), [b, m] = B.useState(null), g = se(t, (S) => m(S)), y = B.useRef(null), w = B.useRef(""), D = v.viewport, x = n.content -
    n.viewport, C = de(d), E = de(c), R = Ri(h, 10);
    function F(S) {
      if (y.current) {
        let k = S.clientX - y.current.left, I = S.clientY - y.current.top;
        p({ x: k, y: I });
      }
    }
    return a(F, "handleDragScroll"), B.useEffect(() => {
      let S = /* @__PURE__ */ a((k) => {
        let I = k.target;
        b?.contains(I) && C(k, x);
      }, "handleWheel");
      return document.addEventListener("wheel", S, { passive: !1 }), () => document.removeEventListener("wheel", S, { passive: !1 });
    }, [D, b, x, C]), B.useEffect(E, [n, E]), Rn(b, R), Rn(v.content, R), /* @__PURE__ */ Y(
      Vw,
      {
        scope: r,
        scrollbar: b,
        hasThumb: o,
        onThumbChange: de(i),
        onThumbPointerUp: de(l),
        onThumbPositionChange: E,
        onThumbPointerDown: de(u),
        children: /* @__PURE__ */ Y(
          pe.div,
          {
            ...f,
            ref: g,
            style: { position: "absolute", ...f.style },
            onPointerDown: we(e.onPointerDown, (S) => {
              S.button === 0 && (S.target.setPointerCapture(S.pointerId), y.current = b.getBoundingClientRect(), w.current = document.body.style.
              webkitUserSelect, document.body.style.webkitUserSelect = "none", v.viewport && (v.viewport.style.scrollBehavior = "auto"), F(S));
            }),
            onPointerMove: we(e.onPointerMove, F),
            onPointerUp: we(e.onPointerUp, (S) => {
              let k = S.target;
              k.hasPointerCapture(S.pointerId) && k.releasePointerCapture(S.pointerId), document.body.style.webkitUserSelect = w.current, v.
              viewport && (v.viewport.style.scrollBehavior = ""), y.current = null;
            })
          }
        )
      }
    );
  }), xi = "ScrollAreaThumb", e5 = B.forwardRef(
    (e, t) => {
      let { forceMount: r, ...n } = e, o = Jh(xi, e.__scopeScrollArea);
      return /* @__PURE__ */ Y(xn, { present: r || o.hasThumb, children: /* @__PURE__ */ Y(Ww, { ref: t, ...n }) });
    }
  ), Ww = B.forwardRef(
    (e, t) => {
      let { __scopeScrollArea: r, style: n, ...o } = e, i = tt(xi, r), l = Jh(xi, r), { onThumbPositionChange: u } = l, c = se(
        t,
        (h) => l.onThumbChange(h)
      ), p = B.useRef(), d = Ri(() => {
        p.current && (p.current(), p.current = void 0);
      }, 100);
      return B.useEffect(() => {
        let h = i.viewport;
        if (h) {
          let f = /* @__PURE__ */ a(() => {
            if (d(), !p.current) {
              let v = Gw(h, u);
              p.current = v, u();
            }
          }, "handleScroll");
          return u(), h.addEventListener("scroll", f), () => h.removeEventListener("scroll", f);
        }
      }, [i.viewport, d, u]), /* @__PURE__ */ Y(
        pe.div,
        {
          "data-state": l.hasThumb ? "visible" : "hidden",
          ...o,
          ref: c,
          style: {
            width: "var(--radix-scroll-area-thumb-width)",
            height: "var(--radix-scroll-area-thumb-height)",
            ...n
          },
          onPointerDownCapture: we(e.onPointerDownCapture, (h) => {
            let v = h.target.getBoundingClientRect(), b = h.clientX - v.left, m = h.clientY - v.top;
            l.onThumbPointerDown({ x: b, y: m });
          }),
          onPointerUp: we(e.onPointerUp, l.onThumbPointerUp)
        }
      );
    }
  );
  e5.displayName = xi;
  hu = "ScrollAreaCorner", t5 = B.forwardRef(
    (e, t) => {
      let r = tt(hu, e.__scopeScrollArea), n = !!(r.scrollbarX && r.scrollbarY);
      return r.type !== "scroll" && n ? /* @__PURE__ */ Y(qw, { ...e, ref: t }) : null;
    }
  );
  t5.displayName = hu;
  qw = B.forwardRef((e, t) => {
    let { __scopeScrollArea: r, ...n } = e, o = tt(hu, r), [i, l] = B.useState(0), [u, c] = B.useState(0), p = !!(i && u);
    return Rn(o.scrollbarX, () => {
      let d = o.scrollbarX?.offsetHeight || 0;
      o.onCornerHeightChange(d), c(d);
    }), Rn(o.scrollbarY, () => {
      let d = o.scrollbarY?.offsetWidth || 0;
      o.onCornerWidthChange(d), l(d);
    }), p ? /* @__PURE__ */ Y(
      pe.div,
      {
        ...n,
        ref: t,
        style: {
          width: i,
          height: u,
          position: "absolute",
          right: o.dir === "ltr" ? 0 : void 0,
          left: o.dir === "rtl" ? 0 : void 0,
          bottom: 0,
          ...e.style
        }
      }
    ) : null;
  });
  a(Ci, "toInt");
  a(r5, "getThumbRatio");
  a(Ei, "getThumbSize");
  a(Uw, "getScrollPositionFromPointer");
  a(Wh, "getThumbOffsetFromScroll");
  a(n5, "linearScale");
  a(o5, "isScrollingWithinScrollbarBounds");
  Gw = /* @__PURE__ */ a((e, t = () => {
  }) => {
    let r = { left: e.scrollLeft, top: e.scrollTop }, n = 0;
    return (/* @__PURE__ */ a(function o() {
      let i = { left: e.scrollLeft, top: e.scrollTop }, l = r.left !== i.left, u = r.top !== i.top;
      (l || u) && t(), r = i, n = window.requestAnimationFrame(o);
    }, "loop"))(), () => window.cancelAnimationFrame(n);
  }, "addUnlinkedScrollListener");
  a(Ri, "useDebounceCallback");
  a(Rn, "useResizeObserver");
  a(Yw, "getSubtree");
  a5 = Gh, i5 = Xh, l5 = Kh, s5 = e5, u5 = t5;
});

// src/components/components/ScrollArea/ScrollArea.tsx
import kr, { forwardRef as Kw } from "react";
import { styled as Si } from "@storybook/core/theming";
var Zw, Jw, p5, d5, Sn, Ai = A(() => {
  "use strict";
  c5();
  Zw = Si(a5)(
    ({ scrollbarsize: e, offset: t }) => ({
      width: "100%",
      height: "100%",
      overflow: "hidden",
      "--scrollbar-size": `${e + t}px`,
      "--radix-scroll-area-thumb-width": `${e}px`
    })
  ), Jw = Si(i5)({
    width: "100%",
    height: "100%"
  }), p5 = Si(l5)(({ offset: e, horizontal: t, vertical: r }) => ({
    display: "flex",
    userSelect: "none",
    // ensures no selection
    touchAction: "none",
    // disable browser handling of all panning and zooming gestures on touch devices
    background: "transparent",
    transition: "all 0.2s ease-out",
    borderRadius: "var(--scrollbar-size)",
    zIndex: 1,
    '&[data-orientation="vertical"]': {
      width: "var(--scrollbar-size)",
      paddingRight: e,
      marginTop: e,
      marginBottom: t === "true" && r === "true" ? 0 : e
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "column",
      height: "var(--scrollbar-size)",
      paddingBottom: e,
      marginLeft: e,
      marginRight: t === "true" && r === "true" ? 0 : e
    }
  })), d5 = Si(s5)(({ theme: e }) => ({
    flex: 1,
    background: e.textMutedColor,
    opacity: 0.5,
    borderRadius: "var(--scrollbar-size)",
    position: "relative",
    transition: "opacity 0.2s ease-out",
    "&:hover": { opacity: 0.8 },
    /* increase target size for touch devices https://www.w3.org/WAI/WCAG21/Understanding/target-size.html */
    "::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: "100%",
      height: "100%"
    }
  })), Sn = Kw(
    ({ children: e, horizontal: t = !1, vertical: r = !1, offset: n = 2, scrollbarSize: o = 6, className: i }, l) => /* @__PURE__ */ kr.createElement(
    Zw, { scrollbarsize: o, offset: n, className: i }, /* @__PURE__ */ kr.createElement(Jw, { ref: l }, e), t && /* @__PURE__ */ kr.createElement(
      p5,
      {
        orientation: "horizontal",
        offset: n,
        horizontal: t.toString(),
        vertical: r.toString()
      },
      /* @__PURE__ */ kr.createElement(d5, null)
    ), r && /* @__PURE__ */ kr.createElement(
      p5,
      {
        orientation: "vertical",
        offset: n,
        horizontal: t.toString(),
        vertical: r.toString()
      },
      /* @__PURE__ */ kr.createElement(d5, null)
    ), t && r && /* @__PURE__ */ kr.createElement(u5, null))
  );
  Sn.displayName = "ScrollArea";
});

// src/components/components/syntaxhighlighter/syntaxhighlighter.tsx
var gu = {};
dn(gu, {
  SyntaxHighlighter: () => ma,
  createCopyToClipboardFunction: () => mu,
  default: () => db,
  supportedLanguages: () => g5
});
import ha, { useCallback as Qw, useEffect as eb, useState as f5 } from "react";
import { styled as Fi } from "@storybook/core/theming";
import { logger as tb } from "@storybook/core/client-logger";
function mu() {
  return h5?.clipboard ? (e) => h5.clipboard.writeText(e) : async (e) => {
    let t = fa.createElement("TEXTAREA"), r = fa.activeElement;
    t.value = e, fa.body.appendChild(t), t.select(), fa.execCommand("copy"), fa.body.removeChild(t), r.focus();
  };
}
var m5, h5, fa, rb, g5, nb, ob, ab, ib, lb, sb, ub, v5, cb, pb, ma, db, ga = A(() => {
  "use strict";
  ii();
  m5 = Ee(la(), 1);
  Tf();
  Pf();
  Of();
  Wf();
  Xf();
  eh();
  oh();
  uh();
  dh();
  wh();
  Dh();
  Sh();
  Lf();
  su();
  Ai();
  ({ navigator: h5, document: fa, window: rb } = fn), g5 = {
    jsextra: Yf,
    jsx: nh,
    json: Qf,
    yml: Rh,
    md: sh,
    bash: _f,
    css: zf,
    html: ph,
    tsx: vh,
    typescript: yh,
    graphql: Vf
  };
  Object.entries(g5).forEach(([e, t]) => {
    vi.registerLanguage(e, t);
  });
  nb = (0, m5.default)(2)(
    (e) => Object.entries(e.code || {}).reduce((t, [r, n]) => ({ ...t, [`* .${r}`]: n }), {})
  ), ob = mu();
  a(mu, "createCopyToClipboardFunction");
  ab = Fi.div(
    ({ theme: e }) => ({
      position: "relative",
      overflow: "hidden",
      color: e.color.defaultText
    }),
    ({ theme: e, bordered: t }) => t ? {
      border: `1px solid ${e.appBorderColor}`,
      borderRadius: e.borderRadius,
      background: e.background.content
    } : {},
    ({ showLineNumbers: e }) => e ? {
      // use the before pseudo element to display line numbers
      ".react-syntax-highlighter-line-number::before": {
        content: "attr(data-line-number)"
      }
    } : {}
  ), ib = /* @__PURE__ */ a(({ children: e, className: t }) => /* @__PURE__ */ ha.createElement(Sn, { horizontal: !0, vertical: !0, className: t },
  e), "UnstyledScroller"), lb = Fi(ib)(
    {
      position: "relative"
    },
    ({ theme: e }) => nb(e)
  ), sb = Fi.pre(({ theme: e, padded: t }) => ({
    display: "flex",
    justifyContent: "flex-start",
    margin: 0,
    padding: t ? e.layoutMargin : 0
  })), ub = Fi.div(({ theme: e }) => ({
    flex: 1,
    paddingLeft: 2,
    // TODO: To match theming/global.ts for now
    paddingRight: e.layoutMargin,
    opacity: 1,
    fontFamily: e.typography.fonts.mono
  })), v5 = /* @__PURE__ */ a((e) => {
    let t = [...e.children], r = t[0], n = r.children[0].value, o = {
      ...r,
      // empty the line-number element
      children: [],
      properties: {
        ...r.properties,
        // add a data-line-number attribute to line-number element, so we can access the line number with `content: attr(data-line-number)`
        "data-line-number": n,
        // remove the 'userSelect: none' style, which will produce extra empty lines when copy-pasting in firefox
        style: { ...r.properties.style, userSelect: "auto" }
      }
    };
    return t[0] = o, { ...e, children: t };
  }, "processLineNumber"), cb = /* @__PURE__ */ a(({ rows: e, stylesheet: t, useInlineStyles: r }) => e.map((n, o) => Er({
    node: v5(n),
    stylesheet: t,
    useInlineStyles: r,
    key: `code-segement${o}`
  })), "defaultRenderer"), pb = /* @__PURE__ */ a((e, t) => t ? e ? ({ rows: r, ...n }) => e({ rows: r.map((o) => v5(o)), ...n }) : cb : e, "\
wrapRenderer"), ma = /* @__PURE__ */ a(({
    children: e,
    language: t = "jsx",
    copyable: r = !1,
    bordered: n = !1,
    padded: o = !1,
    format: i = !0,
    formatter: l = void 0,
    className: u = void 0,
    showLineNumbers: c = !1,
    ...p
  }) => {
    if (typeof e != "string" || !e.trim())
      return null;
    let [d, h] = f5("");
    eb(() => {
      l ? l(i, e).then(h) : h(e.trim());
    }, [e, i, l]);
    let [f, v] = f5(!1), b = Qw(
      (g) => {
        g.preventDefault(), ob(d).then(() => {
          v(!0), rb.setTimeout(() => v(!1), 1500);
        }).catch(tb.error);
      },
      [d]
    ), m = pb(p.renderer, c);
    return /* @__PURE__ */ ha.createElement(
      ab,
      {
        bordered: n,
        padded: o,
        showLineNumbers: c,
        className: u
      },
      /* @__PURE__ */ ha.createElement(lb, null, /* @__PURE__ */ ha.createElement(
        vi,
        {
          padded: o || n,
          language: t,
          showLineNumbers: c,
          showInlineLineNumbers: c,
          useInlineStyles: !1,
          PreTag: sb,
          CodeTag: ub,
          lineNumberContainerStyle: {},
          ...p,
          renderer: m
        },
        d
      )),
      r ? /* @__PURE__ */ ha.createElement(lu, { actionItems: [{ title: f ? "Copied" : "Copy", onClick: b }] }) : null
    );
  }, "SyntaxHighlighter");
  ma.registerLanguage = (...e) => vi.registerLanguage(...e);
  db = ma;
});

// ../node_modules/prettier/plugins/html.mjs
function yx(e) {
  if (typeof e == "string") return ec;
  if (Array.isArray(e)) return tc;
  if (!e) return;
  let { type: t } = e;
  if (r2.has(t)) return t;
}
function xx(e) {
  let t = e === null ? "null" : typeof e;
  if (t !== "string" && t !== "object") return `Unexpected doc '${t}', 
Expected it to be 'string' or 'object'.`;
  if (lc(e)) throw new Error("doc is valid.");
  let r = Object.prototype.toString.call(e);
  if (r !== "[object Object]") return `Unexpected doc '${r}'.`;
  let n = Dx([...r2].map((o) => `'${o}'`));
  return `Unexpected doc.type '${e.type}'.
Expected it to be ${n}.`;
}
function St(e) {
  return _r(e), { type: Vi, contents: e };
}
function a2(e, t) {
  return _r(t), { type: Wi, contents: t, n: e };
}
function fe(e, t = {}) {
  return _r(e), sc(t.expandedStates, !0), { type: Ea, id: t.id, contents: e, break: !!t.shouldBreak, expandedStates: t.expandedStates };
}
function Ex(e) {
  return a2(Number.NEGATIVE_INFINITY, e);
}
function Rx(e) {
  return a2({ type: "root" }, e);
}
function i2(e) {
  return sc(e), { type: qi, parts: e };
}
function Pi(e, t = "", r = {}) {
  return _r(e), t !== "" && _r(t), { type: Ui, breakContents: e, flatContents: t, groupId: r.groupId };
}
function Sx(e, t) {
  return _r(e), { type: Gi, contents: e, groupId: t.groupId, negate: t.negate };
}
function io(e, t) {
  _r(e), sc(t);
  let r = [];
  for (let n = 0; n < t.length; n++) n !== 0 && r.push(e), r.push(t[n]);
  return r;
}
function uc(e, t) {
  if (typeof e == "string") return t(e);
  let r = /* @__PURE__ */ new Map();
  return n(e);
  function n(i) {
    if (r.has(i)) return r.get(i);
    let l = o(i);
    return r.set(i, l), l;
  }
  function o(i) {
    switch (lc(i)) {
      case tc:
        return t(i.map(n));
      case qi:
        return t({ ...i, parts: i.parts.map(n) });
      case Ui:
        return t({ ...i, breakContents: n(i.breakContents), flatContents: n(i.flatContents) });
      case Ea: {
        let { expandedStates: l, contents: u } = i;
        return l ? (l = l.map(n), u = l[0]) : u = n(u), t({ ...i, contents: u, expandedStates: l });
      }
      case Wi:
      case Vi:
      case Gi:
      case ic:
      case oc:
        return t({ ...i, contents: n(i.contents) });
      case ec:
      case rc:
      case nc:
      case ac:
      case Or:
      case Yi:
        return t(i);
      default:
        throw new n2(i);
    }
  }
}
function Tx(e) {
  switch (lc(e)) {
    case qi:
      if (e.parts.every((t) => t === "")) return "";
      break;
    case Ea:
      if (!e.contents && !e.id && !e.break && !e.expandedStates) return "";
      if (e.contents.type === Ea && e.contents.id === e.id && e.contents.break === e.break && e.contents.expandedStates === e.expandedStates)
       return e.contents;
      break;
    case Wi:
    case Vi:
    case Gi:
    case oc:
      if (!e.contents) return "";
      break;
    case Ui:
      if (!e.flatContents && !e.breakContents) return "";
      break;
    case tc: {
      let t = [];
      for (let r of e) {
        if (!r) continue;
        let [n, ...o] = Array.isArray(r) ? r : [r];
        typeof n == "string" && typeof Fa(!1, t, -1) == "string" ? t[t.length - 1] += n : t.push(n), t.push(...o);
      }
      return t.length === 0 ? "" : t.length === 1 ? t[0] : t;
    }
    case ec:
    case rc:
    case nc:
    case ac:
    case Or:
    case ic:
    case Yi:
      break;
    default:
      throw new n2(e);
  }
  return e;
}
function Bx(e) {
  return uc(e, (t) => Tx(t));
}
function dt(e, t = kx) {
  return uc(e, (r) => typeof r == "string" ? io(t, r.split(`
`)) : r);
}
function Ix(e, t) {
  let r = t === !0 || t === ki ? ki : x5, n = r === ki ? x5 : ki, o = 0, i = 0;
  for (let l of e) l === r ? o++ : l === n && i++;
  return o > i ? n : r;
}
function _x(e) {
  if (typeof e != "string") throw new TypeError("Expected a string");
  return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function jx(e) {
  return e?.type === "front-matter";
}
function l2(e, t) {
  var r;
  if (e.type === "text" || e.type === "comment" || Xi(e) || e.type === "yaml" || e.type === "toml") return null;
  if (e.type === "attribute" && delete t.value, e.type === "docType" && delete t.value, e.type === "angularControlFlowBlock" && (r = e.parameters) !=
  null && r.children) for (let n of t.parameters.children) Wx.has(e.name) ? delete n.expression : n.expression = n.expression.trim();
  e.type === "angularIcuExpression" && (t.switchValue = e.switchValue.trim()), e.type === "angularLetDeclarationInitializer" && delete t.value;
}
async function Ux(e, t) {
  if (e.language === "yaml") {
    let r = e.value.trim(), n = r ? await t(r, { parser: "yaml" }) : "";
    return Rx([e.startDelimiter, e.explicitLanguage, Q, n, n ? Q : "", e.endDelimiter]);
  }
}
function Ki(e, t = !0) {
  return [St([ke, e]), t ? ke : ""];
}
function lo(e, t) {
  let r = e.type === "NGRoot" ? e.node.type === "NGMicrosyntax" && e.node.body.length === 1 && e.node.body[0].type === "NGMicrosyntaxExpress\
ion" ? e.node.body[0].expression : e.node : e.type === "JsExpressionRoot" ? e.node : e;
  return r && (r.type === "ObjectExpression" || r.type === "ArrayExpression" || (t.parser === "__vue_expression" || t.parser === "__vue_ts_e\
xpression") && (r.type === "TemplateLiteral" || r.type === "StringLiteral"));
}
async function ft(e, t, r, n) {
  r = { __isInHtmlAttribute: !0, __embeddedInHtml: !0, ...r };
  let o = !0;
  n && (r.__onHtmlBindingRoot = (l, u) => {
    o = n(l, u);
  });
  let i = await t(e, r, t);
  return o ? fe(i) : Ki(i);
}
function Yx(e, t, r, n) {
  let { node: o } = r, i = n.originalText.slice(o.sourceSpan.start.offset, o.sourceSpan.end.offset);
  return /^\s*$/u.test(i) ? "" : ft(i, e, { parser: "__ng_directive", __isInHtmlAttribute: !1 }, lo);
}
function C5(e, t) {
  if (!t) return;
  let r = Kx(t).toLowerCase();
  return e.find(({ filenames: n }) => n?.some((o) => o.toLowerCase() === r)) ?? e.find(({ extensions: n }) => n?.some((o) => r.endsWith(o)));
}
function Zx(e, t) {
  if (t) return e.find(({ name: r }) => r.toLowerCase() === t) ?? e.find(({ aliases: r }) => r?.includes(t)) ?? e.find(({ extensions: r }) => r?.
  includes(`.${t}`));
}
function Jx(e, t) {
  let r = e.plugins.flatMap((o) => o.languages ?? []), n = Zx(r, t.language) ?? C5(r, t.physicalFile) ?? C5(r, t.file) ?? (t.physicalFile, void 0);
  return n?.parsers[0];
}
function nC(e) {
  return e.type === "element" && !e.hasExplicitNamespace && !["html", "svg"].includes(e.namespace);
}
function u2(e, t) {
  return !!(e.type === "ieConditionalComment" && e.lastChild && !e.lastChild.isSelfClosing && !e.lastChild.endSourceSpan || e.type === "ieCo\
nditionalComment" && !e.complete || ao(e) && e.children.some((r) => r.type !== "text" && r.type !== "interpolation") || pc(e, t) && !_t(e) &&
  e.type !== "interpolation");
}
function Ji(e) {
  return e.type === "attribute" || !e.parent || !e.prev ? !1 : iC(e.prev);
}
function iC(e) {
  return e.type === "comment" && e.value.trim() === "prettier-ignore";
}
function rt(e) {
  return e.type === "text" || e.type === "comment";
}
function _t(e) {
  return e.type === "element" && (e.fullName === "script" || e.fullName === "style" || e.fullName === "svg:style" || e.fullName === "svg:scr\
ipt" || Ra(e) && (e.name === "script" || e.name === "style"));
}
function lC(e) {
  return e.children && !_t(e);
}
function sC(e) {
  return _t(e) || e.type === "interpolation" || c2(e);
}
function c2(e) {
  return v2(e).startsWith("pre");
}
function uC(e, t) {
  var r, n;
  let o = i();
  if (o && !e.prev && (n = (r = e.parent) == null ? void 0 : r.tagDefinition) != null && n.ignoreFirstLf) return e.type === "interpolation";
  return o;
  function i() {
    return Xi(e) || e.type === "angularControlFlowBlock" ? !1 : (e.type === "text" || e.type === "interpolation") && e.prev && (e.prev.type ===
    "text" || e.prev.type === "interpolation") ? !0 : !e.parent || e.parent.cssDisplay === "none" ? !1 : ao(e.parent) ? !0 : !(!e.prev && (e.
    parent.type === "root" || ao(e) && e.parent || _t(e.parent) || Qi(e.parent, t) || !wC(e.parent.cssDisplay)) || e.prev && !DC(e.prev.cssDisplay));
  }
}
function cC(e, t) {
  return Xi(e) || e.type === "angularControlFlowBlock" ? !1 : (e.type === "text" || e.type === "interpolation") && e.next && (e.next.type ===
  "text" || e.next.type === "interpolation") ? !0 : !e.parent || e.parent.cssDisplay === "none" ? !1 : ao(e.parent) ? !0 : !(!e.next && (e.parent.
  type === "root" || ao(e) && e.parent || _t(e.parent) || Qi(e.parent, t) || !bC(e.parent.cssDisplay)) || e.next && !yC(e.next.cssDisplay));
}
function pC(e) {
  return xC(e.cssDisplay) && !_t(e);
}
function Li(e) {
  return Xi(e) || e.next && e.sourceSpan.end && e.sourceSpan.end.line + 1 < e.next.sourceSpan.start.line;
}
function dC(e) {
  return p2(e) || e.type === "element" && e.children.length > 0 && (["body", "script", "style"].includes(e.name) || e.children.some((t) => hC(
  t))) || e.firstChild && e.firstChild === e.lastChild && e.firstChild.type !== "text" && f2(e.firstChild) && (!e.lastChild.isTrailingSpaceSensitive ||
  h2(e.lastChild));
}
function p2(e) {
  return e.type === "element" && e.children.length > 0 && (["html", "head", "ul", "ol", "select"].includes(e.name) || e.cssDisplay.startsWith(
  "table") && e.cssDisplay !== "table-cell");
}
function Vu(e) {
  return m2(e) || e.prev && fC(e.prev) || d2(e);
}
function fC(e) {
  return m2(e) || e.type === "element" && e.fullName === "br" || d2(e);
}
function d2(e) {
  return f2(e) && h2(e);
}
function f2(e) {
  return e.hasLeadingSpaces && (e.prev ? e.prev.sourceSpan.end.line < e.sourceSpan.start.line : e.parent.type === "root" || e.parent.startSourceSpan.
  end.line < e.sourceSpan.start.line);
}
function h2(e) {
  return e.hasTrailingSpaces && (e.next ? e.next.sourceSpan.start.line > e.sourceSpan.end.line : e.parent.type === "root" || e.parent.endSourceSpan &&
  e.parent.endSourceSpan.start.line > e.sourceSpan.end.line);
}
function m2(e) {
  switch (e.type) {
    case "ieConditionalComment":
    case "comment":
    case "directive":
      return !0;
    case "element":
      return ["script", "select"].includes(e.name);
  }
  return !1;
}
function cc(e) {
  return e.lastChild ? cc(e.lastChild) : e;
}
function hC(e) {
  var t;
  return (t = e.children) == null ? void 0 : t.some((r) => r.type !== "text");
}
function g2(e) {
  if (e) switch (e) {
    case "module":
    case "text/javascript":
    case "text/babel":
    case "application/javascript":
      return "babel";
    case "application/x-typescript":
      return "typescript";
    case "text/markdown":
      return "markdown";
    case "text/html":
      return "html";
    case "text/x-handlebars-template":
      return "glimmer";
    default:
      if (e.endsWith("json") || e.endsWith("importmap") || e === "speculationrules") return "json";
  }
}
function mC(e, t) {
  let { name: r, attrMap: n } = e;
  if (r !== "script" || Object.prototype.hasOwnProperty.call(n, "src")) return;
  let { type: o, lang: i } = e.attrMap;
  return !i && !o ? "babel" : Zi(t, { language: i }) ?? g2(o);
}
function gC(e, t) {
  if (!pc(e, t)) return;
  let { attrMap: r } = e;
  if (Object.prototype.hasOwnProperty.call(r, "src")) return;
  let { type: n, lang: o } = r;
  return Zi(t, { language: o }) ?? g2(n);
}
function vC(e, t) {
  if (e.name !== "style") return;
  let { lang: r } = e.attrMap;
  return r ? Zi(t, { language: r }) : "css";
}
function E5(e, t) {
  return mC(e, t) ?? vC(e, t) ?? gC(e, t);
}
function ka(e) {
  return e === "block" || e === "list-item" || e.startsWith("table");
}
function wC(e) {
  return !ka(e) && e !== "inline-block";
}
function bC(e) {
  return !ka(e) && e !== "inline-block";
}
function yC(e) {
  return !ka(e);
}
function DC(e) {
  return !ka(e);
}
function xC(e) {
  return !ka(e) && e !== "inline-block";
}
function ao(e) {
  return v2(e).startsWith("pre");
}
function CC(e, t) {
  let r = e;
  for (; r; ) {
    if (t(r)) return !0;
    r = r.parent;
  }
  return !1;
}
function EC(e, t) {
  var r;
  if (so(e, t)) return "block";
  if (((r = e.prev) == null ? void 0 : r.type) === "comment") {
    let o = e.prev.value.match(/^\s*display:\s*([a-z]+)\s*$/u);
    if (o) return o[1];
  }
  let n = !1;
  if (e.type === "element" && e.namespace === "svg") if (CC(e, (o) => o.fullName === "svg:foreignObject")) n = !0;
  else return e.name === "svg" ? "inline-block" : "block";
  switch (t.htmlWhitespaceSensitivity) {
    case "strict":
      return "inline";
    case "ignore":
      return "block";
    default:
      return e.type === "element" && (!e.namespace || n || Ra(e)) && eC[e.name] || Qx;
  }
}
function v2(e) {
  return e.type === "element" && (!e.namespace || Ra(e)) && rC[e.name] || tC;
}
function RC(e) {
  let t = Number.POSITIVE_INFINITY;
  for (let r of e.split(`
`)) {
    if (r.length === 0) continue;
    let n = Rt.getLeadingWhitespaceCount(r);
    if (n === 0) return 0;
    r.length !== n && n < t && (t = n);
  }
  return t === Number.POSITIVE_INFINITY ? 0 : t;
}
function w2(e, t = RC(e)) {
  return t === 0 ? e : e.split(`
`).map((r) => r.slice(t)).join(`
`);
}
function b2(e) {
  return Ge(!1, Ge(!1, e, "&apos;", "'"), "&quot;", '"');
}
function ir(e) {
  return b2(e.value);
}
function Qi(e, t) {
  return so(e, t) && !SC.has(e.fullName);
}
function so(e, t) {
  return t.parser === "vue" && e.type === "element" && e.parent.type === "root" && e.fullName.toLowerCase() !== "html";
}
function pc(e, t) {
  return so(e, t) && (Qi(e, t) || e.attrMap.lang && e.attrMap.lang !== "html");
}
function AC(e) {
  let t = e.fullName;
  return t.charAt(0) === "#" || t === "slot-scope" || t === "v-slot" || t.startsWith("v-slot:");
}
function FC(e, t) {
  let r = e.parent;
  if (!so(r, t)) return !1;
  let n = r.fullName, o = e.fullName;
  return n === "script" && o === "setup" || n === "style" && o === "vars";
}
function y2(e, t = e.value) {
  return e.parent.isWhitespaceSensitive ? e.parent.isIndentationSensitive ? dt(t) : dt(w2(s2(t)), Q) : io(be, Rt.split(t));
}
function D2(e, t) {
  return so(e, t) && e.name === "script";
}
async function kC(e, t) {
  let r = [];
  for (let [n, o] of e.split(x2).entries()) if (n % 2 === 0) r.push(dt(o));
  else try {
    r.push(fe(["{{", St([be, await ft(o, t, { parser: "__ng_interpolation", __isInHtmlInterpolation: !0 })]), be, "}}"]));
  } catch {
    r.push("{{", dt(o), "}}");
  }
  return r;
}
function dc({ parser: e }) {
  return (t, r, n) => ft(ir(n.node), t, { parser: e }, lo);
}
function IC(e, t) {
  if (t.parser !== "angular") return;
  let { node: r } = e, n = r.fullName;
  if (n.startsWith("(") && n.endsWith(")") || n.startsWith("on-")) return LC;
  if (n.startsWith("[") && n.endsWith("]") || /^bind(?:on)?-/u.test(n) || /^ng-(?:if|show|hide|class|style)$/u.test(n)) return TC;
  if (n.startsWith("*")) return BC;
  let o = ir(r);
  if (/^i18n(?:-.+)?$/u.test(n)) return () => Ki(i2(y2(r, o.trim())), !o.includes("@@"));
  if (x2.test(o)) return (i) => kC(o, i);
}
function _C(e, t) {
  let { node: r } = e, n = ir(r);
  if (r.fullName === "class" && !t.parentParser && !n.includes("{{")) return () => n.trim().split(/\s+/u).join(" ");
}
function R5(e) {
  return e === "	" || e === `
` || e === "\f" || e === "\r" || e === " ";
}
function jC(e) {
  let t = e.length, r, n, o, i, l, u = 0, c;
  function p(v) {
    let b, m = v.exec(e.substring(u));
    if (m) return [b] = m, u += b.length, b;
  }
  a(p, "p");
  let d = [];
  for (; ; ) {
    if (p(zC), u >= t) {
      if (d.length === 0) throw new Error("Must contain one or more image candidate strings.");
      return d;
    }
    c = u, r = p(OC), n = [], r.slice(-1) === "," ? (r = r.replace(NC, ""), f()) : h();
  }
  function h() {
    for (p(HC), o = "", i = "in descriptor"; ; ) {
      if (l = e.charAt(u), i === "in descriptor") if (R5(l)) o && (n.push(o), o = "", i = "after descriptor");
      else if (l === ",") {
        u += 1, o && n.push(o), f();
        return;
      } else if (l === "(") o += l, i = "in parens";
      else if (l === "") {
        o && n.push(o), f();
        return;
      } else o += l;
      else if (i === "in parens") if (l === ")") o += l, i = "in descriptor";
      else if (l === "") {
        n.push(o), f();
        return;
      } else o += l;
      else if (i === "after descriptor" && !R5(l)) if (l === "") {
        f();
        return;
      } else i = "in descriptor", u -= 1;
      u += 1;
    }
  }
  a(h, "f");
  function f() {
    let v = !1, b, m, g, y, w = {}, D, x, C, E, R;
    for (y = 0; y < n.length; y++) D = n[y], x = D[D.length - 1], C = D.substring(0, D.length - 1), E = parseInt(C, 10), R = parseFloat(C), S5.
    test(C) && x === "w" ? ((b || m) && (v = !0), E === 0 ? v = !0 : b = E) : $C.test(C) && x === "x" ? ((b || m || g) && (v = !0), R < 0 ? v =
    !0 : m = R) : S5.test(C) && x === "h" ? ((g || m) && (v = !0), E === 0 ? v = !0 : g = E) : v = !0;
    if (!v) w.source = { value: r, startOffset: c }, b && (w.width = { value: b }), m && (w.density = { value: m }), g && (w.height = { value: g }),
    d.push(w);
    else throw new Error(`Invalid srcset descriptor found in "${e}" at "${D}".`);
  }
  a(f, "d");
}
function WC(e) {
  if (e.node.fullName === "srcset" && (e.parent.fullName === "img" || e.parent.fullName === "source")) return () => UC(ir(e.node));
}
function UC(e) {
  let t = VC(e), r = qC.filter((d) => t.some((h) => Object.prototype.hasOwnProperty.call(h, d)));
  if (r.length > 1) throw new Error("Mixed descriptor in srcset is not supported");
  let [n] = r, o = C2[n], i = t.map((d) => d.source.value), l = Math.max(...i.map((d) => d.length)), u = t.map((d) => d[n] ? String(d[n].value) :
  ""), c = u.map((d) => {
    let h = d.indexOf(".");
    return h === -1 ? d.length : h;
  }), p = Math.max(...c);
  return Ki(io([",", be], i.map((d, h) => {
    let f = [d], v = u[h];
    if (v) {
      let b = l - d.length + 1, m = p - c[h], g = " ".repeat(b + m);
      f.push(Pi(g, " "), v + o);
    }
    return f;
  })));
}
function YC(e, t) {
  let { node: r } = e, n = ir(e.node).trim();
  if (r.fullName === "style" && !t.parentParser && !n.includes("{{")) return async (o) => Ki(await o(n, { parser: "css", __isHTMLStyleAttribute: !0 }));
}
function XC(e, t) {
  let { root: r } = e;
  return Wu.has(r) || Wu.set(r, r.children.some((n) => D2(n, t) && ["ts", "typescript"].includes(n.attrMap.lang))), Wu.get(r);
}
function KC(e, t, r) {
  let { node: n } = r, o = ir(n);
  return ft(`type T<${o}> = any`, e, { parser: "babel-ts", __isEmbeddedTypescriptGenericParameters: !0 }, lo);
}
function ZC(e, t, { parseWithTs: r }) {
  return ft(`function _(${e}) {}`, t, { parser: r ? "babel-ts" : "babel", __isVueBindings: !0 });
}
function JC(e) {
  let t = /^(?:[\w$]+|\([^)]*\))\s*=>|^function\s*\(/u, r = /^[$_a-z][\w$]*(?:\.[$_a-z][\w$]*|\['[^']*'\]|\["[^"]*"\]|\[\d+\]|\[[$_a-z][\w$]*\])*$/iu,
  n = e.trim();
  return t.test(n) || r.test(n);
}
async function QC(e, t, r, n) {
  let o = ir(r.node), { left: i, operator: l, right: u } = eE(o), c = fc(r, n);
  return [fe(await ft(`function _(${i}) {}`, e, { parser: c ? "babel-ts" : "babel", __isVueForBindingLeft: !0 })), " ", l, " ", await ft(u, e,
  { parser: c ? "__ts_expression" : "__js_expression" })];
}
function eE(e) {
  let t = /(.*?)\s+(in|of)\s+(.*)/su, r = /,([^,\]}]*)(?:,([^,\]}]*))?$/u, n = /^\(|\)$/gu, o = e.match(t);
  if (!o) return;
  let i = {};
  if (i.for = o[3].trim(), !i.for) return;
  let l = Ge(!1, o[1].trim(), n, ""), u = l.match(r);
  u ? (i.alias = l.replace(r, ""), i.iterator1 = u[1].trim(), u[2] && (i.iterator2 = u[2].trim())) : i.alias = l;
  let c = [i.alias, i.iterator1, i.iterator2];
  if (!c.some((p, d) => !p && (d === 0 || c.slice(d + 1).some(Boolean)))) return { left: c.filter(Boolean).join(","), operator: o[2], right: i.
  for };
}
function tE(e, t) {
  if (t.parser !== "vue") return;
  let { node: r } = e, n = r.fullName;
  if (n === "v-for") return QC;
  if (n === "generic" && D2(r.parent, t)) return KC;
  let o = ir(r), i = fc(e, t);
  if (AC(r) || FC(r, t)) return (l) => ZC(o, l, { parseWithTs: i });
  if (n.startsWith("@") || n.startsWith("v-on:")) return (l) => rE(o, l, { parseWithTs: i });
  if (n.startsWith(":") || n.startsWith("v-bind:")) return (l) => nE(o, l, { parseWithTs: i });
  if (n.startsWith("v-")) return (l) => E2(o, l, { parseWithTs: i });
}
function rE(e, t, { parseWithTs: r }) {
  return JC(e) ? E2(e, t, { parseWithTs: r }) : ft(e, t, { parser: r ? "__vue_ts_event_binding" : "__vue_event_binding" }, lo);
}
function nE(e, t, { parseWithTs: r }) {
  return ft(e, t, { parser: r ? "__vue_ts_expression" : "__vue_expression" }, lo);
}
function E2(e, t, { parseWithTs: r }) {
  return ft(e, t, { parser: r ? "__ts_expression" : "__js_expression" }, lo);
}
function aE(e, t) {
  let { node: r } = e;
  if (r.value) {
    if (/^PRETTIER_HTML_PLACEHOLDER_\d+_\d+_IN_JS$/u.test(t.originalText.slice(r.valueSpan.start.offset, r.valueSpan.end.offset)) || t.parser ===
    "lwc" && r.value.startsWith("{") && r.value.endsWith("}")) return [r.rawName, "=", r.value];
    for (let n of [GC, YC, PC, oE, MC]) {
      let o = n(e, t);
      if (o) return iE(o);
    }
  }
}
function iE(e) {
  return async (t, r, n, o) => {
    let i = await e(t, r, n, o);
    if (i) return i = uc(i, (l) => typeof l == "string" ? Ge(!1, l, '"', "&quot;") : l), [n.node.rawName, '="', fe(i), '"'];
  };
}
function sE(e) {
  return Array.isArray(e) && e.length > 0;
}
function el(e) {
  return e.sourceSpan.start.offset;
}
function tl(e) {
  return e.sourceSpan.end.offset;
}
function Ku(e, t) {
  return [e.isSelfClosing ? "" : uE(e, t), Da(e, t)];
}
function uE(e, t) {
  return e.lastChild && Sa(e.lastChild) ? "" : [cE(e, t), mc(e, t)];
}
function Da(e, t) {
  return (e.next ? Hr(e.next) : Ta(e.parent)) ? "" : [La(e, t), Pr(e, t)];
}
function cE(e, t) {
  return Ta(e) ? La(e.lastChild, t) : "";
}
function Pr(e, t) {
  return Sa(e) ? mc(e.parent, t) : rl(e) ? gc(e.next) : "";
}
function mc(e, t) {
  if (S2(!e.isSelfClosing), A2(e, t)) return "";
  switch (e.type) {
    case "ieConditionalComment":
      return "<!";
    case "element":
      if (e.hasHtmComponentClosingTag) return "<//";
    default:
      return `</${e.rawName}`;
  }
}
function La(e, t) {
  if (A2(e, t)) return "";
  switch (e.type) {
    case "ieConditionalComment":
    case "ieConditionalEndComment":
      return "[endif]-->";
    case "ieConditionalStartComment":
      return "]><!-->";
    case "interpolation":
      return "}}";
    case "angularIcuExpression":
      return "}";
    case "element":
      if (e.isSelfClosing) return "/>";
    default:
      return ">";
  }
}
function A2(e, t) {
  return !e.isSelfClosing && !e.endSourceSpan && (Ji(e) || u2(e.parent, t));
}
function Hr(e) {
  return e.prev && e.prev.type !== "docType" && e.type !== "angularControlFlowBlock" && !rt(e.prev) && e.isLeadingSpaceSensitive && !e.hasLeadingSpaces;
}
function Ta(e) {
  var t;
  return ((t = e.lastChild) == null ? void 0 : t.isTrailingSpaceSensitive) && !e.lastChild.hasTrailingSpaces && !rt(cc(e.lastChild)) && !ao(
  e);
}
function Sa(e) {
  return !e.next && !e.hasTrailingSpaces && e.isTrailingSpaceSensitive && rt(cc(e));
}
function rl(e) {
  return e.next && !rt(e.next) && rt(e) && e.isTrailingSpaceSensitive && !e.hasTrailingSpaces;
}
function pE(e) {
  let t = e.trim().match(/^prettier-ignore-attribute(?:\s+(.+))?$/su);
  return t ? t[1] ? t[1].split(/\s+/u) : !0 : !1;
}
function nl(e) {
  return !e.prev && e.isLeadingSpaceSensitive && !e.hasLeadingSpaces;
}
function dE(e, t, r) {
  var n;
  let { node: o } = e;
  if (!hc(o.attrs)) return o.isSelfClosing ? " " : "";
  let i = ((n = o.prev) == null ? void 0 : n.type) === "comment" && pE(o.prev.value), l = typeof i == "boolean" ? () => i : Array.isArray(i) ?
  (h) => i.includes(h.rawName) : () => !1, u = e.map(({ node: h }) => l(h) ? dt(t.originalText.slice(el(h), tl(h))) : r(), "attrs"), c = o.type ===
  "element" && o.fullName === "script" && o.attrs.length === 1 && o.attrs[0].fullName === "src" && o.children.length === 0, p = t.singleAttributePerLine &&
  o.attrs.length > 1 && !so(o, t) ? Q : be, d = [St([c ? " " : be, io(p, u)])];
  return o.firstChild && nl(o.firstChild) || o.isSelfClosing && Ta(o.parent) || c ? d.push(o.isSelfClosing ? " " : "") : d.push(t.bracketSameLine ?
  o.isSelfClosing ? " " : "" : o.isSelfClosing ? be : ke), d;
}
function fE(e) {
  return e.firstChild && nl(e.firstChild) ? "" : vc(e);
}
function Zu(e, t, r) {
  let { node: n } = e;
  return [xa(n, t), dE(e, t, r), n.isSelfClosing ? "" : fE(n)];
}
function xa(e, t) {
  return e.prev && rl(e.prev) ? "" : [zr(e, t), gc(e)];
}
function zr(e, t) {
  return nl(e) ? vc(e.parent) : Hr(e) ? La(e.prev, t) : "";
}
function gc(e) {
  switch (e.type) {
    case "ieConditionalComment":
    case "ieConditionalStartComment":
      return `<!--[if ${e.condition}`;
    case "ieConditionalEndComment":
      return "<!--<!";
    case "interpolation":
      return "{{";
    case "docType":
      return e.value === "html" ? "<!doctype" : "<!DOCTYPE";
    case "angularIcuExpression":
      return "{";
    case "element":
      if (e.condition) return `<!--[if ${e.condition}]><!--><${e.rawName}`;
    default:
      return `<${e.rawName}`;
  }
}
function vc(e) {
  switch (S2(!e.isSelfClosing), e.type) {
    case "ieConditionalComment":
      return "]>";
    case "element":
      if (e.condition) return "><!--<![endif]-->";
    default:
      return ">";
  }
}
function hE(e, t) {
  if (!e.endSourceSpan) return "";
  let r = e.startSourceSpan.end.offset;
  e.firstChild && nl(e.firstChild) && (r -= vc(e).length);
  let n = e.endSourceSpan.start.offset;
  return e.lastChild && Sa(e.lastChild) ? n += mc(e, t).length : Ta(e) && (n -= La(e.lastChild, t).length), t.originalText.slice(r, n);
}
function gE(e, t) {
  let { node: r } = e;
  switch (r.type) {
    case "element":
      if (_t(r) || r.type === "interpolation") return;
      if (!r.isSelfClosing && pc(r, t)) {
        let n = E5(r, t);
        return n ? async (o, i) => {
          let l = F2(r, t), u = /^\s*$/u.test(l), c = "";
          return u || (c = await o(s2(l), { parser: n, __embeddedInHtml: !0 }), u = c === ""), [zr(r, t), fe(Zu(e, t, i)), u ? "" : Q, c, u ?
          "" : Q, Ku(r, t), Pr(r, t)];
        } : void 0;
      }
      break;
    case "text":
      if (_t(r.parent)) {
        let n = E5(r.parent, t);
        if (n) return async (o) => {
          let i = n === "markdown" ? w2(r.value.replace(/^[^\S\n]*\n/u, "")) : r.value, l = { parser: n, __embeddedInHtml: !0 };
          if (t.parser === "html" && n === "babel") {
            let u = "script", { attrMap: c } = r.parent;
            c && (c.type === "module" || c.type === "text/babel" && c["data-type"] === "module") && (u = "module"), l.__babelSourceType = u;
          }
          return [Aa, zr(r, t), await o(i, l), Pr(r, t)];
        };
      } else if (r.parent.type === "interpolation") return async (n) => {
        let o = { __isInHtmlInterpolation: !0, __embeddedInHtml: !0 };
        return t.parser === "angular" ? o.parser = "__ng_interpolation" : t.parser === "vue" ? o.parser = fc(e, t) ? "__vue_ts_expression" :
        "__vue_expression" : o.parser = "__js_expression", [St([be, await n(r.value, o)]), r.parent.next && Hr(r.parent.next) ? " " : be];
      };
      break;
    case "attribute":
      return lE(e, t);
    case "front-matter":
      return (n) => Gx(r, n);
    case "angularControlFlowBlockParameters":
      return mE.has(e.parent.name) ? Xx : void 0;
    case "angularLetDeclarationInitializer":
      return (n) => ft(r.value, n, { parser: "__ng_binding", __isInHtmlAttribute: !1 });
  }
}
function Ca(e) {
  if (va !== null && typeof va.property) {
    let t = va;
    return va = Ca.prototype = null, t;
  }
  return va = Ca.prototype = e ?? /* @__PURE__ */ Object.create(null), new Ca();
}
function bE(e) {
  return Ca(e);
}
function yE(e, t = "type") {
  bE(e);
  function r(n) {
    let o = n[t], i = e[o];
    if (!Array.isArray(i)) throw Object.assign(new Error(`Missing visitor keys for '${o}'.`), { node: n });
    return i;
  }
  return a(r, "r"), r;
}
function SE(e) {
  return /^\s*<!--\s*@(?:format|prettier)\s*-->/u.test(e);
}
function AE(e) {
  return `<!-- @format -->

` + e;
}
function k2(e) {
  let t = tl(e);
  return e.type === "element" && !e.endSourceSpan && hc(e.children) ? Math.max(t, k2(Fa(!1, e.children, -1))) : t;
}
function wa(e, t, r) {
  let n = e.node;
  if (Ji(n)) {
    let o = k2(n);
    return [zr(n, t), dt(Rt.trimEnd(t.originalText.slice(el(n) + (n.prev && rl(n.prev) ? gc(n).length : 0), o - (n.next && Hr(n.next) ? La(n,
    t).length : 0)))), Pr(n, t)];
  }
  return r();
}
function Ti(e, t) {
  return rt(e) && rt(t) ? e.isTrailingSpaceSensitive ? e.hasTrailingSpaces ? Vu(t) ? Q : be : "" : Vu(t) ? Q : ke : rl(e) && (Ji(t) || t.firstChild ||
  t.isSelfClosing || t.type === "element" && t.attrs.length > 0) || e.type === "element" && e.isSelfClosing && Hr(t) ? "" : !t.isLeadingSpaceSensitive ||
  Vu(t) || Hr(t) && e.lastChild && Sa(e.lastChild) && e.lastChild.lastChild && Sa(e.lastChild.lastChild) ? Q : t.hasLeadingSpaces ? be : ke;
}
function wc(e, t, r) {
  let { node: n } = e;
  if (p2(n)) return [Aa, ...e.map((i) => {
    let l = i.node, u = l.prev ? Ti(l.prev, l) : "";
    return [u ? [u, Li(l.prev) ? Q : ""] : "", wa(i, t, r)];
  }, "children")];
  let o = n.children.map(() => Symbol(""));
  return e.map((i, l) => {
    let u = i.node;
    if (rt(u)) {
      if (u.prev && rt(u.prev)) {
        let b = Ti(u.prev, u);
        if (b) return Li(u.prev) ? [Q, Q, wa(i, t, r)] : [b, wa(i, t, r)];
      }
      return wa(i, t, r);
    }
    let c = [], p = [], d = [], h = [], f = u.prev ? Ti(u.prev, u) : "", v = u.next ? Ti(u, u.next) : "";
    return f && (Li(u.prev) ? c.push(Q, Q) : f === Q ? c.push(Q) : rt(u.prev) ? p.push(f) : p.push(Pi("", ke, { groupId: o[l - 1] }))), v &&
    (Li(u) ? rt(u.next) && h.push(Q, Q) : v === Q ? rt(u.next) && h.push(Q) : d.push(v)), [...c, fe([...p, fe([wa(i, t, r), ...d], { id: o[l] })]),
    ...h];
  }, "children");
}
function kE(e, t, r) {
  let { node: n } = e, o = [];
  LE(e) && o.push("} "), o.push("@", n.name), n.parameters && o.push(" (", fe(r("parameters")), ")"), o.push(" {");
  let i = L2(n);
  return n.children.length > 0 ? (n.firstChild.hasLeadingSpaces = !0, n.lastChild.hasTrailingSpaces = !0, o.push(St([Q, wc(e, t, r)])), i &&
  o.push(Q, "}")) : i && o.push("}"), fe(o, { shouldBreak: !0 });
}
function L2(e) {
  var t, r;
  return !(((t = e.next) == null ? void 0 : t.type) === "angularControlFlowBlock" && (r = FE.get(e.name)) != null && r.has(e.next.name));
}
function LE(e) {
  let { previous: t } = e;
  return t?.type === "angularControlFlowBlock" && !Ji(t) && !L2(t);
}
function TE(e, t, r) {
  return [St([ke, io([";", be], e.map(r, "children"))]), ke];
}
function BE(e, t, r) {
  let { node: n } = e;
  return [xa(n, t), fe([n.switchValue.trim(), ", ", n.clause, n.cases.length > 0 ? [",", St([be, io(be, e.map(r, "cases"))])] : "", ke]), Da(
  n, t)];
}
function IE(e, t, r) {
  let { node: n } = e;
  return [n.value, " {", fe([St([ke, e.map(({ node: o }) => o.type === "text" && !Rt.trim(o.value) ? "" : r(), "expression")]), ke]), "}"];
}
function ME(e, t, r) {
  let { node: n } = e;
  if (u2(n, t)) return [zr(n, t), fe(Zu(e, t, r)), dt(F2(n, t)), ...Ku(n, t), Pr(n, t)];
  let o = n.children.length === 1 && (n.firstChild.type === "interpolation" || n.firstChild.type === "angularIcuExpression") && n.firstChild.
  isLeadingSpaceSensitive && !n.firstChild.hasLeadingSpaces && n.lastChild.isTrailingSpaceSensitive && !n.lastChild.hasTrailingSpaces, i = Symbol(
  "element-attr-group-id"), l = /* @__PURE__ */ a((d) => fe([fe(Zu(e, t, r), { id: i }), d, Ku(n, t)]), "a"), u = /* @__PURE__ */ a((d) => o ?
  Sx(d, { groupId: i }) : (_t(n) || Qi(n, t)) && n.parent.type === "root" && t.parser === "vue" && !t.vueIndentScriptAndStyle ? d : St(d), "\
o"), c = /* @__PURE__ */ a(() => o ? Pi(ke, "", { groupId: i }) : n.firstChild.hasLeadingSpaces && n.firstChild.isLeadingSpaceSensitive ? be :
  n.firstChild.type === "text" && n.isWhitespaceSensitive && n.isIndentationSensitive ? Ex(ke) : ke, "u"), p = /* @__PURE__ */ a(() => (n.next ?
  Hr(n.next) : Ta(n.parent)) ? n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? " " : "" : o ? Pi(ke, "", { groupId: i }) :
  n.lastChild.hasTrailingSpaces && n.lastChild.isTrailingSpaceSensitive ? be : (n.lastChild.type === "comment" || n.lastChild.type === "text" &&
  n.isWhitespaceSensitive && n.isIndentationSensitive) && new RegExp(`\\n[\\t ]{${t.tabWidth * (e.ancestors.length - 1)}}$`, "u").test(n.lastChild.
  value) ? "" : ke, "p");
  return n.children.length === 0 ? l(n.hasDanglingSpaces && n.isDanglingSpaceSensitive ? be : "") : l([dC(n) ? Aa : "", u([c(), wc(e, t, r)]),
  p()]);
}
function Hi(e) {
  return e >= 9 && e <= 32 || e == 160;
}
function bc(e) {
  return 48 <= e && e <= 57;
}
function zi(e) {
  return e >= 97 && e <= 122 || e >= 65 && e <= 90;
}
function _E(e) {
  return e >= 97 && e <= 102 || e >= 65 && e <= 70 || bc(e);
}
function yc(e) {
  return e === 10 || e === 13;
}
function A5(e) {
  return 48 <= e && e <= 55;
}
function qu(e) {
  return e === 39 || e === 34 || e === 96;
}
function HE(e) {
  return e.replace(PE, (...t) => t[1].toUpperCase());
}
function OE(e, t) {
  for (let r of zE) r(e, t);
  return e;
}
function NE(e) {
  e.walk((t) => {
    if (t.type === "element" && t.tagDefinition.ignoreFirstLf && t.children.length > 0 && t.children[0].type === "text" && t.children[0].value[0] ===
    `
`) {
      let r = t.children[0];
      r.value.length === 1 ? t.removeChild(r) : r.value = r.value.slice(1);
    }
  });
}
function $E(e) {
  let t = /* @__PURE__ */ a((r) => {
    var n, o;
    return r.type === "element" && ((n = r.prev) == null ? void 0 : n.type) === "ieConditionalStartComment" && r.prev.sourceSpan.end.offset ===
    r.startSourceSpan.start.offset && ((o = r.firstChild) == null ? void 0 : o.type) === "ieConditionalEndComment" && r.firstChild.sourceSpan.
    start.offset === r.startSourceSpan.end.offset;
  }, "e");
  e.walk((r) => {
    if (r.children) for (let n = 0; n < r.children.length; n++) {
      let o = r.children[n];
      if (!t(o)) continue;
      let i = o.prev, l = o.firstChild;
      r.removeChild(i), n--;
      let u = new $(i.sourceSpan.start, l.sourceSpan.end), c = new $(u.start, o.sourceSpan.end);
      o.condition = i.condition, o.sourceSpan = c, o.startSourceSpan = u, o.removeChild(l);
    }
  });
}
function jE(e, t, r) {
  e.walk((n) => {
    if (n.children) for (let o = 0; o < n.children.length; o++) {
      let i = n.children[o];
      if (i.type !== "text" && !t(i)) continue;
      i.type !== "text" && (i.type = "text", i.value = r(i));
      let l = i.prev;
      !l || l.type !== "text" || (l.value += i.value, l.sourceSpan = new $(l.sourceSpan.start, i.sourceSpan.end), n.removeChild(i), o--);
    }
  });
}
function VE(e) {
  return jE(e, (t) => t.type === "cdata", (t) => `<![CDATA[${t.value}]]>`);
}
function WE(e) {
  let t = /* @__PURE__ */ a((r) => {
    var n, o;
    return r.type === "element" && r.attrs.length === 0 && r.children.length === 1 && r.firstChild.type === "text" && !Rt.hasWhitespaceCharacter(
    r.children[0].value) && !r.firstChild.hasLeadingSpaces && !r.firstChild.hasTrailingSpaces && r.isLeadingSpaceSensitive && !r.hasLeadingSpaces &&
    r.isTrailingSpaceSensitive && !r.hasTrailingSpaces && ((n = r.prev) == null ? void 0 : n.type) === "text" && ((o = r.next) == null ? void 0 :
    o.type) === "text";
  }, "e");
  e.walk((r) => {
    if (r.children) for (let n = 0; n < r.children.length; n++) {
      let o = r.children[n];
      if (!t(o)) continue;
      let i = o.prev, l = o.next;
      i.value += `<${o.rawName}>` + o.firstChild.value + `</${o.rawName}>` + l.value, i.sourceSpan = new $(i.sourceSpan.start, l.sourceSpan.
      end), i.isTrailingSpaceSensitive = l.isTrailingSpaceSensitive, i.hasTrailingSpaces = l.hasTrailingSpaces, r.removeChild(o), n--, r.removeChild(
      l);
    }
  });
}
function qE(e, t) {
  if (t.parser === "html") return;
  let r = /\{\{(.+?)\}\}/su;
  e.walk((n) => {
    if (lC(n)) for (let o of n.children) {
      if (o.type !== "text") continue;
      let i = o.sourceSpan.start, l = null, u = o.value.split(r);
      for (let c = 0; c < u.length; c++, i = l) {
        let p = u[c];
        if (c % 2 === 0) {
          l = i.moveBy(p.length), p.length > 0 && n.insertChildBefore(o, { type: "text", value: p, sourceSpan: new $(i, l) });
          continue;
        }
        l = i.moveBy(p.length + 4), n.insertChildBefore(o, { type: "interpolation", sourceSpan: new $(i, l), children: p.length === 0 ? [] :
        [{ type: "text", value: p, sourceSpan: new $(i.moveBy(2), l.moveBy(-2)) }] });
      }
      n.removeChild(o);
    }
  });
}
function UE(e) {
  e.walk((t) => {
    if (!t.children) return;
    if (t.children.length === 0 || t.children.length === 1 && t.children[0].type === "text" && Rt.trim(t.children[0].value).length === 0) {
      t.hasDanglingSpaces = t.children.length > 0, t.children = [];
      return;
    }
    let r = sC(t), n = c2(t);
    if (!r) for (let o = 0; o < t.children.length; o++) {
      let i = t.children[o];
      if (i.type !== "text") continue;
      let { leadingWhitespace: l, text: u, trailingWhitespace: c } = aC(i.value), p = i.prev, d = i.next;
      u ? (i.value = u, i.sourceSpan = new $(i.sourceSpan.start.moveBy(l.length), i.sourceSpan.end.moveBy(-c.length)), l && (p && (p.hasTrailingSpaces =
      !0), i.hasLeadingSpaces = !0), c && (i.hasTrailingSpaces = !0, d && (d.hasLeadingSpaces = !0))) : (t.removeChild(i), o--, (l || c) && (p &&
      (p.hasTrailingSpaces = !0), d && (d.hasLeadingSpaces = !0)));
    }
    t.isWhitespaceSensitive = r, t.isIndentationSensitive = n;
  });
}
function GE(e) {
  e.walk((t) => {
    t.isSelfClosing = !t.children || t.type === "element" && (t.tagDefinition.isVoid || t.endSourceSpan && t.startSourceSpan.start === t.endSourceSpan.
    start && t.startSourceSpan.end === t.endSourceSpan.end);
  });
}
function YE(e, t) {
  e.walk((r) => {
    r.type === "element" && (r.hasHtmComponentClosingTag = r.endSourceSpan && /^<\s*\/\s*\/\s*>$/u.test(t.originalText.slice(r.endSourceSpan.
    start.offset, r.endSourceSpan.end.offset)));
  });
}
function XE(e, t) {
  e.walk((r) => {
    r.cssDisplay = EC(r, t);
  });
}
function KE(e, t) {
  e.walk((r) => {
    let { children: n } = r;
    if (n) {
      if (n.length === 0) {
        r.isDanglingSpaceSensitive = pC(r);
        return;
      }
      for (let o of n) o.isLeadingSpaceSensitive = uC(o, t), o.isTrailingSpaceSensitive = cC(o, t);
      for (let o = 0; o < n.length; o++) {
        let i = n[o];
        i.isLeadingSpaceSensitive = (o === 0 || i.prev.isTrailingSpaceSensitive) && i.isLeadingSpaceSensitive, i.isTrailingSpaceSensitive = (o ===
        n.length - 1 || i.next.isLeadingSpaceSensitive) && i.isTrailingSpaceSensitive;
      }
    }
  });
}
function JE(e, t, r) {
  let { node: n } = e;
  switch (n.type) {
    case "front-matter":
      return dt(n.raw);
    case "root":
      return t.__onHtmlRoot && t.__onHtmlRoot(n), [fe(wc(e, t, r)), Q];
    case "element":
    case "ieConditionalComment":
      return ME(e, t, r);
    case "angularControlFlowBlock":
      return kE(e, t, r);
    case "angularControlFlowBlockParameters":
      return TE(e, t, r);
    case "angularControlFlowBlockParameter":
      return Rt.trim(n.expression);
    case "angularLetDeclaration":
      return fe(["@let ", fe([n.id, " =", fe(St([be, r("init")]))]), ";"]);
    case "angularLetDeclarationInitializer":
      return n.value;
    case "angularIcuExpression":
      return BE(e, t, r);
    case "angularIcuCase":
      return IE(e, t, r);
    case "ieConditionalStartComment":
    case "ieConditionalEndComment":
      return [xa(n), Da(n)];
    case "interpolation":
      return [xa(n, t), ...e.map(r, "children"), Da(n, t)];
    case "text": {
      if (n.parent.type === "interpolation") {
        let i = /\n[^\S\n]*$/u, l = i.test(n.value), u = l ? n.value.replace(i, "") : n.value;
        return [dt(u), l ? Q : ""];
      }
      let o = Bx([zr(n, t), ...y2(n), Pr(n, t)]);
      return Array.isArray(o) ? i2(o) : o;
    }
    case "docType":
      return [fe([xa(n, t), " ", Ge(!1, n.value.replace(/^html\b/iu, "html"), /\s+/gu, " ")]), Da(n, t)];
    case "comment":
      return [zr(n, t), dt(t.originalText.slice(el(n), tl(n))), Pr(n, t)];
    case "attribute": {
      if (n.value === null) return n.rawName;
      let o = b2(n.value), i = Mx(o, '"');
      return [n.rawName, "=", i, dt(i === '"' ? Ge(!1, o, '"', "&quot;") : Ge(!1, o, "'", "&apos;")), i];
    }
    case "cdata":
    default:
      throw new $x(n, "HTML");
  }
}
function ol(e, t = !0) {
  if (e[0] != ":") return [null, e];
  let r = e.indexOf(":", 1);
  if (r === -1) {
    if (t) throw new Error(`Unsupported format "${e}" expecting ":namespace:name"`);
    return [null, e];
  }
  return [e.slice(1, r), e.slice(r + 1)];
}
function P5(e) {
  return ol(e)[1] === "ng-container";
}
function H5(e) {
  return ol(e)[1] === "ng-content";
}
function Mi(e) {
  return e === null ? null : ol(e)[0];
}
function Ni(e, t) {
  return e ? `:${e}:${t}` : t;
}
function z5() {
  return _i || (_i = {}, Bi(Lr.HTML, ["iframe|srcdoc", "*|innerHTML", "*|outerHTML"]), Bi(Lr.STYLE, ["*|style"]), Bi(Lr.URL, ["*|formAction",
  "area|href", "area|ping", "audio|src", "a|href", "a|ping", "blockquote|cite", "body|background", "del|cite", "form|action", "img|src", "in\
put|src", "ins|cite", "q|cite", "source|src", "track|src", "video|poster", "video|src"]), Bi(Lr.RESOURCE_URL, ["applet|code", "applet|codeba\
se", "base|href", "embed|src", "frame|src", "head|profile", "html|manifest", "iframe|src", "link|href", "media|src", "object|codebase", "obj\
ect|data", "script|src"])), _i;
}
function Bi(e, t) {
  for (let r of t) _i[r.toLowerCase()] = e;
}
function dR(e) {
  switch (e) {
    case "width":
    case "height":
    case "minWidth":
    case "minHeight":
    case "maxWidth":
    case "maxHeight":
    case "left":
    case "top":
    case "bottom":
    case "right":
    case "fontSize":
    case "outlineWidth":
    case "outlineOffset":
    case "paddingTop":
    case "paddingLeft":
    case "paddingBottom":
    case "paddingRight":
    case "marginTop":
    case "marginLeft":
    case "marginBottom":
    case "marginRight":
    case "borderRadius":
    case "borderWidth":
    case "borderTopWidth":
    case "borderLeftWidth":
    case "borderRightWidth":
    case "borderBottomWidth":
    case "textIndent":
      return !0;
    default:
      return !1;
  }
}
function Qu(e) {
  return ba || (O5 = new O({ canSelfClose: !0 }), ba = Object.assign(/* @__PURE__ */ Object.create(null), { base: new O({ isVoid: !0 }), meta: new O(
  { isVoid: !0 }), area: new O({ isVoid: !0 }), embed: new O({ isVoid: !0 }), link: new O({ isVoid: !0 }), img: new O({ isVoid: !0 }), input: new O(
  { isVoid: !0 }), param: new O({ isVoid: !0 }), hr: new O({ isVoid: !0 }), br: new O({ isVoid: !0 }), source: new O({ isVoid: !0 }), track: new O(
  { isVoid: !0 }), wbr: new O({ isVoid: !0 }), p: new O({ closedByChildren: ["address", "article", "aside", "blockquote", "div", "dl", "fiel\
dset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "\
ul"], closedByParent: !0 }), thead: new O({ closedByChildren: ["tbody", "tfoot"] }), tbody: new O({ closedByChildren: ["tbody", "tfoot"], closedByParent: !0 }),
  tfoot: new O({ closedByChildren: ["tbody"], closedByParent: !0 }), tr: new O({ closedByChildren: ["tr"], closedByParent: !0 }), td: new O(
  { closedByChildren: ["td", "th"], closedByParent: !0 }), th: new O({ closedByChildren: ["td", "th"], closedByParent: !0 }), col: new O({ isVoid: !0 }),
  svg: new O({ implicitNamespacePrefix: "svg" }), foreignObject: new O({ implicitNamespacePrefix: "svg", preventNamespaceInheritance: !0 }),
  math: new O({ implicitNamespacePrefix: "math" }), li: new O({ closedByChildren: ["li"], closedByParent: !0 }), dt: new O({ closedByChildren: [
  "dt", "dd"] }), dd: new O({ closedByChildren: ["dt", "dd"], closedByParent: !0 }), rb: new O({ closedByChildren: ["rb", "rt", "rtc", "rp"],
  closedByParent: !0 }), rt: new O({ closedByChildren: ["rb", "rt", "rtc", "rp"], closedByParent: !0 }), rtc: new O({ closedByChildren: ["rb",
  "rtc", "rp"], closedByParent: !0 }), rp: new O({ closedByChildren: ["rb", "rt", "rtc", "rp"], closedByParent: !0 }), optgroup: new O({ closedByChildren: [
  "optgroup"], closedByParent: !0 }), option: new O({ closedByChildren: ["option", "optgroup"], closedByParent: !0 }), pre: new O({ ignoreFirstLf: !0 }),
  listing: new O({ ignoreFirstLf: !0 }), style: new O({ contentType: pt.RAW_TEXT }), script: new O({ contentType: pt.RAW_TEXT }), title: new O(
  { contentType: { default: pt.ESCAPABLE_RAW_TEXT, svg: pt.PARSABLE_DATA } }), textarea: new O({ contentType: pt.ESCAPABLE_RAW_TEXT, ignoreFirstLf: !0 }) }),
  new pR().allKnownElementNames().forEach((t) => {
    !ba[t] && Mi(t) === null && (ba[t] = new O({ canSelfClose: !1 }));
  })), ba[e] ?? O5;
}
function _2(e, t, r = null) {
  let n = [], o = e.visit ? (i) => e.visit(i, r) || i.visit(e, r) : (i) => i.visit(e, r);
  return t.forEach((i) => {
    let l = o(i);
    l && n.push(l);
  }), n;
}
function CR(e, t) {
  if (t != null && !(Array.isArray(t) && t.length == 2)) throw new Error(`Expected '${e}' to be an array, [start, end].`);
  if (t != null) {
    let r = t[0], n = t[1];
    xR.forEach((o) => {
      if (o.test(r) || o.test(n)) throw new Error(`['${r}', '${n}'] contains unusable interpolation symbol.`);
    });
  }
}
function SR(e, t, r, n = {}) {
  let o = new kR(new T2(e, t), r, n);
  return o.tokenize(), new RR(_R(o.tokens), o.errors, o.nonNormalizedIcuExpressions);
}
function Fn(e) {
  return `Unexpected character "${e === 0 ? "EOF" : String.fromCharCode(e)}"`;
}
function j5(e) {
  return `Unknown entity "${e}" - use the "&#<decimal>;" or  "&#x<hex>;" syntax`;
}
function FR(e, t) {
  return `Unable to parse entity "${t}" - ${e} character reference entities must end with ";"`;
}
function ue(e) {
  return !Hi(e) || e === 0;
}
function V5(e) {
  return Hi(e) || e === 62 || e === 60 || e === 47 || e === 39 || e === 34 || e === 61 || e === 0;
}
function LR(e) {
  return (e < 97 || 122 < e) && (e < 65 || 90 < e) && (e < 48 || e > 57);
}
function TR(e) {
  return e === 59 || e === 0 || !_E(e);
}
function BR(e) {
  return e === 59 || e === 0 || !zi(e);
}
function IR(e) {
  return e !== 125;
}
function MR(e, t) {
  return W5(e) === W5(t);
}
function W5(e) {
  return e >= 97 && e <= 122 ? e - 97 + 65 : e;
}
function q5(e) {
  return zi(e) || bc(e) || e === 95;
}
function U5(e) {
  return e !== 59 && ue(e);
}
function _R(e) {
  let t = [], r;
  for (let n = 0; n < e.length; n++) {
    let o = e[n];
    r && r.type === 5 && o.type === 5 || r && r.type === 16 && o.type === 16 ? (r.parts[0] += o.parts[0], r.sourceSpan.end = o.sourceSpan.end) :
    (r = o, t.push(r));
  }
  return t;
}
function G5(e, t) {
  return e.length > 0 && e[e.length - 1] === t;
}
function Y5(e, t) {
  return $i[t] !== void 0 ? $i[t] || e : /^#x[a-f0-9]+$/i.test(t) ? String.fromCodePoint(parseInt(t.slice(2), 16)) : /^#\d+$/.test(t) ? String.
  fromCodePoint(parseInt(t.slice(1), 10)) : e;
}
function X5(e, t = {}) {
  let { canSelfClose: r = !1, allowHtmComponentClosingTags: n = !1, isTagNameCaseSensitive: o = !1, getTagContentType: i, tokenizeAngularBlocks: l = !1,
  tokenizeAngularLetDeclaration: u = !1 } = t;
  return $R().parse(e, "angular-html-parser", { tokenizeExpansionForms: l, interpolationConfig: void 0, canSelfClose: r, allowHtmComponentClosingTags: n,
  tokenizeBlocks: l, tokenizeLet: u }, o, i);
}
function jR(e, t) {
  let r = new SyntaxError(e + " (" + t.loc.start.line + ":" + t.loc.start.column + ")");
  return Object.assign(r, t);
}
function WR(e) {
  let t = e.slice(0, ya);
  if (t !== "---" && t !== "+++") return;
  let r = e.indexOf(`
`, ya);
  if (r === -1) return;
  let n = e.slice(ya, r).trim(), o = e.indexOf(`
${t}`, r), i = n;
  if (i || (i = t === "+++" ? "toml" : "yaml"), o === -1 && t === "---" && i === "yaml" && (o = e.indexOf(`
...`, r)), o === -1) return;
  let l = o + 1 + ya, u = e.charAt(l + 1);
  if (!/\s?/u.test(u)) return;
  let c = e.slice(0, l);
  return { type: "front-matter", language: i, explicitLanguage: n, value: e.slice(r + 1, o), startDelimiter: t, endDelimiter: c.slice(-ya), raw: c };
}
function qR(e) {
  let t = WR(e);
  if (!t) return { content: e };
  let { raw: r } = t;
  return { frontMatter: t, content: Ge(!1, r, /[^\n]/gu, " ") + e.slice(r.length) };
}
function YR(e, t) {
  let r = e.map(t);
  return r.some((n, o) => n !== e[o]) ? r : e;
}
function KR(e, t) {
  if (e.value) for (let { regex: r, parse: n } of XR) {
    let o = e.value.match(r);
    if (o) return n(e, t, o);
  }
  return null;
}
function ZR(e, t, r) {
  let [, n, o, i] = r, l = 4 + n.length, u = e.sourceSpan.start.moveBy(l), c = u.moveBy(i.length), [p, d] = (() => {
    try {
      return [!0, t(i, u).children];
    } catch {
      return [!1, [{ type: "text", value: i, sourceSpan: new $(u, c) }]];
    }
  })();
  return { type: "ieConditionalComment", complete: p, children: d, condition: Ge(!1, o.trim(), /\s+/gu, " "), sourceSpan: e.sourceSpan, startSourceSpan: new $(
  e.sourceSpan.start, u), endSourceSpan: new $(c, e.sourceSpan.end) };
}
function JR(e, t, r) {
  let [, n] = r;
  return { type: "ieConditionalStartComment", condition: Ge(!1, n.trim(), /\s+/gu, " "), sourceSpan: e.sourceSpan };
}
function QR(e) {
  return { type: "ieConditionalEndComment", sourceSpan: e.sourceSpan };
}
function tS(e) {
  if (e.type === "block") {
    if (e.name = Ge(!1, e.name.toLowerCase(), /\s+/gu, " ").trim(), e.type = "angularControlFlowBlock", !hc(e.parameters)) {
      delete e.parameters;
      return;
    }
    for (let t of e.parameters) t.type = "angularControlFlowBlockParameter";
    e.parameters = { type: "angularControlFlowBlockParameters", children: e.parameters, sourceSpan: new $(e.parameters[0].sourceSpan.start, Fa(
    !1, e.parameters, -1).sourceSpan.end) };
  }
}
function rS(e) {
  e.type === "letDeclaration" && (e.type = "angularLetDeclaration", e.id = e.name, e.init = { type: "angularLetDeclarationInitializer", sourceSpan: new $(
  e.valueSpan.start, e.valueSpan.end), value: e.value }, delete e.name, delete e.value);
}
function nS(e) {
  (e.type === "plural" || e.type === "select") && (e.clause = e.type, e.type = "angularIcuExpression"), e.type === "expansionCase" && (e.type =
  "angularIcuCase");
}
function z2(e, t, r) {
  let { name: n, canSelfClose: o = !0, normalizeTagName: i = !1, normalizeAttributeName: l = !1, allowHtmComponentClosingTags: u = !1, isTagNameCaseSensitive: c = !1,
  shouldParseAsRawText: p } = t, { rootNodes: d, errors: h } = X5(e, { canSelfClose: o, allowHtmComponentClosingTags: u, isTagNameCaseSensitive: c,
  getTagContentType: p ? (...w) => p(...w) ? pt.RAW_TEXT : void 0 : void 0, tokenizeAngularBlocks: n === "angular" ? !0 : void 0, tokenizeAngularLetDeclaration: n ===
  "angular" ? !0 : void 0 });
  if (n === "vue") {
    if (d.some((C) => C.type === "docType" && C.value === "html" || C.type === "element" && C.name.toLowerCase() === "html")) return z2(e, N2,
    r);
    let w, D = /* @__PURE__ */ a(() => w ?? (w = X5(e, { canSelfClose: o, allowHtmComponentClosingTags: u, isTagNameCaseSensitive: c })), "y"),
    x = /* @__PURE__ */ a((C) => D().rootNodes.find(({ startSourceSpan: E }) => E && E.start.offset === C.startSourceSpan.start.offset) ?? C,
    "M");
    for (let [C, E] of d.entries()) {
      let { endSourceSpan: R, startSourceSpan: F } = E;
      if (R === null) h = D().errors, d[C] = x(E);
      else if (oS(E, r)) {
        let S = D().errors.find((k) => k.span.start.offset > F.start.offset && k.span.start.offset < R.end.offset);
        S && Z5(S), d[C] = x(E);
      }
    }
  }
  h.length > 0 && Z5(h[0]);
  let f = /* @__PURE__ */ a((w) => {
    let D = w.name.startsWith(":") ? w.name.slice(1).split(":")[0] : null, x = w.nameSpan.toString(), C = D !== null && x.startsWith(`${D}:`),
    E = C ? x.slice(D.length + 1) : x;
    w.name = E, w.namespace = D, w.hasExplicitNamespace = C;
  }, "d"), v = /* @__PURE__ */ a((w) => {
    switch (w.type) {
      case "element":
        f(w);
        for (let D of w.attrs) f(D), D.valueSpan ? (D.value = D.valueSpan.toString(), /["']/u.test(D.value[0]) && (D.value = D.value.slice(1,
        -1))) : D.value = null;
        break;
      case "comment":
        w.value = w.sourceSpan.toString().slice(4, -3);
        break;
      case "text":
        w.value = w.sourceSpan.toString();
        break;
    }
  }, "C"), b = /* @__PURE__ */ a((w, D) => {
    let x = w.toLowerCase();
    return D(x) ? x : w;
  }, "A"), m = /* @__PURE__ */ a((w) => {
    if (w.type === "element" && (i && (!w.namespace || w.namespace === w.tagDefinition.implicitNamespacePrefix || Ra(w)) && (w.name = b(w.name,
    (D) => eS.has(D))), l)) for (let D of w.attrs) D.namespace || (D.name = b(D.name, (x) => Xu.has(w.name) && (Xu.get("*").has(x) || Xu.get(
    w.name).has(x))));
  }, "D"), g = /* @__PURE__ */ a((w) => {
    w.sourceSpan && w.endSourceSpan && (w.sourceSpan = new $(w.sourceSpan.start, w.endSourceSpan.end));
  }, "R"), y = /* @__PURE__ */ a((w) => {
    if (w.type === "element") {
      let D = Qu(c ? w.name : w.name.toLowerCase());
      !w.namespace || w.namespace === D.implicitNamespacePrefix || Ra(w) ? w.tagDefinition = D : w.tagDefinition = Qu("");
    }
  }, "F");
  return _2(new class extends yR {
    visitExpansionCase(w, D) {
      n === "angular" && this.visitChildren(D, (x) => {
        x(w.expression);
      });
    }
    visit(w) {
      v(w), y(w), m(w), g(w);
    }
  }(), d), d;
}
function oS(e, t) {
  var r;
  if (e.type !== "element" || e.name !== "template") return !1;
  let n = (r = e.attrs.find((o) => o.name === "lang")) == null ? void 0 : r.value;
  return !n || Zi(t, { language: n }) === "html";
}
function Z5(e) {
  let { msg: t, span: { start: r, end: n } } = e;
  throw VR(t, { loc: { start: { line: r.line + 1, column: r.col + 1 }, end: { line: n.line + 1, column: n.col + 1 } }, cause: e });
}
function O2(e, t, r = {}, n = !0) {
  let { frontMatter: o, content: i } = n ? UR(e) : { frontMatter: null, content: e }, l = new T2(e, r.filepath), u = new Ju(l, 0, 0, 0), c = u.
  moveBy(e.length), p = { type: "root", sourceSpan: new $(u, c), children: z2(i, t, r) };
  if (o) {
    let f = new Ju(l, 0, 0, 0), v = f.moveBy(o.raw.length);
    o.sourceSpan = new $(f, v), p.children.unshift(o);
  }
  let d = new GR(p), h = /* @__PURE__ */ a((f, v) => {
    let { offset: b } = v, m = Ge(!1, e.slice(0, b), /[^\n\r]/gu, " "), g = O2(m + f, t, r, !1);
    g.sourceSpan = new $(v, Fa(!1, g.children, -1).sourceSpan.end);
    let y = g.children[0];
    return y.length === b ? g.children.shift() : (y.sourceSpan = new $(y.sourceSpan.start.moveBy(b), y.sourceSpan.end), y.value = y.value.slice(
    b)), g;
  }, "f");
  return d.walk((f) => {
    if (f.type === "comment") {
      let v = KR(f, h);
      v && f.parent.replaceChild(f, v);
    }
    tS(f), rS(f), nS(f);
  }), d;
}
function al(e) {
  return { parse: /* @__PURE__ */ a((t, r) => O2(t, e, r), "parse"), hasPragma: SE, astFormat: "html", locStart: el, locEnd: tl };
}
var gx, J5, Q5, e2, rr, vx, wx, t2, bx, Ge, ec, tc, rc, Vi, Wi, nc, Ea, qi, Ui, Gi, oc, ac, Or, ic, Yi, r2, lc, Dx, kn, Cx, n2, o2, _r, sc, Aa,
Ax, Fx, be, ke, Q, kx, Lx, Fa, ki, x5, Mx, ct, Ln, Px, Hx, zx, Ox, Rt, Tn, Nx, $x, Xi, Vx, Wx, qx, Gx, Xx, Kx, Zi, Qx, eC, tC, rC, Ra, oC, s2,
aC, SC, x2, LC, TC, BC, MC, PC, HC, zC, OC, NC, S5, $C, VC, C2, qC, GC, Wu, fc, oE, lE, R2, S2, hc, F2, mE, vE, va, wE, DE, xE, CE, EE, RE, FE,
PE, Tr, Ju, Bn, T2, In, $, Oi, Mn, B2, zE, ZE, QE, eR, tR, F5, k5, rR, nR, I2, F$, L5, T5, B5, I5, M5, Lr, _5, pt, _i, _n, oR, aR, iR, lR, sR,
uR, M2, cR, Pn, pR, Hn, O, O5, ba, zn, uo, On, fR, Nn, hR, $n, mR, jn, gR, Vn, vR, Wn, nr, qn, wR, Un, bR, Gn, An, Yn, N5, Xn, $5, Kn, yR, $i,
DR, xR, Br, ER, P2, Zn, Uu, Jn, RR, AR, ji, Qn, Gu, eo, kR, or, H2, ar, PR, to, Dc, Ir, Ie, ro, HR, no, zR, Mr, OR, oo, NR, Yu, $R, VR, ya, UR,
Ii, K5, Et, GR, XR, Xu, eS, N2, aS, iS, lS, sS, uS, $2, j2 = A(() => {
  gx = Object.defineProperty, J5 = /* @__PURE__ */ a((e) => {
    throw TypeError(e);
  }, "Xr"), Q5 = /* @__PURE__ */ a((e, t) => {
    for (var r in t) gx(e, r, { get: t[r], enumerable: !0 });
  }, "Jr"), e2 = /* @__PURE__ */ a((e, t, r) => t.has(e) || J5("Cannot " + r), "Zr"), rr = /* @__PURE__ */ a((e, t, r) => (e2(e, t, "read fr\
om private field"), r ? r.call(e) : t.get(e)), "Q"), vx = /* @__PURE__ */ a((e, t, r) => t.has(e) ? J5("Cannot add the same private member m\
ore than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), "en"), wx = /* @__PURE__ */ a((e, t, r, n) => (e2(e, t, "write to private f\
ield"), n ? n.call(e, r) : t.set(e, r), r), "tn"), t2 = {};
  Q5(t2, { languages: /* @__PURE__ */ a(() => tR, "languages"), options: /* @__PURE__ */ a(() => nR, "options"), parsers: /* @__PURE__ */ a(
  () => I2, "parsers"), printers: /* @__PURE__ */ a(() => uS, "printers") });
  bx = /* @__PURE__ */ a((e, t, r, n) => {
    if (!(e && t == null)) return t.replaceAll ? t.replaceAll(r, n) : r.global ? t.replace(r, n) : t.split(r).join(n);
  }, "si"), Ge = bx, ec = "string", tc = "array", rc = "cursor", Vi = "indent", Wi = "align", nc = "trim", Ea = "group", qi = "fill", Ui = "\
if-break", Gi = "indent-if-break", oc = "line-suffix", ac = "line-suffix-boundary", Or = "line", ic = "label", Yi = "break-parent", r2 = /* @__PURE__ */ new Set(
  [rc, Vi, Wi, nc, Ea, qi, Ui, Gi, oc, ac, Or, ic, Yi]);
  a(yx, "ii");
  lc = yx, Dx = /* @__PURE__ */ a((e) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(e), "ai");
  a(xx, "oi");
  Cx = (kn = class extends Error {
    name = "InvalidDocError";
    constructor(t) {
      super(xx(t)), this.doc = t;
    }
  }, a(kn, "lr"), kn), n2 = Cx, o2 = /* @__PURE__ */ a(() => {
  }, "rn"), _r = o2, sc = o2;
  a(St, "k");
  a(a2, "nn");
  a(fe, "_");
  a(Ex, "sn");
  a(Rx, "an");
  a(i2, "At");
  a(Pi, "ge");
  a(Sx, "on");
  Aa = { type: Yi }, Ax = { type: Or, hard: !0 }, Fx = { type: Or, hard: !0, literal: !0 }, be = { type: Or }, ke = { type: Or, soft: !0 }, Q =
  [Ax, Aa], kx = [Fx, Aa];
  a(io, "q");
  Lx = /* @__PURE__ */ a((e, t, r) => {
    if (!(e && t == null)) return Array.isArray(t) || typeof t == "string" ? t[r < 0 ? t.length + r : r] : t.at(r);
  }, "ci"), Fa = Lx;
  a(uc, "Dt");
  a(Tx, "pi");
  a(Bx, "ln");
  a(dt, "B");
  ki = "'", x5 = '"';
  a(Ix, "hi");
  Mx = Ix;
  a(_x, "cr");
  Px = (Ln = class {
    constructor(t) {
      vx(this, ct), wx(this, ct, new Set(t));
    }
    getLeadingWhitespaceCount(t) {
      let r = rr(this, ct), n = 0;
      for (let o = 0; o < t.length && r.has(t.charAt(o)); o++) n++;
      return n;
    }
    getTrailingWhitespaceCount(t) {
      let r = rr(this, ct), n = 0;
      for (let o = t.length - 1; o >= 0 && r.has(t.charAt(o)); o--) n++;
      return n;
    }
    getLeadingWhitespace(t) {
      let r = this.getLeadingWhitespaceCount(t);
      return t.slice(0, r);
    }
    getTrailingWhitespace(t) {
      let r = this.getTrailingWhitespaceCount(t);
      return t.slice(t.length - r);
    }
    hasLeadingWhitespace(t) {
      return rr(this, ct).has(t.charAt(0));
    }
    hasTrailingWhitespace(t) {
      return rr(this, ct).has(Fa(!1, t, -1));
    }
    trimStart(t) {
      let r = this.getLeadingWhitespaceCount(t);
      return t.slice(r);
    }
    trimEnd(t) {
      let r = this.getTrailingWhitespaceCount(t);
      return t.slice(0, t.length - r);
    }
    trim(t) {
      return this.trimEnd(this.trimStart(t));
    }
    split(t, r = !1) {
      let n = `[${_x([...rr(this, ct)].join(""))}]+`, o = new RegExp(r ? `(${n})` : n, "u");
      return t.split(o);
    }
    hasWhitespaceCharacter(t) {
      let r = rr(this, ct);
      return Array.prototype.some.call(t, (n) => r.has(n));
    }
    hasNonWhitespaceCharacter(t) {
      let r = rr(this, ct);
      return Array.prototype.some.call(t, (n) => !r.has(n));
    }
    isWhitespaceOnly(t) {
      let r = rr(this, ct);
      return Array.prototype.every.call(t, (n) => r.has(n));
    }
  }, a(Ln, "pr"), Ln);
  ct = /* @__PURE__ */ new WeakMap();
  Hx = Px, zx = ["	", `
`, "\f", "\r", " "], Ox = new Hx(zx), Rt = Ox, Nx = (Tn = class extends Error {
    name = "UnexpectedNodeError";
    constructor(t, r, n = "type") {
      super(`Unexpected ${r} node ${n}: ${JSON.stringify(t[n])}.`), this.node = t;
    }
  }, a(Tn, "hr"), Tn), $x = Nx;
  a(jx, "di");
  Xi = jx, Vx = /* @__PURE__ */ new Set(["sourceSpan", "startSourceSpan", "endSourceSpan", "nameSpan", "valueSpan", "keySpan", "tagDefinitio\
n", "tokens", "valueTokens", "switchValueSourceSpan", "expSourceSpan", "valueSourceSpan"]), Wx = /* @__PURE__ */ new Set(["if", "else if", "\
for", "switch", "case"]);
  a(l2, "fn");
  l2.ignoredProperties = Vx;
  qx = l2;
  a(Ux, "Si");
  Gx = Ux;
  a(Ki, "Ce");
  a(lo, "j");
  a(ft, "T");
  a(Yx, "_i");
  Xx = Yx, Kx = /* @__PURE__ */ a((e) => String(e).split(/[/\\]/u).pop(), "Ei");
  a(C5, "Sn");
  a(Zx, "Ai");
  a(Jx, "Di");
  Zi = Jx, Qx = "inline", eC = { area: "none", base: "none", basefont: "none", datalist: "none", head: "none", link: "none", meta: "none", noembed: "\
none", noframes: "none", param: "block", rp: "none", script: "block", style: "none", template: "inline", title: "none", html: "block", body: "\
block", address: "block", blockquote: "block", center: "block", dialog: "block", div: "block", figure: "block", figcaption: "block", footer: "\
block", form: "block", header: "block", hr: "block", legend: "block", listing: "block", main: "block", p: "block", plaintext: "block", pre: "\
block", search: "block", xmp: "block", slot: "contents", ruby: "ruby", rt: "ruby-text", article: "block", aside: "block", h1: "block", h2: "\
block", h3: "block", h4: "block", h5: "block", h6: "block", hgroup: "block", nav: "block", section: "block", dir: "block", dd: "block", dl: "\
block", dt: "block", menu: "block", ol: "block", ul: "block", li: "list-item", table: "table", caption: "table-caption", colgroup: "table-co\
lumn-group", col: "table-column", thead: "table-header-group", tbody: "table-row-group", tfoot: "table-footer-group", tr: "table-row", td: "\
table-cell", th: "table-cell", input: "inline-block", button: "inline-block", fieldset: "block", marquee: "inline-block", source: "block", track: "\
block", details: "block", summary: "block", meter: "inline-block", progress: "inline-block", object: "inline-block", video: "inline-block", audio: "\
inline-block", select: "inline-block", option: "block", optgroup: "block" }, tC = "normal", rC = { listing: "pre", plaintext: "pre", pre: "p\
re", xmp: "pre", nobr: "nowrap", table: "initial", textarea: "pre-wrap" };
  a(nC, "vi");
  Ra = nC, oC = /* @__PURE__ */ a((e) => Ge(!1, e, /^[\t\f\r ]*\n/gu, ""), "yi"), s2 = /* @__PURE__ */ a((e) => oC(Rt.trimEnd(e)), "mr"), aC =
  /* @__PURE__ */ a((e) => {
    let t = e, r = Rt.getLeadingWhitespace(t);
    r && (t = t.slice(r.length));
    let n = Rt.getTrailingWhitespace(t);
    return n && (t = t.slice(0, -n.length)), { leadingWhitespace: r, trailingWhitespace: n, text: t };
  }, "vn");
  a(u2, "yt");
  a(Ji, "Ee");
  a(iC, "wi");
  a(rt, "$");
  a(_t, "U");
  a(lC, "yn");
  a(sC, "wn");
  a(c2, "fr");
  a(uC, "bn");
  a(cC, "Tn");
  a(pC, "xn");
  a(Li, "Qe");
  a(dC, "kn");
  a(p2, "dr");
  a(Vu, "wt");
  a(fC, "bi");
  a(d2, "Bn");
  a(f2, "Ln");
  a(h2, "Fn");
  a(m2, "Nn");
  a(cc, "bt");
  a(hC, "Ti");
  a(g2, "Pn");
  a(mC, "xi");
  a(gC, "ki");
  a(vC, "Bi");
  a(E5, "gr");
  a(ka, "Xe");
  a(wC, "Li");
  a(bC, "Fi");
  a(yC, "Ni");
  a(DC, "Pi");
  a(xC, "Ii");
  a(ao, "_e");
  a(CC, "Ri");
  a(EC, "In");
  a(v2, "Rn");
  a(RC, "$i");
  a(w2, "Cr");
  a(b2, "Sr");
  a(ir, "P");
  SC = /* @__PURE__ */ new Set(["template", "style", "script"]);
  a(Qi, "Je");
  a(so, "Ae");
  a(pc, "Tt");
  a(AC, "$n");
  a(FC, "On");
  a(y2, "xt");
  a(D2, "kt");
  x2 = /\{\{(.+?)\}\}/su;
  a(kC, "Mn");
  a(dc, "Er");
  LC = dc({ parser: "__ng_action" }), TC = dc({ parser: "__ng_binding" }), BC = dc({ parser: "__ng_directive" });
  a(IC, "Vi");
  MC = IC;
  a(_C, "Ui");
  PC = _C;
  a(R5, "Vn");
  HC = /^[ \t\n\r\u000c]+/, zC = /^[, \t\n\r\u000c]+/, OC = /^[^ \t\n\r\u000c]+/, NC = /[,]+$/, S5 = /^\d+$/, $C = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;
  a(jC, "Ki");
  VC = jC;
  a(WC, "Qi");
  C2 = { width: "w", height: "h", density: "x" }, qC = Object.keys(C2);
  a(UC, "Ji");
  GC = WC;
  a(YC, "Yn");
  Wu = /* @__PURE__ */ new WeakMap();
  a(XC, "Zi");
  fc = XC;
  a(KC, "jn");
  a(ZC, "Kn");
  a(JC, "Qn");
  a(QC, "Xn");
  a(eE, "ea");
  a(tE, "ta");
  a(rE, "ra");
  a(nE, "na");
  a(E2, "Jn");
  oE = tE;
  a(aE, "sa");
  a(iE, "ia");
  lE = aE, R2 = new Proxy(() => {
  }, { get: /* @__PURE__ */ a(() => R2, "get") }), S2 = R2;
  a(sE, "aa");
  hc = sE;
  a(el, "se");
  a(tl, "ie");
  a(Ku, "Ze");
  a(uE, "oa");
  a(Da, "De");
  a(cE, "ua");
  a(Pr, "W");
  a(mc, "Bt");
  a(La, "ve");
  a(A2, "rs");
  a(Hr, "K");
  a(Ta, "ye");
  a(Sa, "we");
  a(rl, "et");
  a(pE, "la");
  a(nl, "tt");
  a(dE, "ca");
  a(fE, "pa");
  a(Zu, "rt");
  a(xa, "be");
  a(zr, "z");
  a(gc, "Lt");
  a(vc, "Ft");
  a(hE, "ha");
  F2 = hE, mE = /* @__PURE__ */ new Set(["if", "else if", "for", "switch", "case"]);
  a(gE, "fa");
  vE = gE, va = null;
  a(Ca, "st");
  wE = 10;
  for (let e = 0; e <= wE; e++) Ca();
  a(bE, "vr");
  a(yE, "ga");
  DE = yE, xE = { "front-matter": [], root: ["children"], element: ["attrs", "children"], ieConditionalComment: ["children"], ieConditionalStartComment: [],
  ieConditionalEndComment: [], interpolation: ["children"], text: ["children"], docType: [], comment: [], attribute: [], cdata: [], angularControlFlowBlock: [
  "children", "parameters"], angularControlFlowBlockParameters: ["children"], angularControlFlowBlockParameter: [], angularLetDeclaration: [
  "init"], angularLetDeclarationInitializer: [], angularIcuExpression: ["cases"], angularIcuCase: ["expression"] }, CE = xE, EE = DE(CE), RE =
  EE;
  a(SE, "os");
  a(AE, "us");
  FE = /* @__PURE__ */ new Map([["if", /* @__PURE__ */ new Set(["else if", "else"])], ["else if", /* @__PURE__ */ new Set(["else if", "else"])],
  ["for", /* @__PURE__ */ new Set(["empty"])], ["defer", /* @__PURE__ */ new Set(["placeholder", "error", "loading"])], ["placeholder", /* @__PURE__ */ new Set(
  ["placeholder", "error", "loading"])], ["error", /* @__PURE__ */ new Set(["placeholder", "error", "loading"])], ["loading", /* @__PURE__ */ new Set(
  ["placeholder", "error", "loading"])]]);
  a(k2, "cs");
  a(wa, "it");
  a(Ti, "Pt");
  a(wc, "He");
  a(kE, "ps");
  a(L2, "hs");
  a(LE, "_a");
  a(TE, "ms");
  a(BE, "fs");
  a(IE, "ds");
  a(ME, "gs");
  a(Hi, "at");
  a(bc, "It");
  a(zi, "ot");
  a(_E, "Cs");
  a(yc, "Rt");
  a(A5, "yr");
  a(qu, "$t");
  PE = /-+([a-z0-9])/g;
  a(HE, "_s");
  Ju = (Tr = class {
    constructor(t, r, n, o) {
      this.file = t, this.offset = r, this.line = n, this.col = o;
    }
    toString() {
      return this.offset != null ? `${this.file.url}@${this.line}:${this.col}` : this.file.url;
    }
    moveBy(t) {
      let r = this.file.content, n = r.length, o = this.offset, i = this.line, l = this.col;
      for (; o > 0 && t < 0; ) if (o--, t++, r.charCodeAt(o) == 10) {
        i--;
        let u = r.substring(0, o - 1).lastIndexOf(`
`);
        l = u > 0 ? o - u : o;
      } else l--;
      for (; o < n && t > 0; ) {
        let u = r.charCodeAt(o);
        o++, t--, u == 10 ? (i++, l = 0) : l++;
      }
      return new Tr(this.file, o, i, l);
    }
    getContext(t, r) {
      let n = this.file.content, o = this.offset;
      if (o != null) {
        o > n.length - 1 && (o = n.length - 1);
        let i = o, l = 0, u = 0;
        for (; l < t && o > 0 && (o--, l++, !(n[o] == `
` && ++u == r)); ) ;
        for (l = 0, u = 0; l < t && i < n.length - 1 && (i++, l++, !(n[i] == `
` && ++u == r)); ) ;
        return { before: n.substring(o, this.offset), after: n.substring(this.offset, i + 1) };
      }
      return null;
    }
  }, a(Tr, "t"), Tr), T2 = (Bn = class {
    constructor(t, r) {
      this.content = t, this.url = r;
    }
  }, a(Bn, "Te"), Bn), $ = (In = class {
    constructor(t, r, n = t, o = null) {
      this.start = t, this.end = r, this.fullStart = n, this.details = o;
    }
    toString() {
      return this.start.file.content.substring(this.start.offset, this.end.offset);
    }
  }, a(In, "h"), In);
  (function(e) {
    e[e.WARNING = 0] = "WARNING", e[e.ERROR = 1] = "ERROR";
  })(Oi || (Oi = {}));
  B2 = (Mn = class {
    constructor(t, r, n = Oi.ERROR) {
      this.span = t, this.msg = r, this.level = n;
    }
    contextualMessage() {
      let t = this.span.start.getContext(100, 3);
      return t ? `${this.msg} ("${t.before}[${Oi[this.level]} ->]${t.after}")` : this.msg;
    }
    toString() {
      let t = this.span.details ? `, ${this.span.details}` : "";
      return `${this.contextualMessage()}: ${this.span.start}${t}`;
    }
  }, a(Mn, "Ue"), Mn), zE = [NE, $E, VE, qE, UE, XE, GE, YE, KE, WE];
  a(OE, "Da");
  a(NE, "va");
  a($E, "ya");
  a(jE, "wa");
  a(VE, "ba");
  a(WE, "Ta");
  a(qE, "xa");
  a(UE, "ka");
  a(GE, "Ba");
  a(YE, "La");
  a(XE, "Fa");
  a(KE, "Na");
  ZE = OE;
  a(JE, "Pa");
  QE = { preprocess: ZE, print: JE, insertPragma: AE, massageAstNode: qx, embed: vE, getVisitorKeys: RE }, eR = QE, tR = [{ linguistLanguageId: 146,
  name: "Angular", type: "markup", tmScope: "text.html.basic", aceMode: "html", codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html",
  color: "#e34c26", aliases: ["xhtml"], extensions: [".component.html"], parsers: ["angular"], vscodeLanguageIds: ["html"], filenames: [] },
  { linguistLanguageId: 146, name: "HTML", type: "markup", tmScope: "text.html.basic", aceMode: "html", codemirrorMode: "htmlmixed", codemirrorMimeType: "\
text/html", color: "#e34c26", aliases: ["xhtml"], extensions: [".html", ".hta", ".htm", ".html.hl", ".inc", ".xht", ".xhtml", ".mjml"], parsers: [
  "html"], vscodeLanguageIds: ["html"] }, { linguistLanguageId: 146, name: "Lightning Web Components", type: "markup", tmScope: "text.html.b\
asic", aceMode: "html", codemirrorMode: "htmlmixed", codemirrorMimeType: "text/html", color: "#e34c26", aliases: ["xhtml"], extensions: [], parsers: [
  "lwc"], vscodeLanguageIds: ["html"], filenames: [] }, { linguistLanguageId: 391, name: "Vue", type: "markup", color: "#41b883", extensions: [
  ".vue"], tmScope: "text.html.vue", aceMode: "html", parsers: ["vue"], vscodeLanguageIds: ["vue"] }], F5 = { bracketSpacing: { category: "C\
ommon", type: "boolean", default: !0, description: "Print spaces between brackets.", oppositeDescription: "Do not print spaces between brack\
ets." }, singleQuote: { category: "Common", type: "boolean", default: !1, description: "Use single quotes instead of double quotes." }, proseWrap: {
  category: "Common", type: "choice", default: "preserve", description: "How to wrap prose.", choices: [{ value: "always", description: "Wra\
p prose if it exceeds the print width." }, { value: "never", description: "Do not wrap prose." }, { value: "preserve", description: "Wrap pr\
ose as-is." }] }, bracketSameLine: { category: "Common", type: "boolean", default: !1, description: "Put > of opening tags on the last line \
instead of on a new line." }, singleAttributePerLine: { category: "Common", type: "boolean", default: !1, description: "Enforce single attri\
bute per line in HTML, Vue and JSX." } }, k5 = "HTML", rR = { bracketSameLine: F5.bracketSameLine, htmlWhitespaceSensitivity: { category: k5,
  type: "choice", default: "css", description: "How to handle whitespaces in HTML.", choices: [{ value: "css", description: "Respect the def\
ault value of CSS display property." }, { value: "strict", description: "Whitespaces are considered sensitive." }, { value: "ignore", description: "\
Whitespaces are considered insensitive." }] }, singleAttributePerLine: F5.singleAttributePerLine, vueIndentScriptAndStyle: { category: k5, type: "\
boolean", default: !1, description: "Indent script and style tags in Vue files." } }, nR = rR, I2 = {};
  Q5(I2, { angular: /* @__PURE__ */ a(() => iS, "angular"), html: /* @__PURE__ */ a(() => aS, "html"), lwc: /* @__PURE__ */ a(() => sS, "lwc"),
  vue: /* @__PURE__ */ a(() => lS, "vue") });
  F$ = new RegExp(`(\\:not\\()|(([\\.\\#]?)[-\\w]+)|(?:\\[([-.\\w*\\\\$]+)(?:=(["']?)([^\\]"']*)\\5)?\\])|(\\))|(\\s*,\\s*)`, "g");
  (function(e) {
    e[e.Emulated = 0] = "Emulated", e[e.None = 2] = "None", e[e.ShadowDom = 3] = "ShadowDom";
  })(L5 || (L5 = {}));
  (function(e) {
    e[e.OnPush = 0] = "OnPush", e[e.Default = 1] = "Default";
  })(T5 || (T5 = {}));
  (function(e) {
    e[e.None = 0] = "None", e[e.SignalBased = 1] = "SignalBased", e[e.HasDecoratorInputTransform = 2] = "HasDecoratorInputTransform";
  })(B5 || (B5 = {}));
  I5 = { name: "custom-elements" }, M5 = { name: "no-errors-schema" };
  (function(e) {
    e[e.NONE = 0] = "NONE", e[e.HTML = 1] = "HTML", e[e.STYLE = 2] = "STYLE", e[e.SCRIPT = 3] = "SCRIPT", e[e.URL = 4] = "URL", e[e.RESOURCE_URL =
    5] = "RESOURCE_URL";
  })(Lr || (Lr = {}));
  (function(e) {
    e[e.Error = 0] = "Error", e[e.Warning = 1] = "Warning", e[e.Ignore = 2] = "Ignore";
  })(_5 || (_5 = {}));
  (function(e) {
    e[e.RAW_TEXT = 0] = "RAW_TEXT", e[e.ESCAPABLE_RAW_TEXT = 1] = "ESCAPABLE_RAW_TEXT", e[e.PARSABLE_DATA = 2] = "PARSABLE_DATA";
  })(pt || (pt = {}));
  a(ol, "ut");
  a(P5, "xr");
  a(H5, "kr");
  a(Mi, "We");
  a(Ni, "ze");
  a(z5, "Br");
  a(Bi, "Mt");
  oR = (_n = class {
  }, a(_n, "Ht"), _n), aR = "boolean", iR = "number", lR = "string", sR = "object", uR = ["[Element]|textContent,%ariaAtomic,%ariaAutoComple\
te,%ariaBusy,%ariaChecked,%ariaColCount,%ariaColIndex,%ariaColSpan,%ariaCurrent,%ariaDescription,%ariaDisabled,%ariaExpanded,%ariaHasPopup,%\
ariaHidden,%ariaKeyShortcuts,%ariaLabel,%ariaLevel,%ariaLive,%ariaModal,%ariaMultiLine,%ariaMultiSelectable,%ariaOrientation,%ariaPlaceholde\
r,%ariaPosInSet,%ariaPressed,%ariaReadOnly,%ariaRelevant,%ariaRequired,%ariaRoleDescription,%ariaRowCount,%ariaRowIndex,%ariaRowSpan,%ariaSe\
lected,%ariaSetSize,%ariaSort,%ariaValueMax,%ariaValueMin,%ariaValueNow,%ariaValueText,%classList,className,elementTiming,id,innerHTML,*befo\
recopy,*beforecut,*beforepaste,*fullscreenchange,*fullscreenerror,*search,*webkitfullscreenchange,*webkitfullscreenerror,outerHTML,%part,#sc\
rollLeft,#scrollTop,slot,*message,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*webglcontextcreatione\
rror,*webglcontextlost,*webglcontextrestored", "[HTMLElement]^[Element]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,e\
nterKeyHint,!hidden,!inert,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect\
,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragle\
ave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress\
,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,\
*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointero\
ver,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionch\
ange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart\
,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellchec\
k,%style,#tabIndex,title,!translate,virtualKeyboardPolicy", "abbr,address,article,aside,b,bdi,bdo,cite,content,code,dd,dfn,dt,em,figcaption,\
figure,footer,header,hgroup,i,kbd,main,mark,nav,noscript,rb,rp,rt,rtc,ruby,s,samp,section,small,strong,sub,sup,u,var,wbr^[HTMLElement]|acces\
sKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,innerText,inputMode,lang,nonce,*abort,*animationend,*anim\
ationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cu\
echange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formda\
ta,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,\
*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*point\
erenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*secur\
itypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transit\
ioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimati\
onstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy", "media^[HTMLElement]|!au\
toplay,!controls,%controlsList,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,*\
waitingforkey,#playbackRate,preload,!preservesPitch,src,%srcObject,#volume", ":svg:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*ani\
mationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*c\
uechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formd\
ata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown\
,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*poin\
terenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*secu\
ritypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transi\
tioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimat\
ionstart,*webkittransitionend,*wheel,%style,#tabIndex", ":svg:graphics^:svg:|", ":svg:animation^:svg:|*begin,*end,*repeat", ":svg:geometry^:\
svg:|", ":svg:componentTransferFunction^:svg:|", ":svg:gradient^:svg:|", ":svg:textContent^:svg:graphics|", ":svg:textPositioning^:svg:textC\
ontent|", "a^[HTMLElement]|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,referrerPolicy\
,rel,%relList,rev,search,shape,target,text,type,username", "area^[HTMLElement]|alt,coords,download,hash,host,hostname,href,!noHref,password,\
pathname,ping,port,protocol,referrerPolicy,rel,%relList,search,shape,target,username", "audio^media|", "br^[HTMLElement]|clear", "base^[HTML\
Element]|href,target", "body^[HTMLElement]|aLink,background,bgColor,link,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashcha\
nge,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*\
unhandledrejection,*unload,text,vLink", "button^[HTMLElement]|!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,ty\
pe,value", "canvas^[HTMLElement]|#height,#width", "content^[HTMLElement]|select", "dl^[HTMLElement]|!compact", "data^[HTMLElement]|value", "\
datalist^[HTMLElement]|", "details^[HTMLElement]|!open", "dialog^[HTMLElement]|!open,returnValue", "dir^[HTMLElement]|!compact", "div^[HTMLE\
lement]|align", "embed^[HTMLElement]|align,height,name,src,type,width", "fieldset^[HTMLElement]|!disabled,name", "font^[HTMLElement]|color,f\
ace,size", "form^[HTMLElement]|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target", "frame^[HTMLElement]|fram\
eBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src", "frameset^[HTMLElement]|cols,*afterprint,*beforeprint,*beforeunload\
,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandl\
ed,*resize,*scroll,*storage,*unhandledrejection,*unload,rows", "hr^[HTMLElement]|align,color,!noShade,size,width", "head^[HTMLElement]|", "h\
1,h2,h3,h4,h5,h6^[HTMLElement]|align", "html^[HTMLElement]|version", "iframe^[HTMLElement]|align,allow,!allowFullscreen,!allowPaymentRequest\
,csp,frameBorder,height,loading,longDesc,marginHeight,marginWidth,name,referrerPolicy,%sandbox,scrolling,src,srcdoc,width", "img^[HTMLElemen\
t]|align,alt,border,%crossOrigin,decoding,#height,#hspace,!isMap,loading,longDesc,lowsrc,name,referrerPolicy,sizes,src,srcset,useMap,#vspace\
,#width", "input^[HTMLElement]|accept,align,alt,autocomplete,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formE\
nctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeh\
older,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#wid\
th", "li^[HTMLElement]|type,#value", "label^[HTMLElement]|htmlFor", "legend^[HTMLElement]|align", "link^[HTMLElement]|as,charset,%crossOrigi\
n,!disabled,href,hreflang,imageSizes,imageSrcset,integrity,media,referrerPolicy,rel,%relList,rev,%sizes,target,type", "map^[HTMLElement]|nam\
e", "marquee^[HTMLElement]|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width", "menu^[HTML\
Element]|!compact", "meta^[HTMLElement]|content,httpEquiv,media,name,scheme", "meter^[HTMLElement]|#high,#low,#max,#min,#optimum,#value", "i\
ns,del^[HTMLElement]|cite,dateTime", "ol^[HTMLElement]|!compact,!reversed,#start,type", "object^[HTMLElement]|align,archive,border,code,code\
Base,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width", "optgroup^[HTMLElement]|!disabled,label", "option^[HTMLE\
lement]|!defaultSelected,!disabled,label,!selected,text,value", "output^[HTMLElement]|defaultValue,%htmlFor,name,value", "p^[HTMLElement]|al\
ign", "param^[HTMLElement]|name,type,value,valueType", "picture^[HTMLElement]|", "pre^[HTMLElement]|#width", "progress^[HTMLElement]|#max,#v\
alue", "q,blockquote,cite^[HTMLElement]|", "script^[HTMLElement]|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,!noModule,%refer\
rerPolicy,src,text,type", "select^[HTMLElement]|autocomplete,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value", "slot^[\
HTMLElement]|name", "source^[HTMLElement]|#height,media,sizes,src,srcset,type,#width", "span^[HTMLElement]|", "style^[HTMLElement]|!disabled\
,media,type", "caption^[HTMLElement]|align", "th,td^[HTMLElement]|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,\
scope,vAlign,width", "col,colgroup^[HTMLElement]|align,ch,chOff,#span,vAlign,width", "table^[HTMLElement]|align,bgColor,border,%caption,cell\
Padding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width", "tr^[HTMLElement]|align,bgColor,ch,chOff,vAlign", "tfoot,thead,tbody^[HTMLElem\
ent]|align,ch,chOff,vAlign", "template^[HTMLElement]|", "textarea^[HTMLElement]|autocomplete,#cols,defaultValue,dirName,!disabled,#maxLength\
,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap", "time^[HTMLElement]|dat\
eTime", "title^[HTMLElement]|text", "track^[HTMLElement]|!default,kind,label,src,srclang", "ul^[HTMLElement]|!compact,type", "unknown^[HTMLE\
lement]|", "video^media|!disablePictureInPicture,#height,*enterpictureinpicture,*leavepictureinpicture,!playsInline,poster,#width", ":svg:a^\
:svg:graphics|", ":svg:animate^:svg:animation|", ":svg:animateMotion^:svg:animation|", ":svg:animateTransform^:svg:animation|", ":svg:circle\
^:svg:geometry|", ":svg:clipPath^:svg:graphics|", ":svg:defs^:svg:graphics|", ":svg:desc^:svg:|", ":svg:discard^:svg:|", ":svg:ellipse^:svg:\
geometry|", ":svg:feBlend^:svg:|", ":svg:feColorMatrix^:svg:|", ":svg:feComponentTransfer^:svg:|", ":svg:feComposite^:svg:|", ":svg:feConvol\
veMatrix^:svg:|", ":svg:feDiffuseLighting^:svg:|", ":svg:feDisplacementMap^:svg:|", ":svg:feDistantLight^:svg:|", ":svg:feDropShadow^:svg:|",
  ":svg:feFlood^:svg:|", ":svg:feFuncA^:svg:componentTransferFunction|", ":svg:feFuncB^:svg:componentTransferFunction|", ":svg:feFuncG^:svg:\
componentTransferFunction|", ":svg:feFuncR^:svg:componentTransferFunction|", ":svg:feGaussianBlur^:svg:|", ":svg:feImage^:svg:|", ":svg:feMe\
rge^:svg:|", ":svg:feMergeNode^:svg:|", ":svg:feMorphology^:svg:|", ":svg:feOffset^:svg:|", ":svg:fePointLight^:svg:|", ":svg:feSpecularLigh\
ting^:svg:|", ":svg:feSpotLight^:svg:|", ":svg:feTile^:svg:|", ":svg:feTurbulence^:svg:|", ":svg:filter^:svg:|", ":svg:foreignObject^:svg:gr\
aphics|", ":svg:g^:svg:graphics|", ":svg:image^:svg:graphics|decoding", ":svg:line^:svg:geometry|", ":svg:linearGradient^:svg:gradient|", ":\
svg:mpath^:svg:|", ":svg:marker^:svg:|", ":svg:mask^:svg:|", ":svg:metadata^:svg:|", ":svg:path^:svg:geometry|", ":svg:pattern^:svg:|", ":sv\
g:polygon^:svg:geometry|", ":svg:polyline^:svg:geometry|", ":svg:radialGradient^:svg:gradient|", ":svg:rect^:svg:geometry|", ":svg:svg^:svg:\
graphics|#currentScale,#zoomAndPan", ":svg:script^:svg:|type", ":svg:set^:svg:animation|", ":svg:stop^:svg:|", ":svg:style^:svg:|!disabled,m\
edia,title,type", ":svg:switch^:svg:graphics|", ":svg:symbol^:svg:|", ":svg:tspan^:svg:textPositioning|", ":svg:text^:svg:textPositioning|",
  ":svg:textPath^:svg:textContent|", ":svg:title^:svg:|", ":svg:use^:svg:graphics|", ":svg:view^:svg:|#zoomAndPan", "data^[HTMLElement]|valu\
e", "keygen^[HTMLElement]|!autofocus,challenge,!disabled,form,keytype,name", "menuitem^[HTMLElement]|type,label,icon,!disabled,!checked,radi\
ogroup,!default", "summary^[HTMLElement]|", "time^[HTMLElement]|dateTime", ":svg:cursor^:svg:|", ":math:^[HTMLElement]|!autofocus,nonce,*abo\
rt,*animationend,*animationiteration,*animationstart,*auxclick,*beforeinput,*beforematch,*beforetoggle,*beforexrselect,*blur,*cancel,*canpla\
y,*canplaythrough,*change,*click,*close,*contentvisibilityautostatechange,*contextlost,*contextmenu,*contextrestored,*copy,*cuechange,*cut,*\
dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointer\
capture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*m\
ouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*point\
erleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*scrollend,*security\
policyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transition\
cancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimations\
tart,*webkittransitionend,*wheel,%style,#tabIndex", ":math:math^:math:|", ":math:maction^:math:|", ":math:menclose^:math:|", ":math:merror^:\
math:|", ":math:mfenced^:math:|", ":math:mfrac^:math:|", ":math:mi^:math:|", ":math:mmultiscripts^:math:|", ":math:mn^:math:|", ":math:mo^:m\
ath:|", ":math:mover^:math:|", ":math:mpadded^:math:|", ":math:mphantom^:math:|", ":math:mroot^:math:|", ":math:mrow^:math:|", ":math:ms^:ma\
th:|", ":math:mspace^:math:|", ":math:msqrt^:math:|", ":math:mstyle^:math:|", ":math:msub^:math:|", ":math:msubsup^:math:|", ":math:msup^:ma\
th:|", ":math:mtable^:math:|", ":math:mtd^:math:|", ":math:mtext^:math:|", ":math:mtr^:math:|", ":math:munder^:math:|", ":math:munderover^:m\
ath:|", ":math:semantics^:math:|"], M2 = new Map(Object.entries({ class: "className", for: "htmlFor", formaction: "formAction", innerHtml: "\
innerHTML", readonly: "readOnly", tabindex: "tabIndex" })), cR = Array.from(M2).reduce((e, [t, r]) => (e.set(t, r), e), /* @__PURE__ */ new Map()),
  pR = (Pn = class extends oR {
    constructor() {
      super(), this._schema = /* @__PURE__ */ new Map(), this._eventSchema = /* @__PURE__ */ new Map(), uR.forEach((t) => {
        let r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), [o, i] = t.split("|"), l = i.split(","), [u, c] = o.split("^");
        u.split(",").forEach((d) => {
          this._schema.set(d.toLowerCase(), r), this._eventSchema.set(d.toLowerCase(), n);
        });
        let p = c && this._schema.get(c.toLowerCase());
        if (p) {
          for (let [d, h] of p) r.set(d, h);
          for (let d of this._eventSchema.get(c.toLowerCase())) n.add(d);
        }
        l.forEach((d) => {
          if (d.length > 0) switch (d[0]) {
            case "*":
              n.add(d.substring(1));
              break;
            case "!":
              r.set(d.substring(1), aR);
              break;
            case "#":
              r.set(d.substring(1), iR);
              break;
            case "%":
              r.set(d.substring(1), sR);
              break;
            default:
              r.set(d, lR);
          }
        });
      });
    }
    hasProperty(t, r, n) {
      if (n.some((o) => o.name === M5.name)) return !0;
      if (t.indexOf("-") > -1) {
        if (P5(t) || H5(t)) return !1;
        if (n.some((o) => o.name === I5.name)) return !0;
      }
      return (this._schema.get(t.toLowerCase()) || this._schema.get("unknown")).has(r);
    }
    hasElement(t, r) {
      return r.some((n) => n.name === M5.name) || t.indexOf("-") > -1 && (P5(t) || H5(t) || r.some((n) => n.name === I5.name)) ? !0 : this._schema.
      has(t.toLowerCase());
    }
    securityContext(t, r, n) {
      n && (r = this.getMappedPropName(r)), t = t.toLowerCase(), r = r.toLowerCase();
      let o = z5()[t + "|" + r];
      return o || (o = z5()["*|" + r], o || Lr.NONE);
    }
    getMappedPropName(t) {
      return M2.get(t) ?? t;
    }
    getDefaultComponentElementName() {
      return "ng-component";
    }
    validateProperty(t) {
      return t.toLowerCase().startsWith("on") ? { error: !0, msg: `Binding to event property '${t}' is disallowed for security reasons, plea\
se use (${t.slice(2)})=...
If '${t}' is a directive input, make sure the directive is imported by the current module.` } : { error: !1 };
    }
    validateAttribute(t) {
      return t.toLowerCase().startsWith("on") ? { error: !0, msg: `Binding to event attribute '${t}' is disallowed for security reasons, ple\
ase use (${t.slice(2)})=...` } : { error: !1 };
    }
    allKnownElementNames() {
      return Array.from(this._schema.keys());
    }
    allKnownAttributesOfElement(t) {
      let r = this._schema.get(t.toLowerCase()) || this._schema.get("unknown");
      return Array.from(r.keys()).map((n) => cR.get(n) ?? n);
    }
    allKnownEventsOfElement(t) {
      return Array.from(this._eventSchema.get(t.toLowerCase()) ?? []);
    }
    normalizeAnimationStyleProperty(t) {
      return HE(t);
    }
    normalizeAnimationStyleValue(t, r, n) {
      let o = "", i = n.toString().trim(), l = null;
      if (dR(t) && n !== 0 && n !== "0") if (typeof n == "number") o = "px";
      else {
        let u = n.match(/^[+-]?[\d\.]+([a-z]*)$/);
        u && u[1].length == 0 && (l = `Please provide a CSS unit value for ${r}:${n}`);
      }
      return { error: l, value: i + o };
    }
  }, a(Pn, "Vt"), Pn);
  a(dR, "Ua");
  O = (Hn = class {
    constructor({ closedByChildren: t, implicitNamespacePrefix: r, contentType: n = pt.PARSABLE_DATA, closedByParent: o = !1, isVoid: i = !1,
    ignoreFirstLf: l = !1, preventNamespaceInheritance: u = !1, canSelfClose: c = !1 } = {}) {
      this.closedByChildren = {}, this.closedByParent = !1, t && t.length > 0 && t.forEach((p) => this.closedByChildren[p] = !0), this.isVoid =
      i, this.closedByParent = o || i, this.implicitNamespacePrefix = r || null, this.contentType = n, this.ignoreFirstLf = l, this.preventNamespaceInheritance =
      u, this.canSelfClose = c ?? i;
    }
    isClosedByChild(t) {
      return this.isVoid || t.toLowerCase() in this.closedByChildren;
    }
    getContentType(t) {
      return typeof this.contentType == "object" ? (t === void 0 ? void 0 : this.contentType[t]) ?? this.contentType.default : this.contentType;
    }
  }, a(Hn, "m"), Hn);
  a(Qu, "Ge");
  uo = (zn = class {
    constructor(t, r) {
      this.sourceSpan = t, this.i18n = r;
    }
  }, a(zn, "oe"), zn), fR = (On = class extends uo {
    constructor(t, r, n, o) {
      super(r, o), this.value = t, this.tokens = n, this.type = "text";
    }
    visit(t, r) {
      return t.visitText(this, r);
    }
  }, a(On, "Ut"), On), hR = (Nn = class extends uo {
    constructor(t, r, n, o) {
      super(r, o), this.value = t, this.tokens = n, this.type = "cdata";
    }
    visit(t, r) {
      return t.visitCdata(this, r);
    }
  }, a(Nn, "Wt"), Nn), mR = ($n = class extends uo {
    constructor(t, r, n, o, i, l) {
      super(o, l), this.switchValue = t, this.type = r, this.cases = n, this.switchValueSourceSpan = i;
    }
    visit(t, r) {
      return t.visitExpansion(this, r);
    }
  }, a($n, "zt"), $n), gR = (jn = class {
    constructor(t, r, n, o, i) {
      this.value = t, this.expression = r, this.sourceSpan = n, this.valueSourceSpan = o, this.expSourceSpan = i, this.type = "expansionCase";
    }
    visit(t, r) {
      return t.visitExpansionCase(this, r);
    }
  }, a(jn, "Gt"), jn), vR = (Vn = class extends uo {
    constructor(t, r, n, o, i, l, u) {
      super(n, u), this.name = t, this.value = r, this.keySpan = o, this.valueSpan = i, this.valueTokens = l, this.type = "attribute";
    }
    visit(t, r) {
      return t.visitAttribute(this, r);
    }
    get nameSpan() {
      return this.keySpan;
    }
  }, a(Vn, "Yt"), Vn), nr = (Wn = class extends uo {
    constructor(t, r, n, o, i, l = null, u = null, c) {
      super(o, c), this.name = t, this.attrs = r, this.children = n, this.startSourceSpan = i, this.endSourceSpan = l, this.nameSpan = u, this.
      type = "element";
    }
    visit(t, r) {
      return t.visitElement(this, r);
    }
  }, a(Wn, "G"), Wn), wR = (qn = class {
    constructor(t, r) {
      this.value = t, this.sourceSpan = r, this.type = "comment";
    }
    visit(t, r) {
      return t.visitComment(this, r);
    }
  }, a(qn, "jt"), qn), bR = (Un = class {
    constructor(t, r) {
      this.value = t, this.sourceSpan = r, this.type = "docType";
    }
    visit(t, r) {
      return t.visitDocType(this, r);
    }
  }, a(Un, "Kt"), Un), An = (Gn = class extends uo {
    constructor(t, r, n, o, i, l, u = null, c) {
      super(o, c), this.name = t, this.parameters = r, this.children = n, this.nameSpan = i, this.startSourceSpan = l, this.endSourceSpan = u,
      this.type = "block";
    }
    visit(t, r) {
      return t.visitBlock(this, r);
    }
  }, a(Gn, "Z"), Gn), N5 = (Yn = class {
    constructor(t, r) {
      this.expression = t, this.sourceSpan = r, this.type = "blockParameter", this.startSourceSpan = null, this.endSourceSpan = null;
    }
    visit(t, r) {
      return t.visitBlockParameter(this, r);
    }
  }, a(Yn, "ct"), Yn), $5 = (Xn = class {
    constructor(t, r, n, o, i) {
      this.name = t, this.value = r, this.sourceSpan = n, this.nameSpan = o, this.valueSpan = i, this.type = "letDeclaration", this.startSourceSpan =
      null, this.endSourceSpan = null;
    }
    visit(t, r) {
      return t.visitLetDeclaration(this, r);
    }
  }, a(Xn, "pt"), Xn);
  a(_2, "Qt");
  yR = (Kn = class {
    constructor() {
    }
    visitElement(t, r) {
      this.visitChildren(r, (n) => {
        n(t.attrs), n(t.children);
      });
    }
    visitAttribute(t, r) {
    }
    visitText(t, r) {
    }
    visitCdata(t, r) {
    }
    visitComment(t, r) {
    }
    visitDocType(t, r) {
    }
    visitExpansion(t, r) {
      return this.visitChildren(r, (n) => {
        n(t.cases);
      });
    }
    visitExpansionCase(t, r) {
    }
    visitBlock(t, r) {
      this.visitChildren(r, (n) => {
        n(t.parameters), n(t.children);
      });
    }
    visitBlockParameter(t, r) {
    }
    visitLetDeclaration(t, r) {
    }
    visitChildren(t, r) {
      let n = [], o = this;
      function i(l) {
        l && n.push(_2(o, l, t));
      }
      return a(i, "i"), r(i), Array.prototype.concat.apply([], n);
    }
  }, a(Kn, "ht"), Kn), $i = { AElig: "\xC6", AMP: "&", amp: "&", Aacute: "\xC1", Abreve: "\u0102", Acirc: "\xC2", Acy: "\u0410", Afr: "\u{1D504}",
  Agrave: "\xC0", Alpha: "\u0391", Amacr: "\u0100", And: "\u2A53", Aogon: "\u0104", Aopf: "\u{1D538}", ApplyFunction: "\u2061", af: "\u2061",
  Aring: "\xC5", angst: "\xC5", Ascr: "\u{1D49C}", Assign: "\u2254", colone: "\u2254", coloneq: "\u2254", Atilde: "\xC3", Auml: "\xC4", Backslash: "\
\u2216", setminus: "\u2216", setmn: "\u2216", smallsetminus: "\u2216", ssetmn: "\u2216", Barv: "\u2AE7", Barwed: "\u2306", doublebarwedge: "\
\u2306", Bcy: "\u0411", Because: "\u2235", becaus: "\u2235", because: "\u2235", Bernoullis: "\u212C", Bscr: "\u212C", bernou: "\u212C", Beta: "\
\u0392", Bfr: "\u{1D505}", Bopf: "\u{1D539}", Breve: "\u02D8", breve: "\u02D8", Bumpeq: "\u224E", HumpDownHump: "\u224E", bump: "\u224E", CHcy: "\
\u0427", COPY: "\xA9", copy: "\xA9", Cacute: "\u0106", Cap: "\u22D2", CapitalDifferentialD: "\u2145", DD: "\u2145", Cayleys: "\u212D", Cfr: "\
\u212D", Ccaron: "\u010C", Ccedil: "\xC7", Ccirc: "\u0108", Cconint: "\u2230", Cdot: "\u010A", Cedilla: "\xB8", cedil: "\xB8", CenterDot: "\xB7",
  centerdot: "\xB7", middot: "\xB7", Chi: "\u03A7", CircleDot: "\u2299", odot: "\u2299", CircleMinus: "\u2296", ominus: "\u2296", CirclePlus: "\
\u2295", oplus: "\u2295", CircleTimes: "\u2297", otimes: "\u2297", ClockwiseContourIntegral: "\u2232", cwconint: "\u2232", CloseCurlyDoubleQuote: "\
\u201D", rdquo: "\u201D", rdquor: "\u201D", CloseCurlyQuote: "\u2019", rsquo: "\u2019", rsquor: "\u2019", Colon: "\u2237", Proportion: "\u2237",
  Colone: "\u2A74", Congruent: "\u2261", equiv: "\u2261", Conint: "\u222F", DoubleContourIntegral: "\u222F", ContourIntegral: "\u222E", conint: "\
\u222E", oint: "\u222E", Copf: "\u2102", complexes: "\u2102", Coproduct: "\u2210", coprod: "\u2210", CounterClockwiseContourIntegral: "\u2233",
  awconint: "\u2233", Cross: "\u2A2F", Cscr: "\u{1D49E}", Cup: "\u22D3", CupCap: "\u224D", asympeq: "\u224D", DDotrahd: "\u2911", DJcy: "\u0402",
  DScy: "\u0405", DZcy: "\u040F", Dagger: "\u2021", ddagger: "\u2021", Darr: "\u21A1", Dashv: "\u2AE4", DoubleLeftTee: "\u2AE4", Dcaron: "\u010E",
  Dcy: "\u0414", Del: "\u2207", nabla: "\u2207", Delta: "\u0394", Dfr: "\u{1D507}", DiacriticalAcute: "\xB4", acute: "\xB4", DiacriticalDot: "\
\u02D9", dot: "\u02D9", DiacriticalDoubleAcute: "\u02DD", dblac: "\u02DD", DiacriticalGrave: "`", grave: "`", DiacriticalTilde: "\u02DC", tilde: "\
\u02DC", Diamond: "\u22C4", diam: "\u22C4", diamond: "\u22C4", DifferentialD: "\u2146", dd: "\u2146", Dopf: "\u{1D53B}", Dot: "\xA8", DoubleDot: "\
\xA8", die: "\xA8", uml: "\xA8", DotDot: "\u20DC", DotEqual: "\u2250", doteq: "\u2250", esdot: "\u2250", DoubleDownArrow: "\u21D3", Downarrow: "\
\u21D3", dArr: "\u21D3", DoubleLeftArrow: "\u21D0", Leftarrow: "\u21D0", lArr: "\u21D0", DoubleLeftRightArrow: "\u21D4", Leftrightarrow: "\u21D4",
  hArr: "\u21D4", iff: "\u21D4", DoubleLongLeftArrow: "\u27F8", Longleftarrow: "\u27F8", xlArr: "\u27F8", DoubleLongLeftRightArrow: "\u27FA",
  Longleftrightarrow: "\u27FA", xhArr: "\u27FA", DoubleLongRightArrow: "\u27F9", Longrightarrow: "\u27F9", xrArr: "\u27F9", DoubleRightArrow: "\
\u21D2", Implies: "\u21D2", Rightarrow: "\u21D2", rArr: "\u21D2", DoubleRightTee: "\u22A8", vDash: "\u22A8", DoubleUpArrow: "\u21D1", Uparrow: "\
\u21D1", uArr: "\u21D1", DoubleUpDownArrow: "\u21D5", Updownarrow: "\u21D5", vArr: "\u21D5", DoubleVerticalBar: "\u2225", par: "\u2225", parallel: "\
\u2225", shortparallel: "\u2225", spar: "\u2225", DownArrow: "\u2193", ShortDownArrow: "\u2193", darr: "\u2193", downarrow: "\u2193", DownArrowBar: "\
\u2913", DownArrowUpArrow: "\u21F5", duarr: "\u21F5", DownBreve: "\u0311", DownLeftRightVector: "\u2950", DownLeftTeeVector: "\u295E", DownLeftVector: "\
\u21BD", leftharpoondown: "\u21BD", lhard: "\u21BD", DownLeftVectorBar: "\u2956", DownRightTeeVector: "\u295F", DownRightVector: "\u21C1", rhard: "\
\u21C1", rightharpoondown: "\u21C1", DownRightVectorBar: "\u2957", DownTee: "\u22A4", top: "\u22A4", DownTeeArrow: "\u21A7", mapstodown: "\u21A7",
  Dscr: "\u{1D49F}", Dstrok: "\u0110", ENG: "\u014A", ETH: "\xD0", Eacute: "\xC9", Ecaron: "\u011A", Ecirc: "\xCA", Ecy: "\u042D", Edot: "\u0116",
  Efr: "\u{1D508}", Egrave: "\xC8", Element: "\u2208", in: "\u2208", isin: "\u2208", isinv: "\u2208", Emacr: "\u0112", EmptySmallSquare: "\u25FB",
  EmptyVerySmallSquare: "\u25AB", Eogon: "\u0118", Eopf: "\u{1D53C}", Epsilon: "\u0395", Equal: "\u2A75", EqualTilde: "\u2242", eqsim: "\u2242",
  esim: "\u2242", Equilibrium: "\u21CC", rightleftharpoons: "\u21CC", rlhar: "\u21CC", Escr: "\u2130", expectation: "\u2130", Esim: "\u2A73",
  Eta: "\u0397", Euml: "\xCB", Exists: "\u2203", exist: "\u2203", ExponentialE: "\u2147", ee: "\u2147", exponentiale: "\u2147", Fcy: "\u0424",
  Ffr: "\u{1D509}", FilledSmallSquare: "\u25FC", FilledVerySmallSquare: "\u25AA", blacksquare: "\u25AA", squarf: "\u25AA", squf: "\u25AA", Fopf: "\
\u{1D53D}", ForAll: "\u2200", forall: "\u2200", Fouriertrf: "\u2131", Fscr: "\u2131", GJcy: "\u0403", GT: ">", gt: ">", Gamma: "\u0393", Gammad: "\
\u03DC", Gbreve: "\u011E", Gcedil: "\u0122", Gcirc: "\u011C", Gcy: "\u0413", Gdot: "\u0120", Gfr: "\u{1D50A}", Gg: "\u22D9", ggg: "\u22D9", Gopf: "\
\u{1D53E}", GreaterEqual: "\u2265", ge: "\u2265", geq: "\u2265", GreaterEqualLess: "\u22DB", gel: "\u22DB", gtreqless: "\u22DB", GreaterFullEqual: "\
\u2267", gE: "\u2267", geqq: "\u2267", GreaterGreater: "\u2AA2", GreaterLess: "\u2277", gl: "\u2277", gtrless: "\u2277", GreaterSlantEqual: "\
\u2A7E", geqslant: "\u2A7E", ges: "\u2A7E", GreaterTilde: "\u2273", gsim: "\u2273", gtrsim: "\u2273", Gscr: "\u{1D4A2}", Gt: "\u226B", NestedGreaterGreater: "\
\u226B", gg: "\u226B", HARDcy: "\u042A", Hacek: "\u02C7", caron: "\u02C7", Hat: "^", Hcirc: "\u0124", Hfr: "\u210C", Poincareplane: "\u210C",
  HilbertSpace: "\u210B", Hscr: "\u210B", hamilt: "\u210B", Hopf: "\u210D", quaternions: "\u210D", HorizontalLine: "\u2500", boxh: "\u2500",
  Hstrok: "\u0126", HumpEqual: "\u224F", bumpe: "\u224F", bumpeq: "\u224F", IEcy: "\u0415", IJlig: "\u0132", IOcy: "\u0401", Iacute: "\xCD",
  Icirc: "\xCE", Icy: "\u0418", Idot: "\u0130", Ifr: "\u2111", Im: "\u2111", image: "\u2111", imagpart: "\u2111", Igrave: "\xCC", Imacr: "\u012A",
  ImaginaryI: "\u2148", ii: "\u2148", Int: "\u222C", Integral: "\u222B", int: "\u222B", Intersection: "\u22C2", bigcap: "\u22C2", xcap: "\u22C2",
  InvisibleComma: "\u2063", ic: "\u2063", InvisibleTimes: "\u2062", it: "\u2062", Iogon: "\u012E", Iopf: "\u{1D540}", Iota: "\u0399", Iscr: "\
\u2110", imagline: "\u2110", Itilde: "\u0128", Iukcy: "\u0406", Iuml: "\xCF", Jcirc: "\u0134", Jcy: "\u0419", Jfr: "\u{1D50D}", Jopf: "\u{1D541}",
  Jscr: "\u{1D4A5}", Jsercy: "\u0408", Jukcy: "\u0404", KHcy: "\u0425", KJcy: "\u040C", Kappa: "\u039A", Kcedil: "\u0136", Kcy: "\u041A", Kfr: "\
\u{1D50E}", Kopf: "\u{1D542}", Kscr: "\u{1D4A6}", LJcy: "\u0409", LT: "<", lt: "<", Lacute: "\u0139", Lambda: "\u039B", Lang: "\u27EA", Laplacetrf: "\
\u2112", Lscr: "\u2112", lagran: "\u2112", Larr: "\u219E", twoheadleftarrow: "\u219E", Lcaron: "\u013D", Lcedil: "\u013B", Lcy: "\u041B", LeftAngleBracket: "\
\u27E8", lang: "\u27E8", langle: "\u27E8", LeftArrow: "\u2190", ShortLeftArrow: "\u2190", larr: "\u2190", leftarrow: "\u2190", slarr: "\u2190",
  LeftArrowBar: "\u21E4", larrb: "\u21E4", LeftArrowRightArrow: "\u21C6", leftrightarrows: "\u21C6", lrarr: "\u21C6", LeftCeiling: "\u2308",
  lceil: "\u2308", LeftDoubleBracket: "\u27E6", lobrk: "\u27E6", LeftDownTeeVector: "\u2961", LeftDownVector: "\u21C3", dharl: "\u21C3", downharpoonleft: "\
\u21C3", LeftDownVectorBar: "\u2959", LeftFloor: "\u230A", lfloor: "\u230A", LeftRightArrow: "\u2194", harr: "\u2194", leftrightarrow: "\u2194",
  LeftRightVector: "\u294E", LeftTee: "\u22A3", dashv: "\u22A3", LeftTeeArrow: "\u21A4", mapstoleft: "\u21A4", LeftTeeVector: "\u295A", LeftTriangle: "\
\u22B2", vartriangleleft: "\u22B2", vltri: "\u22B2", LeftTriangleBar: "\u29CF", LeftTriangleEqual: "\u22B4", ltrie: "\u22B4", trianglelefteq: "\
\u22B4", LeftUpDownVector: "\u2951", LeftUpTeeVector: "\u2960", LeftUpVector: "\u21BF", uharl: "\u21BF", upharpoonleft: "\u21BF", LeftUpVectorBar: "\
\u2958", LeftVector: "\u21BC", leftharpoonup: "\u21BC", lharu: "\u21BC", LeftVectorBar: "\u2952", LessEqualGreater: "\u22DA", leg: "\u22DA",
  lesseqgtr: "\u22DA", LessFullEqual: "\u2266", lE: "\u2266", leqq: "\u2266", LessGreater: "\u2276", lessgtr: "\u2276", lg: "\u2276", LessLess: "\
\u2AA1", LessSlantEqual: "\u2A7D", leqslant: "\u2A7D", les: "\u2A7D", LessTilde: "\u2272", lesssim: "\u2272", lsim: "\u2272", Lfr: "\u{1D50F}",
  Ll: "\u22D8", Lleftarrow: "\u21DA", lAarr: "\u21DA", Lmidot: "\u013F", LongLeftArrow: "\u27F5", longleftarrow: "\u27F5", xlarr: "\u27F5", LongLeftRightArrow: "\
\u27F7", longleftrightarrow: "\u27F7", xharr: "\u27F7", LongRightArrow: "\u27F6", longrightarrow: "\u27F6", xrarr: "\u27F6", Lopf: "\u{1D543}",
  LowerLeftArrow: "\u2199", swarr: "\u2199", swarrow: "\u2199", LowerRightArrow: "\u2198", searr: "\u2198", searrow: "\u2198", Lsh: "\u21B0",
  lsh: "\u21B0", Lstrok: "\u0141", Lt: "\u226A", NestedLessLess: "\u226A", ll: "\u226A", Map: "\u2905", Mcy: "\u041C", MediumSpace: "\u205F",
  Mellintrf: "\u2133", Mscr: "\u2133", phmmat: "\u2133", Mfr: "\u{1D510}", MinusPlus: "\u2213", mnplus: "\u2213", mp: "\u2213", Mopf: "\u{1D544}",
  Mu: "\u039C", NJcy: "\u040A", Nacute: "\u0143", Ncaron: "\u0147", Ncedil: "\u0145", Ncy: "\u041D", NegativeMediumSpace: "\u200B", NegativeThickSpace: "\
\u200B", NegativeThinSpace: "\u200B", NegativeVeryThinSpace: "\u200B", ZeroWidthSpace: "\u200B", NewLine: `
`, Nfr: "\u{1D511}", NoBreak: "\u2060", NonBreakingSpace: "\xA0", nbsp: "\xA0", Nopf: "\u2115", naturals: "\u2115", Not: "\u2AEC", NotCongruent: "\
\u2262", nequiv: "\u2262", NotCupCap: "\u226D", NotDoubleVerticalBar: "\u2226", npar: "\u2226", nparallel: "\u2226", nshortparallel: "\u2226",
  nspar: "\u2226", NotElement: "\u2209", notin: "\u2209", notinva: "\u2209", NotEqual: "\u2260", ne: "\u2260", NotEqualTilde: "\u2242\u0338",
  nesim: "\u2242\u0338", NotExists: "\u2204", nexist: "\u2204", nexists: "\u2204", NotGreater: "\u226F", ngt: "\u226F", ngtr: "\u226F", NotGreaterEqual: "\
\u2271", nge: "\u2271", ngeq: "\u2271", NotGreaterFullEqual: "\u2267\u0338", ngE: "\u2267\u0338", ngeqq: "\u2267\u0338", NotGreaterGreater: "\
\u226B\u0338", nGtv: "\u226B\u0338", NotGreaterLess: "\u2279", ntgl: "\u2279", NotGreaterSlantEqual: "\u2A7E\u0338", ngeqslant: "\u2A7E\u0338",
  nges: "\u2A7E\u0338", NotGreaterTilde: "\u2275", ngsim: "\u2275", NotHumpDownHump: "\u224E\u0338", nbump: "\u224E\u0338", NotHumpEqual: "\u224F\
\u0338", nbumpe: "\u224F\u0338", NotLeftTriangle: "\u22EA", nltri: "\u22EA", ntriangleleft: "\u22EA", NotLeftTriangleBar: "\u29CF\u0338", NotLeftTriangleEqual: "\
\u22EC", nltrie: "\u22EC", ntrianglelefteq: "\u22EC", NotLess: "\u226E", nless: "\u226E", nlt: "\u226E", NotLessEqual: "\u2270", nle: "\u2270",
  nleq: "\u2270", NotLessGreater: "\u2278", ntlg: "\u2278", NotLessLess: "\u226A\u0338", nLtv: "\u226A\u0338", NotLessSlantEqual: "\u2A7D\u0338",
  nleqslant: "\u2A7D\u0338", nles: "\u2A7D\u0338", NotLessTilde: "\u2274", nlsim: "\u2274", NotNestedGreaterGreater: "\u2AA2\u0338", NotNestedLessLess: "\
\u2AA1\u0338", NotPrecedes: "\u2280", npr: "\u2280", nprec: "\u2280", NotPrecedesEqual: "\u2AAF\u0338", npre: "\u2AAF\u0338", npreceq: "\u2AAF\u0338",
  NotPrecedesSlantEqual: "\u22E0", nprcue: "\u22E0", NotReverseElement: "\u220C", notni: "\u220C", notniva: "\u220C", NotRightTriangle: "\u22EB",
  nrtri: "\u22EB", ntriangleright: "\u22EB", NotRightTriangleBar: "\u29D0\u0338", NotRightTriangleEqual: "\u22ED", nrtrie: "\u22ED", ntrianglerighteq: "\
\u22ED", NotSquareSubset: "\u228F\u0338", NotSquareSubsetEqual: "\u22E2", nsqsube: "\u22E2", NotSquareSuperset: "\u2290\u0338", NotSquareSupersetEqual: "\
\u22E3", nsqsupe: "\u22E3", NotSubset: "\u2282\u20D2", nsubset: "\u2282\u20D2", vnsub: "\u2282\u20D2", NotSubsetEqual: "\u2288", nsube: "\u2288",
  nsubseteq: "\u2288", NotSucceeds: "\u2281", nsc: "\u2281", nsucc: "\u2281", NotSucceedsEqual: "\u2AB0\u0338", nsce: "\u2AB0\u0338", nsucceq: "\
\u2AB0\u0338", NotSucceedsSlantEqual: "\u22E1", nsccue: "\u22E1", NotSucceedsTilde: "\u227F\u0338", NotSuperset: "\u2283\u20D2", nsupset: "\u2283\
\u20D2", vnsup: "\u2283\u20D2", NotSupersetEqual: "\u2289", nsupe: "\u2289", nsupseteq: "\u2289", NotTilde: "\u2241", nsim: "\u2241", NotTildeEqual: "\
\u2244", nsime: "\u2244", nsimeq: "\u2244", NotTildeFullEqual: "\u2247", ncong: "\u2247", NotTildeTilde: "\u2249", nap: "\u2249", napprox: "\
\u2249", NotVerticalBar: "\u2224", nmid: "\u2224", nshortmid: "\u2224", nsmid: "\u2224", Nscr: "\u{1D4A9}", Ntilde: "\xD1", Nu: "\u039D", OElig: "\
\u0152", Oacute: "\xD3", Ocirc: "\xD4", Ocy: "\u041E", Odblac: "\u0150", Ofr: "\u{1D512}", Ograve: "\xD2", Omacr: "\u014C", Omega: "\u03A9",
  ohm: "\u03A9", Omicron: "\u039F", Oopf: "\u{1D546}", OpenCurlyDoubleQuote: "\u201C", ldquo: "\u201C", OpenCurlyQuote: "\u2018", lsquo: "\u2018",
  Or: "\u2A54", Oscr: "\u{1D4AA}", Oslash: "\xD8", Otilde: "\xD5", Otimes: "\u2A37", Ouml: "\xD6", OverBar: "\u203E", oline: "\u203E", OverBrace: "\
\u23DE", OverBracket: "\u23B4", tbrk: "\u23B4", OverParenthesis: "\u23DC", PartialD: "\u2202", part: "\u2202", Pcy: "\u041F", Pfr: "\u{1D513}",
  Phi: "\u03A6", Pi: "\u03A0", PlusMinus: "\xB1", plusmn: "\xB1", pm: "\xB1", Popf: "\u2119", primes: "\u2119", Pr: "\u2ABB", Precedes: "\u227A",
  pr: "\u227A", prec: "\u227A", PrecedesEqual: "\u2AAF", pre: "\u2AAF", preceq: "\u2AAF", PrecedesSlantEqual: "\u227C", prcue: "\u227C", preccurlyeq: "\
\u227C", PrecedesTilde: "\u227E", precsim: "\u227E", prsim: "\u227E", Prime: "\u2033", Product: "\u220F", prod: "\u220F", Proportional: "\u221D",
  prop: "\u221D", propto: "\u221D", varpropto: "\u221D", vprop: "\u221D", Pscr: "\u{1D4AB}", Psi: "\u03A8", QUOT: '"', quot: '"', Qfr: "\u{1D514}",
  Qopf: "\u211A", rationals: "\u211A", Qscr: "\u{1D4AC}", RBarr: "\u2910", drbkarow: "\u2910", REG: "\xAE", circledR: "\xAE", reg: "\xAE", Racute: "\
\u0154", Rang: "\u27EB", Rarr: "\u21A0", twoheadrightarrow: "\u21A0", Rarrtl: "\u2916", Rcaron: "\u0158", Rcedil: "\u0156", Rcy: "\u0420", Re: "\
\u211C", Rfr: "\u211C", real: "\u211C", realpart: "\u211C", ReverseElement: "\u220B", SuchThat: "\u220B", ni: "\u220B", niv: "\u220B", ReverseEquilibrium: "\
\u21CB", leftrightharpoons: "\u21CB", lrhar: "\u21CB", ReverseUpEquilibrium: "\u296F", duhar: "\u296F", Rho: "\u03A1", RightAngleBracket: "\u27E9",
  rang: "\u27E9", rangle: "\u27E9", RightArrow: "\u2192", ShortRightArrow: "\u2192", rarr: "\u2192", rightarrow: "\u2192", srarr: "\u2192", RightArrowBar: "\
\u21E5", rarrb: "\u21E5", RightArrowLeftArrow: "\u21C4", rightleftarrows: "\u21C4", rlarr: "\u21C4", RightCeiling: "\u2309", rceil: "\u2309",
  RightDoubleBracket: "\u27E7", robrk: "\u27E7", RightDownTeeVector: "\u295D", RightDownVector: "\u21C2", dharr: "\u21C2", downharpoonright: "\
\u21C2", RightDownVectorBar: "\u2955", RightFloor: "\u230B", rfloor: "\u230B", RightTee: "\u22A2", vdash: "\u22A2", RightTeeArrow: "\u21A6",
  map: "\u21A6", mapsto: "\u21A6", RightTeeVector: "\u295B", RightTriangle: "\u22B3", vartriangleright: "\u22B3", vrtri: "\u22B3", RightTriangleBar: "\
\u29D0", RightTriangleEqual: "\u22B5", rtrie: "\u22B5", trianglerighteq: "\u22B5", RightUpDownVector: "\u294F", RightUpTeeVector: "\u295C", RightUpVector: "\
\u21BE", uharr: "\u21BE", upharpoonright: "\u21BE", RightUpVectorBar: "\u2954", RightVector: "\u21C0", rharu: "\u21C0", rightharpoonup: "\u21C0",
  RightVectorBar: "\u2953", Ropf: "\u211D", reals: "\u211D", RoundImplies: "\u2970", Rrightarrow: "\u21DB", rAarr: "\u21DB", Rscr: "\u211B",
  realine: "\u211B", Rsh: "\u21B1", rsh: "\u21B1", RuleDelayed: "\u29F4", SHCHcy: "\u0429", SHcy: "\u0428", SOFTcy: "\u042C", Sacute: "\u015A",
  Sc: "\u2ABC", Scaron: "\u0160", Scedil: "\u015E", Scirc: "\u015C", Scy: "\u0421", Sfr: "\u{1D516}", ShortUpArrow: "\u2191", UpArrow: "\u2191",
  uarr: "\u2191", uparrow: "\u2191", Sigma: "\u03A3", SmallCircle: "\u2218", compfn: "\u2218", Sopf: "\u{1D54A}", Sqrt: "\u221A", radic: "\u221A",
  Square: "\u25A1", squ: "\u25A1", square: "\u25A1", SquareIntersection: "\u2293", sqcap: "\u2293", SquareSubset: "\u228F", sqsub: "\u228F",
  sqsubset: "\u228F", SquareSubsetEqual: "\u2291", sqsube: "\u2291", sqsubseteq: "\u2291", SquareSuperset: "\u2290", sqsup: "\u2290", sqsupset: "\
\u2290", SquareSupersetEqual: "\u2292", sqsupe: "\u2292", sqsupseteq: "\u2292", SquareUnion: "\u2294", sqcup: "\u2294", Sscr: "\u{1D4AE}", Star: "\
\u22C6", sstarf: "\u22C6", Sub: "\u22D0", Subset: "\u22D0", SubsetEqual: "\u2286", sube: "\u2286", subseteq: "\u2286", Succeeds: "\u227B", sc: "\
\u227B", succ: "\u227B", SucceedsEqual: "\u2AB0", sce: "\u2AB0", succeq: "\u2AB0", SucceedsSlantEqual: "\u227D", sccue: "\u227D", succcurlyeq: "\
\u227D", SucceedsTilde: "\u227F", scsim: "\u227F", succsim: "\u227F", Sum: "\u2211", sum: "\u2211", Sup: "\u22D1", Supset: "\u22D1", Superset: "\
\u2283", sup: "\u2283", supset: "\u2283", SupersetEqual: "\u2287", supe: "\u2287", supseteq: "\u2287", THORN: "\xDE", TRADE: "\u2122", trade: "\
\u2122", TSHcy: "\u040B", TScy: "\u0426", Tab: "	", Tau: "\u03A4", Tcaron: "\u0164", Tcedil: "\u0162", Tcy: "\u0422", Tfr: "\u{1D517}", Therefore: "\
\u2234", there4: "\u2234", therefore: "\u2234", Theta: "\u0398", ThickSpace: "\u205F\u200A", ThinSpace: "\u2009", thinsp: "\u2009", Tilde: "\
\u223C", sim: "\u223C", thicksim: "\u223C", thksim: "\u223C", TildeEqual: "\u2243", sime: "\u2243", simeq: "\u2243", TildeFullEqual: "\u2245",
  cong: "\u2245", TildeTilde: "\u2248", ap: "\u2248", approx: "\u2248", asymp: "\u2248", thickapprox: "\u2248", thkap: "\u2248", Topf: "\u{1D54B}",
  TripleDot: "\u20DB", tdot: "\u20DB", Tscr: "\u{1D4AF}", Tstrok: "\u0166", Uacute: "\xDA", Uarr: "\u219F", Uarrocir: "\u2949", Ubrcy: "\u040E",
  Ubreve: "\u016C", Ucirc: "\xDB", Ucy: "\u0423", Udblac: "\u0170", Ufr: "\u{1D518}", Ugrave: "\xD9", Umacr: "\u016A", UnderBar: "_", lowbar: "\
_", UnderBrace: "\u23DF", UnderBracket: "\u23B5", bbrk: "\u23B5", UnderParenthesis: "\u23DD", Union: "\u22C3", bigcup: "\u22C3", xcup: "\u22C3",
  UnionPlus: "\u228E", uplus: "\u228E", Uogon: "\u0172", Uopf: "\u{1D54C}", UpArrowBar: "\u2912", UpArrowDownArrow: "\u21C5", udarr: "\u21C5",
  UpDownArrow: "\u2195", updownarrow: "\u2195", varr: "\u2195", UpEquilibrium: "\u296E", udhar: "\u296E", UpTee: "\u22A5", bot: "\u22A5", bottom: "\
\u22A5", perp: "\u22A5", UpTeeArrow: "\u21A5", mapstoup: "\u21A5", UpperLeftArrow: "\u2196", nwarr: "\u2196", nwarrow: "\u2196", UpperRightArrow: "\
\u2197", nearr: "\u2197", nearrow: "\u2197", Upsi: "\u03D2", upsih: "\u03D2", Upsilon: "\u03A5", Uring: "\u016E", Uscr: "\u{1D4B0}", Utilde: "\
\u0168", Uuml: "\xDC", VDash: "\u22AB", Vbar: "\u2AEB", Vcy: "\u0412", Vdash: "\u22A9", Vdashl: "\u2AE6", Vee: "\u22C1", bigvee: "\u22C1", xvee: "\
\u22C1", Verbar: "\u2016", Vert: "\u2016", VerticalBar: "\u2223", mid: "\u2223", shortmid: "\u2223", smid: "\u2223", VerticalLine: "|", verbar: "\
|", vert: "|", VerticalSeparator: "\u2758", VerticalTilde: "\u2240", wr: "\u2240", wreath: "\u2240", VeryThinSpace: "\u200A", hairsp: "\u200A",
  Vfr: "\u{1D519}", Vopf: "\u{1D54D}", Vscr: "\u{1D4B1}", Vvdash: "\u22AA", Wcirc: "\u0174", Wedge: "\u22C0", bigwedge: "\u22C0", xwedge: "\u22C0",
  Wfr: "\u{1D51A}", Wopf: "\u{1D54E}", Wscr: "\u{1D4B2}", Xfr: "\u{1D51B}", Xi: "\u039E", Xopf: "\u{1D54F}", Xscr: "\u{1D4B3}", YAcy: "\u042F",
  YIcy: "\u0407", YUcy: "\u042E", Yacute: "\xDD", Ycirc: "\u0176", Ycy: "\u042B", Yfr: "\u{1D51C}", Yopf: "\u{1D550}", Yscr: "\u{1D4B4}", Yuml: "\
\u0178", ZHcy: "\u0416", Zacute: "\u0179", Zcaron: "\u017D", Zcy: "\u0417", Zdot: "\u017B", Zeta: "\u0396", Zfr: "\u2128", zeetrf: "\u2128",
  Zopf: "\u2124", integers: "\u2124", Zscr: "\u{1D4B5}", aacute: "\xE1", abreve: "\u0103", ac: "\u223E", mstpos: "\u223E", acE: "\u223E\u0333",
  acd: "\u223F", acirc: "\xE2", acy: "\u0430", aelig: "\xE6", afr: "\u{1D51E}", agrave: "\xE0", alefsym: "\u2135", aleph: "\u2135", alpha: "\
\u03B1", amacr: "\u0101", amalg: "\u2A3F", and: "\u2227", wedge: "\u2227", andand: "\u2A55", andd: "\u2A5C", andslope: "\u2A58", andv: "\u2A5A",
  ang: "\u2220", angle: "\u2220", ange: "\u29A4", angmsd: "\u2221", measuredangle: "\u2221", angmsdaa: "\u29A8", angmsdab: "\u29A9", angmsdac: "\
\u29AA", angmsdad: "\u29AB", angmsdae: "\u29AC", angmsdaf: "\u29AD", angmsdag: "\u29AE", angmsdah: "\u29AF", angrt: "\u221F", angrtvb: "\u22BE",
  angrtvbd: "\u299D", angsph: "\u2222", angzarr: "\u237C", aogon: "\u0105", aopf: "\u{1D552}", apE: "\u2A70", apacir: "\u2A6F", ape: "\u224A",
  approxeq: "\u224A", apid: "\u224B", apos: "'", aring: "\xE5", ascr: "\u{1D4B6}", ast: "*", midast: "*", atilde: "\xE3", auml: "\xE4", awint: "\
\u2A11", bNot: "\u2AED", backcong: "\u224C", bcong: "\u224C", backepsilon: "\u03F6", bepsi: "\u03F6", backprime: "\u2035", bprime: "\u2035",
  backsim: "\u223D", bsim: "\u223D", backsimeq: "\u22CD", bsime: "\u22CD", barvee: "\u22BD", barwed: "\u2305", barwedge: "\u2305", bbrktbrk: "\
\u23B6", bcy: "\u0431", bdquo: "\u201E", ldquor: "\u201E", bemptyv: "\u29B0", beta: "\u03B2", beth: "\u2136", between: "\u226C", twixt: "\u226C",
  bfr: "\u{1D51F}", bigcirc: "\u25EF", xcirc: "\u25EF", bigodot: "\u2A00", xodot: "\u2A00", bigoplus: "\u2A01", xoplus: "\u2A01", bigotimes: "\
\u2A02", xotime: "\u2A02", bigsqcup: "\u2A06", xsqcup: "\u2A06", bigstar: "\u2605", starf: "\u2605", bigtriangledown: "\u25BD", xdtri: "\u25BD",
  bigtriangleup: "\u25B3", xutri: "\u25B3", biguplus: "\u2A04", xuplus: "\u2A04", bkarow: "\u290D", rbarr: "\u290D", blacklozenge: "\u29EB",
  lozf: "\u29EB", blacktriangle: "\u25B4", utrif: "\u25B4", blacktriangledown: "\u25BE", dtrif: "\u25BE", blacktriangleleft: "\u25C2", ltrif: "\
\u25C2", blacktriangleright: "\u25B8", rtrif: "\u25B8", blank: "\u2423", blk12: "\u2592", blk14: "\u2591", blk34: "\u2593", block: "\u2588",
  bne: "=\u20E5", bnequiv: "\u2261\u20E5", bnot: "\u2310", bopf: "\u{1D553}", bowtie: "\u22C8", boxDL: "\u2557", boxDR: "\u2554", boxDl: "\u2556",
  boxDr: "\u2553", boxH: "\u2550", boxHD: "\u2566", boxHU: "\u2569", boxHd: "\u2564", boxHu: "\u2567", boxUL: "\u255D", boxUR: "\u255A", boxUl: "\
\u255C", boxUr: "\u2559", boxV: "\u2551", boxVH: "\u256C", boxVL: "\u2563", boxVR: "\u2560", boxVh: "\u256B", boxVl: "\u2562", boxVr: "\u255F",
  boxbox: "\u29C9", boxdL: "\u2555", boxdR: "\u2552", boxdl: "\u2510", boxdr: "\u250C", boxhD: "\u2565", boxhU: "\u2568", boxhd: "\u252C", boxhu: "\
\u2534", boxminus: "\u229F", minusb: "\u229F", boxplus: "\u229E", plusb: "\u229E", boxtimes: "\u22A0", timesb: "\u22A0", boxuL: "\u255B", boxuR: "\
\u2558", boxul: "\u2518", boxur: "\u2514", boxv: "\u2502", boxvH: "\u256A", boxvL: "\u2561", boxvR: "\u255E", boxvh: "\u253C", boxvl: "\u2524",
  boxvr: "\u251C", brvbar: "\xA6", bscr: "\u{1D4B7}", bsemi: "\u204F", bsol: "\\", bsolb: "\u29C5", bsolhsub: "\u27C8", bull: "\u2022", bullet: "\
\u2022", bumpE: "\u2AAE", cacute: "\u0107", cap: "\u2229", capand: "\u2A44", capbrcup: "\u2A49", capcap: "\u2A4B", capcup: "\u2A47", capdot: "\
\u2A40", caps: "\u2229\uFE00", caret: "\u2041", ccaps: "\u2A4D", ccaron: "\u010D", ccedil: "\xE7", ccirc: "\u0109", ccups: "\u2A4C", ccupssm: "\
\u2A50", cdot: "\u010B", cemptyv: "\u29B2", cent: "\xA2", cfr: "\u{1D520}", chcy: "\u0447", check: "\u2713", checkmark: "\u2713", chi: "\u03C7",
  cir: "\u25CB", cirE: "\u29C3", circ: "\u02C6", circeq: "\u2257", cire: "\u2257", circlearrowleft: "\u21BA", olarr: "\u21BA", circlearrowright: "\
\u21BB", orarr: "\u21BB", circledS: "\u24C8", oS: "\u24C8", circledast: "\u229B", oast: "\u229B", circledcirc: "\u229A", ocir: "\u229A", circleddash: "\
\u229D", odash: "\u229D", cirfnint: "\u2A10", cirmid: "\u2AEF", cirscir: "\u29C2", clubs: "\u2663", clubsuit: "\u2663", colon: ":", comma: "\
,", commat: "@", comp: "\u2201", complement: "\u2201", congdot: "\u2A6D", copf: "\u{1D554}", copysr: "\u2117", crarr: "\u21B5", cross: "\u2717",
  cscr: "\u{1D4B8}", csub: "\u2ACF", csube: "\u2AD1", csup: "\u2AD0", csupe: "\u2AD2", ctdot: "\u22EF", cudarrl: "\u2938", cudarrr: "\u2935",
  cuepr: "\u22DE", curlyeqprec: "\u22DE", cuesc: "\u22DF", curlyeqsucc: "\u22DF", cularr: "\u21B6", curvearrowleft: "\u21B6", cularrp: "\u293D",
  cup: "\u222A", cupbrcap: "\u2A48", cupcap: "\u2A46", cupcup: "\u2A4A", cupdot: "\u228D", cupor: "\u2A45", cups: "\u222A\uFE00", curarr: "\u21B7",
  curvearrowright: "\u21B7", curarrm: "\u293C", curlyvee: "\u22CE", cuvee: "\u22CE", curlywedge: "\u22CF", cuwed: "\u22CF", curren: "\xA4", cwint: "\
\u2231", cylcty: "\u232D", dHar: "\u2965", dagger: "\u2020", daleth: "\u2138", dash: "\u2010", hyphen: "\u2010", dbkarow: "\u290F", rBarr: "\
\u290F", dcaron: "\u010F", dcy: "\u0434", ddarr: "\u21CA", downdownarrows: "\u21CA", ddotseq: "\u2A77", eDDot: "\u2A77", deg: "\xB0", delta: "\
\u03B4", demptyv: "\u29B1", dfisht: "\u297F", dfr: "\u{1D521}", diamondsuit: "\u2666", diams: "\u2666", digamma: "\u03DD", gammad: "\u03DD",
  disin: "\u22F2", div: "\xF7", divide: "\xF7", divideontimes: "\u22C7", divonx: "\u22C7", djcy: "\u0452", dlcorn: "\u231E", llcorner: "\u231E",
  dlcrop: "\u230D", dollar: "$", dopf: "\u{1D555}", doteqdot: "\u2251", eDot: "\u2251", dotminus: "\u2238", minusd: "\u2238", dotplus: "\u2214",
  plusdo: "\u2214", dotsquare: "\u22A1", sdotb: "\u22A1", drcorn: "\u231F", lrcorner: "\u231F", drcrop: "\u230C", dscr: "\u{1D4B9}", dscy: "\
\u0455", dsol: "\u29F6", dstrok: "\u0111", dtdot: "\u22F1", dtri: "\u25BF", triangledown: "\u25BF", dwangle: "\u29A6", dzcy: "\u045F", dzigrarr: "\
\u27FF", eacute: "\xE9", easter: "\u2A6E", ecaron: "\u011B", ecir: "\u2256", eqcirc: "\u2256", ecirc: "\xEA", ecolon: "\u2255", eqcolon: "\u2255",
  ecy: "\u044D", edot: "\u0117", efDot: "\u2252", fallingdotseq: "\u2252", efr: "\u{1D522}", eg: "\u2A9A", egrave: "\xE8", egs: "\u2A96", eqslantgtr: "\
\u2A96", egsdot: "\u2A98", el: "\u2A99", elinters: "\u23E7", ell: "\u2113", els: "\u2A95", eqslantless: "\u2A95", elsdot: "\u2A97", emacr: "\
\u0113", empty: "\u2205", emptyset: "\u2205", emptyv: "\u2205", varnothing: "\u2205", emsp13: "\u2004", emsp14: "\u2005", emsp: "\u2003", eng: "\
\u014B", ensp: "\u2002", eogon: "\u0119", eopf: "\u{1D556}", epar: "\u22D5", eparsl: "\u29E3", eplus: "\u2A71", epsi: "\u03B5", epsilon: "\u03B5",
  epsiv: "\u03F5", straightepsilon: "\u03F5", varepsilon: "\u03F5", equals: "=", equest: "\u225F", questeq: "\u225F", equivDD: "\u2A78", eqvparsl: "\
\u29E5", erDot: "\u2253", risingdotseq: "\u2253", erarr: "\u2971", escr: "\u212F", eta: "\u03B7", eth: "\xF0", euml: "\xEB", euro: "\u20AC",
  excl: "!", fcy: "\u0444", female: "\u2640", ffilig: "\uFB03", fflig: "\uFB00", ffllig: "\uFB04", ffr: "\u{1D523}", filig: "\uFB01", fjlig: "\
fj", flat: "\u266D", fllig: "\uFB02", fltns: "\u25B1", fnof: "\u0192", fopf: "\u{1D557}", fork: "\u22D4", pitchfork: "\u22D4", forkv: "\u2AD9",
  fpartint: "\u2A0D", frac12: "\xBD", half: "\xBD", frac13: "\u2153", frac14: "\xBC", frac15: "\u2155", frac16: "\u2159", frac18: "\u215B", frac23: "\
\u2154", frac25: "\u2156", frac34: "\xBE", frac35: "\u2157", frac38: "\u215C", frac45: "\u2158", frac56: "\u215A", frac58: "\u215D", frac78: "\
\u215E", frasl: "\u2044", frown: "\u2322", sfrown: "\u2322", fscr: "\u{1D4BB}", gEl: "\u2A8C", gtreqqless: "\u2A8C", gacute: "\u01F5", gamma: "\
\u03B3", gap: "\u2A86", gtrapprox: "\u2A86", gbreve: "\u011F", gcirc: "\u011D", gcy: "\u0433", gdot: "\u0121", gescc: "\u2AA9", gesdot: "\u2A80",
  gesdoto: "\u2A82", gesdotol: "\u2A84", gesl: "\u22DB\uFE00", gesles: "\u2A94", gfr: "\u{1D524}", gimel: "\u2137", gjcy: "\u0453", glE: "\u2A92",
  gla: "\u2AA5", glj: "\u2AA4", gnE: "\u2269", gneqq: "\u2269", gnap: "\u2A8A", gnapprox: "\u2A8A", gne: "\u2A88", gneq: "\u2A88", gnsim: "\u22E7",
  gopf: "\u{1D558}", gscr: "\u210A", gsime: "\u2A8E", gsiml: "\u2A90", gtcc: "\u2AA7", gtcir: "\u2A7A", gtdot: "\u22D7", gtrdot: "\u22D7", gtlPar: "\
\u2995", gtquest: "\u2A7C", gtrarr: "\u2978", gvertneqq: "\u2269\uFE00", gvnE: "\u2269\uFE00", hardcy: "\u044A", harrcir: "\u2948", harrw: "\
\u21AD", leftrightsquigarrow: "\u21AD", hbar: "\u210F", hslash: "\u210F", planck: "\u210F", plankv: "\u210F", hcirc: "\u0125", hearts: "\u2665",
  heartsuit: "\u2665", hellip: "\u2026", mldr: "\u2026", hercon: "\u22B9", hfr: "\u{1D525}", hksearow: "\u2925", searhk: "\u2925", hkswarow: "\
\u2926", swarhk: "\u2926", hoarr: "\u21FF", homtht: "\u223B", hookleftarrow: "\u21A9", larrhk: "\u21A9", hookrightarrow: "\u21AA", rarrhk: "\
\u21AA", hopf: "\u{1D559}", horbar: "\u2015", hscr: "\u{1D4BD}", hstrok: "\u0127", hybull: "\u2043", iacute: "\xED", icirc: "\xEE", icy: "\u0438",
  iecy: "\u0435", iexcl: "\xA1", ifr: "\u{1D526}", igrave: "\xEC", iiiint: "\u2A0C", qint: "\u2A0C", iiint: "\u222D", tint: "\u222D", iinfin: "\
\u29DC", iiota: "\u2129", ijlig: "\u0133", imacr: "\u012B", imath: "\u0131", inodot: "\u0131", imof: "\u22B7", imped: "\u01B5", incare: "\u2105",
  infin: "\u221E", infintie: "\u29DD", intcal: "\u22BA", intercal: "\u22BA", intlarhk: "\u2A17", intprod: "\u2A3C", iprod: "\u2A3C", iocy: "\
\u0451", iogon: "\u012F", iopf: "\u{1D55A}", iota: "\u03B9", iquest: "\xBF", iscr: "\u{1D4BE}", isinE: "\u22F9", isindot: "\u22F5", isins: "\
\u22F4", isinsv: "\u22F3", itilde: "\u0129", iukcy: "\u0456", iuml: "\xEF", jcirc: "\u0135", jcy: "\u0439", jfr: "\u{1D527}", jmath: "\u0237",
  jopf: "\u{1D55B}", jscr: "\u{1D4BF}", jsercy: "\u0458", jukcy: "\u0454", kappa: "\u03BA", kappav: "\u03F0", varkappa: "\u03F0", kcedil: "\u0137",
  kcy: "\u043A", kfr: "\u{1D528}", kgreen: "\u0138", khcy: "\u0445", kjcy: "\u045C", kopf: "\u{1D55C}", kscr: "\u{1D4C0}", lAtail: "\u291B",
  lBarr: "\u290E", lEg: "\u2A8B", lesseqqgtr: "\u2A8B", lHar: "\u2962", lacute: "\u013A", laemptyv: "\u29B4", lambda: "\u03BB", langd: "\u2991",
  lap: "\u2A85", lessapprox: "\u2A85", laquo: "\xAB", larrbfs: "\u291F", larrfs: "\u291D", larrlp: "\u21AB", looparrowleft: "\u21AB", larrpl: "\
\u2939", larrsim: "\u2973", larrtl: "\u21A2", leftarrowtail: "\u21A2", lat: "\u2AAB", latail: "\u2919", late: "\u2AAD", lates: "\u2AAD\uFE00",
  lbarr: "\u290C", lbbrk: "\u2772", lbrace: "{", lcub: "{", lbrack: "[", lsqb: "[", lbrke: "\u298B", lbrksld: "\u298F", lbrkslu: "\u298D", lcaron: "\
\u013E", lcedil: "\u013C", lcy: "\u043B", ldca: "\u2936", ldrdhar: "\u2967", ldrushar: "\u294B", ldsh: "\u21B2", le: "\u2264", leq: "\u2264",
  leftleftarrows: "\u21C7", llarr: "\u21C7", leftthreetimes: "\u22CB", lthree: "\u22CB", lescc: "\u2AA8", lesdot: "\u2A7F", lesdoto: "\u2A81",
  lesdotor: "\u2A83", lesg: "\u22DA\uFE00", lesges: "\u2A93", lessdot: "\u22D6", ltdot: "\u22D6", lfisht: "\u297C", lfr: "\u{1D529}", lgE: "\
\u2A91", lharul: "\u296A", lhblk: "\u2584", ljcy: "\u0459", llhard: "\u296B", lltri: "\u25FA", lmidot: "\u0140", lmoust: "\u23B0", lmoustache: "\
\u23B0", lnE: "\u2268", lneqq: "\u2268", lnap: "\u2A89", lnapprox: "\u2A89", lne: "\u2A87", lneq: "\u2A87", lnsim: "\u22E6", loang: "\u27EC",
  loarr: "\u21FD", longmapsto: "\u27FC", xmap: "\u27FC", looparrowright: "\u21AC", rarrlp: "\u21AC", lopar: "\u2985", lopf: "\u{1D55D}", loplus: "\
\u2A2D", lotimes: "\u2A34", lowast: "\u2217", loz: "\u25CA", lozenge: "\u25CA", lpar: "(", lparlt: "\u2993", lrhard: "\u296D", lrm: "\u200E",
  lrtri: "\u22BF", lsaquo: "\u2039", lscr: "\u{1D4C1}", lsime: "\u2A8D", lsimg: "\u2A8F", lsquor: "\u201A", sbquo: "\u201A", lstrok: "\u0142",
  ltcc: "\u2AA6", ltcir: "\u2A79", ltimes: "\u22C9", ltlarr: "\u2976", ltquest: "\u2A7B", ltrPar: "\u2996", ltri: "\u25C3", triangleleft: "\u25C3",
  lurdshar: "\u294A", luruhar: "\u2966", lvertneqq: "\u2268\uFE00", lvnE: "\u2268\uFE00", mDDot: "\u223A", macr: "\xAF", strns: "\xAF", male: "\
\u2642", malt: "\u2720", maltese: "\u2720", marker: "\u25AE", mcomma: "\u2A29", mcy: "\u043C", mdash: "\u2014", mfr: "\u{1D52A}", mho: "\u2127",
  micro: "\xB5", midcir: "\u2AF0", minus: "\u2212", minusdu: "\u2A2A", mlcp: "\u2ADB", models: "\u22A7", mopf: "\u{1D55E}", mscr: "\u{1D4C2}",
  mu: "\u03BC", multimap: "\u22B8", mumap: "\u22B8", nGg: "\u22D9\u0338", nGt: "\u226B\u20D2", nLeftarrow: "\u21CD", nlArr: "\u21CD", nLeftrightarrow: "\
\u21CE", nhArr: "\u21CE", nLl: "\u22D8\u0338", nLt: "\u226A\u20D2", nRightarrow: "\u21CF", nrArr: "\u21CF", nVDash: "\u22AF", nVdash: "\u22AE",
  nacute: "\u0144", nang: "\u2220\u20D2", napE: "\u2A70\u0338", napid: "\u224B\u0338", napos: "\u0149", natur: "\u266E", natural: "\u266E", ncap: "\
\u2A43", ncaron: "\u0148", ncedil: "\u0146", ncongdot: "\u2A6D\u0338", ncup: "\u2A42", ncy: "\u043D", ndash: "\u2013", neArr: "\u21D7", nearhk: "\
\u2924", nedot: "\u2250\u0338", nesear: "\u2928", toea: "\u2928", nfr: "\u{1D52B}", nharr: "\u21AE", nleftrightarrow: "\u21AE", nhpar: "\u2AF2",
  nis: "\u22FC", nisd: "\u22FA", njcy: "\u045A", nlE: "\u2266\u0338", nleqq: "\u2266\u0338", nlarr: "\u219A", nleftarrow: "\u219A", nldr: "\u2025",
  nopf: "\u{1D55F}", not: "\xAC", notinE: "\u22F9\u0338", notindot: "\u22F5\u0338", notinvb: "\u22F7", notinvc: "\u22F6", notnivb: "\u22FE",
  notnivc: "\u22FD", nparsl: "\u2AFD\u20E5", npart: "\u2202\u0338", npolint: "\u2A14", nrarr: "\u219B", nrightarrow: "\u219B", nrarrc: "\u2933\u0338",
  nrarrw: "\u219D\u0338", nscr: "\u{1D4C3}", nsub: "\u2284", nsubE: "\u2AC5\u0338", nsubseteqq: "\u2AC5\u0338", nsup: "\u2285", nsupE: "\u2AC6\u0338",
  nsupseteqq: "\u2AC6\u0338", ntilde: "\xF1", nu: "\u03BD", num: "#", numero: "\u2116", numsp: "\u2007", nvDash: "\u22AD", nvHarr: "\u2904",
  nvap: "\u224D\u20D2", nvdash: "\u22AC", nvge: "\u2265\u20D2", nvgt: ">\u20D2", nvinfin: "\u29DE", nvlArr: "\u2902", nvle: "\u2264\u20D2", nvlt: "\
<\u20D2", nvltrie: "\u22B4\u20D2", nvrArr: "\u2903", nvrtrie: "\u22B5\u20D2", nvsim: "\u223C\u20D2", nwArr: "\u21D6", nwarhk: "\u2923", nwnear: "\
\u2927", oacute: "\xF3", ocirc: "\xF4", ocy: "\u043E", odblac: "\u0151", odiv: "\u2A38", odsold: "\u29BC", oelig: "\u0153", ofcir: "\u29BF",
  ofr: "\u{1D52C}", ogon: "\u02DB", ograve: "\xF2", ogt: "\u29C1", ohbar: "\u29B5", olcir: "\u29BE", olcross: "\u29BB", olt: "\u29C0", omacr: "\
\u014D", omega: "\u03C9", omicron: "\u03BF", omid: "\u29B6", oopf: "\u{1D560}", opar: "\u29B7", operp: "\u29B9", or: "\u2228", vee: "\u2228",
  ord: "\u2A5D", order: "\u2134", orderof: "\u2134", oscr: "\u2134", ordf: "\xAA", ordm: "\xBA", origof: "\u22B6", oror: "\u2A56", orslope: "\
\u2A57", orv: "\u2A5B", oslash: "\xF8", osol: "\u2298", otilde: "\xF5", otimesas: "\u2A36", ouml: "\xF6", ovbar: "\u233D", para: "\xB6", parsim: "\
\u2AF3", parsl: "\u2AFD", pcy: "\u043F", percnt: "%", period: ".", permil: "\u2030", pertenk: "\u2031", pfr: "\u{1D52D}", phi: "\u03C6", phiv: "\
\u03D5", straightphi: "\u03D5", varphi: "\u03D5", phone: "\u260E", pi: "\u03C0", piv: "\u03D6", varpi: "\u03D6", planckh: "\u210E", plus: "+",
  plusacir: "\u2A23", pluscir: "\u2A22", plusdu: "\u2A25", pluse: "\u2A72", plussim: "\u2A26", plustwo: "\u2A27", pointint: "\u2A15", popf: "\
\u{1D561}", pound: "\xA3", prE: "\u2AB3", prap: "\u2AB7", precapprox: "\u2AB7", precnapprox: "\u2AB9", prnap: "\u2AB9", precneqq: "\u2AB5", prnE: "\
\u2AB5", precnsim: "\u22E8", prnsim: "\u22E8", prime: "\u2032", profalar: "\u232E", profline: "\u2312", profsurf: "\u2313", prurel: "\u22B0",
  pscr: "\u{1D4C5}", psi: "\u03C8", puncsp: "\u2008", qfr: "\u{1D52E}", qopf: "\u{1D562}", qprime: "\u2057", qscr: "\u{1D4C6}", quatint: "\u2A16",
  quest: "?", rAtail: "\u291C", rHar: "\u2964", race: "\u223D\u0331", racute: "\u0155", raemptyv: "\u29B3", rangd: "\u2992", range: "\u29A5",
  raquo: "\xBB", rarrap: "\u2975", rarrbfs: "\u2920", rarrc: "\u2933", rarrfs: "\u291E", rarrpl: "\u2945", rarrsim: "\u2974", rarrtl: "\u21A3",
  rightarrowtail: "\u21A3", rarrw: "\u219D", rightsquigarrow: "\u219D", ratail: "\u291A", ratio: "\u2236", rbbrk: "\u2773", rbrace: "}", rcub: "\
}", rbrack: "]", rsqb: "]", rbrke: "\u298C", rbrksld: "\u298E", rbrkslu: "\u2990", rcaron: "\u0159", rcedil: "\u0157", rcy: "\u0440", rdca: "\
\u2937", rdldhar: "\u2969", rdsh: "\u21B3", rect: "\u25AD", rfisht: "\u297D", rfr: "\u{1D52F}", rharul: "\u296C", rho: "\u03C1", rhov: "\u03F1",
  varrho: "\u03F1", rightrightarrows: "\u21C9", rrarr: "\u21C9", rightthreetimes: "\u22CC", rthree: "\u22CC", ring: "\u02DA", rlm: "\u200F",
  rmoust: "\u23B1", rmoustache: "\u23B1", rnmid: "\u2AEE", roang: "\u27ED", roarr: "\u21FE", ropar: "\u2986", ropf: "\u{1D563}", roplus: "\u2A2E",
  rotimes: "\u2A35", rpar: ")", rpargt: "\u2994", rppolint: "\u2A12", rsaquo: "\u203A", rscr: "\u{1D4C7}", rtimes: "\u22CA", rtri: "\u25B9",
  triangleright: "\u25B9", rtriltri: "\u29CE", ruluhar: "\u2968", rx: "\u211E", sacute: "\u015B", scE: "\u2AB4", scap: "\u2AB8", succapprox: "\
\u2AB8", scaron: "\u0161", scedil: "\u015F", scirc: "\u015D", scnE: "\u2AB6", succneqq: "\u2AB6", scnap: "\u2ABA", succnapprox: "\u2ABA", scnsim: "\
\u22E9", succnsim: "\u22E9", scpolint: "\u2A13", scy: "\u0441", sdot: "\u22C5", sdote: "\u2A66", seArr: "\u21D8", sect: "\xA7", semi: ";", seswar: "\
\u2929", tosa: "\u2929", sext: "\u2736", sfr: "\u{1D530}", sharp: "\u266F", shchcy: "\u0449", shcy: "\u0448", shy: "\xAD", sigma: "\u03C3", sigmaf: "\
\u03C2", sigmav: "\u03C2", varsigma: "\u03C2", simdot: "\u2A6A", simg: "\u2A9E", simgE: "\u2AA0", siml: "\u2A9D", simlE: "\u2A9F", simne: "\u2246",
  simplus: "\u2A24", simrarr: "\u2972", smashp: "\u2A33", smeparsl: "\u29E4", smile: "\u2323", ssmile: "\u2323", smt: "\u2AAA", smte: "\u2AAC",
  smtes: "\u2AAC\uFE00", softcy: "\u044C", sol: "/", solb: "\u29C4", solbar: "\u233F", sopf: "\u{1D564}", spades: "\u2660", spadesuit: "\u2660",
  sqcaps: "\u2293\uFE00", sqcups: "\u2294\uFE00", sscr: "\u{1D4C8}", star: "\u2606", sub: "\u2282", subset: "\u2282", subE: "\u2AC5", subseteqq: "\
\u2AC5", subdot: "\u2ABD", subedot: "\u2AC3", submult: "\u2AC1", subnE: "\u2ACB", subsetneqq: "\u2ACB", subne: "\u228A", subsetneq: "\u228A",
  subplus: "\u2ABF", subrarr: "\u2979", subsim: "\u2AC7", subsub: "\u2AD5", subsup: "\u2AD3", sung: "\u266A", sup1: "\xB9", sup2: "\xB2", sup3: "\
\xB3", supE: "\u2AC6", supseteqq: "\u2AC6", supdot: "\u2ABE", supdsub: "\u2AD8", supedot: "\u2AC4", suphsol: "\u27C9", suphsub: "\u2AD7", suplarr: "\
\u297B", supmult: "\u2AC2", supnE: "\u2ACC", supsetneqq: "\u2ACC", supne: "\u228B", supsetneq: "\u228B", supplus: "\u2AC0", supsim: "\u2AC8",
  supsub: "\u2AD4", supsup: "\u2AD6", swArr: "\u21D9", swnwar: "\u292A", szlig: "\xDF", target: "\u2316", tau: "\u03C4", tcaron: "\u0165", tcedil: "\
\u0163", tcy: "\u0442", telrec: "\u2315", tfr: "\u{1D531}", theta: "\u03B8", thetasym: "\u03D1", thetav: "\u03D1", vartheta: "\u03D1", thorn: "\
\xFE", times: "\xD7", timesbar: "\u2A31", timesd: "\u2A30", topbot: "\u2336", topcir: "\u2AF1", topf: "\u{1D565}", topfork: "\u2ADA", tprime: "\
\u2034", triangle: "\u25B5", utri: "\u25B5", triangleq: "\u225C", trie: "\u225C", tridot: "\u25EC", triminus: "\u2A3A", triplus: "\u2A39", trisb: "\
\u29CD", tritime: "\u2A3B", trpezium: "\u23E2", tscr: "\u{1D4C9}", tscy: "\u0446", tshcy: "\u045B", tstrok: "\u0167", uHar: "\u2963", uacute: "\
\xFA", ubrcy: "\u045E", ubreve: "\u016D", ucirc: "\xFB", ucy: "\u0443", udblac: "\u0171", ufisht: "\u297E", ufr: "\u{1D532}", ugrave: "\xF9",
  uhblk: "\u2580", ulcorn: "\u231C", ulcorner: "\u231C", ulcrop: "\u230F", ultri: "\u25F8", umacr: "\u016B", uogon: "\u0173", uopf: "\u{1D566}",
  upsi: "\u03C5", upsilon: "\u03C5", upuparrows: "\u21C8", uuarr: "\u21C8", urcorn: "\u231D", urcorner: "\u231D", urcrop: "\u230E", uring: "\
\u016F", urtri: "\u25F9", uscr: "\u{1D4CA}", utdot: "\u22F0", utilde: "\u0169", uuml: "\xFC", uwangle: "\u29A7", vBar: "\u2AE8", vBarv: "\u2AE9",
  vangrt: "\u299C", varsubsetneq: "\u228A\uFE00", vsubne: "\u228A\uFE00", varsubsetneqq: "\u2ACB\uFE00", vsubnE: "\u2ACB\uFE00", varsupsetneq: "\
\u228B\uFE00", vsupne: "\u228B\uFE00", varsupsetneqq: "\u2ACC\uFE00", vsupnE: "\u2ACC\uFE00", vcy: "\u0432", veebar: "\u22BB", veeeq: "\u225A",
  vellip: "\u22EE", vfr: "\u{1D533}", vopf: "\u{1D567}", vscr: "\u{1D4CB}", vzigzag: "\u299A", wcirc: "\u0175", wedbar: "\u2A5F", wedgeq: "\u2259",
  weierp: "\u2118", wp: "\u2118", wfr: "\u{1D534}", wopf: "\u{1D568}", wscr: "\u{1D4CC}", xfr: "\u{1D535}", xi: "\u03BE", xnis: "\u22FB", xopf: "\
\u{1D569}", xscr: "\u{1D4CD}", yacute: "\xFD", yacy: "\u044F", ycirc: "\u0177", ycy: "\u044B", yen: "\xA5", yfr: "\u{1D536}", yicy: "\u0457",
  yopf: "\u{1D56A}", yscr: "\u{1D4CE}", yucy: "\u044E", yuml: "\xFF", zacute: "\u017A", zcaron: "\u017E", zcy: "\u0437", zdot: "\u017C", zeta: "\
\u03B6", zfr: "\u{1D537}", zhcy: "\u0436", zigrarr: "\u21DD", zopf: "\u{1D56B}", zscr: "\u{1D4CF}", zwj: "\u200D", zwnj: "\u200C" }, DR = "\uE500";
  $i.ngsp = DR;
  xR = [/@/, /^\s*$/, /[<>]/, /^[{}]$/, /&(#|[a-z])/i, /^\/\//];
  a(CR, "Ls");
  ER = (Br = class {
    static fromArray(t) {
      return t ? (CR("interpolation", t), new Br(t[0], t[1])) : P2;
    }
    constructor(t, r) {
      this.start = t, this.end = r;
    }
  }, a(Br, "t"), Br), P2 = new ER("{{", "}}"), Uu = (Zn = class extends B2 {
    constructor(t, r, n) {
      super(n, t), this.tokenType = r;
    }
  }, a(Zn, "ft"), Zn), RR = (Jn = class {
    constructor(t, r, n) {
      this.tokens = t, this.errors = r, this.nonNormalizedIcuExpressions = n;
    }
  }, a(Jn, "$r"), Jn);
  a(SR, "Ws");
  AR = /\r\n?/g;
  a(Fn, "je");
  a(j5, "Rs");
  a(FR, "ho");
  (function(e) {
    e.HEX = "hexadecimal", e.DEC = "decimal";
  })(ji || (ji = {}));
  Gu = (Qn = class {
    constructor(t) {
      this.error = t;
    }
  }, a(Qn, "dt"), Qn), kR = (eo = class {
    constructor(t, r, n) {
      this._getTagContentType = r, this._currentTokenStart = null, this._currentTokenType = null, this._expansionCaseStack = [], this._inInterpolation =
      !1, this._fullNameStack = [], this.tokens = [], this.errors = [], this.nonNormalizedIcuExpressions = [], this._tokenizeIcu = n.tokenizeExpansionForms ||
      !1, this._interpolationConfig = n.interpolationConfig || P2, this._leadingTriviaCodePoints = n.leadingTriviaChars && n.leadingTriviaChars.
      map((i) => i.codePointAt(0) || 0), this._canSelfClose = n.canSelfClose || !1, this._allowHtmComponentClosingTags = n.allowHtmComponentClosingTags ||
      !1;
      let o = n.range || { endPos: t.content.length, startPos: 0, startLine: 0, startCol: 0 };
      this._cursor = n.escapedString ? new PR(t, o) : new H2(t, o), this._preserveLineEndings = n.preserveLineEndings || !1, this._i18nNormalizeLineEndingsInICUs =
      n.i18nNormalizeLineEndingsInICUs || !1, this._tokenizeBlocks = n.tokenizeBlocks ?? !0, this._tokenizeLet = n.tokenizeLet ?? !0;
      try {
        this._cursor.init();
      } catch (i) {
        this.handleError(i);
      }
    }
    _processCarriageReturns(t) {
      return this._preserveLineEndings ? t : t.replace(AR, `
`);
    }
    tokenize() {
      for (; this._cursor.peek() !== 0; ) {
        let t = this._cursor.clone();
        try {
          if (this._attemptCharCode(60)) if (this._attemptCharCode(33)) this._attemptStr("[CDATA[") ? this._consumeCdata(t) : this._attemptStr(
          "--") ? this._consumeComment(t) : this._attemptStrCaseInsensitive("doctype") ? this._consumeDocType(t) : this._consumeBogusComment(
          t);
          else if (this._attemptCharCode(47)) this._consumeTagClose(t);
          else {
            let r = this._cursor.clone();
            this._attemptCharCode(63) ? (this._cursor = r, this._consumeBogusComment(t)) : this._consumeTagOpen(t);
          }
          else this._tokenizeLet && this._cursor.peek() === 64 && !this._inInterpolation && this._attemptStr("@let") ? this._consumeLetDeclaration(
          t) : this._tokenizeBlocks && this._attemptCharCode(64) ? this._consumeBlockStart(t) : this._tokenizeBlocks && !this._inInterpolation &&
          !this._isInExpansionCase() && !this._isInExpansionForm() && this._attemptCharCode(125) ? this._consumeBlockEnd(t) : this._tokenizeIcu &&
          this._tokenizeExpansionForm() || this._consumeWithInterpolation(5, 8, () => this._isTextEnd(), () => this._isTagStart());
        } catch (r) {
          this.handleError(r);
        }
      }
      this._beginToken(34), this._endToken([]);
    }
    _getBlockName() {
      let t = !1, r = this._cursor.clone();
      return this._attemptCharCodeUntilFn((n) => Hi(n) ? !t : q5(n) ? (t = !0, !1) : !0), this._cursor.getChars(r).trim();
    }
    _consumeBlockStart(t) {
      this._beginToken(25, t);
      let r = this._endToken([this._getBlockName()]);
      if (this._cursor.peek() === 40) if (this._cursor.advance(), this._consumeBlockParameters(), this._attemptCharCodeUntilFn(ue), this._attemptCharCode(
      41)) this._attemptCharCodeUntilFn(ue);
      else {
        r.type = 29;
        return;
      }
      this._attemptCharCode(123) ? (this._beginToken(26), this._endToken([])) : r.type = 29;
    }
    _consumeBlockEnd(t) {
      this._beginToken(27, t), this._endToken([]);
    }
    _consumeBlockParameters() {
      for (this._attemptCharCodeUntilFn(U5); this._cursor.peek() !== 41 && this._cursor.peek() !== 0; ) {
        this._beginToken(28);
        let t = this._cursor.clone(), r = null, n = 0;
        for (; this._cursor.peek() !== 59 && this._cursor.peek() !== 0 || r !== null; ) {
          let o = this._cursor.peek();
          if (o === 92) this._cursor.advance();
          else if (o === r) r = null;
          else if (r === null && qu(o)) r = o;
          else if (o === 40 && r === null) n++;
          else if (o === 41 && r === null) {
            if (n === 0) break;
            n > 0 && n--;
          }
          this._cursor.advance();
        }
        this._endToken([this._cursor.getChars(t)]), this._attemptCharCodeUntilFn(U5);
      }
    }
    _consumeLetDeclaration(t) {
      if (this._beginToken(30, t), Hi(this._cursor.peek())) this._attemptCharCodeUntilFn(ue);
      else {
        let n = this._endToken([this._cursor.getChars(t)]);
        n.type = 33;
        return;
      }
      let r = this._endToken([this._getLetDeclarationName()]);
      if (this._attemptCharCodeUntilFn(ue), !this._attemptCharCode(61)) {
        r.type = 33;
        return;
      }
      this._attemptCharCodeUntilFn((n) => ue(n) && !yc(n)), this._consumeLetDeclarationValue(), this._cursor.peek() === 59 ? (this._beginToken(
      32), this._endToken([]), this._cursor.advance()) : (r.type = 33, r.sourceSpan = this._cursor.getSpan(t));
    }
    _getLetDeclarationName() {
      let t = this._cursor.clone(), r = !1;
      return this._attemptCharCodeUntilFn((n) => zi(n) || n == 36 || n === 95 || r && bc(n) ? (r = !0, !1) : !0), this._cursor.getChars(t).trim();
    }
    _consumeLetDeclarationValue() {
      let t = this._cursor.clone();
      for (this._beginToken(31, t); this._cursor.peek() !== 0; ) {
        let r = this._cursor.peek();
        if (r === 59) break;
        qu(r) && (this._cursor.advance(), this._attemptCharCodeUntilFn((n) => n === 92 ? (this._cursor.advance(), !1) : n === r)), this._cursor.
        advance();
      }
      this._endToken([this._cursor.getChars(t)]);
    }
    _tokenizeExpansionForm() {
      if (this.isExpansionFormStart()) return this._consumeExpansionFormStart(), !0;
      if (IR(this._cursor.peek()) && this._isInExpansionForm()) return this._consumeExpansionCaseStart(), !0;
      if (this._cursor.peek() === 125) {
        if (this._isInExpansionCase()) return this._consumeExpansionCaseEnd(), !0;
        if (this._isInExpansionForm()) return this._consumeExpansionFormEnd(), !0;
      }
      return !1;
    }
    _beginToken(t, r = this._cursor.clone()) {
      this._currentTokenStart = r, this._currentTokenType = t;
    }
    _endToken(t, r) {
      if (this._currentTokenStart === null) throw new Uu("Programming error - attempted to end a token when there was no start to the token",
      this._currentTokenType, this._cursor.getSpan(r));
      if (this._currentTokenType === null) throw new Uu("Programming error - attempted to end a token which has no token type", null, this._cursor.
      getSpan(this._currentTokenStart));
      let n = { type: this._currentTokenType, parts: t, sourceSpan: (r ?? this._cursor).getSpan(this._currentTokenStart, this._leadingTriviaCodePoints) };
      return this.tokens.push(n), this._currentTokenStart = null, this._currentTokenType = null, n;
    }
    _createError(t, r) {
      this._isInExpansionForm() && (t += ` (Do you have an unescaped "{" in your template? Use "{{ '{' }}") to escape it.)`);
      let n = new Uu(t, this._currentTokenType, r);
      return this._currentTokenStart = null, this._currentTokenType = null, new Gu(n);
    }
    handleError(t) {
      if (t instanceof Dc && (t = this._createError(t.msg, this._cursor.getSpan(t.cursor))), t instanceof Gu) this.errors.push(t.error);
      else throw t;
    }
    _attemptCharCode(t) {
      return this._cursor.peek() === t ? (this._cursor.advance(), !0) : !1;
    }
    _attemptCharCodeCaseInsensitive(t) {
      return MR(this._cursor.peek(), t) ? (this._cursor.advance(), !0) : !1;
    }
    _requireCharCode(t) {
      let r = this._cursor.clone();
      if (!this._attemptCharCode(t)) throw this._createError(Fn(this._cursor.peek()), this._cursor.getSpan(r));
    }
    _attemptStr(t) {
      let r = t.length;
      if (this._cursor.charsLeft() < r) return !1;
      let n = this._cursor.clone();
      for (let o = 0; o < r; o++) if (!this._attemptCharCode(t.charCodeAt(o))) return this._cursor = n, !1;
      return !0;
    }
    _attemptStrCaseInsensitive(t) {
      for (let r = 0; r < t.length; r++) if (!this._attemptCharCodeCaseInsensitive(t.charCodeAt(r))) return !1;
      return !0;
    }
    _requireStr(t) {
      let r = this._cursor.clone();
      if (!this._attemptStr(t)) throw this._createError(Fn(this._cursor.peek()), this._cursor.getSpan(r));
    }
    _requireStrCaseInsensitive(t) {
      let r = this._cursor.clone();
      if (!this._attemptStrCaseInsensitive(t)) throw this._createError(Fn(this._cursor.peek()), this._cursor.getSpan(r));
    }
    _attemptCharCodeUntilFn(t) {
      for (; !t(this._cursor.peek()); ) this._cursor.advance();
    }
    _requireCharCodeUntilFn(t, r) {
      let n = this._cursor.clone();
      if (this._attemptCharCodeUntilFn(t), this._cursor.diff(n) < r) throw this._createError(Fn(this._cursor.peek()), this._cursor.getSpan(n));
    }
    _attemptUntilChar(t) {
      for (; this._cursor.peek() !== t; ) this._cursor.advance();
    }
    _readChar() {
      let t = String.fromCodePoint(this._cursor.peek());
      return this._cursor.advance(), t;
    }
    _consumeEntity(t) {
      this._beginToken(9);
      let r = this._cursor.clone();
      if (this._cursor.advance(), this._attemptCharCode(35)) {
        let n = this._attemptCharCode(120) || this._attemptCharCode(88), o = this._cursor.clone();
        if (this._attemptCharCodeUntilFn(TR), this._cursor.peek() != 59) {
          this._cursor.advance();
          let l = n ? ji.HEX : ji.DEC;
          throw this._createError(FR(l, this._cursor.getChars(r)), this._cursor.getSpan());
        }
        let i = this._cursor.getChars(o);
        this._cursor.advance();
        try {
          let l = parseInt(i, n ? 16 : 10);
          this._endToken([String.fromCharCode(l), this._cursor.getChars(r)]);
        } catch {
          throw this._createError(j5(this._cursor.getChars(r)), this._cursor.getSpan());
        }
      } else {
        let n = this._cursor.clone();
        if (this._attemptCharCodeUntilFn(BR), this._cursor.peek() != 59) this._beginToken(t, r), this._cursor = n, this._endToken(["&"]);
        else {
          let o = this._cursor.getChars(n);
          this._cursor.advance();
          let i = $i[o];
          if (!i) throw this._createError(j5(o), this._cursor.getSpan(r));
          this._endToken([i, `&${o};`]);
        }
      }
    }
    _consumeRawText(t, r) {
      this._beginToken(t ? 6 : 7);
      let n = [];
      for (; ; ) {
        let o = this._cursor.clone(), i = r();
        if (this._cursor = o, i) break;
        t && this._cursor.peek() === 38 ? (this._endToken([this._processCarriageReturns(n.join(""))]), n.length = 0, this._consumeEntity(6),
        this._beginToken(6)) : n.push(this._readChar());
      }
      this._endToken([this._processCarriageReturns(n.join(""))]);
    }
    _consumeComment(t) {
      this._beginToken(10, t), this._endToken([]), this._consumeRawText(!1, () => this._attemptStr("-->")), this._beginToken(11), this._requireStr(
      "-->"), this._endToken([]);
    }
    _consumeBogusComment(t) {
      this._beginToken(10, t), this._endToken([]), this._consumeRawText(!1, () => this._cursor.peek() === 62), this._beginToken(11), this._cursor.
      advance(), this._endToken([]);
    }
    _consumeCdata(t) {
      this._beginToken(12, t), this._endToken([]), this._consumeRawText(!1, () => this._attemptStr("]]>")), this._beginToken(13), this._requireStr(
      "]]>"), this._endToken([]);
    }
    _consumeDocType(t) {
      this._beginToken(18, t), this._endToken([]), this._consumeRawText(!1, () => this._cursor.peek() === 62), this._beginToken(19), this._cursor.
      advance(), this._endToken([]);
    }
    _consumePrefixAndName() {
      let t = this._cursor.clone(), r = "";
      for (; this._cursor.peek() !== 58 && !LR(this._cursor.peek()); ) this._cursor.advance();
      let n;
      this._cursor.peek() === 58 ? (r = this._cursor.getChars(t), this._cursor.advance(), n = this._cursor.clone()) : n = t, this._requireCharCodeUntilFn(
      V5, r === "" ? 0 : 1);
      let o = this._cursor.getChars(n);
      return [r, o];
    }
    _consumeTagOpen(t) {
      let r, n, o, i = [];
      try {
        if (!zi(this._cursor.peek())) throw this._createError(Fn(this._cursor.peek()), this._cursor.getSpan(t));
        for (o = this._consumeTagOpenStart(t), n = o.parts[0], r = o.parts[1], this._attemptCharCodeUntilFn(ue); this._cursor.peek() !== 47 &&
        this._cursor.peek() !== 62 && this._cursor.peek() !== 60 && this._cursor.peek() !== 0; ) {
          let [u, c] = this._consumeAttributeName();
          if (this._attemptCharCodeUntilFn(ue), this._attemptCharCode(61)) {
            this._attemptCharCodeUntilFn(ue);
            let p = this._consumeAttributeValue();
            i.push({ prefix: u, name: c, value: p });
          } else i.push({ prefix: u, name: c });
          this._attemptCharCodeUntilFn(ue);
        }
        this._consumeTagOpenEnd();
      } catch (u) {
        if (u instanceof Gu) {
          o ? o.type = 4 : (this._beginToken(5, t), this._endToken(["<"]));
          return;
        }
        throw u;
      }
      if (this._canSelfClose && this.tokens[this.tokens.length - 1].type === 2) return;
      let l = this._getTagContentType(r, n, this._fullNameStack.length > 0, i);
      this._handleFullNameStackForTagOpen(n, r), l === pt.RAW_TEXT ? this._consumeRawTextWithTagClose(n, r, !1) : l === pt.ESCAPABLE_RAW_TEXT &&
      this._consumeRawTextWithTagClose(n, r, !0);
    }
    _consumeRawTextWithTagClose(t, r, n) {
      this._consumeRawText(n, () => !this._attemptCharCode(60) || !this._attemptCharCode(47) || (this._attemptCharCodeUntilFn(ue), !this._attemptStrCaseInsensitive(
      t ? `${t}:${r}` : r)) ? !1 : (this._attemptCharCodeUntilFn(ue), this._attemptCharCode(62))), this._beginToken(3), this._requireCharCodeUntilFn(
      (o) => o === 62, 3), this._cursor.advance(), this._endToken([t, r]), this._handleFullNameStackForTagClose(t, r);
    }
    _consumeTagOpenStart(t) {
      this._beginToken(0, t);
      let r = this._consumePrefixAndName();
      return this._endToken(r);
    }
    _consumeAttributeName() {
      let t = this._cursor.peek();
      if (t === 39 || t === 34) throw this._createError(Fn(t), this._cursor.getSpan());
      this._beginToken(14);
      let r = this._consumePrefixAndName();
      return this._endToken(r), r;
    }
    _consumeAttributeValue() {
      let t;
      if (this._cursor.peek() === 39 || this._cursor.peek() === 34) {
        let r = this._cursor.peek();
        this._consumeQuote(r);
        let n = /* @__PURE__ */ a(() => this._cursor.peek() === r, "n");
        t = this._consumeWithInterpolation(16, 17, n, n), this._consumeQuote(r);
      } else {
        let r = /* @__PURE__ */ a(() => V5(this._cursor.peek()), "r");
        t = this._consumeWithInterpolation(16, 17, r, r);
      }
      return t;
    }
    _consumeQuote(t) {
      this._beginToken(15), this._requireCharCode(t), this._endToken([String.fromCodePoint(t)]);
    }
    _consumeTagOpenEnd() {
      let t = this._attemptCharCode(47) ? 2 : 1;
      this._beginToken(t), this._requireCharCode(62), this._endToken([]);
    }
    _consumeTagClose(t) {
      if (this._beginToken(3, t), this._attemptCharCodeUntilFn(ue), this._allowHtmComponentClosingTags && this._attemptCharCode(47)) this._attemptCharCodeUntilFn(
      ue), this._requireCharCode(62), this._endToken([]);
      else {
        let [r, n] = this._consumePrefixAndName();
        this._attemptCharCodeUntilFn(ue), this._requireCharCode(62), this._endToken([r, n]), this._handleFullNameStackForTagClose(r, n);
      }
    }
    _consumeExpansionFormStart() {
      this._beginToken(20), this._requireCharCode(123), this._endToken([]), this._expansionCaseStack.push(20), this._beginToken(7);
      let t = this._readUntil(44), r = this._processCarriageReturns(t);
      if (this._i18nNormalizeLineEndingsInICUs) this._endToken([r]);
      else {
        let o = this._endToken([t]);
        r !== t && this.nonNormalizedIcuExpressions.push(o);
      }
      this._requireCharCode(44), this._attemptCharCodeUntilFn(ue), this._beginToken(7);
      let n = this._readUntil(44);
      this._endToken([n]), this._requireCharCode(44), this._attemptCharCodeUntilFn(ue);
    }
    _consumeExpansionCaseStart() {
      this._beginToken(21);
      let t = this._readUntil(123).trim();
      this._endToken([t]), this._attemptCharCodeUntilFn(ue), this._beginToken(22), this._requireCharCode(123), this._endToken([]), this._attemptCharCodeUntilFn(
      ue), this._expansionCaseStack.push(22);
    }
    _consumeExpansionCaseEnd() {
      this._beginToken(23), this._requireCharCode(125), this._endToken([]), this._attemptCharCodeUntilFn(ue), this._expansionCaseStack.pop();
    }
    _consumeExpansionFormEnd() {
      this._beginToken(24), this._requireCharCode(125), this._endToken([]), this._expansionCaseStack.pop();
    }
    _consumeWithInterpolation(t, r, n, o) {
      this._beginToken(t);
      let i = [];
      for (; !n(); ) {
        let u = this._cursor.clone();
        this._interpolationConfig && this._attemptStr(this._interpolationConfig.start) ? (this._endToken([this._processCarriageReturns(i.join(
        ""))], u), i.length = 0, this._consumeInterpolation(r, u, o), this._beginToken(t)) : this._cursor.peek() === 38 ? (this._endToken([this.
        _processCarriageReturns(i.join(""))]), i.length = 0, this._consumeEntity(t), this._beginToken(t)) : i.push(this._readChar());
      }
      this._inInterpolation = !1;
      let l = this._processCarriageReturns(i.join(""));
      return this._endToken([l]), l;
    }
    _consumeInterpolation(t, r, n) {
      let o = [];
      this._beginToken(t, r), o.push(this._interpolationConfig.start);
      let i = this._cursor.clone(), l = null, u = !1;
      for (; this._cursor.peek() !== 0 && (n === null || !n()); ) {
        let c = this._cursor.clone();
        if (this._isTagStart()) {
          this._cursor = c, o.push(this._getProcessedChars(i, c)), this._endToken(o);
          return;
        }
        if (l === null) if (this._attemptStr(this._interpolationConfig.end)) {
          o.push(this._getProcessedChars(i, c)), o.push(this._interpolationConfig.end), this._endToken(o);
          return;
        } else this._attemptStr("//") && (u = !0);
        let p = this._cursor.peek();
        this._cursor.advance(), p === 92 ? this._cursor.advance() : p === l ? l = null : !u && l === null && qu(p) && (l = p);
      }
      o.push(this._getProcessedChars(i, this._cursor)), this._endToken(o);
    }
    _getProcessedChars(t, r) {
      return this._processCarriageReturns(r.getChars(t));
    }
    _isTextEnd() {
      return !!(this._isTagStart() || this._cursor.peek() === 0 || this._tokenizeIcu && !this._inInterpolation && (this.isExpansionFormStart() ||
      this._cursor.peek() === 125 && this._isInExpansionCase()) || this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansion() &&
      (this._isBlockStart() || this._cursor.peek() === 64 || this._cursor.peek() === 125));
    }
    _isTagStart() {
      if (this._cursor.peek() === 60) {
        let t = this._cursor.clone();
        t.advance();
        let r = t.peek();
        if (97 <= r && r <= 122 || 65 <= r && r <= 90 || r === 47 || r === 33) return !0;
      }
      return !1;
    }
    _isBlockStart() {
      if (this._tokenizeBlocks && this._cursor.peek() === 64) {
        let t = this._cursor.clone();
        if (t.advance(), q5(t.peek())) return !0;
      }
      return !1;
    }
    _readUntil(t) {
      let r = this._cursor.clone();
      return this._attemptUntilChar(t), this._cursor.getChars(r);
    }
    _isInExpansion() {
      return this._isInExpansionCase() || this._isInExpansionForm();
    }
    _isInExpansionCase() {
      return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 22;
    }
    _isInExpansionForm() {
      return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 20;
    }
    isExpansionFormStart() {
      if (this._cursor.peek() !== 123) return !1;
      if (this._interpolationConfig) {
        let t = this._cursor.clone(), r = this._attemptStr(this._interpolationConfig.start);
        return this._cursor = t, !r;
      }
      return !0;
    }
    _handleFullNameStackForTagOpen(t, r) {
      let n = Ni(t, r);
      (this._fullNameStack.length === 0 || this._fullNameStack[this._fullNameStack.length - 1] === n) && this._fullNameStack.push(n);
    }
    _handleFullNameStackForTagClose(t, r) {
      let n = Ni(t, r);
      this._fullNameStack.length !== 0 && this._fullNameStack[this._fullNameStack.length - 1] === n && this._fullNameStack.pop();
    }
  }, a(eo, "Or"), eo);
  a(ue, "b");
  a(V5, "$s");
  a(LR, "mo");
  a(TR, "fo");
  a(BR, "go");
  a(IR, "Co");
  a(MR, "So");
  a(W5, "Os");
  a(q5, "Ms");
  a(U5, "qs");
  a(_R, "_o");
  H2 = (or = class {
    constructor(t, r) {
      if (t instanceof or) {
        this.file = t.file, this.input = t.input, this.end = t.end;
        let n = t.state;
        this.state = { peek: n.peek, offset: n.offset, line: n.line, column: n.column };
      } else {
        if (!r) throw new Error("Programming error: the range argument must be provided with a file argument.");
        this.file = t, this.input = t.content, this.end = r.endPos, this.state = { peek: -1, offset: r.startPos, line: r.startLine, column: r.
        startCol };
      }
    }
    clone() {
      return new or(this);
    }
    peek() {
      return this.state.peek;
    }
    charsLeft() {
      return this.end - this.state.offset;
    }
    diff(t) {
      return this.state.offset - t.state.offset;
    }
    advance() {
      this.advanceState(this.state);
    }
    init() {
      this.updatePeek(this.state);
    }
    getSpan(t, r) {
      t = t || this;
      let n = t;
      if (r) for (; this.diff(t) > 0 && r.indexOf(t.peek()) !== -1; ) n === t && (t = t.clone()), t.advance();
      let o = this.locationFromCursor(t), i = this.locationFromCursor(this), l = n !== t ? this.locationFromCursor(n) : o;
      return new $(o, i, l);
    }
    getChars(t) {
      return this.input.substring(t.state.offset, this.state.offset);
    }
    charAt(t) {
      return this.input.charCodeAt(t);
    }
    advanceState(t) {
      if (t.offset >= this.end) throw this.state = t, new Dc('Unexpected character "EOF"', this);
      let r = this.charAt(t.offset);
      r === 10 ? (t.line++, t.column = 0) : yc(r) || t.column++, t.offset++, this.updatePeek(t);
    }
    updatePeek(t) {
      t.peek = t.offset >= this.end ? 0 : this.charAt(t.offset);
    }
    locationFromCursor(t) {
      return new Ju(t.file, t.state.offset, t.state.line, t.state.column);
    }
  }, a(or, "t"), or), PR = (ar = class extends H2 {
    constructor(t, r) {
      t instanceof ar ? (super(t), this.internalState = { ...t.internalState }) : (super(t, r), this.internalState = this.state);
    }
    advance() {
      this.state = this.internalState, super.advance(), this.processEscapeSequence();
    }
    init() {
      super.init(), this.processEscapeSequence();
    }
    clone() {
      return new ar(this);
    }
    getChars(t) {
      let r = t.clone(), n = "";
      for (; r.internalState.offset < this.internalState.offset; ) n += String.fromCodePoint(r.peek()), r.advance();
      return n;
    }
    processEscapeSequence() {
      let t = /* @__PURE__ */ a(() => this.internalState.peek, "e");
      if (t() === 92) if (this.internalState = { ...this.state }, this.advanceState(this.internalState), t() === 110) this.state.peek = 10;
      else if (t() === 114) this.state.peek = 13;
      else if (t() === 118) this.state.peek = 11;
      else if (t() === 116) this.state.peek = 9;
      else if (t() === 98) this.state.peek = 8;
      else if (t() === 102) this.state.peek = 12;
      else if (t() === 117) if (this.advanceState(this.internalState), t() === 123) {
        this.advanceState(this.internalState);
        let r = this.clone(), n = 0;
        for (; t() !== 125; ) this.advanceState(this.internalState), n++;
        this.state.peek = this.decodeHexDigits(r, n);
      } else {
        let r = this.clone();
        this.advanceState(this.internalState), this.advanceState(this.internalState), this.advanceState(this.internalState), this.state.peek =
        this.decodeHexDigits(r, 4);
      }
      else if (t() === 120) {
        this.advanceState(this.internalState);
        let r = this.clone();
        this.advanceState(this.internalState), this.state.peek = this.decodeHexDigits(r, 2);
      } else if (A5(t())) {
        let r = "", n = 0, o = this.clone();
        for (; A5(t()) && n < 3; ) o = this.clone(), r += String.fromCodePoint(t()), this.advanceState(this.internalState), n++;
        this.state.peek = parseInt(r, 8), this.internalState = o.internalState;
      } else yc(this.internalState.peek) ? (this.advanceState(this.internalState), this.state = this.internalState) : this.state.peek = this.
      internalState.peek;
    }
    decodeHexDigits(t, r) {
      let n = this.input.slice(t.internalState.offset, t.internalState.offset + r), o = parseInt(n, 16);
      if (isNaN(o)) throw t.state = t.internalState, new Dc("Invalid hexadecimal escape sequence", t);
      return o;
    }
  }, a(ar, "t"), ar), Dc = (to = class {
    constructor(t, r) {
      this.msg = t, this.cursor = r;
    }
  }, a(to, "gt"), to), Ie = (Ir = class extends B2 {
    static create(t, r, n) {
      return new Ir(t, r, n);
    }
    constructor(t, r, n) {
      super(r, n), this.elementName = t;
    }
  }, a(Ir, "t"), Ir), HR = (ro = class {
    constructor(t, r) {
      this.rootNodes = t, this.errors = r;
    }
  }, a(ro, "Vr"), ro), zR = (no = class {
    constructor(t) {
      this.getTagDefinition = t;
    }
    parse(t, r, n, o = !1, i) {
      let l = /* @__PURE__ */ a((b) => (m, ...g) => b(m.toLowerCase(), ...g), "a"), u = o ? this.getTagDefinition : l(this.getTagDefinition),
      c = /* @__PURE__ */ a((b) => u(b).getContentType(), "u"), p = o ? i : l(i), d = SR(t, r, i ? (b, m, g, y) => {
        let w = p(b, m, g, y);
        return w !== void 0 ? w : c(b);
      } : c, n), h = n && n.canSelfClose || !1, f = n && n.allowHtmComponentClosingTags || !1, v = new OR(d.tokens, u, h, f, o);
      return v.build(), new HR(v.rootNodes, d.errors.concat(v.errors));
    }
  }, a(no, "nr"), no), OR = (Mr = class {
    constructor(t, r, n, o, i) {
      this.tokens = t, this.getTagDefinition = r, this.canSelfClose = n, this.allowHtmComponentClosingTags = o, this.isTagNameCaseSensitive =
      i, this._index = -1, this._containerStack = [], this.rootNodes = [], this.errors = [], this._advance();
    }
    build() {
      for (; this._peek.type !== 34; ) this._peek.type === 0 || this._peek.type === 4 ? this._consumeStartTag(this._advance()) : this._peek.
      type === 3 ? (this._closeVoidElement(), this._consumeEndTag(this._advance())) : this._peek.type === 12 ? (this._closeVoidElement(), this.
      _consumeCdata(this._advance())) : this._peek.type === 10 ? (this._closeVoidElement(), this._consumeComment(this._advance())) : this._peek.
      type === 5 || this._peek.type === 7 || this._peek.type === 6 ? (this._closeVoidElement(), this._consumeText(this._advance())) : this._peek.
      type === 20 ? this._consumeExpansion(this._advance()) : this._peek.type === 25 ? (this._closeVoidElement(), this._consumeBlockOpen(this.
      _advance())) : this._peek.type === 27 ? (this._closeVoidElement(), this._consumeBlockClose(this._advance())) : this._peek.type === 29 ?
      (this._closeVoidElement(), this._consumeIncompleteBlock(this._advance())) : this._peek.type === 30 ? (this._closeVoidElement(), this._consumeLet(
      this._advance())) : this._peek.type === 18 ? this._consumeDocType(this._advance()) : this._peek.type === 33 ? (this._closeVoidElement(),
      this._consumeIncompleteLet(this._advance())) : this._advance();
      for (let t of this._containerStack) t instanceof An && this.errors.push(Ie.create(t.name, t.sourceSpan, `Unclosed block "${t.name}"`));
    }
    _advance() {
      let t = this._peek;
      return this._index < this.tokens.length - 1 && this._index++, this._peek = this.tokens[this._index], t;
    }
    _advanceIf(t) {
      return this._peek.type === t ? this._advance() : null;
    }
    _consumeCdata(t) {
      let r = this._advance(), n = this._getText(r), o = this._advanceIf(13);
      this._addToParent(new hR(n, new $(t.sourceSpan.start, (o || r).sourceSpan.end), [r]));
    }
    _consumeComment(t) {
      let r = this._advanceIf(7), n = this._advanceIf(11), o = r != null ? r.parts[0].trim() : null, i = n == null ? t.sourceSpan : new $(t.
      sourceSpan.start, n.sourceSpan.end, t.sourceSpan.fullStart);
      this._addToParent(new wR(o, i));
    }
    _consumeDocType(t) {
      let r = this._advanceIf(7), n = this._advanceIf(19), o = r != null ? r.parts[0].trim() : null, i = new $(t.sourceSpan.start, (n || r ||
      t).sourceSpan.end);
      this._addToParent(new bR(o, i));
    }
    _consumeExpansion(t) {
      let r = this._advance(), n = this._advance(), o = [];
      for (; this._peek.type === 21; ) {
        let l = this._parseExpansionCase();
        if (!l) return;
        o.push(l);
      }
      if (this._peek.type !== 24) {
        this.errors.push(Ie.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '}'."));
        return;
      }
      let i = new $(t.sourceSpan.start, this._peek.sourceSpan.end, t.sourceSpan.fullStart);
      this._addToParent(new mR(r.parts[0], n.parts[0], o, i, r.sourceSpan)), this._advance();
    }
    _parseExpansionCase() {
      let t = this._advance();
      if (this._peek.type !== 22) return this.errors.push(Ie.create(null, this._peek.sourceSpan, "Invalid ICU message. Missing '{'.")), null;
      let r = this._advance(), n = this._collectExpansionExpTokens(r);
      if (!n) return null;
      let o = this._advance();
      n.push({ type: 34, parts: [], sourceSpan: o.sourceSpan });
      let i = new Mr(n, this.getTagDefinition, this.canSelfClose, this.allowHtmComponentClosingTags, this.isTagNameCaseSensitive);
      if (i.build(), i.errors.length > 0) return this.errors = this.errors.concat(i.errors), null;
      let l = new $(t.sourceSpan.start, o.sourceSpan.end, t.sourceSpan.fullStart), u = new $(r.sourceSpan.start, o.sourceSpan.end, r.sourceSpan.
      fullStart);
      return new gR(t.parts[0], i.rootNodes, l, t.sourceSpan, u);
    }
    _collectExpansionExpTokens(t) {
      let r = [], n = [22];
      for (; ; ) {
        if ((this._peek.type === 20 || this._peek.type === 22) && n.push(this._peek.type), this._peek.type === 23) if (G5(n, 22)) {
          if (n.pop(), n.length === 0) return r;
        } else return this.errors.push(Ie.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
        if (this._peek.type === 24) if (G5(n, 20)) n.pop();
        else return this.errors.push(Ie.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
        if (this._peek.type === 34) return this.errors.push(Ie.create(null, t.sourceSpan, "Invalid ICU message. Missing '}'.")), null;
        r.push(this._advance());
      }
    }
    _getText(t) {
      let r = t.parts[0];
      if (r.length > 0 && r[0] == `
`) {
        let n = this._getClosestParentElement();
        n != null && n.children.length == 0 && this.getTagDefinition(n.name).ignoreFirstLf && (r = r.substring(1));
      }
      return r;
    }
    _consumeText(t) {
      let r = [t], n = t.sourceSpan, o = t.parts[0];
      if (o.length > 0 && o[0] === `
`) {
        let i = this._getContainer();
        i != null && i.children.length === 0 && this.getTagDefinition(i.name).ignoreFirstLf && (o = o.substring(1), r[0] = { type: t.type, sourceSpan: t.
        sourceSpan, parts: [o] });
      }
      for (; this._peek.type === 8 || this._peek.type === 5 || this._peek.type === 9; ) t = this._advance(), r.push(t), t.type === 8 ? o += t.
      parts.join("").replace(/&([^;]+);/g, Y5) : t.type === 9 ? o += t.parts[0] : o += t.parts.join("");
      if (o.length > 0) {
        let i = t.sourceSpan;
        this._addToParent(new fR(o, new $(n.start, i.end, n.fullStart, n.details), r));
      }
    }
    _closeVoidElement() {
      let t = this._getContainer();
      t instanceof nr && this.getTagDefinition(t.name).isVoid && this._containerStack.pop();
    }
    _consumeStartTag(t) {
      let [r, n] = t.parts, o = [];
      for (; this._peek.type === 14; ) o.push(this._consumeAttr(this._advance()));
      let i = this._getElementFullName(r, n, this._getClosestParentElement()), l = !1;
      if (this._peek.type === 2) {
        this._advance(), l = !0;
        let v = this.getTagDefinition(i);
        this.canSelfClose || v.canSelfClose || Mi(i) !== null || v.isVoid || this.errors.push(Ie.create(i, t.sourceSpan, `Only void, custom \
and foreign elements can be self closed "${t.parts[1]}"`));
      } else this._peek.type === 1 && (this._advance(), l = !1);
      let u = this._peek.sourceSpan.fullStart, c = new $(t.sourceSpan.start, u, t.sourceSpan.fullStart), p = new $(t.sourceSpan.start, u, t.
      sourceSpan.fullStart), d = new $(t.sourceSpan.start.moveBy(1), t.sourceSpan.end), h = new nr(i, o, [], c, p, void 0, d), f = this._getContainer();
      this._pushContainer(h, f instanceof nr && this.getTagDefinition(f.name).isClosedByChild(h.name)), l ? this._popContainer(i, nr, c) : t.
      type === 4 && (this._popContainer(i, nr, null), this.errors.push(Ie.create(i, c, `Opening tag "${i}" not terminated.`)));
    }
    _pushContainer(t, r) {
      r && this._containerStack.pop(), this._addToParent(t), this._containerStack.push(t);
    }
    _consumeEndTag(t) {
      let r = this.allowHtmComponentClosingTags && t.parts.length === 0 ? null : this._getElementFullName(t.parts[0], t.parts[1], this._getClosestParentElement());
      if (r && this.getTagDefinition(r).isVoid) this.errors.push(Ie.create(r, t.sourceSpan, `Void elements do not have end tags "${t.parts[1]}\
"`));
      else if (!this._popContainer(r, nr, t.sourceSpan)) {
        let n = `Unexpected closing tag "${r}". It may happen when the tag has already been closed by another tag. For more info see https:/\
/www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags`;
        this.errors.push(Ie.create(r, t.sourceSpan, n));
      }
    }
    _popContainer(t, r, n) {
      let o = !1;
      for (let i = this._containerStack.length - 1; i >= 0; i--) {
        let l = this._containerStack[i];
        if (Mi(l.name) ? l.name === t : (t == null || l.name.toLowerCase() === t.toLowerCase()) && l instanceof r) return l.endSourceSpan = n,
        l.sourceSpan.end = n !== null ? n.end : l.sourceSpan.end, this._containerStack.splice(i, this._containerStack.length - i), !o;
        (l instanceof An || l instanceof nr && !this.getTagDefinition(l.name).closedByParent) && (o = !0);
      }
      return !1;
    }
    _consumeAttr(t) {
      let r = Ni(t.parts[0], t.parts[1]), n = t.sourceSpan.end, o;
      this._peek.type === 15 && (o = this._advance());
      let i = "", l = [], u, c;
      if (this._peek.type === 16) for (u = this._peek.sourceSpan, c = this._peek.sourceSpan.end; this._peek.type === 16 || this._peek.type ===
      17 || this._peek.type === 9; ) {
        let d = this._advance();
        l.push(d), d.type === 17 ? i += d.parts.join("").replace(/&([^;]+);/g, Y5) : d.type === 9 ? i += d.parts[0] : i += d.parts.join(""),
        c = n = d.sourceSpan.end;
      }
      this._peek.type === 15 && (c = n = this._advance().sourceSpan.end);
      let p = u && c && new $(o?.sourceSpan.start ?? u.start, c, o?.sourceSpan.fullStart ?? u.fullStart);
      return new vR(r, i, new $(t.sourceSpan.start, n, t.sourceSpan.fullStart), t.sourceSpan, p, l.length > 0 ? l : void 0, void 0);
    }
    _consumeBlockOpen(t) {
      let r = [];
      for (; this._peek.type === 28; ) {
        let u = this._advance();
        r.push(new N5(u.parts[0], u.sourceSpan));
      }
      this._peek.type === 26 && this._advance();
      let n = this._peek.sourceSpan.fullStart, o = new $(t.sourceSpan.start, n, t.sourceSpan.fullStart), i = new $(t.sourceSpan.start, n, t.
      sourceSpan.fullStart), l = new An(t.parts[0], r, [], o, t.sourceSpan, i);
      this._pushContainer(l, !1);
    }
    _consumeBlockClose(t) {
      this._popContainer(null, An, t.sourceSpan) || this.errors.push(Ie.create(null, t.sourceSpan, 'Unexpected closing block. The block may \
have been closed earlier. If you meant to write the } character, you should use the "&#125;" HTML entity instead.'));
    }
    _consumeIncompleteBlock(t) {
      let r = [];
      for (; this._peek.type === 28; ) {
        let u = this._advance();
        r.push(new N5(u.parts[0], u.sourceSpan));
      }
      let n = this._peek.sourceSpan.fullStart, o = new $(t.sourceSpan.start, n, t.sourceSpan.fullStart), i = new $(t.sourceSpan.start, n, t.
      sourceSpan.fullStart), l = new An(t.parts[0], r, [], o, t.sourceSpan, i);
      this._pushContainer(l, !1), this._popContainer(null, An, null), this.errors.push(Ie.create(t.parts[0], o, `Incomplete block "${t.parts[0]}\
". If you meant to write the @ character, you should use the "&#64;" HTML entity instead.`));
    }
    _consumeLet(t) {
      let r = t.parts[0], n, o;
      if (this._peek.type !== 31) {
        this.errors.push(Ie.create(t.parts[0], t.sourceSpan, `Invalid @let declaration "${r}". Declaration must have a value.`));
        return;
      } else n = this._advance();
      if (this._peek.type !== 32) {
        this.errors.push(Ie.create(t.parts[0], t.sourceSpan, `Unterminated @let declaration "${r}". Declaration must be terminated with a se\
micolon.`));
        return;
      } else o = this._advance();
      let i = o.sourceSpan.fullStart, l = new $(t.sourceSpan.start, i, t.sourceSpan.fullStart), u = t.sourceSpan.toString().lastIndexOf(r), c = t.
      sourceSpan.start.moveBy(u), p = new $(c, t.sourceSpan.end), d = new $5(r, n.parts[0], l, p, n.sourceSpan);
      this._addToParent(d);
    }
    _consumeIncompleteLet(t) {
      let r = t.parts[0] ?? "", n = r ? ` "${r}"` : "";
      if (r.length > 0) {
        let o = t.sourceSpan.toString().lastIndexOf(r), i = t.sourceSpan.start.moveBy(o), l = new $(i, t.sourceSpan.end), u = new $(t.sourceSpan.
        start, t.sourceSpan.start.moveBy(0)), c = new $5(r, "", t.sourceSpan, l, u);
        this._addToParent(c);
      }
      this.errors.push(Ie.create(t.parts[0], t.sourceSpan, `Incomplete @let declaration${n}. @let declarations must be written as \`@let <nam\
e> = <value>;\``));
    }
    _getContainer() {
      return this._containerStack.length > 0 ? this._containerStack[this._containerStack.length - 1] : null;
    }
    _getClosestParentElement() {
      for (let t = this._containerStack.length - 1; t > -1; t--) if (this._containerStack[t] instanceof nr) return this._containerStack[t];
      return null;
    }
    _addToParent(t) {
      let r = this._getContainer();
      r === null ? this.rootNodes.push(t) : r.children.push(t);
    }
    _getElementFullName(t, r, n) {
      if (t === "" && (t = this.getTagDefinition(r).implicitNamespacePrefix || "", t === "" && n != null)) {
        let o = ol(n.name)[1];
        this.getTagDefinition(o).preventNamespaceInheritance || (t = Mi(n.name));
      }
      return Ni(t, r);
    }
  }, a(Mr, "t"), Mr);
  a(G5, "zs");
  a(Y5, "Gs");
  NR = (oo = class extends zR {
    constructor() {
      super(Qu);
    }
    parse(t, r, n, o = !1, i) {
      return super.parse(t, r, n, o, i);
    }
  }, a(oo, "sr"), oo), Yu = null, $R = /* @__PURE__ */ a(() => (Yu || (Yu = new NR()), Yu), "Eo");
  a(X5, "zr");
  a(jR, "Ao");
  VR = jR, ya = 3;
  a(WR, "Do");
  a(qR, "vo");
  UR = qR, Ii = { attrs: !0, children: !0, cases: !0, expression: !0 }, K5 = /* @__PURE__ */ new Set(["parent"]), GR = (Et = class {
    constructor(t = {}) {
      for (let r of /* @__PURE__ */ new Set([...K5, ...Object.keys(t)])) this.setProperty(r, t[r]);
    }
    setProperty(t, r) {
      if (this[t] !== r) {
        if (t in Ii && (r = r.map((n) => this.createChild(n))), !K5.has(t)) {
          this[t] = r;
          return;
        }
        Object.defineProperty(this, t, { value: r, enumerable: !1, configurable: !0 });
      }
    }
    map(t) {
      let r;
      for (let n in Ii) {
        let o = this[n];
        if (o) {
          let i = YR(o, (l) => l.map(t));
          r !== o && (r || (r = new Et({ parent: this.parent })), r.setProperty(n, i));
        }
      }
      if (r) for (let n in this) n in Ii || (r[n] = this[n]);
      return t(r || this);
    }
    walk(t) {
      for (let r in Ii) {
        let n = this[r];
        if (n) for (let o = 0; o < n.length; o++) n[o].walk(t);
      }
      t(this);
    }
    createChild(t) {
      let r = t instanceof Et ? t.clone() : new Et(t);
      return r.setProperty("parent", this), r;
    }
    insertChildBefore(t, r) {
      this.children.splice(this.children.indexOf(t), 0, this.createChild(r));
    }
    removeChild(t) {
      this.children.splice(this.children.indexOf(t), 1);
    }
    replaceChild(t, r) {
      this.children[this.children.indexOf(t)] = this.createChild(r);
    }
    clone() {
      return new Et(this);
    }
    get firstChild() {
      var t;
      return (t = this.children) == null ? void 0 : t[0];
    }
    get lastChild() {
      var t;
      return (t = this.children) == null ? void 0 : t[this.children.length - 1];
    }
    get prev() {
      var t, r;
      return (r = (t = this.parent) == null ? void 0 : t.children) == null ? void 0 : r[this.parent.children.indexOf(this) - 1];
    }
    get next() {
      var t, r;
      return (r = (t = this.parent) == null ? void 0 : t.children) == null ? void 0 : r[this.parent.children.indexOf(this) + 1];
    }
    get rawName() {
      return this.hasExplicitNamespace ? this.fullName : this.name;
    }
    get fullName() {
      return this.namespace ? this.namespace + ":" + this.name : this.name;
    }
    get attrMap() {
      return Object.fromEntries(this.attrs.map((t) => [t.fullName, t.value]));
    }
  }, a(Et, "t"), Et);
  a(YR, "yo");
  XR = [{ regex: /^(\[if([^\]]*)\]>)(.*?)<!\s*\[endif\]$/su, parse: ZR }, { regex: /^\[if([^\]]*)\]><!$/u, parse: JR }, { regex: /^<!\s*\[endif\]$/u,
  parse: QR }];
  a(KR, "Qs");
  a(ZR, "bo");
  a(JR, "To");
  a(QR, "xo");
  Xu = /* @__PURE__ */ new Map([["*", /* @__PURE__ */ new Set(["accesskey", "autocapitalize", "autofocus", "class", "contenteditable", "dir",
  "draggable", "enterkeyhint", "hidden", "id", "inert", "inputmode", "is", "itemid", "itemprop", "itemref", "itemscope", "itemtype", "lang",
  "nonce", "popover", "slot", "spellcheck", "style", "tabindex", "title", "translate", "writingsuggestions"])], ["a", /* @__PURE__ */ new Set(
  ["charset", "coords", "download", "href", "hreflang", "name", "ping", "referrerpolicy", "rel", "rev", "shape", "target", "type"])], ["appl\
et", /* @__PURE__ */ new Set(["align", "alt", "archive", "code", "codebase", "height", "hspace", "name", "object", "vspace", "width"])], ["a\
rea", /* @__PURE__ */ new Set(["alt", "coords", "download", "href", "hreflang", "nohref", "ping", "referrerpolicy", "rel", "shape", "target",
  "type"])], ["audio", /* @__PURE__ */ new Set(["autoplay", "controls", "crossorigin", "loop", "muted", "preload", "src"])], ["base", /* @__PURE__ */ new Set(
  ["href", "target"])], ["basefont", /* @__PURE__ */ new Set(["color", "face", "size"])], ["blockquote", /* @__PURE__ */ new Set(["cite"])],
  ["body", /* @__PURE__ */ new Set(["alink", "background", "bgcolor", "link", "text", "vlink"])], ["br", /* @__PURE__ */ new Set(["clear"])],
  ["button", /* @__PURE__ */ new Set(["disabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "name",
  "popovertarget", "popovertargetaction", "type", "value"])], ["canvas", /* @__PURE__ */ new Set(["height", "width"])], ["caption", /* @__PURE__ */ new Set(
  ["align"])], ["col", /* @__PURE__ */ new Set(["align", "char", "charoff", "span", "valign", "width"])], ["colgroup", /* @__PURE__ */ new Set(
  ["align", "char", "charoff", "span", "valign", "width"])], ["data", /* @__PURE__ */ new Set(["value"])], ["del", /* @__PURE__ */ new Set([
  "cite", "datetime"])], ["details", /* @__PURE__ */ new Set(["name", "open"])], ["dialog", /* @__PURE__ */ new Set(["open"])], ["dir", /* @__PURE__ */ new Set(
  ["compact"])], ["div", /* @__PURE__ */ new Set(["align"])], ["dl", /* @__PURE__ */ new Set(["compact"])], ["embed", /* @__PURE__ */ new Set(
  ["height", "src", "type", "width"])], ["fieldset", /* @__PURE__ */ new Set(["disabled", "form", "name"])], ["font", /* @__PURE__ */ new Set(
  ["color", "face", "size"])], ["form", /* @__PURE__ */ new Set(["accept", "accept-charset", "action", "autocomplete", "enctype", "method", "\
name", "novalidate", "target"])], ["frame", /* @__PURE__ */ new Set(["frameborder", "longdesc", "marginheight", "marginwidth", "name", "nore\
size", "scrolling", "src"])], ["frameset", /* @__PURE__ */ new Set(["cols", "rows"])], ["h1", /* @__PURE__ */ new Set(["align"])], ["h2", /* @__PURE__ */ new Set(
  ["align"])], ["h3", /* @__PURE__ */ new Set(["align"])], ["h4", /* @__PURE__ */ new Set(["align"])], ["h5", /* @__PURE__ */ new Set(["alig\
n"])], ["h6", /* @__PURE__ */ new Set(["align"])], ["head", /* @__PURE__ */ new Set(["profile"])], ["hr", /* @__PURE__ */ new Set(["align", "\
noshade", "size", "width"])], ["html", /* @__PURE__ */ new Set(["manifest", "version"])], ["iframe", /* @__PURE__ */ new Set(["align", "allo\
w", "allowfullscreen", "allowpaymentrequest", "allowusermedia", "frameborder", "height", "loading", "longdesc", "marginheight", "marginwidth",
  "name", "referrerpolicy", "sandbox", "scrolling", "src", "srcdoc", "width"])], ["img", /* @__PURE__ */ new Set(["align", "alt", "border", "\
crossorigin", "decoding", "fetchpriority", "height", "hspace", "ismap", "loading", "longdesc", "name", "referrerpolicy", "sizes", "src", "sr\
cset", "usemap", "vspace", "width"])], ["input", /* @__PURE__ */ new Set(["accept", "align", "alt", "autocomplete", "checked", "dirname", "d\
isabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "ismap", "list", "max", "maxlength", "\
min", "minlength", "multiple", "name", "pattern", "placeholder", "popovertarget", "popovertargetaction", "readonly", "required", "size", "sr\
c", "step", "type", "usemap", "value", "width"])], ["ins", /* @__PURE__ */ new Set(["cite", "datetime"])], ["isindex", /* @__PURE__ */ new Set(
  ["prompt"])], ["label", /* @__PURE__ */ new Set(["for", "form"])], ["legend", /* @__PURE__ */ new Set(["align"])], ["li", /* @__PURE__ */ new Set(
  ["type", "value"])], ["link", /* @__PURE__ */ new Set(["as", "blocking", "charset", "color", "crossorigin", "disabled", "fetchpriority", "\
href", "hreflang", "imagesizes", "imagesrcset", "integrity", "media", "referrerpolicy", "rel", "rev", "sizes", "target", "type"])], ["map", /* @__PURE__ */ new Set(
  ["name"])], ["menu", /* @__PURE__ */ new Set(["compact"])], ["meta", /* @__PURE__ */ new Set(["charset", "content", "http-equiv", "media",
  "name", "scheme"])], ["meter", /* @__PURE__ */ new Set(["high", "low", "max", "min", "optimum", "value"])], ["object", /* @__PURE__ */ new Set(
  ["align", "archive", "border", "classid", "codebase", "codetype", "data", "declare", "form", "height", "hspace", "name", "standby", "type",
  "typemustmatch", "usemap", "vspace", "width"])], ["ol", /* @__PURE__ */ new Set(["compact", "reversed", "start", "type"])], ["optgroup", /* @__PURE__ */ new Set(
  ["disabled", "label"])], ["option", /* @__PURE__ */ new Set(["disabled", "label", "selected", "value"])], ["output", /* @__PURE__ */ new Set(
  ["for", "form", "name"])], ["p", /* @__PURE__ */ new Set(["align"])], ["param", /* @__PURE__ */ new Set(["name", "type", "value", "valuety\
pe"])], ["pre", /* @__PURE__ */ new Set(["width"])], ["progress", /* @__PURE__ */ new Set(["max", "value"])], ["q", /* @__PURE__ */ new Set(
  ["cite"])], ["script", /* @__PURE__ */ new Set(["async", "blocking", "charset", "crossorigin", "defer", "fetchpriority", "integrity", "lan\
guage", "nomodule", "referrerpolicy", "src", "type"])], ["select", /* @__PURE__ */ new Set(["autocomplete", "disabled", "form", "multiple", "\
name", "required", "size"])], ["slot", /* @__PURE__ */ new Set(["name"])], ["source", /* @__PURE__ */ new Set(["height", "media", "sizes", "\
src", "srcset", "type", "width"])], ["style", /* @__PURE__ */ new Set(["blocking", "media", "type"])], ["table", /* @__PURE__ */ new Set(["a\
lign", "bgcolor", "border", "cellpadding", "cellspacing", "frame", "rules", "summary", "width"])], ["tbody", /* @__PURE__ */ new Set(["align",
  "char", "charoff", "valign"])], ["td", /* @__PURE__ */ new Set(["abbr", "align", "axis", "bgcolor", "char", "charoff", "colspan", "headers",
  "height", "nowrap", "rowspan", "scope", "valign", "width"])], ["template", /* @__PURE__ */ new Set(["shadowrootclonable", "shadowrootdeleg\
atesfocus", "shadowrootmode"])], ["textarea", /* @__PURE__ */ new Set(["autocomplete", "cols", "dirname", "disabled", "form", "maxlength", "\
minlength", "name", "placeholder", "readonly", "required", "rows", "wrap"])], ["tfoot", /* @__PURE__ */ new Set(["align", "char", "charoff",
  "valign"])], ["th", /* @__PURE__ */ new Set(["abbr", "align", "axis", "bgcolor", "char", "charoff", "colspan", "headers", "height", "nowra\
p", "rowspan", "scope", "valign", "width"])], ["thead", /* @__PURE__ */ new Set(["align", "char", "charoff", "valign"])], ["time", /* @__PURE__ */ new Set(
  ["datetime"])], ["tr", /* @__PURE__ */ new Set(["align", "bgcolor", "char", "charoff", "valign"])], ["track", /* @__PURE__ */ new Set(["de\
fault", "kind", "label", "src", "srclang"])], ["ul", /* @__PURE__ */ new Set(["compact", "type"])], ["video", /* @__PURE__ */ new Set(["auto\
play", "controls", "crossorigin", "height", "loop", "muted", "playsinline", "poster", "preload", "src", "width"])]]), eS = /* @__PURE__ */ new Set(
  ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big",
  "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "da\
ta", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "embed", "fieldset", "figcaption", "fig\
ure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "ifr\
ame", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marque\
e", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "op\
tgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "sam\
p", "script", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "sum\
mary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul",
  "var", "video", "wbr", "xmp"]);
  a(tS, "ko");
  a(rS, "Bo");
  a(nS, "Lo");
  a(z2, "Zs");
  a(oS, "Fo");
  a(Z5, "Js");
  a(O2, "ei");
  a(al, "ur");
  N2 = { name: "html", normalizeTagName: !0, normalizeAttributeName: !0, allowHtmComponentClosingTags: !0 }, aS = al(N2), iS = al({ name: "a\
ngular" }), lS = al({ name: "vue", isTagNameCaseSensitive: !0, shouldParseAsRawText(e, t, r, n) {
    return e.toLowerCase() !== "html" && !r && (e !== "template" || n.some(({ name: o, value: i }) => o === "lang" && i !== "html" && i !== "" &&
    i !== void 0));
  } }), sS = al({ name: "lwc", canSelfClose: !1 }), uS = { html: eR }, $2 = t2;
});

// ../node_modules/prettier/standalone.mjs
function zt() {
}
function CS(e, t, r, n, o) {
  for (var i = [], l; t; ) i.push(t), l = t.previousComponent, delete t.previousComponent, t = l;
  i.reverse();
  for (var u = 0, c = i.length, p = 0, d = 0; u < c; u++) {
    var h = i[u];
    if (h.removed) {
      if (h.value = e.join(n.slice(d, d + h.count)), d += h.count, u && i[u - 1].added) {
        var f = i[u - 1];
        i[u - 1] = i[u], i[u] = f;
      }
    } else {
      if (!h.added && o) {
        var v = r.slice(p, p + h.count);
        v = v.map(function(m, g) {
          var y = n[d + g];
          return y.length > m.length ? y : m;
        }), h.value = e.join(v);
      } else h.value = e.join(r.slice(p, p + h.count));
      p += h.count, h.added || (d += h.count);
    }
  }
  var b = i[c - 1];
  return c > 1 && typeof b.value == "string" && (b.added || b.removed) && e.equals("", b.value) && (i[c - 2].value += b.value, i.pop()), i;
}
function ll(e) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ll = /* @__PURE__ */ a(function(t) {
    return typeof t;
  }, "$e") : ll = /* @__PURE__ */ a(function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, "$e"), ll(e);
}
function Fc(e, t, r, n, o) {
  t = t || [], r = r || [], n && (e = n(o, e));
  var i;
  for (i = 0; i < t.length; i += 1) if (t[i] === e) return r[i];
  var l;
  if (SS.call(e) === "[object Array]") {
    for (t.push(e), l = new Array(e.length), r.push(l), i = 0; i < e.length; i += 1) l[i] = Fc(e[i], t, r, n, o);
    return t.pop(), r.pop(), l;
  }
  if (e && e.toJSON && (e = e.toJSON()), ll(e) === "object" && e !== null) {
    t.push(e), l = {}, r.push(l);
    var u = [], c;
    for (c in e) e.hasOwnProperty(c) && u.push(c);
    for (u.sort(), i = 0; i < u.length; i += 1) c = u[i], l[c] = Fc(e[c], t, r, n, c);
    t.pop(), r.pop();
  } else l = e;
  return l;
}
function AS(e, t, r) {
  return cl.diff(e, t, r);
}
function FS(e) {
  let t = e.indexOf("\r");
  return t >= 0 ? e.charAt(t + 1) === `
` ? "crlf" : "cr" : "lf";
}
function Oc(e) {
  switch (e) {
    case "cr":
      return "\r";
    case "crlf":
      return `\r
`;
    default:
      return `
`;
  }
}
function Em(e, t) {
  let r;
  switch (t) {
    case `
`:
      r = /\n/gu;
      break;
    case "\r":
      r = /\r/gu;
      break;
    case `\r
`:
      r = /\r\n/gu;
      break;
    default:
      throw new Error(`Unexpected "eol" ${JSON.stringify(t)}.`);
  }
  let n = e.match(r);
  return n ? n.length : 0;
}
function kS(e) {
  return ml(!1, e, /\r\n?/gu, `
`);
}
function LS(e) {
  if (typeof e == "string") return qr;
  if (Array.isArray(e)) return Ht;
  if (!e) return;
  let { type: t } = e;
  if (Rm.has(t)) return t;
}
function BS(e) {
  let t = e === null ? "null" : typeof e;
  if (t !== "string" && t !== "object") return `Unexpected doc '${t}', 
Expected it to be 'string' or 'object'.`;
  if (Gr(e)) throw new Error("doc is valid.");
  let r = Object.prototype.toString.call(e);
  if (r !== "[object Object]") return `Unexpected doc '${r}'.`;
  let n = TS([...Rm].map((o) => `'${o}'`));
  return `Unexpected doc.type '${e.type}'.
Expected it to be ${n}.`;
}
function MS(e, t, r, n) {
  let o = [e];
  for (; o.length > 0; ) {
    let i = o.pop();
    if (i === q2) {
      r(o.pop());
      continue;
    }
    r && o.push(i, q2);
    let l = Gr(i);
    if (!l) throw new ko(i);
    if (t?.(i) !== !1) switch (l) {
      case Ht:
      case kt: {
        let u = l === Ht ? i : i.parts;
        for (let c = u.length, p = c - 1; p >= 0; --p) o.push(u[p]);
        break;
      }
      case Ye:
        o.push(i.flatContents, i.breakContents);
        break;
      case Ve:
        if (n && i.expandedStates) for (let u = i.expandedStates.length, c = u - 1; c >= 0; --c) o.push(i.expandedStates[c]);
        else o.push(i.contents);
        break;
      case Nt:
      case Ot:
      case jt:
      case Lt:
      case Vt:
        o.push(i.contents);
        break;
      case qr:
      case Ur:
      case $t:
      case Wt:
      case Se:
      case nt:
        break;
      default:
        throw new ko(i);
    }
  }
}
function pl(e) {
  return Ft(e), { type: Ot, contents: e };
}
function Lo(e, t) {
  return Ft(t), { type: Nt, contents: t, n: e };
}
function Am(e, t = {}) {
  return Ft(e), $c(t.expandedStates, !0), { type: Ve, id: t.id, contents: e, break: !!t.shouldBreak, expandedStates: t.expandedStates };
}
function _S(e) {
  return Lo(Number.NEGATIVE_INFINITY, e);
}
function PS(e) {
  return Lo({ type: "root" }, e);
}
function HS(e) {
  return Lo(-1, e);
}
function zS(e, t) {
  return Am(e[0], { ...t, expandedStates: e });
}
function Fm(e) {
  return $c(e), { type: kt, parts: e };
}
function OS(e, t = "", r = {}) {
  return Ft(e), t !== "" && Ft(t), { type: Ye, breakContents: e, flatContents: t, groupId: r.groupId };
}
function NS(e, t) {
  return Ft(e), { type: jt, contents: e, groupId: t.groupId, negate: t.negate };
}
function kc(e) {
  return Ft(e), { type: Vt, contents: e };
}
function Bm(e, t) {
  Ft(e), $c(t);
  let r = [];
  for (let n = 0; n < t.length; n++) n !== 0 && r.push(e), r.push(t[n]);
  return r;
}
function Im(e, t, r) {
  Ft(e);
  let n = e;
  if (t > 0) {
    for (let o = 0; o < Math.floor(t / r); ++o) n = pl(n);
    n = Lo(t % r, n), n = Lo(Number.NEGATIVE_INFINITY, n);
  }
  return n;
}
function WS(e, t) {
  return Ft(t), e ? { type: Lt, label: e, contents: t } : t;
}
function Pt(e) {
  var t;
  if (!e) return "";
  if (Array.isArray(e)) {
    let r = [];
    for (let n of e) if (Array.isArray(n)) r.push(...Pt(n));
    else {
      let o = Pt(n);
      o !== "" && r.push(o);
    }
    return r;
  }
  return e.type === Ye ? { ...e, breakContents: Pt(e.breakContents), flatContents: Pt(e.flatContents) } : e.type === Ve ? { ...e, contents: Pt(
  e.contents), expandedStates: (t = e.expandedStates) == null ? void 0 : t.map(Pt) } : e.type === kt ? { type: "fill", parts: e.parts.map(Pt) } :
  e.contents ? { ...e, contents: Pt(e.contents) } : e;
}
function qS(e) {
  let t = /* @__PURE__ */ Object.create(null), r = /* @__PURE__ */ new Set();
  return n(Pt(e));
  function n(i, l, u) {
    var c, p;
    if (typeof i == "string") return JSON.stringify(i);
    if (Array.isArray(i)) {
      let d = i.map(n).filter(Boolean);
      return d.length === 1 ? d[0] : `[${d.join(", ")}]`;
    }
    if (i.type === Se) {
      let d = ((c = u?.[l + 1]) == null ? void 0 : c.type) === nt;
      return i.literal ? d ? "literalline" : "literallineWithoutBreakParent" : i.hard ? d ? "hardline" : "hardlineWithoutBreakParent" : i.soft ?
      "softline" : "line";
    }
    if (i.type === nt) return ((p = u?.[l - 1]) == null ? void 0 : p.type) === Se && u[l - 1].hard ? void 0 : "breakParent";
    if (i.type === $t) return "trim";
    if (i.type === Ot) return "indent(" + n(i.contents) + ")";
    if (i.type === Nt) return i.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + n(i.contents) + ")" : i.n < 0 ? "dedent(" + n(i.contents) +
    ")" : i.n.type === "root" ? "markAsRoot(" + n(i.contents) + ")" : "align(" + JSON.stringify(i.n) + ", " + n(i.contents) + ")";
    if (i.type === Ye) return "ifBreak(" + n(i.breakContents) + (i.flatContents ? ", " + n(i.flatContents) : "") + (i.groupId ? (i.flatContents ?
    "" : ', ""') + `, { groupId: ${o(i.groupId)} }` : "") + ")";
    if (i.type === jt) {
      let d = [];
      i.negate && d.push("negate: true"), i.groupId && d.push(`groupId: ${o(i.groupId)}`);
      let h = d.length > 0 ? `, { ${d.join(", ")} }` : "";
      return `indentIfBreak(${n(i.contents)}${h})`;
    }
    if (i.type === Ve) {
      let d = [];
      i.break && i.break !== "propagated" && d.push("shouldBreak: true"), i.id && d.push(`id: ${o(i.id)}`);
      let h = d.length > 0 ? `, { ${d.join(", ")} }` : "";
      return i.expandedStates ? `conditionalGroup([${i.expandedStates.map((f) => n(f)).join(",")}]${h})` : `group(${n(i.contents)}${h})`;
    }
    if (i.type === kt) return `fill([${i.parts.map((d) => n(d)).join(", ")}])`;
    if (i.type === Vt) return "lineSuffix(" + n(i.contents) + ")";
    if (i.type === Wt) return "lineSuffixBoundary";
    if (i.type === Lt) return `label(${JSON.stringify(i.label)}, ${n(i.contents)})`;
    throw new Error("Unknown doc type " + i.type);
  }
  function o(i) {
    if (typeof i != "symbol") return JSON.stringify(String(i));
    if (i in t) return t[i];
    let l = i.description || "symbol";
    for (let u = 0; ; u++) {
      let c = l + (u > 0 ? ` #${u}` : "");
      if (!r.has(c)) return r.add(c), t[i] = `Symbol.for(${JSON.stringify(c)})`;
    }
  }
}
function YS(e) {
  return e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510;
}
function XS(e) {
  return e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 ||
  e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9800 && e <= 9811 || e === 9855 || e === 9875 || e === 9889 || e === 9898 || e ===
  9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e ===
  9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <=
  10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 ||
  e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 ||
  e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12771 ||
  e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 19903 || e >= 19968 && e <= 42124 || e >= 42128 && e <= 42182 ||
  e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 ||
  e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 ||
  e >= 100352 && e <= 101589 || e >= 101632 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e ===
  110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 &&
  e <= 111355 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <=
  127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 &&
  e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >=
  127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 ||
  e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 &&
  e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <=
  128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 ||
  e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129672 || e >= 129680 && e <=
  129725 || e >= 129727 && e <= 129733 || e >= 129742 && e <= 129755 || e >= 129760 && e <= 129768 || e >= 129776 && e <= 129784 || e >= 131072 &&
  e <= 196605 || e >= 196608 && e <= 262141;
}
function JS(e) {
  if (!e) return 0;
  if (!ZS.test(e)) return e.length;
  e = e.replace(GS(), "  ");
  let t = 0;
  for (let r of e) {
    let n = r.codePointAt(0);
    n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || (t += KS(n) ? 1 : 2);
  }
  return t;
}
function vl(e, t) {
  if (typeof e == "string") return t(e);
  let r = /* @__PURE__ */ new Map();
  return n(e);
  function n(i) {
    if (r.has(i)) return r.get(i);
    let l = o(i);
    return r.set(i, l), l;
  }
  function o(i) {
    switch (Gr(i)) {
      case Ht:
        return t(i.map(n));
      case kt:
        return t({ ...i, parts: i.parts.map(n) });
      case Ye:
        return t({ ...i, breakContents: n(i.breakContents), flatContents: n(i.flatContents) });
      case Ve: {
        let { expandedStates: l, contents: u } = i;
        return l ? (l = l.map(n), u = l[0]) : u = n(u), t({ ...i, contents: u, expandedStates: l });
      }
      case Nt:
      case Ot:
      case jt:
      case Lt:
      case Vt:
        return t({ ...i, contents: n(i.contents) });
      case qr:
      case Ur:
      case $t:
      case Wt:
      case Se:
      case nt:
        return t(i);
      default:
        throw new ko(i);
    }
  }
}
function Wc(e, t, r) {
  let n = r, o = !1;
  function i(l) {
    if (o) return !1;
    let u = t(l);
    u !== void 0 && (o = !0, n = u);
  }
  return a(i, "u"), Nc(e, i), n;
}
function QS(e) {
  if (e.type === Ve && e.break || e.type === Se && e.hard || e.type === nt) return !0;
}
function eA(e) {
  return Wc(e, QS, !1);
}
function U2(e) {
  if (e.length > 0) {
    let t = ye(!1, e, -1);
    !t.expandedStates && !t.break && (t.break = "propagated");
  }
  return null;
}
function tA(e) {
  let t = /* @__PURE__ */ new Set(), r = [];
  function n(i) {
    if (i.type === nt && U2(r), i.type === Ve) {
      if (r.push(i), t.has(i)) return !1;
      t.add(i);
    }
  }
  a(n, "n");
  function o(i) {
    i.type === Ve && r.pop().break && U2(r);
  }
  a(o, "o"), Nc(e, n, o, !0);
}
function rA(e) {
  return e.type === Se && !e.hard ? e.soft ? "" : " " : e.type === Ye ? e.flatContents : e;
}
function nA(e) {
  return vl(e, rA);
}
function G2(e) {
  for (e = [...e]; e.length >= 2 && ye(!1, e, -2).type === Se && ye(!1, e, -1).type === nt; ) e.length -= 2;
  if (e.length > 0) {
    let t = Ia(ye(!1, e, -1));
    e[e.length - 1] = t;
  }
  return e;
}
function Ia(e) {
  switch (Gr(e)) {
    case Ot:
    case jt:
    case Ve:
    case Vt:
    case Lt: {
      let t = Ia(e.contents);
      return { ...e, contents: t };
    }
    case Ye:
      return { ...e, breakContents: Ia(e.breakContents), flatContents: Ia(e.flatContents) };
    case kt:
      return { ...e, parts: G2(e.parts) };
    case Ht:
      return G2(e);
    case qr:
      return e.replace(/[\n\r]*$/u, "");
    case Nt:
    case Ur:
    case $t:
    case Wt:
    case Se:
    case nt:
      break;
    default:
      throw new ko(e);
  }
  return e;
}
function Mm(e) {
  return Ia(aA(e));
}
function oA(e) {
  switch (Gr(e)) {
    case kt:
      if (e.parts.every((t) => t === "")) return "";
      break;
    case Ve:
      if (!e.contents && !e.id && !e.break && !e.expandedStates) return "";
      if (e.contents.type === Ve && e.contents.id === e.id && e.contents.break === e.break && e.contents.expandedStates === e.expandedStates)
       return e.contents;
      break;
    case Nt:
    case Ot:
    case jt:
    case Vt:
      if (!e.contents) return "";
      break;
    case Ye:
      if (!e.flatContents && !e.breakContents) return "";
      break;
    case Ht: {
      let t = [];
      for (let r of e) {
        if (!r) continue;
        let [n, ...o] = Array.isArray(r) ? r : [r];
        typeof n == "string" && typeof ye(!1, t, -1) == "string" ? t[t.length - 1] += n : t.push(n), t.push(...o);
      }
      return t.length === 0 ? "" : t.length === 1 ? t[0] : t;
    }
    case qr:
    case Ur:
    case $t:
    case Wt:
    case Se:
    case Lt:
    case nt:
      break;
    default:
      throw new ko(e);
  }
  return e;
}
function aA(e) {
  return vl(e, (t) => oA(t));
}
function iA(e, t = Tm) {
  return vl(e, (r) => typeof r == "string" ? Bm(t, r.split(`
`)) : r);
}
function lA(e) {
  if (e.type === Se) return !0;
}
function sA(e) {
  return Wc(e, lA, !1);
}
function _m(e, t) {
  return e.type === Lt ? { ...e, contents: t(e.contents) } : t(e);
}
function Pm() {
  return { value: "", length: 0, queue: [] };
}
function uA(e, t) {
  return Tc(e, { type: "indent" }, t);
}
function cA(e, t, r) {
  return t === Number.NEGATIVE_INFINITY ? e.root || Pm() : t < 0 ? Tc(e, { type: "dedent" }, r) : t ? t.type === "root" ? { ...e, root: e } :
  Tc(e, { type: typeof t == "string" ? "stringAlign" : "numberAlign", n: t }, r) : e;
}
function Tc(e, t, r) {
  let n = t.type === "dedent" ? e.queue.slice(0, -1) : [...e.queue, t], o = "", i = 0, l = 0, u = 0;
  for (let b of n) switch (b.type) {
    case "indent":
      d(), r.useTabs ? c(1) : p(r.tabWidth);
      break;
    case "stringAlign":
      d(), o += b.n, i += b.n.length;
      break;
    case "numberAlign":
      l += 1, u += b.n;
      break;
    default:
      throw new Error(`Unexpected type '${b.type}'`);
  }
  return f(), { ...e, value: o, length: i, queue: n };
  function c(b) {
    o += "	".repeat(b), i += r.tabWidth * b;
  }
  function p(b) {
    o += " ".repeat(b), i += b;
  }
  function d() {
    r.useTabs ? h() : f();
  }
  function h() {
    l > 0 && c(l), v();
  }
  function f() {
    u > 0 && p(u), v();
  }
  function v() {
    l = 0, u = 0;
  }
}
function Bc(e) {
  let t = 0, r = 0, n = e.length;
  e: for (; n--; ) {
    let o = e[n];
    if (o === Ma) {
      r++;
      continue;
    }
    for (let i = o.length - 1; i >= 0; i--) {
      let l = o[i];
      if (l === " " || l === "	") t++;
      else {
        e[n] = o.slice(0, i + 1);
        break e;
      }
    }
  }
  if (t > 0 || r > 0) for (e.length = n + 1; r-- > 0; ) e.push(Ma);
  return t;
}
function il(e, t, r, n, o, i) {
  if (r === Number.POSITIVE_INFINITY) return !0;
  let l = t.length, u = [e], c = [];
  for (; r >= 0; ) {
    if (u.length === 0) {
      if (l === 0) return !0;
      u.push(t[--l]);
      continue;
    }
    let { mode: p, doc: d } = u.pop(), h = Gr(d);
    switch (h) {
      case qr:
        c.push(d), r -= Vc(d);
        break;
      case Ht:
      case kt: {
        let f = h === Ht ? d : d.parts;
        for (let v = f.length - 1; v >= 0; v--) u.push({ mode: p, doc: f[v] });
        break;
      }
      case Ot:
      case Nt:
      case jt:
      case Lt:
        u.push({ mode: p, doc: d.contents });
        break;
      case $t:
        r += Bc(c);
        break;
      case Ve: {
        if (i && d.break) return !1;
        let f = d.break ? je : p, v = d.expandedStates && f === je ? ye(!1, d.expandedStates, -1) : d.contents;
        u.push({ mode: f, doc: v });
        break;
      }
      case Ye: {
        let f = (d.groupId ? o[d.groupId] || At : p) === je ? d.breakContents : d.flatContents;
        f && u.push({ mode: p, doc: f });
        break;
      }
      case Se:
        if (p === je || d.hard) return !0;
        d.soft || (c.push(" "), r--);
        break;
      case Vt:
        n = !0;
        break;
      case Wt:
        if (n) return !1;
        break;
    }
  }
  return !1;
}
function wl(e, t) {
  let r = {}, n = t.printWidth, o = Oc(t.endOfLine), i = 0, l = [{ ind: Pm(), mode: je, doc: e }], u = [], c = !1, p = [], d = 0;
  for (tA(e); l.length > 0; ) {
    let { ind: f, mode: v, doc: b } = l.pop();
    switch (Gr(b)) {
      case qr: {
        let m = o !== `
` ? ml(!1, b, `
`, o) : b;
        u.push(m), l.length > 0 && (i += Vc(m));
        break;
      }
      case Ht:
        for (let m = b.length - 1; m >= 0; m--) l.push({ ind: f, mode: v, doc: b[m] });
        break;
      case Ur:
        if (d >= 2) throw new Error("There are too many 'cursor' in doc.");
        u.push(Ma), d++;
        break;
      case Ot:
        l.push({ ind: uA(f, t), mode: v, doc: b.contents });
        break;
      case Nt:
        l.push({ ind: cA(f, b.n, t), mode: v, doc: b.contents });
        break;
      case $t:
        i -= Bc(u);
        break;
      case Ve:
        switch (v) {
          case At:
            if (!c) {
              l.push({ ind: f, mode: b.break ? je : At, doc: b.contents });
              break;
            }
          case je: {
            c = !1;
            let m = { ind: f, mode: At, doc: b.contents }, g = n - i, y = p.length > 0;
            if (!b.break && il(m, l, g, y, r)) l.push(m);
            else if (b.expandedStates) {
              let w = ye(!1, b.expandedStates, -1);
              if (b.break) {
                l.push({ ind: f, mode: je, doc: w });
                break;
              } else for (let D = 1; D < b.expandedStates.length + 1; D++) if (D >= b.expandedStates.length) {
                l.push({ ind: f, mode: je, doc: w });
                break;
              } else {
                let x = b.expandedStates[D], C = { ind: f, mode: At, doc: x };
                if (il(C, l, g, y, r)) {
                  l.push(C);
                  break;
                }
              }
            } else l.push({ ind: f, mode: je, doc: b.contents });
            break;
          }
        }
        b.id && (r[b.id] = ye(!1, l, -1).mode);
        break;
      case kt: {
        let m = n - i, { parts: g } = b;
        if (g.length === 0) break;
        let [y, w] = g, D = { ind: f, mode: At, doc: y }, x = { ind: f, mode: je, doc: y }, C = il(D, [], m, p.length > 0, r, !0);
        if (g.length === 1) {
          C ? l.push(D) : l.push(x);
          break;
        }
        let E = { ind: f, mode: At, doc: w }, R = { ind: f, mode: je, doc: w };
        if (g.length === 2) {
          C ? l.push(E, D) : l.push(R, x);
          break;
        }
        g.splice(0, 2);
        let F = { ind: f, mode: v, doc: Fm(g) }, S = g[0];
        il({ ind: f, mode: At, doc: [y, w, S] }, [], m, p.length > 0, r, !0) ? l.push(F, E, D) : C ? l.push(F, R, D) : l.push(F, R, x);
        break;
      }
      case Ye:
      case jt: {
        let m = b.groupId ? r[b.groupId] : v;
        if (m === je) {
          let g = b.type === Ye ? b.breakContents : b.negate ? b.contents : pl(b.contents);
          g && l.push({ ind: f, mode: v, doc: g });
        }
        if (m === At) {
          let g = b.type === Ye ? b.flatContents : b.negate ? pl(b.contents) : b.contents;
          g && l.push({ ind: f, mode: v, doc: g });
        }
        break;
      }
      case Vt:
        p.push({ ind: f, mode: v, doc: b.contents });
        break;
      case Wt:
        p.length > 0 && l.push({ ind: f, mode: v, doc: jc });
        break;
      case Se:
        switch (v) {
          case At:
            if (b.hard) c = !0;
            else {
              b.soft || (u.push(" "), i += 1);
              break;
            }
          case je:
            if (p.length > 0) {
              l.push({ ind: f, mode: v, doc: b }, ...p.reverse()), p.length = 0;
              break;
            }
            b.literal ? f.root ? (u.push(o, f.root.value), i = f.root.length) : (u.push(o), i = 0) : (i -= Bc(u), u.push(o + f.value), i = f.
            length);
            break;
        }
        break;
      case Lt:
        l.push({ ind: f, mode: v, doc: b.contents });
        break;
      case nt:
        break;
      default:
        throw new ko(b);
    }
    l.length === 0 && p.length > 0 && (l.push(...p.reverse()), p.length = 0);
  }
  let h = u.indexOf(Ma);
  if (h !== -1) {
    let f = u.indexOf(Ma, h + 1), v = u.slice(0, h).join(""), b = u.slice(h + 1, f).join(""), m = u.slice(f + 1).join("");
    return { formatted: v + b + m, cursorNodeStart: v.length, cursorNodeText: b };
  }
  return { formatted: u.join("") };
}
function pA(e, t, r = 0) {
  let n = 0;
  for (let o = r; o < e.length; ++o) e[o] === "	" ? n = n + t - n % t : n++;
  return n;
}
function hA(e) {
  return e !== null && typeof e == "object";
}
function* zm(e, t) {
  let { getVisitorKeys: r, filter: n = /* @__PURE__ */ a(() => !0, "n") } = t, o = /* @__PURE__ */ a((i) => mA(i) && n(i), "o");
  for (let i of r(e)) {
    let l = e[i];
    if (Array.isArray(l)) for (let u of l) o(u) && (yield u);
    else o(l) && (yield l);
  }
}
function* gA(e, t) {
  let r = [e];
  for (let n = 0; n < r.length; n++) {
    let o = r[n];
    for (let i of zm(o, t)) yield i, r.push(i);
  }
}
function Pa(e) {
  return (t, r, n) => {
    let o = !!(n != null && n.backwards);
    if (r === !1) return !1;
    let { length: i } = t, l = r;
    for (; l >= 0 && l < i; ) {
      let u = t.charAt(l);
      if (e instanceof RegExp) {
        if (!e.test(u)) return l;
      } else if (!e.includes(u)) return l;
      o ? l-- : l++;
    }
    return l === -1 || l === i ? l : !1;
  };
}
function wA(e, t, r) {
  let n = !!(r != null && r.backwards);
  if (t === !1) return !1;
  let o = e.charAt(t);
  if (n) {
    if (e.charAt(t - 1) === "\r" && o === `
`) return t - 2;
    if (o === `
` || o === "\r" || o === "\u2028" || o === "\u2029") return t - 1;
  } else {
    if (o === "\r" && e.charAt(t + 1) === `
`) return t + 2;
    if (o === `
` || o === "\r" || o === "\u2028" || o === "\u2029") return t + 1;
  }
  return t;
}
function bA(e, t, r = {}) {
  let n = sr(e, r.backwards ? t - 1 : t, r), o = Wr(e, n, r);
  return n !== o;
}
function yA(e) {
  return Array.isArray(e) && e.length > 0;
}
function CA(e) {
  return e ? (t) => e(t, $m) : xA;
}
function EA(e) {
  let t = e.type || e.kind || "(unknown type)", r = String(e.name || e.id && (typeof e.id == "object" ? e.id.name : e.id) || e.key && (typeof e.
  key == "object" ? e.key.name : e.key) || e.value && (typeof e.value == "object" ? "" : String(e.value)) || e.operator || "");
  return r.length > 20 && (r = r.slice(0, 19) + "\u2026"), t + (r ? " " + r : "");
}
function Uc(e, t) {
  (e.comments ?? (e.comments = [])).push(t), t.printed = !1, t.nodeDescription = EA(e);
}
function co(e, t) {
  t.leading = !0, t.trailing = !1, Uc(e, t);
}
function $r(e, t, r) {
  t.leading = !1, t.trailing = !1, r && (t.marker = r), Uc(e, t);
}
function po(e, t) {
  t.leading = !1, t.trailing = !0, Uc(e, t);
}
function Gc(e, t) {
  if (xc.has(e)) return xc.get(e);
  let { printer: { getCommentChildNodes: r, canAttachComment: n, getVisitorKeys: o }, locStart: i, locEnd: l } = t;
  if (!n) return [];
  let u = (r?.(e, t) ?? [...zm(e, { getVisitorKeys: bl(o) })]).flatMap((c) => n(c) ? [c] : Gc(c, t));
  return u.sort((c, p) => i(c) - i(p) || l(c) - l(p)), xc.set(e, u), u;
}
function jm(e, t, r, n) {
  let { locStart: o, locEnd: i } = r, l = o(t), u = i(t), c = Gc(e, r), p, d, h = 0, f = c.length;
  for (; h < f; ) {
    let v = h + f >> 1, b = c[v], m = o(b), g = i(b);
    if (m <= l && u <= g) return jm(b, t, r, b);
    if (g <= l) {
      p = b, h = v + 1;
      continue;
    }
    if (u <= m) {
      d = b, f = v;
      continue;
    }
    throw new Error("Comment location overlaps with node location");
  }
  if (n?.type === "TemplateLiteral") {
    let { quasis: v } = n, b = Ec(v, t, r);
    p && Ec(v, p, r) !== b && (p = null), d && Ec(v, d, r) !== b && (d = null);
  }
  return { enclosingNode: n, precedingNode: p, followingNode: d };
}
function RA(e, t) {
  let { comments: r } = e;
  if (delete e.comments, !DA(r) || !t.printer.canAttachComment) return;
  let n = [], { locStart: o, locEnd: i, printer: { experimentalFeatures: { avoidAstMutation: l = !1 } = {}, handleComments: u = {} }, originalText: c } = t,
  { ownLine: p = Cc, endOfLine: d = Cc, remaining: h = Cc } = u, f = r.map((v, b) => ({ ...jm(e, v, t), comment: v, text: c, options: t, ast: e,
  isLastComment: r.length - 1 === b }));
  for (let [v, b] of f.entries()) {
    let { comment: m, precedingNode: g, enclosingNode: y, followingNode: w, text: D, options: x, ast: C, isLastComment: E } = b;
    if (x.parser === "json" || x.parser === "json5" || x.parser === "jsonc" || x.parser === "__js_expression" || x.parser === "__ts_expressi\
on" || x.parser === "__vue_expression" || x.parser === "__vue_ts_expression") {
      if (o(m) - o(C) <= 0) {
        co(C, m);
        continue;
      }
      if (i(m) - i(C) >= 0) {
        po(C, m);
        continue;
      }
    }
    let R;
    if (l ? R = [b] : (m.enclosingNode = y, m.precedingNode = g, m.followingNode = w, R = [m, D, x, C, E]), SA(D, x, f, v)) m.placement = "o\
wnLine", p(...R) || (w ? co(w, m) : g ? po(g, m) : $r(y || C, m));
    else if (AA(D, x, f, v)) m.placement = "endOfLine", d(...R) || (g ? po(g, m) : w ? co(w, m) : $r(y || C, m));
    else if (m.placement = "remaining", !h(...R)) if (g && w) {
      let F = n.length;
      F > 0 && n[F - 1].followingNode !== w && Y2(n, x), n.push(b);
    } else g ? po(g, m) : w ? co(w, m) : $r(y || C, m);
  }
  if (Y2(n, t), !l) for (let v of r) delete v.precedingNode, delete v.enclosingNode, delete v.followingNode;
}
function SA(e, t, r, n) {
  let { comment: o, precedingNode: i } = r[n], { locStart: l, locEnd: u } = t, c = l(o);
  if (i) for (let p = n - 1; p >= 0; p--) {
    let { comment: d, precedingNode: h } = r[p];
    if (h !== i || !Vm(e.slice(u(d), c))) break;
    c = l(d);
  }
  return lr(e, c, { backwards: !0 });
}
function AA(e, t, r, n) {
  let { comment: o, followingNode: i } = r[n], { locStart: l, locEnd: u } = t, c = u(o);
  if (i) for (let p = n + 1; p < r.length; p++) {
    let { comment: d, followingNode: h } = r[p];
    if (h !== i || !Vm(e.slice(c, l(d)))) break;
    c = u(d);
  }
  return lr(e, c);
}
function Y2(e, t) {
  var r, n;
  let o = e.length;
  if (o === 0) return;
  let { precedingNode: i, followingNode: l } = e[0], u = t.locStart(l), c;
  for (c = o; c > 0; --c) {
    let { comment: p, precedingNode: d, followingNode: h } = e[c - 1];
    Mc.strictEqual(d, i), Mc.strictEqual(h, l);
    let f = t.originalText.slice(t.locEnd(p), u);
    if (((n = (r = t.printer).isGap) == null ? void 0 : n.call(r, f, t)) ?? /^[\s(]*$/u.test(f)) u = t.locStart(p);
    else break;
  }
  for (let [p, { comment: d }] of e.entries()) p < c ? po(i, d) : co(l, d);
  for (let p of [i, l]) p.comments && p.comments.length > 1 && p.comments.sort((d, h) => t.locStart(d) - t.locStart(h));
  e.length = 0;
}
function Ec(e, t, r) {
  let n = r.locStart(t) - 1;
  for (let o = 1; o < e.length; ++o) if (n < r.locStart(e[o])) return o - 1;
  return 0;
}
function FA(e, t) {
  let r = t - 1;
  r = sr(e, r, { backwards: !0 }), r = Wr(e, r, { backwards: !0 }), r = sr(e, r, { backwards: !0 });
  let n = Wr(e, r, { backwards: !0 });
  return r !== n;
}
function Wm(e, t) {
  let r = e.node;
  return r.printed = !0, t.printer.printComment(e, t);
}
function kA(e, t) {
  var r;
  let n = e.node, o = [Wm(e, t)], { printer: i, originalText: l, locStart: u, locEnd: c } = t;
  if ((r = i.isBlockComment) != null && r.call(i, n)) {
    let d = lr(l, c(n)) ? lr(l, u(n), { backwards: !0 }) ? Vr : Lm : " ";
    o.push(d);
  } else o.push(Vr);
  let p = Wr(l, sr(l, c(n)));
  return p !== !1 && lr(l, p) && o.push(Vr), o;
}
function LA(e, t, r) {
  var n;
  let o = e.node, i = Wm(e, t), { printer: l, originalText: u, locStart: c } = t, p = (n = l.isBlockComment) == null ? void 0 : n.call(l, o);
  if (r != null && r.hasLineSuffix && !(r != null && r.isBlock) || lr(u, c(o), { backwards: !0 })) {
    let d = Yc(u, c(o));
    return { doc: kc([Vr, d ? Vr : "", i]), isBlock: p, hasLineSuffix: !0 };
  }
  return !p || r != null && r.hasLineSuffix ? { doc: [kc([" ", i]), gl], isBlock: p, hasLineSuffix: !0 } : { doc: [" ", i], isBlock: p, hasLineSuffix: !1 };
}
function TA(e, t) {
  let r = e.node;
  if (!r) return {};
  let n = t[Symbol.for("printedComments")];
  if ((r.comments || []).filter((u) => !n.has(u)).length === 0) return { leading: "", trailing: "" };
  let o = [], i = [], l;
  return e.each(() => {
    let u = e.node;
    if (n != null && n.has(u)) return;
    let { leading: c, trailing: p } = u;
    c ? o.push(kA(e, t)) : p && (l = LA(e, t, l), i.push(l.doc));
  }, "comments"), { leading: o, trailing: i };
}
function BA(e, t, r) {
  let { leading: n, trailing: o } = TA(e, r);
  return !n && !o ? t : _m(t, (i) => [n, i, o]);
}
function IA(e) {
  let { [Symbol.for("comments")]: t, [Symbol.for("printedComments")]: r } = e;
  for (let n of t) {
    if (!n.printed && !r.has(n)) throw new Error('Comment "' + n.value.trim() + '" was not printed. Please report this error!');
    delete n.printed;
  }
}
function MA(e) {
  return () => {
  };
}
function Um({ plugins: e = [], showDeprecated: t = !1 } = {}) {
  let r = e.flatMap((o) => o.languages ?? []), n = [];
  for (let o of zA(Object.assign({}, ...e.map(({ options: i }) => i), PA))) !t && o.deprecated || (Array.isArray(o.choices) && (t || (o.choices =
  o.choices.filter((i) => !i.deprecated)), o.name === "parser" && (o.choices = [...o.choices, ...HA(o.choices, r, e)])), o.pluginDefaults = Object.
  fromEntries(e.filter((i) => {
    var l;
    return ((l = i.defaultOptions) == null ? void 0 : l[o.name]) !== void 0;
  }).map((i) => [i.name, i.defaultOptions[o.name]])), n.push(o));
  return { languages: r, options: n };
}
function* HA(e, t, r) {
  let n = new Set(e.map((o) => o.value));
  for (let o of t) if (o.parsers) {
    for (let i of o.parsers) if (!n.has(i)) {
      n.add(i);
      let l = r.find((c) => c.parsers && Object.prototype.hasOwnProperty.call(c.parsers, i)), u = o.name;
      l != null && l.name && (u += ` (plugin: ${l.name})`), yield { value: i, description: u };
    }
  }
}
function zA(e) {
  let t = [];
  for (let [r, n] of Object.entries(e)) {
    let o = { name: r, ...n };
    Array.isArray(o.default) && (o.default = ye(!1, o.default, -1).value), t.push(o);
  }
  return t;
}
function K2(e, t) {
  if (!t) return;
  let r = OA(t).toLowerCase();
  return e.find(({ filenames: n }) => n?.some((o) => o.toLowerCase() === r)) ?? e.find(({ extensions: n }) => n?.some((o) => r.endsWith(o)));
}
function NA(e, t) {
  if (t) return e.find(({ name: r }) => r.toLowerCase() === t) ?? e.find(({ aliases: r }) => r?.includes(t)) ?? e.find(({ extensions: r }) => r?.
  includes(`.${t}`));
}
function $A(e, t) {
  let r = e.plugins.flatMap((o) => o.languages ?? []), n = NA(r, t.language) ?? K2(r, t.physicalFile) ?? K2(r, t.file) ?? (t.physicalFile, void 0);
  return n?.parsers[0];
}
function Q2(e, t, r, n) {
  return [`Invalid ${ho.default.red(n.key(e))} value.`, `Expected ${ho.default.blue(r)},`, `but received ${t === Gm ? ho.default.gray("nothi\
ng") : ho.default.red(n.value(t))}.`].join(" ");
}
function Ym({ text: e, list: t }, r) {
  let n = [];
  return e && n.push(`- ${ho.default.blue(e)}`), t && n.push([`- ${ho.default.blue(t.title)}:`].concat(t.values.map((o) => Ym(o, r - J2.length).
  replace(/^|\n/g, `$&${J2}`))).join(`
`)), Xm(n, r);
}
function Xm(e, t) {
  if (e.length === 1) return e[0];
  let [r, n] = e, [o, i] = e.map((l) => l.split(`
`, 1)[0].length);
  return o > t && o > i ? n : r;
}
function qA(e, t) {
  if (e === t) return 0;
  let r = e;
  e.length > t.length && (e = t, t = r);
  let n = e.length, o = t.length;
  for (; n > 0 && e.charCodeAt(~-n) === t.charCodeAt(~-o); ) n--, o--;
  let i = 0;
  for (; i < n && e.charCodeAt(i) === t.charCodeAt(i); ) i++;
  if (n -= i, o -= i, n === 0) return o;
  let l, u, c, p, d = 0, h = 0;
  for (; d < n; ) tm[d] = e.charCodeAt(i + d), Rc[d] = ++d;
  for (; h < o; ) for (l = t.charCodeAt(i + h), c = h++, u = h, d = 0; d < n; d++) p = l === tm[d] ? c : c + 1, c = Rc[d], u = Rc[d] = c > u ?
  p > u ? u + 1 : p : p > c ? c + 1 : p;
  return u;
}
function GA(e, t) {
  let r = new e(t), n = Object.create(r);
  for (let o of UA) o in t && (n[o] = YA(t[o], r, ur.prototype[o].length));
  return n;
}
function YA(e, t, r) {
  return typeof e == "function" ? (...n) => e(...n.slice(0, r - 1), t, ...n.slice(r - 1)) : () => e;
}
function rm({ from: e, to: t }) {
  return { from: [e], to: t };
}
function QA(e, t) {
  let r = /* @__PURE__ */ Object.create(null);
  for (let n of e) {
    let o = n[t];
    if (r[o]) throw new Error(`Duplicate ${t} ${JSON.stringify(o)}`);
    r[o] = n;
  }
  return r;
}
function eF(e, t) {
  let r = /* @__PURE__ */ new Map();
  for (let n of e) {
    let o = n[t];
    if (r.has(o)) throw new Error(`Duplicate ${t} ${JSON.stringify(o)}`);
    r.set(o, n);
  }
  return r;
}
function tF() {
  let e = /* @__PURE__ */ Object.create(null);
  return (t) => {
    let r = JSON.stringify(t);
    return e[r] ? !0 : (e[r] = !0, !1);
  };
}
function rF(e, t) {
  let r = [], n = [];
  for (let o of e) t(o) ? r.push(o) : n.push(o);
  return [r, n];
}
function nF(e) {
  return e === Math.floor(e);
}
function oF(e, t) {
  if (e === t) return 0;
  let r = typeof e, n = typeof t, o = ["undefined", "object", "boolean", "number", "string"];
  return r !== n ? o.indexOf(r) - o.indexOf(n) : r !== "string" ? Number(e) - Number(t) : e.localeCompare(t);
}
function aF(e) {
  return (...t) => {
    let r = e(...t);
    return typeof r == "string" ? new Error(r) : r;
  };
}
function nm(e) {
  return e === void 0 ? {} : e;
}
function Zm(e) {
  if (typeof e == "string") return { text: e };
  let { text: t, list: r } = e;
  return iF((t || r) !== void 0, "Unexpected `expected` result, there should be at least one field."), r ? { text: t, list: { title: r.title,
  values: r.values.map(Zm) } } : { text: t };
}
function om(e, t) {
  return e === !0 ? !0 : e === !1 ? { value: t } : e;
}
function am(e, t, r = !1) {
  return e === !1 ? !1 : e === !0 ? r ? !0 : [{ value: t }] : "value" in e ? [e] : e.length === 0 ? !1 : e;
}
function im(e, t) {
  return typeof e == "string" || "key" in e ? { from: t, to: e } : "from" in e ? { from: e.from, to: e.to } : { from: t, to: e.to };
}
function _c(e, t) {
  return e === void 0 ? [] : Array.isArray(e) ? e.map((r) => im(r, t)) : [im(e, t)];
}
function lm(e, t) {
  let r = _c(typeof e == "object" && "redirect" in e ? e.redirect : e, t);
  return r.length === 0 ? { remain: t, redirect: r } : typeof e == "object" && "remain" in e ? { remain: e.remain, redirect: r } : { redirect: r };
}
function iF(e, t) {
  if (!e) throw new Error(t);
}
function mF(e, t, { logger: r = !1, isCLI: n = !1, passThrough: o = !1, FlagSchema: i, descriptor: l } = {}) {
  if (n) {
    if (!i) throw new Error("'FlagSchema' option is required.");
    if (!l) throw new Error("'descriptor' option is required.");
  } else l = fo;
  let u = o ? Array.isArray(o) ? (f, v) => o.includes(f) ? { [f]: v } : void 0 : (f, v) => ({ [f]: v }) : (f, v, b) => {
    let { _: m, ...g } = b.schemas;
    return Km(f, v, { ...b, schemas: g });
  }, c = gF(t, { isCLI: n, FlagSchema: i }), p = new hF(c, { logger: r, unknown: u, descriptor: l }), d = r !== !1;
  d && Sc && (p._hasDeprecationWarned = Sc);
  let h = p.normalize(e);
  return d && (Sc = p._hasDeprecationWarned), h;
}
function gF(e, { isCLI: t, FlagSchema: r }) {
  let n = [];
  t && n.push(KA.create({ name: "_" }));
  for (let o of e) n.push(vF(o, { isCLI: t, optionInfos: e, FlagSchema: r })), o.alias && t && n.push(XA.create({ name: o.alias, sourceName: o.
  name }));
  return n;
}
function vF(e, { isCLI: t, optionInfos: r, FlagSchema: n }) {
  let { name: o } = e, i = { name: o }, l, u = {};
  switch (e.type) {
    case "int":
      l = uF, t && (i.preprocess = Number);
      break;
    case "string":
      l = sm;
      break;
    case "choice":
      l = lF, i.choices = e.choices.map((c) => c != null && c.redirect ? { ...c, redirect: { to: { key: e.name, value: c.redirect } } } : c);
      break;
    case "boolean":
      l = JA;
      break;
    case "flag":
      l = n, i.flags = r.flatMap((c) => [c.alias, c.description && c.name, c.oppositeDescription && `no-${c.name}`].filter(Boolean));
      break;
    case "path":
      l = sm;
      break;
    default:
      throw new Error(`Unexpected type ${e.type}`);
  }
  if (e.exception ? i.validate = (c, p, d) => e.exception(c) || p.validate(c, d) : i.validate = (c, p, d) => c === void 0 || p.validate(c, d),
  e.redirect && (u.redirect = (c) => c ? { to: typeof e.redirect == "string" ? e.redirect : { key: e.redirect.option, value: e.redirect.value } } :
  void 0), e.deprecated && (u.deprecated = !0), t && !e.array) {
    let c = i.preprocess || ((p) => p);
    i.preprocess = (p, d, h) => d.preprocess(c(Array.isArray(p) ? ye(!1, p, -1) : p), h);
  }
  return e.array ? ZA.create({ ...t ? { preprocess: /* @__PURE__ */ a((c) => Array.isArray(c) ? c : [c], "preprocess") } : {}, ...u, valueSchema: l.
  create(i) }) : l.create({ ...i, ...u });
}
function Qm(e, t) {
  if (!t) throw new Error("parserName is required.");
  let r = Jm(!1, e, (o) => o.parsers && Object.prototype.hasOwnProperty.call(o.parsers, t));
  if (r) return r;
  let n = `Couldn't resolve parser "${t}".`;
  throw n += " Plugins must be explicitly added to the standalone bundle.", new qm(n);
}
function yF(e, t) {
  if (!t) throw new Error("astFormat is required.");
  let r = Jm(!1, e, (o) => o.printers && Object.prototype.hasOwnProperty.call(o.printers, t));
  if (r) return r;
  let n = `Couldn't find plugin for AST format "${t}".`;
  throw n += " Plugins must be explicitly added to the standalone bundle.", new qm(n);
}
function eg({ plugins: e, parser: t }) {
  let r = Qm(e, t);
  return tg(r, t);
}
function tg(e, t) {
  let r = e.parsers[t];
  return typeof r == "function" ? r() : r;
}
function DF(e, t) {
  let r = e.printers[t];
  return typeof r == "function" ? r() : r;
}
async function xF(e, t = {}) {
  var r;
  let n = { ...e };
  if (!n.parser) if (n.filepath) {
    if (n.parser = jA(n, { physicalFile: n.filepath }), !n.parser) throw new X2(`No parser could be inferred for file "${n.filepath}".`);
  } else throw new X2("No parser and no file path given, couldn't infer a parser.");
  let o = Um({ plugins: e.plugins, showDeprecated: !0 }).options, i = { ...um, ...Object.fromEntries(o.filter((f) => f.default !== void 0).map(
  (f) => [f.name, f.default])) }, l = Qm(n.plugins, n.parser), u = await tg(l, n.parser);
  n.astFormat = u.astFormat, n.locEnd = u.locEnd, n.locStart = u.locStart;
  let c = (r = l.printers) != null && r[u.astFormat] ? l : yF(n.plugins, u.astFormat), p = await DF(c, u.astFormat);
  n.printer = p;
  let d = c.defaultOptions ? Object.fromEntries(Object.entries(c.defaultOptions).filter(([, f]) => f !== void 0)) : {}, h = { ...i, ...d };
  for (let [f, v] of Object.entries(h)) (n[f] === null || n[f] === void 0) && (n[f] = v);
  return n.parser === "json" && (n.trailingComma = "none"), wF(n, o, { passThrough: Object.keys(um), ...t });
}
async function EF(e, t) {
  let r = await eg(t), n = r.preprocess ? r.preprocess(e, t) : e;
  t.originalText = n;
  let o;
  try {
    o = await r.parse(n, t, t);
  } catch (i) {
    RF(i, e);
  }
  return { text: n, ast: o };
}
function RF(e, t) {
  let { loc: r } = e;
  if (r) {
    let n = (0, CF.codeFrameColumns)(t, r, { highlightCode: !0 });
    throw e.message += `
` + n, e.codeFrame = n, e;
  }
  throw e;
}
async function SF(e, t, r, n, o) {
  let { embeddedLanguageFormatting: i, printer: { embed: l, hasPrettierIgnore: u = /* @__PURE__ */ a(() => !1, "s"), getVisitorKeys: c } } = r;
  if (!l || i !== "auto") return;
  if (l.length > 2) throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See h\
ttps://prettier.io/docs/en/plugins.html#optional-embed");
  let p = bl(l.getVisitorKeys ?? c), d = [];
  v();
  let h = e.stack;
  for (let { print: b, node: m, pathStack: g } of d) try {
    e.stack = g;
    let y = await b(f, t, e, r);
    y && o.set(m, y);
  } catch (y) {
    if (globalThis.PRETTIER_DEBUG) throw y;
  }
  e.stack = h;
  function f(b, m) {
    return AF(b, m, r, n);
  }
  a(f, "f");
  function v() {
    let { node: b } = e;
    if (b === null || typeof b != "object" || u(e)) return;
    for (let g of p(b)) Array.isArray(b[g]) ? e.each(v, g) : e.call(v, g);
    let m = l(e, r);
    if (m) {
      if (typeof m == "function") {
        d.push({ print: m, node: b, pathStack: [...e.stack] });
        return;
      }
      o.set(b, m);
    }
  }
  a(v, "p");
}
async function AF(e, t, r, n) {
  let o = await To({ ...r, ...t, parentParser: r.parser, originalText: e }, { passThrough: !0 }), { ast: i } = await Ha(e, o), l = await n(i,
  o);
  return Mm(l);
}
function FF(e, t) {
  let { originalText: r, [Symbol.for("comments")]: n, locStart: o, locEnd: i, [Symbol.for("printedComments")]: l } = t, { node: u } = e, c = o(
  u), p = i(u);
  for (let d of n) o(d) >= c && i(d) <= p && l.add(d);
  return r.slice(c, p);
}
async function yl(e, t) {
  ({ ast: e } = await rg(e, t));
  let r = /* @__PURE__ */ new Map(), n = new fA(e), o = _A(t), i = /* @__PURE__ */ new Map();
  await SF(n, u, t, yl, i);
  let l = await cm(n, t, u, void 0, i);
  return IA(t), l;
  function u(p, d) {
    return p === void 0 || p === n ? c(d) : Array.isArray(p) ? n.call(() => c(d), ...p) : n.call(() => c(d), p);
  }
  function c(p) {
    o(n);
    let d = n.node;
    if (d == null) return "";
    let h = d && typeof d == "object" && p === void 0;
    if (h && r.has(d)) return r.get(d);
    let f = cm(n, t, u, p, i);
    return h && r.set(d, f), f;
  }
}
function cm(e, t, r, n, o) {
  var i;
  let { node: l } = e, { printer: u } = t, c;
  return (i = u.hasPrettierIgnore) != null && i.call(u, e) ? c = kF(e, t) : o.has(l) ? c = o.get(l) : c = u.print(e, t, r, n), l === t.cursorNode &&
  (c = _m(c, (p) => [Lc, p, Lc])), u.printComment && (!u.willPrintOwnComments || !u.willPrintOwnComments(e, t)) && (c = BA(e, c, t)), c;
}
async function rg(e, t) {
  let r = e.comments ?? [];
  t[Symbol.for("comments")] = r, t[Symbol.for("tokens")] = e.tokens ?? [], t[Symbol.for("printedComments")] = /* @__PURE__ */ new Set(), RA(
  e, t);
  let { printer: { preprocess: n } } = t;
  return e = n ? await n(e, t) : e, { ast: e, comments: r };
}
function LF(e, t) {
  let { cursorOffset: r, locStart: n, locEnd: o } = t, i = bl(t.printer.getVisitorKeys), l = /* @__PURE__ */ a((c) => n(c) <= r && o(c) >= r,
  "i"), u = e;
  for (let c of gA(e, { getVisitorKeys: i, filter: l })) u = c;
  return u;
}
function BF(e, t) {
  let { printer: { massageAstNode: r, getVisitorKeys: n } } = t;
  if (!r) return e;
  let o = bl(n), i = r.ignoredProperties ?? /* @__PURE__ */ new Set();
  return l(e);
  function l(u, c) {
    if (!(u !== null && typeof u == "object")) return u;
    if (Array.isArray(u)) return u.map((f) => l(f, c)).filter(Boolean);
    let p = {}, d = new Set(o(u));
    for (let f in u) !Object.prototype.hasOwnProperty.call(u, f) || i.has(f) || (d.has(f) ? p[f] = l(u[f], u) : p[f] = u[f]);
    let h = r(u, p, c);
    if (h !== null) return h ?? p;
  }
}
function HF(e, t) {
  let r = [e.node, ...e.parentNodes], n = /* @__PURE__ */ new Set([t.node, ...t.parentNodes]);
  return r.find((o) => ng.has(o.type) && n.has(o));
}
function pm(e) {
  let t = _F(!1, e, (r) => r.type !== "Program" && r.type !== "File");
  return t === -1 ? e : e.slice(0, t + 1);
}
function zF(e, t, { locStart: r, locEnd: n }) {
  let o = e.node, i = t.node;
  if (o === i) return { startNode: o, endNode: i };
  let l = r(e.node);
  for (let c of pm(t.parentNodes)) if (r(c) >= l) i = c;
  else break;
  let u = n(t.node);
  for (let c of pm(e.parentNodes)) {
    if (n(c) <= u) o = c;
    else break;
    if (o === i) break;
  }
  return { startNode: o, endNode: i };
}
function Pc(e, t, r, n, o = [], i) {
  let { locStart: l, locEnd: u } = r, c = l(e), p = u(e);
  if (!(t > p || t < c || i === "rangeEnd" && t === c || i === "rangeStart" && t === p)) {
    for (let d of Gc(e, r)) {
      let h = Pc(d, t, r, n, [e, ...o], i);
      if (h) return h;
    }
    if (!n || n(e, o[0])) return { node: e, parentNodes: o };
  }
}
function OF(e, t) {
  return t !== "DeclareExportDeclaration" && e !== "TypeParameterDeclaration" && (e === "Directive" || e === "TypeAlias" || e === "TSExportA\
ssignment" || e.startsWith("Declare") || e.startsWith("TSDeclare") || e.endsWith("Statement") || e.endsWith("Declaration"));
}
function dm(e, t, r) {
  if (!t) return !1;
  switch (e.parser) {
    case "flow":
    case "babel":
    case "babel-flow":
    case "babel-ts":
    case "typescript":
    case "acorn":
    case "espree":
    case "meriyah":
    case "__babel_estree":
      return OF(t.type, r?.type);
    case "json":
    case "json5":
    case "jsonc":
    case "json-stringify":
      return ng.has(t.type);
    case "graphql":
      return NF.has(t.kind);
    case "vue":
      return t.tag !== "root";
  }
  return !1;
}
function $F(e, t, r) {
  let { rangeStart: n, rangeEnd: o, locStart: i, locEnd: l } = t;
  Mc.ok(o > n);
  let u = e.slice(n, o).search(/\S/u), c = u === -1;
  if (!c) for (n += u; o > n && !/\S/u.test(e[o - 1]); --o) ;
  let p = Pc(r, n, t, (v, b) => dm(t, v, b), [], "rangeStart"), d = c ? p : Pc(r, o, t, (v) => dm(t, v), [], "rangeEnd");
  if (!p || !d) return { rangeStart: 0, rangeEnd: 0 };
  let h, f;
  if (PF(t)) {
    let v = HF(p, d);
    h = v, f = v;
  } else ({ startNode: h, endNode: f } = zF(p, d, t));
  return { rangeStart: Math.min(i(h), i(f)), rangeEnd: Math.max(l(h), l(f)) };
}
async function ag(e, t, r = 0) {
  if (!e || e.trim().length === 0) return { formatted: "", cursorOffset: -1, comments: [] };
  let { ast: n, text: o } = await Ha(e, t);
  t.cursorOffset >= 0 && (t.cursorNode = TF(n, t));
  let i = await yl(n, t, r);
  r > 0 && (i = Im([Vr, i], r, t.tabWidth));
  let l = wl(i, t);
  if (r > 0) {
    let c = l.formatted.trim();
    l.cursorNodeStart !== void 0 && (l.cursorNodeStart -= l.formatted.indexOf(c)), l.formatted = c + Oc(t.endOfLine);
  }
  let u = t[Symbol.for("comments")];
  if (t.cursorOffset >= 0) {
    let c, p, d, h, f;
    if (t.cursorNode && l.cursorNodeText ? (c = t.locStart(t.cursorNode), p = o.slice(c, t.locEnd(t.cursorNode)), d = t.cursorOffset - c, h =
    l.cursorNodeStart, f = l.cursorNodeText) : (c = 0, p = o, d = t.cursorOffset, h = 0, f = l.formatted), p === f) return { formatted: l.formatted,
    cursorOffset: h + d, comments: u };
    let v = p.split("");
    v.splice(d, 0, fm);
    let b = f.split(""), m = AS(v, b), g = h;
    for (let y of m) if (y.removed) {
      if (y.value.includes(fm)) break;
    } else g += y.count;
    return { formatted: l.formatted, cursorOffset: g, comments: u };
  }
  return { formatted: l.formatted, cursorOffset: -1, comments: u };
}
async function jF(e, t) {
  let { ast: r, text: n } = await Ha(e, t), { rangeStart: o, rangeEnd: i } = $F(n, t, r), l = n.slice(o, i), u = Math.min(o, n.lastIndexOf(`\

`, o) + 1), c = n.slice(u, o).match(/^\s*/u)[0], p = qc(c, t.tabWidth), d = await ag(l, { ...t, rangeStart: 0, rangeEnd: Number.POSITIVE_INFINITY,
  cursorOffset: t.cursorOffset > o && t.cursorOffset <= i ? t.cursorOffset - o : -1, endOfLine: "lf" }, p), h = d.formatted.trimEnd(), { cursorOffset: f } = t;
  f > i ? f += h.length - l.length : d.cursorOffset >= 0 && (f = d.cursorOffset + o);
  let v = n.slice(0, o) + h + n.slice(i);
  if (t.endOfLine !== "lf") {
    let b = Oc(t.endOfLine);
    f >= 0 && b === `\r
` && (f += Em(v.slice(0, f), `
`)), v = ml(!1, v, `
`, b);
  }
  return { formatted: v, cursorOffset: f, comments: d.comments };
}
function Ac(e, t, r) {
  return typeof t != "number" || Number.isNaN(t) || t < 0 || t > e.length ? r : t;
}
function hm(e, t) {
  let { cursorOffset: r, rangeStart: n, rangeEnd: o } = t;
  return r = Ac(e, r, -1), n = Ac(e, n, 0), o = Ac(e, o, e.length), { ...t, cursorOffset: r, rangeStart: n, rangeEnd: o };
}
function ig(e, t) {
  let { cursorOffset: r, rangeStart: n, rangeEnd: o, endOfLine: i } = hm(e, t), l = e.charAt(0) === og;
  if (l && (e = e.slice(1), r--, n--, o--), i === "auto" && (i = FS(e)), e.includes("\r")) {
    let u = /* @__PURE__ */ a((c) => Em(e.slice(0, Math.max(c, 0)), `\r
`), "s");
    r -= u(r), n -= u(n), o -= u(o), e = kS(e);
  }
  return { hasBOM: l, text: e, options: hm(e, { ...t, cursorOffset: r, rangeStart: n, rangeEnd: o, endOfLine: i }) };
}
async function mm(e, t) {
  let r = await eg(t);
  return !r.hasPragma || r.hasPragma(e);
}
async function lg(e, t) {
  let { hasBOM: r, text: n, options: o } = ig(e, await To(t));
  if (o.rangeStart >= o.rangeEnd && n !== "" || o.requirePragma && !await mm(n, o)) return { formatted: e, cursorOffset: t.cursorOffset, comments: [] };
  let i;
  return o.rangeStart > 0 || o.rangeEnd < n.length ? i = await jF(n, o) : (!o.requirePragma && o.insertPragma && o.printer.insertPragma && !await mm(
  n, o) && (n = o.printer.insertPragma(n)), i = await ag(n, o)), r && (i.formatted = og + i.formatted, i.cursorOffset >= 0 && i.cursorOffset++),
  i;
}
async function VF(e, t, r) {
  let { text: n, options: o } = ig(e, await To(t)), i = await Ha(n, o);
  return r && (r.preprocessForPrint && (i.ast = await rg(i.ast, o)), r.massage && (i.ast = IF(i.ast, o))), i;
}
async function WF(e, t) {
  t = await To(t);
  let r = await yl(e, t);
  return wl(r, t);
}
async function qF(e, t) {
  let r = qS(e), { formatted: n } = await lg(r, { ...t, parser: "__js_expression" });
  return n;
}
async function UF(e, t) {
  t = await To(t);
  let { ast: r } = await Ha(e, t);
  return yl(r, t);
}
async function GF(e, t) {
  return wl(e, await To(t));
}
function JF(e, t) {
  if (t === !1) return !1;
  if (e.charAt(t) === "/" && e.charAt(t + 1) === "*") {
    for (let r = t + 2; r < e.length; ++r) if (e.charAt(r) === "*" && e.charAt(r + 1) === "/") return r + 2;
  }
  return t;
}
function QF(e, t) {
  return t === !1 ? !1 : e.charAt(t) === "/" && e.charAt(t + 1) === "/" ? Nm(e, t) : t;
}
function ek(e, t) {
  let r = null, n = t;
  for (; n !== r; ) r = n, n = sr(e, n), n = Xc(e, n), n = Kc(e, n), n = Wr(e, n);
  return n;
}
function tk(e, t) {
  let r = null, n = t;
  for (; n !== r; ) r = n, n = Om(e, n), n = Xc(e, n), n = sr(e, n);
  return n = Kc(e, n), n = Wr(e, n), n !== !1 && lr(e, n);
}
function rk(e, t) {
  let r = e.lastIndexOf(`
`);
  return r === -1 ? 0 : qc(e.slice(r + 1).match(/^[\t ]*/u)[0], t);
}
function ok(e) {
  if (typeof e != "string") throw new TypeError("Expected a string");
  return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function ak(e, t) {
  let r = e.match(new RegExp(`(${ok(t)})+`, "gu"));
  return r === null ? 0 : r.reduce((n, o) => Math.max(n, o.length / t.length), 0);
}
function lk(e, t) {
  let r = Zc(e, t);
  return r === !1 ? "" : e.charAt(r);
}
function uk(e, t, r) {
  for (let n = t; n < r; ++n) if (e.charAt(n) === `
`) return !0;
  return !1;
}
function pk(e, t, r = {}) {
  return sr(e, r.backwards ? t - 1 : t, r) !== t;
}
function fk(e, t, r) {
  let n = t === '"' ? "'" : '"', o = ml(!1, e, /\\(.)|(["'])/gsu, (i, l, u) => l === n ? l : u === t ? "\\" + u : u || (r && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/u.
  test(l) ? l : "\\" + l));
  return t + o + t;
}
function mk(e, t, r) {
  return Zc(e, r(t));
}
function gk(e, t) {
  return arguments.length === 2 || typeof t == "number" ? Zc(e, t) : mk(...arguments);
}
function vk(e, t, r) {
  return Yc(e, r(t));
}
function wk(e, t) {
  return arguments.length === 2 || typeof t == "number" ? Yc(e, t) : vk(...arguments);
}
function bk(e, t, r) {
  return Jc(e, r(t));
}
function yk(e, t) {
  return arguments.length === 2 || typeof t == "number" ? Jc(e, t) : bk(...arguments);
}
function jr(e, t = 1) {
  return async (...r) => {
    let n = r[t] ?? {}, o = n.plugins ?? [];
    return r[t] = { ...n, plugins: Array.isArray(o) ? o : Object.values(o) }, e(...r);
  };
}
async function pg(e, t) {
  let { formatted: r } = await cg(e, { ...t, cursorOffset: -1 });
  return r;
}
async function Dk(e, t) {
  return await pg(e, t) === e;
}
var cS, dl, pS, dS, fS, hS, gm, mS, Hc, fl, vm, hl, gS, vS, wS, Ba, zc, wm, bm, ym, bS, yS, DS, Dm, xS, ml, B$, V2, W2, xm, Cm, ES, RS, SS, _a,
cl, qr, Ht, Ur, Ot, Nt, $t, Ve, kt, Ye, jt, Vt, Wt, Se, Lt, nt, Rm, Gr, TS, mo, IS, ko, q2, Nc, Sm, Ft, $c, $S, gl, jS, jc, km, Lm, VS, Vr, Tm,
Lc, US, ye, GS, KS, ZS, Vc, je, At, Ma, qc, Nr, Ic, sl, go, dA, fA, Hm, Mc, mA, vA, sr, Om, Nm, Wr, lr, DA, $m, xA, bl, xc, Cc, Vm, Yc, _A, vo,
qm, wo, X2, PA, OA, jA, fo, Z2, VA, ho, Gm, ul, J2, WA, em, Rc, tm, Km, UA, bo, ur, yo, XA, Do, KA, xo, ZA, Co, JA, Eo, lF, Ro, sF, So, uF, Ao,
sm, cF, pF, dF, fF, Fo, hF, Sc, wF, bF, Jm, um, To, CF, Ha, kF, TF, IF, MF, _F, PF, ng, NF, og, fm, sg, YF, XF, KF, ZF, ug, Xc, Kc, Zc, Jc, nk,
ik, sk, ck, dk, hk, cg, xk, Ck, dg, fg = A(() => {
  cS = Object.create, dl = Object.defineProperty, pS = Object.getOwnPropertyDescriptor, dS = Object.getOwnPropertyNames, fS = Object.getPrototypeOf,
  hS = Object.prototype.hasOwnProperty, gm = /* @__PURE__ */ a((e) => {
    throw TypeError(e);
  }, "sr"), mS = /* @__PURE__ */ a((e, t) => () => (e && (t = e(e = 0)), t), "_u"), Hc = /* @__PURE__ */ a((e, t) => () => (t || e((t = { exports: {} }).
  exports, t), t.exports), "At"), fl = /* @__PURE__ */ a((e, t) => {
    for (var r in t) dl(e, r, { get: t[r], enumerable: !0 });
  }, "We"), vm = /* @__PURE__ */ a((e, t, r, n) => {
    if (t && typeof t == "object" || typeof t == "function") for (let o of dS(t)) !hS.call(e, o) && o !== r && dl(e, o, { get: /* @__PURE__ */ a(
    () => t[o], "get"), enumerable: !(n = pS(t, o)) || n.enumerable });
    return e;
  }, "ar"), hl = /* @__PURE__ */ a((e, t, r) => (r = e != null ? cS(fS(e)) : {}, vm(t || !e || !e.__esModule ? dl(r, "default", { value: e, enumerable: !0 }) :
  r, e)), "Me"), gS = /* @__PURE__ */ a((e) => vm(dl({}, "__esModule", { value: !0 }), e), "vu"), vS = /* @__PURE__ */ a((e, t, r) => t.has(
  e) || gm("Cannot " + r), "bu"), wS = /* @__PURE__ */ a((e, t, r) => t.has(e) ? gm("Cannot add the same private member more than once") : t instanceof
  WeakSet ? t.add(e) : t.set(e, r), "Dr"), Ba = /* @__PURE__ */ a((e, t, r) => (vS(e, t, "access private method"), r), "pe"), zc = Hc((e, t) => {
    "use strict";
    var r = new Proxy(String, { get: /* @__PURE__ */ a(() => r, "get") });
    t.exports = r;
  }), wm = {};
  fl(wm, { default: /* @__PURE__ */ a(() => ym, "default"), shouldHighlight: /* @__PURE__ */ a(() => bm, "shouldHighlight") });
  bS = mS(() => {
    bm = /* @__PURE__ */ a(() => !1, "xo"), ym = String;
  }), yS = Hc((e, t) => {
    var r = String, n = /* @__PURE__ */ a(function() {
      return { isColorSupported: !1, reset: r, bold: r, dim: r, italic: r, underline: r, inverse: r, hidden: r, strikethrough: r, black: r, red: r,
      green: r, yellow: r, blue: r, magenta: r, cyan: r, white: r, gray: r, bgBlack: r, bgRed: r, bgGreen: r, bgYellow: r, bgBlue: r, bgMagenta: r,
      bgCyan: r, bgWhite: r };
    }, "Ln");
    t.exports = n(), t.exports.createColors = n;
  }), DS = Hc((e) => {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }), e.codeFrameColumns = v, e.default = b;
    var t = (bS(), gS(wm)), r = o(yS(), !0);
    function n(m) {
      if (typeof WeakMap != "function") return null;
      var g = /* @__PURE__ */ new WeakMap(), y = /* @__PURE__ */ new WeakMap();
      return (n = /* @__PURE__ */ a(function(w) {
        return w ? y : g;
      }, "Wn"))(m);
    }
    a(n, "Wn");
    function o(m, g) {
      if (!g && m && m.__esModule) return m;
      if (m === null || typeof m != "object" && typeof m != "function") return { default: m };
      var y = n(g);
      if (y && y.has(m)) return y.get(m);
      var w = { __proto__: null }, D = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var x in m) if (x !== "default" && {}.hasOwnProperty.call(m, x)) {
        var C = D ? Object.getOwnPropertyDescriptor(m, x) : null;
        C && (C.get || C.set) ? Object.defineProperty(w, x, C) : w[x] = m[x];
      }
      return w.default = m, y && y.set(m, w), w;
    }
    a(o, "vo");
    var i = r.default, l = /* @__PURE__ */ a((m, g) => (y) => m(g(y)), "Rn"), u;
    function c(m) {
      if (m) {
        var g;
        return (g = u) != null || (u = (0, r.createColors)(!0)), u;
      }
      return i;
    }
    a(c, "Oo");
    var p = !1;
    function d(m) {
      return { gutter: m.gray, marker: l(m.red, m.bold), message: l(m.red, m.bold) };
    }
    a(d, "So");
    var h = /\r\n|[\n\r\u2028\u2029]/;
    function f(m, g, y) {
      let w = Object.assign({ column: 0, line: -1 }, m.start), D = Object.assign({}, w, m.end), { linesAbove: x = 2, linesBelow: C = 3 } = y ||
      {}, E = w.line, R = w.column, F = D.line, S = D.column, k = Math.max(E - (x + 1), 0), I = Math.min(g.length, F + C);
      E === -1 && (k = 0), F === -1 && (I = g.length);
      let H = F - E, M = {};
      if (H) for (let W = 0; W <= H; W++) {
        let L = W + E;
        if (!R) M[L] = !0;
        else if (W === 0) {
          let T = g[L - 1].length;
          M[L] = [R, T - R + 1];
        } else if (W === H) M[L] = [0, S];
        else {
          let T = g[L - W].length;
          M[L] = [0, T];
        }
      }
      else R === S ? R ? M[E] = [R, 0] : M[E] = !0 : M[E] = [R, S - R];
      return { start: k, end: I, markerLines: M };
    }
    a(f, "No");
    function v(m, g, y = {}) {
      let w = (y.highlightCode || y.forceColor) && (0, t.shouldHighlight)(y), D = c(y.forceColor), x = d(D), C = /* @__PURE__ */ a((M, W) => w ?
      M(W) : W, "i"), E = m.split(h), { start: R, end: F, markerLines: S } = f(g, E, y), k = g.start && typeof g.start.column == "number", I = String(
      F).length, H = (w ? (0, t.default)(m, y) : m).split(h, F).slice(R, F).map((M, W) => {
        let L = R + 1 + W, T = ` ${` ${L}`.slice(-I)} |`, P = S[L], q = !S[L + 1];
        if (P) {
          let N = "";
          if (Array.isArray(P)) {
            let U = M.slice(0, Math.max(P[0] - 1, 0)).replace(/[^\t]/g, " "), z = P[1] || 1;
            N = [`
 `, C(x.gutter, T.replace(/\d/g, " ")), " ", U, C(x.marker, "^").repeat(z)].join(""), q && y.message && (N += " " + C(x.message, y.message));
          }
          return [C(x.marker, ">"), C(x.gutter, T), M.length > 0 ? ` ${M}` : "", N].join("");
        } else return ` ${C(x.gutter, T)}${M.length > 0 ? ` ${M}` : ""}`;
      }).join(`
`);
      return y.message && !k && (H = `${" ".repeat(I + 1)}${y.message}
${H}`), w ? D.reset(H) : H;
    }
    a(v, "Mn");
    function b(m, g, y, w = {}) {
      if (!p) {
        p = !0;
        let D = "Passing lineNumber and colNumber is deprecated to @babel/code-frame. Please use `codeFrameColumns`.";
        {
          let x = new Error(D);
          x.name = "DeprecationWarning", console.warn(new Error(D));
        }
      }
      return y = Math.max(y, 0), v(m, { start: { column: y, line: g } }, w);
    }
    a(b, "To");
  }), Dm = {};
  fl(Dm, { __debug: /* @__PURE__ */ a(() => Ck, "__debug"), check: /* @__PURE__ */ a(() => Dk, "check"), doc: /* @__PURE__ */ a(() => sg, "d\
oc"), format: /* @__PURE__ */ a(() => pg, "format"), formatWithCursor: /* @__PURE__ */ a(() => cg, "formatWithCursor"), getSupportInfo: /* @__PURE__ */ a(
  () => xk, "getSupportInfo"), util: /* @__PURE__ */ a(() => ug, "util"), version: /* @__PURE__ */ a(() => ZF, "version") });
  xS = /* @__PURE__ */ a((e, t, r, n) => {
    if (!(e && t == null)) return t.replaceAll ? t.replaceAll(r, n) : r.global ? t.replace(r, n) : t.split(r).join(n);
  }, "Ou"), ml = xS;
  a(zt, "Z");
  zt.prototype = { diff: /* @__PURE__ */ a(function(e, t) {
    var r, n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = n.callback;
    typeof n == "function" && (o = n, n = {}), this.options = n;
    var i = this;
    function l(D) {
      return o ? (setTimeout(function() {
        o(void 0, D);
      }, 0), !0) : D;
    }
    a(l, "s"), e = this.castInput(e), t = this.castInput(t), e = this.removeEmpty(this.tokenize(e)), t = this.removeEmpty(this.tokenize(t));
    var u = t.length, c = e.length, p = 1, d = u + c;
    n.maxEditLength && (d = Math.min(d, n.maxEditLength));
    var h = (r = n.timeout) !== null && r !== void 0 ? r : 1 / 0, f = Date.now() + h, v = [{ oldPos: -1, lastComponent: void 0 }], b = this.
    extractCommon(v[0], t, e, 0);
    if (v[0].oldPos + 1 >= c && b + 1 >= u) return l([{ value: this.join(t), count: t.length }]);
    var m = -1 / 0, g = 1 / 0;
    function y() {
      for (var D = Math.max(m, -p); D <= Math.min(g, p); D += 2) {
        var x = void 0, C = v[D - 1], E = v[D + 1];
        C && (v[D - 1] = void 0);
        var R = !1;
        if (E) {
          var F = E.oldPos - D;
          R = E && 0 <= F && F < u;
        }
        var S = C && C.oldPos + 1 < c;
        if (!R && !S) {
          v[D] = void 0;
          continue;
        }
        if (!S || R && C.oldPos + 1 < E.oldPos ? x = i.addToPath(E, !0, void 0, 0) : x = i.addToPath(C, void 0, !0, 1), b = i.extractCommon(
        x, t, e, D), x.oldPos + 1 >= c && b + 1 >= u) return l(CS(i, x.lastComponent, t, e, i.useLongestToken));
        v[D] = x, x.oldPos + 1 >= c && (g = Math.min(g, D - 1)), b + 1 >= u && (m = Math.max(m, D + 1));
      }
      p++;
    }
    if (a(y, "A"), o) (/* @__PURE__ */ a(function D() {
      setTimeout(function() {
        if (p > d || Date.now() > f) return o();
        y() || D();
      }, 0);
    }, "h"))();
    else for (; p <= d && Date.now() <= f; ) {
      var w = y();
      if (w) return w;
    }
  }, "diff"), addToPath: /* @__PURE__ */ a(function(e, t, r, n) {
    var o = e.lastComponent;
    return o && o.added === t && o.removed === r ? { oldPos: e.oldPos + n, lastComponent: { count: o.count + 1, added: t, removed: r, previousComponent: o.
    previousComponent } } : { oldPos: e.oldPos + n, lastComponent: { count: 1, added: t, removed: r, previousComponent: o } };
  }, "addToPath"), extractCommon: /* @__PURE__ */ a(function(e, t, r, n) {
    for (var o = t.length, i = r.length, l = e.oldPos, u = l - n, c = 0; u + 1 < o && l + 1 < i && this.equals(t[u + 1], r[l + 1]); ) u++, l++,
    c++;
    return c && (e.lastComponent = { count: c, previousComponent: e.lastComponent }), e.oldPos = l, u;
  }, "extractCommon"), equals: /* @__PURE__ */ a(function(e, t) {
    return this.options.comparator ? this.options.comparator(e, t) : e === t || this.options.ignoreCase && e.toLowerCase() === t.toLowerCase();
  }, "equals"), removeEmpty: /* @__PURE__ */ a(function(e) {
    for (var t = [], r = 0; r < e.length; r++) e[r] && t.push(e[r]);
    return t;
  }, "removeEmpty"), castInput: /* @__PURE__ */ a(function(e) {
    return e;
  }, "castInput"), tokenize: /* @__PURE__ */ a(function(e) {
    return e.split("");
  }, "tokenize"), join: /* @__PURE__ */ a(function(e) {
    return e.join("");
  }, "join") };
  a(CS, "Su");
  B$ = new zt(), V2 = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/, W2 = /\S/, xm = new zt();
  xm.equals = function(e, t) {
    return this.options.ignoreCase && (e = e.toLowerCase(), t = t.toLowerCase()), e === t || this.options.ignoreWhitespace && !W2.test(e) &&
    !W2.test(t);
  };
  xm.tokenize = function(e) {
    for (var t = e.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/), r = 0; r < t.length - 1; r++) !t[r + 1] && t[r + 2] && V2.test(t[r]) && V2.test(
    t[r + 2]) && (t[r] += t[r + 2], t.splice(r + 1, 2), r--);
    return t;
  };
  Cm = new zt();
  Cm.tokenize = function(e) {
    this.options.stripTrailingCr && (e = e.replace(/\r\n/g, `
`));
    var t = [], r = e.split(/(\n|\r\n)/);
    r[r.length - 1] || r.pop();
    for (var n = 0; n < r.length; n++) {
      var o = r[n];
      n % 2 && !this.options.newlineIsToken ? t[t.length - 1] += o : (this.options.ignoreWhitespace && (o = o.trim()), t.push(o));
    }
    return t;
  };
  ES = new zt();
  ES.tokenize = function(e) {
    return e.split(/(\S.+?[.!?])(?=\s+|$)/);
  };
  RS = new zt();
  RS.tokenize = function(e) {
    return e.split(/([{}:;,]|\s+)/);
  };
  a(ll, "$e");
  SS = Object.prototype.toString, _a = new zt();
  _a.useLongestToken = !0;
  _a.tokenize = Cm.tokenize;
  _a.castInput = function(e) {
    var t = this.options, r = t.undefinedReplacement, n = t.stringifyReplacer, o = n === void 0 ? function(i, l) {
      return typeof l > "u" ? r : l;
    } : n;
    return typeof e == "string" ? e : JSON.stringify(Fc(e, null, null, o), o, "  ");
  };
  _a.equals = function(e, t) {
    return zt.prototype.equals.call(_a, e.replace(/,([\r\n])/g, "$1"), t.replace(/,([\r\n])/g, "$1"));
  };
  a(Fc, "Bt");
  cl = new zt();
  cl.tokenize = function(e) {
    return e.slice();
  };
  cl.join = cl.removeEmpty = function(e) {
    return e;
  };
  a(AS, "dr");
  a(FS, "Fr");
  a(Oc, "Be");
  a(Em, "wt");
  a(kS, "mr");
  qr = "string", Ht = "array", Ur = "cursor", Ot = "indent", Nt = "align", $t = "trim", Ve = "group", kt = "fill", Ye = "if-break", jt = "in\
dent-if-break", Vt = "line-suffix", Wt = "line-suffix-boundary", Se = "line", Lt = "label", nt = "break-parent", Rm = /* @__PURE__ */ new Set(
  [Ur, Ot, Nt, $t, Ve, kt, Ye, jt, Vt, Wt, Se, Lt, nt]);
  a(LS, "Lu");
  Gr = LS, TS = /* @__PURE__ */ a((e) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(e), "Pu");
  a(BS, "Iu");
  IS = (mo = class extends Error {
    name = "InvalidDocError";
    constructor(t) {
      super(BS(t)), this.doc = t;
    }
  }, a(mo, "xt"), mo), ko = IS, q2 = {};
  a(MS, "Ru");
  Nc = MS, Sm = /* @__PURE__ */ a(() => {
  }, "hr"), Ft = Sm, $c = Sm;
  a(pl, "De");
  a(Lo, "ae");
  a(Am, "_t");
  a(_S, "Cr");
  a(PS, "gr");
  a(HS, "yr");
  a(zS, "Ar");
  a(Fm, "Ge");
  a(OS, "Br");
  a(NS, "wr");
  a(kc, "xe");
  $S = { type: Wt }, gl = { type: nt }, jS = { type: $t }, jc = { type: Se, hard: !0 }, km = { type: Se, hard: !0, literal: !0 }, Lm = { type: Se },
  VS = { type: Se, soft: !0 }, Vr = [jc, gl], Tm = [km, gl], Lc = { type: Ur };
  a(Bm, "be");
  a(Im, "Je");
  a(WS, "br");
  a(Pt, "ee");
  a(qS, "Or");
  US = /* @__PURE__ */ a((e, t, r) => {
    if (!(e && t == null)) return Array.isArray(t) || typeof t == "string" ? t[r < 0 ? t.length + r : r] : t.at(r);
  }, "Yu"), ye = US, GS = /* @__PURE__ */ a(() => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC2\uDECE-\uDEDB\uDEE0-\uDEE8]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g,
  "Sr");
  a(YS, "Nr");
  a(XS, "Tr");
  KS = /* @__PURE__ */ a((e) => !(YS(e) || XS(e)), "kr"), ZS = /[^\x20-\x7F]/u;
  a(JS, "Hu");
  Vc = JS;
  a(vl, "Ne");
  a(Wc, "Xe");
  a(QS, "Wu");
  a(eA, "Ir");
  a(U2, "Lr");
  a(tA, "Rr");
  a(rA, "Mu");
  a(nA, "Yr");
  a(G2, "Pr");
  a(Ia, "Se");
  a(Mm, "Ze");
  a(oA, "$u");
  a(aA, "Vu");
  a(iA, "jr");
  a(lA, "Uu");
  a(sA, "Hr");
  a(_m, "Qe");
  je = Symbol("MODE_BREAK"), At = Symbol("MODE_FLAT"), Ma = Symbol("cursor");
  a(Pm, "Wr");
  a(uA, "zu");
  a(cA, "Gu");
  a(Tc, "bt");
  a(Bc, "Ot");
  a(il, "et");
  a(wl, "Fe");
  a(pA, "Ku");
  qc = pA, dA = (go = class {
    constructor(t) {
      wS(this, Nr), this.stack = [t];
    }
    get key() {
      let { stack: t, siblings: r } = this;
      return ye(!1, t, r === null ? -2 : -4) ?? null;
    }
    get index() {
      return this.siblings === null ? null : ye(!1, this.stack, -2);
    }
    get node() {
      return ye(!1, this.stack, -1);
    }
    get parent() {
      return this.getNode(1);
    }
    get grandparent() {
      return this.getNode(2);
    }
    get isInArray() {
      return this.siblings !== null;
    }
    get siblings() {
      let { stack: t } = this, r = ye(!1, t, -3);
      return Array.isArray(r) ? r : null;
    }
    get next() {
      let { siblings: t } = this;
      return t === null ? null : t[this.index + 1];
    }
    get previous() {
      let { siblings: t } = this;
      return t === null ? null : t[this.index - 1];
    }
    get isFirst() {
      return this.index === 0;
    }
    get isLast() {
      let { siblings: t, index: r } = this;
      return t !== null && r === t.length - 1;
    }
    get isRoot() {
      return this.stack.length === 1;
    }
    get root() {
      return this.stack[0];
    }
    get ancestors() {
      return [...Ba(this, Nr, sl).call(this)];
    }
    getName() {
      let { stack: t } = this, { length: r } = t;
      return r > 1 ? ye(!1, t, -2) : null;
    }
    getValue() {
      return ye(!1, this.stack, -1);
    }
    getNode(t = 0) {
      let r = Ba(this, Nr, Ic).call(this, t);
      return r === -1 ? null : this.stack[r];
    }
    getParentNode(t = 0) {
      return this.getNode(t + 1);
    }
    call(t, ...r) {
      let { stack: n } = this, { length: o } = n, i = ye(!1, n, -1);
      for (let l of r) i = i[l], n.push(l, i);
      try {
        return t(this);
      } finally {
        n.length = o;
      }
    }
    callParent(t, r = 0) {
      let n = Ba(this, Nr, Ic).call(this, r + 1), o = this.stack.splice(n + 1);
      try {
        return t(this);
      } finally {
        this.stack.push(...o);
      }
    }
    each(t, ...r) {
      let { stack: n } = this, { length: o } = n, i = ye(!1, n, -1);
      for (let l of r) i = i[l], n.push(l, i);
      try {
        for (let l = 0; l < i.length; ++l) n.push(l, i[l]), t(this, l, i), n.length -= 2;
      } finally {
        n.length = o;
      }
    }
    map(t, ...r) {
      let n = [];
      return this.each((o, i, l) => {
        n[i] = t(o, i, l);
      }, ...r), n;
    }
    match(...t) {
      let r = this.stack.length - 1, n = null, o = this.stack[r--];
      for (let i of t) {
        if (o === void 0) return !1;
        let l = null;
        if (typeof n == "number" && (l = n, n = this.stack[r--], o = this.stack[r--]), i && !i(o, n, l)) return !1;
        n = this.stack[r--], o = this.stack[r--];
      }
      return !0;
    }
    findAncestor(t) {
      for (let r of Ba(this, Nr, sl).call(this)) if (t(r)) return r;
    }
    hasAncestor(t) {
      for (let r of Ba(this, Nr, sl).call(this)) if (t(r)) return !0;
      return !1;
    }
  }, a(go, "St"), go);
  Nr = /* @__PURE__ */ new WeakSet(), Ic = /* @__PURE__ */ a(function(e) {
    let { stack: t } = this;
    for (let r = t.length - 1; r >= 0; r -= 2) if (!Array.isArray(t[r]) && --e < 0) return r;
    return -1;
  }, "Nt"), sl = /* @__PURE__ */ a(function* () {
    let { stack: e } = this;
    for (let t = e.length - 3; t >= 0; t -= 2) {
      let r = e[t];
      Array.isArray(r) || (yield r);
    }
  }, "tt");
  fA = dA, Hm = new Proxy(() => {
  }, { get: /* @__PURE__ */ a(() => Hm, "get") }), Mc = Hm;
  a(hA, "qu");
  mA = hA;
  a(zm, "Tt");
  a(gA, "Ur");
  a(Pa, "Ee");
  vA = Pa(/\s/u), sr = Pa(" 	"), Om = Pa(",; 	"), Nm = Pa(/[^\n\r]/u);
  a(wA, "Ju");
  Wr = wA;
  a(bA, "Xu");
  lr = bA;
  a(yA, "Zu");
  DA = yA, $m = /* @__PURE__ */ new Set(["tokens", "comments", "parent", "enclosingNode", "precedingNode", "followingNode"]), xA = /* @__PURE__ */ a(
  (e) => Object.keys(e).filter((t) => !$m.has(t)), "Qu");
  a(CA, "eo");
  bl = CA;
  a(EA, "to");
  a(Uc, "Lt");
  a(co, "ue");
  a($r, "re");
  a(po, "oe");
  xc = /* @__PURE__ */ new WeakMap();
  a(Gc, "ut");
  a(jm, "qr");
  Cc = /* @__PURE__ */ a(() => !1, "It");
  a(RA, "Jr");
  Vm = /* @__PURE__ */ a((e) => !/[\S\n\u2028\u2029]/u.test(e), "Xr");
  a(SA, "ro");
  a(AA, "no");
  a(Y2, "Kr");
  a(Ec, "Rt");
  a(FA, "uo");
  Yc = FA;
  a(Wm, "Zr");
  a(kA, "oo");
  a(LA, "io");
  a(TA, "so");
  a(BA, "Qr");
  a(IA, "en");
  a(MA, "ao");
  _A = MA, qm = (vo = class extends Error {
    name = "ConfigError";
  }, a(vo, "Pe"), vo), X2 = (wo = class extends Error {
    name = "UndefinedParserError";
  }, a(wo, "Ie"), wo), PA = { cursorOffset: { category: "Special", type: "int", default: -1, range: { start: -1, end: 1 / 0, step: 1 }, description: "\
Print (to stderr) where a cursor at the given position would move to after formatting.", cliCategory: "Editor" }, endOfLine: { category: "Gl\
obal", type: "choice", default: "lf", description: "Which end of line characters to apply.", choices: [{ value: "lf", description: "Line Fee\
d only (\\n), common on Linux and macOS as well as inside git repos" }, { value: "crlf", description: "Carriage Return + Line Feed character\
s (\\r\\n), common on Windows" }, { value: "cr", description: "Carriage Return character only (\\r), used very rarely" }, { value: "auto", description: `\
Maintain existing
(mixed values within one file are normalised by looking at what's used after the first line)` }] }, filepath: { category: "Special", type: "\
path", description: "Specify the input filepath. This will be used to do parser inference.", cliName: "stdin-filepath", cliCategory: "Other",
  cliDescription: "Path to the file to pretend that stdin comes from." }, insertPragma: { category: "Special", type: "boolean", default: !1,
  description: "Insert @format pragma into file's first docblock comment.", cliCategory: "Other" }, parser: { category: "Global", type: "cho\
ice", default: void 0, description: "Which parser to use.", exception: /* @__PURE__ */ a((e) => typeof e == "string" || typeof e == "functio\
n", "exception"), choices: [{ value: "flow", description: "Flow" }, { value: "babel", description: "JavaScript" }, { value: "babel-flow", description: "\
Flow" }, { value: "babel-ts", description: "TypeScript" }, { value: "typescript", description: "TypeScript" }, { value: "acorn", description: "\
JavaScript" }, { value: "espree", description: "JavaScript" }, { value: "meriyah", description: "JavaScript" }, { value: "css", description: "\
CSS" }, { value: "less", description: "Less" }, { value: "scss", description: "SCSS" }, { value: "json", description: "JSON" }, { value: "js\
on5", description: "JSON5" }, { value: "jsonc", description: "JSON with Comments" }, { value: "json-stringify", description: "JSON.stringify" },
  { value: "graphql", description: "GraphQL" }, { value: "markdown", description: "Markdown" }, { value: "mdx", description: "MDX" }, { value: "\
vue", description: "Vue" }, { value: "yaml", description: "YAML" }, { value: "glimmer", description: "Ember / Handlebars" }, { value: "html",
  description: "HTML" }, { value: "angular", description: "Angular" }, { value: "lwc", description: "Lightning Web Components" }] }, plugins: {
  type: "path", array: !0, default: [{ value: [] }], category: "Global", description: "Add a plugin. Multiple plugins can be passed as separ\
ate `--plugin`s.", exception: /* @__PURE__ */ a((e) => typeof e == "string" || typeof e == "object", "exception"), cliName: "plugin", cliCategory: "\
Config" }, printWidth: { category: "Global", type: "int", default: 80, description: "The line length where Prettier will try wrap.", range: {
  start: 0, end: 1 / 0, step: 1 } }, rangeEnd: { category: "Special", type: "int", default: 1 / 0, range: { start: 0, end: 1 / 0, step: 1 },
  description: `Format code ending at a given character offset (exclusive).
The range will extend forwards to the end of the selected statement.`, cliCategory: "Editor" }, rangeStart: { category: "Special", type: "in\
t", default: 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code starting at a given character offset.
The range will extend backwards to the start of the first line containing the selected statement.`, cliCategory: "Editor" }, requirePragma: {
  category: "Special", type: "boolean", default: !1, description: `Require either '@prettier' or '@format' to be present in the file's first\
 docblock comment
in order for it to be formatted.`, cliCategory: "Other" }, tabWidth: { type: "int", category: "Global", default: 2, description: "Number of \
spaces per indentation level.", range: { start: 0, end: 1 / 0, step: 1 } }, useTabs: { category: "Global", type: "boolean", default: !1, description: "\
Indent with tabs instead of spaces." }, embeddedLanguageFormatting: { category: "Global", type: "choice", default: "auto", description: "Con\
trol how Prettier formats quoted code embedded in the file.", choices: [{ value: "auto", description: "Format embedded code if Prettier can \
automatically identify it." }, { value: "off", description: "Never automatically format embedded code." }] } };
  a(Um, "ot");
  a(HA, "Do");
  a(zA, "lo");
  OA = /* @__PURE__ */ a((e) => String(e).split(/[/\\]/u).pop(), "co");
  a(K2, "nn");
  a(NA, "fo");
  a($A, "po");
  jA = $A, fo = { key: /* @__PURE__ */ a((e) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(e) ? e : JSON.stringify(e), "key"), value(e) {
    if (e === null || typeof e != "object") return JSON.stringify(e);
    if (Array.isArray(e)) return `[${e.map((r) => fo.value(r)).join(", ")}]`;
    let t = Object.keys(e);
    return t.length === 0 ? "{}" : `{ ${t.map((r) => `${fo.key(r)}: ${fo.value(e[r])}`).join(", ")} }`;
  }, pair: /* @__PURE__ */ a(({ key: e, value: t }) => fo.value({ [e]: t }), "pair") }, Z2 = hl(zc(), 1), VA = /* @__PURE__ */ a((e, t, { descriptor: r }) => {
    let n = [`${Z2.default.yellow(typeof e == "string" ? r.key(e) : r.pair(e))} is deprecated`];
    return t && n.push(`we now treat it as ${Z2.default.blue(typeof t == "string" ? r.key(t) : r.pair(t))}`), n.join("; ") + ".";
  }, "an"), ho = hl(zc(), 1), Gm = Symbol.for("vnopts.VALUE_NOT_EXIST"), ul = Symbol.for("vnopts.VALUE_UNCHANGED"), J2 = " ".repeat(2), WA =
  /* @__PURE__ */ a((e, t, r) => {
    let { text: n, list: o } = r.normalizeExpectedResult(r.schemas[e].expected(r)), i = [];
    return n && i.push(Q2(e, t, n, r.descriptor)), o && i.push([Q2(e, t, o.title, r.descriptor)].concat(o.values.map((l) => Ym(l, r.loggerPrintWidth))).
    join(`
`)), Xm(i, r.loggerPrintWidth);
  }, "cn");
  a(Q2, "ln");
  a(Ym, "fn");
  a(Xm, "pn");
  em = hl(zc(), 1), Rc = [], tm = [];
  a(qA, "Ht");
  Km = /* @__PURE__ */ a((e, t, { descriptor: r, logger: n, schemas: o }) => {
    let i = [`Ignored unknown option ${em.default.yellow(r.pair({ key: e, value: t }))}.`], l = Object.keys(o).sort().find((u) => qA(e, u) <
    3);
    l && i.push(`Did you mean ${em.default.blue(r.key(l))}?`), n.warn(i.join(" "));
  }, "at"), UA = ["default", "expected", "validate", "deprecated", "forward", "redirect", "overlap", "preprocess", "postprocess"];
  a(GA, "mo");
  ur = (bo = class {
    static create(t) {
      return GA(this, t);
    }
    constructor(t) {
      this.name = t.name;
    }
    default(t) {
    }
    expected(t) {
      return "nothing";
    }
    validate(t, r) {
      return !1;
    }
    deprecated(t, r) {
      return !1;
    }
    forward(t, r) {
    }
    redirect(t, r) {
    }
    overlap(t, r, n) {
      return t;
    }
    preprocess(t, r) {
      return t;
    }
    postprocess(t, r) {
      return ul;
    }
  }, a(bo, "O"), bo);
  a(YA, "Eo");
  XA = (yo = class extends ur {
    constructor(t) {
      super(t), this._sourceName = t.sourceName;
    }
    expected(t) {
      return t.schemas[this._sourceName].expected(t);
    }
    validate(t, r) {
      return r.schemas[this._sourceName].validate(t, r);
    }
    redirect(t, r) {
      return this._sourceName;
    }
  }, a(yo, "Dt"), yo), KA = (Do = class extends ur {
    expected() {
      return "anything";
    }
    validate() {
      return !0;
    }
  }, a(Do, "lt"), Do), ZA = (xo = class extends ur {
    constructor({ valueSchema: t, name: r = t.name, ...n }) {
      super({ ...n, name: r }), this._valueSchema = t;
    }
    expected(t) {
      let { text: r, list: n } = t.normalizeExpectedResult(this._valueSchema.expected(t));
      return { text: r && `an array of ${r}`, list: n && { title: "an array of the following values", values: [{ list: n }] } };
    }
    validate(t, r) {
      if (!Array.isArray(t)) return !1;
      let n = [];
      for (let o of t) {
        let i = r.normalizeValidateResult(this._valueSchema.validate(o, r), o);
        i !== !0 && n.push(i.value);
      }
      return n.length === 0 ? !0 : { value: n };
    }
    deprecated(t, r) {
      let n = [];
      for (let o of t) {
        let i = r.normalizeDeprecatedResult(this._valueSchema.deprecated(o, r), o);
        i !== !1 && n.push(...i.map(({ value: l }) => ({ value: [l] })));
      }
      return n;
    }
    forward(t, r) {
      let n = [];
      for (let o of t) {
        let i = r.normalizeForwardResult(this._valueSchema.forward(o, r), o);
        n.push(...i.map(rm));
      }
      return n;
    }
    redirect(t, r) {
      let n = [], o = [];
      for (let i of t) {
        let l = r.normalizeRedirectResult(this._valueSchema.redirect(i, r), i);
        "remain" in l && n.push(l.remain), o.push(...l.redirect.map(rm));
      }
      return n.length === 0 ? { redirect: o } : { redirect: o, remain: n };
    }
    overlap(t, r) {
      return t.concat(r);
    }
  }, a(xo, "ct"), xo);
  a(rm, "Fn");
  JA = (Co = class extends ur {
    expected() {
      return "true or false";
    }
    validate(t) {
      return typeof t == "boolean";
    }
  }, a(Co, "ft"), Co);
  a(QA, "En");
  a(eF, "hn");
  a(tF, "Cn");
  a(rF, "gn");
  a(nF, "yn");
  a(oF, "An");
  a(aF, "Bn");
  a(nm, "Mt");
  a(Zm, "$t");
  a(om, "Vt");
  a(am, "Ut");
  a(im, "mn");
  a(_c, "pt");
  a(lm, "zt");
  a(iF, "ho");
  lF = (Eo = class extends ur {
    constructor(t) {
      super(t), this._choices = eF(t.choices.map((r) => r && typeof r == "object" ? r : { value: r }), "value");
    }
    expected({ descriptor: t }) {
      let r = Array.from(this._choices.keys()).map((i) => this._choices.get(i)).filter(({ hidden: i }) => !i).map((i) => i.value).sort(oF).map(
      t.value), n = r.slice(0, -2), o = r.slice(-2);
      return { text: n.concat(o.join(" or ")).join(", "), list: { title: "one of the following values", values: r } };
    }
    validate(t) {
      return this._choices.has(t);
    }
    deprecated(t) {
      let r = this._choices.get(t);
      return r && r.deprecated ? { value: t } : !1;
    }
    forward(t) {
      let r = this._choices.get(t);
      return r ? r.forward : void 0;
    }
    redirect(t) {
      let r = this._choices.get(t);
      return r ? r.redirect : void 0;
    }
  }, a(Eo, "dt"), Eo), sF = (Ro = class extends ur {
    expected() {
      return "a number";
    }
    validate(t, r) {
      return typeof t == "number";
    }
  }, a(Ro, "Ft"), Ro), uF = (So = class extends sF {
    expected() {
      return "an integer";
    }
    validate(t, r) {
      return r.normalizeValidateResult(super.validate(t, r), t) === !0 && nF(t);
    }
  }, a(So, "mt"), So), sm = (Ao = class extends ur {
    expected() {
      return "a string";
    }
    validate(t) {
      return typeof t == "string";
    }
  }, a(Ao, "Re"), Ao), cF = fo, pF = Km, dF = WA, fF = VA, hF = (Fo = class {
    constructor(t, r) {
      let { logger: n = console, loggerPrintWidth: o = 80, descriptor: i = cF, unknown: l = pF, invalid: u = dF, deprecated: c = fF, missing: p = /* @__PURE__ */ a(
      () => !1, "D"), required: d = /* @__PURE__ */ a(() => !1, "l"), preprocess: h = /* @__PURE__ */ a((v) => v, "d"), postprocess: f = /* @__PURE__ */ a(
      () => ul, "f") } = r || {};
      this._utils = { descriptor: i, logger: n || { warn: /* @__PURE__ */ a(() => {
      }, "warn") }, loggerPrintWidth: o, schemas: QA(t, "name"), normalizeDefaultResult: nm, normalizeExpectedResult: Zm, normalizeDeprecatedResult: am,
      normalizeForwardResult: _c, normalizeRedirectResult: lm, normalizeValidateResult: om }, this._unknownHandler = l, this._invalidHandler =
      aF(u), this._deprecatedHandler = c, this._identifyMissing = (v, b) => !(v in b) || p(v, b), this._identifyRequired = d, this._preprocess =
      h, this._postprocess = f, this.cleanHistory();
    }
    cleanHistory() {
      this._hasDeprecationWarned = tF();
    }
    normalize(t) {
      let r = {}, n = [this._preprocess(t, this._utils)], o = /* @__PURE__ */ a(() => {
        for (; n.length !== 0; ) {
          let i = n.shift(), l = this._applyNormalization(i, r);
          n.push(...l);
        }
      }, "u");
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        let l = this._utils.schemas[i];
        if (!(i in r)) {
          let u = nm(l.default(this._utils));
          "value" in u && n.push({ [i]: u.value });
        }
      }
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        if (!(i in r)) continue;
        let l = this._utils.schemas[i], u = r[i], c = l.postprocess(u, this._utils);
        c !== ul && (this._applyValidation(c, i, l), r[i] = c);
      }
      return this._applyPostprocess(r), this._applyRequiredCheck(r), r;
    }
    _applyNormalization(t, r) {
      let n = [], { knownKeys: o, unknownKeys: i } = this._partitionOptionKeys(t);
      for (let l of o) {
        let u = this._utils.schemas[l], c = u.preprocess(t[l], this._utils);
        this._applyValidation(c, l, u);
        let p = /* @__PURE__ */ a(({ from: f, to: v }) => {
          n.push(typeof v == "string" ? { [v]: f } : { [v.key]: v.value });
        }, "D"), d = /* @__PURE__ */ a(({ value: f, redirectTo: v }) => {
          let b = am(u.deprecated(f, this._utils), c, !0);
          if (b !== !1) if (b === !0) this._hasDeprecationWarned(l) || this._utils.logger.warn(this._deprecatedHandler(l, v, this._utils));
          else for (let { value: m } of b) {
            let g = { key: l, value: m };
            if (!this._hasDeprecationWarned(g)) {
              let y = typeof v == "string" ? { key: v, value: m } : v;
              this._utils.logger.warn(this._deprecatedHandler(g, y, this._utils));
            }
          }
        }, "l");
        _c(u.forward(c, this._utils), c).forEach(p);
        let h = lm(u.redirect(c, this._utils), c);
        if (h.redirect.forEach(p), "remain" in h) {
          let f = h.remain;
          r[l] = l in r ? u.overlap(r[l], f, this._utils) : f, d({ value: f });
        }
        for (let { from: f, to: v } of h.redirect) d({ value: f, redirectTo: v });
      }
      for (let l of i) {
        let u = t[l];
        this._applyUnknownHandler(l, u, r, (c, p) => {
          n.push({ [c]: p });
        });
      }
      return n;
    }
    _applyRequiredCheck(t) {
      for (let r of Object.keys(this._utils.schemas)) if (this._identifyMissing(r, t) && this._identifyRequired(r)) throw this._invalidHandler(
      r, Gm, this._utils);
    }
    _partitionOptionKeys(t) {
      let [r, n] = rF(Object.keys(t).filter((o) => !this._identifyMissing(o, t)), (o) => o in this._utils.schemas);
      return { knownKeys: r, unknownKeys: n };
    }
    _applyValidation(t, r, n) {
      let o = om(n.validate(t, this._utils), t);
      if (o !== !0) throw this._invalidHandler(r, o.value, this._utils);
    }
    _applyUnknownHandler(t, r, n, o) {
      let i = this._unknownHandler(t, r, this._utils);
      if (i) for (let l of Object.keys(i)) {
        if (this._identifyMissing(l, i)) continue;
        let u = i[l];
        l in this._utils.schemas ? o(l, u) : n[l] = u;
      }
    }
    _applyPostprocess(t) {
      let r = this._postprocess(t, this._utils);
      if (r !== ul) {
        if (r.delete) for (let n of r.delete) delete t[n];
        if (r.override) {
          let { knownKeys: n, unknownKeys: o } = this._partitionOptionKeys(r.override);
          for (let i of n) {
            let l = r.override[i];
            this._applyValidation(l, i, this._utils.schemas[i]), t[i] = l;
          }
          for (let i of o) {
            let l = r.override[i];
            this._applyUnknownHandler(i, l, t, (u, c) => {
              let p = this._utils.schemas[u];
              this._applyValidation(c, u, p), t[u] = c;
            });
          }
        }
      }
    }
  }, a(Fo, "Et"), Fo);
  a(mF, "go");
  a(gF, "yo");
  a(vF, "Ao");
  wF = mF, bF = /* @__PURE__ */ a((e, t, r) => {
    if (!(e && t == null)) {
      if (t.findLast) return t.findLast(r);
      for (let n = t.length - 1; n >= 0; n--) {
        let o = t[n];
        if (r(o, n, t)) return o;
      }
    }
  }, "Bo"), Jm = bF;
  a(Qm, "qt");
  a(yF, "On");
  a(eg, "ht");
  a(tg, "Jt");
  a(DF, "Sn");
  um = { astFormat: "estree", printer: {}, originalText: void 0, locStart: null, locEnd: null };
  a(xF, "wo");
  To = xF, CF = hl(DS(), 1);
  a(EF, "ko");
  a(RF, "Lo");
  Ha = EF;
  a(SF, "Un");
  a(AF, "Po");
  a(FF, "Io");
  kF = FF;
  a(yl, "Ye");
  a(cm, "Gn");
  a(rg, "Qt");
  a(LF, "Ro");
  TF = LF;
  a(BF, "Yo");
  IF = BF, MF = /* @__PURE__ */ a((e, t, r) => {
    if (!(e && t == null)) {
      if (t.findLastIndex) return t.findLastIndex(r);
      for (let n = t.length - 1; n >= 0; n--) {
        let o = t[n];
        if (r(o, n, t)) return n;
      }
      return -1;
    }
  }, "jo"), _F = MF, PF = /* @__PURE__ */ a(({ parser: e }) => e === "json" || e === "json5" || e === "jsonc" || e === "json-stringify", "Ho");
  a(HF, "Wo");
  a(pm, "Xn");
  a(zF, "Mo");
  a(Pc, "er");
  a(OF, "$o");
  ng = /* @__PURE__ */ new Set(["JsonRoot", "ObjectExpression", "ArrayExpression", "StringLiteral", "NumericLiteral", "BooleanLiteral", "Nul\
lLiteral", "UnaryExpression", "TemplateLiteral"]), NF = /* @__PURE__ */ new Set(["OperationDefinition", "FragmentDefinition", "VariableDefin\
ition", "TypeExtensionDefinition", "ObjectTypeDefinition", "FieldDefinition", "DirectiveDefinition", "EnumTypeDefinition", "EnumValueDefinit\
ion", "InputValueDefinition", "InputObjectTypeDefinition", "SchemaDefinition", "OperationTypeDefinition", "InterfaceTypeDefinition", "UnionT\
ypeDefinition", "ScalarTypeDefinition"]);
  a(dm, "Zn");
  a($F, "eu");
  og = "\uFEFF", fm = Symbol("cursor");
  a(ag, "ou");
  a(jF, "Uo");
  a(Ac, "tr");
  a(hm, "ru");
  a(ig, "iu");
  a(mm, "nu");
  a(lg, "rr");
  a(VF, "su");
  a(WF, "au");
  a(qF, "Du");
  a(UF, "lu");
  a(GF, "cu");
  sg = {};
  fl(sg, { builders: /* @__PURE__ */ a(() => YF, "builders"), printer: /* @__PURE__ */ a(() => XF, "printer"), utils: /* @__PURE__ */ a(() => KF,
  "utils") });
  YF = { join: Bm, line: Lm, softline: VS, hardline: Vr, literalline: Tm, group: Am, conditionalGroup: zS, fill: Fm, lineSuffix: kc, lineSuffixBoundary: $S,
  cursor: Lc, breakParent: gl, ifBreak: OS, trim: jS, indent: pl, indentIfBreak: NS, align: Lo, addAlignmentToDoc: Im, markAsRoot: PS, dedentToRoot: _S,
  dedent: HS, hardlineWithoutBreakParent: jc, literallineWithoutBreakParent: km, label: WS, concat: /* @__PURE__ */ a((e) => e, "concat") },
  XF = { printDocToString: wl }, KF = { willBreak: eA, traverseDoc: Nc, findInDoc: Wc, mapDoc: vl, removeLines: nA, stripTrailingHardline: Mm,
  replaceEndOfLine: iA, canBreak: sA }, ZF = "3.3.3", ug = {};
  fl(ug, { addDanglingComment: /* @__PURE__ */ a(() => $r, "addDanglingComment"), addLeadingComment: /* @__PURE__ */ a(() => co, "addLeading\
Comment"), addTrailingComment: /* @__PURE__ */ a(() => po, "addTrailingComment"), getAlignmentSize: /* @__PURE__ */ a(() => qc, "getAlignmen\
tSize"), getIndentSize: /* @__PURE__ */ a(() => nk, "getIndentSize"), getMaxContinuousCount: /* @__PURE__ */ a(() => ik, "getMaxContinuousCo\
unt"), getNextNonSpaceNonCommentCharacter: /* @__PURE__ */ a(() => sk, "getNextNonSpaceNonCommentCharacter"), getNextNonSpaceNonCommentCharacterIndex: /* @__PURE__ */ a(
  () => gk, "getNextNonSpaceNonCommentCharacterIndex"), getStringWidth: /* @__PURE__ */ a(() => Vc, "getStringWidth"), hasNewline: /* @__PURE__ */ a(
  () => lr, "hasNewline"), hasNewlineInRange: /* @__PURE__ */ a(() => ck, "hasNewlineInRange"), hasSpaces: /* @__PURE__ */ a(() => dk, "hasS\
paces"), isNextLineEmpty: /* @__PURE__ */ a(() => yk, "isNextLineEmpty"), isNextLineEmptyAfterIndex: /* @__PURE__ */ a(() => Jc, "isNextLine\
EmptyAfterIndex"), isPreviousLineEmpty: /* @__PURE__ */ a(() => wk, "isPreviousLineEmpty"), makeString: /* @__PURE__ */ a(() => hk, "makeStr\
ing"), skip: /* @__PURE__ */ a(() => Pa, "skip"), skipEverythingButNewLine: /* @__PURE__ */ a(() => Nm, "skipEverythingButNewLine"), skipInlineComment: /* @__PURE__ */ a(
  () => Xc, "skipInlineComment"), skipNewline: /* @__PURE__ */ a(() => Wr, "skipNewline"), skipSpaces: /* @__PURE__ */ a(() => sr, "skipSpac\
es"), skipToLineEnd: /* @__PURE__ */ a(() => Om, "skipToLineEnd"), skipTrailingComment: /* @__PURE__ */ a(() => Kc, "skipTrailingComment"), skipWhitespace: /* @__PURE__ */ a(
  () => vA, "skipWhitespace") });
  a(JF, "Jo");
  Xc = JF;
  a(QF, "Xo");
  Kc = QF;
  a(ek, "Zo");
  Zc = ek;
  a(tk, "Qo");
  Jc = tk;
  a(rk, "ei");
  nk = rk;
  a(ok, "ur");
  a(ak, "ti");
  ik = ak;
  a(lk, "ri");
  sk = lk;
  a(uk, "ni");
  ck = uk;
  a(pk, "ui");
  dk = pk;
  a(fk, "oi");
  hk = fk;
  a(mk, "ii");
  a(gk, "si");
  a(vk, "ai");
  a(wk, "Di");
  a(bk, "li");
  a(yk, "ci");
  a(jr, "fe");
  cg = jr(lg);
  a(pg, "gu");
  a(Dk, "fi");
  xk = jr(Um, 0), Ck = { parse: jr(VF), formatAST: jr(WF), formatDoc: jr(qF), printToDoc: jr(UF), printDocToString: jr(GF) }, dg = Dm;
});

// ../node_modules/ts-dedent/esm/index.js
function hg(e) {
  for (var t = [], r = 1; r < arguments.length; r++)
    t[r - 1] = arguments[r];
  var n = Array.from(typeof e == "string" ? [e] : e);
  n[n.length - 1] = n[n.length - 1].replace(/\r?\n([\t ]*)$/, "");
  var o = n.reduce(function(u, c) {
    var p = c.match(/\n([\t ]+|(?!\s).)/g);
    return p ? u.concat(p.map(function(d) {
      var h, f;
      return (f = (h = d.match(/[\t ]/g)) === null || h === void 0 ? void 0 : h.length) !== null && f !== void 0 ? f : 0;
    })) : u;
  }, []);
  if (o.length) {
    var i = new RegExp(`
[	 ]{` + Math.min.apply(Math, o) + "}", "g");
    n = n.map(function(u) {
      return u.replace(i, `
`);
    });
  }
  n[0] = n[0].replace(/^\r?\n/, "");
  var l = n[0];
  return t.forEach(function(u, c) {
    var p = l.match(/(?:^|\n)( *)$/), d = p ? p[1] : "", h = u;
    typeof u == "string" && u.includes(`
`) && (h = String(u).split(`
`).map(function(f, v) {
      return v === 0 ? f : "" + d + f;
    }).join(`
`)), l += h + n[c + 1];
  }), l;
}
var mg = A(() => {
  a(hg, "dedent");
});

// src/components/components/syntaxhighlighter/formatter.ts
var vg = {};
dn(vg, {
  formatter: () => Ek
});
var gg, Ek, wg = A(() => {
  "use strict";
  gg = Ee(la(), 1);
  j2();
  fg();
  mg();
  Ek = (0, gg.default)(2)(async (e, t) => e === !1 ? t : e === "dedent" || e === !0 ? hg(t) : (await dg.format(t, {
    parser: e,
    plugins: [$2],
    htmlWhitespaceSensitivity: "ignore"
  })).trim());
});

// ../node_modules/react-popper/lib/esm/utils.js
import * as Hl from "react";
var n1, o1, Gv = A(() => {
  n1 = /* @__PURE__ */ a(function(t) {
    return t.reduce(function(r, n) {
      var o = n[0], i = n[1];
      return r[o] = i, r;
    }, {});
  }, "fromEntries"), o1 = typeof window < "u" && window.document && window.document.createElement ? Hl.useLayoutEffect : Hl.useEffect;
});

// ../node_modules/@popperjs/core/lib/enums.js
var oe, he, ce, ie, zl, fr, Ut, en, Yv, Ol, $o, Xv, a1, Nl, XT, KT, ZT, JT, QT, eB, tB, rB, nB, Kv, Xe = A(() => {
  oe = "top", he = "bottom", ce = "right", ie = "left", zl = "auto", fr = [oe, he, ce, ie], Ut = "start", en = "end", Yv = "clippingParents",
  Ol = "viewport", $o = "popper", Xv = "reference", a1 = /* @__PURE__ */ fr.reduce(function(e, t) {
    return e.concat([t + "-" + Ut, t + "-" + en]);
  }, []), Nl = /* @__PURE__ */ [].concat(fr, [zl]).reduce(function(e, t) {
    return e.concat([t, t + "-" + Ut, t + "-" + en]);
  }, []), XT = "beforeRead", KT = "read", ZT = "afterRead", JT = "beforeMain", QT = "main", eB = "afterMain", tB = "beforeWrite", rB = "writ\
e", nB = "afterWrite", Kv = [XT, KT, ZT, JT, QT, eB, tB, rB, nB];
});

// ../node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
function De(e) {
  return e ? (e.nodeName || "").toLowerCase() : null;
}
var hr = A(() => {
  a(De, "getNodeName");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getWindow.js
function ee(e) {
  if (e == null)
    return window;
  if (e.toString() !== "[object Window]") {
    var t = e.ownerDocument;
    return t && t.defaultView || window;
  }
  return e;
}
var gt = A(() => {
  a(ee, "getWindow");
});

// ../node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
function it(e) {
  var t = ee(e).Element;
  return e instanceof t || e instanceof Element;
}
function me(e) {
  var t = ee(e).HTMLElement;
  return e instanceof t || e instanceof HTMLElement;
}
function jo(e) {
  if (typeof ShadowRoot > "u")
    return !1;
  var t = ee(e).ShadowRoot;
  return e instanceof t || e instanceof ShadowRoot;
}
var Ke = A(() => {
  gt();
  a(it, "isElement");
  a(me, "isHTMLElement");
  a(jo, "isShadowRoot");
});

// ../node_modules/@popperjs/core/lib/modifiers/applyStyles.js
function oB(e) {
  var t = e.state;
  Object.keys(t.elements).forEach(function(r) {
    var n = t.styles[r] || {}, o = t.attributes[r] || {}, i = t.elements[r];
    !me(i) || !De(i) || (Object.assign(i.style, n), Object.keys(o).forEach(function(l) {
      var u = o[l];
      u === !1 ? i.removeAttribute(l) : i.setAttribute(l, u === !0 ? "" : u);
    }));
  });
}
function aB(e) {
  var t = e.state, r = {
    popper: {
      position: t.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  return Object.assign(t.elements.popper.style, r.popper), t.styles = r, t.elements.arrow && Object.assign(t.elements.arrow.style, r.arrow),
  function() {
    Object.keys(t.elements).forEach(function(n) {
      var o = t.elements[n], i = t.attributes[n] || {}, l = Object.keys(t.styles.hasOwnProperty(n) ? t.styles[n] : r[n]), u = l.reduce(function(c, p) {
        return c[p] = "", c;
      }, {});
      !me(o) || !De(o) || (Object.assign(o.style, u), Object.keys(i).forEach(function(c) {
        o.removeAttribute(c);
      }));
    });
  };
}
var Zv, Jv = A(() => {
  hr();
  Ke();
  a(oB, "applyStyles");
  a(aB, "effect");
  Zv = {
    name: "applyStyles",
    enabled: !0,
    phase: "write",
    fn: oB,
    effect: aB,
    requires: ["computeStyles"]
  };
});

// ../node_modules/@popperjs/core/lib/utils/getBasePlacement.js
function xe(e) {
  return e.split("-")[0];
}
var mr = A(() => {
  a(xe, "getBasePlacement");
});

// ../node_modules/@popperjs/core/lib/utils/math.js
var vt, tn, Gt, gr = A(() => {
  vt = Math.max, tn = Math.min, Gt = Math.round;
});

// ../node_modules/@popperjs/core/lib/utils/userAgent.js
function Vo() {
  var e = navigator.userAgentData;
  return e != null && e.brands && Array.isArray(e.brands) ? e.brands.map(function(t) {
    return t.brand + "/" + t.version;
  }).join(" ") : navigator.userAgent;
}
var i1 = A(() => {
  a(Vo, "getUAString");
});

// ../node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
function ja() {
  return !/^((?!chrome|android).)*safari/i.test(Vo());
}
var l1 = A(() => {
  i1();
  a(ja, "isLayoutViewport");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
function lt(e, t, r) {
  t === void 0 && (t = !1), r === void 0 && (r = !1);
  var n = e.getBoundingClientRect(), o = 1, i = 1;
  t && me(e) && (o = e.offsetWidth > 0 && Gt(n.width) / e.offsetWidth || 1, i = e.offsetHeight > 0 && Gt(n.height) / e.offsetHeight || 1);
  var l = it(e) ? ee(e) : window, u = l.visualViewport, c = !ja() && r, p = (n.left + (c && u ? u.offsetLeft : 0)) / o, d = (n.top + (c && u ?
  u.offsetTop : 0)) / i, h = n.width / o, f = n.height / i;
  return {
    width: h,
    height: f,
    top: d,
    right: p + h,
    bottom: d + f,
    left: p,
    x: p,
    y: d
  };
}
var Wo = A(() => {
  Ke();
  gr();
  gt();
  l1();
  a(lt, "getBoundingClientRect");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
function rn(e) {
  var t = lt(e), r = e.offsetWidth, n = e.offsetHeight;
  return Math.abs(t.width - r) <= 1 && (r = t.width), Math.abs(t.height - n) <= 1 && (n = t.height), {
    x: e.offsetLeft,
    y: e.offsetTop,
    width: r,
    height: n
  };
}
var $l = A(() => {
  Wo();
  a(rn, "getLayoutRect");
});

// ../node_modules/@popperjs/core/lib/dom-utils/contains.js
function Va(e, t) {
  var r = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (r && jo(r)) {
    var n = t;
    do {
      if (n && e.isSameNode(n))
        return !0;
      n = n.parentNode || n.host;
    } while (n);
  }
  return !1;
}
var s1 = A(() => {
  Ke();
  a(Va, "contains");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
function _e(e) {
  return ee(e).getComputedStyle(e);
}
var qo = A(() => {
  gt();
  a(_e, "getComputedStyle");
});

// ../node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
function u1(e) {
  return ["table", "td", "th"].indexOf(De(e)) >= 0;
}
var Qv = A(() => {
  hr();
  a(u1, "isTableElement");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
function Ae(e) {
  return ((it(e) ? e.ownerDocument : (
    // $FlowFixMe[prop-missing]
    e.document
  )) || window.document).documentElement;
}
var Yt = A(() => {
  Ke();
  a(Ae, "getDocumentElement");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
function Xt(e) {
  return De(e) === "html" ? e : (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    e.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    e.parentNode || // DOM Element detected
    (jo(e) ? e.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    Ae(e)
  );
}
var Wa = A(() => {
  hr();
  Yt();
  Ke();
  a(Xt, "getParentNode");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
function e3(e) {
  return !me(e) || // https://github.com/popperjs/popper-core/issues/837
  _e(e).position === "fixed" ? null : e.offsetParent;
}
function iB(e) {
  var t = /firefox/i.test(Vo()), r = /Trident/i.test(Vo());
  if (r && me(e)) {
    var n = _e(e);
    if (n.position === "fixed")
      return null;
  }
  var o = Xt(e);
  for (jo(o) && (o = o.host); me(o) && ["html", "body"].indexOf(De(o)) < 0; ) {
    var i = _e(o);
    if (i.transform !== "none" || i.perspective !== "none" || i.contain === "paint" || ["transform", "perspective"].indexOf(i.willChange) !==
    -1 || t && i.willChange === "filter" || t && i.filter && i.filter !== "none")
      return o;
    o = o.parentNode;
  }
  return null;
}
function wt(e) {
  for (var t = ee(e), r = e3(e); r && u1(r) && _e(r).position === "static"; )
    r = e3(r);
  return r && (De(r) === "html" || De(r) === "body" && _e(r).position === "static") ? t : r || iB(e) || t;
}
var Uo = A(() => {
  gt();
  hr();
  qo();
  Ke();
  Qv();
  Wa();
  i1();
  a(e3, "getTrueOffsetParent");
  a(iB, "getContainingBlock");
  a(wt, "getOffsetParent");
});

// ../node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
function nn(e) {
  return ["top", "bottom"].indexOf(e) >= 0 ? "x" : "y";
}
var jl = A(() => {
  a(nn, "getMainAxisFromPlacement");
});

// ../node_modules/@popperjs/core/lib/utils/within.js
function on(e, t, r) {
  return vt(e, tn(t, r));
}
function t3(e, t, r) {
  var n = on(e, t, r);
  return n > r ? r : n;
}
var c1 = A(() => {
  gr();
  a(on, "within");
  a(t3, "withinMaxClamp");
});

// ../node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
function qa() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
var p1 = A(() => {
  a(qa, "getFreshSideObject");
});

// ../node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
function Ua(e) {
  return Object.assign({}, qa(), e);
}
var d1 = A(() => {
  p1();
  a(Ua, "mergePaddingObject");
});

// ../node_modules/@popperjs/core/lib/utils/expandToHashMap.js
function Ga(e, t) {
  return t.reduce(function(r, n) {
    return r[n] = e, r;
  }, {});
}
var f1 = A(() => {
  a(Ga, "expandToHashMap");
});

// ../node_modules/@popperjs/core/lib/modifiers/arrow.js
function sB(e) {
  var t, r = e.state, n = e.name, o = e.options, i = r.elements.arrow, l = r.modifiersData.popperOffsets, u = xe(r.placement), c = nn(u), p = [
  ie, ce].indexOf(u) >= 0, d = p ? "height" : "width";
  if (!(!i || !l)) {
    var h = lB(o.padding, r), f = rn(i), v = c === "y" ? oe : ie, b = c === "y" ? he : ce, m = r.rects.reference[d] + r.rects.reference[c] -
    l[c] - r.rects.popper[d], g = l[c] - r.rects.reference[c], y = wt(i), w = y ? c === "y" ? y.clientHeight || 0 : y.clientWidth || 0 : 0, D = m /
    2 - g / 2, x = h[v], C = w - f[d] - h[b], E = w / 2 - f[d] / 2 + D, R = on(x, E, C), F = c;
    r.modifiersData[n] = (t = {}, t[F] = R, t.centerOffset = R - E, t);
  }
}
function uB(e) {
  var t = e.state, r = e.options, n = r.element, o = n === void 0 ? "[data-popper-arrow]" : n;
  o != null && (typeof o == "string" && (o = t.elements.popper.querySelector(o), !o) || Va(t.elements.popper, o) && (t.elements.arrow = o));
}
var lB, r3, n3 = A(() => {
  mr();
  $l();
  s1();
  Uo();
  jl();
  c1();
  d1();
  f1();
  Xe();
  lB = /* @__PURE__ */ a(function(t, r) {
    return t = typeof t == "function" ? t(Object.assign({}, r.rects, {
      placement: r.placement
    })) : t, Ua(typeof t != "number" ? t : Ga(t, fr));
  }, "toPaddingObject");
  a(sB, "arrow");
  a(uB, "effect");
  r3 = {
    name: "arrow",
    enabled: !0,
    phase: "main",
    fn: sB,
    effect: uB,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };
});

// ../node_modules/@popperjs/core/lib/utils/getVariation.js
function st(e) {
  return e.split("-")[1];
}
var Go = A(() => {
  a(st, "getVariation");
});

// ../node_modules/@popperjs/core/lib/modifiers/computeStyles.js
function pB(e, t) {
  var r = e.x, n = e.y, o = t.devicePixelRatio || 1;
  return {
    x: Gt(r * o) / o || 0,
    y: Gt(n * o) / o || 0
  };
}
function o3(e) {
  var t, r = e.popper, n = e.popperRect, o = e.placement, i = e.variation, l = e.offsets, u = e.position, c = e.gpuAcceleration, p = e.adaptive,
  d = e.roundOffsets, h = e.isFixed, f = l.x, v = f === void 0 ? 0 : f, b = l.y, m = b === void 0 ? 0 : b, g = typeof d == "function" ? d({
    x: v,
    y: m
  }) : {
    x: v,
    y: m
  };
  v = g.x, m = g.y;
  var y = l.hasOwnProperty("x"), w = l.hasOwnProperty("y"), D = ie, x = oe, C = window;
  if (p) {
    var E = wt(r), R = "clientHeight", F = "clientWidth";
    if (E === ee(r) && (E = Ae(r), _e(E).position !== "static" && u === "absolute" && (R = "scrollHeight", F = "scrollWidth")), E = E, o ===
    oe || (o === ie || o === ce) && i === en) {
      x = he;
      var S = h && E === C && C.visualViewport ? C.visualViewport.height : (
        // $FlowFixMe[prop-missing]
        E[R]
      );
      m -= S - n.height, m *= c ? 1 : -1;
    }
    if (o === ie || (o === oe || o === he) && i === en) {
      D = ce;
      var k = h && E === C && C.visualViewport ? C.visualViewport.width : (
        // $FlowFixMe[prop-missing]
        E[F]
      );
      v -= k - n.width, v *= c ? 1 : -1;
    }
  }
  var I = Object.assign({
    position: u
  }, p && cB), H = d === !0 ? pB({
    x: v,
    y: m
  }, ee(r)) : {
    x: v,
    y: m
  };
  if (v = H.x, m = H.y, c) {
    var M;
    return Object.assign({}, I, (M = {}, M[x] = w ? "0" : "", M[D] = y ? "0" : "", M.transform = (C.devicePixelRatio || 1) <= 1 ? "translate\
(" + v + "px, " + m + "px)" : "translate3d(" + v + "px, " + m + "px, 0)", M));
  }
  return Object.assign({}, I, (t = {}, t[x] = w ? m + "px" : "", t[D] = y ? v + "px" : "", t.transform = "", t));
}
function dB(e) {
  var t = e.state, r = e.options, n = r.gpuAcceleration, o = n === void 0 ? !0 : n, i = r.adaptive, l = i === void 0 ? !0 : i, u = r.roundOffsets,
  c = u === void 0 ? !0 : u, p = {
    placement: xe(t.placement),
    variation: st(t.placement),
    popper: t.elements.popper,
    popperRect: t.rects.popper,
    gpuAcceleration: o,
    isFixed: t.options.strategy === "fixed"
  };
  t.modifiersData.popperOffsets != null && (t.styles.popper = Object.assign({}, t.styles.popper, o3(Object.assign({}, p, {
    offsets: t.modifiersData.popperOffsets,
    position: t.options.strategy,
    adaptive: l,
    roundOffsets: c
  })))), t.modifiersData.arrow != null && (t.styles.arrow = Object.assign({}, t.styles.arrow, o3(Object.assign({}, p, {
    offsets: t.modifiersData.arrow,
    position: "absolute",
    adaptive: !1,
    roundOffsets: c
  })))), t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-placement": t.placement
  });
}
var cB, a3, i3 = A(() => {
  Xe();
  Uo();
  gt();
  Yt();
  qo();
  mr();
  Go();
  gr();
  cB = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  a(pB, "roundOffsetsByDPR");
  a(o3, "mapToStyles");
  a(dB, "computeStyles");
  a3 = {
    name: "computeStyles",
    enabled: !0,
    phase: "beforeWrite",
    fn: dB,
    data: {}
  };
});

// ../node_modules/@popperjs/core/lib/modifiers/eventListeners.js
function fB(e) {
  var t = e.state, r = e.instance, n = e.options, o = n.scroll, i = o === void 0 ? !0 : o, l = n.resize, u = l === void 0 ? !0 : l, c = ee(t.
  elements.popper), p = [].concat(t.scrollParents.reference, t.scrollParents.popper);
  return i && p.forEach(function(d) {
    d.addEventListener("scroll", r.update, Vl);
  }), u && c.addEventListener("resize", r.update, Vl), function() {
    i && p.forEach(function(d) {
      d.removeEventListener("scroll", r.update, Vl);
    }), u && c.removeEventListener("resize", r.update, Vl);
  };
}
var Vl, l3, s3 = A(() => {
  gt();
  Vl = {
    passive: !0
  };
  a(fB, "effect");
  l3 = {
    name: "eventListeners",
    enabled: !0,
    phase: "write",
    fn: /* @__PURE__ */ a(function() {
    }, "fn"),
    effect: fB,
    data: {}
  };
});

// ../node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
function Yo(e) {
  return e.replace(/left|right|bottom|top/g, function(t) {
    return hB[t];
  });
}
var hB, u3 = A(() => {
  hB = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  a(Yo, "getOppositePlacement");
});

// ../node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
function Wl(e) {
  return e.replace(/start|end/g, function(t) {
    return mB[t];
  });
}
var mB, c3 = A(() => {
  mB = {
    start: "end",
    end: "start"
  };
  a(Wl, "getOppositeVariationPlacement");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
function an(e) {
  var t = ee(e), r = t.pageXOffset, n = t.pageYOffset;
  return {
    scrollLeft: r,
    scrollTop: n
  };
}
var ql = A(() => {
  gt();
  a(an, "getWindowScroll");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
function ln(e) {
  return lt(Ae(e)).left + an(e).scrollLeft;
}
var Ul = A(() => {
  Wo();
  Yt();
  ql();
  a(ln, "getWindowScrollBarX");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
function h1(e, t) {
  var r = ee(e), n = Ae(e), o = r.visualViewport, i = n.clientWidth, l = n.clientHeight, u = 0, c = 0;
  if (o) {
    i = o.width, l = o.height;
    var p = ja();
    (p || !p && t === "fixed") && (u = o.offsetLeft, c = o.offsetTop);
  }
  return {
    width: i,
    height: l,
    x: u + ln(e),
    y: c
  };
}
var p3 = A(() => {
  gt();
  Yt();
  Ul();
  l1();
  a(h1, "getViewportRect");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
function m1(e) {
  var t, r = Ae(e), n = an(e), o = (t = e.ownerDocument) == null ? void 0 : t.body, i = vt(r.scrollWidth, r.clientWidth, o ? o.scrollWidth :
  0, o ? o.clientWidth : 0), l = vt(r.scrollHeight, r.clientHeight, o ? o.scrollHeight : 0, o ? o.clientHeight : 0), u = -n.scrollLeft + ln(
  e), c = -n.scrollTop;
  return _e(o || r).direction === "rtl" && (u += vt(r.clientWidth, o ? o.clientWidth : 0) - i), {
    width: i,
    height: l,
    x: u,
    y: c
  };
}
var d3 = A(() => {
  Yt();
  qo();
  Ul();
  ql();
  gr();
  a(m1, "getDocumentRect");
});

// ../node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
function sn(e) {
  var t = _e(e), r = t.overflow, n = t.overflowX, o = t.overflowY;
  return /auto|scroll|overlay|hidden/.test(r + o + n);
}
var Gl = A(() => {
  qo();
  a(sn, "isScrollParent");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
function Yl(e) {
  return ["html", "body", "#document"].indexOf(De(e)) >= 0 ? e.ownerDocument.body : me(e) && sn(e) ? e : Yl(Xt(e));
}
var f3 = A(() => {
  Wa();
  Gl();
  hr();
  Ke();
  a(Yl, "getScrollParent");
});

// ../node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
function vr(e, t) {
  var r;
  t === void 0 && (t = []);
  var n = Yl(e), o = n === ((r = e.ownerDocument) == null ? void 0 : r.body), i = ee(n), l = o ? [i].concat(i.visualViewport || [], sn(n) ? n :
  []) : n, u = t.concat(l);
  return o ? u : (
    // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    u.concat(vr(Xt(l)))
  );
}
var g1 = A(() => {
  f3();
  Wa();
  gt();
  Gl();
  a(vr, "listScrollParents");
});

// ../node_modules/@popperjs/core/lib/utils/rectToClientRect.js
function Xo(e) {
  return Object.assign({}, e, {
    left: e.x,
    top: e.y,
    right: e.x + e.width,
    bottom: e.y + e.height
  });
}
var v1 = A(() => {
  a(Xo, "rectToClientRect");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
function gB(e, t) {
  var r = lt(e, !1, t === "fixed");
  return r.top = r.top + e.clientTop, r.left = r.left + e.clientLeft, r.bottom = r.top + e.clientHeight, r.right = r.left + e.clientWidth, r.
  width = e.clientWidth, r.height = e.clientHeight, r.x = r.left, r.y = r.top, r;
}
function h3(e, t, r) {
  return t === Ol ? Xo(h1(e, r)) : it(t) ? gB(t, r) : Xo(m1(Ae(e)));
}
function vB(e) {
  var t = vr(Xt(e)), r = ["absolute", "fixed"].indexOf(_e(e).position) >= 0, n = r && me(e) ? wt(e) : e;
  return it(n) ? t.filter(function(o) {
    return it(o) && Va(o, n) && De(o) !== "body";
  }) : [];
}
function w1(e, t, r, n) {
  var o = t === "clippingParents" ? vB(e) : [].concat(t), i = [].concat(o, [r]), l = i[0], u = i.reduce(function(c, p) {
    var d = h3(e, p, n);
    return c.top = vt(d.top, c.top), c.right = tn(d.right, c.right), c.bottom = tn(d.bottom, c.bottom), c.left = vt(d.left, c.left), c;
  }, h3(e, l, n));
  return u.width = u.right - u.left, u.height = u.bottom - u.top, u.x = u.left, u.y = u.top, u;
}
var m3 = A(() => {
  Xe();
  p3();
  d3();
  g1();
  Uo();
  Yt();
  qo();
  Ke();
  Wo();
  Wa();
  s1();
  hr();
  v1();
  gr();
  a(gB, "getInnerBoundingClientRect");
  a(h3, "getClientRectFromMixedType");
  a(vB, "getClippingParents");
  a(w1, "getClippingRect");
});

// ../node_modules/@popperjs/core/lib/utils/computeOffsets.js
function Ya(e) {
  var t = e.reference, r = e.element, n = e.placement, o = n ? xe(n) : null, i = n ? st(n) : null, l = t.x + t.width / 2 - r.width / 2, u = t.
  y + t.height / 2 - r.height / 2, c;
  switch (o) {
    case oe:
      c = {
        x: l,
        y: t.y - r.height
      };
      break;
    case he:
      c = {
        x: l,
        y: t.y + t.height
      };
      break;
    case ce:
      c = {
        x: t.x + t.width,
        y: u
      };
      break;
    case ie:
      c = {
        x: t.x - r.width,
        y: u
      };
      break;
    default:
      c = {
        x: t.x,
        y: t.y
      };
  }
  var p = o ? nn(o) : null;
  if (p != null) {
    var d = p === "y" ? "height" : "width";
    switch (i) {
      case Ut:
        c[p] = c[p] - (t[d] / 2 - r[d] / 2);
        break;
      case en:
        c[p] = c[p] + (t[d] / 2 - r[d] / 2);
        break;
      default:
    }
  }
  return c;
}
var b1 = A(() => {
  mr();
  Go();
  jl();
  Xe();
  a(Ya, "computeOffsets");
});

// ../node_modules/@popperjs/core/lib/utils/detectOverflow.js
function bt(e, t) {
  t === void 0 && (t = {});
  var r = t, n = r.placement, o = n === void 0 ? e.placement : n, i = r.strategy, l = i === void 0 ? e.strategy : i, u = r.boundary, c = u ===
  void 0 ? Yv : u, p = r.rootBoundary, d = p === void 0 ? Ol : p, h = r.elementContext, f = h === void 0 ? $o : h, v = r.altBoundary, b = v ===
  void 0 ? !1 : v, m = r.padding, g = m === void 0 ? 0 : m, y = Ua(typeof g != "number" ? g : Ga(g, fr)), w = f === $o ? Xv : $o, D = e.rects.
  popper, x = e.elements[b ? w : f], C = w1(it(x) ? x : x.contextElement || Ae(e.elements.popper), c, d, l), E = lt(e.elements.reference), R = Ya(
  {
    reference: E,
    element: D,
    strategy: "absolute",
    placement: o
  }), F = Xo(Object.assign({}, D, R)), S = f === $o ? F : E, k = {
    top: C.top - S.top + y.top,
    bottom: S.bottom - C.bottom + y.bottom,
    left: C.left - S.left + y.left,
    right: S.right - C.right + y.right
  }, I = e.modifiersData.offset;
  if (f === $o && I) {
    var H = I[o];
    Object.keys(k).forEach(function(M) {
      var W = [ce, he].indexOf(M) >= 0 ? 1 : -1, L = [oe, he].indexOf(M) >= 0 ? "y" : "x";
      k[M] += H[L] * W;
    });
  }
  return k;
}
var Xa = A(() => {
  m3();
  Yt();
  Wo();
  b1();
  v1();
  Xe();
  Ke();
  d1();
  f1();
  a(bt, "detectOverflow");
});

// ../node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
function y1(e, t) {
  t === void 0 && (t = {});
  var r = t, n = r.placement, o = r.boundary, i = r.rootBoundary, l = r.padding, u = r.flipVariations, c = r.allowedAutoPlacements, p = c ===
  void 0 ? Nl : c, d = st(n), h = d ? u ? a1 : a1.filter(function(b) {
    return st(b) === d;
  }) : fr, f = h.filter(function(b) {
    return p.indexOf(b) >= 0;
  });
  f.length === 0 && (f = h);
  var v = f.reduce(function(b, m) {
    return b[m] = bt(e, {
      placement: m,
      boundary: o,
      rootBoundary: i,
      padding: l
    })[xe(m)], b;
  }, {});
  return Object.keys(v).sort(function(b, m) {
    return v[b] - v[m];
  });
}
var g3 = A(() => {
  Go();
  Xe();
  Xa();
  mr();
  a(y1, "computeAutoPlacement");
});

// ../node_modules/@popperjs/core/lib/modifiers/flip.js
function wB(e) {
  if (xe(e) === zl)
    return [];
  var t = Yo(e);
  return [Wl(e), t, Wl(t)];
}
function bB(e) {
  var t = e.state, r = e.options, n = e.name;
  if (!t.modifiersData[n]._skip) {
    for (var o = r.mainAxis, i = o === void 0 ? !0 : o, l = r.altAxis, u = l === void 0 ? !0 : l, c = r.fallbackPlacements, p = r.padding, d = r.
    boundary, h = r.rootBoundary, f = r.altBoundary, v = r.flipVariations, b = v === void 0 ? !0 : v, m = r.allowedAutoPlacements, g = t.options.
    placement, y = xe(g), w = y === g, D = c || (w || !b ? [Yo(g)] : wB(g)), x = [g].concat(D).reduce(function(Ce, ge) {
      return Ce.concat(xe(ge) === zl ? y1(t, {
        placement: ge,
        boundary: d,
        rootBoundary: h,
        padding: p,
        flipVariations: b,
        allowedAutoPlacements: m
      }) : ge);
    }, []), C = t.rects.reference, E = t.rects.popper, R = /* @__PURE__ */ new Map(), F = !0, S = x[0], k = 0; k < x.length; k++) {
      var I = x[k], H = xe(I), M = st(I) === Ut, W = [oe, he].indexOf(H) >= 0, L = W ? "width" : "height", T = bt(t, {
        placement: I,
        boundary: d,
        rootBoundary: h,
        altBoundary: f,
        padding: p
      }), P = W ? M ? ce : ie : M ? he : oe;
      C[L] > E[L] && (P = Yo(P));
      var q = Yo(P), N = [];
      if (i && N.push(T[H] <= 0), u && N.push(T[P] <= 0, T[q] <= 0), N.every(function(Ce) {
        return Ce;
      })) {
        S = I, F = !1;
        break;
      }
      R.set(I, N);
    }
    if (F)
      for (var U = b ? 3 : 1, z = /* @__PURE__ */ a(function(ge) {
        var Fe = x.find(function(He) {
          var ze = R.get(He);
          if (ze)
            return ze.slice(0, ge).every(function(ta) {
              return ta;
            });
        });
        if (Fe)
          return S = Fe, "break";
      }, "_loop"), K = U; K > 0; K--) {
        var Pe = z(K);
        if (Pe === "break") break;
      }
    t.placement !== S && (t.modifiersData[n]._skip = !0, t.placement = S, t.reset = !0);
  }
}
var v3, w3 = A(() => {
  u3();
  mr();
  c3();
  Xa();
  g3();
  Xe();
  Go();
  a(wB, "getExpandedFallbackPlacements");
  a(bB, "flip");
  v3 = {
    name: "flip",
    enabled: !0,
    phase: "main",
    fn: bB,
    requiresIfExists: ["offset"],
    data: {
      _skip: !1
    }
  };
});

// ../node_modules/@popperjs/core/lib/modifiers/hide.js
function b3(e, t, r) {
  return r === void 0 && (r = {
    x: 0,
    y: 0
  }), {
    top: e.top - t.height - r.y,
    right: e.right - t.width + r.x,
    bottom: e.bottom - t.height + r.y,
    left: e.left - t.width - r.x
  };
}
function y3(e) {
  return [oe, ce, he, ie].some(function(t) {
    return e[t] >= 0;
  });
}
function yB(e) {
  var t = e.state, r = e.name, n = t.rects.reference, o = t.rects.popper, i = t.modifiersData.preventOverflow, l = bt(t, {
    elementContext: "reference"
  }), u = bt(t, {
    altBoundary: !0
  }), c = b3(l, n), p = b3(u, o, i), d = y3(c), h = y3(p);
  t.modifiersData[r] = {
    referenceClippingOffsets: c,
    popperEscapeOffsets: p,
    isReferenceHidden: d,
    hasPopperEscaped: h
  }, t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-reference-hidden": d,
    "data-popper-escaped": h
  });
}
var D3, x3 = A(() => {
  Xe();
  Xa();
  a(b3, "getSideOffsets");
  a(y3, "isAnySideFullyClipped");
  a(yB, "hide");
  D3 = {
    name: "hide",
    enabled: !0,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: yB
  };
});

// ../node_modules/@popperjs/core/lib/modifiers/offset.js
function DB(e, t, r) {
  var n = xe(e), o = [ie, oe].indexOf(n) >= 0 ? -1 : 1, i = typeof r == "function" ? r(Object.assign({}, t, {
    placement: e
  })) : r, l = i[0], u = i[1];
  return l = l || 0, u = (u || 0) * o, [ie, ce].indexOf(n) >= 0 ? {
    x: u,
    y: l
  } : {
    x: l,
    y: u
  };
}
function xB(e) {
  var t = e.state, r = e.options, n = e.name, o = r.offset, i = o === void 0 ? [0, 0] : o, l = Nl.reduce(function(d, h) {
    return d[h] = DB(h, t.rects, i), d;
  }, {}), u = l[t.placement], c = u.x, p = u.y;
  t.modifiersData.popperOffsets != null && (t.modifiersData.popperOffsets.x += c, t.modifiersData.popperOffsets.y += p), t.modifiersData[n] =
  l;
}
var C3, E3 = A(() => {
  mr();
  Xe();
  a(DB, "distanceAndSkiddingToXY");
  a(xB, "offset");
  C3 = {
    name: "offset",
    enabled: !0,
    phase: "main",
    requires: ["popperOffsets"],
    fn: xB
  };
});

// ../node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
function CB(e) {
  var t = e.state, r = e.name;
  t.modifiersData[r] = Ya({
    reference: t.rects.reference,
    element: t.rects.popper,
    strategy: "absolute",
    placement: t.placement
  });
}
var R3, S3 = A(() => {
  b1();
  a(CB, "popperOffsets");
  R3 = {
    name: "popperOffsets",
    enabled: !0,
    phase: "read",
    fn: CB,
    data: {}
  };
});

// ../node_modules/@popperjs/core/lib/utils/getAltAxis.js
function D1(e) {
  return e === "x" ? "y" : "x";
}
var A3 = A(() => {
  a(D1, "getAltAxis");
});

// ../node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
function EB(e) {
  var t = e.state, r = e.options, n = e.name, o = r.mainAxis, i = o === void 0 ? !0 : o, l = r.altAxis, u = l === void 0 ? !1 : l, c = r.boundary,
  p = r.rootBoundary, d = r.altBoundary, h = r.padding, f = r.tether, v = f === void 0 ? !0 : f, b = r.tetherOffset, m = b === void 0 ? 0 : b,
  g = bt(t, {
    boundary: c,
    rootBoundary: p,
    padding: h,
    altBoundary: d
  }), y = xe(t.placement), w = st(t.placement), D = !w, x = nn(y), C = D1(x), E = t.modifiersData.popperOffsets, R = t.rects.reference, F = t.
  rects.popper, S = typeof m == "function" ? m(Object.assign({}, t.rects, {
    placement: t.placement
  })) : m, k = typeof S == "number" ? {
    mainAxis: S,
    altAxis: S
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, S), I = t.modifiersData.offset ? t.modifiersData.offset[t.placement] : null, H = {
    x: 0,
    y: 0
  };
  if (E) {
    if (i) {
      var M, W = x === "y" ? oe : ie, L = x === "y" ? he : ce, T = x === "y" ? "height" : "width", P = E[x], q = P + g[W], N = P - g[L], U = v ?
      -F[T] / 2 : 0, z = w === Ut ? R[T] : F[T], K = w === Ut ? -F[T] : -R[T], Pe = t.elements.arrow, Ce = v && Pe ? rn(Pe) : {
        width: 0,
        height: 0
      }, ge = t.modifiersData["arrow#persistent"] ? t.modifiersData["arrow#persistent"].padding : qa(), Fe = ge[W], He = ge[L], ze = on(0, R[T],
      Ce[T]), ta = D ? R[T] / 2 - U - ze - Fe - k.mainAxis : z - ze - Fe - k.mainAxis, ra = D ? -R[T] / 2 + U + ze + He + k.mainAxis : K + ze +
      He + k.mainAxis, as = t.elements.arrow && wt(t.elements.arrow), D4 = as ? x === "y" ? as.clientTop || 0 : as.clientLeft || 0 : 0, J1 = (M =
      I?.[x]) != null ? M : 0, x4 = P + ta - J1 - D4, C4 = P + ra - J1, Q1 = on(v ? tn(q, x4) : q, P, v ? vt(N, C4) : N);
      E[x] = Q1, H[x] = Q1 - P;
    }
    if (u) {
      var ep, E4 = x === "x" ? oe : ie, R4 = x === "x" ? he : ce, Dr = E[C], ei = C === "y" ? "height" : "width", tp = Dr + g[E4], rp = Dr -
      g[R4], is = [oe, ie].indexOf(y) !== -1, np = (ep = I?.[C]) != null ? ep : 0, op = is ? tp : Dr - R[ei] - F[ei] - np + k.altAxis, ap = is ?
      Dr + R[ei] + F[ei] - np - k.altAxis : rp, ip = v && is ? t3(op, Dr, ap) : on(v ? op : tp, Dr, v ? ap : rp);
      E[C] = ip, H[C] = ip - Dr;
    }
    t.modifiersData[n] = H;
  }
}
var F3, k3 = A(() => {
  Xe();
  mr();
  jl();
  A3();
  c1();
  $l();
  Uo();
  Xa();
  Go();
  p1();
  gr();
  a(EB, "preventOverflow");
  F3 = {
    name: "preventOverflow",
    enabled: !0,
    phase: "main",
    fn: EB,
    requiresIfExists: ["offset"]
  };
});

// ../node_modules/@popperjs/core/lib/modifiers/index.js
var x1 = A(() => {
});

// ../node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
function C1(e) {
  return {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  };
}
var L3 = A(() => {
  a(C1, "getHTMLElementScroll");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
function E1(e) {
  return e === ee(e) || !me(e) ? an(e) : C1(e);
}
var T3 = A(() => {
  ql();
  gt();
  Ke();
  L3();
  a(E1, "getNodeScroll");
});

// ../node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
function RB(e) {
  var t = e.getBoundingClientRect(), r = Gt(t.width) / e.offsetWidth || 1, n = Gt(t.height) / e.offsetHeight || 1;
  return r !== 1 || n !== 1;
}
function R1(e, t, r) {
  r === void 0 && (r = !1);
  var n = me(t), o = me(t) && RB(t), i = Ae(t), l = lt(e, o, r), u = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = {
    x: 0,
    y: 0
  };
  return (n || !n && !r) && ((De(t) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
  sn(i)) && (u = E1(t)), me(t) ? (c = lt(t, !0), c.x += t.clientLeft, c.y += t.clientTop) : i && (c.x = ln(i))), {
    x: l.left + u.scrollLeft - c.x,
    y: l.top + u.scrollTop - c.y,
    width: l.width,
    height: l.height
  };
}
var B3 = A(() => {
  Wo();
  T3();
  hr();
  Ke();
  Ul();
  Yt();
  Gl();
  gr();
  a(RB, "isElementScaled");
  a(R1, "getCompositeRect");
});

// ../node_modules/@popperjs/core/lib/utils/orderModifiers.js
function SB(e) {
  var t = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set(), n = [];
  e.forEach(function(i) {
    t.set(i.name, i);
  });
  function o(i) {
    r.add(i.name);
    var l = [].concat(i.requires || [], i.requiresIfExists || []);
    l.forEach(function(u) {
      if (!r.has(u)) {
        var c = t.get(u);
        c && o(c);
      }
    }), n.push(i);
  }
  return a(o, "sort"), e.forEach(function(i) {
    r.has(i.name) || o(i);
  }), n;
}
function S1(e) {
  var t = SB(e);
  return Kv.reduce(function(r, n) {
    return r.concat(t.filter(function(o) {
      return o.phase === n;
    }));
  }, []);
}
var I3 = A(() => {
  Xe();
  a(SB, "order");
  a(S1, "orderModifiers");
});

// ../node_modules/@popperjs/core/lib/utils/debounce.js
function A1(e) {
  var t;
  return function() {
    return t || (t = new Promise(function(r) {
      Promise.resolve().then(function() {
        t = void 0, r(e());
      });
    })), t;
  };
}
var M3 = A(() => {
  a(A1, "debounce");
});

// ../node_modules/@popperjs/core/lib/utils/mergeByName.js
function F1(e) {
  var t = e.reduce(function(r, n) {
    var o = r[n.name];
    return r[n.name] = o ? Object.assign({}, o, n, {
      options: Object.assign({}, o.options, n.options),
      data: Object.assign({}, o.data, n.data)
    }) : n, r;
  }, {});
  return Object.keys(t).map(function(r) {
    return t[r];
  });
}
var _3 = A(() => {
  a(F1, "mergeByName");
});

// ../node_modules/@popperjs/core/lib/createPopper.js
function H3() {
  for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
    t[r] = arguments[r];
  return !t.some(function(n) {
    return !(n && typeof n.getBoundingClientRect == "function");
  });
}
function z3(e) {
  e === void 0 && (e = {});
  var t = e, r = t.defaultModifiers, n = r === void 0 ? [] : r, o = t.defaultOptions, i = o === void 0 ? P3 : o;
  return /* @__PURE__ */ a(function(u, c, p) {
    p === void 0 && (p = i);
    var d = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, P3, i),
      modifiersData: {},
      elements: {
        reference: u,
        popper: c
      },
      attributes: {},
      styles: {}
    }, h = [], f = !1, v = {
      state: d,
      setOptions: /* @__PURE__ */ a(function(y) {
        var w = typeof y == "function" ? y(d.options) : y;
        m(), d.options = Object.assign({}, i, d.options, w), d.scrollParents = {
          reference: it(u) ? vr(u) : u.contextElement ? vr(u.contextElement) : [],
          popper: vr(c)
        };
        var D = S1(F1([].concat(n, d.options.modifiers)));
        return d.orderedModifiers = D.filter(function(x) {
          return x.enabled;
        }), b(), v.update();
      }, "setOptions"),
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: /* @__PURE__ */ a(function() {
        if (!f) {
          var y = d.elements, w = y.reference, D = y.popper;
          if (H3(w, D)) {
            d.rects = {
              reference: R1(w, wt(D), d.options.strategy === "fixed"),
              popper: rn(D)
            }, d.reset = !1, d.placement = d.options.placement, d.orderedModifiers.forEach(function(k) {
              return d.modifiersData[k.name] = Object.assign({}, k.data);
            });
            for (var x = 0; x < d.orderedModifiers.length; x++) {
              if (d.reset === !0) {
                d.reset = !1, x = -1;
                continue;
              }
              var C = d.orderedModifiers[x], E = C.fn, R = C.options, F = R === void 0 ? {} : R, S = C.name;
              typeof E == "function" && (d = E({
                state: d,
                options: F,
                name: S,
                instance: v
              }) || d);
            }
          }
        }
      }, "forceUpdate"),
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: A1(function() {
        return new Promise(function(g) {
          v.forceUpdate(), g(d);
        });
      }),
      destroy: /* @__PURE__ */ a(function() {
        m(), f = !0;
      }, "destroy")
    };
    if (!H3(u, c))
      return v;
    v.setOptions(p).then(function(g) {
      !f && p.onFirstUpdate && p.onFirstUpdate(g);
    });
    function b() {
      d.orderedModifiers.forEach(function(g) {
        var y = g.name, w = g.options, D = w === void 0 ? {} : w, x = g.effect;
        if (typeof x == "function") {
          var C = x({
            state: d,
            name: y,
            instance: v,
            options: D
          }), E = /* @__PURE__ */ a(function() {
          }, "noopFn");
          h.push(C || E);
        }
      });
    }
    a(b, "runModifierEffects");
    function m() {
      h.forEach(function(g) {
        return g();
      }), h = [];
    }
    return a(m, "cleanupModifierEffects"), v;
  }, "createPopper");
}
var P3, O3 = A(() => {
  B3();
  $l();
  g1();
  Uo();
  I3();
  M3();
  _3();
  Ke();
  P3 = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  a(H3, "areValidElements");
  a(z3, "popperGenerator");
});

// ../node_modules/@popperjs/core/lib/popper.js
var AB, k1, N3 = A(() => {
  O3();
  s3();
  S3();
  i3();
  Jv();
  E3();
  w3();
  k3();
  n3();
  x3();
  x1();
  AB = [l3, R3, a3, Zv, C3, v3, F3, r3, D3], k1 = /* @__PURE__ */ z3({
    defaultModifiers: AB
  });
});

// ../node_modules/@popperjs/core/lib/index.js
var $3 = A(() => {
  Xe();
  x1();
  N3();
});

// ../node_modules/react-fast-compare/index.js
var V3 = _((AK, j3) => {
  var FB = typeof Element < "u", kB = typeof Map == "function", LB = typeof Set == "function", TB = typeof ArrayBuffer == "function" && !!ArrayBuffer.
  isView;
  function Xl(e, t) {
    if (e === t) return !0;
    if (e && t && typeof e == "object" && typeof t == "object") {
      if (e.constructor !== t.constructor) return !1;
      var r, n, o;
      if (Array.isArray(e)) {
        if (r = e.length, r != t.length) return !1;
        for (n = r; n-- !== 0; )
          if (!Xl(e[n], t[n])) return !1;
        return !0;
      }
      var i;
      if (kB && e instanceof Map && t instanceof Map) {
        if (e.size !== t.size) return !1;
        for (i = e.entries(); !(n = i.next()).done; )
          if (!t.has(n.value[0])) return !1;
        for (i = e.entries(); !(n = i.next()).done; )
          if (!Xl(n.value[1], t.get(n.value[0]))) return !1;
        return !0;
      }
      if (LB && e instanceof Set && t instanceof Set) {
        if (e.size !== t.size) return !1;
        for (i = e.entries(); !(n = i.next()).done; )
          if (!t.has(n.value[0])) return !1;
        return !0;
      }
      if (TB && ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) {
        if (r = e.length, r != t.length) return !1;
        for (n = r; n-- !== 0; )
          if (e[n] !== t[n]) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
      if (e.valueOf !== Object.prototype.valueOf && typeof e.valueOf == "function" && typeof t.valueOf == "function") return e.valueOf() ===
      t.valueOf();
      if (e.toString !== Object.prototype.toString && typeof e.toString == "function" && typeof t.toString == "function") return e.toString() ===
      t.toString();
      if (o = Object.keys(e), r = o.length, r !== Object.keys(t).length) return !1;
      for (n = r; n-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(t, o[n])) return !1;
      if (FB && e instanceof Element) return !1;
      for (n = r; n-- !== 0; )
        if (!((o[n] === "_owner" || o[n] === "__v" || o[n] === "__o") && e.$$typeof) && !Xl(e[o[n]], t[o[n]]))
          return !1;
      return !0;
    }
    return e !== e && t !== t;
  }
  a(Xl, "equal");
  j3.exports = /* @__PURE__ */ a(function(t, r) {
    try {
      return Xl(t, r);
    } catch (n) {
      if ((n.message || "").match(/stack|recursion/i))
        return console.warn("react-fast-compare cannot handle circular refs"), !1;
      throw n;
    }
  }, "isEqual");
});

// ../node_modules/react-popper/lib/esm/usePopper.js
import * as wr from "react";
import * as W3 from "react-dom";
var q3, BB, L1, U3 = A(() => {
  $3();
  q3 = Ee(V3());
  Gv();
  BB = [], L1 = /* @__PURE__ */ a(function(t, r, n) {
    n === void 0 && (n = {});
    var o = wr.useRef(null), i = {
      onFirstUpdate: n.onFirstUpdate,
      placement: n.placement || "bottom",
      strategy: n.strategy || "absolute",
      modifiers: n.modifiers || BB
    }, l = wr.useState({
      styles: {
        popper: {
          position: i.strategy,
          left: "0",
          top: "0"
        },
        arrow: {
          position: "absolute"
        }
      },
      attributes: {}
    }), u = l[0], c = l[1], p = wr.useMemo(function() {
      return {
        name: "updateState",
        enabled: !0,
        phase: "write",
        fn: /* @__PURE__ */ a(function(v) {
          var b = v.state, m = Object.keys(b.elements);
          W3.flushSync(function() {
            c({
              styles: n1(m.map(function(g) {
                return [g, b.styles[g] || {}];
              })),
              attributes: n1(m.map(function(g) {
                return [g, b.attributes[g]];
              }))
            });
          });
        }, "fn"),
        requires: ["computeStyles"]
      };
    }, []), d = wr.useMemo(function() {
      var f = {
        onFirstUpdate: i.onFirstUpdate,
        placement: i.placement,
        strategy: i.strategy,
        modifiers: [].concat(i.modifiers, [p, {
          name: "applyStyles",
          enabled: !1
        }])
      };
      return (0, q3.default)(o.current, f) ? o.current || f : (o.current = f, f);
    }, [i.onFirstUpdate, i.placement, i.strategy, i.modifiers, p]), h = wr.useRef();
    return o1(function() {
      h.current && h.current.setOptions(d);
    }, [d]), o1(function() {
      if (!(t == null || r == null)) {
        var f = n.createPopper || k1, v = f(t, r, d);
        return h.current = v, function() {
          v.destroy(), h.current = null;
        };
      }
    }, [t, r, n.createPopper]), {
      state: h.current ? h.current.state : null,
      styles: u.styles,
      attributes: u.attributes,
      update: h.current ? h.current.update : null,
      forceUpdate: h.current ? h.current.forceUpdate : null
    };
  }, "usePopper");
});

// ../node_modules/react-popper/lib/esm/index.js
var G3 = A(() => {
  U3();
});

// ../node_modules/react-popper-tooltip/dist/esm/react-popper-tooltip.js
import * as G from "react";
function K3(e) {
  var t = G.useRef(e);
  return t.current = e, G.useCallback(function() {
    return t.current;
  }, []);
}
function MB(e) {
  var t = e.initial, r = e.value, n = e.onChange, o = n === void 0 ? IB : n;
  if (t === void 0 && r === void 0)
    throw new TypeError('Either "value" or "initial" variable must be set. Now both are undefined');
  var i = G.useState(t), l = i[0], u = i[1], c = K3(l), p = G.useCallback(function(h) {
    var f = c(), v = typeof h == "function" ? h(f) : h;
    typeof v.persist == "function" && v.persist(), u(v), typeof o == "function" && o(v);
  }, [c, o]), d = r !== void 0;
  return [d ? r : l, d ? o : p];
}
function Z3(e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = 0), function() {
    return {
      width: 0,
      height: 0,
      top: t,
      right: e,
      bottom: t,
      left: e,
      x: 0,
      y: 0,
      toJSON: /* @__PURE__ */ a(function() {
        return null;
      }, "toJSON")
    };
  };
}
function J3(e, t) {
  var r, n, o;
  e === void 0 && (e = {}), t === void 0 && (t = {});
  var i = Object.keys(X3).reduce(function(L, T) {
    var P;
    return ve({}, L, (P = {}, P[T] = L[T] !== void 0 ? L[T] : X3[T], P));
  }, e), l = G.useMemo(
    function() {
      return [{
        name: "offset",
        options: {
          offset: i.offset
        }
      }];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(i.offset) ? i.offset : []
  ), u = ve({}, t, {
    placement: t.placement || i.placement,
    modifiers: t.modifiers || l
  }), c = G.useState(null), p = c[0], d = c[1], h = G.useState(null), f = h[0], v = h[1], b = MB({
    initial: i.defaultVisible,
    value: i.visible,
    onChange: i.onVisibleChange
  }), m = b[0], g = b[1], y = G.useRef();
  G.useEffect(function() {
    return function() {
      return clearTimeout(y.current);
    };
  }, []);
  var w = L1(i.followCursor ? Y3 : p, f, u), D = w.styles, x = w.attributes, C = hn(w, _B), E = C.update, R = K3({
    visible: m,
    triggerRef: p,
    tooltipRef: f,
    finalConfig: i
  }), F = G.useCallback(
    function(L) {
      return Array.isArray(i.trigger) ? i.trigger.includes(L) : i.trigger === L;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(i.trigger) ? i.trigger : [i.trigger]
  ), S = G.useCallback(function() {
    clearTimeout(y.current), y.current = window.setTimeout(function() {
      return g(!1);
    }, i.delayHide);
  }, [i.delayHide, g]), k = G.useCallback(function() {
    clearTimeout(y.current), y.current = window.setTimeout(function() {
      return g(!0);
    }, i.delayShow);
  }, [i.delayShow, g]), I = G.useCallback(function() {
    R().visible ? S() : k();
  }, [R, S, k]);
  G.useEffect(function() {
    if (R().finalConfig.closeOnOutsideClick) {
      var L = /* @__PURE__ */ a(function(P) {
        var q, N = R(), U = N.tooltipRef, z = N.triggerRef, K = (P.composedPath == null || (q = P.composedPath()) == null ? void 0 : q[0]) ||
        P.target;
        K instanceof Node && U != null && z != null && !U.contains(K) && !z.contains(K) && S();
      }, "handleClickOutside");
      return document.addEventListener("mousedown", L), function() {
        return document.removeEventListener("mousedown", L);
      };
    }
  }, [R, S]), G.useEffect(function() {
    if (!(p == null || !F("click")))
      return p.addEventListener("click", I), function() {
        return p.removeEventListener("click", I);
      };
  }, [p, F, I]), G.useEffect(function() {
    if (!(p == null || !F("double-click")))
      return p.addEventListener("dblclick", I), function() {
        return p.removeEventListener("dblclick", I);
      };
  }, [p, F, I]), G.useEffect(function() {
    if (!(p == null || !F("right-click"))) {
      var L = /* @__PURE__ */ a(function(P) {
        P.preventDefault(), I();
      }, "preventDefaultAndToggle");
      return p.addEventListener("contextmenu", L), function() {
        return p.removeEventListener("contextmenu", L);
      };
    }
  }, [p, F, I]), G.useEffect(function() {
    if (!(p == null || !F("focus")))
      return p.addEventListener("focus", k), p.addEventListener("blur", S), function() {
        p.removeEventListener("focus", k), p.removeEventListener("blur", S);
      };
  }, [p, F, k, S]), G.useEffect(function() {
    if (!(p == null || !F("hover")))
      return p.addEventListener("mouseenter", k), p.addEventListener("mouseleave", S), function() {
        p.removeEventListener("mouseenter", k), p.removeEventListener("mouseleave", S);
      };
  }, [p, F, k, S]), G.useEffect(function() {
    if (!(f == null || !F("hover") || !R().finalConfig.interactive))
      return f.addEventListener("mouseenter", k), f.addEventListener("mouseleave", S), function() {
        f.removeEventListener("mouseenter", k), f.removeEventListener("mouseleave", S);
      };
  }, [f, F, k, S, R]);
  var H = C == null || (r = C.state) == null || (n = r.modifiersData) == null || (o = n.hide) == null ? void 0 : o.isReferenceHidden;
  G.useEffect(function() {
    i.closeOnTriggerHidden && H && S();
  }, [i.closeOnTriggerHidden, S, H]), G.useEffect(function() {
    if (!i.followCursor || p == null) return;
    function L(T) {
      var P = T.clientX, q = T.clientY;
      Y3.getBoundingClientRect = Z3(P, q), E?.();
    }
    return a(L, "setMousePosition"), p.addEventListener("mousemove", L), function() {
      return p.removeEventListener("mousemove", L);
    };
  }, [i.followCursor, p, E]), G.useEffect(function() {
    if (!(f == null || E == null || i.mutationObserverOptions == null)) {
      var L = new MutationObserver(E);
      return L.observe(f, i.mutationObserverOptions), function() {
        return L.disconnect();
      };
    }
  }, [i.mutationObserverOptions, f, E]);
  var M = /* @__PURE__ */ a(function(T) {
    return T === void 0 && (T = {}), ve({}, T, {
      style: ve({}, T.style, D.popper)
    }, x.popper, {
      "data-popper-interactive": i.interactive
    });
  }, "getTooltipProps"), W = /* @__PURE__ */ a(function(T) {
    return T === void 0 && (T = {}), ve({}, T, x.arrow, {
      style: ve({}, T.style, D.arrow),
      "data-popper-arrow": !0
    });
  }, "getArrowProps");
  return ve({
    getArrowProps: W,
    getTooltipProps: M,
    setTooltipRef: v,
    setTriggerRef: d,
    tooltipRef: f,
    triggerRef: p,
    visible: m
  }, C);
}
var IB, _B, Y3, X3, Q3 = A(() => {
  li();
  oa();
  G3();
  a(K3, "useGetLatest");
  IB = /* @__PURE__ */ a(function() {
  }, "noop");
  a(MB, "useControlledState");
  a(Z3, "generateBoundingClientRect");
  _B = ["styles", "attributes"], Y3 = {
    getBoundingClientRect: Z3()
  }, X3 = {
    closeOnOutsideClick: !0,
    closeOnTriggerHidden: !1,
    defaultVisible: !1,
    delayHide: 0,
    delayShow: 0,
    followCursor: !1,
    interactive: !1,
    mutationObserverOptions: {
      attributes: !0,
      childList: !0,
      subtree: !0
    },
    offset: [0, 6],
    trigger: "hover"
  };
  a(J3, "usePopperTooltip");
});

// src/components/components/tooltip/Tooltip.tsx
import T1 from "react";
import { lighten as Ka, styled as e4 } from "@storybook/core/theming";
var t4, ut, br, PB, HB, B1, r4 = A(() => {
  "use strict";
  t4 = Ee(la(), 1), ut = (0, t4.default)(1e3)(
    (e, t, r, n = 0) => t.split("-")[0] === e ? r : n
  ), br = 8, PB = e4.div(
    {
      position: "absolute",
      borderStyle: "solid"
    },
    ({ placement: e }) => {
      let t = 0, r = 0;
      switch (!0) {
        case (e.startsWith("left") || e.startsWith("right")): {
          r = 8;
          break;
        }
        case (e.startsWith("top") || e.startsWith("bottom")): {
          t = 8;
          break;
        }
        default:
      }
      return { transform: `translate3d(${t}px, ${r}px, 0px)` };
    },
    ({ theme: e, color: t, placement: r }) => ({
      bottom: `${ut("top", r, `${br * -1}px`, "auto")}`,
      top: `${ut("bottom", r, `${br * -1}px`, "auto")}`,
      right: `${ut("left", r, `${br * -1}px`, "auto")}`,
      left: `${ut("right", r, `${br * -1}px`, "auto")}`,
      borderBottomWidth: `${ut("top", r, "0", br)}px`,
      borderTopWidth: `${ut("bottom", r, "0", br)}px`,
      borderRightWidth: `${ut("left", r, "0", br)}px`,
      borderLeftWidth: `${ut("right", r, "0", br)}px`,
      borderTopColor: ut(
        "top",
        r,
        e.color[t] || t || e.base === "light" ? Ka(e.background.app) : e.background.app,
        "transparent"
      ),
      borderBottomColor: ut(
        "bottom",
        r,
        e.color[t] || t || e.base === "light" ? Ka(e.background.app) : e.background.app,
        "transparent"
      ),
      borderLeftColor: ut(
        "left",
        r,
        e.color[t] || t || e.base === "light" ? Ka(e.background.app) : e.background.app,
        "transparent"
      ),
      borderRightColor: ut(
        "right",
        r,
        e.color[t] || t || e.base === "light" ? Ka(e.background.app) : e.background.app,
        "transparent"
      )
    })
  ), HB = e4.div(
    ({ hidden: e }) => ({
      display: e ? "none" : "inline-block",
      zIndex: 2147483647
    }),
    ({ theme: e, color: t, hasChrome: r }) => r ? {
      background: t && e.color[t] || t || e.base === "light" ? Ka(e.background.app) : e.background.app,
      filter: `
            drop-shadow(0px 5px 5px rgba(0,0,0,0.05))
            drop-shadow(0 1px 3px rgba(0,0,0,0.1))
          `,
      borderRadius: e.appBorderRadius + 2,
      fontSize: e.typography.size.s1
    } : {}
  ), B1 = T1.forwardRef(
    ({
      placement: e = "top",
      hasChrome: t = !0,
      children: r,
      arrowProps: n = {},
      tooltipRef: o,
      color: i,
      withArrows: l,
      ...u
    }, c) => /* @__PURE__ */ T1.createElement(HB, { "data-testid": "tooltip", hasChrome: t, ref: c, ...u, color: i }, t && l && /* @__PURE__ */ T1.
    createElement(PB, { placement: e, ...n, color: i }), r)
  );
  B1.displayName = "Tooltip";
});

// src/components/components/tooltip/WithTooltip.tsx
var M1 = {};
dn(M1, {
  WithToolTipState: () => I1,
  WithTooltip: () => I1,
  WithTooltipPure: () => o4
});
import Za, { useCallback as zB, useEffect as OB, useState as NB } from "react";
import $B from "react-dom";
import { styled as n4 } from "@storybook/core/theming";
var Kl, jB, VB, o4, I1, Zl = A(() => {
  "use strict";
  ii();
  Q3();
  r4();
  ({ document: Kl } = fn), jB = n4.div`
  display: inline-block;
  cursor: ${(e) => (
    // @ts-expect-error (non strict)
    e.trigger === "hover" || e.trigger.includes("hover") ? "default" : "pointer"
  )};
`, VB = n4.g`
  cursor: ${(e) => (
    // @ts-expect-error (non strict)
    e.trigger === "hover" || e.trigger.includes("hover") ? "default" : "pointer"
  )};
`, o4 = /* @__PURE__ */ a(({
    svg: e = !1,
    trigger: t = "click",
    closeOnOutsideClick: r = !1,
    placement: n = "top",
    modifiers: o = [
      {
        name: "preventOverflow",
        options: {
          padding: 8
        }
      },
      {
        name: "offset",
        options: {
          offset: [8, 8]
        }
      },
      {
        name: "arrow",
        options: {
          padding: 8
        }
      }
    ],
    hasChrome: i = !0,
    defaultVisible: l = !1,
    withArrows: u,
    offset: c,
    tooltip: p,
    children: d,
    closeOnTriggerHidden: h,
    mutationObserverOptions: f,
    delayHide: v,
    visible: b,
    interactive: m,
    delayShow: g,
    strategy: y,
    followCursor: w,
    onVisibleChange: D,
    ...x
  }) => {
    let C = e ? VB : jB, {
      getArrowProps: E,
      getTooltipProps: R,
      setTooltipRef: F,
      setTriggerRef: S,
      visible: k,
      state: I
    } = J3(
      {
        trigger: t,
        placement: n,
        defaultVisible: l,
        delayHide: v,
        interactive: m,
        closeOnOutsideClick: r,
        closeOnTriggerHidden: h,
        onVisibleChange: D,
        delayShow: g,
        followCursor: w,
        mutationObserverOptions: f,
        visible: b,
        offset: c
      },
      {
        modifiers: o,
        strategy: y
      }
    ), H = k ? /* @__PURE__ */ Za.createElement(
      B1,
      {
        placement: I?.placement,
        ref: F,
        hasChrome: i,
        arrowProps: E(),
        withArrows: u,
        ...R()
      },
      typeof p == "function" ? p({ onHide: /* @__PURE__ */ a(() => D(!1), "onHide") }) : p
    ) : null;
    return /* @__PURE__ */ Za.createElement(Za.Fragment, null, /* @__PURE__ */ Za.createElement(C, { trigger: t, ref: S, ...x }, d), k && $B.
    createPortal(H, Kl.body));
  }, "WithTooltipPure"), I1 = /* @__PURE__ */ a(({
    startOpen: e = !1,
    onVisibleChange: t,
    ...r
  }) => {
    let [n, o] = NB(e), i = zB(
      (l) => {
        t && t(l) === !1 || o(l);
      },
      [t]
    );
    return OB(() => {
      let l = /* @__PURE__ */ a(() => i(!1), "hide");
      Kl.addEventListener("keydown", l, !1);
      let u = Array.from(Kl.getElementsByTagName("iframe")), c = [];
      return u.forEach((p) => {
        let d = /* @__PURE__ */ a(() => {
          try {
            p.contentWindow.document && (p.contentWindow.document.addEventListener("click", l), c.push(() => {
              try {
                p.contentWindow.document.removeEventListener("click", l);
              } catch {
              }
            }));
          } catch {
          }
        }, "bind");
        d(), p.addEventListener("load", d), c.push(() => {
          p.removeEventListener("load", d);
        });
      }), () => {
        Kl.removeEventListener("keydown", l), c.forEach((p) => {
          p();
        });
      };
    }), /* @__PURE__ */ Za.createElement(o4, { ...r, visible: n, onVisibleChange: i });
  }, "WithToolTipState");
});

// src/components/index.ts
import { createElement as TM, forwardRef as BM } from "react";

// src/components/components/typography/components.tsx
import ne from "react";

// src/components/components/typography/DocumentFormatting.tsx
var te = /* @__PURE__ */ a(({ ...e }, t) => {
  let r = [e.class, e.className];
  return delete e.class, e.className = ["sbdocs", `sbdocs-${t}`, ...r].filter(Boolean).join(" "), e;
}, "nameSpaceClassNames");

// src/components/components/typography/ResetWrapper.tsx
import { styled as o6 } from "@storybook/core/theming";

// ../node_modules/polished/dist/polished.esm.js
oa();
sp();

// ../node_modules/@babel/runtime/helpers/esm/inheritsLoose.js
ri();
function up(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, Zt(e, t);
}
a(up, "_inheritsLoose");

// ../node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
cp();
ri();

// ../node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function pp(e) {
  try {
    return Function.toString.call(e).indexOf("[native code]") !== -1;
  } catch {
    return typeof e == "function";
  }
}
a(pp, "_isNativeFunction");

// ../node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function ls() {
  try {
    var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch {
  }
  return (ls = /* @__PURE__ */ a(function() {
    return !!e;
  }, "_isNativeReflectConstruct"))();
}
a(ls, "_isNativeReflectConstruct");

// ../node_modules/@babel/runtime/helpers/esm/construct.js
ri();
function dp(e, t, r) {
  if (ls()) return Reflect.construct.apply(null, arguments);
  var n = [null];
  n.push.apply(n, t);
  var o = new (e.bind.apply(e, n))();
  return r && Zt(o, r.prototype), o;
}
a(dp, "_construct");

// ../node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
function oi(e) {
  var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
  return oi = /* @__PURE__ */ a(function(n) {
    if (n === null || !pp(n)) return n;
    if (typeof n != "function") throw new TypeError("Super expression must either be null or a function");
    if (t !== void 0) {
      if (t.has(n)) return t.get(n);
      t.set(n, o);
    }
    function o() {
      return dp(n, arguments, ni(this).constructor);
    }
    return a(o, "Wrapper"), o.prototype = Object.create(n.prototype, {
      constructor: {
        value: o,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }), Zt(o, n);
  }, "_wrapNativeSuper"), oi(e);
}
a(oi, "_wrapNativeSuper");

// ../node_modules/polished/dist/polished.esm.js
var B4 = {
  1: `Passed invalid arguments to hsl, please pass multiple numbers e.g. hsl(360, 0.75, 0.4) or an object e.g. rgb({ hue: 255, saturation: 0\
.4, lightness: 0.75 }).

`,
  2: `Passed invalid arguments to hsla, please pass multiple numbers e.g. hsla(360, 0.75, 0.4, 0.7) or an object e.g. rgb({ hue: 255, satura\
tion: 0.4, lightness: 0.75, alpha: 0.7 }).

`,
  3: `Passed an incorrect argument to a color function, please pass a string representation of a color.

`,
  4: `Couldn't generate valid rgb string from %s, it returned %s.

`,
  5: `Couldn't parse the color string. Please provide the color as a string in hex, rgb, rgba, hsl or hsla notation.

`,
  6: `Passed invalid arguments to rgb, please pass multiple numbers e.g. rgb(255, 205, 100) or an object e.g. rgb({ red: 255, green: 205, bl\
ue: 100 }).

`,
  7: `Passed invalid arguments to rgba, please pass multiple numbers e.g. rgb(255, 205, 100, 0.75) or an object e.g. rgb({ red: 255, green: \
205, blue: 100, alpha: 0.75 }).

`,
  8: `Passed invalid argument to toColorString, please pass a RgbColor, RgbaColor, HslColor or HslaColor object.

`,
  9: `Please provide a number of steps to the modularScale helper.

`,
  10: `Please pass a number or one of the predefined scales to the modularScale helper as the ratio.

`,
  11: `Invalid value passed as base to modularScale, expected number or em string but got "%s"

`,
  12: `Expected a string ending in "px" or a number passed as the first argument to %s(), got "%s" instead.

`,
  13: `Expected a string ending in "px" or a number passed as the second argument to %s(), got "%s" instead.

`,
  14: `Passed invalid pixel value ("%s") to %s(), please pass a value like "12px" or 12.

`,
  15: `Passed invalid base value ("%s") to %s(), please pass a value like "12px" or 12.

`,
  16: `You must provide a template to this method.

`,
  17: `You passed an unsupported selector state to this method.

`,
  18: `minScreen and maxScreen must be provided as stringified numbers with the same units.

`,
  19: `fromSize and toSize must be provided as stringified numbers with the same units.

`,
  20: `expects either an array of objects or a single object with the properties prop, fromSize, and toSize.

`,
  21: "expects the objects in the first argument array to have the properties `prop`, `fromSize`, and `toSize`.\n\n",
  22: "expects the first argument object to have the properties `prop`, `fromSize`, and `toSize`.\n\n",
  23: `fontFace expects a name of a font-family.

`,
  24: `fontFace expects either the path to the font file(s) or a name of a local copy.

`,
  25: `fontFace expects localFonts to be an array.

`,
  26: `fontFace expects fileFormats to be an array.

`,
  27: `radialGradient requries at least 2 color-stops to properly render.

`,
  28: `Please supply a filename to retinaImage() as the first argument.

`,
  29: `Passed invalid argument to triangle, please pass correct pointingDirection e.g. 'right'.

`,
  30: "Passed an invalid value to `height` or `width`. Please provide a pixel based unit.\n\n",
  31: `The animation shorthand only takes 8 arguments. See the specification for more information: http://mdn.io/animation

`,
  32: `To pass multiple animations please supply them in arrays, e.g. animation(['rotate', '2s'], ['move', '1s'])
To pass a single animation please supply them in simple values, e.g. animation('rotate', '2s')

`,
  33: `The animation shorthand arrays can only have 8 elements. See the specification for more information: http://mdn.io/animation

`,
  34: `borderRadius expects a radius value as a string or number as the second argument.

`,
  35: `borderRadius expects one of "top", "bottom", "left" or "right" as the first argument.

`,
  36: `Property must be a string value.

`,
  37: `Syntax Error at %s.

`,
  38: `Formula contains a function that needs parentheses at %s.

`,
  39: `Formula is missing closing parenthesis at %s.

`,
  40: `Formula has too many closing parentheses at %s.

`,
  41: `All values in a formula must have the same unit or be unitless.

`,
  42: `Please provide a number of steps to the modularScale helper.

`,
  43: `Please pass a number or one of the predefined scales to the modularScale helper as the ratio.

`,
  44: `Invalid value passed as base to modularScale, expected number or em/rem string but got %s.

`,
  45: `Passed invalid argument to hslToColorString, please pass a HslColor or HslaColor object.

`,
  46: `Passed invalid argument to rgbToColorString, please pass a RgbColor or RgbaColor object.

`,
  47: `minScreen and maxScreen must be provided as stringified numbers with the same units.

`,
  48: `fromSize and toSize must be provided as stringified numbers with the same units.

`,
  49: `Expects either an array of objects or a single object with the properties prop, fromSize, and toSize.

`,
  50: `Expects the objects in the first argument array to have the properties prop, fromSize, and toSize.

`,
  51: `Expects the first argument object to have the properties prop, fromSize, and toSize.

`,
  52: `fontFace expects either the path to the font file(s) or a name of a local copy.

`,
  53: `fontFace expects localFonts to be an array.

`,
  54: `fontFace expects fileFormats to be an array.

`,
  55: `fontFace expects a name of a font-family.

`,
  56: `linearGradient requries at least 2 color-stops to properly render.

`,
  57: `radialGradient requries at least 2 color-stops to properly render.

`,
  58: `Please supply a filename to retinaImage() as the first argument.

`,
  59: `Passed invalid argument to triangle, please pass correct pointingDirection e.g. 'right'.

`,
  60: "Passed an invalid value to `height` or `width`. Please provide a pixel based unit.\n\n",
  61: `Property must be a string value.

`,
  62: `borderRadius expects a radius value as a string or number as the second argument.

`,
  63: `borderRadius expects one of "top", "bottom", "left" or "right" as the first argument.

`,
  64: `The animation shorthand only takes 8 arguments. See the specification for more information: http://mdn.io/animation.

`,
  65: `To pass multiple animations please supply them in arrays, e.g. animation(['rotate', '2s'], ['move', '1s'])\\nTo pass a single animatio\
n please supply them in simple values, e.g. animation('rotate', '2s').

`,
  66: `The animation shorthand arrays can only have 8 elements. See the specification for more information: http://mdn.io/animation.

`,
  67: `You must provide a template to this method.

`,
  68: `You passed an unsupported selector state to this method.

`,
  69: `Expected a string ending in "px" or a number passed as the first argument to %s(), got %s instead.

`,
  70: `Expected a string ending in "px" or a number passed as the second argument to %s(), got %s instead.

`,
  71: `Passed invalid pixel value %s to %s(), please pass a value like "12px" or 12.

`,
  72: `Passed invalid base value %s to %s(), please pass a value like "12px" or 12.

`,
  73: `Please provide a valid CSS variable.

`,
  74: `CSS variable not found and no default was provided.

`,
  75: `important requires a valid style object, got a %s instead.

`,
  76: `fromSize and toSize must be provided as stringified numbers with the same units as minScreen and maxScreen.

`,
  77: `remToPx expects a value in "rem" but you provided it in "%s".

`,
  78: `base must be set in "px" or "%" but you set it in "%s".
`
};
function I4() {
  for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
    t[r] = arguments[r];
  var n = t[0], o = [], i;
  for (i = 1; i < t.length; i += 1)
    o.push(t[i]);
  return o.forEach(function(l) {
    n = n.replace(/%[a-z]/, l);
  }), n;
}
a(I4, "format");
var Dt = /* @__PURE__ */ function(e) {
  up(t, e);
  function t(r) {
    for (var n, o = arguments.length, i = new Array(o > 1 ? o - 1 : 0), l = 1; l < o; l++)
      i[l - 1] = arguments[l];
    return n = e.call(this, I4.apply(void 0, [B4[r]].concat(i))) || this, lp(n);
  }
  return a(t, "PolishedError"), t;
}(/* @__PURE__ */ oi(Error));
function ss(e) {
  return Math.round(e * 255);
}
a(ss, "colorToInt");
function M4(e, t, r) {
  return ss(e) + "," + ss(t) + "," + ss(r);
}
a(M4, "convertToInt");
function aa(e, t, r, n) {
  if (n === void 0 && (n = M4), t === 0)
    return n(r, r, r);
  var o = (e % 360 + 360) % 360 / 60, i = (1 - Math.abs(2 * r - 1)) * t, l = i * (1 - Math.abs(o % 2 - 1)), u = 0, c = 0, p = 0;
  o >= 0 && o < 1 ? (u = i, c = l) : o >= 1 && o < 2 ? (u = l, c = i) : o >= 2 && o < 3 ? (c = i, p = l) : o >= 3 && o < 4 ? (c = l, p = i) :
  o >= 4 && o < 5 ? (u = l, p = i) : o >= 5 && o < 6 && (u = i, p = l);
  var d = r - i / 2, h = u + d, f = c + d, v = p + d;
  return n(h, f, v);
}
a(aa, "hslToRgb");
var fp = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "639",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
};
function _4(e) {
  if (typeof e != "string") return e;
  var t = e.toLowerCase();
  return fp[t] ? "#" + fp[t] : e;
}
a(_4, "nameToHex");
var P4 = /^#[a-fA-F0-9]{6}$/, H4 = /^#[a-fA-F0-9]{8}$/, z4 = /^#[a-fA-F0-9]{3}$/, O4 = /^#[a-fA-F0-9]{4}$/, us = /^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i,
N4 = /^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i, $4 = /^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i,
j4 = /^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;
function fs(e) {
  if (typeof e != "string")
    throw new Dt(3);
  var t = _4(e);
  if (t.match(P4))
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16)
    };
  if (t.match(H4)) {
    var r = parseFloat((parseInt("" + t[7] + t[8], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16),
      alpha: r
    };
  }
  if (t.match(z4))
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16)
    };
  if (t.match(O4)) {
    var n = parseFloat((parseInt("" + t[4] + t[4], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16),
      alpha: n
    };
  }
  var o = us.exec(t);
  if (o)
    return {
      red: parseInt("" + o[1], 10),
      green: parseInt("" + o[2], 10),
      blue: parseInt("" + o[3], 10)
    };
  var i = N4.exec(t.substring(0, 50));
  if (i)
    return {
      red: parseInt("" + i[1], 10),
      green: parseInt("" + i[2], 10),
      blue: parseInt("" + i[3], 10),
      alpha: parseFloat("" + i[4]) > 1 ? parseFloat("" + i[4]) / 100 : parseFloat("" + i[4])
    };
  var l = $4.exec(t);
  if (l) {
    var u = parseInt("" + l[1], 10), c = parseInt("" + l[2], 10) / 100, p = parseInt("" + l[3], 10) / 100, d = "rgb(" + aa(u, c, p) + ")", h = us.
    exec(d);
    if (!h)
      throw new Dt(4, t, d);
    return {
      red: parseInt("" + h[1], 10),
      green: parseInt("" + h[2], 10),
      blue: parseInt("" + h[3], 10)
    };
  }
  var f = j4.exec(t.substring(0, 50));
  if (f) {
    var v = parseInt("" + f[1], 10), b = parseInt("" + f[2], 10) / 100, m = parseInt("" + f[3], 10) / 100, g = "rgb(" + aa(v, b, m) + ")", y = us.
    exec(g);
    if (!y)
      throw new Dt(4, t, g);
    return {
      red: parseInt("" + y[1], 10),
      green: parseInt("" + y[2], 10),
      blue: parseInt("" + y[3], 10),
      alpha: parseFloat("" + f[4]) > 1 ? parseFloat("" + f[4]) / 100 : parseFloat("" + f[4])
    };
  }
  throw new Dt(5);
}
a(fs, "parseToRgb");
function V4(e) {
  var t = e.red / 255, r = e.green / 255, n = e.blue / 255, o = Math.max(t, r, n), i = Math.min(t, r, n), l = (o + i) / 2;
  if (o === i)
    return e.alpha !== void 0 ? {
      hue: 0,
      saturation: 0,
      lightness: l,
      alpha: e.alpha
    } : {
      hue: 0,
      saturation: 0,
      lightness: l
    };
  var u, c = o - i, p = l > 0.5 ? c / (2 - o - i) : c / (o + i);
  switch (o) {
    case t:
      u = (r - n) / c + (r < n ? 6 : 0);
      break;
    case r:
      u = (n - t) / c + 2;
      break;
    default:
      u = (t - r) / c + 4;
      break;
  }
  return u *= 60, e.alpha !== void 0 ? {
    hue: u,
    saturation: p,
    lightness: l,
    alpha: e.alpha
  } : {
    hue: u,
    saturation: p,
    lightness: l
  };
}
a(V4, "rgbToHsl");
function hp(e) {
  return V4(fs(e));
}
a(hp, "parseToHsl");
var W4 = /* @__PURE__ */ a(function(t) {
  return t.length === 7 && t[1] === t[2] && t[3] === t[4] && t[5] === t[6] ? "#" + t[1] + t[3] + t[5] : t;
}, "reduceHexValue"), ps = W4;
function xr(e) {
  var t = e.toString(16);
  return t.length === 1 ? "0" + t : t;
}
a(xr, "numberToHex");
function cs(e) {
  return xr(Math.round(e * 255));
}
a(cs, "colorToHex");
function q4(e, t, r) {
  return ps("#" + cs(e) + cs(t) + cs(r));
}
a(q4, "convertToHex");
function ai(e, t, r) {
  return aa(e, t, r, q4);
}
a(ai, "hslToHex");
function U4(e, t, r) {
  if (typeof e == "number" && typeof t == "number" && typeof r == "number")
    return ai(e, t, r);
  if (typeof e == "object" && t === void 0 && r === void 0)
    return ai(e.hue, e.saturation, e.lightness);
  throw new Dt(1);
}
a(U4, "hsl");
function G4(e, t, r, n) {
  if (typeof e == "number" && typeof t == "number" && typeof r == "number" && typeof n == "number")
    return n >= 1 ? ai(e, t, r) : "rgba(" + aa(e, t, r) + "," + n + ")";
  if (typeof e == "object" && t === void 0 && r === void 0 && n === void 0)
    return e.alpha >= 1 ? ai(e.hue, e.saturation, e.lightness) : "rgba(" + aa(e.hue, e.saturation, e.lightness) + "," + e.alpha + ")";
  throw new Dt(2);
}
a(G4, "hsla");
function ds(e, t, r) {
  if (typeof e == "number" && typeof t == "number" && typeof r == "number")
    return ps("#" + xr(e) + xr(t) + xr(r));
  if (typeof e == "object" && t === void 0 && r === void 0)
    return ps("#" + xr(e.red) + xr(e.green) + xr(e.blue));
  throw new Dt(6);
}
a(ds, "rgb");
function ia(e, t, r, n) {
  if (typeof e == "string" && typeof t == "number") {
    var o = fs(e);
    return "rgba(" + o.red + "," + o.green + "," + o.blue + "," + t + ")";
  } else {
    if (typeof e == "number" && typeof t == "number" && typeof r == "number" && typeof n == "number")
      return n >= 1 ? ds(e, t, r) : "rgba(" + e + "," + t + "," + r + "," + n + ")";
    if (typeof e == "object" && t === void 0 && r === void 0 && n === void 0)
      return e.alpha >= 1 ? ds(e.red, e.green, e.blue) : "rgba(" + e.red + "," + e.green + "," + e.blue + "," + e.alpha + ")";
  }
  throw new Dt(7);
}
a(ia, "rgba");
var Y4 = /* @__PURE__ */ a(function(t) {
  return typeof t.red == "number" && typeof t.green == "number" && typeof t.blue == "number" && (typeof t.alpha != "number" || typeof t.alpha >
  "u");
}, "isRgb"), X4 = /* @__PURE__ */ a(function(t) {
  return typeof t.red == "number" && typeof t.green == "number" && typeof t.blue == "number" && typeof t.alpha == "number";
}, "isRgba"), K4 = /* @__PURE__ */ a(function(t) {
  return typeof t.hue == "number" && typeof t.saturation == "number" && typeof t.lightness == "number" && (typeof t.alpha != "number" || typeof t.
  alpha > "u");
}, "isHsl"), Z4 = /* @__PURE__ */ a(function(t) {
  return typeof t.hue == "number" && typeof t.saturation == "number" && typeof t.lightness == "number" && typeof t.alpha == "number";
}, "isHsla");
function mp(e) {
  if (typeof e != "object") throw new Dt(8);
  if (X4(e)) return ia(e);
  if (Y4(e)) return ds(e);
  if (Z4(e)) return G4(e);
  if (K4(e)) return U4(e);
  throw new Dt(8);
}
a(mp, "toColorString");
function gp(e, t, r) {
  return /* @__PURE__ */ a(function() {
    var o = r.concat(Array.prototype.slice.call(arguments));
    return o.length >= t ? e.apply(this, o) : gp(e, t, o);
  }, "fn");
}
a(gp, "curried");
function hs(e) {
  return gp(e, e.length, []);
}
a(hs, "curry");
function ms(e, t, r) {
  return Math.max(e, Math.min(t, r));
}
a(ms, "guard");
function J4(e, t) {
  if (t === "transparent") return t;
  var r = hp(t);
  return mp(ve({}, r, {
    lightness: ms(0, 1, r.lightness - parseFloat(e))
  }));
}
a(J4, "darken");
var Q4 = /* @__PURE__ */ hs(J4), Jt = Q4;
function e6(e, t) {
  if (t === "transparent") return t;
  var r = hp(t);
  return mp(ve({}, r, {
    lightness: ms(0, 1, r.lightness + parseFloat(e))
  }));
}
a(e6, "lighten");
var t6 = /* @__PURE__ */ hs(e6), gs = t6;
function r6(e, t) {
  if (t === "transparent") return t;
  var r = fs(t), n = typeof r.alpha == "number" ? r.alpha : 1, o = ve({}, r, {
    alpha: ms(0, 1, +(n * 100 - parseFloat(e) * 100).toFixed(2) / 100)
  });
  return ia(o);
}
a(r6, "transparentize");
var n6 = /* @__PURE__ */ hs(r6), Te = n6;

// src/components/components/typography/lib/common.tsx
var Ze = /* @__PURE__ */ a(({ theme: e }) => ({
  margin: "20px 0 8px",
  padding: 0,
  cursor: "text",
  position: "relative",
  color: e.color.defaultText,
  "&:first-of-type": {
    marginTop: 0,
    paddingTop: 0
  },
  "&:hover a.anchor": {
    textDecoration: "none"
  },
  "& tt, & code": {
    fontSize: "inherit"
  }
}), "headerCommon"), It = /* @__PURE__ */ a(({ theme: e }) => ({
  lineHeight: 1,
  margin: "0 2px",
  padding: "3px 5px",
  whiteSpace: "nowrap",
  borderRadius: 3,
  fontSize: e.typography.size.s2 - 1,
  border: e.base === "light" ? `1px solid ${e.color.mediumlight}` : `1px solid ${e.color.darker}`,
  color: e.base === "light" ? Te(0.1, e.color.defaultText) : Te(0.3, e.color.defaultText),
  backgroundColor: e.base === "light" ? e.color.lighter : e.color.border
}), "codeCommon"), V = /* @__PURE__ */ a(({ theme: e }) => ({
  fontFamily: e.typography.fonts.base,
  fontSize: e.typography.size.s3,
  margin: 0,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
  WebkitOverflowScrolling: "touch"
}), "withReset"), Oe = {
  margin: "16px 0"
};

// src/components/components/typography/ResetWrapper.tsx
var vp = o6.div(V);

// src/components/components/typography/elements/A.tsx
import { styled as i6 } from "@storybook/core/theming";

// src/components/components/typography/elements/Link.tsx
import a6 from "react";
var wp = /* @__PURE__ */ a(({
  href: e = "",
  ...t
}) => {
  let n = /^\//.test(e) ? `./?path=${e}` : e, i = /^#.*/.test(e) ? "_self" : "_top";
  return /* @__PURE__ */ a6.createElement("a", { href: n, target: i, ...t });
}, "Link");

// src/components/components/typography/elements/A.tsx
var vs = i6(wp)(V, ({ theme: e }) => ({
  fontSize: "inherit",
  lineHeight: "24px",
  color: e.color.secondary,
  textDecoration: "none",
  "&.absent": {
    color: "#cc0000"
  },
  "&.anchor": {
    display: "block",
    paddingLeft: 30,
    marginLeft: -30,
    cursor: "pointer",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0
  }
}));

// src/components/components/typography/elements/Blockquote.tsx
import { styled as l6 } from "@storybook/core/theming";
var ws = l6.blockquote(V, Oe, ({ theme: e }) => ({
  borderLeft: `4px solid ${e.color.medium}`,
  padding: "0 15px",
  color: e.color.dark,
  "& > :first-of-type": {
    marginTop: 0
  },
  "& > :last-child": {
    marginBottom: 0
  }
}));

// src/components/components/typography/elements/Code.tsx
ga();
import b5, { Children as fb } from "react";
import { styled as y5 } from "@storybook/core/theming";

// src/components/components/typography/lib/isReactChildString.tsx
var w5 = /* @__PURE__ */ a((e) => typeof e == "string", "isReactChildString");

// src/components/components/typography/elements/Code.tsx
var hb = /[\n\r]/g, mb = y5.code(
  ({ theme: e }) => ({
    // from reset
    fontFamily: e.typography.fonts.mono,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    display: "inline-block",
    paddingLeft: 2,
    paddingRight: 2,
    verticalAlign: "baseline",
    color: "inherit"
  }),
  It
), gb = y5(ma)(({ theme: e }) => ({
  // DocBlocks-specific styling and overrides
  fontFamily: e.typography.fonts.mono,
  fontSize: `${e.typography.size.s2 - 1}px`,
  lineHeight: "19px",
  margin: "25px 0 40px",
  borderRadius: e.appBorderRadius,
  boxShadow: e.base === "light" ? "rgba(0, 0, 0, 0.10) 0 1px 3px 0" : "rgba(0, 0, 0, 0.20) 0 2px 5px 0",
  "pre.prismjs": {
    padding: 20,
    background: "inherit"
  }
})), vu = /* @__PURE__ */ a(({
  className: e,
  children: t,
  ...r
}) => {
  let n = (e || "").match(/lang-(\S+)/), o = fb.toArray(t);
  return o.filter(w5).some((l) => l.match(hb)) ? /* @__PURE__ */ b5.createElement(
    gb,
    {
      bordered: !0,
      copyable: !0,
      language: n?.[1] ?? "text",
      format: !1,
      ...r
    },
    t
  ) : /* @__PURE__ */ b5.createElement(mb, { ...r, className: e }, o);
}, "Code");

// src/components/components/typography/elements/DL.tsx
import { styled as vb } from "@storybook/core/theming";
var wu = vb.dl(V, Oe, {
  padding: 0,
  "& dt": {
    fontSize: "14px",
    fontWeight: "bold",
    fontStyle: "italic",
    padding: 0,
    margin: "16px 0 4px"
  },
  "& dt:first-of-type": {
    padding: 0
  },
  "& dt > :first-of-type": {
    marginTop: 0
  },
  "& dt > :last-child": {
    marginBottom: 0
  },
  "& dd": {
    margin: "0 0 16px",
    padding: "0 15px"
  },
  "& dd > :first-of-type": {
    marginTop: 0
  },
  "& dd > :last-child": {
    marginBottom: 0
  }
});

// src/components/components/typography/elements/Div.tsx
import { styled as wb } from "@storybook/core/theming";
var bu = wb.div(V);

// src/components/components/typography/elements/H1.tsx
import { styled as bb } from "@storybook/core/theming";
var yu = bb.h1(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.l1}px`,
  fontWeight: e.typography.weight.bold
}));

// src/components/components/typography/elements/H2.tsx
import { styled as yb } from "@storybook/core/theming";
var Du = yb.h2(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.m2}px`,
  paddingBottom: 4,
  borderBottom: `1px solid ${e.appBorderColor}`
}));

// src/components/components/typography/elements/H3.tsx
import { styled as Db } from "@storybook/core/theming";
var xu = Db.h3(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.m1}px`
}));

// src/components/components/typography/elements/H4.tsx
import { styled as xb } from "@storybook/core/theming";
var Cu = xb.h4(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.s3}px`
}));

// src/components/components/typography/elements/H5.tsx
import { styled as Cb } from "@storybook/core/theming";
var Eu = Cb.h5(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.s2}px`
}));

// src/components/components/typography/elements/H6.tsx
import { styled as Eb } from "@storybook/core/theming";
var Ru = Eb.h6(V, Ze, ({ theme: e }) => ({
  fontSize: `${e.typography.size.s2}px`,
  color: e.color.dark
}));

// src/components/components/typography/elements/HR.tsx
import { styled as Rb } from "@storybook/core/theming";
var Su = Rb.hr(({ theme: e }) => ({
  border: "0 none",
  borderTop: `1px solid ${e.appBorderColor}`,
  height: 4,
  padding: 0
}));

// src/components/components/typography/elements/Img.tsx
import { styled as Sb } from "@storybook/core/theming";
var Au = Sb.img({
  maxWidth: "100%"
});

// src/components/components/typography/elements/LI.tsx
import { styled as Ab } from "@storybook/core/theming";
var Fu = Ab.li(V, ({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  color: e.color.defaultText,
  lineHeight: "24px",
  "& + li": {
    marginTop: ".25em"
  },
  "& ul, & ol": {
    marginTop: ".25em",
    marginBottom: 0
  },
  "& code": It({ theme: e })
}));

// src/components/components/typography/elements/OL.tsx
import { styled as Fb } from "@storybook/core/theming";
var kb = {
  paddingLeft: 30,
  "& :first-of-type": {
    marginTop: 0
  },
  "& :last-child": {
    marginBottom: 0
  }
}, ku = Fb.ol(V, Oe, kb, {
  listStyle: "decimal"
});

// src/components/components/typography/elements/P.tsx
import { styled as Lb } from "@storybook/core/theming";
var Lu = Lb.p(V, Oe, ({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "24px",
  color: e.color.defaultText,
  "& code": It({ theme: e })
}));

// src/components/components/typography/elements/Pre.tsx
import { styled as Tb } from "@storybook/core/theming";
var Tu = Tb.pre(V, Oe, ({ theme: e }) => ({
  // reset
  fontFamily: e.typography.fonts.mono,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  lineHeight: "18px",
  padding: "11px 1rem",
  whiteSpace: "pre-wrap",
  color: "inherit",
  borderRadius: 3,
  margin: "1rem 0",
  "&:not(.prismjs)": {
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
    margin: 0
  },
  "& pre, &.prismjs": {
    padding: 15,
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "inherit",
    fontSize: "13px",
    lineHeight: "19px",
    code: {
      color: "inherit",
      fontSize: "inherit"
    }
  },
  "& code": {
    whiteSpace: "pre"
  },
  "& code, & tt": {
    border: "none"
  }
}));

// src/components/components/typography/elements/Span.tsx
import { styled as Bb } from "@storybook/core/theming";
var Bu = Bb.span(V, ({ theme: e }) => ({
  "&.frame": {
    display: "block",
    overflow: "hidden",
    "& > span": {
      border: `1px solid ${e.color.medium}`,
      display: "block",
      float: "left",
      overflow: "hidden",
      margin: "13px 0 0",
      padding: 7,
      width: "auto"
    },
    "& span img": {
      display: "block",
      float: "left"
    },
    "& span span": {
      clear: "both",
      color: e.color.darkest,
      display: "block",
      padding: "5px 0 0"
    }
  },
  "&.align-center": {
    display: "block",
    overflow: "hidden",
    clear: "both",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px auto 0",
      textAlign: "center"
    },
    "& span img": {
      margin: "0 auto",
      textAlign: "center"
    }
  },
  "&.align-right": {
    display: "block",
    overflow: "hidden",
    clear: "both",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px 0 0",
      textAlign: "right"
    },
    "& span img": {
      margin: 0,
      textAlign: "right"
    }
  },
  "&.float-left": {
    display: "block",
    marginRight: 13,
    overflow: "hidden",
    float: "left",
    "& span": {
      margin: "13px 0 0"
    }
  },
  "&.float-right": {
    display: "block",
    marginLeft: 13,
    overflow: "hidden",
    float: "right",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px auto 0",
      textAlign: "right"
    }
  }
}));

// src/components/components/typography/elements/TT.tsx
import { styled as Ib } from "@storybook/core/theming";
var Iu = Ib.title(It);

// src/components/components/typography/elements/Table.tsx
import { styled as Mb } from "@storybook/core/theming";
var Mu = Mb.table(V, Oe, ({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "24px",
  padding: 0,
  borderCollapse: "collapse",
  "& tr": {
    borderTop: `1px solid ${e.appBorderColor}`,
    backgroundColor: e.appContentBg,
    margin: 0,
    padding: 0
  },
  "& tr:nth-of-type(2n)": {
    backgroundColor: e.base === "dark" ? e.color.darker : e.color.lighter
  },
  "& tr th": {
    fontWeight: "bold",
    color: e.color.defaultText,
    border: `1px solid ${e.appBorderColor}`,
    margin: 0,
    padding: "6px 13px"
  },
  "& tr td": {
    border: `1px solid ${e.appBorderColor}`,
    color: e.color.defaultText,
    margin: 0,
    padding: "6px 13px"
  },
  "& tr th :first-of-type, & tr td :first-of-type": {
    marginTop: 0
  },
  "& tr th :last-child, & tr td :last-child": {
    marginBottom: 0
  }
}));

// src/components/components/typography/elements/UL.tsx
import { styled as _b } from "@storybook/core/theming";
var Pb = {
  paddingLeft: 30,
  "& :first-of-type": {
    marginTop: 0
  },
  "& :last-child": {
    marginBottom: 0
  }
}, _u = _b.ul(V, Oe, Pb, { listStyle: "disc" });

// src/components/components/typography/components.tsx
var Pu = {
  h1: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(yu, { ...te(e, "h1") }), "h1"),
  h2: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Du, { ...te(e, "h2") }), "h2"),
  h3: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(xu, { ...te(e, "h3") }), "h3"),
  h4: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Cu, { ...te(e, "h4") }), "h4"),
  h5: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Eu, { ...te(e, "h5") }), "h5"),
  h6: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Ru, { ...te(e, "h6") }), "h6"),
  pre: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Tu, { ...te(e, "pre") }), "pre"),
  a: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(vs, { ...te(e, "a") }), "a"),
  hr: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Su, { ...te(e, "hr") }), "hr"),
  dl: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(wu, { ...te(e, "dl") }), "dl"),
  blockquote: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(ws, { ...te(e, "blockquote") }), "blockquote"),
  table: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Mu, { ...te(e, "table") }), "table"),
  img: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Au, { ...te(e, "img") }), "img"),
  div: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(bu, { ...te(e, "div") }), "div"),
  span: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Bu, { ...te(e, "span") }), "span"),
  li: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Fu, { ...te(e, "li") }), "li"),
  ul: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(_u, { ...te(e, "ul") }), "ul"),
  ol: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(ku, { ...te(e, "ol") }), "ol"),
  p: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Lu, { ...te(e, "p") }), "p"),
  code: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(vu, { ...te(e, "code") }), "code"),
  tt: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(Iu, { ...te(e, "tt") }), "tt"),
  resetwrapper: /* @__PURE__ */ a((e) => /* @__PURE__ */ ne.createElement(vp, { ...te(e, "resetwrapper") }), "resetwrapper")
};

// src/components/components/Badge/Badge.tsx
import zb from "react";
import { styled as Ob } from "@storybook/core/theming";
var Nb = Ob.div(
  ({ theme: e }) => ({
    display: "inline-block",
    fontSize: 11,
    lineHeight: "12px",
    alignSelf: "center",
    padding: "4px 12px",
    borderRadius: "3em",
    fontWeight: e.typography.weight.bold
  }),
  {
    svg: {
      height: 12,
      width: 12,
      marginRight: 4,
      marginTop: -2,
      path: {
        fill: "currentColor"
      }
    }
  },
  ({ theme: e, status: t }) => {
    switch (t) {
      case "critical":
        return {
          color: e.color.critical,
          background: e.background.critical
        };
      case "negative":
        return {
          color: e.color.negativeText,
          background: e.background.negative,
          boxShadow: e.base === "light" ? `inset 0 0 0 1px ${Te(0.9, e.color.negativeText)}` : "none"
        };
      case "warning":
        return {
          color: e.color.warningText,
          background: e.background.warning,
          boxShadow: e.base === "light" ? `inset 0 0 0 1px ${Te(0.9, e.color.warningText)}` : "none"
        };
      case "neutral":
        return {
          color: e.color.dark,
          background: e.color.mediumlight,
          boxShadow: e.base === "light" ? `inset 0 0 0 1px ${Te(0.9, e.color.dark)}` : "none"
        };
      case "positive":
        return {
          color: e.color.positiveText,
          background: e.background.positive,
          boxShadow: e.base === "light" ? `inset 0 0 0 1px ${Te(0.9, e.color.positiveText)}` : "none"
        };
      default:
        return {};
    }
  }
), $b = /* @__PURE__ */ a(({ ...e }) => /* @__PURE__ */ zb.createElement(Nb, { ...e }), "Badge");

// src/components/components/typography/link/link.tsx
import $u from "react";
import { styled as D5 } from "@storybook/core/theming";

// ../node_modules/@storybook/icons/dist/index.mjs
var Nu = {};
dn(Nu, {
  AccessibilityAltIcon: () => sx,
  AccessibilityIcon: () => lx,
  AddIcon: () => n9,
  AdminIcon: () => ZD,
  AlertAltIcon: () => T9,
  AlertIcon: () => L9,
  AlignLeftIcon: () => My,
  AlignRightIcon: () => _y,
  AppleIcon: () => e8,
  ArrowBottomLeftIcon: () => CD,
  ArrowBottomRightIcon: () => ED,
  ArrowDownIcon: () => wD,
  ArrowLeftIcon: () => bD,
  ArrowRightIcon: () => yD,
  ArrowSolidDownIcon: () => SD,
  ArrowSolidLeftIcon: () => AD,
  ArrowSolidRightIcon: () => FD,
  ArrowSolidUpIcon: () => RD,
  ArrowTopLeftIcon: () => DD,
  ArrowTopRightIcon: () => xD,
  ArrowUpIcon: () => vD,
  AzureDevOpsIcon: () => i8,
  BackIcon: () => ND,
  BasketIcon: () => eD,
  BatchAcceptIcon: () => K8,
  BatchDenyIcon: () => X8,
  BeakerIcon: () => tD,
  BellIcon: () => P9,
  BitbucketIcon: () => l8,
  BoldIcon: () => jy,
  BookIcon: () => Ry,
  BookmarkHollowIcon: () => V9,
  BookmarkIcon: () => W9,
  BottomBarIcon: () => I8,
  BottomBarToggleIcon: () => M8,
  BoxIcon: () => O8,
  BranchIcon: () => Zy,
  BrowserIcon: () => R8,
  ButtonIcon: () => D9,
  CPUIcon: () => _8,
  CalendarIcon: () => By,
  CameraIcon: () => uy,
  CategoryIcon: () => Fy,
  CertificateIcon: () => K9,
  ChangedIcon: () => s9,
  ChatIcon: () => m9,
  CheckIcon: () => G8,
  ChevronDownIcon: () => pD,
  ChevronLeftIcon: () => dD,
  ChevronRightIcon: () => Ou,
  ChevronSmallDownIcon: () => hD,
  ChevronSmallLeftIcon: () => mD,
  ChevronSmallRightIcon: () => gD,
  ChevronSmallUpIcon: () => fD,
  ChevronUpIcon: () => cD,
  ChromaticIcon: () => s8,
  ChromeIcon: () => o8,
  CircleHollowIcon: () => $9,
  CircleIcon: () => j9,
  ClearIcon: () => c9,
  CloseAltIcon: () => Q8,
  CloseIcon: () => a9,
  CloudHollowIcon: () => oD,
  CloudIcon: () => aD,
  CogIcon: () => j8,
  CollapseIcon: () => LD,
  CommandIcon: () => R9,
  CommentAddIcon: () => d9,
  CommentIcon: () => p9,
  CommentsIcon: () => h9,
  CommitIcon: () => Ky,
  CompassIcon: () => WD,
  ComponentDrivenIcon: () => u8,
  ComponentIcon: () => Wb,
  ContrastIcon: () => ry,
  ControlsIcon: () => Z8,
  CopyIcon: () => Ay,
  CreditIcon: () => y9,
  CrossIcon: () => zu,
  DashboardIcon: () => YD,
  DatabaseIcon: () => P8,
  DeleteIcon: () => i9,
  DiamondIcon: () => q9,
  DirectionIcon: () => JD,
  DiscordIcon: () => c8,
  DocChartIcon: () => Hy,
  DocListIcon: () => zy,
  DocumentIcon: () => Sy,
  DownloadIcon: () => OD,
  DragIcon: () => Oy,
  EditIcon: () => $8,
  EllipsisIcon: () => q8,
  EmailIcon: () => B9,
  ExpandAltIcon: () => kD,
  ExpandIcon: () => TD,
  EyeCloseIcon: () => ey,
  EyeIcon: () => Qb,
  FaceHappyIcon: () => ox,
  FaceNeutralIcon: () => ax,
  FaceSadIcon: () => ix,
  FacebookIcon: () => p8,
  FailedIcon: () => u9,
  FastForwardIcon: () => gy,
  FigmaIcon: () => d8,
  FilterIcon: () => Py,
  FlagIcon: () => nD,
  FolderIcon: () => ky,
  FormIcon: () => Y8,
  GDriveIcon: () => f8,
  GithubIcon: () => h8,
  GitlabIcon: () => m8,
  GlobeIcon: () => VD,
  GoogleIcon: () => g8,
  GraphBarIcon: () => Iy,
  GraphLineIcon: () => Ty,
  GraphqlIcon: () => v8,
  GridAltIcon: () => Yb,
  GridIcon: () => qb,
  GrowIcon: () => ay,
  HeartHollowIcon: () => U9,
  HeartIcon: () => G9,
  HomeIcon: () => KD,
  HourglassIcon: () => rD,
  InfoIcon: () => A9,
  ItalicIcon: () => Vy,
  JumpToIcon: () => N9,
  KeyIcon: () => w9,
  LightningIcon: () => ty,
  LightningOffIcon: () => Hu,
  LinkBrokenIcon: () => _9,
  LinkIcon: () => M9,
  LinkedinIcon: () => C8,
  LinuxIcon: () => t8,
  ListOrderedIcon: () => qy,
  ListUnorderedIcon: () => Uy,
  LocationIcon: () => qD,
  LockIcon: () => g9,
  MarkdownIcon: () => Yy,
  MarkupIcon: () => $y,
  MediumIcon: () => w8,
  MemoryIcon: () => H8,
  MenuIcon: () => Ny,
  MergeIcon: () => Qy,
  MirrorIcon: () => oy,
  MobileIcon: () => A8,
  MoonIcon: () => Ey,
  NutIcon: () => V8,
  OutboxIcon: () => b9,
  OutlineIcon: () => Ub,
  PaintBrushIcon: () => iy,
  PaperClipIcon: () => Wy,
  ParagraphIcon: () => Gy,
  PassedIcon: () => l9,
  PhoneIcon: () => I9,
  PhotoDragIcon: () => Gb,
  PhotoIcon: () => Vb,
  PinAltIcon: () => t9,
  PinIcon: () => UD,
  PlayAllHollowIcon: () => yy,
  PlayBackIcon: () => fy,
  PlayHollowIcon: () => by,
  PlayIcon: () => dy,
  PlayNextIcon: () => hy,
  PlusIcon: () => J8,
  PointerDefaultIcon: () => C9,
  PointerHandIcon: () => E9,
  PowerIcon: () => N8,
  PrintIcon: () => Ly,
  ProceedIcon: () => $D,
  ProfileIcon: () => nx,
  PullRequestIcon: () => Jy,
  QuestionIcon: () => F9,
  RSSIcon: () => H9,
  RedirectIcon: () => MD,
  ReduxIcon: () => b8,
  RefreshIcon: () => jD,
  ReplyIcon: () => PD,
  RepoIcon: () => Xy,
  RequestChangeIcon: () => f9,
  RewindIcon: () => my,
  RulerIcon: () => ly,
  SaveIcon: () => S9,
  SearchIcon: () => Xb,
  ShareAltIcon: () => z9,
  ShareIcon: () => O9,
  ShieldIcon: () => Q9,
  SideBySideIcon: () => Dy,
  SidebarAltIcon: () => L8,
  SidebarAltToggleIcon: () => T8,
  SidebarIcon: () => k8,
  SidebarToggleIcon: () => B8,
  SpeakerIcon: () => py,
  StackedIcon: () => xy,
  StarHollowIcon: () => Y9,
  StarIcon: () => X9,
  StatusFailIcon: () => lD,
  StatusPassIcon: () => uD,
  StatusWarnIcon: () => sD,
  StickerIcon: () => iD,
  StopAltHollowIcon: () => wy,
  StopAltIcon: () => vy,
  StopIcon: () => sy,
  StorybookIcon: () => a8,
  StructureIcon: () => z8,
  SubtractIcon: () => o9,
  SunIcon: () => Cy,
  SupportIcon: () => k9,
  SwitchAltIcon: () => ny,
  SyncIcon: () => HD,
  TabletIcon: () => S8,
  ThumbsUpIcon: () => J9,
  TimeIcon: () => GD,
  TimerIcon: () => XD,
  TransferIcon: () => ID,
  TrashIcon: () => e9,
  TwitterIcon: () => y8,
  TypeIcon: () => x9,
  UbuntuIcon: () => r8,
  UndoIcon: () => _D,
  UnfoldIcon: () => BD,
  UnlockIcon: () => v9,
  UnpinIcon: () => r9,
  UploadIcon: () => zD,
  UserAddIcon: () => tx,
  UserAltIcon: () => ex,
  UserIcon: () => QD,
  UsersIcon: () => rx,
  VSCodeIcon: () => x8,
  VerifiedIcon: () => Z9,
  VideoIcon: () => cy,
  WandIcon: () => U8,
  WatchIcon: () => F8,
  WindowsIcon: () => n8,
  WrenchIcon: () => W8,
  XIcon: () => E8,
  YoutubeIcon: () => D8,
  ZoomIcon: () => Kb,
  ZoomOutIcon: () => Zb,
  ZoomResetIcon: () => Jb,
  iconList: () => jb
});
import * as s from "react";
var jb = [
  {
    name: "Images",
    icons: [
      "PhotoIcon",
      "ComponentIcon",
      "GridIcon",
      "OutlineIcon",
      "PhotoDragIcon",
      "GridAltIcon",
      "SearchIcon",
      "ZoomIcon",
      "ZoomOutIcon",
      "ZoomResetIcon",
      "EyeIcon",
      "EyeCloseIcon",
      "LightningIcon",
      "LightningOffIcon",
      "ContrastIcon",
      "SwitchAltIcon",
      "MirrorIcon",
      "GrowIcon",
      "PaintBrushIcon",
      "RulerIcon",
      "StopIcon",
      "CameraIcon",
      "VideoIcon",
      "SpeakerIcon",
      "PlayIcon",
      "PlayBackIcon",
      "PlayNextIcon",
      "RewindIcon",
      "FastForwardIcon",
      "StopAltIcon",
      "StopAltHollowIcon",
      "PlayHollowIcon",
      "PlayAllHollowIcon",
      "SideBySideIcon",
      "StackedIcon",
      "SunIcon",
      "MoonIcon"
    ]
  },
  {
    name: "Documents",
    icons: [
      "BookIcon",
      "DocumentIcon",
      "CopyIcon",
      "CategoryIcon",
      "FolderIcon",
      "PrintIcon",
      "GraphLineIcon",
      "CalendarIcon",
      "GraphBarIcon",
      "AlignLeftIcon",
      "AlignRightIcon",
      "FilterIcon",
      "DocChartIcon",
      "DocListIcon",
      "DragIcon",
      "MenuIcon"
    ]
  },
  {
    name: "Editing",
    icons: [
      "MarkupIcon",
      "BoldIcon",
      "ItalicIcon",
      "PaperClipIcon",
      "ListOrderedIcon",
      "ListUnorderedIcon",
      "ParagraphIcon",
      "MarkdownIcon"
    ]
  },
  {
    name: "Git",
    icons: [
      "RepoIcon",
      "CommitIcon",
      "BranchIcon",
      "PullRequestIcon",
      "MergeIcon"
    ]
  },
  {
    name: "OS",
    icons: [
      "AppleIcon",
      "LinuxIcon",
      "UbuntuIcon",
      "WindowsIcon",
      "ChromeIcon"
    ]
  },
  {
    name: "Logos",
    icons: [
      "StorybookIcon",
      "AzureDevOpsIcon",
      "BitbucketIcon",
      "ChromaticIcon",
      "ComponentDrivenIcon",
      "DiscordIcon",
      "FacebookIcon",
      "FigmaIcon",
      "GDriveIcon",
      "GithubIcon",
      "GitlabIcon",
      "GoogleIcon",
      "GraphqlIcon",
      "MediumIcon",
      "ReduxIcon",
      "TwitterIcon",
      "YoutubeIcon",
      "VSCodeIcon",
      "LinkedinIcon",
      "XIcon"
    ]
  },
  {
    name: "Devices",
    icons: [
      "BrowserIcon",
      "TabletIcon",
      "MobileIcon",
      "WatchIcon",
      "SidebarIcon",
      "SidebarAltIcon",
      "SidebarAltToggleIcon",
      "SidebarToggleIcon",
      "BottomBarIcon",
      "BottomBarToggleIcon",
      "CPUIcon",
      "DatabaseIcon",
      "MemoryIcon",
      "StructureIcon",
      "BoxIcon",
      "PowerIcon"
    ]
  },
  {
    name: "CRUD",
    icons: [
      "EditIcon",
      "CogIcon",
      "NutIcon",
      "WrenchIcon",
      "EllipsisIcon",
      "WandIcon",
      "CheckIcon",
      "FormIcon",
      "BatchDenyIcon",
      "BatchAcceptIcon",
      "ControlsIcon",
      "PlusIcon",
      "CloseAltIcon",
      "CrossIcon",
      "TrashIcon",
      "PinAltIcon",
      "UnpinIcon",
      "AddIcon",
      "SubtractIcon",
      "CloseIcon",
      "DeleteIcon",
      "PassedIcon",
      "ChangedIcon",
      "FailedIcon",
      "ClearIcon",
      "CommentIcon",
      "CommentAddIcon",
      "RequestChangeIcon",
      "CommentsIcon",
      "ChatIcon",
      "LockIcon",
      "UnlockIcon",
      "KeyIcon",
      "OutboxIcon",
      "CreditIcon",
      "ButtonIcon",
      "TypeIcon",
      "PointerDefaultIcon",
      "PointerHandIcon",
      "CommandIcon",
      "SaveIcon"
    ]
  },
  {
    name: "Communicate",
    icons: [
      "InfoIcon",
      "QuestionIcon",
      "SupportIcon",
      "AlertIcon",
      "AlertAltIcon",
      "EmailIcon",
      "PhoneIcon",
      "LinkIcon",
      "LinkBrokenIcon",
      "BellIcon",
      "RSSIcon",
      "ShareAltIcon",
      "ShareIcon",
      "JumpToIcon",
      "CircleHollowIcon",
      "CircleIcon",
      "BookmarkHollowIcon",
      "BookmarkIcon",
      "DiamondIcon",
      "HeartHollowIcon",
      "HeartIcon",
      "StarHollowIcon",
      "StarIcon",
      "CertificateIcon",
      "VerifiedIcon",
      "ThumbsUpIcon",
      "ShieldIcon",
      "BasketIcon",
      "BeakerIcon",
      "HourglassIcon",
      "FlagIcon",
      "CloudHollowIcon",
      "CloudIcon",
      "StickerIcon",
      "StatusFailIcon",
      "StatusWarnIcon",
      "StatusPassIcon"
    ]
  },
  {
    name: "Wayfinding",
    icons: [
      "ChevronUpIcon",
      "ChevronDownIcon",
      "ChevronLeftIcon",
      "ChevronRightIcon",
      "ChevronSmallUpIcon",
      "ChevronSmallDownIcon",
      "ChevronSmallLeftIcon",
      "ChevronSmallRightIcon",
      "ArrowUpIcon",
      "ArrowDownIcon",
      "ArrowLeftIcon",
      "ArrowRightIcon",
      "ArrowTopLeftIcon",
      "ArrowTopRightIcon",
      "ArrowBottomLeftIcon",
      "ArrowBottomRightIcon",
      "ArrowSolidUpIcon",
      "ArrowSolidDownIcon",
      "ArrowSolidLeftIcon",
      "ArrowSolidRightIcon",
      "ExpandAltIcon",
      "CollapseIcon",
      "ExpandIcon",
      "UnfoldIcon",
      "TransferIcon",
      "RedirectIcon",
      "UndoIcon",
      "ReplyIcon",
      "SyncIcon",
      "UploadIcon",
      "DownloadIcon",
      "BackIcon",
      "ProceedIcon",
      "RefreshIcon",
      "GlobeIcon",
      "CompassIcon",
      "LocationIcon",
      "PinIcon",
      "TimeIcon",
      "DashboardIcon",
      "TimerIcon",
      "HomeIcon",
      "AdminIcon",
      "DirectionIcon"
    ]
  },
  {
    name: "People",
    icons: [
      "UserIcon",
      "UserAltIcon",
      "UserAddIcon",
      "UsersIcon",
      "ProfileIcon",
      "FaceHappyIcon",
      "FaceNeutralIcon",
      "FaceSadIcon",
      "AccessibilityIcon",
      "AccessibilityAltIcon"
    ]
  }
], Vb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.25 4.254a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-.5 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13 1.504v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5zM2 9.297V2.004h10v5.293L9.854 5.15a.5.5 0 00-.\
708 0L6.5 7.797 5.354 6.65a.5.5 0 00-.708 0L2 9.297zM9.5 6.21l2.5 2.5v3.293H2V10.71l3-3 3.146 3.146a.5.5 0 00.708-.707L7.207 8.504 9.5 6.21z",
      fill: e
    }
  )
)), Wb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 1.004a2.5 2.5 0 00-2.5 2.5v7a2.5 2.5 0 002.5 2.5h7a2.5 2.5 0 002.5-2.5v-7a2.5 2.5 0 00-2.5-2.5h-7zm8.5 5.5H7.5v-4.5h3a1.5 1.5\
 0 011.5 1.5v3zm0 1v3a1.5 1.5 0 01-1.5 1.5h-3v-4.5H12zm-5.5 4.5v-4.5H2v3a1.5 1.5 0 001.5 1.5h3zM2 6.504h4.5v-4.5h-3a1.5 1.5 0 00-1.5 1.5v3z",
      fill: e
    }
  )
)), qb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.504a.5.5 0 01.5-.5H6a.5.5 0 01.5.5v4.5a.5.5 0 01-.5.5H1.5a.5.5 0 01-.5-.5v-4.5zm1 4v-3.5h3.5v3.5H2zM7.5 1.504a.5.5 0 01.5-.5h\
4.5a.5.5 0 01.5.5v4.5a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-4.5zm1 4v-3.5H12v3.5H8.5zM1.5 7.504a.5.5 0 00-.5.5v4.5a.5.5 0 00.5.5H6a.5.5 0 00.5-.\
5v-4.5a.5.5 0 00-.5-.5H1.5zm.5 1v3.5h3.5v-3.5H2zM7.5 8.004a.5.5 0 01.5-.5h4.5a.5.5 0 01.5.5v4.5a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-4.5zm1 4v-\
3.5H12v3.5H8.5z",
      fill: e
    }
  )
)), Ub = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 2.004v2H1v-2.5a.5.5 0 01.5-.5H4v1H2zM1 9.004v-4h1v4H1zM1 10.004v2.5a.5.5 0 00.5.5H4v-1H2v-2H1zM10 13.004h2.5a.5.5 0 00.5-.5v-2.\
5h-1v2h-2v1zM12 4.004h1v-2.5a.5.5 0 00-.5-.5H10v1h2v2zM9 12.004v1H5v-1h4zM9 1.004v1H5v-1h4zM13 9.004h-1v-4h1v4zM7 8.004a1 1 0 100-2 1 1 0 00\
0 2z",
      fill: e
    }
  )
)), Gb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M8.25 3.254a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-.5 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7.003v-6.5a.5.5 0 00-.5-.5h-10a.5.5 0 00-.5.5v2.5H.5a.5.5 0 00-.5.5v2.5h1v-2h2v6.5a.5.5 0 00.5.5H10v2H8v1h2.5a.5.5 0 00.5-.5v-\
2.5h2.5a.5.5 0 00.5-.5v-3.5zm-10-6v5.794L5.646 5.15a.5.5 0 01.708 0L7.5 6.297l2.646-2.647a.5.5 0 01.708 0L13 5.797V1.004H4zm9 6.208l-2.5-2.5\
-2.293 2.293L9.354 8.15a.5.5 0 11-.708.707L6 6.211l-2 2v1.793h9V7.21z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M0 10.004v-3h1v3H0zM0 13.504v-2.5h1v2h2v1H.5a.5.5 0 01-.5-.5zM7 14.004H4v-1h3v1z",
      fill: e
    }
  )
)), Yb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4 3V1h1v2H4zM4 6v2h1V6H4zM4 11v2h1v-2H4zM9 11v2h1v-2H9zM9 8V6h1v2H9zM9 1v2h1V1H9zM13 5h-2V4h2v1zM11 10h2V9h-2v1zM3 10H1V9h2v1zM1 \
5h2V4H1v1zM8 5H6V4h2v1zM6 10h2V9H6v1zM4 4h1v1H4V4zM10 4H9v1h1V4zM9 9h1v1H9V9zM5 9H4v1h1V9z",
      fill: e
    }
  )
)), Xb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M9.544 10.206a5.5 5.5 0 11.662-.662.5.5 0 01.148.102l3 3a.5.5 0 01-.708.708l-3-3a.5.5 0 01-.102-.148zM10.5 6a4.5 4.5 0 11-9 0 4.5 \
4.5 0 019 0z",
      fill: e
    }
  )
)), Kb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6 3.5a.5.5 0 01.5.5v1.5H8a.5.5 0 010 1H6.5V8a.5.5 0 01-1 0V6.5H4a.5.5 0 010-1h1.5V4a.5.5 0 01.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M9.544 10.206a5.5 5.5 0 11.662-.662.5.5 0 01.148.102l3 3a.5.5 0 01-.708.708l-3-3a.5.5 0 01-.102-.148zM10.5 6a4.5 4.5 0 11-9 0 4.5 \
4.5 0 019 0z",
      fill: e
    }
  )
)), Zb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M4 5.5a.5.5 0 000 1h4a.5.5 0 000-1H4z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6 11.5c1.35 0 2.587-.487 3.544-1.294a.5.5 0 00.102.148l3 3a.5.5 0 00.708-.708l-3-3a.5.5 0 00-.148-.102A5.5 5.5 0 106 11.5zm0-1a4.\
5 4.5 0 100-9 4.5 4.5 0 000 9z",
      fill: e
    }
  )
)), Jb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 2.837V1.5a.5.5 0 00-1 0V4a.5.5 0 00.5.5h2.5a.5.5 0 000-1H2.258a4.5 4.5 0 11-.496 4.016.5.5 0 10-.942.337 5.502 5.502 0 008.72\
4 2.353.5.5 0 00.102.148l3 3a.5.5 0 00.708-.708l-3-3a.5.5 0 00-.148-.102A5.5 5.5 0 101.5 2.837z",
      fill: e
    }
  )
)), Qb = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M7 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7l-.21.293C13.669 7.465 10.739 11.5 7 11.5S.332 7.465.21 7.293L0 7l.21-.293C.331 6.536 3.261 2.5 7 2.5s6.668 4.036 6.79 4.207L\
14 7zM2.896 5.302A12.725 12.725 0 001.245 7c.296.37.874 1.04 1.65 1.698C4.043 9.67 5.482 10.5 7 10.5c1.518 0 2.958-.83 4.104-1.802A12.72 12.\
72 0 0012.755 7c-.297-.37-.875-1.04-1.65-1.698C9.957 4.33 8.517 3.5 7 3.5c-1.519 0-2.958.83-4.104 1.802z",
      fill: e
    }
  )
)), ey = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.854 1.146a.5.5 0 10-.708.708l11 11a.5.5 0 00.708-.708l-11-11zM11.104 8.698c-.177.15-.362.298-.553.439l.714.714a13.25 13.25 0 00\
2.526-2.558L14 7l-.21-.293C13.669 6.536 10.739 2.5 7 2.5c-.89 0-1.735.229-2.506.58l.764.763A4.859 4.859 0 017 3.5c1.518 0 2.958.83 4.104 1.8\
02A12.724 12.724 0 0112.755 7a12.72 12.72 0 01-1.65 1.698zM.21 6.707c.069-.096 1.03-1.42 2.525-2.558l.714.714c-.191.141-.376.288-.553.439A12\
.725 12.725 0 001.245 7c.296.37.874 1.04 1.65 1.698C4.043 9.67 5.482 10.5 7 10.5a4.86 4.86 0 001.742-.344l.764.764c-.772.351-1.616.58-2.506.\
58C3.262 11.5.332 7.465.21 7.293L0 7l.21-.293z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.5 7c0-.322.061-.63.172-.914l3.242 3.242A2.5 2.5 0 014.5 7zM9.328 7.914L6.086 4.672a2.5 2.5 0 013.241 3.241z",
      fill: e
    }
  )
)), ty = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.522 6.6a.566.566 0 00-.176.544.534.534 0 00.382.41l2.781.721-1.493 5.013a.563.563 0 00.216.627.496.496 0 00.63-.06l6.637-6.453a\
.568.568 0 00.151-.54.534.534 0 00-.377-.396l-2.705-.708 2.22-4.976a.568.568 0 00-.15-.666.497.497 0 00-.648.008L2.522 6.6zm7.72.63l-3.067-.\
804L9.02 2.29 3.814 6.803l2.95.764-1.277 4.285 4.754-4.622zM4.51 13.435l.037.011-.037-.011z",
      fill: e
    }
  )
)), Hu = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.139 8.725l1.36-1.323a.568.568 0 00.151-.54.534.534 0 00-.377-.396l-2.705-.708 2.22-4.976a.568.568 0 00-.15-.666.497.497 0 00-.\
648.008L5.464 4.05l.708.71 2.848-2.47-1.64 3.677.697.697 2.164.567-.81.787.708.708zM2.523 6.6a.566.566 0 00-.177.544.534.534 0 00.382.41l2.7\
82.721-1.494 5.013a.563.563 0 00.217.627.496.496 0 00.629-.06l3.843-3.736-.708-.707-2.51 2.44 1.137-3.814-.685-.685-2.125-.55.844-.731-.71-.\
71L2.524 6.6zM1.854 1.146a.5.5 0 10-.708.708l11 11a.5.5 0 00.708-.708l-11-11z",
      fill: e
    }
  )
)), ry = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3 3.004H.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-2.5h2.5a.5.5 0 00.5-.5v-10a.5.5 0 00-.5-.5h-10a.5.5 0 00-.5.5v2.5zm\
1 1v2.293l2.293-2.293H4zm-1 0v6.5a.499.499 0 00.497.5H10v2H1v-9h2zm1-1h6.5a.499.499 0 01.5.5v6.5h2v-9H4v2zm6 7V7.71l-2.293 2.293H10zm0-3.707\
V4.71l-5.293 5.293h1.586L10 6.297zm-.707-2.293H7.707L4 7.71v1.586l5.293-5.293z",
      fill: e
    }
  )
)), ny = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3 3.004v-2.5a.5.5 0 01.5-.5h10a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H11v2.5a.5.5 0 01-.5.5H.5a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5H3zm1 0\
v-2h9v9h-2v-6.5a.5.5 0 00-.5-.5H4zm6 8v2H1v-9h2v6.5a.5.5 0 00.5.5H10zm0-1H4v-6h6v6z",
      fill: e
    }
  )
)), oy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.504a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zm1 10.5h10v-10l-10 10z",
      fill: e
    }
  )
)), ay = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 1.004a.5.5 0 100 1H12v10.5a.5.5 0 001 0v-10.5a1 1 0 00-1-1H1.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1 3.504a.5.5 0 01.5-.5H10a1 1 0 011 1v8.5a.5.5 0 01-1 0v-8.5H1.5a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 5.004a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-7zm.5 1v6h6v-6H2z",
      fill: e
    }
  )
)), iy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.854.146a.5.5 0 00-.708 0L2.983 8.31a2.24 2.24 0 00-1.074.6C.677 10.14.24 11.902.085 12.997 0 13.6 0 14 0 14s.4 0 1.002-.085c1.\
095-.155 2.857-.592 4.089-1.824a2.24 2.24 0 00.6-1.074l8.163-8.163a.5.5 0 000-.708l-2-2zM5.6 9.692l.942-.942L5.25 7.457l-.942.943A2.242 2.24\
2 0 015.6 9.692zm1.649-1.65L12.793 2.5 11.5 1.207 5.957 6.75 7.25 8.043zM4.384 9.617a1.25 1.25 0 010 1.768c-.767.766-1.832 1.185-2.78 1.403-\
.17.04-.335.072-.49.098.027-.154.06-.318.099-.49.219-.947.637-2.012 1.403-2.779a1.25 1.25 0 011.768 0z",
      fill: e
    }
  )
)), ly = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 1.004a.5.5 0 01.5.5v.5h10v-.5a.5.5 0 011 0v2a.5.5 0 01-1 0v-.5H2v.5a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 6a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-6a.5.5 0 00-.5-.5h-11zM2 7v5h10V7h-1v2.5a.5.5 0 01-1 0V7h-.75v1a.5.5 0 01\
-1 0V7H7.5v2.5a.5.5 0 01-1 0V7h-.75v1a.5.5 0 01-1 0V7H4v2.5a.5.5 0 01-1 0V7H2z",
      fill: e
    }
  )
)), sy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.5 4a.5.5 0 00-.5.5v5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-5a.5.5 0 00-.5-.5h-5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), uy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10 7a3 3 0 11-6 0 3 3 0 016 0zM9 7a2 2 0 11-4 0 2 2 0 014 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.5 1a.5.5 0 00-.5.5v.504H.5a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5H6V1.5a.5.5 0 00-.5-.5h-3zM1 3.00\
4v8h12v-8H1z",
      fill: e
    }
  )
)), cy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M2.5 10a.5.5 0 100-1 .5.5 0 000 1z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 4a2 2 0 012-2h6a2 2 0 012 2v.5l3.189-2.391A.5.5 0 0114 2.5v9a.5.5 0 01-.804.397L10 9.5v.5a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm9 0v1.\
5a.5.5 0 00.8.4L13 3.5v7L9.8 8.1a.5.5 0 00-.8.4V10a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1h6a1 1 0 011 1z",
      fill: e
    }
  )
)), py = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 4.5v5a.5.5 0 00.5.5H4l3.17 2.775a.5.5 0 00.83-.377V1.602a.5.5 0 00-.83-.376L4 4H1.5a.5.5 0 00-.5.5zM4 9V5H2v4h2zm.998.545A.504.\
504 0 005 9.5v-5c0-.015 0-.03-.002-.044L7 2.704v8.592L4.998 9.545z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.15 1.752a.5.5 0 00-.3.954 4.502 4.502 0 010 8.588.5.5 0 00.3.954 5.502 5.502 0 000-10.496z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.25 3.969a.5.5 0 00-.5.865 2.499 2.499 0 010 4.332.5.5 0 10.5.866 3.499 3.499 0 000-6.063z",
      fill: e
    }
  )
)), dy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M12.813 7.425l-9.05 5.603A.5.5 0 013 12.603V1.398a.5.5 0 01.763-.425l9.05 5.602a.5.5 0 010 .85z",
      fill: e
    }
  )
)), fy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.24 12.035L3.697 7.427A.494.494 0 013.5 7.2v4.05a.75.75 0 01-1.5 0v-8.5a.75.75 0 011.5 0V6.8a.494.494 0 01.198-.227l7.541-4.608\
A.5.5 0 0112 2.39v9.217a.5.5 0 01-.76.427z",
      fill: e
    }
  )
)), hy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.76 12.035l7.542-4.608A.495.495 0 0010.5 7.2v4.05a.75.75 0 001.5 0v-8.5a.75.75 0 00-1.5 0V6.8a.495.495 0 00-.198-.227L2.76 1.965\
A.5.5 0 002 2.39v9.217a.5.5 0 00.76.427z",
      fill: e
    }
  )
)), my = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9 2.42v2.315l4.228-2.736a.5.5 0 01.772.42v9.162a.5.5 0 01-.772.42L9 9.263v2.317a.5.5 0 01-.772.42L1.5 7.647v3.603a.75.75 0 01-1.5\
 0v-8.5a.75.75 0 011.5 0v3.603L8.228 2A.5.5 0 019 2.42z",
      fill: e
    }
  )
)), gy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5 2.42v2.315L.772 1.999a.5.5 0 00-.772.42v9.162a.5.5 0 00.772.42L5 9.263v2.317a.5.5 0 00.772.42L12.5 7.647v3.603a.75.75 0 001.5 0\
v-8.5a.75.75 0 00-1.5 0v3.603L5.772 2A.5.5 0 005 2.42z",
      fill: e
    }
  )
)), vy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1 1.504a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11z",
      fill: e
    }
  )
)), wy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.2 2.204v9.6h9.6v-9.6H2.2zm-.7-1.2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z",
      fill: e
    }
  )
)), by = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.2 10.88L10.668 7 4.2 3.12v7.76zM3 2.414v9.174a.8.8 0 001.212.686l7.645-4.587a.8.8 0 000-1.372L4.212 1.727A.8.8 0 003 2.413z",
      fill: e
    }
  )
)), yy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5.2 10.88L11.668 7 5.2 3.12v7.76zM4 2.414v9.174a.8.8 0 001.212.686l7.645-4.587a.8.8 0 000-1.372L5.212 1.727A.8.8 0 004 2.413zM1.5\
 1.6a.6.6 0 01.6.6v9.6a.6.6 0 11-1.2 0V2.2a.6.6 0 01.6-.6z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M.963 1.932a.6.6 0 01.805-.268l1 .5a.6.6 0 01-.536 1.073l-1-.5a.6.6 0 01-.269-.805zM3.037 11.132a.6.6 0 01-.269.805l-1 .5a.6.6 0 0\
1-.536-1.073l1-.5a.6.6 0 01.805.268z",
      fill: e
    }
  )
)), Dy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.504a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zm1 10.5v-10h5v10H2z",
      fill: e
    }
  )
)), xy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12.5 1.004a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11zm-10.5 1h10v5H2v-5z",
      fill: e
    }
  )
)), Cy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3492)", fill: e }, /* @__PURE__ */ s.createElement("path", { d: "\
M7.5.5a.5.5 0 00-1 0V2a.5.5 0 001 0V.5z" }), /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 10a3 3 0 100-6 3 3 0 000 6zm0-1a2 2 0 100-4 2 2 0 000 4z"
    }
  ), /* @__PURE__ */ s.createElement("path", { d: "M7 11.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V12a.5.5 0 01.5-.5zM11.5 7a.5.5 0 01.5-.5h1.5a.5.5\
 0 010 1H12a.5.5 0 01-.5-.5zM.5 6.5a.5.5 0 000 1H2a.5.5 0 000-1H.5zM3.818 10.182a.5.5 0 010 .707l-1.06 1.06a.5.5 0 11-.708-.706l1.06-1.06a.5\
.5 0 01.708 0zM11.95 2.757a.5.5 0 10-.707-.707l-1.061 1.061a.5.5 0 10.707.707l1.06-1.06zM10.182 10.182a.5.5 0 01.707 0l1.06 1.06a.5.5 0 11-.\
706.708l-1.061-1.06a.5.5 0 010-.708zM2.757 2.05a.5.5 0 10-.707.707l1.06 1.061a.5.5 0 00.708-.707l-1.06-1.06z" })),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3492" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), Ey = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3493)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M8.335.047l-.15-.015a7.499 7.499 0 106.14 10.577c.103-.229-.156-.447-.386-.346a5.393 5.393 0 01-.771.27A5.356 5.356 0 019.153.691C\
9.37.568 9.352.23 9.106.175a7.545 7.545 0 00-.77-.128zM6.977 1.092a6.427 6.427 0 005.336 10.671A6.427 6.427 0 116.977 1.092z",
      fill: e
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3493" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      fill: "#fff",
      transform: "scale(1.07124)",
      d: "M0 0h14.001v14.002H0z"
    }
  )))
)), Ry = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13 2a2 2 0 00-2-2H1.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5H11a2 2 0 002-2V2zM3 13h8a1 1 0 001-1V2a1 1 0 00-1-1H7v6.004a.5.5 0 01-.856.\
352l-.002-.002L5.5 6.71l-.645.647A.5.5 0 014 7.009V1H3v12zM5 1v4.793l.146-.146a.5.5 0 01.743.039l.111.11V1H5z",
      fill: e
    }
  )
)), Sy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4 5.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM4.5 7.5a.5.5 0 000 1h5a.5.5 0 000-1h-5zM4 10.5a.5.5 0 01.5-.5h5a.5.5 0 01\
0 1h-5a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V3.207a.5.5 0 00-.146-.353L10.146.146A.5.5 0 009.793 0H1.5zM2 1h7.5v2a.5.5\
 0 00.5.5h2V13H2V1z",
      fill: e
    }
  )
)), Ay = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.746.07A.5.5 0 0011.5.003h-6a.5.5 0 00-.5.5v2.5H.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h8a.5.5 0 00.5-.5v-2.5h4.5a.5.5 0 00.5-.5v-8a\
.498.498 0 00-.15-.357L11.857.154a.506.506 0 00-.11-.085zM9 10.003h4v-7h-1.5a.5.5 0 01-.5-.5v-1.5H6v2h.5a.5.5 0 01.357.15L8.85 5.147c.093.09\
.15.217.15.357v4.5zm-8-6v9h7v-7H6.5a.5.5 0 01-.5-.5v-1.5H1z",
      fill: e
    }
  )
)), Fy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3 1.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zM2 3.504a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 5.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-7zM2 12V6h10v6H2z",
      fill: e
    }
  )
)), ky = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.586 3.504l-1.5-1.5H1v9h12v-7.5H6.586zm.414-1L5.793 1.297a1 1 0 00-.707-.293H.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h13a.5.5 0 00.5-.\
5v-8.5a.5.5 0 00-.5-.5H7z",
      fill: e
    }
  )
)), Ly = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.5 8.004a.5.5 0 100 1h5a.5.5 0 000-1h-5zM4.5 10.004a.5.5 0 000 1h5a.5.5 0 000-1h-5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2 1.504a.5.5 0 01.5-.5h8a.498.498 0 01.357.15l.993.993c.093.09.15.217.15.357v1.5h1.5a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H12v2.5a.5.5 0\
 01-.5.5h-9a.5.5 0 01-.5-.5v-2.5H.5a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5H2v-2.5zm11 7.5h-1v-2.5a.5.5 0 00-.5-.5h-9a.5.5 0 00-.5.5v2.5H1v-4h12v4\
zm-2-6v1H3v-2h7v.5a.5.5 0 00.5.5h.5zm-8 9h8v-5H3v5z",
      fill: e
    }
  )
)), Ty = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.146 6.15a.5.5 0 01.708 0L7 7.297 9.146 5.15a.5.5 0 01.708 0l1 1a.5.5 0 01-.708.707L9.5 6.211 7.354 8.357a.5.5 0 01-.708 0L5.5 7\
.211 3.854 8.857a.5.5 0 11-.708-.707l2-2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 1.004a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11zm.5 1v10h10v-10H2z",
      fill: e
    }
  )
)), By = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 0a.5.5 0 01.5.5V1h6V.5a.5.5 0 011 0V1h1.5a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5H3V.5a.5.5 0 \
01.5-.5zM2 4v2.3h3V4H2zm0 5.2V6.8h3v2.4H2zm0 .5V12h3V9.7H2zm3.5 0V12h3V9.7h-3zm3.5 0V12h3V9.7H9zm3-.5H9V6.8h3v2.4zm-3.5 0h-3V6.8h3v2.4zM9 4v\
2.3h3V4H9zM5.5 6.3h3V4h-3v2.3z",
      fill: e
    }
  )
)), Iy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M12 2.5a.5.5 0 00-1 0v10a.5.5 0 001 0v-10zM9 4.5a.5.5 0 00-1 0v8a.5.5 0 001 0v-8zM5.5 7a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01\
.5-.5zM3 10.5a.5.5 0 00-1 0v2a.5.5 0 001 0v-2z",
      fill: e
    }
  )
)), My = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M13 2a.5.5 0 010 1H1a.5.5 0 010-1h12zM10 5a.5.5 0 010 1H1a.5.5 0 010-1h9zM11.5 8.5A.5.5 0 0011 8H1a.5.5 0 000 1h10a.5.5 0 00.5-.5z\
M7.5 11a.5.5 0 010 1H1a.5.5 0 010-1h6.5z",
      fill: e
    }
  )
)), _y = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1 2a.5.5 0 000 1h12a.5.5 0 000-1H1zM4 5a.5.5 0 000 1h9a.5.5 0 000-1H4zM2.5 8.5A.5.5 0 013 8h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zM6.\
5 11a.5.5 0 000 1H13a.5.5 0 000-1H6.5z",
      fill: e
    }
  )
)), Py = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1 2a.5.5 0 000 1h12a.5.5 0 000-1H1zM3 5a.5.5 0 000 1h8a.5.5 0 000-1H3zM4.5 8.5A.5.5 0 015 8h4a.5.5 0 010 1H5a.5.5 0 01-.5-.5zM6.5\
 11a.5.5 0 000 1h1a.5.5 0 000-1h-1z",
      fill: e
    }
  )
)), Hy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zM2 4v2.3h3V4H2zm0 5.2V6.8h3v2.4H2zm0 .5V12h3V9.7H\
2zm3.5 0V12h3V9.7h-3zm3.5 0V12h3V9.7H9zm3-.5H9V6.8h3v2.4zm-3.5 0h-3V6.8h3v2.4zM9 6.3h3V4H9v2.3zm-3.5 0h3V4h-3v2.3z",
      fill: e
    }
  )
)), zy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.5 6.5A.5.5 0 014 6h6a.5.5 0 010 1H4a.5.5 0 01-.5-.5zM4 9a.5.5 0 000 1h6a.5.5 0 000-1H4z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zM2 4v8h10V4H2z",
      fill: e
    }
  )
)), Oy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M13 4a.5.5 0 010 1H1a.5.5 0 010-1h12zM13.5 9.5A.5.5 0 0013 9H1a.5.5 0 000 1h12a.5.5 0 00.5-.5z",
      fill: e
    }
  )
)), Ny = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M13 3.5a.5.5 0 010 1H1a.5.5 0 010-1h12zM13.5 10a.5.5 0 00-.5-.5H1a.5.5 0 000 1h12a.5.5 0 00.5-.5zM13 6.5a.5.5 0 010 1H1a.5.5 0 010\
-1h12z",
      fill: e
    }
  )
)), $y = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8.982 1.632a.5.5 0 00-.964-.263l-3 11a.5.5 0 10.964.263l3-11zM3.32 3.616a.5.5 0 01.064.704L1.151 7l2.233 2.68a.5.5 0 11-.768.64l-\
2.5-3a.5.5 0 010-.64l2.5-3a.5.5 0 01.704-.064zM10.68 3.616a.5.5 0 00-.064.704L12.849 7l-2.233 2.68a.5.5 0 00.768.64l2.5-3a.5.5 0 000-.64l-2.\
5-3a.5.5 0 00-.704-.064z",
      fill: e
    }
  )
)), jy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3 2v1.5h1v7H3V12h5a3 3 0 001.791-5.407A2.75 2.75 0 008 2.011V2H3zm5 5.5H5.5v3H8a1.5 1.5 0 100-3zm-.25-4H5.5V6h2.25a1.25 1.25 0 10\
0-2.5z",
      fill: e
    }
  )
)), Vy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M5 2h6v1H8.5l-2 8H9v1H3v-1h2.5l2-8H5V2z", fill: e })
)), Wy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.553 2.268a1.5 1.5 0 00-2.12 0L2.774 7.925a2.5 2.5 0 003.536 3.535l3.535-3.535a.5.5 0 11.707.707l-3.535 3.536-.002.002a3.5 3.5 \
0 01-4.959-4.941l.011-.011L7.725 1.56l.007-.008a2.5 2.5 0 013.53 3.541l-.002.002-5.656 5.657-.003.003a1.5 1.5 0 01-2.119-2.124l3.536-3.536a.\
5.5 0 11.707.707L4.189 9.34a.5.5 0 00.707.707l5.657-5.657a1.5 1.5 0 000-2.121z",
      fill: e
    }
  )
)), qy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5 2.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zM5 7a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 015 7zM5.5 11a.5.5 0 000 1h7a\
.5.5 0 000-1h-7zM2.5 2H1v1h1v3h1V2.5a.5.5 0 00-.5-.5zM3 8.5v1a.5.5 0 01-1 0V9h-.5a.5.5 0 010-1h1a.5.5 0 01.5.5zM2 10.5a.5.5 0 00-1 0V12h2v-1\
H2v-.5z",
      fill: e
    }
  )
)), Uy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.75 2.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM5.5 2a.5.5 0 000 1h7a.5.5 0 000-1h-7zM5.5 11a.5.5 0 000 1h7a.5.5 0 000-1h-7zM2 12.25\
a.75.75 0 100-1.5.75.75 0 000 1.5zM5 7a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 015 7zM2 7.75a.75.75 0 100-1.5.75.75 0 000 1.5z",
      fill: e
    }
  )
)), Gy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6 7a3 3 0 110-6h5.5a.5.5 0 010 1H10v10.5a.5.5 0 01-1 0V2H7v10.5a.5.5 0 01-1 0V7z",
      fill: e
    }
  )
)), Yy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 4.5h1.5L5 6.375 6.5 4.5H8v5H6.5V7L5 8.875 3.5 7v2.5H2v-5zM9.75 4.5h1.5V7h1.25l-2 2.5-2-2.5h1.25V4.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M.5 2a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5H.5zM1 3v8h12V3H1z",
      fill: e
    }
  )
)), Xy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5 2.5a.5.5 0 11-1 0 .5.5 0 011 0zM4.5 5a.5.5 0 100-1 .5.5 0 000 1zM5 6.5a.5.5 0 11-1 0 .5.5 0 011 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11 0a2 2 0 012 2v10a2 2 0 01-2 2H1.5a.5.5 0 01-.5-.5V.5a.5.5 0 01.5-.5H11zm0 1H3v12h8a1 1 0 001-1V2a1 1 0 00-1-1z",
      fill: e
    }
  )
)), Ky = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.031 7.5a4 4 0 007.938 0H13.5a.5.5 0 000-1h-2.53a4 4 0 00-7.94 0H.501a.5.5 0 000 1h2.531zM7 10a3 3 0 100-6 3 3 0 000 6z",
      fill: e
    }
  )
)), Zy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6 2.5a1.5 1.5 0 01-1 1.415v4.053C5.554 7.4 6.367 7 7.5 7c.89 0 1.453-.252 1.812-.557.218-.184.374-.4.482-.62a1.5 1.5 0 111.026.14\
3c-.155.423-.425.87-.86 1.24C9.394 7.685 8.59 8 7.5 8c-1.037 0-1.637.42-1.994.917a2.81 2.81 0 00-.472 1.18A1.5 1.5 0 114 10.086v-6.17A1.5 1.\
5 0 116 2.5zm-2 9a.5.5 0 111 0 .5.5 0 01-1 0zm1-9a.5.5 0 11-1 0 .5.5 0 011 0zm6 2a.5.5 0 11-1 0 .5.5 0 011 0z",
      fill: e
    }
  )
)), Jy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M8.354 1.354L7.707 2H8.5A2.5 2.5 0 0111 4.5v5.585a1.5 1.5 0 11-1 0V4.5A1.5 1.5 0 008.5 3h-.793l.647.646a.5.5 0 11-.708.708l-1.5-1.\
5a.5.5 0 010-.708l1.5-1.5a.5.5 0 11.708.708zM11 11.5a.5.5 0 11-1 0 .5.5 0 011 0zM4 3.915a1.5 1.5 0 10-1 0v6.17a1.5 1.5 0 101 0v-6.17zM3.5 11\
a.5.5 0 100 1 .5.5 0 000-1zm0-8a.5.5 0 100-1 .5.5 0 000 1z",
      fill: e
    }
  )
)), Qy = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.108 3.872A1.5 1.5 0 103 3.915v6.17a1.5 1.5 0 101 0V6.41c.263.41.573.77.926 1.083 1.108.98 2.579 1.433 4.156 1.5A1.5 1.5 0 109.0\
9 7.99c-1.405-.065-2.62-.468-3.5-1.248-.723-.64-1.262-1.569-1.481-2.871zM3.5 11a.5.5 0 100 1 .5.5 0 000-1zM4 2.5a.5.5 0 11-1 0 .5.5 0 011 0z\
m7 6a.5.5 0 11-1 0 .5.5 0 011 0z",
      fill: e
    }
  )
)), e8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.03 8.103a3.044 3.044 0 01-.202-1.744 2.697 2.697 0 011.4-1.935c-.749-1.18-1.967-1.363-2.35-1.403-.835-.086-2.01.56-2.648.57h-.\
016c-.639-.01-1.814-.656-2.649-.57-.415.044-1.741.319-2.541 1.593-.281.447-.498 1.018-.586 1.744a6.361 6.361 0 00-.044.85c.005.305.028.604.0\
7.895.09.62.259 1.207.477 1.744.242.595.543 1.13.865 1.585.712 1.008 1.517 1.59 1.971 1.6.934.021 1.746-.61 2.416-.594.006.002.014.003.02.00\
2h.017c.007 0 .014 0 .021-.002.67-.017 1.481.615 2.416.595.453-.011 1.26-.593 1.971-1.6a7.95 7.95 0 00.97-1.856c-.697-.217-1.27-.762-1.578-1\
.474zm-2.168-5.97c.717-.848.69-2.07.624-2.125-.065-.055-1.25.163-1.985.984-.735.82-.69 2.071-.624 2.125.064.055 1.268-.135 1.985-.984z",
      fill: e
    }
  )
)), t8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 0a3 3 0 013 3v1.24c.129.132.25.27.362.415.113.111.283.247.515.433l.194.155c.325.261.711.582 1.095.966.765.765 1.545 1.806 1.823\
 3.186a.501.501 0 01-.338.581 3.395 3.395 0 01-1.338.134 2.886 2.886 0 01-1.049-.304 5.535 5.535 0 01-.17.519 2 2 0 11-2.892 2.55A5.507 5.50\
7 0 017 13c-.439 0-.838-.044-1.201-.125a2 2 0 11-2.892-2.55 5.553 5.553 0 01-.171-.519c-.349.182-.714.27-1.05.304A3.395 3.395 0 01.35 9.977a\
.497.497 0 01-.338-.582c.278-1.38 1.058-2.42 1.823-3.186.384-.384.77-.705 1.095-.966l.194-.155c.232-.186.402-.322.515-.433.112-.145.233-.283\
.362-.414V3a3 3 0 013-3zm1.003 11.895a2 2 0 012.141-1.89c.246-.618.356-1.322.356-2.005 0-.514-.101-1.07-.301-1.599l-.027-.017a6.387 6.387 0 \
00-.857-.42 6.715 6.715 0 00-1.013-.315l-.852.638a.75.75 0 01-.9 0l-.852-.638a6.716 6.716 0 00-1.693.634 4.342 4.342 0 00-.177.101l-.027.017\
A4.6 4.6 0 003.501 8c0 .683.109 1.387.355 2.005a2 2 0 012.142 1.89c.295.067.627.105 1.002.105s.707-.038 1.003-.105zM5 12a1 1 0 11-2 0 1 1 0 \
012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0zM6.1 4.3a1.5 1.5 0 011.8 0l.267.2L7 5.375 5.833 4.5l.267-.2zM8.5 2a.5.5 0 01.5.5V3a.5.5 0 01-1 0v-.5a.5.\
5 0 01.5-.5zM6 2.5a.5.5 0 00-1 0V3a.5.5 0 001 0v-.5z",
      fill: e
    }
  )
)), r8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3497)", fill: e }, /* @__PURE__ */ s.createElement("path", { d: "\
M12.261 2.067c0 1.142-.89 2.068-1.988 2.068-1.099 0-1.99-.926-1.99-2.068C8.283.926 9.174 0 10.273 0c1.098 0 1.989.926 1.989 2.067zM3.978 6.6\
c0 1.142-.89 2.068-1.989 2.068C.891 8.668 0 7.742 0 6.601c0-1.142.89-2.068 1.989-2.068 1.099 0 1.989.926 1.989 2.068zM6.475 11.921A4.761 4.7\
61 0 014.539 11a4.993 4.993 0 01-1.367-1.696 2.765 2.765 0 01-1.701.217 6.725 6.725 0 001.844 2.635 6.379 6.379 0 004.23 1.577 3.033 3.033 0\
 01-.582-1.728 4.767 4.767 0 01-.488-.083zM11.813 11.933c0 1.141-.89 2.067-1.989 2.067-1.098 0-1.989-.926-1.989-2.067 0-1.142.891-2.068 1.99\
-2.068 1.098 0 1.989.926 1.989 2.068zM12.592 11.173a6.926 6.926 0 001.402-3.913 6.964 6.964 0 00-1.076-4.023A2.952 2.952 0 0111.8 4.6c.398.7\
8.592 1.656.564 2.539a5.213 5.213 0 01-.724 2.495c.466.396.8.935.952 1.54zM1.987 3.631c-.05 0-.101.002-.151.004C3.073 1.365 5.504.024 8.005.\
23a3.07 3.07 0 00-.603 1.676 4.707 4.707 0 00-2.206.596 4.919 4.919 0 00-1.7 1.576 2.79 2.79 0 00-1.509-.447z" })),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3497" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), n8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.5 1H1v5.5h5.5V1zM13 1H7.5v5.5H13V1zM7.5 7.5H13V13H7.5V7.5zM6.5 7.5H1V13h5.5V7.5z",
      fill: e
    }
  )
)), o8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3496)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13.023 3.431a.115.115 0 01-.099.174H7.296A3.408 3.408 0 003.7 6.148a.115.115 0 01-.21.028l-1.97-3.413a.115.115 0 01.01-.129A6.97 \
6.97 0 017 0a6.995 6.995 0 016.023 3.431zM7 9.615A2.619 2.619 0 014.384 7 2.62 2.62 0 017 4.383 2.619 2.619 0 019.616 7 2.619 2.619 0 017 9.\
615zm1.034.71a.115.115 0 00-.121-.041 3.4 3.4 0 01-.913.124 3.426 3.426 0 01-3.091-1.973L1.098 3.567a.115.115 0 00-.2.001 7.004 7.004 0 005.\
058 10.354l.017.001c.04 0 .078-.021.099-.057l1.971-3.414a.115.115 0 00-.009-.128zm1.43-5.954h3.947c.047 0 .09.028.107.072.32.815.481 1.675.4\
81 2.557a6.957 6.957 0 01-2.024 4.923A6.957 6.957 0 017.08 14h-.001a.115.115 0 01-.1-.172L9.794 8.95A3.384 3.384 0 0010.408 7c0-.921-.364-1.\
785-1.024-2.433a.115.115 0 01.08-.196z",
      fill: e
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3496" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), a8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.042.616a.704.704 0 00-.66.729L1.816 12.9c.014.367.306.66.672.677l9.395.422h.032a.704.704 0 00.704-.703V.704c0-.015 0-.03-.002-.\
044a.704.704 0 00-.746-.659l-.773.049.057 1.615a.105.105 0 01-.17.086l-.52-.41-.617.468a.105.105 0 01-.168-.088L9.746.134 2.042.616zm8.003 4\
.747c-.247.192-2.092.324-2.092.05.04-1.045-.429-1.091-.689-1.091-.247 0-.662.075-.662.634 0 .57.607.893 1.32 1.27 1.014.538 2.24 1.188 2.24 \
2.823 0 1.568-1.273 2.433-2.898 2.433-1.676 0-3.141-.678-2.976-3.03.065-.275 2.197-.21 2.197 0-.026.971.195 1.256.753 1.256.43 0 .624-.236.6\
24-.634 0-.602-.633-.958-1.361-1.367-.987-.554-2.148-1.205-2.148-2.7 0-1.494 1.027-2.489 2.86-2.489 1.832 0 2.832.98 2.832 2.845z",
      fill: e
    }
  )
)), i8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3503)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M0 5.176l1.31-1.73 4.902-1.994V.014l4.299 3.144-8.78 1.706v4.8L0 9.162V5.176zm14-2.595v8.548l-3.355 2.857-5.425-1.783v1.783L1.73 9\
.661l8.784 1.047v-7.55L14 2.581z",
      fill: e
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3503" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), l8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.522a.411.411 0 00-.412.476l1.746 10.597a.56.56 0 00.547.466h8.373a.411.411 0 00.412-.345l1.017-6.248h-3.87L8.35 9.18H5.677l-.\
724-3.781h7.904L13.412 2A.411.411 0 0013 1.524L1 1.522z",
      fill: e
    }
  )
)), s8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 7a7 7 0 1014 0A7 7 0 000 7zm5.215-3.869a1.967 1.967 0 013.747.834v1.283l-3.346-1.93a2.486 2.486 0 00-.401-.187zm3.484 2.58l-3.3\
46-1.93a1.968 1.968 0 00-2.685.72 1.954 1.954 0 00.09 2.106 2.45 2.45 0 01.362-.254l1.514-.873a.27.27 0 01.268 0l2.1 1.21 1.697-.978zm-.323 \
4.972L6.86 9.81a.268.268 0 01-.134-.231V7.155l-1.698-.98v3.86a1.968 1.968 0 003.747.835 2.488 2.488 0 01-.4-.187zm.268-.464a1.967 1.967 0 00\
2.685-.719 1.952 1.952 0 00-.09-2.106c-.112.094-.233.18-.361.253L7.53 9.577l1.113.642zm-4.106.257a1.974 1.974 0 01-1.87-.975A1.95 1.95 0 012\
.47 8.01c.136-.507.461-.93.916-1.193L4.5 6.175v3.86c0 .148.013.295.039.44zM11.329 4.5a1.973 1.973 0 00-1.87-.976c.025.145.039.292.039.44v1.7\
47a.268.268 0 01-.135.232l-2.1 1.211v1.96l3.346-1.931a1.966 1.966 0 00.72-2.683z",
      fill: e
    }
  )
)), u8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.847 2.181L8.867.201a.685.685 0 00-.97 0l-4.81 4.81a.685.685 0 000 .969l2.466 2.465-2.405 2.404a.685.685 0 000 .97l1.98 1.98a.6\
85.685 0 00.97 0l4.81-4.81a.685.685 0 000-.969L8.441 5.555l2.405-2.404a.685.685 0 000-.97z",
      fill: e
    }
  )
)), c8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.852 2.885c-.893-.41-1.85-.712-2.85-.884a.043.043 0 00-.046.021c-.123.22-.26.505-.355.73a10.658 10.658 0 00-3.2 0 7.377 7.377 0\
 00-.36-.73.045.045 0 00-.046-.021c-1 .172-1.957.474-2.85.884a.04.04 0 00-.019.016C.311 5.612-.186 8.257.058 10.869a.048.048 0 00.018.033 11\
.608 11.608 0 003.496 1.767.045.045 0 00.049-.016c.27-.368.51-.755.715-1.163a.044.044 0 00-.024-.062 7.661 7.661 0 01-1.092-.52.045.045 0 01\
-.005-.075c.074-.055.147-.112.217-.17a.043.043 0 01.046-.006c2.29 1.046 4.771 1.046 7.035 0a.043.043 0 01.046.006c.07.057.144.115.218.17a.04\
5.045 0 01-.004.075 7.186 7.186 0 01-1.093.52.045.045 0 00-.024.062c.21.407.45.795.715 1.162.011.016.03.023.05.017a11.57 11.57 0 003.5-1.767\
.045.045 0 00.019-.032c.292-3.02-.49-5.643-2.07-7.969a.036.036 0 00-.018-.016zM4.678 9.279c-.69 0-1.258-.634-1.258-1.411 0-.778.558-1.411 1.\
258-1.411.707 0 1.27.639 1.259 1.41 0 .778-.558 1.412-1.259 1.412zm4.652 0c-.69 0-1.258-.634-1.258-1.411 0-.778.557-1.411 1.258-1.411.707 0 \
1.27.639 1.258 1.41 0 .778-.551 1.412-1.258 1.412z",
      fill: e
    }
  )
)), p8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.399 14H5.06V7H3.5V4.588l1.56-.001-.002-1.421C5.058 1.197 5.533 0 7.6 0h1.721v2.413H8.246c-.805 0-.844.337-.844.966l-.003 1.208h\
1.934l-.228 2.412L7.401 7l-.002 7z",
      fill: e
    }
  )
)), d8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M9.2 0H4.803A2.603 2.603 0 003.41 4.802a2.603 2.603 0 000 4.396 2.602 2.602 0 103.998 2.199v-2.51a2.603 2.603 0 103.187-4.085A2.60\
4 2.604 0 009.2 0zM7.407 7a1.793 1.793 0 103.586 0 1.793 1.793 0 00-3.586 0zm-.81 2.603H4.803a1.793 1.793 0 101.794 1.794V9.603zM4.803 4.397\
h1.794V.81H4.803a1.793 1.793 0 000 3.587zm0 .81a1.793 1.793 0 000 3.586h1.794V5.207H4.803zm4.397-.81H7.407V.81H9.2a1.794 1.794 0 010 3.587z",
      fill: e
    }
  )
)), f8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.37 8.768l-2.042 3.537h6.755l2.042-3.537H6.37zm6.177-1.003l-3.505-6.07H4.96l3.504 6.07h4.084zM4.378 2.7L.875 8.77l2.042 3.536L6.\
42 6.236 4.378 2.7z",
      fill: e
    }
  )
)), h8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 0C3.132 0 0 3.132 0 7a6.996 6.996 0 004.786 6.641c.35.062.482-.149.482-.332 0-.166-.01-.718-.01-1.304-1.758.324-2.213-.429-2.35\
3-.823-.079-.2-.42-.822-.717-.988-.246-.132-.596-.455-.01-.464.552-.009.946.508 1.077.717.63 1.06 1.636.762 2.039.578.061-.455.245-.761.446-\
.936-1.558-.175-3.185-.779-3.185-3.457 0-.76.271-1.39.717-1.88-.07-.176-.314-.893.07-1.856 0 0 .587-.183 1.925.718a6.495 6.495 0 011.75-.236\
c.595 0 1.19.078 1.75.236 1.34-.91 1.926-.718 1.926-.718.385.963.14 1.68.07 1.855.446.49.717 1.111.717 1.881 0 2.687-1.636 3.282-3.194 3.457\
.254.218.473.638.473 1.295 0 .936-.009 1.688-.009 1.925 0 .184.131.402.481.332A7.012 7.012 0 0014 7c0-3.868-3.133-7-7-7z",
      fill: e
    }
  )
)), m8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.068 5.583l1.487-4.557a.256.256 0 01.487 0L4.53 5.583H1.068L7 13.15 4.53 5.583h4.941l-2.47 7.565 5.931-7.565H9.471l1.488-4.557a.\
256.256 0 01.486 0l1.488 4.557.75 2.3a.508.508 0 01-.185.568L7 13.148v.001H7L.503 8.452a.508.508 0 01-.186-.57l.75-2.299z",
      fill: e
    }
  )
)), g8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.925 1.094H7.262c-1.643 0-3.189 1.244-3.189 2.685 0 1.473 1.12 2.661 2.791 2.661.116 0 .23-.002.34-.01a1.49 1.49 0 00-.186.684c\
0 .41.22.741.498 1.012-.21 0-.413.006-.635.006-2.034 0-3.6 1.296-3.6 2.64 0 1.323 1.717 2.15 3.75 2.15 2.32 0 3.6-1.315 3.6-2.639 0-1.06-.31\
3-1.696-1.28-2.38-.331-.235-.965-.805-.965-1.14 0-.392.112-.586.703-1.047.606-.474 1.035-1.14 1.035-1.914 0-.92-.41-1.819-1.18-2.115h1.161l.\
82-.593zm-1.335 8.96c.03.124.045.25.045.378 0 1.07-.688 1.905-2.665 1.905-1.406 0-2.421-.89-2.421-1.96 0-1.047 1.259-1.92 2.665-1.904.328.00\
4.634.057.911.146.764.531 1.311.832 1.465 1.436zM7.34 6.068c-.944-.028-1.841-1.055-2.005-2.295-.162-1.24.47-2.188 1.415-2.16.943.029 1.84 1.\
023 2.003 2.262.163 1.24-.47 2.222-1.414 2.193z",
      fill: e
    }
  )
)), v8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.873 11.608a1.167 1.167 0 00-1.707-.027L3.46 10.018l.01-.04h7.072l.022.076-2.69 1.554zM6.166 2.42l.031.03-3.535 6.124a1.265 1.26\
5 0 00-.043-.012V5.438a1.166 1.166 0 00.84-1.456L6.167 2.42zm4.387 1.562a1.165 1.165 0 00.84 1.456v3.124l-.043.012-3.536-6.123a1.2 1.2 0 00.\
033-.032l2.706 1.563zM3.473 9.42a1.168 1.168 0 00-.327-.568L6.68 2.73a1.17 1.17 0 00.652 0l3.536 6.123a1.169 1.169 0 00-.327.567H3.473zm8.79\
-.736a1.169 1.169 0 00-.311-.124V5.44a1.17 1.17 0 10-1.122-1.942L8.13 1.938a1.168 1.168 0 00-1.122-1.5 1.17 1.17 0 00-1.121 1.5l-2.702 1.56a\
1.168 1.168 0 00-1.86.22 1.17 1.17 0 00.739 1.722v3.12a1.168 1.168 0 00-.74 1.721 1.17 1.17 0 001.861.221l2.701 1.56a1.169 1.169 0 102.233-.\
035l2.687-1.552a1.168 1.168 0 101.457-1.791z",
      fill: e
    }
  )
)), w8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M0 0v14h14V0H0zm11.63 3.317l-.75.72a.22.22 0 00-.083.212v-.001 5.289a.22.22 0 00.083.21l.733.72v.159H7.925v-.158l.76-.738c.074-.07\
4.074-.096.074-.21V5.244l-2.112 5.364h-.285l-2.46-5.364V8.84a.494.494 0 00.136.413h.001l.988 1.198v.158H2.226v-.158l.988-1.198a.477.477 0 00\
.126-.416v.003-4.157a.363.363 0 00-.118-.307l-.878-1.058v-.158h2.727l2.107 4.622L9.031 3.16h2.6v.158z",
      fill: e
    }
  )
)), b8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.06 9.689c.016.49.423.88.912.88h.032a.911.911 0 00.88-.945.916.916 0 00-.912-.88h-.033c-.033 0-.08 0-.113.016-.669-1.108-.946-2.\
314-.848-3.618.065-.978.391-1.825.961-2.526.473-.603 1.386-.896 2.005-.913 1.728-.032 2.461 2.119 2.51 2.983.212.049.57.163.815.244C10.073 2\
.29 8.444.92 6.88.92c-1.467 0-2.82 1.06-3.357 2.625-.75 2.086-.261 4.09.651 5.671a.74.74 0 00-.114.473zm8.279-2.298c-1.239-1.45-3.064-2.249-\
5.15-2.249h-.261a.896.896 0 00-.798-.489h-.033A.912.912 0 006.13 6.48h.031a.919.919 0 00.8-.554h.293c1.239 0 2.412.358 3.472 1.059.814.538 1\
.401 1.238 1.727 2.086.277.684.261 1.353-.033 1.923-.456.864-1.222 1.337-2.232 1.337a4.16 4.16 0 01-1.597-.343 9.58 9.58 0 01-.734.587c.7.32\
6 1.418.505 2.102.505 1.565 0 2.722-.863 3.162-1.727.473-.946.44-2.575-.782-3.961zm-7.433 5.51a4.005 4.005 0 01-.977.113c-1.206 0-2.298-.505\
-2.836-1.32C.376 10.603.13 8.289 2.494 6.577c.05.261.147.62.212.832-.31.228-.798.685-1.108 1.303-.44.864-.391 1.729.13 2.527.359.537.93.864 \
1.663.962.896.114 1.793-.05 2.657-.505 1.271-.669 2.119-1.467 2.672-2.56a.944.944 0 01-.26-.603.913.913 0 01.88-.945h.033a.915.915 0 01.098 \
1.825c-.897 1.842-2.478 3.08-4.565 3.488z",
      fill: e
    }
  )
)), y8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 2.547a5.632 5.632 0 01-1.65.464 2.946 2.946 0 001.263-1.63 5.67 5.67 0 01-1.823.715 2.837 2.837 0 00-2.097-.93c-1.586 0-2.872 \
1.319-2.872 2.946 0 .23.025.456.074.67C4.508 4.66 2.392 3.488.975 1.706c-.247.435-.389.941-.389 1.481 0 1.022.507 1.923 1.278 2.452a2.806 2.\
806 0 01-1.3-.368l-.001.037c0 1.427.99 2.617 2.303 2.888a2.82 2.82 0 01-1.297.05c.366 1.17 1.427 2.022 2.683 2.045A5.671 5.671 0 010 11.51a7\
.985 7.985 0 004.403 1.323c5.283 0 8.172-4.488 8.172-8.38 0-.128-.003-.255-.009-.38A5.926 5.926 0 0014 2.546z",
      fill: e
    }
  )
)), D8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13.99 8.172c.005-.281.007-.672.007-1.172 0-.5-.002-.89-.007-1.172a14.952 14.952 0 00-.066-1.066 9.638 9.638 0 00-.169-1.153c-.083\
-.38-.264-.7-.542-.96a1.667 1.667 0 00-.972-.454C11.084 2.065 9.337 2 6.999 2s-4.085.065-5.241.195a1.65 1.65 0 00-.969.453c-.276.26-.455.58-\
.539.961a8.648 8.648 0 00-.176 1.153c-.039.43-.061.785-.066 1.066C.002 6.11 0 6.5 0 7c0 .5.002.89.008 1.172.005.281.027.637.066 1.067.04.43.\
095.813.168 1.152.084.38.265.7.543.96.279.261.603.412.973.453 1.156.13 2.902.196 5.24.196 2.34 0 4.087-.065 5.243-.196a1.65 1.65 0 00.967-.4\
53c.276-.26.456-.58.54-.96.077-.339.136-.722.175-1.152.04-.43.062-.786.067-1.067zM9.762 6.578A.45.45 0 019.997 7a.45.45 0 01-.235.422l-3.998\
 2.5a.442.442 0 01-.266.078.538.538 0 01-.242-.063.465.465 0 01-.258-.437v-5c0-.197.086-.343.258-.437a.471.471 0 01.508.016l3.998 2.5z",
      fill: e
    }
  )
)), x8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10.243.04a.87.87 0 01.38.087l2.881 1.386a.874.874 0 01.496.79V11.713a.875.875 0 01-.496.775l-2.882 1.386a.872.872 0 01-.994-.17L4\
.11 8.674l-2.404 1.823a.583.583 0 01-.744-.034l-.771-.7a.583.583 0 010-.862L2.274 7 .19 5.1a.583.583 0 010-.862l.772-.701a.583.583 0 01.744-\
.033L4.11 5.327 9.628.296a.871.871 0 01.615-.255zm.259 3.784L6.315 7l4.187 3.176V3.824z",
      fill: e
    }
  )
)), C8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.667 13H2.333A1.333 1.333 0 011 11.667V2.333C1 1.597 1.597 1 2.333 1h9.334C12.403 1 13 1.597 13 2.333v9.334c0 .736-.597 1.333-1\
.333 1.333zm-2.114-1.667h1.78V7.675c0-1.548-.877-2.296-2.102-2.296-1.226 0-1.742.955-1.742.955v-.778H5.773v5.777h1.716V8.3c0-.812.374-1.296 \
1.09-1.296.658 0 .974.465.974 1.296v3.033zm-6.886-7.6c0 .589.474 1.066 1.058 1.066.585 0 1.058-.477 1.058-1.066 0-.589-.473-1.066-1.058-1.06\
6-.584 0-1.058.477-1.058 1.066zm1.962 7.6h-1.79V5.556h1.79v5.777z",
      fill: e
    }
  )
)), E8 = /* @__PURE__ */ s.forwardRef(
  ({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
    "svg",
    {
      width: t,
      height: t,
      viewBox: "0 0 14 14",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ref: n,
      ...r
    },
    /* @__PURE__ */ s.createElement(
      "path",
      {
        d: "M11.02.446h2.137L8.49 5.816l5.51 7.28H9.67L6.298 8.683l-3.88 4.413H.282l5.004-5.735L0 .446h4.442l3.064 4.048L11.02.446zm-.759 11\
.357h1.18L3.796 1.655H2.502l7.759 10.148z",
        fill: e
      }
    )
  )
), R8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M.5 13.004a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h13a.5.5 0 01.5.5v11a.5.5 0 01-.5.5H.5zm.5-1v-8h12v8H1zm1-9.5a.5.5 0 11-1 0 .5.5 0 01\
1 0zm2 0a.5.5 0 11-1 0 .5.5 0 011 0zm2 0a.5.5 0 11-1 0 .5.5 0 011 0z",
      fill: e
    }
  )
)), S8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5.004a1.5 1.5 0 00-1.5 1.5v11a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5v-11a1.5 1.5 0 00-1.5-1.5h-7zm0 1h7a.5.5 0 01.5.5v9.5H3v\
-9.5a.5.5 0 01.5-.5zm2.5 11a.5.5 0 000 1h2a.5.5 0 000-1H6z",
      fill: e
    }
  )
)), A8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3 1.504a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5v-11zm1 10.5v-10h6v10H4z",
      fill: e
    }
  )
)), F8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4 .504a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zm5.5 2.5h-5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-7a.5.5 0 00-\
.5-.5zm-5-1a1.5 1.5 0 00-1.5 1.5v7a1.5 1.5 0 001.5 1.5h5a1.5 1.5 0 001.5-1.5v-7a1.5 1.5 0 00-1.5-1.5h-5zm2.5 2a.5.5 0 01.5.5v2h1a.5.5 0 110 \
1H7a.5.5 0 01-.5-.5v-2.5a.5.5 0 01.5-.5zm-2.5 9a.5.5 0 000 1h5a.5.5 0 000-1h-5z",
      fill: e
    }
  )
)), k8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.5 4.504a.5.5 0 01.5-.5h1a.5.5 0 110 1H3a.5.5 0 01-.5-.5zM3 6.004a.5.5 0 100 1h1a.5.5 0 000-1H3zM2.5 8.504a.5.5 0 01.5-.5h1a.5.5\
 0 110 1H3a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 13.004a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11zm.5-1v-10h3v10H2zm4-10h6v10H6v-10z",
      fill: e
    }
  )
)), L8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.5 4.504a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM10 6.004a.5.5 0 100 1h1a.5.5 0 000-1h-1zM9.5 8.504a.5.5 0 01.5-.5h1a.\
5.5 0 010 1h-1a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 13.004a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11zm.5-1v-10h6v10H2zm7-10h3v10H9v-10z",
      fill: e
    }
  )
)), T8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.5 4.504a.5.5 0 00-.5-.5h-1a.5.5 0 100 1h1a.5.5 0 00.5-.5zM11 6.004a.5.5 0 010 1h-1a.5.5 0 010-1h1zM11.5 8.504a.5.5 0 00-.5-.5h\
-1a.5.5 0 100 1h1a.5.5 0 00.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.5 13.004a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11zm7.5-1h3v-10H9v10zm-1 0H2v-10h6v4.5H5.207l.6\
5-.65a.5.5 0 10-.707-.708L3.646 6.65a.5.5 0 000 .707l1.497 1.497a.5.5 0 10.707-.708l-.643-.642H8v4.5z",
      fill: e
    }
  )
)), B8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 4.504a.5.5 0 01.5-.5h1a.5.5 0 110 1H2a.5.5 0 01-.5-.5zM2 6.004a.5.5 0 100 1h1a.5.5 0 000-1H2zM1.5 8.504a.5.5 0 01.5-.5h1a.5.5\
 0 110 1H2a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M.5 13.004a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5H.5zm.5-1v-10h3v10H1zm4 0v-4.5h2.793l-.643.642a.5.\
5 0 10.707.708l1.497-1.497a.5.5 0 000-.707L7.85 5.146a.5.5 0 10-.707.708l.65.65H5v-4.5h6v10H5z",
      fill: e
    }
  )
)), I8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3 10.504a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM6.5 10.004a.5.5 0 000 1h1a.5.5 0 000-1h-1zM9 10.504a.5.5 0 01.5-.5h1a.\
5.5 0 010 1h-1a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 1.504a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zm1 6.5v-6h10v6H2zm10 1v3H2v-3h10z",
      fill: e
    }
  )
)), M8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.5 10.004a.5.5 0 000 1h1a.5.5 0 000-1h-1zM6 10.504a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM9.5 10.004a.5.5 0 000 1h1a.\
5.5 0 000-1h-1z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 12.504v-11a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5zm1-.5v-3h10v3H2zm4.5-4H2v-6h10v6H7.5V5.21l.646\
.646a.5.5 0 10.708-.707l-1.5-1.5a.5.5 0 00-.708 0l-1.5 1.5a.5.5 0 10.708.707l.646-.646v2.793z",
      fill: e
    }
  )
)), _8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5 5.504a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3zm1 2.5v-2h2v2H6z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5.5.004a.5.5 0 01.5.5v1.5h2v-1.5a.5.5 0 011 0v1.5h2.5a.5.5 0 01.5.5v2.5h1.5a.5.5 0 010 1H12v2h1.5a.5.5 0 010 1H12v2.5a.5.5 0 01-.\
5.5H9v1.5a.5.5 0 01-1 0v-1.5H6v1.5a.5.5 0 01-1 0v-1.5H2.5a.5.5 0 01-.5-.5v-2.5H.5a.5.5 0 010-1H2v-2H.5a.5.5 0 010-1H2v-2.5a.5.5 0 01.5-.5H5v\
-1.5a.5.5 0 01.5-.5zm5.5 3H3v8h8v-8z",
      fill: e
    }
  )
)), P8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12 3c0-1.105-2.239-2-5-2s-5 .895-5 2v8c0 .426.26.752.544.977.29.228.68.413 1.116.558.878.293 2.059.465 3.34.465 1.281 0 2.462-.17\
2 3.34-.465.436-.145.825-.33 1.116-.558.285-.225.544-.551.544-.977V3zm-1.03 0a.787.787 0 00-.05-.052c-.13-.123-.373-.28-.756-.434C9.404 2.21\
 8.286 2 7 2c-1.286 0-2.404.21-3.164.514-.383.153-.625.31-.756.434A.756.756 0 003.03 3a.756.756 0 00.05.052c.13.123.373.28.756.434C4.596 3.7\
9 5.714 4 7 4c1.286 0 2.404-.21 3.164-.514.383-.153.625-.31.756-.434A.787.787 0 0010.97 3zM11 5.75V4.2c-.912.486-2.364.8-4 .8-1.636 0-3.088-\
.314-4-.8v1.55l.002.008a.147.147 0 00.016.033.618.618 0 00.145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.37\
8-.126.648-.265.813-.395a.62.62 0 00.146-.15.149.149 0 00.015-.033A.03.03 0 0011 5.75zM3 7.013c.2.103.423.193.66.272.878.293 2.059.465 3.34.\
465 1.281 0 2.462-.172 3.34-.465.237-.079.46-.17.66-.272V8.5l-.002.008a.149.149 0 01-.015.033.62.62 0 01-.146.15c-.165.13-.435.27-.813.395-.\
751.25-1.82.414-3.024.414s-2.273-.163-3.024-.414c-.378-.126-.648-.265-.813-.395a.618.618 0 01-.145-.15.147.147 0 01-.016-.033A.027.027 0 013\
 8.5V7.013zm0 2.75V11l.002.008a.147.147 0 00.016.033.617.617 0 00.145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.\
414c.378-.126.648-.265.813-.395a.619.619 0 00.146-.15.148.148 0 00.015-.033L11 11V9.763c-.2.103-.423.193-.66.272-.878.293-2.059.465-3.34.465\
-1.281 0-2.462-.172-3.34-.465A4.767 4.767 0 013 9.763z",
      fill: e
    }
  )
)), H8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5 3a.5.5 0 00-1 0v3a.5.5 0 001 0V3zM7 2.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V3a.5.5 0 01.5-.5zM10 4.504a.5.5 0 10-1 0V6a.5.5 0 001 0V4\
.504z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12 3.54l-.001-.002a.499.499 0 00-.145-.388l-3-3a.499.499 0 00-.388-.145L8.464.004H2.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h9a.5.5 0 00\
.5-.5V3.54zM3 1.004h5.293L11 3.71v5.293H3v-8zm0 9v3h8v-3H3z",
      fill: e
    }
  )
)), z8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M8.164 3.446a1.5 1.5 0 10-2.328 0L1.81 10.032A1.503 1.503 0 000 11.5a1.5 1.5 0 002.915.5h8.17a1.5 1.5 0 101.104-1.968L8.164 3.446z\
m-1.475.522a1.506 1.506 0 00.622 0l4.025 6.586a1.495 1.495 0 00-.25.446H2.914a1.497 1.497 0 00-.25-.446l4.024-6.586z",
      fill: e
    }
  )
)), O8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.21.046l6.485 2.994A.5.5 0 0114 3.51v6.977a.495.495 0 01-.23.432.481.481 0 01-.071.038L7.23 13.944a.499.499 0 01-.46 0L.3 10.958\
a.498.498 0 01-.3-.47V3.511a.497.497 0 01.308-.473L6.78.051a.499.499 0 01.43-.005zM1 4.282v5.898l5.5 2.538V6.82L1 4.282zm6.5 8.436L13 10.18V\
4.282L7.5 6.82v5.898zM12.307 3.5L7 5.95 1.693 3.5 7 1.05l5.307 2.45z",
      fill: e
    }
  )
)), N8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M7.5.5a.5.5 0 00-1 0v6a.5.5 0 001 0v-6z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.273 2.808a.5.5 0 00-.546-.837 6 6 0 106.546 0 .5.5 0 00-.546.837 5 5 0 11-5.454 0z",
      fill: e
    }
  )
)), $8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13.854 2.146l-2-2a.5.5 0 00-.708 0l-1.5 1.5-8.995 8.995a.499.499 0 00-.143.268L.012 13.39a.495.495 0 00.135.463.5.5 0 00.462.134l\
2.482-.496a.495.495 0 00.267-.143l8.995-8.995 1.5-1.5a.5.5 0 000-.708zM12 3.293l.793-.793L11.5 1.207 10.707 2 12 3.293zm-2-.586L1.707 11 3 1\
2.293 11.293 4 10 2.707zM1.137 12.863l.17-.849.679.679-.849.17z",
      fill: e
    }
  )
)), j8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.586 5.586A2 2 0 018.862 7.73a.5.5 0 10.931.365 3 3 0 10-1.697 1.697.5.5 0 10-.365-.93 2 2 0 01-2.145-3.277z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M.939 6.527c.127.128.19.297.185.464a.635.635 0 01-.185.465L0 8.395a7.099 7.099 0 001.067 2.572h1.32c.182 0 .345.076.46.197a.635.63\
5 0 01.198.46v1.317A7.097 7.097 0 005.602 14l.94-.94a.634.634 0 01.45-.186H7.021c.163 0 .326.061.45.186l.939.938a7.098 7.098 0 002.547-1.057\
V11.61c0-.181.075-.344.197-.46a.634.634 0 01.46-.197h1.33c.507-.76.871-1.622 1.056-2.55l-.946-.946a.635.635 0 01-.186-.465.635.635 0 01.186-\
.464l.943-.944a7.099 7.099 0 00-1.044-2.522h-1.34a.635.635 0 01-.46-.197.635.635 0 01-.196-.46V1.057A7.096 7.096 0 008.413.002l-.942.942a.63\
4.634 0 01-.45.186H6.992a.634.634 0 01-.45-.186L5.598 0a7.097 7.097 0 00-2.553 1.058v1.33c0 .182-.076.345-.197.46a.635.635 0 01-.46.198h-1.3\
3A7.098 7.098 0 00.003 5.591l.936.936zm.707 1.636c.324-.324.482-.752.479-1.172a1.634 1.634 0 00-.48-1.171l-.538-.539c.126-.433.299-.847.513-\
1.235h.768c.459 0 .873-.19 1.167-.49.3-.295.49-.708.49-1.167v-.77c.39-.215.807-.388 1.243-.515l.547.547c.32.32.742.48 1.157.48l.015-.001h.01\
4c.415 0 .836-.158 1.157-.479l.545-.544c.433.126.846.299 1.234.512v.784c0 .46.19.874.49 1.168.294.3.708.49 1.167.49h.776c.209.382.378.788.50\
2 1.213l-.545.546a1.635 1.635 0 00-.48 1.17c-.003.421.155.849.48 1.173l.549.55c-.126.434-.3.85-.513 1.239h-.77c-.458 0-.872.19-1.166.49-.3.2\
94-.49.708-.49 1.167v.77a6.09 6.09 0 01-1.238.514l-.54-.54a1.636 1.636 0 00-1.158-.48H6.992c-.415 0-.837.159-1.157.48l-.543.543a6.091 6.091 \
0 01-1.247-.516v-.756c0-.459-.19-.873-.49-1.167-.294-.3-.708-.49-1.167-.49h-.761a6.094 6.094 0 01-.523-1.262l.542-.542z",
      fill: e
    }
  )
)), V8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.585 8.414a2 2 0 113.277-.683.5.5 0 10.931.365 3 3 0 10-1.697 1.697.5.5 0 00-.365-.93 2 2 0 01-2.146-.449z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.5.289a1 1 0 011 0l5.062 2.922a1 1 0 01.5.866v5.846a1 1 0 01-.5.866L7.5 13.71a1 1 0 01-1 0L1.437 10.79a1 1 0 01-.5-.866V4.077a1 \
1 0 01.5-.866L6.5.29zm.5.866l5.062 2.922v5.846L7 12.845 1.937 9.923V4.077L7 1.155z",
      fill: e
    }
  )
)), W8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10.5 1c.441 0 .564.521.252.833l-.806.807a.51.51 0 000 .72l.694.694a.51.51 0 00.72 0l.807-.806c.312-.312.833-.19.833.252a2.5 2.5 0\
 01-3.414 2.328l-6.879 6.88a1 1 0 01-1.414-1.415l6.88-6.88A2.5 2.5 0 0110.5 1zM2 12.5a.5.5 0 100-1 .5.5 0 000 1z",
      fill: e
    }
  )
)), q8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
      fill: e
    }
  )
)), U8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.903.112a.107.107 0 01.194 0l.233.505.552.066c.091.01.128.123.06.185l-.408.377.109.546a.107.107 0 01-.158.114L6 1.634l-.485.271a\
.107.107 0 01-.158-.114l.108-.546-.408-.377a.107.107 0 01.06-.185L5.67.617l.233-.505zM2.194.224a.214.214 0 00-.389 0l-.466 1.01-1.104.131a.2\
14.214 0 00-.12.37l.816.755-.217 1.091a.214.214 0 00.315.23L2 3.266l.971.543c.16.09.35-.05.315-.229l-.216-1.09.816-.756a.214.214 0 00-.12-.3\
7L2.66 1.234 2.194.224zM12.194 8.224a.214.214 0 00-.389 0l-.466 1.01-1.104.13a.214.214 0 00-.12.371l.816.755-.217 1.091a.214.214 0 00.315.23\
l.97-.544.971.543c.16.09.35-.05.315-.229l-.216-1.09.816-.756a.214.214 0 00-.12-.37l-1.105-.131-.466-1.01z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.5 12.797l-1.293-1.293 6.758-6.758L9.258 6.04 2.5 12.797zm7.465-7.465l2.828-2.828L11.5 1.211 8.672 4.04l1.293 1.293zM.147 11.857\
a.5.5 0 010-.707l11-11a.5.5 0 01.706 0l2 2a.5.5 0 010 .708l-11 11a.5.5 0 01-.706 0l-2-2z",
      fill: e
    }
  )
)), G8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M13.854 3.354a.5.5 0 00-.708-.708L5 10.793.854 6.646a.5.5 0 10-.708.708l4.5 4.5a.5.5 0 00.708 0l8.5-8.5z",
      fill: e
    }
  )
)), Y8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 1.004a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V6.393a.5.5 0 00-1 0v5.61H2v-10h7.5a.5.5 0 000-1H2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.354 9.857l7.5-7.5a.5.5 0 00-.708-.707L6 8.797 3.854 6.65a.5.5 0 10-.708.707l2.5 2.5a.5.5 0 00.708 0z",
      fill: e
    }
  )
)), X8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.5 2a.5.5 0 000 1h2a.5.5 0 000-1h-2zM8.854 2.646a.5.5 0 010 .708L5.207 7l3.647 3.646a.5.5 0 01-.708.708L4.5 7.707.854 11.354a.5\
.5 0 01-.708-.708L3.793 7 .146 3.354a.5.5 0 11.708-.708L4.5 6.293l3.646-3.647a.5.5 0 01.708 0zM11 7a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2A.5.5 0 \
0111 7zM11.5 11a.5.5 0 000 1h2a.5.5 0 000-1h-2z",
      fill: e
    }
  )
)), K8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.5 2a.5.5 0 000 1h2a.5.5 0 000-1h-2zM9.3 2.6a.5.5 0 01.1.7l-5.995 7.993a.505.505 0 01-.37.206.5.5 0 01-.395-.152L.146 8.854a.5.\
5 0 11.708-.708l2.092 2.093L8.6 2.7a.5.5 0 01.7-.1zM11 7a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2A.5.5 0 0111 7zM11.5 11a.5.5 0 000 1h2a.5.5 0 000-1\
h-2z",
      fill: e
    }
  )
)), Z8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.5 1a.5.5 0 01.5.5V2h1.5a.5.5 0 010 1H11v.5a.5.5 0 01-1 0V3H1.5a.5.5 0 010-1H10v-.5a.5.5 0 01.5-.5zM1.5 11a.5.5 0 000 1H10v.5a.\
5.5 0 001 0V12h1.5a.5.5 0 000-1H11v-.5a.5.5 0 00-1 0v.5H1.5zM1 7a.5.5 0 01.5-.5H3V6a.5.5 0 011 0v.5h8.5a.5.5 0 010 1H4V8a.5.5 0 01-1 0v-.5H1\
.5A.5.5 0 011 7z",
      fill: e
    }
  )
)), J8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.5.5a.5.5 0 00-1 0v6h-6a.5.5 0 000 1h6v6a.5.5 0 001 0v-6h6a.5.5 0 000-1h-6v-6z",
      fill: e
    }
  )
)), Q8 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.03.97A.75.75 0 00.97 2.03L5.94 7 .97 11.97a.75.75 0 101.06 1.06L7 8.06l4.97 4.97a.75.75 0 101.06-1.06L8.06 7l4.97-4.97A.75.75 0\
 0011.97.97L7 5.94 2.03.97z",
      fill: e
    }
  )
)), zu = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.854 1.146a.5.5 0 10-.708.708L6.293 7l-5.147 5.146a.5.5 0 00.708.708L7 7.707l5.146 5.147a.5.5 0 00.708-.708L7.707 7l5.147-5.146a\
.5.5 0 00-.708-.708L7 6.293 1.854 1.146z",
      fill: e
    }
  )
)), e9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.5 4.5A.5.5 0 016 5v5a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zM9 5a.5.5 0 00-1 0v5a.5.5 0 001 0V5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.5.5A.5.5 0 015 0h4a.5.5 0 01.5.5V2h3a.5.5 0 010 1H12v8a2 2 0 01-2 2H4a2 2 0 01-2-2V3h-.5a.5.5 0 010-1h3V.5zM3 3v8a1 1 0 001 1h6\
a1 1 0 001-1V3H3zm2.5-2h3v1h-3V1z",
      fill: e
    }
  )
)), t9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3502)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M13.44 4.44L9.56.56a1.5 1.5 0 00-2.12 0L7 1a1.415 1.415 0 000 2L5 5H3.657A4 4 0 00.828 6.17l-.474.475a.5.5 0 000 .707l2.793 2.793-\
3 3a.5.5 0 00.707.708l3-3 2.792 2.792a.5.5 0 00.708 0l.474-.475A4 4 0 009 10.343V9l2-2a1.414 1.414 0 002 0l.44-.44a1.5 1.5 0 000-2.12zM11 5.\
585l-3 3v1.757a3 3 0 01-.879 2.121L7 12.586 1.414 7l.122-.122A3 3 0 013.656 6h1.758l3-3-.707-.707a.414.414 0 010-.586l.44-.44a.5.5 0 01.707 \
0l3.878 3.88a.5.5 0 010 .706l-.44.44a.414.414 0 01-.585 0L11 5.586z",
      fill: e
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3502" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), r9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3501)", fill: e }, /* @__PURE__ */ s.createElement("path", { d: "\
M13.44 4.44L9.56.56a1.5 1.5 0 00-2.12 0L7 1a1.415 1.415 0 000 2L5.707 4.293 6.414 5l2-2-.707-.707a.414.414 0 010-.586l.44-.44a.5.5 0 01.707 \
0l3.878 3.88a.5.5 0 010 .706l-.44.44a.414.414 0 01-.585 0L11 5.586l-2 2 .707.707L11 7a1.414 1.414 0 002 0l.44-.44a1.5 1.5 0 000-2.12zM.828 6\
.171a4 4 0 012.758-1.17l1 .999h-.93a3 3 0 00-2.12.878L1.414 7 7 12.586l.121-.122A3 3 0 008 10.343v-.929l1 1a4 4 0 01-1.172 2.757l-.474.475a.\
5.5 0 01-.708 0l-2.792-2.792-3 3a.5.5 0 01-.708-.708l3-3L.355 7.353a.5.5 0 010-.707l.474-.475zM1.854 1.146a.5.5 0 10-.708.708l11 11a.5.5 0 0\
0.708-.708l-11-11z" })),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3501" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), n9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 3a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 017 3z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm0-1A6 6 0 107 1a6 6 0 000 12z",
      fill: e
    }
  )
)), o9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M3.5 6.5a.5.5 0 000 1h7a.5.5 0 000-1h-7z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), a9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.854 4.146a.5.5 0 010 .708L7.707 7l2.147 2.146a.5.5 0 01-.708.708L7 7.707 4.854 9.854a.5.5 0 01-.708-.708L6.293 7 4.146 4.854a.5\
.5 0 11.708-.708L7 6.293l2.146-2.147a.5.5 0 01.708 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm0-1A6 6 0 107 1a6 6 0 000 12z",
      fill: e
    }
  )
)), i9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0a6 6 0 01-9.874 4.582l8.456-8.456A5.976 5.976 0 0113 7zM2.418 10.874l8.456-8.456a6 6 0 00-8.45\
6 8.456z",
      fill: e
    }
  )
)), l9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm3.854-9.354a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.708 0l-2.5-2.5a.5.5 0 11.708-.708L6 8.793l4.146-4.\
147a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), s9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zM3.5 6.5a.5.5 0 000 1h7a.5.5 0 000-1h-7z",
      fill: e
    }
  )
)), u9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm2.854-9.854a.5.5 0 010 .708L7.707 7l2.147 2.146a.5.5 0 01-.708.708L7 7.707 4.854 9.854a.5.5 0 01-.\
708-.708L6.293 7 4.146 4.854a.5.5 0 11.708-.708L7 6.293l2.146-2.147a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), c9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5 2h7a2 2 0 012 2v6a2 2 0 01-2 2H5a1.994 1.994 0 01-1.414-.586l-3-3a2 2 0 010-2.828l3-3A1.994 1.994 0 015 2zm1.146 3.146a.5.5 0 0\
1.708 0L8 6.293l1.146-1.147a.5.5 0 11.708.708L8.707 7l1.147 1.146a.5.5 0 01-.708.708L8 7.707 6.854 8.854a.5.5 0 11-.708-.708L7.293 7 6.146 5\
.854a.5.5 0 010-.708z",
      fill: e
    }
  )
)), p9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.5 5.004a.5.5 0 100 1h7a.5.5 0 000-1h-7zM3 8.504a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12.5 12.004H5.707l-1.853 1.854a.5.5 0 01-.351.146h-.006a.499.499 0 01-.497-.5v-1.5H1.5a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h11a.5.5 \
0 01.5.5v9a.5.5 0 01-.5.5zm-10.5-1v-8h10v8H2z",
      fill: e
    }
  )
)), d9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.5 5.004a.5.5 0 10-1 0v1.5H5a.5.5 0 100 1h1.5v1.5a.5.5 0 001 0v-1.5H9a.5.5 0 000-1H7.5v-1.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.691 13.966a.498.498 0 01-.188.038h-.006a.499.499 0 01-.497-.5v-1.5H1.5a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v9a.5.\
5 0 01-.5.5H5.707l-1.853 1.854a.5.5 0 01-.163.108zM2 3.004v8h10v-8H2z",
      fill: e
    }
  )
)), f9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.854 6.65a.5.5 0 010 .707l-2 2a.5.5 0 11-.708-.707l1.15-1.15-3.796.004a.5.5 0 010-1L8.29 6.5 7.145 5.357a.5.5 0 11.708-.707l2 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.691 13.966a.498.498 0 01-.188.038h-.006a.499.499 0 01-.497-.5v-1.5H1.5a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v9a.5.\
5 0 01-.5.5H5.707l-1.853 1.854a.5.5 0 01-.163.108zM2 3.004v8h10v-8H2z",
      fill: e
    }
  )
)), h9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8.5 7.004a.5.5 0 000-1h-5a.5.5 0 100 1h5zM9 8.504a.5.5 0 01-.5.5h-5a.5.5 0 010-1h5a.5.5 0 01.5.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12 11.504v-1.5h1.5a.5.5 0 00.5-.5v-8a.5.5 0 00-.5-.5h-11a.5.5 0 00-.5.5v1.5H.5a.5.5 0 00-.5.5v8a.5.5 0 00.5.5H2v1.5a.499.499 0 00\
.497.5h.006a.498.498 0 00.35-.146l1.854-1.854H11.5a.5.5 0 00.5-.5zm-9-8.5v-1h10v7h-1v-5.5a.5.5 0 00-.5-.5H3zm-2 8v-7h10v7H1z",
      fill: e
    }
  )
)), m9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6.986a.444.444 0 01-.124.103l-3.219 1.84A.43.43 0 013 13.569V12a2 2 0 01-2-2V2zm3.42\
 4.78a.921.921 0 110-1.843.921.921 0 010 1.842zm1.658-.922a.921.921 0 101.843 0 .921.921 0 00-1.843 0zm2.58 0a.921.921 0 101.842 0 .921.921 \
0 00-1.843 0z",
      fill: e
    }
  )
)), g9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8 8.004a1 1 0 01-.5.866v1.634a.5.5 0 01-1 0V8.87A1 1 0 118 8.004z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3 4.004a4 4 0 118 0v1h1.5a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5H3v-1zm7 1v-1a3 3 0 10-6 0v1h6zm2 1\
H2v7h10v-7z",
      fill: e
    }
  )
)), v9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3614)", fill: e }, /* @__PURE__ */ s.createElement("path", { d: "\
M6.5 8.87a1 1 0 111 0v1.634a.5.5 0 01-1 0V8.87z" }), /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 1a3 3 0 00-3 3v1.004h8.5a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5H3V4a4 4 0 017.755-1.381.5.5 0 01-\
.939.345A3.001 3.001 0 007 1zM2 6.004h10v7H2v-7z"
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3614" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), w9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M11 4a1 1 0 11-2 0 1 1 0 012 0z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.5 8.532V9.5a.5.5 0 01-.5.5H5.5v1.5a.5.5 0 01-.5.5H3.5v1.5a.5.5 0 01-.5.5H.5a.5.5 0 01-.5-.5v-2a.5.5 0 01.155-.362l5.11-5.11A4.5\
 4.5 0 117.5 8.532zM6 4.5a3.5 3.5 0 111.5 2.873c-.29-.203-1-.373-1 .481V9H5a.5.5 0 00-.5.5V11H3a.5.5 0 00-.5.5V13H1v-1.293l5.193-5.193a.552.\
552 0 00.099-.613A3.473 3.473 0 016 4.5z",
      fill: e
    }
  )
)), b9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.354.15a.5.5 0 00-.708 0l-2 2a.5.5 0 10.708.707L6.5 1.711v6.793a.5.5 0 001 0V1.71l1.146 1.146a.5.5 0 10.708-.707l-2-2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 7.504a.5.5 0 10-1 0v5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-5a.5.5 0 00-1 0v4.5H2v-4.5z",
      fill: e
    }
  )
)), y9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M2.5 8.004a.5.5 0 100 1h3a.5.5 0 000-1h-3z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 11.504a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5H.5a.5.5 0 00-.5.5v9zm1-8.5v1h12v-1H1zm0 8h12v-5H1v5z",
      fill: e
    }
  )
)), D9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1 3.004a1 1 0 00-1 1v5a1 1 0 001 1h3.5a.5.5 0 100-1H1v-5h12v5h-1a.5.5 0 000 1h1a1 1 0 001-1v-5a1 1 0 00-1-1H1z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.45 7.006a.498.498 0 01.31.07L10.225 9.1a.5.5 0 01-.002.873l-1.074.621.75 1.3a.75.75 0 01-1.3.75l-.75-1.3-1.074.62a.497.497 0 01\
-.663-.135.498.498 0 01-.095-.3L6 7.515a.497.497 0 01.45-.509z",
      fill: e
    }
  )
)), x9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4 1.504a.5.5 0 01.5-.5h5a.5.5 0 110 1h-2v10h2a.5.5 0 010 1h-5a.5.5 0 010-1h2v-10h-2a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M0 4.504a.5.5 0 01.5-.5h4a.5.5 0 110 1H1v4h3.5a.5.5 0 110 1h-4a.5.5 0 01-.5-.5v-5zM9.5 4.004a.5.5 0 100 1H13v4H9.5a.5.5 0 100 1h4a\
.5.5 0 00.5-.5v-5a.5.5 0 00-.5-.5h-4z",
      fill: e
    }
  )
)), C9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5.943 12.457a.27.27 0 00.248-.149L7.77 9.151l2.54 2.54a.257.257 0 00.188.073c.082 0 .158-.03.21-.077l.788-.79a.27.27 0 000-.392L8\
.891 7.9l3.416-1.708a.29.29 0 00.117-.106.222.222 0 00.033-.134.332.332 0 00-.053-.161.174.174 0 00-.092-.072l-.02-.007-10.377-4.15a.274.274\
 0 00-.355.354l4.15 10.372a.275.275 0 00.233.169zm-.036 1l-.02-.002c-.462-.03-.912-.31-1.106-.796L.632 2.287A1.274 1.274 0 012.286.633l10.35\
8 4.143c.516.182.782.657.81 1.114a1.25 1.25 0 01-.7 1.197L10.58 8.174l1.624 1.624a1.27 1.27 0 010 1.807l-.8.801-.008.007c-.491.46-1.298.48-1\
.792-.014l-1.56-1.56-.957 1.916a1.27 1.27 0 01-1.142.702h-.037z",
      fill: e
    }
  )
)), E9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.87 6.008a.505.505 0 00-.003-.028v-.002c-.026-.27-.225-.48-.467-.498a.5.5 0 00-.53.5v1.41c0 .25-.22.47-.47.47a.48.48 0 01-.47-.\
47V5.17a.6.6 0 00-.002-.05c-.023-.268-.223-.49-.468-.5a.5.5 0 00-.52.5v1.65a.486.486 0 01-.47.47.48.48 0 01-.47-.47V4.62a.602.602 0 00-.002-\
.05v-.002c-.023-.266-.224-.48-.468-.498a.5.5 0 00-.53.5v2.2c0 .25-.22.47-.47.47a.49.49 0 01-.47-.47V1.8c0-.017 0-.034-.002-.05-.022-.268-.21\
4-.49-.468-.5a.5.5 0 00-.52.5v6.78c0 .25-.22.47-.47.47a.48.48 0 01-.47-.47l.001-.1c.001-.053.002-.104 0-.155a.775.775 0 00-.06-.315.65.65 0 \
00-.16-.22 29.67 29.67 0 01-.21-.189c-.2-.182-.4-.365-.617-.532l-.003-.003A6.366 6.366 0 003.06 7l-.01-.007c-.433-.331-.621-.243-.69-.193-.2\
6.14-.29.5-.13.74l1.73 2.6v.01h-.016l-.035.023.05-.023s1.21 2.6 3.57 2.6c3.54 0 4.2-1.9 4.31-4.42.039-.591.036-1.189.032-1.783l-.002-.507v-.\
032zm.969 2.376c-.057 1.285-.254 2.667-1.082 3.72-.88 1.118-2.283 1.646-4.227 1.646-1.574 0-2.714-.87-3.406-1.623a6.958 6.958 0 01-1.046-1.5\
04l-.006-.012-1.674-2.516a1.593 1.593 0 01-.25-1.107 1.44 1.44 0 01.69-1.041c.195-.124.485-.232.856-.186.357.044.681.219.976.446.137.106.272\
.22.4.331V1.75A1.5 1.5 0 015.63.25c.93.036 1.431.856 1.431 1.55v1.335a1.5 1.5 0 01.53-.063h.017c.512.04.915.326 1.153.71a1.5 1.5 0 01.74-.16\
1c.659.025 1.115.458 1.316.964a1.493 1.493 0 01.644-.103h.017c.856.067 1.393.814 1.393 1.558l.002.48c.004.596.007 1.237-.033 1.864z",
      fill: e
    }
  )
)), R9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 6A2.5 2.5 0 116 3.5V5h2V3.5A2.5 2.5 0 1110.5 6H9v2h1.5A2.5 2.5 0 118 10.5V9H6v1.5A2.5 2.5 0 113.5 8H5V6H3.5zM2 3.5a1.5 1.5 0 \
113 0V5H3.5A1.5 1.5 0 012 3.5zM6 6v2h2V6H6zm3-1h1.5A1.5 1.5 0 109 3.5V5zM3.5 9H5v1.5A1.5 1.5 0 113.5 9zM9 9v1.5A1.5 1.5 0 1010.5 9H9z",
      fill: e
    }
  )
)), S9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.083 12.25H2.917a1.167 1.167 0 01-1.167-1.167V2.917A1.167 1.167 0 012.917 1.75h6.416l2.917 2.917v6.416a1.167 1.167 0 01-1.167 1\
.167z",
      stroke: e,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.917 12.25V7.583H4.083v4.667M4.083 1.75v2.917H8.75",
      stroke: e,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  )
)), A9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 5.5a.5.5 0 01.5.5v4a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zM7 4.5A.75.75 0 107 3a.75.75 0 000 1.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm0-1A6 6 0 107 1a6 6 0 000 12z",
      fill: e
    }
  )
)), F9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.25 5.25A1.75 1.75 0 117 7a.5.5 0 00-.5.5V9a.5.5 0 001 0V7.955A2.75 2.75 0 104.25 5.25a.5.5 0 001 0zM7 11.5A.75.75 0 107 10a.75.\
75 0 000 1.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), k9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-3.524 4.89A5.972 5.972 0 017 13a5.972 5.972 0 01-3.477-1.11l1.445-1.444C5.564 10.798 6.258 11 7 1\
1s1.436-.202 2.032-.554l1.444 1.445zm-.03-2.858l1.445 1.444A5.972 5.972 0 0013 7c0-1.296-.41-2.496-1.11-3.477l-1.444 1.445C10.798 5.564 11 6\
.258 11 7s-.202 1.436-.554 2.032zM9.032 3.554l1.444-1.445A5.972 5.972 0 007 1c-1.296 0-2.496.41-3.477 1.11l1.445 1.444A3.981 3.981 0 017 3c.\
742 0 1.436.202 2.032.554zM3.554 4.968L2.109 3.523A5.973 5.973 0 001 7c0 1.296.41 2.496 1.11 3.476l1.444-1.444A3.981 3.981 0 013 7c0-.742.20\
2-1.436.554-2.032zM10 7a3 3 0 11-6 0 3 3 0 016 0z",
      fill: e
    }
  )
)), L9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 4.5a.5.5 0 01.5.5v3.5a.5.5 0 11-1 0V5a.5.5 0 01.5-.5zM7.75 10.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.206 1.045a.498.498 0 01.23.209l6.494 10.992a.5.5 0 01-.438.754H.508a.497.497 0 01-.506-.452.498.498 0 01.072-.31l6.49-10.984a.4\
97.497 0 01.642-.21zM7 2.483L1.376 12h11.248L7 2.483z",
      fill: e
    }
  )
)), T9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zM6.5 8a.5.5 0 001 0V4a.5.5 0 00-1 0v4zm-.25 2.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z",
      fill: e
    }
  )
)), B9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 2.504a.5.5 0 01.5-.5h13a.5.5 0 01.5.5v9a.5.5 0 01-.5.5H.5a.5.5 0 01-.5-.5v-9zm1 1.012v7.488h12V3.519L7.313 7.894a.496.496 0 01-\
.526.062.497.497 0 01-.1-.062L1 3.516zm11.03-.512H1.974L7 6.874l5.03-3.87z",
      fill: e
    }
  )
)), I9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.76 8.134l-.05.05a.2.2 0 01-.28.03 6.76 6.76 0 01-1.63-1.65.21.21 0 01.04-.27l.05-.05c.23-.2.54-.47.71-.96.17-.47-.02-1.04-.66-1\
.94-.26-.38-.72-.96-1.22-1.46-.68-.69-1.2-1-1.65-1a.98.98 0 00-.51.13A3.23 3.23 0 00.9 3.424c-.13 1.1.26 2.37 1.17 3.78a16.679 16.679 0 004.\
55 4.6 6.57 6.57 0 003.53 1.32 3.2 3.2 0 002.85-1.66c.14-.24.24-.64-.07-1.18a7.803 7.803 0 00-1.73-1.81c-.64-.5-1.52-1.11-2.13-1.11a.97.97 0\
 00-.34.06c-.472.164-.74.458-.947.685l-.023.025zm4.32 2.678a6.801 6.801 0 00-1.482-1.54l-.007-.005-.006-.005a8.418 8.418 0 00-.957-.662 2.7 \
2.7 0 00-.4-.193.683.683 0 00-.157-.043l-.004.002-.009.003c-.224.078-.343.202-.56.44l-.014.016-.046.045a1.2 1.2 0 01-1.602.149A7.76 7.76 0 0\
14.98 7.134l-.013-.019-.013-.02a1.21 1.21 0 01.195-1.522l.06-.06.026-.024c.219-.19.345-.312.422-.533l.003-.01v-.008a.518.518 0 00-.032-.142c\
-.06-.178-.203-.453-.502-.872l-.005-.008-.005-.007A10.18 10.18 0 004.013 2.59l-.005-.005c-.31-.314-.543-.5-.716-.605-.147-.088-.214-.096-.22\
2-.097h-.016l-.006.003-.01.006a2.23 2.23 0 00-1.145 1.656c-.09.776.175 1.806 1.014 3.108a15.68 15.68 0 004.274 4.32l.022.014.022.016a5.57 5.\
57 0 002.964 1.117 2.2 2.2 0 001.935-1.141l.006-.012.004-.007a.182.182 0 00-.007-.038.574.574 0 00-.047-.114z",
      fill: e
    }
  )
)), M9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.841 2.159a2.25 2.25 0 00-3.182 0l-2.5 2.5a2.25 2.25 0 000 3.182.5.5 0 01-.707.707 3.25 3.25 0 010-4.596l2.5-2.5a3.25 3.25 0 01\
4.596 4.596l-2.063 2.063a4.27 4.27 0 00-.094-1.32l1.45-1.45a2.25 2.25 0 000-3.182z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.61 7.21c-.1-.434-.132-.88-.095-1.321L1.452 7.952a3.25 3.25 0 104.596 4.596l2.5-2.5a3.25 3.25 0 000-4.596.5.5 0 00-.707.707 2.25\
 2.25 0 010 3.182l-2.5 2.5A2.25 2.25 0 112.159 8.66l1.45-1.45z",
      fill: e
    }
  )
)), _9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.452 7.952l1.305-1.305.708.707-1.306 1.305a2.25 2.25 0 103.182 3.182l1.306-1.305.707.707-1.306 1.305a3.25 3.25 0 01-4.596-4.596z\
M12.548 6.048l-1.305 1.306-.707-.708 1.305-1.305a2.25 2.25 0 10-3.182-3.182L7.354 3.464l-.708-.707 1.306-1.305a3.25 3.25 0 014.596 4.596zM1.\
854 1.146a.5.5 0 10-.708.708l11 11a.5.5 0 00.707-.707l-11-11z",
      fill: e
    }
  )
)), P9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.994 1.11a1 1 0 10-1.988 0A4.502 4.502 0 002.5 5.5v3.882l-.943 1.885a.497.497 0 00-.053.295.5.5 0 00.506.438h3.575a1.5 1.5 0 102\
.83 0h3.575a.5.5 0 00.453-.733L11.5 9.382V5.5a4.502 4.502 0 00-3.506-4.39zM2.81 11h8.382l-.5-1H3.31l-.5 1zM10.5 9V5.5a3.5 3.5 0 10-7 0V9h7zm\
-4 3.5a.5.5 0 111 0 .5.5 0 01-1 0z",
      fill: e
    }
  )
)), H9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5.5A.5.5 0 012 0c6.627 0 12 5.373 12 12a.5.5 0 01-1 0C13 5.925 8.075 1 2 1a.5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 4.5A.5.5 0 012 4a8 8 0 018 8 .5.5 0 01-1 0 7 7 0 00-7-7 .5.5 0 01-.5-.5z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5 11a2 2 0 11-4 0 2 2 0 014 0zm-1 0a1 1 0 11-2 0 1 1 0 012 0z",
      fill: e
    }
  )
)), z9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 1.004a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4.5a.5.5 0 00-1 0v4.5H2v-10h4.5a.5.5 0 000-1H2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.354 7.357L12 2.711v1.793a.5.5 0 001 0v-3a.5.5 0 00-.5-.5h-3a.5.5 0 100 1h1.793L6.646 6.65a.5.5 0 10.708.707z",
      fill: e
    }
  )
)), O9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.646.15a.5.5 0 01.708 0l2 2a.5.5 0 11-.708.707L7.5 1.711v6.793a.5.5 0 01-1 0V1.71L5.354 2.857a.5.5 0 11-.708-.707l2-2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2 4.004a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1v-7a1 1 0 00-1-1H9.5a.5.5 0 100 1H12v7H2v-7h2.5a.5.5 0 000-1H2z",
      fill: e
    }
  )
)), N9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M13.854 6.646a.5.5 0 010 .708l-2 2a.5.5 0 01-.708-.708L12.293 7.5H5.5a.5.5 0 010-1h6.793l-1.147-1.146a.5.5 0 01.708-.708l2 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10 2a1 1 0 00-1-1H2a1 1 0 00-1 1v10a1 1 0 001 1h7a1 1 0 001-1V9.5a.5.5 0 00-1 0V12H2V2h7v2.5a.5.5 0 001 0V2z",
      fill: e
    }
  )
)), $9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 13A6 6 0 107 1a6 6 0 000 12zm0 1A7 7 0 107 0a7 7 0 000 14z",
      fill: e
    }
  )
)), j9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M14 7A7 7 0 110 7a7 7 0 0114 0z", fill: e })
)), V9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 0h7a.5.5 0 01.5.5v13a.5.5 0 01-.454.498.462.462 0 01-.371-.118L7 11.159l-3.175 2.72a.46.46 0 01-.379.118A.5.5 0 013 13.5V.5a.\
5.5 0 01.5-.5zM4 12.413l2.664-2.284a.454.454 0 01.377-.128.498.498 0 01.284.12L10 12.412V1H4v11.413z",
      fill: e
    }
  )
)), W9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 0h7a.5.5 0 01.5.5v13a.5.5 0 01-.454.498.462.462 0 01-.371-.118L7 11.159l-3.175 2.72a.46.46 0 01-.379.118A.5.5 0 013 13.5V.5a.\
5.5 0 01.5-.5z",
      fill: e
    }
  )
)), q9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1449_588)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M8.414 1.586a2 2 0 00-2.828 0l-4 4a2 2 0 000 2.828l4 4a2 2 0 002.828 0l4-4a2 2 0 000-2.828l-4-4zm.707-.707a3 3 0 00-4.242 0l-4 4a3\
 3 0 000 4.242l4 4a3 3 0 004.242 0l4-4a3 3 0 000-4.242l-4-4z",
      fill: e
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1449_588" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), U9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12.814 1.846c.06.05.116.101.171.154l.001.002a3.254 3.254 0 01.755 1.168c.171.461.259.974.259 1.538 0 .332-.046.656-.143.976a4.546\
 4.546 0 01-.397.937c-.169.302-.36.589-.58.864a7.627 7.627 0 01-.674.746l-4.78 4.596a.585.585 0 01-.427.173.669.669 0 01-.44-.173L1.78 8.217\
a7.838 7.838 0 01-.677-.748 6.124 6.124 0 01-.572-.855 4.975 4.975 0 01-.388-.931A3.432 3.432 0 010 4.708C0 4.144.09 3.63.265 3.17c.176-.459\
.429-.85.757-1.168a3.432 3.432 0 011.193-.74c.467-.176.99-.262 1.57-.262.304 0 .608.044.907.137.301.092.586.215.855.367.27.148.526.321.771.5\
12.244.193.471.386.682.584.202-.198.427-.391.678-.584.248-.19.507-.364.78-.512a4.65 4.65 0 01.845-.367c.294-.093.594-.137.9-.137.585 0 1.115\
.086 1.585.262.392.146.734.34 1.026.584zM1.2 3.526c.128-.333.304-.598.52-.806.218-.212.497-.389.849-.522m-1.37 1.328A3.324 3.324 0 001 4.708\
c0 .225.032.452.101.686.082.265.183.513.307.737.135.246.294.484.479.716.188.237.386.454.59.652l.001.002 4.514 4.355 4.519-4.344c.2-.193.398-\
.41.585-.648l.003-.003c.184-.23.345-.472.486-.726l.004-.007c.131-.23.232-.474.31-.732v-.002c.068-.224.101-.45.101-.686 0-.457-.07-.849-.195-\
1.185a2.177 2.177 0 00-.515-.802l.007-.012-.008.009a2.383 2.383 0 00-.85-.518l-.003-.001C11.1 2.072 10.692 2 10.203 2c-.21 0-.406.03-.597.09\
h-.001c-.22.07-.443.167-.663.289l-.007.003c-.22.12-.434.262-.647.426-.226.174-.42.341-.588.505l-.684.672-.7-.656a9.967 9.967 0 00-.615-.527 \
4.82 4.82 0 00-.635-.422l-.01-.005a3.289 3.289 0 00-.656-.281l-.008-.003A2.014 2.014 0 003.785 2c-.481 0-.881.071-1.217.198",
      fill: e
    }
  )
)), G9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M12.814 1.846c.06.05.116.101.171.154l.001.002a3.254 3.254 0 01.755 1.168c.171.461.259.974.259 1.538 0 .332-.046.656-.143.976a4.546\
 4.546 0 01-.397.937c-.169.302-.36.589-.58.864a7.627 7.627 0 01-.674.746l-4.78 4.596a.585.585 0 01-.427.173.669.669 0 01-.44-.173L1.78 8.217\
a7.838 7.838 0 01-.677-.748 6.124 6.124 0 01-.572-.855 4.975 4.975 0 01-.388-.931A3.432 3.432 0 010 4.708C0 4.144.09 3.63.265 3.17c.176-.459\
.429-.85.757-1.168a3.432 3.432 0 011.193-.74c.467-.176.99-.262 1.57-.262.304 0 .608.044.907.137.301.092.586.215.855.367.27.148.526.321.771.5\
12.244.193.471.386.682.584.202-.198.427-.391.678-.584.248-.19.507-.364.78-.512a4.65 4.65 0 01.845-.367c.294-.093.594-.137.9-.137.585 0 1.115\
.086 1.585.262.392.146.734.34 1.026.584z",
      fill: e
    }
  )
)), Y9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.319.783a.75.75 0 011.362 0l1.63 3.535 3.867.458a.75.75 0 01.42 1.296L10.74 8.715l.76 3.819a.75.75 0 01-1.103.8L7 11.434l-3.398 \
1.902a.75.75 0 01-1.101-.801l.758-3.819L.401 6.072a.75.75 0 01.42-1.296l3.867-.458L6.318.783zm.68.91l-1.461 3.17a.75.75 0 01-.593.431l-3.467\
.412 2.563 2.37a.75.75 0 01.226.697l-.68 3.424 3.046-1.705a.75.75 0 01.733 0l3.047 1.705-.68-3.424a.75.75 0 01.226-.697l2.563-2.37-3.467-.41\
2a.75.75 0 01-.593-.43L7 1.694z",
      fill: e
    }
  )
)), X9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.68.783a.75.75 0 00-1.361 0l-1.63 3.535-3.867.458A.75.75 0 00.4 6.072l2.858 2.643-.758 3.819a.75.75 0 001.101.8L7 11.434l3.397 1\
.902a.75.75 0 001.102-.801l-.759-3.819L13.6 6.072a.75.75 0 00-.421-1.296l-3.866-.458L7.68.783z",
      fill: e
    }
  )
)), K9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10 7.854a4.5 4.5 0 10-6 0V13a.5.5 0 00.497.5h.006c.127 0 .254-.05.35-.146L7 11.207l2.146 2.147A.5.5 0 0010 13V7.854zM7 8a3.5 3.5 \
0 100-7 3.5 3.5 0 000 7zm-.354 2.146a.5.5 0 01.708 0L9 11.793v-3.26C8.398 8.831 7.718 9 7 9a4.481 4.481 0 01-2-.468v3.26l1.646-1.646z",
      fill: e
    }
  )
)), Z9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.565 13.123a.991.991 0 01.87 0l.987.482a.991.991 0 001.31-.426l.515-.97a.991.991 0 01.704-.511l1.082-.19a.99.99 0 00.81-1.115l-.\
154-1.087a.991.991 0 01.269-.828l.763-.789a.991.991 0 000-1.378l-.763-.79a.991.991 0 01-.27-.827l.155-1.087a.99.99 0 00-.81-1.115l-1.082-.19\
a.991.991 0 01-.704-.511L9.732.82a.99.99 0 00-1.31-.426l-.987.482a.991.991 0 01-.87 0L5.578.395a.99.99 0 00-1.31.426l-.515.97a.99.99 0 01-.7\
04.511l-1.082.19a.99.99 0 00-.81 1.115l.154 1.087a.99.99 0 01-.269.828L.28 6.31a.99.99 0 000 1.378l.763.79a.99.99 0 01.27.827l-.155 1.087a.9\
9.99 0 00.81 1.115l1.082.19a.99.99 0 01.704.511l.515.97c.25.473.83.661 1.31.426l.987-.482zm4.289-8.477a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.7\
08 0l-2.5-2.5a.5.5 0 11.708-.708L6 8.793l4.146-4.147a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), J9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11 12.02c-.4.37-.91.56-1.56.56h-.88a5.493 5.493 0 01-1.3-.16c-.42-.1-.91-.25-1.47-.45a5.056 5.056 0 00-.95-.27H2.88a.84.84 0 01-.\
62-.26.84.84 0 01-.26-.61V6.45c0-.24.09-.45.26-.62a.84.84 0 01.62-.25h1.87c.16-.11.47-.47.93-1.06.27-.35.51-.64.74-.88.1-.11.19-.3.24-.58.05\
-.28.12-.57.2-.87.1-.3.24-.55.43-.74a.87.87 0 01.62-.25c.38 0 .72.07 1.03.22.3.15.54.38.7.7.15.31.23.73.23 1.27a3 3 0 01-.32 1.31h1.2c.47 0 \
.88.17 1.23.52s.52.8.52 1.22c0 .29-.04.66-.34 1.12.05.15.07.3.07.47 0 .35-.09.68-.26.98a2.05 2.05 0 01-.4 1.51 1.9 1.9 0 01-.57 1.5zm.473-5.\
33a.965.965 0 00.027-.25.742.742 0 00-.227-.513.683.683 0 00-.523-.227H7.927l.73-1.45a2 2 0 00.213-.867c0-.444-.068-.695-.127-.822a.53.53 0 \
00-.245-.244 1.296 1.296 0 00-.539-.116.989.989 0 00-.141.28 9.544 9.544 0 00-.174.755c-.069.387-.213.779-.484 1.077l-.009.01-.009.01c-.195.\
202-.41.46-.67.798l-.003.004c-.235.3-.44.555-.613.753-.151.173-.343.381-.54.516l-.255.176H5v4.133l.018.003c.384.07.76.176 1.122.318.532.189.\
98.325 1.352.413l.007.002a4.5 4.5 0 001.063.131h.878c.429 0 .683-.115.871-.285a.9.9 0 00.262-.702l-.028-.377.229-.3a1.05 1.05 0 00.205-.774l\
-.044-.333.165-.292a.969.969 0 00.13-.487.457.457 0 00-.019-.154l-.152-.458.263-.404a1.08 1.08 0 00.152-.325zM3.5 10.8a.5.5 0 100-1 .5.5 0 0\
00 1z",
      fill: e
    }
  )
)), Q9 = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.765 2.076A.5.5 0 0112 2.5v6.009a.497.497 0 01-.17.366L7.337 12.87a.497.497 0 01-.674 0L2.17 8.875l-.009-.007a.498.498 0 01-.16\
-.358L2 8.5v-6a.5.5 0 01.235-.424l.018-.011c.016-.01.037-.024.065-.04.056-.032.136-.077.24-.128a6.97 6.97 0 01.909-.371C4.265 1.26 5.443 1 7\
 1s2.735.26 3.533.526c.399.133.702.267.91.37a4.263 4.263 0 01.304.169l.018.01zM3 2.793v5.482l1.068.95 6.588-6.588a6.752 6.752 0 00-.44-.163C\
9.517 2.24 8.444 2 7 2c-1.443 0-2.515.24-3.217.474-.351.117-.61.233-.778.317L3 2.793zm4 9.038l-2.183-1.94L11 3.706v4.568l-4 3.556z",
      fill: e
    }
  )
)), eD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.354 2.854a.5.5 0 10-.708-.708l-3 3a.5.5 0 10.708.708l3-3z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.09 6H4.5a.5.5 0 000-1H1.795a.75.75 0 00-.74.873l.813 4.874A1.5 1.5 0 003.348 12h7.305a1.5 1.5 0 001.48-1.253l.812-4.874a.75.75 \
0 00-.74-.873H10a.5.5 0 000 1h1.91l-.764 4.582a.5.5 0 01-.493.418H3.347a.5.5 0 01-.493-.418L2.09 6z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.5 7a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM10 7.5a.5.5 0 00-1 0v2a.5.5 0 001 0v-2zM6.5 9.5v-2a.5.5 0 011 0v2a.5.5 0 0\
1-1 0z",
      fill: e
    }
  )
)), tD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.5 2h.75v3.866l-3.034 5.26A1.25 1.25 0 003.299 13H10.7a1.25 1.25 0 001.083-1.875L8.75 5.866V2h.75a.5.5 0 100-1h-5a.5.5 0 000 1zm\
1.75 4V2h1.5v4.134l.067.116L8.827 8H5.173l1.01-1.75.067-.116V6zM4.597 9l-1.515 2.625A.25.25 0 003.3 12H10.7a.25.25 0 00.217-.375L9.404 9H4.5\
97z",
      fill: e
    }
  )
)), rD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M7.5 10.5a.5.5 0 11-1 0 .5.5 0 011 0z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.5 1a.5.5 0 00-.5.5c0 1.063.137 1.892.678 2.974.346.692.858 1.489 1.598 2.526-.89 1.247-1.455 2.152-1.798 2.956-.377.886-.477 1.\
631-.478 2.537v.007a.5.5 0 00.5.5h7c.017 0 .034 0 .051-.003A.5.5 0 0011 12.5v-.007c0-.906-.1-1.65-.478-2.537-.343-.804-.909-1.709-1.798-2.95\
6.74-1.037 1.252-1.834 1.598-2.526C10.863 3.392 11 2.563 11 1.5a.5.5 0 00-.5-.5h-7zm6.487 11a4.675 4.675 0 00-.385-1.652c-.277-.648-.735-1.4\
07-1.499-2.494-.216.294-.448.606-.696.937a.497.497 0 01-.195.162.5.5 0 01-.619-.162c-.248-.331-.48-.643-.696-.937-.764 1.087-1.222 1.846-1.4\
99 2.494A4.675 4.675 0 004.013 12h5.974zM6.304 6.716c.212.293.443.609.696.948a90.058 90.058 0 00.709-.965c.48-.664.86-1.218 1.163-1.699H5.12\
8a32.672 32.672 0 001.176 1.716zM4.559 4h4.882c.364-.735.505-1.312.546-2H4.013c.04.688.182 1.265.546 2z",
      fill: e
    }
  )
)), nD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11.5 1h-9a.5.5 0 00-.5.5v11a.5.5 0 001 0V8h8.5a.5.5 0 00.354-.854L9.207 4.5l2.647-2.646A.499.499 0 0011.5 1zM8.146 4.146L10.293 2\
H3v5h7.293L8.146 4.854a.5.5 0 010-.708z",
      fill: e
    }
  )
)), oD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10 7V6a3 3 0 00-5.91-.736l-.17.676-.692.075A2.5 2.5 0 003.5 11h3c.063 0 .125-.002.187-.007l.076-.005.076.006c.053.004.106.006.161\
.006h4a2 2 0 100-4h-1zM3.12 5.02A3.5 3.5 0 003.5 12h3c.087 0 .174-.003.26-.01.079.007.16.01.24.01h4a3 3 0 100-6 4 4 0 00-7.88-.98z",
      fill: e
    }
  )
)), aD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 2a4 4 0 014 4 3 3 0 110 6H7c-.08 0-.161-.003-.24-.01-.086.007-.173.01-.26.01h-3a3.5 3.5 0 01-.38-6.98A4.002 4.002 0 017 2z",
      fill: e
    }
  )
)), iD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M11 7a4 4 0 11-8 0 4 4 0 018 0zm-1 0a3 3 0 11-6 0 3 3 0 016 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.268 13.18c.25.472.83.66 1.31.425l.987-.482a.991.991 0 01.87 0l.987.482a.991.991 0 001.31-.426l.515-.97a.991.991 0 01.704-.511l1\
.082-.19a.99.99 0 00.81-1.115l-.154-1.087a.991.991 0 01.269-.828l.763-.789a.991.991 0 000-1.378l-.763-.79a.991.991 0 01-.27-.827l.155-1.087a\
.99.99 0 00-.81-1.115l-1.082-.19a.991.991 0 01-.704-.511L9.732.82a.99.99 0 00-1.31-.426l-.987.482a.991.991 0 01-.87 0L5.578.395a.99.99 0 00-\
1.31.426l-.515.97a.99.99 0 01-.704.511l-1.082.19a.99.99 0 00-.81 1.115l.154 1.087a.99.99 0 01-.269.828L.28 6.31a.99.99 0 000 1.378l.763.79a.\
99.99 0 01.27.827l-.155 1.087a.99.99 0 00.81 1.115l1.082.19a.99.99 0 01.704.511l.515.97zm5.096-1.44l-.511.963-.979-.478a1.99 1.99 0 00-1.748\
 0l-.979.478-.51-.962a1.991 1.991 0 00-1.415-1.028l-1.073-.188.152-1.079a1.991 1.991 0 00-.54-1.663L1.004 7l.757-.783a1.991 1.991 0 00.54-1.\
663L2.15 3.475l1.073-.188A1.991 1.991 0 004.636 2.26l.511-.962.979.478a1.99 1.99 0 001.748 0l.979-.478.51.962c.288.543.81.922 1.415 1.028l1.\
073.188-.152 1.079a1.99 1.99 0 00.54 1.663l.757.783-.757.783a1.99 1.99 0 00-.54 1.663l.152 1.079-1.073.188a1.991 1.991 0 00-1.414 1.028z",
      fill: e
    }
  )
)), lD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 4a3 3 0 100 6 3 3 0 000-6zM3 7a4 4 0 118 0 4 4 0 01-8 0z",
      fill: e
    }
  )
)), sD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.206 3.044a.498.498 0 01.23.212l3.492 5.985a.494.494 0 01.006.507.497.497 0 01-.443.252H3.51a.499.499 0 01-.437-.76l3.492-5.984a\
.497.497 0 01.642-.212zM7 4.492L4.37 9h5.26L7 4.492z",
      fill: e
    }
  )
)), uD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10.854 4.146a.5.5 0 010 .708l-5 5a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L5.5 8.793l4.646-4.647a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), cD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.354 3.896l5.5 5.5a.5.5 0 01-.708.708L7 4.957l-5.146 5.147a.5.5 0 01-.708-.708l5.5-5.5a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), pD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.146 4.604l5.5 5.5a.5.5 0 00.708 0l5.5-5.5a.5.5 0 00-.708-.708L7 9.043 1.854 3.896a.5.5 0 10-.708.708z",
      fill: e
    }
  )
)), dD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M2.76 7.096a.498.498 0 00.136.258l5.5 5.5a.5.5 0 00.707-.708L3.958 7l5.147-5.146a.5.5 0 10-.708-.708l-5.5 5.5a.5.5 0 00-.137.45z",
      fill: e
    }
  )
)), Ou = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.104 7.354l-5.5 5.5a.5.5 0 01-.708-.708L10.043 7 4.896 1.854a.5.5 0 11.708-.708l5.5 5.5a.5.5 0 010 .708z",
      fill: e
    }
  )
)), fD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.854 9.104a.5.5 0 11-.708-.708l3.5-3.5a.5.5 0 01.708 0l3.5 3.5a.5.5 0 01-.708.708L7 5.957 3.854 9.104z",
      fill: e
    }
  )
)), hD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.854 4.896a.5.5 0 10-.708.708l3.5 3.5a.5.5 0 00.708 0l3.5-3.5a.5.5 0 00-.708-.708L7 8.043 3.854 4.896z",
      fill: e
    }
  )
)), mD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M9.104 10.146a.5.5 0 01-.708.708l-3.5-3.5a.5.5 0 010-.708l3.5-3.5a.5.5 0 11.708.708L5.957 7l3.147 3.146z",
      fill: e
    }
  )
)), gD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M4.896 10.146a.5.5 0 00.708.708l3.5-3.5a.5.5 0 000-.708l-3.5-3.5a.5.5 0 10-.708.708L8.043 7l-3.147 3.146z",
      fill: e
    }
  )
)), vD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.854 4.646l-4.5-4.5a.5.5 0 00-.708 0l-4.5 4.5a.5.5 0 10.708.708L6.5 1.707V13.5a.5.5 0 001 0V1.707l3.646 3.647a.5.5 0 00.708-.70\
8z",
      fill: e
    }
  )
)), wD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.5.5a.5.5 0 00-1 0v11.793L2.854 8.646a.5.5 0 10-.708.708l4.5 4.5a.5.5 0 00.351.146h.006c.127 0 .254-.05.35-.146l4.5-4.5a.5.5 0 0\
0-.707-.708L7.5 12.293V.5z",
      fill: e
    }
  )
)), bD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.354 2.146a.5.5 0 010 .708L1.707 6.5H13.5a.5.5 0 010 1H1.707l3.647 3.646a.5.5 0 01-.708.708l-4.5-4.5a.5.5 0 010-.708l4.5-4.5a.5.\
5 0 01.708 0z",
      fill: e
    }
  )
)), yD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8.646 2.146a.5.5 0 01.708 0l4.5 4.5a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.708-.708L12.293 7.5H.5a.5.5 0 010-1h11.793L8.646 2.854a.5\
.5 0 010-.708z",
      fill: e
    }
  )
)), DD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.904 8.768V2.404a.5.5 0 01.5-.5h6.364a.5.5 0 110 1H3.61l8.339 8.339a.5.5 0 01-.707.707l-8.34-8.34v5.158a.5.5 0 01-1 0z",
      fill: e
    }
  )
)), xD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M12.096 8.768V2.404a.5.5 0 00-.5-.5H5.232a.5.5 0 100 1h5.157L2.05 11.243a.5.5 0 10.707.707l8.34-8.34v5.158a.5.5 0 101 0z",
      fill: e
    }
  )
)), CD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.904 5.232v6.364a.5.5 0 00.5.5h6.364a.5.5 0 000-1H3.61l8.339-8.339a.5.5 0 00-.707-.707l-8.34 8.34V5.231a.5.5 0 00-1 0z",
      fill: e
    }
  )
)), ED = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M12.096 5.232v6.364a.5.5 0 01-.5.5H5.232a.5.5 0 010-1h5.157L2.05 2.757a.5.5 0 01.707-.707l8.34 8.34V5.231a.5.5 0 111 0z",
      fill: e
    }
  )
)), RD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M6.772 3.59c.126-.12.33-.12.456 0l5.677 5.387c.203.193.06.523-.228.523H1.323c-.287 0-.431-.33-.228-.523L6.772 3.59z",
      fill: e
    }
  )
)), SD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.228 10.41a.335.335 0 01-.456 0L1.095 5.023c-.203-.193-.06-.523.228-.523h11.354c.287 0 .431.33.228.523L7.228 10.41z",
      fill: e
    }
  )
)), AD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M3.712 7.212a.3.3 0 010-.424l5.276-5.276a.3.3 0 01.512.212v10.552a.3.3 0 01-.512.212L3.712 7.212z",
      fill: e
    }
  )
)), FD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10.288 7.212a.3.3 0 000-.424L5.012 1.512a.3.3 0 00-.512.212v10.552a.3.3 0 00.512.212l5.276-5.276z",
      fill: e
    }
  )
)), kD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.354.146l4 4a.5.5 0 01-.708.708L7 1.207 3.354 4.854a.5.5 0 11-.708-.708l4-4a.5.5 0 01.708 0zM11.354 9.146a.5.5 0 010 .708l-4 4a.\
5.5 0 01-.708 0l-4-4a.5.5 0 11.708-.708L7 12.793l3.646-3.647a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), LD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.354.146a.5.5 0 10-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 00-.708-.708L7 3.793 3.354.146zM6.646 9.146a.5.5 0 01.708 0l4 4a.5.5 \
0 01-.708.708L7 10.207l-3.646 3.647a.5.5 0 01-.708-.708l4-4z",
      fill: e
    }
  )
)), TD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 1h2a.5.5 0 010 1h-.793l3.147 3.146a.5.5 0 11-.708.708L2 2.707V3.5a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM10 1.5a.5.5 0 01.5-.5h2a.5\
.5 0 01.5.5v2a.5.5 0 01-1 0v-.793L8.854 5.854a.5.5 0 11-.708-.708L11.293 2H10.5a.5.5 0 01-.5-.5zM12.5 10a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.\
5.5 0 010-1h.793L8.146 8.854a.5.5 0 11.708-.708L12 11.293V10.5a.5.5 0 01.5-.5zM2 11.293V10.5a.5.5 0 00-1 0v2a.5.5 0 00.5.5h2a.5.5 0 000-1h-.\
793l3.147-3.146a.5.5 0 10-.708-.708L2 11.293z",
      fill: e
    }
  )
)), BD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M6.646.147l-1.5 1.5a.5.5 0 10.708.707l.646-.647V5a.5.5 0 001 0V1.707l.646.647a.5.5 0 10.708-.707l-1.5-1.5a.5.5 0 00-.708 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.309 4.038a.498.498 0 00-.16.106l-.005.005a.498.498 0 00.002.705L3.293 7 1.146 9.146A.498.498 0 001.5 10h3a.5.5 0 000-1H2.707l1.\
5-1.5h5.586l2.353 2.354a.5.5 0 00.708-.708L10.707 7l2.146-2.146.11-.545-.107.542A.499.499 0 0013 4.503v-.006a.5.5 0 00-.144-.348l-.005-.005A\
.498.498 0 0012.5 4h-3a.5.5 0 000 1h1.793l-1.5 1.5H4.207L2.707 5H4.5a.5.5 0 000-1h-3a.498.498 0 00-.191.038z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 8.5a.5.5 0 01.5.5v3.293l.646-.647a.5.5 0 01.708.708l-1.5 1.5a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 01.708-.708l.646.647V9a.5.5 0 01.\
5-.5zM9 9.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z",
      fill: e
    }
  )
)), ID = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M10.646 2.646a.5.5 0 01.708 0l1.5 1.5a.5.5 0 010 .708l-1.5 1.5a.5.5 0 01-.708-.708L11.293 5H1.5a.5.5 0 010-1h9.793l-.647-.646a.5.5\
 0 010-.708zM3.354 8.354L2.707 9H12.5a.5.5 0 010 1H2.707l.647.646a.5.5 0 01-.708.708l-1.5-1.5a.5.5 0 010-.708l1.5-1.5a.5.5 0 11.708.708z",
      fill: e
    }
  )
)), MD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.5 1a.5.5 0 01.5.5V10a2 2 0 004 0V4a3 3 0 016 0v7.793l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 01.708-.70\
8L11 11.793V4a2 2 0 10-4 0v6.002a3 3 0 01-6 0V1.5a.5.5 0 01.5-.5z",
      fill: e
    }
  )
)), _D = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.146 3.854a.5.5 0 010-.708l2-2a.5.5 0 11.708.708L2.707 3h6.295A4 4 0 019 11H3a.5.5 0 010-1h6a3 3 0 100-6H2.707l1.147 1.146a.5.5 \
0 11-.708.708l-2-2z",
      fill: e
    }
  )
)), PD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.354 2.146a.5.5 0 010 .708L1.707 5.5H9.5A4.5 4.5 0 0114 10v1.5a.5.5 0 01-1 0V10a3.5 3.5 0 00-3.5-3.5H1.707l2.647 2.646a.5.5 0 11\
-.708.708l-3.5-3.5a.5.5 0 010-.708l3.5-3.5a.5.5 0 01.708 0z",
      fill: e
    }
  )
)), HD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.5 1A.5.5 0 005 .5H2a.5.5 0 000 1h1.535a6.502 6.502 0 002.383 11.91.5.5 0 10.165-.986A5.502 5.502 0 014.5 2.1V4a.5.5 0 001 0V1.3\
53a.5.5 0 000-.023V1zM7.507 1a.5.5 0 01.576-.41 6.502 6.502 0 012.383 11.91H12a.5.5 0 010 1H9a.5.5 0 01-.5-.5v-3a.5.5 0 011 0v1.9A5.5 5.5 0 \
007.917 1.576.5.5 0 017.507 1z",
      fill: e
    }
  )
)), zD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8.646 5.854L7.5 4.707V10.5a.5.5 0 01-1 0V4.707L5.354 5.854a.5.5 0 11-.708-.708l2-2a.5.5 0 01.708 0l2 2a.5.5 0 11-.708.708z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), OD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.354 8.146L6.5 9.293V3.5a.5.5 0 011 0v5.793l1.146-1.147a.5.5 0 11.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 7a7 7 0 1114 0A7 7 0 010 7zm1 0a6 6 0 1112 0A6 6 0 011 7z",
      fill: e
    }
  )
)), ND = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M5.854 5.354L4.707 6.5H10.5a.5.5 0 010 1H4.707l1.147 1.146a.5.5 0 11-.708.708l-2-2a.5.5 0 010-.708l2-2a.5.5 0 11.708.708z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 0a7 7 0 110 14A7 7 0 017 0zm0 1a6 6 0 110 12A6 6 0 017 1z",
      fill: e
    }
  )
)), $D = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.5 6.5h5.793L8.146 5.354a.5.5 0 11.708-.708l2 2a.5.5 0 010 .708l-2 2a.5.5 0 11-.708-.708L9.293 7.5H3.5a.5.5 0 010-1z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 117 0a7 7 0 010 14zm0-1A6 6 0 117 1a6 6 0 010 12z",
      fill: e
    }
  )
)), jD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.092.5H7a6.5 6.5 0 106.41 7.583.5.5 0 10-.986-.166A5.495 5.495 0 017 12.5a5.5 5.5 0 010-11h.006a5.5 5.5 0 014.894 3H10a.5.5 0 00\
0 1h3a.5.5 0 00.5-.5V2a.5.5 0 00-1 0v1.535A6.495 6.495 0 007.092.5z",
      fill: e
    }
  )
)), VD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 100 7a7 7 0 0014 0zm-6.535 5.738c-.233.23-.389.262-.465.262-.076 0-.232-.032-.465-.262-.238-.234-.497-.623-.737-1.182-\
.434-1.012-.738-2.433-.79-4.056h3.984c-.052 1.623-.356 3.043-.79 4.056-.24.56-.5.948-.737 1.182zM8.992 6.5H5.008c.052-1.623.356-3.044.79-4.0\
56.24-.56.5-.948.737-1.182C6.768 1.032 6.924 1 7 1c.076 0 .232.032.465.262.238.234.497.623.737 1.182.434 1.012.738 2.433.79 4.056zm1 1c-.065\
 2.176-.558 4.078-1.282 5.253A6.005 6.005 0 0012.98 7.5H9.992zm2.987-1H9.992c-.065-2.176-.558-4.078-1.282-5.253A6.005 6.005 0 0112.98 6.5zm-\
8.971 0c.065-2.176.558-4.078 1.282-5.253A6.005 6.005 0 001.02 6.5h2.988zm-2.987 1a6.005 6.005 0 004.27 5.253C4.565 11.578 4.072 9.676 4.007 \
7.5H1.02z",
      fill: e
    }
  )
)), WD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M10.087 3.397L5.95 5.793a.374.374 0 00-.109.095.377.377 0 00-.036.052l-2.407 4.147a.374.374 0 00-.004.384c.104.179.334.24.513.136l\
4.142-2.404a.373.373 0 00.148-.143l2.406-4.146a.373.373 0 00-.037-.443.373.373 0 00-.478-.074zM4.75 9.25l2.847-1.652-1.195-1.195L4.75 9.25z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), qD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0 7a7 7 0 1114 0A7 7 0 010 7zm6.5 3.5v2.48A6.001 6.001 0 011.02 7.5H3.5a.5.5 0 000-1H1.02A6.001 6.001 0 016.5 1.02V3.5a.5.5 0 001\
 0V1.02a6.001 6.001 0 015.48 5.48H10.5a.5.5 0 000 1h2.48a6.002 6.002 0 01-5.48 5.48V10.5a.5.5 0 00-1 0z",
      fill: e
    }
  )
)), UD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M9 5a2 2 0 11-4 0 2 2 0 014 0zM8 5a1 1 0 11-2 0 1 1 0 012 0z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M12 5A5 5 0 002 5c0 2.633 2.273 6.154 4.65 8.643.192.2.508.2.7 0C9.726 11.153 12 7.633 12 5zM7 1a4 4 0 014 4c0 1.062-.471 2.42-1.3\
03 3.88-.729 1.282-1.69 2.562-2.697 3.67-1.008-1.108-1.968-2.388-2.697-3.67C3.47 7.42 3 6.063 3 5a4 4 0 014-4z",
      fill: e
    }
  )
)), GD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7 2a.5.5 0 01.5.5v4H10a.5.5 0 010 1H7a.5.5 0 01-.5-.5V2.5A.5.5 0 017 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm0-1A6 6 0 107 1a6 6 0 000 12z",
      fill: e
    }
  )
)), YD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.79 4.093a.5.5 0 01.117.698L7.91 7.586a1 1 0 11-.814-.581l1.997-2.796a.5.5 0 01.698-.116z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M2.069 12.968a7 7 0 119.863 0A12.962 12.962 0 007 12c-1.746 0-3.41.344-4.931.968zm9.582-1.177a6 6 0 10-9.301 0A13.98 13.98 0 017 1\
1c1.629 0 3.194.279 4.65.791z",
      fill: e
    }
  )
)), XD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("path", { d: "M7.5 4.5a.5.5 0 00-1 0v2.634a1 1 0 101 0V4.5z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5.5.5A.5.5 0 016 0h2a.5.5 0 010 1h-.5v1.02a5.973 5.973 0 013.374 1.398l.772-.772a.5.5 0 01.708.708l-.772.772A6 6 0 116.5 2.02V1H6\
a.5.5 0 01-.5-.5zM7 3a5 5 0 100 10A5 5 0 007 3z",
      fill: e
    }
  )
)), KD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7.354 1.146l5.5 5.5a.5.5 0 01-.708.708L12 7.207V12.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V9H6v3.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V\
7.207l-.146.147a.5.5 0 11-.708-.708l1-1 4.5-4.5a.5.5 0 01.708 0zM3 6.207V12h2V8.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V12h2V6.207l-4-4-4 4z",
      fill: e
    }
  )
)), ZD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1.213 4.094a.5.5 0 01.056-.034l5.484-2.995a.498.498 0 01.494 0L12.73 4.06a.507.507 0 01.266.389.498.498 0 01-.507.555H1.51a.5.5 0\
 01-.297-.91zm2.246-.09h7.082L7 2.07 3.459 4.004z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4 6a.5.5 0 00-1 0v5a.5.5 0 001 0V6zM11 6a.5.5 0 00-1 0v5a.5.5 0 001 0V6zM5.75 5.5a.5.5 0 01.5.5v5a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z\
M8.75 6a.5.5 0 00-1 0v5a.5.5 0 001 0V6zM1.5 12.504a.5.5 0 01.5-.5h10a.5.5 0 010 1H2a.5.5 0 01-.5-.5z",
      fill: e
    }
  )
)), JD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement("g", { clipPath: "url(#prefix__clip0_1107_3594)" }, /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M11.451.537l.01 12.922h0L7.61 8.946a1.077 1.077 0 00-.73-.374L.964 8.087 11.45.537h0z",
      stroke: e,
      strokeWidth: 1.077
    }
  )),
  /* @__PURE__ */ s.createElement("defs", null, /* @__PURE__ */ s.createElement("clipPath", { id: "prefix__clip0_1107_3594" }, /* @__PURE__ */ s.createElement(
  "path", { fill: "#fff", d: "M0 0h14v14H0z" })))
)), QD = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zM2.671 11.155c.696-1.006 2.602-1.816 3.194-1.91.226-.036.232-.658.232-.658s-.665-.658-.81-1.544c-.3\
9 0-.63-.94-.241-1.272a2.578 2.578 0 00-.012-.13c-.066-.607-.28-2.606 1.965-2.606 2.246 0 2.031 2 1.966 2.606l-.012.13c.39.331.149 1.272-.24\
 1.272-.146.886-.81 1.544-.81 1.544s.004.622.23.658c.593.094 2.5.904 3.195 1.91a6 6 0 10-8.657 0z",
      fill: e
    }
  )
)), ex = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M7.275 13.16a11.388 11.388 0 005.175-1.232v-.25c0-1.566-3.237-2.994-4.104-3.132-.27-.043-.276-.783-.276-.783s.791-.783.964-1.836c.\
463 0 .75-1.119.286-1.513C9.34 4 9.916 1.16 6.997 1.16c-2.92 0-2.343 2.84-2.324 3.254-.463.394-.177 1.513.287 1.513.172 1.053.963 1.836.963 \
1.836s-.006.74-.275.783c-.858.136-4.036 1.536-4.103 3.082a11.388 11.388 0 005.73 1.532z",
      fill: e
    }
  )
)), tx = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M1.183 11.906a10.645 10.645 0 01-1.181-.589c.062-1.439 3.02-2.74 3.818-2.868.25-.04.256-.728.256-.728s-.736-.729-.896-1.709c-.432 \
0-.698-1.041-.267-1.408A2.853 2.853 0 002.9 4.46c-.072-.672-.31-2.884 2.175-2.884 2.486 0 2.248 2.212 2.176 2.884-.007.062-.012.112-.014.144\
.432.367.165 1.408-.266 1.408-.16.98-.896 1.709-.896 1.709s.005.688.256.728c.807.129 3.82 1.457 3.82 2.915v.233a10.598 10.598 0 01-4.816 1.1\
46c-1.441 0-2.838-.282-4.152-.837zM11.5 2.16a.5.5 0 01.5.5v1.5h1.5a.5.5 0 010 1H12v1.5a.5.5 0 01-1 0v-1.5H9.5a.5.5 0 110-1H11v-1.5a.5.5 0 01\
.5-.5z",
      fill: e
    }
  )
)), rx = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.21 11.623a10.586 10.586 0 01-4.031.787A10.585 10.585 0 010 11.07c.06-1.354 2.933-2.578 3.708-2.697.243-.038.249-.685.249-.685s-\
.715-.685-.87-1.607c-.42 0-.679-.979-.26-1.323a2.589 2.589 0 00-.013-.136c-.07-.632-.3-2.712 2.113-2.712 2.414 0 2.183 2.08 2.113 2.712-.007\
.059-.012.105-.013.136.419.344.16 1.323-.259 1.323-.156.922-.87 1.607-.87 1.607s.005.647.248.685c.784.12 3.71 1.37 3.71 2.74v.22c-.212.103-.\
427.2-.646.29z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M8.81 8.417a9.643 9.643 0 00-.736-.398c.61-.42 1.396-.71 1.7-.757.167-.026.171-.471.171-.471s-.491-.471-.598-1.104c-.288 0-.466-.6\
74-.178-.91-.001-.022-.005-.053-.01-.094-.048-.434-.206-1.864 1.453-1.864 1.66 0 1.5 1.43 1.453 1.864l-.01.094c.289.236.11.91-.178.91-.107.6\
33-.598 1.104-.598 1.104s.004.445.171.47c.539.084 2.55.942 2.55 1.884v.628a10.604 10.604 0 01-3.302.553 2.974 2.974 0 00-.576-.879c-.375-.40\
8-.853-.754-1.312-1.03z",
      fill: e
    }
  )
)), nx = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M9.106 7.354c-.627.265-1.295.4-1.983.4a5.062 5.062 0 01-2.547-.681c.03-.688 1.443-1.31 1.824-1.37.12-.02.122-.348.122-.348s-.351-.\
348-.428-.816c-.206 0-.333-.498-.127-.673 0-.016-.003-.04-.007-.07C5.926 3.477 5.812 2.42 7 2.42c1.187 0 1.073 1.057 1.039 1.378l-.007.069c.\
207.175.08.673-.127.673-.076.468-.428.816-.428.816s.003.329.122.348c.386.06 1.825.696 1.825 1.392v.111c-.104.053-.21.102-.318.148zM3.75 11.2\
5A.25.25 0 014 11h6a.25.25 0 110 .5H4a.25.25 0 01-.25-.25zM4 9a.25.25 0 000 .5h6a.25.25 0 100-.5H4z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M1 .5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V.5zM2 13V1h10v12H2z",
      fill: e
    }
  )
)), ox = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.968 8.75a.5.5 0 00-.866.5A4.498 4.498 0 007 11.5c1.666 0 3.12-.906 3.898-2.25a.5.5 0 10-.866-.5A3.498 3.498 0 017 10.5a3.498 3.\
498 0 01-3.032-1.75zM5.5 5a1 1 0 11-2 0 1 1 0 012 0zM9.5 6a1 1 0 100-2 1 1 0 000 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), ax = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M4.5 9a.5.5 0 000 1h5a.5.5 0 000-1h-5zM5.5 5a1 1 0 11-2 0 1 1 0 012 0zM9.5 6a1 1 0 100-2 1 1 0 000 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), ix = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.968 10.25a.5.5 0 01-.866-.5A4.498 4.498 0 017 7.5c1.666 0 3.12.906 3.898 2.25a.5.5 0 11-.866.5A3.498 3.498 0 007 8.5a3.498 3.49\
8 0 00-3.032 1.75zM5.5 5a1 1 0 11-2 0 1 1 0 012 0zM9.5 6a1 1 0 100-2 1 1 0 000 2z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M14 7A7 7 0 110 7a7 7 0 0114 0zm-1 0A6 6 0 111 7a6 6 0 0112 0z",
      fill: e
    }
  )
)), lx = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      d: "M3.526 4.842a.5.5 0 01.632-.316l2.051.684a2.5 2.5 0 001.582 0l2.05-.684a.5.5 0 01.317.948l-2.453.818a.3.3 0 00-.205.285v.243a4.5 4\
.5 0 00.475 2.012l.972 1.944a.5.5 0 11-.894.448L7 9.118l-1.053 2.106a.5.5 0 11-.894-.447l.972-1.945A4.5 4.5 0 006.5 6.82v-.243a.3.3 0 00-.20\
5-.285l-2.453-.818a.5.5 0 01-.316-.632z",
      fill: e
    }
  ),
  /* @__PURE__ */ s.createElement("path", { d: "M7 4.5a1 1 0 100-2 1 1 0 000 2z", fill: e }),
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zm0-1A6 6 0 107 1a6 6 0 000 12z",
      fill: e
    }
  )
)), sx = /* @__PURE__ */ s.forwardRef(({ color: e = "currentColor", size: t = 14, ...r }, n) => /* @__PURE__ */ s.createElement(
  "svg",
  {
    width: t,
    height: t,
    viewBox: "0 0 15 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ref: n,
    ...r
  },
  /* @__PURE__ */ s.createElement(
    "path",
    {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M7 14A7 7 0 107 0a7 7 0 000 14zM8 3.5a1 1 0 11-2 0 1 1 0 012 0zM3.526 4.842a.5.5 0 01.632-.316l2.051.684a2.5 2.5 0 001.582 0l2.05-\
.684a.5.5 0 01.317.948l-2.453.818a.3.3 0 00-.205.285v.243a4.5 4.5 0 00.475 2.012l.972 1.944a.5.5 0 11-.894.448L7 9.118l-1.053 2.106a.5.5 0 1\
1-.894-.447l.972-1.945A4.5 4.5 0 006.5 6.82v-.243a.3.3 0 00-.205-.285l-2.453-.818a.5.5 0 01-.316-.632z",
      fill: e
    }
  )
));

// src/components/components/typography/link/link.tsx
var ux = 0, cx = /* @__PURE__ */ a((e) => e.button === ux && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey, "isPlainLeftClick"), px = /* @__PURE__ */ a(
(e, t) => {
  cx(e) && (e.preventDefault(), t(e));
}, "cancelled"), dx = D5.span(
  ({ withArrow: e }) => e ? {
    "> svg:last-of-type": {
      height: "0.7em",
      width: "0.7em",
      marginRight: 0,
      marginLeft: "0.25em",
      bottom: "auto",
      verticalAlign: "inherit"
    }
  } : {},
  ({ containsIcon: e }) => e ? {
    svg: {
      height: "1em",
      width: "1em",
      verticalAlign: "middle",
      position: "relative",
      bottom: 0,
      marginRight: 0
    }
  } : {}
), fx = D5.a(
  ({ theme: e }) => ({
    display: "inline-block",
    transition: "all 150ms ease-out",
    textDecoration: "none",
    color: e.color.secondary,
    "&:hover, &:focus": {
      cursor: "pointer",
      color: Jt(0.07, e.color.secondary),
      "svg path:not([fill])": {
        fill: Jt(0.07, e.color.secondary)
      }
    },
    "&:active": {
      color: Jt(0.1, e.color.secondary),
      "svg path:not([fill])": {
        fill: Jt(0.1, e.color.secondary)
      }
    },
    svg: {
      display: "inline-block",
      height: "1em",
      width: "1em",
      verticalAlign: "text-top",
      position: "relative",
      bottom: "-0.125em",
      marginRight: "0.4em",
      "& path": {
        fill: e.color.secondary
      }
    }
  }),
  ({ theme: e, secondary: t, tertiary: r }) => {
    let n;
    return t && (n = [e.textMutedColor, e.color.dark, e.color.darker]), r && (n = [e.color.dark, e.color.darkest, e.textMutedColor]), n ? {
      color: n[0],
      "svg path:not([fill])": {
        fill: n[0]
      },
      "&:hover": {
        color: n[1],
        "svg path:not([fill])": {
          fill: n[1]
        }
      },
      "&:active": {
        color: n[2],
        "svg path:not([fill])": {
          fill: n[2]
        }
      }
    } : {};
  },
  ({ nochrome: e }) => e ? {
    color: "inherit",
    "&:hover, &:active": {
      color: "inherit",
      textDecoration: "underline"
    }
  } : {},
  ({ theme: e, inverse: t }) => t ? {
    color: e.color.lightest,
    ":not([fill])": {
      fill: e.color.lightest
    },
    "&:hover": {
      color: e.color.lighter,
      "svg path:not([fill])": {
        fill: e.color.lighter
      }
    },
    "&:active": {
      color: e.color.light,
      "svg path:not([fill])": {
        fill: e.color.light
      }
    }
  } : {},
  ({ isButton: e }) => e ? {
    border: 0,
    borderRadius: 0,
    background: "none",
    padding: 0,
    fontSize: "inherit"
  } : {}
), ju = /* @__PURE__ */ a(({
  cancel: e = !0,
  children: t,
  onClick: r = void 0,
  withArrow: n = !1,
  containsIcon: o = !1,
  className: i = void 0,
  style: l = void 0,
  ...u
}) => /* @__PURE__ */ $u.createElement(
  fx,
  {
    ...u,
    onClick: r && e ? (c) => px(c, r) : r,
    className: i
  },
  /* @__PURE__ */ $u.createElement(dx, { withArrow: n, containsIcon: o }, t, n && /* @__PURE__ */ $u.createElement(Ou, null))
), "Link");

// src/components/components/typography/DocumentWrapper.tsx
import { styled as hx } from "@storybook/core/theming";
var mx = hx.div(({ theme: e }) => ({
  fontSize: `${e.typography.size.s2}px`,
  lineHeight: "1.6",
  h1: {
    fontSize: `${e.typography.size.l1}px`,
    fontWeight: e.typography.weight.bold
  },
  h2: {
    fontSize: `${e.typography.size.m2}px`,
    borderBottom: `1px solid ${e.appBorderColor}`
  },
  h3: {
    fontSize: `${e.typography.size.m1}px`
  },
  h4: {
    fontSize: `${e.typography.size.s3}px`
  },
  h5: {
    fontSize: `${e.typography.size.s2}px`
  },
  h6: {
    fontSize: `${e.typography.size.s2}px`,
    color: e.color.dark
  },
  "pre:not(.prismjs)": {
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
    margin: 0
  },
  "pre pre, pre.prismjs": {
    padding: 15,
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "inherit",
    fontSize: "13px",
    lineHeight: "19px"
  },
  "pre pre code, pre.prismjs code": {
    color: "inherit",
    fontSize: "inherit"
  },
  "pre code": {
    margin: 0,
    padding: 0,
    whiteSpace: "pre",
    border: "none",
    background: "transparent"
  },
  "pre code, pre tt": {
    backgroundColor: "transparent",
    border: "none"
  },
  /* GitHub inspired Markdown styles loosely from https://gist.github.com/tuzz/3331384 */
  "body > *:first-of-type": {
    marginTop: "0 !important"
  },
  "body > *:last-child": {
    marginBottom: "0 !important"
  },
  a: {
    color: e.color.secondary,
    textDecoration: "none"
  },
  "a.absent": {
    color: "#cc0000"
  },
  "a.anchor": {
    display: "block",
    paddingLeft: 30,
    marginLeft: -30,
    cursor: "pointer",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0
  },
  "h1, h2, h3, h4, h5, h6": {
    margin: "20px 0 10px",
    padding: 0,
    cursor: "text",
    position: "relative",
    "&:first-of-type": {
      marginTop: 0,
      paddingTop: 0
    },
    "&:hover a.anchor": {
      textDecoration: "none"
    },
    "& tt, & code": {
      fontSize: "inherit"
    }
  },
  "h1:first-of-type + h2": {
    marginTop: 0,
    paddingTop: 0
  },
  "p, blockquote, ul, ol, dl, li, table, pre": {
    margin: "15px 0"
  },
  hr: {
    border: "0 none",
    borderTop: `1px solid ${e.appBorderColor}`,
    height: 4,
    padding: 0
  },
  "body > h1:first-of-type, body > h2:first-of-type, body > h3:first-of-type, body > h4:first-of-type, body > h5:first-of-type, body > h6:fi\
rst-of-type": {
    marginTop: 0,
    paddingTop: 0
  },
  "body > h1:first-of-type + h2": {
    marginTop: 0,
    paddingTop: 0
  },
  "a:first-of-type h1, a:first-of-type h2, a:first-of-type h3, a:first-of-type h4, a:first-of-type h5, a:first-of-type h6": {
    marginTop: 0,
    paddingTop: 0
  },
  "h1 p, h2 p, h3 p, h4 p, h5 p, h6 p": {
    marginTop: 0
  },
  "li p.first": {
    display: "inline-block"
  },
  "ul, ol": {
    paddingLeft: 30,
    "& :first-of-type": {
      marginTop: 0
    },
    "& :last-child": {
      marginBottom: 0
    }
  },
  dl: {
    padding: 0
  },
  "dl dt": {
    fontSize: "14px",
    fontWeight: "bold",
    fontStyle: "italic",
    margin: "0 0 15px",
    padding: "0 15px",
    "&:first-of-type": {
      padding: 0
    },
    "& > :first-of-type": {
      marginTop: 0
    },
    "& > :last-child": {
      marginBottom: 0
    }
  },
  blockquote: {
    borderLeft: `4px solid ${e.color.medium}`,
    padding: "0 15px",
    color: e.color.dark,
    "& > :first-of-type": {
      marginTop: 0
    },
    "& > :last-child": {
      marginBottom: 0
    }
  },
  table: {
    padding: 0,
    borderCollapse: "collapse",
    "& tr": {
      borderTop: `1px solid ${e.appBorderColor}`,
      backgroundColor: "white",
      margin: 0,
      padding: 0,
      "& th": {
        fontWeight: "bold",
        border: `1px solid ${e.appBorderColor}`,
        textAlign: "left",
        margin: 0,
        padding: "6px 13px"
      },
      "& td": {
        border: `1px solid ${e.appBorderColor}`,
        textAlign: "left",
        margin: 0,
        padding: "6px 13px"
      },
      "&:nth-of-type(2n)": {
        backgroundColor: e.color.lighter
      },
      "& th :first-of-type, & td :first-of-type": {
        marginTop: 0
      },
      "& th :last-child, & td :last-child": {
        marginBottom: 0
      }
    }
  },
  img: {
    maxWidth: "100%"
  },
  "span.frame": {
    display: "block",
    overflow: "hidden",
    "& > span": {
      border: `1px solid ${e.color.medium}`,
      display: "block",
      float: "left",
      overflow: "hidden",
      margin: "13px 0 0",
      padding: 7,
      width: "auto"
    },
    "& span img": {
      display: "block",
      float: "left"
    },
    "& span span": {
      clear: "both",
      color: e.color.darkest,
      display: "block",
      padding: "5px 0 0"
    }
  },
  "span.align-center": {
    display: "block",
    overflow: "hidden",
    clear: "both",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px auto 0",
      textAlign: "center"
    },
    "& span img": {
      margin: "0 auto",
      textAlign: "center"
    }
  },
  "span.align-right": {
    display: "block",
    overflow: "hidden",
    clear: "both",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px 0 0",
      textAlign: "right"
    },
    "& span img": {
      margin: 0,
      textAlign: "right"
    }
  },
  "span.float-left": {
    display: "block",
    marginRight: 13,
    overflow: "hidden",
    float: "left",
    "& span": {
      margin: "13px 0 0"
    }
  },
  "span.float-right": {
    display: "block",
    marginLeft: 13,
    overflow: "hidden",
    float: "right",
    "& > span": {
      display: "block",
      overflow: "hidden",
      margin: "13px auto 0",
      textAlign: "right"
    }
  },
  "code, tt": {
    margin: "0 2px",
    padding: "0 5px",
    whiteSpace: "nowrap",
    border: `1px solid ${e.color.mediumlight}`,
    backgroundColor: e.color.lighter,
    borderRadius: 3,
    color: e.base === "dark" ? e.color.darkest : e.color.dark
  }
}));

// src/components/components/syntaxhighlighter/lazy-syntaxhighlighter.tsx
import Bo, { Suspense as Rk, lazy as bg } from "react";
var Yr = [], Io = null, Sk = bg(async () => {
  let { SyntaxHighlighter: e } = await Promise.resolve().then(() => (ga(), gu));
  return Yr.length > 0 && (Yr.forEach((t) => {
    e.registerLanguage(...t);
  }), Yr = []), Io === null && (Io = e), {
    default: /* @__PURE__ */ a((t) => /* @__PURE__ */ Bo.createElement(e, { ...t }), "default")
  };
}), Ak = bg(async () => {
  let [{ SyntaxHighlighter: e }, { formatter: t }] = await Promise.all([
    Promise.resolve().then(() => (ga(), gu)),
    Promise.resolve().then(() => (wg(), vg))
  ]);
  return Yr.length > 0 && (Yr.forEach((r) => {
    e.registerLanguage(...r);
  }), Yr = []), Io === null && (Io = e), {
    default: /* @__PURE__ */ a((r) => /* @__PURE__ */ Bo.createElement(e, { ...r, formatter: t }), "default")
  };
}), yg = /* @__PURE__ */ a((e) => /* @__PURE__ */ Bo.createElement(Rk, { fallback: /* @__PURE__ */ Bo.createElement("div", null) }, e.format !==
!1 ? /* @__PURE__ */ Bo.createElement(Ak, { ...e }) : /* @__PURE__ */ Bo.createElement(Sk, { ...e })), "SyntaxHighlighter");
yg.registerLanguage = (...e) => {
  if (Io !== null) {
    Io.registerLanguage(...e);
    return;
  }
  Yr.push(e);
};

// src/components/index.ts
ga();
su();

// src/components/components/Modal/Modal.tsx
import Oo from "react";

// ../node_modules/@radix-ui/react-dialog/dist/index.mjs
var Il = {};
dn(Il, {
  Close: () => O0,
  Content: () => P0,
  Description: () => z0,
  Dialog: () => x0,
  DialogClose: () => T0,
  DialogContent: () => A0,
  DialogDescription: () => L0,
  DialogOverlay: () => S0,
  DialogPortal: () => R0,
  DialogTitle: () => k0,
  DialogTrigger: () => C0,
  Overlay: () => _0,
  Portal: () => M0,
  Root: () => I0,
  Title: () => H0,
  Trigger: () => IL,
  WarningProvider: () => kL,
  createDialogScope: () => CL
});
Di();
tr();
import * as X from "react";

// ../node_modules/@radix-ui/react-context/dist/index.mjs
import * as ot from "react";
import { jsx as Dg } from "react/jsx-runtime";
function xg(e, t) {
  let r = ot.createContext(t), n = /* @__PURE__ */ a((i) => {
    let { children: l, ...u } = i, c = ot.useMemo(() => u, Object.values(u));
    return /* @__PURE__ */ Dg(r.Provider, { value: c, children: l });
  }, "Provider");
  n.displayName = e + "Provider";
  function o(i) {
    let l = ot.useContext(r);
    if (l) return l;
    if (t !== void 0) return t;
    throw new Error(`\`${i}\` must be used within \`${e}\``);
  }
  return a(o, "useContext2"), [n, o];
}
a(xg, "createContext2");
function Cg(e, t = []) {
  let r = [];
  function n(i, l) {
    let u = ot.createContext(l), c = r.length;
    r = [...r, l];
    let p = /* @__PURE__ */ a((h) => {
      let { scope: f, children: v, ...b } = h, m = f?.[e]?.[c] || u, g = ot.useMemo(() => b, Object.values(b));
      return /* @__PURE__ */ Dg(m.Provider, { value: g, children: v });
    }, "Provider");
    p.displayName = i + "Provider";
    function d(h, f) {
      let v = f?.[e]?.[c] || u, b = ot.useContext(v);
      if (b) return b;
      if (l !== void 0) return l;
      throw new Error(`\`${h}\` must be used within \`${i}\``);
    }
    return a(d, "useContext2"), [p, d];
  }
  a(n, "createContext3");
  let o = /* @__PURE__ */ a(() => {
    let i = r.map((l) => ot.createContext(l));
    return /* @__PURE__ */ a(function(u) {
      let c = u?.[e] || i;
      return ot.useMemo(
        () => ({ [`__scope${e}`]: { ...u, [e]: c } }),
        [u, c]
      );
    }, "useScope");
  }, "createScope");
  return o.scopeName = e, [n, Fk(o, ...t)];
}
a(Cg, "createContextScope");
function Fk(...e) {
  let t = e[0];
  if (e.length === 1) return t;
  let r = /* @__PURE__ */ a(() => {
    let n = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return /* @__PURE__ */ a(function(i) {
      let l = n.reduce((u, { useScope: c, scopeName: p }) => {
        let h = c(i)[`__scope${p}`];
        return { ...u, ...h };
      }, {});
      return ot.useMemo(() => ({ [`__scope${t.scopeName}`]: l }), [l]);
    }, "useComposedScopes");
  }, "createScope");
  return r.scopeName = t.scopeName, r;
}
a(Fk, "composeContextScopes");

// ../node_modules/@radix-ui/react-id/dist/index.mjs
Dn();
import * as Dl from "react";
var kk = Dl.useId || (() => {
}), Lk = 0;
function xl(e) {
  let [t, r] = Dl.useState(kk());
  return et(() => {
    e || r((n) => n ?? String(Lk++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
a(xl, "useId");

// ../node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
En();
import * as cr from "react";
function Eg({
  prop: e,
  defaultProp: t,
  onChange: r = /* @__PURE__ */ a(() => {
  }, "onChange")
}) {
  let [n, o] = Tk({ defaultProp: t, onChange: r }), i = e !== void 0, l = i ? e : n, u = de(r), c = cr.useCallback(
    (p) => {
      if (i) {
        let h = typeof p == "function" ? p(e) : p;
        h !== e && u(h);
      } else
        o(p);
    },
    [i, e, o, u]
  );
  return [l, c];
}
a(Eg, "useControllableState");
function Tk({
  defaultProp: e,
  onChange: t
}) {
  let r = cr.useState(e), [n] = r, o = cr.useRef(n), i = de(t);
  return cr.useEffect(() => {
    o.current !== n && (i(n), o.current = n);
  }, [n, o, i]), r;
}
a(Tk, "useUncontrolledState");

// ../node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
Di();
yn();
tr();
En();
import * as re from "react";

// ../node_modules/@radix-ui/react-use-escape-keydown/dist/index.mjs
En();
import * as Rg from "react";
function Sg(e, t = globalThis?.document) {
  let r = de(e);
  Rg.useEffect(() => {
    let n = /* @__PURE__ */ a((o) => {
      o.key === "Escape" && r(o);
    }, "handleKeyDown");
    return t.addEventListener("keydown", n, { capture: !0 }), () => t.removeEventListener("keydown", n, { capture: !0 });
  }, [r, t]);
}
a(Sg, "useEscapeKeydown");

// ../node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
import { jsx as kg } from "react/jsx-runtime";
var Bk = "DismissableLayer", Qc = "dismissableLayer.update", Ik = "dismissableLayer.pointerDownOutside", Mk = "dismissableLayer.focusOutside",
Ag, Lg = re.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), e0 = re.forwardRef(
  (e, t) => {
    let {
      disableOutsidePointerEvents: r = !1,
      onEscapeKeyDown: n,
      onPointerDownOutside: o,
      onFocusOutside: i,
      onInteractOutside: l,
      onDismiss: u,
      ...c
    } = e, p = re.useContext(Lg), [d, h] = re.useState(null), f = d?.ownerDocument ?? globalThis?.document, [, v] = re.useState({}), b = se(
    t, (R) => h(R)), m = Array.from(p.layers), [g] = [...p.layersWithOutsidePointerEventsDisabled].slice(-1), y = m.indexOf(g), w = d ? m.indexOf(
    d) : -1, D = p.layersWithOutsidePointerEventsDisabled.size > 0, x = w >= y, C = Hk((R) => {
      let F = R.target, S = [...p.branches].some((k) => k.contains(F));
      !x || S || (o?.(R), l?.(R), R.defaultPrevented || u?.());
    }, f), E = zk((R) => {
      let F = R.target;
      [...p.branches].some((k) => k.contains(F)) || (i?.(R), l?.(R), R.defaultPrevented || u?.());
    }, f);
    return Sg((R) => {
      w === p.layers.size - 1 && (n?.(R), !R.defaultPrevented && u && (R.preventDefault(), u()));
    }, f), re.useEffect(() => {
      if (d)
        return r && (p.layersWithOutsidePointerEventsDisabled.size === 0 && (Ag = f.body.style.pointerEvents, f.body.style.pointerEvents = "\
none"), p.layersWithOutsidePointerEventsDisabled.add(d)), p.layers.add(d), Fg(), () => {
          r && p.layersWithOutsidePointerEventsDisabled.size === 1 && (f.body.style.pointerEvents = Ag);
        };
    }, [d, f, r, p]), re.useEffect(() => () => {
      d && (p.layers.delete(d), p.layersWithOutsidePointerEventsDisabled.delete(d), Fg());
    }, [d, p]), re.useEffect(() => {
      let R = /* @__PURE__ */ a(() => v({}), "handleUpdate");
      return document.addEventListener(Qc, R), () => document.removeEventListener(Qc, R);
    }, []), /* @__PURE__ */ kg(
      pe.div,
      {
        ...c,
        ref: b,
        style: {
          pointerEvents: D ? x ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: we(e.onFocusCapture, E.onFocusCapture),
        onBlurCapture: we(e.onBlurCapture, E.onBlurCapture),
        onPointerDownCapture: we(
          e.onPointerDownCapture,
          C.onPointerDownCapture
        )
      }
    );
  }
);
e0.displayName = Bk;
var _k = "DismissableLayerBranch", Pk = re.forwardRef((e, t) => {
  let r = re.useContext(Lg), n = re.useRef(null), o = se(t, n);
  return re.useEffect(() => {
    let i = n.current;
    if (i)
      return r.branches.add(i), () => {
        r.branches.delete(i);
      };
  }, [r.branches]), /* @__PURE__ */ kg(pe.div, { ...e, ref: o });
});
Pk.displayName = _k;
function Hk(e, t = globalThis?.document) {
  let r = de(e), n = re.useRef(!1), o = re.useRef(() => {
  });
  return re.useEffect(() => {
    let i = /* @__PURE__ */ a((u) => {
      if (u.target && !n.current) {
        let p = /* @__PURE__ */ a(function() {
          Tg(
            Ik,
            r,
            d,
            { discrete: !0 }
          );
        }, "handleAndDispatchPointerDownOutsideEvent2");
        var c = p;
        let d = { originalEvent: u };
        u.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = p, t.addEventListener("click", o.current, { once: !0 })) :
        p();
      } else
        t.removeEventListener("click", o.current);
      n.current = !1;
    }, "handlePointerDown"), l = window.setTimeout(() => {
      t.addEventListener("pointerdown", i);
    }, 0);
    return () => {
      window.clearTimeout(l), t.removeEventListener("pointerdown", i), t.removeEventListener("click", o.current);
    };
  }, [t, r]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: /* @__PURE__ */ a(() => n.current = !0, "onPointerDownCapture")
  };
}
a(Hk, "usePointerDownOutside");
function zk(e, t = globalThis?.document) {
  let r = de(e), n = re.useRef(!1);
  return re.useEffect(() => {
    let o = /* @__PURE__ */ a((i) => {
      i.target && !n.current && Tg(Mk, r, { originalEvent: i }, {
        discrete: !1
      });
    }, "handleFocus");
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, r]), {
    onFocusCapture: /* @__PURE__ */ a(() => n.current = !0, "onFocusCapture"),
    onBlurCapture: /* @__PURE__ */ a(() => n.current = !1, "onBlurCapture")
  };
}
a(zk, "useFocusOutside");
function Fg() {
  let e = new CustomEvent(Qc);
  document.dispatchEvent(e);
}
a(Fg, "dispatchUpdate");
function Tg(e, t, r, { discrete: n }) {
  let o = r.originalEvent.target, i = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: r });
  t && o.addEventListener(e, t, { once: !0 }), n ? Ih(o, i) : o.dispatchEvent(i);
}
a(Tg, "handleAndDispatchCustomEvent");

// ../node_modules/@radix-ui/react-focus-scope/dist/index.mjs
tr();
yn();
En();
import * as at from "react";
import { jsx as Ok } from "react/jsx-runtime";
var t0 = "focusScope.autoFocusOnMount", r0 = "focusScope.autoFocusOnUnmount", Bg = { bubbles: !1, cancelable: !0 }, Nk = "FocusScope", n0 = at.forwardRef(
(e, t) => {
  let {
    loop: r = !1,
    trapped: n = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: i,
    ...l
  } = e, [u, c] = at.useState(null), p = de(o), d = de(i), h = at.useRef(null), f = se(t, (m) => c(m)), v = at.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  at.useEffect(() => {
    if (n) {
      let w = /* @__PURE__ */ a(function(E) {
        if (v.paused || !u) return;
        let R = E.target;
        u.contains(R) ? h.current = R : pr(h.current, { select: !0 });
      }, "handleFocusIn2"), D = /* @__PURE__ */ a(function(E) {
        if (v.paused || !u) return;
        let R = E.relatedTarget;
        R !== null && (u.contains(R) || pr(h.current, { select: !0 }));
      }, "handleFocusOut2"), x = /* @__PURE__ */ a(function(E) {
        if (document.activeElement === document.body)
          for (let F of E)
            F.removedNodes.length > 0 && pr(u);
      }, "handleMutations2");
      var m = w, g = D, y = x;
      document.addEventListener("focusin", w), document.addEventListener("focusout", D);
      let C = new MutationObserver(x);
      return u && C.observe(u, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", w), document.removeEventListener("focusout", D), C.disconnect();
      };
    }
  }, [n, u, v.paused]), at.useEffect(() => {
    if (u) {
      Mg.add(v);
      let m = document.activeElement;
      if (!u.contains(m)) {
        let y = new CustomEvent(t0, Bg);
        u.addEventListener(t0, p), u.dispatchEvent(y), y.defaultPrevented || ($k(Uk(Pg(u)), { select: !0 }), document.activeElement === m &&
        pr(u));
      }
      return () => {
        u.removeEventListener(t0, p), setTimeout(() => {
          let y = new CustomEvent(r0, Bg);
          u.addEventListener(r0, d), u.dispatchEvent(y), y.defaultPrevented || pr(m ?? document.body, { select: !0 }), u.removeEventListener(
          r0, d), Mg.remove(v);
        }, 0);
      };
    }
  }, [u, p, d, v]);
  let b = at.useCallback(
    (m) => {
      if (!r && !n || v.paused) return;
      let g = m.key === "Tab" && !m.altKey && !m.ctrlKey && !m.metaKey, y = document.activeElement;
      if (g && y) {
        let w = m.currentTarget, [D, x] = jk(w);
        D && x ? !m.shiftKey && y === x ? (m.preventDefault(), r && pr(D, { select: !0 })) : m.shiftKey && y === D && (m.preventDefault(), r &&
        pr(x, { select: !0 })) : y === w && m.preventDefault();
      }
    },
    [r, n, v.paused]
  );
  return /* @__PURE__ */ Ok(pe.div, { tabIndex: -1, ...l, ref: f, onKeyDown: b });
});
n0.displayName = Nk;
function $k(e, { select: t = !1 } = {}) {
  let r = document.activeElement;
  for (let n of e)
    if (pr(n, { select: t }), document.activeElement !== r) return;
}
a($k, "focusFirst");
function jk(e) {
  let t = Pg(e), r = Ig(t, e), n = Ig(t.reverse(), e);
  return [r, n];
}
a(jk, "getTabbableEdges");
function Pg(e) {
  let t = [], r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: /* @__PURE__ */ a((n) => {
      let o = n.tagName === "INPUT" && n.type === "hidden";
      return n.disabled || n.hidden || o ? NodeFilter.FILTER_SKIP : n.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }, "acceptNode")
  });
  for (; r.nextNode(); ) t.push(r.currentNode);
  return t;
}
a(Pg, "getTabbableCandidates");
function Ig(e, t) {
  for (let r of e)
    if (!Vk(r, { upTo: t })) return r;
}
a(Ig, "findVisible");
function Vk(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
a(Vk, "isHidden");
function Wk(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
a(Wk, "isSelectableInput");
function pr(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    let r = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== r && Wk(e) && t && e.select();
  }
}
a(pr, "focus");
var Mg = qk();
function qk() {
  let e = [];
  return {
    add(t) {
      let r = e[0];
      t !== r && r?.pause(), e = _g(e, t), e.unshift(t);
    },
    remove(t) {
      e = _g(e, t), e[0]?.resume();
    }
  };
}
a(qk, "createFocusScopesStack");
function _g(e, t) {
  let r = [...e], n = r.indexOf(t);
  return n !== -1 && r.splice(n, 1), r;
}
a(_g, "arrayRemove");
function Uk(e) {
  return e.filter((t) => t.tagName !== "A");
}
a(Uk, "removeLinks");

// ../node_modules/@radix-ui/react-portal/dist/index.mjs
yn();
Dn();
import * as Cl from "react";
import Gk from "react-dom";
import { jsx as Yk } from "react/jsx-runtime";
var Xk = "Portal", o0 = Cl.forwardRef((e, t) => {
  let { container: r, ...n } = e, [o, i] = Cl.useState(!1);
  et(() => i(!0), []);
  let l = r || o && globalThis?.document?.body;
  return l ? Gk.createPortal(/* @__PURE__ */ Yk(pe.div, { ...n, ref: t }), l) : null;
});
o0.displayName = Xk;

// ../node_modules/@radix-ui/react-presence/dist/index.mjs
tr();
Dn();
import * as We from "react";
import * as Hg from "react";
function Kk(e, t) {
  return Hg.useReducer((r, n) => t[r][n] ?? r, e);
}
a(Kk, "useStateMachine");
var za = /* @__PURE__ */ a((e) => {
  let { present: t, children: r } = e, n = Zk(t), o = typeof r == "function" ? r({ present: n.isPresent }) : We.Children.only(r), i = se(n.ref,
  Jk(o));
  return typeof r == "function" || n.isPresent ? We.cloneElement(o, { ref: i }) : null;
}, "Presence");
za.displayName = "Presence";
function Zk(e) {
  let [t, r] = We.useState(), n = We.useRef({}), o = We.useRef(e), i = We.useRef("none"), l = e ? "mounted" : "unmounted", [u, c] = Kk(l, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return We.useEffect(() => {
    let p = El(n.current);
    i.current = u === "mounted" ? p : "none";
  }, [u]), et(() => {
    let p = n.current, d = o.current;
    if (d !== e) {
      let f = i.current, v = El(p);
      e ? c("MOUNT") : v === "none" || p?.display === "none" ? c("UNMOUNT") : c(d && f !== v ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, c]), et(() => {
    if (t) {
      let p, d = t.ownerDocument.defaultView ?? window, h = /* @__PURE__ */ a((v) => {
        let m = El(n.current).includes(v.animationName);
        if (v.target === t && m && (c("ANIMATION_END"), !o.current)) {
          let g = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", p = d.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = g);
          });
        }
      }, "handleAnimationEnd"), f = /* @__PURE__ */ a((v) => {
        v.target === t && (i.current = El(n.current));
      }, "handleAnimationStart");
      return t.addEventListener("animationstart", f), t.addEventListener("animationcancel", h), t.addEventListener("animationend", h), () => {
        d.clearTimeout(p), t.removeEventListener("animationstart", f), t.removeEventListener("animationcancel", h), t.removeEventListener("a\
nimationend", h);
      };
    } else
      c("ANIMATION_END");
  }, [t, c]), {
    isPresent: ["mounted", "unmountSuspended"].includes(u),
    ref: We.useCallback((p) => {
      p && (n.current = getComputedStyle(p)), r(p);
    }, [])
  };
}
a(Zk, "usePresence");
function El(e) {
  return e?.animationName || "none";
}
a(El, "getAnimationName");
function Jk(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning;
  return r ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, r = t && "isReactWarning" in t && t.isReactWarning, r ? e.props.ref :
  e.props.ref || e.ref);
}
a(Jk, "getElementRef");

// ../node_modules/@radix-ui/react-dialog/dist/index.mjs
yn();

// ../node_modules/@radix-ui/react-focus-guards/dist/index.mjs
import * as Og from "react";
var a0 = 0;
function Ng() {
  Og.useEffect(() => {
    let e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? zg()), document.body.insertAdjacentElement("beforeend", e[1] ?? zg()), a0++,
    () => {
      a0 === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), a0--;
    };
  }, []);
}
a(Ng, "useFocusGuards");
function zg() {
  let e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "\
fixed", e.style.pointerEvents = "none", e;
}
a(zg, "createFocusGuard");

// ../node_modules/tslib/tslib.es6.mjs
var qe = /* @__PURE__ */ a(function() {
  return qe = Object.assign || /* @__PURE__ */ a(function(t) {
    for (var r, n = 1, o = arguments.length; n < o; n++) {
      r = arguments[n];
      for (var i in r) Object.prototype.hasOwnProperty.call(r, i) && (t[i] = r[i]);
    }
    return t;
  }, "__assign"), qe.apply(this, arguments);
}, "__assign");
function Rl(e, t) {
  var r = {};
  for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, n = Object.getOwnPropertySymbols(e); o < n.length; o++)
      t.indexOf(n[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, n[o]) && (r[n[o]] = e[n[o]]);
  return r;
}
a(Rl, "__rest");
function $g(e, t, r) {
  if (r || arguments.length === 2) for (var n = 0, o = t.length, i; n < o; n++)
    (i || !(n in t)) && (i || (i = Array.prototype.slice.call(t, 0, n)), i[n] = t[n]);
  return e.concat(i || Array.prototype.slice.call(t));
}
a($g, "__spreadArray");

// ../node_modules/react-remove-scroll/dist/es2015/Combination.js
import * as kl from "react";

// ../node_modules/react-remove-scroll/dist/es2015/UI.js
import * as Le from "react";

// ../node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var Xr = "right-scroll-bar-position", Kr = "width-before-scroll-bar", i0 = "with-scroll-bars-hidden", l0 = "--removed-body-scroll-bar-size";

// ../node_modules/use-callback-ref/dist/es2015/assignRef.js
function Sl(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
a(Sl, "assignRef");

// ../node_modules/use-callback-ref/dist/es2015/useRef.js
import { useState as Qk } from "react";
function jg(e, t) {
  var r = Qk(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return r.value;
        },
        set current(n) {
          var o = r.value;
          o !== n && (r.value = n, r.callback(n, o));
        }
      }
    };
  })[0];
  return r.callback = t, r.facade;
}
a(jg, "useCallbackRef");

// ../node_modules/use-callback-ref/dist/es2015/useMergeRef.js
import * as Wg from "react";
var Vg = /* @__PURE__ */ new WeakMap();
function s0(e, t) {
  var r = jg(t || null, function(n) {
    return e.forEach(function(o) {
      return Sl(o, n);
    });
  });
  return Wg.useLayoutEffect(function() {
    var n = Vg.get(r);
    if (n) {
      var o = new Set(n), i = new Set(e), l = r.current;
      o.forEach(function(u) {
        i.has(u) || Sl(u, null);
      }), i.forEach(function(u) {
        o.has(u) || Sl(u, l);
      });
    }
    Vg.set(r, e);
  }, [e]), r;
}
a(s0, "useMergeRefs");

// ../node_modules/use-sidecar/dist/es2015/medium.js
function eL(e) {
  return e;
}
a(eL, "ItoI");
function tL(e, t) {
  t === void 0 && (t = eL);
  var r = [], n = !1, o = {
    read: /* @__PURE__ */ a(function() {
      if (n)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return r.length ? r[r.length - 1] : e;
    }, "read"),
    useMedium: /* @__PURE__ */ a(function(i) {
      var l = t(i, n);
      return r.push(l), function() {
        r = r.filter(function(u) {
          return u !== l;
        });
      };
    }, "useMedium"),
    assignSyncMedium: /* @__PURE__ */ a(function(i) {
      for (n = !0; r.length; ) {
        var l = r;
        r = [], l.forEach(i);
      }
      r = {
        push: /* @__PURE__ */ a(function(u) {
          return i(u);
        }, "push"),
        filter: /* @__PURE__ */ a(function() {
          return r;
        }, "filter")
      };
    }, "assignSyncMedium"),
    assignMedium: /* @__PURE__ */ a(function(i) {
      n = !0;
      var l = [];
      if (r.length) {
        var u = r;
        r = [], u.forEach(i), l = r;
      }
      var c = /* @__PURE__ */ a(function() {
        var d = l;
        l = [], d.forEach(i);
      }, "executeQueue"), p = /* @__PURE__ */ a(function() {
        return Promise.resolve().then(c);
      }, "cycle");
      p(), r = {
        push: /* @__PURE__ */ a(function(d) {
          l.push(d), p();
        }, "push"),
        filter: /* @__PURE__ */ a(function(d) {
          return l = l.filter(d), r;
        }, "filter")
      };
    }, "assignMedium")
  };
  return o;
}
a(tL, "innerCreateMedium");
function u0(e) {
  e === void 0 && (e = {});
  var t = tL(null);
  return t.options = qe({ async: !0, ssr: !1 }, e), t;
}
a(u0, "createSidecarMedium");

// ../node_modules/use-sidecar/dist/es2015/exports.js
import * as qg from "react";
var Ug = /* @__PURE__ */ a(function(e) {
  var t = e.sideCar, r = Rl(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var n = t.read();
  if (!n)
    throw new Error("Sidecar medium not found");
  return qg.createElement(n, qe({}, r));
}, "SideCar");
Ug.isSideCarExport = !0;
function c0(e, t) {
  return e.useMedium(t), Ug;
}
a(c0, "exportSidecar");

// ../node_modules/react-remove-scroll/dist/es2015/medium.js
var Al = u0();

// ../node_modules/react-remove-scroll/dist/es2015/UI.js
var p0 = /* @__PURE__ */ a(function() {
}, "nothing"), Oa = Le.forwardRef(function(e, t) {
  var r = Le.useRef(null), n = Le.useState({
    onScrollCapture: p0,
    onWheelCapture: p0,
    onTouchMoveCapture: p0
  }), o = n[0], i = n[1], l = e.forwardProps, u = e.children, c = e.className, p = e.removeScrollBar, d = e.enabled, h = e.shards, f = e.sideCar,
  v = e.noIsolation, b = e.inert, m = e.allowPinchZoom, g = e.as, y = g === void 0 ? "div" : g, w = e.gapMode, D = Rl(e, ["forwardProps", "c\
hildren", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), x = f,
  C = s0([r, t]), E = qe(qe({}, D), o);
  return Le.createElement(
    Le.Fragment,
    null,
    d && Le.createElement(x, { sideCar: Al, removeScrollBar: p, shards: h, noIsolation: v, inert: b, setCallbacks: i, allowPinchZoom: !!m, lockRef: r,
    gapMode: w }),
    l ? Le.cloneElement(Le.Children.only(u), qe(qe({}, E), { ref: C })) : Le.createElement(y, qe({}, E, { className: c, ref: C }), u)
  );
});
Oa.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Oa.classNames = {
  fullWidth: Kr,
  zeroRight: Xr
};

// ../node_modules/react-remove-scroll/dist/es2015/SideEffect.js
import * as J from "react";

// ../node_modules/react-remove-scroll-bar/dist/es2015/component.js
import * as _o from "react";

// ../node_modules/react-style-singleton/dist/es2015/hook.js
import * as Xg from "react";

// ../node_modules/get-nonce/dist/es2015/index.js
var Gg;
var Yg = /* @__PURE__ */ a(function() {
  if (Gg)
    return Gg;
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
}, "getNonce");

// ../node_modules/react-style-singleton/dist/es2015/singleton.js
function rL() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = Yg();
  return t && e.setAttribute("nonce", t), e;
}
a(rL, "makeStyleTag");
function nL(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
a(nL, "injectStyles");
function oL(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
a(oL, "insertStyleTag");
var d0 = /* @__PURE__ */ a(function() {
  var e = 0, t = null;
  return {
    add: /* @__PURE__ */ a(function(r) {
      e == 0 && (t = rL()) && (nL(t, r), oL(t)), e++;
    }, "add"),
    remove: /* @__PURE__ */ a(function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }, "remove")
  };
}, "stylesheetSingleton");

// ../node_modules/react-style-singleton/dist/es2015/hook.js
var f0 = /* @__PURE__ */ a(function() {
  var e = d0();
  return function(t, r) {
    Xg.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && r]);
  };
}, "styleHookSingleton");

// ../node_modules/react-style-singleton/dist/es2015/component.js
var Na = /* @__PURE__ */ a(function() {
  var e = f0(), t = /* @__PURE__ */ a(function(r) {
    var n = r.styles, o = r.dynamic;
    return e(n, o), null;
  }, "Sheet");
  return t;
}, "styleSingleton");

// ../node_modules/react-remove-scroll-bar/dist/es2015/utils.js
var aL = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, h0 = /* @__PURE__ */ a(function(e) {
  return parseInt(e || "", 10) || 0;
}, "parse"), iL = /* @__PURE__ */ a(function(e) {
  var t = window.getComputedStyle(document.body), r = t[e === "padding" ? "paddingLeft" : "marginLeft"], n = t[e === "padding" ? "paddingTop" :
  "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [h0(r), h0(n), h0(o)];
}, "getOffset"), m0 = /* @__PURE__ */ a(function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return aL;
  var t = iL(e), r = document.documentElement.clientWidth, n = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, n - r + t[2] - t[0])
  };
}, "getGapWidth");

// ../node_modules/react-remove-scroll-bar/dist/es2015/component.js
var lL = Na(), Mo = "data-scroll-locked", sL = /* @__PURE__ */ a(function(e, t, r, n) {
  var o = e.left, i = e.top, l = e.right, u = e.gap;
  return r === void 0 && (r = "margin"), `
  .`.concat(i0, ` {
   overflow: hidden `).concat(n, `;
   padding-right: `).concat(u, "px ").concat(n, `;
  }
  body[`).concat(Mo, `] {
    overflow: hidden `).concat(n, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(n, ";"),
    r === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(i, `px;
    padding-right: `).concat(l, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(u, "px ").concat(n, `;
    `),
    r === "padding" && "padding-right: ".concat(u, "px ").concat(n, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Xr, ` {
    right: `).concat(u, "px ").concat(n, `;
  }
  
  .`).concat(Kr, ` {
    margin-right: `).concat(u, "px ").concat(n, `;
  }
  
  .`).concat(Xr, " .").concat(Xr, ` {
    right: 0 `).concat(n, `;
  }
  
  .`).concat(Kr, " .").concat(Kr, ` {
    margin-right: 0 `).concat(n, `;
  }
  
  body[`).concat(Mo, `] {
    `).concat(l0, ": ").concat(u, `px;
  }
`);
}, "getStyles"), Kg = /* @__PURE__ */ a(function() {
  var e = parseInt(document.body.getAttribute(Mo) || "0", 10);
  return isFinite(e) ? e : 0;
}, "getCurrentUseCounter"), uL = /* @__PURE__ */ a(function() {
  _o.useEffect(function() {
    return document.body.setAttribute(Mo, (Kg() + 1).toString()), function() {
      var e = Kg() - 1;
      e <= 0 ? document.body.removeAttribute(Mo) : document.body.setAttribute(Mo, e.toString());
    };
  }, []);
}, "useLockAttribute"), g0 = /* @__PURE__ */ a(function(e) {
  var t = e.noRelative, r = e.noImportant, n = e.gapMode, o = n === void 0 ? "margin" : n;
  uL();
  var i = _o.useMemo(function() {
    return m0(o);
  }, [o]);
  return _o.createElement(lL, { styles: sL(i, !t, o, r ? "" : "!important") });
}, "RemoveScrollBar");

// ../node_modules/react-remove-scroll/dist/es2015/aggresiveCapture.js
var v0 = !1;
if (typeof window < "u")
  try {
    $a = Object.defineProperty({}, "passive", {
      get: /* @__PURE__ */ a(function() {
        return v0 = !0, !0;
      }, "get")
    }), window.addEventListener("test", $a, $a), window.removeEventListener("test", $a, $a);
  } catch {
    v0 = !1;
  }
var $a, Zr = v0 ? { passive: !1 } : !1;

// ../node_modules/react-remove-scroll/dist/es2015/handleScroll.js
var cL = /* @__PURE__ */ a(function(e) {
  return e.tagName === "TEXTAREA";
}, "alwaysContainsScroll"), Zg = /* @__PURE__ */ a(function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var r = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    r[t] !== "hidden" && // contains scroll inside self
    !(r.overflowY === r.overflowX && !cL(e) && r[t] === "visible")
  );
}, "elementCanBeScrolled"), pL = /* @__PURE__ */ a(function(e) {
  return Zg(e, "overflowY");
}, "elementCouldBeVScrolled"), dL = /* @__PURE__ */ a(function(e) {
  return Zg(e, "overflowX");
}, "elementCouldBeHScrolled"), w0 = /* @__PURE__ */ a(function(e, t) {
  var r = t.ownerDocument, n = t;
  do {
    typeof ShadowRoot < "u" && n instanceof ShadowRoot && (n = n.host);
    var o = Jg(e, n);
    if (o) {
      var i = Qg(e, n), l = i[1], u = i[2];
      if (l > u)
        return !0;
    }
    n = n.parentNode;
  } while (n && n !== r.body);
  return !1;
}, "locationCouldBeScrolled"), fL = /* @__PURE__ */ a(function(e) {
  var t = e.scrollTop, r = e.scrollHeight, n = e.clientHeight;
  return [
    t,
    r,
    n
  ];
}, "getVScrollVariables"), hL = /* @__PURE__ */ a(function(e) {
  var t = e.scrollLeft, r = e.scrollWidth, n = e.clientWidth;
  return [
    t,
    r,
    n
  ];
}, "getHScrollVariables"), Jg = /* @__PURE__ */ a(function(e, t) {
  return e === "v" ? pL(t) : dL(t);
}, "elementCouldBeScrolled"), Qg = /* @__PURE__ */ a(function(e, t) {
  return e === "v" ? fL(t) : hL(t);
}, "getScrollVariables"), mL = /* @__PURE__ */ a(function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, "getDirectionFactor"), ev = /* @__PURE__ */ a(function(e, t, r, n, o) {
  var i = mL(e, window.getComputedStyle(t).direction), l = i * n, u = r.target, c = t.contains(u), p = !1, d = l > 0, h = 0, f = 0;
  do {
    var v = Qg(e, u), b = v[0], m = v[1], g = v[2], y = m - g - i * b;
    (b || y) && Jg(e, u) && (h += y, f += b), u instanceof ShadowRoot ? u = u.host : u = u.parentNode;
  } while (
    // portaled content
    !c && u !== document.body || // self content
    c && (t.contains(u) || t === u)
  );
  return (d && (o && Math.abs(h) < 1 || !o && l > h) || !d && (o && Math.abs(f) < 1 || !o && -l > f)) && (p = !0), p;
}, "handleScroll");

// ../node_modules/react-remove-scroll/dist/es2015/SideEffect.js
var Fl = /* @__PURE__ */ a(function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, "getTouchXY"), tv = /* @__PURE__ */ a(function(e) {
  return [e.deltaX, e.deltaY];
}, "getDeltaXY"), rv = /* @__PURE__ */ a(function(e) {
  return e && "current" in e ? e.current : e;
}, "extractRef"), gL = /* @__PURE__ */ a(function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, "deltaCompare"), vL = /* @__PURE__ */ a(function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, "generateStyle"), wL = 0, Po = [];
function nv(e) {
  var t = J.useRef([]), r = J.useRef([0, 0]), n = J.useRef(), o = J.useState(wL++)[0], i = J.useState(Na)[0], l = J.useRef(e);
  J.useEffect(function() {
    l.current = e;
  }, [e]), J.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var m = $g([e.lockRef.current], (e.shards || []).map(rv), !0).filter(Boolean);
      return m.forEach(function(g) {
        return g.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), m.forEach(function(g) {
          return g.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var u = J.useCallback(function(m, g) {
    if ("touches" in m && m.touches.length === 2 || m.type === "wheel" && m.ctrlKey)
      return !l.current.allowPinchZoom;
    var y = Fl(m), w = r.current, D = "deltaX" in m ? m.deltaX : w[0] - y[0], x = "deltaY" in m ? m.deltaY : w[1] - y[1], C, E = m.target, R = Math.
    abs(D) > Math.abs(x) ? "h" : "v";
    if ("touches" in m && R === "h" && E.type === "range")
      return !1;
    var F = w0(R, E);
    if (!F)
      return !0;
    if (F ? C = R : (C = R === "v" ? "h" : "v", F = w0(R, E)), !F)
      return !1;
    if (!n.current && "changedTouches" in m && (D || x) && (n.current = C), !C)
      return !0;
    var S = n.current || C;
    return ev(S, g, m, S === "h" ? D : x, !0);
  }, []), c = J.useCallback(function(m) {
    var g = m;
    if (!(!Po.length || Po[Po.length - 1] !== i)) {
      var y = "deltaY" in g ? tv(g) : Fl(g), w = t.current.filter(function(C) {
        return C.name === g.type && (C.target === g.target || g.target === C.shadowParent) && gL(C.delta, y);
      })[0];
      if (w && w.should) {
        g.cancelable && g.preventDefault();
        return;
      }
      if (!w) {
        var D = (l.current.shards || []).map(rv).filter(Boolean).filter(function(C) {
          return C.contains(g.target);
        }), x = D.length > 0 ? u(g, D[0]) : !l.current.noIsolation;
        x && g.cancelable && g.preventDefault();
      }
    }
  }, []), p = J.useCallback(function(m, g, y, w) {
    var D = { name: m, delta: g, target: y, should: w, shadowParent: bL(y) };
    t.current.push(D), setTimeout(function() {
      t.current = t.current.filter(function(x) {
        return x !== D;
      });
    }, 1);
  }, []), d = J.useCallback(function(m) {
    r.current = Fl(m), n.current = void 0;
  }, []), h = J.useCallback(function(m) {
    p(m.type, tv(m), m.target, u(m, e.lockRef.current));
  }, []), f = J.useCallback(function(m) {
    p(m.type, Fl(m), m.target, u(m, e.lockRef.current));
  }, []);
  J.useEffect(function() {
    return Po.push(i), e.setCallbacks({
      onScrollCapture: h,
      onWheelCapture: h,
      onTouchMoveCapture: f
    }), document.addEventListener("wheel", c, Zr), document.addEventListener("touchmove", c, Zr), document.addEventListener("touchstart", d,
    Zr), function() {
      Po = Po.filter(function(m) {
        return m !== i;
      }), document.removeEventListener("wheel", c, Zr), document.removeEventListener("touchmove", c, Zr), document.removeEventListener("touc\
hstart", d, Zr);
    };
  }, []);
  var v = e.removeScrollBar, b = e.inert;
  return J.createElement(
    J.Fragment,
    null,
    b ? J.createElement(i, { styles: vL(o) }) : null,
    v ? J.createElement(g0, { gapMode: e.gapMode }) : null
  );
}
a(nv, "RemoveScrollSideCar");
function bL(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
a(bL, "getOutermostShadowParent");

// ../node_modules/react-remove-scroll/dist/es2015/sidecar.js
var ov = c0(Al, nv);

// ../node_modules/react-remove-scroll/dist/es2015/Combination.js
var av = kl.forwardRef(function(e, t) {
  return kl.createElement(Oa, qe({}, e, { ref: t, sideCar: ov }));
});
av.classNames = Oa.classNames;
var b0 = av;

// ../node_modules/aria-hidden/dist/es2015/index.js
var yL = /* @__PURE__ */ a(function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, "getDefaultParent"), Ho = /* @__PURE__ */ new WeakMap(), Ll = /* @__PURE__ */ new WeakMap(), Tl = {}, y0 = 0, iv = /* @__PURE__ */ a(function(e) {
  return e && (e.host || iv(e.parentNode));
}, "unwrapHost"), DL = /* @__PURE__ */ a(function(e, t) {
  return t.map(function(r) {
    if (e.contains(r))
      return r;
    var n = iv(r);
    return n && e.contains(n) ? n : (console.error("aria-hidden", r, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(r) {
    return !!r;
  });
}, "correctTargets"), xL = /* @__PURE__ */ a(function(e, t, r, n) {
  var o = DL(t, Array.isArray(e) ? e : [e]);
  Tl[r] || (Tl[r] = /* @__PURE__ */ new WeakMap());
  var i = Tl[r], l = [], u = /* @__PURE__ */ new Set(), c = new Set(o), p = /* @__PURE__ */ a(function(h) {
    !h || u.has(h) || (u.add(h), p(h.parentNode));
  }, "keep");
  o.forEach(p);
  var d = /* @__PURE__ */ a(function(h) {
    !h || c.has(h) || Array.prototype.forEach.call(h.children, function(f) {
      if (u.has(f))
        d(f);
      else {
        var v = f.getAttribute(n), b = v !== null && v !== "false", m = (Ho.get(f) || 0) + 1, g = (i.get(f) || 0) + 1;
        Ho.set(f, m), i.set(f, g), l.push(f), m === 1 && b && Ll.set(f, !0), g === 1 && f.setAttribute(r, "true"), b || f.setAttribute(n, "t\
rue");
      }
    });
  }, "deep");
  return d(t), u.clear(), y0++, function() {
    l.forEach(function(h) {
      var f = Ho.get(h) - 1, v = i.get(h) - 1;
      Ho.set(h, f), i.set(h, v), f || (Ll.has(h) || h.removeAttribute(n), Ll.delete(h)), v || h.removeAttribute(r);
    }), y0--, y0 || (Ho = /* @__PURE__ */ new WeakMap(), Ho = /* @__PURE__ */ new WeakMap(), Ll = /* @__PURE__ */ new WeakMap(), Tl = {});
  };
}, "applyAttributeToOthers"), lv = /* @__PURE__ */ a(function(e, t, r) {
  r === void 0 && (r = "data-aria-hidden");
  var n = Array.from(Array.isArray(e) ? e : [e]), o = t || yL(e);
  return o ? (n.push.apply(n, Array.from(o.querySelectorAll("[aria-live]"))), xL(n, o, r, "aria-hidden")) : function() {
    return null;
  };
}, "hideOthers");

// ../node_modules/@radix-ui/react-dialog/dist/index.mjs
wi();
import { Fragment as sv, jsx as ae, jsxs as uv } from "react/jsx-runtime";
var D0 = "Dialog", [cv, CL] = Cg(D0), [EL, ht] = cv(D0), x0 = /* @__PURE__ */ a((e) => {
  let {
    __scopeDialog: t,
    children: r,
    open: n,
    defaultOpen: o,
    onOpenChange: i,
    modal: l = !0
  } = e, u = X.useRef(null), c = X.useRef(null), [p = !1, d] = Eg({
    prop: n,
    defaultProp: o,
    onChange: i
  });
  return /* @__PURE__ */ ae(
    EL,
    {
      scope: t,
      triggerRef: u,
      contentRef: c,
      contentId: xl(),
      titleId: xl(),
      descriptionId: xl(),
      open: p,
      onOpenChange: d,
      onOpenToggle: X.useCallback(() => d((h) => !h), [d]),
      modal: l,
      children: r
    }
  );
}, "Dialog");
x0.displayName = D0;
var pv = "DialogTrigger", C0 = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, ...n } = e, o = ht(pv, r), i = se(t, o.triggerRef);
    return /* @__PURE__ */ ae(
      pe.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": B0(o.open),
        ...n,
        ref: i,
        onClick: we(e.onClick, o.onOpenToggle)
      }
    );
  }
);
C0.displayName = pv;
var E0 = "DialogPortal", [RL, dv] = cv(E0, {
  forceMount: void 0
}), R0 = /* @__PURE__ */ a((e) => {
  let { __scopeDialog: t, forceMount: r, children: n, container: o } = e, i = ht(E0, t);
  return /* @__PURE__ */ ae(RL, { scope: t, forceMount: r, children: X.Children.map(n, (l) => /* @__PURE__ */ ae(za, { present: r || i.open,
  children: /* @__PURE__ */ ae(o0, { asChild: !0, container: o, children: l }) })) });
}, "DialogPortal");
R0.displayName = E0;
var Bl = "DialogOverlay", S0 = X.forwardRef(
  (e, t) => {
    let r = dv(Bl, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, i = ht(Bl, e.__scopeDialog);
    return i.modal ? /* @__PURE__ */ ae(za, { present: n || i.open, children: /* @__PURE__ */ ae(SL, { ...o, ref: t }) }) : null;
  }
);
S0.displayName = Bl;
var SL = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, ...n } = e, o = ht(Bl, r);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ ae(b0, { as: Fr, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ ae(
        pe.div,
        {
          "data-state": B0(o.open),
          ...n,
          ref: t,
          style: { pointerEvents: "auto", ...n.style }
        }
      ) })
    );
  }
), Jr = "DialogContent", A0 = X.forwardRef(
  (e, t) => {
    let r = dv(Jr, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, i = ht(Jr, e.__scopeDialog);
    return /* @__PURE__ */ ae(za, { present: n || i.open, children: i.modal ? /* @__PURE__ */ ae(AL, { ...o, ref: t }) : /* @__PURE__ */ ae(
    FL, { ...o, ref: t }) });
  }
);
A0.displayName = Jr;
var AL = X.forwardRef(
  (e, t) => {
    let r = ht(Jr, e.__scopeDialog), n = X.useRef(null), o = se(t, r.contentRef, n);
    return X.useEffect(() => {
      let i = n.current;
      if (i) return lv(i);
    }, []), /* @__PURE__ */ ae(
      fv,
      {
        ...e,
        ref: o,
        trapFocus: r.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: we(e.onCloseAutoFocus, (i) => {
          i.preventDefault(), r.triggerRef.current?.focus();
        }),
        onPointerDownOutside: we(e.onPointerDownOutside, (i) => {
          let l = i.detail.originalEvent, u = l.button === 0 && l.ctrlKey === !0;
          (l.button === 2 || u) && i.preventDefault();
        }),
        onFocusOutside: we(
          e.onFocusOutside,
          (i) => i.preventDefault()
        )
      }
    );
  }
), FL = X.forwardRef(
  (e, t) => {
    let r = ht(Jr, e.__scopeDialog), n = X.useRef(!1), o = X.useRef(!1);
    return /* @__PURE__ */ ae(
      fv,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: /* @__PURE__ */ a((i) => {
          e.onCloseAutoFocus?.(i), i.defaultPrevented || (n.current || r.triggerRef.current?.focus(), i.preventDefault()), n.current = !1, o.
          current = !1;
        }, "onCloseAutoFocus"),
        onInteractOutside: /* @__PURE__ */ a((i) => {
          e.onInteractOutside?.(i), i.defaultPrevented || (n.current = !0, i.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          let l = i.target;
          r.triggerRef.current?.contains(l) && i.preventDefault(), i.detail.originalEvent.type === "focusin" && o.current && i.preventDefault();
        }, "onInteractOutside")
      }
    );
  }
), fv = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, trapFocus: n, onOpenAutoFocus: o, onCloseAutoFocus: i, ...l } = e, u = ht(Jr, r), c = X.useRef(null), p = se(t, c);
    return Ng(), /* @__PURE__ */ uv(sv, { children: [
      /* @__PURE__ */ ae(
        n0,
        {
          asChild: !0,
          loop: !0,
          trapped: n,
          onMountAutoFocus: o,
          onUnmountAutoFocus: i,
          children: /* @__PURE__ */ ae(
            e0,
            {
              role: "dialog",
              id: u.contentId,
              "aria-describedby": u.descriptionId,
              "aria-labelledby": u.titleId,
              "data-state": B0(u.open),
              ...l,
              ref: p,
              onDismiss: /* @__PURE__ */ a(() => u.onOpenChange(!1), "onDismiss")
            }
          )
        }
      ),
      /* @__PURE__ */ uv(sv, { children: [
        /* @__PURE__ */ ae(LL, { titleId: u.titleId }),
        /* @__PURE__ */ ae(BL, { contentRef: c, descriptionId: u.descriptionId })
      ] })
    ] });
  }
), F0 = "DialogTitle", k0 = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, ...n } = e, o = ht(F0, r);
    return /* @__PURE__ */ ae(pe.h2, { id: o.titleId, ...n, ref: t });
  }
);
k0.displayName = F0;
var hv = "DialogDescription", L0 = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, ...n } = e, o = ht(hv, r);
    return /* @__PURE__ */ ae(pe.p, { id: o.descriptionId, ...n, ref: t });
  }
);
L0.displayName = hv;
var mv = "DialogClose", T0 = X.forwardRef(
  (e, t) => {
    let { __scopeDialog: r, ...n } = e, o = ht(mv, r);
    return /* @__PURE__ */ ae(
      pe.button,
      {
        type: "button",
        ...n,
        ref: t,
        onClick: we(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
T0.displayName = mv;
function B0(e) {
  return e ? "open" : "closed";
}
a(B0, "getState");
var gv = "DialogTitleWarning", [kL, vv] = xg(gv, {
  contentName: Jr,
  titleName: F0,
  docsSlug: "dialog"
}), LL = /* @__PURE__ */ a(({ titleId: e }) => {
  let t = vv(gv), r = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return X.useEffect(() => {
    e && (document.getElementById(e) || console.error(r));
  }, [r, e]), null;
}, "TitleWarning"), TL = "DialogDescriptionWarning", BL = /* @__PURE__ */ a(({ contentRef: e, descriptionId: t }) => {
  let n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${vv(TL).contentName}}.`;
  return X.useEffect(() => {
    let o = e.current?.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(n));
  }, [n, e, t]), null;
}, "DescriptionWarning"), I0 = x0, IL = C0, M0 = R0, _0 = S0, P0 = A0, H0 = k0, z0 = L0, O0 = T0;

// src/components/components/Modal/Modal.styled.tsx
var V0 = {};
dn(V0, {
  Actions: () => XL,
  CloseButton: () => yv,
  Col: () => xv,
  Container: () => j0,
  Content: () => qL,
  Description: () => YL,
  Error: () => KL,
  ErrorWrapper: () => Cv,
  Header: () => UL,
  Overlay: () => $0,
  Row: () => Dv,
  Title: () => GL
});
import dr from "react";
import { keyframes as N0, styled as qt } from "@storybook/core/theming";

// src/components/components/IconButton/IconButton.tsx
import $L, { forwardRef as jL } from "react";

// src/components/components/Button/Button.tsx
wi();
import wv, { forwardRef as ML, useEffect as _L, useState as PL } from "react";
import { isPropValid as HL, styled as zL } from "@storybook/core/theming";
import { deprecate as OL } from "@storybook/core/client-logger";
var zo = ML(
  ({
    asChild: e = !1,
    animation: t = "none",
    size: r = "small",
    variant: n = "outline",
    padding: o = "medium",
    disabled: i = !1,
    active: l = !1,
    onClick: u,
    ...c
  }, p) => {
    let d = "button";
    c.isLink && (d = "a"), e && (d = Fr);
    let h = n, f = r, [v, b] = PL(!1), m = /* @__PURE__ */ a((g) => {
      u && u(g), t !== "none" && b(!0);
    }, "handleClick");
    if (_L(() => {
      let g = setTimeout(() => {
        v && b(!1);
      }, 1e3);
      return () => clearTimeout(g);
    }, [v]), c.primary && (h = "solid", f = "medium"), (c.secondary || c.tertiary || c.gray || c.outline || c.inForm) && (h = "outline", f =
    "medium"), c.small || c.isLink || c.primary || c.secondary || c.tertiary || c.gray || c.outline || c.inForm || c.containsIcon) {
      let g = wv.Children.toArray(c.children).filter(
        (y) => typeof y == "string" && y !== ""
      );
      OL(
        `Use of deprecated props in the button ${g.length > 0 ? `"${g.join(" ")}"` : "component"} detected, see the migration notes at https\
://github.com/storybookjs/storybook/blob/next/MIGRATION.md#new-ui-and-props-for-button-and-iconbutton-components`
      );
    }
    return /* @__PURE__ */ wv.createElement(
      NL,
      {
        as: d,
        ref: p,
        variant: h,
        size: f,
        padding: o,
        disabled: i,
        active: l,
        animating: v,
        animation: t,
        onClick: m,
        ...c
      }
    );
  }
);
zo.displayName = "Button";
var NL = zL("button", {
  shouldForwardProp: /* @__PURE__ */ a((e) => HL(e), "shouldForwardProp")
})(({ theme: e, variant: t, size: r, disabled: n, active: o, animating: i, animation: l = "none", padding: u }) => ({
  border: 0,
  cursor: n ? "not-allowed" : "pointer",
  display: "inline-flex",
  gap: "6px",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  padding: u === "none" ? 0 : u === "small" && r === "small" ? "0 7px" : u === "small" && r === "medium" ? "0 9px" : r === "small" ? "0 10px" :
  r === "medium" ? "0 12px" : 0,
  height: r === "small" ? "28px" : "32px",
  position: "relative",
  textAlign: "center",
  textDecoration: "none",
  transitionProperty: "background, box-shadow",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease-out",
  verticalAlign: "top",
  whiteSpace: "nowrap",
  userSelect: "none",
  opacity: n ? 0.5 : 1,
  margin: 0,
  fontSize: `${e.typography.size.s1}px`,
  fontWeight: e.typography.weight.bold,
  lineHeight: "1",
  background: t === "solid" ? e.color.secondary : t === "outline" ? e.button.background : t === "ghost" && o ? e.background.hoverable : "tra\
nsparent",
  ...t === "ghost" ? {
    // This is a hack to apply bar styles to the button as soon as it is part of a bar
    // It is a temporary solution until we have implemented Theming 2.0.
    ".sb-bar &": {
      background: o ? Te(0.9, e.barTextColor) : "transparent",
      color: o ? e.barSelectedColor : e.barTextColor,
      "&:hover": {
        color: e.barHoverColor,
        background: Te(0.86, e.barHoverColor)
      },
      "&:active": {
        color: e.barSelectedColor,
        background: Te(0.9, e.barSelectedColor)
      },
      "&:focus": {
        boxShadow: `${ia(e.barHoverColor, 1)} 0 0 0 1px inset`,
        outline: "none"
      }
    }
  } : {},
  color: t === "solid" ? e.color.lightest : t === "outline" ? e.input.color : t === "ghost" && o ? e.color.secondary : t === "ghost" ? e.color.
  mediumdark : e.input.color,
  boxShadow: t === "outline" ? `${e.button.border} 0 0 0 1px inset` : "none",
  borderRadius: e.input.borderRadius,
  // Making sure that the button never shrinks below its minimum size
  flexShrink: 0,
  "&:hover": {
    color: t === "ghost" ? e.color.secondary : void 0,
    background: (() => {
      let c = e.color.secondary;
      return t === "solid" && (c = e.color.secondary), t === "outline" && (c = e.button.background), t === "ghost" ? Te(0.86, e.color.secondary) :
      e.base === "light" ? Jt(0.02, c) : gs(0.03, c);
    })()
  },
  "&:active": {
    color: t === "ghost" ? e.color.secondary : void 0,
    background: (() => {
      let c = e.color.secondary;
      return t === "solid" && (c = e.color.secondary), t === "outline" && (c = e.button.background), t === "ghost" ? e.background.hoverable :
      e.base === "light" ? Jt(0.02, c) : gs(0.03, c);
    })()
  },
  "&:focus": {
    boxShadow: `${ia(e.color.secondary, 1)} 0 0 0 1px inset`,
    outline: "none"
  },
  "> svg": {
    animation: i && l !== "none" ? `${e.animation[l]} 1000ms ease-out` : ""
  }
}));

// src/components/components/IconButton/IconButton.tsx
var Ml = jL(
  ({ padding: e = "small", variant: t = "ghost", ...r }, n) => /* @__PURE__ */ $L.createElement(zo, { padding: e, variant: t, ref: n, ...r })
);
Ml.displayName = "IconButton";

// src/components/components/Modal/Modal.styled.tsx
var bv = N0({
  from: { opacity: 0 },
  to: { opacity: 1 }
}), VL = N0({
  from: { maxHeight: 0 },
  to: {}
}), WL = N0({
  from: {
    opacity: 0,
    transform: "translate(-50%, -50%) scale(0.9)"
  },
  to: {
    opacity: 1,
    transform: "translate(-50%, -50%) scale(1)"
  }
}), $0 = qt.div({
  backdropFilter: "blur(24px)",
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: 10,
  animation: `${bv} 200ms`
}), j0 = qt.div(
  ({ theme: e, width: t, height: r }) => ({
    backgroundColor: e.background.bar,
    borderRadius: 6,
    boxShadow: "0px 4px 67px 0px #00000040",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: t ?? 740,
    height: r ?? "auto",
    maxWidth: "calc(100% - 40px)",
    maxHeight: "85vh",
    overflow: "hidden",
    zIndex: 11,
    animation: `${WL} 200ms`,
    "&:focus-visible": {
      outline: "none"
    }
  })
), yv = /* @__PURE__ */ a((e) => /* @__PURE__ */ dr.createElement(O0, { asChild: !0 }, /* @__PURE__ */ dr.createElement(Ml, { ...e }, /* @__PURE__ */ dr.
createElement(zu, null))), "CloseButton"), qL = qt.div({
  display: "flex",
  flexDirection: "column",
  margin: 16,
  gap: 16
}), Dv = qt.div({
  display: "flex",
  justifyContent: "space-between",
  gap: 16
}), xv = qt.div({
  display: "flex",
  flexDirection: "column",
  gap: 4
}), UL = /* @__PURE__ */ a((e) => /* @__PURE__ */ dr.createElement(Dv, null, /* @__PURE__ */ dr.createElement(xv, { ...e }), /* @__PURE__ */ dr.
createElement(yv, null)), "Header"), GL = qt(H0)(({ theme: e }) => ({
  margin: 0,
  fontSize: e.typography.size.s3,
  fontWeight: e.typography.weight.bold
})), YL = qt(z0)(({ theme: e }) => ({
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontSize: e.typography.size.s2
})), XL = qt.div({
  display: "flex",
  flexDirection: "row-reverse",
  gap: 8
}), Cv = qt.div(({ theme: e }) => ({
  maxHeight: 100,
  overflow: "auto",
  animation: `${VL} 300ms, ${bv} 300ms`,
  backgroundColor: e.background.critical,
  color: e.color.lightest,
  fontSize: e.typography.size.s2,
  "& > div": {
    position: "relative",
    padding: "8px 16px"
  }
})), KL = /* @__PURE__ */ a(({
  children: e,
  ...t
}) => /* @__PURE__ */ dr.createElement(Cv, { ...t }, /* @__PURE__ */ dr.createElement("div", null, e)), "Error");

// src/components/components/Modal/Modal.tsx
function ZL({
  children: e,
  width: t,
  height: r,
  onEscapeKeyDown: n,
  onInteractOutside: o = /* @__PURE__ */ a((c) => c.preventDefault(), "onInteractOutside"),
  className: i,
  container: l,
  ...u
}) {
  return /* @__PURE__ */ Oo.createElement(I0, { ...u }, /* @__PURE__ */ Oo.createElement(M0, { container: l }, /* @__PURE__ */ Oo.createElement(
  _0, { asChild: !0 }, /* @__PURE__ */ Oo.createElement($0, null)), /* @__PURE__ */ Oo.createElement(
    P0,
    {
      asChild: !0,
      onInteractOutside: o,
      onEscapeKeyDown: n
    },
    /* @__PURE__ */ Oo.createElement(j0, { className: i, width: t, height: r }, e)
  )));
}
a(ZL, "BaseModal");
var JL = Object.assign(ZL, V0, { Dialog: Il });

// src/components/components/spaced/Spaced.tsx
import QL from "react";
import { ignoreSsrWarning as Ev, styled as eT } from "@storybook/core/theming";
var tT = /* @__PURE__ */ a((e) => typeof e == "number" ? e : Number(e), "toNumber"), rT = eT.div(
  ({ theme: e, col: t, row: r = 1 }) => t ? {
    display: "inline-block",
    verticalAlign: "inherit",
    "& > *": {
      marginLeft: t * e.layoutMargin,
      verticalAlign: "inherit"
    },
    [`& > *:first-child${Ev}`]: {
      marginLeft: 0
    }
  } : {
    "& > *": {
      marginTop: r * e.layoutMargin
    },
    [`& > *:first-child${Ev}`]: {
      marginTop: 0
    }
  },
  ({ theme: e, outer: t, col: r, row: n }) => {
    switch (!0) {
      case !!(t && r):
        return {
          marginLeft: t * e.layoutMargin,
          marginRight: t * e.layoutMargin
        };
      case !!(t && n):
        return {
          marginTop: t * e.layoutMargin,
          marginBottom: t * e.layoutMargin
        };
      default:
        return {};
    }
  }
), nT = /* @__PURE__ */ a(({ col: e, row: t, outer: r, children: n, ...o }) => {
  let i = tT(typeof r == "number" || !r ? r : e || t);
  return /* @__PURE__ */ QL.createElement(rT, { col: e, row: t, outer: i, ...o }, n);
}, "Spaced");

// src/components/components/placeholder/placeholder.tsx
import W0, { Children as oT } from "react";
import { styled as q0 } from "@storybook/core/theming";
var aT = q0.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), iT = q0.div(), lT = q0.div(({ theme: e }) => ({
  padding: 30,
  textAlign: "center",
  color: e.color.defaultText,
  fontSize: e.typography.size.s2 - 1
})), sT = /* @__PURE__ */ a(({ children: e, ...t }) => {
  let [r, n] = oT.toArray(e);
  return /* @__PURE__ */ W0.createElement(lT, { ...t }, /* @__PURE__ */ W0.createElement(aT, null, r), n && /* @__PURE__ */ W0.createElement(
  iT, null, n));
}, "Placeholder");

// src/components/index.ts
Ai();

// src/components/components/Zoom/ZoomElement.tsx
import Sv, { useCallback as dT, useEffect as fT, useRef as hT, useState as mT } from "react";
import { styled as gT } from "@storybook/core/theming";

// ../node_modules/use-resize-observer/dist/bundle.esm.js
import { useRef as Qr, useEffect as U0, useCallback as G0, useState as uT, useMemo as cT } from "react";
function pT(e, t) {
  var r = Qr(null), n = Qr(null);
  n.current = t;
  var o = Qr(null);
  U0(function() {
    i();
  });
  var i = G0(function() {
    var l = o.current, u = n.current, c = l || (u ? u instanceof Element ? u : u.current : null);
    r.current && r.current.element === c && r.current.subscriber === e || (r.current && r.current.cleanup && r.current.cleanup(), r.current =
    {
      element: c,
      subscriber: e,
      // Only calling the subscriber, if there's an actual element to report.
      // Setting cleanup to undefined unless a subscriber returns one, as an existing cleanup function would've been just called.
      cleanup: c ? e(c) : void 0
    });
  }, [e]);
  return U0(function() {
    return function() {
      r.current && r.current.cleanup && (r.current.cleanup(), r.current = null);
    };
  }, []), G0(function(l) {
    o.current = l, i();
  }, [i]);
}
a(pT, "useResolvedElement");
function Rv(e, t, r) {
  return e[t] ? e[t][0] ? e[t][0][r] : (
    // TS complains about this, because the RO entry type follows the spec and does not reflect Firefox's current
    // behaviour of returning objects instead of arrays for `borderBoxSize` and `contentBoxSize`.
    // @ts-ignore
    e[t][r]
  ) : t === "contentBoxSize" ? e.contentRect[r === "inlineSize" ? "width" : "height"] : void 0;
}
a(Rv, "extractSize");
function _l(e) {
  e === void 0 && (e = {});
  var t = e.onResize, r = Qr(void 0);
  r.current = t;
  var n = e.round || Math.round, o = Qr(), i = uT({
    width: void 0,
    height: void 0
  }), l = i[0], u = i[1], c = Qr(!1);
  U0(function() {
    return c.current = !1, function() {
      c.current = !0;
    };
  }, []);
  var p = Qr({
    width: void 0,
    height: void 0
  }), d = pT(G0(function(h) {
    return (!o.current || o.current.box !== e.box || o.current.round !== n) && (o.current = {
      box: e.box,
      round: n,
      instance: new ResizeObserver(function(f) {
        var v = f[0], b = e.box === "border-box" ? "borderBoxSize" : e.box === "device-pixel-content-box" ? "devicePixelContentBoxSize" : "c\
ontentBoxSize", m = Rv(v, b, "inlineSize"), g = Rv(v, b, "blockSize"), y = m ? n(m) : void 0, w = g ? n(g) : void 0;
        if (p.current.width !== y || p.current.height !== w) {
          var D = {
            width: y,
            height: w
          };
          p.current.width = y, p.current.height = w, r.current ? r.current(D) : c.current || u(D);
        }
      })
    }), o.current.instance.observe(h, {
      box: e.box
    }), function() {
      o.current && o.current.instance.unobserve(h);
    };
  }, [e.box, n]), e.ref);
  return cT(function() {
    return {
      ref: d,
      width: l.width,
      height: l.height
    };
  }, [d, l.width, l.height]);
}
a(_l, "useResizeObserver");

// src/components/components/Zoom/ZoomElement.tsx
var vT = gT.div(
  ({ scale: e = 1, elementHeight: t }) => ({
    height: t || "auto",
    transformOrigin: "top left",
    transform: `scale(${1 / e})`
  })
);
function Av({ scale: e, children: t }) {
  let r = hT(null), [n, o] = mT(0), i = dT(
    ({ height: l }) => {
      l && o(l / e);
    },
    [e]
  );
  return fT(() => {
    r.current && o(r.current.getBoundingClientRect().height);
  }, [e]), _l({
    ref: r,
    onResize: i
  }), /* @__PURE__ */ Sv.createElement(vT, { scale: e, elementHeight: n }, /* @__PURE__ */ Sv.createElement("div", { ref: r, className: "inn\
erZoomElementWrapper" }, t));
}
a(Av, "ZoomElement");

// src/components/components/Zoom/ZoomIFrame.tsx
import Fv, { Component as wT } from "react";
var Y0 = class Y0 extends wT {
  constructor() {
    super(...arguments);
    // @ts-expect-error (non strict)
    this.iframe = null;
  }
  componentDidMount() {
    let { iFrameRef: r } = this.props;
    this.iframe = r.current;
  }
  shouldComponentUpdate(r) {
    let { scale: n, active: o } = this.props;
    return n !== r.scale && this.setIframeInnerZoom(r.scale), o !== r.active && this.iframe.setAttribute("data-is-storybook", r.active ? "tr\
ue" : "false"), r.children.props.src !== this.props.children.props.src;
  }
  setIframeInnerZoom(r) {
    try {
      Object.assign(this.iframe.contentDocument.body.style, {
        width: `${r * 100}%`,
        height: `${r * 100}%`,
        transform: `scale(${1 / r})`,
        transformOrigin: "top left"
      });
    } catch {
      this.setIframeZoom(r);
    }
  }
  setIframeZoom(r) {
    Object.assign(this.iframe.style, {
      width: `${r * 100}%`,
      height: `${r * 100}%`,
      transform: `scale(${1 / r})`,
      transformOrigin: "top left"
    });
  }
  render() {
    let { children: r } = this.props;
    return /* @__PURE__ */ Fv.createElement(Fv.Fragment, null, r);
  }
};
a(Y0, "ZoomIFrame");
var Pl = Y0;

// src/components/components/Zoom/Zoom.tsx
var bT = {
  Element: Av,
  IFrame: Pl
};

// src/components/components/ErrorFormatter/ErrorFormatter.tsx
ii();
import Ue, { Fragment as No } from "react";
import { styled as X0 } from "@storybook/core/theming";
var { document: yT } = fn, DT = X0.strong(({ theme: e }) => ({
  color: e.color.orange
})), xT = X0.strong(({ theme: e }) => ({
  color: e.color.ancillary,
  textDecoration: "underline"
})), kv = X0.em(({ theme: e }) => ({
  color: e.textMutedColor
})), CT = /(Error): (.*)\n/, ET = /at (?:(.*) )?\(?(.+)\)?/, RT = /([^@]+)?(?:\/<)?@(.+)?/, ST = /([^@]+)?@(.+)?/, AT = /* @__PURE__ */ a(({
error: e }) => {
  if (!e)
    return /* @__PURE__ */ Ue.createElement(No, null, "This error has no stack or message");
  if (!e.stack)
    return /* @__PURE__ */ Ue.createElement(No, null, e.message || "This error has no stack or message");
  let t = e.stack.toString();
  t && e.message && !t.includes(e.message) && (t = `Error: ${e.message}

${t}`);
  let r = t.match(CT);
  if (!r)
    return /* @__PURE__ */ Ue.createElement(No, null, t);
  let [, n, o] = r, i = t.split(/\n/).slice(1), [, ...l] = i.map((u) => {
    let c = u.match(ET) || u.match(RT) || u.match(ST);
    return c ? {
      name: (c[1] || "").replace("/<", ""),
      location: c[2].replace(yT.location.origin, "")
    } : null;
  }).filter(Boolean);
  return /* @__PURE__ */ Ue.createElement(No, null, /* @__PURE__ */ Ue.createElement("span", null, n), ": ", /* @__PURE__ */ Ue.createElement(
  DT, null, o), /* @__PURE__ */ Ue.createElement("br", null), l.map(
    (u, c) => u?.name ? /* @__PURE__ */ Ue.createElement(No, { key: c }, "  ", "at ", /* @__PURE__ */ Ue.createElement(xT, null, u.name), " \
(", /* @__PURE__ */ Ue.createElement(kv, null, u.location), ")", /* @__PURE__ */ Ue.createElement("br", null)) : /* @__PURE__ */ Ue.createElement(
    No, { key: c }, "  ", "at ", /* @__PURE__ */ Ue.createElement(kv, null, u?.location), /* @__PURE__ */ Ue.createElement("br", null))
  ));
}, "ErrorFormatter");

// src/components/components/form/index.tsx
import { styled as GT } from "@storybook/core/theming";

// src/components/components/form/field/field.tsx
import K0 from "react";
import { styled as Lv } from "@storybook/core/theming";
var FT = Lv.label(({ theme: e }) => ({
  display: "flex",
  borderBottom: `1px solid ${e.appBorderColor}`,
  margin: "0 15px",
  padding: "8px 0",
  "&:last-child": {
    marginBottom: "3rem"
  }
})), kT = Lv.span(({ theme: e }) => ({
  minWidth: 100,
  fontWeight: e.typography.weight.bold,
  marginRight: 15,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  lineHeight: "16px"
})), Tv = /* @__PURE__ */ a(({ label: e, children: t, ...r }) => /* @__PURE__ */ K0.createElement(FT, { ...r }, e ? /* @__PURE__ */ K0.createElement(
kT, null, /* @__PURE__ */ K0.createElement("span", null, e)) : null, t), "Field");

// src/components/components/form/input/input.tsx
import Z0, { forwardRef as J0 } from "react";
import { styled as Q0 } from "@storybook/core/theming";

// ../node_modules/react-textarea-autosize/dist/react-textarea-autosize.browser.esm.js
oa();
li();
import * as mt from "react";

// ../node_modules/use-latest/dist/use-latest.esm.js
import * as Iv from "react";

// ../node_modules/use-isomorphic-layout-effect/dist/use-isomorphic-layout-effect.browser.esm.js
import { useLayoutEffect as LT } from "react";
var TT = LT, Bv = TT;

// ../node_modules/use-latest/dist/use-latest.esm.js
var Mv = /* @__PURE__ */ a(function(t) {
  var r = Iv.useRef(t);
  return Bv(function() {
    r.current = t;
  }), r;
}, "useLatest");

// ../node_modules/use-composed-ref/dist/use-composed-ref.esm.js
import { useRef as BT, useCallback as IT } from "react";
var _v = /* @__PURE__ */ a(function(t, r) {
  if (typeof t == "function") {
    t(r);
    return;
  }
  t.current = r;
}, "updateRef"), MT = /* @__PURE__ */ a(function(t, r) {
  var n = BT();
  return IT(function(o) {
    t.current = o, n.current && _v(n.current, null), n.current = r, r && _v(r, o);
  }, [r]);
}, "useComposedRef"), Pv = MT;

// ../node_modules/react-textarea-autosize/dist/react-textarea-autosize.browser.esm.js
var Hv = {
  "min-height": "0",
  "max-height": "none",
  height: "0",
  visibility: "hidden",
  overflow: "hidden",
  position: "absolute",
  "z-index": "-1000",
  top: "0",
  right: "0"
}, _T = /* @__PURE__ */ a(function(t) {
  Object.keys(Hv).forEach(function(r) {
    t.style.setProperty(r, Hv[r], "important");
  });
}, "forceHiddenStyles"), zv = _T, Me = null, Ov = /* @__PURE__ */ a(function(t, r) {
  var n = t.scrollHeight;
  return r.sizingStyle.boxSizing === "border-box" ? n + r.borderSize : n - r.paddingSize;
}, "getHeight");
function PT(e, t, r, n) {
  r === void 0 && (r = 1), n === void 0 && (n = 1 / 0), Me || (Me = document.createElement("textarea"), Me.setAttribute("tabindex", "-1"), Me.
  setAttribute("aria-hidden", "true"), zv(Me)), Me.parentNode === null && document.body.appendChild(Me);
  var o = e.paddingSize, i = e.borderSize, l = e.sizingStyle, u = l.boxSizing;
  Object.keys(l).forEach(function(f) {
    var v = f;
    Me.style[v] = l[v];
  }), zv(Me), Me.value = t;
  var c = Ov(Me, e);
  Me.value = t, c = Ov(Me, e), Me.value = "x";
  var p = Me.scrollHeight - o, d = p * r;
  u === "border-box" && (d = d + o + i), c = Math.max(d, c);
  var h = p * n;
  return u === "border-box" && (h = h + o + i), c = Math.min(h, c), [c, p];
}
a(PT, "calculateNodeHeight");
var Nv = /* @__PURE__ */ a(function() {
}, "noop"), HT = /* @__PURE__ */ a(function(t, r) {
  return t.reduce(function(n, o) {
    return n[o] = r[o], n;
  }, {});
}, "pick"), zT = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  // non-standard
  "tabSize",
  "textIndent",
  // non-standard
  "textRendering",
  "textTransform",
  "width",
  "wordBreak"
], OT = !!document.documentElement.currentStyle, NT = /* @__PURE__ */ a(function(t) {
  var r = window.getComputedStyle(t);
  if (r === null)
    return null;
  var n = HT(zT, r), o = n.boxSizing;
  if (o === "")
    return null;
  OT && o === "border-box" && (n.width = parseFloat(n.width) + parseFloat(n.borderRightWidth) + parseFloat(n.borderLeftWidth) + parseFloat(n.
  paddingRight) + parseFloat(n.paddingLeft) + "px");
  var i = parseFloat(n.paddingBottom) + parseFloat(n.paddingTop), l = parseFloat(n.borderBottomWidth) + parseFloat(n.borderTopWidth);
  return {
    sizingStyle: n,
    paddingSize: i,
    borderSize: l
  };
}, "getSizingData"), $T = NT;
function $v(e, t, r) {
  var n = Mv(r);
  mt.useLayoutEffect(function() {
    var o = /* @__PURE__ */ a(function(l) {
      return n.current(l);
    }, "handler");
    if (e)
      return e.addEventListener(t, o), function() {
        return e.removeEventListener(t, o);
      };
  }, []);
}
a($v, "useListener");
var jT = /* @__PURE__ */ a(function(t) {
  $v(window, "resize", t);
}, "useWindowResizeListener"), VT = /* @__PURE__ */ a(function(t) {
  $v(document.fonts, "loadingdone", t);
}, "useFontsLoadedListener"), WT = ["cacheMeasurements", "maxRows", "minRows", "onChange", "onHeightChange"], qT = /* @__PURE__ */ a(function(t, r) {
  var n = t.cacheMeasurements, o = t.maxRows, i = t.minRows, l = t.onChange, u = l === void 0 ? Nv : l, c = t.onHeightChange, p = c === void 0 ?
  Nv : c, d = hn(t, WT), h = d.value !== void 0, f = mt.useRef(null), v = Pv(f, r), b = mt.useRef(0), m = mt.useRef(), g = /* @__PURE__ */ a(
  function() {
    var D = f.current, x = n && m.current ? m.current : $T(D);
    if (x) {
      m.current = x;
      var C = PT(x, D.value || D.placeholder || "x", i, o), E = C[0], R = C[1];
      b.current !== E && (b.current = E, D.style.setProperty("height", E + "px", "important"), p(E, {
        rowHeight: R
      }));
    }
  }, "resizeTextarea"), y = /* @__PURE__ */ a(function(D) {
    h || g(), u(D);
  }, "handleChange");
  return mt.useLayoutEffect(g), jT(g), VT(g), /* @__PURE__ */ mt.createElement("textarea", ve({}, d, {
    onChange: y,
    ref: v
  }));
}, "TextareaAutosize"), jv = /* @__PURE__ */ mt.forwardRef(qT);

// src/components/components/form/input/input.tsx
var UT = {
  // resets
  appearance: "none",
  border: "0 none",
  boxSizing: "inherit",
  display: " block",
  margin: " 0",
  background: "transparent",
  padding: 0,
  fontSize: "inherit",
  position: "relative"
}, e1 = /* @__PURE__ */ a(({ theme: e }) => ({
  ...UT,
  transition: "box-shadow 200ms ease-out, opacity 200ms ease-out",
  color: e.input.color || "inherit",
  background: e.input.background,
  boxShadow: `${e.input.border} 0 0 0 1px inset`,
  borderRadius: e.input.borderRadius,
  fontSize: e.typography.size.s2 - 1,
  lineHeight: "20px",
  padding: "6px 10px",
  // 32
  boxSizing: "border-box",
  height: 32,
  '&[type="file"]': {
    height: "auto"
  },
  "&:focus": {
    boxShadow: `${e.color.secondary} 0 0 0 1px inset`,
    outline: "none"
  },
  "&[disabled]": {
    cursor: "not-allowed",
    opacity: 0.5
  },
  "&:-webkit-autofill": { WebkitBoxShadow: `0 0 0 3em ${e.color.lightest} inset` },
  "&::placeholder": {
    color: e.textMutedColor,
    opacity: 1
  }
}), "styles"), t1 = /* @__PURE__ */ a(({ size: e }) => {
  switch (e) {
    case "100%":
      return { width: "100%" };
    case "flex":
      return { flex: 1 };
    case "auto":
    default:
      return { display: "inline" };
  }
}, "sizes"), Vv = /* @__PURE__ */ a(({
  align: e
}) => {
  switch (e) {
    case "end":
      return { textAlign: "right" };
    case "center":
      return { textAlign: "center" };
    case "start":
    default:
      return { textAlign: "left" };
  }
}, "alignment"), r1 = /* @__PURE__ */ a(({ valid: e, theme: t }) => {
  switch (e) {
    case "valid":
      return { boxShadow: `${t.color.positive} 0 0 0 1px inset !important` };
    case "error":
      return { boxShadow: `${t.color.negative} 0 0 0 1px inset !important` };
    case "warn":
      return {
        boxShadow: `${t.color.warning} 0 0 0 1px inset`
      };
    case void 0:
    case null:
    default:
      return {};
  }
}, "validation"), Wv = Object.assign(
  Q0(
    J0(/* @__PURE__ */ a(function({ size: t, valid: r, align: n, ...o }, i) {
      return /* @__PURE__ */ Z0.createElement("input", { ...o, ref: i });
    }, "Input"))
  )(e1, t1, Vv, r1, {
    minHeight: 32
  }),
  {
    displayName: "Input"
  }
), qv = Object.assign(
  Q0(
    J0(/* @__PURE__ */ a(function({ size: t, valid: r, align: n, ...o }, i) {
      return /* @__PURE__ */ Z0.createElement("select", { ...o, ref: i });
    }, "Select"))
  )(e1, t1, r1, {
    height: 32,
    userSelect: "none",
    paddingRight: 20,
    appearance: "menulist"
  }),
  {
    displayName: "Select"
  }
), Uv = Object.assign(
  Q0(
    J0(/* @__PURE__ */ a(function({ size: t, valid: r, align: n, ...o }, i) {
      return /* @__PURE__ */ Z0.createElement(jv, { ...o, ref: i });
    }, "Textarea"))
  )(e1, t1, Vv, r1, ({ height: e = 400 }) => ({
    overflow: "visible",
    maxHeight: e
  })),
  {
    displayName: "Textarea"
  }
);

// src/components/components/form/index.tsx
var YT = Object.assign(
  GT.form({
    boxSizing: "border-box",
    width: "100%"
  }),
  {
    Field: Tv,
    Input: Wv,
    Select: qv,
    Textarea: Uv,
    Button: zo
  }
);

// src/components/components/tooltip/lazy-WithTooltip.tsx
import Ko, { Suspense as a4, lazy as i4 } from "react";
var WB = i4(
  () => Promise.resolve().then(() => (Zl(), M1)).then((e) => ({ default: e.WithTooltip }))
), qB = /* @__PURE__ */ a((e) => /* @__PURE__ */ Ko.createElement(a4, { fallback: /* @__PURE__ */ Ko.createElement("div", null) }, /* @__PURE__ */ Ko.
createElement(WB, { ...e })), "WithTooltip"), UB = i4(
  () => Promise.resolve().then(() => (Zl(), M1)).then((e) => ({ default: e.WithTooltipPure }))
), GB = /* @__PURE__ */ a((e) => /* @__PURE__ */ Ko.createElement(a4, { fallback: /* @__PURE__ */ Ko.createElement("div", null) }, /* @__PURE__ */ Ko.
createElement(UB, { ...e })), "WithTooltipPure");

// src/components/components/tooltip/TooltipMessage.tsx
import Zo from "react";
import { styled as Ja } from "@storybook/core/theming";
var YB = Ja.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), XB = Ja.span(), KB = Ja.div(({ theme: e }) => ({
  marginTop: 8,
  textAlign: "center",
  "> *": {
    margin: "0 8px",
    fontWeight: e.typography.weight.bold
  }
})), ZB = Ja.div(({ theme: e }) => ({
  color: e.color.defaultText,
  lineHeight: "18px"
})), JB = Ja.div({
  padding: 15,
  width: 280,
  boxSizing: "border-box"
}), QB = /* @__PURE__ */ a(({ title: e, desc: t, links: r }) => /* @__PURE__ */ Zo.createElement(JB, null, /* @__PURE__ */ Zo.createElement(
ZB, null, e && /* @__PURE__ */ Zo.createElement(YB, null, e), t && /* @__PURE__ */ Zo.createElement(XB, null, t)), r && /* @__PURE__ */ Zo.createElement(
KB, null, r.map(({ title: n, ...o }) => /* @__PURE__ */ Zo.createElement(ju, { ...o, key: n }, n)))), "TooltipMessage");

// src/components/components/tooltip/TooltipNote.tsx
import eI from "react";
import { styled as tI } from "@storybook/core/theming";
var rI = tI.div(({ theme: e }) => ({
  padding: "2px 6px",
  lineHeight: "16px",
  fontSize: 10,
  fontWeight: e.typography.weight.bold,
  color: e.color.lightest,
  boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.3)",
  borderRadius: 4,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  zIndex: -1,
  background: e.base === "light" ? "rgba(60, 60, 60, 0.9)" : "rgba(0, 0, 0, 0.95)",
  margin: 6
})), nI = /* @__PURE__ */ a(({ note: e, ...t }) => /* @__PURE__ */ eI.createElement(rI, { ...t }, e), "TooltipNote");

// src/components/components/tooltip/TooltipLinkList.tsx
import Qa, { Fragment as dI, useCallback as fI } from "react";
import { styled as s4 } from "@storybook/core/theming";

// src/components/components/tooltip/ListItem.tsx
var l4 = Ee(la(), 1);
import Tt from "react";
import { styled as Jo } from "@storybook/core/theming";
var oI = Jo(({ active: e, loading: t, disabled: r, ...n }) => /* @__PURE__ */ Tt.createElement("span", { ...n }))(
  ({ theme: e }) => ({
    color: e.color.defaultText,
    // Previously was theme.typography.weight.normal but this weight does not exists in Theme
    fontWeight: e.typography.weight.regular
  }),
  ({ active: e, theme: t }) => e ? {
    color: t.color.secondary,
    fontWeight: t.typography.weight.bold
  } : {},
  ({ loading: e, theme: t }) => e ? {
    display: "inline-block",
    flex: "none",
    ...t.animation.inlineGlow
  } : {},
  ({ disabled: e, theme: t }) => e ? {
    color: t.textMutedColor
  } : {}
), aI = Jo.span({
  display: "flex",
  "& svg": {
    height: 12,
    width: 12,
    margin: "3px 0",
    verticalAlign: "top"
  },
  "& path": {
    fill: "inherit"
  }
}), iI = Jo.span(
  {
    flex: 1,
    textAlign: "left",
    display: "flex",
    flexDirection: "column"
  },
  ({ isIndented: e }) => e ? { marginLeft: 24 } : {}
), lI = Jo.span(
  ({ theme: e }) => ({
    fontSize: "11px",
    lineHeight: "14px"
  }),
  ({ active: e, theme: t }) => e ? {
    color: t.color.secondary
  } : {},
  ({ theme: e, disabled: t }) => t ? {
    color: e.textMutedColor
  } : {}
), sI = Jo.span(
  ({ active: e, theme: t }) => e ? {
    color: t.color.secondary
  } : {},
  () => ({
    display: "flex",
    maxWidth: 14
  })
), uI = Jo.div(
  ({ theme: e }) => ({
    width: "100%",
    border: "none",
    borderRadius: e.appBorderRadius,
    background: "none",
    fontSize: e.typography.size.s1,
    transition: "all 150ms ease-out",
    color: e.color.dark,
    textDecoration: "none",
    justifyContent: "space-between",
    lineHeight: "18px",
    padding: "7px 10px",
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      paddingLeft: 10
    }
  }),
  ({ theme: e, href: t, onClick: r }) => (t || r) && {
    cursor: "pointer",
    "&:hover": {
      background: e.background.hoverable
    },
    "&:hover svg": {
      opacity: 1
    }
  },
  ({ theme: e, as: t }) => t === "label" && {
    "&:has(input:not(:disabled))": {
      cursor: "pointer",
      "&:hover": {
        background: e.background.hoverable
      }
    }
  },
  ({ disabled: e }) => e && { cursor: "not-allowed" }
), cI = (0, l4.default)(100)((e, t, r) => ({
  ...e && {
    as: "button",
    onClick: e
  },
  ...t && {
    as: "a",
    href: t,
    ...r && {
      as: r,
      to: t
    }
  }
})), pI = /* @__PURE__ */ a(({
  loading: e = !1,
  title: t = /* @__PURE__ */ Tt.createElement("span", null, "Loading state"),
  center: r = null,
  right: n = null,
  active: o = !1,
  disabled: i = !1,
  isIndented: l,
  href: u = void 0,
  onClick: c = void 0,
  icon: p,
  LinkWrapper: d = void 0,
  ...h
}) => {
  let f = { active: o, disabled: i }, v = cI(c, u, d);
  return /* @__PURE__ */ Tt.createElement(uI, { ...h, ...f, ...v }, /* @__PURE__ */ Tt.createElement(Tt.Fragment, null, p && /* @__PURE__ */ Tt.
  createElement(sI, { ...f }, p), t || r ? /* @__PURE__ */ Tt.createElement(iI, { isIndented: !!(!p && l) }, t && /* @__PURE__ */ Tt.createElement(
  oI, { ...f, loading: e }, t), r && /* @__PURE__ */ Tt.createElement(lI, { ...f }, r)) : null, n && /* @__PURE__ */ Tt.createElement(aI, { ...f },
  n)));
}, "ListItem"), _1 = pI;

// src/components/components/tooltip/TooltipLinkList.tsx
var hI = s4.div(
  {
    minWidth: 180,
    overflow: "hidden",
    overflowY: "auto",
    maxHeight: 15.5 * 32 + 8
    // 15.5 items at 32px each + 8px padding
  },
  ({ theme: e }) => ({
    borderRadius: e.appBorderRadius + 2
  }),
  ({ theme: e }) => e.base === "dark" ? { background: e.background.content } : {}
), mI = s4.div(({ theme: e }) => ({
  padding: 4,
  "& + &": {
    borderTop: `1px solid ${e.appBorderColor}`
  }
})), gI = /* @__PURE__ */ a(({ id: e, onClick: t, ...r }) => {
  let { active: n, disabled: o, title: i, href: l } = r, u = fI(
    (c) => t?.(c, { id: e, active: n, disabled: o, title: i, href: l }),
    [t, e, n, o, i, l]
  );
  return /* @__PURE__ */ Qa.createElement(_1, { id: `list-item-${e}`, ...r, ...t && { onClick: u } });
}, "Item"), P1 = /* @__PURE__ */ a(({ links: e, LinkWrapper: t, ...r }) => {
  let n = Array.isArray(e[0]) ? e : [e], o = n.some((i) => i.some((l) => "icon" in l && l.icon));
  return /* @__PURE__ */ Qa.createElement(hI, { ...r }, n.filter((i) => i.length).map((i, l) => /* @__PURE__ */ Qa.createElement(mI, { key: i.
  map((u) => u.id).join(`~${l}~`) }, i.map((u) => "content" in u ? /* @__PURE__ */ Qa.createElement(dI, { key: u.id }, u.content) : /* @__PURE__ */ Qa.
  createElement(gI, { key: u.id, isIndented: o, LinkWrapper: t, ...u })))));
}, "TooltipLinkList");

// src/components/components/tabs/tabs.tsx
import yt, { Component as OI, memo as NI, useMemo as $I } from "react";
import { sanitize as jI } from "@storybook/core/csf";
import { styled as q1 } from "@storybook/core/theming";

// src/components/components/bar/bar.tsx
Ai();
import Qo, { Children as vI } from "react";
import { styled as z1 } from "@storybook/core/theming";
var H1 = z1.div(
  {
    display: "flex",
    whiteSpace: "nowrap",
    flexBasis: "auto",
    marginLeft: 3,
    marginRight: 3
  },
  ({ scrollable: e }) => e ? { flexShrink: 0 } : {},
  ({ left: e }) => e ? {
    "& > *": {
      marginLeft: 4
    }
  } : {},
  ({ right: e }) => e ? {
    marginLeft: 30,
    "& > *": {
      marginRight: 4
    }
  } : {}
);
H1.displayName = "Side";
var wI = /* @__PURE__ */ a(({ children: e, className: t, scrollable: r }) => r ? /* @__PURE__ */ Qo.createElement(Sn, { vertical: !1, className: t },
e) : /* @__PURE__ */ Qo.createElement("div", { className: t }, e), "UnstyledBar"), O1 = z1(wI)(
  ({ theme: e, scrollable: t = !0 }) => ({
    color: e.barTextColor,
    width: "100%",
    height: 40,
    flexShrink: 0,
    overflow: t ? "auto" : "hidden",
    overflowY: "hidden"
  }),
  ({ theme: e, border: t = !1 }) => t ? {
    boxShadow: `${e.appBorderColor}  0 -1px 0 0 inset`,
    background: e.barBg
  } : {}
);
O1.displayName = "Bar";
var bI = z1.div(({ bgColor: e }) => ({
  display: "flex",
  justifyContent: "space-between",
  position: "relative",
  flexWrap: "nowrap",
  flexShrink: 0,
  height: 40,
  backgroundColor: e || ""
})), Jl = /* @__PURE__ */ a(({ children: e, backgroundColor: t, className: r, ...n }) => {
  let [o, i] = vI.toArray(e);
  return /* @__PURE__ */ Qo.createElement(O1, { className: `sb-bar ${r}`, ...n }, /* @__PURE__ */ Qo.createElement(bI, { bgColor: t }, /* @__PURE__ */ Qo.
  createElement(H1, { scrollable: n.scrollable, left: !0 }, o), i ? /* @__PURE__ */ Qo.createElement(H1, { right: !0 }, i) : null));
}, "FlexBar");
Jl.displayName = "FlexBar";

// src/components/components/bar/button.tsx
import Ql, { forwardRef as yI } from "react";
import { isPropValid as DI, styled as N1 } from "@storybook/core/theming";
var xI = /* @__PURE__ */ a((e) => typeof e.props.href == "string", "isLink"), CI = /* @__PURE__ */ a((e) => typeof e.props.href != "string",
"isButton");
function EI({ children: e, ...t }, r) {
  let n = { props: t, ref: r };
  if (xI(n))
    return /* @__PURE__ */ Ql.createElement("a", { ref: n.ref, ...n.props }, e);
  if (CI(n))
    return /* @__PURE__ */ Ql.createElement("button", { ref: n.ref, type: "button", ...n.props }, e);
  throw new Error("invalid props");
}
a(EI, "ForwardRefFunction");
var u4 = yI(EI);
u4.displayName = "ButtonOrLink";
var un = N1(u4, { shouldForwardProp: DI })(
  {
    whiteSpace: "normal",
    display: "inline-flex",
    overflow: "hidden",
    verticalAlign: "top",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    textDecoration: "none",
    "&:empty": {
      display: "none"
    },
    "&[hidden]": {
      display: "none"
    }
  },
  ({ theme: e }) => ({
    padding: "0 15px",
    transition: "color 0.2s linear, border-bottom-color 0.2s linear",
    height: 40,
    lineHeight: "12px",
    cursor: "pointer",
    background: "transparent",
    border: "0 solid transparent",
    borderTop: "3px solid transparent",
    borderBottom: "3px solid transparent",
    fontWeight: "bold",
    fontSize: 13,
    "&:focus": {
      outline: "0 none",
      borderBottomColor: e.barSelectedColor
    }
  }),
  ({ active: e, textColor: t, theme: r }) => e ? {
    color: t || r.barSelectedColor,
    borderBottomColor: r.barSelectedColor
  } : {
    color: t || r.barTextColor,
    borderBottomColor: "transparent",
    "&:hover": {
      color: r.barHoverColor
    }
  }
);
un.displayName = "TabButton";
var RI = N1.div(({ theme: e }) => ({
  width: 14,
  height: 14,
  backgroundColor: e.appBorderColor,
  animation: `${e.animation.glow} 1.5s ease-in-out infinite`
})), SI = N1.div({
  marginTop: 6,
  padding: 7,
  height: 28
}), AI = /* @__PURE__ */ a(() => /* @__PURE__ */ Ql.createElement(SI, null, /* @__PURE__ */ Ql.createElement(RI, null)), "IconButtonSkeleton");

// src/components/components/tabs/EmptyTabContent.tsx
import es from "react";
import { styled as ts } from "@storybook/core/theming";
var FI = ts.div(({ theme: e }) => ({
  height: "100%",
  display: "flex",
  padding: 30,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 15,
  background: e.background.content
})), kI = ts.div({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxWidth: 415
}), LI = ts.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold,
  fontSize: e.typography.size.s2 - 1,
  textAlign: "center",
  color: e.textColor
})), TI = ts.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.regular,
  fontSize: e.typography.size.s2 - 1,
  textAlign: "center",
  color: e.textMutedColor
})), $1 = /* @__PURE__ */ a(({ title: e, description: t, footer: r }) => /* @__PURE__ */ es.createElement(FI, null, /* @__PURE__ */ es.createElement(
kI, null, /* @__PURE__ */ es.createElement(LI, null, e), t && /* @__PURE__ */ es.createElement(TI, null, t)), r), "EmptyTabContent");

// src/components/components/tabs/tabs.helpers.tsx
import BI, { Children as II } from "react";
import { styled as MI } from "@storybook/core/theming";
var j1 = MI.div(
  ({ active: e }) => e ? { display: "block" } : { display: "none" }
), c4 = /* @__PURE__ */ a((e) => II.toArray(e).map(
  // @ts-expect-error (non strict)
  ({
    props: { title: t, id: r, color: n, children: o }
  }) => {
    let i = Array.isArray(
      o
    ) ? o[0] : o;
    return {
      title: t,
      id: r,
      ...n ? { color: n } : {},
      render: typeof i == "function" ? i : ({ active: u }) => /* @__PURE__ */ BI.createElement(j1, { active: u, role: "tabpanel" }, i)
    };
  }
), "childrenToList");

// src/components/components/tabs/tabs.hooks.tsx
import cn, { useCallback as p4, useLayoutEffect as _I, useRef as rs, useState as V1 } from "react";
import { sanitize as PI } from "@storybook/core/csf";
import { styled as d4 } from "@storybook/core/theming";
Zl();
var HI = d4.span(({ theme: e, isActive: t }) => ({
  display: "inline-block",
  width: 0,
  height: 0,
  marginLeft: 8,
  color: t ? e.color.secondary : e.color.mediumdark,
  borderRight: "3px solid transparent",
  borderLeft: "3px solid transparent",
  borderTop: "3px solid",
  transition: "transform .1s ease-out"
})), zI = d4(un)(({ active: e, theme: t, preActive: r }) => `
    color: ${r || e ? t.barSelectedColor : t.barTextColor};
    .addon-collapsible-icon {
      color: ${r || e ? t.barSelectedColor : t.barTextColor};
    }
    &:hover {
      color: ${t.barHoverColor};
      .addon-collapsible-icon {
        color: ${t.barHoverColor};
      }
    }
  `);
function f4(e) {
  let t = rs(), r = rs(), n = rs(/* @__PURE__ */ new Map()), { width: o = 1 } = _l({
    // @ts-expect-error (non strict)
    ref: t
  }), [i, l] = V1(e), [u, c] = V1([]), p = rs(e), d = p4(
    ({
      menuName: f,
      actions: v
    }) => {
      let b = u.some(({ active: y }) => y), [m, g] = V1(!1);
      return /* @__PURE__ */ cn.createElement(cn.Fragment, null, /* @__PURE__ */ cn.createElement(
        I1,
        {
          interactive: !0,
          visible: m,
          onVisibleChange: g,
          placement: "bottom",
          delayHide: 100,
          tooltip: /* @__PURE__ */ cn.createElement(
            P1,
            {
              links: u.map(({ title: y, id: w, color: D, active: x }) => ({
                id: w,
                title: y,
                color: D,
                active: x,
                onClick: /* @__PURE__ */ a((C) => {
                  C.preventDefault(), v.onSelect(w);
                }, "onClick")
              }))
            }
          )
        },
        /* @__PURE__ */ cn.createElement(
          zI,
          {
            ref: r,
            active: b,
            preActive: m,
            style: { visibility: u.length ? "visible" : "hidden" },
            "aria-hidden": !u.length,
            className: "tabbutton",
            type: "button",
            role: "tab"
          },
          f,
          /* @__PURE__ */ cn.createElement(
            HI,
            {
              className: "addon-collapsible-icon",
              isActive: b || m
            }
          )
        )
      ), u.map(({ title: y, id: w, color: D }, x) => {
        let C = `index-${x}`;
        return /* @__PURE__ */ cn.createElement(
          un,
          {
            id: `tabbutton-${PI(w) ?? C}`,
            style: { visibility: "hidden" },
            "aria-hidden": !0,
            tabIndex: -1,
            ref: (E) => {
              n.current.set(w, E);
            },
            className: "tabbutton",
            type: "button",
            key: w,
            textColor: D,
            role: "tab"
          },
          y
        );
      }));
    },
    [u]
  ), h = p4(() => {
    if (!t.current || !r.current)
      return;
    let { x: f, width: v } = t.current.getBoundingClientRect(), { width: b } = r.current.getBoundingClientRect(), m = u.length ? f + v - b :
    f + v, g = [], y = 0, w = e.filter((D) => {
      let { id: x } = D, C = n.current.get(x), { width: E = 0 } = C?.getBoundingClientRect() || {}, R = f + y + E > m;
      return (!R || !C) && g.push(D), y += E, R;
    });
    (g.length !== i.length || p.current !== e) && (l(g), c(w), p.current = e);
  }, [u.length, e, i]);
  return _I(h, [h, o]), {
    tabRefs: n,
    addonsRef: r,
    tabBarRef: t,
    visibleList: i,
    invisibleList: u,
    AddonTab: d
  };
}
a(f4, "useList");

// src/components/components/tabs/tabs.tsx
var VI = "/* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */", WI = q1.div(
  ({ theme: e, bordered: t }) => t ? {
    backgroundClip: "padding-box",
    border: `1px solid ${e.appBorderColor}`,
    borderRadius: e.appBorderRadius,
    overflow: "hidden",
    boxSizing: "border-box"
  } : {},
  ({ absolute: e }) => e ? {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column"
  } : {
    display: "block"
  }
), U1 = q1.div({
  overflow: "hidden",
  "&:first-of-type": {
    marginLeft: -3
  },
  whiteSpace: "nowrap",
  flexGrow: 1
});
U1.displayName = "TabBar";
var qI = q1.div(
  {
    display: "block",
    position: "relative"
  },
  ({ theme: e }) => ({
    fontSize: e.typography.size.s2 - 1,
    background: e.background.content
  }),
  ({ bordered: e, theme: t }) => e ? {
    borderRadius: `0 0 ${t.appBorderRadius - 1}px ${t.appBorderRadius - 1}px`
  } : {},
  ({ absolute: e, bordered: t }) => e ? {
    height: `calc(100% - ${t ? 42 : 40}px)`,
    position: "absolute",
    left: 0 + (t ? 1 : 0),
    right: 0 + (t ? 1 : 0),
    bottom: 0 + (t ? 1 : 0),
    top: 40 + (t ? 1 : 0),
    overflow: "auto",
    [`& > *:first-child${VI}`]: {
      position: "absolute",
      left: 0 + (t ? 1 : 0),
      right: 0 + (t ? 1 : 0),
      bottom: 0 + (t ? 1 : 0),
      top: 0 + (t ? 1 : 0),
      height: `calc(100% - ${t ? 2 : 0}px)`,
      overflow: "auto"
    }
  } : {}
), UI = /* @__PURE__ */ a(({ active: e, render: t, children: r }) => /* @__PURE__ */ yt.createElement(j1, { active: e }, t ? t() : r), "TabW\
rapper");
var G1 = NI(
  ({
    children: e,
    selected: t = null,
    actions: r,
    absolute: n = !1,
    bordered: o = !1,
    tools: i = null,
    backgroundColor: l,
    id: u = null,
    menuName: c = "Tabs",
    emptyState: p,
    showToolsWhenEmpty: d
  }) => {
    let h = $I(
      () => c4(e).map((y, w) => ({
        ...y,
        active: t ? y.id === t : w === 0
      })),
      [e, t]
    ), { visibleList: f, tabBarRef: v, tabRefs: b, AddonTab: m } = f4(h), g = p ?? /* @__PURE__ */ yt.createElement($1, { title: "Nothing fo\
und" });
    return !d && h.length === 0 ? g : (
      // @ts-expect-error (non strict)
      /* @__PURE__ */ yt.createElement(WI, { absolute: n, bordered: o, id: u }, /* @__PURE__ */ yt.createElement(Jl, { scrollable: !1, border: !0,
      backgroundColor: l }, /* @__PURE__ */ yt.createElement(U1, { style: { whiteSpace: "normal" }, ref: v, role: "tablist" }, f.map(({ title: y,
      id: w, active: D, color: x }, C) => {
        let E = `index-${C}`;
        return /* @__PURE__ */ yt.createElement(
          un,
          {
            id: `tabbutton-${jI(w) ?? E}`,
            ref: (R) => {
              b.current.set(w, R);
            },
            className: `tabbutton ${D ? "tabbutton-active" : ""}`,
            type: "button",
            key: w,
            active: D,
            textColor: x,
            onClick: (R) => {
              R.preventDefault(), r.onSelect(w);
            },
            role: "tab"
          },
          typeof y == "function" ? /* @__PURE__ */ yt.createElement("title", null) : y
        );
      }), /* @__PURE__ */ yt.createElement(m, { menuName: c, actions: r })), i), /* @__PURE__ */ yt.createElement(qI, { id: "panel-tab-conte\
nt", bordered: o, absolute: n }, h.length ? h.map(({ id: y, active: w, render: D }) => yt.createElement(D, { key: y, active: w }, null)) : g))
    );
  }
);
G1.displayName = "Tabs";
var ns = class ns extends OI {
  constructor(r) {
    super(r);
    this.handlers = {
      onSelect: /* @__PURE__ */ a((r) => this.setState({ selected: r }), "onSelect")
    };
    this.state = {
      selected: r.initial
    };
  }
  render() {
    let { bordered: r = !1, absolute: n = !1, children: o, backgroundColor: i, menuName: l } = this.props, { selected: u } = this.state;
    return /* @__PURE__ */ yt.createElement(
      G1,
      {
        bordered: r,
        absolute: n,
        selected: u,
        backgroundColor: i,
        menuName: l,
        actions: this.handlers
      },
      o
    );
  }
};
a(ns, "TabsState"), ns.defaultProps = {
  children: [],
  // @ts-expect-error (non strict)
  initial: null,
  absolute: !1,
  bordered: !1,
  backgroundColor: "",
  // @ts-expect-error (non strict)
  menuName: void 0
};
var W1 = ns;

// src/components/components/bar/separator.tsx
import h4, { Fragment as GI } from "react";
import { styled as YI } from "@storybook/core/theming";
var Y1 = YI.span(
  ({ theme: e }) => ({
    width: 1,
    height: 20,
    background: e.appBorderColor,
    marginLeft: 2,
    marginRight: 2
  }),
  ({ force: e }) => e ? {} : {
    "& + &": {
      display: "none"
    }
  }
);
Y1.displayName = "Separator";
var XI = /* @__PURE__ */ a((e) => e.reduce(
  (t, r, n) => r ? /* @__PURE__ */ h4.createElement(GI, { key: r.id || r.key || `f-${n}` }, t, n > 0 ? /* @__PURE__ */ h4.createElement(Y1, {
  key: `s-${n}` }) : null, r.render() || r) : t,
  null
), "interleaveSeparators");

// src/components/components/addon-panel/addon-panel.tsx
import KI, { useEffect as ZI, useRef as JI } from "react";
var QI = /* @__PURE__ */ a((e) => {
  let t = JI();
  return ZI(() => {
    t.current = e;
  }, [e]), t.current;
}, "usePrevious"), eM = /* @__PURE__ */ a((e, t) => {
  let r = QI(t);
  return e ? t : r;
}, "useUpdate"), tM = /* @__PURE__ */ a(({ active: e, children: t }) => (
  // the hidden attribute is an valid html element that's both accessible and works to visually hide content
  /* @__PURE__ */ KI.createElement("div", { hidden: !e }, eM(e, t))
), "AddonPanel");

// src/components/components/icon/icon.tsx
import X1, { memo as rM } from "react";
import { styled as nM } from "@storybook/core/theming";
import { deprecate as oM, logger as aM } from "@storybook/core/client-logger";
var iM = Nu, lM = nM.svg`
  display: inline-block;
  shape-rendering: inherit;
  vertical-align: middle;
  fill: currentColor;
  path {
    fill: currentColor;
  }
`, sM = /* @__PURE__ */ a(({
  icon: e,
  useSymbol: t,
  __suppressDeprecationWarning: r = !1,
  ...n
}) => {
  r || oM(
    `Use of the deprecated Icons ${`(${e})` || ""} component detected. Please use the @storybook/icons component directly. For more informat\
ions, see the migration notes at https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#icons-is-deprecated`
  );
  let o = os[e] || null;
  if (!o)
    return aM.warn(
      `Use of an unknown prop ${`(${e})` || ""} in the Icons component. The Icons component is deprecated. Please use the @storybook/icons c\
omponent directly. For more informations, see the migration notes at https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#icons-i\
s-deprecated`
    ), null;
  let i = iM[o];
  return /* @__PURE__ */ X1.createElement(i, { ...n });
}, "Icons"), uM = rM(/* @__PURE__ */ a(function({ icons: t = Object.keys(os) }) {
  return /* @__PURE__ */ X1.createElement(
    lM,
    {
      viewBox: "0 0 14 14",
      style: { position: "absolute", width: 0, height: 0 },
      "data-chromatic": "ignore"
    },
    t.map((r) => /* @__PURE__ */ X1.createElement("symbol", { id: `icon--${r}`, key: r }, os[r]))
  );
}, "Symbols")), os = {
  user: "UserIcon",
  useralt: "UserAltIcon",
  useradd: "UserAddIcon",
  users: "UsersIcon",
  profile: "ProfileIcon",
  facehappy: "FaceHappyIcon",
  faceneutral: "FaceNeutralIcon",
  facesad: "FaceSadIcon",
  accessibility: "AccessibilityIcon",
  accessibilityalt: "AccessibilityAltIcon",
  arrowup: "ChevronUpIcon",
  arrowdown: "ChevronDownIcon",
  arrowleft: "ChevronLeftIcon",
  arrowright: "ChevronRightIcon",
  arrowupalt: "ArrowUpIcon",
  arrowdownalt: "ArrowDownIcon",
  arrowleftalt: "ArrowLeftIcon",
  arrowrightalt: "ArrowRightIcon",
  expandalt: "ExpandAltIcon",
  collapse: "CollapseIcon",
  expand: "ExpandIcon",
  unfold: "UnfoldIcon",
  transfer: "TransferIcon",
  redirect: "RedirectIcon",
  undo: "UndoIcon",
  reply: "ReplyIcon",
  sync: "SyncIcon",
  upload: "UploadIcon",
  download: "DownloadIcon",
  back: "BackIcon",
  proceed: "ProceedIcon",
  refresh: "RefreshIcon",
  globe: "GlobeIcon",
  compass: "CompassIcon",
  location: "LocationIcon",
  pin: "PinIcon",
  time: "TimeIcon",
  dashboard: "DashboardIcon",
  timer: "TimerIcon",
  home: "HomeIcon",
  admin: "AdminIcon",
  info: "InfoIcon",
  question: "QuestionIcon",
  support: "SupportIcon",
  alert: "AlertIcon",
  email: "EmailIcon",
  phone: "PhoneIcon",
  link: "LinkIcon",
  unlink: "LinkBrokenIcon",
  bell: "BellIcon",
  rss: "RSSIcon",
  sharealt: "ShareAltIcon",
  share: "ShareIcon",
  circle: "CircleIcon",
  circlehollow: "CircleHollowIcon",
  bookmarkhollow: "BookmarkHollowIcon",
  bookmark: "BookmarkIcon",
  hearthollow: "HeartHollowIcon",
  heart: "HeartIcon",
  starhollow: "StarHollowIcon",
  star: "StarIcon",
  certificate: "CertificateIcon",
  verified: "VerifiedIcon",
  thumbsup: "ThumbsUpIcon",
  shield: "ShieldIcon",
  basket: "BasketIcon",
  beaker: "BeakerIcon",
  hourglass: "HourglassIcon",
  flag: "FlagIcon",
  cloudhollow: "CloudHollowIcon",
  edit: "EditIcon",
  cog: "CogIcon",
  nut: "NutIcon",
  wrench: "WrenchIcon",
  ellipsis: "EllipsisIcon",
  check: "CheckIcon",
  form: "FormIcon",
  batchdeny: "BatchDenyIcon",
  batchaccept: "BatchAcceptIcon",
  controls: "ControlsIcon",
  plus: "PlusIcon",
  closeAlt: "CloseAltIcon",
  cross: "CrossIcon",
  trash: "TrashIcon",
  pinalt: "PinAltIcon",
  unpin: "UnpinIcon",
  add: "AddIcon",
  subtract: "SubtractIcon",
  close: "CloseIcon",
  delete: "DeleteIcon",
  passed: "PassedIcon",
  changed: "ChangedIcon",
  failed: "FailedIcon",
  clear: "ClearIcon",
  comment: "CommentIcon",
  commentadd: "CommentAddIcon",
  requestchange: "RequestChangeIcon",
  comments: "CommentsIcon",
  lock: "LockIcon",
  unlock: "UnlockIcon",
  key: "KeyIcon",
  outbox: "OutboxIcon",
  credit: "CreditIcon",
  button: "ButtonIcon",
  type: "TypeIcon",
  pointerdefault: "PointerDefaultIcon",
  pointerhand: "PointerHandIcon",
  browser: "BrowserIcon",
  tablet: "TabletIcon",
  mobile: "MobileIcon",
  watch: "WatchIcon",
  sidebar: "SidebarIcon",
  sidebaralt: "SidebarAltIcon",
  sidebaralttoggle: "SidebarAltToggleIcon",
  sidebartoggle: "SidebarToggleIcon",
  bottombar: "BottomBarIcon",
  bottombartoggle: "BottomBarToggleIcon",
  cpu: "CPUIcon",
  database: "DatabaseIcon",
  memory: "MemoryIcon",
  structure: "StructureIcon",
  box: "BoxIcon",
  power: "PowerIcon",
  photo: "PhotoIcon",
  component: "ComponentIcon",
  grid: "GridIcon",
  outline: "OutlineIcon",
  photodrag: "PhotoDragIcon",
  search: "SearchIcon",
  zoom: "ZoomIcon",
  zoomout: "ZoomOutIcon",
  zoomreset: "ZoomResetIcon",
  eye: "EyeIcon",
  eyeclose: "EyeCloseIcon",
  lightning: "LightningIcon",
  lightningoff: "LightningOffIcon",
  contrast: "ContrastIcon",
  switchalt: "SwitchAltIcon",
  mirror: "MirrorIcon",
  grow: "GrowIcon",
  paintbrush: "PaintBrushIcon",
  ruler: "RulerIcon",
  stop: "StopIcon",
  camera: "CameraIcon",
  video: "VideoIcon",
  speaker: "SpeakerIcon",
  play: "PlayIcon",
  playback: "PlayBackIcon",
  playnext: "PlayNextIcon",
  rewind: "RewindIcon",
  fastforward: "FastForwardIcon",
  stopalt: "StopAltIcon",
  sidebyside: "SideBySideIcon",
  stacked: "StackedIcon",
  sun: "SunIcon",
  moon: "MoonIcon",
  book: "BookIcon",
  document: "DocumentIcon",
  copy: "CopyIcon",
  category: "CategoryIcon",
  folder: "FolderIcon",
  print: "PrintIcon",
  graphline: "GraphLineIcon",
  calendar: "CalendarIcon",
  graphbar: "GraphBarIcon",
  menu: "MenuIcon",
  menualt: "MenuIcon",
  filter: "FilterIcon",
  docchart: "DocChartIcon",
  doclist: "DocListIcon",
  markup: "MarkupIcon",
  bold: "BoldIcon",
  paperclip: "PaperClipIcon",
  listordered: "ListOrderedIcon",
  listunordered: "ListUnorderedIcon",
  paragraph: "ParagraphIcon",
  markdown: "MarkdownIcon",
  repository: "RepoIcon",
  commit: "CommitIcon",
  branch: "BranchIcon",
  pullrequest: "PullRequestIcon",
  merge: "MergeIcon",
  apple: "AppleIcon",
  linux: "LinuxIcon",
  ubuntu: "UbuntuIcon",
  windows: "WindowsIcon",
  storybook: "StorybookIcon",
  azuredevops: "AzureDevOpsIcon",
  bitbucket: "BitbucketIcon",
  chrome: "ChromeIcon",
  chromatic: "ChromaticIcon",
  componentdriven: "ComponentDrivenIcon",
  discord: "DiscordIcon",
  facebook: "FacebookIcon",
  figma: "FigmaIcon",
  gdrive: "GDriveIcon",
  github: "GithubIcon",
  gitlab: "GitlabIcon",
  google: "GoogleIcon",
  graphql: "GraphqlIcon",
  medium: "MediumIcon",
  redux: "ReduxIcon",
  twitter: "TwitterIcon",
  youtube: "YoutubeIcon",
  vscode: "VSCodeIcon"
};

// src/components/brand/StorybookLogo.tsx
import Bt from "react";
var cM = /* @__PURE__ */ a(({ alt: e, ...t }) => /* @__PURE__ */ Bt.createElement("svg", { width: "200px", height: "40px", viewBox: "0 0 200\
 40", ...t, role: "img" }, e ? /* @__PURE__ */ Bt.createElement("title", null, e) : null, /* @__PURE__ */ Bt.createElement("defs", null, /* @__PURE__ */ Bt.
createElement(
  "path",
  {
    d: "M1.2 36.9L0 3.9c0-1.1.8-2 1.9-2.1l28-1.8a2 2 0 0 1 2.2 1.9 2 2 0 0 1 0 .1v36a2 2 0 0 1-2 2 2 2 0 0 1-.1 0L3.2 38.8a2 2 0 0 1-2-2z",
    id: "a"
  }
)), /* @__PURE__ */ Bt.createElement("g", { fill: "none", fillRule: "evenodd" }, /* @__PURE__ */ Bt.createElement(
  "path",
  {
    d: "M53.3 31.7c-1.7 0-3.4-.3-5-.7-1.5-.5-2.8-1.1-3.9-2l1.6-3.5c2.2 1.5 4.6 2.3 7.3 2.3 1.5 0 2.5-.2 3.3-.7.7-.5 1.1-1 1.1-1.9 0-.7-.3-1.\
3-1-1.7s-2-.8-3.7-1.2c-2-.4-3.6-.9-4.8-1.5-1.1-.5-2-1.2-2.6-2-.5-1-.8-2-.8-3.2 0-1.4.4-2.6 1.2-3.6.7-1.1 1.8-2 3.2-2.6 1.3-.6 2.9-.9 4.7-.9 \
1.6 0 3.1.3 4.6.7 1.5.5 2.7 1.1 3.5 2l-1.6 3.5c-2-1.5-4.2-2.3-6.5-2.3-1.3 0-2.3.2-3 .8-.8.5-1.2 1.1-1.2 2 0 .5.2 1 .5 1.3.2.3.7.6 1.4.9l2.9.\
8c2.9.6 5 1.4 6.2 2.4a5 5 0 0 1 2 4.2 6 6 0 0 1-2.5 5c-1.7 1.2-4 1.9-7 1.9zm21-3.6l1.4-.1-.2 3.5-1.9.1c-2.4 0-4.1-.5-5.2-1.5-1.1-1-1.6-2.7-1\
.6-4.8v-6h-3v-3.6h3V11h4.8v4.6h4v3.6h-4v6c0 1.8.9 2.8 2.6 2.8zm11.1 3.5c-1.6 0-3-.3-4.3-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6.4-3 1-4.\
3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.3-1 1.7 0 3.2.3 4.4 1a7 7 0 0 1 3 2.8c.6 1.2 1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-2.7 1-4.\
4 1zm0-3.6c2.4 0 3.6-1.6 3.6-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.6-1c-2.3 0-3.5 1.4-3.5 4.4 0 3 1.2 4.6 3.5 4.6zm21.7-8.8l-2.7.3c-1.3.2-2\
.3.5-2.8 1.2-.6.6-.9 1.4-.9 2.5v8.2H96V15.7h4.6v2.6c.8-1.8 2.5-2.8 5-3h1.3l.3 4zm14-3.5h4.8L116.4 37h-4.9l3-6.6-6.4-14.8h5l4 10 4-10zm16-.4c\
1.4 0 2.6.3 3.6 1 1 .6 1.9 1.6 2.5 2.8.6 1.2.9 2.7.9 4.3 0 1.6-.3 3-1 4.3a6.9 6.9 0 0 1-2.4 2.9c-1 .7-2.2 1-3.6 1-1 0-2-.2-3-.7-.8-.4-1.5-1-\
2-1.9v2.4h-4.7V8.8h4.8v9c.5-.8 1.2-1.4 2-1.9.9-.4 1.8-.6 3-.6zM135.7 28c1.1 0 2-.4 2.6-1.2.6-.8 1-2 1-3.4 0-1.5-.4-2.5-1-3.3s-1.5-1.1-2.6-1.\
1-2 .3-2.6 1.1c-.6.8-1 2-1 3.3 0 1.5.4 2.6 1 3.4.6.8 1.5 1.2 2.6 1.2zm18.9 3.6c-1.7 0-3.2-.3-4.4-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6\
.4-3 1-4.3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.4-1 1.6 0 3 .3 4.3 1a7 7 0 0 1 3 2.8c.6 1.2 1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-\
2.7 1-4.3 1zm0-3.6c2.3 0 3.5-1.6 3.5-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.5-1c-2.4 0-3.6 1.4-3.6 4.4 0 3 1.2 4.6 3.6 4.6zm18 3.6c-1.7 0-3.\
2-.3-4.4-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6.4-3 1-4.3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.4-1 1.6 0 3 .3 4.4 1a7 7 0 0 1 2.9 2.8c.6 1.2 \
1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-2.7 1-4.3 1zm0-3.6c2.3 0 3.5-1.6 3.5-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.5-1c-2.4 0\
-3.6 1.4-3.6 4.4 0 3 1.2 4.6 3.6 4.6zm27.4 3.4h-6l-6-7v7h-4.8V8.8h4.9v13.6l5.8-6.7h5.7l-6.6 7.5 7 8.2z",
    fill: "currentColor"
  }
), /* @__PURE__ */ Bt.createElement("mask", { id: "b", fill: "#fff" }, /* @__PURE__ */ Bt.createElement("use", { xlinkHref: "#a" })), /* @__PURE__ */ Bt.
createElement("use", { fill: "#FF4785", fillRule: "nonzero", xlinkHref: "#a" }), /* @__PURE__ */ Bt.createElement(
  "path",
  {
    d: "M23.7 5L24 .2l3.9-.3.1 4.8a.3.3 0 0 1-.5.2L26 3.8l-1.7 1.4a.3.3 0 0 1-.5-.3zm-5 10c0 .9 5.3.5 6 0 0-5.4-2.8-8.2-8-8.2-5.3 0-8.2 2.8-\
8.2 7.1 0 7.4 10 7.6 10 11.6 0 1.2-.5 1.9-1.8 1.9-1.6 0-2.2-.9-2.1-3.6 0-.6-6.1-.8-6.3 0-.5 6.7 3.7 8.6 8.5 8.6 4.6 0 8.3-2.5 8.3-7 0-7.9-10\
.2-7.7-10.2-11.6 0-1.6 1.2-1.8 2-1.8.6 0 2 0 1.9 3z",
    fill: "#FFF",
    fillRule: "nonzero",
    mask: "url(#b)"
  }
))), "StorybookLogo");

// src/components/brand/StorybookIcon.tsx
import ea from "react";
var pM = /* @__PURE__ */ a((e) => /* @__PURE__ */ ea.createElement("svg", { viewBox: "0 0 64 64", ...e }, /* @__PURE__ */ ea.createElement("\
title", null, "Storybook icon"), /* @__PURE__ */ ea.createElement("g", { id: "Artboard", stroke: "none", strokeWidth: "1", fill: "none", fillRule: "\
evenodd" }, /* @__PURE__ */ ea.createElement(
  "path",
  {
    d: "M8.04798541,58.7875918 L6.07908839,6.32540407 C6.01406344,4.5927838 7.34257463,3.12440831 9.07303814,3.01625434 L53.6958037,0.227331\
489 C55.457209,0.117243658 56.974354,1.45590096 57.0844418,3.21730626 C57.0885895,3.28366922 57.0906648,3.35014546 57.0906648,3.41663791 L57\
.0906648,60.5834697 C57.0906648,62.3483119 55.6599776,63.7789992 53.8951354,63.7789992 C53.847325,63.7789992 53.7995207,63.7779262 53.751758\
5,63.775781 L11.0978899,61.8600599 C9.43669044,61.7854501 8.11034889,60.4492961 8.04798541,58.7875918 Z",
    id: "path-1",
    fill: "#FF4785",
    fillRule: "nonzero"
  }
), /* @__PURE__ */ ea.createElement(
  "path",
  {
    d: "M35.9095005,24.1768792 C35.9095005,25.420127 44.2838488,24.8242707 45.4080313,23.9509748 C45.4080313,15.4847538 40.8652557,11.035887\
8 32.5466666,11.0358878 C24.2280775,11.0358878 19.5673077,15.553972 19.5673077,22.3311017 C19.5673077,34.1346028 35.4965208,34.3605071 35.49\
65208,40.7987804 C35.4965208,42.606015 34.6115646,43.6790606 32.6646607,43.6790606 C30.127786,43.6790606 29.1248356,42.3834613 29.2428298,37\
.9783269 C29.2428298,37.0226907 19.5673077,36.7247626 19.2723223,37.9783269 C18.5211693,48.6535354 25.1720308,51.7326752 32.7826549,51.73267\
52 C40.1572906,51.7326752 45.939005,47.8018145 45.939005,40.6858282 C45.939005,28.035186 29.7738035,28.3740425 29.7738035,22.1051974 C29.773\
8035,19.5637737 31.6617103,19.2249173 32.7826549,19.2249173 C33.9625966,19.2249173 36.0864917,19.4328883 35.9095005,24.1768792 Z",
    id: "path9_fill-path",
    fill: "#FFFFFF",
    fillRule: "nonzero"
  }
), /* @__PURE__ */ ea.createElement(
  "path",
  {
    d: "M44.0461638,0.830433986 L50.1874092,0.446606143 L50.443532,7.7810017 C50.4527198,8.04410717 50.2468789,8.26484453 49.9837734,8.27403\
237 C49.871115,8.27796649 49.7607078,8.24184808 49.6721567,8.17209069 L47.3089847,6.3104681 L44.5110468,8.43287463 C44.3012992,8.591981 44.0\
022839,8.55092814 43.8431776,8.34118051 C43.7762017,8.25288717 43.742082,8.14401677 43.7466857,8.03329059 L44.0461638,0.830433986 Z",
    id: "Path",
    fill: "#FFFFFF"
  }
))), "StorybookIcon");

// src/components/components/Loader/Loader.tsx
import Kt from "react";
import { keyframes as fM, styled as pn } from "@storybook/core/theming";

// src/components/components/shared/animation.ts
import { keyframes as dM } from "@storybook/core/theming";
var m4 = dM`
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
`;

// src/components/components/Loader/Loader.tsx
var hM = pn.div(({ size: e = 32 }) => ({
  borderRadius: "50%",
  cursor: "progress",
  display: "inline-block",
  overflow: "hidden",
  position: "absolute",
  transition: "all 200ms ease-out",
  verticalAlign: "top",
  top: "50%",
  left: "50%",
  marginTop: -(e / 2),
  marginLeft: -(e / 2),
  height: e,
  width: e,
  zIndex: 4,
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "rgba(97, 97, 97, 0.29)",
  borderTopColor: "rgb(100,100,100)",
  animation: `${m4} 0.7s linear infinite`,
  mixBlendMode: "difference"
})), g4 = pn.div({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%"
}), mM = pn.div(({ theme: e }) => ({
  position: "relative",
  width: "80%",
  marginBottom: "0.75rem",
  maxWidth: 300,
  height: 5,
  borderRadius: 5,
  background: Te(0.8, e.color.secondary),
  overflow: "hidden",
  cursor: "progress"
})), gM = pn.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  background: e.color.secondary
})), v4 = pn.div(({ theme: e }) => ({
  minHeight: "2em",
  fontSize: `${e.typography.size.s1}px`,
  color: e.textMutedColor
})), vM = pn(Hu)(({ theme: e }) => ({
  width: 20,
  height: 20,
  marginBottom: "0.5rem",
  color: e.textMutedColor
})), wM = fM`
  from { content: "..." }
  33% { content: "." }
  66% { content: ".." }
  to { content: "..." }
`, bM = pn.span({
  "&::after": {
    content: "'...'",
    animation: `${wM} 1s linear infinite`,
    animationDelay: "1s",
    display: "inline-block",
    width: "1em",
    height: "auto"
  }
}), yM = /* @__PURE__ */ a(({ progress: e, error: t, size: r, ...n }) => {
  if (t)
    return /* @__PURE__ */ Kt.createElement(g4, { "aria-label": t.toString(), "aria-live": "polite", role: "status", ...n }, /* @__PURE__ */ Kt.
    createElement(vM, null), /* @__PURE__ */ Kt.createElement(v4, null, t.message));
  if (e) {
    let { value: o, modules: i } = e, { message: l } = e;
    return i && (l += ` ${i.complete} / ${i.total} modules`), /* @__PURE__ */ Kt.createElement(
      g4,
      {
        "aria-label": "Content is loading...",
        "aria-live": "polite",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": o * 100,
        "aria-valuetext": l,
        role: "progressbar",
        ...n
      },
      /* @__PURE__ */ Kt.createElement(mM, null, /* @__PURE__ */ Kt.createElement(gM, { style: { width: `${o * 100}%` } })),
      /* @__PURE__ */ Kt.createElement(v4, null, l, o < 1 && /* @__PURE__ */ Kt.createElement(bM, { key: l }))
    );
  }
  return /* @__PURE__ */ Kt.createElement(
    hM,
    {
      "aria-label": "Content is loading...",
      "aria-live": "polite",
      role: "status",
      size: r,
      ...n
    }
  );
}, "Loader");

// src/components/components/ProgressSpinner/ProgressSpinner.tsx
import yr from "react";
import { keyframes as DM, styled as b4 } from "@storybook/core/theming";
var K1 = "http://www.w3.org/2000/svg", xM = DM({
  "0%": {
    transform: "rotate(0deg)"
  },
  "100%": {
    transform: "rotate(360deg)"
  }
}), w4 = b4.div(({ size: e }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  minWidth: e,
  minHeight: e
})), Z1 = b4.svg(
  ({ size: e, width: t }) => ({
    position: "absolute",
    width: `${e}px!important`,
    height: `${e}px!important`,
    transform: "rotate(-90deg)",
    circle: {
      r: (e - Math.ceil(t)) / 2,
      cx: e / 2,
      cy: e / 2,
      opacity: 0.15,
      fill: "transparent",
      stroke: "currentColor",
      strokeWidth: t,
      strokeLinecap: "round",
      strokeDasharray: Math.PI * (e - Math.ceil(t))
    }
  }),
  ({ progress: e }) => e && {
    circle: {
      opacity: 0.75
    }
  },
  ({ spinner: e }) => e && {
    animation: `${xM} 1s linear infinite`,
    circle: {
      opacity: 0.25
    }
  }
), CM = /* @__PURE__ */ a(({
  percentage: e = void 0,
  running: t = !0,
  size: r = 24,
  width: n = 1.5,
  children: o = null,
  ...i
}) => typeof e == "number" ? /* @__PURE__ */ yr.createElement(w4, { size: r, ...i }, o, /* @__PURE__ */ yr.createElement(Z1, { size: r, width: n,
xmlns: K1 }, /* @__PURE__ */ yr.createElement("circle", null)), t && /* @__PURE__ */ yr.createElement(Z1, { size: r, width: n, xmlns: K1, spinner: !0 },
/* @__PURE__ */ yr.createElement("circle", { strokeDashoffset: Math.PI * (r - Math.ceil(n)) * (1 - e / 100) })), /* @__PURE__ */ yr.createElement(
Z1, { size: r, width: n, xmlns: K1, progress: !0 }, /* @__PURE__ */ yr.createElement("circle", { strokeDashoffset: Math.PI * (r - Math.ceil(
n)) * (1 - e / 100) }))) : /* @__PURE__ */ yr.createElement(w4, { size: r, ...i }, o), "ProgressSpinner");

// src/components/components/utils/getStoryHref.ts
function EM(e) {
  let t = {}, r = e.split("&");
  for (let n = 0; n < r.length; n++) {
    let o = r[n].split("=");
    t[decodeURIComponent(o[0])] = decodeURIComponent(o[1] || "");
  }
  return t;
}
a(EM, "parseQuery");
var RM = /* @__PURE__ */ a((e, t, r = {}) => {
  let [n, o] = e.split("?"), i = o ? {
    ...EM(o),
    ...r,
    id: t
  } : {
    ...r,
    id: t
  };
  return `${n}?${Object.entries(i).map((l) => `${l[0]}=${l[1]}`).join("&")}`;
}, "getStoryHref");

// src/components/components/clipboard/ClipboardCode.tsx
import SM from "react";
import { color as AM, styled as FM, typography as y4 } from "@storybook/core/theming";
var kM = FM.pre`
  line-height: 18px;
  padding: 11px 1rem;
  white-space: pre-wrap;
  background: rgba(0, 0, 0, 0.05);
  color: ${AM.darkest};
  border-radius: 3px;
  margin: 1rem 0;
  width: 100%;
  display: block;
  overflow: hidden;
  font-family: ${y4.fonts.mono};
  font-size: ${y4.size.s2 - 1}px;
`, LM = /* @__PURE__ */ a(({ code: e, ...t }) => /* @__PURE__ */ SM.createElement(kM, { id: "clipboard-code", ...t }, e), "ClipboardCode");

// src/components/index.ts
var HJ = Pu, IM = {};
Object.keys(Pu).forEach((e) => {
  IM[e] = BM((t, r) => TM(e, { ...t, ref: r }));
});
export {
  vs as A,
  lu as ActionBar,
  tM as AddonPanel,
  $b as Badge,
  O1 as Bar,
  ws as Blockquote,
  zo as Button,
  LM as ClipboardCode,
  vu as Code,
  wu as DL,
  bu as Div,
  mx as DocumentWrapper,
  $1 as EmptyTabContent,
  AT as ErrorFormatter,
  Jl as FlexBar,
  YT as Form,
  yu as H1,
  Du as H2,
  xu as H3,
  Cu as H4,
  Eu as H5,
  Ru as H6,
  Su as HR,
  Ml as IconButton,
  AI as IconButtonSkeleton,
  sM as Icons,
  Au as Img,
  Fu as LI,
  ju as Link,
  _1 as ListItem,
  yM as Loader,
  JL as Modal,
  ku as OL,
  Lu as P,
  sT as Placeholder,
  Tu as Pre,
  CM as ProgressSpinner,
  vp as ResetWrapper,
  Sn as ScrollArea,
  Y1 as Separator,
  nT as Spaced,
  Bu as Span,
  pM as StorybookIcon,
  cM as StorybookLogo,
  uM as Symbols,
  yg as SyntaxHighlighter,
  Iu as TT,
  U1 as TabBar,
  un as TabButton,
  UI as TabWrapper,
  Mu as Table,
  G1 as Tabs,
  W1 as TabsState,
  P1 as TooltipLinkList,
  QB as TooltipMessage,
  nI as TooltipNote,
  _u as UL,
  qB as WithTooltip,
  GB as WithTooltipPure,
  bT as Zoom,
  It as codeCommon,
  HJ as components,
  mu as createCopyToClipboardFunction,
  RM as getStoryHref,
  os as icons,
  XI as interleaveSeparators,
  te as nameSpaceClassNames,
  IM as resetComponents,
  V as withReset
};
