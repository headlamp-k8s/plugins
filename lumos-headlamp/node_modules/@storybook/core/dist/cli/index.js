import ESM_COMPAT_Module from "node:module";
import { fileURLToPath as ESM_COMPAT_fileURLToPath } from 'node:url';
import { dirname as ESM_COMPAT_dirname } from 'node:path';
const __filename = ESM_COMPAT_fileURLToPath(import.meta.url);
const __dirname = ESM_COMPAT_dirname(__filename);
const require = ESM_COMPAT_Module.createRequire(import.meta.url);
var q0 = Object.create;
var Vs = Object.defineProperty;
var M0 = Object.getOwnPropertyDescriptor;
var j0 = Object.getOwnPropertyNames;
var I0 = Object.getPrototypeOf, L0 = Object.prototype.hasOwnProperty;
var n = (e, t) => Vs(e, "name", { value: t, configurable: !0 }), E = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(e, {
  get: (t, r) => (typeof require < "u" ? require : t)[r]
}) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var b = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var N0 = (e, t, r, i) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let s of j0(t))
      !L0.call(e, s) && s !== r && Vs(e, s, { get: () => t[s], enumerable: !(i = M0(t, s)) || i.enumerable });
  return e;
};
var be = (e, t, r) => (r = e != null ? q0(I0(e)) : {}, N0(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? Vs(r, "default", { value: e, enumerable: !0 }) : r,
  e
));

// ../node_modules/prompts/node_modules/kleur/index.js
var ue = b((B8, Xl) => {
  "use strict";
  var { FORCE_COLOR: K0, NODE_DISABLE_COLORS: X0, TERM: Q0 } = process.env, Y = {
    enabled: !X0 && Q0 !== "dumb" && K0 !== "0",
    // modifiers
    reset: K(0, 0),
    bold: K(1, 22),
    dim: K(2, 22),
    italic: K(3, 23),
    underline: K(4, 24),
    inverse: K(7, 27),
    hidden: K(8, 28),
    strikethrough: K(9, 29),
    // colors
    black: K(30, 39),
    red: K(31, 39),
    green: K(32, 39),
    yellow: K(33, 39),
    blue: K(34, 39),
    magenta: K(35, 39),
    cyan: K(36, 39),
    white: K(37, 39),
    gray: K(90, 39),
    grey: K(90, 39),
    // background colors
    bgBlack: K(40, 49),
    bgRed: K(41, 49),
    bgGreen: K(42, 49),
    bgYellow: K(43, 49),
    bgBlue: K(44, 49),
    bgMagenta: K(45, 49),
    bgCyan: K(46, 49),
    bgWhite: K(47, 49)
  };
  function Kl(e, t) {
    let r = 0, i, s = "", o = "";
    for (; r < e.length; r++)
      i = e[r], s += i.open, o += i.close, t.includes(i.close) && (t = t.replace(i.rgx, i.close + i.open));
    return s + t + o;
  }
  n(Kl, "run");
  function Z0(e, t) {
    let r = { has: e, keys: t };
    return r.reset = Y.reset.bind(r), r.bold = Y.bold.bind(r), r.dim = Y.dim.bind(r), r.italic = Y.italic.bind(r), r.underline = Y.underline.
    bind(r), r.inverse = Y.inverse.bind(r), r.hidden = Y.hidden.bind(r), r.strikethrough = Y.strikethrough.bind(r), r.black = Y.black.bind(r),
    r.red = Y.red.bind(r), r.green = Y.green.bind(r), r.yellow = Y.yellow.bind(r), r.blue = Y.blue.bind(r), r.magenta = Y.magenta.bind(r), r.
    cyan = Y.cyan.bind(r), r.white = Y.white.bind(r), r.gray = Y.gray.bind(r), r.grey = Y.grey.bind(r), r.bgBlack = Y.bgBlack.bind(r), r.bgRed =
    Y.bgRed.bind(r), r.bgGreen = Y.bgGreen.bind(r), r.bgYellow = Y.bgYellow.bind(r), r.bgBlue = Y.bgBlue.bind(r), r.bgMagenta = Y.bgMagenta.
    bind(r), r.bgCyan = Y.bgCyan.bind(r), r.bgWhite = Y.bgWhite.bind(r), r;
  }
  n(Z0, "chain");
  function K(e, t) {
    let r = {
      open: `\x1B[${e}m`,
      close: `\x1B[${t}m`,
      rgx: new RegExp(`\\x1b\\[${t}m`, "g")
    };
    return function(i) {
      return this !== void 0 && this.has !== void 0 ? (this.has.includes(e) || (this.has.push(e), this.keys.push(r)), i === void 0 ? this : Y.
      enabled ? Kl(this.keys, i + "") : i + "") : i === void 0 ? Z0([e], [r]) : Y.enabled ? Kl([r], i + "") : i + "";
    };
  }
  n(K, "init");
  Xl.exports = Y;
});

// ../node_modules/prompts/dist/util/action.js
var Zl = b((O8, Ql) => {
  "use strict";
  Ql.exports = (e, t) => {
    if (!(e.meta && e.name !== "escape")) {
      if (e.ctrl) {
        if (e.name === "a") return "first";
        if (e.name === "c" || e.name === "d") return "abort";
        if (e.name === "e") return "last";
        if (e.name === "g") return "reset";
      }
      if (t) {
        if (e.name === "j") return "down";
        if (e.name === "k") return "up";
      }
      return e.name === "return" || e.name === "enter" ? "submit" : e.name === "backspace" ? "delete" : e.name === "delete" ? "deleteForward" :
      e.name === "abort" ? "abort" : e.name === "escape" ? "exit" : e.name === "tab" ? "next" : e.name === "pagedown" ? "nextPage" : e.name ===
      "pageup" ? "prevPage" : e.name === "home" ? "home" : e.name === "end" ? "end" : e.name === "up" ? "up" : e.name === "down" ? "down" : e.
      name === "right" ? "right" : e.name === "left" ? "left" : !1;
    }
  };
});

// ../node_modules/prompts/dist/util/strip.js
var Ji = b((P8, ef) => {
  "use strict";
  ef.exports = (e) => {
    let t = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"].join("|"), r = new RegExp(t, "g");
    return typeof e == "string" ? e.replace(r, "") : e;
  };
});

// ../node_modules/sisteransi/src/index.js
var le = b((q8, tf) => {
  "use strict";
  var Js = "\x1B", ae = `${Js}[`, ev = "\x07", Ks = {
    to(e, t) {
      return t ? `${ae}${t + 1};${e + 1}H` : `${ae}${e + 1}G`;
    },
    move(e, t) {
      let r = "";
      return e < 0 ? r += `${ae}${-e}D` : e > 0 && (r += `${ae}${e}C`), t < 0 ? r += `${ae}${-t}A` : t > 0 && (r += `${ae}${t}B`), r;
    },
    up: /* @__PURE__ */ n((e = 1) => `${ae}${e}A`, "up"),
    down: /* @__PURE__ */ n((e = 1) => `${ae}${e}B`, "down"),
    forward: /* @__PURE__ */ n((e = 1) => `${ae}${e}C`, "forward"),
    backward: /* @__PURE__ */ n((e = 1) => `${ae}${e}D`, "backward"),
    nextLine: /* @__PURE__ */ n((e = 1) => `${ae}E`.repeat(e), "nextLine"),
    prevLine: /* @__PURE__ */ n((e = 1) => `${ae}F`.repeat(e), "prevLine"),
    left: `${ae}G`,
    hide: `${ae}?25l`,
    show: `${ae}?25h`,
    save: `${Js}7`,
    restore: `${Js}8`
  }, tv = {
    up: /* @__PURE__ */ n((e = 1) => `${ae}S`.repeat(e), "up"),
    down: /* @__PURE__ */ n((e = 1) => `${ae}T`.repeat(e), "down")
  }, rv = {
    screen: `${ae}2J`,
    up: /* @__PURE__ */ n((e = 1) => `${ae}1J`.repeat(e), "up"),
    down: /* @__PURE__ */ n((e = 1) => `${ae}J`.repeat(e), "down"),
    line: `${ae}2K`,
    lineEnd: `${ae}K`,
    lineStart: `${ae}1K`,
    lines(e) {
      let t = "";
      for (let r = 0; r < e; r++)
        t += this.line + (r < e - 1 ? Ks.up() : "");
      return e && (t += Ks.left), t;
    }
  };
  tf.exports = { cursor: Ks, scroll: tv, erase: rv, beep: ev };
});

// ../node_modules/prompts/dist/util/clear.js
var uf = b((j8, of) => {
  "use strict";
  function iv(e, t) {
    var r = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (!r) {
      if (Array.isArray(e) || (r = nv(e)) || t && e && typeof e.length == "number") {
        r && (e = r);
        var i = 0, s = /* @__PURE__ */ n(function() {
        }, "F");
        return { s, n: /* @__PURE__ */ n(function() {
          return i >= e.length ? { done: !0 } : { done: !1, value: e[i++] };
        }, "n"), e: /* @__PURE__ */ n(function(f) {
          throw f;
        }, "e"), f: s };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var o = !0, u = !1, a;
    return { s: /* @__PURE__ */ n(function() {
      r = r.call(e);
    }, "s"), n: /* @__PURE__ */ n(function() {
      var f = r.next();
      return o = f.done, f;
    }, "n"), e: /* @__PURE__ */ n(function(f) {
      u = !0, a = f;
    }, "e"), f: /* @__PURE__ */ n(function() {
      try {
        !o && r.return != null && r.return();
      } finally {
        if (u) throw a;
      }
    }, "f") };
  }
  n(iv, "_createForOfIteratorHelper");
  function nv(e, t) {
    if (e) {
      if (typeof e == "string") return rf(e, t);
      var r = Object.prototype.toString.call(e).slice(8, -1);
      if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
      if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return rf(e, t);
    }
  }
  n(nv, "_unsupportedIterableToArray");
  function rf(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var r = 0, i = new Array(t); r < t; r++) i[r] = e[r];
    return i;
  }
  n(rf, "_arrayLikeToArray");
  var sv = Ji(), sf = le(), nf = sf.erase, ov = sf.cursor, uv = /* @__PURE__ */ n((e) => [...sv(e)].length, "width");
  of.exports = function(e, t) {
    if (!t) return nf.line + ov.to(0);
    let r = 0, i = e.split(/\r?\n/);
    var s = iv(i), o;
    try {
      for (s.s(); !(o = s.n()).done; ) {
        let u = o.value;
        r += 1 + Math.floor(Math.max(uv(u) - 1, 0) / t);
      }
    } catch (u) {
      s.e(u);
    } finally {
      s.f();
    }
    return nf.lines(r);
  };
});

// ../node_modules/prompts/dist/util/figures.js
var Xs = b((L8, af) => {
  "use strict";
  var Ur = {
    arrowUp: "\u2191",
    arrowDown: "\u2193",
    arrowLeft: "\u2190",
    arrowRight: "\u2192",
    radioOn: "\u25C9",
    radioOff: "\u25EF",
    tick: "\u2714",
    cross: "\u2716",
    ellipsis: "\u2026",
    pointerSmall: "\u203A",
    line: "\u2500",
    pointer: "\u276F"
  }, av = {
    arrowUp: Ur.arrowUp,
    arrowDown: Ur.arrowDown,
    arrowLeft: Ur.arrowLeft,
    arrowRight: Ur.arrowRight,
    radioOn: "(*)",
    radioOff: "( )",
    tick: "\u221A",
    cross: "\xD7",
    ellipsis: "...",
    pointerSmall: "\xBB",
    line: "\u2500",
    pointer: ">"
  }, lv = process.platform === "win32" ? av : Ur;
  af.exports = lv;
});

// ../node_modules/prompts/dist/util/style.js
var ff = b((N8, lf) => {
  "use strict";
  var ir = ue(), Mt = Xs(), Qs = Object.freeze({
    password: {
      scale: 1,
      render: /* @__PURE__ */ n((e) => "*".repeat(e.length), "render")
    },
    emoji: {
      scale: 2,
      render: /* @__PURE__ */ n((e) => "\u{1F603}".repeat(e.length), "render")
    },
    invisible: {
      scale: 0,
      render: /* @__PURE__ */ n((e) => "", "render")
    },
    default: {
      scale: 1,
      render: /* @__PURE__ */ n((e) => `${e}`, "render")
    }
  }), fv = /* @__PURE__ */ n((e) => Qs[e] || Qs.default, "render"), Hr = Object.freeze({
    aborted: ir.red(Mt.cross),
    done: ir.green(Mt.tick),
    exited: ir.yellow(Mt.cross),
    default: ir.cyan("?")
  }), hv = /* @__PURE__ */ n((e, t, r) => t ? Hr.aborted : r ? Hr.exited : e ? Hr.done : Hr.default, "symbol"), cv = /* @__PURE__ */ n((e) => ir.
  gray(e ? Mt.ellipsis : Mt.pointerSmall), "delimiter"), dv = /* @__PURE__ */ n((e, t) => ir.gray(e ? t ? Mt.pointerSmall : "+" : Mt.line), "\
item");
  lf.exports = {
    styles: Qs,
    render: fv,
    symbols: Hr,
    symbol: hv,
    delimiter: cv,
    item: dv
  };
});

// ../node_modules/prompts/dist/util/lines.js
var cf = b((H8, hf) => {
  "use strict";
  var pv = Ji();
  hf.exports = function(e, t) {
    let r = String(pv(e) || "").split(/\r?\n/);
    return t ? r.map((i) => Math.ceil(i.length / t)).reduce((i, s) => i + s) : r.length;
  };
});

// ../node_modules/prompts/dist/util/wrap.js
var pf = b((W8, df) => {
  "use strict";
  df.exports = (e, t = {}) => {
    let r = Number.isSafeInteger(parseInt(t.margin)) ? new Array(parseInt(t.margin)).fill(" ").join("") : t.margin || "", i = t.width;
    return (e || "").split(/\r?\n/g).map((s) => s.split(/\s+/g).reduce((o, u) => (u.length + r.length >= i || o[o.length - 1].length + u.length +
    1 < i ? o[o.length - 1] += ` ${u}` : o.push(`${r}${u}`), o), [r]).join(`
`)).join(`
`);
  };
});

// ../node_modules/prompts/dist/util/entriesToDisplay.js
var mf = b(($8, Df) => {
  "use strict";
  Df.exports = (e, t, r) => {
    r = r || t;
    let i = Math.min(t - r, e - Math.floor(r / 2));
    i < 0 && (i = 0);
    let s = Math.min(i + r, t);
    return {
      startIndex: i,
      endIndex: s
    };
  };
});

// ../node_modules/prompts/dist/util/index.js
var je = b((z8, gf) => {
  "use strict";
  gf.exports = {
    action: Zl(),
    clear: uf(),
    style: ff(),
    strip: Ji(),
    figures: Xs(),
    lines: cf(),
    wrap: pf(),
    entriesToDisplay: mf()
  };
});

// ../node_modules/prompts/dist/elements/prompt.js
var et = b((V8, vf) => {
  "use strict";
  var yf = E("readline"), Dv = je(), mv = Dv.action, gv = E("events"), bf = le(), yv = bf.beep, bv = bf.cursor, vv = ue(), Zs = class extends gv {
    static {
      n(this, "Prompt");
    }
    constructor(t = {}) {
      super(), this.firstRender = !0, this.in = t.stdin || process.stdin, this.out = t.stdout || process.stdout, this.onRender = (t.onRender ||
      (() => {
      })).bind(this);
      let r = yf.createInterface({
        input: this.in,
        escapeCodeTimeout: 50
      });
      yf.emitKeypressEvents(this.in, r), this.in.isTTY && this.in.setRawMode(!0);
      let i = ["SelectPrompt", "MultiselectPrompt"].indexOf(this.constructor.name) > -1, s = /* @__PURE__ */ n((o, u) => {
        let a = mv(u, i);
        a === !1 ? this._ && this._(o, u) : typeof this[a] == "function" ? this[a](u) : this.bell();
      }, "keypress");
      this.close = () => {
        this.out.write(bv.show), this.in.removeListener("keypress", s), this.in.isTTY && this.in.setRawMode(!1), r.close(), this.emit(this.aborted ?
        "abort" : this.exited ? "exit" : "submit", this.value), this.closed = !0;
      }, this.in.on("keypress", s);
    }
    fire() {
      this.emit("state", {
        value: this.value,
        aborted: !!this.aborted,
        exited: !!this.exited
      });
    }
    bell() {
      this.out.write(yv);
    }
    render() {
      this.onRender(vv), this.firstRender && (this.firstRender = !1);
    }
  };
  vf.exports = Zs;
});

// ../node_modules/prompts/dist/elements/text.js
var Ff = b((Y8, Cf) => {
  "use strict";
  function wf(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(wf, "asyncGeneratorStep");
  function _f(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          wf(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          wf(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(_f, "_asyncToGenerator");
  var Ki = ue(), wv = et(), Ef = le(), _v = Ef.erase, Wr = Ef.cursor, Xi = je(), eo = Xi.style, to = Xi.clear, Ev = Xi.lines, Cv = Xi.figures,
  ro = class extends wv {
    static {
      n(this, "TextPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = eo.render(t.style), this.scale = this.transform.scale, this.msg = t.message, this.initial = t.initial || "",
      this.validator = t.validate || (() => !0), this.value = "", this.errorMsg = t.error || "Please Enter A Valid Value", this.cursor = +!!this.
      initial, this.cursorOffset = 0, this.clear = to("", this.out.columns), this.render();
    }
    set value(t) {
      !t && this.initial ? (this.placeholder = !0, this.rendered = Ki.gray(this.transform.render(this.initial))) : (this.placeholder = !1, this.
      rendered = this.transform.render(t)), this._value = t, this.fire();
    }
    get value() {
      return this._value;
    }
    reset() {
      this.value = "", this.cursor = +!!this.initial, this.cursorOffset = 0, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.value = this.value || this.initial, this.done = this.aborted = !0, this.error = !1, this.red = !1, this.fire(), this.render(), this.
      out.write(`
`), this.close();
    }
    validate() {
      var t = this;
      return _f(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return _f(function* () {
        if (t.value = t.value || t.initial, t.cursorOffset = 0, t.cursor = t.rendered.length, yield t.validate(), t.error) {
          t.red = !0, t.fire(), t.render();
          return;
        }
        t.done = !0, t.aborted = !1, t.fire(), t.render(), t.out.write(`
`), t.close();
      })();
    }
    next() {
      if (!this.placeholder) return this.bell();
      this.value = this.initial, this.cursor = this.rendered.length, this.fire(), this.render();
    }
    moveCursor(t) {
      this.placeholder || (this.cursor = this.cursor + t, this.cursorOffset += t);
    }
    _(t, r) {
      let i = this.value.slice(0, this.cursor), s = this.value.slice(this.cursor);
      this.value = `${i}${t}${s}`, this.red = !1, this.cursor = this.placeholder ? 0 : i.length + 1, this.render();
    }
    delete() {
      if (this.isCursorAtStart()) return this.bell();
      let t = this.value.slice(0, this.cursor - 1), r = this.value.slice(this.cursor);
      this.value = `${t}${r}`, this.red = !1, this.isCursorAtStart() ? this.cursorOffset = 0 : (this.cursorOffset++, this.moveCursor(-1)), this.
      render();
    }
    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
      let t = this.value.slice(0, this.cursor), r = this.value.slice(this.cursor + 1);
      this.value = `${t}${r}`, this.red = !1, this.isCursorAtEnd() ? this.cursorOffset = 0 : this.cursorOffset++, this.render();
    }
    first() {
      this.cursor = 0, this.render();
    }
    last() {
      this.cursor = this.value.length, this.render();
    }
    left() {
      if (this.cursor <= 0 || this.placeholder) return this.bell();
      this.moveCursor(-1), this.render();
    }
    right() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
      this.moveCursor(1), this.render();
    }
    isCursorAtStart() {
      return this.cursor === 0 || this.placeholder && this.cursor === 1;
    }
    isCursorAtEnd() {
      return this.cursor === this.rendered.length || this.placeholder && this.cursor === this.rendered.length + 1;
    }
    render() {
      this.closed || (this.firstRender || (this.outputError && this.out.write(Wr.down(Ev(this.outputError, this.out.columns) - 1) + to(this.
      outputError, this.out.columns)), this.out.write(to(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [eo.symbol(this.done, this.aborted), Ki.bold(this.msg), eo.delimiter(this.done), this.red ? Ki.red(this.rendered) : this.rendered].join(
      " "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : Cv.pointerSmall} ${Ki.red().italic(r)}`, "")), this.out.write(_v.line + Wr.to(0) + this.outputText + Wr.save + this.outputError +
      Wr.restore + Wr.move(this.cursorOffset, 0)));
    }
  };
  Cf.exports = ro;
});

// ../node_modules/prompts/dist/elements/select.js
var Tf = b((K8, Af) => {
  "use strict";
  var tt = ue(), Fv = et(), $r = je(), xf = $r.style, Sf = $r.clear, Qi = $r.figures, xv = $r.wrap, Sv = $r.entriesToDisplay, Av = le(), Tv = Av.
  cursor, io = class extends Fv {
    static {
      n(this, "SelectPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.hint = t.hint || "- Use arrow-keys. Return to submit.", this.warn = t.warn || "- This option is d\
isabled", this.cursor = t.initial || 0, this.choices = t.choices.map((r, i) => (typeof r == "string" && (r = {
        title: r,
        value: i
      }), {
        title: r && (r.title || r.value || r),
        value: r && (r.value === void 0 ? i : r.value),
        description: r && r.description,
        selected: r && r.selected,
        disabled: r && r.disabled
      })), this.optionsPerPage = t.optionsPerPage || 10, this.value = (this.choices[this.cursor] || {}).value, this.clear = Sf("", this.out.
      columns), this.render();
    }
    moveCursor(t) {
      this.cursor = t, this.value = this.choices[t].value, this.fire();
    }
    reset() {
      this.moveCursor(0), this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.selection.disabled ? this.bell() : (this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close());
    }
    first() {
      this.moveCursor(0), this.render();
    }
    last() {
      this.moveCursor(this.choices.length - 1), this.render();
    }
    up() {
      this.cursor === 0 ? this.moveCursor(this.choices.length - 1) : this.moveCursor(this.cursor - 1), this.render();
    }
    down() {
      this.cursor === this.choices.length - 1 ? this.moveCursor(0) : this.moveCursor(this.cursor + 1), this.render();
    }
    next() {
      this.moveCursor((this.cursor + 1) % this.choices.length), this.render();
    }
    _(t, r) {
      if (t === " ") return this.submit();
    }
    get selection() {
      return this.choices[this.cursor];
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(Tv.hide) : this.out.write(Sf(this.outputText, this.out.columns)), super.render();
      let t = Sv(this.cursor, this.choices.length, this.optionsPerPage), r = t.startIndex, i = t.endIndex;
      if (this.outputText = [xf.symbol(this.done, this.aborted), tt.bold(this.msg), xf.delimiter(!1), this.done ? this.selection.title : this.
      selection.disabled ? tt.yellow(this.warn) : tt.gray(this.hint)].join(" "), !this.done) {
        this.outputText += `
`;
        for (let s = r; s < i; s++) {
          let o, u, a = "", l = this.choices[s];
          s === r && r > 0 ? u = Qi.arrowUp : s === i - 1 && i < this.choices.length ? u = Qi.arrowDown : u = " ", l.disabled ? (o = this.cursor ===
          s ? tt.gray().underline(l.title) : tt.strikethrough().gray(l.title), u = (this.cursor === s ? tt.bold().gray(Qi.pointer) + " " : "\
  ") + u) : (o = this.cursor === s ? tt.cyan().underline(l.title) : l.title, u = (this.cursor === s ? tt.cyan(Qi.pointer) + " " : "  ") + u,
          l.description && this.cursor === s && (a = ` - ${l.description}`, (u.length + o.length + a.length >= this.out.columns || l.description.
          split(/\r?\n/).length > 1) && (a = `
` + xv(l.description, {
            margin: 3,
            width: this.out.columns
          })))), this.outputText += `${u} ${o}${tt.gray(a)}
`;
        }
      }
      this.out.write(this.outputText);
    }
  };
  Af.exports = io;
});

// ../node_modules/prompts/dist/elements/toggle.js
var qf = b((Q8, Pf) => {
  "use strict";
  var Zi = ue(), Rv = et(), kf = je(), Rf = kf.style, Bv = kf.clear, Of = le(), Bf = Of.cursor, kv = Of.erase, no = class extends Rv {
    static {
      n(this, "TogglePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.value = !!t.initial, this.active = t.active || "on", this.inactive = t.inactive || "off", this.initialValue =
      this.value, this.render();
    }
    reset() {
      this.value = this.initialValue, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    deactivate() {
      if (this.value === !1) return this.bell();
      this.value = !1, this.render();
    }
    activate() {
      if (this.value === !0) return this.bell();
      this.value = !0, this.render();
    }
    delete() {
      this.deactivate();
    }
    left() {
      this.deactivate();
    }
    right() {
      this.activate();
    }
    down() {
      this.deactivate();
    }
    up() {
      this.activate();
    }
    next() {
      this.value = !this.value, this.fire(), this.render();
    }
    _(t, r) {
      if (t === " ")
        this.value = !this.value;
      else if (t === "1")
        this.value = !0;
      else if (t === "0")
        this.value = !1;
      else return this.bell();
      this.render();
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(Bf.hide) : this.out.write(Bv(this.outputText, this.out.columns)), super.render(), this.
      outputText = [Rf.symbol(this.done, this.aborted), Zi.bold(this.msg), Rf.delimiter(this.done), this.value ? this.inactive : Zi.cyan().underline(
      this.inactive), Zi.gray("/"), this.value ? Zi.cyan().underline(this.active) : this.active].join(" "), this.out.write(kv.line + Bf.to(0) +
      this.outputText));
    }
  };
  Pf.exports = no;
});

// ../node_modules/prompts/dist/dateparts/datepart.js
var He = b((eB, Mf) => {
  "use strict";
  var so = class e {
    static {
      n(this, "DatePart");
    }
    constructor({
      token: t,
      date: r,
      parts: i,
      locales: s
    }) {
      this.token = t, this.date = r || /* @__PURE__ */ new Date(), this.parts = i || [this], this.locales = s || {};
    }
    up() {
    }
    down() {
    }
    next() {
      let t = this.parts.indexOf(this);
      return this.parts.find((r, i) => i > t && r instanceof e);
    }
    setTo(t) {
    }
    prev() {
      let t = [].concat(this.parts).reverse(), r = t.indexOf(this);
      return t.find((i, s) => s > r && i instanceof e);
    }
    toString() {
      return String(this.date);
    }
  };
  Mf.exports = so;
});

// ../node_modules/prompts/dist/dateparts/meridiem.js
var If = b((rB, jf) => {
  "use strict";
  var Ov = He(), oo = class extends Ov {
    static {
      n(this, "Meridiem");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setHours((this.date.getHours() + 12) % 24);
    }
    down() {
      this.up();
    }
    toString() {
      let t = this.date.getHours() > 12 ? "pm" : "am";
      return /\A/.test(this.token) ? t.toUpperCase() : t;
    }
  };
  jf.exports = oo;
});

// ../node_modules/prompts/dist/dateparts/day.js
var Nf = b((nB, Lf) => {
  "use strict";
  var Pv = He(), qv = /* @__PURE__ */ n((e) => (e = e % 10, e === 1 ? "st" : e === 2 ? "nd" : e === 3 ? "rd" : "th"), "pos"), uo = class extends Pv {
    static {
      n(this, "Day");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setDate(this.date.getDate() + 1);
    }
    down() {
      this.date.setDate(this.date.getDate() - 1);
    }
    setTo(t) {
      this.date.setDate(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getDate(), r = this.date.getDay();
      return this.token === "DD" ? String(t).padStart(2, "0") : this.token === "Do" ? t + qv(t) : this.token === "d" ? r + 1 : this.token ===
      "ddd" ? this.locales.weekdaysShort[r] : this.token === "dddd" ? this.locales.weekdays[r] : t;
    }
  };
  Lf.exports = uo;
});

// ../node_modules/prompts/dist/dateparts/hours.js
var Hf = b((oB, Uf) => {
  "use strict";
  var Mv = He(), ao = class extends Mv {
    static {
      n(this, "Hours");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setHours(this.date.getHours() + 1);
    }
    down() {
      this.date.setHours(this.date.getHours() - 1);
    }
    setTo(t) {
      this.date.setHours(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getHours();
      return /h/.test(this.token) && (t = t % 12 || 12), this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  Uf.exports = ao;
});

// ../node_modules/prompts/dist/dateparts/milliseconds.js
var $f = b((aB, Wf) => {
  "use strict";
  var jv = He(), lo = class extends jv {
    static {
      n(this, "Milliseconds");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMilliseconds(this.date.getMilliseconds() + 1);
    }
    down() {
      this.date.setMilliseconds(this.date.getMilliseconds() - 1);
    }
    setTo(t) {
      this.date.setMilliseconds(parseInt(t.substr(-this.token.length)));
    }
    toString() {
      return String(this.date.getMilliseconds()).padStart(4, "0").substr(0, this.token.length);
    }
  };
  Wf.exports = lo;
});

// ../node_modules/prompts/dist/dateparts/minutes.js
var Vf = b((fB, zf) => {
  "use strict";
  var Iv = He(), fo = class extends Iv {
    static {
      n(this, "Minutes");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMinutes(this.date.getMinutes() + 1);
    }
    down() {
      this.date.setMinutes(this.date.getMinutes() - 1);
    }
    setTo(t) {
      this.date.setMinutes(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getMinutes();
      return this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  zf.exports = fo;
});

// ../node_modules/prompts/dist/dateparts/month.js
var Yf = b((cB, Gf) => {
  "use strict";
  var Lv = He(), ho = class extends Lv {
    static {
      n(this, "Month");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMonth(this.date.getMonth() + 1);
    }
    down() {
      this.date.setMonth(this.date.getMonth() - 1);
    }
    setTo(t) {
      t = parseInt(t.substr(-2)) - 1, this.date.setMonth(t < 0 ? 0 : t);
    }
    toString() {
      let t = this.date.getMonth(), r = this.token.length;
      return r === 2 ? String(t + 1).padStart(2, "0") : r === 3 ? this.locales.monthsShort[t] : r === 4 ? this.locales.months[t] : String(t +
      1);
    }
  };
  Gf.exports = ho;
});

// ../node_modules/prompts/dist/dateparts/seconds.js
var Kf = b((pB, Jf) => {
  "use strict";
  var Nv = He(), co = class extends Nv {
    static {
      n(this, "Seconds");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setSeconds(this.date.getSeconds() + 1);
    }
    down() {
      this.date.setSeconds(this.date.getSeconds() - 1);
    }
    setTo(t) {
      this.date.setSeconds(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getSeconds();
      return this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  Jf.exports = co;
});

// ../node_modules/prompts/dist/dateparts/year.js
var Qf = b((mB, Xf) => {
  "use strict";
  var Uv = He(), po = class extends Uv {
    static {
      n(this, "Year");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setFullYear(this.date.getFullYear() + 1);
    }
    down() {
      this.date.setFullYear(this.date.getFullYear() - 1);
    }
    setTo(t) {
      this.date.setFullYear(t.substr(-4));
    }
    toString() {
      let t = String(this.date.getFullYear()).padStart(4, "0");
      return this.token.length === 2 ? t.substr(-2) : t;
    }
  };
  Xf.exports = po;
});

// ../node_modules/prompts/dist/dateparts/index.js
var eh = b((yB, Zf) => {
  "use strict";
  Zf.exports = {
    DatePart: He(),
    Meridiem: If(),
    Day: Nf(),
    Hours: Hf(),
    Milliseconds: $f(),
    Minutes: Vf(),
    Month: Yf(),
    Seconds: Kf(),
    Year: Qf()
  };
});

// ../node_modules/prompts/dist/elements/date.js
var fh = b((bB, lh) => {
  "use strict";
  function th(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(th, "asyncGeneratorStep");
  function rh(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          th(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          th(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(rh, "_asyncToGenerator");
  var Do = ue(), Hv = et(), go = je(), ih = go.style, nh = go.clear, Wv = go.figures, ah = le(), $v = ah.erase, sh = ah.cursor, rt = eh(), oh = rt.
  DatePart, zv = rt.Meridiem, Vv = rt.Day, Gv = rt.Hours, Yv = rt.Milliseconds, Jv = rt.Minutes, Kv = rt.Month, Xv = rt.Seconds, Qv = rt.Year,
  Zv = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g, uh = {
    1: ({
      token: e
    }) => e.replace(/\\(.)/g, "$1"),
    2: (e) => new Vv(e),
    // Day // TODO
    3: (e) => new Kv(e),
    // Month
    4: (e) => new Qv(e),
    // Year
    5: (e) => new zv(e),
    // AM/PM // TODO (special)
    6: (e) => new Gv(e),
    // Hours
    7: (e) => new Jv(e),
    // Minutes
    8: (e) => new Xv(e),
    // Seconds
    9: (e) => new Yv(e)
    // Fractional seconds
  }, ew = {
    months: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
    monthsShort: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
    weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
    weekdaysShort: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",")
  }, mo = class extends Hv {
    static {
      n(this, "DatePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = 0, this.typed = "", this.locales = Object.assign(ew, t.locales), this._date = t.initial ||
      /* @__PURE__ */ new Date(), this.errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.mask =
      t.mask || "YYYY-MM-DD HH:mm:ss", this.clear = nh("", this.out.columns), this.render();
    }
    get value() {
      return this.date;
    }
    get date() {
      return this._date;
    }
    set date(t) {
      t && this._date.setTime(t.getTime());
    }
    set mask(t) {
      let r;
      for (this.parts = []; r = Zv.exec(t); ) {
        let s = r.shift(), o = r.findIndex((u) => u != null);
        this.parts.push(o in uh ? uh[o]({
          token: r[o] || s,
          date: this.date,
          parts: this.parts,
          locales: this.locales
        }) : r[o] || s);
      }
      let i = this.parts.reduce((s, o) => (typeof o == "string" && typeof s[s.length - 1] == "string" ? s[s.length - 1] += o : s.push(o), s),
      []);
      this.parts.splice(0), this.parts.push(...i), this.reset();
    }
    moveCursor(t) {
      this.typed = "", this.cursor = t, this.fire();
    }
    reset() {
      this.moveCursor(this.parts.findIndex((t) => t instanceof oh)), this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.error = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    validate() {
      var t = this;
      return rh(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return rh(function* () {
        if (yield t.validate(), t.error) {
          t.color = "red", t.fire(), t.render();
          return;
        }
        t.done = !0, t.aborted = !1, t.fire(), t.render(), t.out.write(`
`), t.close();
      })();
    }
    up() {
      this.typed = "", this.parts[this.cursor].up(), this.render();
    }
    down() {
      this.typed = "", this.parts[this.cursor].down(), this.render();
    }
    left() {
      let t = this.parts[this.cursor].prev();
      if (t == null) return this.bell();
      this.moveCursor(this.parts.indexOf(t)), this.render();
    }
    right() {
      let t = this.parts[this.cursor].next();
      if (t == null) return this.bell();
      this.moveCursor(this.parts.indexOf(t)), this.render();
    }
    next() {
      let t = this.parts[this.cursor].next();
      this.moveCursor(t ? this.parts.indexOf(t) : this.parts.findIndex((r) => r instanceof oh)), this.render();
    }
    _(t) {
      /\d/.test(t) && (this.typed += t, this.parts[this.cursor].setTo(this.typed), this.render());
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(sh.hide) : this.out.write(nh(this.outputText, this.out.columns)), super.render(), this.
      outputText = [ih.symbol(this.done, this.aborted), Do.bold(this.msg), ih.delimiter(!1), this.parts.reduce((t, r, i) => t.concat(i === this.
      cursor && !this.done ? Do.cyan().underline(r.toString()) : r), []).join("")].join(" "), this.error && (this.outputText += this.errorMsg.
      split(`
`).reduce((t, r, i) => t + `
${i ? " " : Wv.pointerSmall} ${Do.red().italic(r)}`, "")), this.out.write($v.line + sh.to(0) + this.outputText));
    }
  };
  lh.exports = mo;
});

// ../node_modules/prompts/dist/elements/number.js
var gh = b((wB, mh) => {
  "use strict";
  function hh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(hh, "asyncGeneratorStep");
  function ch(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          hh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          hh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(ch, "_asyncToGenerator");
  var en = ue(), tw = et(), Dh = le(), tn = Dh.cursor, rw = Dh.erase, rn = je(), yo = rn.style, iw = rn.figures, dh = rn.clear, nw = rn.lines,
  sw = /[0-9]/, bo = /* @__PURE__ */ n((e) => e !== void 0, "isDef"), ph = /* @__PURE__ */ n((e, t) => {
    let r = Math.pow(10, t);
    return Math.round(e * r) / r;
  }, "round"), vo = class extends tw {
    static {
      n(this, "NumberPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = yo.render(t.style), this.msg = t.message, this.initial = bo(t.initial) ? t.initial : "", this.float = !!t.float,
      this.round = t.round || 2, this.inc = t.increment || 1, this.min = bo(t.min) ? t.min : -1 / 0, this.max = bo(t.max) ? t.max : 1 / 0, this.
      errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.color = "cyan", this.value = "", this.
      typed = "", this.lastHit = 0, this.render();
    }
    set value(t) {
      !t && t !== 0 ? (this.placeholder = !0, this.rendered = en.gray(this.transform.render(`${this.initial}`)), this._value = "") : (this.placeholder =
      !1, this.rendered = this.transform.render(`${ph(t, this.round)}`), this._value = ph(t, this.round)), this.fire();
    }
    get value() {
      return this._value;
    }
    parse(t) {
      return this.float ? parseFloat(t) : parseInt(t);
    }
    valid(t) {
      return t === "-" || t === "." && this.float || sw.test(t);
    }
    reset() {
      this.typed = "", this.value = "", this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      let t = this.value;
      this.value = t !== "" ? t : this.initial, this.done = this.aborted = !0, this.error = !1, this.fire(), this.render(), this.out.write(`\

`), this.close();
    }
    validate() {
      var t = this;
      return ch(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return ch(function* () {
        if (yield t.validate(), t.error) {
          t.color = "red", t.fire(), t.render();
          return;
        }
        let r = t.value;
        t.value = r !== "" ? r : t.initial, t.done = !0, t.aborted = !1, t.error = !1, t.fire(), t.render(), t.out.write(`
`), t.close();
      })();
    }
    up() {
      if (this.typed = "", this.value === "" && (this.value = this.min - this.inc), this.value >= this.max) return this.bell();
      this.value += this.inc, this.color = "cyan", this.fire(), this.render();
    }
    down() {
      if (this.typed = "", this.value === "" && (this.value = this.min + this.inc), this.value <= this.min) return this.bell();
      this.value -= this.inc, this.color = "cyan", this.fire(), this.render();
    }
    delete() {
      let t = this.value.toString();
      if (t.length === 0) return this.bell();
      this.value = this.parse(t = t.slice(0, -1)) || "", this.value !== "" && this.value < this.min && (this.value = this.min), this.color =
      "cyan", this.fire(), this.render();
    }
    next() {
      this.value = this.initial, this.fire(), this.render();
    }
    _(t, r) {
      if (!this.valid(t)) return this.bell();
      let i = Date.now();
      if (i - this.lastHit > 1e3 && (this.typed = ""), this.typed += t, this.lastHit = i, this.color = "cyan", t === ".") return this.fire();
      this.value = Math.min(this.parse(this.typed), this.max), this.value > this.max && (this.value = this.max), this.value < this.min && (this.
      value = this.min), this.fire(), this.render();
    }
    render() {
      this.closed || (this.firstRender || (this.outputError && this.out.write(tn.down(nw(this.outputError, this.out.columns) - 1) + dh(this.
      outputError, this.out.columns)), this.out.write(dh(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [yo.symbol(this.done, this.aborted), en.bold(this.msg), yo.delimiter(this.done), !this.done || !this.done && !this.placeholder ? en[this.
      color]().underline(this.rendered) : this.rendered].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : iw.pointerSmall} ${en.red().italic(r)}`, "")), this.out.write(rw.line + tn.to(0) + this.outputText + tn.save + this.outputError +
      tn.restore));
    }
  };
  mh.exports = vo;
});

// ../node_modules/prompts/dist/elements/multiselect.js
var _o = b((EB, vh) => {
  "use strict";
  var We = ue(), ow = le(), uw = ow.cursor, aw = et(), zr = je(), yh = zr.clear, _t = zr.figures, bh = zr.style, lw = zr.wrap, fw = zr.entriesToDisplay,
  wo = class extends aw {
    static {
      n(this, "MultiselectPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = t.cursor || 0, this.scrollIndex = t.cursor || 0, this.hint = t.hint || "", this.warn = t.
      warn || "- This option is disabled -", this.minSelected = t.min, this.showMinError = !1, this.maxChoices = t.max, this.instructions = t.
      instructions, this.optionsPerPage = t.optionsPerPage || 10, this.value = t.choices.map((r, i) => (typeof r == "string" && (r = {
        title: r,
        value: i
      }), {
        title: r && (r.title || r.value || r),
        description: r && r.description,
        value: r && (r.value === void 0 ? i : r.value),
        selected: r && r.selected,
        disabled: r && r.disabled
      })), this.clear = yh("", this.out.columns), t.overrideRender || this.render();
    }
    reset() {
      this.value.map((t) => !t.selected), this.cursor = 0, this.fire(), this.render();
    }
    selected() {
      return this.value.filter((t) => t.selected);
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      let t = this.value.filter((r) => r.selected);
      this.minSelected && t.length < this.minSelected ? (this.showMinError = !0, this.render()) : (this.done = !0, this.aborted = !1, this.fire(),
      this.render(), this.out.write(`
`), this.close());
    }
    first() {
      this.cursor = 0, this.render();
    }
    last() {
      this.cursor = this.value.length - 1, this.render();
    }
    next() {
      this.cursor = (this.cursor + 1) % this.value.length, this.render();
    }
    up() {
      this.cursor === 0 ? this.cursor = this.value.length - 1 : this.cursor--, this.render();
    }
    down() {
      this.cursor === this.value.length - 1 ? this.cursor = 0 : this.cursor++, this.render();
    }
    left() {
      this.value[this.cursor].selected = !1, this.render();
    }
    right() {
      if (this.value.filter((t) => t.selected).length >= this.maxChoices) return this.bell();
      this.value[this.cursor].selected = !0, this.render();
    }
    handleSpaceToggle() {
      let t = this.value[this.cursor];
      if (t.selected)
        t.selected = !1, this.render();
      else {
        if (t.disabled || this.value.filter((r) => r.selected).length >= this.maxChoices)
          return this.bell();
        t.selected = !0, this.render();
      }
    }
    toggleAll() {
      if (this.maxChoices !== void 0 || this.value[this.cursor].disabled)
        return this.bell();
      let t = !this.value[this.cursor].selected;
      this.value.filter((r) => !r.disabled).forEach((r) => r.selected = t), this.render();
    }
    _(t, r) {
      if (t === " ")
        this.handleSpaceToggle();
      else if (t === "a")
        this.toggleAll();
      else
        return this.bell();
    }
    renderInstructions() {
      return this.instructions === void 0 || this.instructions ? typeof this.instructions == "string" ? this.instructions : `
Instructions:
    ${_t.arrowUp}/${_t.arrowDown}: Highlight option
    ${_t.arrowLeft}/${_t.arrowRight}/[space]: Toggle selection
` + (this.maxChoices === void 0 ? `    a: Toggle all
` : "") + "    enter/return: Complete answer" : "";
    }
    renderOption(t, r, i, s) {
      let o = (r.selected ? We.green(_t.radioOn) : _t.radioOff) + " " + s + " ", u, a;
      return r.disabled ? u = t === i ? We.gray().underline(r.title) : We.strikethrough().gray(r.title) : (u = t === i ? We.cyan().underline(
      r.title) : r.title, t === i && r.description && (a = ` - ${r.description}`, (o.length + u.length + a.length >= this.out.columns || r.description.
      split(/\r?\n/).length > 1) && (a = `
` + lw(r.description, {
        margin: o.length,
        width: this.out.columns
      })))), o + u + We.gray(a || "");
    }
    // shared with autocompleteMultiselect
    paginateOptions(t) {
      if (t.length === 0)
        return We.red("No matches for this query.");
      let r = fw(this.cursor, t.length, this.optionsPerPage), i = r.startIndex, s = r.endIndex, o, u = [];
      for (let a = i; a < s; a++)
        a === i && i > 0 ? o = _t.arrowUp : a === s - 1 && s < t.length ? o = _t.arrowDown : o = " ", u.push(this.renderOption(this.cursor, t[a],
        a, o));
      return `
` + u.join(`
`);
    }
    // shared with autocomleteMultiselect
    renderOptions(t) {
      return this.done ? "" : this.paginateOptions(t);
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [We.gray(this.hint), this.renderInstructions()];
      return this.value[this.cursor].disabled && t.push(We.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(uw.hide), super.render();
      let t = [bh.symbol(this.done, this.aborted), We.bold(this.msg), bh.delimiter(!1), this.renderDoneOrInstructions()].join(" ");
      this.showMinError && (t += We.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.value), this.out.write(this.clear + t), this.clear = yh(t, this.out.columns);
    }
  };
  vh.exports = wo;
});

// ../node_modules/prompts/dist/elements/autocomplete.js
var Sh = b((FB, xh) => {
  "use strict";
  function wh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(wh, "asyncGeneratorStep");
  function hw(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          wh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          wh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(hw, "_asyncToGenerator");
  var Vr = ue(), cw = et(), Fh = le(), dw = Fh.erase, _h = Fh.cursor, Gr = je(), Eo = Gr.style, Eh = Gr.clear, Co = Gr.figures, pw = Gr.wrap,
  Dw = Gr.entriesToDisplay, Ch = /* @__PURE__ */ n((e, t) => e[t] && (e[t].value || e[t].title || e[t]), "getVal"), mw = /* @__PURE__ */ n((e, t) => e[t] &&
  (e[t].title || e[t].value || e[t]), "getTitle"), gw = /* @__PURE__ */ n((e, t) => {
    let r = e.findIndex((i) => i.value === t || i.title === t);
    return r > -1 ? r : void 0;
  }, "getIndex"), Fo = class extends cw {
    static {
      n(this, "AutocompletePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.suggest = t.suggest, this.choices = t.choices, this.initial = typeof t.initial == "number" ? t.initial :
      gw(t.choices, t.initial), this.select = this.initial || t.cursor || 0, this.i18n = {
        noMatches: t.noMatches || "no matches found"
      }, this.fallback = t.fallback || this.initial, this.clearFirst = t.clearFirst || !1, this.suggestions = [], this.input = "", this.limit =
      t.limit || 10, this.cursor = 0, this.transform = Eo.render(t.style), this.scale = this.transform.scale, this.render = this.render.bind(
      this), this.complete = this.complete.bind(this), this.clear = Eh("", this.out.columns), this.complete(this.render), this.render();
    }
    set fallback(t) {
      this._fb = Number.isSafeInteger(parseInt(t)) ? parseInt(t) : t;
    }
    get fallback() {
      let t;
      return typeof this._fb == "number" ? t = this.choices[this._fb] : typeof this._fb == "string" && (t = {
        title: this._fb
      }), t || this._fb || {
        title: this.i18n.noMatches
      };
    }
    moveSelect(t) {
      this.select = t, this.suggestions.length > 0 ? this.value = Ch(this.suggestions, t) : this.value = this.fallback.value, this.fire();
    }
    complete(t) {
      var r = this;
      return hw(function* () {
        let i = r.completing = r.suggest(r.input, r.choices), s = yield i;
        if (r.completing !== i) return;
        r.suggestions = s.map((u, a, l) => ({
          title: mw(l, a),
          value: Ch(l, a),
          description: u.description
        })), r.completing = !1;
        let o = Math.max(s.length - 1, 0);
        r.moveSelect(Math.min(o, r.select)), t && t();
      })();
    }
    reset() {
      this.input = "", this.complete(() => {
        this.moveSelect(this.initial !== void 0 ? this.initial : 0), this.render();
      }), this.render();
    }
    exit() {
      this.clearFirst && this.input.length > 0 ? this.reset() : (this.done = this.exited = !0, this.aborted = !1, this.fire(), this.render(),
      this.out.write(`
`), this.close());
    }
    abort() {
      this.done = this.aborted = !0, this.exited = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.done = !0, this.aborted = this.exited = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    _(t, r) {
      let i = this.input.slice(0, this.cursor), s = this.input.slice(this.cursor);
      this.input = `${i}${t}${s}`, this.cursor = i.length + 1, this.complete(this.render), this.render();
    }
    delete() {
      if (this.cursor === 0) return this.bell();
      let t = this.input.slice(0, this.cursor - 1), r = this.input.slice(this.cursor);
      this.input = `${t}${r}`, this.complete(this.render), this.cursor = this.cursor - 1, this.render();
    }
    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell();
      let t = this.input.slice(0, this.cursor), r = this.input.slice(this.cursor + 1);
      this.input = `${t}${r}`, this.complete(this.render), this.render();
    }
    first() {
      this.moveSelect(0), this.render();
    }
    last() {
      this.moveSelect(this.suggestions.length - 1), this.render();
    }
    up() {
      this.select === 0 ? this.moveSelect(this.suggestions.length - 1) : this.moveSelect(this.select - 1), this.render();
    }
    down() {
      this.select === this.suggestions.length - 1 ? this.moveSelect(0) : this.moveSelect(this.select + 1), this.render();
    }
    next() {
      this.select === this.suggestions.length - 1 ? this.moveSelect(0) : this.moveSelect(this.select + 1), this.render();
    }
    nextPage() {
      this.moveSelect(Math.min(this.select + this.limit, this.suggestions.length - 1)), this.render();
    }
    prevPage() {
      this.moveSelect(Math.max(this.select - this.limit, 0)), this.render();
    }
    left() {
      if (this.cursor <= 0) return this.bell();
      this.cursor = this.cursor - 1, this.render();
    }
    right() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell();
      this.cursor = this.cursor + 1, this.render();
    }
    renderOption(t, r, i, s) {
      let o, u = i ? Co.arrowUp : s ? Co.arrowDown : " ", a = r ? Vr.cyan().underline(t.title) : t.title;
      return u = (r ? Vr.cyan(Co.pointer) + " " : "  ") + u, t.description && (o = ` - ${t.description}`, (u.length + a.length + o.length >=
      this.out.columns || t.description.split(/\r?\n/).length > 1) && (o = `
` + pw(t.description, {
        margin: 3,
        width: this.out.columns
      }))), u + " " + a + Vr.gray(o || "");
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(_h.hide) : this.out.write(Eh(this.outputText, this.out.columns)), super.render();
      let t = Dw(this.select, this.choices.length, this.limit), r = t.startIndex, i = t.endIndex;
      if (this.outputText = [Eo.symbol(this.done, this.aborted, this.exited), Vr.bold(this.msg), Eo.delimiter(this.completing), this.done &&
      this.suggestions[this.select] ? this.suggestions[this.select].title : this.rendered = this.transform.render(this.input)].join(" "), !this.
      done) {
        let s = this.suggestions.slice(r, i).map((o, u) => this.renderOption(o, this.select === u + r, u === 0 && r > 0, u + r === i - 1 && i <
        this.choices.length)).join(`
`);
        this.outputText += `
` + (s || Vr.gray(this.fallback.title));
      }
      this.out.write(dw.line + _h.to(0) + this.outputText);
    }
  };
  xh.exports = Fo;
});

// ../node_modules/prompts/dist/elements/autocompleteMultiselect.js
var Bh = b((SB, Rh) => {
  "use strict";
  var it = ue(), yw = le(), bw = yw.cursor, vw = _o(), So = je(), Ah = So.clear, Th = So.style, nr = So.figures, xo = class extends vw {
    static {
      n(this, "AutocompleteMultiselectPrompt");
    }
    constructor(t = {}) {
      t.overrideRender = !0, super(t), this.inputValue = "", this.clear = Ah("", this.out.columns), this.filteredOptions = this.value, this.
      render();
    }
    last() {
      this.cursor = this.filteredOptions.length - 1, this.render();
    }
    next() {
      this.cursor = (this.cursor + 1) % this.filteredOptions.length, this.render();
    }
    up() {
      this.cursor === 0 ? this.cursor = this.filteredOptions.length - 1 : this.cursor--, this.render();
    }
    down() {
      this.cursor === this.filteredOptions.length - 1 ? this.cursor = 0 : this.cursor++, this.render();
    }
    left() {
      this.filteredOptions[this.cursor].selected = !1, this.render();
    }
    right() {
      if (this.value.filter((t) => t.selected).length >= this.maxChoices) return this.bell();
      this.filteredOptions[this.cursor].selected = !0, this.render();
    }
    delete() {
      this.inputValue.length && (this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1), this.updateFilteredOptions());
    }
    updateFilteredOptions() {
      let t = this.filteredOptions[this.cursor];
      this.filteredOptions = this.value.filter((i) => this.inputValue ? !!(typeof i.title == "string" && i.title.toLowerCase().includes(this.
      inputValue.toLowerCase()) || typeof i.value == "string" && i.value.toLowerCase().includes(this.inputValue.toLowerCase())) : !0);
      let r = this.filteredOptions.findIndex((i) => i === t);
      this.cursor = r < 0 ? 0 : r, this.render();
    }
    handleSpaceToggle() {
      let t = this.filteredOptions[this.cursor];
      if (t.selected)
        t.selected = !1, this.render();
      else {
        if (t.disabled || this.value.filter((r) => r.selected).length >= this.maxChoices)
          return this.bell();
        t.selected = !0, this.render();
      }
    }
    handleInputChange(t) {
      this.inputValue = this.inputValue + t, this.updateFilteredOptions();
    }
    _(t, r) {
      t === " " ? this.handleSpaceToggle() : this.handleInputChange(t);
    }
    renderInstructions() {
      return this.instructions === void 0 || this.instructions ? typeof this.instructions == "string" ? this.instructions : `
Instructions:
    ${nr.arrowUp}/${nr.arrowDown}: Highlight option
    ${nr.arrowLeft}/${nr.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
` : "";
    }
    renderCurrentInput() {
      return `
Filtered results for: ${this.inputValue ? this.inputValue : it.gray("Enter something to filter")}
`;
    }
    renderOption(t, r, i) {
      let s;
      return r.disabled ? s = t === i ? it.gray().underline(r.title) : it.strikethrough().gray(r.title) : s = t === i ? it.cyan().underline(
      r.title) : r.title, (r.selected ? it.green(nr.radioOn) : nr.radioOff) + "  " + s;
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [it.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];
      return this.filteredOptions.length && this.filteredOptions[this.cursor].disabled && t.push(it.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(bw.hide), super.render();
      let t = [Th.symbol(this.done, this.aborted), it.bold(this.msg), Th.delimiter(!1), this.renderDoneOrInstructions()].join(" ");
      this.showMinError && (t += it.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.filteredOptions), this.out.write(this.clear + t), this.clear = Ah(t, this.out.columns);
    }
  };
  Rh.exports = xo;
});

// ../node_modules/prompts/dist/elements/confirm.js
var Ih = b((TB, jh) => {
  "use strict";
  var kh = ue(), ww = et(), qh = je(), Oh = qh.style, _w = qh.clear, Mh = le(), Ew = Mh.erase, Ph = Mh.cursor, Ao = class extends ww {
    static {
      n(this, "ConfirmPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.value = t.initial, this.initialValue = !!t.initial, this.yesMsg = t.yes || "yes", this.yesOption =
      t.yesOption || "(Y/n)", this.noMsg = t.no || "no", this.noOption = t.noOption || "(y/N)", this.render();
    }
    reset() {
      this.value = this.initialValue, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.value = this.value || !1, this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    _(t, r) {
      return t.toLowerCase() === "y" ? (this.value = !0, this.submit()) : t.toLowerCase() === "n" ? (this.value = !1, this.submit()) : this.
      bell();
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(Ph.hide) : this.out.write(_w(this.outputText, this.out.columns)), super.render(), this.
      outputText = [Oh.symbol(this.done, this.aborted), kh.bold(this.msg), Oh.delimiter(this.done), this.done ? this.value ? this.yesMsg : this.
      noMsg : kh.gray(this.initialValue ? this.yesOption : this.noOption)].join(" "), this.out.write(Ew.line + Ph.to(0) + this.outputText));
    }
  };
  jh.exports = Ao;
});

// ../node_modules/prompts/dist/elements/index.js
var Nh = b((BB, Lh) => {
  "use strict";
  Lh.exports = {
    TextPrompt: Ff(),
    SelectPrompt: Tf(),
    TogglePrompt: qf(),
    DatePrompt: fh(),
    NumberPrompt: gh(),
    MultiselectPrompt: _o(),
    AutocompletePrompt: Sh(),
    AutocompleteMultiselectPrompt: Bh(),
    ConfirmPrompt: Ih()
  };
});

// ../node_modules/prompts/dist/prompts.js
var Hh = b((Uh) => {
  "use strict";
  var Te = Uh, Cw = Nh(), nn = /* @__PURE__ */ n((e) => e, "noop");
  function $e(e, t, r = {}) {
    return new Promise((i, s) => {
      let o = new Cw[e](t), u = r.onAbort || nn, a = r.onSubmit || nn, l = r.onExit || nn;
      o.on("state", t.onState || nn), o.on("submit", (f) => i(a(f))), o.on("exit", (f) => i(l(f))), o.on("abort", (f) => s(u(f)));
    });
  }
  n($e, "toPrompt");
  Te.text = (e) => $e("TextPrompt", e);
  Te.password = (e) => (e.style = "password", Te.text(e));
  Te.invisible = (e) => (e.style = "invisible", Te.text(e));
  Te.number = (e) => $e("NumberPrompt", e);
  Te.date = (e) => $e("DatePrompt", e);
  Te.confirm = (e) => $e("ConfirmPrompt", e);
  Te.list = (e) => {
    let t = e.separator || ",";
    return $e("TextPrompt", e, {
      onSubmit: /* @__PURE__ */ n((r) => r.split(t).map((i) => i.trim()), "onSubmit")
    });
  };
  Te.toggle = (e) => $e("TogglePrompt", e);
  Te.select = (e) => $e("SelectPrompt", e);
  Te.multiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return $e("MultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  Te.autocompleteMultiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return $e("AutocompleteMultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  var Fw = /* @__PURE__ */ n((e, t) => Promise.resolve(t.filter((r) => r.title.slice(0, e.length).toLowerCase() === e.toLowerCase())), "byTi\
tle");
  Te.autocomplete = (e) => (e.suggest = e.suggest || Fw, e.choices = [].concat(e.choices || []), $e("AutocompletePrompt", e));
});

// ../node_modules/prompts/dist/index.js
var Kh = b((PB, Jh) => {
  "use strict";
  function Wh(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n(Wh, "ownKeys");
  function $h(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? Wh(Object(r), !0).forEach(function(i) {
        xw(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Wh(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n($h, "_objectSpread");
  function xw(e, t, r) {
    return t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(xw, "_defineProperty");
  function Sw(e, t) {
    var r = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (!r) {
      if (Array.isArray(e) || (r = Aw(e)) || t && e && typeof e.length == "number") {
        r && (e = r);
        var i = 0, s = /* @__PURE__ */ n(function() {
        }, "F");
        return { s, n: /* @__PURE__ */ n(function() {
          return i >= e.length ? { done: !0 } : { done: !1, value: e[i++] };
        }, "n"), e: /* @__PURE__ */ n(function(f) {
          throw f;
        }, "e"), f: s };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var o = !0, u = !1, a;
    return { s: /* @__PURE__ */ n(function() {
      r = r.call(e);
    }, "s"), n: /* @__PURE__ */ n(function() {
      var f = r.next();
      return o = f.done, f;
    }, "n"), e: /* @__PURE__ */ n(function(f) {
      u = !0, a = f;
    }, "e"), f: /* @__PURE__ */ n(function() {
      try {
        !o && r.return != null && r.return();
      } finally {
        if (u) throw a;
      }
    }, "f") };
  }
  n(Sw, "_createForOfIteratorHelper");
  function Aw(e, t) {
    if (e) {
      if (typeof e == "string") return zh(e, t);
      var r = Object.prototype.toString.call(e).slice(8, -1);
      if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
      if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return zh(e, t);
    }
  }
  n(Aw, "_unsupportedIterableToArray");
  function zh(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var r = 0, i = new Array(t); r < t; r++) i[r] = e[r];
    return i;
  }
  n(zh, "_arrayLikeToArray");
  function Vh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(Vh, "asyncGeneratorStep");
  function Gh(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          Vh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          Vh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(Gh, "_asyncToGenerator");
  var To = Hh(), Tw = ["suggest", "format", "onState", "validate", "onRender", "type"], Yh = /* @__PURE__ */ n(() => {
  }, "noop");
  function Et() {
    return Ro.apply(this, arguments);
  }
  n(Et, "prompt");
  function Ro() {
    return Ro = Gh(function* (e = [], {
      onSubmit: t = Yh,
      onCancel: r = Yh
    } = {}) {
      let i = {}, s = Et._override || {};
      e = [].concat(e);
      let o, u, a, l, f, p, d = /* @__PURE__ */ function() {
        var y = Gh(function* (_, C, v = !1) {
          if (!(!v && _.validate && _.validate(C) !== !0))
            return _.format ? yield _.format(C, i) : C;
        });
        return /* @__PURE__ */ n(function(C, v) {
          return y.apply(this, arguments);
        }, "getFormattedAnswer");
      }();
      var c = Sw(e), h;
      try {
        for (c.s(); !(h = c.n()).done; ) {
          u = h.value;
          var g = u;
          if (l = g.name, f = g.type, typeof f == "function" && (f = yield f(o, $h({}, i), u), u.type = f), !!f) {
            for (let y in u) {
              if (Tw.includes(y)) continue;
              let _ = u[y];
              u[y] = typeof _ == "function" ? yield _(o, $h({}, i), p) : _;
            }
            if (p = u, typeof u.message != "string")
              throw new Error("prompt message is required");
            var w = u;
            if (l = w.name, f = w.type, To[f] === void 0)
              throw new Error(`prompt type (${f}) is not defined`);
            if (s[u.name] !== void 0 && (o = yield d(u, s[u.name]), o !== void 0)) {
              i[l] = o;
              continue;
            }
            try {
              o = Et._injected ? Rw(Et._injected, u.initial) : yield To[f](u), i[l] = o = yield d(u, o, !0), a = yield t(u, o, i);
            } catch {
              a = !(yield r(u, i));
            }
            if (a) return i;
          }
        }
      } catch (y) {
        c.e(y);
      } finally {
        c.f();
      }
      return i;
    }), Ro.apply(this, arguments);
  }
  n(Ro, "_prompt");
  function Rw(e, t) {
    let r = e.shift();
    if (r instanceof Error)
      throw r;
    return r === void 0 ? t : r;
  }
  n(Rw, "getInjectedAnswer");
  function Bw(e) {
    Et._injected = (Et._injected || []).concat(e);
  }
  n(Bw, "inject");
  function kw(e) {
    Et._override = Object.assign({}, e);
  }
  n(kw, "override");
  Jh.exports = Object.assign(Et, {
    prompt: Et,
    prompts: To,
    inject: Bw,
    override: kw
  });
});

// ../node_modules/prompts/lib/util/action.js
var Qh = b((MB, Xh) => {
  "use strict";
  Xh.exports = (e, t) => {
    if (!(e.meta && e.name !== "escape")) {
      if (e.ctrl) {
        if (e.name === "a") return "first";
        if (e.name === "c" || e.name === "d") return "abort";
        if (e.name === "e") return "last";
        if (e.name === "g") return "reset";
      }
      if (t) {
        if (e.name === "j") return "down";
        if (e.name === "k") return "up";
      }
      return e.name === "return" || e.name === "enter" ? "submit" : e.name === "backspace" ? "delete" : e.name === "delete" ? "deleteForward" :
      e.name === "abort" ? "abort" : e.name === "escape" ? "exit" : e.name === "tab" ? "next" : e.name === "pagedown" ? "nextPage" : e.name ===
      "pageup" ? "prevPage" : e.name === "home" ? "home" : e.name === "end" ? "end" : e.name === "up" ? "up" : e.name === "down" ? "down" : e.
      name === "right" ? "right" : e.name === "left" ? "left" : !1;
    }
  };
});

// ../node_modules/prompts/lib/util/strip.js
var sn = b((jB, Zh) => {
  "use strict";
  Zh.exports = (e) => {
    let t = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"
    ].join("|"), r = new RegExp(t, "g");
    return typeof e == "string" ? e.replace(r, "") : e;
  };
});

// ../node_modules/prompts/lib/util/clear.js
var rc = b((IB, tc) => {
  "use strict";
  var Ow = sn(), { erase: ec, cursor: Pw } = le(), qw = /* @__PURE__ */ n((e) => [...Ow(e)].length, "width");
  tc.exports = function(e, t) {
    if (!t) return ec.line + Pw.to(0);
    let r = 0, i = e.split(/\r?\n/);
    for (let s of i)
      r += 1 + Math.floor(Math.max(qw(s) - 1, 0) / t);
    return ec.lines(r);
  };
});

// ../node_modules/prompts/lib/util/figures.js
var Bo = b((NB, ic) => {
  "use strict";
  var Yr = {
    arrowUp: "\u2191",
    arrowDown: "\u2193",
    arrowLeft: "\u2190",
    arrowRight: "\u2192",
    radioOn: "\u25C9",
    radioOff: "\u25EF",
    tick: "\u2714",
    cross: "\u2716",
    ellipsis: "\u2026",
    pointerSmall: "\u203A",
    line: "\u2500",
    pointer: "\u276F"
  }, Mw = {
    arrowUp: Yr.arrowUp,
    arrowDown: Yr.arrowDown,
    arrowLeft: Yr.arrowLeft,
    arrowRight: Yr.arrowRight,
    radioOn: "(*)",
    radioOff: "( )",
    tick: "\u221A",
    cross: "\xD7",
    ellipsis: "...",
    pointerSmall: "\xBB",
    line: "\u2500",
    pointer: ">"
  }, jw = process.platform === "win32" ? Mw : Yr;
  ic.exports = jw;
});

// ../node_modules/prompts/lib/util/style.js
var sc = b((UB, nc) => {
  "use strict";
  var sr = ue(), jt = Bo(), ko = Object.freeze({
    password: { scale: 1, render: /* @__PURE__ */ n((e) => "*".repeat(e.length), "render") },
    emoji: { scale: 2, render: /* @__PURE__ */ n((e) => "\u{1F603}".repeat(e.length), "render") },
    invisible: { scale: 0, render: /* @__PURE__ */ n((e) => "", "render") },
    default: { scale: 1, render: /* @__PURE__ */ n((e) => `${e}`, "render") }
  }), Iw = /* @__PURE__ */ n((e) => ko[e] || ko.default, "render"), Jr = Object.freeze({
    aborted: sr.red(jt.cross),
    done: sr.green(jt.tick),
    exited: sr.yellow(jt.cross),
    default: sr.cyan("?")
  }), Lw = /* @__PURE__ */ n((e, t, r) => t ? Jr.aborted : r ? Jr.exited : e ? Jr.done : Jr.default, "symbol"), Nw = /* @__PURE__ */ n((e) => sr.
  gray(e ? jt.ellipsis : jt.pointerSmall), "delimiter"), Uw = /* @__PURE__ */ n((e, t) => sr.gray(e ? t ? jt.pointerSmall : "+" : jt.line), "\
item");
  nc.exports = {
    styles: ko,
    render: Iw,
    symbols: Jr,
    symbol: Lw,
    delimiter: Nw,
    item: Uw
  };
});

// ../node_modules/prompts/lib/util/lines.js
var uc = b((WB, oc) => {
  "use strict";
  var Hw = sn();
  oc.exports = function(e, t) {
    let r = String(Hw(e) || "").split(/\r?\n/);
    return t ? r.map((i) => Math.ceil(i.length / t)).reduce((i, s) => i + s) : r.length;
  };
});

// ../node_modules/prompts/lib/util/wrap.js
var lc = b(($B, ac) => {
  "use strict";
  ac.exports = (e, t = {}) => {
    let r = Number.isSafeInteger(parseInt(t.margin)) ? new Array(parseInt(t.margin)).fill(" ").join("") : t.margin || "", i = t.width;
    return (e || "").split(/\r?\n/g).map((s) => s.split(/\s+/g).reduce((o, u) => (u.length + r.length >= i || o[o.length - 1].length + u.length +
    1 < i ? o[o.length - 1] += ` ${u}` : o.push(`${r}${u}`), o), [r]).join(`
`)).join(`
`);
  };
});

// ../node_modules/prompts/lib/util/entriesToDisplay.js
var hc = b((zB, fc) => {
  "use strict";
  fc.exports = (e, t, r) => {
    r = r || t;
    let i = Math.min(t - r, e - Math.floor(r / 2));
    i < 0 && (i = 0);
    let s = Math.min(i + r, t);
    return { startIndex: i, endIndex: s };
  };
});

// ../node_modules/prompts/lib/util/index.js
var Ie = b((VB, cc) => {
  "use strict";
  cc.exports = {
    action: Qh(),
    clear: rc(),
    style: sc(),
    strip: sn(),
    figures: Bo(),
    lines: uc(),
    wrap: lc(),
    entriesToDisplay: hc()
  };
});

// ../node_modules/prompts/lib/elements/prompt.js
var nt = b((GB, pc) => {
  "use strict";
  var dc = E("readline"), { action: Ww } = Ie(), $w = E("events"), { beep: zw, cursor: Vw } = le(), Gw = ue(), Oo = class extends $w {
    static {
      n(this, "Prompt");
    }
    constructor(t = {}) {
      super(), this.firstRender = !0, this.in = t.stdin || process.stdin, this.out = t.stdout || process.stdout, this.onRender = (t.onRender ||
      (() => {
      })).bind(this);
      let r = dc.createInterface({ input: this.in, escapeCodeTimeout: 50 });
      dc.emitKeypressEvents(this.in, r), this.in.isTTY && this.in.setRawMode(!0);
      let i = ["SelectPrompt", "MultiselectPrompt"].indexOf(this.constructor.name) > -1, s = /* @__PURE__ */ n((o, u) => {
        let a = Ww(u, i);
        a === !1 ? this._ && this._(o, u) : typeof this[a] == "function" ? this[a](u) : this.bell();
      }, "keypress");
      this.close = () => {
        this.out.write(Vw.show), this.in.removeListener("keypress", s), this.in.isTTY && this.in.setRawMode(!1), r.close(), this.emit(this.aborted ?
        "abort" : this.exited ? "exit" : "submit", this.value), this.closed = !0;
      }, this.in.on("keypress", s);
    }
    fire() {
      this.emit("state", {
        value: this.value,
        aborted: !!this.aborted,
        exited: !!this.exited
      });
    }
    bell() {
      this.out.write(zw);
    }
    render() {
      this.onRender(Gw), this.firstRender && (this.firstRender = !1);
    }
  };
  pc.exports = Oo;
});

// ../node_modules/prompts/lib/elements/text.js
var mc = b((JB, Dc) => {
  var on = ue(), Yw = nt(), { erase: Jw, cursor: Kr } = le(), { style: Po, clear: qo, lines: Kw, figures: Xw } = Ie(), Mo = class extends Yw {
    static {
      n(this, "TextPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = Po.render(t.style), this.scale = this.transform.scale, this.msg = t.message, this.initial = t.initial || "",
      this.validator = t.validate || (() => !0), this.value = "", this.errorMsg = t.error || "Please Enter A Valid Value", this.cursor = +!!this.
      initial, this.cursorOffset = 0, this.clear = qo("", this.out.columns), this.render();
    }
    set value(t) {
      !t && this.initial ? (this.placeholder = !0, this.rendered = on.gray(this.transform.render(this.initial))) : (this.placeholder = !1, this.
      rendered = this.transform.render(t)), this._value = t, this.fire();
    }
    get value() {
      return this._value;
    }
    reset() {
      this.value = "", this.cursor = +!!this.initial, this.cursorOffset = 0, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.value = this.value || this.initial, this.done = this.aborted = !0, this.error = !1, this.red = !1, this.fire(), this.render(), this.
      out.write(`
`), this.close();
    }
    async validate() {
      let t = await this.validator(this.value);
      typeof t == "string" && (this.errorMsg = t, t = !1), this.error = !t;
    }
    async submit() {
      if (this.value = this.value || this.initial, this.cursorOffset = 0, this.cursor = this.rendered.length, await this.validate(), this.error) {
        this.red = !0, this.fire(), this.render();
        return;
      }
      this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    next() {
      if (!this.placeholder) return this.bell();
      this.value = this.initial, this.cursor = this.rendered.length, this.fire(), this.render();
    }
    moveCursor(t) {
      this.placeholder || (this.cursor = this.cursor + t, this.cursorOffset += t);
    }
    _(t, r) {
      let i = this.value.slice(0, this.cursor), s = this.value.slice(this.cursor);
      this.value = `${i}${t}${s}`, this.red = !1, this.cursor = this.placeholder ? 0 : i.length + 1, this.render();
    }
    delete() {
      if (this.isCursorAtStart()) return this.bell();
      let t = this.value.slice(0, this.cursor - 1), r = this.value.slice(this.cursor);
      this.value = `${t}${r}`, this.red = !1, this.isCursorAtStart() ? this.cursorOffset = 0 : (this.cursorOffset++, this.moveCursor(-1)), this.
      render();
    }
    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
      let t = this.value.slice(0, this.cursor), r = this.value.slice(this.cursor + 1);
      this.value = `${t}${r}`, this.red = !1, this.isCursorAtEnd() ? this.cursorOffset = 0 : this.cursorOffset++, this.render();
    }
    first() {
      this.cursor = 0, this.render();
    }
    last() {
      this.cursor = this.value.length, this.render();
    }
    left() {
      if (this.cursor <= 0 || this.placeholder) return this.bell();
      this.moveCursor(-1), this.render();
    }
    right() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
      this.moveCursor(1), this.render();
    }
    isCursorAtStart() {
      return this.cursor === 0 || this.placeholder && this.cursor === 1;
    }
    isCursorAtEnd() {
      return this.cursor === this.rendered.length || this.placeholder && this.cursor === this.rendered.length + 1;
    }
    render() {
      this.closed || (this.firstRender || (this.outputError && this.out.write(Kr.down(Kw(this.outputError, this.out.columns) - 1) + qo(this.
      outputError, this.out.columns)), this.out.write(qo(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [
        Po.symbol(this.done, this.aborted),
        on.bold(this.msg),
        Po.delimiter(this.done),
        this.red ? on.red(this.rendered) : this.rendered
      ].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : Xw.pointerSmall} ${on.red().italic(r)}`, "")), this.out.write(Jw.line + Kr.to(0) + this.outputText + Kr.save + this.outputError +
      Kr.restore + Kr.move(this.cursorOffset, 0)));
    }
  };
  Dc.exports = Mo;
});

// ../node_modules/prompts/lib/elements/select.js
var vc = b((XB, bc) => {
  "use strict";
  var st = ue(), Qw = nt(), { style: gc, clear: yc, figures: un, wrap: Zw, entriesToDisplay: e_ } = Ie(), { cursor: t_ } = le(), jo = class extends Qw {
    static {
      n(this, "SelectPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.hint = t.hint || "- Use arrow-keys. Return to submit.", this.warn = t.warn || "- This option is d\
isabled", this.cursor = t.initial || 0, this.choices = t.choices.map((r, i) => (typeof r == "string" && (r = { title: r, value: i }), {
        title: r && (r.title || r.value || r),
        value: r && (r.value === void 0 ? i : r.value),
        description: r && r.description,
        selected: r && r.selected,
        disabled: r && r.disabled
      })), this.optionsPerPage = t.optionsPerPage || 10, this.value = (this.choices[this.cursor] || {}).value, this.clear = yc("", this.out.
      columns), this.render();
    }
    moveCursor(t) {
      this.cursor = t, this.value = this.choices[t].value, this.fire();
    }
    reset() {
      this.moveCursor(0), this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.selection.disabled ? this.bell() : (this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close());
    }
    first() {
      this.moveCursor(0), this.render();
    }
    last() {
      this.moveCursor(this.choices.length - 1), this.render();
    }
    up() {
      this.cursor === 0 ? this.moveCursor(this.choices.length - 1) : this.moveCursor(this.cursor - 1), this.render();
    }
    down() {
      this.cursor === this.choices.length - 1 ? this.moveCursor(0) : this.moveCursor(this.cursor + 1), this.render();
    }
    next() {
      this.moveCursor((this.cursor + 1) % this.choices.length), this.render();
    }
    _(t, r) {
      if (t === " ") return this.submit();
    }
    get selection() {
      return this.choices[this.cursor];
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(t_.hide) : this.out.write(yc(this.outputText, this.out.columns)), super.render();
      let { startIndex: t, endIndex: r } = e_(this.cursor, this.choices.length, this.optionsPerPage);
      if (this.outputText = [
        gc.symbol(this.done, this.aborted),
        st.bold(this.msg),
        gc.delimiter(!1),
        this.done ? this.selection.title : this.selection.disabled ? st.yellow(this.warn) : st.gray(this.hint)
      ].join(" "), !this.done) {
        this.outputText += `
`;
        for (let i = t; i < r; i++) {
          let s, o, u = "", a = this.choices[i];
          i === t && t > 0 ? o = un.arrowUp : i === r - 1 && r < this.choices.length ? o = un.arrowDown : o = " ", a.disabled ? (s = this.cursor ===
          i ? st.gray().underline(a.title) : st.strikethrough().gray(a.title), o = (this.cursor === i ? st.bold().gray(un.pointer) + " " : "\
  ") + o) : (s = this.cursor === i ? st.cyan().underline(a.title) : a.title, o = (this.cursor === i ? st.cyan(un.pointer) + " " : "  ") + o,
          a.description && this.cursor === i && (u = ` - ${a.description}`, (o.length + s.length + u.length >= this.out.columns || a.description.
          split(/\r?\n/).length > 1) && (u = `
` + Zw(a.description, { margin: 3, width: this.out.columns })))), this.outputText += `${o} ${s}${st.gray(u)}
`;
        }
      }
      this.out.write(this.outputText);
    }
  };
  bc.exports = jo;
});

// ../node_modules/prompts/lib/elements/toggle.js
var Cc = b((ZB, Ec) => {
  var an = ue(), r_ = nt(), { style: wc, clear: i_ } = Ie(), { cursor: _c, erase: n_ } = le(), Io = class extends r_ {
    static {
      n(this, "TogglePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.value = !!t.initial, this.active = t.active || "on", this.inactive = t.inactive || "off", this.initialValue =
      this.value, this.render();
    }
    reset() {
      this.value = this.initialValue, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    deactivate() {
      if (this.value === !1) return this.bell();
      this.value = !1, this.render();
    }
    activate() {
      if (this.value === !0) return this.bell();
      this.value = !0, this.render();
    }
    delete() {
      this.deactivate();
    }
    left() {
      this.deactivate();
    }
    right() {
      this.activate();
    }
    down() {
      this.deactivate();
    }
    up() {
      this.activate();
    }
    next() {
      this.value = !this.value, this.fire(), this.render();
    }
    _(t, r) {
      if (t === " ")
        this.value = !this.value;
      else if (t === "1")
        this.value = !0;
      else if (t === "0")
        this.value = !1;
      else return this.bell();
      this.render();
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(_c.hide) : this.out.write(i_(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        wc.symbol(this.done, this.aborted),
        an.bold(this.msg),
        wc.delimiter(this.done),
        this.value ? this.inactive : an.cyan().underline(this.inactive),
        an.gray("/"),
        this.value ? an.cyan().underline(this.active) : this.active
      ].join(" "), this.out.write(n_.line + _c.to(0) + this.outputText));
    }
  };
  Ec.exports = Io;
});

// ../node_modules/prompts/lib/dateparts/datepart.js
var ze = b((t6, Fc) => {
  "use strict";
  var Lo = class e {
    static {
      n(this, "DatePart");
    }
    constructor({ token: t, date: r, parts: i, locales: s }) {
      this.token = t, this.date = r || /* @__PURE__ */ new Date(), this.parts = i || [this], this.locales = s || {};
    }
    up() {
    }
    down() {
    }
    next() {
      let t = this.parts.indexOf(this);
      return this.parts.find((r, i) => i > t && r instanceof e);
    }
    setTo(t) {
    }
    prev() {
      let t = [].concat(this.parts).reverse(), r = t.indexOf(this);
      return t.find((i, s) => s > r && i instanceof e);
    }
    toString() {
      return String(this.date);
    }
  };
  Fc.exports = Lo;
});

// ../node_modules/prompts/lib/dateparts/meridiem.js
var Sc = b((i6, xc) => {
  "use strict";
  var s_ = ze(), No = class extends s_ {
    static {
      n(this, "Meridiem");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setHours((this.date.getHours() + 12) % 24);
    }
    down() {
      this.up();
    }
    toString() {
      let t = this.date.getHours() > 12 ? "pm" : "am";
      return /\A/.test(this.token) ? t.toUpperCase() : t;
    }
  };
  xc.exports = No;
});

// ../node_modules/prompts/lib/dateparts/day.js
var Tc = b((s6, Ac) => {
  "use strict";
  var o_ = ze(), u_ = /* @__PURE__ */ n((e) => (e = e % 10, e === 1 ? "st" : e === 2 ? "nd" : e === 3 ? "rd" : "th"), "pos"), Uo = class extends o_ {
    static {
      n(this, "Day");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setDate(this.date.getDate() + 1);
    }
    down() {
      this.date.setDate(this.date.getDate() - 1);
    }
    setTo(t) {
      this.date.setDate(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getDate(), r = this.date.getDay();
      return this.token === "DD" ? String(t).padStart(2, "0") : this.token === "Do" ? t + u_(t) : this.token === "d" ? r + 1 : this.token ===
      "ddd" ? this.locales.weekdaysShort[r] : this.token === "dddd" ? this.locales.weekdays[r] : t;
    }
  };
  Ac.exports = Uo;
});

// ../node_modules/prompts/lib/dateparts/hours.js
var Bc = b((u6, Rc) => {
  "use strict";
  var a_ = ze(), Ho = class extends a_ {
    static {
      n(this, "Hours");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setHours(this.date.getHours() + 1);
    }
    down() {
      this.date.setHours(this.date.getHours() - 1);
    }
    setTo(t) {
      this.date.setHours(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getHours();
      return /h/.test(this.token) && (t = t % 12 || 12), this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  Rc.exports = Ho;
});

// ../node_modules/prompts/lib/dateparts/milliseconds.js
var Oc = b((l6, kc) => {
  "use strict";
  var l_ = ze(), Wo = class extends l_ {
    static {
      n(this, "Milliseconds");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMilliseconds(this.date.getMilliseconds() + 1);
    }
    down() {
      this.date.setMilliseconds(this.date.getMilliseconds() - 1);
    }
    setTo(t) {
      this.date.setMilliseconds(parseInt(t.substr(-this.token.length)));
    }
    toString() {
      return String(this.date.getMilliseconds()).padStart(4, "0").substr(0, this.token.length);
    }
  };
  kc.exports = Wo;
});

// ../node_modules/prompts/lib/dateparts/minutes.js
var qc = b((h6, Pc) => {
  "use strict";
  var f_ = ze(), $o = class extends f_ {
    static {
      n(this, "Minutes");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMinutes(this.date.getMinutes() + 1);
    }
    down() {
      this.date.setMinutes(this.date.getMinutes() - 1);
    }
    setTo(t) {
      this.date.setMinutes(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getMinutes();
      return this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  Pc.exports = $o;
});

// ../node_modules/prompts/lib/dateparts/month.js
var jc = b((d6, Mc) => {
  "use strict";
  var h_ = ze(), zo = class extends h_ {
    static {
      n(this, "Month");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setMonth(this.date.getMonth() + 1);
    }
    down() {
      this.date.setMonth(this.date.getMonth() - 1);
    }
    setTo(t) {
      t = parseInt(t.substr(-2)) - 1, this.date.setMonth(t < 0 ? 0 : t);
    }
    toString() {
      let t = this.date.getMonth(), r = this.token.length;
      return r === 2 ? String(t + 1).padStart(2, "0") : r === 3 ? this.locales.monthsShort[t] : r === 4 ? this.locales.months[t] : String(t +
      1);
    }
  };
  Mc.exports = zo;
});

// ../node_modules/prompts/lib/dateparts/seconds.js
var Lc = b((D6, Ic) => {
  "use strict";
  var c_ = ze(), Vo = class extends c_ {
    static {
      n(this, "Seconds");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setSeconds(this.date.getSeconds() + 1);
    }
    down() {
      this.date.setSeconds(this.date.getSeconds() - 1);
    }
    setTo(t) {
      this.date.setSeconds(parseInt(t.substr(-2)));
    }
    toString() {
      let t = this.date.getSeconds();
      return this.token.length > 1 ? String(t).padStart(2, "0") : t;
    }
  };
  Ic.exports = Vo;
});

// ../node_modules/prompts/lib/dateparts/year.js
var Uc = b((g6, Nc) => {
  "use strict";
  var d_ = ze(), Go = class extends d_ {
    static {
      n(this, "Year");
    }
    constructor(t = {}) {
      super(t);
    }
    up() {
      this.date.setFullYear(this.date.getFullYear() + 1);
    }
    down() {
      this.date.setFullYear(this.date.getFullYear() - 1);
    }
    setTo(t) {
      this.date.setFullYear(t.substr(-4));
    }
    toString() {
      let t = String(this.date.getFullYear()).padStart(4, "0");
      return this.token.length === 2 ? t.substr(-2) : t;
    }
  };
  Nc.exports = Go;
});

// ../node_modules/prompts/lib/dateparts/index.js
var Wc = b((b6, Hc) => {
  "use strict";
  Hc.exports = {
    DatePart: ze(),
    Meridiem: Sc(),
    Day: Tc(),
    Hours: Bc(),
    Milliseconds: Oc(),
    Minutes: qc(),
    Month: jc(),
    Seconds: Lc(),
    Year: Uc()
  };
});

// ../node_modules/prompts/lib/elements/date.js
var Kc = b((v6, Jc) => {
  "use strict";
  var Yo = ue(), p_ = nt(), { style: $c, clear: zc, figures: D_ } = Ie(), { erase: m_, cursor: Vc } = le(), { DatePart: Gc, Meridiem: g_, Day: y_,
  Hours: b_, Milliseconds: v_, Minutes: w_, Month: __, Seconds: E_, Year: C_ } = Wc(), F_ = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g,
  Yc = {
    1: ({ token: e }) => e.replace(/\\(.)/g, "$1"),
    2: (e) => new y_(e),
    // Day // TODO
    3: (e) => new __(e),
    // Month
    4: (e) => new C_(e),
    // Year
    5: (e) => new g_(e),
    // AM/PM // TODO (special)
    6: (e) => new b_(e),
    // Hours
    7: (e) => new w_(e),
    // Minutes
    8: (e) => new E_(e),
    // Seconds
    9: (e) => new v_(e)
    // Fractional seconds
  }, x_ = {
    months: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
    monthsShort: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
    weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
    weekdaysShort: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",")
  }, Jo = class extends p_ {
    static {
      n(this, "DatePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = 0, this.typed = "", this.locales = Object.assign(x_, t.locales), this._date = t.initial ||
      /* @__PURE__ */ new Date(), this.errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.mask =
      t.mask || "YYYY-MM-DD HH:mm:ss", this.clear = zc("", this.out.columns), this.render();
    }
    get value() {
      return this.date;
    }
    get date() {
      return this._date;
    }
    set date(t) {
      t && this._date.setTime(t.getTime());
    }
    set mask(t) {
      let r;
      for (this.parts = []; r = F_.exec(t); ) {
        let s = r.shift(), o = r.findIndex((u) => u != null);
        this.parts.push(o in Yc ? Yc[o]({ token: r[o] || s, date: this.date, parts: this.parts, locales: this.locales }) : r[o] || s);
      }
      let i = this.parts.reduce((s, o) => (typeof o == "string" && typeof s[s.length - 1] == "string" ? s[s.length - 1] += o : s.push(o), s),
      []);
      this.parts.splice(0), this.parts.push(...i), this.reset();
    }
    moveCursor(t) {
      this.typed = "", this.cursor = t, this.fire();
    }
    reset() {
      this.moveCursor(this.parts.findIndex((t) => t instanceof Gc)), this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.error = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    async validate() {
      let t = await this.validator(this.value);
      typeof t == "string" && (this.errorMsg = t, t = !1), this.error = !t;
    }
    async submit() {
      if (await this.validate(), this.error) {
        this.color = "red", this.fire(), this.render();
        return;
      }
      this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    up() {
      this.typed = "", this.parts[this.cursor].up(), this.render();
    }
    down() {
      this.typed = "", this.parts[this.cursor].down(), this.render();
    }
    left() {
      let t = this.parts[this.cursor].prev();
      if (t == null) return this.bell();
      this.moveCursor(this.parts.indexOf(t)), this.render();
    }
    right() {
      let t = this.parts[this.cursor].next();
      if (t == null) return this.bell();
      this.moveCursor(this.parts.indexOf(t)), this.render();
    }
    next() {
      let t = this.parts[this.cursor].next();
      this.moveCursor(t ? this.parts.indexOf(t) : this.parts.findIndex((r) => r instanceof Gc)), this.render();
    }
    _(t) {
      /\d/.test(t) && (this.typed += t, this.parts[this.cursor].setTo(this.typed), this.render());
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(Vc.hide) : this.out.write(zc(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        $c.symbol(this.done, this.aborted),
        Yo.bold(this.msg),
        $c.delimiter(!1),
        this.parts.reduce((t, r, i) => t.concat(i === this.cursor && !this.done ? Yo.cyan().underline(r.toString()) : r), []).join("")
      ].join(" "), this.error && (this.outputText += this.errorMsg.split(`
`).reduce(
        (t, r, i) => t + `
${i ? " " : D_.pointerSmall} ${Yo.red().italic(r)}`,
        ""
      )), this.out.write(m_.line + Vc.to(0) + this.outputText));
    }
  };
  Jc.exports = Jo;
});

// ../node_modules/prompts/lib/elements/number.js
var ed = b((_6, Zc) => {
  var ln = ue(), S_ = nt(), { cursor: fn, erase: A_ } = le(), { style: Ko, figures: T_, clear: Xc, lines: R_ } = Ie(), B_ = /[0-9]/, Xo = /* @__PURE__ */ n(
  (e) => e !== void 0, "isDef"), Qc = /* @__PURE__ */ n((e, t) => {
    let r = Math.pow(10, t);
    return Math.round(e * r) / r;
  }, "round"), Qo = class extends S_ {
    static {
      n(this, "NumberPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = Ko.render(t.style), this.msg = t.message, this.initial = Xo(t.initial) ? t.initial : "", this.float = !!t.float,
      this.round = t.round || 2, this.inc = t.increment || 1, this.min = Xo(t.min) ? t.min : -1 / 0, this.max = Xo(t.max) ? t.max : 1 / 0, this.
      errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.color = "cyan", this.value = "", this.
      typed = "", this.lastHit = 0, this.render();
    }
    set value(t) {
      !t && t !== 0 ? (this.placeholder = !0, this.rendered = ln.gray(this.transform.render(`${this.initial}`)), this._value = "") : (this.placeholder =
      !1, this.rendered = this.transform.render(`${Qc(t, this.round)}`), this._value = Qc(t, this.round)), this.fire();
    }
    get value() {
      return this._value;
    }
    parse(t) {
      return this.float ? parseFloat(t) : parseInt(t);
    }
    valid(t) {
      return t === "-" || t === "." && this.float || B_.test(t);
    }
    reset() {
      this.typed = "", this.value = "", this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      let t = this.value;
      this.value = t !== "" ? t : this.initial, this.done = this.aborted = !0, this.error = !1, this.fire(), this.render(), this.out.write(`\

`), this.close();
    }
    async validate() {
      let t = await this.validator(this.value);
      typeof t == "string" && (this.errorMsg = t, t = !1), this.error = !t;
    }
    async submit() {
      if (await this.validate(), this.error) {
        this.color = "red", this.fire(), this.render();
        return;
      }
      let t = this.value;
      this.value = t !== "" ? t : this.initial, this.done = !0, this.aborted = !1, this.error = !1, this.fire(), this.render(), this.out.write(
      `
`), this.close();
    }
    up() {
      if (this.typed = "", this.value === "" && (this.value = this.min - this.inc), this.value >= this.max) return this.bell();
      this.value += this.inc, this.color = "cyan", this.fire(), this.render();
    }
    down() {
      if (this.typed = "", this.value === "" && (this.value = this.min + this.inc), this.value <= this.min) return this.bell();
      this.value -= this.inc, this.color = "cyan", this.fire(), this.render();
    }
    delete() {
      let t = this.value.toString();
      if (t.length === 0) return this.bell();
      this.value = this.parse(t = t.slice(0, -1)) || "", this.value !== "" && this.value < this.min && (this.value = this.min), this.color =
      "cyan", this.fire(), this.render();
    }
    next() {
      this.value = this.initial, this.fire(), this.render();
    }
    _(t, r) {
      if (!this.valid(t)) return this.bell();
      let i = Date.now();
      if (i - this.lastHit > 1e3 && (this.typed = ""), this.typed += t, this.lastHit = i, this.color = "cyan", t === ".") return this.fire();
      this.value = Math.min(this.parse(this.typed), this.max), this.value > this.max && (this.value = this.max), this.value < this.min && (this.
      value = this.min), this.fire(), this.render();
    }
    render() {
      this.closed || (this.firstRender || (this.outputError && this.out.write(fn.down(R_(this.outputError, this.out.columns) - 1) + Xc(this.
      outputError, this.out.columns)), this.out.write(Xc(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [
        Ko.symbol(this.done, this.aborted),
        ln.bold(this.msg),
        Ko.delimiter(this.done),
        !this.done || !this.done && !this.placeholder ? ln[this.color]().underline(this.rendered) : this.rendered
      ].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : T_.pointerSmall} ${ln.red().italic(r)}`, "")), this.out.write(A_.line + fn.to(0) + this.outputText + fn.save + this.outputError +
      fn.restore));
    }
  };
  Zc.exports = Qo;
});

// ../node_modules/prompts/lib/elements/multiselect.js
var eu = b((C6, id) => {
  "use strict";
  var Ve = ue(), { cursor: k_ } = le(), O_ = nt(), { clear: td, figures: Ct, style: rd, wrap: P_, entriesToDisplay: q_ } = Ie(), Zo = class extends O_ {
    static {
      n(this, "MultiselectPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = t.cursor || 0, this.scrollIndex = t.cursor || 0, this.hint = t.hint || "", this.warn = t.
      warn || "- This option is disabled -", this.minSelected = t.min, this.showMinError = !1, this.maxChoices = t.max, this.instructions = t.
      instructions, this.optionsPerPage = t.optionsPerPage || 10, this.value = t.choices.map((r, i) => (typeof r == "string" && (r = { title: r,
      value: i }), {
        title: r && (r.title || r.value || r),
        description: r && r.description,
        value: r && (r.value === void 0 ? i : r.value),
        selected: r && r.selected,
        disabled: r && r.disabled
      })), this.clear = td("", this.out.columns), t.overrideRender || this.render();
    }
    reset() {
      this.value.map((t) => !t.selected), this.cursor = 0, this.fire(), this.render();
    }
    selected() {
      return this.value.filter((t) => t.selected);
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      let t = this.value.filter((r) => r.selected);
      this.minSelected && t.length < this.minSelected ? (this.showMinError = !0, this.render()) : (this.done = !0, this.aborted = !1, this.fire(),
      this.render(), this.out.write(`
`), this.close());
    }
    first() {
      this.cursor = 0, this.render();
    }
    last() {
      this.cursor = this.value.length - 1, this.render();
    }
    next() {
      this.cursor = (this.cursor + 1) % this.value.length, this.render();
    }
    up() {
      this.cursor === 0 ? this.cursor = this.value.length - 1 : this.cursor--, this.render();
    }
    down() {
      this.cursor === this.value.length - 1 ? this.cursor = 0 : this.cursor++, this.render();
    }
    left() {
      this.value[this.cursor].selected = !1, this.render();
    }
    right() {
      if (this.value.filter((t) => t.selected).length >= this.maxChoices) return this.bell();
      this.value[this.cursor].selected = !0, this.render();
    }
    handleSpaceToggle() {
      let t = this.value[this.cursor];
      if (t.selected)
        t.selected = !1, this.render();
      else {
        if (t.disabled || this.value.filter((r) => r.selected).length >= this.maxChoices)
          return this.bell();
        t.selected = !0, this.render();
      }
    }
    toggleAll() {
      if (this.maxChoices !== void 0 || this.value[this.cursor].disabled)
        return this.bell();
      let t = !this.value[this.cursor].selected;
      this.value.filter((r) => !r.disabled).forEach((r) => r.selected = t), this.render();
    }
    _(t, r) {
      if (t === " ")
        this.handleSpaceToggle();
      else if (t === "a")
        this.toggleAll();
      else
        return this.bell();
    }
    renderInstructions() {
      return this.instructions === void 0 || this.instructions ? typeof this.instructions == "string" ? this.instructions : `
Instructions:
    ${Ct.arrowUp}/${Ct.arrowDown}: Highlight option
    ${Ct.arrowLeft}/${Ct.arrowRight}/[space]: Toggle selection
` + (this.maxChoices === void 0 ? `    a: Toggle all
` : "") + "    enter/return: Complete answer" : "";
    }
    renderOption(t, r, i, s) {
      let o = (r.selected ? Ve.green(Ct.radioOn) : Ct.radioOff) + " " + s + " ", u, a;
      return r.disabled ? u = t === i ? Ve.gray().underline(r.title) : Ve.strikethrough().gray(r.title) : (u = t === i ? Ve.cyan().underline(
      r.title) : r.title, t === i && r.description && (a = ` - ${r.description}`, (o.length + u.length + a.length >= this.out.columns || r.description.
      split(/\r?\n/).length > 1) && (a = `
` + P_(r.description, { margin: o.length, width: this.out.columns })))), o + u + Ve.gray(a || "");
    }
    // shared with autocompleteMultiselect
    paginateOptions(t) {
      if (t.length === 0)
        return Ve.red("No matches for this query.");
      let { startIndex: r, endIndex: i } = q_(this.cursor, t.length, this.optionsPerPage), s, o = [];
      for (let u = r; u < i; u++)
        u === r && r > 0 ? s = Ct.arrowUp : u === i - 1 && i < t.length ? s = Ct.arrowDown : s = " ", o.push(this.renderOption(this.cursor, t[u],
        u, s));
      return `
` + o.join(`
`);
    }
    // shared with autocomleteMultiselect
    renderOptions(t) {
      return this.done ? "" : this.paginateOptions(t);
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [Ve.gray(this.hint), this.renderInstructions()];
      return this.value[this.cursor].disabled && t.push(Ve.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(k_.hide), super.render();
      let t = [
        rd.symbol(this.done, this.aborted),
        Ve.bold(this.msg),
        rd.delimiter(!1),
        this.renderDoneOrInstructions()
      ].join(" ");
      this.showMinError && (t += Ve.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.value), this.out.write(this.clear + t), this.clear = td(t, this.out.columns);
    }
  };
  id.exports = Zo;
});

// ../node_modules/prompts/lib/elements/autocomplete.js
var ad = b((x6, ud) => {
  "use strict";
  var Xr = ue(), M_ = nt(), { erase: j_, cursor: nd } = le(), { style: tu, clear: sd, figures: ru, wrap: I_, entriesToDisplay: L_ } = Ie(), od = /* @__PURE__ */ n(
  (e, t) => e[t] && (e[t].value || e[t].title || e[t]), "getVal"), N_ = /* @__PURE__ */ n((e, t) => e[t] && (e[t].title || e[t].value || e[t]),
  "getTitle"), U_ = /* @__PURE__ */ n((e, t) => {
    let r = e.findIndex((i) => i.value === t || i.title === t);
    return r > -1 ? r : void 0;
  }, "getIndex"), iu = class extends M_ {
    static {
      n(this, "AutocompletePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.suggest = t.suggest, this.choices = t.choices, this.initial = typeof t.initial == "number" ? t.initial :
      U_(t.choices, t.initial), this.select = this.initial || t.cursor || 0, this.i18n = { noMatches: t.noMatches || "no matches found" }, this.
      fallback = t.fallback || this.initial, this.clearFirst = t.clearFirst || !1, this.suggestions = [], this.input = "", this.limit = t.limit ||
      10, this.cursor = 0, this.transform = tu.render(t.style), this.scale = this.transform.scale, this.render = this.render.bind(this), this.
      complete = this.complete.bind(this), this.clear = sd("", this.out.columns), this.complete(this.render), this.render();
    }
    set fallback(t) {
      this._fb = Number.isSafeInteger(parseInt(t)) ? parseInt(t) : t;
    }
    get fallback() {
      let t;
      return typeof this._fb == "number" ? t = this.choices[this._fb] : typeof this._fb == "string" && (t = { title: this._fb }), t || this.
      _fb || { title: this.i18n.noMatches };
    }
    moveSelect(t) {
      this.select = t, this.suggestions.length > 0 ? this.value = od(this.suggestions, t) : this.value = this.fallback.value, this.fire();
    }
    async complete(t) {
      let r = this.completing = this.suggest(this.input, this.choices), i = await r;
      if (this.completing !== r) return;
      this.suggestions = i.map((o, u, a) => ({ title: N_(a, u), value: od(a, u), description: o.description })), this.completing = !1;
      let s = Math.max(i.length - 1, 0);
      this.moveSelect(Math.min(s, this.select)), t && t();
    }
    reset() {
      this.input = "", this.complete(() => {
        this.moveSelect(this.initial !== void 0 ? this.initial : 0), this.render();
      }), this.render();
    }
    exit() {
      this.clearFirst && this.input.length > 0 ? this.reset() : (this.done = this.exited = !0, this.aborted = !1, this.fire(), this.render(),
      this.out.write(`
`), this.close());
    }
    abort() {
      this.done = this.aborted = !0, this.exited = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.done = !0, this.aborted = this.exited = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    _(t, r) {
      let i = this.input.slice(0, this.cursor), s = this.input.slice(this.cursor);
      this.input = `${i}${t}${s}`, this.cursor = i.length + 1, this.complete(this.render), this.render();
    }
    delete() {
      if (this.cursor === 0) return this.bell();
      let t = this.input.slice(0, this.cursor - 1), r = this.input.slice(this.cursor);
      this.input = `${t}${r}`, this.complete(this.render), this.cursor = this.cursor - 1, this.render();
    }
    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell();
      let t = this.input.slice(0, this.cursor), r = this.input.slice(this.cursor + 1);
      this.input = `${t}${r}`, this.complete(this.render), this.render();
    }
    first() {
      this.moveSelect(0), this.render();
    }
    last() {
      this.moveSelect(this.suggestions.length - 1), this.render();
    }
    up() {
      this.select === 0 ? this.moveSelect(this.suggestions.length - 1) : this.moveSelect(this.select - 1), this.render();
    }
    down() {
      this.select === this.suggestions.length - 1 ? this.moveSelect(0) : this.moveSelect(this.select + 1), this.render();
    }
    next() {
      this.select === this.suggestions.length - 1 ? this.moveSelect(0) : this.moveSelect(this.select + 1), this.render();
    }
    nextPage() {
      this.moveSelect(Math.min(this.select + this.limit, this.suggestions.length - 1)), this.render();
    }
    prevPage() {
      this.moveSelect(Math.max(this.select - this.limit, 0)), this.render();
    }
    left() {
      if (this.cursor <= 0) return this.bell();
      this.cursor = this.cursor - 1, this.render();
    }
    right() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell();
      this.cursor = this.cursor + 1, this.render();
    }
    renderOption(t, r, i, s) {
      let o, u = i ? ru.arrowUp : s ? ru.arrowDown : " ", a = r ? Xr.cyan().underline(t.title) : t.title;
      return u = (r ? Xr.cyan(ru.pointer) + " " : "  ") + u, t.description && (o = ` - ${t.description}`, (u.length + a.length + o.length >=
      this.out.columns || t.description.split(/\r?\n/).length > 1) && (o = `
` + I_(t.description, { margin: 3, width: this.out.columns }))), u + " " + a + Xr.gray(o || "");
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(nd.hide) : this.out.write(sd(this.outputText, this.out.columns)), super.render();
      let { startIndex: t, endIndex: r } = L_(this.select, this.choices.length, this.limit);
      if (this.outputText = [
        tu.symbol(this.done, this.aborted, this.exited),
        Xr.bold(this.msg),
        tu.delimiter(this.completing),
        this.done && this.suggestions[this.select] ? this.suggestions[this.select].title : this.rendered = this.transform.render(this.input)
      ].join(" "), !this.done) {
        let i = this.suggestions.slice(t, r).map((s, o) => this.renderOption(
          s,
          this.select === o + t,
          o === 0 && t > 0,
          o + t === r - 1 && r < this.choices.length
        )).join(`
`);
        this.outputText += `
` + (i || Xr.gray(this.fallback.title));
      }
      this.out.write(j_.line + nd.to(0) + this.outputText);
    }
  };
  ud.exports = iu;
});

// ../node_modules/prompts/lib/elements/autocompleteMultiselect.js
var cd = b((A6, hd) => {
  "use strict";
  var ot = ue(), { cursor: H_ } = le(), W_ = eu(), { clear: ld, style: fd, figures: or } = Ie(), nu = class extends W_ {
    static {
      n(this, "AutocompleteMultiselectPrompt");
    }
    constructor(t = {}) {
      t.overrideRender = !0, super(t), this.inputValue = "", this.clear = ld("", this.out.columns), this.filteredOptions = this.value, this.
      render();
    }
    last() {
      this.cursor = this.filteredOptions.length - 1, this.render();
    }
    next() {
      this.cursor = (this.cursor + 1) % this.filteredOptions.length, this.render();
    }
    up() {
      this.cursor === 0 ? this.cursor = this.filteredOptions.length - 1 : this.cursor--, this.render();
    }
    down() {
      this.cursor === this.filteredOptions.length - 1 ? this.cursor = 0 : this.cursor++, this.render();
    }
    left() {
      this.filteredOptions[this.cursor].selected = !1, this.render();
    }
    right() {
      if (this.value.filter((t) => t.selected).length >= this.maxChoices) return this.bell();
      this.filteredOptions[this.cursor].selected = !0, this.render();
    }
    delete() {
      this.inputValue.length && (this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1), this.updateFilteredOptions());
    }
    updateFilteredOptions() {
      let t = this.filteredOptions[this.cursor];
      this.filteredOptions = this.value.filter((i) => this.inputValue ? !!(typeof i.title == "string" && i.title.toLowerCase().includes(this.
      inputValue.toLowerCase()) || typeof i.value == "string" && i.value.toLowerCase().includes(this.inputValue.toLowerCase())) : !0);
      let r = this.filteredOptions.findIndex((i) => i === t);
      this.cursor = r < 0 ? 0 : r, this.render();
    }
    handleSpaceToggle() {
      let t = this.filteredOptions[this.cursor];
      if (t.selected)
        t.selected = !1, this.render();
      else {
        if (t.disabled || this.value.filter((r) => r.selected).length >= this.maxChoices)
          return this.bell();
        t.selected = !0, this.render();
      }
    }
    handleInputChange(t) {
      this.inputValue = this.inputValue + t, this.updateFilteredOptions();
    }
    _(t, r) {
      t === " " ? this.handleSpaceToggle() : this.handleInputChange(t);
    }
    renderInstructions() {
      return this.instructions === void 0 || this.instructions ? typeof this.instructions == "string" ? this.instructions : `
Instructions:
    ${or.arrowUp}/${or.arrowDown}: Highlight option
    ${or.arrowLeft}/${or.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
` : "";
    }
    renderCurrentInput() {
      return `
Filtered results for: ${this.inputValue ? this.inputValue : ot.gray("Enter something to filter")}
`;
    }
    renderOption(t, r, i) {
      let s;
      return r.disabled ? s = t === i ? ot.gray().underline(r.title) : ot.strikethrough().gray(r.title) : s = t === i ? ot.cyan().underline(
      r.title) : r.title, (r.selected ? ot.green(or.radioOn) : or.radioOff) + "  " + s;
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [ot.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];
      return this.filteredOptions.length && this.filteredOptions[this.cursor].disabled && t.push(ot.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(H_.hide), super.render();
      let t = [
        fd.symbol(this.done, this.aborted),
        ot.bold(this.msg),
        fd.delimiter(!1),
        this.renderDoneOrInstructions()
      ].join(" ");
      this.showMinError && (t += ot.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.filteredOptions), this.out.write(this.clear + t), this.clear = ld(t, this.out.columns);
    }
  };
  hd.exports = nu;
});

// ../node_modules/prompts/lib/elements/confirm.js
var gd = b((R6, md) => {
  var dd = ue(), $_ = nt(), { style: pd, clear: z_ } = Ie(), { erase: V_, cursor: Dd } = le(), su = class extends $_ {
    static {
      n(this, "ConfirmPrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.value = t.initial, this.initialValue = !!t.initial, this.yesMsg = t.yes || "yes", this.yesOption =
      t.yesOption || "(Y/n)", this.noMsg = t.no || "no", this.noOption = t.noOption || "(y/N)", this.render();
    }
    reset() {
      this.value = this.initialValue, this.fire(), this.render();
    }
    exit() {
      this.abort();
    }
    abort() {
      this.done = this.aborted = !0, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    submit() {
      this.value = this.value || !1, this.done = !0, this.aborted = !1, this.fire(), this.render(), this.out.write(`
`), this.close();
    }
    _(t, r) {
      return t.toLowerCase() === "y" ? (this.value = !0, this.submit()) : t.toLowerCase() === "n" ? (this.value = !1, this.submit()) : this.
      bell();
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(Dd.hide) : this.out.write(z_(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        pd.symbol(this.done, this.aborted),
        dd.bold(this.msg),
        pd.delimiter(this.done),
        this.done ? this.value ? this.yesMsg : this.noMsg : dd.gray(this.initialValue ? this.yesOption : this.noOption)
      ].join(" "), this.out.write(V_.line + Dd.to(0) + this.outputText));
    }
  };
  md.exports = su;
});

// ../node_modules/prompts/lib/elements/index.js
var bd = b((k6, yd) => {
  "use strict";
  yd.exports = {
    TextPrompt: mc(),
    SelectPrompt: vc(),
    TogglePrompt: Cc(),
    DatePrompt: Kc(),
    NumberPrompt: ed(),
    MultiselectPrompt: eu(),
    AutocompletePrompt: ad(),
    AutocompleteMultiselectPrompt: cd(),
    ConfirmPrompt: gd()
  };
});

// ../node_modules/prompts/lib/prompts.js
var wd = b((vd) => {
  "use strict";
  var Re = vd, G_ = bd(), hn = /* @__PURE__ */ n((e) => e, "noop");
  function Ge(e, t, r = {}) {
    return new Promise((i, s) => {
      let o = new G_[e](t), u = r.onAbort || hn, a = r.onSubmit || hn, l = r.onExit || hn;
      o.on("state", t.onState || hn), o.on("submit", (f) => i(a(f))), o.on("exit", (f) => i(l(f))), o.on("abort", (f) => s(u(f)));
    });
  }
  n(Ge, "toPrompt");
  Re.text = (e) => Ge("TextPrompt", e);
  Re.password = (e) => (e.style = "password", Re.text(e));
  Re.invisible = (e) => (e.style = "invisible", Re.text(e));
  Re.number = (e) => Ge("NumberPrompt", e);
  Re.date = (e) => Ge("DatePrompt", e);
  Re.confirm = (e) => Ge("ConfirmPrompt", e);
  Re.list = (e) => {
    let t = e.separator || ",";
    return Ge("TextPrompt", e, {
      onSubmit: /* @__PURE__ */ n((r) => r.split(t).map((i) => i.trim()), "onSubmit")
    });
  };
  Re.toggle = (e) => Ge("TogglePrompt", e);
  Re.select = (e) => Ge("SelectPrompt", e);
  Re.multiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return Ge("MultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  Re.autocompleteMultiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return Ge("AutocompleteMultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  var Y_ = /* @__PURE__ */ n((e, t) => Promise.resolve(
    t.filter((r) => r.title.slice(0, e.length).toLowerCase() === e.toLowerCase())
  ), "byTitle");
  Re.autocomplete = (e) => (e.suggest = e.suggest || Y_, e.choices = [].concat(e.choices || []), Ge("AutocompletePrompt", e));
});

// ../node_modules/prompts/lib/index.js
var Cd = b((q6, Ed) => {
  "use strict";
  var ou = wd(), J_ = ["suggest", "format", "onState", "validate", "onRender", "type"], _d = /* @__PURE__ */ n(() => {
  }, "noop");
  async function Ft(e = [], { onSubmit: t = _d, onCancel: r = _d } = {}) {
    let i = {}, s = Ft._override || {};
    e = [].concat(e);
    let o, u, a, l, f, p, d = /* @__PURE__ */ n(async (c, h, g = !1) => {
      if (!(!g && c.validate && c.validate(h) !== !0))
        return c.format ? await c.format(h, i) : h;
    }, "getFormattedAnswer");
    for (u of e)
      if ({ name: l, type: f } = u, typeof f == "function" && (f = await f(o, { ...i }, u), u.type = f), !!f) {
        for (let c in u) {
          if (J_.includes(c)) continue;
          let h = u[c];
          u[c] = typeof h == "function" ? await h(o, { ...i }, p) : h;
        }
        if (p = u, typeof u.message != "string")
          throw new Error("prompt message is required");
        if ({ name: l, type: f } = u, ou[f] === void 0)
          throw new Error(`prompt type (${f}) is not defined`);
        if (s[u.name] !== void 0 && (o = await d(u, s[u.name]), o !== void 0)) {
          i[l] = o;
          continue;
        }
        try {
          o = Ft._injected ? K_(Ft._injected, u.initial) : await ou[f](u), i[l] = o = await d(u, o, !0), a = await t(u, o, i);
        } catch {
          a = !await r(u, i);
        }
        if (a) return i;
      }
    return i;
  }
  n(Ft, "prompt");
  function K_(e, t) {
    let r = e.shift();
    if (r instanceof Error)
      throw r;
    return r === void 0 ? t : r;
  }
  n(K_, "getInjectedAnswer");
  function X_(e) {
    Ft._injected = (Ft._injected || []).concat(e);
  }
  n(X_, "inject");
  function Q_(e) {
    Ft._override = Object.assign({}, e);
  }
  n(Q_, "override");
  Ed.exports = Object.assign(Ft, { prompt: Ft, prompts: ou, inject: X_, override: Q_ });
});

// ../node_modules/prompts/index.js
var cn = b((j6, Fd) => {
  function Z_(e) {
    e = (Array.isArray(e) ? e : e.split(".")).map(Number);
    let t = 0, r = process.versions.node.split(".").map(Number);
    for (; t < e.length; t++) {
      if (r[t] > e[t]) return !1;
      if (e[t] > r[t]) return !0;
    }
    return !1;
  }
  n(Z_, "isNodeLT");
  Fd.exports = Z_("8.6.0") ? Kh() : Cd();
});

// ../node_modules/picocolors/picocolors.js
var au = b((L6, uu) => {
  var xd = process.argv || [], dn = process.env, eE = !("NO_COLOR" in dn || xd.includes("--no-color")) && ("FORCE_COLOR" in dn || xd.includes(
  "--color") || process.platform === "win32" || E != null && E("tty").isatty(1) && dn.TERM !== "dumb" || "CI" in dn), tE = /* @__PURE__ */ n(
  (e, t, r = e) => (i) => {
    let s = "" + i, o = s.indexOf(t, e.length);
    return ~o ? e + rE(s, t, r, o) + t : e + s + t;
  }, "formatter"), rE = /* @__PURE__ */ n((e, t, r, i) => {
    let s = "", o = 0;
    do
      s += e.substring(o, i) + r, o = i + t.length, i = e.indexOf(t, o);
    while (~i);
    return s + e.substring(o);
  }, "replaceClose"), Sd = /* @__PURE__ */ n((e = eE) => {
    let t = e ? tE : () => String;
    return {
      isColorSupported: e,
      reset: t("\x1B[0m", "\x1B[0m"),
      bold: t("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: t("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: t("\x1B[3m", "\x1B[23m"),
      underline: t("\x1B[4m", "\x1B[24m"),
      inverse: t("\x1B[7m", "\x1B[27m"),
      hidden: t("\x1B[8m", "\x1B[28m"),
      strikethrough: t("\x1B[9m", "\x1B[29m"),
      black: t("\x1B[30m", "\x1B[39m"),
      red: t("\x1B[31m", "\x1B[39m"),
      green: t("\x1B[32m", "\x1B[39m"),
      yellow: t("\x1B[33m", "\x1B[39m"),
      blue: t("\x1B[34m", "\x1B[39m"),
      magenta: t("\x1B[35m", "\x1B[39m"),
      cyan: t("\x1B[36m", "\x1B[39m"),
      white: t("\x1B[37m", "\x1B[39m"),
      gray: t("\x1B[90m", "\x1B[39m"),
      bgBlack: t("\x1B[40m", "\x1B[49m"),
      bgRed: t("\x1B[41m", "\x1B[49m"),
      bgGreen: t("\x1B[42m", "\x1B[49m"),
      bgYellow: t("\x1B[43m", "\x1B[49m"),
      bgBlue: t("\x1B[44m", "\x1B[49m"),
      bgMagenta: t("\x1B[45m", "\x1B[49m"),
      bgCyan: t("\x1B[46m", "\x1B[49m"),
      bgWhite: t("\x1B[47m", "\x1B[49m"),
      blackBright: t("\x1B[90m", "\x1B[39m"),
      redBright: t("\x1B[91m", "\x1B[39m"),
      greenBright: t("\x1B[92m", "\x1B[39m"),
      yellowBright: t("\x1B[93m", "\x1B[39m"),
      blueBright: t("\x1B[94m", "\x1B[39m"),
      magentaBright: t("\x1B[95m", "\x1B[39m"),
      cyanBright: t("\x1B[96m", "\x1B[39m"),
      whiteBright: t("\x1B[97m", "\x1B[39m"),
      bgBlackBright: t("\x1B[100m", "\x1B[49m"),
      bgRedBright: t("\x1B[101m", "\x1B[49m"),
      bgGreenBright: t("\x1B[102m", "\x1B[49m"),
      bgYellowBright: t("\x1B[103m", "\x1B[49m"),
      bgBlueBright: t("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: t("\x1B[105m", "\x1B[49m"),
      bgCyanBright: t("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: t("\x1B[107m", "\x1B[49m")
    };
  }, "createColors");
  uu.exports = Sd();
  uu.exports.createColors = Sd;
});

// ../node_modules/wrappy/wrappy.js
var Bd = b((z6, Rd) => {
  Rd.exports = Td;
  function Td(e, t) {
    if (e && t) return Td(e)(t);
    if (typeof e != "function")
      throw new TypeError("need wrapper function");
    return Object.keys(e).forEach(function(i) {
      r[i] = e[i];
    }), r;
    function r() {
      for (var i = new Array(arguments.length), s = 0; s < i.length; s++)
        i[s] = arguments[s];
      var o = e.apply(this, i), u = i[i.length - 1];
      return typeof o == "function" && o !== u && Object.keys(u).forEach(function(a) {
        o[a] = u[a];
      }), o;
    }
    n(r, "wrapper");
  }
  n(Td, "wrappy");
});

// ../node_modules/once/once.js
var Dn = b((G6, cu) => {
  var kd = Bd();
  cu.exports = kd(pn);
  cu.exports.strict = kd(Od);
  pn.proto = pn(function() {
    Object.defineProperty(Function.prototype, "once", {
      value: /* @__PURE__ */ n(function() {
        return pn(this);
      }, "value"),
      configurable: !0
    }), Object.defineProperty(Function.prototype, "onceStrict", {
      value: /* @__PURE__ */ n(function() {
        return Od(this);
      }, "value"),
      configurable: !0
    });
  });
  function pn(e) {
    var t = /* @__PURE__ */ n(function() {
      return t.called ? t.value : (t.called = !0, t.value = e.apply(this, arguments));
    }, "f");
    return t.called = !1, t;
  }
  n(pn, "once");
  function Od(e) {
    var t = /* @__PURE__ */ n(function() {
      if (t.called)
        throw new Error(t.onceError);
      return t.called = !0, t.value = e.apply(this, arguments);
    }, "f"), r = e.name || "Function wrapped with `once`";
    return t.onceError = r + " shouldn't be called more than once", t.called = !1, t;
  }
  n(Od, "onceStrict");
});

// ../node_modules/end-of-stream/index.js
var ur = b((J6, qd) => {
  var uE = Dn(), aE = /* @__PURE__ */ n(function() {
  }, "noop"), lE = /* @__PURE__ */ n(function(e) {
    return e.setHeader && typeof e.abort == "function";
  }, "isRequest"), fE = /* @__PURE__ */ n(function(e) {
    return e.stdio && Array.isArray(e.stdio) && e.stdio.length === 3;
  }, "isChildProcess"), Pd = /* @__PURE__ */ n(function(e, t, r) {
    if (typeof t == "function") return Pd(e, null, t);
    t || (t = {}), r = uE(r || aE);
    var i = e._writableState, s = e._readableState, o = t.readable || t.readable !== !1 && e.readable, u = t.writable || t.writable !== !1 &&
    e.writable, a = !1, l = /* @__PURE__ */ n(function() {
      e.writable || f();
    }, "onlegacyfinish"), f = /* @__PURE__ */ n(function() {
      u = !1, o || r.call(e);
    }, "onfinish"), p = /* @__PURE__ */ n(function() {
      o = !1, u || r.call(e);
    }, "onend"), d = /* @__PURE__ */ n(function(y) {
      r.call(e, y ? new Error("exited with error code: " + y) : null);
    }, "onexit"), c = /* @__PURE__ */ n(function(y) {
      r.call(e, y);
    }, "onerror"), h = /* @__PURE__ */ n(function() {
      process.nextTick(g);
    }, "onclose"), g = /* @__PURE__ */ n(function() {
      if (!a) {
        if (o && !(s && s.ended && !s.destroyed)) return r.call(e, new Error("premature close"));
        if (u && !(i && i.ended && !i.destroyed)) return r.call(e, new Error("premature close"));
      }
    }, "onclosenexttick"), w = /* @__PURE__ */ n(function() {
      e.req.on("finish", f);
    }, "onrequest");
    return lE(e) ? (e.on("complete", f), e.on("abort", h), e.req ? w() : e.on("request", w)) : u && !i && (e.on("end", l), e.on("close", l)),
    fE(e) && e.on("exit", d), e.on("end", p), e.on("finish", f), t.error !== !1 && e.on("error", c), e.on("close", h), function() {
      a = !0, e.removeListener("complete", f), e.removeListener("abort", h), e.removeListener("request", w), e.req && e.req.removeListener("\
finish", f), e.removeListener("end", l), e.removeListener("close", l), e.removeListener("finish", f), e.removeListener("exit", d), e.removeListener(
      "end", p), e.removeListener("error", c), e.removeListener("close", h);
    };
  }, "eos");
  qd.exports = Pd;
});

// ../node_modules/pump/index.js
var pu = b((X6, jd) => {
  var hE = Dn(), cE = ur(), du = E("fs"), Zr = /* @__PURE__ */ n(function() {
  }, "noop"), dE = /^v?\.0/.test(process.version), mn = /* @__PURE__ */ n(function(e) {
    return typeof e == "function";
  }, "isFn"), pE = /* @__PURE__ */ n(function(e) {
    return !dE || !du ? !1 : (e instanceof (du.ReadStream || Zr) || e instanceof (du.WriteStream || Zr)) && mn(e.close);
  }, "isFS"), DE = /* @__PURE__ */ n(function(e) {
    return e.setHeader && mn(e.abort);
  }, "isRequest"), mE = /* @__PURE__ */ n(function(e, t, r, i) {
    i = hE(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), cE(e, { readable: t, writable: r }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, pE(e)) return e.close(Zr);
        if (DE(e)) return e.abort();
        if (mn(e.destroy)) return e.destroy();
        i(u || new Error("stream was destroyed"));
      }
    };
  }, "destroyer"), Md = /* @__PURE__ */ n(function(e) {
    e();
  }, "call"), gE = /* @__PURE__ */ n(function(e, t) {
    return e.pipe(t);
  }, "pipe"), yE = /* @__PURE__ */ n(function() {
    var e = Array.prototype.slice.call(arguments), t = mn(e[e.length - 1] || Zr) && e.pop() || Zr;
    if (Array.isArray(e[0]) && (e = e[0]), e.length < 2) throw new Error("pump requires two streams per minimum");
    var r, i = e.map(function(s, o) {
      var u = o < e.length - 1, a = o > 0;
      return mE(s, u, a, function(l) {
        r || (r = l), l && i.forEach(Md), !u && (i.forEach(Md), t(r));
      });
    });
    return e.reduce(gE);
  }, "pump");
  jd.exports = yE;
});

// ../node_modules/tar-fs/node_modules/chownr/chownr.js
var $d = b((Z6, Wd) => {
  "use strict";
  var Oe = E("fs"), It = E("path"), bE = Oe.lchown ? "lchown" : "chown", vE = Oe.lchownSync ? "lchownSync" : "chownSync", Ld = Oe.lchown && !process.
  version.match(/v1[1-9]+\./) && !process.version.match(/v10\.[6-9]/), Id = /* @__PURE__ */ n((e, t, r) => {
    try {
      return Oe[vE](e, t, r);
    } catch (i) {
      if (i.code !== "ENOENT")
        throw i;
    }
  }, "lchownSync"), wE = /* @__PURE__ */ n((e, t, r) => {
    try {
      return Oe.chownSync(e, t, r);
    } catch (i) {
      if (i.code !== "ENOENT")
        throw i;
    }
  }, "chownSync"), _E = Ld ? (e, t, r, i) => (s) => {
    !s || s.code !== "EISDIR" ? i(s) : Oe.chown(e, t, r, i);
  } : (e, t, r, i) => i, Du = Ld ? (e, t, r) => {
    try {
      return Id(e, t, r);
    } catch (i) {
      if (i.code !== "EISDIR")
        throw i;
      wE(e, t, r);
    }
  } : (e, t, r) => Id(e, t, r), EE = process.version, Nd = /* @__PURE__ */ n((e, t, r) => Oe.readdir(e, t, r), "readdir"), CE = /* @__PURE__ */ n(
  (e, t) => Oe.readdirSync(e, t), "readdirSync");
  /^v4\./.test(EE) && (Nd = /* @__PURE__ */ n((e, t, r) => Oe.readdir(e, r), "readdir"));
  var gn = /* @__PURE__ */ n((e, t, r, i) => {
    Oe[bE](e, t, r, _E(e, t, r, (s) => {
      i(s && s.code !== "ENOENT" ? s : null);
    }));
  }, "chown"), Ud = /* @__PURE__ */ n((e, t, r, i, s) => {
    if (typeof t == "string")
      return Oe.lstat(It.resolve(e, t), (o, u) => {
        if (o)
          return s(o.code !== "ENOENT" ? o : null);
        u.name = t, Ud(e, u, r, i, s);
      });
    if (t.isDirectory())
      mu(It.resolve(e, t.name), r, i, (o) => {
        if (o)
          return s(o);
        let u = It.resolve(e, t.name);
        gn(u, r, i, s);
      });
    else {
      let o = It.resolve(e, t.name);
      gn(o, r, i, s);
    }
  }, "chownrKid"), mu = /* @__PURE__ */ n((e, t, r, i) => {
    Nd(e, { withFileTypes: !0 }, (s, o) => {
      if (s) {
        if (s.code === "ENOENT")
          return i();
        if (s.code !== "ENOTDIR" && s.code !== "ENOTSUP")
          return i(s);
      }
      if (s || !o.length)
        return gn(e, t, r, i);
      let u = o.length, a = null, l = /* @__PURE__ */ n((f) => {
        if (!a) {
          if (f)
            return i(a = f);
          if (--u === 0)
            return gn(e, t, r, i);
        }
      }, "then");
      o.forEach((f) => Ud(e, f, t, r, l));
    });
  }, "chownr"), FE = /* @__PURE__ */ n((e, t, r, i) => {
    if (typeof t == "string")
      try {
        let s = Oe.lstatSync(It.resolve(e, t));
        s.name = t, t = s;
      } catch (s) {
        if (s.code === "ENOENT")
          return;
        throw s;
      }
    t.isDirectory() && Hd(It.resolve(e, t.name), r, i), Du(It.resolve(e, t.name), r, i);
  }, "chownrKidSync"), Hd = /* @__PURE__ */ n((e, t, r) => {
    let i;
    try {
      i = CE(e, { withFileTypes: !0 });
    } catch (s) {
      if (s.code === "ENOENT")
        return;
      if (s.code === "ENOTDIR" || s.code === "ENOTSUP")
        return Du(e, t, r);
      throw s;
    }
    return i && i.length && i.forEach((s) => FE(e, s, t, r)), Du(e, t, r);
  }, "chownrSync");
  Wd.exports = mu;
  mu.sync = Hd;
});

// ../node_modules/readable-stream/lib/internal/streams/stream.js
var gu = b((tk, zd) => {
  zd.exports = E("stream");
});

// ../node_modules/readable-stream/lib/internal/streams/buffer_list.js
var Xd = b((rk, Kd) => {
  "use strict";
  function Vd(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n(Vd, "ownKeys");
  function Gd(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? Vd(Object(r), !0).forEach(function(i) {
        xE(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Vd(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n(Gd, "_objectSpread");
  function xE(e, t, r) {
    return t = Jd(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(xE, "_defineProperty");
  function SE(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(SE, "_classCallCheck");
  function Yd(e, t) {
    for (var r = 0; r < t.length; r++) {
      var i = t[r];
      i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, Jd(i.key), i);
    }
  }
  n(Yd, "_defineProperties");
  function AE(e, t, r) {
    return t && Yd(e.prototype, t), r && Yd(e, r), Object.defineProperty(e, "prototype", { writable: !1 }), e;
  }
  n(AE, "_createClass");
  function Jd(e) {
    var t = TE(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n(Jd, "_toPropertyKey");
  function TE(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(TE, "_toPrimitive");
  var RE = E("buffer"), yn = RE.Buffer, BE = E("util"), yu = BE.inspect, kE = yu && yu.custom || "inspect";
  function OE(e, t, r) {
    yn.prototype.copy.call(e, t, r);
  }
  n(OE, "copyBuffer");
  Kd.exports = /* @__PURE__ */ function() {
    function e() {
      SE(this, e), this.head = null, this.tail = null, this.length = 0;
    }
    return n(e, "BufferList"), AE(e, [{
      key: "push",
      value: /* @__PURE__ */ n(function(r) {
        var i = {
          data: r,
          next: null
        };
        this.length > 0 ? this.tail.next = i : this.head = i, this.tail = i, ++this.length;
      }, "push")
    }, {
      key: "unshift",
      value: /* @__PURE__ */ n(function(r) {
        var i = {
          data: r,
          next: this.head
        };
        this.length === 0 && (this.tail = i), this.head = i, ++this.length;
      }, "unshift")
    }, {
      key: "shift",
      value: /* @__PURE__ */ n(function() {
        if (this.length !== 0) {
          var r = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
        }
      }, "shift")
    }, {
      key: "clear",
      value: /* @__PURE__ */ n(function() {
        this.head = this.tail = null, this.length = 0;
      }, "clear")
    }, {
      key: "join",
      value: /* @__PURE__ */ n(function(r) {
        if (this.length === 0) return "";
        for (var i = this.head, s = "" + i.data; i = i.next; ) s += r + i.data;
        return s;
      }, "join")
    }, {
      key: "concat",
      value: /* @__PURE__ */ n(function(r) {
        if (this.length === 0) return yn.alloc(0);
        for (var i = yn.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
          OE(s.data, i, o), o += s.data.length, s = s.next;
        return i;
      }, "concat")
      // Consumes a specified amount of bytes or characters from the buffered data.
    }, {
      key: "consume",
      value: /* @__PURE__ */ n(function(r, i) {
        var s;
        return r < this.head.data.length ? (s = this.head.data.slice(0, r), this.head.data = this.head.data.slice(r)) : r === this.head.data.
        length ? s = this.shift() : s = i ? this._getString(r) : this._getBuffer(r), s;
      }, "consume")
    }, {
      key: "first",
      value: /* @__PURE__ */ n(function() {
        return this.head.data;
      }, "first")
      // Consumes a specified amount of characters from the buffered data.
    }, {
      key: "_getString",
      value: /* @__PURE__ */ n(function(r) {
        var i = this.head, s = 1, o = i.data;
        for (r -= o.length; i = i.next; ) {
          var u = i.data, a = r > u.length ? u.length : r;
          if (a === u.length ? o += u : o += u.slice(0, r), r -= a, r === 0) {
            a === u.length ? (++s, i.next ? this.head = i.next : this.head = this.tail = null) : (this.head = i, i.data = u.slice(a));
            break;
          }
          ++s;
        }
        return this.length -= s, o;
      }, "_getString")
      // Consumes a specified amount of bytes from the buffered data.
    }, {
      key: "_getBuffer",
      value: /* @__PURE__ */ n(function(r) {
        var i = yn.allocUnsafe(r), s = this.head, o = 1;
        for (s.data.copy(i), r -= s.data.length; s = s.next; ) {
          var u = s.data, a = r > u.length ? u.length : r;
          if (u.copy(i, i.length - r, 0, a), r -= a, r === 0) {
            a === u.length ? (++o, s.next ? this.head = s.next : this.head = this.tail = null) : (this.head = s, s.data = u.slice(a));
            break;
          }
          ++o;
        }
        return this.length -= o, i;
      }, "_getBuffer")
      // Make sure the linked list only shows the minimal necessary information.
    }, {
      key: kE,
      value: /* @__PURE__ */ n(function(r, i) {
        return yu(this, Gd(Gd({}, i), {}, {
          // Only inspect one level.
          depth: 0,
          // It should not recurse.
          customInspect: !1
        }));
      }, "value")
    }]), e;
  }();
});

// ../node_modules/readable-stream/lib/internal/streams/destroy.js
var vu = b((nk, Zd) => {
  "use strict";
  function PE(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, process.
    nextTick(bu, this, e)) : process.nextTick(bu, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState &&
    (this._writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted ? process.nextTick(bn, r) : (r._writableState.errorEmitted = !0, process.nextTick(
      Qd, r, o)) : process.nextTick(Qd, r, o) : t ? (process.nextTick(bn, r), t(o)) : process.nextTick(bn, r);
    }), this);
  }
  n(PE, "destroy");
  function Qd(e, t) {
    bu(e, t), bn(e);
  }
  n(Qd, "emitErrorAndCloseNT");
  function bn(e) {
    e._writableState && !e._writableState.emitClose || e._readableState && !e._readableState.emitClose || e.emit("close");
  }
  n(bn, "emitCloseNT");
  function qE() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(qE, "undestroy");
  function bu(e, t) {
    e.emit("error", t);
  }
  n(bu, "emitErrorNT");
  function ME(e, t) {
    var r = e._readableState, i = e._writableState;
    r && r.autoDestroy || i && i.autoDestroy ? e.destroy(t) : e.emit("error", t);
  }
  n(ME, "errorOrDestroy");
  Zd.exports = {
    destroy: PE,
    undestroy: qE,
    errorOrDestroy: ME
  };
});

// ../node_modules/readable-stream/errors.js
var xt = b((ok, rp) => {
  "use strict";
  var tp = {};
  function Pe(e, t, r) {
    r || (r = Error);
    function i(o, u, a) {
      return typeof t == "string" ? t : t(o, u, a);
    }
    n(i, "getMessage");
    class s extends r {
      static {
        n(this, "NodeError");
      }
      constructor(u, a, l) {
        super(i(u, a, l));
      }
    }
    s.prototype.name = r.name, s.prototype.code = e, tp[e] = s;
  }
  n(Pe, "createErrorType");
  function ep(e, t) {
    if (Array.isArray(e)) {
      let r = e.length;
      return e = e.map((i) => String(i)), r > 2 ? `one of ${t} ${e.slice(0, r - 1).join(", ")}, or ` + e[r - 1] : r === 2 ? `one of ${t} ${e[0]}\
 or ${e[1]}` : `of ${t} ${e[0]}`;
    } else
      return `of ${t} ${String(e)}`;
  }
  n(ep, "oneOf");
  function jE(e, t, r) {
    return e.substr(!r || r < 0 ? 0 : +r, t.length) === t;
  }
  n(jE, "startsWith");
  function IE(e, t, r) {
    return (r === void 0 || r > e.length) && (r = e.length), e.substring(r - t.length, r) === t;
  }
  n(IE, "endsWith");
  function LE(e, t, r) {
    return typeof r != "number" && (r = 0), r + t.length > e.length ? !1 : e.indexOf(t, r) !== -1;
  }
  n(LE, "includes");
  Pe("ERR_INVALID_OPT_VALUE", function(e, t) {
    return 'The value "' + t + '" is invalid for option "' + e + '"';
  }, TypeError);
  Pe("ERR_INVALID_ARG_TYPE", function(e, t, r) {
    let i;
    typeof t == "string" && jE(t, "not ") ? (i = "must not be", t = t.replace(/^not /, "")) : i = "must be";
    let s;
    if (IE(e, " argument"))
      s = `The ${e} ${i} ${ep(t, "type")}`;
    else {
      let o = LE(e, ".") ? "property" : "argument";
      s = `The "${e}" ${o} ${i} ${ep(t, "type")}`;
    }
    return s += `. Received type ${typeof r}`, s;
  }, TypeError);
  Pe("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
  Pe("ERR_METHOD_NOT_IMPLEMENTED", function(e) {
    return "The " + e + " method is not implemented";
  });
  Pe("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
  Pe("ERR_STREAM_DESTROYED", function(e) {
    return "Cannot call " + e + " after a stream was destroyed";
  });
  Pe("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
  Pe("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
  Pe("ERR_STREAM_WRITE_AFTER_END", "write after end");
  Pe("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
  Pe("ERR_UNKNOWN_ENCODING", function(e) {
    return "Unknown encoding: " + e;
  }, TypeError);
  Pe("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
  rp.exports.codes = tp;
});

// ../node_modules/readable-stream/lib/internal/streams/state.js
var wu = b((ak, ip) => {
  "use strict";
  var NE = xt().codes.ERR_INVALID_OPT_VALUE;
  function UE(e, t, r) {
    return e.highWaterMark != null ? e.highWaterMark : t ? e[r] : null;
  }
  n(UE, "highWaterMarkFrom");
  function HE(e, t, r, i) {
    var s = UE(t, i, r);
    if (s != null) {
      if (!(isFinite(s) && Math.floor(s) === s) || s < 0) {
        var o = i ? r : "highWaterMark";
        throw new NE(o, s);
      }
      return Math.floor(s);
    }
    return e.objectMode ? 16 : 16 * 1024;
  }
  n(HE, "getHighWaterMark");
  ip.exports = {
    getHighWaterMark: HE
  };
});

// ../node_modules/inherits/inherits_browser.js
var np = b((fk, _u) => {
  typeof Object.create == "function" ? _u.exports = /* @__PURE__ */ n(function(t, r) {
    r && (t.super_ = r, t.prototype = Object.create(r.prototype, {
      constructor: {
        value: t,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }));
  }, "inherits") : _u.exports = /* @__PURE__ */ n(function(t, r) {
    if (r) {
      t.super_ = r;
      var i = /* @__PURE__ */ n(function() {
      }, "TempCtor");
      i.prototype = r.prototype, t.prototype = new i(), t.prototype.constructor = t;
    }
  }, "inherits");
});

// ../node_modules/inherits/inherits.js
var X = b((ck, Cu) => {
  try {
    if (Eu = E("util"), typeof Eu.inherits != "function") throw "";
    Cu.exports = Eu.inherits;
  } catch {
    Cu.exports = np();
  }
  var Eu;
});

// ../node_modules/util-deprecate/node.js
var ei = b((dk, sp) => {
  sp.exports = E("util").deprecate;
});

// ../node_modules/readable-stream/lib/_stream_writable.js
var Su = b((pk, hp) => {
  "use strict";
  hp.exports = ce;
  function up(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      DC(t, e);
    };
  }
  n(up, "CorkedRequest");
  var ar;
  ce.WritableState = ri;
  var WE = {
    deprecate: ei()
  }, ap = gu(), wn = E("buffer").Buffer, $E = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).
  Uint8Array || function() {
  };
  function zE(e) {
    return wn.from(e);
  }
  n(zE, "_uint8ArrayToBuffer");
  function VE(e) {
    return wn.isBuffer(e) || e instanceof $E;
  }
  n(VE, "_isUint8Array");
  var xu = vu(), GE = wu(), YE = GE.getHighWaterMark, St = xt().codes, JE = St.ERR_INVALID_ARG_TYPE, KE = St.ERR_METHOD_NOT_IMPLEMENTED, XE = St.
  ERR_MULTIPLE_CALLBACK, QE = St.ERR_STREAM_CANNOT_PIPE, ZE = St.ERR_STREAM_DESTROYED, eC = St.ERR_STREAM_NULL_VALUES, tC = St.ERR_STREAM_WRITE_AFTER_END,
  rC = St.ERR_UNKNOWN_ENCODING, lr = xu.errorOrDestroy;
  X()(ce, ap);
  function iC() {
  }
  n(iC, "nop");
  function ri(e, t, r) {
    ar = ar || Lt(), e = e || {}, typeof r != "boolean" && (r = t instanceof ar), this.objectMode = !!e.objectMode, r && (this.objectMode = this.
    objectMode || !!e.writableObjectMode), this.highWaterMark = YE(this, e, "writableHighWaterMark", r), this.finalCalled = !1, this.needDrain =
    !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var i = e.decodeStrings === !1;
    this.decodeStrings = !i, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(s) {
      fC(t, s);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.emitClose = e.emitClose !== !1, this.autoDestroy = !!e.autoDestroy, this.bufferedRequestCount = 0, this.
    corkedRequestsFree = new up(this);
  }
  n(ri, "WritableState");
  ri.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(ri.prototype, "buffer", {
        get: WE.deprecate(/* @__PURE__ */ n(function() {
          return this.getBuffer();
        }, "writableStateBufferGetter"), "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var vn;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (vn = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(ce, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(t) {
      return vn.call(this, t) ? !0 : this !== ce ? !1 : t && t._writableState instanceof ri;
    }, "value")
  })) : vn = /* @__PURE__ */ n(function(t) {
    return t instanceof this;
  }, "realHasInstance");
  function ce(e) {
    ar = ar || Lt();
    var t = this instanceof ar;
    if (!t && !vn.call(ce, this)) return new ce(e);
    this._writableState = new ri(e, this, t), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), ap.call(this);
  }
  n(ce, "Writable");
  ce.prototype.pipe = function() {
    lr(this, new QE());
  };
  function nC(e, t) {
    var r = new tC();
    lr(e, r), process.nextTick(t, r);
  }
  n(nC, "writeAfterEnd");
  function sC(e, t, r, i) {
    var s;
    return r === null ? s = new eC() : typeof r != "string" && !t.objectMode && (s = new JE("chunk", ["string", "Buffer"], r)), s ? (lr(e, s),
    process.nextTick(i, s), !1) : !0;
  }
  n(sC, "validChunk");
  ce.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && VE(e);
    return o && !wn.isBuffer(e) && (e = zE(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = iC), i.ending ? nC(this, r) : (o || sC(this, i, e, r)) && (i.pendingcb++, s = uC(this, i, o, e, t, r)), s;
  };
  ce.prototype.cork = function() {
    this._writableState.corked++;
  };
  ce.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && lp(this, e));
  };
  ce.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new rC(t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  Object.defineProperty(ce.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState && this._writableState.getBuffer();
    }, "get")
  });
  function oC(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = wn.from(t, r)), t;
  }
  n(oC, "decodeChunk");
  Object.defineProperty(ce.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function uC(e, t, r, i, s, o) {
    if (!r) {
      var u = oC(t, i, s);
      i !== u && (r = !0, s = "buffer", i = u);
    }
    var a = t.objectMode ? 1 : i.length;
    t.length += a;
    var l = t.length < t.highWaterMark;
    if (l || (t.needDrain = !0), t.writing || t.corked) {
      var f = t.lastBufferedRequest;
      t.lastBufferedRequest = {
        chunk: i,
        encoding: s,
        isBuf: r,
        callback: o,
        next: null
      }, f ? f.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1;
    } else
      Fu(e, t, !1, a, i, s, o);
    return l;
  }
  n(uC, "writeOrBuffer");
  function Fu(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, t.destroyed ? t.onwrite(new ZE("write")) : r ? e._writev(s, t.onwrite) : e._write(
    s, o, t.onwrite), t.sync = !1;
  }
  n(Fu, "doWrite");
  function aC(e, t, r, i, s) {
    --t.pendingcb, r ? (process.nextTick(s, i), process.nextTick(ti, e, t), e._writableState.errorEmitted = !0, lr(e, i)) : (s(i), e._writableState.
    errorEmitted = !0, lr(e, i), ti(e, t));
  }
  n(aC, "onwriteError");
  function lC(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(lC, "onwriteStateUpdate");
  function fC(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (typeof s != "function") throw new XE();
    if (lC(r), t) aC(e, r, i, t, s);
    else {
      var o = fp(r) || e.destroyed;
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && lp(e, r), i ? process.nextTick(op, e, r, o, s) : op(e, r, o, s);
    }
  }
  n(fC, "onwrite");
  function op(e, t, r, i) {
    r || hC(e, t), t.pendingcb--, i(), ti(e, t);
  }
  n(op, "afterWrite");
  function hC(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(hC, "onwriteDrain");
  function lp(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, Fu(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new up(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (Fu(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(lp, "clearBuffer");
  ce.prototype._write = function(e, t, r) {
    r(new KE("_write()"));
  };
  ce.prototype._writev = null;
  ce.prototype.end = function(e, t, r) {
    var i = this._writableState;
    return typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t),
    i.corked && (i.corked = 1, this.uncork()), i.ending || pC(this, i, r), this;
  };
  Object.defineProperty(ce.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.length;
    }, "get")
  });
  function fp(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(fp, "needFinish");
  function cC(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && lr(e, r), t.prefinished = !0, e.emit("prefinish"), ti(e, t);
    });
  }
  n(cC, "callFinal");
  function dC(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" && !t.destroyed ? (t.pendingcb++, t.finalCalled = !0, process.nextTick(
    cC, e, t)) : (t.prefinished = !0, e.emit("prefinish")));
  }
  n(dC, "prefinish");
  function ti(e, t) {
    var r = fp(t);
    if (r && (dC(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"), t.autoDestroy))) {
      var i = e._readableState;
      (!i || i.autoDestroy && i.endEmitted) && e.destroy();
    }
    return r;
  }
  n(ti, "finishMaybe");
  function pC(e, t, r) {
    t.ending = !0, ti(e, t), r && (t.finished ? process.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(pC, "endWritable");
  function DC(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(DC, "onCorkedFinish");
  Object.defineProperty(ce.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(t) {
      this._writableState && (this._writableState.destroyed = t);
    }, "set")
  });
  ce.prototype.destroy = xu.destroy;
  ce.prototype._undestroy = xu.undestroy;
  ce.prototype._destroy = function(e, t) {
    t(e);
  };
});

// ../node_modules/readable-stream/lib/_stream_duplex.js
var Lt = b((mk, dp) => {
  "use strict";
  var mC = Object.keys || function(e) {
    var t = [];
    for (var r in e) t.push(r);
    return t;
  };
  dp.exports = Ye;
  var cp = Ru(), Tu = Su();
  X()(Ye, cp);
  for (Au = mC(Tu.prototype), _n = 0; _n < Au.length; _n++)
    En = Au[_n], Ye.prototype[En] || (Ye.prototype[En] = Tu.prototype[En]);
  var Au, En, _n;
  function Ye(e) {
    if (!(this instanceof Ye)) return new Ye(e);
    cp.call(this, e), Tu.call(this, e), this.allowHalfOpen = !0, e && (e.readable === !1 && (this.readable = !1), e.writable === !1 && (this.
    writable = !1), e.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", gC)));
  }
  n(Ye, "Duplex");
  Object.defineProperty(Ye.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  Object.defineProperty(Ye.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState && this._writableState.getBuffer();
    }, "get")
  });
  Object.defineProperty(Ye.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.length;
    }, "get")
  });
  function gC() {
    this._writableState.ended || process.nextTick(yC, this);
  }
  n(gC, "onend");
  function yC(e) {
    e.end();
  }
  n(yC, "onEndNT");
  Object.defineProperty(Ye.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(t) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = t, this._writableState.destroyed =
      t);
    }, "set")
  });
});

// ../node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var Cn = b((yk, mp) => {
  "use strict";
  var pp = xt().codes.ERR_STREAM_PREMATURE_CLOSE;
  function bC(e) {
    var t = !1;
    return function() {
      if (!t) {
        t = !0;
        for (var r = arguments.length, i = new Array(r), s = 0; s < r; s++)
          i[s] = arguments[s];
        e.apply(this, i);
      }
    };
  }
  n(bC, "once");
  function vC() {
  }
  n(vC, "noop");
  function wC(e) {
    return e.setHeader && typeof e.abort == "function";
  }
  n(wC, "isRequest");
  function Dp(e, t, r) {
    if (typeof t == "function") return Dp(e, null, t);
    t || (t = {}), r = bC(r || vC);
    var i = t.readable || t.readable !== !1 && e.readable, s = t.writable || t.writable !== !1 && e.writable, o = /* @__PURE__ */ n(function() {
      e.writable || a();
    }, "onlegacyfinish"), u = e._writableState && e._writableState.finished, a = /* @__PURE__ */ n(function() {
      s = !1, u = !0, i || r.call(e);
    }, "onfinish"), l = e._readableState && e._readableState.endEmitted, f = /* @__PURE__ */ n(function() {
      i = !1, l = !0, s || r.call(e);
    }, "onend"), p = /* @__PURE__ */ n(function(g) {
      r.call(e, g);
    }, "onerror"), d = /* @__PURE__ */ n(function() {
      var g;
      if (i && !l)
        return (!e._readableState || !e._readableState.ended) && (g = new pp()), r.call(e, g);
      if (s && !u)
        return (!e._writableState || !e._writableState.ended) && (g = new pp()), r.call(e, g);
    }, "onclose"), c = /* @__PURE__ */ n(function() {
      e.req.on("finish", a);
    }, "onrequest");
    return wC(e) ? (e.on("complete", a), e.on("abort", d), e.req ? c() : e.on("request", c)) : s && !e._writableState && (e.on("end", o), e.
    on("close", o)), e.on("end", f), e.on("finish", a), t.error !== !1 && e.on("error", p), e.on("close", d), function() {
      e.removeListener("complete", a), e.removeListener("abort", d), e.removeListener("request", c), e.req && e.req.removeListener("finish",
      a), e.removeListener("end", o), e.removeListener("close", o), e.removeListener("finish", a), e.removeListener("end", f), e.removeListener(
      "error", p), e.removeListener("close", d);
    };
  }
  n(Dp, "eos");
  mp.exports = Dp;
});

// ../node_modules/readable-stream/lib/internal/streams/async_iterator.js
var yp = b((vk, gp) => {
  "use strict";
  var Fn;
  function At(e, t, r) {
    return t = _C(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(At, "_defineProperty");
  function _C(e) {
    var t = EC(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n(_C, "_toPropertyKey");
  function EC(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(EC, "_toPrimitive");
  var CC = Cn(), Tt = Symbol("lastResolve"), Nt = Symbol("lastReject"), ii = Symbol("error"), xn = Symbol("ended"), Ut = Symbol("lastPromise"),
  Bu = Symbol("handlePromise"), Ht = Symbol("stream");
  function Rt(e, t) {
    return {
      value: e,
      done: t
    };
  }
  n(Rt, "createIterResult");
  function FC(e) {
    var t = e[Tt];
    if (t !== null) {
      var r = e[Ht].read();
      r !== null && (e[Ut] = null, e[Tt] = null, e[Nt] = null, t(Rt(r, !1)));
    }
  }
  n(FC, "readAndResolve");
  function xC(e) {
    process.nextTick(FC, e);
  }
  n(xC, "onReadable");
  function SC(e, t) {
    return function(r, i) {
      e.then(function() {
        if (t[xn]) {
          r(Rt(void 0, !0));
          return;
        }
        t[Bu](r, i);
      }, i);
    };
  }
  n(SC, "wrapForNext");
  var AC = Object.getPrototypeOf(function() {
  }), TC = Object.setPrototypeOf((Fn = {
    get stream() {
      return this[Ht];
    },
    next: /* @__PURE__ */ n(function() {
      var t = this, r = this[ii];
      if (r !== null)
        return Promise.reject(r);
      if (this[xn])
        return Promise.resolve(Rt(void 0, !0));
      if (this[Ht].destroyed)
        return new Promise(function(u, a) {
          process.nextTick(function() {
            t[ii] ? a(t[ii]) : u(Rt(void 0, !0));
          });
        });
      var i = this[Ut], s;
      if (i)
        s = new Promise(SC(i, this));
      else {
        var o = this[Ht].read();
        if (o !== null)
          return Promise.resolve(Rt(o, !1));
        s = new Promise(this[Bu]);
      }
      return this[Ut] = s, s;
    }, "next")
  }, At(Fn, Symbol.asyncIterator, function() {
    return this;
  }), At(Fn, "return", /* @__PURE__ */ n(function() {
    var t = this;
    return new Promise(function(r, i) {
      t[Ht].destroy(null, function(s) {
        if (s) {
          i(s);
          return;
        }
        r(Rt(void 0, !0));
      });
    });
  }, "_return")), Fn), AC), RC = /* @__PURE__ */ n(function(t) {
    var r, i = Object.create(TC, (r = {}, At(r, Ht, {
      value: t,
      writable: !0
    }), At(r, Tt, {
      value: null,
      writable: !0
    }), At(r, Nt, {
      value: null,
      writable: !0
    }), At(r, ii, {
      value: null,
      writable: !0
    }), At(r, xn, {
      value: t._readableState.endEmitted,
      writable: !0
    }), At(r, Bu, {
      value: /* @__PURE__ */ n(function(o, u) {
        var a = i[Ht].read();
        a ? (i[Ut] = null, i[Tt] = null, i[Nt] = null, o(Rt(a, !1))) : (i[Tt] = o, i[Nt] = u);
      }, "value"),
      writable: !0
    }), r));
    return i[Ut] = null, CC(t, function(s) {
      if (s && s.code !== "ERR_STREAM_PREMATURE_CLOSE") {
        var o = i[Nt];
        o !== null && (i[Ut] = null, i[Tt] = null, i[Nt] = null, o(s)), i[ii] = s;
        return;
      }
      var u = i[Tt];
      u !== null && (i[Ut] = null, i[Tt] = null, i[Nt] = null, u(Rt(void 0, !0))), i[xn] = !0;
    }), t.on("readable", xC.bind(null, i)), i;
  }, "createReadableStreamAsyncIterator");
  gp.exports = RC;
});

// ../node_modules/readable-stream/lib/internal/streams/from.js
var _p = b((_k, wp) => {
  "use strict";
  function bp(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(bp, "asyncGeneratorStep");
  function BC(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          bp(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          bp(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(BC, "_asyncToGenerator");
  function vp(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n(vp, "ownKeys");
  function kC(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? vp(Object(r), !0).forEach(function(i) {
        OC(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : vp(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n(kC, "_objectSpread");
  function OC(e, t, r) {
    return t = PC(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(OC, "_defineProperty");
  function PC(e) {
    var t = qC(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n(PC, "_toPropertyKey");
  function qC(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(qC, "_toPrimitive");
  var MC = xt().codes.ERR_INVALID_ARG_TYPE;
  function jC(e, t, r) {
    var i;
    if (t && typeof t.next == "function")
      i = t;
    else if (t && t[Symbol.asyncIterator]) i = t[Symbol.asyncIterator]();
    else if (t && t[Symbol.iterator]) i = t[Symbol.iterator]();
    else throw new MC("iterable", ["Iterable"], t);
    var s = new e(kC({
      objectMode: !0
    }, r)), o = !1;
    s._read = function() {
      o || (o = !0, u());
    };
    function u() {
      return a.apply(this, arguments);
    }
    n(u, "next");
    function a() {
      return a = BC(function* () {
        try {
          var l = yield i.next(), f = l.value, p = l.done;
          p ? s.push(null) : s.push(yield f) ? u() : o = !1;
        } catch (d) {
          s.destroy(d);
        }
      }), a.apply(this, arguments);
    }
    return n(a, "_next2"), s;
  }
  n(jC, "from");
  wp.exports = jC;
});

// ../node_modules/readable-stream/lib/_stream_readable.js
var Ru = b((Fk, kp) => {
  "use strict";
  kp.exports = U;
  var fr;
  U.ReadableState = xp;
  var Ck = E("events").EventEmitter, Fp = /* @__PURE__ */ n(function(t, r) {
    return t.listeners(r).length;
  }, "EElistenerCount"), si = gu(), Sn = E("buffer").Buffer, IC = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self <
  "u" ? self : {}).Uint8Array || function() {
  };
  function LC(e) {
    return Sn.from(e);
  }
  n(LC, "_uint8ArrayToBuffer");
  function NC(e) {
    return Sn.isBuffer(e) || e instanceof IC;
  }
  n(NC, "_isUint8Array");
  var ku = E("util"), I;
  ku && ku.debuglog ? I = ku.debuglog("stream") : I = /* @__PURE__ */ n(function() {
  }, "debug");
  var UC = Xd(), Lu = vu(), HC = wu(), WC = HC.getHighWaterMark, An = xt().codes, $C = An.ERR_INVALID_ARG_TYPE, zC = An.ERR_STREAM_PUSH_AFTER_EOF,
  VC = An.ERR_METHOD_NOT_IMPLEMENTED, GC = An.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, hr, Ou, Pu;
  X()(U, si);
  var ni = Lu.errorOrDestroy, qu = ["error", "close", "destroy", "pause", "resume"];
  function YC(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : Array.isArray(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(YC, "prependListener");
  function xp(e, t, r) {
    fr = fr || Lt(), e = e || {}, typeof r != "boolean" && (r = t instanceof fr), this.objectMode = !!e.objectMode, r && (this.objectMode = this.
    objectMode || !!e.readableObjectMode), this.highWaterMark = WC(this, e, "readableHighWaterMark", r), this.buffer = new UC(), this.length =
    0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0,
    this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose =
    e.emitClose !== !1, this.autoDestroy = !!e.autoDestroy, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain =
    0, this.readingMore = !1, this.decoder = null, this.encoding = null, e.encoding && (hr || (hr = E("string_decoder/").StringDecoder), this.
    decoder = new hr(e.encoding), this.encoding = e.encoding);
  }
  n(xp, "ReadableState");
  function U(e) {
    if (fr = fr || Lt(), !(this instanceof U)) return new U(e);
    var t = this instanceof fr;
    this._readableState = new xp(e, this, t), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), si.call(this);
  }
  n(U, "Readable");
  Object.defineProperty(U.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(t) {
      this._readableState && (this._readableState.destroyed = t);
    }, "set")
  });
  U.prototype.destroy = Lu.destroy;
  U.prototype._undestroy = Lu.undestroy;
  U.prototype._destroy = function(e, t) {
    t(e);
  };
  U.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = Sn.from(e, t), t = ""), i =
    !0), Sp(this, e, t, !1, i);
  };
  U.prototype.unshift = function(e) {
    return Sp(this, e, null, !0, !1);
  };
  function Sp(e, t, r, i, s) {
    I("readableAddChunk", t);
    var o = e._readableState;
    if (t === null)
      o.reading = !1, XC(e, o);
    else {
      var u;
      if (s || (u = JC(o, t)), u)
        ni(e, u);
      else if (o.objectMode || t && t.length > 0)
        if (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(t) !== Sn.prototype && (t = LC(t)), i)
          o.endEmitted ? ni(e, new GC()) : Mu(e, o, t, !0);
        else if (o.ended)
          ni(e, new zC());
        else {
          if (o.destroyed)
            return !1;
          o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode || t.length !== 0 ? Mu(e, o, t, !1) : Iu(e, o)) : Mu(e, o,
          t, !1);
        }
      else i || (o.reading = !1, Iu(e, o));
    }
    return !o.ended && (o.length < o.highWaterMark || o.length === 0);
  }
  n(Sp, "readableAddChunk");
  function Mu(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (t.awaitDrain = 0, e.emit("data", r)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.
    unshift(r) : t.buffer.push(r), t.needReadable && Tn(e)), Iu(e, t);
  }
  n(Mu, "addChunk");
  function JC(e, t) {
    var r;
    return !NC(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new $C("chunk", ["string", "Buffer", "Uint8Array"], t)), r;
  }
  n(JC, "chunkInvalid");
  U.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  U.prototype.setEncoding = function(e) {
    hr || (hr = E("string_decoder/").StringDecoder);
    var t = new hr(e);
    this._readableState.decoder = t, this._readableState.encoding = this._readableState.decoder.encoding;
    for (var r = this._readableState.buffer.head, i = ""; r !== null; )
      i += t.write(r.data), r = r.next;
    return this._readableState.buffer.clear(), i !== "" && this._readableState.buffer.push(i), this._readableState.length = i.length, this;
  };
  var Ep = 1073741824;
  function KC(e) {
    return e >= Ep ? e = Ep : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(KC, "computeNewHighWaterMark");
  function Cp(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = KC(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(Cp, "howMuchToRead");
  U.prototype.read = function(e) {
    I("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && ((t.highWaterMark !== 0 ? t.length >= t.highWaterMark : t.length >
    0) || t.ended))
      return I("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? ju(this) : Tn(this), null;
    if (e = Cp(e, t), e === 0 && t.ended)
      return t.length === 0 && ju(this), null;
    var i = t.needReadable;
    I("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, I("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, I("reading or ended", i)) : i && (I("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = Cp(r, t)));
    var s;
    return e > 0 ? s = Rp(e, t) : s = null, s === null ? (t.needReadable = t.length <= t.highWaterMark, e = 0) : (t.length -= e, t.awaitDrain =
    0), t.length === 0 && (t.ended || (t.needReadable = !0), r !== e && t.ended && ju(this)), s !== null && this.emit("data", s), s;
  };
  function XC(e, t) {
    if (I("onEofChunk"), !t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, t.sync ? Tn(e) : (t.needReadable = !1, t.emittedReadable || (t.emittedReadable = !0, Ap(e)));
    }
  }
  n(XC, "onEofChunk");
  function Tn(e) {
    var t = e._readableState;
    I("emitReadable", t.needReadable, t.emittedReadable), t.needReadable = !1, t.emittedReadable || (I("emitReadable", t.flowing), t.emittedReadable =
    !0, process.nextTick(Ap, e));
  }
  n(Tn, "emitReadable");
  function Ap(e) {
    var t = e._readableState;
    I("emitReadable_", t.destroyed, t.length, t.ended), !t.destroyed && (t.length || t.ended) && (e.emit("readable"), t.emittedReadable = !1),
    t.needReadable = !t.flowing && !t.ended && t.length <= t.highWaterMark, Nu(e);
  }
  n(Ap, "emitReadable_");
  function Iu(e, t) {
    t.readingMore || (t.readingMore = !0, process.nextTick(QC, e, t));
  }
  n(Iu, "maybeReadMore");
  function QC(e, t) {
    for (; !t.reading && !t.ended && (t.length < t.highWaterMark || t.flowing && t.length === 0); ) {
      var r = t.length;
      if (I("maybeReadMore read 0"), e.read(0), r === t.length)
        break;
    }
    t.readingMore = !1;
  }
  n(QC, "maybeReadMore_");
  U.prototype._read = function(e) {
    ni(this, new VC("_read()"));
  };
  U.prototype.pipe = function(e, t) {
    var r = this, i = this._readableState;
    switch (i.pipesCount) {
      case 0:
        i.pipes = e;
        break;
      case 1:
        i.pipes = [i.pipes, e];
        break;
      default:
        i.pipes.push(e);
        break;
    }
    i.pipesCount += 1, I("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : w;
    i.endEmitted ? process.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(y, _) {
      I("onunpipe"), y === r && _ && _.hasUnpiped === !1 && (_.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      I("onend"), e.end();
    }
    n(a, "onend");
    var l = ZC(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      I("cleanup"), e.removeListener("close", h), e.removeListener("finish", g), e.removeListener("drain", l), e.removeListener("error", c),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", w), r.removeListener("data", d), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup"), r.on("data", d);
    function d(y) {
      I("ondata");
      var _ = e.write(y);
      I("dest.write", _), _ === !1 && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && Bp(i.pipes, e) !== -1) && !f && (I("false\
 write response, pause", i.awaitDrain), i.awaitDrain++), r.pause());
    }
    n(d, "ondata");
    function c(y) {
      I("onerror", y), w(), e.removeListener("error", c), Fp(e, "error") === 0 && ni(e, y);
    }
    n(c, "onerror"), YC(e, "error", c);
    function h() {
      e.removeListener("finish", g), w();
    }
    n(h, "onclose"), e.once("close", h);
    function g() {
      I("onfinish"), e.removeListener("close", h), w();
    }
    n(g, "onfinish"), e.once("finish", g);
    function w() {
      I("unpipe"), r.unpipe(e);
    }
    return n(w, "unpipe"), e.emit("pipe", r), i.flowing || (I("pipe resume"), r.resume()), e;
  };
  function ZC(e) {
    return /* @__PURE__ */ n(function() {
      var r = e._readableState;
      I("pipeOnDrain", r.awaitDrain), r.awaitDrain && r.awaitDrain--, r.awaitDrain === 0 && Fp(e, "data") && (r.flowing = !0, Nu(e));
    }, "pipeOnDrainFunctionResult");
  }
  n(ZC, "pipeOnDrain");
  U.prototype.unpipe = function(e) {
    var t = this._readableState, r = {
      hasUnpiped: !1
    };
    if (t.pipesCount === 0) return this;
    if (t.pipesCount === 1)
      return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this, r),
      this);
    if (!e) {
      var i = t.pipes, s = t.pipesCount;
      t.pipes = null, t.pipesCount = 0, t.flowing = !1;
      for (var o = 0; o < s; o++) i[o].emit("unpipe", this, {
        hasUnpiped: !1
      });
      return this;
    }
    var u = Bp(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  U.prototype.on = function(e, t) {
    var r = si.prototype.on.call(this, e, t), i = this._readableState;
    return e === "data" ? (i.readableListening = this.listenerCount("readable") > 0, i.flowing !== !1 && this.resume()) : e === "readable" &&
    !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.flowing = !1, i.emittedReadable = !1, I("on reada\
ble", i.length, i.reading), i.length ? Tn(this) : i.reading || process.nextTick(eF, this)), r;
  };
  U.prototype.addListener = U.prototype.on;
  U.prototype.removeListener = function(e, t) {
    var r = si.prototype.removeListener.call(this, e, t);
    return e === "readable" && process.nextTick(Tp, this), r;
  };
  U.prototype.removeAllListeners = function(e) {
    var t = si.prototype.removeAllListeners.apply(this, arguments);
    return (e === "readable" || e === void 0) && process.nextTick(Tp, this), t;
  };
  function Tp(e) {
    var t = e._readableState;
    t.readableListening = e.listenerCount("readable") > 0, t.resumeScheduled && !t.paused ? t.flowing = !0 : e.listenerCount("data") > 0 && e.
    resume();
  }
  n(Tp, "updateReadableListening");
  function eF(e) {
    I("readable nexttick read 0"), e.read(0);
  }
  n(eF, "nReadingNextTick");
  U.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (I("resume"), e.flowing = !e.readableListening, tF(this, e)), e.paused = !1, this;
  };
  function tF(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, process.nextTick(rF, e, t));
  }
  n(tF, "resume");
  function rF(e, t) {
    I("resume", t.reading), t.reading || e.read(0), t.resumeScheduled = !1, e.emit("resume"), Nu(e), t.flowing && !t.reading && e.read(0);
  }
  n(rF, "resume_");
  U.prototype.pause = function() {
    return I("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (I("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this._readableState.paused = !0, this;
  };
  function Nu(e) {
    var t = e._readableState;
    for (I("flow", t.flowing); t.flowing && e.read() !== null; ) ;
  }
  n(Nu, "flow");
  U.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if (I("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if (I("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
        var a = t.push(u);
        a || (i = !0, e.pause());
      }
    });
    for (var s in e)
      this[s] === void 0 && typeof e[s] == "function" && (this[s] = (/* @__PURE__ */ n(function(a) {
        return /* @__PURE__ */ n(function() {
          return e[a].apply(e, arguments);
        }, "methodWrapReturnFunction");
      }, "methodWrap"))(s));
    for (var o = 0; o < qu.length; o++)
      e.on(qu[o], this.emit.bind(this, qu[o]));
    return this._read = function(u) {
      I("wrapped _read", u), i && (i = !1, e.resume());
    }, this;
  };
  typeof Symbol == "function" && (U.prototype[Symbol.asyncIterator] = function() {
    return Ou === void 0 && (Ou = yp()), Ou(this);
  });
  Object.defineProperty(U.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.highWaterMark;
    }, "get")
  });
  Object.defineProperty(U.prototype, "readableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState && this._readableState.buffer;
    }, "get")
  });
  Object.defineProperty(U.prototype, "readableFlowing", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.flowing;
    }, "get"),
    set: /* @__PURE__ */ n(function(t) {
      this._readableState && (this._readableState.flowing = t);
    }, "set")
  });
  U._fromList = Rp;
  Object.defineProperty(U.prototype, "readableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.length;
    }, "get")
  });
  function Rp(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    first() : r = t.buffer.concat(t.length), t.buffer.clear()) : r = t.buffer.consume(e, t.decoder), r;
  }
  n(Rp, "fromList");
  function ju(e) {
    var t = e._readableState;
    I("endReadable", t.endEmitted), t.endEmitted || (t.ended = !0, process.nextTick(iF, t, e));
  }
  n(ju, "endReadable");
  function iF(e, t) {
    if (I("endReadableNT", e.endEmitted, e.length), !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"), e.
    autoDestroy)) {
      var r = t._writableState;
      (!r || r.autoDestroy && r.finished) && t.destroy();
    }
  }
  n(iF, "endReadableNT");
  typeof Symbol == "function" && (U.from = function(e, t) {
    return Pu === void 0 && (Pu = _p()), Pu(U, e, t);
  });
  function Bp(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(Bp, "indexOf");
});

// ../node_modules/readable-stream/lib/_stream_transform.js
var Uu = b((Sk, Pp) => {
  "use strict";
  Pp.exports = ut;
  var Rn = xt().codes, nF = Rn.ERR_METHOD_NOT_IMPLEMENTED, sF = Rn.ERR_MULTIPLE_CALLBACK, oF = Rn.ERR_TRANSFORM_ALREADY_TRANSFORMING, uF = Rn.
  ERR_TRANSFORM_WITH_LENGTH_0, Bn = Lt();
  X()(ut, Bn);
  function aF(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (i === null)
      return this.emit("error", new sF());
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(aF, "afterTransform");
  function ut(e) {
    if (!(this instanceof ut)) return new ut(e);
    Bn.call(this, e), this._transformState = {
      afterTransform: aF.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", lF);
  }
  n(ut, "Transform");
  function lF() {
    var e = this;
    typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(t, r) {
      Op(e, t, r);
    }) : Op(this, null, null);
  }
  n(lF, "prefinish");
  ut.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, Bn.prototype.push.call(this, e, t);
  };
  ut.prototype._transform = function(e, t, r) {
    r(new nF("_transform()"));
  };
  ut.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  ut.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) : t.needTransform =
    !0;
  };
  ut.prototype._destroy = function(e, t) {
    Bn.prototype._destroy.call(this, e, function(r) {
      t(r);
    });
  };
  function Op(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new uF();
    if (e._transformState.transforming) throw new oF();
    return e.push(null);
  }
  n(Op, "done");
});

// ../node_modules/readable-stream/lib/_stream_passthrough.js
var jp = b((Tk, Mp) => {
  "use strict";
  Mp.exports = oi;
  var qp = Uu();
  X()(oi, qp);
  function oi(e) {
    if (!(this instanceof oi)) return new oi(e);
    qp.call(this, e);
  }
  n(oi, "PassThrough");
  oi.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/readable-stream/lib/internal/streams/pipeline.js
var Hp = b((Bk, Up) => {
  "use strict";
  var Hu;
  function fF(e) {
    var t = !1;
    return function() {
      t || (t = !0, e.apply(void 0, arguments));
    };
  }
  n(fF, "once");
  var Np = xt().codes, hF = Np.ERR_MISSING_ARGS, cF = Np.ERR_STREAM_DESTROYED;
  function Ip(e) {
    if (e) throw e;
  }
  n(Ip, "noop");
  function dF(e) {
    return e.setHeader && typeof e.abort == "function";
  }
  n(dF, "isRequest");
  function pF(e, t, r, i) {
    i = fF(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), Hu === void 0 && (Hu = Cn()), Hu(e, {
      readable: t,
      writable: r
    }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, dF(e)) return e.abort();
        if (typeof e.destroy == "function") return e.destroy();
        i(u || new cF("pipe"));
      }
    };
  }
  n(pF, "destroyer");
  function Lp(e) {
    e();
  }
  n(Lp, "call");
  function DF(e, t) {
    return e.pipe(t);
  }
  n(DF, "pipe");
  function mF(e) {
    return !e.length || typeof e[e.length - 1] != "function" ? Ip : e.pop();
  }
  n(mF, "popCallback");
  function gF() {
    for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
      t[r] = arguments[r];
    var i = mF(t);
    if (Array.isArray(t[0]) && (t = t[0]), t.length < 2)
      throw new hF("streams");
    var s, o = t.map(function(u, a) {
      var l = a < t.length - 1, f = a > 0;
      return pF(u, l, f, function(p) {
        s || (s = p), p && o.forEach(Lp), !l && (o.forEach(Lp), i(s));
      });
    });
    return t.reduce(DF);
  }
  n(gF, "pipeline");
  Up.exports = gF;
});

// ../node_modules/readable-stream/readable.js
var cr = b((qe, ai) => {
  var ui = E("stream");
  process.env.READABLE_STREAM === "disable" && ui ? (ai.exports = ui.Readable, Object.assign(ai.exports, ui), ai.exports.Stream = ui) : (qe =
  ai.exports = Ru(), qe.Stream = ui || qe, qe.Readable = qe, qe.Writable = Su(), qe.Duplex = Lt(), qe.Transform = Uu(), qe.PassThrough = jp(),
  qe.finished = Cn(), qe.pipeline = Hp());
});

// ../node_modules/bl/BufferList.js
var zp = b((Ok, $p) => {
  "use strict";
  var { Buffer: Le } = E("buffer"), Wp = Symbol.for("BufferList");
  function Q(e) {
    if (!(this instanceof Q))
      return new Q(e);
    Q._init.call(this, e);
  }
  n(Q, "BufferList");
  Q._init = /* @__PURE__ */ n(function(t) {
    Object.defineProperty(this, Wp, { value: !0 }), this._bufs = [], this.length = 0, t && this.append(t);
  }, "_init");
  Q.prototype._new = /* @__PURE__ */ n(function(t) {
    return new Q(t);
  }, "_new");
  Q.prototype._offset = /* @__PURE__ */ n(function(t) {
    if (t === 0)
      return [0, 0];
    let r = 0;
    for (let i = 0; i < this._bufs.length; i++) {
      let s = r + this._bufs[i].length;
      if (t < s || i === this._bufs.length - 1)
        return [i, t - r];
      r = s;
    }
  }, "_offset");
  Q.prototype._reverseOffset = function(e) {
    let t = e[0], r = e[1];
    for (let i = 0; i < t; i++)
      r += this._bufs[i].length;
    return r;
  };
  Q.prototype.get = /* @__PURE__ */ n(function(t) {
    if (t > this.length || t < 0)
      return;
    let r = this._offset(t);
    return this._bufs[r[0]][r[1]];
  }, "get");
  Q.prototype.slice = /* @__PURE__ */ n(function(t, r) {
    return typeof t == "number" && t < 0 && (t += this.length), typeof r == "number" && r < 0 && (r += this.length), this.copy(null, 0, t, r);
  }, "slice");
  Q.prototype.copy = /* @__PURE__ */ n(function(t, r, i, s) {
    if ((typeof i != "number" || i < 0) && (i = 0), (typeof s != "number" || s > this.length) && (s = this.length), i >= this.length || s <=
    0)
      return t || Le.alloc(0);
    let o = !!t, u = this._offset(i), a = s - i, l = a, f = o && r || 0, p = u[1];
    if (i === 0 && s === this.length) {
      if (!o)
        return this._bufs.length === 1 ? this._bufs[0] : Le.concat(this._bufs, this.length);
      for (let d = 0; d < this._bufs.length; d++)
        this._bufs[d].copy(t, f), f += this._bufs[d].length;
      return t;
    }
    if (l <= this._bufs[u[0]].length - p)
      return o ? this._bufs[u[0]].copy(t, r, p, p + l) : this._bufs[u[0]].slice(p, p + l);
    o || (t = Le.allocUnsafe(a));
    for (let d = u[0]; d < this._bufs.length; d++) {
      let c = this._bufs[d].length - p;
      if (l > c)
        this._bufs[d].copy(t, f, p), f += c;
      else {
        this._bufs[d].copy(t, f, p, p + l), f += c;
        break;
      }
      l -= c, p && (p = 0);
    }
    return t.length > f ? t.slice(0, f) : t;
  }, "copy");
  Q.prototype.shallowSlice = /* @__PURE__ */ n(function(t, r) {
    if (t = t || 0, r = typeof r != "number" ? this.length : r, t < 0 && (t += this.length), r < 0 && (r += this.length), t === r)
      return this._new();
    let i = this._offset(t), s = this._offset(r), o = this._bufs.slice(i[0], s[0] + 1);
    return s[1] === 0 ? o.pop() : o[o.length - 1] = o[o.length - 1].slice(0, s[1]), i[1] !== 0 && (o[0] = o[0].slice(i[1])), this._new(o);
  }, "shallowSlice");
  Q.prototype.toString = /* @__PURE__ */ n(function(t, r, i) {
    return this.slice(r, i).toString(t);
  }, "toString");
  Q.prototype.consume = /* @__PURE__ */ n(function(t) {
    if (t = Math.trunc(t), Number.isNaN(t) || t <= 0) return this;
    for (; this._bufs.length; )
      if (t >= this._bufs[0].length)
        t -= this._bufs[0].length, this.length -= this._bufs[0].length, this._bufs.shift();
      else {
        this._bufs[0] = this._bufs[0].slice(t), this.length -= t;
        break;
      }
    return this;
  }, "consume");
  Q.prototype.duplicate = /* @__PURE__ */ n(function() {
    let t = this._new();
    for (let r = 0; r < this._bufs.length; r++)
      t.append(this._bufs[r]);
    return t;
  }, "duplicate");
  Q.prototype.append = /* @__PURE__ */ n(function(t) {
    if (t == null)
      return this;
    if (t.buffer)
      this._appendBuffer(Le.from(t.buffer, t.byteOffset, t.byteLength));
    else if (Array.isArray(t))
      for (let r = 0; r < t.length; r++)
        this.append(t[r]);
    else if (this._isBufferList(t))
      for (let r = 0; r < t._bufs.length; r++)
        this.append(t._bufs[r]);
    else
      typeof t == "number" && (t = t.toString()), this._appendBuffer(Le.from(t));
    return this;
  }, "append");
  Q.prototype._appendBuffer = /* @__PURE__ */ n(function(t) {
    this._bufs.push(t), this.length += t.length;
  }, "appendBuffer");
  Q.prototype.indexOf = function(e, t, r) {
    if (r === void 0 && typeof t == "string" && (r = t, t = void 0), typeof e == "function" || Array.isArray(e))
      throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');
    if (typeof e == "number" ? e = Le.from([e]) : typeof e == "string" ? e = Le.from(e, r) : this._isBufferList(e) ? e = e.slice() : Array.isArray(
    e.buffer) ? e = Le.from(e.buffer, e.byteOffset, e.byteLength) : Le.isBuffer(e) || (e = Le.from(e)), t = Number(t || 0), isNaN(t) && (t =
    0), t < 0 && (t = this.length + t), t < 0 && (t = 0), e.length === 0)
      return t > this.length ? this.length : t;
    let i = this._offset(t), s = i[0], o = i[1];
    for (; s < this._bufs.length; s++) {
      let u = this._bufs[s];
      for (; o < u.length; )
        if (u.length - o >= e.length) {
          let l = u.indexOf(e, o);
          if (l !== -1)
            return this._reverseOffset([s, l]);
          o = u.length - e.length + 1;
        } else {
          let l = this._reverseOffset([s, o]);
          if (this._match(l, e))
            return l;
          o++;
        }
      o = 0;
    }
    return -1;
  };
  Q.prototype._match = function(e, t) {
    if (this.length - e < t.length)
      return !1;
    for (let r = 0; r < t.length; r++)
      if (this.get(e + r) !== t[r])
        return !1;
    return !0;
  };
  (function() {
    let e = {
      readDoubleBE: 8,
      readDoubleLE: 8,
      readFloatBE: 4,
      readFloatLE: 4,
      readInt32BE: 4,
      readInt32LE: 4,
      readUInt32BE: 4,
      readUInt32LE: 4,
      readInt16BE: 2,
      readInt16LE: 2,
      readUInt16BE: 2,
      readUInt16LE: 2,
      readInt8: 1,
      readUInt8: 1,
      readIntBE: null,
      readIntLE: null,
      readUIntBE: null,
      readUIntLE: null
    };
    for (let t in e)
      (function(r) {
        e[r] === null ? Q.prototype[r] = function(i, s) {
          return this.slice(i, i + s)[r](0, s);
        } : Q.prototype[r] = function(i = 0) {
          return this.slice(i, i + e[r])[r](0);
        };
      })(t);
  })();
  Q.prototype._isBufferList = /* @__PURE__ */ n(function(t) {
    return t instanceof Q || Q.isBufferList(t);
  }, "_isBufferList");
  Q.isBufferList = /* @__PURE__ */ n(function(t) {
    return t != null && t[Wp];
  }, "isBufferList");
  $p.exports = Q;
});

// ../node_modules/bl/bl.js
var Vp = b((qk, kn) => {
  "use strict";
  var Wu = cr().Duplex, yF = X(), li = zp();
  function Fe(e) {
    if (!(this instanceof Fe))
      return new Fe(e);
    if (typeof e == "function") {
      this._callback = e;
      let t = (/* @__PURE__ */ n(function(i) {
        this._callback && (this._callback(i), this._callback = null);
      }, "piper")).bind(this);
      this.on("pipe", /* @__PURE__ */ n(function(i) {
        i.on("error", t);
      }, "onPipe")), this.on("unpipe", /* @__PURE__ */ n(function(i) {
        i.removeListener("error", t);
      }, "onUnpipe")), e = null;
    }
    li._init.call(this, e), Wu.call(this);
  }
  n(Fe, "BufferListStream");
  yF(Fe, Wu);
  Object.assign(Fe.prototype, li.prototype);
  Fe.prototype._new = /* @__PURE__ */ n(function(t) {
    return new Fe(t);
  }, "_new");
  Fe.prototype._write = /* @__PURE__ */ n(function(t, r, i) {
    this._appendBuffer(t), typeof i == "function" && i();
  }, "_write");
  Fe.prototype._read = /* @__PURE__ */ n(function(t) {
    if (!this.length)
      return this.push(null);
    t = Math.min(t, this.length), this.push(this.slice(0, t)), this.consume(t);
  }, "_read");
  Fe.prototype.end = /* @__PURE__ */ n(function(t) {
    Wu.prototype.end.call(this, t), this._callback && (this._callback(null, this.slice()), this._callback = null);
  }, "end");
  Fe.prototype._destroy = /* @__PURE__ */ n(function(t, r) {
    this._bufs.length = 0, this.length = 0, r(t);
  }, "_destroy");
  Fe.prototype._isBufferList = /* @__PURE__ */ n(function(t) {
    return t instanceof Fe || t instanceof li || Fe.isBufferList(t);
  }, "_isBufferList");
  Fe.isBufferList = li.isBufferList;
  kn.exports = Fe;
  kn.exports.BufferListStream = Fe;
  kn.exports.BufferList = li;
});

// ../node_modules/tar-stream/headers.js
var Vu = b((pr) => {
  var bF = Buffer.alloc, vF = "0000000000000000000", wF = "7777777777777777777", Gp = 48, Yp = Buffer.from("ustar\0", "binary"), _F = Buffer.
  from("00", "binary"), EF = Buffer.from("ustar ", "binary"), CF = Buffer.from(" \0", "binary"), FF = parseInt("7777", 8), fi = 257, zu = 263,
  xF = /* @__PURE__ */ n(function(e, t, r) {
    return typeof e != "number" ? r : (e = ~~e, e >= t ? t : e >= 0 || (e += t, e >= 0) ? e : 0);
  }, "clamp"), SF = /* @__PURE__ */ n(function(e) {
    switch (e) {
      case 0:
        return "file";
      case 1:
        return "link";
      case 2:
        return "symlink";
      case 3:
        return "character-device";
      case 4:
        return "block-device";
      case 5:
        return "directory";
      case 6:
        return "fifo";
      case 7:
        return "contiguous-file";
      case 72:
        return "pax-header";
      case 55:
        return "pax-global-header";
      case 27:
        return "gnu-long-link-path";
      case 28:
      case 30:
        return "gnu-long-path";
    }
    return null;
  }, "toType"), AF = /* @__PURE__ */ n(function(e) {
    switch (e) {
      case "file":
        return 0;
      case "link":
        return 1;
      case "symlink":
        return 2;
      case "character-device":
        return 3;
      case "block-device":
        return 4;
      case "directory":
        return 5;
      case "fifo":
        return 6;
      case "contiguous-file":
        return 7;
      case "pax-header":
        return 72;
    }
    return 0;
  }, "toTypeflag"), Jp = /* @__PURE__ */ n(function(e, t, r, i) {
    for (; r < i; r++)
      if (e[r] === t) return r;
    return i;
  }, "indexOf"), Kp = /* @__PURE__ */ n(function(e) {
    for (var t = 256, r = 0; r < 148; r++) t += e[r];
    for (var i = 156; i < 512; i++) t += e[i];
    return t;
  }, "cksum"), Bt = /* @__PURE__ */ n(function(e, t) {
    return e = e.toString(8), e.length > t ? wF.slice(0, t) + " " : vF.slice(0, t - e.length) + e + " ";
  }, "encodeOct");
  function TF(e) {
    var t;
    if (e[0] === 128) t = !0;
    else if (e[0] === 255) t = !1;
    else return null;
    for (var r = [], i = e.length - 1; i > 0; i--) {
      var s = e[i];
      t ? r.push(s) : r.push(255 - s);
    }
    var o = 0, u = r.length;
    for (i = 0; i < u; i++)
      o += r[i] * Math.pow(256, i);
    return t ? o : -1 * o;
  }
  n(TF, "parse256");
  var kt = /* @__PURE__ */ n(function(e, t, r) {
    if (e = e.slice(t, t + r), t = 0, e[t] & 128)
      return TF(e);
    for (; t < e.length && e[t] === 32; ) t++;
    for (var i = xF(Jp(e, 32, t, e.length), e.length, e.length); t < i && e[t] === 0; ) t++;
    return i === t ? 0 : parseInt(e.slice(t, i).toString(), 8);
  }, "decodeOct"), dr = /* @__PURE__ */ n(function(e, t, r, i) {
    return e.slice(t, Jp(e, 0, t, t + r)).toString(i);
  }, "decodeStr"), $u = /* @__PURE__ */ n(function(e) {
    var t = Buffer.byteLength(e), r = Math.floor(Math.log(t) / Math.log(10)) + 1;
    return t + r >= Math.pow(10, r) && r++, t + r + e;
  }, "addLength");
  pr.decodeLongPath = function(e, t) {
    return dr(e, 0, e.length, t);
  };
  pr.encodePax = function(e) {
    var t = "";
    e.name && (t += $u(" path=" + e.name + `
`)), e.linkname && (t += $u(" linkpath=" + e.linkname + `
`));
    var r = e.pax;
    if (r)
      for (var i in r)
        t += $u(" " + i + "=" + r[i] + `
`);
    return Buffer.from(t);
  };
  pr.decodePax = function(e) {
    for (var t = {}; e.length; ) {
      for (var r = 0; r < e.length && e[r] !== 32; ) r++;
      var i = parseInt(e.slice(0, r).toString(), 10);
      if (!i) return t;
      var s = e.slice(r + 1, i - 1).toString(), o = s.indexOf("=");
      if (o === -1) return t;
      t[s.slice(0, o)] = s.slice(o + 1), e = e.slice(i);
    }
    return t;
  };
  pr.encode = function(e) {
    var t = bF(512), r = e.name, i = "";
    if (e.typeflag === 5 && r[r.length - 1] !== "/" && (r += "/"), Buffer.byteLength(r) !== r.length) return null;
    for (; Buffer.byteLength(r) > 100; ) {
      var s = r.indexOf("/");
      if (s === -1) return null;
      i += i ? "/" + r.slice(0, s) : r.slice(0, s), r = r.slice(s + 1);
    }
    return Buffer.byteLength(r) > 100 || Buffer.byteLength(i) > 155 || e.linkname && Buffer.byteLength(e.linkname) > 100 ? null : (t.write(r),
    t.write(Bt(e.mode & FF, 6), 100), t.write(Bt(e.uid, 6), 108), t.write(Bt(e.gid, 6), 116), t.write(Bt(e.size, 11), 124), t.write(Bt(e.mtime.
    getTime() / 1e3 | 0, 11), 136), t[156] = Gp + AF(e.type), e.linkname && t.write(e.linkname, 157), Yp.copy(t, fi), _F.copy(t, zu), e.uname &&
    t.write(e.uname, 265), e.gname && t.write(e.gname, 297), t.write(Bt(e.devmajor || 0, 6), 329), t.write(Bt(e.devminor || 0, 6), 337), i &&
    t.write(i, 345), t.write(Bt(Kp(t), 6), 148), t);
  };
  pr.decode = function(e, t, r) {
    var i = e[156] === 0 ? 0 : e[156] - Gp, s = dr(e, 0, 100, t), o = kt(e, 100, 8), u = kt(e, 108, 8), a = kt(e, 116, 8), l = kt(e, 124, 12),
    f = kt(e, 136, 12), p = SF(i), d = e[157] === 0 ? null : dr(e, 157, 100, t), c = dr(e, 265, 32), h = dr(e, 297, 32), g = kt(e, 329, 8), w = kt(
    e, 337, 8), y = Kp(e);
    if (y === 8 * 32) return null;
    if (y !== kt(e, 148, 8)) throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
    if (Yp.compare(e, fi, fi + 6) === 0)
      e[345] && (s = dr(e, 345, 155, t) + "/" + s);
    else if (!(EF.compare(e, fi, fi + 6) === 0 && CF.compare(e, zu, zu + 2) === 0)) {
      if (!r)
        throw new Error("Invalid tar header: unknown format.");
    }
    return i === 0 && s && s[s.length - 1] === "/" && (i = 5), {
      name: s,
      mode: o,
      uid: u,
      gid: a,
      size: l,
      mtime: new Date(1e3 * f),
      type: p,
      linkname: d,
      uname: c,
      gname: h,
      devmajor: g,
      devminor: w
    };
  };
});

// ../node_modules/tar-stream/extract.js
var iD = b((Lk, rD) => {
  var Qp = E("util"), RF = Vp(), hi = Vu(), Zp = cr().Writable, eD = cr().PassThrough, tD = /* @__PURE__ */ n(function() {
  }, "noop"), Xp = /* @__PURE__ */ n(function(e) {
    return e &= 511, e && 512 - e;
  }, "overflow"), BF = /* @__PURE__ */ n(function(e, t) {
    var r = new On(e, t);
    return r.end(), r;
  }, "emptyStream"), kF = /* @__PURE__ */ n(function(e, t) {
    return t.path && (e.name = t.path), t.linkpath && (e.linkname = t.linkpath), t.size && (e.size = parseInt(t.size, 10)), e.pax = t, e;
  }, "mixinPax"), On = /* @__PURE__ */ n(function(e, t) {
    this._parent = e, this.offset = t, eD.call(this, { autoDestroy: !1 });
  }, "Source");
  Qp.inherits(On, eD);
  On.prototype.destroy = function(e) {
    this._parent.destroy(e);
  };
  var at = /* @__PURE__ */ n(function(e) {
    if (!(this instanceof at)) return new at(e);
    Zp.call(this, e), e = e || {}, this._offset = 0, this._buffer = RF(), this._missing = 0, this._partial = !1, this._onparse = tD, this._header =
    null, this._stream = null, this._overflow = null, this._cb = null, this._locked = !1, this._destroyed = !1, this._pax = null, this._paxGlobal =
    null, this._gnuLongPath = null, this._gnuLongLinkPath = null;
    var t = this, r = t._buffer, i = /* @__PURE__ */ n(function() {
      t._continue();
    }, "oncontinue"), s = /* @__PURE__ */ n(function(c) {
      if (t._locked = !1, c) return t.destroy(c);
      t._stream || i();
    }, "onunlock"), o = /* @__PURE__ */ n(function() {
      t._stream = null;
      var c = Xp(t._header.size);
      c ? t._parse(c, u) : t._parse(512, d), t._locked || i();
    }, "onstreamend"), u = /* @__PURE__ */ n(function() {
      t._buffer.consume(Xp(t._header.size)), t._parse(512, d), i();
    }, "ondrain"), a = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      t._paxGlobal = hi.decodePax(r.slice(0, c)), r.consume(c), o();
    }, "onpaxglobalheader"), l = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      t._pax = hi.decodePax(r.slice(0, c)), t._paxGlobal && (t._pax = Object.assign({}, t._paxGlobal, t._pax)), r.consume(c), o();
    }, "onpaxheader"), f = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      this._gnuLongPath = hi.decodeLongPath(r.slice(0, c), e.filenameEncoding), r.consume(c), o();
    }, "ongnulongpath"), p = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      this._gnuLongLinkPath = hi.decodeLongPath(r.slice(0, c), e.filenameEncoding), r.consume(c), o();
    }, "ongnulonglinkpath"), d = /* @__PURE__ */ n(function() {
      var c = t._offset, h;
      try {
        h = t._header = hi.decode(r.slice(0, 512), e.filenameEncoding, e.allowUnknownFormat);
      } catch (g) {
        t.emit("error", g);
      }
      if (r.consume(512), !h) {
        t._parse(512, d), i();
        return;
      }
      if (h.type === "gnu-long-path") {
        t._parse(h.size, f), i();
        return;
      }
      if (h.type === "gnu-long-link-path") {
        t._parse(h.size, p), i();
        return;
      }
      if (h.type === "pax-global-header") {
        t._parse(h.size, a), i();
        return;
      }
      if (h.type === "pax-header") {
        t._parse(h.size, l), i();
        return;
      }
      if (t._gnuLongPath && (h.name = t._gnuLongPath, t._gnuLongPath = null), t._gnuLongLinkPath && (h.linkname = t._gnuLongLinkPath, t._gnuLongLinkPath =
      null), t._pax && (t._header = h = kF(h, t._pax), t._pax = null), t._locked = !0, !h.size || h.type === "directory") {
        t._parse(512, d), t.emit("entry", h, BF(t, c), s);
        return;
      }
      t._stream = new On(t, c), t.emit("entry", h, t._stream, s), t._parse(h.size, o), i();
    }, "onheader");
    this._onheader = d, this._parse(512, d);
  }, "Extract");
  Qp.inherits(at, Zp);
  at.prototype.destroy = function(e) {
    this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.emit("close"));
  };
  at.prototype._parse = function(e, t) {
    this._destroyed || (this._offset += e, this._missing = e, t === this._onheader && (this._partial = !1), this._onparse = t);
  };
  at.prototype._continue = function() {
    if (!this._destroyed) {
      var e = this._cb;
      this._cb = tD, this._overflow ? this._write(this._overflow, void 0, e) : e();
    }
  };
  at.prototype._write = function(e, t, r) {
    if (!this._destroyed) {
      var i = this._stream, s = this._buffer, o = this._missing;
      if (e.length && (this._partial = !0), e.length < o)
        return this._missing -= e.length, this._overflow = null, i ? i.write(e, r) : (s.append(e), r());
      this._cb = r, this._missing = 0;
      var u = null;
      e.length > o && (u = e.slice(o), e = e.slice(0, o)), i ? i.end(e) : s.append(e), this._overflow = u, this._onparse();
    }
  };
  at.prototype._final = function(e) {
    if (this._partial) return this.destroy(new Error("Unexpected end of data"));
    e();
  };
  rD.exports = at;
});

// ../node_modules/fs-constants/index.js
var sD = b((Uk, nD) => {
  nD.exports = E("fs").constants || E("constants");
});

// ../node_modules/tar-stream/pack.js
var fD = b((Hk, lD) => {
  var Dr = sD(), oD = ur(), qn = X(), OF = Buffer.alloc, uD = cr().Readable, mr = cr().Writable, PF = E("string_decoder").StringDecoder, Pn = Vu(),
  qF = parseInt("755", 8), MF = parseInt("644", 8), aD = OF(1024), Yu = /* @__PURE__ */ n(function() {
  }, "noop"), Gu = /* @__PURE__ */ n(function(e, t) {
    t &= 511, t && e.push(aD.slice(0, 512 - t));
  }, "overflow");
  function jF(e) {
    switch (e & Dr.S_IFMT) {
      case Dr.S_IFBLK:
        return "block-device";
      case Dr.S_IFCHR:
        return "character-device";
      case Dr.S_IFDIR:
        return "directory";
      case Dr.S_IFIFO:
        return "fifo";
      case Dr.S_IFLNK:
        return "symlink";
    }
    return "file";
  }
  n(jF, "modeToType");
  var Mn = /* @__PURE__ */ n(function(e) {
    mr.call(this), this.written = 0, this._to = e, this._destroyed = !1;
  }, "Sink");
  qn(Mn, mr);
  Mn.prototype._write = function(e, t, r) {
    if (this.written += e.length, this._to.push(e)) return r();
    this._to._drain = r;
  };
  Mn.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var jn = /* @__PURE__ */ n(function() {
    mr.call(this), this.linkname = "", this._decoder = new PF("utf-8"), this._destroyed = !1;
  }, "LinkSink");
  qn(jn, mr);
  jn.prototype._write = function(e, t, r) {
    this.linkname += this._decoder.write(e), r();
  };
  jn.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var ci = /* @__PURE__ */ n(function() {
    mr.call(this), this._destroyed = !1;
  }, "Void");
  qn(ci, mr);
  ci.prototype._write = function(e, t, r) {
    r(new Error("No body allowed for this entry"));
  };
  ci.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var Je = /* @__PURE__ */ n(function(e) {
    if (!(this instanceof Je)) return new Je(e);
    uD.call(this, e), this._drain = Yu, this._finalized = !1, this._finalizing = !1, this._destroyed = !1, this._stream = null;
  }, "Pack");
  qn(Je, uD);
  Je.prototype.entry = function(e, t, r) {
    if (this._stream) throw new Error("already piping an entry");
    if (!(this._finalized || this._destroyed)) {
      typeof t == "function" && (r = t, t = null), r || (r = Yu);
      var i = this;
      if ((!e.size || e.type === "symlink") && (e.size = 0), e.type || (e.type = jF(e.mode)), e.mode || (e.mode = e.type === "directory" ? qF :
      MF), e.uid || (e.uid = 0), e.gid || (e.gid = 0), e.mtime || (e.mtime = /* @__PURE__ */ new Date()), typeof t == "string" && (t = Buffer.
      from(t)), Buffer.isBuffer(t)) {
        e.size = t.length, this._encode(e);
        var s = this.push(t);
        return Gu(i, e.size), s ? process.nextTick(r) : this._drain = r, new ci();
      }
      if (e.type === "symlink" && !e.linkname) {
        var o = new jn();
        return oD(o, function(a) {
          if (a)
            return i.destroy(), r(a);
          e.linkname = o.linkname, i._encode(e), r();
        }), o;
      }
      if (this._encode(e), e.type !== "file" && e.type !== "contiguous-file")
        return process.nextTick(r), new ci();
      var u = new Mn(this);
      return this._stream = u, oD(u, function(a) {
        if (i._stream = null, a)
          return i.destroy(), r(a);
        if (u.written !== e.size)
          return i.destroy(), r(new Error("size mismatch"));
        Gu(i, e.size), i._finalizing && i.finalize(), r();
      }), u;
    }
  };
  Je.prototype.finalize = function() {
    if (this._stream) {
      this._finalizing = !0;
      return;
    }
    this._finalized || (this._finalized = !0, this.push(aD), this.push(null));
  };
  Je.prototype.destroy = function(e) {
    this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.destroy && this._stream.
    destroy());
  };
  Je.prototype._encode = function(e) {
    if (!e.pax) {
      var t = Pn.encode(e);
      if (t) {
        this.push(t);
        return;
      }
    }
    this._encodePax(e);
  };
  Je.prototype._encodePax = function(e) {
    var t = Pn.encodePax({
      name: e.name,
      linkname: e.linkname,
      pax: e.pax
    }), r = {
      name: "PaxHeader",
      mode: e.mode,
      uid: e.uid,
      gid: e.gid,
      size: t.length,
      mtime: e.mtime,
      type: "pax-header",
      linkname: e.linkname && "PaxHeader",
      uname: e.uname,
      gname: e.gname,
      devmajor: e.devmajor,
      devminor: e.devminor
    };
    this.push(Pn.encode(r)), this.push(t), Gu(this, t.length), r.size = e.size, r.type = e.type, this.push(Pn.encode(r));
  };
  Je.prototype._read = function(e) {
    var t = this._drain;
    this._drain = Yu, t();
  };
  lD.exports = Je;
});

// ../node_modules/tar-stream/index.js
var hD = b((Ju) => {
  Ju.extract = iD();
  Ju.pack = fD();
});

// ../node_modules/mkdirp-classic/index.js
var DD = b((zk, pD) => {
  var In = E("path"), cD = E("fs"), dD = parseInt("0777", 8);
  pD.exports = gr.mkdirp = gr.mkdirP = gr;
  function gr(e, t, r, i) {
    typeof t == "function" ? (r = t, t = {}) : (!t || typeof t != "object") && (t = { mode: t });
    var s = t.mode, o = t.fs || cD;
    s === void 0 && (s = dD & ~process.umask()), i || (i = null);
    var u = r || function() {
    };
    e = In.resolve(e), o.mkdir(e, s, function(a) {
      if (!a)
        return i = i || e, u(null, i);
      switch (a.code) {
        case "ENOENT":
          gr(In.dirname(e), t, function(l, f) {
            l ? u(l, f) : gr(e, t, u, f);
          });
          break;
        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          o.stat(e, function(l, f) {
            l || !f.isDirectory() ? u(a, i) : u(null, i);
          });
          break;
      }
    });
  }
  n(gr, "mkdirP");
  gr.sync = /* @__PURE__ */ n(function e(t, r, i) {
    (!r || typeof r != "object") && (r = { mode: r });
    var s = r.mode, o = r.fs || cD;
    s === void 0 && (s = dD & ~process.umask()), i || (i = null), t = In.resolve(t);
    try {
      o.mkdirSync(t, s), i = i || t;
    } catch (a) {
      switch (a.code) {
        case "ENOENT":
          i = e(In.dirname(t), r, i), e(t, r, i);
          break;
        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          var u;
          try {
            u = o.statSync(t);
          } catch {
            throw a;
          }
          if (!u.isDirectory()) throw a;
          break;
      }
    }
    return i;
  }, "sync");
});

// ../node_modules/tar-fs/index.js
var ED = b((Qu) => {
  var IF = $d(), gD = hD(), yD = pu(), LF = DD(), bD = E("fs"), Be = E("path"), NF = E("os"), di = NF.platform() === "win32", pi = /* @__PURE__ */ n(
  function() {
  }, "noop"), Xu = /* @__PURE__ */ n(function(e) {
    return e;
  }, "echo"), Ku = di ? function(e) {
    return e.replace(/\\/g, "/").replace(/[:?<>|]/g, "_");
  } : Xu, UF = /* @__PURE__ */ n(function(e, t, r, i, s, o) {
    var u = s || ["."];
    return /* @__PURE__ */ n(function(l) {
      if (!u.length) return l();
      var f = u.shift(), p = Be.join(r, f);
      t.call(e, p, function(d, c) {
        if (d) return l(d);
        if (!c.isDirectory()) return l(null, f, c);
        e.readdir(p, function(h, g) {
          if (h) return l(h);
          o && g.sort();
          for (var w = 0; w < g.length; w++)
            i(Be.join(r, f, g[w])) || u.push(Be.join(f, g[w]));
          l(null, f, c);
        });
      });
    }, "loop");
  }, "statAll"), vD = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r.name = r.name.split("/").slice(t).join("/");
      var i = r.linkname;
      return i && (r.type === "link" || Be.isAbsolute(i)) && (r.linkname = i.split("/").slice(t).join("/")), e(r);
    };
  }, "strip");
  Qu.pack = function(e, t) {
    e || (e = "."), t || (t = {});
    var r = t.fs || bD, i = t.ignore || t.filter || pi, s = t.map || pi, o = t.mapStream || Xu, u = UF(r, t.dereference ? r.stat : r.lstat, e,
    i, t.entries, t.sort), a = t.strict !== !1, l = typeof t.umask == "number" ? ~t.umask : ~wD(), f = typeof t.dmode == "number" ? t.dmode :
    0, p = typeof t.fmode == "number" ? t.fmode : 0, d = t.pack || gD.pack(), c = t.finish || pi;
    t.strip && (s = vD(s, t.strip)), t.readable && (f |= parseInt(555, 8), p |= parseInt(444, 8)), t.writable && (f |= parseInt(333, 8), p |=
    parseInt(222, 8));
    var h = /* @__PURE__ */ n(function(y, _) {
      r.readlink(Be.join(e, y), function(C, v) {
        if (C) return d.destroy(C);
        _.linkname = Ku(v), d.entry(_, w);
      });
    }, "onsymlink"), g = /* @__PURE__ */ n(function(y, _, C) {
      if (y) return d.destroy(y);
      if (!_)
        return t.finalize !== !1 && d.finalize(), c(d);
      if (C.isSocket()) return w();
      var v = {
        name: Ku(_),
        mode: (C.mode | (C.isDirectory() ? f : p)) & l,
        mtime: C.mtime,
        size: C.size,
        type: "file",
        uid: C.uid,
        gid: C.gid
      };
      if (C.isDirectory())
        return v.size = 0, v.type = "directory", v = s(v) || v, d.entry(v, w);
      if (C.isSymbolicLink())
        return v.size = 0, v.type = "symlink", v = s(v) || v, h(_, v);
      if (v = s(v) || v, !C.isFile())
        return a ? d.destroy(new Error("unsupported type for " + _)) : w();
      var S = d.entry(v, w);
      if (S) {
        var x = o(r.createReadStream(Be.join(e, _), { start: 0, end: v.size > 0 ? v.size - 1 : v.size }), v);
        x.on("error", function(F) {
          S.destroy(F);
        }), yD(x, S);
      }
    }, "onstat"), w = /* @__PURE__ */ n(function(y) {
      if (y) return d.destroy(y);
      u(g);
    }, "onnextentry");
    return w(), d;
  };
  var HF = /* @__PURE__ */ n(function(e) {
    return e.length ? e[e.length - 1] : null;
  }, "head"), WF = /* @__PURE__ */ n(function() {
    return process.getuid ? process.getuid() : -1;
  }, "processGetuid"), wD = /* @__PURE__ */ n(function() {
    return process.umask ? process.umask() : 0;
  }, "processUmask");
  Qu.extract = function(e, t) {
    e || (e = "."), t || (t = {});
    var r = t.fs || bD, i = t.ignore || t.filter || pi, s = t.map || pi, o = t.mapStream || Xu, u = t.chown !== !1 && !di && WF() === 0, a = t.
    extract || gD.extract(), l = [], f = /* @__PURE__ */ new Date(), p = typeof t.umask == "number" ? ~t.umask : ~wD(), d = typeof t.dmode ==
    "number" ? t.dmode : 0, c = typeof t.fmode == "number" ? t.fmode : 0, h = t.strict !== !1;
    t.strip && (s = vD(s, t.strip)), t.readable && (d |= parseInt(555, 8), c |= parseInt(444, 8)), t.writable && (d |= parseInt(333, 8), c |=
    parseInt(222, 8));
    var g = /* @__PURE__ */ n(function(_, C) {
      for (var v; (v = HF(l)) && _.slice(0, v[0].length) !== v[0]; ) l.pop();
      if (!v) return C();
      r.utimes(v[0], f, v[1], C);
    }, "utimesParent"), w = /* @__PURE__ */ n(function(_, C, v) {
      if (t.utimes === !1) return v();
      if (C.type === "directory") return r.utimes(_, f, C.mtime, v);
      if (C.type === "symlink") return g(_, v);
      r.utimes(_, f, C.mtime, function(S) {
        if (S) return v(S);
        g(_, v);
      });
    }, "utimes"), y = /* @__PURE__ */ n(function(_, C, v) {
      var S = C.type === "symlink", x = S ? r.lchmod : r.chmod, F = S ? r.lchown : r.chown;
      if (!x) return v();
      var k = (C.mode | (C.type === "directory" ? d : c)) & p;
      F && u ? F.call(r, _, C.uid, C.gid, q) : q(null);
      function q(O) {
        if (O) return v(O);
        if (!x) return v();
        x.call(r, _, k, v);
      }
      n(q, "onchown");
    }, "chperm");
    return a.on("entry", function(_, C, v) {
      _ = s(_) || _, _.name = Ku(_.name);
      var S = Be.join(e, Be.join("/", _.name));
      if (i(S, _))
        return C.resume(), v();
      var x = /* @__PURE__ */ n(function(j) {
        if (j) return v(j);
        w(S, _, function(H) {
          if (H) return v(H);
          if (di) return v();
          y(S, _, v);
        });
      }, "stat"), F = /* @__PURE__ */ n(function() {
        if (di) return v();
        r.unlink(S, function() {
          r.symlink(_.linkname, S, x);
        });
      }, "onsymlink"), k = /* @__PURE__ */ n(function() {
        if (di) return v();
        r.unlink(S, function() {
          var j = Be.join(e, Be.join("/", _.linkname));
          r.link(j, S, function(H) {
            if (H && H.code === "EPERM" && t.hardlinkAsFilesFallback)
              return C = r.createReadStream(j), q();
            x(H);
          });
        });
      }, "onlink"), q = /* @__PURE__ */ n(function() {
        var j = r.createWriteStream(S), H = o(C, _);
        j.on("error", function(he) {
          H.destroy(he);
        }), yD(H, j, function(he) {
          if (he) return v(he);
          j.on("close", x);
        });
      }, "onfile");
      if (_.type === "directory")
        return l.push([S, _.mtime]), mD(S, {
          fs: r,
          own: u,
          uid: _.uid,
          gid: _.gid
        }, x);
      var O = Be.dirname(S);
      _D(r, O, Be.join(e, "."), function(j, H) {
        if (j) return v(j);
        if (!H) return v(new Error(O + " is not a valid path"));
        mD(O, {
          fs: r,
          own: u,
          uid: _.uid,
          gid: _.gid
        }, function(he) {
          if (he) return v(he);
          switch (_.type) {
            case "file":
              return q();
            case "link":
              return k();
            case "symlink":
              return F();
          }
          if (h) return v(new Error("unsupported type for " + S + " (" + _.type + ")"));
          C.resume(), v();
        });
      });
    }), t.finish && a.on("finish", t.finish), a;
  };
  function _D(e, t, r, i) {
    if (t === r) return i(null, !0);
    e.lstat(t, function(s, o) {
      if (s && s.code !== "ENOENT") return i(s);
      if (s || o.isDirectory()) return _D(e, Be.join(t, ".."), r, i);
      i(null, !1);
    });
  }
  n(_D, "validate");
  function mD(e, t, r) {
    LF(e, { fs: t.fs }, function(i, s) {
      !i && s && t.own ? IF(s, t.uid, t.gid, r) : r(i);
    });
  }
  n(mD, "mkdirfix");
});

// ../node_modules/process-nextick-args/index.js
var ke = b((Jk, Zu) => {
  "use strict";
  typeof process > "u" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.
  indexOf("v1.8.") !== 0 ? Zu.exports = { nextTick: $F } : Zu.exports = process;
  function $F(e, t, r, i) {
    if (typeof e != "function")
      throw new TypeError('"callback" argument must be a function');
    var s = arguments.length, o, u;
    switch (s) {
      case 0:
      case 1:
        return process.nextTick(e);
      case 2:
        return process.nextTick(/* @__PURE__ */ n(function() {
          e.call(null, t);
        }, "afterTickOne"));
      case 3:
        return process.nextTick(/* @__PURE__ */ n(function() {
          e.call(null, t, r);
        }, "afterTickTwo"));
      case 4:
        return process.nextTick(/* @__PURE__ */ n(function() {
          e.call(null, t, r, i);
        }, "afterTickThree"));
      default:
        for (o = new Array(s - 1), u = 0; u < o.length; )
          o[u++] = arguments[u];
        return process.nextTick(/* @__PURE__ */ n(function() {
          e.apply(null, o);
        }, "afterTick"));
    }
  }
  n($F, "nextTick");
});

// ../node_modules/peek-stream/node_modules/isarray/index.js
var FD = b((Xk, CD) => {
  var zF = {}.toString;
  CD.exports = Array.isArray || function(e) {
    return zF.call(e) == "[object Array]";
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/stream.js
var ea = b((Qk, xD) => {
  xD.exports = E("stream");
});

// ../node_modules/peek-stream/node_modules/safe-buffer/index.js
var Nn = b((ta, AD) => {
  var Ln = E("buffer"), lt = Ln.Buffer;
  function SD(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(SD, "copyProps");
  lt.from && lt.alloc && lt.allocUnsafe && lt.allocUnsafeSlow ? AD.exports = Ln : (SD(Ln, ta), ta.Buffer = yr);
  function yr(e, t, r) {
    return lt(e, t, r);
  }
  n(yr, "SafeBuffer");
  SD(lt, yr);
  yr.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return lt(e, t, r);
  };
  yr.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = lt(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  yr.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return lt(e);
  };
  yr.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return Ln.SlowBuffer(e);
  };
});

// ../node_modules/core-util-is/lib/util.js
var Se = b((xe) => {
  function VF(e) {
    return Array.isArray ? Array.isArray(e) : Un(e) === "[object Array]";
  }
  n(VF, "isArray");
  xe.isArray = VF;
  function GF(e) {
    return typeof e == "boolean";
  }
  n(GF, "isBoolean");
  xe.isBoolean = GF;
  function YF(e) {
    return e === null;
  }
  n(YF, "isNull");
  xe.isNull = YF;
  function JF(e) {
    return e == null;
  }
  n(JF, "isNullOrUndefined");
  xe.isNullOrUndefined = JF;
  function KF(e) {
    return typeof e == "number";
  }
  n(KF, "isNumber");
  xe.isNumber = KF;
  function XF(e) {
    return typeof e == "string";
  }
  n(XF, "isString");
  xe.isString = XF;
  function QF(e) {
    return typeof e == "symbol";
  }
  n(QF, "isSymbol");
  xe.isSymbol = QF;
  function ZF(e) {
    return e === void 0;
  }
  n(ZF, "isUndefined");
  xe.isUndefined = ZF;
  function ex(e) {
    return Un(e) === "[object RegExp]";
  }
  n(ex, "isRegExp");
  xe.isRegExp = ex;
  function tx(e) {
    return typeof e == "object" && e !== null;
  }
  n(tx, "isObject");
  xe.isObject = tx;
  function rx(e) {
    return Un(e) === "[object Date]";
  }
  n(rx, "isDate");
  xe.isDate = rx;
  function ix(e) {
    return Un(e) === "[object Error]" || e instanceof Error;
  }
  n(ix, "isError");
  xe.isError = ix;
  function nx(e) {
    return typeof e == "function";
  }
  n(nx, "isFunction");
  xe.isFunction = nx;
  function sx(e) {
    return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" || typeof e == "symbol" || // ES6 symbol
    typeof e > "u";
  }
  n(sx, "isPrimitive");
  xe.isPrimitive = sx;
  xe.isBuffer = E("buffer").Buffer.isBuffer;
  function Un(e) {
    return Object.prototype.toString.call(e);
  }
  n(Un, "objectToString");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/BufferList.js
var RD = b((rO, ra) => {
  "use strict";
  function ox(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(ox, "_classCallCheck");
  var TD = Nn().Buffer, Di = E("util");
  function ux(e, t, r) {
    e.copy(t, r);
  }
  n(ux, "copyBuffer");
  ra.exports = function() {
    function e() {
      ox(this, e), this.head = null, this.tail = null, this.length = 0;
    }
    return n(e, "BufferList"), e.prototype.push = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: null };
      this.length > 0 ? this.tail.next = i : this.head = i, this.tail = i, ++this.length;
    }, "push"), e.prototype.unshift = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: this.head };
      this.length === 0 && (this.tail = i), this.head = i, ++this.length;
    }, "unshift"), e.prototype.shift = /* @__PURE__ */ n(function() {
      if (this.length !== 0) {
        var r = this.head.data;
        return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
      }
    }, "shift"), e.prototype.clear = /* @__PURE__ */ n(function() {
      this.head = this.tail = null, this.length = 0;
    }, "clear"), e.prototype.join = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return "";
      for (var i = this.head, s = "" + i.data; i = i.next; )
        s += r + i.data;
      return s;
    }, "join"), e.prototype.concat = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return TD.alloc(0);
      for (var i = TD.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        ux(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  Di && Di.inspect && Di.inspect.custom && (ra.exports.prototype[Di.inspect.custom] = function() {
    var e = Di.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/destroy.js
var ia = b((nO, BD) => {
  "use strict";
  var Hn = ke();
  function ax(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, Hn.nextTick(
    Wn, this, e)) : Hn.nextTick(Wn, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, Hn.nextTick(Wn, r, o)) : Hn.nextTick(
      Wn, r, o) : t && t(o);
    }), this);
  }
  n(ax, "destroy");
  function lx() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(lx, "undestroy");
  function Wn(e, t) {
    e.emit("error", t);
  }
  n(Wn, "emitErrorNT");
  BD.exports = {
    destroy: ax,
    undestroy: lx
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_writable.js
var sa = b((oO, LD) => {
  "use strict";
  var Wt = ke();
  LD.exports = de;
  function OD(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      Sx(t, e);
    };
  }
  n(OD, "CorkedRequest");
  var fx = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : Wt.nextTick, br;
  de.WritableState = gi;
  var PD = Object.create(Se());
  PD.inherits = X();
  var hx = {
    deprecate: ei()
  }, qD = ea(), zn = Nn().Buffer, cx = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function dx(e) {
    return zn.from(e);
  }
  n(dx, "_uint8ArrayToBuffer");
  function px(e) {
    return zn.isBuffer(e) || e instanceof cx;
  }
  n(px, "_isUint8Array");
  var MD = ia();
  PD.inherits(de, qD);
  function Dx() {
  }
  n(Dx, "nop");
  function gi(e, t) {
    br = br || $t(), e = e || {};
    var r = t instanceof br;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      _x(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new OD(this);
  }
  n(gi, "WritableState");
  gi.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(gi.prototype, "buffer", {
        get: hx.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var $n;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? ($n = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(de, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return $n.call(this, e) ? !0 : this !== de ? !1 : e && e._writableState instanceof gi;
    }, "value")
  })) : $n = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function de(e) {
    if (br = br || $t(), !$n.call(de, this) && !(this instanceof br))
      return new de(e);
    this._writableState = new gi(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), qD.call(this);
  }
  n(de, "Writable");
  de.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function mx(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), Wt.nextTick(t, r);
  }
  n(mx, "writeAfterEnd");
  function gx(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), Wt.nextTick(i, o), s = !1), s;
  }
  n(gx, "validChunk");
  de.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && px(e);
    return o && !zn.isBuffer(e) && (e = dx(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = Dx), i.ended ? mx(this, r) : (o || gx(this, i, e, r)) && (i.pendingcb++, s = bx(this, i, o, e, t, r)), s;
  };
  de.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  de.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && jD(this, e));
  };
  de.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function yx(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = zn.from(t, r)), t;
  }
  n(yx, "decodeChunk");
  Object.defineProperty(de.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function bx(e, t, r, i, s, o) {
    if (!r) {
      var u = yx(t, i, s);
      i !== u && (r = !0, s = "buffer", i = u);
    }
    var a = t.objectMode ? 1 : i.length;
    t.length += a;
    var l = t.length < t.highWaterMark;
    if (l || (t.needDrain = !0), t.writing || t.corked) {
      var f = t.lastBufferedRequest;
      t.lastBufferedRequest = {
        chunk: i,
        encoding: s,
        isBuf: r,
        callback: o,
        next: null
      }, f ? f.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1;
    } else
      na(e, t, !1, a, i, s, o);
    return l;
  }
  n(bx, "writeOrBuffer");
  function na(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(na, "doWrite");
  function vx(e, t, r, i, s) {
    --t.pendingcb, r ? (Wt.nextTick(s, i), Wt.nextTick(mi, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), mi(e, t));
  }
  n(vx, "onwriteError");
  function wx(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(wx, "onwriteStateUpdate");
  function _x(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (wx(r), t) vx(e, r, i, t, s);
    else {
      var o = ID(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && jD(e, r), i ? fx(kD, e, r, o, s) : kD(e, r, o, s);
    }
  }
  n(_x, "onwrite");
  function kD(e, t, r, i) {
    r || Ex(e, t), t.pendingcb--, i(), mi(e, t);
  }
  n(kD, "afterWrite");
  function Ex(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(Ex, "onwriteDrain");
  function jD(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, na(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new OD(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (na(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(jD, "clearBuffer");
  de.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  de.prototype._writev = null;
  de.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || xx(this, i, r);
  };
  function ID(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(ID, "needFinish");
  function Cx(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), mi(e, t);
    });
  }
  n(Cx, "callFinal");
  function Fx(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, Wt.nextTick(Cx, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(Fx, "prefinish");
  function mi(e, t) {
    var r = ID(t);
    return r && (Fx(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(mi, "finishMaybe");
  function xx(e, t, r) {
    t.ending = !0, mi(e, t), r && (t.finished ? Wt.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(xx, "endWritable");
  function Sx(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(Sx, "onCorkedFinish");
  Object.defineProperty(de.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  de.prototype.destroy = MD.destroy;
  de.prototype._undestroy = MD.undestroy;
  de.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_duplex.js
var $t = b((aO, WD) => {
  "use strict";
  var ND = ke(), Ax = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  WD.exports = ft;
  var UD = Object.create(Se());
  UD.inherits = X();
  var HD = aa(), ua = sa();
  UD.inherits(ft, HD);
  for (oa = Ax(ua.prototype), Vn = 0; Vn < oa.length; Vn++)
    Gn = oa[Vn], ft.prototype[Gn] || (ft.prototype[Gn] = ua.prototype[Gn]);
  var oa, Gn, Vn;
  function ft(e) {
    if (!(this instanceof ft)) return new ft(e);
    HD.call(this, e), ua.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", Tx);
  }
  n(ft, "Duplex");
  Object.defineProperty(ft.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function Tx() {
    this.allowHalfOpen || this._writableState.ended || ND.nextTick(Rx, this);
  }
  n(Tx, "onend");
  function Rx(e) {
    e.end();
  }
  n(Rx, "onEndNT");
  Object.defineProperty(ft.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  ft.prototype._destroy = function(e, t) {
    this.push(null), this.end(), ND.nextTick(t, e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_readable.js
var aa = b((hO, tm) => {
  "use strict";
  var wr = ke();
  tm.exports = ee;
  var Bx = FD(), yi;
  ee.ReadableState = KD;
  var fO = E("events").EventEmitter, GD = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), da = ea(), bi = Nn().Buffer, kx = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function Ox(e) {
    return bi.from(e);
  }
  n(Ox, "_uint8ArrayToBuffer");
  function Px(e) {
    return bi.isBuffer(e) || e instanceof kx;
  }
  n(Px, "_isUint8Array");
  var YD = Object.create(Se());
  YD.inherits = X();
  var la = E("util"), z = void 0;
  la && la.debuglog ? z = la.debuglog("stream") : z = /* @__PURE__ */ n(function() {
  }, "debug");
  var qx = RD(), JD = ia(), vr;
  YD.inherits(ee, da);
  var fa = ["error", "close", "destroy", "pause", "resume"];
  function Mx(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : Bx(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(Mx, "prependListener");
  function KD(e, t) {
    yi = yi || $t(), e = e || {};
    var r = t instanceof yi;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new qx(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (vr || (vr = E("string_decoder/").StringDecoder), this.decoder = new vr(e.encoding),
    this.encoding = e.encoding);
  }
  n(KD, "ReadableState");
  function ee(e) {
    if (yi = yi || $t(), !(this instanceof ee)) return new ee(e);
    this._readableState = new KD(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), da.call(this);
  }
  n(ee, "Readable");
  Object.defineProperty(ee.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState && (this._readableState.destroyed = e);
    }, "set")
  });
  ee.prototype.destroy = JD.destroy;
  ee.prototype._undestroy = JD.undestroy;
  ee.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  ee.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = bi.from(e, t), t = ""), i =
    !0), XD(this, e, t, !1, i);
  };
  ee.prototype.unshift = function(e) {
    return XD(this, e, null, !0, !1);
  };
  function XD(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, Nx(e, o);
    else {
      var u;
      s || (u = jx(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== bi.prototype && (t = Ox(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : ha(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? ha(e, o, t, !1) : QD(e, o)) : ha(e, o, t, !1))) : i || (o.reading = !1);
    }
    return Ix(o);
  }
  n(XD, "readableAddChunk");
  function ha(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && Yn(e)), QD(e, t);
  }
  n(ha, "addChunk");
  function jx(e, t) {
    var r;
    return !Px(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(jx, "chunkInvalid");
  function Ix(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(Ix, "needMoreData");
  ee.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  ee.prototype.setEncoding = function(e) {
    return vr || (vr = E("string_decoder/").StringDecoder), this._readableState.decoder = new vr(e), this._readableState.encoding = e, this;
  };
  var $D = 8388608;
  function Lx(e) {
    return e >= $D ? e = $D : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(Lx, "computeNewHighWaterMark");
  function zD(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = Lx(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(zD, "howMuchToRead");
  ee.prototype.read = function(e) {
    z("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return z("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? ca(this) : Yn(this), null;
    if (e = zD(e, t), e === 0 && t.ended)
      return t.length === 0 && ca(this), null;
    var i = t.needReadable;
    z("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, z("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, z("reading or ended", i)) : i && (z("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = zD(r, t)));
    var s;
    return e > 0 ? s = ZD(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && ca(this)), s !== null && this.emit("data", s), s;
  };
  function Nx(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, Yn(e);
    }
  }
  n(Nx, "onEofChunk");
  function Yn(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || (z("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? wr.nextTick(VD, e) : VD(e));
  }
  n(Yn, "emitReadable");
  function VD(e) {
    z("emit readable"), e.emit("readable"), pa(e);
  }
  n(VD, "emitReadable_");
  function QD(e, t) {
    t.readingMore || (t.readingMore = !0, wr.nextTick(Ux, e, t));
  }
  n(QD, "maybeReadMore");
  function Ux(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (z("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(Ux, "maybeReadMore_");
  ee.prototype._read = function(e) {
    this.emit("error", new Error("_read() is not implemented"));
  };
  ee.prototype.pipe = function(e, t) {
    var r = this, i = this._readableState;
    switch (i.pipesCount) {
      case 0:
        i.pipes = e;
        break;
      case 1:
        i.pipes = [i.pipes, e];
        break;
      default:
        i.pipes.push(e);
        break;
    }
    i.pipesCount += 1, z("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? wr.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, C) {
      z("onunpipe"), _ === r && C && C.hasUnpiped === !1 && (C.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      z("onend"), e.end();
    }
    n(a, "onend");
    var l = Hx(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      z("cleanup"), e.removeListener("close", g), e.removeListener("finish", w), e.removeListener("drain", l), e.removeListener("error", h),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", y), r.removeListener("data", c), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup");
    var d = !1;
    r.on("data", c);
    function c(_) {
      z("ondata"), d = !1;
      var C = e.write(_);
      C === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && em(i.pipes, e) !== -1) && !f && (z("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      z("onerror", _), y(), e.removeListener("error", h), GD(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), Mx(e, "error", h);
    function g() {
      e.removeListener("finish", w), y();
    }
    n(g, "onclose"), e.once("close", g);
    function w() {
      z("onfinish"), e.removeListener("close", g), y();
    }
    n(w, "onfinish"), e.once("finish", w);
    function y() {
      z("unpipe"), r.unpipe(e);
    }
    return n(y, "unpipe"), e.emit("pipe", r), i.flowing || (z("pipe resume"), r.resume()), e;
  };
  function Hx(e) {
    return function() {
      var t = e._readableState;
      z("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && GD(e, "data") && (t.flowing = !0, pa(e));
    };
  }
  n(Hx, "pipeOnDrain");
  ee.prototype.unpipe = function(e) {
    var t = this._readableState, r = { hasUnpiped: !1 };
    if (t.pipesCount === 0) return this;
    if (t.pipesCount === 1)
      return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this, r),
      this);
    if (!e) {
      var i = t.pipes, s = t.pipesCount;
      t.pipes = null, t.pipesCount = 0, t.flowing = !1;
      for (var o = 0; o < s; o++)
        i[o].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var u = em(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  ee.prototype.on = function(e, t) {
    var r = da.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && Yn(
      this) : wr.nextTick(Wx, this));
    }
    return r;
  };
  ee.prototype.addListener = ee.prototype.on;
  function Wx(e) {
    z("readable nexttick read 0"), e.read(0);
  }
  n(Wx, "nReadingNextTick");
  ee.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (z("resume"), e.flowing = !0, $x(this, e)), this;
  };
  function $x(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, wr.nextTick(zx, e, t));
  }
  n($x, "resume");
  function zx(e, t) {
    t.reading || (z("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), pa(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(zx, "resume_");
  ee.prototype.pause = function() {
    return z("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (z("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function pa(e) {
    var t = e._readableState;
    for (z("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n(pa, "flow");
  ee.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if (z("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if (z("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
        var a = t.push(u);
        a || (i = !0, e.pause());
      }
    });
    for (var s in e)
      this[s] === void 0 && typeof e[s] == "function" && (this[s] = /* @__PURE__ */ function(u) {
        return function() {
          return e[u].apply(e, arguments);
        };
      }(s));
    for (var o = 0; o < fa.length; o++)
      e.on(fa[o], this.emit.bind(this, fa[o]));
    return this._read = function(u) {
      z("wrapped _read", u), i && (i = !1, e.resume());
    }, this;
  };
  Object.defineProperty(ee.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.highWaterMark;
    }, "get")
  });
  ee._fromList = ZD;
  function ZD(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = Vx(e, t.buffer, t.decoder), r;
  }
  n(ZD, "fromList");
  function Vx(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? Gx(e, t) : Yx(e, t), i;
  }
  n(Vx, "fromListPartial");
  function Gx(e, t) {
    var r = t.head, i = 1, s = r.data;
    for (e -= s.length; r = r.next; ) {
      var o = r.data, u = e > o.length ? o.length : e;
      if (u === o.length ? s += o : s += o.slice(0, e), e -= u, e === 0) {
        u === o.length ? (++i, r.next ? t.head = r.next : t.head = t.tail = null) : (t.head = r, r.data = o.slice(u));
        break;
      }
      ++i;
    }
    return t.length -= i, s;
  }
  n(Gx, "copyFromBufferString");
  function Yx(e, t) {
    var r = bi.allocUnsafe(e), i = t.head, s = 1;
    for (i.data.copy(r), e -= i.data.length; i = i.next; ) {
      var o = i.data, u = e > o.length ? o.length : e;
      if (o.copy(r, r.length - e, 0, u), e -= u, e === 0) {
        u === o.length ? (++s, i.next ? t.head = i.next : t.head = t.tail = null) : (t.head = i, i.data = o.slice(u));
        break;
      }
      ++s;
    }
    return t.length -= s, r;
  }
  n(Yx, "copyFromBuffer");
  function ca(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, wr.nextTick(Jx, t, e));
  }
  n(ca, "endReadable");
  function Jx(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(Jx, "endReadableNT");
  function em(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(em, "indexOf");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_transform.js
var Da = b((dO, nm) => {
  "use strict";
  nm.exports = ht;
  var Jn = $t(), im = Object.create(Se());
  im.inherits = X();
  im.inherits(ht, Jn);
  function Kx(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(Kx, "afterTransform");
  function ht(e) {
    if (!(this instanceof ht)) return new ht(e);
    Jn.call(this, e), this._transformState = {
      afterTransform: Kx.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", Xx);
  }
  n(ht, "Transform");
  function Xx() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      rm(e, t, r);
    }) : rm(this, null, null);
  }
  n(Xx, "prefinish");
  ht.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, Jn.prototype.push.call(this, e, t);
  };
  ht.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  ht.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  ht.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  ht.prototype._destroy = function(e, t) {
    var r = this;
    Jn.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function rm(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(rm, "done");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_passthrough.js
var am = b((DO, um) => {
  "use strict";
  um.exports = vi;
  var sm = Da(), om = Object.create(Se());
  om.inherits = X();
  om.inherits(vi, sm);
  function vi(e) {
    if (!(this instanceof vi)) return new vi(e);
    sm.call(this, e);
  }
  n(vi, "PassThrough");
  vi.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/readable.js
var lm = b((ve, Kn) => {
  var Ke = E("stream");
  process.env.READABLE_STREAM === "disable" && Ke ? (Kn.exports = Ke, ve = Kn.exports = Ke.Readable, ve.Readable = Ke.Readable, ve.Writable =
  Ke.Writable, ve.Duplex = Ke.Duplex, ve.Transform = Ke.Transform, ve.PassThrough = Ke.PassThrough, ve.Stream = Ke) : (ve = Kn.exports = aa(),
  ve.Stream = Ke || ve, ve.Readable = ve, ve.Writable = sa(), ve.Duplex = $t(), ve.Transform = Da(), ve.PassThrough = am());
});

// ../node_modules/stream-shift/index.js
var ma = b((gO, fm) => {
  fm.exports = Qx;
  function Qx(e) {
    var t = e._readableState;
    return t ? t.objectMode || typeof e._duplexState == "number" ? e.read() : e.read(Zx(t)) : null;
  }
  n(Qx, "shift");
  function Zx(e) {
    return e.buffer.length ? e.buffer.head ? e.buffer.head.data.length : e.buffer[0].length : e.length;
  }
  n(Zx, "getStateLength");
});

// ../node_modules/peek-stream/node_modules/duplexify/index.js
var Dm = b((bO, pm) => {
  var Xn = lm(), hm = ur(), e2 = X(), t2 = ma(), cm = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([0]) : new Buffer([0]), ga = /* @__PURE__ */ n(
  function(e, t) {
    e._corked ? e.once("uncork", t) : t();
  }, "onuncork"), r2 = /* @__PURE__ */ n(function(e, t) {
    e._autoDestroy && e.destroy(t);
  }, "autoDestroy"), dm = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r ? r2(e, r.message === "premature close" ? null : r) : t && !e._ended && e.end();
    };
  }, "destroyer"), i2 = /* @__PURE__ */ n(function(e, t) {
    if (!e || e._writableState && e._writableState.finished) return t();
    if (e._writableState) return e.end(t);
    e.end(), t();
  }, "end"), n2 = /* @__PURE__ */ n(function(e) {
    return new Xn.Readable({ objectMode: !0, highWaterMark: 16 }).wrap(e);
  }, "toStreams2"), we = /* @__PURE__ */ n(function(e, t, r) {
    if (!(this instanceof we)) return new we(e, t, r);
    Xn.Duplex.call(this, r), this._writable = null, this._readable = null, this._readable2 = null, this._autoDestroy = !r || r.autoDestroy !==
    !1, this._forwardDestroy = !r || r.destroy !== !1, this._forwardEnd = !r || r.end !== !1, this._corked = 1, this._ondrain = null, this._drained =
    !1, this._forwarding = !1, this._unwrite = null, this._unread = null, this._ended = !1, this.destroyed = !1, e && this.setWritable(e), t &&
    this.setReadable(t);
  }, "Duplexify");
  e2(we, Xn.Duplex);
  we.obj = function(e, t, r) {
    return r || (r = {}), r.objectMode = !0, r.highWaterMark = 16, new we(e, t, r);
  };
  we.prototype.cork = function() {
    ++this._corked === 1 && this.emit("cork");
  };
  we.prototype.uncork = function() {
    this._corked && --this._corked === 0 && this.emit("uncork");
  };
  we.prototype.setWritable = function(e) {
    if (this._unwrite && this._unwrite(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.end();
      return;
    }
    var t = this, r = hm(e, { writable: !0, readable: !1 }, dm(this, this._forwardEnd)), i = /* @__PURE__ */ n(function() {
      var o = t._ondrain;
      t._ondrain = null, o && o();
    }, "ondrain"), s = /* @__PURE__ */ n(function() {
      t._writable.removeListener("drain", i), r();
    }, "clear");
    this._unwrite && process.nextTick(i), this._writable = e, this._writable.on("drain", i), this._unwrite = s, this.uncork();
  };
  we.prototype.setReadable = function(e) {
    if (this._unread && this._unread(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.push(null), this.resume();
      return;
    }
    var t = this, r = hm(e, { writable: !1, readable: !0 }, dm(this)), i = /* @__PURE__ */ n(function() {
      t._forward();
    }, "onreadable"), s = /* @__PURE__ */ n(function() {
      t.push(null);
    }, "onend"), o = /* @__PURE__ */ n(function() {
      t._readable2.removeListener("readable", i), t._readable2.removeListener("end", s), r();
    }, "clear");
    this._drained = !0, this._readable = e, this._readable2 = e._readableState ? e : n2(e), this._readable2.on("readable", i), this._readable2.
    on("end", s), this._unread = o, this._forward();
  };
  we.prototype._read = function() {
    this._drained = !0, this._forward();
  };
  we.prototype._forward = function() {
    if (!(this._forwarding || !this._readable2 || !this._drained)) {
      this._forwarding = !0;
      for (var e; this._drained && (e = t2(this._readable2)) !== null; )
        this.destroyed || (this._drained = this.push(e));
      this._forwarding = !1;
    }
  };
  we.prototype.destroy = function(e) {
    if (!this.destroyed) {
      this.destroyed = !0;
      var t = this;
      process.nextTick(function() {
        t._destroy(e);
      });
    }
  };
  we.prototype._destroy = function(e) {
    if (e) {
      var t = this._ondrain;
      this._ondrain = null, t ? t(e) : this.emit("error", e);
    }
    this._forwardDestroy && (this._readable && this._readable.destroy && this._readable.destroy(), this._writable && this._writable.destroy &&
    this._writable.destroy()), this.emit("close");
  };
  we.prototype._write = function(e, t, r) {
    if (this.destroyed) return r();
    if (this._corked) return ga(this, this._write.bind(this, e, t, r));
    if (e === cm) return this._finish(r);
    if (!this._writable) return r();
    this._writable.write(e) === !1 ? this._ondrain = r : r();
  };
  we.prototype._finish = function(e) {
    var t = this;
    this.emit("preend"), ga(this, function() {
      i2(t._forwardEnd && t._writable, function() {
        t._writableState.prefinished === !1 && (t._writableState.prefinished = !0), t.emit("prefinish"), ga(t, e);
      });
    });
  };
  we.prototype.end = function(e, t, r) {
    return typeof e == "function" ? this.end(null, null, e) : typeof t == "function" ? this.end(e, null, t) : (this._ended = !0, e && this.write(
    e), this._writableState.ending || this.write(cm), Xn.Writable.prototype.end.call(this, r));
  };
  pm.exports = we;
});

// ../node_modules/through2/node_modules/isarray/index.js
var gm = b((wO, mm) => {
  var s2 = {}.toString;
  mm.exports = Array.isArray || function(e) {
    return s2.call(e) == "[object Array]";
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/stream.js
var ya = b((_O, ym) => {
  ym.exports = E("stream");
});

// ../node_modules/through2/node_modules/safe-buffer/index.js
var Zn = b((ba, vm) => {
  var Qn = E("buffer"), ct = Qn.Buffer;
  function bm(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(bm, "copyProps");
  ct.from && ct.alloc && ct.allocUnsafe && ct.allocUnsafeSlow ? vm.exports = Qn : (bm(Qn, ba), ba.Buffer = _r);
  function _r(e, t, r) {
    return ct(e, t, r);
  }
  n(_r, "SafeBuffer");
  bm(ct, _r);
  _r.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return ct(e, t, r);
  };
  _r.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = ct(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  _r.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return ct(e);
  };
  _r.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return Qn.SlowBuffer(e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/BufferList.js
var _m = b((CO, va) => {
  "use strict";
  function o2(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(o2, "_classCallCheck");
  var wm = Zn().Buffer, wi = E("util");
  function u2(e, t, r) {
    e.copy(t, r);
  }
  n(u2, "copyBuffer");
  va.exports = function() {
    function e() {
      o2(this, e), this.head = null, this.tail = null, this.length = 0;
    }
    return n(e, "BufferList"), e.prototype.push = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: null };
      this.length > 0 ? this.tail.next = i : this.head = i, this.tail = i, ++this.length;
    }, "push"), e.prototype.unshift = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: this.head };
      this.length === 0 && (this.tail = i), this.head = i, ++this.length;
    }, "unshift"), e.prototype.shift = /* @__PURE__ */ n(function() {
      if (this.length !== 0) {
        var r = this.head.data;
        return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
      }
    }, "shift"), e.prototype.clear = /* @__PURE__ */ n(function() {
      this.head = this.tail = null, this.length = 0;
    }, "clear"), e.prototype.join = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return "";
      for (var i = this.head, s = "" + i.data; i = i.next; )
        s += r + i.data;
      return s;
    }, "join"), e.prototype.concat = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return wm.alloc(0);
      for (var i = wm.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        u2(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  wi && wi.inspect && wi.inspect.custom && (va.exports.prototype[wi.inspect.custom] = function() {
    var e = wi.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/destroy.js
var wa = b((xO, Em) => {
  "use strict";
  var es = ke();
  function a2(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, es.nextTick(
    ts, this, e)) : es.nextTick(ts, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, es.nextTick(ts, r, o)) : es.nextTick(
      ts, r, o) : t && t(o);
    }), this);
  }
  n(a2, "destroy");
  function l2() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(l2, "undestroy");
  function ts(e, t) {
    e.emit("error", t);
  }
  n(ts, "emitErrorNT");
  Em.exports = {
    destroy: a2,
    undestroy: l2
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_writable.js
var Ea = b((AO, Bm) => {
  "use strict";
  var zt = ke();
  Bm.exports = pe;
  function Fm(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      S2(t, e);
    };
  }
  n(Fm, "CorkedRequest");
  var f2 = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : zt.nextTick, Er;
  pe.WritableState = Ei;
  var xm = Object.create(Se());
  xm.inherits = X();
  var h2 = {
    deprecate: ei()
  }, Sm = ya(), is = Zn().Buffer, c2 = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function d2(e) {
    return is.from(e);
  }
  n(d2, "_uint8ArrayToBuffer");
  function p2(e) {
    return is.isBuffer(e) || e instanceof c2;
  }
  n(p2, "_isUint8Array");
  var Am = wa();
  xm.inherits(pe, Sm);
  function D2() {
  }
  n(D2, "nop");
  function Ei(e, t) {
    Er = Er || Vt(), e = e || {};
    var r = t instanceof Er;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      _2(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new Fm(this);
  }
  n(Ei, "WritableState");
  Ei.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(Ei.prototype, "buffer", {
        get: h2.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var rs;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (rs = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(pe, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return rs.call(this, e) ? !0 : this !== pe ? !1 : e && e._writableState instanceof Ei;
    }, "value")
  })) : rs = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function pe(e) {
    if (Er = Er || Vt(), !rs.call(pe, this) && !(this instanceof Er))
      return new pe(e);
    this._writableState = new Ei(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), Sm.call(this);
  }
  n(pe, "Writable");
  pe.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function m2(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), zt.nextTick(t, r);
  }
  n(m2, "writeAfterEnd");
  function g2(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), zt.nextTick(i, o), s = !1), s;
  }
  n(g2, "validChunk");
  pe.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && p2(e);
    return o && !is.isBuffer(e) && (e = d2(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = D2), i.ended ? m2(this, r) : (o || g2(this, i, e, r)) && (i.pendingcb++, s = b2(this, i, o, e, t, r)), s;
  };
  pe.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  pe.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && Tm(this, e));
  };
  pe.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function y2(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = is.from(t, r)), t;
  }
  n(y2, "decodeChunk");
  Object.defineProperty(pe.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function b2(e, t, r, i, s, o) {
    if (!r) {
      var u = y2(t, i, s);
      i !== u && (r = !0, s = "buffer", i = u);
    }
    var a = t.objectMode ? 1 : i.length;
    t.length += a;
    var l = t.length < t.highWaterMark;
    if (l || (t.needDrain = !0), t.writing || t.corked) {
      var f = t.lastBufferedRequest;
      t.lastBufferedRequest = {
        chunk: i,
        encoding: s,
        isBuf: r,
        callback: o,
        next: null
      }, f ? f.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1;
    } else
      _a(e, t, !1, a, i, s, o);
    return l;
  }
  n(b2, "writeOrBuffer");
  function _a(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(_a, "doWrite");
  function v2(e, t, r, i, s) {
    --t.pendingcb, r ? (zt.nextTick(s, i), zt.nextTick(_i, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), _i(e, t));
  }
  n(v2, "onwriteError");
  function w2(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(w2, "onwriteStateUpdate");
  function _2(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (w2(r), t) v2(e, r, i, t, s);
    else {
      var o = Rm(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && Tm(e, r), i ? f2(Cm, e, r, o, s) : Cm(e, r, o, s);
    }
  }
  n(_2, "onwrite");
  function Cm(e, t, r, i) {
    r || E2(e, t), t.pendingcb--, i(), _i(e, t);
  }
  n(Cm, "afterWrite");
  function E2(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(E2, "onwriteDrain");
  function Tm(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, _a(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new Fm(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (_a(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(Tm, "clearBuffer");
  pe.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  pe.prototype._writev = null;
  pe.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || x2(this, i, r);
  };
  function Rm(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(Rm, "needFinish");
  function C2(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), _i(e, t);
    });
  }
  n(C2, "callFinal");
  function F2(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, zt.nextTick(C2, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(F2, "prefinish");
  function _i(e, t) {
    var r = Rm(t);
    return r && (F2(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(_i, "finishMaybe");
  function x2(e, t, r) {
    t.ending = !0, _i(e, t), r && (t.finished ? zt.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(x2, "endWritable");
  function S2(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(S2, "onCorkedFinish");
  Object.defineProperty(pe.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  pe.prototype.destroy = Am.destroy;
  pe.prototype._undestroy = Am.undestroy;
  pe.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_duplex.js
var Vt = b((RO, qm) => {
  "use strict";
  var km = ke(), A2 = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  qm.exports = dt;
  var Om = Object.create(Se());
  Om.inherits = X();
  var Pm = xa(), Fa = Ea();
  Om.inherits(dt, Pm);
  for (Ca = A2(Fa.prototype), ns = 0; ns < Ca.length; ns++)
    ss = Ca[ns], dt.prototype[ss] || (dt.prototype[ss] = Fa.prototype[ss]);
  var Ca, ss, ns;
  function dt(e) {
    if (!(this instanceof dt)) return new dt(e);
    Pm.call(this, e), Fa.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", T2);
  }
  n(dt, "Duplex");
  Object.defineProperty(dt.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function T2() {
    this.allowHalfOpen || this._writableState.ended || km.nextTick(R2, this);
  }
  n(T2, "onend");
  function R2(e) {
    e.end();
  }
  n(R2, "onEndNT");
  Object.defineProperty(dt.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  dt.prototype._destroy = function(e, t) {
    this.push(null), this.end(), km.nextTick(t, e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_readable.js
var xa = b((OO, Gm) => {
  "use strict";
  var Fr = ke();
  Gm.exports = te;
  var B2 = gm(), Ci;
  te.ReadableState = Hm;
  var kO = E("events").EventEmitter, Lm = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), Ba = ya(), Fi = Zn().Buffer, k2 = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function O2(e) {
    return Fi.from(e);
  }
  n(O2, "_uint8ArrayToBuffer");
  function P2(e) {
    return Fi.isBuffer(e) || e instanceof k2;
  }
  n(P2, "_isUint8Array");
  var Nm = Object.create(Se());
  Nm.inherits = X();
  var Sa = E("util"), V = void 0;
  Sa && Sa.debuglog ? V = Sa.debuglog("stream") : V = /* @__PURE__ */ n(function() {
  }, "debug");
  var q2 = _m(), Um = wa(), Cr;
  Nm.inherits(te, Ba);
  var Aa = ["error", "close", "destroy", "pause", "resume"];
  function M2(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : B2(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(M2, "prependListener");
  function Hm(e, t) {
    Ci = Ci || Vt(), e = e || {};
    var r = t instanceof Ci;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new q2(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (Cr || (Cr = E("string_decoder/").StringDecoder), this.decoder = new Cr(e.encoding),
    this.encoding = e.encoding);
  }
  n(Hm, "ReadableState");
  function te(e) {
    if (Ci = Ci || Vt(), !(this instanceof te)) return new te(e);
    this._readableState = new Hm(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), Ba.call(this);
  }
  n(te, "Readable");
  Object.defineProperty(te.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState && (this._readableState.destroyed = e);
    }, "set")
  });
  te.prototype.destroy = Um.destroy;
  te.prototype._undestroy = Um.undestroy;
  te.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  te.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = Fi.from(e, t), t = ""), i =
    !0), Wm(this, e, t, !1, i);
  };
  te.prototype.unshift = function(e) {
    return Wm(this, e, null, !0, !1);
  };
  function Wm(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, N2(e, o);
    else {
      var u;
      s || (u = j2(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== Fi.prototype && (t = O2(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : Ta(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? Ta(e, o, t, !1) : $m(e, o)) : Ta(e, o, t, !1))) : i || (o.reading = !1);
    }
    return I2(o);
  }
  n(Wm, "readableAddChunk");
  function Ta(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && os(e)), $m(e, t);
  }
  n(Ta, "addChunk");
  function j2(e, t) {
    var r;
    return !P2(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(j2, "chunkInvalid");
  function I2(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(I2, "needMoreData");
  te.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  te.prototype.setEncoding = function(e) {
    return Cr || (Cr = E("string_decoder/").StringDecoder), this._readableState.decoder = new Cr(e), this._readableState.encoding = e, this;
  };
  var Mm = 8388608;
  function L2(e) {
    return e >= Mm ? e = Mm : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(L2, "computeNewHighWaterMark");
  function jm(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = L2(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(jm, "howMuchToRead");
  te.prototype.read = function(e) {
    V("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return V("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? Ra(this) : os(this), null;
    if (e = jm(e, t), e === 0 && t.ended)
      return t.length === 0 && Ra(this), null;
    var i = t.needReadable;
    V("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, V("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, V("reading or ended", i)) : i && (V("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = jm(r, t)));
    var s;
    return e > 0 ? s = zm(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && Ra(this)), s !== null && this.emit("data", s), s;
  };
  function N2(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, os(e);
    }
  }
  n(N2, "onEofChunk");
  function os(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || (V("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? Fr.nextTick(Im, e) : Im(e));
  }
  n(os, "emitReadable");
  function Im(e) {
    V("emit readable"), e.emit("readable"), ka(e);
  }
  n(Im, "emitReadable_");
  function $m(e, t) {
    t.readingMore || (t.readingMore = !0, Fr.nextTick(U2, e, t));
  }
  n($m, "maybeReadMore");
  function U2(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (V("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(U2, "maybeReadMore_");
  te.prototype._read = function(e) {
    this.emit("error", new Error("_read() is not implemented"));
  };
  te.prototype.pipe = function(e, t) {
    var r = this, i = this._readableState;
    switch (i.pipesCount) {
      case 0:
        i.pipes = e;
        break;
      case 1:
        i.pipes = [i.pipes, e];
        break;
      default:
        i.pipes.push(e);
        break;
    }
    i.pipesCount += 1, V("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? Fr.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, C) {
      V("onunpipe"), _ === r && C && C.hasUnpiped === !1 && (C.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      V("onend"), e.end();
    }
    n(a, "onend");
    var l = H2(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      V("cleanup"), e.removeListener("close", g), e.removeListener("finish", w), e.removeListener("drain", l), e.removeListener("error", h),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", y), r.removeListener("data", c), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup");
    var d = !1;
    r.on("data", c);
    function c(_) {
      V("ondata"), d = !1;
      var C = e.write(_);
      C === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && Vm(i.pipes, e) !== -1) && !f && (V("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      V("onerror", _), y(), e.removeListener("error", h), Lm(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), M2(e, "error", h);
    function g() {
      e.removeListener("finish", w), y();
    }
    n(g, "onclose"), e.once("close", g);
    function w() {
      V("onfinish"), e.removeListener("close", g), y();
    }
    n(w, "onfinish"), e.once("finish", w);
    function y() {
      V("unpipe"), r.unpipe(e);
    }
    return n(y, "unpipe"), e.emit("pipe", r), i.flowing || (V("pipe resume"), r.resume()), e;
  };
  function H2(e) {
    return function() {
      var t = e._readableState;
      V("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && Lm(e, "data") && (t.flowing = !0, ka(e));
    };
  }
  n(H2, "pipeOnDrain");
  te.prototype.unpipe = function(e) {
    var t = this._readableState, r = { hasUnpiped: !1 };
    if (t.pipesCount === 0) return this;
    if (t.pipesCount === 1)
      return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this, r),
      this);
    if (!e) {
      var i = t.pipes, s = t.pipesCount;
      t.pipes = null, t.pipesCount = 0, t.flowing = !1;
      for (var o = 0; o < s; o++)
        i[o].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var u = Vm(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  te.prototype.on = function(e, t) {
    var r = Ba.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && os(
      this) : Fr.nextTick(W2, this));
    }
    return r;
  };
  te.prototype.addListener = te.prototype.on;
  function W2(e) {
    V("readable nexttick read 0"), e.read(0);
  }
  n(W2, "nReadingNextTick");
  te.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (V("resume"), e.flowing = !0, $2(this, e)), this;
  };
  function $2(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, Fr.nextTick(z2, e, t));
  }
  n($2, "resume");
  function z2(e, t) {
    t.reading || (V("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), ka(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(z2, "resume_");
  te.prototype.pause = function() {
    return V("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (V("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function ka(e) {
    var t = e._readableState;
    for (V("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n(ka, "flow");
  te.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if (V("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if (V("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
        var a = t.push(u);
        a || (i = !0, e.pause());
      }
    });
    for (var s in e)
      this[s] === void 0 && typeof e[s] == "function" && (this[s] = /* @__PURE__ */ function(u) {
        return function() {
          return e[u].apply(e, arguments);
        };
      }(s));
    for (var o = 0; o < Aa.length; o++)
      e.on(Aa[o], this.emit.bind(this, Aa[o]));
    return this._read = function(u) {
      V("wrapped _read", u), i && (i = !1, e.resume());
    }, this;
  };
  Object.defineProperty(te.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.highWaterMark;
    }, "get")
  });
  te._fromList = zm;
  function zm(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = V2(e, t.buffer, t.decoder), r;
  }
  n(zm, "fromList");
  function V2(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? G2(e, t) : Y2(e, t), i;
  }
  n(V2, "fromListPartial");
  function G2(e, t) {
    var r = t.head, i = 1, s = r.data;
    for (e -= s.length; r = r.next; ) {
      var o = r.data, u = e > o.length ? o.length : e;
      if (u === o.length ? s += o : s += o.slice(0, e), e -= u, e === 0) {
        u === o.length ? (++i, r.next ? t.head = r.next : t.head = t.tail = null) : (t.head = r, r.data = o.slice(u));
        break;
      }
      ++i;
    }
    return t.length -= i, s;
  }
  n(G2, "copyFromBufferString");
  function Y2(e, t) {
    var r = Fi.allocUnsafe(e), i = t.head, s = 1;
    for (i.data.copy(r), e -= i.data.length; i = i.next; ) {
      var o = i.data, u = e > o.length ? o.length : e;
      if (o.copy(r, r.length - e, 0, u), e -= u, e === 0) {
        u === o.length ? (++s, i.next ? t.head = i.next : t.head = t.tail = null) : (t.head = i, i.data = o.slice(u));
        break;
      }
      ++s;
    }
    return t.length -= s, r;
  }
  n(Y2, "copyFromBuffer");
  function Ra(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, Fr.nextTick(J2, t, e));
  }
  n(Ra, "endReadable");
  function J2(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(J2, "endReadableNT");
  function Vm(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(Vm, "indexOf");
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_transform.js
var Oa = b((qO, Km) => {
  "use strict";
  Km.exports = pt;
  var us = Vt(), Jm = Object.create(Se());
  Jm.inherits = X();
  Jm.inherits(pt, us);
  function K2(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(K2, "afterTransform");
  function pt(e) {
    if (!(this instanceof pt)) return new pt(e);
    us.call(this, e), this._transformState = {
      afterTransform: K2.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", X2);
  }
  n(pt, "Transform");
  function X2() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      Ym(e, t, r);
    }) : Ym(this, null, null);
  }
  n(X2, "prefinish");
  pt.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, us.prototype.push.call(this, e, t);
  };
  pt.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  pt.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  pt.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  pt.prototype._destroy = function(e, t) {
    var r = this;
    us.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function Ym(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(Ym, "done");
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_passthrough.js
var eg = b((jO, Zm) => {
  "use strict";
  Zm.exports = xi;
  var Xm = Oa(), Qm = Object.create(Se());
  Qm.inherits = X();
  Qm.inherits(xi, Xm);
  function xi(e) {
    if (!(this instanceof xi)) return new xi(e);
    Xm.call(this, e);
  }
  n(xi, "PassThrough");
  xi.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/readable.js
var tg = b((_e, as) => {
  var Xe = E("stream");
  process.env.READABLE_STREAM === "disable" && Xe ? (as.exports = Xe, _e = as.exports = Xe.Readable, _e.Readable = Xe.Readable, _e.Writable =
  Xe.Writable, _e.Duplex = Xe.Duplex, _e.Transform = Xe.Transform, _e.PassThrough = Xe.PassThrough, _e.Stream = Xe) : (_e = as.exports = xa(),
  _e.Stream = Xe || _e, _e.Readable = _e, _e.Writable = Ea(), _e.Duplex = Vt(), _e.Transform = Oa(), _e.PassThrough = eg());
});

// ../node_modules/xtend/immutable.js
var ig = b((LO, rg) => {
  rg.exports = Z2;
  var Q2 = Object.prototype.hasOwnProperty;
  function Z2() {
    for (var e = {}, t = 0; t < arguments.length; t++) {
      var r = arguments[t];
      for (var i in r)
        Q2.call(r, i) && (e[i] = r[i]);
    }
    return e;
  }
  n(Z2, "extend");
});

// ../node_modules/through2/through2.js
var qa = b((UO, ls) => {
  var ng = tg().Transform, sg = E("util").inherits, og = ig();
  function xr(e) {
    ng.call(this, e), this._destroyed = !1;
  }
  n(xr, "DestroyableTransform");
  sg(xr, ng);
  xr.prototype.destroy = function(e) {
    if (!this._destroyed) {
      this._destroyed = !0;
      var t = this;
      process.nextTick(function() {
        e && t.emit("error", e), t.emit("close");
      });
    }
  };
  function eS(e, t, r) {
    r(null, e);
  }
  n(eS, "noop");
  function Pa(e) {
    return function(t, r, i) {
      return typeof t == "function" && (i = r, r = t, t = {}), typeof r != "function" && (r = eS), typeof i != "function" && (i = null), e(t,
      r, i);
    };
  }
  n(Pa, "through2");
  ls.exports = Pa(function(e, t, r) {
    var i = new xr(e);
    return i._transform = t, r && (i._flush = r), i;
  });
  ls.exports.ctor = Pa(function(e, t, r) {
    function i(s) {
      if (!(this instanceof i))
        return new i(s);
      this.options = og(e, s), xr.call(this, this.options);
    }
    return n(i, "Through2"), sg(i, xr), i.prototype._transform = t, r && (i.prototype._flush = r), i;
  });
  ls.exports.obj = Pa(function(e, t, r) {
    var i = new xr(og({ objectMode: !0, highWaterMark: 16 }, e));
    return i._transform = t, r && (i._flush = r), i;
  });
});

// ../node_modules/buffer-from/index.js
var ag = b((WO, ug) => {
  var tS = Object.prototype.toString, Ma = typeof Buffer < "u" && typeof Buffer.alloc == "function" && typeof Buffer.allocUnsafe == "functio\
n" && typeof Buffer.from == "function";
  function rS(e) {
    return tS.call(e).slice(8, -1) === "ArrayBuffer";
  }
  n(rS, "isArrayBuffer");
  function iS(e, t, r) {
    t >>>= 0;
    var i = e.byteLength - t;
    if (i < 0)
      throw new RangeError("'offset' is out of bounds");
    if (r === void 0)
      r = i;
    else if (r >>>= 0, r > i)
      throw new RangeError("'length' is out of bounds");
    return Ma ? Buffer.from(e.slice(t, t + r)) : new Buffer(new Uint8Array(e.slice(t, t + r)));
  }
  n(iS, "fromArrayBuffer");
  function nS(e, t) {
    if ((typeof t != "string" || t === "") && (t = "utf8"), !Buffer.isEncoding(t))
      throw new TypeError('"encoding" must be a valid string encoding');
    return Ma ? Buffer.from(e, t) : new Buffer(e, t);
  }
  n(nS, "fromString");
  function sS(e, t, r) {
    if (typeof e == "number")
      throw new TypeError('"value" argument must not be a number');
    return rS(e) ? iS(e, t, r) : typeof e == "string" ? nS(e, t) : Ma ? Buffer.from(e) : new Buffer(e);
  }
  n(sS, "bufferFrom");
  ug.exports = sS;
});

// ../node_modules/peek-stream/index.js
var hg = b((zO, fg) => {
  var oS = Dm(), uS = qa(), aS = ag(), lS = /* @__PURE__ */ n(function(e) {
    return !Buffer.isBuffer(e) && typeof e != "string";
  }, "isObject"), lg = /* @__PURE__ */ n(function(e, t) {
    if (typeof e == "number" && (e = { maxBuffer: e }), typeof e == "function") return lg(null, e);
    e || (e = {});
    var r = typeof e.maxBuffer == "number" ? e.maxBuffer : 65535, i = e.strict, s = e.newline !== !1, o = [], u = 0, a = oS.obj(), l = uS.obj(
    { highWaterMark: 1 }, function(d, c, h) {
      if (lS(d)) return p(d, null, h);
      if (Buffer.isBuffer(d) || (d = aS(d)), s) {
        var g = Array.prototype.indexOf.call(d, 10);
        if (g > 0 && d[g - 1] === 13 && g--, g > -1)
          return o.push(d.slice(0, g)), p(Buffer.concat(o), d.slice(g), h);
      }
      if (o.push(d), u += d.length, u < r) return h();
      if (i) return h(new Error("No newline found"));
      p(Buffer.concat(o), null, h);
    }), f = /* @__PURE__ */ n(function() {
      if (i) return a.destroy(new Error("No newline found"));
      a.cork(), p(Buffer.concat(o), null, function(d) {
        if (d) return a.destroy(d);
        a.uncork();
      });
    }, "onpreend"), p = /* @__PURE__ */ n(function(d, c, h) {
      a.removeListener("preend", f), t(d, function(g, w) {
        if (g) return h(g);
        a.setWritable(w), a.setReadable(w), d && w.write(d), c && w.write(c), c = o = l = null, h();
      });
    }, "ready");
    return a.on("preend", f), a.setWritable(l), a;
  }, "peek");
  fg.exports = lg;
});

// ../node_modules/pumpify/node_modules/pump/index.js
var pg = b((GO, dg) => {
  var fS = Dn(), hS = ur(), ja = E("fs"), Si = /* @__PURE__ */ n(function() {
  }, "noop"), cS = /^v?\.0/.test(process.version), fs = /* @__PURE__ */ n(function(e) {
    return typeof e == "function";
  }, "isFn"), dS = /* @__PURE__ */ n(function(e) {
    return !cS || !ja ? !1 : (e instanceof (ja.ReadStream || Si) || e instanceof (ja.WriteStream || Si)) && fs(e.close);
  }, "isFS"), pS = /* @__PURE__ */ n(function(e) {
    return e.setHeader && fs(e.abort);
  }, "isRequest"), DS = /* @__PURE__ */ n(function(e, t, r, i) {
    i = fS(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), hS(e, { readable: t, writable: r }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, dS(e)) return e.close(Si);
        if (pS(e)) return e.abort();
        if (fs(e.destroy)) return e.destroy();
        i(u || new Error("stream was destroyed"));
      }
    };
  }, "destroyer"), cg = /* @__PURE__ */ n(function(e) {
    e();
  }, "call"), mS = /* @__PURE__ */ n(function(e, t) {
    return e.pipe(t);
  }, "pipe"), gS = /* @__PURE__ */ n(function() {
    var e = Array.prototype.slice.call(arguments), t = fs(e[e.length - 1] || Si) && e.pop() || Si;
    if (Array.isArray(e[0]) && (e = e[0]), e.length < 2) throw new Error("pump requires two streams per minimum");
    var r, i = e.map(function(s, o) {
      var u = o < e.length - 1, a = o > 0;
      return DS(s, u, a, function(l) {
        r || (r = l), l && i.forEach(cg), !u && (i.forEach(cg), t(r));
      });
    });
    e.reduce(mS);
  }, "pump");
  dg.exports = gS;
});

// ../node_modules/pumpify/node_modules/isarray/index.js
var mg = b((JO, Dg) => {
  var yS = {}.toString;
  Dg.exports = Array.isArray || function(e) {
    return yS.call(e) == "[object Array]";
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/stream.js
var Ia = b((KO, gg) => {
  gg.exports = E("stream");
});

// ../node_modules/pumpify/node_modules/safe-buffer/index.js
var cs = b((La, bg) => {
  var hs = E("buffer"), Dt = hs.Buffer;
  function yg(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(yg, "copyProps");
  Dt.from && Dt.alloc && Dt.allocUnsafe && Dt.allocUnsafeSlow ? bg.exports = hs : (yg(hs, La), La.Buffer = Sr);
  function Sr(e, t, r) {
    return Dt(e, t, r);
  }
  n(Sr, "SafeBuffer");
  yg(Dt, Sr);
  Sr.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return Dt(e, t, r);
  };
  Sr.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = Dt(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  Sr.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return Dt(e);
  };
  Sr.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return hs.SlowBuffer(e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/BufferList.js
var wg = b((QO, Na) => {
  "use strict";
  function bS(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(bS, "_classCallCheck");
  var vg = cs().Buffer, Ai = E("util");
  function vS(e, t, r) {
    e.copy(t, r);
  }
  n(vS, "copyBuffer");
  Na.exports = function() {
    function e() {
      bS(this, e), this.head = null, this.tail = null, this.length = 0;
    }
    return n(e, "BufferList"), e.prototype.push = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: null };
      this.length > 0 ? this.tail.next = i : this.head = i, this.tail = i, ++this.length;
    }, "push"), e.prototype.unshift = /* @__PURE__ */ n(function(r) {
      var i = { data: r, next: this.head };
      this.length === 0 && (this.tail = i), this.head = i, ++this.length;
    }, "unshift"), e.prototype.shift = /* @__PURE__ */ n(function() {
      if (this.length !== 0) {
        var r = this.head.data;
        return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
      }
    }, "shift"), e.prototype.clear = /* @__PURE__ */ n(function() {
      this.head = this.tail = null, this.length = 0;
    }, "clear"), e.prototype.join = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return "";
      for (var i = this.head, s = "" + i.data; i = i.next; )
        s += r + i.data;
      return s;
    }, "join"), e.prototype.concat = /* @__PURE__ */ n(function(r) {
      if (this.length === 0) return vg.alloc(0);
      for (var i = vg.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        vS(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  Ai && Ai.inspect && Ai.inspect.custom && (Na.exports.prototype[Ai.inspect.custom] = function() {
    var e = Ai.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/destroy.js
var Ua = b((eP, _g) => {
  "use strict";
  var ds = ke();
  function wS(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, ds.nextTick(
    ps, this, e)) : ds.nextTick(ps, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, ds.nextTick(ps, r, o)) : ds.nextTick(
      ps, r, o) : t && t(o);
    }), this);
  }
  n(wS, "destroy");
  function _S() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(_S, "undestroy");
  function ps(e, t) {
    e.emit("error", t);
  }
  n(ps, "emitErrorNT");
  _g.exports = {
    destroy: wS,
    undestroy: _S
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_writable.js
var Wa = b((rP, Rg) => {
  "use strict";
  var Gt = ke();
  Rg.exports = De;
  function Cg(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      NS(t, e);
    };
  }
  n(Cg, "CorkedRequest");
  var ES = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : Gt.nextTick, Ar;
  De.WritableState = Ri;
  var Fg = Object.create(Se());
  Fg.inherits = X();
  var CS = {
    deprecate: ei()
  }, xg = Ia(), ms = cs().Buffer, FS = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function xS(e) {
    return ms.from(e);
  }
  n(xS, "_uint8ArrayToBuffer");
  function SS(e) {
    return ms.isBuffer(e) || e instanceof FS;
  }
  n(SS, "_isUint8Array");
  var Sg = Ua();
  Fg.inherits(De, xg);
  function AS() {
  }
  n(AS, "nop");
  function Ri(e, t) {
    Ar = Ar || Yt(), e = e || {};
    var r = t instanceof Ar;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      qS(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new Cg(this);
  }
  n(Ri, "WritableState");
  Ri.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(Ri.prototype, "buffer", {
        get: CS.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var Ds;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (Ds = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(De, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return Ds.call(this, e) ? !0 : this !== De ? !1 : e && e._writableState instanceof Ri;
    }, "value")
  })) : Ds = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function De(e) {
    if (Ar = Ar || Yt(), !Ds.call(De, this) && !(this instanceof Ar))
      return new De(e);
    this._writableState = new Ri(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), xg.call(this);
  }
  n(De, "Writable");
  De.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function TS(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), Gt.nextTick(t, r);
  }
  n(TS, "writeAfterEnd");
  function RS(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), Gt.nextTick(i, o), s = !1), s;
  }
  n(RS, "validChunk");
  De.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && SS(e);
    return o && !ms.isBuffer(e) && (e = xS(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = AS), i.ended ? TS(this, r) : (o || RS(this, i, e, r)) && (i.pendingcb++, s = kS(this, i, o, e, t, r)), s;
  };
  De.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  De.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && Ag(this, e));
  };
  De.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function BS(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = ms.from(t, r)), t;
  }
  n(BS, "decodeChunk");
  Object.defineProperty(De.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function kS(e, t, r, i, s, o) {
    if (!r) {
      var u = BS(t, i, s);
      i !== u && (r = !0, s = "buffer", i = u);
    }
    var a = t.objectMode ? 1 : i.length;
    t.length += a;
    var l = t.length < t.highWaterMark;
    if (l || (t.needDrain = !0), t.writing || t.corked) {
      var f = t.lastBufferedRequest;
      t.lastBufferedRequest = {
        chunk: i,
        encoding: s,
        isBuf: r,
        callback: o,
        next: null
      }, f ? f.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest, t.bufferedRequestCount += 1;
    } else
      Ha(e, t, !1, a, i, s, o);
    return l;
  }
  n(kS, "writeOrBuffer");
  function Ha(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(Ha, "doWrite");
  function OS(e, t, r, i, s) {
    --t.pendingcb, r ? (Gt.nextTick(s, i), Gt.nextTick(Ti, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), Ti(e, t));
  }
  n(OS, "onwriteError");
  function PS(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(PS, "onwriteStateUpdate");
  function qS(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (PS(r), t) OS(e, r, i, t, s);
    else {
      var o = Tg(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && Ag(e, r), i ? ES(Eg, e, r, o, s) : Eg(e, r, o, s);
    }
  }
  n(qS, "onwrite");
  function Eg(e, t, r, i) {
    r || MS(e, t), t.pendingcb--, i(), Ti(e, t);
  }
  n(Eg, "afterWrite");
  function MS(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(MS, "onwriteDrain");
  function Ag(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, Ha(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new Cg(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (Ha(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(Ag, "clearBuffer");
  De.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  De.prototype._writev = null;
  De.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || LS(this, i, r);
  };
  function Tg(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(Tg, "needFinish");
  function jS(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), Ti(e, t);
    });
  }
  n(jS, "callFinal");
  function IS(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, Gt.nextTick(jS, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(IS, "prefinish");
  function Ti(e, t) {
    var r = Tg(t);
    return r && (IS(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(Ti, "finishMaybe");
  function LS(e, t, r) {
    t.ending = !0, Ti(e, t), r && (t.finished ? Gt.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(LS, "endWritable");
  function NS(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(NS, "onCorkedFinish");
  Object.defineProperty(De.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  De.prototype.destroy = Sg.destroy;
  De.prototype._undestroy = Sg.undestroy;
  De.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_duplex.js
var Yt = b((nP, Pg) => {
  "use strict";
  var Bg = ke(), US = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  Pg.exports = mt;
  var kg = Object.create(Se());
  kg.inherits = X();
  var Og = Va(), za = Wa();
  kg.inherits(mt, Og);
  for ($a = US(za.prototype), gs = 0; gs < $a.length; gs++)
    ys = $a[gs], mt.prototype[ys] || (mt.prototype[ys] = za.prototype[ys]);
  var $a, ys, gs;
  function mt(e) {
    if (!(this instanceof mt)) return new mt(e);
    Og.call(this, e), za.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", HS);
  }
  n(mt, "Duplex");
  Object.defineProperty(mt.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function HS() {
    this.allowHalfOpen || this._writableState.ended || Bg.nextTick(WS, this);
  }
  n(HS, "onend");
  function WS(e) {
    e.end();
  }
  n(WS, "onEndNT");
  Object.defineProperty(mt.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  mt.prototype._destroy = function(e, t) {
    this.push(null), this.end(), Bg.nextTick(t, e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_readable.js
var Va = b((uP, Vg) => {
  "use strict";
  var Rr = ke();
  Vg.exports = re;
  var $S = mg(), Bi;
  re.ReadableState = Ug;
  var oP = E("events").EventEmitter, Ig = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), Xa = Ia(), ki = cs().Buffer, zS = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function VS(e) {
    return ki.from(e);
  }
  n(VS, "_uint8ArrayToBuffer");
  function GS(e) {
    return ki.isBuffer(e) || e instanceof zS;
  }
  n(GS, "_isUint8Array");
  var Lg = Object.create(Se());
  Lg.inherits = X();
  var Ga = E("util"), G = void 0;
  Ga && Ga.debuglog ? G = Ga.debuglog("stream") : G = /* @__PURE__ */ n(function() {
  }, "debug");
  var YS = wg(), Ng = Ua(), Tr;
  Lg.inherits(re, Xa);
  var Ya = ["error", "close", "destroy", "pause", "resume"];
  function JS(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : $S(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(JS, "prependListener");
  function Ug(e, t) {
    Bi = Bi || Yt(), e = e || {};
    var r = t instanceof Bi;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new YS(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (Tr || (Tr = E("string_decoder/").StringDecoder), this.decoder = new Tr(e.encoding),
    this.encoding = e.encoding);
  }
  n(Ug, "ReadableState");
  function re(e) {
    if (Bi = Bi || Yt(), !(this instanceof re)) return new re(e);
    this._readableState = new Ug(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), Xa.call(this);
  }
  n(re, "Readable");
  Object.defineProperty(re.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState && (this._readableState.destroyed = e);
    }, "set")
  });
  re.prototype.destroy = Ng.destroy;
  re.prototype._undestroy = Ng.undestroy;
  re.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  re.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = ki.from(e, t), t = ""), i =
    !0), Hg(this, e, t, !1, i);
  };
  re.prototype.unshift = function(e) {
    return Hg(this, e, null, !0, !1);
  };
  function Hg(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, ZS(e, o);
    else {
      var u;
      s || (u = KS(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== ki.prototype && (t = VS(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : Ja(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? Ja(e, o, t, !1) : Wg(e, o)) : Ja(e, o, t, !1))) : i || (o.reading = !1);
    }
    return XS(o);
  }
  n(Hg, "readableAddChunk");
  function Ja(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && bs(e)), Wg(e, t);
  }
  n(Ja, "addChunk");
  function KS(e, t) {
    var r;
    return !GS(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(KS, "chunkInvalid");
  function XS(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(XS, "needMoreData");
  re.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  re.prototype.setEncoding = function(e) {
    return Tr || (Tr = E("string_decoder/").StringDecoder), this._readableState.decoder = new Tr(e), this._readableState.encoding = e, this;
  };
  var qg = 8388608;
  function QS(e) {
    return e >= qg ? e = qg : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(QS, "computeNewHighWaterMark");
  function Mg(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = QS(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(Mg, "howMuchToRead");
  re.prototype.read = function(e) {
    G("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return G("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? Ka(this) : bs(this), null;
    if (e = Mg(e, t), e === 0 && t.ended)
      return t.length === 0 && Ka(this), null;
    var i = t.needReadable;
    G("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, G("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, G("reading or ended", i)) : i && (G("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = Mg(r, t)));
    var s;
    return e > 0 ? s = $g(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && Ka(this)), s !== null && this.emit("data", s), s;
  };
  function ZS(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, bs(e);
    }
  }
  n(ZS, "onEofChunk");
  function bs(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || (G("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? Rr.nextTick(jg, e) : jg(e));
  }
  n(bs, "emitReadable");
  function jg(e) {
    G("emit readable"), e.emit("readable"), Qa(e);
  }
  n(jg, "emitReadable_");
  function Wg(e, t) {
    t.readingMore || (t.readingMore = !0, Rr.nextTick(e3, e, t));
  }
  n(Wg, "maybeReadMore");
  function e3(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (G("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(e3, "maybeReadMore_");
  re.prototype._read = function(e) {
    this.emit("error", new Error("_read() is not implemented"));
  };
  re.prototype.pipe = function(e, t) {
    var r = this, i = this._readableState;
    switch (i.pipesCount) {
      case 0:
        i.pipes = e;
        break;
      case 1:
        i.pipes = [i.pipes, e];
        break;
      default:
        i.pipes.push(e);
        break;
    }
    i.pipesCount += 1, G("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? Rr.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, C) {
      G("onunpipe"), _ === r && C && C.hasUnpiped === !1 && (C.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      G("onend"), e.end();
    }
    n(a, "onend");
    var l = t3(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      G("cleanup"), e.removeListener("close", g), e.removeListener("finish", w), e.removeListener("drain", l), e.removeListener("error", h),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", y), r.removeListener("data", c), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup");
    var d = !1;
    r.on("data", c);
    function c(_) {
      G("ondata"), d = !1;
      var C = e.write(_);
      C === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && zg(i.pipes, e) !== -1) && !f && (G("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      G("onerror", _), y(), e.removeListener("error", h), Ig(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), JS(e, "error", h);
    function g() {
      e.removeListener("finish", w), y();
    }
    n(g, "onclose"), e.once("close", g);
    function w() {
      G("onfinish"), e.removeListener("close", g), y();
    }
    n(w, "onfinish"), e.once("finish", w);
    function y() {
      G("unpipe"), r.unpipe(e);
    }
    return n(y, "unpipe"), e.emit("pipe", r), i.flowing || (G("pipe resume"), r.resume()), e;
  };
  function t3(e) {
    return function() {
      var t = e._readableState;
      G("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && Ig(e, "data") && (t.flowing = !0, Qa(e));
    };
  }
  n(t3, "pipeOnDrain");
  re.prototype.unpipe = function(e) {
    var t = this._readableState, r = { hasUnpiped: !1 };
    if (t.pipesCount === 0) return this;
    if (t.pipesCount === 1)
      return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this, r),
      this);
    if (!e) {
      var i = t.pipes, s = t.pipesCount;
      t.pipes = null, t.pipesCount = 0, t.flowing = !1;
      for (var o = 0; o < s; o++)
        i[o].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var u = zg(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  re.prototype.on = function(e, t) {
    var r = Xa.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && bs(
      this) : Rr.nextTick(r3, this));
    }
    return r;
  };
  re.prototype.addListener = re.prototype.on;
  function r3(e) {
    G("readable nexttick read 0"), e.read(0);
  }
  n(r3, "nReadingNextTick");
  re.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (G("resume"), e.flowing = !0, i3(this, e)), this;
  };
  function i3(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, Rr.nextTick(n3, e, t));
  }
  n(i3, "resume");
  function n3(e, t) {
    t.reading || (G("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), Qa(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(n3, "resume_");
  re.prototype.pause = function() {
    return G("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (G("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function Qa(e) {
    var t = e._readableState;
    for (G("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n(Qa, "flow");
  re.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if (G("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if (G("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
        var a = t.push(u);
        a || (i = !0, e.pause());
      }
    });
    for (var s in e)
      this[s] === void 0 && typeof e[s] == "function" && (this[s] = /* @__PURE__ */ function(u) {
        return function() {
          return e[u].apply(e, arguments);
        };
      }(s));
    for (var o = 0; o < Ya.length; o++)
      e.on(Ya[o], this.emit.bind(this, Ya[o]));
    return this._read = function(u) {
      G("wrapped _read", u), i && (i = !1, e.resume());
    }, this;
  };
  Object.defineProperty(re.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.highWaterMark;
    }, "get")
  });
  re._fromList = $g;
  function $g(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = s3(e, t.buffer, t.decoder), r;
  }
  n($g, "fromList");
  function s3(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? o3(e, t) : u3(e, t), i;
  }
  n(s3, "fromListPartial");
  function o3(e, t) {
    var r = t.head, i = 1, s = r.data;
    for (e -= s.length; r = r.next; ) {
      var o = r.data, u = e > o.length ? o.length : e;
      if (u === o.length ? s += o : s += o.slice(0, e), e -= u, e === 0) {
        u === o.length ? (++i, r.next ? t.head = r.next : t.head = t.tail = null) : (t.head = r, r.data = o.slice(u));
        break;
      }
      ++i;
    }
    return t.length -= i, s;
  }
  n(o3, "copyFromBufferString");
  function u3(e, t) {
    var r = ki.allocUnsafe(e), i = t.head, s = 1;
    for (i.data.copy(r), e -= i.data.length; i = i.next; ) {
      var o = i.data, u = e > o.length ? o.length : e;
      if (o.copy(r, r.length - e, 0, u), e -= u, e === 0) {
        u === o.length ? (++s, i.next ? t.head = i.next : t.head = t.tail = null) : (t.head = i, i.data = o.slice(u));
        break;
      }
      ++s;
    }
    return t.length -= s, r;
  }
  n(u3, "copyFromBuffer");
  function Ka(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, Rr.nextTick(a3, t, e));
  }
  n(Ka, "endReadable");
  function a3(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(a3, "endReadableNT");
  function zg(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(zg, "indexOf");
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_transform.js
var Za = b((lP, Jg) => {
  "use strict";
  Jg.exports = gt;
  var vs = Yt(), Yg = Object.create(Se());
  Yg.inherits = X();
  Yg.inherits(gt, vs);
  function l3(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(l3, "afterTransform");
  function gt(e) {
    if (!(this instanceof gt)) return new gt(e);
    vs.call(this, e), this._transformState = {
      afterTransform: l3.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", f3);
  }
  n(gt, "Transform");
  function f3() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      Gg(e, t, r);
    }) : Gg(this, null, null);
  }
  n(f3, "prefinish");
  gt.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, vs.prototype.push.call(this, e, t);
  };
  gt.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  gt.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  gt.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  gt.prototype._destroy = function(e, t) {
    var r = this;
    vs.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function Gg(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(Gg, "done");
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_passthrough.js
var Zg = b((hP, Qg) => {
  "use strict";
  Qg.exports = Oi;
  var Kg = Za(), Xg = Object.create(Se());
  Xg.inherits = X();
  Xg.inherits(Oi, Kg);
  function Oi(e) {
    if (!(this instanceof Oi)) return new Oi(e);
    Kg.call(this, e);
  }
  n(Oi, "PassThrough");
  Oi.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/readable.js
var ey = b((Ee, ws) => {
  var Qe = E("stream");
  process.env.READABLE_STREAM === "disable" && Qe ? (ws.exports = Qe, Ee = ws.exports = Qe.Readable, Ee.Readable = Qe.Readable, Ee.Writable =
  Qe.Writable, Ee.Duplex = Qe.Duplex, Ee.Transform = Qe.Transform, Ee.PassThrough = Qe.PassThrough, Ee.Stream = Qe) : (Ee = ws.exports = Va(),
  Ee.Stream = Qe || Ee, Ee.Readable = Ee, Ee.Writable = Wa(), Ee.Duplex = Yt(), Ee.Transform = Za(), Ee.PassThrough = Zg());
});

// ../node_modules/pumpify/node_modules/duplexify/index.js
var sy = b((dP, ny) => {
  var _s = ey(), ty = ur(), h3 = X(), c3 = ma(), ry = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([0]) : new Buffer([0]), el = /* @__PURE__ */ n(
  function(e, t) {
    e._corked ? e.once("uncork", t) : t();
  }, "onuncork"), d3 = /* @__PURE__ */ n(function(e, t) {
    e._autoDestroy && e.destroy(t);
  }, "autoDestroy"), iy = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r ? d3(e, r.message === "premature close" ? null : r) : t && !e._ended && e.end();
    };
  }, "destroyer"), p3 = /* @__PURE__ */ n(function(e, t) {
    if (!e || e._writableState && e._writableState.finished) return t();
    if (e._writableState) return e.end(t);
    e.end(), t();
  }, "end"), D3 = /* @__PURE__ */ n(function(e) {
    return new _s.Readable({ objectMode: !0, highWaterMark: 16 }).wrap(e);
  }, "toStreams2"), Ce = /* @__PURE__ */ n(function(e, t, r) {
    if (!(this instanceof Ce)) return new Ce(e, t, r);
    _s.Duplex.call(this, r), this._writable = null, this._readable = null, this._readable2 = null, this._autoDestroy = !r || r.autoDestroy !==
    !1, this._forwardDestroy = !r || r.destroy !== !1, this._forwardEnd = !r || r.end !== !1, this._corked = 1, this._ondrain = null, this._drained =
    !1, this._forwarding = !1, this._unwrite = null, this._unread = null, this._ended = !1, this.destroyed = !1, e && this.setWritable(e), t &&
    this.setReadable(t);
  }, "Duplexify");
  h3(Ce, _s.Duplex);
  Ce.obj = function(e, t, r) {
    return r || (r = {}), r.objectMode = !0, r.highWaterMark = 16, new Ce(e, t, r);
  };
  Ce.prototype.cork = function() {
    ++this._corked === 1 && this.emit("cork");
  };
  Ce.prototype.uncork = function() {
    this._corked && --this._corked === 0 && this.emit("uncork");
  };
  Ce.prototype.setWritable = function(e) {
    if (this._unwrite && this._unwrite(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.end();
      return;
    }
    var t = this, r = ty(e, { writable: !0, readable: !1 }, iy(this, this._forwardEnd)), i = /* @__PURE__ */ n(function() {
      var o = t._ondrain;
      t._ondrain = null, o && o();
    }, "ondrain"), s = /* @__PURE__ */ n(function() {
      t._writable.removeListener("drain", i), r();
    }, "clear");
    this._unwrite && process.nextTick(i), this._writable = e, this._writable.on("drain", i), this._unwrite = s, this.uncork();
  };
  Ce.prototype.setReadable = function(e) {
    if (this._unread && this._unread(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.push(null), this.resume();
      return;
    }
    var t = this, r = ty(e, { writable: !1, readable: !0 }, iy(this)), i = /* @__PURE__ */ n(function() {
      t._forward();
    }, "onreadable"), s = /* @__PURE__ */ n(function() {
      t.push(null);
    }, "onend"), o = /* @__PURE__ */ n(function() {
      t._readable2.removeListener("readable", i), t._readable2.removeListener("end", s), r();
    }, "clear");
    this._drained = !0, this._readable = e, this._readable2 = e._readableState ? e : D3(e), this._readable2.on("readable", i), this._readable2.
    on("end", s), this._unread = o, this._forward();
  };
  Ce.prototype._read = function() {
    this._drained = !0, this._forward();
  };
  Ce.prototype._forward = function() {
    if (!(this._forwarding || !this._readable2 || !this._drained)) {
      this._forwarding = !0;
      for (var e; this._drained && (e = c3(this._readable2)) !== null; )
        this.destroyed || (this._drained = this.push(e));
      this._forwarding = !1;
    }
  };
  Ce.prototype.destroy = function(e) {
    if (!this.destroyed) {
      this.destroyed = !0;
      var t = this;
      process.nextTick(function() {
        t._destroy(e);
      });
    }
  };
  Ce.prototype._destroy = function(e) {
    if (e) {
      var t = this._ondrain;
      this._ondrain = null, t ? t(e) : this.emit("error", e);
    }
    this._forwardDestroy && (this._readable && this._readable.destroy && this._readable.destroy(), this._writable && this._writable.destroy &&
    this._writable.destroy()), this.emit("close");
  };
  Ce.prototype._write = function(e, t, r) {
    if (this.destroyed) return r();
    if (this._corked) return el(this, this._write.bind(this, e, t, r));
    if (e === ry) return this._finish(r);
    if (!this._writable) return r();
    this._writable.write(e) === !1 ? this._ondrain = r : r();
  };
  Ce.prototype._finish = function(e) {
    var t = this;
    this.emit("preend"), el(this, function() {
      p3(t._forwardEnd && t._writable, function() {
        t._writableState.prefinished === !1 && (t._writableState.prefinished = !0), t.emit("prefinish"), el(t, e);
      });
    });
  };
  Ce.prototype.end = function(e, t, r) {
    return typeof e == "function" ? this.end(null, null, e) : typeof t == "function" ? this.end(e, null, t) : (this._ended = !0, e && this.write(
    e), this._writableState.ending || this.write(ry), _s.Writable.prototype.end.call(this, r));
  };
  ny.exports = Ce;
});

// ../node_modules/pumpify/index.js
var ay = b((DP, Es) => {
  var m3 = pg(), g3 = X(), oy = sy(), uy = /* @__PURE__ */ n(function(e) {
    return e.length ? Array.isArray(e[0]) ? e[0] : Array.prototype.slice.call(e) : [];
  }, "toArray"), tl = /* @__PURE__ */ n(function(e) {
    var t = /* @__PURE__ */ n(function() {
      var r = uy(arguments);
      if (!(this instanceof t)) return new t(r);
      oy.call(this, null, null, e), r.length && this.setPipeline(r);
    }, "Pumpify");
    return g3(t, oy), t.prototype.setPipeline = function() {
      var r = uy(arguments), i = this, s = !1, o = r[0], u = r[r.length - 1];
      u = u.readable ? u : null, o = o.writable ? o : null;
      var a = /* @__PURE__ */ n(function() {
        r[0].emit("error", new Error("stream was destroyed"));
      }, "onclose");
      if (this.on("close", a), this.on("prefinish", function() {
        s || i.cork();
      }), m3(r, function(l) {
        if (i.removeListener("close", a), l) return i.destroy(l.message === "premature close" ? null : l);
        s = !0, i._autoDestroy === !1 && (i._autoDestroy = !0), i.uncork();
      }), this.destroyed) return a();
      this.setWritable(o), this.setReadable(u);
    }, t;
  }, "define");
  Es.exports = tl({ autoDestroy: !1, destroy: !1 });
  Es.exports.obj = tl({ autoDestroy: !1, destroy: !1, objectMode: !0, highWaterMark: 16 });
  Es.exports.ctor = tl;
});

// ../node_modules/is-gzip/index.js
var fy = b((gP, ly) => {
  "use strict";
  ly.exports = function(e) {
    return !e || e.length < 3 ? !1 : e[0] === 31 && e[1] === 139 && e[2] === 8;
  };
});

// ../node_modules/is-deflate/index.js
var cy = b((yP, hy) => {
  "use strict";
  hy.exports = function(e) {
    return !e || e.length < 2 ? !1 : e[0] === 120 && (e[1] === 1 || e[1] === 156 || e[1] === 218);
  };
});

// ../node_modules/gunzip-maybe/index.js
var my = b((bP, Dy) => {
  var dy = E("zlib"), y3 = hg(), b3 = qa(), py = ay(), v3 = fy(), w3 = cy(), _3 = /* @__PURE__ */ n(function(e) {
    return v3(e) ? 1 : w3(e) ? 2 : 0;
  }, "isCompressed"), rl = /* @__PURE__ */ n(function(e) {
    return e === void 0 && (e = 3), y3({ newline: !1, maxBuffer: 10 }, function(t, r) {
      if (e < 0) return r(new Error("Maximum recursion reached"));
      switch (_3(t)) {
        case 1:
          r(null, py(dy.createGunzip(), rl(e - 1)));
          break;
        case 2:
          r(null, py(dy.createInflate(), rl(e - 1)));
          break;
        default:
          r(null, b3());
      }
    });
  }, "gunzip");
  Dy.exports = rl;
});

// ../node_modules/@ndelangen/get-tarball/dist/index.js
var hb = b((EP, fb) => {
  "use strict";
  var E3 = Object.create, Ps = Object.defineProperty, C3 = Object.getOwnPropertyDescriptor, Uy = Object.getOwnPropertyNames, F3 = Object.getPrototypeOf,
  x3 = Object.prototype.hasOwnProperty, W = /* @__PURE__ */ n((e, t) => /* @__PURE__ */ n(function() {
    return t || (0, e[Uy(e)[0]])((t = { exports: {} }).exports, t), t.exports;
  }, "__require"), "__commonJS"), S3 = /* @__PURE__ */ n((e, t) => {
    for (var r in t)
      Ps(e, r, { get: t[r], enumerable: !0 });
  }, "__export"), Hy = /* @__PURE__ */ n((e, t, r, i) => {
    if (t && typeof t == "object" || typeof t == "function")
      for (let s of Uy(t))
        !x3.call(e, s) && s !== r && Ps(e, s, { get: /* @__PURE__ */ n(() => t[s], "get"), enumerable: !(i = C3(t, s)) || i.enumerable });
    return e;
  }, "__copyProps"), me = /* @__PURE__ */ n((e, t, r) => (r = e != null ? E3(F3(e)) : {}, Hy(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    t || !e || !e.__esModule ? Ps(r, "default", { value: e, enumerable: !0 }) : r,
    e
  )), "__toESM"), A3 = /* @__PURE__ */ n((e) => Hy(Ps({}, "__esModule", { value: !0 }), e), "__toCommonJS"), T3 = W({
    "node_modules/.pnpm/defer-to-connect@2.0.1/node_modules/defer-to-connect/dist/source/index.js"(e, t) {
      "use strict";
      Object.defineProperty(e, "__esModule", { value: !0 });
      function r(s) {
        return s.encrypted;
      }
      n(r, "isTLSSocket");
      var i = /* @__PURE__ */ n((s, o) => {
        let u;
        typeof o == "function" ? u = { connect: o } : u = o;
        let a = typeof u.connect == "function", l = typeof u.secureConnect == "function", f = typeof u.close == "function", p = /* @__PURE__ */ n(
        () => {
          a && u.connect(), r(s) && l && (s.authorized ? u.secureConnect() : s.authorizationError || s.once("secureConnect", u.secureConnect)),
          f && s.once("close", u.close);
        }, "onConnect");
        s.writable && !s.connecting ? p() : s.connecting ? s.once("connect", p) : s.destroyed && f && u.close(s._hadError);
      }, "deferToConnect2");
      e.default = i, t.exports = i, t.exports.default = i;
    }
  }), R3 = W({
    "node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js"(e, t) {
      "use strict";
      var { PassThrough: r } = E("stream");
      t.exports = (i) => {
        i = { ...i };
        let { array: s } = i, { encoding: o } = i, u = o === "buffer", a = !1;
        s ? a = !(o || u) : o = o || "utf8", u && (o = null);
        let l = new r({ objectMode: a });
        o && l.setEncoding(o);
        let f = 0, p = [];
        return l.on("data", (d) => {
          p.push(d), a ? f = p.length : f += d.length;
        }), l.getBufferedValue = () => s ? p : u ? Buffer.concat(p, f) : p.join(""), l.getBufferedLength = () => f, l;
      };
    }
  }), Wy = W({
    "node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js"(e, t) {
      "use strict";
      var { constants: r } = E("buffer"), i = E("stream"), { promisify: s } = E("util"), o = R3(), u = s(i.pipeline), a = class extends Error {
        static {
          n(this, "MaxBufferError");
        }
        constructor() {
          super("maxBuffer exceeded"), this.name = "MaxBufferError";
        }
      };
      async function l(f, p) {
        if (!f)
          throw new Error("Expected a stream");
        p = {
          maxBuffer: 1 / 0,
          ...p
        };
        let { maxBuffer: d } = p, c = o(p);
        return await new Promise((h, g) => {
          let w = /* @__PURE__ */ n((y) => {
            y && c.getBufferedLength() <= r.MAX_LENGTH && (y.bufferedData = c.getBufferedValue()), g(y);
          }, "rejectPromise");
          (async () => {
            try {
              await u(f, c), h();
            } catch (y) {
              w(y);
            }
          })(), c.on("data", () => {
            c.getBufferedLength() > d && w(new a());
          });
        }), c.getBufferedValue();
      }
      n(l, "getStream2"), t.exports = l, t.exports.buffer = (f, p) => l(f, { ...p, encoding: "buffer" }), t.exports.array = (f, p) => l(f, {
      ...p, array: !0 }), t.exports.MaxBufferError = a;
    }
  }), B3 = W({
    "node_modules/.pnpm/http-cache-semantics@4.1.1/node_modules/http-cache-semantics/index.js"(e, t) {
      "use strict";
      var r = /* @__PURE__ */ new Set([
        200,
        203,
        204,
        206,
        300,
        301,
        308,
        404,
        405,
        410,
        414,
        501
      ]), i = /* @__PURE__ */ new Set([
        200,
        203,
        204,
        300,
        301,
        302,
        303,
        307,
        308,
        404,
        405,
        410,
        414,
        501
      ]), s = /* @__PURE__ */ new Set([
        500,
        502,
        503,
        504
      ]), o = {
        date: !0,
        // included, because we add Age update Date
        connection: !0,
        "keep-alive": !0,
        "proxy-authenticate": !0,
        "proxy-authorization": !0,
        te: !0,
        trailer: !0,
        "transfer-encoding": !0,
        upgrade: !0
      }, u = {
        // Since the old body is reused, it doesn't make sense to change properties of the body
        "content-length": !0,
        "content-encoding": !0,
        "transfer-encoding": !0,
        "content-range": !0
      };
      function a(d) {
        let c = parseInt(d, 10);
        return isFinite(c) ? c : 0;
      }
      n(a, "toNumberOrZero");
      function l(d) {
        return d ? s.has(d.status) : !0;
      }
      n(l, "isErrorResponse");
      function f(d) {
        let c = {};
        if (!d)
          return c;
        let h = d.trim().split(/,/);
        for (let g of h) {
          let [w, y] = g.split(/=/, 2);
          c[w.trim()] = y === void 0 ? !0 : y.trim().replace(/^"|"$/g, "");
        }
        return c;
      }
      n(f, "parseCacheControl");
      function p(d) {
        let c = [];
        for (let h in d) {
          let g = d[h];
          c.push(g === !0 ? h : h + "=" + g);
        }
        if (c.length)
          return c.join(", ");
      }
      n(p, "formatCacheControl"), t.exports = class {
        static {
          n(this, "CachePolicy");
        }
        constructor(c, h, {
          shared: g,
          cacheHeuristic: w,
          immutableMinTimeToLive: y,
          ignoreCargoCult: _,
          _fromObject: C
        } = {}) {
          if (C) {
            this._fromObject(C);
            return;
          }
          if (!h || !h.headers)
            throw Error("Response headers missing");
          this._assertRequestHasHeaders(c), this._responseTime = this.now(), this._isShared = g !== !1, this._cacheHeuristic = w !== void 0 ?
          w : 0.1, this._immutableMinTtl = y !== void 0 ? y : 24 * 3600 * 1e3, this._status = "status" in h ? h.status : 200, this._resHeaders =
          h.headers, this._rescc = f(h.headers["cache-control"]), this._method = "method" in c ? c.method : "GET", this._url = c.url, this._host =
          c.headers.host, this._noAuthorization = !c.headers.authorization, this._reqHeaders = h.headers.vary ? c.headers : null, this._reqcc =
          f(c.headers["cache-control"]), _ && "pre-check" in this._rescc && "post-check" in this._rescc && (delete this._rescc["pre-check"],
          delete this._rescc["post-check"], delete this._rescc["no-cache"], delete this._rescc["no-store"], delete this._rescc["must-revalid\
ate"], this._resHeaders = Object.assign({}, this._resHeaders, {
            "cache-control": p(this._rescc)
          }), delete this._resHeaders.expires, delete this._resHeaders.pragma), h.headers["cache-control"] == null && /no-cache/.test(h.headers.
          pragma) && (this._rescc["no-cache"] = !0);
        }
        now() {
          return Date.now();
        }
        storable() {
          return !!(!this._reqcc["no-store"] && // A cache MUST NOT store a response to any request, unless:
          // The request method is understood by the cache and defined as being cacheable, and
          (this._method === "GET" || this._method === "HEAD" || this._method === "POST" && this._hasExplicitExpiration()) && // the response status code is understood by the cache, and
          i.has(this._status) && // the "no-store" cache directive does not appear in request or response header fields, and
          !this._rescc["no-store"] && // the "private" response directive does not appear in the response, if the cache is shared, and
          (!this._isShared || !this._rescc.private) && // the Authorization header field does not appear in the request, if the cache is shared,
          (!this._isShared || this._noAuthorization || this._allowsStoringAuthenticated()) && // the response either:
          // contains an Expires header field, or
          (this._resHeaders.expires || // contains a max-age response directive, or
          // contains a s-maxage response directive and the cache is shared, or
          // contains a public response directive.
          this._rescc["max-age"] || this._isShared && this._rescc["s-maxage"] || this._rescc.public || // has a status code that is defined as cacheable by default
          r.has(this._status)));
        }
        _hasExplicitExpiration() {
          return this._isShared && this._rescc["s-maxage"] || this._rescc["max-age"] || this._resHeaders.expires;
        }
        _assertRequestHasHeaders(c) {
          if (!c || !c.headers)
            throw Error("Request headers missing");
        }
        satisfiesWithoutRevalidation(c) {
          this._assertRequestHasHeaders(c);
          let h = f(c.headers["cache-control"]);
          return h["no-cache"] || /no-cache/.test(c.headers.pragma) || h["max-age"] && this.age() > h["max-age"] || h["min-fresh"] && this.timeToLive() <
          1e3 * h["min-fresh"] || this.stale() && !(h["max-stale"] && !this._rescc["must-revalidate"] && (h["max-stale"] === !0 || h["max-st\
ale"] > this.age() - this.maxAge())) ? !1 : this._requestMatches(c, !1);
        }
        _requestMatches(c, h) {
          return (!this._url || this._url === c.url) && this._host === c.headers.host && // the request method associated with the stored response allows it to be used for the presented request, and
          (!c.method || this._method === c.method || h && c.method === "HEAD") && // selecting header fields nominated by the stored response (if any) match those presented, and
          this._varyMatches(c);
        }
        _allowsStoringAuthenticated() {
          return this._rescc["must-revalidate"] || this._rescc.public || this._rescc["s-maxage"];
        }
        _varyMatches(c) {
          if (!this._resHeaders.vary)
            return !0;
          if (this._resHeaders.vary === "*")
            return !1;
          let h = this._resHeaders.vary.trim().toLowerCase().split(/\s*,\s*/);
          for (let g of h)
            if (c.headers[g] !== this._reqHeaders[g])
              return !1;
          return !0;
        }
        _copyWithoutHopByHopHeaders(c) {
          let h = {};
          for (let g in c)
            o[g] || (h[g] = c[g]);
          if (c.connection) {
            let g = c.connection.trim().split(/\s*,\s*/);
            for (let w of g)
              delete h[w];
          }
          if (h.warning) {
            let g = h.warning.split(/,/).filter((w) => !/^\s*1[0-9][0-9]/.test(w));
            g.length ? h.warning = g.join(",").trim() : delete h.warning;
          }
          return h;
        }
        responseHeaders() {
          let c = this._copyWithoutHopByHopHeaders(this._resHeaders), h = this.age();
          return h > 3600 * 24 && !this._hasExplicitExpiration() && this.maxAge() > 3600 * 24 && (c.warning = (c.warning ? `${c.warning}, ` :
          "") + '113 - "rfc7234 5.5.4"'), c.age = `${Math.round(h)}`, c.date = new Date(this.now()).toUTCString(), c;
        }
        /**
         * Value of the Date response header or current time if Date was invalid
         * @return timestamp
         */
        date() {
          let c = Date.parse(this._resHeaders.date);
          return isFinite(c) ? c : this._responseTime;
        }
        /**
         * Value of the Age header, in seconds, updated for the current time.
         * May be fractional.
         *
         * @return Number
         */
        age() {
          let c = this._ageValue(), h = (this.now() - this._responseTime) / 1e3;
          return c + h;
        }
        _ageValue() {
          return a(this._resHeaders.age);
        }
        /**
         * Value of applicable max-age (or heuristic equivalent) in seconds. This counts since response's `Date`.
         *
         * For an up-to-date value, see `timeToLive()`.
         *
         * @return Number
         */
        maxAge() {
          if (!this.storable() || this._rescc["no-cache"] || this._isShared && this._resHeaders["set-cookie"] && !this._rescc.public && !this.
          _rescc.immutable || this._resHeaders.vary === "*")
            return 0;
          if (this._isShared) {
            if (this._rescc["proxy-revalidate"])
              return 0;
            if (this._rescc["s-maxage"])
              return a(this._rescc["s-maxage"]);
          }
          if (this._rescc["max-age"])
            return a(this._rescc["max-age"]);
          let c = this._rescc.immutable ? this._immutableMinTtl : 0, h = this.date();
          if (this._resHeaders.expires) {
            let g = Date.parse(this._resHeaders.expires);
            return Number.isNaN(g) || g < h ? 0 : Math.max(c, (g - h) / 1e3);
          }
          if (this._resHeaders["last-modified"]) {
            let g = Date.parse(this._resHeaders["last-modified"]);
            if (isFinite(g) && h > g)
              return Math.max(
                c,
                (h - g) / 1e3 * this._cacheHeuristic
              );
          }
          return c;
        }
        timeToLive() {
          let c = this.maxAge() - this.age(), h = c + a(this._rescc["stale-if-error"]), g = c + a(this._rescc["stale-while-revalidate"]);
          return Math.max(0, c, h, g) * 1e3;
        }
        stale() {
          return this.maxAge() <= this.age();
        }
        _useStaleIfError() {
          return this.maxAge() + a(this._rescc["stale-if-error"]) > this.age();
        }
        useStaleWhileRevalidate() {
          return this.maxAge() + a(this._rescc["stale-while-revalidate"]) > this.age();
        }
        static fromObject(c) {
          return new this(void 0, void 0, { _fromObject: c });
        }
        _fromObject(c) {
          if (this._responseTime)
            throw Error("Reinitialized");
          if (!c || c.v !== 1)
            throw Error("Invalid serialization");
          this._responseTime = c.t, this._isShared = c.sh, this._cacheHeuristic = c.ch, this._immutableMinTtl = c.imm !== void 0 ? c.imm : 24 *
          3600 * 1e3, this._status = c.st, this._resHeaders = c.resh, this._rescc = c.rescc, this._method = c.m, this._url = c.u, this._host =
          c.h, this._noAuthorization = c.a, this._reqHeaders = c.reqh, this._reqcc = c.reqcc;
        }
        toObject() {
          return {
            v: 1,
            t: this._responseTime,
            sh: this._isShared,
            ch: this._cacheHeuristic,
            imm: this._immutableMinTtl,
            st: this._status,
            resh: this._resHeaders,
            rescc: this._rescc,
            m: this._method,
            u: this._url,
            h: this._host,
            a: this._noAuthorization,
            reqh: this._reqHeaders,
            reqcc: this._reqcc
          };
        }
        /**
         * Headers for sending to the origin server to revalidate stale response.
         * Allows server to return 304 to allow reuse of the previous response.
         *
         * Hop by hop headers are always stripped.
         * Revalidation headers may be added or removed, depending on request.
         */
        revalidationHeaders(c) {
          this._assertRequestHasHeaders(c);
          let h = this._copyWithoutHopByHopHeaders(c.headers);
          if (delete h["if-range"], !this._requestMatches(c, !0) || !this.storable())
            return delete h["if-none-match"], delete h["if-modified-since"], h;
          if (this._resHeaders.etag && (h["if-none-match"] = h["if-none-match"] ? `${h["if-none-match"]}, ${this._resHeaders.etag}` : this._resHeaders.
          etag), h["accept-ranges"] || h["if-match"] || h["if-unmodified-since"] || this._method && this._method != "GET") {
            if (delete h["if-modified-since"], h["if-none-match"]) {
              let w = h["if-none-match"].split(/,/).filter((y) => !/^\s*W\//.test(y));
              w.length ? h["if-none-match"] = w.join(",").trim() : delete h["if-none-match"];
            }
          } else this._resHeaders["last-modified"] && !h["if-modified-since"] && (h["if-modified-since"] = this._resHeaders["last-modified"]);
          return h;
        }
        /**
         * Creates new CachePolicy with information combined from the previews response,
         * and the new revalidation response.
         *
         * Returns {policy, modified} where modified is a boolean indicating
         * whether the response body has been modified, and old cached body can't be used.
         *
         * @return {Object} {policy: CachePolicy, modified: Boolean}
         */
        revalidatedPolicy(c, h) {
          if (this._assertRequestHasHeaders(c), this._useStaleIfError() && l(h))
            return {
              modified: !1,
              matches: !1,
              policy: this
            };
          if (!h || !h.headers)
            throw Error("Response headers missing");
          let g = !1;
          if (h.status !== void 0 && h.status != 304 ? g = !1 : h.headers.etag && !/^\s*W\//.test(h.headers.etag) ? g = this._resHeaders.etag &&
          this._resHeaders.etag.replace(/^\s*W\//, "") === h.headers.etag : this._resHeaders.etag && h.headers.etag ? g = this._resHeaders.etag.
          replace(/^\s*W\//, "") === h.headers.etag.replace(/^\s*W\//, "") : this._resHeaders["last-modified"] ? g = this._resHeaders["last-\
modified"] === h.headers["last-modified"] : !this._resHeaders.etag && !this._resHeaders["last-modified"] && !h.headers.etag && !h.headers["l\
ast-modified"] && (g = !0), !g)
            return {
              policy: new this.constructor(c, h),
              // Client receiving 304 without body, even if it's invalid/mismatched has no option
              // but to reuse a cached body. We don't have a good way to tell clients to do
              // error recovery in such case.
              modified: h.status != 304,
              matches: !1
            };
          let w = {};
          for (let _ in this._resHeaders)
            w[_] = _ in h.headers && !u[_] ? h.headers[_] : this._resHeaders[_];
          let y = Object.assign({}, h, {
            status: this._status,
            method: this._method,
            headers: w
          });
          return {
            policy: new this.constructor(c, y, {
              shared: this._isShared,
              cacheHeuristic: this._cacheHeuristic,
              immutableMinTimeToLive: this._immutableMinTtl
            }),
            modified: !1,
            matches: !0
          };
        }
      };
    }
  }), k3 = W({
    "node_modules/.pnpm/json-buffer@3.0.1/node_modules/json-buffer/index.js"(e) {
      e.stringify = /* @__PURE__ */ n(function t(r) {
        if (typeof r > "u")
          return r;
        if (r && Buffer.isBuffer(r))
          return JSON.stringify(":base64:" + r.toString("base64"));
        if (r && r.toJSON && (r = r.toJSON()), r && typeof r == "object") {
          var i = "", s = Array.isArray(r);
          i = s ? "[" : "{";
          var o = !0;
          for (var u in r) {
            var a = typeof r[u] == "function" || !s && typeof r[u] > "u";
            Object.hasOwnProperty.call(r, u) && !a && (o || (i += ","), o = !1, s ? r[u] == null ? i += "null" : i += t(r[u]) : r[u] !== void 0 &&
            (i += t(u) + ":" + t(r[u])));
          }
          return i += s ? "]" : "}", i;
        } else return typeof r == "string" ? JSON.stringify(/^:/.test(r) ? ":" + r : r) : typeof r > "u" ? "null" : JSON.stringify(r);
      }, "stringify"), e.parse = function(t) {
        return JSON.parse(t, function(r, i) {
          return typeof i == "string" ? /^:base64:/.test(i) ? Buffer.from(i.substring(8), "base64") : /^:/.test(i) ? i.substring(1) : i : i;
        });
      };
    }
  }), O3 = W({
    "node_modules/.pnpm/keyv@4.5.2/node_modules/keyv/src/index.js"(e, t) {
      "use strict";
      var r = E("events"), i = k3(), s = /* @__PURE__ */ n((a) => {
        let l = {
          redis: "@keyv/redis",
          rediss: "@keyv/redis",
          mongodb: "@keyv/mongo",
          mongo: "@keyv/mongo",
          sqlite: "@keyv/sqlite",
          postgresql: "@keyv/postgres",
          postgres: "@keyv/postgres",
          mysql: "@keyv/mysql",
          etcd: "@keyv/etcd",
          offline: "@keyv/offline",
          tiered: "@keyv/tiered"
        };
        if (a.adapter || a.uri) {
          let f = a.adapter || /^[^:+]*/.exec(a.uri)[0];
          return new (E(l[f]))(a);
        }
        return /* @__PURE__ */ new Map();
      }, "loadStore"), o = [
        "sqlite",
        "postgres",
        "mysql",
        "mongo",
        "redis",
        "tiered"
      ], u = class extends r {
        static {
          n(this, "Keyv2");
        }
        constructor(a, { emitErrors: l = !0, ...f } = {}) {
          if (super(), this.opts = {
            namespace: "keyv",
            serialize: i.stringify,
            deserialize: i.parse,
            ...typeof a == "string" ? { uri: a } : a,
            ...f
          }, !this.opts.store) {
            let d = { ...this.opts };
            this.opts.store = s(d);
          }
          if (this.opts.compression) {
            let d = this.opts.compression;
            this.opts.serialize = d.serialize.bind(d), this.opts.deserialize = d.deserialize.bind(d);
          }
          typeof this.opts.store.on == "function" && l && this.opts.store.on("error", (d) => this.emit("error", d)), this.opts.store.namespace =
          this.opts.namespace;
          let p = /* @__PURE__ */ n((d) => async function* () {
            for await (let [c, h] of typeof d == "function" ? d(this.opts.store.namespace) : d) {
              let g = this.opts.deserialize(h);
              if (!(this.opts.store.namespace && !c.includes(this.opts.store.namespace))) {
                if (typeof g.expires == "number" && Date.now() > g.expires) {
                  this.delete(c);
                  continue;
                }
                yield [this._getKeyUnprefix(c), g.value];
              }
            }
          }, "generateIterator");
          typeof this.opts.store[Symbol.iterator] == "function" && this.opts.store instanceof Map ? this.iterator = p(this.opts.store) : typeof this.
          opts.store.iterator == "function" && this.opts.store.opts && this._checkIterableAdaptar() && (this.iterator = p(this.opts.store.iterator.
          bind(this.opts.store)));
        }
        _checkIterableAdaptar() {
          return o.includes(this.opts.store.opts.dialect) || o.findIndex((a) => this.opts.store.opts.url.includes(a)) >= 0;
        }
        _getKeyPrefix(a) {
          return `${this.opts.namespace}:${a}`;
        }
        _getKeyPrefixArray(a) {
          return a.map((l) => `${this.opts.namespace}:${l}`);
        }
        _getKeyUnprefix(a) {
          return a.split(":").splice(1).join(":");
        }
        get(a, l) {
          let { store: f } = this.opts, p = Array.isArray(a), d = p ? this._getKeyPrefixArray(a) : this._getKeyPrefix(a);
          if (p && f.getMany === void 0) {
            let c = [];
            for (let h of d)
              c.push(
                Promise.resolve().then(() => f.get(h)).then((g) => typeof g == "string" ? this.opts.deserialize(g) : this.opts.compression ?
                this.opts.deserialize(g) : g).then((g) => {
                  if (g != null)
                    return typeof g.expires == "number" && Date.now() > g.expires ? this.delete(h).then(() => {
                    }) : l && l.raw ? g : g.value;
                })
              );
            return Promise.allSettled(c).then((h) => {
              let g = [];
              for (let w of h)
                g.push(w.value);
              return g;
            });
          }
          return Promise.resolve().then(() => p ? f.getMany(d) : f.get(d)).then((c) => typeof c == "string" ? this.opts.deserialize(c) : this.
          opts.compression ? this.opts.deserialize(c) : c).then((c) => {
            if (c != null) {
              if (p) {
                let h = [];
                for (let g of c) {
                  if (typeof g == "string" && (g = this.opts.deserialize(g)), g == null) {
                    h.push(void 0);
                    continue;
                  }
                  typeof g.expires == "number" && Date.now() > g.expires ? (this.delete(a).then(() => {
                  }), h.push(void 0)) : h.push(l && l.raw ? g : g.value);
                }
                return h;
              }
              return typeof c.expires == "number" && Date.now() > c.expires ? this.delete(a).then(() => {
              }) : l && l.raw ? c : c.value;
            }
          });
        }
        set(a, l, f) {
          let p = this._getKeyPrefix(a);
          typeof f > "u" && (f = this.opts.ttl), f === 0 && (f = void 0);
          let { store: d } = this.opts;
          return Promise.resolve().then(() => {
            let c = typeof f == "number" ? Date.now() + f : null;
            return typeof l == "symbol" && this.emit("error", "symbol cannot be serialized"), l = { value: l, expires: c }, this.opts.serialize(
            l);
          }).then((c) => d.set(p, c, f)).then(() => !0);
        }
        delete(a) {
          let { store: l } = this.opts;
          if (Array.isArray(a)) {
            let p = this._getKeyPrefixArray(a);
            if (l.deleteMany === void 0) {
              let d = [];
              for (let c of p)
                d.push(l.delete(c));
              return Promise.allSettled(d).then((c) => c.every((h) => h.value === !0));
            }
            return Promise.resolve().then(() => l.deleteMany(p));
          }
          let f = this._getKeyPrefix(a);
          return Promise.resolve().then(() => l.delete(f));
        }
        clear() {
          let { store: a } = this.opts;
          return Promise.resolve().then(() => a.clear());
        }
        has(a) {
          let l = this._getKeyPrefix(a), { store: f } = this.opts;
          return Promise.resolve().then(async () => typeof f.has == "function" ? f.has(l) : await f.get(l) !== void 0);
        }
        disconnect() {
          let { store: a } = this.opts;
          if (typeof a.disconnect == "function")
            return a.disconnect();
        }
      };
      t.exports = u;
    }
  }), P3 = W({
    "node_modules/.pnpm/mimic-response@3.1.0/node_modules/mimic-response/index.js"(e, t) {
      "use strict";
      var r = [
        "aborted",
        "complete",
        "headers",
        "httpVersion",
        "httpVersionMinor",
        "httpVersionMajor",
        "method",
        "rawHeaders",
        "rawTrailers",
        "setTimeout",
        "socket",
        "statusCode",
        "statusMessage",
        "trailers",
        "url"
      ];
      t.exports = (i, s) => {
        if (s._readableState.autoDestroy)
          throw new Error("The second stream must have the `autoDestroy` option set to `false`");
        let o = new Set(Object.keys(i).concat(r)), u = {};
        for (let a of o)
          a in s || (u[a] = {
            get() {
              let l = i[a];
              return typeof l == "function" ? l.bind(i) : l;
            },
            set(l) {
              i[a] = l;
            },
            enumerable: !0,
            configurable: !1
          });
        return Object.defineProperties(s, u), i.once("aborted", () => {
          s.destroy(), s.emit("aborted");
        }), i.once("close", () => {
          i.complete && s.readable ? s.once("end", () => {
            s.emit("close");
          }) : s.emit("close");
        }), s;
      };
    }
  }), q3 = W({
    "node_modules/.pnpm/decompress-response@6.0.0/node_modules/decompress-response/index.js"(e, t) {
      "use strict";
      var { Transform: r, PassThrough: i } = E("stream"), s = E("zlib"), o = P3();
      t.exports = (u) => {
        let a = (u.headers["content-encoding"] || "").toLowerCase();
        if (!["gzip", "deflate", "br"].includes(a))
          return u;
        let l = a === "br";
        if (l && typeof s.createBrotliDecompress != "function")
          return u.destroy(new Error("Brotli is not supported on Node.js < 12")), u;
        let f = !0, p = new r({
          transform(h, g, w) {
            f = !1, w(null, h);
          },
          flush(h) {
            h();
          }
        }), d = new i({
          autoDestroy: !1,
          destroy(h, g) {
            u.destroy(), g(h);
          }
        }), c = l ? s.createBrotliDecompress() : s.createUnzip();
        return c.once("error", (h) => {
          if (f && !u.readable) {
            d.end();
            return;
          }
          d.destroy(h);
        }), o(u, d), u.pipe(p).pipe(c).pipe(d), d;
      };
    }
  }), $y = W({
    "node_modules/.pnpm/quick-lru@5.1.1/node_modules/quick-lru/index.js"(e, t) {
      "use strict";
      var r = class {
        static {
          n(this, "QuickLRU");
        }
        constructor(i = {}) {
          if (!(i.maxSize && i.maxSize > 0))
            throw new TypeError("`maxSize` must be a number greater than 0");
          this.maxSize = i.maxSize, this.onEviction = i.onEviction, this.cache = /* @__PURE__ */ new Map(), this.oldCache = /* @__PURE__ */ new Map(),
          this._size = 0;
        }
        _set(i, s) {
          if (this.cache.set(i, s), this._size++, this._size >= this.maxSize) {
            if (this._size = 0, typeof this.onEviction == "function")
              for (let [o, u] of this.oldCache.entries())
                this.onEviction(o, u);
            this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map();
          }
        }
        get(i) {
          if (this.cache.has(i))
            return this.cache.get(i);
          if (this.oldCache.has(i)) {
            let s = this.oldCache.get(i);
            return this.oldCache.delete(i), this._set(i, s), s;
          }
        }
        set(i, s) {
          return this.cache.has(i) ? this.cache.set(i, s) : this._set(i, s), this;
        }
        has(i) {
          return this.cache.has(i) || this.oldCache.has(i);
        }
        peek(i) {
          if (this.cache.has(i))
            return this.cache.get(i);
          if (this.oldCache.has(i))
            return this.oldCache.get(i);
        }
        delete(i) {
          let s = this.cache.delete(i);
          return s && this._size--, this.oldCache.delete(i) || s;
        }
        clear() {
          this.cache.clear(), this.oldCache.clear(), this._size = 0;
        }
        *keys() {
          for (let [i] of this)
            yield i;
        }
        *values() {
          for (let [, i] of this)
            yield i;
        }
        *[Symbol.iterator]() {
          for (let i of this.cache)
            yield i;
          for (let i of this.oldCache) {
            let [s] = i;
            this.cache.has(s) || (yield i);
          }
        }
        get size() {
          let i = 0;
          for (let s of this.oldCache.keys())
            this.cache.has(s) || i++;
          return Math.min(this._size + i, this.maxSize);
        }
      };
      t.exports = r;
    }
  }), zy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/delay-async-destroy.js"(e, t) {
      "use strict";
      t.exports = (r) => {
        if (r.listenerCount("error") !== 0)
          return r;
        r.__destroy = r._destroy, r._destroy = (...s) => {
          let o = s.pop();
          r.__destroy(...s, async (u) => {
            await Promise.resolve(), o(u);
          });
        };
        let i = /* @__PURE__ */ n((s) => {
          Promise.resolve().then(() => {
            r.emit("error", s);
          });
        }, "onError");
        return r.once("error", i), Promise.resolve().then(() => {
          r.off("error", i);
        }), r;
      };
    }
  }), Or = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/agent.js"(e, t) {
      "use strict";
      var { URL: r } = E("url"), i = E("events"), s = E("tls"), o = E("http2"), u = $y(), a = zy(), l = Symbol("currentStreamCount"), f = Symbol(
      "request"), p = Symbol("cachedOriginSet"), d = Symbol("gracefullyClosing"), c = Symbol("length"), h = [
        // Not an Agent option actually
        "createConnection",
        // `http2.connect()` options
        "maxDeflateDynamicTableSize",
        "maxSettings",
        "maxSessionMemory",
        "maxHeaderListPairs",
        "maxOutstandingPings",
        "maxReservedRemoteStreams",
        "maxSendHeaderBlockLength",
        "paddingStrategy",
        "peerMaxConcurrentStreams",
        "settings",
        // `tls.connect()` source options
        "family",
        "localAddress",
        "rejectUnauthorized",
        // `tls.connect()` secure context options
        "pskCallback",
        "minDHSize",
        // `tls.connect()` destination options
        // - `servername` is automatically validated, skip it
        // - `host` and `port` just describe the destination server,
        "path",
        "socket",
        // `tls.createSecureContext()` options
        "ca",
        "cert",
        "sigalgs",
        "ciphers",
        "clientCertEngine",
        "crl",
        "dhparam",
        "ecdhCurve",
        "honorCipherOrder",
        "key",
        "privateKeyEngine",
        "privateKeyIdentifier",
        "maxVersion",
        "minVersion",
        "pfx",
        "secureOptions",
        "secureProtocol",
        "sessionIdContext",
        "ticketKeys"
      ], g = /* @__PURE__ */ n((S, x, F) => {
        let k = 0, q = S.length;
        for (; k < q; ) {
          let O = k + q >>> 1;
          F(S[O], x) ? k = O + 1 : q = O;
        }
        return k;
      }, "getSortedIndex"), w = /* @__PURE__ */ n((S, x) => S.remoteSettings.maxConcurrentStreams > x.remoteSettings.maxConcurrentStreams, "\
compareSessions"), y = /* @__PURE__ */ n((S, x) => {
        for (let F = 0; F < S.length; F++) {
          let k = S[F];
          // Unfortunately `.every()` returns true for an empty array
          k[p].length > 0 && k[p].length < x[p].length && k[p].every((q) => x[p].includes(q)) && k[l] + x[l] <= x.remoteSettings.maxConcurrentStreams &&
          C(k);
        }
      }, "closeCoveredSessions"), _ = /* @__PURE__ */ n((S, x) => {
        for (let F = 0; F < S.length; F++) {
          let k = S[F];
          if (x[p].length > 0 && x[p].length < k[p].length && x[p].every((q) => k[p].includes(q)) && x[l] + k[l] <= k.remoteSettings.maxConcurrentStreams)
            return C(x), !0;
        }
        return !1;
      }, "closeSessionIfCovered"), C = /* @__PURE__ */ n((S) => {
        S[d] = !0, S[l] === 0 && S.close();
      }, "gracefullyClose"), v = class extends i {
        static {
          n(this, "Agent");
        }
        constructor({ timeout: S = 0, maxSessions: x = Number.POSITIVE_INFINITY, maxEmptySessions: F = 10, maxCachedTlsSessions: k = 100 } = {}) {
          super(), this.sessions = {}, this.queue = {}, this.timeout = S, this.maxSessions = x, this.maxEmptySessions = F, this._emptySessionCount =
          0, this._sessionCount = 0, this.settings = {
            enablePush: !1,
            initialWindowSize: 1024 * 1024 * 32
            // 32MB, see https://github.com/nodejs/node/issues/38426
          }, this.tlsSessionCache = new u({ maxSize: k });
        }
        get protocol() {
          return "https:";
        }
        normalizeOptions(S) {
          let x = "";
          for (let F = 0; F < h.length; F++) {
            let k = h[F];
            x += ":", S && S[k] !== void 0 && (x += S[k]);
          }
          return x;
        }
        _processQueue() {
          if (this._sessionCount >= this.maxSessions) {
            this.closeEmptySessions(this.maxSessions - this._sessionCount + 1);
            return;
          }
          for (let S in this.queue)
            for (let x in this.queue[S]) {
              let F = this.queue[S][x];
              F.completed || (F.completed = !0, F());
            }
        }
        _isBetterSession(S, x) {
          return S > x;
        }
        _accept(S, x, F, k) {
          let q = 0;
          for (; q < x.length && S[l] < S.remoteSettings.maxConcurrentStreams; )
            x[q].resolve(S), q++;
          x.splice(0, q), x.length > 0 && (this.getSession(F, k, x), x.length = 0);
        }
        getSession(S, x, F) {
          return new Promise((k, q) => {
            Array.isArray(F) && F.length > 0 ? (F = [...F], k()) : F = [{ resolve: k, reject: q }];
            try {
              if (typeof S == "string")
                S = new r(S);
              else if (!(S instanceof r))
                throw new TypeError("The `origin` argument needs to be a string or an URL object");
              if (x) {
                let { servername: P } = x, { hostname: R } = S;
                if (P && R !== P)
                  throw new Error(`Origin ${R} differs from servername ${P}`);
              }
            } catch (P) {
              for (let R = 0; R < F.length; R++)
                F[R].reject(P);
              return;
            }
            let O = this.normalizeOptions(x), j = S.origin;
            if (O in this.sessions) {
              let P = this.sessions[O], R = -1, M = -1, ne;
              for (let $ = 0; $ < P.length; $++) {
                let B = P[$], ge = B.remoteSettings.maxConcurrentStreams;
                if (ge < R)
                  break;
                if (!B[p].includes(j))
                  continue;
                let N = B[l];
                N >= ge || B[d] || B.destroyed || (ne || (R = ge), this._isBetterSession(N, M) && (ne = B, M = N));
              }
              if (ne) {
                this._accept(ne, F, j, x);
                return;
              }
            }
            if (O in this.queue) {
              if (j in this.queue[O]) {
                this.queue[O][j].listeners.push(...F);
                return;
              }
            } else
              this.queue[O] = {
                [c]: 0
              };
            let H = /* @__PURE__ */ n(() => {
              O in this.queue && this.queue[O][j] === he && (delete this.queue[O][j], --this.queue[O][c] === 0 && delete this.queue[O]);
            }, "removeFromQueue"), he = /* @__PURE__ */ n(async () => {
              this._sessionCount++;
              let P = `${j}:${O}`, R = !1, M;
              try {
                let ne = { ...x };
                ne.settings === void 0 && (ne.settings = this.settings), ne.session === void 0 && (ne.session = this.tlsSessionCache.get(P)),
                M = await (ne.createConnection || this.createConnection).call(this, S, ne), ne.createConnection = () => M;
                let B = o.connect(S, ne);
                B[l] = 0, B[d] = !1;
                let ge = /* @__PURE__ */ n(() => {
                  let { socket: L } = B, Z;
                  return L.servername === !1 ? (L.servername = L.remoteAddress, Z = B.originSet, L.servername = !1) : Z = B.originSet, Z;
                }, "getOriginSet"), N = /* @__PURE__ */ n(() => B[l] < B.remoteSettings.maxConcurrentStreams, "isFree");
                B.socket.once("session", (L) => {
                  this.tlsSessionCache.set(P, L);
                }), B.once("error", (L) => {
                  for (let Z = 0; Z < F.length; Z++)
                    F[Z].reject(L);
                  this.tlsSessionCache.delete(P);
                }), B.setTimeout(this.timeout, () => {
                  B.destroy();
                }), B.once("close", () => {
                  if (this._sessionCount--, R) {
                    this._emptySessionCount--;
                    let L = this.sessions[O];
                    L.length === 1 ? delete this.sessions[O] : L.splice(L.indexOf(B), 1);
                  } else {
                    H();
                    let L = new Error("Session closed without receiving a SETTINGS frame");
                    L.code = "HTTP2WRAPPER_NOSETTINGS";
                    for (let Z = 0; Z < F.length; Z++)
                      F[Z].reject(L);
                  }
                  this._processQueue();
                });
                let Ir = /* @__PURE__ */ n(() => {
                  let L = this.queue[O];
                  if (!L)
                    return;
                  let Z = B[p];
                  for (let Ue = 0; Ue < Z.length; Ue++) {
                    let Lr = Z[Ue];
                    if (Lr in L) {
                      let { listeners: Gl, completed: P0 } = L[Lr], Yi = 0;
                      for (; Yi < Gl.length && N(); )
                        Gl[Yi].resolve(B), Yi++;
                      if (L[Lr].listeners.splice(0, Yi), L[Lr].listeners.length === 0 && !P0 && (delete L[Lr], --L[c] === 0)) {
                        delete this.queue[O];
                        break;
                      }
                      if (!N())
                        break;
                    }
                  }
                }, "processListeners");
                B.on("origin", () => {
                  B[p] = ge() || [], B[d] = !1, _(this.sessions[O], B), !(B[d] || !N()) && (Ir(), N() && y(this.sessions[O], B));
                }), B.once("remoteSettings", () => {
                  if (he.destroyed) {
                    let L = new Error("Agent has been destroyed");
                    for (let Z = 0; Z < F.length; Z++)
                      F[Z].reject(L);
                    B.destroy();
                    return;
                  }
                  if (B.setLocalWindowSize && B.setLocalWindowSize(1024 * 1024 * 4), B[p] = ge() || [], B.socket.encrypted) {
                    let L = B[p][0];
                    if (L !== j) {
                      let Z = new Error(`Requested origin ${j} does not match server ${L}`);
                      for (let Ue = 0; Ue < F.length; Ue++)
                        F[Ue].reject(Z);
                      B.destroy();
                      return;
                    }
                  }
                  H();
                  {
                    let L = this.sessions;
                    if (O in L) {
                      let Z = L[O];
                      Z.splice(g(Z, B, w), 0, B);
                    } else
                      L[O] = [B];
                  }
                  R = !0, this._emptySessionCount++, this.emit("session", B), this._accept(B, F, j, x), B[l] === 0 && this._emptySessionCount >
                  this.maxEmptySessions && this.closeEmptySessions(this._emptySessionCount - this.maxEmptySessions), B.on("remoteSettings", () => {
                    N() && (Ir(), N() && y(this.sessions[O], B));
                  });
                }), B[f] = B.request, B.request = (L, Z) => {
                  if (B[d])
                    throw new Error("The session is gracefully closing. No new streams are allowed.");
                  let Ue = B[f](L, Z);
                  return B.ref(), B[l]++ === 0 && this._emptySessionCount--, Ue.once("close", () => {
                    if (--B[l] === 0 && (this._emptySessionCount++, B.unref(), this._emptySessionCount > this.maxEmptySessions || B[d])) {
                      B.close();
                      return;
                    }
                    B.destroyed || B.closed || N() && !_(this.sessions[O], B) && (y(this.sessions[O], B), Ir(), B[l] === 0 && this._processQueue());
                  }), Ue;
                };
              } catch (ne) {
                H(), this._sessionCount--;
                for (let $ = 0; $ < F.length; $++)
                  F[$].reject(ne);
              }
            }, "entry");
            he.listeners = F, he.completed = !1, he.destroyed = !1, this.queue[O][j] = he, this.queue[O][c]++, this._processQueue();
          });
        }
        request(S, x, F, k) {
          return new Promise((q, O) => {
            this.getSession(S, x, [{
              reject: O,
              resolve: /* @__PURE__ */ n((j) => {
                try {
                  let H = j.request(F, k);
                  a(H), q(H);
                } catch (H) {
                  O(H);
                }
              }, "resolve")
            }]);
          });
        }
        async createConnection(S, x) {
          return v.connect(S, x);
        }
        static connect(S, x) {
          x.ALPNProtocols = ["h2"];
          let F = S.port || 443, k = S.hostname;
          typeof x.servername > "u" && (x.servername = k);
          let q = s.connect(F, k, x);
          return x.socket && (q._peername = {
            family: void 0,
            address: void 0,
            port: F
          }), q;
        }
        closeEmptySessions(S = Number.POSITIVE_INFINITY) {
          let x = 0, { sessions: F } = this;
          for (let k in F) {
            let q = F[k];
            for (let O = 0; O < q.length; O++) {
              let j = q[O];
              if (j[l] === 0 && (x++, j.close(), x >= S))
                return x;
            }
          }
          return x;
        }
        destroy(S) {
          let { sessions: x, queue: F } = this;
          for (let k in x) {
            let q = x[k];
            for (let O = 0; O < q.length; O++)
              q[O].destroy(S);
          }
          for (let k in F) {
            let q = F[k];
            for (let O in q)
              q[O].destroyed = !0;
          }
          this.queue = {}, this.tlsSessionCache.clear();
        }
        get emptySessionCount() {
          return this._emptySessionCount;
        }
        get pendingSessionCount() {
          return this._sessionCount - this._emptySessionCount;
        }
        get sessionCount() {
          return this._sessionCount;
        }
      };
      v.kCurrentStreamCount = l, v.kGracefullyClosing = d, t.exports = {
        Agent: v,
        globalAgent: new v()
      };
    }
  }), Vy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/incoming-message.js"(e, t) {
      "use strict";
      var { Readable: r } = E("stream"), i = class extends r {
        static {
          n(this, "IncomingMessage");
        }
        constructor(s, o) {
          super({
            emitClose: !1,
            autoDestroy: !0,
            highWaterMark: o
          }), this.statusCode = null, this.statusMessage = "", this.httpVersion = "2.0", this.httpVersionMajor = 2, this.httpVersionMinor = 0,
          this.headers = {}, this.trailers = {}, this.req = null, this.aborted = !1, this.complete = !1, this.upgrade = null, this.rawHeaders =
          [], this.rawTrailers = [], this.socket = s, this._dumped = !1;
        }
        get connection() {
          return this.socket;
        }
        set connection(s) {
          this.socket = s;
        }
        _destroy(s, o) {
          this.readableEnded || (this.aborted = !0), o(), this.req._request.destroy(s);
        }
        setTimeout(s, o) {
          return this.req.setTimeout(s, o), this;
        }
        _dump() {
          this._dumped || (this._dumped = !0, this.removeAllListeners("data"), this.resume());
        }
        _read() {
          this.req && this.req._request.resume();
        }
      };
      t.exports = i;
    }
  }), M3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/proxy-events.js"(e, t) {
      "use strict";
      t.exports = (r, i, s) => {
        for (let o of s)
          r.on(o, (...u) => i.emit(o, ...u));
      };
    }
  }), qs = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/errors.js"(e, t) {
      "use strict";
      var r = /* @__PURE__ */ n((i, s, o) => {
        t.exports[s] = class extends i {
          static {
            n(this, "NodeError");
          }
          constructor(...a) {
            super(typeof o == "string" ? o : o(a)), this.name = `${super.name} [${s}]`, this.code = s;
          }
        };
      }, "makeError");
      r(TypeError, "ERR_INVALID_ARG_TYPE", (i) => {
        let s = i[0].includes(".") ? "property" : "argument", o = i[1], u = Array.isArray(o);
        return u && (o = `${o.slice(0, -1).join(", ")} or ${o.slice(-1)}`), `The "${i[0]}" ${s} must be ${u ? "one of" : "of"} type ${o}. Re\
ceived ${typeof i[2]}`;
      }), r(
        TypeError,
        "ERR_INVALID_PROTOCOL",
        (i) => `Protocol "${i[0]}" not supported. Expected "${i[1]}"`
      ), r(
        Error,
        "ERR_HTTP_HEADERS_SENT",
        (i) => `Cannot ${i[0]} headers after they are sent to the client`
      ), r(
        TypeError,
        "ERR_INVALID_HTTP_TOKEN",
        (i) => `${i[0]} must be a valid HTTP token [${i[1]}]`
      ), r(
        TypeError,
        "ERR_HTTP_INVALID_HEADER_VALUE",
        (i) => `Invalid value "${i[0]} for header "${i[1]}"`
      ), r(
        TypeError,
        "ERR_INVALID_CHAR",
        (i) => `Invalid character in ${i[0]} [${i[1]}]`
      ), r(
        Error,
        "ERR_HTTP2_NO_SOCKET_MANIPULATION",
        "HTTP/2 sockets should not be directly manipulated (e.g. read and written)"
      );
    }
  }), j3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/is-request-pseudo-header.js"(e, t) {
      "use strict";
      t.exports = (r) => {
        switch (r) {
          case ":method":
          case ":scheme":
          case ":authority":
          case ":path":
            return !0;
          default:
            return !1;
        }
      };
    }
  }), Gy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/validate-header-name.js"(e, t) {
      "use strict";
      var { ERR_INVALID_HTTP_TOKEN: r } = qs(), i = j3(), s = /^[\^`\-\w!#$%&*+.|~]+$/;
      t.exports = (o) => {
        if (typeof o != "string" || !s.test(o) && !i(o))
          throw new r("Header name", o);
      };
    }
  }), Yy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/validate-header-value.js"(e, t) {
      "use strict";
      var {
        ERR_HTTP_INVALID_HEADER_VALUE: r,
        ERR_INVALID_CHAR: i
      } = qs(), s = /[^\t\u0020-\u007E\u0080-\u00FF]/;
      t.exports = (o, u) => {
        if (typeof u > "u")
          throw new r(u, o);
        if (s.test(u))
          throw new i("header content", o);
      };
    }
  }), I3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/proxy-socket-handler.js"(e, t) {
      "use strict";
      var { ERR_HTTP2_NO_SOCKET_MANIPULATION: r } = qs(), i = {
        has(s, o) {
          let u = s.session === void 0 ? s : s.session.socket;
          return o in s || o in u;
        },
        get(s, o) {
          switch (o) {
            case "on":
            case "once":
            case "end":
            case "emit":
            case "destroy":
              return s[o].bind(s);
            case "writable":
            case "destroyed":
              return s[o];
            case "readable":
              return s.destroyed ? !1 : s.readable;
            case "setTimeout": {
              let { session: u } = s;
              return u !== void 0 ? u.setTimeout.bind(u) : s.setTimeout.bind(s);
            }
            case "write":
            case "read":
            case "pause":
            case "resume":
              throw new r();
            default: {
              let u = s.session === void 0 ? s : s.session.socket, a = u[o];
              return typeof a == "function" ? a.bind(u) : a;
            }
          }
        },
        getPrototypeOf(s) {
          return s.session !== void 0 ? Reflect.getPrototypeOf(s.session.socket) : Reflect.getPrototypeOf(s);
        },
        set(s, o, u) {
          switch (o) {
            case "writable":
            case "readable":
            case "destroyed":
            case "on":
            case "once":
            case "end":
            case "emit":
            case "destroy":
              return s[o] = u, !0;
            case "setTimeout": {
              let { session: a } = s;
              return a === void 0 ? s.setTimeout = u : a.setTimeout = u, !0;
            }
            case "write":
            case "read":
            case "pause":
            case "resume":
              throw new r();
            default: {
              let a = s.session === void 0 ? s : s.session.socket;
              return a[o] = u, !0;
            }
          }
        }
      };
      t.exports = i;
    }
  }), Jy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/client-request.js"(e, t) {
      "use strict";
      var { URL: r, urlToHttpOptions: i } = E("url"), s = E("http2"), { Writable: o } = E("stream"), { Agent: u, globalAgent: a } = Or(), l = Vy(),
      f = M3(), {
        ERR_INVALID_ARG_TYPE: p,
        ERR_INVALID_PROTOCOL: d,
        ERR_HTTP_HEADERS_SENT: c
      } = qs(), h = Gy(), g = Yy(), w = I3(), {
        HTTP2_HEADER_STATUS: y,
        HTTP2_HEADER_METHOD: _,
        HTTP2_HEADER_PATH: C,
        HTTP2_HEADER_AUTHORITY: v,
        HTTP2_METHOD_CONNECT: S
      } = s.constants, x = Symbol("headers"), F = Symbol("origin"), k = Symbol("session"), q = Symbol("options"), O = Symbol("flushedHeaders"),
      j = Symbol("jobs"), H = Symbol("pendingAgentPromise"), he = class extends o {
        static {
          n(this, "ClientRequest");
        }
        constructor(P, R, M) {
          if (super({
            autoDestroy: !1,
            emitClose: !1
          }), typeof P == "string" ? P = i(new r(P)) : P instanceof r ? P = i(P) : P = { ...P }, typeof R == "function" || R === void 0 ? (M =
          R, R = P) : R = Object.assign(P, R), R.h2session) {
            if (this[k] = R.h2session, this[k].destroyed)
              throw new Error("The session has been closed already");
            this.protocol = this[k].socket.encrypted ? "https:" : "http:";
          } else if (R.agent === !1)
            this.agent = new u({ maxEmptySessions: 0 });
          else if (typeof R.agent > "u" || R.agent === null)
            this.agent = a;
          else if (typeof R.agent.request == "function")
            this.agent = R.agent;
          else
            throw new p("options.agent", ["http2wrapper.Agent-like Object", "undefined", "false"], R.agent);
          if (this.agent && (this.protocol = this.agent.protocol), R.protocol && R.protocol !== this.protocol)
            throw new d(R.protocol, this.protocol);
          R.port || (R.port = R.defaultPort || this.agent && this.agent.defaultPort || 443), R.host = R.hostname || R.host || "localhost", delete R.
          hostname;
          let { timeout: ne } = R;
          R.timeout = void 0, this[x] = /* @__PURE__ */ Object.create(null), this[j] = [], this[H] = void 0, this.socket = null, this.connection =
          null, this.method = R.method || "GET", this.method === "CONNECT" && (R.path === "/" || R.path === void 0) || (this.path = R.path),
          this.res = null, this.aborted = !1, this.reusedSocket = !1;
          let { headers: $ } = R;
          if ($)
            for (let ge in $)
              this.setHeader(ge, $[ge]);
          R.auth && !("authorization" in this[x]) && (this[x].authorization = "Basic " + Buffer.from(R.auth).toString("base64")), R.session =
          R.tlsSession, R.path = R.socketPath, this[q] = R, this[F] = new r(`${this.protocol}//${R.servername || R.host}:${R.port}`);
          let B = R._reuseSocket;
          B && (R.createConnection = (...ge) => B.destroyed ? this.agent.createConnection(...ge) : B, this.agent.getSession(this[F], this[q]).
          catch(() => {
          })), ne && this.setTimeout(ne), M && this.once("response", M), this[O] = !1;
        }
        get method() {
          return this[x][_];
        }
        set method(P) {
          P && (this[x][_] = P.toUpperCase());
        }
        get path() {
          let P = this.method === "CONNECT" ? v : C;
          return this[x][P];
        }
        set path(P) {
          if (P) {
            let R = this.method === "CONNECT" ? v : C;
            this[x][R] = P;
          }
        }
        get host() {
          return this[F].hostname;
        }
        set host(P) {
        }
        get _mustNotHaveABody() {
          return this.method === "GET" || this.method === "HEAD" || this.method === "DELETE";
        }
        _write(P, R, M) {
          if (this._mustNotHaveABody) {
            M(new Error("The GET, HEAD and DELETE methods must NOT have a body"));
            return;
          }
          this.flushHeaders();
          let ne = /* @__PURE__ */ n(() => this._request.write(P, R, M), "callWrite");
          this._request ? ne() : this[j].push(ne);
        }
        _final(P) {
          this.flushHeaders();
          let R = /* @__PURE__ */ n(() => {
            if (this._mustNotHaveABody || this.method === "CONNECT") {
              P();
              return;
            }
            this._request.end(P);
          }, "callEnd");
          this._request ? R() : this[j].push(R);
        }
        abort() {
          this.res && this.res.complete || (this.aborted || process.nextTick(() => this.emit("abort")), this.aborted = !0, this.destroy());
        }
        async _destroy(P, R) {
          this.res && this.res._dump(), this._request ? this._request.destroy() : process.nextTick(() => {
            this.emit("close");
          });
          try {
            await this[H];
          } catch (M) {
            this.aborted && (P = M);
          }
          R(P);
        }
        async flushHeaders() {
          if (this[O] || this.destroyed)
            return;
          this[O] = !0;
          let P = this.method === S, R = /* @__PURE__ */ n((M) => {
            if (this._request = M, this.destroyed) {
              M.destroy();
              return;
            }
            P || f(M, this, ["timeout", "continue"]), M.once("error", ($) => {
              this.destroy($);
            }), M.once("aborted", () => {
              let { res: $ } = this;
              $ ? ($.aborted = !0, $.emit("aborted"), $.destroy()) : this.destroy(new Error("The server aborted the HTTP/2 stream"));
            });
            let ne = /* @__PURE__ */ n(($, B, ge) => {
              let N = new l(this.socket, M.readableHighWaterMark);
              this.res = N, N.url = `${this[F].origin}${this.path}`, N.req = this, N.statusCode = $[y], N.headers = $, N.rawHeaders = ge, N.
              once("end", () => {
                N.complete = !0, N.socket = null, N.connection = null;
              }), P ? (N.upgrade = !0, this.emit("connect", N, M, Buffer.alloc(0)) ? this.emit("close") : M.destroy()) : (M.on("data", (Ir) => {
                !N._dumped && !N.push(Ir) && M.pause();
              }), M.once("end", () => {
                this.aborted || N.push(null);
              }), this.emit("response", N) || N._dump());
            }, "onResponse");
            M.once("response", ne), M.once("headers", ($) => this.emit("information", { statusCode: $[y] })), M.once("trailers", ($, B, ge) => {
              let { res: N } = this;
              if (N === null) {
                ne($, B, ge);
                return;
              }
              N.trailers = $, N.rawTrailers = ge;
            }), M.once("close", () => {
              let { aborted: $, res: B } = this;
              if (B) {
                $ && (B.aborted = !0, B.emit("aborted"), B.destroy());
                let ge = /* @__PURE__ */ n(() => {
                  B.emit("close"), this.destroy(), this.emit("close");
                }, "finish");
                B.readable ? B.once("end", ge) : ge();
                return;
              }
              if (!this.destroyed) {
                this.destroy(new Error("The HTTP/2 stream has been early terminated")), this.emit("close");
                return;
              }
              this.destroy(), this.emit("close");
            }), this.socket = new Proxy(M, w);
            for (let $ of this[j])
              $();
            this[j].length = 0, this.emit("socket", this.socket);
          }, "onStream");
          if (!(v in this[x]) && !P && (this[x][v] = this[F].host), this[k])
            try {
              R(this[k].request(this[x]));
            } catch (M) {
              this.destroy(M);
            }
          else {
            this.reusedSocket = !0;
            try {
              let M = this.agent.request(this[F], this[q], this[x]);
              this[H] = M, R(await M), this[H] = !1;
            } catch (M) {
              this[H] = !1, this.destroy(M);
            }
          }
        }
        get connection() {
          return this.socket;
        }
        set connection(P) {
          this.socket = P;
        }
        getHeaderNames() {
          return Object.keys(this[x]);
        }
        hasHeader(P) {
          if (typeof P != "string")
            throw new p("name", "string", P);
          return !!this[x][P.toLowerCase()];
        }
        getHeader(P) {
          if (typeof P != "string")
            throw new p("name", "string", P);
          return this[x][P.toLowerCase()];
        }
        get headersSent() {
          return this[O];
        }
        removeHeader(P) {
          if (typeof P != "string")
            throw new p("name", "string", P);
          if (this.headersSent)
            throw new c("remove");
          delete this[x][P.toLowerCase()];
        }
        setHeader(P, R) {
          if (this.headersSent)
            throw new c("set");
          h(P), g(P, R);
          let M = P.toLowerCase();
          if (M === "connection") {
            if (R.toLowerCase() === "keep-alive")
              return;
            throw new Error(`Invalid 'connection' header: ${R}`);
          }
          M === "host" && this.method === "CONNECT" ? this[x][v] = R : this[x][M] = R;
        }
        setNoDelay() {
        }
        setSocketKeepAlive() {
        }
        setTimeout(P, R) {
          let M = /* @__PURE__ */ n(() => this._request.setTimeout(P, R), "applyTimeout");
          return this._request ? M() : this[j].push(M), this;
        }
        get maxHeadersCount() {
          if (!this.destroyed && this._request)
            return this._request.session.localSettings.maxHeaderListSize;
        }
        set maxHeadersCount(P) {
        }
      };
      t.exports = he;
    }
  }), L3 = W({
    "node_modules/.pnpm/resolve-alpn@1.2.1/node_modules/resolve-alpn/index.js"(e, t) {
      "use strict";
      var r = E("tls");
      t.exports = (i = {}, s = r.connect) => new Promise((o, u) => {
        let a = !1, l, f = /* @__PURE__ */ n(async () => {
          await d, l.off("timeout", p), l.off("error", u), i.resolveSocket ? (o({ alpnProtocol: l.alpnProtocol, socket: l, timeout: a }), a &&
          (await Promise.resolve(), l.emit("timeout"))) : (l.destroy(), o({ alpnProtocol: l.alpnProtocol, timeout: a }));
        }, "callback"), p = /* @__PURE__ */ n(async () => {
          a = !0, f();
        }, "onTimeout"), d = (async () => {
          try {
            l = await s(i, f), l.on("error", u), l.once("timeout", p);
          } catch (c) {
            u(c);
          }
        })();
      });
    }
  }), N3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/calculate-server-name.js"(e, t) {
      "use strict";
      var { isIP: r } = E("net"), i = E("assert"), s = /* @__PURE__ */ n((o) => {
        if (o[0] === "[") {
          let a = o.indexOf("]");
          return i(a !== -1), o.slice(1, a);
        }
        let u = o.indexOf(":");
        return u === -1 ? o : o.slice(0, u);
      }, "getHost");
      t.exports = (o) => {
        let u = s(o);
        return r(u) ? "" : u;
      };
    }
  }), U3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/auto.js"(e, t) {
      "use strict";
      var { URL: r, urlToHttpOptions: i } = E("url"), s = E("http"), o = E("https"), u = L3(), a = $y(), { Agent: l, globalAgent: f } = Or(),
      p = Jy(), d = N3(), c = zy(), h = new a({ maxSize: 100 }), g = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ n((C, v, S) => {
        v._httpMessage = { shouldKeepAlive: !0 };
        let x = /* @__PURE__ */ n(() => {
          C.emit("free", v, S);
        }, "onFree");
        v.on("free", x);
        let F = /* @__PURE__ */ n(() => {
          C.removeSocket(v, S);
        }, "onClose");
        v.on("close", F);
        let k = /* @__PURE__ */ n(() => {
          let { freeSockets: O } = C;
          for (let j of Object.values(O))
            if (j.includes(v)) {
              v.destroy();
              return;
            }
        }, "onTimeout");
        v.on("timeout", k);
        let q = /* @__PURE__ */ n(() => {
          C.removeSocket(v, S), v.off("close", F), v.off("free", x), v.off("timeout", k), v.off("agentRemove", q);
        }, "onRemove");
        v.on("agentRemove", q), C.emit("free", v, S);
      }, "installSocket"), y = /* @__PURE__ */ n((C, v = /* @__PURE__ */ new Map(), S = void 0) => async (x) => {
        let F = `${x.host}:${x.port}:${x.ALPNProtocols.sort()}`;
        if (!C.has(F)) {
          if (v.has(F))
            return { alpnProtocol: (await v.get(F)).alpnProtocol };
          let { path: k } = x;
          x.path = x.socketPath;
          let q = u(x, S);
          v.set(F, q);
          try {
            let O = await q;
            return C.set(F, O.alpnProtocol), v.delete(F), x.path = k, O;
          } catch (O) {
            throw v.delete(F), x.path = k, O;
          }
        }
        return { alpnProtocol: C.get(F) };
      }, "createResolveProtocol"), _ = y(h, g);
      t.exports = async (C, v, S) => {
        if (typeof C == "string" ? C = i(new r(C)) : C instanceof r ? C = i(C) : C = { ...C }, typeof v == "function" || v === void 0 ? (S =
        v, v = C) : v = Object.assign(C, v), v.ALPNProtocols = v.ALPNProtocols || ["h2", "http/1.1"], !Array.isArray(v.ALPNProtocols) || v.ALPNProtocols.
        length === 0)
          throw new Error("The `ALPNProtocols` option must be an Array with at least one entry");
        v.protocol = v.protocol || "https:";
        let x = v.protocol === "https:";
        v.host = v.hostname || v.host || "localhost", v.session = v.tlsSession, v.servername = v.servername || d(v.headers && v.headers.host ||
        v.host), v.port = v.port || (x ? 443 : 80), v._defaultAgent = x ? o.globalAgent : s.globalAgent;
        let F = v.resolveProtocol || _, { agent: k } = v;
        if (k !== void 0 && k !== !1 && k.constructor.name !== "Object")
          throw new Error("The `options.agent` can be only an object `http`, `https` or `http2` properties");
        if (x) {
          v.resolveSocket = !0;
          let { socket: q, alpnProtocol: O, timeout: j } = await F(v);
          if (j) {
            q && q.destroy();
            let he = new Error(`Timed out resolving ALPN: ${v.timeout} ms`);
            throw he.code = "ETIMEDOUT", he.ms = v.timeout, he;
          }
          q && v.createConnection && (q.destroy(), q = void 0), delete v.resolveSocket;
          let H = O === "h2";
          if (k && (k = H ? k.http2 : k.https, v.agent = k), k === void 0 && (k = H ? f : o.globalAgent), q)
            if (k === !1)
              q.destroy();
            else {
              let he = (H ? l : o.Agent).prototype.createConnection;
              k.createConnection === he ? H ? v._reuseSocket = q : w(k, q, v) : q.destroy();
            }
          if (H)
            return c(new p(v, S));
        } else k && (v.agent = k.http);
        return c(s.request(v, S));
      }, t.exports.protocolCache = h, t.exports.resolveProtocol = _, t.exports.createResolveProtocol = y;
    }
  }), Ky = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/js-stream-socket.js"(e, t) {
      "use strict";
      var r = E("stream"), i = E("tls"), s = new i.TLSSocket(new r.PassThrough())._handle._parentWrap.constructor;
      t.exports = s;
    }
  }), Xy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/unexpected-status-code-error.js"(e, t) {
      "use strict";
      var r = class extends Error {
        static {
          n(this, "UnexpectedStatusCodeError");
        }
        constructor(i, s = "") {
          super(`The proxy server rejected the request with status code ${i} (${s || "empty status message"})`), this.statusCode = i, this.statusMessage =
          s;
        }
      };
      t.exports = r;
    }
  }), H3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/check-type.js"(e, t) {
      "use strict";
      var r = /* @__PURE__ */ n((i, s, o) => {
        if (!o.some((a) => typeof a === "string" ? typeof s === a : s instanceof a)) {
          let a = o.map((l) => typeof l == "string" ? l : l.name);
          throw new TypeError(`Expected '${i}' to be a type of ${a.join(" or ")}, got ${typeof s}`);
        }
      }, "checkType");
      t.exports = r;
    }
  }), Qy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/initialize.js"(e, t) {
      "use strict";
      var { URL: r } = E("url"), i = H3();
      t.exports = (s, o) => {
        i("proxyOptions", o, ["object"]), i("proxyOptions.headers", o.headers, ["object", "undefined"]), i("proxyOptions.raw", o.raw, ["bool\
ean", "undefined"]), i("proxyOptions.url", o.url, [r, "string"]);
        let u = new r(o.url);
        s.proxyOptions = {
          raw: !0,
          ...o,
          headers: { ...o.headers },
          url: u
        };
      };
    }
  }), pl = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/get-auth-headers.js"(e, t) {
      "use strict";
      t.exports = (r) => {
        let { username: i, password: s } = r.proxyOptions.url;
        if (i || s) {
          let o = `${i}:${s}`, u = `Basic ${Buffer.from(o).toString("base64")}`;
          return {
            "proxy-authorization": u,
            authorization: u
          };
        }
        return {};
      };
    }
  }), W3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h1-over-h2.js"(e, t) {
      "use strict";
      var r = E("tls"), i = E("http"), s = E("https"), o = Ky(), { globalAgent: u } = Or(), a = Xy(), l = Qy(), f = pl(), p = /* @__PURE__ */ n(
      (h, g, w) => {
        (async () => {
          try {
            let { proxyOptions: y } = h, { url: _, headers: C, raw: v } = y, S = await u.request(_, y, {
              ...f(h),
              ...C,
              ":method": "CONNECT",
              ":authority": `${g.host}:${g.port}`
            });
            S.once("error", w), S.once("response", (x) => {
              let F = x[":status"];
              if (F !== 200) {
                w(new a(F, ""));
                return;
              }
              let k = h instanceof s.Agent;
              if (v && k) {
                g.socket = S;
                let O = r.connect(g);
                O.once("close", () => {
                  S.destroy();
                }), w(null, O);
                return;
              }
              let q = new o(S);
              q.encrypted = !1, q._handle.getpeername = (O) => {
                O.family = void 0, O.address = void 0, O.port = void 0;
              }, w(null, q);
            });
          } catch (y) {
            w(y);
          }
        })();
      }, "createConnection"), d = class extends i.Agent {
        static {
          n(this, "HttpOverHttp2");
        }
        constructor(h) {
          super(h), l(this, h.proxyOptions);
        }
        createConnection(h, g) {
          p(this, h, g);
        }
      }, c = class extends s.Agent {
        static {
          n(this, "HttpsOverHttp2");
        }
        constructor(h) {
          super(h), l(this, h.proxyOptions);
        }
        createConnection(h, g) {
          p(this, h, g);
        }
      };
      t.exports = {
        HttpOverHttp2: d,
        HttpsOverHttp2: c
      };
    }
  }), Zy = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-hx.js"(e, t) {
      "use strict";
      var { Agent: r } = Or(), i = Ky(), s = Xy(), o = Qy(), u = class extends r {
        static {
          n(this, "Http2OverHttpX");
        }
        constructor(a) {
          super(a), o(this, a.proxyOptions);
        }
        async createConnection(a, l) {
          let f = `${a.hostname}:${a.port || 443}`, [p, d, c] = await this._getProxyStream(f);
          if (d !== 200)
            throw new s(d, c);
          if (this.proxyOptions.raw)
            l.socket = p;
          else {
            let h = new i(p);
            return h.encrypted = !1, h._handle.getpeername = (g) => {
              g.family = void 0, g.address = void 0, g.port = void 0;
            }, h;
          }
          return super.createConnection(a, l);
        }
      };
      t.exports = u;
    }
  }), $3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-h2.js"(e, t) {
      "use strict";
      var { globalAgent: r } = Or(), i = Zy(), s = pl(), o = /* @__PURE__ */ n((a) => new Promise((l, f) => {
        a.once("error", f), a.once("response", (p) => {
          a.off("error", f), l(p[":status"]);
        });
      }), "getStatusCode"), u = class extends i {
        static {
          n(this, "Http2OverHttp2");
        }
        async _getProxyStream(a) {
          let { proxyOptions: l } = this, f = {
            ...s(this),
            ...l.headers,
            ":method": "CONNECT",
            ":authority": a
          }, p = await r.request(l.url, l, f), d = await o(p);
          return [p, d, ""];
        }
      };
      t.exports = u;
    }
  }), z3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-h1.js"(e, t) {
      "use strict";
      var r = E("http"), i = E("https"), s = Zy(), o = pl(), u = /* @__PURE__ */ n((l) => new Promise((f, p) => {
        let d = /* @__PURE__ */ n((c, h, g) => {
          h.unshift(g), l.off("error", p), f([h, c.statusCode, c.statusMessage]);
        }, "onConnect");
        l.once("error", p), l.once("connect", d);
      }), "getStream2"), a = class extends s {
        static {
          n(this, "Http2OverHttp");
        }
        async _getProxyStream(l) {
          let { proxyOptions: f } = this, { url: p, headers: d } = this.proxyOptions, h = (p.protocol === "https:" ? i : r).request({
            ...f,
            hostname: p.hostname,
            port: p.port,
            path: l,
            headers: {
              ...o(this),
              ...d,
              host: l
            },
            method: "CONNECT"
          }).end();
          return u(h);
        }
      };
      t.exports = {
        Http2OverHttp: a,
        Http2OverHttps: a
      };
    }
  }), V3 = W({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/index.js"(e, t) {
      "use strict";
      var r = E("http2"), {
        Agent: i,
        globalAgent: s
      } = Or(), o = Jy(), u = Vy(), a = U3(), {
        HttpOverHttp2: l,
        HttpsOverHttp2: f
      } = W3(), p = $3(), {
        Http2OverHttp: d,
        Http2OverHttps: c
      } = z3(), h = Gy(), g = Yy(), w = /* @__PURE__ */ n((_, C, v) => new o(_, C, v), "request"), y = /* @__PURE__ */ n((_, C, v) => {
        let S = new o(_, C, v);
        return S.end(), S;
      }, "get");
      t.exports = {
        ...r,
        ClientRequest: o,
        IncomingMessage: u,
        Agent: i,
        globalAgent: s,
        request: w,
        get: y,
        auto: a,
        proxies: {
          HttpOverHttp2: l,
          HttpsOverHttp2: f,
          Http2OverHttp2: p,
          Http2OverHttp: d,
          Http2OverHttps: c
        },
        validateHeaderName: h,
        validateHeaderValue: g
      };
    }
  }), eb = {};
  S3(eb, {
    default: /* @__PURE__ */ n(() => GA, "default")
  });
  fb.exports = A3(eb);
  var G3 = E("http"), Y3 = E("https"), tb = [
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array"
  ];
  function J3(e) {
    return tb.includes(e);
  }
  n(J3, "isTypedArrayName");
  var K3 = [
    "Function",
    "Generator",
    "AsyncGenerator",
    "GeneratorFunction",
    "AsyncGeneratorFunction",
    "AsyncFunction",
    "Observable",
    "Array",
    "Buffer",
    "Blob",
    "Object",
    "RegExp",
    "Date",
    "Error",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "WeakRef",
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Promise",
    "URL",
    "FormData",
    "URLSearchParams",
    "HTMLElement",
    "NaN",
    ...tb
  ];
  function X3(e) {
    return K3.includes(e);
  }
  n(X3, "isObjectTypeName");
  var Q3 = [
    "null",
    "undefined",
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol"
  ];
  function Z3(e) {
    return Q3.includes(e);
  }
  n(Z3, "isPrimitiveTypeName");
  function Pr(e) {
    return (t) => typeof t === e;
  }
  n(Pr, "isOfType");
  var { toString: e1 } = Object.prototype, Ui = /* @__PURE__ */ n((e) => {
    let t = e1.call(e).slice(8, -1);
    if (/HTML\w+Element/.test(t) && D.domElement(e))
      return "HTMLElement";
    if (X3(t))
      return t;
  }, "getObjectType"), J = /* @__PURE__ */ n((e) => (t) => Ui(t) === e, "isObjectOfType");
  function D(e) {
    if (e === null)
      return "null";
    switch (typeof e) {
      case "undefined":
        return "undefined";
      case "string":
        return "string";
      case "number":
        return Number.isNaN(e) ? "NaN" : "number";
      case "boolean":
        return "boolean";
      case "function":
        return "Function";
      case "bigint":
        return "bigint";
      case "symbol":
        return "symbol";
      default:
    }
    if (D.observable(e))
      return "Observable";
    if (D.array(e))
      return "Array";
    if (D.buffer(e))
      return "Buffer";
    let t = Ui(e);
    if (t)
      return t;
    if (e instanceof String || e instanceof Boolean || e instanceof Number)
      throw new TypeError("Please don't use object wrappers for primitive types");
    return "Object";
  }
  n(D, "is");
  D.undefined = Pr("undefined");
  D.string = Pr("string");
  var t1 = Pr("number");
  D.number = (e) => t1(e) && !D.nan(e);
  D.bigint = Pr("bigint");
  D.function_ = Pr("function");
  D.null_ = (e) => e === null;
  D.class_ = (e) => D.function_(e) && e.toString().startsWith("class ");
  D.boolean = (e) => e === !0 || e === !1;
  D.symbol = Pr("symbol");
  D.numericString = (e) => D.string(e) && !D.emptyStringOrWhitespace(e) && !Number.isNaN(Number(e));
  D.array = (e, t) => Array.isArray(e) ? D.function_(t) ? e.every((r) => t(r)) : !0 : !1;
  D.buffer = (e) => {
    var t, r;
    return ((r = (t = e?.constructor) == null ? void 0 : t.isBuffer) == null ? void 0 : r.call(t, e)) ?? !1;
  };
  D.blob = (e) => J("Blob")(e);
  D.nullOrUndefined = (e) => D.null_(e) || D.undefined(e);
  D.object = (e) => !D.null_(e) && (typeof e == "object" || D.function_(e));
  D.iterable = (e) => D.function_(e?.[Symbol.iterator]);
  D.asyncIterable = (e) => D.function_(e?.[Symbol.asyncIterator]);
  D.generator = (e) => D.iterable(e) && D.function_(e?.next) && D.function_(e?.throw);
  D.asyncGenerator = (e) => D.asyncIterable(e) && D.function_(e.next) && D.function_(e.throw);
  D.nativePromise = (e) => J("Promise")(e);
  var r1 = /* @__PURE__ */ n((e) => D.function_(e?.then) && D.function_(e?.catch), "hasPromiseApi");
  D.promise = (e) => D.nativePromise(e) || r1(e);
  D.generatorFunction = J("GeneratorFunction");
  D.asyncGeneratorFunction = (e) => Ui(e) === "AsyncGeneratorFunction";
  D.asyncFunction = (e) => Ui(e) === "AsyncFunction";
  D.boundFunction = (e) => D.function_(e) && !e.hasOwnProperty("prototype");
  D.regExp = J("RegExp");
  D.date = J("Date");
  D.error = J("Error");
  D.map = (e) => J("Map")(e);
  D.set = (e) => J("Set")(e);
  D.weakMap = (e) => J("WeakMap")(e);
  D.weakSet = (e) => J("WeakSet")(e);
  D.weakRef = (e) => J("WeakRef")(e);
  D.int8Array = J("Int8Array");
  D.uint8Array = J("Uint8Array");
  D.uint8ClampedArray = J("Uint8ClampedArray");
  D.int16Array = J("Int16Array");
  D.uint16Array = J("Uint16Array");
  D.int32Array = J("Int32Array");
  D.uint32Array = J("Uint32Array");
  D.float32Array = J("Float32Array");
  D.float64Array = J("Float64Array");
  D.bigInt64Array = J("BigInt64Array");
  D.bigUint64Array = J("BigUint64Array");
  D.arrayBuffer = J("ArrayBuffer");
  D.sharedArrayBuffer = J("SharedArrayBuffer");
  D.dataView = J("DataView");
  D.enumCase = (e, t) => Object.values(t).includes(e);
  D.directInstanceOf = (e, t) => Object.getPrototypeOf(e) === t.prototype;
  D.urlInstance = (e) => J("URL")(e);
  D.urlString = (e) => {
    if (!D.string(e))
      return !1;
    try {
      return new URL(e), !0;
    } catch {
      return !1;
    }
  };
  D.truthy = (e) => !!e;
  D.falsy = (e) => !e;
  D.nan = (e) => Number.isNaN(e);
  D.primitive = (e) => D.null_(e) || Z3(typeof e);
  D.integer = (e) => Number.isInteger(e);
  D.safeInteger = (e) => Number.isSafeInteger(e);
  D.plainObject = (e) => {
    if (typeof e != "object" || e === null)
      return !1;
    let t = Object.getPrototypeOf(e);
    return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in
    e);
  };
  D.typedArray = (e) => J3(Ui(e));
  var i1 = /* @__PURE__ */ n((e) => D.safeInteger(e) && e >= 0, "isValidLength");
  D.arrayLike = (e) => !D.nullOrUndefined(e) && !D.function_(e) && i1(e.length);
  D.inRange = (e, t) => {
    if (D.number(t))
      return e >= Math.min(0, t) && e <= Math.max(t, 0);
    if (D.array(t) && t.length === 2)
      return e >= Math.min(...t) && e <= Math.max(...t);
    throw new TypeError(`Invalid range: ${JSON.stringify(t)}`);
  };
  var n1 = 1, s1 = [
    "innerHTML",
    "ownerDocument",
    "style",
    "attributes",
    "nodeValue"
  ];
  D.domElement = (e) => D.object(e) && e.nodeType === n1 && D.string(e.nodeName) && !D.plainObject(e) && s1.every((t) => t in e);
  D.observable = (e) => {
    var t, r;
    return e ? e === ((t = e[Symbol.observable]) == null ? void 0 : t.call(e)) || e === ((r = e["@@observable"]) == null ? void 0 : r.call(e)) :
    !1;
  };
  D.nodeStream = (e) => D.object(e) && D.function_(e.pipe) && !D.observable(e);
  D.infinite = (e) => e === Number.POSITIVE_INFINITY || e === Number.NEGATIVE_INFINITY;
  var rb = /* @__PURE__ */ n((e) => (t) => D.integer(t) && Math.abs(t % 2) === e, "isAbsoluteMod2");
  D.evenInteger = rb(0);
  D.oddInteger = rb(1);
  D.emptyArray = (e) => D.array(e) && e.length === 0;
  D.nonEmptyArray = (e) => D.array(e) && e.length > 0;
  D.emptyString = (e) => D.string(e) && e.length === 0;
  var o1 = /* @__PURE__ */ n((e) => D.string(e) && !/\S/.test(e), "isWhiteSpaceString");
  D.emptyStringOrWhitespace = (e) => D.emptyString(e) || o1(e);
  D.nonEmptyString = (e) => D.string(e) && e.length > 0;
  D.nonEmptyStringAndNotWhitespace = (e) => D.string(e) && !D.emptyStringOrWhitespace(e);
  D.emptyObject = (e) => D.object(e) && !D.map(e) && !D.set(e) && Object.keys(e).length === 0;
  D.nonEmptyObject = (e) => D.object(e) && !D.map(e) && !D.set(e) && Object.keys(e).length > 0;
  D.emptySet = (e) => D.set(e) && e.size === 0;
  D.nonEmptySet = (e) => D.set(e) && e.size > 0;
  D.emptyMap = (e) => D.map(e) && e.size === 0;
  D.nonEmptyMap = (e) => D.map(e) && e.size > 0;
  D.propertyKey = (e) => D.any([D.string, D.number, D.symbol], e);
  D.formData = (e) => J("FormData")(e);
  D.urlSearchParams = (e) => J("URLSearchParams")(e);
  var ib = /* @__PURE__ */ n((e, t, r) => {
    if (!D.function_(t))
      throw new TypeError(`Invalid predicate: ${JSON.stringify(t)}`);
    if (r.length === 0)
      throw new TypeError("Invalid number of values");
    return e.call(r, t);
  }, "predicateOnArray");
  D.any = (e, ...t) => (D.array(e) ? e : [e]).some((i) => ib(Array.prototype.some, i, t));
  D.all = (e, ...t) => ib(Array.prototype.every, e, t);
  var T = /* @__PURE__ */ n((e, t, r, i = {}) => {
    if (!e) {
      let { multipleValues: s } = i, o = s ? `received values of types ${[
        ...new Set(r.map((u) => `\`${D(u)}\``))
      ].join(", ")}` : `received value of type \`${D(r)}\``;
      throw new TypeError(`Expected value which is \`${t}\`, ${o}.`);
    }
  }, "assertType"), A = {
    // Unknowns.
    undefined: /* @__PURE__ */ n((e) => T(D.undefined(e), "undefined", e), "undefined"),
    string: /* @__PURE__ */ n((e) => T(D.string(e), "string", e), "string"),
    number: /* @__PURE__ */ n((e) => T(D.number(e), "number", e), "number"),
    bigint: /* @__PURE__ */ n((e) => T(D.bigint(e), "bigint", e), "bigint"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    function_: /* @__PURE__ */ n((e) => T(D.function_(e), "Function", e), "function_"),
    null_: /* @__PURE__ */ n((e) => T(D.null_(e), "null", e), "null_"),
    class_: /* @__PURE__ */ n((e) => T(D.class_(e), "Class", e), "class_"),
    boolean: /* @__PURE__ */ n((e) => T(D.boolean(e), "boolean", e), "boolean"),
    symbol: /* @__PURE__ */ n((e) => T(D.symbol(e), "symbol", e), "symbol"),
    numericString: /* @__PURE__ */ n((e) => T(D.numericString(e), "string with a number", e), "numericString"),
    array: /* @__PURE__ */ n((e, t) => {
      T(D.array(e), "Array", e), t && e.forEach(t);
    }, "array"),
    buffer: /* @__PURE__ */ n((e) => T(D.buffer(e), "Buffer", e), "buffer"),
    blob: /* @__PURE__ */ n((e) => T(D.blob(e), "Blob", e), "blob"),
    nullOrUndefined: /* @__PURE__ */ n((e) => T(D.nullOrUndefined(e), "null or undefined", e), "nullOrUndefined"),
    object: /* @__PURE__ */ n((e) => T(D.object(e), "Object", e), "object"),
    iterable: /* @__PURE__ */ n((e) => T(D.iterable(e), "Iterable", e), "iterable"),
    asyncIterable: /* @__PURE__ */ n((e) => T(D.asyncIterable(e), "AsyncIterable", e), "asyncIterable"),
    generator: /* @__PURE__ */ n((e) => T(D.generator(e), "Generator", e), "generator"),
    asyncGenerator: /* @__PURE__ */ n((e) => T(D.asyncGenerator(e), "AsyncGenerator", e), "asyncGenerator"),
    nativePromise: /* @__PURE__ */ n((e) => T(D.nativePromise(e), "native Promise", e), "nativePromise"),
    promise: /* @__PURE__ */ n((e) => T(D.promise(e), "Promise", e), "promise"),
    generatorFunction: /* @__PURE__ */ n((e) => T(D.generatorFunction(e), "GeneratorFunction", e), "generatorFunction"),
    asyncGeneratorFunction: /* @__PURE__ */ n((e) => T(D.asyncGeneratorFunction(e), "AsyncGeneratorFunction", e), "asyncGeneratorFunction"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    asyncFunction: /* @__PURE__ */ n((e) => T(D.asyncFunction(e), "AsyncFunction", e), "asyncFunction"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    boundFunction: /* @__PURE__ */ n((e) => T(D.boundFunction(e), "Function", e), "boundFunction"),
    regExp: /* @__PURE__ */ n((e) => T(D.regExp(e), "RegExp", e), "regExp"),
    date: /* @__PURE__ */ n((e) => T(D.date(e), "Date", e), "date"),
    error: /* @__PURE__ */ n((e) => T(D.error(e), "Error", e), "error"),
    map: /* @__PURE__ */ n((e) => T(D.map(e), "Map", e), "map"),
    set: /* @__PURE__ */ n((e) => T(D.set(e), "Set", e), "set"),
    weakMap: /* @__PURE__ */ n((e) => T(D.weakMap(e), "WeakMap", e), "weakMap"),
    weakSet: /* @__PURE__ */ n((e) => T(D.weakSet(e), "WeakSet", e), "weakSet"),
    weakRef: /* @__PURE__ */ n((e) => T(D.weakRef(e), "WeakRef", e), "weakRef"),
    int8Array: /* @__PURE__ */ n((e) => T(D.int8Array(e), "Int8Array", e), "int8Array"),
    uint8Array: /* @__PURE__ */ n((e) => T(D.uint8Array(e), "Uint8Array", e), "uint8Array"),
    uint8ClampedArray: /* @__PURE__ */ n((e) => T(D.uint8ClampedArray(e), "Uint8ClampedArray", e), "uint8ClampedArray"),
    int16Array: /* @__PURE__ */ n((e) => T(D.int16Array(e), "Int16Array", e), "int16Array"),
    uint16Array: /* @__PURE__ */ n((e) => T(D.uint16Array(e), "Uint16Array", e), "uint16Array"),
    int32Array: /* @__PURE__ */ n((e) => T(D.int32Array(e), "Int32Array", e), "int32Array"),
    uint32Array: /* @__PURE__ */ n((e) => T(D.uint32Array(e), "Uint32Array", e), "uint32Array"),
    float32Array: /* @__PURE__ */ n((e) => T(D.float32Array(e), "Float32Array", e), "float32Array"),
    float64Array: /* @__PURE__ */ n((e) => T(D.float64Array(e), "Float64Array", e), "float64Array"),
    bigInt64Array: /* @__PURE__ */ n((e) => T(D.bigInt64Array(e), "BigInt64Array", e), "bigInt64Array"),
    bigUint64Array: /* @__PURE__ */ n((e) => T(D.bigUint64Array(e), "BigUint64Array", e), "bigUint64Array"),
    arrayBuffer: /* @__PURE__ */ n((e) => T(D.arrayBuffer(e), "ArrayBuffer", e), "arrayBuffer"),
    sharedArrayBuffer: /* @__PURE__ */ n((e) => T(D.sharedArrayBuffer(e), "SharedArrayBuffer", e), "sharedArrayBuffer"),
    dataView: /* @__PURE__ */ n((e) => T(D.dataView(e), "DataView", e), "dataView"),
    enumCase: /* @__PURE__ */ n((e, t) => T(D.enumCase(e, t), "EnumCase", e), "enumCase"),
    urlInstance: /* @__PURE__ */ n((e) => T(D.urlInstance(e), "URL", e), "urlInstance"),
    urlString: /* @__PURE__ */ n((e) => T(D.urlString(e), "string with a URL", e), "urlString"),
    truthy: /* @__PURE__ */ n((e) => T(D.truthy(e), "truthy", e), "truthy"),
    falsy: /* @__PURE__ */ n((e) => T(D.falsy(e), "falsy", e), "falsy"),
    nan: /* @__PURE__ */ n((e) => T(D.nan(e), "NaN", e), "nan"),
    primitive: /* @__PURE__ */ n((e) => T(D.primitive(e), "primitive", e), "primitive"),
    integer: /* @__PURE__ */ n((e) => T(D.integer(e), "integer", e), "integer"),
    safeInteger: /* @__PURE__ */ n((e) => T(D.safeInteger(e), "integer", e), "safeInteger"),
    plainObject: /* @__PURE__ */ n((e) => T(D.plainObject(e), "plain object", e), "plainObject"),
    typedArray: /* @__PURE__ */ n((e) => T(D.typedArray(e), "TypedArray", e), "typedArray"),
    arrayLike: /* @__PURE__ */ n((e) => T(D.arrayLike(e), "array-like", e), "arrayLike"),
    domElement: /* @__PURE__ */ n((e) => T(D.domElement(e), "HTMLElement", e), "domElement"),
    observable: /* @__PURE__ */ n((e) => T(D.observable(e), "Observable", e), "observable"),
    nodeStream: /* @__PURE__ */ n((e) => T(D.nodeStream(e), "Node.js Stream", e), "nodeStream"),
    infinite: /* @__PURE__ */ n((e) => T(D.infinite(e), "infinite number", e), "infinite"),
    emptyArray: /* @__PURE__ */ n((e) => T(D.emptyArray(e), "empty array", e), "emptyArray"),
    nonEmptyArray: /* @__PURE__ */ n((e) => T(D.nonEmptyArray(e), "non-empty array", e), "nonEmptyArray"),
    emptyString: /* @__PURE__ */ n((e) => T(D.emptyString(e), "empty string", e), "emptyString"),
    emptyStringOrWhitespace: /* @__PURE__ */ n((e) => T(D.emptyStringOrWhitespace(e), "empty string or whitespace", e), "emptyStringOrWhites\
pace"),
    nonEmptyString: /* @__PURE__ */ n((e) => T(D.nonEmptyString(e), "non-empty string", e), "nonEmptyString"),
    nonEmptyStringAndNotWhitespace: /* @__PURE__ */ n((e) => T(D.nonEmptyStringAndNotWhitespace(e), "non-empty string and not whitespace", e),
    "nonEmptyStringAndNotWhitespace"),
    emptyObject: /* @__PURE__ */ n((e) => T(D.emptyObject(e), "empty object", e), "emptyObject"),
    nonEmptyObject: /* @__PURE__ */ n((e) => T(D.nonEmptyObject(e), "non-empty object", e), "nonEmptyObject"),
    emptySet: /* @__PURE__ */ n((e) => T(D.emptySet(e), "empty set", e), "emptySet"),
    nonEmptySet: /* @__PURE__ */ n((e) => T(D.nonEmptySet(e), "non-empty set", e), "nonEmptySet"),
    emptyMap: /* @__PURE__ */ n((e) => T(D.emptyMap(e), "empty map", e), "emptyMap"),
    nonEmptyMap: /* @__PURE__ */ n((e) => T(D.nonEmptyMap(e), "non-empty map", e), "nonEmptyMap"),
    propertyKey: /* @__PURE__ */ n((e) => T(D.propertyKey(e), "PropertyKey", e), "propertyKey"),
    formData: /* @__PURE__ */ n((e) => T(D.formData(e), "FormData", e), "formData"),
    urlSearchParams: /* @__PURE__ */ n((e) => T(D.urlSearchParams(e), "URLSearchParams", e), "urlSearchParams"),
    // Numbers.
    evenInteger: /* @__PURE__ */ n((e) => T(D.evenInteger(e), "even integer", e), "evenInteger"),
    oddInteger: /* @__PURE__ */ n((e) => T(D.oddInteger(e), "odd integer", e), "oddInteger"),
    // Two arguments.
    directInstanceOf: /* @__PURE__ */ n((e, t) => T(D.directInstanceOf(e, t), "T", e), "directInstanceOf"),
    inRange: /* @__PURE__ */ n((e, t) => T(D.inRange(e, t), "in range", e), "inRange"),
    // Variadic functions.
    any: /* @__PURE__ */ n((e, ...t) => T(D.any(e, ...t), "predicate returns truthy for any value", t, { multipleValues: !0 }), "any"),
    all: /* @__PURE__ */ n((e, ...t) => T(D.all(e, ...t), "predicate returns truthy for all values", t, { multipleValues: !0 }), "all")
  };
  Object.defineProperties(D, {
    class: {
      value: D.class_
    },
    function: {
      value: D.function_
    },
    null: {
      value: D.null_
    }
  });
  Object.defineProperties(A, {
    class: {
      value: A.class_
    },
    function: {
      value: A.function_
    },
    null: {
      value: A.null_
    }
  });
  var m = D, u1 = E("events"), a1 = class extends Error {
    static {
      n(this, "CancelError");
    }
    constructor(e) {
      super(e || "Promise was canceled"), this.name = "CancelError";
    }
    get isCanceled() {
      return !0;
    }
  }, Dl = class {
    static {
      n(this, "PCancelable");
    }
    static fn(e) {
      return (...t) => new Dl((r, i, s) => {
        t.push(s), e(...t).then(r, i);
      });
    }
    constructor(e) {
      this._cancelHandlers = [], this._isPending = !0, this._isCanceled = !1, this._rejectOnCancel = !0, this._promise = new Promise((t, r) => {
        this._reject = r;
        let i = /* @__PURE__ */ n((u) => {
          (!this._isCanceled || !o.shouldReject) && (this._isPending = !1, t(u));
        }, "onResolve"), s = /* @__PURE__ */ n((u) => {
          this._isPending = !1, r(u);
        }, "onReject"), o = /* @__PURE__ */ n((u) => {
          if (!this._isPending)
            throw new Error("The `onCancel` handler was attached after the promise settled.");
          this._cancelHandlers.push(u);
        }, "onCancel");
        Object.defineProperties(o, {
          shouldReject: {
            get: /* @__PURE__ */ n(() => this._rejectOnCancel, "get"),
            set: /* @__PURE__ */ n((u) => {
              this._rejectOnCancel = u;
            }, "set")
          }
        }), e(i, s, o);
      });
    }
    then(e, t) {
      return this._promise.then(e, t);
    }
    catch(e) {
      return this._promise.catch(e);
    }
    finally(e) {
      return this._promise.finally(e);
    }
    cancel(e) {
      if (!(!this._isPending || this._isCanceled)) {
        if (this._isCanceled = !0, this._cancelHandlers.length > 0)
          try {
            for (let t of this._cancelHandlers)
              t();
          } catch (t) {
            this._reject(t);
            return;
          }
        this._rejectOnCancel && this._reject(new a1(e));
      }
    }
    get isCanceled() {
      return this._isCanceled;
    }
  };
  Object.setPrototypeOf(Dl.prototype, Promise.prototype);
  function l1(e) {
    return m.object(e) && "_onResponse" in e;
  }
  n(l1, "isRequest");
  var ye = class extends Error {
    static {
      n(this, "RequestError");
    }
    constructor(e, t, r) {
      var i;
      if (super(e), Object.defineProperty(this, "input", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "code", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "stack", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "response", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "request", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "timings", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Error.captureStackTrace(this, this.constructor), this.name = "RequestError", this.code = t.code ?? "ERR_GOT_REQUEST_ERROR", this.input =
      t.input, l1(r) ? (Object.defineProperty(this, "request", {
        enumerable: !1,
        value: r
      }), Object.defineProperty(this, "response", {
        enumerable: !1,
        value: r.response
      }), this.options = r.options) : this.options = r, this.timings = (i = this.request) == null ? void 0 : i.timings, m.string(t.stack) &&
      m.string(this.stack)) {
        let s = this.stack.indexOf(this.message) + this.message.length, o = this.stack.slice(s).split(`
`).reverse(), u = t.stack.slice(t.stack.indexOf(t.message) + t.message.length).split(`
`).reverse();
        for (; u.length > 0 && u[0] === o[0]; )
          o.shift();
        this.stack = `${this.stack.slice(0, s)}${o.reverse().join(`
`)}${u.reverse().join(`
`)}`;
      }
    }
  }, f1 = class extends ye {
    static {
      n(this, "MaxRedirectsError");
    }
    constructor(e) {
      super(`Redirected ${e.options.maxRedirects} times. Aborting.`, {}, e), this.name = "MaxRedirectsError", this.code = "ERR_TOO_MANY_REDI\
RECTS";
    }
  }, ks = class extends ye {
    static {
      n(this, "HTTPError");
    }
    constructor(e) {
      super(`Response code ${e.statusCode} (${e.statusMessage})`, {}, e.request), this.name = "HTTPError", this.code = "ERR_NON_2XX_3XX_RESP\
ONSE";
    }
  }, h1 = class extends ye {
    static {
      n(this, "CacheError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "CacheError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_CACHE_ACCESS" : this.code;
    }
  }, gy = class extends ye {
    static {
      n(this, "UploadError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "UploadError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_UPLOAD" : this.code;
    }
  }, c1 = class extends ye {
    static {
      n(this, "TimeoutError");
    }
    constructor(e, t, r) {
      super(e.message, e, r), Object.defineProperty(this, "timings", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "event", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), this.name = "TimeoutError", this.event = e.event, this.timings = t;
    }
  }, yy = class extends ye {
    static {
      n(this, "ReadError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "ReadError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_READING_RESPONSE_STREAM" : this.
      code;
    }
  }, d1 = class extends ye {
    static {
      n(this, "RetryError");
    }
    constructor(e) {
      super("Retrying", {}, e), this.name = "RetryError", this.code = "ERR_RETRYING";
    }
  }, p1 = class extends ye {
    static {
      n(this, "AbortError");
    }
    constructor(e) {
      super("This operation was aborted.", {}, e), this.code = "ERR_ABORTED", this.name = "AbortError";
    }
  }, nb = me(E("process"), 1), il = E("buffer"), D1 = E("stream"), by = E("url"), nl = me(E("http"), 1), m1 = E("events"), g1 = E("util"), y1 = me(
  T3(), 1), b1 = /* @__PURE__ */ n((e) => {
    if (e.timings)
      return e.timings;
    let t = {
      start: Date.now(),
      socket: void 0,
      lookup: void 0,
      connect: void 0,
      secureConnect: void 0,
      upload: void 0,
      response: void 0,
      end: void 0,
      error: void 0,
      abort: void 0,
      phases: {
        wait: void 0,
        dns: void 0,
        tcp: void 0,
        tls: void 0,
        request: void 0,
        firstByte: void 0,
        download: void 0,
        total: void 0
      }
    };
    e.timings = t;
    let r = /* @__PURE__ */ n((u) => {
      u.once(m1.errorMonitor, () => {
        t.error = Date.now(), t.phases.total = t.error - t.start;
      });
    }, "handleError");
    r(e);
    let i = /* @__PURE__ */ n(() => {
      t.abort = Date.now(), t.phases.total = t.abort - t.start;
    }, "onAbort");
    e.prependOnceListener("abort", i);
    let s = /* @__PURE__ */ n((u) => {
      if (t.socket = Date.now(), t.phases.wait = t.socket - t.start, g1.types.isProxy(u))
        return;
      let a = /* @__PURE__ */ n(() => {
        t.lookup = Date.now(), t.phases.dns = t.lookup - t.socket;
      }, "lookupListener");
      u.prependOnceListener("lookup", a), (0, y1.default)(u, {
        connect: /* @__PURE__ */ n(() => {
          t.connect = Date.now(), t.lookup === void 0 && (u.removeListener("lookup", a), t.lookup = t.connect, t.phases.dns = t.lookup - t.socket),
          t.phases.tcp = t.connect - t.lookup;
        }, "connect"),
        secureConnect: /* @__PURE__ */ n(() => {
          t.secureConnect = Date.now(), t.phases.tls = t.secureConnect - t.connect;
        }, "secureConnect")
      });
    }, "onSocket");
    e.socket ? s(e.socket) : e.prependOnceListener("socket", s);
    let o = /* @__PURE__ */ n(() => {
      t.upload = Date.now(), t.phases.request = t.upload - (t.secureConnect ?? t.connect);
    }, "onUpload");
    return e.writableFinished ? o() : e.prependOnceListener("finish", o), e.prependOnceListener("response", (u) => {
      t.response = Date.now(), t.phases.firstByte = t.response - t.upload, u.timings = t, r(u), u.prependOnceListener("end", () => {
        e.off("abort", i), u.off("aborted", i), !t.phases.total && (t.end = Date.now(), t.phases.download = t.end - t.response, t.phases.total =
        t.end - t.start);
      }), u.prependOnceListener("aborted", i);
    }), t;
  }, "timer"), v1 = b1, w1 = me(E("events"), 1), Cs = me(E("url"), 1), _1 = me(E("crypto"), 1), sb = me(E("stream"), 1), E1 = "text/plain", C1 = "\
us-ascii", sl = /* @__PURE__ */ n((e, t) => t.some((r) => r instanceof RegExp ? r.test(e) : r === e), "testParameter"), F1 = /* @__PURE__ */ new Set(
  [
    "https:",
    "http:",
    "file:"
  ]), x1 = /* @__PURE__ */ n((e) => {
    try {
      let { protocol: t } = new URL(e);
      return t.endsWith(":") && !F1.has(t);
    } catch {
      return !1;
    }
  }, "hasCustomProtocol"), S1 = /* @__PURE__ */ n((e, { stripHash: t }) => {
    var r;
    let i = /^data:(?<type>[^,]*?),(?<data>[^#]*?)(?:#(?<hash>.*))?$/.exec(e);
    if (!i)
      throw new Error(`Invalid URL: ${e}`);
    let { type: s, data: o, hash: u } = i.groups, a = s.split(";");
    u = t ? "" : u;
    let l = !1;
    a[a.length - 1] === "base64" && (a.pop(), l = !0);
    let f = ((r = a.shift()) == null ? void 0 : r.toLowerCase()) ?? "", d = [
      ...a.map((c) => {
        let [h, g = ""] = c.split("=").map((w) => w.trim());
        return h === "charset" && (g = g.toLowerCase(), g === C1) ? "" : `${h}${g ? `=${g}` : ""}`;
      }).filter(Boolean)
    ];
    return l && d.push("base64"), (d.length > 0 || f && f !== E1) && d.unshift(f), `data:${d.join(";")},${l ? o.trim() : o}${u ? `#${u}` : ""}`;
  }, "normalizeDataURL");
  function A1(e, t) {
    if (t = {
      defaultProtocol: "http",
      normalizeProtocol: !0,
      forceHttp: !1,
      forceHttps: !1,
      stripAuthentication: !0,
      stripHash: !1,
      stripTextFragment: !0,
      stripWWW: !0,
      removeQueryParameters: [/^utm_\w+/i],
      removeTrailingSlash: !0,
      removeSingleSlash: !0,
      removeDirectoryIndex: !1,
      removeExplicitPort: !1,
      sortQueryParameters: !0,
      ...t
    }, typeof t.defaultProtocol == "string" && !t.defaultProtocol.endsWith(":") && (t.defaultProtocol = `${t.defaultProtocol}:`), e = e.trim(),
    /^data:/i.test(e))
      return S1(e, t);
    if (x1(e))
      return e;
    let r = e.startsWith("//");
    !r && /^\.*\//.test(e) || (e = e.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, t.defaultProtocol));
    let s = new URL(e);
    if (t.forceHttp && t.forceHttps)
      throw new Error("The `forceHttp` and `forceHttps` options cannot be used together");
    if (t.forceHttp && s.protocol === "https:" && (s.protocol = "http:"), t.forceHttps && s.protocol === "http:" && (s.protocol = "https:"),
    t.stripAuthentication && (s.username = "", s.password = ""), t.stripHash ? s.hash = "" : t.stripTextFragment && (s.hash = s.hash.replace(
    /#?:~:text.*?$/i, "")), s.pathname) {
      let u = /\b[a-z][a-z\d+\-.]{1,50}:\/\//g, a = 0, l = "";
      for (; ; ) {
        let p = u.exec(s.pathname);
        if (!p)
          break;
        let d = p[0], c = p.index, h = s.pathname.slice(a, c);
        l += h.replace(/\/{2,}/g, "/"), l += d, a = c + d.length;
      }
      let f = s.pathname.slice(a, s.pathname.length);
      l += f.replace(/\/{2,}/g, "/"), s.pathname = l;
    }
    if (s.pathname)
      try {
        s.pathname = decodeURI(s.pathname);
      } catch {
      }
    if (t.removeDirectoryIndex === !0 && (t.removeDirectoryIndex = [/^index\.[a-z]+$/]), Array.isArray(t.removeDirectoryIndex) && t.removeDirectoryIndex.
    length > 0) {
      let u = s.pathname.split("/"), a = u[u.length - 1];
      sl(a, t.removeDirectoryIndex) && (u = u.slice(0, -1), s.pathname = u.slice(1).join("/") + "/");
    }
    if (s.hostname && (s.hostname = s.hostname.replace(/\.$/, ""), t.stripWWW && /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(s.
    hostname) && (s.hostname = s.hostname.replace(/^www\./, ""))), Array.isArray(t.removeQueryParameters))
      for (let u of [...s.searchParams.keys()])
        sl(u, t.removeQueryParameters) && s.searchParams.delete(u);
    if (!Array.isArray(t.keepQueryParameters) && t.removeQueryParameters === !0 && (s.search = ""), Array.isArray(t.keepQueryParameters) && t.
    keepQueryParameters.length > 0)
      for (let u of [...s.searchParams.keys()])
        sl(u, t.keepQueryParameters) || s.searchParams.delete(u);
    if (t.sortQueryParameters) {
      s.searchParams.sort();
      try {
        s.search = decodeURIComponent(s.search);
      } catch {
      }
    }
    t.removeTrailingSlash && (s.pathname = s.pathname.replace(/\/$/, "")), t.removeExplicitPort && s.port && (s.port = "");
    let o = e;
    return e = s.toString(), !t.removeSingleSlash && s.pathname === "/" && !o.endsWith("/") && s.hash === "" && (e = e.replace(/\/$/, "")), (t.
    removeTrailingSlash || s.pathname === "/") && s.hash === "" && t.removeSingleSlash && (e = e.replace(/\/$/, "")), r && !t.normalizeProtocol &&
    (e = e.replace(/^http:\/\//, "//")), t.stripProtocol && (e = e.replace(/^(?:https?:)?\/\//, "")), e;
  }
  n(A1, "normalizeUrl");
  var T1 = me(Wy(), 1), ol = me(B3(), 1), R1 = E("stream");
  function dl(e) {
    return Object.fromEntries(Object.entries(e).map(([t, r]) => [t.toLowerCase(), r]));
  }
  n(dl, "lowercaseKeys");
  var vy = class extends R1.Readable {
    static {
      n(this, "Response");
    }
    statusCode;
    headers;
    body;
    url;
    constructor({ statusCode: e, headers: t, body: r, url: i }) {
      if (typeof e != "number")
        throw new TypeError("Argument `statusCode` should be a number");
      if (typeof t != "object")
        throw new TypeError("Argument `headers` should be an object");
      if (!(r instanceof Uint8Array))
        throw new TypeError("Argument `body` should be a buffer");
      if (typeof i != "string")
        throw new TypeError("Argument `url` should be a string");
      super({
        read() {
          this.push(r), this.push(null);
        }
      }), this.statusCode = e, this.headers = dl(t), this.body = r, this.url = i;
    }
  }, Fs = me(O3(), 1), B1 = [
    "aborted",
    "complete",
    "headers",
    "httpVersion",
    "httpVersionMinor",
    "httpVersionMajor",
    "method",
    "rawHeaders",
    "rawTrailers",
    "setTimeout",
    "socket",
    "statusCode",
    "statusMessage",
    "trailers",
    "url"
  ];
  function k1(e, t) {
    if (t._readableState.autoDestroy)
      throw new Error("The second stream must have the `autoDestroy` option set to `false`");
    let r = /* @__PURE__ */ new Set([...Object.keys(e), ...B1]), i = {};
    for (let s of r)
      s in t || (i[s] = {
        get() {
          let o = e[s];
          return typeof o == "function" ? o.bind(e) : o;
        },
        set(o) {
          e[s] = o;
        },
        enumerable: !0,
        configurable: !1
      });
    return Object.defineProperties(t, i), e.once("aborted", () => {
      t.destroy(), t.emit("aborted");
    }), e.once("close", () => {
      e.complete && t.readable ? t.once("end", () => {
        t.emit("close");
      }) : t.emit("close");
    }), t;
  }
  n(k1, "mimicResponse");
  var O1 = class extends Error {
    static {
      n(this, "RequestError2");
    }
    constructor(e) {
      super(e.message), Object.assign(this, e);
    }
  }, Ni = class extends Error {
    static {
      n(this, "CacheError2");
    }
    constructor(e) {
      super(e.message), Object.assign(this, e);
    }
  }, P1 = class {
    static {
      n(this, "CacheableRequest");
    }
    constructor(e, t) {
      this.hooks = /* @__PURE__ */ new Map(), this.request = () => (r, i) => {
        let s;
        if (typeof r == "string")
          s = ul(Cs.default.parse(r)), r = {};
        else if (r instanceof Cs.default.URL)
          s = ul(Cs.default.parse(r.toString())), r = {};
        else {
          let [d, ...c] = (r.path ?? "").split("?"), h = c.length > 0 ? `?${c.join("?")}` : "";
          s = ul({ ...r, pathname: d, search: h });
        }
        r = {
          headers: {},
          method: "GET",
          cache: !0,
          strictTtl: !1,
          automaticFailover: !1,
          ...r,
          ...j1(s)
        }, r.headers = Object.fromEntries(q1(r.headers).map(([d, c]) => [d.toLowerCase(), c]));
        let o = new w1.default(), u = A1(Cs.default.format(s), {
          stripWWW: !1,
          removeTrailingSlash: !1,
          stripAuthentication: !1
        }), a = `${r.method}:${u}`;
        r.body && r.method !== void 0 && ["POST", "PATCH", "PUT"].includes(r.method) && (r.body instanceof sb.default.Readable ? r.cache = !1 :
        a += `:${_1.default.createHash("md5").update(r.body).digest("hex")}`);
        let l = !1, f = !1, p = /* @__PURE__ */ n((d) => {
          f = !0;
          let c = !1, h = /* @__PURE__ */ n(() => {
          }, "requestErrorCallback"), g = new Promise((y) => {
            h = /* @__PURE__ */ n(() => {
              c || (c = !0, y());
            }, "requestErrorCallback");
          }), w = /* @__PURE__ */ n(async (y) => {
            if (l) {
              y.status = y.statusCode;
              let C = ol.default.fromObject(l.cachePolicy).revalidatedPolicy(d, y);
              if (!C.modified) {
                y.resume(), await new Promise((S) => {
                  y.once("end", S);
                });
                let v = wy(C.policy.responseHeaders());
                y = new vy({ statusCode: l.statusCode, headers: v, body: l.body, url: l.url }), y.cachePolicy = C.policy, y.fromCache = !0;
              }
            }
            y.fromCache || (y.cachePolicy = new ol.default(d, y, d), y.fromCache = !1);
            let _;
            d.cache && y.cachePolicy.storable() ? (_ = M1(y), (async () => {
              try {
                let C = T1.default.buffer(y);
                await Promise.race([
                  g,
                  new Promise((F) => y.once("end", F)),
                  new Promise((F) => y.once("close", F))
                  // eslint-disable-line no-promise-executor-return
                ]);
                let v = await C, S = {
                  url: y.url,
                  statusCode: y.fromCache ? l.statusCode : y.statusCode,
                  body: v,
                  cachePolicy: y.cachePolicy.toObject()
                }, x = d.strictTtl ? y.cachePolicy.timeToLive() : void 0;
                if (d.maxTtl && (x = x ? Math.min(x, d.maxTtl) : d.maxTtl), this.hooks.size > 0)
                  for (let F of this.hooks.keys())
                    S = await this.runHook(F, S, y);
                await this.cache.set(a, S, x);
              } catch (C) {
                o.emit("error", new Ni(C));
              }
            })()) : d.cache && l && (async () => {
              try {
                await this.cache.delete(a);
              } catch (C) {
                o.emit("error", new Ni(C));
              }
            })(), o.emit("response", _ ?? y), typeof i == "function" && i(_ ?? y);
          }, "handler");
          try {
            let y = this.cacheRequest(d, w);
            y.once("error", h), y.once("abort", h), y.once("destroy", h), o.emit("request", y);
          } catch (y) {
            o.emit("error", new O1(y));
          }
        }, "makeRequest");
        return (async () => {
          let d = /* @__PURE__ */ n(async (h) => {
            await Promise.resolve();
            let g = h.cache ? await this.cache.get(a) : void 0;
            if (typeof g > "u" && !h.forceRefresh) {
              p(h);
              return;
            }
            let w = ol.default.fromObject(g.cachePolicy);
            if (w.satisfiesWithoutRevalidation(h) && !h.forceRefresh) {
              let y = wy(w.responseHeaders()), _ = new vy({ statusCode: g.statusCode, headers: y, body: g.body, url: g.url });
              _.cachePolicy = w, _.fromCache = !0, o.emit("response", _), typeof i == "function" && i(_);
            } else w.satisfiesWithoutRevalidation(h) && Date.now() >= w.timeToLive() && h.forceRefresh ? (await this.cache.delete(a), h.headers =
            w.revalidationHeaders(h), p(h)) : (l = g, h.headers = w.revalidationHeaders(h), p(h));
          }, "get"), c = /* @__PURE__ */ n((h) => o.emit("error", new Ni(h)), "errorHandler");
          if (this.cache instanceof Fs.default) {
            let h = this.cache;
            h.once("error", c), o.on("error", () => h.removeListener("error", c)), o.on("response", () => h.removeListener("error", c));
          }
          try {
            await d(r);
          } catch (h) {
            r.automaticFailover && !f && p(r), o.emit("error", new Ni(h));
          }
        })(), o;
      }, this.addHook = (r, i) => {
        this.hooks.has(r) || this.hooks.set(r, i);
      }, this.removeHook = (r) => this.hooks.delete(r), this.getHook = (r) => this.hooks.get(r), this.runHook = async (r, ...i) => {
        var s;
        return (s = this.hooks.get(r)) == null ? void 0 : s(...i);
      }, t instanceof Fs.default ? this.cache = t : typeof t == "string" ? this.cache = new Fs.default({
        uri: t,
        namespace: "cacheable-request"
      }) : this.cache = new Fs.default({
        store: t,
        namespace: "cacheable-request"
      }), this.request = this.request.bind(this), this.cacheRequest = e;
    }
  }, q1 = Object.entries, M1 = /* @__PURE__ */ n((e) => {
    let t = new sb.PassThrough({ autoDestroy: !1 });
    return k1(e, t), e.pipe(t);
  }, "cloneResponse"), j1 = /* @__PURE__ */ n((e) => {
    let t = { ...e };
    return t.path = `${e.pathname || "/"}${e.search || ""}`, delete t.pathname, delete t.search, t;
  }, "urlObjectToRequestOptions"), ul = /* @__PURE__ */ n((e) => (
    // If url was parsed by url.parse or new URL:
    // - hostname will be set
    // - host will be hostname[:port]
    // - port will be set if it was explicit in the parsed string
    // Otherwise, url was from request options:
    // - hostname or host may be set
    // - host shall not have port encoded
    {
      protocol: e.protocol,
      auth: e.auth,
      hostname: e.hostname || e.host || "localhost",
      port: e.port,
      pathname: e.pathname,
      search: e.search
    }
  ), "normalizeUrlObject"), wy = /* @__PURE__ */ n((e) => {
    let t = [];
    for (let r of Object.keys(e))
      t[r.toLowerCase()] = e[r];
    return t;
  }, "convertHeaders"), I1 = P1, L1 = me(q3(), 1), N1 = me(Wy(), 1), yt = /* @__PURE__ */ n((e) => typeof e == "function", "isFunction"), U1 = /* @__PURE__ */ n(
  (e) => yt(e[Symbol.asyncIterator]), "isAsyncIterable");
  async function* H1(e) {
    let t = e.getReader();
    for (; ; ) {
      let { done: r, value: i } = await t.read();
      if (r)
        break;
      yield i;
    }
  }
  n(H1, "readStream");
  var W1 = /* @__PURE__ */ n((e) => {
    if (U1(e))
      return e;
    if (yt(e.getReader))
      return H1(e);
    throw new TypeError("Unsupported data source: Expected either ReadableStream or async iterable.");
  }, "getStreamIterator"), _y = "abcdefghijklmnopqrstuvwxyz0123456789";
  function $1() {
    let e = 16, t = "";
    for (; e--; )
      t += _y[Math.random() * _y.length << 0];
    return t;
  }
  n($1, "createBoundary");
  var Ey = /* @__PURE__ */ n((e) => String(e).replace(/\r|\n/g, (t, r, i) => t === "\r" && i[r + 1] !== `
` || t === `
` && i[r - 1] !== "\r" ? `\r
` : t), "normalizeValue"), z1 = /* @__PURE__ */ n((e) => Object.prototype.toString.call(e).slice(8, -1).toLowerCase(), "getType");
  function Cy(e) {
    if (z1(e) !== "object")
      return !1;
    let t = Object.getPrototypeOf(e);
    return t == null ? !0 : (t.constructor && t.constructor.toString()) === Object.toString();
  }
  n(Cy, "isPlainObject");
  function Fy(e, t) {
    if (typeof t == "string") {
      for (let [r, i] of Object.entries(e))
        if (t.toLowerCase() === r.toLowerCase())
          return i;
    }
  }
  n(Fy, "getProperty");
  var V1 = /* @__PURE__ */ n((e) => new Proxy(e, {
    get: /* @__PURE__ */ n((t, r) => Fy(t, r), "get"),
    has: /* @__PURE__ */ n((t, r) => Fy(t, r) !== void 0, "has")
  }), "proxyHeaders"), ml = /* @__PURE__ */ n((e) => !!(e && yt(e.constructor) && e[Symbol.toStringTag] === "FormData" && yt(e.append) && yt(
  e.getAll) && yt(e.entries) && yt(e[Symbol.iterator])), "isFormData"), xy = /* @__PURE__ */ n((e) => String(e).replace(/\r/g, "%0D").replace(
  /\n/g, "%0A").replace(/"/g, "%22"), "escapeName"), Jt = /* @__PURE__ */ n((e) => !!(e && typeof e == "object" && yt(e.constructor) && e[Symbol.
  toStringTag] === "File" && yt(e.stream) && e.name != null), "isFile"), Pi = /* @__PURE__ */ n(function(e, t, r, i, s) {
    if (i === "m")
      throw new TypeError("Private method is not writable");
    if (i === "a" && !s)
      throw new TypeError("Private accessor was defined without a setter");
    if (typeof t == "function" ? e !== t || !s : !t.has(e))
      throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return i === "a" ? s.call(e, r) : s ? s.value = r : t.set(e, r), r;
  }, "__classPrivateFieldSet"), ie = /* @__PURE__ */ n(function(e, t, r, i) {
    if (r === "a" && !i)
      throw new TypeError("Private accessor was defined without a getter");
    if (typeof t == "function" ? e !== t || !i : !t.has(e))
      throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return r === "m" ? i : r === "a" ? i.call(e) : i ? i.value : t.get(e);
  }, "__classPrivateFieldGet"), qi, Ot, Mi, xs, ji, Kt, Ii, Li, Ss, al, Sy, G1 = {
    enableAdditionalHeaders: !1
  }, As = { writable: !1, configurable: !1 }, Y1 = class {
    static {
      n(this, "FormDataEncoder");
    }
    constructor(e, t, r) {
      if (qi.add(this), Ot.set(this, `\r
`), Mi.set(this, void 0), xs.set(this, void 0), ji.set(this, "-".repeat(2)), Kt.set(this, new TextEncoder()), Ii.set(this, void 0), Li.set(this,
      void 0), Ss.set(this, void 0), !ml(e))
        throw new TypeError("Expected first argument to be a FormData instance.");
      let i;
      if (Cy(t) ? r = t : i = t, i || (i = $1()), typeof i != "string")
        throw new TypeError("Expected boundary argument to be a string.");
      if (r && !Cy(r))
        throw new TypeError("Expected options argument to be an object.");
      Pi(this, Li, Array.from(e.entries()), "f"), Pi(this, Ss, { ...G1, ...r }, "f"), Pi(this, Mi, ie(this, Kt, "f").encode(ie(this, Ot, "f")),
      "f"), Pi(this, xs, ie(this, Mi, "f").byteLength, "f"), this.boundary = `form-data-boundary-${i}`, this.contentType = `multipart/form-d\
ata; boundary=${this.boundary}`, Pi(this, Ii, ie(this, Kt, "f").encode(`${ie(this, ji, "f")}${this.boundary}${ie(this, ji, "f")}${ie(this, Ot,
      "f").repeat(2)}`), "f");
      let s = {
        "Content-Type": this.contentType
      }, o = ie(this, qi, "m", Sy).call(this);
      o && (this.contentLength = o, s["Content-Length"] = o), this.headers = V1(Object.freeze(s)), Object.defineProperties(this, {
        boundary: As,
        contentType: As,
        contentLength: As,
        headers: As
      });
    }
    getContentLength() {
      return this.contentLength == null ? void 0 : Number(this.contentLength);
    }
    *values() {
      for (let [e, t] of ie(this, Li, "f")) {
        let r = Jt(t) ? t : ie(this, Kt, "f").encode(Ey(t));
        yield ie(this, qi, "m", al).call(this, e, r), yield r, yield ie(this, Mi, "f");
      }
      yield ie(this, Ii, "f");
    }
    async *encode() {
      for (let e of this.values())
        Jt(e) ? yield* W1(e.stream()) : yield e;
    }
    [(Ot = /* @__PURE__ */ new WeakMap(), Mi = /* @__PURE__ */ new WeakMap(), xs = /* @__PURE__ */ new WeakMap(), ji = /* @__PURE__ */ new WeakMap(),
    Kt = /* @__PURE__ */ new WeakMap(), Ii = /* @__PURE__ */ new WeakMap(), Li = /* @__PURE__ */ new WeakMap(), Ss = /* @__PURE__ */ new WeakMap(),
    qi = /* @__PURE__ */ new WeakSet(), al = /* @__PURE__ */ n(function(t, r) {
      let i = "";
      i += `${ie(this, ji, "f")}${this.boundary}${ie(this, Ot, "f")}`, i += `Content-Disposition: form-data; name="${xy(t)}"`, Jt(r) && (i +=
      `; filename="${xy(r.name)}"${ie(this, Ot, "f")}`, i += `Content-Type: ${r.type || "application/octet-stream"}`);
      let s = Jt(r) ? r.size : r.byteLength;
      return ie(this, Ss, "f").enableAdditionalHeaders === !0 && s != null && !isNaN(s) && (i += `${ie(this, Ot, "f")}Content-Length: ${Jt(r) ?
      r.size : r.byteLength}`), ie(this, Kt, "f").encode(`${i}${ie(this, Ot, "f").repeat(2)}`);
    }, "_FormDataEncoder_getFieldHeader2"), Sy = /* @__PURE__ */ n(function() {
      let t = 0;
      for (let [r, i] of ie(this, Li, "f")) {
        let s = Jt(i) ? i : ie(this, Kt, "f").encode(Ey(i)), o = Jt(s) ? s.size : s.byteLength;
        if (o == null || isNaN(o))
          return;
        t += ie(this, qi, "m", al).call(this, r, s).byteLength, t += o, t += ie(this, xs, "f");
      }
      return String(t + ie(this, Ii, "f").byteLength);
    }, "_FormDataEncoder_getContentLength2"), Symbol.iterator)]() {
      return this.values();
    }
    [Symbol.asyncIterator]() {
      return this.encode();
    }
  }, J1 = E("buffer"), K1 = E("util");
  function ob(e) {
    return m.nodeStream(e) && m.function_(e.getBoundary);
  }
  n(ob, "isFormData2");
  async function X1(e, t) {
    if (t && "content-length" in t)
      return Number(t["content-length"]);
    if (!e)
      return 0;
    if (m.string(e))
      return J1.Buffer.byteLength(e);
    if (m.buffer(e))
      return e.length;
    if (ob(e))
      return (0, K1.promisify)(e.getLength.bind(e))();
  }
  n(X1, "getBodySize");
  function ub(e, t, r) {
    let i = {};
    for (let s of r) {
      let o = /* @__PURE__ */ n((...u) => {
        t.emit(s, ...u);
      }, "eventFunction");
      i[s] = o, e.on(s, o);
    }
    return () => {
      for (let [s, o] of Object.entries(i))
        e.off(s, o);
    };
  }
  n(ub, "proxyEvents");
  var Q1 = me(E("net"), 1);
  function Z1() {
    let e = [];
    return {
      once(t, r, i) {
        t.once(r, i), e.push({ origin: t, event: r, fn: i });
      },
      unhandleAll() {
        for (let t of e) {
          let { origin: r, event: i, fn: s } = t;
          r.removeListener(i, s);
        }
        e.length = 0;
      }
    };
  }
  n(Z1, "unhandle");
  var Ay = Symbol("reentry"), eA = /* @__PURE__ */ n(() => {
  }, "noop"), ab = class extends Error {
    static {
      n(this, "TimeoutError2");
    }
    constructor(e, t) {
      super(`Timeout awaiting '${t}' for ${e}ms`), Object.defineProperty(this, "event", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: t
      }), Object.defineProperty(this, "code", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), this.name = "TimeoutError", this.code = "ETIMEDOUT";
    }
  };
  function tA(e, t, r) {
    if (Ay in e)
      return eA;
    e[Ay] = !0;
    let i = [], { once: s, unhandleAll: o } = Z1(), u = /* @__PURE__ */ n((w, y, _) => {
      var C;
      let v = setTimeout(y, w, w, _);
      (C = v.unref) == null || C.call(v);
      let S = /* @__PURE__ */ n(() => {
        clearTimeout(v);
      }, "cancel");
      return i.push(S), S;
    }, "addTimeout"), { host: a, hostname: l } = r, f = /* @__PURE__ */ n((w, y) => {
      e.destroy(new ab(w, y));
    }, "timeoutHandler"), p = /* @__PURE__ */ n(() => {
      for (let w of i)
        w();
      o();
    }, "cancelTimeouts");
    if (e.once("error", (w) => {
      if (p(), e.listenerCount("error") === 0)
        throw w;
    }), typeof t.request < "u") {
      let w = u(t.request, f, "request");
      s(e, "response", (y) => {
        s(y, "end", w);
      });
    }
    if (typeof t.socket < "u") {
      let { socket: w } = t, y = /* @__PURE__ */ n(() => {
        f(w, "socket");
      }, "socketTimeoutHandler");
      e.setTimeout(w, y), i.push(() => {
        e.removeListener("timeout", y);
      });
    }
    let d = typeof t.lookup < "u", c = typeof t.connect < "u", h = typeof t.secureConnect < "u", g = typeof t.send < "u";
    return (d || c || h || g) && s(e, "socket", (w) => {
      let { socketPath: y } = e;
      if (w.connecting) {
        let _ = !!(y ?? Q1.default.isIP(l ?? a ?? "") !== 0);
        if (d && !_ && typeof w.address().address > "u") {
          let C = u(t.lookup, f, "lookup");
          s(w, "lookup", C);
        }
        if (c) {
          let C = /* @__PURE__ */ n(() => u(t.connect, f, "connect"), "timeConnect");
          _ ? s(w, "connect", C()) : s(w, "lookup", (v) => {
            v === null && s(w, "connect", C());
          });
        }
        h && r.protocol === "https:" && s(w, "connect", () => {
          let C = u(t.secureConnect, f, "secureConnect");
          s(w, "secureConnect", C);
        });
      }
      if (g) {
        let _ = /* @__PURE__ */ n(() => u(t.send, f, "send"), "timeRequest");
        w.connecting ? s(w, "connect", () => {
          s(e, "upload-complete", _());
        }) : s(e, "upload-complete", _());
      }
    }), typeof t.response < "u" && s(e, "upload-complete", () => {
      let w = u(t.response, f, "response");
      s(e, "response", w);
    }), typeof t.read < "u" && s(e, "response", (w) => {
      let y = u(t.read, f, "read");
      s(w, "end", y);
    }), p;
  }
  n(tA, "timedOut");
  function rA(e) {
    e = e;
    let t = {
      protocol: e.protocol,
      hostname: m.string(e.hostname) && e.hostname.startsWith("[") ? e.hostname.slice(1, -1) : e.hostname,
      host: e.host,
      hash: e.hash,
      search: e.search,
      pathname: e.pathname,
      href: e.href,
      path: `${e.pathname || ""}${e.search || ""}`
    };
    return m.string(e.port) && e.port.length > 0 && (t.port = Number(e.port)), (e.username || e.password) && (t.auth = `${e.username || ""}:${e.
    password || ""}`), t;
  }
  n(rA, "urlToOptions");
  var iA = class {
    static {
      n(this, "WeakableMap");
    }
    constructor() {
      Object.defineProperty(this, "weakMap", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "map", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), this.weakMap = /* @__PURE__ */ new WeakMap(), this.map = /* @__PURE__ */ new Map();
    }
    set(e, t) {
      typeof e == "object" ? this.weakMap.set(e, t) : this.map.set(e, t);
    }
    get(e) {
      return typeof e == "object" ? this.weakMap.get(e) : this.map.get(e);
    }
    has(e) {
      return typeof e == "object" ? this.weakMap.has(e) : this.map.has(e);
    }
  }, nA = /* @__PURE__ */ n(({ attemptCount: e, retryOptions: t, error: r, retryAfter: i, computedValue: s }) => {
    if (r.name === "RetryError")
      return 1;
    if (e > t.limit)
      return 0;
    let o = t.methods.includes(r.options.method), u = t.errorCodes.includes(r.code), a = r.response && t.statusCodes.includes(r.response.statusCode);
    if (!o || !u && !a)
      return 0;
    if (r.response) {
      if (i)
        return i > s ? 0 : i;
      if (r.response.statusCode === 413)
        return 0;
    }
    let l = Math.random() * t.noise;
    return Math.min(2 ** (e - 1) * 1e3, t.backoffLimit) + l;
  }, "calculateRetryDelay"), sA = nA, oA = me(E("process"), 1), ll = E("util"), Xt = E("url"), uA = E("tls"), aA = me(E("http"), 1), lA = me(
  E("https"), 1), kr = E("dns"), fl = E("util"), fA = me(E("os"), 1), { Resolver: Ty } = kr.promises, Br = Symbol("cacheableLookupCreateConn\
ection"), hl = Symbol("cacheableLookupInstance"), Ry = Symbol("expires"), hA = typeof kr.ALL == "number", By = /* @__PURE__ */ n((e) => {
    if (!(e && typeof e.createConnection == "function"))
      throw new Error("Expected an Agent instance as the first argument");
  }, "verifyAgent"), cA = /* @__PURE__ */ n((e) => {
    for (let t of e)
      t.family !== 6 && (t.address = `::ffff:${t.address}`, t.family = 6);
  }, "map4to6"), ky = /* @__PURE__ */ n(() => {
    let e = !1, t = !1;
    for (let r of Object.values(fA.default.networkInterfaces()))
      for (let i of r)
        if (!i.internal && (i.family === "IPv6" ? t = !0 : e = !0, e && t))
          return { has4: e, has6: t };
    return { has4: e, has6: t };
  }, "getIfaceInfo"), dA = /* @__PURE__ */ n((e) => Symbol.iterator in e, "isIterable"), Ts = /* @__PURE__ */ n((e) => e.catch((t) => {
    if (t.code === "ENODATA" || t.code === "ENOTFOUND" || t.code === "ENOENT")
      return [];
    throw t;
  }), "ignoreNoResultErrors"), Oy = { ttl: !0 }, pA = { all: !0 }, DA = { all: !0, family: 4 }, mA = { all: !0, family: 6 }, gA = class {
    static {
      n(this, "CacheableLookup");
    }
    constructor({
      cache: e = /* @__PURE__ */ new Map(),
      maxTtl: t = 1 / 0,
      fallbackDuration: r = 3600,
      errorTtl: i = 0.15,
      resolver: s = new Ty(),
      lookup: o = kr.lookup
    } = {}) {
      if (this.maxTtl = t, this.errorTtl = i, this._cache = e, this._resolver = s, this._dnsLookup = o && (0, fl.promisify)(o), this.stats =
      {
        cache: 0,
        query: 0
      }, this._resolver instanceof Ty ? (this._resolve4 = this._resolver.resolve4.bind(this._resolver), this._resolve6 = this._resolver.resolve6.
      bind(this._resolver)) : (this._resolve4 = (0, fl.promisify)(this._resolver.resolve4.bind(this._resolver)), this._resolve6 = (0, fl.promisify)(
      this._resolver.resolve6.bind(this._resolver))), this._iface = ky(), this._pending = {}, this._nextRemovalTime = !1, this._hostnamesToFallback =
      /* @__PURE__ */ new Set(), this.fallbackDuration = r, r > 0) {
        let u = setInterval(() => {
          this._hostnamesToFallback.clear();
        }, r * 1e3);
        u.unref && u.unref(), this._fallbackInterval = u;
      }
      this.lookup = this.lookup.bind(this), this.lookupAsync = this.lookupAsync.bind(this);
    }
    set servers(e) {
      this.clear(), this._resolver.setServers(e);
    }
    get servers() {
      return this._resolver.getServers();
    }
    lookup(e, t, r) {
      if (typeof t == "function" ? (r = t, t = {}) : typeof t == "number" && (t = {
        family: t
      }), !r)
        throw new Error("Callback must be a function.");
      this.lookupAsync(e, t).then((i) => {
        t.all ? r(null, i) : r(null, i.address, i.family, i.expires, i.ttl, i.source);
      }, r);
    }
    async lookupAsync(e, t = {}) {
      typeof t == "number" && (t = {
        family: t
      });
      let r = await this.query(e);
      if (t.family === 6) {
        let i = r.filter((s) => s.family === 6);
        t.hints & kr.V4MAPPED && (hA && t.hints & kr.ALL || i.length === 0) ? cA(r) : r = i;
      } else t.family === 4 && (r = r.filter((i) => i.family === 4));
      if (t.hints & kr.ADDRCONFIG) {
        let { _iface: i } = this;
        r = r.filter((s) => s.family === 6 ? i.has6 : i.has4);
      }
      if (r.length === 0) {
        let i = new Error(`cacheableLookup ENOTFOUND ${e}`);
        throw i.code = "ENOTFOUND", i.hostname = e, i;
      }
      return t.all ? r : r[0];
    }
    async query(e) {
      let t = "cache", r = await this._cache.get(e);
      if (r && this.stats.cache++, !r) {
        let i = this._pending[e];
        if (i)
          this.stats.cache++, r = await i;
        else {
          t = "query";
          let s = this.queryAndCache(e);
          this._pending[e] = s, this.stats.query++;
          try {
            r = await s;
          } finally {
            delete this._pending[e];
          }
        }
      }
      return r = r.map((i) => ({ ...i, source: t })), r;
    }
    async _resolve(e) {
      let [t, r] = await Promise.all([
        Ts(this._resolve4(e, Oy)),
        Ts(this._resolve6(e, Oy))
      ]), i = 0, s = 0, o = 0, u = Date.now();
      for (let a of t)
        a.family = 4, a.expires = u + a.ttl * 1e3, i = Math.max(i, a.ttl);
      for (let a of r)
        a.family = 6, a.expires = u + a.ttl * 1e3, s = Math.max(s, a.ttl);
      return t.length > 0 ? r.length > 0 ? o = Math.min(i, s) : o = i : o = s, {
        entries: [
          ...t,
          ...r
        ],
        cacheTtl: o
      };
    }
    async _lookup(e) {
      try {
        let [t, r] = await Promise.all([
          // Passing {all: true} doesn't return all IPv4 and IPv6 entries.
          // See https://github.com/szmarczak/cacheable-lookup/issues/42
          Ts(this._dnsLookup(e, DA)),
          Ts(this._dnsLookup(e, mA))
        ]);
        return {
          entries: [
            ...t,
            ...r
          ],
          cacheTtl: 0
        };
      } catch {
        return {
          entries: [],
          cacheTtl: 0
        };
      }
    }
    async _set(e, t, r) {
      if (this.maxTtl > 0 && r > 0) {
        r = Math.min(r, this.maxTtl) * 1e3, t[Ry] = Date.now() + r;
        try {
          await this._cache.set(e, t, r);
        } catch (i) {
          this.lookupAsync = async () => {
            let s = new Error("Cache Error. Please recreate the CacheableLookup instance.");
            throw s.cause = i, s;
          };
        }
        dA(this._cache) && this._tick(r);
      }
    }
    async queryAndCache(e) {
      if (this._hostnamesToFallback.has(e))
        return this._dnsLookup(e, pA);
      let t = await this._resolve(e);
      t.entries.length === 0 && this._dnsLookup && (t = await this._lookup(e), t.entries.length !== 0 && this.fallbackDuration > 0 && this._hostnamesToFallback.
      add(e));
      let r = t.entries.length === 0 ? this.errorTtl : t.cacheTtl;
      return await this._set(e, t.entries, r), t.entries;
    }
    _tick(e) {
      let t = this._nextRemovalTime;
      (!t || e < t) && (clearTimeout(this._removalTimeout), this._nextRemovalTime = e, this._removalTimeout = setTimeout(() => {
        this._nextRemovalTime = !1;
        let r = 1 / 0, i = Date.now();
        for (let [s, o] of this._cache) {
          let u = o[Ry];
          i >= u ? this._cache.delete(s) : u < r && (r = u);
        }
        r !== 1 / 0 && this._tick(r - i);
      }, e), this._removalTimeout.unref && this._removalTimeout.unref());
    }
    install(e) {
      if (By(e), Br in e)
        throw new Error("CacheableLookup has been already installed");
      e[Br] = e.createConnection, e[hl] = this, e.createConnection = (t, r) => ("lookup" in t || (t.lookup = this.lookup), e[Br](t, r));
    }
    uninstall(e) {
      if (By(e), e[Br]) {
        if (e[hl] !== this)
          throw new Error("The agent is not owned by this CacheableLookup instance");
        e.createConnection = e[Br], delete e[Br], delete e[hl];
      }
    }
    updateInterfaceInfo() {
      let { _iface: e } = this;
      this._iface = ky(), (e.has4 && !this._iface.has4 || e.has6 && !this._iface.has6) && this._cache.clear();
    }
    clear(e) {
      if (e) {
        this._cache.delete(e);
        return;
      }
      this._cache.clear();
    }
  }, yA = me(V3(), 1);
  function bA(e) {
    let t = [], r = e.split(",");
    for (let i of r) {
      let [s, ...o] = i.split(";"), u = s.trim();
      if (u[0] !== "<" || u[u.length - 1] !== ">")
        throw new Error(`Invalid format of the Link header reference: ${u}`);
      let a = u.slice(1, -1), l = {};
      if (o.length === 0)
        throw new Error(`Unexpected end of Link header parameters: ${o.join(";")}`);
      for (let f of o) {
        let p = f.trim(), d = p.indexOf("=");
        if (d === -1)
          throw new Error(`Failed to parse Link header: ${e}`);
        let c = p.slice(0, d).trim(), h = p.slice(d + 1).trim();
        l[c] = h;
      }
      t.push({
        reference: a,
        parameters: l
      });
    }
    return t;
  }
  n(bA, "parseLinkHeader");
  var [Py, vA] = oA.default.versions.node.split(".").map(Number);
  function wA(e) {
    for (let t in e) {
      let r = e[t];
      A.any([m.string, m.number, m.boolean, m.null_, m.undefined], r);
    }
  }
  n(wA, "validateSearchParameters");
  var _A = /* @__PURE__ */ new Map(), Rs, EA = /* @__PURE__ */ n(() => Rs || (Rs = new gA(), Rs), "getGlobalDnsCache"), CA = {
    request: void 0,
    agent: {
      http: void 0,
      https: void 0,
      http2: void 0
    },
    h2session: void 0,
    decompress: !0,
    timeout: {
      connect: void 0,
      lookup: void 0,
      read: void 0,
      request: void 0,
      response: void 0,
      secureConnect: void 0,
      send: void 0,
      socket: void 0
    },
    prefixUrl: "",
    body: void 0,
    form: void 0,
    json: void 0,
    cookieJar: void 0,
    ignoreInvalidCookies: !1,
    searchParams: void 0,
    dnsLookup: void 0,
    dnsCache: void 0,
    context: {},
    hooks: {
      init: [],
      beforeRequest: [],
      beforeError: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: []
    },
    followRedirect: !0,
    maxRedirects: 10,
    cache: void 0,
    throwHttpErrors: !0,
    username: "",
    password: "",
    http2: !1,
    allowGetBody: !1,
    headers: {
      "user-agent": "got (https://github.com/sindresorhus/got)"
    },
    methodRewriting: !1,
    dnsLookupIpVersion: void 0,
    parseJson: JSON.parse,
    stringifyJson: JSON.stringify,
    retry: {
      limit: 2,
      methods: [
        "GET",
        "PUT",
        "HEAD",
        "DELETE",
        "OPTIONS",
        "TRACE"
      ],
      statusCodes: [
        408,
        413,
        429,
        500,
        502,
        503,
        504,
        521,
        522,
        524
      ],
      errorCodes: [
        "ETIMEDOUT",
        "ECONNRESET",
        "EADDRINUSE",
        "ECONNREFUSED",
        "EPIPE",
        "ENOTFOUND",
        "ENETUNREACH",
        "EAI_AGAIN"
      ],
      maxRetryAfter: void 0,
      calculateDelay: /* @__PURE__ */ n(({ computedValue: e }) => e, "calculateDelay"),
      backoffLimit: Number.POSITIVE_INFINITY,
      noise: 100
    },
    localAddress: void 0,
    method: "GET",
    createConnection: void 0,
    cacheOptions: {
      shared: void 0,
      cacheHeuristic: void 0,
      immutableMinTimeToLive: void 0,
      ignoreCargoCult: void 0
    },
    https: {
      alpnProtocols: void 0,
      rejectUnauthorized: void 0,
      checkServerIdentity: void 0,
      certificateAuthority: void 0,
      key: void 0,
      certificate: void 0,
      passphrase: void 0,
      pfx: void 0,
      ciphers: void 0,
      honorCipherOrder: void 0,
      minVersion: void 0,
      maxVersion: void 0,
      signatureAlgorithms: void 0,
      tlsSessionLifetime: void 0,
      dhparam: void 0,
      ecdhCurve: void 0,
      certificateRevocationLists: void 0
    },
    encoding: void 0,
    resolveBodyOnly: !1,
    isStream: !1,
    responseType: "text",
    url: void 0,
    pagination: {
      transform(e) {
        return e.request.options.responseType === "json" ? e.body : JSON.parse(e.body);
      },
      paginate({ response: e }) {
        let t = e.headers.link;
        if (typeof t != "string" || t.trim() === "")
          return !1;
        let i = bA(t).find((s) => s.parameters.rel === "next" || s.parameters.rel === '"next"');
        return i ? {
          url: new Xt.URL(i.reference, e.url)
        } : !1;
      },
      filter: /* @__PURE__ */ n(() => !0, "filter"),
      shouldContinue: /* @__PURE__ */ n(() => !0, "shouldContinue"),
      countLimit: Number.POSITIVE_INFINITY,
      backoff: 0,
      requestLimit: 1e4,
      stackAllItems: !1
    },
    setHost: !0,
    maxHeaderSize: void 0,
    signal: void 0,
    enableUnixSockets: !0
  }, FA = /* @__PURE__ */ n((e) => {
    let { hooks: t, retry: r } = e, i = {
      ...e,
      context: { ...e.context },
      cacheOptions: { ...e.cacheOptions },
      https: { ...e.https },
      agent: { ...e.agent },
      headers: { ...e.headers },
      retry: {
        ...r,
        errorCodes: [...r.errorCodes],
        methods: [...r.methods],
        statusCodes: [...r.statusCodes]
      },
      timeout: { ...e.timeout },
      hooks: {
        init: [...t.init],
        beforeRequest: [...t.beforeRequest],
        beforeError: [...t.beforeError],
        beforeRedirect: [...t.beforeRedirect],
        beforeRetry: [...t.beforeRetry],
        afterResponse: [...t.afterResponse]
      },
      searchParams: e.searchParams ? new Xt.URLSearchParams(e.searchParams) : void 0,
      pagination: { ...e.pagination }
    };
    return i.url !== void 0 && (i.prefixUrl = ""), i;
  }, "cloneInternals"), xA = /* @__PURE__ */ n((e) => {
    let { hooks: t, retry: r } = e, i = { ...e };
    return m.object(e.context) && (i.context = { ...e.context }), m.object(e.cacheOptions) && (i.cacheOptions = { ...e.cacheOptions }), m.object(
    e.https) && (i.https = { ...e.https }), m.object(e.cacheOptions) && (i.cacheOptions = { ...i.cacheOptions }), m.object(e.agent) && (i.agent =
    { ...e.agent }), m.object(e.headers) && (i.headers = { ...e.headers }), m.object(r) && (i.retry = { ...r }, m.array(r.errorCodes) && (i.
    retry.errorCodes = [...r.errorCodes]), m.array(r.methods) && (i.retry.methods = [...r.methods]), m.array(r.statusCodes) && (i.retry.statusCodes =
    [...r.statusCodes])), m.object(e.timeout) && (i.timeout = { ...e.timeout }), m.object(t) && (i.hooks = {
      ...t
    }, m.array(t.init) && (i.hooks.init = [...t.init]), m.array(t.beforeRequest) && (i.hooks.beforeRequest = [...t.beforeRequest]), m.array(
    t.beforeError) && (i.hooks.beforeError = [...t.beforeError]), m.array(t.beforeRedirect) && (i.hooks.beforeRedirect = [...t.beforeRedirect]),
    m.array(t.beforeRetry) && (i.hooks.beforeRetry = [...t.beforeRetry]), m.array(t.afterResponse) && (i.hooks.afterResponse = [...t.afterResponse])),
    m.object(e.pagination) && (i.pagination = { ...e.pagination }), i;
  }, "cloneRaw"), SA = /* @__PURE__ */ n((e) => {
    let t = [e.timeout.socket, e.timeout.connect, e.timeout.lookup, e.timeout.request, e.timeout.secureConnect].filter((r) => typeof r == "n\
umber");
    if (t.length > 0)
      return Math.min(...t);
  }, "getHttp2TimeoutOption"), qy = /* @__PURE__ */ n((e, t, r) => {
    var i;
    let s = (i = e.hooks) == null ? void 0 : i.init;
    if (s)
      for (let o of s)
        o(t, r);
  }, "init"), bt = class {
    static {
      n(this, "Options");
    }
    constructor(e, t, r) {
      if (Object.defineProperty(this, "_unixOptions", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_internals", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_merging", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_init", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), A.any([m.string, m.urlInstance, m.object, m.undefined], e), A.any([m.object, m.undefined], t), A.any([m.object, m.undefined], r), e instanceof
      bt || t instanceof bt)
        throw new TypeError("The defaults must be passed as the third argument");
      this._internals = FA(r?._internals ?? r ?? CA), this._init = [...r?._init ?? []], this._merging = !1, this._unixOptions = void 0;
      try {
        if (m.plainObject(e))
          try {
            this.merge(e), this.merge(t);
          } finally {
            this.url = e.url;
          }
        else
          try {
            this.merge(t);
          } finally {
            if (t?.url !== void 0)
              if (e === void 0)
                this.url = t.url;
              else
                throw new TypeError("The `url` option is mutually exclusive with the `input` argument");
            else e !== void 0 && (this.url = e);
          }
      } catch (i) {
        throw i.options = this, i;
      }
    }
    merge(e) {
      if (e) {
        if (e instanceof bt) {
          for (let t of e._init)
            this.merge(t);
          return;
        }
        e = xA(e), qy(this, e, this), qy(e, e, this), this._merging = !0, "isStream" in e && (this.isStream = e.isStream);
        try {
          let t = !1;
          for (let r in e)
            if (!(r === "mutableDefaults" || r === "handlers") && r !== "url") {
              if (!(r in this))
                throw new Error(`Unexpected option: ${r}`);
              this[r] = e[r], t = !0;
            }
          t && this._init.push(e);
        } finally {
          this._merging = !1;
        }
      }
    }
    /**
        Custom request function.
        The main purpose of this is to [support HTTP2 using a wrapper](https://github.com/szmarczak/http2-wrapper).
    
        @default http.request | https.request
        */
    get request() {
      return this._internals.request;
    }
    set request(e) {
      A.any([m.function_, m.undefined], e), this._internals.request = e;
    }
    /**
        An object representing `http`, `https` and `http2` keys for [`http.Agent`](https://nodejs.org/api/http.html#http_class_http_agent), [`https.Agent`](https://nodejs.org/api/https.html#https_class_https_agent) and [`http2wrapper.Agent`](https://github.com/szmarczak/http2-wrapper#new-http2agentoptions) instance.
        This is necessary because a request to one protocol might redirect to another.
        In such a scenario, Got will switch over to the right protocol agent for you.
    
        If a key is not present, it will default to a global agent.
    
        @example
        ```
        import got from 'got';
        import HttpAgent from 'agentkeepalive';
    
        const {HttpsAgent} = HttpAgent;
    
        await got('https://sindresorhus.com', {
            agent: {
                http: new HttpAgent(),
                https: new HttpsAgent()
            }
        });
        ```
        */
    get agent() {
      return this._internals.agent;
    }
    set agent(e) {
      A.plainObject(e);
      for (let t in e) {
        if (!(t in this._internals.agent))
          throw new TypeError(`Unexpected agent option: ${t}`);
        A.any([m.object, m.undefined], e[t]);
      }
      this._merging ? Object.assign(this._internals.agent, e) : this._internals.agent = { ...e };
    }
    get h2session() {
      return this._internals.h2session;
    }
    set h2session(e) {
      this._internals.h2session = e;
    }
    /**
        Decompress the response automatically.
    
        This will set the `accept-encoding` header to `gzip, deflate, br` unless you set it yourself.
    
        If this is disabled, a compressed response is returned as a `Buffer`.
        This may be useful if you want to handle decompression yourself or stream the raw compressed data.
    
        @default true
        */
    get decompress() {
      return this._internals.decompress;
    }
    set decompress(e) {
      A.boolean(e), this._internals.decompress = e;
    }
    /**
        Milliseconds to wait for the server to end the response before aborting the request with `got.TimeoutError` error (a.k.a. `request` property).
        By default, there's no timeout.
    
        This also accepts an `object` with the following fields to constrain the duration of each phase of the request lifecycle:
    
        - `lookup` starts when a socket is assigned and ends when the hostname has been resolved.
            Does not apply when using a Unix domain socket.
        - `connect` starts when `lookup` completes (or when the socket is assigned if lookup does not apply to the request) and ends when the socket is connected.
        - `secureConnect` starts when `connect` completes and ends when the handshaking process completes (HTTPS only).
        - `socket` starts when the socket is connected. See [request.setTimeout](https://nodejs.org/api/http.html#http_request_settimeout_timeout_callback).
        - `response` starts when the request has been written to the socket and ends when the response headers are received.
        - `send` starts when the socket is connected and ends with the request has been written to the socket.
        - `request` starts when the request is initiated and ends when the response's end event fires.
        */
    get timeout() {
      return this._internals.timeout;
    }
    set timeout(e) {
      A.plainObject(e);
      for (let t in e) {
        if (!(t in this._internals.timeout))
          throw new Error(`Unexpected timeout option: ${t}`);
        A.any([m.number, m.undefined], e[t]);
      }
      this._merging ? Object.assign(this._internals.timeout, e) : this._internals.timeout = { ...e };
    }
    /**
        When specified, `prefixUrl` will be prepended to `url`.
        The prefix can be any valid URL, either relative or absolute.
        A trailing slash `/` is optional - one will be added automatically.
    
        __Note__: `prefixUrl` will be ignored if the `url` argument is a URL instance.
    
        __Note__: Leading slashes in `input` are disallowed when using this option to enforce consistency and avoid confusion.
        For example, when the prefix URL is `https://example.com/foo` and the input is `/bar`, there's ambiguity whether the resulting URL would become `https://example.com/foo/bar` or `https://example.com/bar`.
        The latter is used by browsers.
    
        __Tip__: Useful when used with `got.extend()` to create niche-specific Got instances.
    
        __Tip__: You can change `prefixUrl` using hooks as long as the URL still includes the `prefixUrl`.
        If the URL doesn't include it anymore, it will throw.
    
        @example
        ```
        import got from 'got';
    
        await got('unicorn', {prefixUrl: 'https://cats.com'});
        //=> 'https://cats.com/unicorn'
    
        const instance = got.extend({
            prefixUrl: 'https://google.com'
        });
    
        await instance('unicorn', {
            hooks: {
                beforeRequest: [
                    options => {
                        options.prefixUrl = 'https://cats.com';
                    }
                ]
            }
        });
        //=> 'https://cats.com/unicorn'
        ```
        */
    get prefixUrl() {
      return this._internals.prefixUrl;
    }
    set prefixUrl(e) {
      if (A.any([m.string, m.urlInstance], e), e === "") {
        this._internals.prefixUrl = "";
        return;
      }
      if (e = e.toString(), e.endsWith("/") || (e += "/"), this._internals.prefixUrl && this._internals.url) {
        let { href: t } = this._internals.url;
        this._internals.url.href = e + t.slice(this._internals.prefixUrl.length);
      }
      this._internals.prefixUrl = e;
    }
    /**
        __Note #1__: The `body` option cannot be used with the `json` or `form` option.
    
        __Note #2__: If you provide this option, `got.stream()` will be read-only.
    
        __Note #3__: If you provide a payload with the `GET` or `HEAD` method, it will throw a `TypeError` unless the method is `GET` and the `allowGetBody` option is set to `true`.
    
        __Note #4__: This option is not enumerable and will not be merged with the instance defaults.
    
        The `content-length` header will be automatically set if `body` is a `string` / `Buffer` / [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) / [`form-data` instance](https://github.com/form-data/form-data), and `content-length` and `transfer-encoding` are not manually set in `options.headers`.
    
        Since Got 12, the `content-length` is not automatically set when `body` is a `fs.createReadStream`.
        */
    get body() {
      return this._internals.body;
    }
    set body(e) {
      A.any([m.string, m.buffer, m.nodeStream, m.generator, m.asyncGenerator, ml, m.undefined], e), m.nodeStream(e) && A.truthy(e.readable),
      e !== void 0 && (A.undefined(this._internals.form), A.undefined(this._internals.json)), this._internals.body = e;
    }
    /**
        The form body is converted to a query string using [`(new URLSearchParams(object)).toString()`](https://nodejs.org/api/url.html#url_constructor_new_urlsearchparams_obj).
    
        If the `Content-Type` header is not present, it will be set to `application/x-www-form-urlencoded`.
    
        __Note #1__: If you provide this option, `got.stream()` will be read-only.
    
        __Note #2__: This option is not enumerable and will not be merged with the instance defaults.
        */
    get form() {
      return this._internals.form;
    }
    set form(e) {
      A.any([m.plainObject, m.undefined], e), e !== void 0 && (A.undefined(this._internals.body), A.undefined(this._internals.json)), this._internals.
      form = e;
    }
    /**
        JSON body. If the `Content-Type` header is not set, it will be set to `application/json`.
    
        __Note #1__: If you provide this option, `got.stream()` will be read-only.
    
        __Note #2__: This option is not enumerable and will not be merged with the instance defaults.
        */
    get json() {
      return this._internals.json;
    }
    set json(e) {
      e !== void 0 && (A.undefined(this._internals.body), A.undefined(this._internals.form)), this._internals.json = e;
    }
    /**
        The URL to request, as a string, a [`https.request` options object](https://nodejs.org/api/https.html#https_https_request_options_callback), or a [WHATWG `URL`](https://nodejs.org/api/url.html#url_class_url).
    
        Properties from `options` will override properties in the parsed `url`.
    
        If no protocol is specified, it will throw a `TypeError`.
    
        __Note__: The query string is **not** parsed as search params.
    
        @example
        ```
        await got('https://example.com/?query=a b'); //=> https://example.com/?query=a%20b
        await got('https://example.com/', {searchParams: {query: 'a b'}}); //=> https://example.com/?query=a+b
    
        // The query string is overridden by `searchParams`
        await got('https://example.com/?query=a b', {searchParams: {query: 'a b'}}); //=> https://example.com/?query=a+b
        ```
        */
    get url() {
      return this._internals.url;
    }
    set url(e) {
      if (A.any([m.string, m.urlInstance, m.undefined], e), e === void 0) {
        this._internals.url = void 0;
        return;
      }
      if (m.string(e) && e.startsWith("/"))
        throw new Error("`url` must not start with a slash");
      let t = `${this.prefixUrl}${e.toString()}`, r = new Xt.URL(t);
      if (this._internals.url = r, decodeURI(t), r.protocol === "unix:" && (r.href = `http://unix${r.pathname}${r.search}`), r.protocol !== "\
http:" && r.protocol !== "https:") {
        let i = new Error(`Unsupported protocol: ${r.protocol}`);
        throw i.code = "ERR_UNSUPPORTED_PROTOCOL", i;
      }
      if (this._internals.username && (r.username = this._internals.username, this._internals.username = ""), this._internals.password && (r.
      password = this._internals.password, this._internals.password = ""), this._internals.searchParams && (r.search = this._internals.searchParams.
      toString(), this._internals.searchParams = void 0), r.hostname === "unix") {
        if (!this._internals.enableUnixSockets)
          throw new Error("Using UNIX domain sockets but option `enableUnixSockets` is not enabled");
        let i = /(?<socketPath>.+?):(?<path>.+)/.exec(`${r.pathname}${r.search}`);
        if (i?.groups) {
          let { socketPath: s, path: o } = i.groups;
          this._unixOptions = {
            socketPath: s,
            path: o,
            host: ""
          };
        } else
          this._unixOptions = void 0;
        return;
      }
      this._unixOptions = void 0;
    }
    /**
        Cookie support. You don't have to care about parsing or how to store them.
    
        __Note__: If you provide this option, `options.headers.cookie` will be overridden.
        */
    get cookieJar() {
      return this._internals.cookieJar;
    }
    set cookieJar(e) {
      if (A.any([m.object, m.undefined], e), e === void 0) {
        this._internals.cookieJar = void 0;
        return;
      }
      let { setCookie: t, getCookieString: r } = e;
      A.function_(t), A.function_(r), t.length === 4 && r.length === 0 ? (t = (0, ll.promisify)(t.bind(e)), r = (0, ll.promisify)(r.bind(e)),
      this._internals.cookieJar = {
        setCookie: t,
        getCookieString: r
      }) : this._internals.cookieJar = e;
    }
    /**
        You can abort the `request` using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
    
        *Requires Node.js 16 or later.*
    
        @example
        ```
        import got from 'got';
    
        const abortController = new AbortController();
    
        const request = got('https://httpbin.org/anything', {
            signal: abortController.signal
        });
    
        setTimeout(() => {
            abortController.abort();
        }, 100);
        ```
        */
    // TODO: Replace `any` with `AbortSignal` when targeting Node 16.
    get signal() {
      return this._internals.signal;
    }
    // TODO: Replace `any` with `AbortSignal` when targeting Node 16.
    set signal(e) {
      A.object(e), this._internals.signal = e;
    }
    /**
        Ignore invalid cookies instead of throwing an error.
        Only useful when the `cookieJar` option has been set. Not recommended.
    
        @default false
        */
    get ignoreInvalidCookies() {
      return this._internals.ignoreInvalidCookies;
    }
    set ignoreInvalidCookies(e) {
      A.boolean(e), this._internals.ignoreInvalidCookies = e;
    }
    /**
        Query string that will be added to the request URL.
        This will override the query string in `url`.
    
        If you need to pass in an array, you can do it using a `URLSearchParams` instance.
    
        @example
        ```
        import got from 'got';
    
        const searchParams = new URLSearchParams([['key', 'a'], ['key', 'b']]);
    
        await got('https://example.com', {searchParams});
    
        console.log(searchParams.toString());
        //=> 'key=a&key=b'
        ```
        */
    get searchParams() {
      return this._internals.url ? this._internals.url.searchParams : (this._internals.searchParams === void 0 && (this._internals.searchParams =
      new Xt.URLSearchParams()), this._internals.searchParams);
    }
    set searchParams(e) {
      A.any([m.string, m.object, m.undefined], e);
      let t = this._internals.url;
      if (e === void 0) {
        this._internals.searchParams = void 0, t && (t.search = "");
        return;
      }
      let r = this.searchParams, i;
      if (m.string(e))
        i = new Xt.URLSearchParams(e);
      else if (e instanceof Xt.URLSearchParams)
        i = e;
      else {
        wA(e), i = new Xt.URLSearchParams();
        for (let s in e) {
          let o = e[s];
          o === null ? i.append(s, "") : o === void 0 ? r.delete(s) : i.append(s, o);
        }
      }
      if (this._merging) {
        for (let s of i.keys())
          r.delete(s);
        for (let [s, o] of i)
          r.append(s, o);
      } else t ? t.search = r.toString() : this._internals.searchParams = r;
    }
    get searchParameters() {
      throw new Error("The `searchParameters` option does not exist. Use `searchParams` instead.");
    }
    set searchParameters(e) {
      throw new Error("The `searchParameters` option does not exist. Use `searchParams` instead.");
    }
    get dnsLookup() {
      return this._internals.dnsLookup;
    }
    set dnsLookup(e) {
      A.any([m.function_, m.undefined], e), this._internals.dnsLookup = e;
    }
    /**
        An instance of [`CacheableLookup`](https://github.com/szmarczak/cacheable-lookup) used for making DNS lookups.
        Useful when making lots of requests to different *public* hostnames.
    
        `CacheableLookup` uses `dns.resolver4(..)` and `dns.resolver6(...)` under the hood and fall backs to `dns.lookup(...)` when the first two fail, which may lead to additional delay.
    
        __Note__: This should stay disabled when making requests to internal hostnames such as `localhost`, `database.local` etc.
    
        @default false
        */
    get dnsCache() {
      return this._internals.dnsCache;
    }
    set dnsCache(e) {
      A.any([m.object, m.boolean, m.undefined], e), e === !0 ? this._internals.dnsCache = EA() : e === !1 ? this._internals.dnsCache = void 0 :
      this._internals.dnsCache = e;
    }
    /**
        User data. `context` is shallow merged and enumerable. If it contains non-enumerable properties they will NOT be merged.
    
        @example
        ```
        import got from 'got';
    
        const instance = got.extend({
            hooks: {
                beforeRequest: [
                    options => {
                        if (!options.context || !options.context.token) {
                            throw new Error('Token required');
                        }
    
                        options.headers.token = options.context.token;
                    }
                ]
            }
        });
    
        const context = {
            token: 'secret'
        };
    
        const response = await instance('https://httpbin.org/headers', {context});
    
        // Let's see the headers
        console.log(response.body);
        ```
        */
    get context() {
      return this._internals.context;
    }
    set context(e) {
      A.object(e), this._merging ? Object.assign(this._internals.context, e) : this._internals.context = { ...e };
    }
    /**
    Hooks allow modifications during the request lifecycle.
    Hook functions may be async and are run serially.
    */
    get hooks() {
      return this._internals.hooks;
    }
    set hooks(e) {
      A.object(e);
      for (let t in e) {
        if (!(t in this._internals.hooks))
          throw new Error(`Unexpected hook event: ${t}`);
        let r = t, i = e[r];
        if (A.any([m.array, m.undefined], i), i)
          for (let s of i)
            A.function_(s);
        if (this._merging)
          i && this._internals.hooks[r].push(...i);
        else {
          if (!i)
            throw new Error(`Missing hook event: ${t}`);
          this._internals.hooks[t] = [...i];
        }
      }
    }
    /**
        Defines if redirect responses should be followed automatically.
    
        Note that if a `303` is sent by the server in response to any request type (`POST`, `DELETE`, etc.), Got will automatically request the resource pointed to in the location header via `GET`.
        This is in accordance with [the spec](https://tools.ietf.org/html/rfc7231#section-6.4.4). You can optionally turn on this behavior also for other redirect codes - see `methodRewriting`.
    
        @default true
        */
    get followRedirect() {
      return this._internals.followRedirect;
    }
    set followRedirect(e) {
      A.boolean(e), this._internals.followRedirect = e;
    }
    get followRedirects() {
      throw new TypeError("The `followRedirects` option does not exist. Use `followRedirect` instead.");
    }
    set followRedirects(e) {
      throw new TypeError("The `followRedirects` option does not exist. Use `followRedirect` instead.");
    }
    /**
        If exceeded, the request will be aborted and a `MaxRedirectsError` will be thrown.
    
        @default 10
        */
    get maxRedirects() {
      return this._internals.maxRedirects;
    }
    set maxRedirects(e) {
      A.number(e), this._internals.maxRedirects = e;
    }
    /**
        A cache adapter instance for storing cached response data.
    
        @default false
        */
    get cache() {
      return this._internals.cache;
    }
    set cache(e) {
      A.any([m.object, m.string, m.boolean, m.undefined], e), e === !0 ? this._internals.cache = _A : e === !1 ? this._internals.cache = void 0 :
      this._internals.cache = e;
    }
    /**
        Determines if a `got.HTTPError` is thrown for unsuccessful responses.
    
        If this is disabled, requests that encounter an error status code will be resolved with the `response` instead of throwing.
        This may be useful if you are checking for resource availability and are expecting error responses.
    
        @default true
        */
    get throwHttpErrors() {
      return this._internals.throwHttpErrors;
    }
    set throwHttpErrors(e) {
      A.boolean(e), this._internals.throwHttpErrors = e;
    }
    get username() {
      let e = this._internals.url, t = e ? e.username : this._internals.username;
      return decodeURIComponent(t);
    }
    set username(e) {
      A.string(e);
      let t = this._internals.url, r = encodeURIComponent(e);
      t ? t.username = r : this._internals.username = r;
    }
    get password() {
      let e = this._internals.url, t = e ? e.password : this._internals.password;
      return decodeURIComponent(t);
    }
    set password(e) {
      A.string(e);
      let t = this._internals.url, r = encodeURIComponent(e);
      t ? t.password = r : this._internals.password = r;
    }
    /**
        If set to `true`, Got will additionally accept HTTP2 requests.
    
        It will choose either HTTP/1.1 or HTTP/2 depending on the ALPN protocol.
    
        __Note__: This option requires Node.js 15.10.0 or newer as HTTP/2 support on older Node.js versions is very buggy.
    
        __Note__: Overriding `options.request` will disable HTTP2 support.
    
        @default false
    
        @example
        ```
        import got from 'got';
    
        const {headers} = await got('https://nghttp2.org/httpbin/anything', {http2: true});
    
        console.log(headers.via);
        //=> '2 nghttpx'
        ```
        */
    get http2() {
      return this._internals.http2;
    }
    set http2(e) {
      A.boolean(e), this._internals.http2 = e;
    }
    /**
        Set this to `true` to allow sending body for the `GET` method.
        However, the [HTTP/2 specification](https://tools.ietf.org/html/rfc7540#section-8.1.3) says that `An HTTP GET request includes request header fields and no payload body`, therefore when using the HTTP/2 protocol this option will have no effect.
        This option is only meant to interact with non-compliant servers when you have no other choice.
    
        __Note__: The [RFC 7231](https://tools.ietf.org/html/rfc7231#section-4.3.1) doesn't specify any particular behavior for the GET method having a payload, therefore __it's considered an [anti-pattern](https://en.wikipedia.org/wiki/Anti-pattern)__.
    
        @default false
        */
    get allowGetBody() {
      return this._internals.allowGetBody;
    }
    set allowGetBody(e) {
      A.boolean(e), this._internals.allowGetBody = e;
    }
    /**
        Request headers.
    
        Existing headers will be overwritten. Headers set to `undefined` will be omitted.
    
        @default {}
        */
    get headers() {
      return this._internals.headers;
    }
    set headers(e) {
      A.plainObject(e), this._merging ? Object.assign(this._internals.headers, dl(e)) : this._internals.headers = dl(e);
    }
    /**
        Specifies if the HTTP request method should be [rewritten as `GET`](https://tools.ietf.org/html/rfc7231#section-6.4) on redirects.
    
        As the [specification](https://tools.ietf.org/html/rfc7231#section-6.4) prefers to rewrite the HTTP method only on `303` responses, this is Got's default behavior.
        Setting `methodRewriting` to `true` will also rewrite `301` and `302` responses, as allowed by the spec. This is the behavior followed by `curl` and browsers.
    
        __Note__: Got never performs method rewriting on `307` and `308` responses, as this is [explicitly prohibited by the specification](https://www.rfc-editor.org/rfc/rfc7231#section-6.4.7).
    
        @default false
        */
    get methodRewriting() {
      return this._internals.methodRewriting;
    }
    set methodRewriting(e) {
      A.boolean(e), this._internals.methodRewriting = e;
    }
    /**
        Indicates which DNS record family to use.
    
        Values:
        - `undefined`: IPv4 (if present) or IPv6
        - `4`: Only IPv4
        - `6`: Only IPv6
    
        @default undefined
        */
    get dnsLookupIpVersion() {
      return this._internals.dnsLookupIpVersion;
    }
    set dnsLookupIpVersion(e) {
      if (e !== void 0 && e !== 4 && e !== 6)
        throw new TypeError(`Invalid DNS lookup IP version: ${e}`);
      this._internals.dnsLookupIpVersion = e;
    }
    /**
        A function used to parse JSON responses.
    
        @example
        ```
        import got from 'got';
        import Bourne from '@hapi/bourne';
    
        const parsed = await got('https://example.com', {
            parseJson: text => Bourne.parse(text)
        }).json();
    
        console.log(parsed);
        ```
        */
    get parseJson() {
      return this._internals.parseJson;
    }
    set parseJson(e) {
      A.function_(e), this._internals.parseJson = e;
    }
    /**
        A function used to stringify the body of JSON requests.
    
        @example
        ```
        import got from 'got';
    
        await got.post('https://example.com', {
            stringifyJson: object => JSON.stringify(object, (key, value) => {
                if (key.startsWith('_')) {
                    return;
                }
    
                return value;
            }),
            json: {
                some: 'payload',
                _ignoreMe: 1234
            }
        });
        ```
    
        @example
        ```
        import got from 'got';
    
        await got.post('https://example.com', {
            stringifyJson: object => JSON.stringify(object, (key, value) => {
                if (typeof value === 'number') {
                    return value.toString();
                }
    
                return value;
            }),
            json: {
                some: 'payload',
                number: 1
            }
        });
        ```
        */
    get stringifyJson() {
      return this._internals.stringifyJson;
    }
    set stringifyJson(e) {
      A.function_(e), this._internals.stringifyJson = e;
    }
    /**
        An object representing `limit`, `calculateDelay`, `methods`, `statusCodes`, `maxRetryAfter` and `errorCodes` fields for maximum retry count, retry handler, allowed methods, allowed status codes, maximum [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) time and allowed error codes.
    
        Delays between retries counts with function `1000 * Math.pow(2, retry) + Math.random() * 100`, where `retry` is attempt number (starts from 1).
    
        The `calculateDelay` property is a `function` that receives an object with `attemptCount`, `retryOptions`, `error` and `computedValue` properties for current retry count, the retry options, error and default computed value.
        The function must return a delay in milliseconds (or a Promise resolving with it) (`0` return value cancels retry).
    
        By default, it retries *only* on the specified methods, status codes, and on these network errors:
    
        - `ETIMEDOUT`: One of the [timeout](#timeout) limits were reached.
        - `ECONNRESET`: Connection was forcibly closed by a peer.
        - `EADDRINUSE`: Could not bind to any free port.
        - `ECONNREFUSED`: Connection was refused by the server.
        - `EPIPE`: The remote side of the stream being written has been closed.
        - `ENOTFOUND`: Couldn't resolve the hostname to an IP address.
        - `ENETUNREACH`: No internet connection.
        - `EAI_AGAIN`: DNS lookup timed out.
    
        __Note__: If `maxRetryAfter` is set to `undefined`, it will use `options.timeout`.
        __Note__: If [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header is greater than `maxRetryAfter`, it will cancel the request.
        */
    get retry() {
      return this._internals.retry;
    }
    set retry(e) {
      if (A.plainObject(e), A.any([m.function_, m.undefined], e.calculateDelay), A.any([m.number, m.undefined], e.maxRetryAfter), A.any([m.number,
      m.undefined], e.limit), A.any([m.array, m.undefined], e.methods), A.any([m.array, m.undefined], e.statusCodes), A.any([m.array, m.undefined],
      e.errorCodes), A.any([m.number, m.undefined], e.noise), e.noise && Math.abs(e.noise) > 100)
        throw new Error(`The maximum acceptable retry noise is +/- 100ms, got ${e.noise}`);
      for (let r in e)
        if (!(r in this._internals.retry))
          throw new Error(`Unexpected retry option: ${r}`);
      this._merging ? Object.assign(this._internals.retry, e) : this._internals.retry = { ...e };
      let { retry: t } = this._internals;
      t.methods = [...new Set(t.methods.map((r) => r.toUpperCase()))], t.statusCodes = [...new Set(t.statusCodes)], t.errorCodes = [...new Set(
      t.errorCodes)];
    }
    /**
        From `http.RequestOptions`.
    
        The IP address used to send the request from.
        */
    get localAddress() {
      return this._internals.localAddress;
    }
    set localAddress(e) {
      A.any([m.string, m.undefined], e), this._internals.localAddress = e;
    }
    /**
        The HTTP method used to make the request.
    
        @default 'GET'
        */
    get method() {
      return this._internals.method;
    }
    set method(e) {
      A.string(e), this._internals.method = e.toUpperCase();
    }
    get createConnection() {
      return this._internals.createConnection;
    }
    set createConnection(e) {
      A.any([m.function_, m.undefined], e), this._internals.createConnection = e;
    }
    /**
        From `http-cache-semantics`
    
        @default {}
        */
    get cacheOptions() {
      return this._internals.cacheOptions;
    }
    set cacheOptions(e) {
      A.plainObject(e), A.any([m.boolean, m.undefined], e.shared), A.any([m.number, m.undefined], e.cacheHeuristic), A.any([m.number, m.undefined],
      e.immutableMinTimeToLive), A.any([m.boolean, m.undefined], e.ignoreCargoCult);
      for (let t in e)
        if (!(t in this._internals.cacheOptions))
          throw new Error(`Cache option \`${t}\` does not exist`);
      this._merging ? Object.assign(this._internals.cacheOptions, e) : this._internals.cacheOptions = { ...e };
    }
    /**
    Options for the advanced HTTPS API.
    */
    get https() {
      return this._internals.https;
    }
    set https(e) {
      A.plainObject(e), A.any([m.boolean, m.undefined], e.rejectUnauthorized), A.any([m.function_, m.undefined], e.checkServerIdentity), A.any(
      [m.string, m.object, m.array, m.undefined], e.certificateAuthority), A.any([m.string, m.object, m.array, m.undefined], e.key), A.any([
      m.string, m.object, m.array, m.undefined], e.certificate), A.any([m.string, m.undefined], e.passphrase), A.any([m.string, m.buffer, m.
      array, m.undefined], e.pfx), A.any([m.array, m.undefined], e.alpnProtocols), A.any([m.string, m.undefined], e.ciphers), A.any([m.string,
      m.buffer, m.undefined], e.dhparam), A.any([m.string, m.undefined], e.signatureAlgorithms), A.any([m.string, m.undefined], e.minVersion),
      A.any([m.string, m.undefined], e.maxVersion), A.any([m.boolean, m.undefined], e.honorCipherOrder), A.any([m.number, m.undefined], e.tlsSessionLifetime),
      A.any([m.string, m.undefined], e.ecdhCurve), A.any([m.string, m.buffer, m.array, m.undefined], e.certificateRevocationLists);
      for (let t in e)
        if (!(t in this._internals.https))
          throw new Error(`HTTPS option \`${t}\` does not exist`);
      this._merging ? Object.assign(this._internals.https, e) : this._internals.https = { ...e };
    }
    /**
        [Encoding](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) to be used on `setEncoding` of the response data.
    
        To get a [`Buffer`](https://nodejs.org/api/buffer.html), you need to set `responseType` to `buffer` instead.
        Don't set this option to `null`.
    
        __Note__: This doesn't affect streams! Instead, you need to do `got.stream(...).setEncoding(encoding)`.
    
        @default 'utf-8'
        */
    get encoding() {
      return this._internals.encoding;
    }
    set encoding(e) {
      if (e === null)
        throw new TypeError("To get a Buffer, set `options.responseType` to `buffer` instead");
      A.any([m.string, m.undefined], e), this._internals.encoding = e;
    }
    /**
        When set to `true` the promise will return the Response body instead of the Response object.
    
        @default false
        */
    get resolveBodyOnly() {
      return this._internals.resolveBodyOnly;
    }
    set resolveBodyOnly(e) {
      A.boolean(e), this._internals.resolveBodyOnly = e;
    }
    /**
        Returns a `Stream` instead of a `Promise`.
        This is equivalent to calling `got.stream(url, options?)`.
    
        @default false
        */
    get isStream() {
      return this._internals.isStream;
    }
    set isStream(e) {
      A.boolean(e), this._internals.isStream = e;
    }
    /**
        The parsing method.
    
        The promise also has `.text()`, `.json()` and `.buffer()` methods which return another Got promise for the parsed body.
    
        It's like setting the options to `{responseType: 'json', resolveBodyOnly: true}` but without affecting the main Got promise.
    
        __Note__: When using streams, this option is ignored.
    
        @example
        ```
        const responsePromise = got(url);
        const bufferPromise = responsePromise.buffer();
        const jsonPromise = responsePromise.json();
    
        const [response, buffer, json] = Promise.all([responsePromise, bufferPromise, jsonPromise]);
        // `response` is an instance of Got Response
        // `buffer` is an instance of Buffer
        // `json` is an object
        ```
    
        @example
        ```
        // This
        const body = await got(url).json();
    
        // is semantically the same as this
        const body = await got(url, {responseType: 'json', resolveBodyOnly: true});
        ```
        */
    get responseType() {
      return this._internals.responseType;
    }
    set responseType(e) {
      if (e === void 0) {
        this._internals.responseType = "text";
        return;
      }
      if (e !== "text" && e !== "buffer" && e !== "json")
        throw new Error(`Invalid \`responseType\` option: ${e}`);
      this._internals.responseType = e;
    }
    get pagination() {
      return this._internals.pagination;
    }
    set pagination(e) {
      A.object(e), this._merging ? Object.assign(this._internals.pagination, e) : this._internals.pagination = e;
    }
    get auth() {
      throw new Error("Parameter `auth` is deprecated. Use `username` / `password` instead.");
    }
    set auth(e) {
      throw new Error("Parameter `auth` is deprecated. Use `username` / `password` instead.");
    }
    get setHost() {
      return this._internals.setHost;
    }
    set setHost(e) {
      A.boolean(e), this._internals.setHost = e;
    }
    get maxHeaderSize() {
      return this._internals.maxHeaderSize;
    }
    set maxHeaderSize(e) {
      A.any([m.number, m.undefined], e), this._internals.maxHeaderSize = e;
    }
    get enableUnixSockets() {
      return this._internals.enableUnixSockets;
    }
    set enableUnixSockets(e) {
      A.boolean(e), this._internals.enableUnixSockets = e;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    toJSON() {
      return { ...this._internals };
    }
    [Symbol.for("nodejs.util.inspect.custom")](e, t) {
      return (0, ll.inspect)(this._internals, t);
    }
    createNativeRequestOptions() {
      var e;
      let t = this._internals, r = t.url, i;
      r.protocol === "https:" ? i = t.http2 ? t.agent : t.agent.https : i = t.agent.http;
      let { https: s } = t, { pfx: o } = s;
      return m.array(o) && m.plainObject(o[0]) && (o = o.map((u) => ({
        buf: u.buffer,
        passphrase: u.passphrase
      }))), {
        ...t.cacheOptions,
        ...this._unixOptions,
        // HTTPS options
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ALPNProtocols: s.alpnProtocols,
        ca: s.certificateAuthority,
        cert: s.certificate,
        key: s.key,
        passphrase: s.passphrase,
        pfx: s.pfx,
        rejectUnauthorized: s.rejectUnauthorized,
        checkServerIdentity: s.checkServerIdentity ?? uA.checkServerIdentity,
        ciphers: s.ciphers,
        honorCipherOrder: s.honorCipherOrder,
        minVersion: s.minVersion,
        maxVersion: s.maxVersion,
        sigalgs: s.signatureAlgorithms,
        sessionTimeout: s.tlsSessionLifetime,
        dhparam: s.dhparam,
        ecdhCurve: s.ecdhCurve,
        crl: s.certificateRevocationLists,
        // HTTP options
        lookup: t.dnsLookup ?? ((e = t.dnsCache) == null ? void 0 : e.lookup),
        family: t.dnsLookupIpVersion,
        agent: i,
        setHost: t.setHost,
        method: t.method,
        maxHeaderSize: t.maxHeaderSize,
        localAddress: t.localAddress,
        headers: t.headers,
        createConnection: t.createConnection,
        timeout: t.http2 ? SA(t) : void 0,
        // HTTP/2 options
        h2session: t.h2session
      };
    }
    getRequestFunction() {
      let e = this._internals.url, { request: t } = this._internals;
      return !t && e ? this.getFallbackRequestFunction() : t;
    }
    getFallbackRequestFunction() {
      let e = this._internals.url;
      if (e) {
        if (e.protocol === "https:") {
          if (this._internals.http2) {
            if (Py < 15 || Py === 15 && vA < 10) {
              let t = new Error("To use the `http2` option, install Node.js 15.10.0 or above");
              throw t.code = "EUNSUPPORTED", t;
            }
            return yA.default.auto;
          }
          return lA.default.request;
        }
        return aA.default.request;
      }
    }
    freeze() {
      let e = this._internals;
      Object.freeze(e), Object.freeze(e.hooks), Object.freeze(e.hooks.afterResponse), Object.freeze(e.hooks.beforeError), Object.freeze(e.hooks.
      beforeRedirect), Object.freeze(e.hooks.beforeRequest), Object.freeze(e.hooks.beforeRetry), Object.freeze(e.hooks.init), Object.freeze(
      e.https), Object.freeze(e.cacheOptions), Object.freeze(e.agent), Object.freeze(e.headers), Object.freeze(e.timeout), Object.freeze(e.retry),
      Object.freeze(e.retry.errorCodes), Object.freeze(e.retry.methods), Object.freeze(e.retry.statusCodes);
    }
  }, Os = /* @__PURE__ */ n((e) => {
    let { statusCode: t } = e, r = e.request.options.followRedirect ? 299 : 399;
    return t >= 200 && t <= r || t === 304;
  }, "isResponseOk"), My = class extends ye {
    static {
      n(this, "ParseError");
    }
    constructor(e, t) {
      let { options: r } = t.request;
      super(`${e.message} in "${r.url.toString()}"`, e, t.request), this.name = "ParseError", this.code = "ERR_BODY_PARSE_FAILURE";
    }
  }, jy = /* @__PURE__ */ n((e, t, r, i) => {
    let { rawBody: s } = e;
    try {
      if (t === "text")
        return s.toString(i);
      if (t === "json")
        return s.length === 0 ? "" : r(s.toString(i));
      if (t === "buffer")
        return s;
    } catch (o) {
      throw new My(o, e);
    }
    throw new My({
      message: `Unknown body type '${t}'`,
      name: "Error"
    }, e);
  }, "parseBody");
  function AA(e) {
    return e.writable && !e.writableEnded;
  }
  n(AA, "isClientRequest");
  var TA = AA;
  function Iy(e) {
    return e.protocol === "unix:" || e.hostname === "unix";
  }
  n(Iy, "isUnixSocketURL");
  var RA = m.string(nb.default.versions.brotli), BA = /* @__PURE__ */ new Set(["GET", "HEAD"]), cl = new iA(), kA = /* @__PURE__ */ new Set(
  [300, 301, 302, 303, 304, 307, 308]), OA = [
    "socket",
    "connect",
    "continue",
    "information",
    "upgrade"
  ], Bs = /* @__PURE__ */ n(() => {
  }, "noop2"), gl = class extends D1.Duplex {
    static {
      n(this, "Request");
    }
    constructor(e, t, r) {
      super({
        // Don't destroy immediately, as the error may be emitted on unsuccessful retry
        autoDestroy: !1,
        // It needs to be zero because we're just proxying the data to another stream
        highWaterMark: 0
      }), Object.defineProperty(this, "constructor", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_noPipe", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "options", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "response", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "requestUrl", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "redirectUrls", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "retryCount", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_stopRetry", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_downloadedSize", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_uploadedSize", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_stopReading", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_pipedServerResponses", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_request", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_responseSize", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_bodySize", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_unproxyEvents", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_isFromCache", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_cannotHaveBody", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_triggerRead", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_cancelTimeouts", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_removeListeners", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_nativeResponse", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_flushed", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_aborted", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), Object.defineProperty(this, "_requestInitialized", {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: void 0
      }), this._downloadedSize = 0, this._uploadedSize = 0, this._stopReading = !1, this._pipedServerResponses = /* @__PURE__ */ new Set(), this.
      _cannotHaveBody = !1, this._unproxyEvents = Bs, this._triggerRead = !1, this._cancelTimeouts = Bs, this._removeListeners = Bs, this._jobs =
      [], this._flushed = !1, this._requestInitialized = !1, this._aborted = !1, this.redirectUrls = [], this.retryCount = 0, this._stopRetry =
      Bs, this.on("pipe", (s) => {
        s.headers && Object.assign(this.options.headers, s.headers);
      }), this.on("newListener", (s) => {
        if (s === "retry" && this.listenerCount("retry") > 0)
          throw new Error("A retry listener has been attached already.");
      });
      try {
        if (this.options = new bt(e, t, r), !this.options.url) {
          if (this.options.prefixUrl === "")
            throw new TypeError("Missing `url` property");
          this.options.url = "";
        }
        this.requestUrl = this.options.url;
      } catch (s) {
        let { options: o } = s;
        o && (this.options = o), this.flush = async () => {
          this.flush = async () => {
          }, this.destroy(s);
        };
        return;
      }
      let { body: i } = this.options;
      if (m.nodeStream(i) && i.once("error", (s) => {
        this._flushed ? this._beforeError(new gy(s, this)) : this.flush = async () => {
          this.flush = async () => {
          }, this._beforeError(new gy(s, this));
        };
      }), this.options.signal) {
        let s = /* @__PURE__ */ n(() => {
          this.destroy(new p1(this));
        }, "abort");
        this.options.signal.aborted ? s() : (this.options.signal.addEventListener("abort", s), this._removeListeners = () => {
          this.options.signal.removeEventListener("abort", s);
        });
      }
    }
    async flush() {
      var e;
      if (!this._flushed) {
        this._flushed = !0;
        try {
          if (await this._finalizeBody(), this.destroyed)
            return;
          if (await this._makeRequest(), this.destroyed) {
            (e = this._request) == null || e.destroy();
            return;
          }
          for (let t of this._jobs)
            t();
          this._jobs.length = 0, this._requestInitialized = !0;
        } catch (t) {
          this._beforeError(t);
        }
      }
    }
    _beforeError(e) {
      if (this._stopReading)
        return;
      let { response: t, options: r } = this, i = this.retryCount + (e.name === "RetryError" ? 0 : 1);
      this._stopReading = !0, e instanceof ye || (e = new ye(e.message, e, this));
      let s = e;
      (async () => {
        var o, u;
        if (t?.readable && !t.rawBody && !((u = (o = this._request) == null ? void 0 : o.socket) != null && u.destroyed) && (t.setEncoding(this.
        readableEncoding), await this._setRawBody(t) && (t.body = t.rawBody.toString())), this.listenerCount("retry") !== 0) {
          let a;
          try {
            let l;
            t && "retry-after" in t.headers && (l = Number(t.headers["retry-after"]), Number.isNaN(l) ? (l = Date.parse(t.headers["retry-aft\
er"]) - Date.now(), l <= 0 && (l = 1)) : l *= 1e3);
            let f = r.retry;
            a = await f.calculateDelay({
              attemptCount: i,
              retryOptions: f,
              error: s,
              retryAfter: l,
              computedValue: sA({
                attemptCount: i,
                retryOptions: f,
                error: s,
                retryAfter: l,
                computedValue: f.maxRetryAfter ?? r.timeout.request ?? Number.POSITIVE_INFINITY
              })
            });
          } catch (l) {
            this._error(new ye(l.message, l, this));
            return;
          }
          if (a) {
            if (await new Promise((l) => {
              let f = setTimeout(l, a);
              this._stopRetry = () => {
                clearTimeout(f), l();
              };
            }), this.destroyed)
              return;
            try {
              for (let l of this.options.hooks.beforeRetry)
                await l(s, this.retryCount + 1);
            } catch (l) {
              this._error(new ye(l.message, e, this));
              return;
            }
            if (this.destroyed)
              return;
            this.destroy(), this.emit("retry", this.retryCount + 1, e, (l) => {
              let f = new gl(r.url, l, r);
              return f.retryCount = this.retryCount + 1, nb.default.nextTick(() => {
                f.flush();
              }), f;
            });
            return;
          }
        }
        this._error(s);
      })();
    }
    _read() {
      this._triggerRead = !0;
      let { response: e } = this;
      if (e && !this._stopReading) {
        e.readableLength && (this._triggerRead = !1);
        let t;
        for (; (t = e.read()) !== null; ) {
          this._downloadedSize += t.length;
          let r = this.downloadProgress;
          r.percent < 1 && this.emit("downloadProgress", r), this.push(t);
        }
      }
    }
    _write(e, t, r) {
      let i = /* @__PURE__ */ n(() => {
        this._writeRequest(e, t, r);
      }, "write");
      this._requestInitialized ? i() : this._jobs.push(i);
    }
    _final(e) {
      let t = /* @__PURE__ */ n(() => {
        if (!this._request || this._request.destroyed) {
          e();
          return;
        }
        this._request.end((r) => {
          var i;
          (i = this._request._writableState) != null && i.errored || (r || (this._bodySize = this._uploadedSize, this.emit("uploadProgress",
          this.uploadProgress), this._request.emit("upload-complete")), e(r));
        });
      }, "endRequest");
      this._requestInitialized ? t() : this._jobs.push(t);
    }
    _destroy(e, t) {
      if (this._stopReading = !0, this.flush = async () => {
      }, this._stopRetry(), this._cancelTimeouts(), this._removeListeners(), this.options) {
        let { body: r } = this.options;
        m.nodeStream(r) && r.destroy();
      }
      this._request && this._request.destroy(), e !== null && !m.undefined(e) && !(e instanceof ye) && (e = new ye(e.message, e, this)), t(e);
    }
    pipe(e, t) {
      return e instanceof nl.ServerResponse && this._pipedServerResponses.add(e), super.pipe(e, t);
    }
    unpipe(e) {
      return e instanceof nl.ServerResponse && this._pipedServerResponses.delete(e), super.unpipe(e), this;
    }
    async _finalizeBody() {
      let { options: e } = this, { headers: t } = e, r = !m.undefined(e.form), i = !m.undefined(e.json), s = !m.undefined(e.body), o = BA.has(
      e.method) && !(e.method === "GET" && e.allowGetBody);
      if (this._cannotHaveBody = o, r || i || s) {
        if (o)
          throw new TypeError(`The \`${e.method}\` method cannot be used with a body`);
        let u = !m.string(t["content-type"]);
        if (s) {
          if (ml(e.body)) {
            let l = new Y1(e.body);
            u && (t["content-type"] = l.headers["Content-Type"]), "Content-Length" in l.headers && (t["content-length"] = l.headers["Content\
-Length"]), e.body = l.encode();
          }
          ob(e.body) && u && (t["content-type"] = `multipart/form-data; boundary=${e.body.getBoundary()}`);
        } else if (r) {
          u && (t["content-type"] = "application/x-www-form-urlencoded");
          let { form: l } = e;
          e.form = void 0, e.body = new by.URLSearchParams(l).toString();
        } else {
          u && (t["content-type"] = "application/json");
          let { json: l } = e;
          e.json = void 0, e.body = e.stringifyJson(l);
        }
        let a = await X1(e.body, e.headers);
        m.undefined(t["content-length"]) && m.undefined(t["transfer-encoding"]) && !o && !m.undefined(a) && (t["content-length"] = String(a));
      }
      e.responseType === "json" && !("accept" in e.headers) && (e.headers.accept = "application/json"), this._bodySize = Number(t["content-l\
ength"]) || void 0;
    }
    async _onResponseBase(e) {
      if (this.isAborted)
        return;
      let { options: t } = this, { url: r } = t;
      this._nativeResponse = e, t.decompress && (e = (0, L1.default)(e));
      let i = e.statusCode, s = e;
      s.statusMessage = s.statusMessage ? s.statusMessage : nl.default.STATUS_CODES[i], s.url = t.url.toString(), s.requestUrl = this.requestUrl,
      s.redirectUrls = this.redirectUrls, s.request = this, s.isFromCache = this._nativeResponse.fromCache ?? !1, s.ip = this.ip, s.retryCount =
      this.retryCount, s.ok = Os(s), this._isFromCache = s.isFromCache, this._responseSize = Number(e.headers["content-length"]) || void 0, this.
      response = s, e.once("end", () => {
        this._responseSize = this._downloadedSize, this.emit("downloadProgress", this.downloadProgress);
      }), e.once("error", (u) => {
        this._aborted = !0, e.destroy(), this._beforeError(new yy(u, this));
      }), e.once("aborted", () => {
        this._aborted = !0, this._beforeError(new yy({
          name: "Error",
          message: "The server aborted pending request",
          code: "ECONNRESET"
        }, this));
      }), this.emit("downloadProgress", this.downloadProgress);
      let o = e.headers["set-cookie"];
      if (m.object(t.cookieJar) && o) {
        let u = o.map(async (a) => t.cookieJar.setCookie(a, r.toString()));
        t.ignoreInvalidCookies && (u = u.map(async (a) => {
          try {
            await a;
          } catch {
          }
        }));
        try {
          await Promise.all(u);
        } catch (a) {
          this._beforeError(a);
          return;
        }
      }
      if (!this.isAborted) {
        if (t.followRedirect && e.headers.location && kA.has(i)) {
          if (e.resume(), this._cancelTimeouts(), this._unproxyEvents(), this.redirectUrls.length >= t.maxRedirects) {
            this._beforeError(new f1(this));
            return;
          }
          this._request = void 0;
          let u = new bt(void 0, void 0, this.options), a = i === 303 && u.method !== "GET" && u.method !== "HEAD", l = i !== 307 && i !== 308,
          f = u.methodRewriting && l;
          (a || f) && (u.method = "GET", u.body = void 0, u.json = void 0, u.form = void 0, delete u.headers["content-length"]);
          try {
            let p = il.Buffer.from(e.headers.location, "binary").toString(), d = new by.URL(p, r);
            if (!Iy(r) && Iy(d)) {
              this._beforeError(new ye("Cannot redirect to UNIX socket", {}, this));
              return;
            }
            d.hostname !== r.hostname || d.port !== r.port ? ("host" in u.headers && delete u.headers.host, "cookie" in u.headers && delete u.
            headers.cookie, "authorization" in u.headers && delete u.headers.authorization, (u.username || u.password) && (u.username = "", u.
            password = "")) : (d.username = u.username, d.password = u.password), this.redirectUrls.push(d), u.prefixUrl = "", u.url = d;
            for (let c of u.hooks.beforeRedirect)
              await c(u, s);
            this.emit("redirect", u, s), this.options = u, await this._makeRequest();
          } catch (p) {
            this._beforeError(p);
            return;
          }
          return;
        }
        if (t.isStream && t.throwHttpErrors && !Os(s)) {
          this._beforeError(new ks(s));
          return;
        }
        if (e.on("readable", () => {
          this._triggerRead && this._read();
        }), this.on("resume", () => {
          e.resume();
        }), this.on("pause", () => {
          e.pause();
        }), e.once("end", () => {
          this.push(null);
        }), this._noPipe) {
          await this._setRawBody() && this.emit("response", e);
          return;
        }
        this.emit("response", e);
        for (let u of this._pipedServerResponses)
          if (!u.headersSent) {
            for (let a in e.headers) {
              let l = t.decompress ? a !== "content-encoding" : !0, f = e.headers[a];
              l && u.setHeader(a, f);
            }
            u.statusCode = i;
          }
      }
    }
    async _setRawBody(e = this) {
      if (e.readableEnded)
        return !1;
      try {
        let t = await (0, N1.buffer)(e);
        if (!this.isAborted)
          return this.response.rawBody = t, !0;
      } catch {
      }
      return !1;
    }
    async _onResponse(e) {
      try {
        await this._onResponseBase(e);
      } catch (t) {
        this._beforeError(t);
      }
    }
    _onRequest(e) {
      let { options: t } = this, { timeout: r, url: i } = t;
      v1(e), this.options.http2 && e.setTimeout(0), this._cancelTimeouts = tA(e, r, i);
      let s = t.cache ? "cacheableResponse" : "response";
      e.once(s, (o) => {
        this._onResponse(o);
      }), e.once("error", (o) => {
        this._aborted = !0, e.destroy(), o = o instanceof ab ? new c1(o, this.timings, this) : new ye(o.message, o, this), this._beforeError(
        o);
      }), this._unproxyEvents = ub(e, this, OA), this._request = e, this.emit("uploadProgress", this.uploadProgress), this._sendBody(), this.
      emit("request", e);
    }
    async _asyncWrite(e) {
      return new Promise((t, r) => {
        super.write(e, (i) => {
          if (i) {
            r(i);
            return;
          }
          t();
        });
      });
    }
    _sendBody() {
      let { body: e } = this.options, t = this.redirectUrls.length === 0 ? this : this._request ?? this;
      m.nodeStream(e) ? e.pipe(t) : m.generator(e) || m.asyncGenerator(e) ? (async () => {
        try {
          for await (let r of e)
            await this._asyncWrite(r);
          super.end();
        } catch (r) {
          this._beforeError(r);
        }
      })() : m.undefined(e) ? (this._cannotHaveBody || this._noPipe) && t.end() : (this._writeRequest(e, void 0, () => {
      }), t.end());
    }
    _prepareCache(e) {
      if (!cl.has(e)) {
        let t = new I1((r, i) => {
          let s = r._request(r, i);
          return m.promise(s) && (s.once = (o, u) => {
            if (o === "error")
              (async () => {
                try {
                  await s;
                } catch (a) {
                  u(a);
                }
              })();
            else if (o === "abort")
              (async () => {
                try {
                  (await s).once("abort", u);
                } catch {
                }
              })();
            else
              throw new Error(`Unknown HTTP2 promise event: ${o}`);
            return s;
          }), s;
        }, e);
        cl.set(e, t.request());
      }
    }
    async _createCacheableRequest(e, t) {
      return new Promise((r, i) => {
        Object.assign(t, rA(e));
        let s, o = cl.get(t.cache)(t, async (u) => {
          if (u._readableState.autoDestroy = !1, s) {
            let a = /* @__PURE__ */ n(() => {
              u.req && (u.complete = u.req.res.complete);
            }, "fix");
            u.prependOnceListener("end", a), a(), (await s).emit("cacheableResponse", u);
          }
          r(u);
        });
        o.once("error", i), o.once("request", async (u) => {
          s = u, r(s);
        });
      });
    }
    async _makeRequest() {
      let { options: e } = this, { headers: t, username: r, password: i } = e, s = e.cookieJar;
      for (let l in t)
        if (m.undefined(t[l]))
          delete t[l];
        else if (m.null_(t[l]))
          throw new TypeError(`Use \`undefined\` instead of \`null\` to delete the \`${l}\` header`);
      if (e.decompress && m.undefined(t["accept-encoding"]) && (t["accept-encoding"] = RA ? "gzip, deflate, br" : "gzip, deflate"), r || i) {
        let l = il.Buffer.from(`${r}:${i}`).toString("base64");
        t.authorization = `Basic ${l}`;
      }
      if (s) {
        let l = await s.getCookieString(e.url.toString());
        m.nonEmptyString(l) && (t.cookie = l);
      }
      e.prefixUrl = "";
      let o;
      for (let l of e.hooks.beforeRequest) {
        let f = await l(e);
        if (!m.undefined(f)) {
          o = /* @__PURE__ */ n(() => f, "request");
          break;
        }
      }
      o || (o = e.getRequestFunction());
      let u = e.url;
      this._requestOptions = e.createNativeRequestOptions(), e.cache && (this._requestOptions._request = o, this._requestOptions.cache = e.cache,
      this._requestOptions.body = e.body, this._prepareCache(e.cache));
      let a = e.cache ? this._createCacheableRequest : o;
      try {
        let l = a(u, this._requestOptions);
        m.promise(l) && (l = await l), m.undefined(l) && (l = e.getFallbackRequestFunction()(u, this._requestOptions), m.promise(l) && (l = await l)),
        TA(l) ? this._onRequest(l) : this.writable ? (this.once("finish", () => {
          this._onResponse(l);
        }), this._sendBody()) : this._onResponse(l);
      } catch (l) {
        throw l instanceof Ni ? new h1(l, this) : l;
      }
    }
    async _error(e) {
      try {
        if (!(e instanceof ks && !this.options.throwHttpErrors))
          for (let t of this.options.hooks.beforeError)
            e = await t(e);
      } catch (t) {
        e = new ye(t.message, t, this);
      }
      this.destroy(e);
    }
    _writeRequest(e, t, r) {
      !this._request || this._request.destroyed || this._request.write(e, t, (i) => {
        if (!i && !this._request.destroyed) {
          this._uploadedSize += il.Buffer.byteLength(e, t);
          let s = this.uploadProgress;
          s.percent < 1 && this.emit("uploadProgress", s);
        }
        r(i);
      });
    }
    /**
    The remote IP address.
    */
    get ip() {
      var e;
      return (e = this.socket) == null ? void 0 : e.remoteAddress;
    }
    /**
    Indicates whether the request has been aborted or not.
    */
    get isAborted() {
      return this._aborted;
    }
    get socket() {
      var e;
      return ((e = this._request) == null ? void 0 : e.socket) ?? void 0;
    }
    /**
    Progress event for downloading (receiving a response).
    */
    get downloadProgress() {
      let e;
      return this._responseSize ? e = this._downloadedSize / this._responseSize : this._responseSize === this._downloadedSize ? e = 1 : e = 0,
      {
        percent: e,
        transferred: this._downloadedSize,
        total: this._responseSize
      };
    }
    /**
    Progress event for uploading (sending a request).
    */
    get uploadProgress() {
      let e;
      return this._bodySize ? e = this._uploadedSize / this._bodySize : this._bodySize === this._uploadedSize ? e = 1 : e = 0, {
        percent: e,
        transferred: this._uploadedSize,
        total: this._bodySize
      };
    }
    /**
        The object contains the following properties:
    
        - `start` - Time when the request started.
        - `socket` - Time when a socket was assigned to the request.
        - `lookup` - Time when the DNS lookup finished.
        - `connect` - Time when the socket successfully connected.
        - `secureConnect` - Time when the socket securely connected.
        - `upload` - Time when the request finished uploading.
        - `response` - Time when the request fired `response` event.
        - `end` - Time when the response fired `end` event.
        - `error` - Time when the request fired `error` event.
        - `abort` - Time when the request fired `abort` event.
        - `phases`
            - `wait` - `timings.socket - timings.start`
            - `dns` - `timings.lookup - timings.socket`
            - `tcp` - `timings.connect - timings.lookup`
            - `tls` - `timings.secureConnect - timings.connect`
            - `request` - `timings.upload - (timings.secureConnect || timings.connect)`
            - `firstByte` - `timings.response - timings.upload`
            - `download` - `timings.end - timings.response`
            - `total` - `(timings.end || timings.error || timings.abort) - timings.start`
    
        If something has not been measured yet, it will be `undefined`.
    
        __Note__: The time is a `number` representing the milliseconds elapsed since the UNIX epoch.
        */
    get timings() {
      var e;
      return (e = this._request) == null ? void 0 : e.timings;
    }
    /**
    Whether the response was retrieved from the cache.
    */
    get isFromCache() {
      return this._isFromCache;
    }
    get reusedSocket() {
      var e;
      return (e = this._request) == null ? void 0 : e.reusedSocket;
    }
  }, PA = class extends ye {
    static {
      n(this, "CancelError2");
    }
    constructor(e) {
      super("Promise was canceled", {}, e), this.name = "CancelError", this.code = "ERR_CANCELED";
    }
    /**
    Whether the promise is canceled.
    */
    get isCanceled() {
      return !0;
    }
  }, qA = [
    "request",
    "response",
    "redirect",
    "uploadProgress",
    "downloadProgress"
  ];
  function Ly(e) {
    let t, r, i, s = new u1.EventEmitter(), o = new Dl((a, l, f) => {
      f(() => {
        t.destroy();
      }), f.shouldReject = !1, f(() => {
        l(new PA(t));
      });
      let p = /* @__PURE__ */ n((d) => {
        var c;
        f(() => {
        });
        let h = e ?? new gl(void 0, void 0, i);
        h.retryCount = d, h._noPipe = !0, t = h, h.once("response", async (y) => {
          let _ = (y.headers["content-encoding"] ?? "").toLowerCase(), C = _ === "gzip" || _ === "deflate" || _ === "br", { options: v } = h;
          if (C && !v.decompress)
            y.body = y.rawBody;
          else
            try {
              y.body = jy(y, v.responseType, v.parseJson, v.encoding);
            } catch (S) {
              if (y.body = y.rawBody.toString(), Os(y)) {
                h._beforeError(S);
                return;
              }
            }
          try {
            let S = v.hooks.afterResponse;
            for (let [x, F] of S.entries())
              if (y = await F(y, async (k) => {
                throw v.merge(k), v.prefixUrl = "", k.url && (v.url = k.url), v.hooks.afterResponse = v.hooks.afterResponse.slice(0, x), new d1(
                h);
              }), !(m.object(y) && m.number(y.statusCode) && !m.nullOrUndefined(y.body)))
                throw new TypeError("The `afterResponse` hook returned an invalid value");
          } catch (S) {
            h._beforeError(S);
            return;
          }
          if (r = y, !Os(y)) {
            h._beforeError(new ks(y));
            return;
          }
          h.destroy(), a(h.options.resolveBodyOnly ? y.body : y);
        });
        let g = /* @__PURE__ */ n((y) => {
          if (o.isCanceled)
            return;
          let { options: _ } = h;
          if (y instanceof ks && !_.throwHttpErrors) {
            let { response: C } = y;
            h.destroy(), a(h.options.resolveBodyOnly ? C.body : C);
            return;
          }
          l(y);
        }, "onError");
        h.once("error", g);
        let w = (c = h.options) == null ? void 0 : c.body;
        h.once("retry", (y, _) => {
          e = void 0;
          let C = h.options.body;
          if (w === C && m.nodeStream(C)) {
            _.message = "Cannot retry with consumed body stream", g(_);
            return;
          }
          i = h.options, p(y);
        }), ub(h, s, qA), m.undefined(e) && h.flush();
      }, "makeRequest");
      p(0);
    });
    o.on = (a, l) => (s.on(a, l), o), o.off = (a, l) => (s.off(a, l), o);
    let u = /* @__PURE__ */ n((a) => {
      let l = (async () => {
        await o;
        let { options: f } = r.request;
        return jy(r, a, f.parseJson, f.encoding);
      })();
      return Object.defineProperties(l, Object.getOwnPropertyDescriptors(o)), l;
    }, "shortcut");
    return o.json = () => {
      if (t.options) {
        let { headers: a } = t.options;
        !t.writableFinished && !("accept" in a) && (a.accept = "application/json");
      }
      return u("json");
    }, o.buffer = () => u("buffer"), o.text = () => u("text"), o;
  }
  n(Ly, "asPromise");
  var MA = /* @__PURE__ */ n(async (e) => new Promise((t) => {
    setTimeout(t, e);
  }), "delay"), jA = /* @__PURE__ */ n((e) => m.function_(e), "isGotInstance"), IA = [
    "get",
    "post",
    "put",
    "patch",
    "head",
    "delete"
  ], lb = /* @__PURE__ */ n((e) => {
    e = {
      options: new bt(void 0, void 0, e.options),
      handlers: [...e.handlers],
      mutableDefaults: e.mutableDefaults
    }, Object.defineProperty(e, "mutableDefaults", {
      enumerable: !0,
      configurable: !1,
      writable: !1
    });
    let t = /* @__PURE__ */ n((i, s, o = e.options) => {
      let u = new gl(i, s, o), a, l = /* @__PURE__ */ n((d) => (u.options = d, u._noPipe = !d.isStream, u.flush(), d.isStream ? u : (a || (a =
      Ly(u)), a)), "lastHandler"), f = 0, p = /* @__PURE__ */ n((d) => {
        let h = (e.handlers[f++] ?? l)(d, p);
        if (m.promise(h) && !u.options.isStream && (a || (a = Ly(u)), h !== a)) {
          let g = Object.getOwnPropertyDescriptors(a);
          for (let w in g)
            w in h && delete g[w];
          Object.defineProperties(h, g), h.cancel = a.cancel;
        }
        return h;
      }, "iterateHandlers");
      return p(u.options);
    }, "got2");
    t.extend = (...i) => {
      let s = new bt(void 0, void 0, e.options), o = [...e.handlers], u;
      for (let a of i)
        jA(a) ? (s.merge(a.defaults.options), o.push(...a.defaults.handlers), u = a.defaults.mutableDefaults) : (s.merge(a), a.handlers && o.
        push(...a.handlers), u = a.mutableDefaults);
      return lb({
        options: s,
        handlers: o,
        mutableDefaults: !!u
      });
    };
    let r = /* @__PURE__ */ n(async function* (i, s) {
      let o = new bt(i, s, e.options);
      o.resolveBodyOnly = !1;
      let { pagination: u } = o;
      A.function_(u.transform), A.function_(u.shouldContinue), A.function_(u.filter), A.function_(u.paginate), A.number(u.countLimit), A.number(
      u.requestLimit), A.number(u.backoff);
      let a = [], { countLimit: l } = u, f = 0;
      for (; f < u.requestLimit; ) {
        f !== 0 && await MA(u.backoff);
        let p = await t(void 0, void 0, o), d = await u.transform(p), c = [];
        A.array(d);
        for (let g of d)
          if (u.filter({ item: g, currentItems: c, allItems: a }) && (!u.shouldContinue({ item: g, currentItems: c, allItems: a }) || (yield g,
          u.stackAllItems && a.push(g), c.push(g), --l <= 0)))
            return;
        let h = u.paginate({
          response: p,
          currentItems: c,
          allItems: a
        });
        if (h === !1)
          return;
        h === p.request.options ? o = p.request.options : (o.merge(h), A.any([m.urlInstance, m.undefined], h.url), h.url !== void 0 && (o.prefixUrl =
        "", o.url = h.url)), f++;
      }
    }, "paginateEach");
    t.paginate = r, t.paginate.all = async (i, s) => {
      let o = [];
      for await (let u of r(i, s))
        o.push(u);
      return o;
    }, t.paginate.each = r, t.stream = (i, s) => t(i, { ...s, isStream: !0 });
    for (let i of IA)
      t[i] = (s, o) => t(s, { ...o, method: i }), t.stream[i] = (s, o) => t(s, { ...o, method: i, isStream: !0 });
    return e.mutableDefaults || (Object.freeze(e.handlers), e.options.freeze()), Object.defineProperty(t, "defaults", {
      value: e,
      writable: !1,
      configurable: !1,
      enumerable: !0
    }), t;
  }, "create"), LA = lb, NA = {
    options: new bt(),
    handlers: [],
    mutableDefaults: !1
  }, UA = LA(NA), HA = UA, WA = me(pu()), $A = ED(), zA = me(my()), Ny = {
    keepAlive: !0,
    maxSockets: 20
  }, VA = {
    http: new G3.Agent(Ny),
    https: new Y3.Agent(Ny)
  };
  async function GA({ url: e, gotOpts: t, extractOpts: r, dir: i }) {
    return new Promise((s, o) => {
      let u = /* @__PURE__ */ n((a) => {
        a ? o(a) : s();
      }, "callback");
      (0, WA.default)(
        HA.stream(e, Object.assign({ agent: VA }, t)),
        (0, zA.default)(),
        (0, $A.extract)(i, r),
        u
      );
    });
  }
  n(GA, "download");
});

// ../node_modules/get-npm-tarball-url/lib/index.js
var pb = b((oq, db) => {
  var yl = Object.defineProperty, YA = Object.getOwnPropertyDescriptor, JA = Object.getOwnPropertyNames, KA = Object.prototype.hasOwnProperty,
  XA = /* @__PURE__ */ n((e, t) => {
    for (var r in t)
      yl(e, r, { get: t[r], enumerable: !0 });
  }, "__export"), QA = /* @__PURE__ */ n((e, t, r, i) => {
    if (t && typeof t == "object" || typeof t == "function")
      for (let s of JA(t))
        !KA.call(e, s) && s !== r && yl(e, s, { get: /* @__PURE__ */ n(() => t[s], "get"), enumerable: !(i = YA(t, s)) || i.enumerable });
    return e;
  }, "__copyProps"), ZA = /* @__PURE__ */ n((e) => QA(yl({}, "__esModule", { value: !0 }), e), "__toCommonJS"), cb = {};
  XA(cb, {
    default: /* @__PURE__ */ n(() => eT, "default")
  });
  db.exports = ZA(cb);
  function eT(e, t, r) {
    let i;
    r?.registry ? i = r.registry.endsWith("/") ? r.registry : `${r.registry}/` : i = "https://registry.npmjs.org/";
    let s = rT(e);
    return `${i}${e}/-/${s}-${tT(t)}.tgz`;
  }
  n(eT, "src_default");
  function tT(e) {
    let t = e.indexOf("+");
    return t === -1 ? e : e.substring(0, t);
  }
  n(tT, "removeBuildMetadataFromVersion");
  function rT(e) {
    return e[0] !== "@" ? e : e.split("/")[1];
  }
  n(rT, "getScopelessName");
});

// ../node_modules/eastasianwidth/eastasianwidth.js
var js = b((lM, Cl) => {
  var Pt = {};
  typeof Cl > "u" ? window.eastasianwidth = Pt : Cl.exports = Pt;
  Pt.eastAsianWidth = function(e) {
    var t = e.charCodeAt(0), r = e.length == 2 ? e.charCodeAt(1) : 0, i = t;
    return 55296 <= t && t <= 56319 && 56320 <= r && r <= 57343 && (t &= 1023, r &= 1023, i = t << 10 | r, i += 65536), i == 12288 || 65281 <=
    i && i <= 65376 || 65504 <= i && i <= 65510 ? "F" : i == 8361 || 65377 <= i && i <= 65470 || 65474 <= i && i <= 65479 || 65482 <= i && i <=
    65487 || 65490 <= i && i <= 65495 || 65498 <= i && i <= 65500 || 65512 <= i && i <= 65518 ? "H" : 4352 <= i && i <= 4447 || 4515 <= i &&
    i <= 4519 || 4602 <= i && i <= 4607 || 9001 <= i && i <= 9002 || 11904 <= i && i <= 11929 || 11931 <= i && i <= 12019 || 12032 <= i && i <=
    12245 || 12272 <= i && i <= 12283 || 12289 <= i && i <= 12350 || 12353 <= i && i <= 12438 || 12441 <= i && i <= 12543 || 12549 <= i && i <=
    12589 || 12593 <= i && i <= 12686 || 12688 <= i && i <= 12730 || 12736 <= i && i <= 12771 || 12784 <= i && i <= 12830 || 12832 <= i && i <=
    12871 || 12880 <= i && i <= 13054 || 13056 <= i && i <= 19903 || 19968 <= i && i <= 42124 || 42128 <= i && i <= 42182 || 43360 <= i && i <=
    43388 || 44032 <= i && i <= 55203 || 55216 <= i && i <= 55238 || 55243 <= i && i <= 55291 || 63744 <= i && i <= 64255 || 65040 <= i && i <=
    65049 || 65072 <= i && i <= 65106 || 65108 <= i && i <= 65126 || 65128 <= i && i <= 65131 || 110592 <= i && i <= 110593 || 127488 <= i &&
    i <= 127490 || 127504 <= i && i <= 127546 || 127552 <= i && i <= 127560 || 127568 <= i && i <= 127569 || 131072 <= i && i <= 194367 || 177984 <=
    i && i <= 196605 || 196608 <= i && i <= 262141 ? "W" : 32 <= i && i <= 126 || 162 <= i && i <= 163 || 165 <= i && i <= 166 || i == 172 ||
    i == 175 || 10214 <= i && i <= 10221 || 10629 <= i && i <= 10630 ? "Na" : i == 161 || i == 164 || 167 <= i && i <= 168 || i == 170 || 173 <=
    i && i <= 174 || 176 <= i && i <= 180 || 182 <= i && i <= 186 || 188 <= i && i <= 191 || i == 198 || i == 208 || 215 <= i && i <= 216 ||
    222 <= i && i <= 225 || i == 230 || 232 <= i && i <= 234 || 236 <= i && i <= 237 || i == 240 || 242 <= i && i <= 243 || 247 <= i && i <=
    250 || i == 252 || i == 254 || i == 257 || i == 273 || i == 275 || i == 283 || 294 <= i && i <= 295 || i == 299 || 305 <= i && i <= 307 ||
    i == 312 || 319 <= i && i <= 322 || i == 324 || 328 <= i && i <= 331 || i == 333 || 338 <= i && i <= 339 || 358 <= i && i <= 359 || i ==
    363 || i == 462 || i == 464 || i == 466 || i == 468 || i == 470 || i == 472 || i == 474 || i == 476 || i == 593 || i == 609 || i == 708 ||
    i == 711 || 713 <= i && i <= 715 || i == 717 || i == 720 || 728 <= i && i <= 731 || i == 733 || i == 735 || 768 <= i && i <= 879 || 913 <=
    i && i <= 929 || 931 <= i && i <= 937 || 945 <= i && i <= 961 || 963 <= i && i <= 969 || i == 1025 || 1040 <= i && i <= 1103 || i == 1105 ||
    i == 8208 || 8211 <= i && i <= 8214 || 8216 <= i && i <= 8217 || 8220 <= i && i <= 8221 || 8224 <= i && i <= 8226 || 8228 <= i && i <= 8231 ||
    i == 8240 || 8242 <= i && i <= 8243 || i == 8245 || i == 8251 || i == 8254 || i == 8308 || i == 8319 || 8321 <= i && i <= 8324 || i == 8364 ||
    i == 8451 || i == 8453 || i == 8457 || i == 8467 || i == 8470 || 8481 <= i && i <= 8482 || i == 8486 || i == 8491 || 8531 <= i && i <= 8532 ||
    8539 <= i && i <= 8542 || 8544 <= i && i <= 8555 || 8560 <= i && i <= 8569 || i == 8585 || 8592 <= i && i <= 8601 || 8632 <= i && i <= 8633 ||
    i == 8658 || i == 8660 || i == 8679 || i == 8704 || 8706 <= i && i <= 8707 || 8711 <= i && i <= 8712 || i == 8715 || i == 8719 || i == 8721 ||
    i == 8725 || i == 8730 || 8733 <= i && i <= 8736 || i == 8739 || i == 8741 || 8743 <= i && i <= 8748 || i == 8750 || 8756 <= i && i <= 8759 ||
    8764 <= i && i <= 8765 || i == 8776 || i == 8780 || i == 8786 || 8800 <= i && i <= 8801 || 8804 <= i && i <= 8807 || 8810 <= i && i <= 8811 ||
    8814 <= i && i <= 8815 || 8834 <= i && i <= 8835 || 8838 <= i && i <= 8839 || i == 8853 || i == 8857 || i == 8869 || i == 8895 || i == 8978 ||
    9312 <= i && i <= 9449 || 9451 <= i && i <= 9547 || 9552 <= i && i <= 9587 || 9600 <= i && i <= 9615 || 9618 <= i && i <= 9621 || 9632 <=
    i && i <= 9633 || 9635 <= i && i <= 9641 || 9650 <= i && i <= 9651 || 9654 <= i && i <= 9655 || 9660 <= i && i <= 9661 || 9664 <= i && i <=
    9665 || 9670 <= i && i <= 9672 || i == 9675 || 9678 <= i && i <= 9681 || 9698 <= i && i <= 9701 || i == 9711 || 9733 <= i && i <= 9734 ||
    i == 9737 || 9742 <= i && i <= 9743 || 9748 <= i && i <= 9749 || i == 9756 || i == 9758 || i == 9792 || i == 9794 || 9824 <= i && i <= 9825 ||
    9827 <= i && i <= 9829 || 9831 <= i && i <= 9834 || 9836 <= i && i <= 9837 || i == 9839 || 9886 <= i && i <= 9887 || 9918 <= i && i <= 9919 ||
    9924 <= i && i <= 9933 || 9935 <= i && i <= 9953 || i == 9955 || 9960 <= i && i <= 9983 || i == 10045 || i == 10071 || 10102 <= i && i <=
    10111 || 11093 <= i && i <= 11097 || 12872 <= i && i <= 12879 || 57344 <= i && i <= 63743 || 65024 <= i && i <= 65039 || i == 65533 || 127232 <=
    i && i <= 127242 || 127248 <= i && i <= 127277 || 127280 <= i && i <= 127337 || 127344 <= i && i <= 127386 || 917760 <= i && i <= 917999 ||
    983040 <= i && i <= 1048573 || 1048576 <= i && i <= 1114109 ? "A" : "N";
  };
  Pt.characterLength = function(e) {
    var t = this.eastAsianWidth(e);
    return t == "F" || t == "W" || t == "A" ? 2 : 1;
  };
  function Ab(e) {
    return e.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  }
  n(Ab, "stringToArray");
  Pt.length = function(e) {
    for (var t = Ab(e), r = 0, i = 0; i < t.length; i++)
      r = r + this.characterLength(t[i]);
    return r;
  };
  Pt.slice = function(e, t, r) {
    textLen = Pt.length(e), t = t || 0, r = r || 1, t < 0 && (t = textLen + t), r < 0 && (r = textLen + r);
    for (var i = "", s = 0, o = Ab(e), u = 0; u < o.length; u++) {
      var a = o[u], l = Pt.length(a);
      if (s >= t - (l == 2 ? 1 : 0))
        if (s + l <= r)
          i += a;
        else
          break;
      s += l;
    }
    return i;
  };
});

// ../node_modules/emoji-regex/index.js
var Is = b((hM, Tb) => {
  "use strict";
  Tb.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// ../node_modules/cli-boxes/boxes.json
var zb = b((IM, QT) => {
  QT.exports = {
    single: {
      topLeft: "\u250C",
      top: "\u2500",
      topRight: "\u2510",
      right: "\u2502",
      bottomRight: "\u2518",
      bottom: "\u2500",
      bottomLeft: "\u2514",
      left: "\u2502"
    },
    double: {
      topLeft: "\u2554",
      top: "\u2550",
      topRight: "\u2557",
      right: "\u2551",
      bottomRight: "\u255D",
      bottom: "\u2550",
      bottomLeft: "\u255A",
      left: "\u2551"
    },
    round: {
      topLeft: "\u256D",
      top: "\u2500",
      topRight: "\u256E",
      right: "\u2502",
      bottomRight: "\u256F",
      bottom: "\u2500",
      bottomLeft: "\u2570",
      left: "\u2502"
    },
    bold: {
      topLeft: "\u250F",
      top: "\u2501",
      topRight: "\u2513",
      right: "\u2503",
      bottomRight: "\u251B",
      bottom: "\u2501",
      bottomLeft: "\u2517",
      left: "\u2503"
    },
    singleDouble: {
      topLeft: "\u2553",
      top: "\u2500",
      topRight: "\u2556",
      right: "\u2551",
      bottomRight: "\u255C",
      bottom: "\u2500",
      bottomLeft: "\u2559",
      left: "\u2551"
    },
    doubleSingle: {
      topLeft: "\u2552",
      top: "\u2550",
      topRight: "\u2555",
      right: "\u2502",
      bottomRight: "\u255B",
      bottom: "\u2550",
      bottomLeft: "\u2558",
      left: "\u2502"
    },
    classic: {
      topLeft: "+",
      top: "-",
      topRight: "+",
      right: "|",
      bottomRight: "+",
      bottom: "-",
      bottomLeft: "+",
      left: "|"
    },
    arrow: {
      topLeft: "\u2198",
      top: "\u2193",
      topRight: "\u2199",
      right: "\u2190",
      bottomRight: "\u2196",
      bottom: "\u2191",
      bottomLeft: "\u2197",
      left: "\u2192"
    }
  };
});

// ../node_modules/cli-boxes/index.js
var Bl = b((LM, Rl) => {
  "use strict";
  var Vb = zb();
  Rl.exports = Vb;
  Rl.exports.default = Vb;
});

// ../node_modules/string-width/node_modules/ansi-regex/index.js
var Qb = b((HM, Xb) => {
  "use strict";
  Xb.exports = ({ onlyFirst: e = !1 } = {}) => {
    let t = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(t, e ? void 0 : "g");
  };
});

// ../node_modules/string-width/node_modules/strip-ansi/index.js
var e0 = b((WM, Zb) => {
  "use strict";
  var sR = Qb();
  Zb.exports = (e) => typeof e == "string" ? e.replace(sR(), "") : e;
});

// ../node_modules/is-fullwidth-code-point/index.js
var r0 = b(($M, Pl) => {
  "use strict";
  var t0 = /* @__PURE__ */ n((e) => Number.isNaN(e) ? !1 : e >= 4352 && (e <= 4447 || // Hangul Jamo
  e === 9001 || // LEFT-POINTING ANGLE BRACKET
  e === 9002 || // RIGHT-POINTING ANGLE BRACKET
  // CJK Radicals Supplement .. Enclosed CJK Letters and Months
  11904 <= e && e <= 12871 && e !== 12351 || // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
  12880 <= e && e <= 19903 || // CJK Unified Ideographs .. Yi Radicals
  19968 <= e && e <= 42182 || // Hangul Jamo Extended-A
  43360 <= e && e <= 43388 || // Hangul Syllables
  44032 <= e && e <= 55203 || // CJK Compatibility Ideographs
  63744 <= e && e <= 64255 || // Vertical Forms
  65040 <= e && e <= 65049 || // CJK Compatibility Forms .. Small Form Variants
  65072 <= e && e <= 65131 || // Halfwidth and Fullwidth Forms
  65281 <= e && e <= 65376 || 65504 <= e && e <= 65510 || // Kana Supplement
  110592 <= e && e <= 110593 || // Enclosed Ideographic Supplement
  127488 <= e && e <= 127569 || // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
  131072 <= e && e <= 262141), "isFullwidthCodePoint");
  Pl.exports = t0;
  Pl.exports.default = t0;
});

// ../node_modules/string-width/node_modules/emoji-regex/index.js
var n0 = b((VM, i0) => {
  "use strict";
  i0.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// ../node_modules/string-width/index.js
var o0 = b((GM, ql) => {
  "use strict";
  var oR = e0(), uR = r0(), aR = n0(), s0 = /* @__PURE__ */ n((e) => {
    if (typeof e != "string" || e.length === 0 || (e = oR(e), e.length === 0))
      return 0;
    e = e.replace(aR(), "  ");
    let t = 0;
    for (let r = 0; r < e.length; r++) {
      let i = e.codePointAt(r);
      i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879 || (i > 65535 && r++, t += uR(i) ? 2 : 1);
    }
    return t;
  }, "stringWidth");
  ql.exports = s0;
  ql.exports.default = s0;
});

// ../node_modules/ansi-align/index.js
var a0 = b((JM, u0) => {
  "use strict";
  var lR = o0();
  function er(e, t) {
    if (!e) return e;
    t = t || {};
    let r = t.align || "center";
    if (r === "left") return e;
    let i = t.split || `
`, s = t.pad || " ", o = r !== "right" ? fR : hR, u = !1;
    Array.isArray(e) || (u = !0, e = String(e).split(i));
    let a, l = 0;
    return e = e.map(function(f) {
      return f = String(f), a = lR(f), l = Math.max(a, l), {
        str: f,
        width: a
      };
    }).map(function(f) {
      return new Array(o(l, f.width) + 1).join(s) + f.str;
    }), u ? e.join(i) : e;
  }
  n(er, "ansiAlign");
  er.left = /* @__PURE__ */ n(function(t) {
    return er(t, { align: "left" });
  }, "left");
  er.center = /* @__PURE__ */ n(function(t) {
    return er(t, { align: "center" });
  }, "center");
  er.right = /* @__PURE__ */ n(function(t) {
    return er(t, { align: "right" });
  }, "right");
  u0.exports = er;
  function fR(e, t) {
    return Math.floor((e - t) / 2);
  }
  n(fR, "halfDiff");
  function hR(e, t) {
    return e - t;
  }
  n(hR, "fullDiff");
});

// ../node_modules/ts-dedent/dist/index.js
var Hl = b((Vi) => {
  "use strict";
  Object.defineProperty(Vi, "__esModule", { value: !0 });
  Vi.dedent = void 0;
  function C0(e) {
    for (var t = [], r = 1; r < arguments.length; r++)
      t[r - 1] = arguments[r];
    var i = Array.from(typeof e == "string" ? [e] : e);
    i[i.length - 1] = i[i.length - 1].replace(/\r?\n([\t ]*)$/, "");
    var s = i.reduce(function(a, l) {
      var f = l.match(/\n([\t ]+|(?!\s).)/g);
      return f ? a.concat(f.map(function(p) {
        var d, c;
        return (c = (d = p.match(/[\t ]/g)) === null || d === void 0 ? void 0 : d.length) !== null && c !== void 0 ? c : 0;
      })) : a;
    }, []);
    if (s.length) {
      var o = new RegExp(`
[	 ]{` + Math.min.apply(Math, s) + "}", "g");
      i = i.map(function(a) {
        return a.replace(o, `
`);
      });
    }
    i[0] = i[0].replace(/^\r?\n/, "");
    var u = i[0];
    return t.forEach(function(a, l) {
      var f = u.match(/(?:^|\n)( *)$/), p = f ? f[1] : "", d = a;
      typeof a == "string" && a.includes(`
`) && (d = String(a).split(`
`).map(function(c, h) {
        return h === 0 ? c : "" + p + c;
      }).join(`
`)), u += d + i[l + 1];
    }), u;
  }
  n(C0, "dedent");
  Vi.dedent = C0;
  Vi.default = C0;
});

// src/cli/detect.ts
import { existsSync as Ms } from "node:fs";
import { resolve as ST } from "node:path";
import { HandledError as AT, commandLog as xb } from "@storybook/core/common";
import { logger as TT } from "@storybook/core/node-logger";

// node_modules/find-up/index.js
import Nr from "node:path";

// ../node_modules/locate-path/index.js
import U0 from "node:process";
import H0 from "node:path";
import Yl, { promises as a8 } from "node:fs";
import { fileURLToPath as W0 } from "node:url";
var Jl = {
  directory: "isDirectory",
  file: "isFile"
};
function $0(e) {
  if (!Object.hasOwnProperty.call(Jl, e))
    throw new Error(`Invalid type specified: ${e}`);
}
n($0, "checkType");
var z0 = /* @__PURE__ */ n((e, t) => t[Jl[e]](), "matchType"), V0 = /* @__PURE__ */ n((e) => e instanceof URL ? W0(e) : e, "toPath");
function Gs(e, {
  cwd: t = U0.cwd(),
  type: r = "file",
  allowSymlinks: i = !0
} = {}) {
  $0(r), t = V0(t);
  let s = i ? Yl.statSync : Yl.lstatSync;
  for (let o of e)
    try {
      let u = s(H0.resolve(t, o), {
        throwIfNoEntry: !1
      });
      if (!u)
        continue;
      if (z0(r, u))
        return o;
    } catch {
    }
}
n(Gs, "locatePathSync");

// ../node_modules/unicorn-magic/node.js
import { fileURLToPath as G0 } from "node:url";
function Ys(e) {
  return e instanceof URL ? G0(e) : e;
}
n(Ys, "toPath");

// node_modules/path-exists/index.js
import y8, { promises as b8 } from "node:fs";

// node_modules/find-up/index.js
var Y0 = Symbol("findUpStop");
function J0(e, t = {}) {
  let r = Nr.resolve(Ys(t.cwd) ?? ""), { root: i } = Nr.parse(r), s = Nr.resolve(r, Ys(t.stopAt) ?? i), o = t.limit ?? Number.POSITIVE_INFINITY,
  u = [e].flat(), a = /* @__PURE__ */ n((f) => {
    if (typeof e != "function")
      return Gs(u, f);
    let p = e(f.cwd);
    return typeof p == "string" ? Gs([p], f) : p;
  }, "runMatcher"), l = [];
  for (; ; ) {
    let f = a({ ...t, cwd: r });
    if (f === Y0 || (f && l.push(Nr.resolve(r, f)), r === s || l.length >= o))
      break;
    r = Nr.dirname(r);
  }
  return l;
}
n(J0, "findUpMultipleSync");
function rr(e, t = {}) {
  return J0(e, { ...t, limit: 1 })[0];
}
n(rr, "findUpSync");

// src/cli/detect.ts
var Sb = be(cn(), 1);
import Qt from "semver";

// src/cli/helpers.ts
import { cpSync as dT, existsSync as vt, readFileSync as pT, writeFileSync as DT } from "node:fs";
import { cp as _b, readFile as mT, writeFile as gT } from "node:fs/promises";
import { join as qr, resolve as _l } from "node:path";
import {
  frameworkToRenderer as yT
} from "@storybook/core/common";
import { versions as bT } from "@storybook/core/common";
var Eb = be(au(), 1);
import { coerce as Cb, major as vT, satisfies as wT } from "semver";

// ../node_modules/strip-json-comments/index.js
var lu = Symbol("singleComment"), Ad = Symbol("multiComment"), iE = /* @__PURE__ */ n(() => "", "stripWithoutWhitespace"), nE = /* @__PURE__ */ n(
(e, t, r) => e.slice(t, r).replace(/\S/g, " "), "stripWithWhitespace"), sE = /* @__PURE__ */ n((e, t) => {
  let r = t - 1, i = 0;
  for (; e[r] === "\\"; )
    r -= 1, i += 1;
  return !!(i % 2);
}, "isEscaped");
function fu(e, { whitespace: t = !0, trailingCommas: r = !1 } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof e}\``);
  let i = t ? nE : iE, s = !1, o = !1, u = 0, a = "", l = "", f = -1;
  for (let p = 0; p < e.length; p++) {
    let d = e[p], c = e[p + 1];
    if (!o && d === '"' && (sE(e, p) || (s = !s)), !s)
      if (!o && d + c === "//")
        a += e.slice(u, p), u = p, o = lu, p++;
      else if (o === lu && d + c === `\r
`) {
        p++, o = !1, a += i(e, u, p), u = p;
        continue;
      } else if (o === lu && d === `
`)
        o = !1, a += i(e, u, p), u = p;
      else if (!o && d + c === "/*") {
        a += e.slice(u, p), u = p, o = Ad, p++;
        continue;
      } else if (o === Ad && d + c === "*/") {
        p++, o = !1, a += i(e, u, p + 1), u = p + 1;
        continue;
      } else r && !o && (f !== -1 ? d === "}" || d === "]" ? (a += e.slice(u, p), l += i(a, 0, 1) + a.slice(1), a = "", u = p, f = -1) : d !==
      " " && d !== "	" && d !== "\r" && d !== `
` && (a += e.slice(u, p), u = p, f = -1) : d === "," && (l += a + e.slice(u, p), a = "", u = p, f = p));
  }
  return l + a + (o ? i(e.slice(u)) : e.slice(u));
}
n(fu, "stripJsonComments");

// ../node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var oE = process.env.NODE_ENV === "production", hu = "Invariant failed";
function Qr(e, t) {
  if (!e) {
    if (oE)
      throw new Error(hu);
    var r = typeof t == "function" ? t() : t, i = r ? "".concat(hu, ": ").concat(r) : hu;
    throw new Error(i);
  }
}
n(Qr, "invariant");

// src/cli/dirs.ts
var vl = be(hb(), 1), wl = be(pb(), 1);
import { dirname as lT, join as vb } from "node:path";
import { temporaryDirectory as fT, versions as hT } from "@storybook/core/common";

// src/cli/project_types.ts
import { minVersion as iT, validRange as nT } from "semver";
function sT(e, t) {
  return nT(e) ? iT(e)?.major === t : !1;
}
n(sT, "eqMajor");
var Db = [
  { name: "qwik", packageName: "storybook-framework-qwik" },
  { name: "solid", frameworks: ["storybook-solidjs-vite"], renderer: "storybook-solidjs" },
  {
    name: "nuxt",
    packageName: "@storybook-vue/nuxt",
    frameworks: ["@storybook-vue/nuxt"],
    renderer: "@storybook/vue3"
  }
], lq = [
  "react",
  "react-native",
  "vue3",
  "angular",
  "ember",
  "preact",
  "svelte",
  "qwik",
  "solid"
], bl = /* @__PURE__ */ ((F) => (F.UNDETECTED = "UNDETECTED", F.UNSUPPORTED = "UNSUPPORTED", F.REACT = "REACT", F.REACT_SCRIPTS = "REACT_SCR\
IPTS", F.REACT_NATIVE = "REACT_NATIVE", F.REACT_NATIVE_WEB = "REACT_NATIVE_WEB", F.REACT_PROJECT = "REACT_PROJECT", F.WEBPACK_REACT = "WEBPA\
CK_REACT", F.NEXTJS = "NEXTJS", F.VUE3 = "VUE3", F.NUXT = "NUXT", F.ANGULAR = "ANGULAR", F.EMBER = "EMBER", F.WEB_COMPONENTS = "WEB_COMPONEN\
TS", F.HTML = "HTML", F.QWIK = "QWIK", F.PREACT = "PREACT", F.SVELTE = "SVELTE", F.SVELTEKIT = "SVELTEKIT", F.SERVER = "SERVER", F.NX = "NX",
F.SOLID = "SOLID", F))(bl || {}), mb = /* @__PURE__ */ ((r) => (r.Webpack5 = "webpack5", r.Vite = "vite", r))(mb || {}), oT = /* @__PURE__ */ ((r) => (r.
Babel = "babel", r.SWC = "swc", r))(oT || {}), uT = /* @__PURE__ */ ((t) => (t.Rsbuild = "rsbuild", t))(uT || {}), fq = {
  "@storybook/addon-webpack5-compiler-babel": "babel",
  "@storybook/addon-webpack5-compiler-swc": "swc"
}, hq = {
  "@storybook/builder-webpack5": "webpack5",
  "@storybook/builder-vite": "vite"
}, gb = /* @__PURE__ */ ((i) => (i.JAVASCRIPT = "javascript", i.TYPESCRIPT_3_8 = "typescript-3-8", i.TYPESCRIPT_4_9 = "typescript-4-9", i))(
gb || {}), yb = [
  {
    preset: "NUXT",
    dependencies: ["nuxt"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "VUE3",
    dependencies: {
      // This Vue template works with Vue 3
      vue: /* @__PURE__ */ n((e) => e === "next" || sT(e, 3), "vue")
    },
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.some(Boolean) ?? !1, "matcherFunction")
  },
  {
    preset: "EMBER",
    dependencies: ["ember-cli"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "NEXTJS",
    dependencies: ["next"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "QWIK",
    dependencies: ["@builder.io/qwik"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "REACT_PROJECT",
    peerDependencies: ["react"],
    matcherFunction: /* @__PURE__ */ n(({ peerDependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "REACT_NATIVE",
    dependencies: ["react-native", "react-native-scripts"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.some(Boolean) ?? !1, "matcherFunction")
  },
  {
    preset: "REACT_SCRIPTS",
    // For projects using a custom/forked `react-scripts` package.
    files: ["/node_modules/.bin/react-scripts"],
    // For standard CRA projects
    dependencies: ["react-scripts"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e, files: t }) => (e?.every(Boolean) || t?.every(Boolean)) ?? !1, "matcherFunction")
  },
  {
    preset: "ANGULAR",
    dependencies: ["@angular/core"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "WEB_COMPONENTS",
    dependencies: ["lit-element", "lit-html", "lit"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.some(Boolean) ?? !1, "matcherFunction")
  },
  {
    preset: "PREACT",
    dependencies: ["preact"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    // TODO: This only works because it is before the SVELTE template. could be more explicit
    preset: "SVELTEKIT",
    dependencies: ["@sveltejs/kit"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "SVELTE",
    dependencies: ["svelte"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "SOLID",
    dependencies: ["solid-js"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  // DO NOT MOVE ANY TEMPLATES BELOW THIS LINE
  // React is part of every Template, after Storybook is initialized once
  {
    preset: "WEBPACK_REACT",
    dependencies: ["react", "webpack"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "REACT",
    dependencies: ["react"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  }
], bb = {
  preset: "UNSUPPORTED",
  dependencies: {},
  matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.some(Boolean) ?? !1, "matcherFunction")
}, aT = [
  "UNDETECTED",
  "UNSUPPORTED",
  "NX"
], cq = Object.values(bl).filter((e) => !aT.includes(e)).map((e) => e.toLowerCase());

// src/cli/dirs.ts
var cT = /* @__PURE__ */ n(async (e, t) => {
  let r = await fT(), s = hT[t] || await e.latestVersion(t), o = wl.default.default || wl.default, u = vl.default.default || vl.default, a = o(
  t, s, {
    registry: await e.getRegistryURL()
  });
  return await u({ url: a, dir: r }), vb(r, "package");
}, "resolveUsingBranchInstall");
async function wb(e, t) {
  let r = Db.find((u) => u.name === t), i = r?.packageName || r?.renderer || `@storybook/${t}`, s = vb(i, "package.json"), o = [];
  try {
    return lT(
      E.resolve(s, {
        paths: [process.cwd()]
      })
    );
  } catch (u) {
    Qr(u instanceof Error), o.push(u);
  }
  try {
    return await cT(e, i);
  } catch (u) {
    Qr(u instanceof Error), o.push(u);
  }
  throw new Error(`Cannot find ${s}, ${o.map((u) => u.stack).join(`

`)}`);
}
n(wb, "getRendererDir");

// src/cli/helpers.ts
var _T = console;
function Bq(e, t) {
  let r = _l(e);
  if (!vt(r))
    return !1;
  let i = pT(r, "utf8"), s = t ? fu(i) : i;
  try {
    return JSON.parse(s);
  } catch (o) {
    throw _T.error(Eb.default.red(`Invalid json in file: ${r}`)), o;
  }
}
n(Bq, "readFileAsJson");
var kq = /* @__PURE__ */ n((e, t) => {
  let r = _l(e);
  return vt(r) ? (DT(r, `${JSON.stringify(t, null, 2)}
`), !0) : !1;
}, "writeFileAsJson");
async function Oq(e, t) {
  let r = [], i = "^8.0.0-0", s = t.dependencies["babel-core"] || t.devDependencies["babel-core"];
  if (s) {
    let o = await e.latestVersion(
      "babel-core",
      s
    );
    wT(o, "^6.0.0") && (i = "^7.0.0");
  } else if (!t.dependencies["@babel/core"] && !t.devDependencies["@babel/core"]) {
    let o = await e.getVersion("@babel/core");
    r.push(`@babel/core@${o}`);
  }
  if (!t.dependencies["babel-loader"] && !t.devDependencies["babel-loader"]) {
    let o = await e.getVersion(
      "babel-loader",
      i
    );
    r.push(`babel-loader@${o}`);
  }
  return r;
}
n(Oq, "getBabelDependencies");
function Pq(e, t, r) {
  !e.dependencies?.[t] && !e.devDependencies?.[t] && (e.devDependencies ? e.devDependencies[t] = r : e.devDependencies = {
    [t]: r
  });
}
n(Pq, "addToDevDependenciesIfNotPresent");
function qq(e, t = ".") {
  let r = _l(e, "template-csf/");
  if (!vt(r))
    throw new Error("Couldn't find template dir");
  dT(r, t, { recursive: !0 });
}
n(qq, "copyTemplate");
var ET = yT, Mq = {
  angular: "webpack5",
  ember: "webpack5",
  "html-vite": "vite",
  "html-webpack5": "webpack5",
  nextjs: "webpack5",
  nuxt: "vite",
  "experimental-nextjs-vite": "vite",
  "preact-vite": "vite",
  "preact-webpack5": "webpack5",
  qwik: "vite",
  "react-native-web-vite": "vite",
  "react-vite": "vite",
  "react-webpack5": "webpack5",
  "server-webpack5": "webpack5",
  solid: "vite",
  "svelte-vite": "vite",
  "svelte-webpack5": "webpack5",
  sveltekit: "vite",
  "vue3-vite": "vite",
  "vue3-webpack5": "webpack5",
  "web-components-vite": "vite",
  "web-components-webpack5": "webpack5",
  // Only to pass type checking, will never be used
  "react-rsbuild": "rsbuild",
  "vue3-rsbuild": "rsbuild"
};
async function CT(e, t) {
  try {
    let r = await e.getInstalledVersion(t);
    return r || (r = (await e.getAllDependencies())[t] ?? ""), Cb(r, { includePrerelease: !0 })?.toString();
  } catch {
  }
}
n(CT, "getVersionSafe");
var FT = /* @__PURE__ */ n(async () => vt("./src") ? "./src/stories" : "./stories", "cliStoriesTargetPath");
async function jq({
  packageManager: e,
  renderer: t,
  language: r,
  destination: i,
  commonAssetsDir: s,
  features: o
}) {
  let u = {
    // keeping this for backwards compatibility in case community packages are using it
    typescript: "ts",
    javascript: "js",
    "typescript-3-8": "ts-3-8",
    "typescript-4-9": "ts-4-9"
  };
  if (t === "svelte") {
    let p = await CT(e, "svelte");
    p && vT(p) >= 5 && (u = {
      // keeping this for backwards compatibility in case community packages are using it
      typescript: "ts",
      javascript: "svelte-5-js",
      "typescript-3-8": "svelte-5-ts-3-8",
      "typescript-4-9": "svelte-5-ts-4-9"
    });
  }
  let a = /* @__PURE__ */ n(async () => {
    let p = await wb(e, t), d = qr(p, "template", "cli"), c = qr(d, u[r]), h = qr(d, u.javascript), g = qr(d, u.typescript), w = qr(d, u["ty\
pescript-3-8"]);
    if (vt(c))
      return c;
    if (r === "typescript-4-9" && vt(w))
      return w;
    if (vt(g))
      return g;
    if (vt(h))
      return h;
    if (vt(d))
      return d;
    throw new Error(`Unsupported renderer: ${t} (${p})`);
  }, "templatePath"), l = i ?? await FT(), f = /* @__PURE__ */ n((p) => o.includes("docs") || !p.endsWith(".mdx"), "filter");
  if (s && await _b(s, l, { recursive: !0, filter: f }), await _b(await a(), l, { recursive: !0, filter: f }), s && o.includes("docs")) {
    let p = ET[t] || "react";
    p === "vue3" && (p = "vue"), await xT(qr(l, "Configure.mdx"), { renderer: p });
  }
}
n(jq, "copyTemplateFiles");
async function xT(e, t) {
  let r = await mT(e, { encoding: "utf8" });
  Object.keys(t).forEach((i) => {
    r = r.replaceAll(`{{${i}}}`, `${t[i]}`);
  }), await gT(e, r);
}
n(xT, "adjustTemplate");
function Iq(e) {
  let t = {
    ...e.dependencies,
    ...e.devDependencies,
    ...e.optionalDependencies
  }, r = Object.keys(t).find((i) => bT[i]);
  if (!r)
    throw new Error("Couldn't find any official storybook packages in package.json");
  return t[r];
}
n(Iq, "getStorybookVersionSpecifier");
async function Fb() {
  return rr("nx.json");
}
n(Fb, "isNxProject");
function Lq(e) {
  let t = Cb(e);
  return Qr(t != null, `Could not coerce ${e} into a semver.`), t;
}
n(Lq, "coerceSemver");
async function Nq(e) {
  let t = await e.getAllDependencies();
  return Object.keys(t).some((r) => r.includes("storybook"));
}
n(Nq, "hasStorybookDependencies");

// src/cli/detect.ts
var RT = ["vite.config.ts", "vite.config.js", "vite.config.mjs"], BT = ["webpack.config.js"], kT = /* @__PURE__ */ n((e, t, r) => {
  let i = e.dependencies?.[t] || e.devDependencies?.[t];
  return i && typeof r == "function" ? r(i) : !!i;
}, "hasDependency"), OT = /* @__PURE__ */ n((e, t, r) => {
  let i = e.peerDependencies?.[t];
  return i && typeof r == "function" ? r(i) : !!i;
}, "hasPeerDependency"), PT = /* @__PURE__ */ n((e, t) => {
  let r = {
    dependencies: [!1],
    peerDependencies: [!1],
    files: [!1]
  }, { preset: i, files: s, dependencies: o, peerDependencies: u, matcherFunction: a } = t, l = [];
  Array.isArray(o) ? l = o.map((p) => [p, void 0]) : typeof o == "object" && (l = Object.entries(o)), l.length > 0 && (r.dependencies = l.map(
    ([p, d]) => kT(e, p, d)
  ));
  let f = [];
  return Array.isArray(u) ? f = u.map((p) => [p, void 0]) : typeof u == "object" && (f = Object.entries(u)), f.length > 0 && (r.peerDependencies =
  f.map(
    ([p, d]) => OT(e, p, d)
  )), Array.isArray(s) && s.length > 0 && (r.files = s.map((p) => Ms(p))), a(r) ? i : null;
}, "getFrameworkPreset");
function qT(e = {}) {
  let t = [...yb, bb].find((r) => PT(e, r) !== null);
  return t ? t.preset : "UNDETECTED";
}
n(qT, "detectFrameworkPreset");
async function Xq(e, t) {
  let r = rr(RT), i = rr(BT), s = await e.getAllDependencies();
  if (r || s.vite && s.webpack === void 0)
    return xb("Detected Vite project. Setting builder to Vite")(), "vite";
  if (i || (s.webpack || s["@nuxt/webpack-builder"]) && s.vite !== void 0)
    return xb("Detected webpack project. Setting builder to webpack")(), "webpack5";
  switch (t) {
    case "REACT_NATIVE_WEB":
      return "vite";
    case "REACT_SCRIPTS":
    case "ANGULAR":
    case "REACT_NATIVE":
    // technically react native doesn't use webpack, we just want to set something
    case "NEXTJS":
    case "EMBER":
      return "webpack5";
    case "NUXT":
      return "vite";
    default:
      let { builder: o } = await (0, Sb.default)(
        {
          type: "select",
          name: "builder",
          message: `
We were not able to detect the right builder for your project. Please select one:`,
          choices: [
            { title: "Vite", value: "vite" },
            { title: "Webpack 5", value: "webpack5" }
          ]
        },
        {
          onCancel: /* @__PURE__ */ n(() => {
            throw new AT("Canceled by the user");
          }, "onCancel")
        }
      );
      return o;
  }
}
n(Xq, "detectBuilder");
function Qq(e = ST(process.cwd(), ".storybook")) {
  return Ms(e);
}
n(Qq, "isStorybookInstantiated");
async function Zq() {
  return !!rr([".pnp.js", ".pnp.cjs"]);
}
n(Zq, "detectPnp");
async function eM(e) {
  let t = "javascript";
  if (Ms("jsconfig.json"))
    return t;
  let r = await e.getAllDependencies().then((l) => !!l.typescript), i = await e.getPackageVersion("typescript"), s = await e.getPackageVersion(
  "prettier"), o = await e.getPackageVersion(
    "@babel/plugin-transform-typescript"
  ), u = await e.getPackageVersion(
    "@typescript-eslint/parser"
  ), a = await e.getPackageVersion("eslint-plugin-storybook");
  return r && i ? Qt.gte(i, "4.9.0") && (!s || Qt.gte(s, "2.8.0")) && (!o || Qt.gte(o, "7.20.0")) && (!u || Qt.gte(u, "5.44.0")) && (!a || Qt.
  gte(a, "0.6.8")) ? t = "typescript-4-9" : Qt.gte(i, "3.8.0") ? t = "typescript-3-8" : Qt.lt(i, "3.8.0") && TT.warn("Detected TypeScript < \
3.8, populating with JavaScript examples") : Ms("tsconfig.json") && (t = "typescript-4-9"), t;
}
n(eM, "detectLanguage");
async function tM(e, t = {}) {
  let r = await e.retrievePackageJson();
  return r ? await Fb() ? "NX" : t.html ? "HTML" : qT(r) : "UNDETECTED";
}
n(tM, "detect");

// src/cli/angular/helpers.ts
import { existsSync as RR, readFileSync as BR, writeFileSync as kR } from "node:fs";
import { join as OR } from "node:path";
import { logger as PR } from "@storybook/core/node-logger";
import { MissingAngularJsonError as qR } from "@storybook/core/server-errors";

// ../node_modules/boxen/index.js
import $s from "node:process";

// ../node_modules/ansi-regex/index.js
function El({ onlyFirst: e = !1 } = {}) {
  let t = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|");
  return new RegExp(t, e ? void 0 : "g");
}
n(El, "ansiRegex");

// ../node_modules/strip-ansi/index.js
var MT = El();
function wt(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected a \`string\`, got \`${typeof e}\``);
  return e.replace(MT, "");
}
n(wt, "stripAnsi");

// ../node_modules/boxen/node_modules/string-width/index.js
var Rb = be(js(), 1), Bb = be(Is(), 1);
function Ze(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, Bb.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (Rb.default.eastAsianWidth(s)) {
      case "F":
      case "W":
        i += 2;
        break;
      case "A":
        i += r;
        break;
      default:
        i += 1;
    }
  }
  return i;
}
n(Ze, "stringWidth");

// ../node_modules/boxen/node_modules/chalk/source/vendor/ansi-styles/index.js
var kb = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${t + e}m`, "wrapAnsi16"), Ob = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${38 + e};5;${t}\
m`, "wrapAnsi256"), Pb = /* @__PURE__ */ n((e = 0) => (t, r, i) => `\x1B[${38 + e};2;${t};${r};${i}m`, "wrapAnsi16m"), se = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
}, DM = Object.keys(se.modifier), jT = Object.keys(se.color), IT = Object.keys(se.bgColor), mM = [...jT, ...IT];
function LT() {
  let e = /* @__PURE__ */ new Map();
  for (let [t, r] of Object.entries(se)) {
    for (let [i, s] of Object.entries(r))
      se[i] = {
        open: `\x1B[${s[0]}m`,
        close: `\x1B[${s[1]}m`
      }, r[i] = se[i], e.set(s[0], s[1]);
    Object.defineProperty(se, t, {
      value: r,
      enumerable: !1
    });
  }
  return Object.defineProperty(se, "codes", {
    value: e,
    enumerable: !1
  }), se.color.close = "\x1B[39m", se.bgColor.close = "\x1B[49m", se.color.ansi = kb(), se.color.ansi256 = Ob(), se.color.ansi16m = Pb(), se.
  bgColor.ansi = kb(10), se.bgColor.ansi256 = Ob(10), se.bgColor.ansi16m = Pb(10), Object.defineProperties(se, {
    rgbToAnsi256: {
      value(t, r, i) {
        return t === r && r === i ? t < 8 ? 16 : t > 248 ? 231 : Math.round((t - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(t / 255 * 5) + 6 *
        Math.round(r / 255 * 5) + Math.round(i / 255 * 5);
      },
      enumerable: !1
    },
    hexToRgb: {
      value(t) {
        let r = /[a-f\d]{6}|[a-f\d]{3}/i.exec(t.toString(16));
        if (!r)
          return [0, 0, 0];
        let [i] = r;
        i.length === 3 && (i = [...i].map((o) => o + o).join(""));
        let s = Number.parseInt(i, 16);
        return [
          /* eslint-disable no-bitwise */
          s >> 16 & 255,
          s >> 8 & 255,
          s & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: !1
    },
    hexToAnsi256: {
      value: /* @__PURE__ */ n((t) => se.rgbToAnsi256(...se.hexToRgb(t)), "value"),
      enumerable: !1
    },
    ansi256ToAnsi: {
      value(t) {
        if (t < 8)
          return 30 + t;
        if (t < 16)
          return 90 + (t - 8);
        let r, i, s;
        if (t >= 232)
          r = ((t - 232) * 10 + 8) / 255, i = r, s = r;
        else {
          t -= 16;
          let a = t % 36;
          r = Math.floor(t / 36) / 5, i = Math.floor(a / 6) / 5, s = a % 6 / 5;
        }
        let o = Math.max(r, i, s) * 2;
        if (o === 0)
          return 30;
        let u = 30 + (Math.round(s) << 2 | Math.round(i) << 1 | Math.round(r));
        return o === 2 && (u += 60), u;
      },
      enumerable: !1
    },
    rgbToAnsi: {
      value: /* @__PURE__ */ n((t, r, i) => se.ansi256ToAnsi(se.rgbToAnsi256(t, r, i)), "value"),
      enumerable: !1
    },
    hexToAnsi: {
      value: /* @__PURE__ */ n((t) => se.ansi256ToAnsi(se.hexToAnsi256(t)), "value"),
      enumerable: !1
    }
  }), se;
}
n(LT, "assembleStyles");
var NT = LT(), Ne = NT;

// ../node_modules/boxen/node_modules/chalk/source/vendor/supports-color/index.js
import Fl from "node:process";
import UT from "node:os";
import qb from "node:tty";
function Me(e, t = globalThis.Deno ? globalThis.Deno.args : Fl.argv) {
  let r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", i = t.indexOf(r + e), s = t.indexOf("--");
  return i !== -1 && (s === -1 || i < s);
}
n(Me, "hasFlag");
var { env: fe } = Fl, Ls;
Me("no-color") || Me("no-colors") || Me("color=false") || Me("color=never") ? Ls = 0 : (Me("color") || Me("colors") || Me("color=true") || Me(
"color=always")) && (Ls = 1);
function HT() {
  if ("FORCE_COLOR" in fe)
    return fe.FORCE_COLOR === "true" ? 1 : fe.FORCE_COLOR === "false" ? 0 : fe.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(fe.FORCE_COLOR,
    10), 3);
}
n(HT, "envForceColor");
function WT(e) {
  return e === 0 ? !1 : {
    level: e,
    hasBasic: !0,
    has256: e >= 2,
    has16m: e >= 3
  };
}
n(WT, "translateLevel");
function $T(e, { streamIsTTY: t, sniffFlags: r = !0 } = {}) {
  let i = HT();
  i !== void 0 && (Ls = i);
  let s = r ? Ls : i;
  if (s === 0)
    return 0;
  if (r) {
    if (Me("color=16m") || Me("color=full") || Me("color=truecolor"))
      return 3;
    if (Me("color=256"))
      return 2;
  }
  if ("TF_BUILD" in fe && "AGENT_NAME" in fe)
    return 1;
  if (e && !t && s === void 0)
    return 0;
  let o = s || 0;
  if (fe.TERM === "dumb")
    return o;
  if (Fl.platform === "win32") {
    let u = UT.release().split(".");
    return Number(u[0]) >= 10 && Number(u[2]) >= 10586 ? Number(u[2]) >= 14931 ? 3 : 2 : 1;
  }
  if ("CI" in fe)
    return "GITHUB_ACTIONS" in fe || "GITEA_ACTIONS" in fe ? 3 : ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some(
    (u) => u in fe) || fe.CI_NAME === "codeship" ? 1 : o;
  if ("TEAMCITY_VERSION" in fe)
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(fe.TEAMCITY_VERSION) ? 1 : 0;
  if (fe.COLORTERM === "truecolor" || fe.TERM === "xterm-kitty")
    return 3;
  if ("TERM_PROGRAM" in fe) {
    let u = Number.parseInt((fe.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (fe.TERM_PROGRAM) {
      case "iTerm.app":
        return u >= 3 ? 3 : 2;
      case "Apple_Terminal":
        return 2;
    }
  }
  return /-256(color)?$/i.test(fe.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(fe.TERM) || "COLORTERM" in fe ?
  1 : o;
}
n($T, "_supportsColor");
function Mb(e, t = {}) {
  let r = $T(e, {
    streamIsTTY: e && e.isTTY,
    ...t
  });
  return WT(r);
}
n(Mb, "createSupportsColor");
var zT = {
  stdout: Mb({ isTTY: qb.isatty(1) }),
  stderr: Mb({ isTTY: qb.isatty(2) })
}, jb = zT;

// ../node_modules/boxen/node_modules/chalk/source/utilities.js
function Ib(e, t, r) {
  let i = e.indexOf(t);
  if (i === -1)
    return e;
  let s = t.length, o = 0, u = "";
  do
    u += e.slice(o, i) + t + r, o = i + s, i = e.indexOf(t, o);
  while (i !== -1);
  return u += e.slice(o), u;
}
n(Ib, "stringReplaceAll");
function Lb(e, t, r, i) {
  let s = 0, o = "";
  do {
    let u = e[i - 1] === "\r";
    o += e.slice(s, u ? i - 1 : i) + t + (u ? `\r
` : `
`) + r, s = i + 1, i = e.indexOf(`
`, s);
  } while (i !== -1);
  return o += e.slice(s), o;
}
n(Lb, "stringEncaseCRLFWithFirstIndex");

// ../node_modules/boxen/node_modules/chalk/source/index.js
var { stdout: Nb, stderr: Ub } = jb, xl = Symbol("GENERATOR"), Mr = Symbol("STYLER"), Hi = Symbol("IS_EMPTY"), Hb = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
], jr = /* @__PURE__ */ Object.create(null), VT = /* @__PURE__ */ n((e, t = {}) => {
  if (t.level && !(Number.isInteger(t.level) && t.level >= 0 && t.level <= 3))
    throw new Error("The `level` option should be an integer from 0 to 3");
  let r = Nb ? Nb.level : 0;
  e.level = t.level === void 0 ? r : t.level;
}, "applyOptions");
var GT = /* @__PURE__ */ n((e) => {
  let t = /* @__PURE__ */ n((...r) => r.join(" "), "chalk");
  return VT(t, e), Object.setPrototypeOf(t, Wi.prototype), t;
}, "chalkFactory");
function Wi(e) {
  return GT(e);
}
n(Wi, "createChalk");
Object.setPrototypeOf(Wi.prototype, Function.prototype);
for (let [e, t] of Object.entries(Ne))
  jr[e] = {
    get() {
      let r = Ns(this, Al(t.open, t.close, this[Mr]), this[Hi]);
      return Object.defineProperty(this, e, { value: r }), r;
    }
  };
jr.visible = {
  get() {
    let e = Ns(this, this[Mr], !0);
    return Object.defineProperty(this, "visible", { value: e }), e;
  }
};
var Sl = /* @__PURE__ */ n((e, t, r, ...i) => e === "rgb" ? t === "ansi16m" ? Ne[r].ansi16m(...i) : t === "ansi256" ? Ne[r].ansi256(Ne.rgbToAnsi256(
...i)) : Ne[r].ansi(Ne.rgbToAnsi(...i)) : e === "hex" ? Sl("rgb", t, r, ...Ne.hexToRgb(...i)) : Ne[r][e](...i), "getModelAnsi"), YT = ["rgb",
"hex", "ansi256"];
for (let e of YT) {
  jr[e] = {
    get() {
      let { level: r } = this;
      return function(...i) {
        let s = Al(Sl(e, Hb[r], "color", ...i), Ne.color.close, this[Mr]);
        return Ns(this, s, this[Hi]);
      };
    }
  };
  let t = "bg" + e[0].toUpperCase() + e.slice(1);
  jr[t] = {
    get() {
      let { level: r } = this;
      return function(...i) {
        let s = Al(Sl(e, Hb[r], "bgColor", ...i), Ne.bgColor.close, this[Mr]);
        return Ns(this, s, this[Hi]);
      };
    }
  };
}
var JT = Object.defineProperties(() => {
}, {
  ...jr,
  level: {
    enumerable: !0,
    get() {
      return this[xl].level;
    },
    set(e) {
      this[xl].level = e;
    }
  }
}), Al = /* @__PURE__ */ n((e, t, r) => {
  let i, s;
  return r === void 0 ? (i = e, s = t) : (i = r.openAll + e, s = t + r.closeAll), {
    open: e,
    close: t,
    openAll: i,
    closeAll: s,
    parent: r
  };
}, "createStyler"), Ns = /* @__PURE__ */ n((e, t, r) => {
  let i = /* @__PURE__ */ n((...s) => KT(i, s.length === 1 ? "" + s[0] : s.join(" ")), "builder");
  return Object.setPrototypeOf(i, JT), i[xl] = e, i[Mr] = t, i[Hi] = r, i;
}, "createBuilder"), KT = /* @__PURE__ */ n((e, t) => {
  if (e.level <= 0 || !t)
    return e[Hi] ? "" : t;
  let r = e[Mr];
  if (r === void 0)
    return t;
  let { openAll: i, closeAll: s } = r;
  if (t.includes("\x1B"))
    for (; r !== void 0; )
      t = Ib(t, r.close, r.open), r = r.parent;
  let o = t.indexOf(`
`);
  return o !== -1 && (t = Lb(t, s, i, o)), i + t + s;
}, "applyStyle");
Object.defineProperties(Wi.prototype, jr);
var XT = Wi(), TM = Wi({ level: Ub ? Ub.level : 0 });
var Zt = XT;

// ../node_modules/widest-line/node_modules/string-width/index.js
var Wb = be(js(), 1), $b = be(Is(), 1);
function Tl(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, $b.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (Wb.default.eastAsianWidth(s)) {
      case "F":
      case "W":
        i += 2;
        break;
      case "A":
        i += r;
        break;
      default:
        i += 1;
    }
  }
  return i;
}
n(Tl, "stringWidth");

// ../node_modules/widest-line/index.js
function Us(e) {
  let t = 0;
  for (let r of e.split(`
`))
    t = Math.max(t, Tl(r));
  return t;
}
n(Us, "widestLine");

// ../node_modules/boxen/index.js
var _0 = be(Bl(), 1);

// ../node_modules/boxen/node_modules/camelcase/index.js
var ZT = /[\p{Lu}]/u, eR = /[\p{Ll}]/u, Gb = /^[\p{Lu}](?![\p{Lu}])/gu, Kb = /([\p{Alpha}\p{N}_]|$)/u, kl = /[_.\- ]+/, tR = new RegExp("^" +
kl.source), Yb = new RegExp(kl.source + Kb.source, "gu"), Jb = new RegExp("\\d+" + Kb.source, "gu"), rR = /* @__PURE__ */ n((e, t, r, i) => {
  let s = !1, o = !1, u = !1, a = !1;
  for (let l = 0; l < e.length; l++) {
    let f = e[l];
    a = l > 2 ? e[l - 3] === "-" : !0, s && ZT.test(f) ? (e = e.slice(0, l) + "-" + e.slice(l), s = !1, u = o, o = !0, l++) : o && u && eR.test(
    f) && (!a || i) ? (e = e.slice(0, l - 1) + "-" + e.slice(l - 1), u = o, o = !1, s = !0) : (s = t(f) === f && r(f) !== f, u = o, o = r(f) ===
    f && t(f) !== f);
  }
  return e;
}, "preserveCamelCase"), iR = /* @__PURE__ */ n((e, t) => (Gb.lastIndex = 0, e.replace(Gb, (r) => t(r))), "preserveConsecutiveUppercase"), nR = /* @__PURE__ */ n(
(e, t) => (Yb.lastIndex = 0, Jb.lastIndex = 0, e.replace(Yb, (r, i) => t(i)).replace(Jb, (r) => t(r))), "postProcess");
function Ol(e, t) {
  if (!(typeof e == "string" || Array.isArray(e)))
    throw new TypeError("Expected the input to be `string | string[]`");
  if (t = {
    pascalCase: !1,
    preserveConsecutiveUppercase: !1,
    ...t
  }, Array.isArray(e) ? e = e.map((o) => o.trim()).filter((o) => o.length).join("-") : e = e.trim(), e.length === 0)
    return "";
  let r = t.locale === !1 ? (o) => o.toLowerCase() : (o) => o.toLocaleLowerCase(t.locale), i = t.locale === !1 ? (o) => o.toUpperCase() : (o) => o.
  toLocaleUpperCase(t.locale);
  return e.length === 1 ? kl.test(e) ? "" : t.pascalCase ? i(e) : r(e) : (e !== r(e) && (e = rR(e, r, i, t.preserveConsecutiveUppercase)), e =
  e.replace(tR, ""), e = t.preserveConsecutiveUppercase ? iR(e, r) : r(e), t.pascalCase && (e = i(e.charAt(0)) + e.slice(1)), nR(e, i));
}
n(Ol, "camelCase");

// ../node_modules/boxen/index.js
var Ll = be(a0(), 1);

// ../node_modules/wrap-ansi/node_modules/string-width/index.js
var l0 = be(js(), 1), f0 = be(Is(), 1);
function tr(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, f0.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (l0.default.eastAsianWidth(s)) {
      case "F":
      case "W":
        i += 2;
        break;
      case "A":
        i += r;
        break;
      default:
        i += 1;
    }
  }
  return i;
}
n(tr, "stringWidth");

// ../node_modules/wrap-ansi/node_modules/ansi-styles/index.js
var h0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${t + e}m`, "wrapAnsi16"), c0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${38 + e};5;${t}\
m`, "wrapAnsi256"), d0 = /* @__PURE__ */ n((e = 0) => (t, r, i) => `\x1B[${38 + e};2;${t};${r};${i}m`, "wrapAnsi16m"), oe = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
}, ej = Object.keys(oe.modifier), cR = Object.keys(oe.color), dR = Object.keys(oe.bgColor), tj = [...cR, ...dR];
function pR() {
  let e = /* @__PURE__ */ new Map();
  for (let [t, r] of Object.entries(oe)) {
    for (let [i, s] of Object.entries(r))
      oe[i] = {
        open: `\x1B[${s[0]}m`,
        close: `\x1B[${s[1]}m`
      }, r[i] = oe[i], e.set(s[0], s[1]);
    Object.defineProperty(oe, t, {
      value: r,
      enumerable: !1
    });
  }
  return Object.defineProperty(oe, "codes", {
    value: e,
    enumerable: !1
  }), oe.color.close = "\x1B[39m", oe.bgColor.close = "\x1B[49m", oe.color.ansi = h0(), oe.color.ansi256 = c0(), oe.color.ansi16m = d0(), oe.
  bgColor.ansi = h0(10), oe.bgColor.ansi256 = c0(10), oe.bgColor.ansi16m = d0(10), Object.defineProperties(oe, {
    rgbToAnsi256: {
      value: /* @__PURE__ */ n((t, r, i) => t === r && r === i ? t < 8 ? 16 : t > 248 ? 231 : Math.round((t - 8) / 247 * 24) + 232 : 16 + 36 *
      Math.round(t / 255 * 5) + 6 * Math.round(r / 255 * 5) + Math.round(i / 255 * 5), "value"),
      enumerable: !1
    },
    hexToRgb: {
      value: /* @__PURE__ */ n((t) => {
        let r = /[a-f\d]{6}|[a-f\d]{3}/i.exec(t.toString(16));
        if (!r)
          return [0, 0, 0];
        let [i] = r;
        i.length === 3 && (i = [...i].map((o) => o + o).join(""));
        let s = Number.parseInt(i, 16);
        return [
          /* eslint-disable no-bitwise */
          s >> 16 & 255,
          s >> 8 & 255,
          s & 255
          /* eslint-enable no-bitwise */
        ];
      }, "value"),
      enumerable: !1
    },
    hexToAnsi256: {
      value: /* @__PURE__ */ n((t) => oe.rgbToAnsi256(...oe.hexToRgb(t)), "value"),
      enumerable: !1
    },
    ansi256ToAnsi: {
      value: /* @__PURE__ */ n((t) => {
        if (t < 8)
          return 30 + t;
        if (t < 16)
          return 90 + (t - 8);
        let r, i, s;
        if (t >= 232)
          r = ((t - 232) * 10 + 8) / 255, i = r, s = r;
        else {
          t -= 16;
          let a = t % 36;
          r = Math.floor(t / 36) / 5, i = Math.floor(a / 6) / 5, s = a % 6 / 5;
        }
        let o = Math.max(r, i, s) * 2;
        if (o === 0)
          return 30;
        let u = 30 + (Math.round(s) << 2 | Math.round(i) << 1 | Math.round(r));
        return o === 2 && (u += 60), u;
      }, "value"),
      enumerable: !1
    },
    rgbToAnsi: {
      value: /* @__PURE__ */ n((t, r, i) => oe.ansi256ToAnsi(oe.rgbToAnsi256(t, r, i)), "value"),
      enumerable: !1
    },
    hexToAnsi: {
      value: /* @__PURE__ */ n((t) => oe.ansi256ToAnsi(oe.hexToAnsi256(t)), "value"),
      enumerable: !1
    }
  }), oe;
}
n(pR, "assembleStyles");
var DR = pR(), p0 = DR;

// ../node_modules/wrap-ansi/index.js
var Hs = /* @__PURE__ */ new Set([
  "\x1B",
  "\x9B"
]), mR = 39, jl = "\x07", g0 = "[", gR = "]", y0 = "m", Il = `${gR}8;;`, D0 = /* @__PURE__ */ n((e) => `${Hs.values().next().value}${g0}${e}${y0}`,
"wrapAnsiCode"), m0 = /* @__PURE__ */ n((e) => `${Hs.values().next().value}${Il}${e}${jl}`, "wrapAnsiHyperlink"), yR = /* @__PURE__ */ n((e) => e.
split(" ").map((t) => tr(t)), "wordLengths"), Ml = /* @__PURE__ */ n((e, t, r) => {
  let i = [...t], s = !1, o = !1, u = tr(wt(e[e.length - 1]));
  for (let [a, l] of i.entries()) {
    let f = tr(l);
    if (u + f <= r ? e[e.length - 1] += l : (e.push(l), u = 0), Hs.has(l) && (s = !0, o = i.slice(a + 1).join("").startsWith(Il)), s) {
      o ? l === jl && (s = !1, o = !1) : l === y0 && (s = !1);
      continue;
    }
    u += f, u === r && a < i.length - 1 && (e.push(""), u = 0);
  }
  !u && e[e.length - 1].length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
}, "wrapWord"), bR = /* @__PURE__ */ n((e) => {
  let t = e.split(" "), r = t.length;
  for (; r > 0 && !(tr(t[r - 1]) > 0); )
    r--;
  return r === t.length ? e : t.slice(0, r).join(" ") + t.slice(r).join("");
}, "stringVisibleTrimSpacesRight"), vR = /* @__PURE__ */ n((e, t, r = {}) => {
  if (r.trim !== !1 && e.trim() === "")
    return "";
  let i = "", s, o, u = yR(e), a = [""];
  for (let [f, p] of e.split(" ").entries()) {
    r.trim !== !1 && (a[a.length - 1] = a[a.length - 1].trimStart());
    let d = tr(a[a.length - 1]);
    if (f !== 0 && (d >= t && (r.wordWrap === !1 || r.trim === !1) && (a.push(""), d = 0), (d > 0 || r.trim === !1) && (a[a.length - 1] += "\
 ", d++)), r.hard && u[f] > t) {
      let c = t - d, h = 1 + Math.floor((u[f] - c - 1) / t);
      Math.floor((u[f] - 1) / t) < h && a.push(""), Ml(a, p, t);
      continue;
    }
    if (d + u[f] > t && d > 0 && u[f] > 0) {
      if (r.wordWrap === !1 && d < t) {
        Ml(a, p, t);
        continue;
      }
      a.push("");
    }
    if (d + u[f] > t && r.wordWrap === !1) {
      Ml(a, p, t);
      continue;
    }
    a[a.length - 1] += p;
  }
  r.trim !== !1 && (a = a.map((f) => bR(f)));
  let l = [...a.join(`
`)];
  for (let [f, p] of l.entries()) {
    if (i += p, Hs.has(p)) {
      let { groups: c } = new RegExp(`(?:\\${g0}(?<code>\\d+)m|\\${Il}(?<uri>.*)${jl})`).exec(l.slice(f).join("")) || { groups: {} };
      if (c.code !== void 0) {
        let h = Number.parseFloat(c.code);
        s = h === mR ? void 0 : h;
      } else c.uri !== void 0 && (o = c.uri.length === 0 ? void 0 : c.uri);
    }
    let d = p0.codes.get(Number(s));
    l[f + 1] === `
` ? (o && (i += m0("")), s && d && (i += D0(d))) : p === `
` && (s && d && (i += D0(s)), o && (i += m0(o)));
  }
  return i;
}, "exec");
function Ws(e, t, r) {
  return String(e).normalize().replace(/\r\n/g, `
`).split(`
`).map((i) => vR(i, t, r)).join(`
`);
}
n(Ws, "wrapAnsi");

// ../node_modules/boxen/index.js
var TR = be(Bl(), 1);
var qt = `
`, Ae = " ", $i = "none", E0 = /* @__PURE__ */ n(() => {
  let { env: e, stdout: t, stderr: r } = $s;
  return t?.columns ? t.columns : r?.columns ? r.columns : e.COLUMNS ? Number.parseInt(e.COLUMNS, 10) : 80;
}, "terminalColumns"), b0 = /* @__PURE__ */ n((e) => typeof e == "number" ? {
  top: e,
  right: e * 3,
  bottom: e,
  left: e * 3
} : {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  ...e
}, "getObject"), zi = /* @__PURE__ */ n((e) => e === $i ? 0 : 2, "getBorderWidth"), wR = /* @__PURE__ */ n((e) => {
  let t = [
    "topLeft",
    "topRight",
    "bottomRight",
    "bottomLeft",
    "left",
    "right",
    "top",
    "bottom"
  ], r;
  if (e === $i) {
    e = {};
    for (let i of t)
      e[i] = "";
  }
  if (typeof e == "string") {
    if (r = _0.default[e], !r)
      throw new TypeError(`Invalid border style: ${e}`);
  } else {
    typeof e?.vertical == "string" && (e.left = e.vertical, e.right = e.vertical), typeof e?.horizontal == "string" && (e.top = e.horizontal,
    e.bottom = e.horizontal);
    for (let i of t)
      if (e[i] === null || typeof e[i] != "string")
        throw new TypeError(`Invalid border style: ${i}`);
    r = e;
  }
  return r;
}, "getBorderChars"), _R = /* @__PURE__ */ n((e, t, r) => {
  let i = "", s = Ze(e);
  switch (r) {
    case "left": {
      i = e + t.slice(s);
      break;
    }
    case "right": {
      i = t.slice(s) + e;
      break;
    }
    default: {
      t = t.slice(s), t.length % 2 === 1 ? (t = t.slice(Math.floor(t.length / 2)), i = t.slice(1) + e + t) : (t = t.slice(t.length / 2), i =
      t + e + t);
      break;
    }
  }
  return i;
}, "makeTitle"), ER = /* @__PURE__ */ n((e, { padding: t, width: r, textAlignment: i, height: s }) => {
  e = (0, Ll.default)(e, { align: i });
  let o = e.split(qt), u = Us(e), a = r - t.left - t.right;
  if (u > a) {
    let p = [];
    for (let d of o) {
      let c = Ws(d, a, { hard: !0 }), g = (0, Ll.default)(c, { align: i }).split(`
`), w = Math.max(...g.map((y) => Ze(y)));
      for (let y of g) {
        let _;
        switch (i) {
          case "center": {
            _ = Ae.repeat((a - w) / 2) + y;
            break;
          }
          case "right": {
            _ = Ae.repeat(a - w) + y;
            break;
          }
          default: {
            _ = y;
            break;
          }
        }
        p.push(_);
      }
    }
    o = p;
  }
  i === "center" && u < a ? o = o.map((p) => Ae.repeat((a - u) / 2) + p) : i === "right" && u < a && (o = o.map((p) => Ae.repeat(a - u) + p));
  let l = Ae.repeat(t.left), f = Ae.repeat(t.right);
  return o = o.map((p) => l + p + f), o = o.map((p) => {
    if (r - Ze(p) > 0)
      switch (i) {
        case "center":
          return p + Ae.repeat(r - Ze(p));
        case "right":
          return p + Ae.repeat(r - Ze(p));
        default:
          return p + Ae.repeat(r - Ze(p));
      }
    return p;
  }), t.top > 0 && (o = [...Array.from({ length: t.top }).fill(Ae.repeat(r)), ...o]), t.bottom > 0 && (o = [...o, ...Array.from({ length: t.
  bottom }).fill(Ae.repeat(r))]), s && o.length > s ? o = o.slice(0, s) : s && o.length < s && (o = [...o, ...Array.from({ length: s - o.length }).
  fill(Ae.repeat(r))]), o.join(qt);
}, "makeContentText"), CR = /* @__PURE__ */ n((e, t, r) => {
  let i = /* @__PURE__ */ n((p) => {
    let d = r.borderColor ? SR(r.borderColor)(p) : p;
    return r.dimBorder ? Zt.dim(d) : d;
  }, "colorizeBorder"), s = /* @__PURE__ */ n((p) => r.backgroundColor ? AR(r.backgroundColor)(p) : p, "colorizeContent"), o = wR(r.borderStyle),
  u = E0(), a = Ae.repeat(r.margin.left);
  if (r.float === "center") {
    let p = Math.max((u - t - zi(r.borderStyle)) / 2, 0);
    a = Ae.repeat(p);
  } else if (r.float === "right") {
    let p = Math.max(u - t - r.margin.right - zi(r.borderStyle), 0);
    a = Ae.repeat(p);
  }
  let l = "";
  r.margin.top && (l += qt.repeat(r.margin.top)), (r.borderStyle !== $i || r.title) && (l += i(a + o.topLeft + (r.title ? _R(r.title, o.top.
  repeat(t), r.titleAlignment) : o.top.repeat(t)) + o.topRight) + qt);
  let f = e.split(qt);
  return l += f.map((p) => a + i(o.left) + s(p) + i(o.right)).join(qt), r.borderStyle !== $i && (l += qt + i(a + o.bottomLeft + o.bottom.repeat(
  t) + o.bottomRight)), r.margin.bottom && (l += qt.repeat(r.margin.bottom)), l;
}, "boxContent"), FR = /* @__PURE__ */ n((e) => {
  if (e.fullscreen && $s?.stdout) {
    let t = [$s.stdout.columns, $s.stdout.rows];
    typeof e.fullscreen == "function" && (t = e.fullscreen(...t)), e.width || (e.width = t[0]), e.height || (e.height = t[1]);
  }
  return e.width && (e.width = Math.max(1, e.width - zi(e.borderStyle))), e.height && (e.height = Math.max(1, e.height - zi(e.borderStyle))),
  e;
}, "sanitizeOptions"), v0 = /* @__PURE__ */ n((e, t) => t === $i ? e : ` ${e} `, "formatTitle"), xR = /* @__PURE__ */ n((e, t) => {
  t = FR(t);
  let r = t.width !== void 0, i = E0(), s = zi(t.borderStyle), o = i - t.margin.left - t.margin.right - s, u = Us(Ws(e, i - s, { hard: !0, trim: !1 })) +
  t.padding.left + t.padding.right;
  if (t.title && r ? (t.title = t.title.slice(0, Math.max(0, t.width - 2)), t.title && (t.title = v0(t.title, t.borderStyle))) : t.title && (t.
  title = t.title.slice(0, Math.max(0, o - 2)), t.title && (t.title = v0(t.title, t.borderStyle), Ze(t.title) > u && (t.width = Ze(t.title)))),
  t.width = t.width ? t.width : u, !r) {
    if (t.margin.left && t.margin.right && t.width > o) {
      let l = (i - t.width - s) / (t.margin.left + t.margin.right);
      t.margin.left = Math.max(0, Math.floor(t.margin.left * l)), t.margin.right = Math.max(0, Math.floor(t.margin.right * l));
    }
    t.width = Math.min(t.width, i - s - t.margin.left - t.margin.right);
  }
  return t.width - (t.padding.left + t.padding.right) <= 0 && (t.padding.left = 0, t.padding.right = 0), t.height && t.height - (t.padding.top +
  t.padding.bottom) <= 0 && (t.padding.top = 0, t.padding.bottom = 0), t;
}, "determineDimensions"), Nl = /* @__PURE__ */ n((e) => e.match(/^#(?:[0-f]{3}){1,2}$/i), "isHex"), w0 = /* @__PURE__ */ n((e) => typeof e ==
"string" && (Zt[e] ?? Nl(e)), "isColorValid"), SR = /* @__PURE__ */ n((e) => Nl(e) ? Zt.hex(e) : Zt[e], "getColorFn"), AR = /* @__PURE__ */ n(
(e) => Nl(e) ? Zt.bgHex(e) : Zt[Ol(["bg", e])], "getBGColorFn");
function Ul(e, t) {
  if (t = {
    padding: 0,
    borderStyle: "single",
    dimBorder: !1,
    textAlignment: "left",
    float: "left",
    titleAlignment: "left",
    ...t
  }, t.align && (t.textAlignment = t.align), t.borderColor && !w0(t.borderColor))
    throw new Error(`${t.borderColor} is not a valid borderColor`);
  if (t.backgroundColor && !w0(t.backgroundColor))
    throw new Error(`${t.backgroundColor} is not a valid backgroundColor`);
  return t.padding = b0(t.padding), t.margin = b0(t.margin), t = xR(e, t), e = ER(e, t), CR(e, t.width, t);
}
n(Ul, "boxen");

// src/cli/angular/helpers.ts
var Wl = be(cn(), 1), $l = be(Hl(), 1);
var zs = "angular.json", Cj = $l.dedent`
  import { setCompodocJson } from "@storybook/addon-docs/angular";
  import docJson from "../documentation.json";
  setCompodocJson(docJson);
`.trimStart(), Fj = /* @__PURE__ */ n(async () => {
  PR.plain(
    // Create a text which explains the user why compodoc is necessary
    Ul(
      $l.dedent`
      Compodoc is a great tool to generate documentation for your Angular projects.
      Storybook can use the documentation generated by Compodoc to extract argument definitions
      and JSDOC comments to display them in the Storybook UI. We highly recommend using Compodoc for
      your Angular projects to get the best experience out of Storybook.
    `,
      { title: "Compodoc", borderStyle: "round", padding: 1, borderColor: "#F1618C" }
    )
  );
  let { useCompoDoc: e } = await (0, Wl.default)({
    type: "confirm",
    name: "useCompoDoc",
    message: "Do you want to use Compodoc for documentation?"
  });
  return e;
}, "promptForCompoDocs"), F0 = class {
  static {
    n(this, "AngularJSON");
  }
  constructor() {
    if (!RR(zs))
      throw new qR({ path: OR(process.cwd(), zs) });
    let t = BR(zs, "utf8");
    this.json = JSON.parse(t);
  }
  get projects() {
    return this.json.projects;
  }
  get projectsWithoutStorybook() {
    return Object.keys(this.projects).filter((t) => {
      let { architect: r } = this.projects[t];
      return !r.storybook;
    });
  }
  get hasStorybookBuilder() {
    return Object.keys(this.projects).some((t) => {
      let { architect: r } = this.projects[t];
      return Object.keys(r).some((i) => r[i].builder === "@storybook/angular:start-storybook");
    });
  }
  get rootProject() {
    let t = Object.keys(this.projects).find((r) => {
      let { root: i } = this.projects[r];
      return i === "" || i === ".";
    });
    return t ? this.projects[t] : null;
  }
  getProjectSettingsByName(t) {
    return this.projects[t];
  }
  async getProjectName() {
    if (this.projectsWithoutStorybook.length > 1) {
      let { projectName: t } = await (0, Wl.default)({
        type: "select",
        name: "projectName",
        message: "For which project do you want to generate Storybook configuration?",
        choices: this.projectsWithoutStorybook.map((r) => ({
          title: r,
          value: r
        }))
      });
      return t;
    }
    return this.projectsWithoutStorybook[0];
  }
  addStorybookEntries({
    angularProjectName: t,
    storybookFolder: r,
    useCompodoc: i,
    root: s
  }) {
    let { architect: o } = this.projects[t], u = {
      configDir: r,
      browserTarget: `${t}:build`,
      compodoc: i,
      ...i && { compodocArgs: ["-e", "json", "-d", s || "."] }
    };
    o.storybook || (o.storybook = {
      builder: "@storybook/angular:start-storybook",
      options: {
        ...u,
        port: 6006
      }
    }), o["build-storybook"] || (o["build-storybook"] = {
      builder: "@storybook/angular:build-storybook",
      options: {
        ...u,
        outputDir: Object.keys(this.projects).length === 1 ? "storybook-static" : `dist/storybook/${t}`
      }
    });
  }
  write() {
    kR(zs, JSON.stringify(this.json, null, 2));
  }
};

// src/cli/eslintPlugin.ts
import { existsSync as A0 } from "node:fs";
import { readFile as T0, writeFile as UR } from "node:fs/promises";
import { paddedLog as R0 } from "@storybook/core/common";
import { readConfig as HR, writeConfig as WR } from "@storybook/core/csf-tools";

// ../node_modules/detect-indent/index.js
var MR = /^(?:( )+|\t+)/, Gi = "space", S0 = "tab";
function x0(e, t) {
  let r = /* @__PURE__ */ new Map(), i = 0, s, o;
  for (let u of e.split(/\n/g)) {
    if (!u)
      continue;
    let a, l, f, p, d, c = u.match(MR);
    if (c === null)
      i = 0, s = "";
    else {
      if (a = c[0].length, l = c[1] ? Gi : S0, t && l === Gi && a === 1)
        continue;
      l !== s && (i = 0), s = l, f = 1, p = 0;
      let h = a - i;
      if (i = a, h === 0)
        f = 0, p = 1;
      else {
        let g = h > 0 ? h : -h;
        o = jR(l, g);
      }
      d = r.get(o), d = d === void 0 ? [1, 0] : [d[0] + f, d[1] + p], r.set(o, d);
    }
  }
  return r;
}
n(x0, "makeIndentsMap");
function jR(e, t) {
  return (e === Gi ? "s" : "t") + String(t);
}
n(jR, "encodeIndentsKey");
function IR(e) {
  let r = e[0] === "s" ? Gi : S0, i = Number(e.slice(1));
  return { type: r, amount: i };
}
n(IR, "decodeIndentsKey");
function LR(e) {
  let t, r = 0, i = 0;
  for (let [s, [o, u]] of e)
    (o > r || o === r && u > i) && (r = o, i = u, t = s);
  return t;
}
n(LR, "getMostUsedKey");
function NR(e, t) {
  return (e === Gi ? " " : "	").repeat(t);
}
n(NR, "makeIndentString");
function zl(e) {
  if (typeof e != "string")
    throw new TypeError("Expected a string");
  let t = x0(e, !0);
  t.size === 0 && (t = x0(e, !1));
  let r = LR(t), i, s = 0, o = "";
  return r !== void 0 && ({ type: i, amount: s } = IR(r), o = NR(i, s)), {
    amount: s,
    type: i,
    indent: o
  };
}
n(zl, "detectIndent");

// src/cli/eslintPlugin.ts
var B0 = be(au(), 1), k0 = be(cn(), 1), O0 = be(Hl(), 1);
var $R = ["js", "cjs", "json"], zR = ["yaml", "yml"], VR = /* @__PURE__ */ n(() => {
  let e = ".eslintrc", t = zR.find(
    (i) => A0(`${e}.${i}`)
  );
  if (t)
    throw new Error(t);
  let r = $R.find(
    (i) => A0(`${e}.${i}`)
  );
  return r ? `${e}.${r}` : null;
}, "findEslintFile");
async function qj(e) {
  let t = await e.getAllDependencies(), r = await e.retrievePackageJson(), i = null;
  try {
    i = VR();
  } catch {
  }
  let s = !!t["eslint-plugin-storybook"];
  return { hasEslint: t.eslint || i || r.eslintConfig, isStorybookPluginInstalled: s, eslintConfigFile: i };
}
n(qj, "extractEslintInfo");
var Vl = /* @__PURE__ */ n((e) => {
  if (!e)
    return [];
  if (typeof e == "string")
    return [e];
  if (Array.isArray(e))
    return e;
  throw new Error(`Invalid eslint extends ${e}`);
}, "normalizeExtends");
async function Mj(e, t) {
  if (e)
    if (R0(`Configuring Storybook ESLint plugin at ${e}`), e.endsWith("json")) {
      let r = JSON.parse(await T0(e, { encoding: "utf8" })), i = Vl(r.extends).filter(Boolean);
      r.extends = [...i, "plugin:storybook/recommended"];
      let s = await T0(e, { encoding: "utf8" }), o = zl(s).amount || 2;
      await UR(e, JSON.stringify(r, void 0, o));
    } else {
      let r = await HR(e), i = Vl(r.getFieldValue(["extends"])).filter(Boolean);
      r.setFieldValue(["extends"], [...i, "plugin:storybook/recommended"]), await WR(r);
    }
  else {
    R0("Configuring eslint-plugin-storybook in your package.json");
    let r = await t.retrievePackageJson(), i = Vl(r.eslintConfig?.extends).filter(Boolean);
    await t.writePackageJson({
      ...r,
      eslintConfig: {
        ...r.eslintConfig,
        extends: [...i, "plugin:storybook/recommended"]
      }
    });
  }
}
n(Mj, "configureEslintPlugin");
var jj = /* @__PURE__ */ n(async () => {
  let { shouldInstall: e } = await (0, k0.default)({
    type: "confirm",
    name: "shouldInstall",
    message: O0.dedent`
        We have detected that you're using ESLint. Storybook provides a plugin that gives the best experience with Storybook and helps follow best practices: ${B0.default.
    yellow(
      "https://github.com/storybookjs/eslint-plugin-storybook#readme"
    )}

        Would you like to install it?
      `,
    initial: !0
  });
  return e;
}, "suggestESLintPlugin");
export {
  zs as ANGULAR_JSON_PATH,
  F0 as AngularJSON,
  uT as CommunityBuilder,
  mb as CoreBuilder,
  oT as CoreWebpackCompilers,
  bl as ProjectType,
  $R as SUPPORTED_ESLINT_EXTENSIONS,
  lq as SUPPORTED_RENDERERS,
  gb as SupportedLanguage,
  Pq as addToDevDependenciesIfNotPresent,
  xT as adjustTemplate,
  hq as builderNameToCoreBuilder,
  FT as cliStoriesTargetPath,
  Lq as coerceSemver,
  fq as compilerNameToCoreCompiler,
  Cj as compoDocPreviewPrefix,
  Mj as configureEslintPlugin,
  qq as copyTemplate,
  jq as copyTemplateFiles,
  tM as detect,
  Xq as detectBuilder,
  qT as detectFrameworkPreset,
  eM as detectLanguage,
  Zq as detectPnp,
  Db as externalFrameworks,
  qj as extractEslintInfo,
  VR as findEslintFile,
  Mq as frameworkToDefaultBuilder,
  ET as frameworkToRenderer,
  Oq as getBabelDependencies,
  wb as getRendererDir,
  Iq as getStorybookVersionSpecifier,
  CT as getVersionSafe,
  Nq as hasStorybookDependencies,
  cq as installableProjectTypes,
  Fb as isNxProject,
  Qq as isStorybookInstantiated,
  Vl as normalizeExtends,
  Fj as promptForCompoDocs,
  Bq as readFileAsJson,
  jj as suggestESLintPlugin,
  yb as supportedTemplates,
  bb as unsupportedTemplate,
  kq as writeFileAsJson
};
