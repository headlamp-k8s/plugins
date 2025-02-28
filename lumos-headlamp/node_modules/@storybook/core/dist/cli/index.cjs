"use strict";
var ov = Object.create;
var Wr = Object.defineProperty;
var uv = Object.getOwnPropertyDescriptor;
var av = Object.getOwnPropertyNames;
var lv = Object.getPrototypeOf, fv = Object.prototype.hasOwnProperty;
var n = (e, t) => Wr(e, "name", { value: t, configurable: !0 });
var b = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), hv = (e, t) => {
  for (var r in t)
    Wr(e, r, { get: t[r], enumerable: !0 });
}, pf = (e, t, r, i) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let s of av(t))
      !fv.call(e, s) && s !== r && Wr(e, s, { get: () => t[s], enumerable: !(i = uv(t, s)) || i.enumerable });
  return e;
};
var Y = (e, t, r) => (r = e != null ? ov(lv(e)) : {}, pf(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? Wr(r, "default", { value: e, enumerable: !0 }) : r,
  e
)), cv = (e) => pf(Wr({}, "__esModule", { value: !0 }), e);

// ../node_modules/prompts/node_modules/kleur/index.js
var ue = b((k8, _f) => {
  "use strict";
  var { FORCE_COLOR: yv, NODE_DISABLE_COLORS: bv, TERM: vv } = process.env, G = {
    enabled: !bv && vv !== "dumb" && yv !== "0",
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
  function wf(e, t) {
    let r = 0, i, s = "", o = "";
    for (; r < e.length; r++)
      i = e[r], s += i.open, o += i.close, t.includes(i.close) && (t = t.replace(i.rgx, i.close + i.open));
    return s + t + o;
  }
  n(wf, "run");
  function wv(e, t) {
    let r = { has: e, keys: t };
    return r.reset = G.reset.bind(r), r.bold = G.bold.bind(r), r.dim = G.dim.bind(r), r.italic = G.italic.bind(r), r.underline = G.underline.
    bind(r), r.inverse = G.inverse.bind(r), r.hidden = G.hidden.bind(r), r.strikethrough = G.strikethrough.bind(r), r.black = G.black.bind(r),
    r.red = G.red.bind(r), r.green = G.green.bind(r), r.yellow = G.yellow.bind(r), r.blue = G.blue.bind(r), r.magenta = G.magenta.bind(r), r.
    cyan = G.cyan.bind(r), r.white = G.white.bind(r), r.gray = G.gray.bind(r), r.grey = G.grey.bind(r), r.bgBlack = G.bgBlack.bind(r), r.bgRed =
    G.bgRed.bind(r), r.bgGreen = G.bgGreen.bind(r), r.bgYellow = G.bgYellow.bind(r), r.bgBlue = G.bgBlue.bind(r), r.bgMagenta = G.bgMagenta.
    bind(r), r.bgCyan = G.bgCyan.bind(r), r.bgWhite = G.bgWhite.bind(r), r;
  }
  n(wv, "chain");
  function K(e, t) {
    let r = {
      open: `\x1B[${e}m`,
      close: `\x1B[${t}m`,
      rgx: new RegExp(`\\x1b\\[${t}m`, "g")
    };
    return function(i) {
      return this !== void 0 && this.has !== void 0 ? (this.has.includes(e) || (this.has.push(e), this.keys.push(r)), i === void 0 ? this : G.
      enabled ? wf(this.keys, i + "") : i + "") : i === void 0 ? wv([e], [r]) : G.enabled ? wf([r], i + "") : i + "";
    };
  }
  n(K, "init");
  _f.exports = G;
});

// ../node_modules/prompts/dist/util/action.js
var Cf = b((P8, Ef) => {
  "use strict";
  Ef.exports = (e, t) => {
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
var on = b((q8, Ff) => {
  "use strict";
  Ff.exports = (e) => {
    let t = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"].join("|"), r = new RegExp(t, "g");
    return typeof e == "string" ? e.replace(r, "") : e;
  };
});

// ../node_modules/sisteransi/src/index.js
var le = b((M8, xf) => {
  "use strict";
  var uo = "\x1B", ae = `${uo}[`, _v = "\x07", ao = {
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
    save: `${uo}7`,
    restore: `${uo}8`
  }, Ev = {
    up: /* @__PURE__ */ n((e = 1) => `${ae}S`.repeat(e), "up"),
    down: /* @__PURE__ */ n((e = 1) => `${ae}T`.repeat(e), "down")
  }, Cv = {
    screen: `${ae}2J`,
    up: /* @__PURE__ */ n((e = 1) => `${ae}1J`.repeat(e), "up"),
    down: /* @__PURE__ */ n((e = 1) => `${ae}J`.repeat(e), "down"),
    line: `${ae}2K`,
    lineEnd: `${ae}K`,
    lineStart: `${ae}1K`,
    lines(e) {
      let t = "";
      for (let r = 0; r < e; r++)
        t += this.line + (r < e - 1 ? ao.up() : "");
      return e && (t += ao.left), t;
    }
  };
  xf.exports = { cursor: ao, scroll: Ev, erase: Cv, beep: _v };
});

// ../node_modules/prompts/dist/util/clear.js
var Bf = b((I8, Rf) => {
  "use strict";
  function Fv(e, t) {
    var r = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (!r) {
      if (Array.isArray(e) || (r = xv(e)) || t && e && typeof e.length == "number") {
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
  n(Fv, "_createForOfIteratorHelper");
  function xv(e, t) {
    if (e) {
      if (typeof e == "string") return Sf(e, t);
      var r = Object.prototype.toString.call(e).slice(8, -1);
      if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
      if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Sf(e, t);
    }
  }
  n(xv, "_unsupportedIterableToArray");
  function Sf(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var r = 0, i = new Array(t); r < t; r++) i[r] = e[r];
    return i;
  }
  n(Sf, "_arrayLikeToArray");
  var Sv = on(), Tf = le(), Af = Tf.erase, Av = Tf.cursor, Tv = /* @__PURE__ */ n((e) => [...Sv(e)].length, "width");
  Rf.exports = function(e, t) {
    if (!t) return Af.line + Av.to(0);
    let r = 0, i = e.split(/\r?\n/);
    var s = Fv(i), o;
    try {
      for (s.s(); !(o = s.n()).done; ) {
        let u = o.value;
        r += 1 + Math.floor(Math.max(Tv(u) - 1, 0) / t);
      }
    } catch (u) {
      s.e(u);
    } finally {
      s.f();
    }
    return Af.lines(r);
  };
});

// ../node_modules/prompts/dist/util/figures.js
var lo = b((N8, kf) => {
  "use strict";
  var $r = {
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
  }, Rv = {
    arrowUp: $r.arrowUp,
    arrowDown: $r.arrowDown,
    arrowLeft: $r.arrowLeft,
    arrowRight: $r.arrowRight,
    radioOn: "(*)",
    radioOff: "( )",
    tick: "\u221A",
    cross: "\xD7",
    ellipsis: "...",
    pointerSmall: "\xBB",
    line: "\u2500",
    pointer: ">"
  }, Bv = process.platform === "win32" ? Rv : $r;
  kf.exports = Bv;
});

// ../node_modules/prompts/dist/util/style.js
var Pf = b((U8, Of) => {
  "use strict";
  var or = ue(), jt = lo(), fo = Object.freeze({
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
  }), kv = /* @__PURE__ */ n((e) => fo[e] || fo.default, "render"), zr = Object.freeze({
    aborted: or.red(jt.cross),
    done: or.green(jt.tick),
    exited: or.yellow(jt.cross),
    default: or.cyan("?")
  }), Ov = /* @__PURE__ */ n((e, t, r) => t ? zr.aborted : r ? zr.exited : e ? zr.done : zr.default, "symbol"), Pv = /* @__PURE__ */ n((e) => or.
  gray(e ? jt.ellipsis : jt.pointerSmall), "delimiter"), qv = /* @__PURE__ */ n((e, t) => or.gray(e ? t ? jt.pointerSmall : "+" : jt.line), "\
item");
  Of.exports = {
    styles: fo,
    render: kv,
    symbols: zr,
    symbol: Ov,
    delimiter: Pv,
    item: qv
  };
});

// ../node_modules/prompts/dist/util/lines.js
var Mf = b((W8, qf) => {
  "use strict";
  var Mv = on();
  qf.exports = function(e, t) {
    let r = String(Mv(e) || "").split(/\r?\n/);
    return t ? r.map((i) => Math.ceil(i.length / t)).reduce((i, s) => i + s) : r.length;
  };
});

// ../node_modules/prompts/dist/util/wrap.js
var If = b(($8, jf) => {
  "use strict";
  jf.exports = (e, t = {}) => {
    let r = Number.isSafeInteger(parseInt(t.margin)) ? new Array(parseInt(t.margin)).fill(" ").join("") : t.margin || "", i = t.width;
    return (e || "").split(/\r?\n/g).map((s) => s.split(/\s+/g).reduce((o, u) => (u.length + r.length >= i || o[o.length - 1].length + u.length +
    1 < i ? o[o.length - 1] += ` ${u}` : o.push(`${r}${u}`), o), [r]).join(`
`)).join(`
`);
  };
});

// ../node_modules/prompts/dist/util/entriesToDisplay.js
var Nf = b((z8, Lf) => {
  "use strict";
  Lf.exports = (e, t, r) => {
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
var je = b((V8, Uf) => {
  "use strict";
  Uf.exports = {
    action: Cf(),
    clear: Bf(),
    style: Pf(),
    strip: on(),
    figures: lo(),
    lines: Mf(),
    wrap: If(),
    entriesToDisplay: Nf()
  };
});

// ../node_modules/prompts/dist/elements/prompt.js
var tt = b((G8, $f) => {
  "use strict";
  var Hf = require("readline"), jv = je(), Iv = jv.action, Lv = require("events"), Wf = le(), Nv = Wf.beep, Uv = Wf.cursor, Hv = ue(), ho = class extends Lv {
    static {
      n(this, "Prompt");
    }
    constructor(t = {}) {
      super(), this.firstRender = !0, this.in = t.stdin || process.stdin, this.out = t.stdout || process.stdout, this.onRender = (t.onRender ||
      (() => {
      })).bind(this);
      let r = Hf.createInterface({
        input: this.in,
        escapeCodeTimeout: 50
      });
      Hf.emitKeypressEvents(this.in, r), this.in.isTTY && this.in.setRawMode(!0);
      let i = ["SelectPrompt", "MultiselectPrompt"].indexOf(this.constructor.name) > -1, s = /* @__PURE__ */ n((o, u) => {
        let a = Iv(u, i);
        a === !1 ? this._ && this._(o, u) : typeof this[a] == "function" ? this[a](u) : this.bell();
      }, "keypress");
      this.close = () => {
        this.out.write(Uv.show), this.in.removeListener("keypress", s), this.in.isTTY && this.in.setRawMode(!1), r.close(), this.emit(this.aborted ?
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
      this.out.write(Nv);
    }
    render() {
      this.onRender(Hv), this.firstRender && (this.firstRender = !1);
    }
  };
  $f.exports = ho;
});

// ../node_modules/prompts/dist/elements/text.js
var Jf = b((J8, Yf) => {
  "use strict";
  function zf(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(zf, "asyncGeneratorStep");
  function Vf(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          zf(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          zf(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(Vf, "_asyncToGenerator");
  var un = ue(), Wv = tt(), Gf = le(), $v = Gf.erase, Vr = Gf.cursor, an = je(), co = an.style, po = an.clear, zv = an.lines, Vv = an.figures,
  Do = class extends Wv {
    static {
      n(this, "TextPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = co.render(t.style), this.scale = this.transform.scale, this.msg = t.message, this.initial = t.initial || "",
      this.validator = t.validate || (() => !0), this.value = "", this.errorMsg = t.error || "Please Enter A Valid Value", this.cursor = +!!this.
      initial, this.cursorOffset = 0, this.clear = po("", this.out.columns), this.render();
    }
    set value(t) {
      !t && this.initial ? (this.placeholder = !0, this.rendered = un.gray(this.transform.render(this.initial))) : (this.placeholder = !1, this.
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
      return Vf(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return Vf(function* () {
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
      this.closed || (this.firstRender || (this.outputError && this.out.write(Vr.down(zv(this.outputError, this.out.columns) - 1) + po(this.
      outputError, this.out.columns)), this.out.write(po(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [co.symbol(this.done, this.aborted), un.bold(this.msg), co.delimiter(this.done), this.red ? un.red(this.rendered) : this.rendered].join(
      " "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : Vv.pointerSmall} ${un.red().italic(r)}`, "")), this.out.write($v.line + Vr.to(0) + this.outputText + Vr.save + this.outputError +
      Vr.restore + Vr.move(this.cursorOffset, 0)));
    }
  };
  Yf.exports = Do;
});

// ../node_modules/prompts/dist/elements/select.js
var Zf = b((X8, Qf) => {
  "use strict";
  var rt = ue(), Gv = tt(), Gr = je(), Kf = Gr.style, Xf = Gr.clear, ln = Gr.figures, Yv = Gr.wrap, Jv = Gr.entriesToDisplay, Kv = le(), Xv = Kv.
  cursor, mo = class extends Gv {
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
      })), this.optionsPerPage = t.optionsPerPage || 10, this.value = (this.choices[this.cursor] || {}).value, this.clear = Xf("", this.out.
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
      this.firstRender ? this.out.write(Xv.hide) : this.out.write(Xf(this.outputText, this.out.columns)), super.render();
      let t = Jv(this.cursor, this.choices.length, this.optionsPerPage), r = t.startIndex, i = t.endIndex;
      if (this.outputText = [Kf.symbol(this.done, this.aborted), rt.bold(this.msg), Kf.delimiter(!1), this.done ? this.selection.title : this.
      selection.disabled ? rt.yellow(this.warn) : rt.gray(this.hint)].join(" "), !this.done) {
        this.outputText += `
`;
        for (let s = r; s < i; s++) {
          let o, u, a = "", l = this.choices[s];
          s === r && r > 0 ? u = ln.arrowUp : s === i - 1 && i < this.choices.length ? u = ln.arrowDown : u = " ", l.disabled ? (o = this.cursor ===
          s ? rt.gray().underline(l.title) : rt.strikethrough().gray(l.title), u = (this.cursor === s ? rt.bold().gray(ln.pointer) + " " : "\
  ") + u) : (o = this.cursor === s ? rt.cyan().underline(l.title) : l.title, u = (this.cursor === s ? rt.cyan(ln.pointer) + " " : "  ") + u,
          l.description && this.cursor === s && (a = ` - ${l.description}`, (u.length + o.length + a.length >= this.out.columns || l.description.
          split(/\r?\n/).length > 1) && (a = `
` + Yv(l.description, {
            margin: 3,
            width: this.out.columns
          })))), this.outputText += `${u} ${o}${rt.gray(a)}
`;
        }
      }
      this.out.write(this.outputText);
    }
  };
  Qf.exports = mo;
});

// ../node_modules/prompts/dist/elements/toggle.js
var sh = b((Z8, nh) => {
  "use strict";
  var fn = ue(), Qv = tt(), rh = je(), eh = rh.style, Zv = rh.clear, ih = le(), th = ih.cursor, ew = ih.erase, go = class extends Qv {
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
      this.closed || (this.firstRender ? this.out.write(th.hide) : this.out.write(Zv(this.outputText, this.out.columns)), super.render(), this.
      outputText = [eh.symbol(this.done, this.aborted), fn.bold(this.msg), eh.delimiter(this.done), this.value ? this.inactive : fn.cyan().underline(
      this.inactive), fn.gray("/"), this.value ? fn.cyan().underline(this.active) : this.active].join(" "), this.out.write(ew.line + th.to(0) +
      this.outputText));
    }
  };
  nh.exports = go;
});

// ../node_modules/prompts/dist/dateparts/datepart.js
var We = b((tB, oh) => {
  "use strict";
  var yo = class e {
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
  oh.exports = yo;
});

// ../node_modules/prompts/dist/dateparts/meridiem.js
var ah = b((iB, uh) => {
  "use strict";
  var tw = We(), bo = class extends tw {
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
  uh.exports = bo;
});

// ../node_modules/prompts/dist/dateparts/day.js
var fh = b((sB, lh) => {
  "use strict";
  var rw = We(), iw = /* @__PURE__ */ n((e) => (e = e % 10, e === 1 ? "st" : e === 2 ? "nd" : e === 3 ? "rd" : "th"), "pos"), vo = class extends rw {
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
      return this.token === "DD" ? String(t).padStart(2, "0") : this.token === "Do" ? t + iw(t) : this.token === "d" ? r + 1 : this.token ===
      "ddd" ? this.locales.weekdaysShort[r] : this.token === "dddd" ? this.locales.weekdays[r] : t;
    }
  };
  lh.exports = vo;
});

// ../node_modules/prompts/dist/dateparts/hours.js
var ch = b((uB, hh) => {
  "use strict";
  var nw = We(), wo = class extends nw {
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
  hh.exports = wo;
});

// ../node_modules/prompts/dist/dateparts/milliseconds.js
var ph = b((lB, dh) => {
  "use strict";
  var sw = We(), _o = class extends sw {
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
  dh.exports = _o;
});

// ../node_modules/prompts/dist/dateparts/minutes.js
var mh = b((hB, Dh) => {
  "use strict";
  var ow = We(), Eo = class extends ow {
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
  Dh.exports = Eo;
});

// ../node_modules/prompts/dist/dateparts/month.js
var yh = b((dB, gh) => {
  "use strict";
  var uw = We(), Co = class extends uw {
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
  gh.exports = Co;
});

// ../node_modules/prompts/dist/dateparts/seconds.js
var vh = b((DB, bh) => {
  "use strict";
  var aw = We(), Fo = class extends aw {
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
  bh.exports = Fo;
});

// ../node_modules/prompts/dist/dateparts/year.js
var _h = b((gB, wh) => {
  "use strict";
  var lw = We(), xo = class extends lw {
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
  wh.exports = xo;
});

// ../node_modules/prompts/dist/dateparts/index.js
var Ch = b((bB, Eh) => {
  "use strict";
  Eh.exports = {
    DatePart: We(),
    Meridiem: ah(),
    Day: fh(),
    Hours: ch(),
    Milliseconds: ph(),
    Minutes: mh(),
    Month: yh(),
    Seconds: vh(),
    Year: _h()
  };
});

// ../node_modules/prompts/dist/elements/date.js
var Ph = b((vB, Oh) => {
  "use strict";
  function Fh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(Fh, "asyncGeneratorStep");
  function xh(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          Fh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          Fh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(xh, "_asyncToGenerator");
  var So = ue(), fw = tt(), To = je(), Sh = To.style, Ah = To.clear, hw = To.figures, kh = le(), cw = kh.erase, Th = kh.cursor, it = Ch(), Rh = it.
  DatePart, dw = it.Meridiem, pw = it.Day, Dw = it.Hours, mw = it.Milliseconds, gw = it.Minutes, yw = it.Month, bw = it.Seconds, vw = it.Year,
  ww = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g, Bh = {
    1: ({
      token: e
    }) => e.replace(/\\(.)/g, "$1"),
    2: (e) => new pw(e),
    // Day // TODO
    3: (e) => new yw(e),
    // Month
    4: (e) => new vw(e),
    // Year
    5: (e) => new dw(e),
    // AM/PM // TODO (special)
    6: (e) => new Dw(e),
    // Hours
    7: (e) => new gw(e),
    // Minutes
    8: (e) => new bw(e),
    // Seconds
    9: (e) => new mw(e)
    // Fractional seconds
  }, _w = {
    months: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
    monthsShort: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
    weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
    weekdaysShort: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",")
  }, Ao = class extends fw {
    static {
      n(this, "DatePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = 0, this.typed = "", this.locales = Object.assign(_w, t.locales), this._date = t.initial ||
      /* @__PURE__ */ new Date(), this.errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.mask =
      t.mask || "YYYY-MM-DD HH:mm:ss", this.clear = Ah("", this.out.columns), this.render();
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
      for (this.parts = []; r = ww.exec(t); ) {
        let s = r.shift(), o = r.findIndex((u) => u != null);
        this.parts.push(o in Bh ? Bh[o]({
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
      this.moveCursor(this.parts.findIndex((t) => t instanceof Rh)), this.fire(), this.render();
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
      return xh(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return xh(function* () {
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
      this.moveCursor(t ? this.parts.indexOf(t) : this.parts.findIndex((r) => r instanceof Rh)), this.render();
    }
    _(t) {
      /\d/.test(t) && (this.typed += t, this.parts[this.cursor].setTo(this.typed), this.render());
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(Th.hide) : this.out.write(Ah(this.outputText, this.out.columns)), super.render(), this.
      outputText = [Sh.symbol(this.done, this.aborted), So.bold(this.msg), Sh.delimiter(!1), this.parts.reduce((t, r, i) => t.concat(i === this.
      cursor && !this.done ? So.cyan().underline(r.toString()) : r), []).join("")].join(" "), this.error && (this.outputText += this.errorMsg.
      split(`
`).reduce((t, r, i) => t + `
${i ? " " : hw.pointerSmall} ${So.red().italic(r)}`, "")), this.out.write(cw.line + Th.to(0) + this.outputText));
    }
  };
  Oh.exports = Ao;
});

// ../node_modules/prompts/dist/elements/number.js
var Uh = b((_B, Nh) => {
  "use strict";
  function qh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(qh, "asyncGeneratorStep");
  function Mh(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          qh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          qh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(Mh, "_asyncToGenerator");
  var hn = ue(), Ew = tt(), Lh = le(), cn = Lh.cursor, Cw = Lh.erase, dn = je(), Ro = dn.style, Fw = dn.figures, jh = dn.clear, xw = dn.lines,
  Sw = /[0-9]/, Bo = /* @__PURE__ */ n((e) => e !== void 0, "isDef"), Ih = /* @__PURE__ */ n((e, t) => {
    let r = Math.pow(10, t);
    return Math.round(e * r) / r;
  }, "round"), ko = class extends Ew {
    static {
      n(this, "NumberPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = Ro.render(t.style), this.msg = t.message, this.initial = Bo(t.initial) ? t.initial : "", this.float = !!t.float,
      this.round = t.round || 2, this.inc = t.increment || 1, this.min = Bo(t.min) ? t.min : -1 / 0, this.max = Bo(t.max) ? t.max : 1 / 0, this.
      errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.color = "cyan", this.value = "", this.
      typed = "", this.lastHit = 0, this.render();
    }
    set value(t) {
      !t && t !== 0 ? (this.placeholder = !0, this.rendered = hn.gray(this.transform.render(`${this.initial}`)), this._value = "") : (this.placeholder =
      !1, this.rendered = this.transform.render(`${Ih(t, this.round)}`), this._value = Ih(t, this.round)), this.fire();
    }
    get value() {
      return this._value;
    }
    parse(t) {
      return this.float ? parseFloat(t) : parseInt(t);
    }
    valid(t) {
      return t === "-" || t === "." && this.float || Sw.test(t);
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
      return Mh(function* () {
        let r = yield t.validator(t.value);
        typeof r == "string" && (t.errorMsg = r, r = !1), t.error = !r;
      })();
    }
    submit() {
      var t = this;
      return Mh(function* () {
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
      this.closed || (this.firstRender || (this.outputError && this.out.write(cn.down(xw(this.outputError, this.out.columns) - 1) + jh(this.
      outputError, this.out.columns)), this.out.write(jh(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [Ro.symbol(this.done, this.aborted), hn.bold(this.msg), Ro.delimiter(this.done), !this.done || !this.done && !this.placeholder ? hn[this.
      color]().underline(this.rendered) : this.rendered].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : Fw.pointerSmall} ${hn.red().italic(r)}`, "")), this.out.write(Cw.line + cn.to(0) + this.outputText + cn.save + this.outputError +
      cn.restore));
    }
  };
  Nh.exports = ko;
});

// ../node_modules/prompts/dist/elements/multiselect.js
var Po = b((CB, $h) => {
  "use strict";
  var $e = ue(), Aw = le(), Tw = Aw.cursor, Rw = tt(), Yr = je(), Hh = Yr.clear, _t = Yr.figures, Wh = Yr.style, Bw = Yr.wrap, kw = Yr.entriesToDisplay,
  Oo = class extends Rw {
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
      })), this.clear = Hh("", this.out.columns), t.overrideRender || this.render();
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
      let o = (r.selected ? $e.green(_t.radioOn) : _t.radioOff) + " " + s + " ", u, a;
      return r.disabled ? u = t === i ? $e.gray().underline(r.title) : $e.strikethrough().gray(r.title) : (u = t === i ? $e.cyan().underline(
      r.title) : r.title, t === i && r.description && (a = ` - ${r.description}`, (o.length + u.length + a.length >= this.out.columns || r.description.
      split(/\r?\n/).length > 1) && (a = `
` + Bw(r.description, {
        margin: o.length,
        width: this.out.columns
      })))), o + u + $e.gray(a || "");
    }
    // shared with autocompleteMultiselect
    paginateOptions(t) {
      if (t.length === 0)
        return $e.red("No matches for this query.");
      let r = kw(this.cursor, t.length, this.optionsPerPage), i = r.startIndex, s = r.endIndex, o, u = [];
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
      let t = [$e.gray(this.hint), this.renderInstructions()];
      return this.value[this.cursor].disabled && t.push($e.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(Tw.hide), super.render();
      let t = [Wh.symbol(this.done, this.aborted), $e.bold(this.msg), Wh.delimiter(!1), this.renderDoneOrInstructions()].join(" ");
      this.showMinError && (t += $e.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.value), this.out.write(this.clear + t), this.clear = Hh(t, this.out.columns);
    }
  };
  $h.exports = Oo;
});

// ../node_modules/prompts/dist/elements/autocomplete.js
var Xh = b((xB, Kh) => {
  "use strict";
  function zh(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(zh, "asyncGeneratorStep");
  function Ow(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          zh(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          zh(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(Ow, "_asyncToGenerator");
  var Jr = ue(), Pw = tt(), Jh = le(), qw = Jh.erase, Vh = Jh.cursor, Kr = je(), qo = Kr.style, Gh = Kr.clear, Mo = Kr.figures, Mw = Kr.wrap,
  jw = Kr.entriesToDisplay, Yh = /* @__PURE__ */ n((e, t) => e[t] && (e[t].value || e[t].title || e[t]), "getVal"), Iw = /* @__PURE__ */ n((e, t) => e[t] &&
  (e[t].title || e[t].value || e[t]), "getTitle"), Lw = /* @__PURE__ */ n((e, t) => {
    let r = e.findIndex((i) => i.value === t || i.title === t);
    return r > -1 ? r : void 0;
  }, "getIndex"), jo = class extends Pw {
    static {
      n(this, "AutocompletePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.suggest = t.suggest, this.choices = t.choices, this.initial = typeof t.initial == "number" ? t.initial :
      Lw(t.choices, t.initial), this.select = this.initial || t.cursor || 0, this.i18n = {
        noMatches: t.noMatches || "no matches found"
      }, this.fallback = t.fallback || this.initial, this.clearFirst = t.clearFirst || !1, this.suggestions = [], this.input = "", this.limit =
      t.limit || 10, this.cursor = 0, this.transform = qo.render(t.style), this.scale = this.transform.scale, this.render = this.render.bind(
      this), this.complete = this.complete.bind(this), this.clear = Gh("", this.out.columns), this.complete(this.render), this.render();
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
      this.select = t, this.suggestions.length > 0 ? this.value = Yh(this.suggestions, t) : this.value = this.fallback.value, this.fire();
    }
    complete(t) {
      var r = this;
      return Ow(function* () {
        let i = r.completing = r.suggest(r.input, r.choices), s = yield i;
        if (r.completing !== i) return;
        r.suggestions = s.map((u, a, l) => ({
          title: Iw(l, a),
          value: Yh(l, a),
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
      let o, u = i ? Mo.arrowUp : s ? Mo.arrowDown : " ", a = r ? Jr.cyan().underline(t.title) : t.title;
      return u = (r ? Jr.cyan(Mo.pointer) + " " : "  ") + u, t.description && (o = ` - ${t.description}`, (u.length + a.length + o.length >=
      this.out.columns || t.description.split(/\r?\n/).length > 1) && (o = `
` + Mw(t.description, {
        margin: 3,
        width: this.out.columns
      }))), u + " " + a + Jr.gray(o || "");
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(Vh.hide) : this.out.write(Gh(this.outputText, this.out.columns)), super.render();
      let t = jw(this.select, this.choices.length, this.limit), r = t.startIndex, i = t.endIndex;
      if (this.outputText = [qo.symbol(this.done, this.aborted, this.exited), Jr.bold(this.msg), qo.delimiter(this.completing), this.done &&
      this.suggestions[this.select] ? this.suggestions[this.select].title : this.rendered = this.transform.render(this.input)].join(" "), !this.
      done) {
        let s = this.suggestions.slice(r, i).map((o, u) => this.renderOption(o, this.select === u + r, u === 0 && r > 0, u + r === i - 1 && i <
        this.choices.length)).join(`
`);
        this.outputText += `
` + (s || Jr.gray(this.fallback.title));
      }
      this.out.write(qw.line + Vh.to(0) + this.outputText);
    }
  };
  Kh.exports = jo;
});

// ../node_modules/prompts/dist/elements/autocompleteMultiselect.js
var tc = b((AB, ec) => {
  "use strict";
  var nt = ue(), Nw = le(), Uw = Nw.cursor, Hw = Po(), Lo = je(), Qh = Lo.clear, Zh = Lo.style, ur = Lo.figures, Io = class extends Hw {
    static {
      n(this, "AutocompleteMultiselectPrompt");
    }
    constructor(t = {}) {
      t.overrideRender = !0, super(t), this.inputValue = "", this.clear = Qh("", this.out.columns), this.filteredOptions = this.value, this.
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
    ${ur.arrowUp}/${ur.arrowDown}: Highlight option
    ${ur.arrowLeft}/${ur.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
` : "";
    }
    renderCurrentInput() {
      return `
Filtered results for: ${this.inputValue ? this.inputValue : nt.gray("Enter something to filter")}
`;
    }
    renderOption(t, r, i) {
      let s;
      return r.disabled ? s = t === i ? nt.gray().underline(r.title) : nt.strikethrough().gray(r.title) : s = t === i ? nt.cyan().underline(
      r.title) : r.title, (r.selected ? nt.green(ur.radioOn) : ur.radioOff) + "  " + s;
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [nt.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];
      return this.filteredOptions.length && this.filteredOptions[this.cursor].disabled && t.push(nt.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(Uw.hide), super.render();
      let t = [Zh.symbol(this.done, this.aborted), nt.bold(this.msg), Zh.delimiter(!1), this.renderDoneOrInstructions()].join(" ");
      this.showMinError && (t += nt.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.filteredOptions), this.out.write(this.clear + t), this.clear = Qh(t, this.out.columns);
    }
  };
  ec.exports = Io;
});

// ../node_modules/prompts/dist/elements/confirm.js
var ac = b((RB, uc) => {
  "use strict";
  var rc = ue(), Ww = tt(), sc = je(), ic = sc.style, $w = sc.clear, oc = le(), zw = oc.erase, nc = oc.cursor, No = class extends Ww {
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
      this.closed || (this.firstRender ? this.out.write(nc.hide) : this.out.write($w(this.outputText, this.out.columns)), super.render(), this.
      outputText = [ic.symbol(this.done, this.aborted), rc.bold(this.msg), ic.delimiter(this.done), this.done ? this.value ? this.yesMsg : this.
      noMsg : rc.gray(this.initialValue ? this.yesOption : this.noOption)].join(" "), this.out.write(zw.line + nc.to(0) + this.outputText));
    }
  };
  uc.exports = No;
});

// ../node_modules/prompts/dist/elements/index.js
var fc = b((kB, lc) => {
  "use strict";
  lc.exports = {
    TextPrompt: Jf(),
    SelectPrompt: Zf(),
    TogglePrompt: sh(),
    DatePrompt: Ph(),
    NumberPrompt: Uh(),
    MultiselectPrompt: Po(),
    AutocompletePrompt: Xh(),
    AutocompleteMultiselectPrompt: tc(),
    ConfirmPrompt: ac()
  };
});

// ../node_modules/prompts/dist/prompts.js
var cc = b((hc) => {
  "use strict";
  var Te = hc, Vw = fc(), pn = /* @__PURE__ */ n((e) => e, "noop");
  function ze(e, t, r = {}) {
    return new Promise((i, s) => {
      let o = new Vw[e](t), u = r.onAbort || pn, a = r.onSubmit || pn, l = r.onExit || pn;
      o.on("state", t.onState || pn), o.on("submit", (f) => i(a(f))), o.on("exit", (f) => i(l(f))), o.on("abort", (f) => s(u(f)));
    });
  }
  n(ze, "toPrompt");
  Te.text = (e) => ze("TextPrompt", e);
  Te.password = (e) => (e.style = "password", Te.text(e));
  Te.invisible = (e) => (e.style = "invisible", Te.text(e));
  Te.number = (e) => ze("NumberPrompt", e);
  Te.date = (e) => ze("DatePrompt", e);
  Te.confirm = (e) => ze("ConfirmPrompt", e);
  Te.list = (e) => {
    let t = e.separator || ",";
    return ze("TextPrompt", e, {
      onSubmit: /* @__PURE__ */ n((r) => r.split(t).map((i) => i.trim()), "onSubmit")
    });
  };
  Te.toggle = (e) => ze("TogglePrompt", e);
  Te.select = (e) => ze("SelectPrompt", e);
  Te.multiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return ze("MultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  Te.autocompleteMultiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return ze("AutocompleteMultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  var Gw = /* @__PURE__ */ n((e, t) => Promise.resolve(t.filter((r) => r.title.slice(0, e.length).toLowerCase() === e.toLowerCase())), "byTi\
tle");
  Te.autocomplete = (e) => (e.suggest = e.suggest || Gw, e.choices = [].concat(e.choices || []), ze("AutocompletePrompt", e));
});

// ../node_modules/prompts/dist/index.js
var vc = b((qB, bc) => {
  "use strict";
  function dc(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n(dc, "ownKeys");
  function pc(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? dc(Object(r), !0).forEach(function(i) {
        Yw(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : dc(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n(pc, "_objectSpread");
  function Yw(e, t, r) {
    return t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(Yw, "_defineProperty");
  function Jw(e, t) {
    var r = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (!r) {
      if (Array.isArray(e) || (r = Kw(e)) || t && e && typeof e.length == "number") {
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
  n(Jw, "_createForOfIteratorHelper");
  function Kw(e, t) {
    if (e) {
      if (typeof e == "string") return Dc(e, t);
      var r = Object.prototype.toString.call(e).slice(8, -1);
      if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
      if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Dc(e, t);
    }
  }
  n(Kw, "_unsupportedIterableToArray");
  function Dc(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var r = 0, i = new Array(t); r < t; r++) i[r] = e[r];
    return i;
  }
  n(Dc, "_arrayLikeToArray");
  function mc(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(mc, "asyncGeneratorStep");
  function gc(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          mc(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          mc(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(gc, "_asyncToGenerator");
  var Uo = cc(), Xw = ["suggest", "format", "onState", "validate", "onRender", "type"], yc = /* @__PURE__ */ n(() => {
  }, "noop");
  function Et() {
    return Ho.apply(this, arguments);
  }
  n(Et, "prompt");
  function Ho() {
    return Ho = gc(function* (e = [], {
      onSubmit: t = yc,
      onCancel: r = yc
    } = {}) {
      let i = {}, s = Et._override || {};
      e = [].concat(e);
      let o, u, a, l, f, p, d = /* @__PURE__ */ function() {
        var y = gc(function* (_, E, v = !1) {
          if (!(!v && _.validate && _.validate(E) !== !0))
            return _.format ? yield _.format(E, i) : E;
        });
        return /* @__PURE__ */ n(function(E, v) {
          return y.apply(this, arguments);
        }, "getFormattedAnswer");
      }();
      var c = Jw(e), h;
      try {
        for (c.s(); !(h = c.n()).done; ) {
          u = h.value;
          var g = u;
          if (l = g.name, f = g.type, typeof f == "function" && (f = yield f(o, pc({}, i), u), u.type = f), !!f) {
            for (let y in u) {
              if (Xw.includes(y)) continue;
              let _ = u[y];
              u[y] = typeof _ == "function" ? yield _(o, pc({}, i), p) : _;
            }
            if (p = u, typeof u.message != "string")
              throw new Error("prompt message is required");
            var w = u;
            if (l = w.name, f = w.type, Uo[f] === void 0)
              throw new Error(`prompt type (${f}) is not defined`);
            if (s[u.name] !== void 0 && (o = yield d(u, s[u.name]), o !== void 0)) {
              i[l] = o;
              continue;
            }
            try {
              o = Et._injected ? Qw(Et._injected, u.initial) : yield Uo[f](u), i[l] = o = yield d(u, o, !0), a = yield t(u, o, i);
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
    }), Ho.apply(this, arguments);
  }
  n(Ho, "_prompt");
  function Qw(e, t) {
    let r = e.shift();
    if (r instanceof Error)
      throw r;
    return r === void 0 ? t : r;
  }
  n(Qw, "getInjectedAnswer");
  function Zw(e) {
    Et._injected = (Et._injected || []).concat(e);
  }
  n(Zw, "inject");
  function e_(e) {
    Et._override = Object.assign({}, e);
  }
  n(e_, "override");
  bc.exports = Object.assign(Et, {
    prompt: Et,
    prompts: Uo,
    inject: Zw,
    override: e_
  });
});

// ../node_modules/prompts/lib/util/action.js
var _c = b((jB, wc) => {
  "use strict";
  wc.exports = (e, t) => {
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
var Dn = b((IB, Ec) => {
  "use strict";
  Ec.exports = (e) => {
    let t = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"
    ].join("|"), r = new RegExp(t, "g");
    return typeof e == "string" ? e.replace(r, "") : e;
  };
});

// ../node_modules/prompts/lib/util/clear.js
var xc = b((LB, Fc) => {
  "use strict";
  var t_ = Dn(), { erase: Cc, cursor: r_ } = le(), i_ = /* @__PURE__ */ n((e) => [...t_(e)].length, "width");
  Fc.exports = function(e, t) {
    if (!t) return Cc.line + r_.to(0);
    let r = 0, i = e.split(/\r?\n/);
    for (let s of i)
      r += 1 + Math.floor(Math.max(i_(s) - 1, 0) / t);
    return Cc.lines(r);
  };
});

// ../node_modules/prompts/lib/util/figures.js
var Wo = b((UB, Sc) => {
  "use strict";
  var Xr = {
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
  }, n_ = {
    arrowUp: Xr.arrowUp,
    arrowDown: Xr.arrowDown,
    arrowLeft: Xr.arrowLeft,
    arrowRight: Xr.arrowRight,
    radioOn: "(*)",
    radioOff: "( )",
    tick: "\u221A",
    cross: "\xD7",
    ellipsis: "...",
    pointerSmall: "\xBB",
    line: "\u2500",
    pointer: ">"
  }, s_ = process.platform === "win32" ? n_ : Xr;
  Sc.exports = s_;
});

// ../node_modules/prompts/lib/util/style.js
var Tc = b((HB, Ac) => {
  "use strict";
  var ar = ue(), It = Wo(), $o = Object.freeze({
    password: { scale: 1, render: /* @__PURE__ */ n((e) => "*".repeat(e.length), "render") },
    emoji: { scale: 2, render: /* @__PURE__ */ n((e) => "\u{1F603}".repeat(e.length), "render") },
    invisible: { scale: 0, render: /* @__PURE__ */ n((e) => "", "render") },
    default: { scale: 1, render: /* @__PURE__ */ n((e) => `${e}`, "render") }
  }), o_ = /* @__PURE__ */ n((e) => $o[e] || $o.default, "render"), Qr = Object.freeze({
    aborted: ar.red(It.cross),
    done: ar.green(It.tick),
    exited: ar.yellow(It.cross),
    default: ar.cyan("?")
  }), u_ = /* @__PURE__ */ n((e, t, r) => t ? Qr.aborted : r ? Qr.exited : e ? Qr.done : Qr.default, "symbol"), a_ = /* @__PURE__ */ n((e) => ar.
  gray(e ? It.ellipsis : It.pointerSmall), "delimiter"), l_ = /* @__PURE__ */ n((e, t) => ar.gray(e ? t ? It.pointerSmall : "+" : It.line), "\
item");
  Ac.exports = {
    styles: $o,
    render: o_,
    symbols: Qr,
    symbol: u_,
    delimiter: a_,
    item: l_
  };
});

// ../node_modules/prompts/lib/util/lines.js
var Bc = b(($B, Rc) => {
  "use strict";
  var f_ = Dn();
  Rc.exports = function(e, t) {
    let r = String(f_(e) || "").split(/\r?\n/);
    return t ? r.map((i) => Math.ceil(i.length / t)).reduce((i, s) => i + s) : r.length;
  };
});

// ../node_modules/prompts/lib/util/wrap.js
var Oc = b((zB, kc) => {
  "use strict";
  kc.exports = (e, t = {}) => {
    let r = Number.isSafeInteger(parseInt(t.margin)) ? new Array(parseInt(t.margin)).fill(" ").join("") : t.margin || "", i = t.width;
    return (e || "").split(/\r?\n/g).map((s) => s.split(/\s+/g).reduce((o, u) => (u.length + r.length >= i || o[o.length - 1].length + u.length +
    1 < i ? o[o.length - 1] += ` ${u}` : o.push(`${r}${u}`), o), [r]).join(`
`)).join(`
`);
  };
});

// ../node_modules/prompts/lib/util/entriesToDisplay.js
var qc = b((VB, Pc) => {
  "use strict";
  Pc.exports = (e, t, r) => {
    r = r || t;
    let i = Math.min(t - r, e - Math.floor(r / 2));
    i < 0 && (i = 0);
    let s = Math.min(i + r, t);
    return { startIndex: i, endIndex: s };
  };
});

// ../node_modules/prompts/lib/util/index.js
var Ie = b((GB, Mc) => {
  "use strict";
  Mc.exports = {
    action: _c(),
    clear: xc(),
    style: Tc(),
    strip: Dn(),
    figures: Wo(),
    lines: Bc(),
    wrap: Oc(),
    entriesToDisplay: qc()
  };
});

// ../node_modules/prompts/lib/elements/prompt.js
var st = b((YB, Ic) => {
  "use strict";
  var jc = require("readline"), { action: h_ } = Ie(), c_ = require("events"), { beep: d_, cursor: p_ } = le(), D_ = ue(), zo = class extends c_ {
    static {
      n(this, "Prompt");
    }
    constructor(t = {}) {
      super(), this.firstRender = !0, this.in = t.stdin || process.stdin, this.out = t.stdout || process.stdout, this.onRender = (t.onRender ||
      (() => {
      })).bind(this);
      let r = jc.createInterface({ input: this.in, escapeCodeTimeout: 50 });
      jc.emitKeypressEvents(this.in, r), this.in.isTTY && this.in.setRawMode(!0);
      let i = ["SelectPrompt", "MultiselectPrompt"].indexOf(this.constructor.name) > -1, s = /* @__PURE__ */ n((o, u) => {
        let a = h_(u, i);
        a === !1 ? this._ && this._(o, u) : typeof this[a] == "function" ? this[a](u) : this.bell();
      }, "keypress");
      this.close = () => {
        this.out.write(p_.show), this.in.removeListener("keypress", s), this.in.isTTY && this.in.setRawMode(!1), r.close(), this.emit(this.aborted ?
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
      this.out.write(d_);
    }
    render() {
      this.onRender(D_), this.firstRender && (this.firstRender = !1);
    }
  };
  Ic.exports = zo;
});

// ../node_modules/prompts/lib/elements/text.js
var Nc = b((KB, Lc) => {
  var mn = ue(), m_ = st(), { erase: g_, cursor: Zr } = le(), { style: Vo, clear: Go, lines: y_, figures: b_ } = Ie(), Yo = class extends m_ {
    static {
      n(this, "TextPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = Vo.render(t.style), this.scale = this.transform.scale, this.msg = t.message, this.initial = t.initial || "",
      this.validator = t.validate || (() => !0), this.value = "", this.errorMsg = t.error || "Please Enter A Valid Value", this.cursor = +!!this.
      initial, this.cursorOffset = 0, this.clear = Go("", this.out.columns), this.render();
    }
    set value(t) {
      !t && this.initial ? (this.placeholder = !0, this.rendered = mn.gray(this.transform.render(this.initial))) : (this.placeholder = !1, this.
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
      this.closed || (this.firstRender || (this.outputError && this.out.write(Zr.down(y_(this.outputError, this.out.columns) - 1) + Go(this.
      outputError, this.out.columns)), this.out.write(Go(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [
        Vo.symbol(this.done, this.aborted),
        mn.bold(this.msg),
        Vo.delimiter(this.done),
        this.red ? mn.red(this.rendered) : this.rendered
      ].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : b_.pointerSmall} ${mn.red().italic(r)}`, "")), this.out.write(g_.line + Zr.to(0) + this.outputText + Zr.save + this.outputError +
      Zr.restore + Zr.move(this.cursorOffset, 0)));
    }
  };
  Lc.exports = Yo;
});

// ../node_modules/prompts/lib/elements/select.js
var $c = b((QB, Wc) => {
  "use strict";
  var ot = ue(), v_ = st(), { style: Uc, clear: Hc, figures: gn, wrap: w_, entriesToDisplay: __ } = Ie(), { cursor: E_ } = le(), Jo = class extends v_ {
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
      })), this.optionsPerPage = t.optionsPerPage || 10, this.value = (this.choices[this.cursor] || {}).value, this.clear = Hc("", this.out.
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
      this.firstRender ? this.out.write(E_.hide) : this.out.write(Hc(this.outputText, this.out.columns)), super.render();
      let { startIndex: t, endIndex: r } = __(this.cursor, this.choices.length, this.optionsPerPage);
      if (this.outputText = [
        Uc.symbol(this.done, this.aborted),
        ot.bold(this.msg),
        Uc.delimiter(!1),
        this.done ? this.selection.title : this.selection.disabled ? ot.yellow(this.warn) : ot.gray(this.hint)
      ].join(" "), !this.done) {
        this.outputText += `
`;
        for (let i = t; i < r; i++) {
          let s, o, u = "", a = this.choices[i];
          i === t && t > 0 ? o = gn.arrowUp : i === r - 1 && r < this.choices.length ? o = gn.arrowDown : o = " ", a.disabled ? (s = this.cursor ===
          i ? ot.gray().underline(a.title) : ot.strikethrough().gray(a.title), o = (this.cursor === i ? ot.bold().gray(gn.pointer) + " " : "\
  ") + o) : (s = this.cursor === i ? ot.cyan().underline(a.title) : a.title, o = (this.cursor === i ? ot.cyan(gn.pointer) + " " : "  ") + o,
          a.description && this.cursor === i && (u = ` - ${a.description}`, (o.length + s.length + u.length >= this.out.columns || a.description.
          split(/\r?\n/).length > 1) && (u = `
` + w_(a.description, { margin: 3, width: this.out.columns })))), this.outputText += `${o} ${s}${ot.gray(u)}
`;
        }
      }
      this.out.write(this.outputText);
    }
  };
  Wc.exports = Jo;
});

// ../node_modules/prompts/lib/elements/toggle.js
var Yc = b((e6, Gc) => {
  var yn = ue(), C_ = st(), { style: zc, clear: F_ } = Ie(), { cursor: Vc, erase: x_ } = le(), Ko = class extends C_ {
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
      this.closed || (this.firstRender ? this.out.write(Vc.hide) : this.out.write(F_(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        zc.symbol(this.done, this.aborted),
        yn.bold(this.msg),
        zc.delimiter(this.done),
        this.value ? this.inactive : yn.cyan().underline(this.inactive),
        yn.gray("/"),
        this.value ? yn.cyan().underline(this.active) : this.active
      ].join(" "), this.out.write(x_.line + Vc.to(0) + this.outputText));
    }
  };
  Gc.exports = Ko;
});

// ../node_modules/prompts/lib/dateparts/datepart.js
var Ve = b((r6, Jc) => {
  "use strict";
  var Xo = class e {
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
  Jc.exports = Xo;
});

// ../node_modules/prompts/lib/dateparts/meridiem.js
var Xc = b((n6, Kc) => {
  "use strict";
  var S_ = Ve(), Qo = class extends S_ {
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
  Kc.exports = Qo;
});

// ../node_modules/prompts/lib/dateparts/day.js
var Zc = b((o6, Qc) => {
  "use strict";
  var A_ = Ve(), T_ = /* @__PURE__ */ n((e) => (e = e % 10, e === 1 ? "st" : e === 2 ? "nd" : e === 3 ? "rd" : "th"), "pos"), Zo = class extends A_ {
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
      return this.token === "DD" ? String(t).padStart(2, "0") : this.token === "Do" ? t + T_(t) : this.token === "d" ? r + 1 : this.token ===
      "ddd" ? this.locales.weekdaysShort[r] : this.token === "dddd" ? this.locales.weekdays[r] : t;
    }
  };
  Qc.exports = Zo;
});

// ../node_modules/prompts/lib/dateparts/hours.js
var td = b((a6, ed) => {
  "use strict";
  var R_ = Ve(), eu = class extends R_ {
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
  ed.exports = eu;
});

// ../node_modules/prompts/lib/dateparts/milliseconds.js
var id = b((f6, rd) => {
  "use strict";
  var B_ = Ve(), tu = class extends B_ {
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
  rd.exports = tu;
});

// ../node_modules/prompts/lib/dateparts/minutes.js
var sd = b((c6, nd) => {
  "use strict";
  var k_ = Ve(), ru = class extends k_ {
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
  nd.exports = ru;
});

// ../node_modules/prompts/lib/dateparts/month.js
var ud = b((p6, od) => {
  "use strict";
  var O_ = Ve(), iu = class extends O_ {
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
  od.exports = iu;
});

// ../node_modules/prompts/lib/dateparts/seconds.js
var ld = b((m6, ad) => {
  "use strict";
  var P_ = Ve(), nu = class extends P_ {
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
  ad.exports = nu;
});

// ../node_modules/prompts/lib/dateparts/year.js
var hd = b((y6, fd) => {
  "use strict";
  var q_ = Ve(), su = class extends q_ {
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
  fd.exports = su;
});

// ../node_modules/prompts/lib/dateparts/index.js
var dd = b((v6, cd) => {
  "use strict";
  cd.exports = {
    DatePart: Ve(),
    Meridiem: Xc(),
    Day: Zc(),
    Hours: td(),
    Milliseconds: id(),
    Minutes: sd(),
    Month: ud(),
    Seconds: ld(),
    Year: hd()
  };
});

// ../node_modules/prompts/lib/elements/date.js
var vd = b((w6, bd) => {
  "use strict";
  var ou = ue(), M_ = st(), { style: pd, clear: Dd, figures: j_ } = Ie(), { erase: I_, cursor: md } = le(), { DatePart: gd, Meridiem: L_, Day: N_,
  Hours: U_, Milliseconds: H_, Minutes: W_, Month: $_, Seconds: z_, Year: V_ } = dd(), G_ = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g,
  yd = {
    1: ({ token: e }) => e.replace(/\\(.)/g, "$1"),
    2: (e) => new N_(e),
    // Day // TODO
    3: (e) => new $_(e),
    // Month
    4: (e) => new V_(e),
    // Year
    5: (e) => new L_(e),
    // AM/PM // TODO (special)
    6: (e) => new U_(e),
    // Hours
    7: (e) => new W_(e),
    // Minutes
    8: (e) => new z_(e),
    // Seconds
    9: (e) => new H_(e)
    // Fractional seconds
  }, Y_ = {
    months: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
    monthsShort: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
    weekdays: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
    weekdaysShort: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",")
  }, uu = class extends M_ {
    static {
      n(this, "DatePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.cursor = 0, this.typed = "", this.locales = Object.assign(Y_, t.locales), this._date = t.initial ||
      /* @__PURE__ */ new Date(), this.errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.mask =
      t.mask || "YYYY-MM-DD HH:mm:ss", this.clear = Dd("", this.out.columns), this.render();
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
      for (this.parts = []; r = G_.exec(t); ) {
        let s = r.shift(), o = r.findIndex((u) => u != null);
        this.parts.push(o in yd ? yd[o]({ token: r[o] || s, date: this.date, parts: this.parts, locales: this.locales }) : r[o] || s);
      }
      let i = this.parts.reduce((s, o) => (typeof o == "string" && typeof s[s.length - 1] == "string" ? s[s.length - 1] += o : s.push(o), s),
      []);
      this.parts.splice(0), this.parts.push(...i), this.reset();
    }
    moveCursor(t) {
      this.typed = "", this.cursor = t, this.fire();
    }
    reset() {
      this.moveCursor(this.parts.findIndex((t) => t instanceof gd)), this.fire(), this.render();
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
      this.moveCursor(t ? this.parts.indexOf(t) : this.parts.findIndex((r) => r instanceof gd)), this.render();
    }
    _(t) {
      /\d/.test(t) && (this.typed += t, this.parts[this.cursor].setTo(this.typed), this.render());
    }
    render() {
      this.closed || (this.firstRender ? this.out.write(md.hide) : this.out.write(Dd(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        pd.symbol(this.done, this.aborted),
        ou.bold(this.msg),
        pd.delimiter(!1),
        this.parts.reduce((t, r, i) => t.concat(i === this.cursor && !this.done ? ou.cyan().underline(r.toString()) : r), []).join("")
      ].join(" "), this.error && (this.outputText += this.errorMsg.split(`
`).reduce(
        (t, r, i) => t + `
${i ? " " : j_.pointerSmall} ${ou.red().italic(r)}`,
        ""
      )), this.out.write(I_.line + md.to(0) + this.outputText));
    }
  };
  bd.exports = uu;
});

// ../node_modules/prompts/lib/elements/number.js
var Cd = b((E6, Ed) => {
  var bn = ue(), J_ = st(), { cursor: vn, erase: K_ } = le(), { style: au, figures: X_, clear: wd, lines: Q_ } = Ie(), Z_ = /[0-9]/, lu = /* @__PURE__ */ n(
  (e) => e !== void 0, "isDef"), _d = /* @__PURE__ */ n((e, t) => {
    let r = Math.pow(10, t);
    return Math.round(e * r) / r;
  }, "round"), fu = class extends J_ {
    static {
      n(this, "NumberPrompt");
    }
    constructor(t = {}) {
      super(t), this.transform = au.render(t.style), this.msg = t.message, this.initial = lu(t.initial) ? t.initial : "", this.float = !!t.float,
      this.round = t.round || 2, this.inc = t.increment || 1, this.min = lu(t.min) ? t.min : -1 / 0, this.max = lu(t.max) ? t.max : 1 / 0, this.
      errorMsg = t.error || "Please Enter A Valid Value", this.validator = t.validate || (() => !0), this.color = "cyan", this.value = "", this.
      typed = "", this.lastHit = 0, this.render();
    }
    set value(t) {
      !t && t !== 0 ? (this.placeholder = !0, this.rendered = bn.gray(this.transform.render(`${this.initial}`)), this._value = "") : (this.placeholder =
      !1, this.rendered = this.transform.render(`${_d(t, this.round)}`), this._value = _d(t, this.round)), this.fire();
    }
    get value() {
      return this._value;
    }
    parse(t) {
      return this.float ? parseFloat(t) : parseInt(t);
    }
    valid(t) {
      return t === "-" || t === "." && this.float || Z_.test(t);
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
      this.closed || (this.firstRender || (this.outputError && this.out.write(vn.down(Q_(this.outputError, this.out.columns) - 1) + wd(this.
      outputError, this.out.columns)), this.out.write(wd(this.outputText, this.out.columns))), super.render(), this.outputError = "", this.outputText =
      [
        au.symbol(this.done, this.aborted),
        bn.bold(this.msg),
        au.delimiter(this.done),
        !this.done || !this.done && !this.placeholder ? bn[this.color]().underline(this.rendered) : this.rendered
      ].join(" "), this.error && (this.outputError += this.errorMsg.split(`
`).reduce((t, r, i) => t + `
${i ? " " : X_.pointerSmall} ${bn.red().italic(r)}`, "")), this.out.write(K_.line + vn.to(0) + this.outputText + vn.save + this.outputError +
      vn.restore));
    }
  };
  Ed.exports = fu;
});

// ../node_modules/prompts/lib/elements/multiselect.js
var cu = b((F6, Sd) => {
  "use strict";
  var Ge = ue(), { cursor: eE } = le(), tE = st(), { clear: Fd, figures: Ct, style: xd, wrap: rE, entriesToDisplay: iE } = Ie(), hu = class extends tE {
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
      })), this.clear = Fd("", this.out.columns), t.overrideRender || this.render();
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
      let o = (r.selected ? Ge.green(Ct.radioOn) : Ct.radioOff) + " " + s + " ", u, a;
      return r.disabled ? u = t === i ? Ge.gray().underline(r.title) : Ge.strikethrough().gray(r.title) : (u = t === i ? Ge.cyan().underline(
      r.title) : r.title, t === i && r.description && (a = ` - ${r.description}`, (o.length + u.length + a.length >= this.out.columns || r.description.
      split(/\r?\n/).length > 1) && (a = `
` + rE(r.description, { margin: o.length, width: this.out.columns })))), o + u + Ge.gray(a || "");
    }
    // shared with autocompleteMultiselect
    paginateOptions(t) {
      if (t.length === 0)
        return Ge.red("No matches for this query.");
      let { startIndex: r, endIndex: i } = iE(this.cursor, t.length, this.optionsPerPage), s, o = [];
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
      let t = [Ge.gray(this.hint), this.renderInstructions()];
      return this.value[this.cursor].disabled && t.push(Ge.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(eE.hide), super.render();
      let t = [
        xd.symbol(this.done, this.aborted),
        Ge.bold(this.msg),
        xd.delimiter(!1),
        this.renderDoneOrInstructions()
      ].join(" ");
      this.showMinError && (t += Ge.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.value), this.out.write(this.clear + t), this.clear = Fd(t, this.out.columns);
    }
  };
  Sd.exports = hu;
});

// ../node_modules/prompts/lib/elements/autocomplete.js
var kd = b((S6, Bd) => {
  "use strict";
  var ei = ue(), nE = st(), { erase: sE, cursor: Ad } = le(), { style: du, clear: Td, figures: pu, wrap: oE, entriesToDisplay: uE } = Ie(), Rd = /* @__PURE__ */ n(
  (e, t) => e[t] && (e[t].value || e[t].title || e[t]), "getVal"), aE = /* @__PURE__ */ n((e, t) => e[t] && (e[t].title || e[t].value || e[t]),
  "getTitle"), lE = /* @__PURE__ */ n((e, t) => {
    let r = e.findIndex((i) => i.value === t || i.title === t);
    return r > -1 ? r : void 0;
  }, "getIndex"), Du = class extends nE {
    static {
      n(this, "AutocompletePrompt");
    }
    constructor(t = {}) {
      super(t), this.msg = t.message, this.suggest = t.suggest, this.choices = t.choices, this.initial = typeof t.initial == "number" ? t.initial :
      lE(t.choices, t.initial), this.select = this.initial || t.cursor || 0, this.i18n = { noMatches: t.noMatches || "no matches found" }, this.
      fallback = t.fallback || this.initial, this.clearFirst = t.clearFirst || !1, this.suggestions = [], this.input = "", this.limit = t.limit ||
      10, this.cursor = 0, this.transform = du.render(t.style), this.scale = this.transform.scale, this.render = this.render.bind(this), this.
      complete = this.complete.bind(this), this.clear = Td("", this.out.columns), this.complete(this.render), this.render();
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
      this.select = t, this.suggestions.length > 0 ? this.value = Rd(this.suggestions, t) : this.value = this.fallback.value, this.fire();
    }
    async complete(t) {
      let r = this.completing = this.suggest(this.input, this.choices), i = await r;
      if (this.completing !== r) return;
      this.suggestions = i.map((o, u, a) => ({ title: aE(a, u), value: Rd(a, u), description: o.description })), this.completing = !1;
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
      let o, u = i ? pu.arrowUp : s ? pu.arrowDown : " ", a = r ? ei.cyan().underline(t.title) : t.title;
      return u = (r ? ei.cyan(pu.pointer) + " " : "  ") + u, t.description && (o = ` - ${t.description}`, (u.length + a.length + o.length >=
      this.out.columns || t.description.split(/\r?\n/).length > 1) && (o = `
` + oE(t.description, { margin: 3, width: this.out.columns }))), u + " " + a + ei.gray(o || "");
    }
    render() {
      if (this.closed) return;
      this.firstRender ? this.out.write(Ad.hide) : this.out.write(Td(this.outputText, this.out.columns)), super.render();
      let { startIndex: t, endIndex: r } = uE(this.select, this.choices.length, this.limit);
      if (this.outputText = [
        du.symbol(this.done, this.aborted, this.exited),
        ei.bold(this.msg),
        du.delimiter(this.completing),
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
` + (i || ei.gray(this.fallback.title));
      }
      this.out.write(sE.line + Ad.to(0) + this.outputText);
    }
  };
  Bd.exports = Du;
});

// ../node_modules/prompts/lib/elements/autocompleteMultiselect.js
var Md = b((T6, qd) => {
  "use strict";
  var ut = ue(), { cursor: fE } = le(), hE = cu(), { clear: Od, style: Pd, figures: lr } = Ie(), mu = class extends hE {
    static {
      n(this, "AutocompleteMultiselectPrompt");
    }
    constructor(t = {}) {
      t.overrideRender = !0, super(t), this.inputValue = "", this.clear = Od("", this.out.columns), this.filteredOptions = this.value, this.
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
    ${lr.arrowUp}/${lr.arrowDown}: Highlight option
    ${lr.arrowLeft}/${lr.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
` : "";
    }
    renderCurrentInput() {
      return `
Filtered results for: ${this.inputValue ? this.inputValue : ut.gray("Enter something to filter")}
`;
    }
    renderOption(t, r, i) {
      let s;
      return r.disabled ? s = t === i ? ut.gray().underline(r.title) : ut.strikethrough().gray(r.title) : s = t === i ? ut.cyan().underline(
      r.title) : r.title, (r.selected ? ut.green(lr.radioOn) : lr.radioOff) + "  " + s;
    }
    renderDoneOrInstructions() {
      if (this.done)
        return this.value.filter((r) => r.selected).map((r) => r.title).join(", ");
      let t = [ut.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];
      return this.filteredOptions.length && this.filteredOptions[this.cursor].disabled && t.push(ut.yellow(this.warn)), t.join(" ");
    }
    render() {
      if (this.closed) return;
      this.firstRender && this.out.write(fE.hide), super.render();
      let t = [
        Pd.symbol(this.done, this.aborted),
        ut.bold(this.msg),
        Pd.delimiter(!1),
        this.renderDoneOrInstructions()
      ].join(" ");
      this.showMinError && (t += ut.red(`You must select a minimum of ${this.minSelected} choices.`), this.showMinError = !1), t += this.renderOptions(
      this.filteredOptions), this.out.write(this.clear + t), this.clear = Od(t, this.out.columns);
    }
  };
  qd.exports = mu;
});

// ../node_modules/prompts/lib/elements/confirm.js
var Ud = b((B6, Nd) => {
  var jd = ue(), cE = st(), { style: Id, clear: dE } = Ie(), { erase: pE, cursor: Ld } = le(), gu = class extends cE {
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
      this.closed || (this.firstRender ? this.out.write(Ld.hide) : this.out.write(dE(this.outputText, this.out.columns)), super.render(), this.
      outputText = [
        Id.symbol(this.done, this.aborted),
        jd.bold(this.msg),
        Id.delimiter(this.done),
        this.done ? this.value ? this.yesMsg : this.noMsg : jd.gray(this.initialValue ? this.yesOption : this.noOption)
      ].join(" "), this.out.write(pE.line + Ld.to(0) + this.outputText));
    }
  };
  Nd.exports = gu;
});

// ../node_modules/prompts/lib/elements/index.js
var Wd = b((O6, Hd) => {
  "use strict";
  Hd.exports = {
    TextPrompt: Nc(),
    SelectPrompt: $c(),
    TogglePrompt: Yc(),
    DatePrompt: vd(),
    NumberPrompt: Cd(),
    MultiselectPrompt: cu(),
    AutocompletePrompt: kd(),
    AutocompleteMultiselectPrompt: Md(),
    ConfirmPrompt: Ud()
  };
});

// ../node_modules/prompts/lib/prompts.js
var zd = b(($d) => {
  "use strict";
  var Re = $d, DE = Wd(), wn = /* @__PURE__ */ n((e) => e, "noop");
  function Ye(e, t, r = {}) {
    return new Promise((i, s) => {
      let o = new DE[e](t), u = r.onAbort || wn, a = r.onSubmit || wn, l = r.onExit || wn;
      o.on("state", t.onState || wn), o.on("submit", (f) => i(a(f))), o.on("exit", (f) => i(l(f))), o.on("abort", (f) => s(u(f)));
    });
  }
  n(Ye, "toPrompt");
  Re.text = (e) => Ye("TextPrompt", e);
  Re.password = (e) => (e.style = "password", Re.text(e));
  Re.invisible = (e) => (e.style = "invisible", Re.text(e));
  Re.number = (e) => Ye("NumberPrompt", e);
  Re.date = (e) => Ye("DatePrompt", e);
  Re.confirm = (e) => Ye("ConfirmPrompt", e);
  Re.list = (e) => {
    let t = e.separator || ",";
    return Ye("TextPrompt", e, {
      onSubmit: /* @__PURE__ */ n((r) => r.split(t).map((i) => i.trim()), "onSubmit")
    });
  };
  Re.toggle = (e) => Ye("TogglePrompt", e);
  Re.select = (e) => Ye("SelectPrompt", e);
  Re.multiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return Ye("MultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  Re.autocompleteMultiselect = (e) => {
    e.choices = [].concat(e.choices || []);
    let t = /* @__PURE__ */ n((r) => r.filter((i) => i.selected).map((i) => i.value), "toSelected");
    return Ye("AutocompleteMultiselectPrompt", e, {
      onAbort: t,
      onSubmit: t
    });
  };
  var mE = /* @__PURE__ */ n((e, t) => Promise.resolve(
    t.filter((r) => r.title.slice(0, e.length).toLowerCase() === e.toLowerCase())
  ), "byTitle");
  Re.autocomplete = (e) => (e.suggest = e.suggest || mE, e.choices = [].concat(e.choices || []), Ye("AutocompletePrompt", e));
});

// ../node_modules/prompts/lib/index.js
var Yd = b((M6, Gd) => {
  "use strict";
  var yu = zd(), gE = ["suggest", "format", "onState", "validate", "onRender", "type"], Vd = /* @__PURE__ */ n(() => {
  }, "noop");
  async function Ft(e = [], { onSubmit: t = Vd, onCancel: r = Vd } = {}) {
    let i = {}, s = Ft._override || {};
    e = [].concat(e);
    let o, u, a, l, f, p, d = /* @__PURE__ */ n(async (c, h, g = !1) => {
      if (!(!g && c.validate && c.validate(h) !== !0))
        return c.format ? await c.format(h, i) : h;
    }, "getFormattedAnswer");
    for (u of e)
      if ({ name: l, type: f } = u, typeof f == "function" && (f = await f(o, { ...i }, u), u.type = f), !!f) {
        for (let c in u) {
          if (gE.includes(c)) continue;
          let h = u[c];
          u[c] = typeof h == "function" ? await h(o, { ...i }, p) : h;
        }
        if (p = u, typeof u.message != "string")
          throw new Error("prompt message is required");
        if ({ name: l, type: f } = u, yu[f] === void 0)
          throw new Error(`prompt type (${f}) is not defined`);
        if (s[u.name] !== void 0 && (o = await d(u, s[u.name]), o !== void 0)) {
          i[l] = o;
          continue;
        }
        try {
          o = Ft._injected ? yE(Ft._injected, u.initial) : await yu[f](u), i[l] = o = await d(u, o, !0), a = await t(u, o, i);
        } catch {
          a = !await r(u, i);
        }
        if (a) return i;
      }
    return i;
  }
  n(Ft, "prompt");
  function yE(e, t) {
    let r = e.shift();
    if (r instanceof Error)
      throw r;
    return r === void 0 ? t : r;
  }
  n(yE, "getInjectedAnswer");
  function bE(e) {
    Ft._injected = (Ft._injected || []).concat(e);
  }
  n(bE, "inject");
  function vE(e) {
    Ft._override = Object.assign({}, e);
  }
  n(vE, "override");
  Gd.exports = Object.assign(Ft, { prompt: Ft, prompts: yu, inject: bE, override: vE });
});

// ../node_modules/prompts/index.js
var _n = b((I6, Jd) => {
  function wE(e) {
    e = (Array.isArray(e) ? e : e.split(".")).map(Number);
    let t = 0, r = process.versions.node.split(".").map(Number);
    for (; t < e.length; t++) {
      if (r[t] > e[t]) return !1;
      if (e[t] > r[t]) return !0;
    }
    return !1;
  }
  n(wE, "isNodeLT");
  Jd.exports = wE("8.6.0") ? vc() : Yd();
});

// ../node_modules/picocolors/picocolors.js
var vu = b((N6, bu) => {
  var Kd = process.argv || [], En = process.env, _E = !("NO_COLOR" in En || Kd.includes("--no-color")) && ("FORCE_COLOR" in En || Kd.includes(
  "--color") || process.platform === "win32" || require != null && require("tty").isatty(1) && En.TERM !== "dumb" || "CI" in En), EE = /* @__PURE__ */ n(
  (e, t, r = e) => (i) => {
    let s = "" + i, o = s.indexOf(t, e.length);
    return ~o ? e + CE(s, t, r, o) + t : e + s + t;
  }, "formatter"), CE = /* @__PURE__ */ n((e, t, r, i) => {
    let s = "", o = 0;
    do
      s += e.substring(o, i) + r, o = i + t.length, i = e.indexOf(t, o);
    while (~i);
    return s + e.substring(o);
  }, "replaceClose"), Xd = /* @__PURE__ */ n((e = _E) => {
    let t = e ? EE : () => String;
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
  bu.exports = Xd();
  bu.exports.createColors = Xd;
});

// ../node_modules/wrappy/wrappy.js
var tp = b((V6, ep) => {
  ep.exports = Zd;
  function Zd(e, t) {
    if (e && t) return Zd(e)(t);
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
  n(Zd, "wrappy");
});

// ../node_modules/once/once.js
var Fn = b((Y6, Cu) => {
  var rp = tp();
  Cu.exports = rp(Cn);
  Cu.exports.strict = rp(ip);
  Cn.proto = Cn(function() {
    Object.defineProperty(Function.prototype, "once", {
      value: /* @__PURE__ */ n(function() {
        return Cn(this);
      }, "value"),
      configurable: !0
    }), Object.defineProperty(Function.prototype, "onceStrict", {
      value: /* @__PURE__ */ n(function() {
        return ip(this);
      }, "value"),
      configurable: !0
    });
  });
  function Cn(e) {
    var t = /* @__PURE__ */ n(function() {
      return t.called ? t.value : (t.called = !0, t.value = e.apply(this, arguments));
    }, "f");
    return t.called = !1, t;
  }
  n(Cn, "once");
  function ip(e) {
    var t = /* @__PURE__ */ n(function() {
      if (t.called)
        throw new Error(t.onceError);
      return t.called = !0, t.value = e.apply(this, arguments);
    }, "f"), r = e.name || "Function wrapped with `once`";
    return t.onceError = r + " shouldn't be called more than once", t.called = !1, t;
  }
  n(ip, "onceStrict");
});

// ../node_modules/end-of-stream/index.js
var fr = b((K6, sp) => {
  var TE = Fn(), RE = /* @__PURE__ */ n(function() {
  }, "noop"), BE = /* @__PURE__ */ n(function(e) {
    return e.setHeader && typeof e.abort == "function";
  }, "isRequest"), kE = /* @__PURE__ */ n(function(e) {
    return e.stdio && Array.isArray(e.stdio) && e.stdio.length === 3;
  }, "isChildProcess"), np = /* @__PURE__ */ n(function(e, t, r) {
    if (typeof t == "function") return np(e, null, t);
    t || (t = {}), r = TE(r || RE);
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
    return BE(e) ? (e.on("complete", f), e.on("abort", h), e.req ? w() : e.on("request", w)) : u && !i && (e.on("end", l), e.on("close", l)),
    kE(e) && e.on("exit", d), e.on("end", p), e.on("finish", f), t.error !== !1 && e.on("error", c), e.on("close", h), function() {
      a = !0, e.removeListener("complete", f), e.removeListener("abort", h), e.removeListener("request", w), e.req && e.req.removeListener("\
finish", f), e.removeListener("end", l), e.removeListener("close", l), e.removeListener("finish", f), e.removeListener("exit", d), e.removeListener(
      "end", p), e.removeListener("error", c), e.removeListener("close", h);
    };
  }, "eos");
  sp.exports = np;
});

// ../node_modules/pump/index.js
var xu = b((Q6, up) => {
  var OE = Fn(), PE = fr(), Fu = require("fs"), ri = /* @__PURE__ */ n(function() {
  }, "noop"), qE = /^v?\.0/.test(process.version), xn = /* @__PURE__ */ n(function(e) {
    return typeof e == "function";
  }, "isFn"), ME = /* @__PURE__ */ n(function(e) {
    return !qE || !Fu ? !1 : (e instanceof (Fu.ReadStream || ri) || e instanceof (Fu.WriteStream || ri)) && xn(e.close);
  }, "isFS"), jE = /* @__PURE__ */ n(function(e) {
    return e.setHeader && xn(e.abort);
  }, "isRequest"), IE = /* @__PURE__ */ n(function(e, t, r, i) {
    i = OE(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), PE(e, { readable: t, writable: r }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, ME(e)) return e.close(ri);
        if (jE(e)) return e.abort();
        if (xn(e.destroy)) return e.destroy();
        i(u || new Error("stream was destroyed"));
      }
    };
  }, "destroyer"), op = /* @__PURE__ */ n(function(e) {
    e();
  }, "call"), LE = /* @__PURE__ */ n(function(e, t) {
    return e.pipe(t);
  }, "pipe"), NE = /* @__PURE__ */ n(function() {
    var e = Array.prototype.slice.call(arguments), t = xn(e[e.length - 1] || ri) && e.pop() || ri;
    if (Array.isArray(e[0]) && (e = e[0]), e.length < 2) throw new Error("pump requires two streams per minimum");
    var r, i = e.map(function(s, o) {
      var u = o < e.length - 1, a = o > 0;
      return IE(s, u, a, function(l) {
        r || (r = l), l && i.forEach(op), !u && (i.forEach(op), t(r));
      });
    });
    return e.reduce(LE);
  }, "pump");
  up.exports = NE;
});

// ../node_modules/tar-fs/node_modules/chownr/chownr.js
var pp = b((ek, dp) => {
  "use strict";
  var Oe = require("fs"), Lt = require("path"), UE = Oe.lchown ? "lchown" : "chown", HE = Oe.lchownSync ? "lchownSync" : "chownSync", lp = Oe.
  lchown && !process.version.match(/v1[1-9]+\./) && !process.version.match(/v10\.[6-9]/), ap = /* @__PURE__ */ n((e, t, r) => {
    try {
      return Oe[HE](e, t, r);
    } catch (i) {
      if (i.code !== "ENOENT")
        throw i;
    }
  }, "lchownSync"), WE = /* @__PURE__ */ n((e, t, r) => {
    try {
      return Oe.chownSync(e, t, r);
    } catch (i) {
      if (i.code !== "ENOENT")
        throw i;
    }
  }, "chownSync"), $E = lp ? (e, t, r, i) => (s) => {
    !s || s.code !== "EISDIR" ? i(s) : Oe.chown(e, t, r, i);
  } : (e, t, r, i) => i, Su = lp ? (e, t, r) => {
    try {
      return ap(e, t, r);
    } catch (i) {
      if (i.code !== "EISDIR")
        throw i;
      WE(e, t, r);
    }
  } : (e, t, r) => ap(e, t, r), zE = process.version, fp = /* @__PURE__ */ n((e, t, r) => Oe.readdir(e, t, r), "readdir"), VE = /* @__PURE__ */ n(
  (e, t) => Oe.readdirSync(e, t), "readdirSync");
  /^v4\./.test(zE) && (fp = /* @__PURE__ */ n((e, t, r) => Oe.readdir(e, r), "readdir"));
  var Sn = /* @__PURE__ */ n((e, t, r, i) => {
    Oe[UE](e, t, r, $E(e, t, r, (s) => {
      i(s && s.code !== "ENOENT" ? s : null);
    }));
  }, "chown"), hp = /* @__PURE__ */ n((e, t, r, i, s) => {
    if (typeof t == "string")
      return Oe.lstat(Lt.resolve(e, t), (o, u) => {
        if (o)
          return s(o.code !== "ENOENT" ? o : null);
        u.name = t, hp(e, u, r, i, s);
      });
    if (t.isDirectory())
      Au(Lt.resolve(e, t.name), r, i, (o) => {
        if (o)
          return s(o);
        let u = Lt.resolve(e, t.name);
        Sn(u, r, i, s);
      });
    else {
      let o = Lt.resolve(e, t.name);
      Sn(o, r, i, s);
    }
  }, "chownrKid"), Au = /* @__PURE__ */ n((e, t, r, i) => {
    fp(e, { withFileTypes: !0 }, (s, o) => {
      if (s) {
        if (s.code === "ENOENT")
          return i();
        if (s.code !== "ENOTDIR" && s.code !== "ENOTSUP")
          return i(s);
      }
      if (s || !o.length)
        return Sn(e, t, r, i);
      let u = o.length, a = null, l = /* @__PURE__ */ n((f) => {
        if (!a) {
          if (f)
            return i(a = f);
          if (--u === 0)
            return Sn(e, t, r, i);
        }
      }, "then");
      o.forEach((f) => hp(e, f, t, r, l));
    });
  }, "chownr"), GE = /* @__PURE__ */ n((e, t, r, i) => {
    if (typeof t == "string")
      try {
        let s = Oe.lstatSync(Lt.resolve(e, t));
        s.name = t, t = s;
      } catch (s) {
        if (s.code === "ENOENT")
          return;
        throw s;
      }
    t.isDirectory() && cp(Lt.resolve(e, t.name), r, i), Su(Lt.resolve(e, t.name), r, i);
  }, "chownrKidSync"), cp = /* @__PURE__ */ n((e, t, r) => {
    let i;
    try {
      i = VE(e, { withFileTypes: !0 });
    } catch (s) {
      if (s.code === "ENOENT")
        return;
      if (s.code === "ENOTDIR" || s.code === "ENOTSUP")
        return Su(e, t, r);
      throw s;
    }
    return i && i.length && i.forEach((s) => GE(e, s, t, r)), Su(e, t, r);
  }, "chownrSync");
  dp.exports = Au;
  Au.sync = cp;
});

// ../node_modules/readable-stream/lib/internal/streams/stream.js
var Tu = b((rk, Dp) => {
  Dp.exports = require("stream");
});

// ../node_modules/readable-stream/lib/internal/streams/buffer_list.js
var wp = b((ik, vp) => {
  "use strict";
  function mp(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n(mp, "ownKeys");
  function gp(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? mp(Object(r), !0).forEach(function(i) {
        YE(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : mp(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n(gp, "_objectSpread");
  function YE(e, t, r) {
    return t = bp(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(YE, "_defineProperty");
  function JE(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(JE, "_classCallCheck");
  function yp(e, t) {
    for (var r = 0; r < t.length; r++) {
      var i = t[r];
      i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, bp(i.key), i);
    }
  }
  n(yp, "_defineProperties");
  function KE(e, t, r) {
    return t && yp(e.prototype, t), r && yp(e, r), Object.defineProperty(e, "prototype", { writable: !1 }), e;
  }
  n(KE, "_createClass");
  function bp(e) {
    var t = XE(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n(bp, "_toPropertyKey");
  function XE(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(XE, "_toPrimitive");
  var QE = require("buffer"), An = QE.Buffer, ZE = require("util"), Ru = ZE.inspect, eC = Ru && Ru.custom || "inspect";
  function tC(e, t, r) {
    An.prototype.copy.call(e, t, r);
  }
  n(tC, "copyBuffer");
  vp.exports = /* @__PURE__ */ function() {
    function e() {
      JE(this, e), this.head = null, this.tail = null, this.length = 0;
    }
    return n(e, "BufferList"), KE(e, [{
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
        if (this.length === 0) return An.alloc(0);
        for (var i = An.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
          tC(s.data, i, o), o += s.data.length, s = s.next;
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
        var i = An.allocUnsafe(r), s = this.head, o = 1;
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
      key: eC,
      value: /* @__PURE__ */ n(function(r, i) {
        return Ru(this, gp(gp({}, i), {}, {
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
var ku = b((sk, Ep) => {
  "use strict";
  function rC(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, process.
    nextTick(Bu, this, e)) : process.nextTick(Bu, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState &&
    (this._writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted ? process.nextTick(Tn, r) : (r._writableState.errorEmitted = !0, process.nextTick(
      _p, r, o)) : process.nextTick(_p, r, o) : t ? (process.nextTick(Tn, r), t(o)) : process.nextTick(Tn, r);
    }), this);
  }
  n(rC, "destroy");
  function _p(e, t) {
    Bu(e, t), Tn(e);
  }
  n(_p, "emitErrorAndCloseNT");
  function Tn(e) {
    e._writableState && !e._writableState.emitClose || e._readableState && !e._readableState.emitClose || e.emit("close");
  }
  n(Tn, "emitCloseNT");
  function iC() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(iC, "undestroy");
  function Bu(e, t) {
    e.emit("error", t);
  }
  n(Bu, "emitErrorNT");
  function nC(e, t) {
    var r = e._readableState, i = e._writableState;
    r && r.autoDestroy || i && i.autoDestroy ? e.destroy(t) : e.emit("error", t);
  }
  n(nC, "errorOrDestroy");
  Ep.exports = {
    destroy: rC,
    undestroy: iC,
    errorOrDestroy: nC
  };
});

// ../node_modules/readable-stream/errors.js
var xt = b((uk, xp) => {
  "use strict";
  var Fp = {};
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
    s.prototype.name = r.name, s.prototype.code = e, Fp[e] = s;
  }
  n(Pe, "createErrorType");
  function Cp(e, t) {
    if (Array.isArray(e)) {
      let r = e.length;
      return e = e.map((i) => String(i)), r > 2 ? `one of ${t} ${e.slice(0, r - 1).join(", ")}, or ` + e[r - 1] : r === 2 ? `one of ${t} ${e[0]}\
 or ${e[1]}` : `of ${t} ${e[0]}`;
    } else
      return `of ${t} ${String(e)}`;
  }
  n(Cp, "oneOf");
  function sC(e, t, r) {
    return e.substr(!r || r < 0 ? 0 : +r, t.length) === t;
  }
  n(sC, "startsWith");
  function oC(e, t, r) {
    return (r === void 0 || r > e.length) && (r = e.length), e.substring(r - t.length, r) === t;
  }
  n(oC, "endsWith");
  function uC(e, t, r) {
    return typeof r != "number" && (r = 0), r + t.length > e.length ? !1 : e.indexOf(t, r) !== -1;
  }
  n(uC, "includes");
  Pe("ERR_INVALID_OPT_VALUE", function(e, t) {
    return 'The value "' + t + '" is invalid for option "' + e + '"';
  }, TypeError);
  Pe("ERR_INVALID_ARG_TYPE", function(e, t, r) {
    let i;
    typeof t == "string" && sC(t, "not ") ? (i = "must not be", t = t.replace(/^not /, "")) : i = "must be";
    let s;
    if (oC(e, " argument"))
      s = `The ${e} ${i} ${Cp(t, "type")}`;
    else {
      let o = uC(e, ".") ? "property" : "argument";
      s = `The "${e}" ${o} ${i} ${Cp(t, "type")}`;
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
  xp.exports.codes = Fp;
});

// ../node_modules/readable-stream/lib/internal/streams/state.js
var Ou = b((lk, Sp) => {
  "use strict";
  var aC = xt().codes.ERR_INVALID_OPT_VALUE;
  function lC(e, t, r) {
    return e.highWaterMark != null ? e.highWaterMark : t ? e[r] : null;
  }
  n(lC, "highWaterMarkFrom");
  function fC(e, t, r, i) {
    var s = lC(t, i, r);
    if (s != null) {
      if (!(isFinite(s) && Math.floor(s) === s) || s < 0) {
        var o = i ? r : "highWaterMark";
        throw new aC(o, s);
      }
      return Math.floor(s);
    }
    return e.objectMode ? 16 : 16 * 1024;
  }
  n(fC, "getHighWaterMark");
  Sp.exports = {
    getHighWaterMark: fC
  };
});

// ../node_modules/inherits/inherits_browser.js
var Ap = b((hk, Pu) => {
  typeof Object.create == "function" ? Pu.exports = /* @__PURE__ */ n(function(t, r) {
    r && (t.super_ = r, t.prototype = Object.create(r.prototype, {
      constructor: {
        value: t,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }));
  }, "inherits") : Pu.exports = /* @__PURE__ */ n(function(t, r) {
    if (r) {
      t.super_ = r;
      var i = /* @__PURE__ */ n(function() {
      }, "TempCtor");
      i.prototype = r.prototype, t.prototype = new i(), t.prototype.constructor = t;
    }
  }, "inherits");
});

// ../node_modules/inherits/inherits.js
var X = b((dk, Mu) => {
  try {
    if (qu = require("util"), typeof qu.inherits != "function") throw "";
    Mu.exports = qu.inherits;
  } catch {
    Mu.exports = Ap();
  }
  var qu;
});

// ../node_modules/util-deprecate/node.js
var ii = b((pk, Tp) => {
  Tp.exports = require("util").deprecate;
});

// ../node_modules/readable-stream/lib/_stream_writable.js
var Lu = b((Dk, qp) => {
  "use strict";
  qp.exports = ce;
  function Bp(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      jC(t, e);
    };
  }
  n(Bp, "CorkedRequest");
  var hr;
  ce.WritableState = si;
  var hC = {
    deprecate: ii()
  }, kp = Tu(), Bn = require("buffer").Buffer, cC = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self :
  {}).Uint8Array || function() {
  };
  function dC(e) {
    return Bn.from(e);
  }
  n(dC, "_uint8ArrayToBuffer");
  function pC(e) {
    return Bn.isBuffer(e) || e instanceof cC;
  }
  n(pC, "_isUint8Array");
  var Iu = ku(), DC = Ou(), mC = DC.getHighWaterMark, St = xt().codes, gC = St.ERR_INVALID_ARG_TYPE, yC = St.ERR_METHOD_NOT_IMPLEMENTED, bC = St.
  ERR_MULTIPLE_CALLBACK, vC = St.ERR_STREAM_CANNOT_PIPE, wC = St.ERR_STREAM_DESTROYED, _C = St.ERR_STREAM_NULL_VALUES, EC = St.ERR_STREAM_WRITE_AFTER_END,
  CC = St.ERR_UNKNOWN_ENCODING, cr = Iu.errorOrDestroy;
  X()(ce, kp);
  function FC() {
  }
  n(FC, "nop");
  function si(e, t, r) {
    hr = hr || Nt(), e = e || {}, typeof r != "boolean" && (r = t instanceof hr), this.objectMode = !!e.objectMode, r && (this.objectMode = this.
    objectMode || !!e.writableObjectMode), this.highWaterMark = mC(this, e, "writableHighWaterMark", r), this.finalCalled = !1, this.needDrain =
    !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var i = e.decodeStrings === !1;
    this.decodeStrings = !i, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(s) {
      kC(t, s);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.emitClose = e.emitClose !== !1, this.autoDestroy = !!e.autoDestroy, this.bufferedRequestCount = 0, this.
    corkedRequestsFree = new Bp(this);
  }
  n(si, "WritableState");
  si.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(si.prototype, "buffer", {
        get: hC.deprecate(/* @__PURE__ */ n(function() {
          return this.getBuffer();
        }, "writableStateBufferGetter"), "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var Rn;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (Rn = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(ce, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(t) {
      return Rn.call(this, t) ? !0 : this !== ce ? !1 : t && t._writableState instanceof si;
    }, "value")
  })) : Rn = /* @__PURE__ */ n(function(t) {
    return t instanceof this;
  }, "realHasInstance");
  function ce(e) {
    hr = hr || Nt();
    var t = this instanceof hr;
    if (!t && !Rn.call(ce, this)) return new ce(e);
    this._writableState = new si(e, this, t), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), kp.call(this);
  }
  n(ce, "Writable");
  ce.prototype.pipe = function() {
    cr(this, new vC());
  };
  function xC(e, t) {
    var r = new EC();
    cr(e, r), process.nextTick(t, r);
  }
  n(xC, "writeAfterEnd");
  function SC(e, t, r, i) {
    var s;
    return r === null ? s = new _C() : typeof r != "string" && !t.objectMode && (s = new gC("chunk", ["string", "Buffer"], r)), s ? (cr(e, s),
    process.nextTick(i, s), !1) : !0;
  }
  n(SC, "validChunk");
  ce.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && pC(e);
    return o && !Bn.isBuffer(e) && (e = dC(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = FC), i.ending ? xC(this, r) : (o || SC(this, i, e, r)) && (i.pendingcb++, s = TC(this, i, o, e, t, r)), s;
  };
  ce.prototype.cork = function() {
    this._writableState.corked++;
  };
  ce.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && Op(this, e));
  };
  ce.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new CC(t);
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
  function AC(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = Bn.from(t, r)), t;
  }
  n(AC, "decodeChunk");
  Object.defineProperty(ce.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function TC(e, t, r, i, s, o) {
    if (!r) {
      var u = AC(t, i, s);
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
      ju(e, t, !1, a, i, s, o);
    return l;
  }
  n(TC, "writeOrBuffer");
  function ju(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, t.destroyed ? t.onwrite(new wC("write")) : r ? e._writev(s, t.onwrite) : e._write(
    s, o, t.onwrite), t.sync = !1;
  }
  n(ju, "doWrite");
  function RC(e, t, r, i, s) {
    --t.pendingcb, r ? (process.nextTick(s, i), process.nextTick(ni, e, t), e._writableState.errorEmitted = !0, cr(e, i)) : (s(i), e._writableState.
    errorEmitted = !0, cr(e, i), ni(e, t));
  }
  n(RC, "onwriteError");
  function BC(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(BC, "onwriteStateUpdate");
  function kC(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (typeof s != "function") throw new bC();
    if (BC(r), t) RC(e, r, i, t, s);
    else {
      var o = Pp(r) || e.destroyed;
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && Op(e, r), i ? process.nextTick(Rp, e, r, o, s) : Rp(e, r, o, s);
    }
  }
  n(kC, "onwrite");
  function Rp(e, t, r, i) {
    r || OC(e, t), t.pendingcb--, i(), ni(e, t);
  }
  n(Rp, "afterWrite");
  function OC(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(OC, "onwriteDrain");
  function Op(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, ju(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new Bp(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (ju(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(Op, "clearBuffer");
  ce.prototype._write = function(e, t, r) {
    r(new yC("_write()"));
  };
  ce.prototype._writev = null;
  ce.prototype.end = function(e, t, r) {
    var i = this._writableState;
    return typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t),
    i.corked && (i.corked = 1, this.uncork()), i.ending || MC(this, i, r), this;
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
  function Pp(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(Pp, "needFinish");
  function PC(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && cr(e, r), t.prefinished = !0, e.emit("prefinish"), ni(e, t);
    });
  }
  n(PC, "callFinal");
  function qC(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" && !t.destroyed ? (t.pendingcb++, t.finalCalled = !0, process.nextTick(
    PC, e, t)) : (t.prefinished = !0, e.emit("prefinish")));
  }
  n(qC, "prefinish");
  function ni(e, t) {
    var r = Pp(t);
    if (r && (qC(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"), t.autoDestroy))) {
      var i = e._readableState;
      (!i || i.autoDestroy && i.endEmitted) && e.destroy();
    }
    return r;
  }
  n(ni, "finishMaybe");
  function MC(e, t, r) {
    t.ending = !0, ni(e, t), r && (t.finished ? process.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(MC, "endWritable");
  function jC(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(jC, "onCorkedFinish");
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
  ce.prototype.destroy = Iu.destroy;
  ce.prototype._undestroy = Iu.undestroy;
  ce.prototype._destroy = function(e, t) {
    t(e);
  };
});

// ../node_modules/readable-stream/lib/_stream_duplex.js
var Nt = b((gk, jp) => {
  "use strict";
  var IC = Object.keys || function(e) {
    var t = [];
    for (var r in e) t.push(r);
    return t;
  };
  jp.exports = Je;
  var Mp = Hu(), Uu = Lu();
  X()(Je, Mp);
  for (Nu = IC(Uu.prototype), kn = 0; kn < Nu.length; kn++)
    On = Nu[kn], Je.prototype[On] || (Je.prototype[On] = Uu.prototype[On]);
  var Nu, On, kn;
  function Je(e) {
    if (!(this instanceof Je)) return new Je(e);
    Mp.call(this, e), Uu.call(this, e), this.allowHalfOpen = !0, e && (e.readable === !1 && (this.readable = !1), e.writable === !1 && (this.
    writable = !1), e.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", LC)));
  }
  n(Je, "Duplex");
  Object.defineProperty(Je.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  Object.defineProperty(Je.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState && this._writableState.getBuffer();
    }, "get")
  });
  Object.defineProperty(Je.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.length;
    }, "get")
  });
  function LC() {
    this._writableState.ended || process.nextTick(NC, this);
  }
  n(LC, "onend");
  function NC(e) {
    e.end();
  }
  n(NC, "onEndNT");
  Object.defineProperty(Je.prototype, "destroyed", {
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
var Pn = b((bk, Np) => {
  "use strict";
  var Ip = xt().codes.ERR_STREAM_PREMATURE_CLOSE;
  function UC(e) {
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
  n(UC, "once");
  function HC() {
  }
  n(HC, "noop");
  function WC(e) {
    return e.setHeader && typeof e.abort == "function";
  }
  n(WC, "isRequest");
  function Lp(e, t, r) {
    if (typeof t == "function") return Lp(e, null, t);
    t || (t = {}), r = UC(r || HC);
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
        return (!e._readableState || !e._readableState.ended) && (g = new Ip()), r.call(e, g);
      if (s && !u)
        return (!e._writableState || !e._writableState.ended) && (g = new Ip()), r.call(e, g);
    }, "onclose"), c = /* @__PURE__ */ n(function() {
      e.req.on("finish", a);
    }, "onrequest");
    return WC(e) ? (e.on("complete", a), e.on("abort", d), e.req ? c() : e.on("request", c)) : s && !e._writableState && (e.on("end", o), e.
    on("close", o)), e.on("end", f), e.on("finish", a), t.error !== !1 && e.on("error", p), e.on("close", d), function() {
      e.removeListener("complete", a), e.removeListener("abort", d), e.removeListener("request", c), e.req && e.req.removeListener("finish",
      a), e.removeListener("end", o), e.removeListener("close", o), e.removeListener("finish", a), e.removeListener("end", f), e.removeListener(
      "error", p), e.removeListener("close", d);
    };
  }
  n(Lp, "eos");
  Np.exports = Lp;
});

// ../node_modules/readable-stream/lib/internal/streams/async_iterator.js
var Hp = b((wk, Up) => {
  "use strict";
  var qn;
  function At(e, t, r) {
    return t = $C(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(At, "_defineProperty");
  function $C(e) {
    var t = zC(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n($C, "_toPropertyKey");
  function zC(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(zC, "_toPrimitive");
  var VC = Pn(), Tt = Symbol("lastResolve"), Ut = Symbol("lastReject"), oi = Symbol("error"), Mn = Symbol("ended"), Ht = Symbol("lastPromise"),
  Wu = Symbol("handlePromise"), Wt = Symbol("stream");
  function Rt(e, t) {
    return {
      value: e,
      done: t
    };
  }
  n(Rt, "createIterResult");
  function GC(e) {
    var t = e[Tt];
    if (t !== null) {
      var r = e[Wt].read();
      r !== null && (e[Ht] = null, e[Tt] = null, e[Ut] = null, t(Rt(r, !1)));
    }
  }
  n(GC, "readAndResolve");
  function YC(e) {
    process.nextTick(GC, e);
  }
  n(YC, "onReadable");
  function JC(e, t) {
    return function(r, i) {
      e.then(function() {
        if (t[Mn]) {
          r(Rt(void 0, !0));
          return;
        }
        t[Wu](r, i);
      }, i);
    };
  }
  n(JC, "wrapForNext");
  var KC = Object.getPrototypeOf(function() {
  }), XC = Object.setPrototypeOf((qn = {
    get stream() {
      return this[Wt];
    },
    next: /* @__PURE__ */ n(function() {
      var t = this, r = this[oi];
      if (r !== null)
        return Promise.reject(r);
      if (this[Mn])
        return Promise.resolve(Rt(void 0, !0));
      if (this[Wt].destroyed)
        return new Promise(function(u, a) {
          process.nextTick(function() {
            t[oi] ? a(t[oi]) : u(Rt(void 0, !0));
          });
        });
      var i = this[Ht], s;
      if (i)
        s = new Promise(JC(i, this));
      else {
        var o = this[Wt].read();
        if (o !== null)
          return Promise.resolve(Rt(o, !1));
        s = new Promise(this[Wu]);
      }
      return this[Ht] = s, s;
    }, "next")
  }, At(qn, Symbol.asyncIterator, function() {
    return this;
  }), At(qn, "return", /* @__PURE__ */ n(function() {
    var t = this;
    return new Promise(function(r, i) {
      t[Wt].destroy(null, function(s) {
        if (s) {
          i(s);
          return;
        }
        r(Rt(void 0, !0));
      });
    });
  }, "_return")), qn), KC), QC = /* @__PURE__ */ n(function(t) {
    var r, i = Object.create(XC, (r = {}, At(r, Wt, {
      value: t,
      writable: !0
    }), At(r, Tt, {
      value: null,
      writable: !0
    }), At(r, Ut, {
      value: null,
      writable: !0
    }), At(r, oi, {
      value: null,
      writable: !0
    }), At(r, Mn, {
      value: t._readableState.endEmitted,
      writable: !0
    }), At(r, Wu, {
      value: /* @__PURE__ */ n(function(o, u) {
        var a = i[Wt].read();
        a ? (i[Ht] = null, i[Tt] = null, i[Ut] = null, o(Rt(a, !1))) : (i[Tt] = o, i[Ut] = u);
      }, "value"),
      writable: !0
    }), r));
    return i[Ht] = null, VC(t, function(s) {
      if (s && s.code !== "ERR_STREAM_PREMATURE_CLOSE") {
        var o = i[Ut];
        o !== null && (i[Ht] = null, i[Tt] = null, i[Ut] = null, o(s)), i[oi] = s;
        return;
      }
      var u = i[Tt];
      u !== null && (i[Ht] = null, i[Tt] = null, i[Ut] = null, u(Rt(void 0, !0))), i[Mn] = !0;
    }), t.on("readable", YC.bind(null, i)), i;
  }, "createReadableStreamAsyncIterator");
  Up.exports = QC;
});

// ../node_modules/readable-stream/lib/internal/streams/from.js
var Vp = b((Ek, zp) => {
  "use strict";
  function Wp(e, t, r, i, s, o, u) {
    try {
      var a = e[o](u), l = a.value;
    } catch (f) {
      r(f);
      return;
    }
    a.done ? t(l) : Promise.resolve(l).then(i, s);
  }
  n(Wp, "asyncGeneratorStep");
  function ZC(e) {
    return function() {
      var t = this, r = arguments;
      return new Promise(function(i, s) {
        var o = e.apply(t, r);
        function u(l) {
          Wp(o, i, s, u, a, "next", l);
        }
        n(u, "_next");
        function a(l) {
          Wp(o, i, s, u, a, "throw", l);
        }
        n(a, "_throw"), u(void 0);
      });
    };
  }
  n(ZC, "_asyncToGenerator");
  function $p(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var i = Object.getOwnPropertySymbols(e);
      t && (i = i.filter(function(s) {
        return Object.getOwnPropertyDescriptor(e, s).enumerable;
      })), r.push.apply(r, i);
    }
    return r;
  }
  n($p, "ownKeys");
  function eF(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {};
      t % 2 ? $p(Object(r), !0).forEach(function(i) {
        tF(e, i, r[i]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : $p(Object(r)).forEach(function(i) {
        Object.defineProperty(e, i, Object.getOwnPropertyDescriptor(r, i));
      });
    }
    return e;
  }
  n(eF, "_objectSpread");
  function tF(e, t, r) {
    return t = rF(t), t in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
  }
  n(tF, "_defineProperty");
  function rF(e) {
    var t = iF(e, "string");
    return typeof t == "symbol" ? t : String(t);
  }
  n(rF, "_toPropertyKey");
  function iF(e, t) {
    if (typeof e != "object" || e === null) return e;
    var r = e[Symbol.toPrimitive];
    if (r !== void 0) {
      var i = r.call(e, t || "default");
      if (typeof i != "object") return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (t === "string" ? String : Number)(e);
  }
  n(iF, "_toPrimitive");
  var nF = xt().codes.ERR_INVALID_ARG_TYPE;
  function sF(e, t, r) {
    var i;
    if (t && typeof t.next == "function")
      i = t;
    else if (t && t[Symbol.asyncIterator]) i = t[Symbol.asyncIterator]();
    else if (t && t[Symbol.iterator]) i = t[Symbol.iterator]();
    else throw new nF("iterable", ["Iterable"], t);
    var s = new e(eF({
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
      return a = ZC(function* () {
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
  n(sF, "from");
  zp.exports = sF;
});

// ../node_modules/readable-stream/lib/_stream_readable.js
var Hu = b((xk, rD) => {
  "use strict";
  rD.exports = N;
  var dr;
  N.ReadableState = Kp;
  var Fk = require("events").EventEmitter, Jp = /* @__PURE__ */ n(function(t, r) {
    return t.listeners(r).length;
  }, "EElistenerCount"), ai = Tu(), jn = require("buffer").Buffer, oF = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self <
  "u" ? self : {}).Uint8Array || function() {
  };
  function uF(e) {
    return jn.from(e);
  }
  n(uF, "_uint8ArrayToBuffer");
  function aF(e) {
    return jn.isBuffer(e) || e instanceof oF;
  }
  n(aF, "_isUint8Array");
  var $u = require("util"), j;
  $u && $u.debuglog ? j = $u.debuglog("stream") : j = /* @__PURE__ */ n(function() {
  }, "debug");
  var lF = wp(), Xu = ku(), fF = Ou(), hF = fF.getHighWaterMark, In = xt().codes, cF = In.ERR_INVALID_ARG_TYPE, dF = In.ERR_STREAM_PUSH_AFTER_EOF,
  pF = In.ERR_METHOD_NOT_IMPLEMENTED, DF = In.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, pr, zu, Vu;
  X()(N, ai);
  var ui = Xu.errorOrDestroy, Gu = ["error", "close", "destroy", "pause", "resume"];
  function mF(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : Array.isArray(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(mF, "prependListener");
  function Kp(e, t, r) {
    dr = dr || Nt(), e = e || {}, typeof r != "boolean" && (r = t instanceof dr), this.objectMode = !!e.objectMode, r && (this.objectMode = this.
    objectMode || !!e.readableObjectMode), this.highWaterMark = hF(this, e, "readableHighWaterMark", r), this.buffer = new lF(), this.length =
    0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0,
    this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose =
    e.emitClose !== !1, this.autoDestroy = !!e.autoDestroy, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain =
    0, this.readingMore = !1, this.decoder = null, this.encoding = null, e.encoding && (pr || (pr = require("string_decoder/").StringDecoder),
    this.decoder = new pr(e.encoding), this.encoding = e.encoding);
  }
  n(Kp, "ReadableState");
  function N(e) {
    if (dr = dr || Nt(), !(this instanceof N)) return new N(e);
    var t = this instanceof dr;
    this._readableState = new Kp(e, this, t), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), ai.call(this);
  }
  n(N, "Readable");
  Object.defineProperty(N.prototype, "destroyed", {
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
  N.prototype.destroy = Xu.destroy;
  N.prototype._undestroy = Xu.undestroy;
  N.prototype._destroy = function(e, t) {
    t(e);
  };
  N.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = jn.from(e, t), t = ""), i =
    !0), Xp(this, e, t, !1, i);
  };
  N.prototype.unshift = function(e) {
    return Xp(this, e, null, !0, !1);
  };
  function Xp(e, t, r, i, s) {
    j("readableAddChunk", t);
    var o = e._readableState;
    if (t === null)
      o.reading = !1, bF(e, o);
    else {
      var u;
      if (s || (u = gF(o, t)), u)
        ui(e, u);
      else if (o.objectMode || t && t.length > 0)
        if (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(t) !== jn.prototype && (t = uF(t)), i)
          o.endEmitted ? ui(e, new DF()) : Yu(e, o, t, !0);
        else if (o.ended)
          ui(e, new dF());
        else {
          if (o.destroyed)
            return !1;
          o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode || t.length !== 0 ? Yu(e, o, t, !1) : Ku(e, o)) : Yu(e, o,
          t, !1);
        }
      else i || (o.reading = !1, Ku(e, o));
    }
    return !o.ended && (o.length < o.highWaterMark || o.length === 0);
  }
  n(Xp, "readableAddChunk");
  function Yu(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (t.awaitDrain = 0, e.emit("data", r)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.
    unshift(r) : t.buffer.push(r), t.needReadable && Ln(e)), Ku(e, t);
  }
  n(Yu, "addChunk");
  function gF(e, t) {
    var r;
    return !aF(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new cF("chunk", ["string", "Buffer", "Uint8Array"], t)), r;
  }
  n(gF, "chunkInvalid");
  N.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  N.prototype.setEncoding = function(e) {
    pr || (pr = require("string_decoder/").StringDecoder);
    var t = new pr(e);
    this._readableState.decoder = t, this._readableState.encoding = this._readableState.decoder.encoding;
    for (var r = this._readableState.buffer.head, i = ""; r !== null; )
      i += t.write(r.data), r = r.next;
    return this._readableState.buffer.clear(), i !== "" && this._readableState.buffer.push(i), this._readableState.length = i.length, this;
  };
  var Gp = 1073741824;
  function yF(e) {
    return e >= Gp ? e = Gp : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(yF, "computeNewHighWaterMark");
  function Yp(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = yF(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(Yp, "howMuchToRead");
  N.prototype.read = function(e) {
    j("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && ((t.highWaterMark !== 0 ? t.length >= t.highWaterMark : t.length >
    0) || t.ended))
      return j("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? Ju(this) : Ln(this), null;
    if (e = Yp(e, t), e === 0 && t.ended)
      return t.length === 0 && Ju(this), null;
    var i = t.needReadable;
    j("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, j("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, j("reading or ended", i)) : i && (j("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = Yp(r, t)));
    var s;
    return e > 0 ? s = eD(e, t) : s = null, s === null ? (t.needReadable = t.length <= t.highWaterMark, e = 0) : (t.length -= e, t.awaitDrain =
    0), t.length === 0 && (t.ended || (t.needReadable = !0), r !== e && t.ended && Ju(this)), s !== null && this.emit("data", s), s;
  };
  function bF(e, t) {
    if (j("onEofChunk"), !t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, t.sync ? Ln(e) : (t.needReadable = !1, t.emittedReadable || (t.emittedReadable = !0, Qp(e)));
    }
  }
  n(bF, "onEofChunk");
  function Ln(e) {
    var t = e._readableState;
    j("emitReadable", t.needReadable, t.emittedReadable), t.needReadable = !1, t.emittedReadable || (j("emitReadable", t.flowing), t.emittedReadable =
    !0, process.nextTick(Qp, e));
  }
  n(Ln, "emitReadable");
  function Qp(e) {
    var t = e._readableState;
    j("emitReadable_", t.destroyed, t.length, t.ended), !t.destroyed && (t.length || t.ended) && (e.emit("readable"), t.emittedReadable = !1),
    t.needReadable = !t.flowing && !t.ended && t.length <= t.highWaterMark, Qu(e);
  }
  n(Qp, "emitReadable_");
  function Ku(e, t) {
    t.readingMore || (t.readingMore = !0, process.nextTick(vF, e, t));
  }
  n(Ku, "maybeReadMore");
  function vF(e, t) {
    for (; !t.reading && !t.ended && (t.length < t.highWaterMark || t.flowing && t.length === 0); ) {
      var r = t.length;
      if (j("maybeReadMore read 0"), e.read(0), r === t.length)
        break;
    }
    t.readingMore = !1;
  }
  n(vF, "maybeReadMore_");
  N.prototype._read = function(e) {
    ui(this, new pF("_read()"));
  };
  N.prototype.pipe = function(e, t) {
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
    i.pipesCount += 1, j("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : w;
    i.endEmitted ? process.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(y, _) {
      j("onunpipe"), y === r && _ && _.hasUnpiped === !1 && (_.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      j("onend"), e.end();
    }
    n(a, "onend");
    var l = wF(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      j("cleanup"), e.removeListener("close", h), e.removeListener("finish", g), e.removeListener("drain", l), e.removeListener("error", c),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", w), r.removeListener("data", d), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup"), r.on("data", d);
    function d(y) {
      j("ondata");
      var _ = e.write(y);
      j("dest.write", _), _ === !1 && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && tD(i.pipes, e) !== -1) && !f && (j("false\
 write response, pause", i.awaitDrain), i.awaitDrain++), r.pause());
    }
    n(d, "ondata");
    function c(y) {
      j("onerror", y), w(), e.removeListener("error", c), Jp(e, "error") === 0 && ui(e, y);
    }
    n(c, "onerror"), mF(e, "error", c);
    function h() {
      e.removeListener("finish", g), w();
    }
    n(h, "onclose"), e.once("close", h);
    function g() {
      j("onfinish"), e.removeListener("close", h), w();
    }
    n(g, "onfinish"), e.once("finish", g);
    function w() {
      j("unpipe"), r.unpipe(e);
    }
    return n(w, "unpipe"), e.emit("pipe", r), i.flowing || (j("pipe resume"), r.resume()), e;
  };
  function wF(e) {
    return /* @__PURE__ */ n(function() {
      var r = e._readableState;
      j("pipeOnDrain", r.awaitDrain), r.awaitDrain && r.awaitDrain--, r.awaitDrain === 0 && Jp(e, "data") && (r.flowing = !0, Qu(e));
    }, "pipeOnDrainFunctionResult");
  }
  n(wF, "pipeOnDrain");
  N.prototype.unpipe = function(e) {
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
    var u = tD(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  N.prototype.on = function(e, t) {
    var r = ai.prototype.on.call(this, e, t), i = this._readableState;
    return e === "data" ? (i.readableListening = this.listenerCount("readable") > 0, i.flowing !== !1 && this.resume()) : e === "readable" &&
    !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.flowing = !1, i.emittedReadable = !1, j("on reada\
ble", i.length, i.reading), i.length ? Ln(this) : i.reading || process.nextTick(_F, this)), r;
  };
  N.prototype.addListener = N.prototype.on;
  N.prototype.removeListener = function(e, t) {
    var r = ai.prototype.removeListener.call(this, e, t);
    return e === "readable" && process.nextTick(Zp, this), r;
  };
  N.prototype.removeAllListeners = function(e) {
    var t = ai.prototype.removeAllListeners.apply(this, arguments);
    return (e === "readable" || e === void 0) && process.nextTick(Zp, this), t;
  };
  function Zp(e) {
    var t = e._readableState;
    t.readableListening = e.listenerCount("readable") > 0, t.resumeScheduled && !t.paused ? t.flowing = !0 : e.listenerCount("data") > 0 && e.
    resume();
  }
  n(Zp, "updateReadableListening");
  function _F(e) {
    j("readable nexttick read 0"), e.read(0);
  }
  n(_F, "nReadingNextTick");
  N.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (j("resume"), e.flowing = !e.readableListening, EF(this, e)), e.paused = !1, this;
  };
  function EF(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, process.nextTick(CF, e, t));
  }
  n(EF, "resume");
  function CF(e, t) {
    j("resume", t.reading), t.reading || e.read(0), t.resumeScheduled = !1, e.emit("resume"), Qu(e), t.flowing && !t.reading && e.read(0);
  }
  n(CF, "resume_");
  N.prototype.pause = function() {
    return j("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (j("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this._readableState.paused = !0, this;
  };
  function Qu(e) {
    var t = e._readableState;
    for (j("flow", t.flowing); t.flowing && e.read() !== null; ) ;
  }
  n(Qu, "flow");
  N.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if (j("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if (j("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
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
    for (var o = 0; o < Gu.length; o++)
      e.on(Gu[o], this.emit.bind(this, Gu[o]));
    return this._read = function(u) {
      j("wrapped _read", u), i && (i = !1, e.resume());
    }, this;
  };
  typeof Symbol == "function" && (N.prototype[Symbol.asyncIterator] = function() {
    return zu === void 0 && (zu = Hp()), zu(this);
  });
  Object.defineProperty(N.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.highWaterMark;
    }, "get")
  });
  Object.defineProperty(N.prototype, "readableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState && this._readableState.buffer;
    }, "get")
  });
  Object.defineProperty(N.prototype, "readableFlowing", {
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
  N._fromList = eD;
  Object.defineProperty(N.prototype, "readableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._readableState.length;
    }, "get")
  });
  function eD(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    first() : r = t.buffer.concat(t.length), t.buffer.clear()) : r = t.buffer.consume(e, t.decoder), r;
  }
  n(eD, "fromList");
  function Ju(e) {
    var t = e._readableState;
    j("endReadable", t.endEmitted), t.endEmitted || (t.ended = !0, process.nextTick(FF, t, e));
  }
  n(Ju, "endReadable");
  function FF(e, t) {
    if (j("endReadableNT", e.endEmitted, e.length), !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"), e.
    autoDestroy)) {
      var r = t._writableState;
      (!r || r.autoDestroy && r.finished) && t.destroy();
    }
  }
  n(FF, "endReadableNT");
  typeof Symbol == "function" && (N.from = function(e, t) {
    return Vu === void 0 && (Vu = Vp()), Vu(N, e, t);
  });
  function tD(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(tD, "indexOf");
});

// ../node_modules/readable-stream/lib/_stream_transform.js
var Zu = b((Ak, nD) => {
  "use strict";
  nD.exports = at;
  var Nn = xt().codes, xF = Nn.ERR_METHOD_NOT_IMPLEMENTED, SF = Nn.ERR_MULTIPLE_CALLBACK, AF = Nn.ERR_TRANSFORM_ALREADY_TRANSFORMING, TF = Nn.
  ERR_TRANSFORM_WITH_LENGTH_0, Un = Nt();
  X()(at, Un);
  function RF(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (i === null)
      return this.emit("error", new SF());
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(RF, "afterTransform");
  function at(e) {
    if (!(this instanceof at)) return new at(e);
    Un.call(this, e), this._transformState = {
      afterTransform: RF.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", BF);
  }
  n(at, "Transform");
  function BF() {
    var e = this;
    typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(t, r) {
      iD(e, t, r);
    }) : iD(this, null, null);
  }
  n(BF, "prefinish");
  at.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, Un.prototype.push.call(this, e, t);
  };
  at.prototype._transform = function(e, t, r) {
    r(new xF("_transform()"));
  };
  at.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  at.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) : t.needTransform =
    !0;
  };
  at.prototype._destroy = function(e, t) {
    Un.prototype._destroy.call(this, e, function(r) {
      t(r);
    });
  };
  function iD(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new TF();
    if (e._transformState.transforming) throw new AF();
    return e.push(null);
  }
  n(iD, "done");
});

// ../node_modules/readable-stream/lib/_stream_passthrough.js
var uD = b((Rk, oD) => {
  "use strict";
  oD.exports = li;
  var sD = Zu();
  X()(li, sD);
  function li(e) {
    if (!(this instanceof li)) return new li(e);
    sD.call(this, e);
  }
  n(li, "PassThrough");
  li.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/readable-stream/lib/internal/streams/pipeline.js
var cD = b((kk, hD) => {
  "use strict";
  var ea;
  function kF(e) {
    var t = !1;
    return function() {
      t || (t = !0, e.apply(void 0, arguments));
    };
  }
  n(kF, "once");
  var fD = xt().codes, OF = fD.ERR_MISSING_ARGS, PF = fD.ERR_STREAM_DESTROYED;
  function aD(e) {
    if (e) throw e;
  }
  n(aD, "noop");
  function qF(e) {
    return e.setHeader && typeof e.abort == "function";
  }
  n(qF, "isRequest");
  function MF(e, t, r, i) {
    i = kF(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), ea === void 0 && (ea = Pn()), ea(e, {
      readable: t,
      writable: r
    }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, qF(e)) return e.abort();
        if (typeof e.destroy == "function") return e.destroy();
        i(u || new PF("pipe"));
      }
    };
  }
  n(MF, "destroyer");
  function lD(e) {
    e();
  }
  n(lD, "call");
  function jF(e, t) {
    return e.pipe(t);
  }
  n(jF, "pipe");
  function IF(e) {
    return !e.length || typeof e[e.length - 1] != "function" ? aD : e.pop();
  }
  n(IF, "popCallback");
  function LF() {
    for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
      t[r] = arguments[r];
    var i = IF(t);
    if (Array.isArray(t[0]) && (t = t[0]), t.length < 2)
      throw new OF("streams");
    var s, o = t.map(function(u, a) {
      var l = a < t.length - 1, f = a > 0;
      return MF(u, l, f, function(p) {
        s || (s = p), p && o.forEach(lD), !l && (o.forEach(lD), i(s));
      });
    });
    return t.reduce(jF);
  }
  n(LF, "pipeline");
  hD.exports = LF;
});

// ../node_modules/readable-stream/readable.js
var Dr = b((qe, hi) => {
  var fi = require("stream");
  process.env.READABLE_STREAM === "disable" && fi ? (hi.exports = fi.Readable, Object.assign(hi.exports, fi), hi.exports.Stream = fi) : (qe =
  hi.exports = Hu(), qe.Stream = fi || qe, qe.Readable = qe, qe.Writable = Lu(), qe.Duplex = Nt(), qe.Transform = Zu(), qe.PassThrough = uD(),
  qe.finished = Pn(), qe.pipeline = cD());
});

// ../node_modules/bl/BufferList.js
var DD = b((Pk, pD) => {
  "use strict";
  var { Buffer: Le } = require("buffer"), dD = Symbol.for("BufferList");
  function Q(e) {
    if (!(this instanceof Q))
      return new Q(e);
    Q._init.call(this, e);
  }
  n(Q, "BufferList");
  Q._init = /* @__PURE__ */ n(function(t) {
    Object.defineProperty(this, dD, { value: !0 }), this._bufs = [], this.length = 0, t && this.append(t);
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
    return t != null && t[dD];
  }, "isBufferList");
  pD.exports = Q;
});

// ../node_modules/bl/bl.js
var mD = b((Mk, Hn) => {
  "use strict";
  var ta = Dr().Duplex, NF = X(), ci = DD();
  function Ce(e) {
    if (!(this instanceof Ce))
      return new Ce(e);
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
    ci._init.call(this, e), ta.call(this);
  }
  n(Ce, "BufferListStream");
  NF(Ce, ta);
  Object.assign(Ce.prototype, ci.prototype);
  Ce.prototype._new = /* @__PURE__ */ n(function(t) {
    return new Ce(t);
  }, "_new");
  Ce.prototype._write = /* @__PURE__ */ n(function(t, r, i) {
    this._appendBuffer(t), typeof i == "function" && i();
  }, "_write");
  Ce.prototype._read = /* @__PURE__ */ n(function(t) {
    if (!this.length)
      return this.push(null);
    t = Math.min(t, this.length), this.push(this.slice(0, t)), this.consume(t);
  }, "_read");
  Ce.prototype.end = /* @__PURE__ */ n(function(t) {
    ta.prototype.end.call(this, t), this._callback && (this._callback(null, this.slice()), this._callback = null);
  }, "end");
  Ce.prototype._destroy = /* @__PURE__ */ n(function(t, r) {
    this._bufs.length = 0, this.length = 0, r(t);
  }, "_destroy");
  Ce.prototype._isBufferList = /* @__PURE__ */ n(function(t) {
    return t instanceof Ce || t instanceof ci || Ce.isBufferList(t);
  }, "_isBufferList");
  Ce.isBufferList = ci.isBufferList;
  Hn.exports = Ce;
  Hn.exports.BufferListStream = Ce;
  Hn.exports.BufferList = ci;
});

// ../node_modules/tar-stream/headers.js
var na = b((gr) => {
  var UF = Buffer.alloc, HF = "0000000000000000000", WF = "7777777777777777777", gD = 48, yD = Buffer.from("ustar\0", "binary"), $F = Buffer.
  from("00", "binary"), zF = Buffer.from("ustar ", "binary"), VF = Buffer.from(" \0", "binary"), GF = parseInt("7777", 8), di = 257, ia = 263,
  YF = /* @__PURE__ */ n(function(e, t, r) {
    return typeof e != "number" ? r : (e = ~~e, e >= t ? t : e >= 0 || (e += t, e >= 0) ? e : 0);
  }, "clamp"), JF = /* @__PURE__ */ n(function(e) {
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
  }, "toType"), KF = /* @__PURE__ */ n(function(e) {
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
  }, "toTypeflag"), bD = /* @__PURE__ */ n(function(e, t, r, i) {
    for (; r < i; r++)
      if (e[r] === t) return r;
    return i;
  }, "indexOf"), vD = /* @__PURE__ */ n(function(e) {
    for (var t = 256, r = 0; r < 148; r++) t += e[r];
    for (var i = 156; i < 512; i++) t += e[i];
    return t;
  }, "cksum"), Bt = /* @__PURE__ */ n(function(e, t) {
    return e = e.toString(8), e.length > t ? WF.slice(0, t) + " " : HF.slice(0, t - e.length) + e + " ";
  }, "encodeOct");
  function XF(e) {
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
  n(XF, "parse256");
  var kt = /* @__PURE__ */ n(function(e, t, r) {
    if (e = e.slice(t, t + r), t = 0, e[t] & 128)
      return XF(e);
    for (; t < e.length && e[t] === 32; ) t++;
    for (var i = YF(bD(e, 32, t, e.length), e.length, e.length); t < i && e[t] === 0; ) t++;
    return i === t ? 0 : parseInt(e.slice(t, i).toString(), 8);
  }, "decodeOct"), mr = /* @__PURE__ */ n(function(e, t, r, i) {
    return e.slice(t, bD(e, 0, t, t + r)).toString(i);
  }, "decodeStr"), ra = /* @__PURE__ */ n(function(e) {
    var t = Buffer.byteLength(e), r = Math.floor(Math.log(t) / Math.log(10)) + 1;
    return t + r >= Math.pow(10, r) && r++, t + r + e;
  }, "addLength");
  gr.decodeLongPath = function(e, t) {
    return mr(e, 0, e.length, t);
  };
  gr.encodePax = function(e) {
    var t = "";
    e.name && (t += ra(" path=" + e.name + `
`)), e.linkname && (t += ra(" linkpath=" + e.linkname + `
`));
    var r = e.pax;
    if (r)
      for (var i in r)
        t += ra(" " + i + "=" + r[i] + `
`);
    return Buffer.from(t);
  };
  gr.decodePax = function(e) {
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
  gr.encode = function(e) {
    var t = UF(512), r = e.name, i = "";
    if (e.typeflag === 5 && r[r.length - 1] !== "/" && (r += "/"), Buffer.byteLength(r) !== r.length) return null;
    for (; Buffer.byteLength(r) > 100; ) {
      var s = r.indexOf("/");
      if (s === -1) return null;
      i += i ? "/" + r.slice(0, s) : r.slice(0, s), r = r.slice(s + 1);
    }
    return Buffer.byteLength(r) > 100 || Buffer.byteLength(i) > 155 || e.linkname && Buffer.byteLength(e.linkname) > 100 ? null : (t.write(r),
    t.write(Bt(e.mode & GF, 6), 100), t.write(Bt(e.uid, 6), 108), t.write(Bt(e.gid, 6), 116), t.write(Bt(e.size, 11), 124), t.write(Bt(e.mtime.
    getTime() / 1e3 | 0, 11), 136), t[156] = gD + KF(e.type), e.linkname && t.write(e.linkname, 157), yD.copy(t, di), $F.copy(t, ia), e.uname &&
    t.write(e.uname, 265), e.gname && t.write(e.gname, 297), t.write(Bt(e.devmajor || 0, 6), 329), t.write(Bt(e.devminor || 0, 6), 337), i &&
    t.write(i, 345), t.write(Bt(vD(t), 6), 148), t);
  };
  gr.decode = function(e, t, r) {
    var i = e[156] === 0 ? 0 : e[156] - gD, s = mr(e, 0, 100, t), o = kt(e, 100, 8), u = kt(e, 108, 8), a = kt(e, 116, 8), l = kt(e, 124, 12),
    f = kt(e, 136, 12), p = JF(i), d = e[157] === 0 ? null : mr(e, 157, 100, t), c = mr(e, 265, 32), h = mr(e, 297, 32), g = kt(e, 329, 8), w = kt(
    e, 337, 8), y = vD(e);
    if (y === 8 * 32) return null;
    if (y !== kt(e, 148, 8)) throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
    if (yD.compare(e, di, di + 6) === 0)
      e[345] && (s = mr(e, 345, 155, t) + "/" + s);
    else if (!(zF.compare(e, di, di + 6) === 0 && VF.compare(e, ia, ia + 2) === 0)) {
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
var SD = b((Nk, xD) => {
  var _D = require("util"), QF = mD(), pi = na(), ED = Dr().Writable, CD = Dr().PassThrough, FD = /* @__PURE__ */ n(function() {
  }, "noop"), wD = /* @__PURE__ */ n(function(e) {
    return e &= 511, e && 512 - e;
  }, "overflow"), ZF = /* @__PURE__ */ n(function(e, t) {
    var r = new Wn(e, t);
    return r.end(), r;
  }, "emptyStream"), ex = /* @__PURE__ */ n(function(e, t) {
    return t.path && (e.name = t.path), t.linkpath && (e.linkname = t.linkpath), t.size && (e.size = parseInt(t.size, 10)), e.pax = t, e;
  }, "mixinPax"), Wn = /* @__PURE__ */ n(function(e, t) {
    this._parent = e, this.offset = t, CD.call(this, { autoDestroy: !1 });
  }, "Source");
  _D.inherits(Wn, CD);
  Wn.prototype.destroy = function(e) {
    this._parent.destroy(e);
  };
  var lt = /* @__PURE__ */ n(function(e) {
    if (!(this instanceof lt)) return new lt(e);
    ED.call(this, e), e = e || {}, this._offset = 0, this._buffer = QF(), this._missing = 0, this._partial = !1, this._onparse = FD, this._header =
    null, this._stream = null, this._overflow = null, this._cb = null, this._locked = !1, this._destroyed = !1, this._pax = null, this._paxGlobal =
    null, this._gnuLongPath = null, this._gnuLongLinkPath = null;
    var t = this, r = t._buffer, i = /* @__PURE__ */ n(function() {
      t._continue();
    }, "oncontinue"), s = /* @__PURE__ */ n(function(c) {
      if (t._locked = !1, c) return t.destroy(c);
      t._stream || i();
    }, "onunlock"), o = /* @__PURE__ */ n(function() {
      t._stream = null;
      var c = wD(t._header.size);
      c ? t._parse(c, u) : t._parse(512, d), t._locked || i();
    }, "onstreamend"), u = /* @__PURE__ */ n(function() {
      t._buffer.consume(wD(t._header.size)), t._parse(512, d), i();
    }, "ondrain"), a = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      t._paxGlobal = pi.decodePax(r.slice(0, c)), r.consume(c), o();
    }, "onpaxglobalheader"), l = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      t._pax = pi.decodePax(r.slice(0, c)), t._paxGlobal && (t._pax = Object.assign({}, t._paxGlobal, t._pax)), r.consume(c), o();
    }, "onpaxheader"), f = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      this._gnuLongPath = pi.decodeLongPath(r.slice(0, c), e.filenameEncoding), r.consume(c), o();
    }, "ongnulongpath"), p = /* @__PURE__ */ n(function() {
      var c = t._header.size;
      this._gnuLongLinkPath = pi.decodeLongPath(r.slice(0, c), e.filenameEncoding), r.consume(c), o();
    }, "ongnulonglinkpath"), d = /* @__PURE__ */ n(function() {
      var c = t._offset, h;
      try {
        h = t._header = pi.decode(r.slice(0, 512), e.filenameEncoding, e.allowUnknownFormat);
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
      null), t._pax && (t._header = h = ex(h, t._pax), t._pax = null), t._locked = !0, !h.size || h.type === "directory") {
        t._parse(512, d), t.emit("entry", h, ZF(t, c), s);
        return;
      }
      t._stream = new Wn(t, c), t.emit("entry", h, t._stream, s), t._parse(h.size, o), i();
    }, "onheader");
    this._onheader = d, this._parse(512, d);
  }, "Extract");
  _D.inherits(lt, ED);
  lt.prototype.destroy = function(e) {
    this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.emit("close"));
  };
  lt.prototype._parse = function(e, t) {
    this._destroyed || (this._offset += e, this._missing = e, t === this._onheader && (this._partial = !1), this._onparse = t);
  };
  lt.prototype._continue = function() {
    if (!this._destroyed) {
      var e = this._cb;
      this._cb = FD, this._overflow ? this._write(this._overflow, void 0, e) : e();
    }
  };
  lt.prototype._write = function(e, t, r) {
    if (!this._destroyed) {
      var i = this._stream, s = this._buffer, o = this._missing;
      if (e.length && (this._partial = !0), e.length < o)
        return this._missing -= e.length, this._overflow = null, i ? i.write(e, r) : (s.append(e), r());
      this._cb = r, this._missing = 0;
      var u = null;
      e.length > o && (u = e.slice(o), e = e.slice(0, o)), i ? i.end(e) : s.append(e), this._overflow = u, this._onparse();
    }
  };
  lt.prototype._final = function(e) {
    if (this._partial) return this.destroy(new Error("Unexpected end of data"));
    e();
  };
  xD.exports = lt;
});

// ../node_modules/fs-constants/index.js
var TD = b((Hk, AD) => {
  AD.exports = require("fs").constants || require("constants");
});

// ../node_modules/tar-stream/pack.js
var PD = b((Wk, OD) => {
  var yr = TD(), RD = fr(), zn = X(), tx = Buffer.alloc, BD = Dr().Readable, br = Dr().Writable, rx = require("string_decoder").StringDecoder,
  $n = na(), ix = parseInt("755", 8), nx = parseInt("644", 8), kD = tx(1024), oa = /* @__PURE__ */ n(function() {
  }, "noop"), sa = /* @__PURE__ */ n(function(e, t) {
    t &= 511, t && e.push(kD.slice(0, 512 - t));
  }, "overflow");
  function sx(e) {
    switch (e & yr.S_IFMT) {
      case yr.S_IFBLK:
        return "block-device";
      case yr.S_IFCHR:
        return "character-device";
      case yr.S_IFDIR:
        return "directory";
      case yr.S_IFIFO:
        return "fifo";
      case yr.S_IFLNK:
        return "symlink";
    }
    return "file";
  }
  n(sx, "modeToType");
  var Vn = /* @__PURE__ */ n(function(e) {
    br.call(this), this.written = 0, this._to = e, this._destroyed = !1;
  }, "Sink");
  zn(Vn, br);
  Vn.prototype._write = function(e, t, r) {
    if (this.written += e.length, this._to.push(e)) return r();
    this._to._drain = r;
  };
  Vn.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var Gn = /* @__PURE__ */ n(function() {
    br.call(this), this.linkname = "", this._decoder = new rx("utf-8"), this._destroyed = !1;
  }, "LinkSink");
  zn(Gn, br);
  Gn.prototype._write = function(e, t, r) {
    this.linkname += this._decoder.write(e), r();
  };
  Gn.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var Di = /* @__PURE__ */ n(function() {
    br.call(this), this._destroyed = !1;
  }, "Void");
  zn(Di, br);
  Di.prototype._write = function(e, t, r) {
    r(new Error("No body allowed for this entry"));
  };
  Di.prototype.destroy = function() {
    this._destroyed || (this._destroyed = !0, this.emit("close"));
  };
  var Ke = /* @__PURE__ */ n(function(e) {
    if (!(this instanceof Ke)) return new Ke(e);
    BD.call(this, e), this._drain = oa, this._finalized = !1, this._finalizing = !1, this._destroyed = !1, this._stream = null;
  }, "Pack");
  zn(Ke, BD);
  Ke.prototype.entry = function(e, t, r) {
    if (this._stream) throw new Error("already piping an entry");
    if (!(this._finalized || this._destroyed)) {
      typeof t == "function" && (r = t, t = null), r || (r = oa);
      var i = this;
      if ((!e.size || e.type === "symlink") && (e.size = 0), e.type || (e.type = sx(e.mode)), e.mode || (e.mode = e.type === "directory" ? ix :
      nx), e.uid || (e.uid = 0), e.gid || (e.gid = 0), e.mtime || (e.mtime = /* @__PURE__ */ new Date()), typeof t == "string" && (t = Buffer.
      from(t)), Buffer.isBuffer(t)) {
        e.size = t.length, this._encode(e);
        var s = this.push(t);
        return sa(i, e.size), s ? process.nextTick(r) : this._drain = r, new Di();
      }
      if (e.type === "symlink" && !e.linkname) {
        var o = new Gn();
        return RD(o, function(a) {
          if (a)
            return i.destroy(), r(a);
          e.linkname = o.linkname, i._encode(e), r();
        }), o;
      }
      if (this._encode(e), e.type !== "file" && e.type !== "contiguous-file")
        return process.nextTick(r), new Di();
      var u = new Vn(this);
      return this._stream = u, RD(u, function(a) {
        if (i._stream = null, a)
          return i.destroy(), r(a);
        if (u.written !== e.size)
          return i.destroy(), r(new Error("size mismatch"));
        sa(i, e.size), i._finalizing && i.finalize(), r();
      }), u;
    }
  };
  Ke.prototype.finalize = function() {
    if (this._stream) {
      this._finalizing = !0;
      return;
    }
    this._finalized || (this._finalized = !0, this.push(kD), this.push(null));
  };
  Ke.prototype.destroy = function(e) {
    this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.destroy && this._stream.
    destroy());
  };
  Ke.prototype._encode = function(e) {
    if (!e.pax) {
      var t = $n.encode(e);
      if (t) {
        this.push(t);
        return;
      }
    }
    this._encodePax(e);
  };
  Ke.prototype._encodePax = function(e) {
    var t = $n.encodePax({
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
    this.push($n.encode(r)), this.push(t), sa(this, t.length), r.size = e.size, r.type = e.type, this.push($n.encode(r));
  };
  Ke.prototype._read = function(e) {
    var t = this._drain;
    this._drain = oa, t();
  };
  OD.exports = Ke;
});

// ../node_modules/tar-stream/index.js
var qD = b((ua) => {
  ua.extract = SD();
  ua.pack = PD();
});

// ../node_modules/mkdirp-classic/index.js
var LD = b((Vk, ID) => {
  var Yn = require("path"), MD = require("fs"), jD = parseInt("0777", 8);
  ID.exports = vr.mkdirp = vr.mkdirP = vr;
  function vr(e, t, r, i) {
    typeof t == "function" ? (r = t, t = {}) : (!t || typeof t != "object") && (t = { mode: t });
    var s = t.mode, o = t.fs || MD;
    s === void 0 && (s = jD & ~process.umask()), i || (i = null);
    var u = r || function() {
    };
    e = Yn.resolve(e), o.mkdir(e, s, function(a) {
      if (!a)
        return i = i || e, u(null, i);
      switch (a.code) {
        case "ENOENT":
          vr(Yn.dirname(e), t, function(l, f) {
            l ? u(l, f) : vr(e, t, u, f);
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
  n(vr, "mkdirP");
  vr.sync = /* @__PURE__ */ n(function e(t, r, i) {
    (!r || typeof r != "object") && (r = { mode: r });
    var s = r.mode, o = r.fs || MD;
    s === void 0 && (s = jD & ~process.umask()), i || (i = null), t = Yn.resolve(t);
    try {
      o.mkdirSync(t, s), i = i || t;
    } catch (a) {
      switch (a.code) {
        case "ENOENT":
          i = e(Yn.dirname(t), r, i), e(t, r, i);
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
var GD = b((fa) => {
  var ox = pp(), UD = qD(), HD = xu(), ux = LD(), WD = require("fs"), Be = require("path"), ax = require("os"), mi = ax.platform() === "win3\
2", gi = /* @__PURE__ */ n(function() {
  }, "noop"), la = /* @__PURE__ */ n(function(e) {
    return e;
  }, "echo"), aa = mi ? function(e) {
    return e.replace(/\\/g, "/").replace(/[:?<>|]/g, "_");
  } : la, lx = /* @__PURE__ */ n(function(e, t, r, i, s, o) {
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
  }, "statAll"), $D = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r.name = r.name.split("/").slice(t).join("/");
      var i = r.linkname;
      return i && (r.type === "link" || Be.isAbsolute(i)) && (r.linkname = i.split("/").slice(t).join("/")), e(r);
    };
  }, "strip");
  fa.pack = function(e, t) {
    e || (e = "."), t || (t = {});
    var r = t.fs || WD, i = t.ignore || t.filter || gi, s = t.map || gi, o = t.mapStream || la, u = lx(r, t.dereference ? r.stat : r.lstat, e,
    i, t.entries, t.sort), a = t.strict !== !1, l = typeof t.umask == "number" ? ~t.umask : ~zD(), f = typeof t.dmode == "number" ? t.dmode :
    0, p = typeof t.fmode == "number" ? t.fmode : 0, d = t.pack || UD.pack(), c = t.finish || gi;
    t.strip && (s = $D(s, t.strip)), t.readable && (f |= parseInt(555, 8), p |= parseInt(444, 8)), t.writable && (f |= parseInt(333, 8), p |=
    parseInt(222, 8));
    var h = /* @__PURE__ */ n(function(y, _) {
      r.readlink(Be.join(e, y), function(E, v) {
        if (E) return d.destroy(E);
        _.linkname = aa(v), d.entry(_, w);
      });
    }, "onsymlink"), g = /* @__PURE__ */ n(function(y, _, E) {
      if (y) return d.destroy(y);
      if (!_)
        return t.finalize !== !1 && d.finalize(), c(d);
      if (E.isSocket()) return w();
      var v = {
        name: aa(_),
        mode: (E.mode | (E.isDirectory() ? f : p)) & l,
        mtime: E.mtime,
        size: E.size,
        type: "file",
        uid: E.uid,
        gid: E.gid
      };
      if (E.isDirectory())
        return v.size = 0, v.type = "directory", v = s(v) || v, d.entry(v, w);
      if (E.isSymbolicLink())
        return v.size = 0, v.type = "symlink", v = s(v) || v, h(_, v);
      if (v = s(v) || v, !E.isFile())
        return a ? d.destroy(new Error("unsupported type for " + _)) : w();
      var x = d.entry(v, w);
      if (x) {
        var F = o(r.createReadStream(Be.join(e, _), { start: 0, end: v.size > 0 ? v.size - 1 : v.size }), v);
        F.on("error", function(C) {
          x.destroy(C);
        }), HD(F, x);
      }
    }, "onstat"), w = /* @__PURE__ */ n(function(y) {
      if (y) return d.destroy(y);
      u(g);
    }, "onnextentry");
    return w(), d;
  };
  var fx = /* @__PURE__ */ n(function(e) {
    return e.length ? e[e.length - 1] : null;
  }, "head"), hx = /* @__PURE__ */ n(function() {
    return process.getuid ? process.getuid() : -1;
  }, "processGetuid"), zD = /* @__PURE__ */ n(function() {
    return process.umask ? process.umask() : 0;
  }, "processUmask");
  fa.extract = function(e, t) {
    e || (e = "."), t || (t = {});
    var r = t.fs || WD, i = t.ignore || t.filter || gi, s = t.map || gi, o = t.mapStream || la, u = t.chown !== !1 && !mi && hx() === 0, a = t.
    extract || UD.extract(), l = [], f = /* @__PURE__ */ new Date(), p = typeof t.umask == "number" ? ~t.umask : ~zD(), d = typeof t.dmode ==
    "number" ? t.dmode : 0, c = typeof t.fmode == "number" ? t.fmode : 0, h = t.strict !== !1;
    t.strip && (s = $D(s, t.strip)), t.readable && (d |= parseInt(555, 8), c |= parseInt(444, 8)), t.writable && (d |= parseInt(333, 8), c |=
    parseInt(222, 8));
    var g = /* @__PURE__ */ n(function(_, E) {
      for (var v; (v = fx(l)) && _.slice(0, v[0].length) !== v[0]; ) l.pop();
      if (!v) return E();
      r.utimes(v[0], f, v[1], E);
    }, "utimesParent"), w = /* @__PURE__ */ n(function(_, E, v) {
      if (t.utimes === !1) return v();
      if (E.type === "directory") return r.utimes(_, f, E.mtime, v);
      if (E.type === "symlink") return g(_, v);
      r.utimes(_, f, E.mtime, function(x) {
        if (x) return v(x);
        g(_, v);
      });
    }, "utimes"), y = /* @__PURE__ */ n(function(_, E, v) {
      var x = E.type === "symlink", F = x ? r.lchmod : r.chmod, C = x ? r.lchown : r.chown;
      if (!F) return v();
      var B = (E.mode | (E.type === "directory" ? d : c)) & p;
      C && u ? C.call(r, _, E.uid, E.gid, P) : P(null);
      function P(k) {
        if (k) return v(k);
        if (!F) return v();
        F.call(r, _, B, v);
      }
      n(P, "onchown");
    }, "chperm");
    return a.on("entry", function(_, E, v) {
      _ = s(_) || _, _.name = aa(_.name);
      var x = Be.join(e, Be.join("/", _.name));
      if (i(x, _))
        return E.resume(), v();
      var F = /* @__PURE__ */ n(function(M) {
        if (M) return v(M);
        w(x, _, function(U) {
          if (U) return v(U);
          if (mi) return v();
          y(x, _, v);
        });
      }, "stat"), C = /* @__PURE__ */ n(function() {
        if (mi) return v();
        r.unlink(x, function() {
          r.symlink(_.linkname, x, F);
        });
      }, "onsymlink"), B = /* @__PURE__ */ n(function() {
        if (mi) return v();
        r.unlink(x, function() {
          var M = Be.join(e, Be.join("/", _.linkname));
          r.link(M, x, function(U) {
            if (U && U.code === "EPERM" && t.hardlinkAsFilesFallback)
              return E = r.createReadStream(M), P();
            F(U);
          });
        });
      }, "onlink"), P = /* @__PURE__ */ n(function() {
        var M = r.createWriteStream(x), U = o(E, _);
        M.on("error", function(he) {
          U.destroy(he);
        }), HD(U, M, function(he) {
          if (he) return v(he);
          M.on("close", F);
        });
      }, "onfile");
      if (_.type === "directory")
        return l.push([x, _.mtime]), ND(x, {
          fs: r,
          own: u,
          uid: _.uid,
          gid: _.gid
        }, F);
      var k = Be.dirname(x);
      VD(r, k, Be.join(e, "."), function(M, U) {
        if (M) return v(M);
        if (!U) return v(new Error(k + " is not a valid path"));
        ND(k, {
          fs: r,
          own: u,
          uid: _.uid,
          gid: _.gid
        }, function(he) {
          if (he) return v(he);
          switch (_.type) {
            case "file":
              return P();
            case "link":
              return B();
            case "symlink":
              return C();
          }
          if (h) return v(new Error("unsupported type for " + x + " (" + _.type + ")"));
          E.resume(), v();
        });
      });
    }), t.finish && a.on("finish", t.finish), a;
  };
  function VD(e, t, r, i) {
    if (t === r) return i(null, !0);
    e.lstat(t, function(s, o) {
      if (s && s.code !== "ENOENT") return i(s);
      if (s || o.isDirectory()) return VD(e, Be.join(t, ".."), r, i);
      i(null, !1);
    });
  }
  n(VD, "validate");
  function ND(e, t, r) {
    ux(e, { fs: t.fs }, function(i, s) {
      !i && s && t.own ? ox(s, t.uid, t.gid, r) : r(i);
    });
  }
  n(ND, "mkdirfix");
});

// ../node_modules/process-nextick-args/index.js
var ke = b((Kk, ha) => {
  "use strict";
  typeof process > "u" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.
  indexOf("v1.8.") !== 0 ? ha.exports = { nextTick: cx } : ha.exports = process;
  function cx(e, t, r, i) {
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
  n(cx, "nextTick");
});

// ../node_modules/peek-stream/node_modules/isarray/index.js
var JD = b((Qk, YD) => {
  var dx = {}.toString;
  YD.exports = Array.isArray || function(e) {
    return dx.call(e) == "[object Array]";
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/stream.js
var ca = b((Zk, KD) => {
  KD.exports = require("stream");
});

// ../node_modules/peek-stream/node_modules/safe-buffer/index.js
var Kn = b((da, QD) => {
  var Jn = require("buffer"), ft = Jn.Buffer;
  function XD(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(XD, "copyProps");
  ft.from && ft.alloc && ft.allocUnsafe && ft.allocUnsafeSlow ? QD.exports = Jn : (XD(Jn, da), da.Buffer = wr);
  function wr(e, t, r) {
    return ft(e, t, r);
  }
  n(wr, "SafeBuffer");
  XD(ft, wr);
  wr.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return ft(e, t, r);
  };
  wr.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = ft(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  wr.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return ft(e);
  };
  wr.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return Jn.SlowBuffer(e);
  };
});

// ../node_modules/core-util-is/lib/util.js
var xe = b((Fe) => {
  function px(e) {
    return Array.isArray ? Array.isArray(e) : Xn(e) === "[object Array]";
  }
  n(px, "isArray");
  Fe.isArray = px;
  function Dx(e) {
    return typeof e == "boolean";
  }
  n(Dx, "isBoolean");
  Fe.isBoolean = Dx;
  function mx(e) {
    return e === null;
  }
  n(mx, "isNull");
  Fe.isNull = mx;
  function gx(e) {
    return e == null;
  }
  n(gx, "isNullOrUndefined");
  Fe.isNullOrUndefined = gx;
  function yx(e) {
    return typeof e == "number";
  }
  n(yx, "isNumber");
  Fe.isNumber = yx;
  function bx(e) {
    return typeof e == "string";
  }
  n(bx, "isString");
  Fe.isString = bx;
  function vx(e) {
    return typeof e == "symbol";
  }
  n(vx, "isSymbol");
  Fe.isSymbol = vx;
  function wx(e) {
    return e === void 0;
  }
  n(wx, "isUndefined");
  Fe.isUndefined = wx;
  function _x(e) {
    return Xn(e) === "[object RegExp]";
  }
  n(_x, "isRegExp");
  Fe.isRegExp = _x;
  function Ex(e) {
    return typeof e == "object" && e !== null;
  }
  n(Ex, "isObject");
  Fe.isObject = Ex;
  function Cx(e) {
    return Xn(e) === "[object Date]";
  }
  n(Cx, "isDate");
  Fe.isDate = Cx;
  function Fx(e) {
    return Xn(e) === "[object Error]" || e instanceof Error;
  }
  n(Fx, "isError");
  Fe.isError = Fx;
  function xx(e) {
    return typeof e == "function";
  }
  n(xx, "isFunction");
  Fe.isFunction = xx;
  function Sx(e) {
    return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" || typeof e == "symbol" || // ES6 symbol
    typeof e > "u";
  }
  n(Sx, "isPrimitive");
  Fe.isPrimitive = Sx;
  Fe.isBuffer = require("buffer").Buffer.isBuffer;
  function Xn(e) {
    return Object.prototype.toString.call(e);
  }
  n(Xn, "objectToString");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/BufferList.js
var em = b((iO, pa) => {
  "use strict";
  function Ax(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(Ax, "_classCallCheck");
  var ZD = Kn().Buffer, yi = require("util");
  function Tx(e, t, r) {
    e.copy(t, r);
  }
  n(Tx, "copyBuffer");
  pa.exports = function() {
    function e() {
      Ax(this, e), this.head = null, this.tail = null, this.length = 0;
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
      if (this.length === 0) return ZD.alloc(0);
      for (var i = ZD.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        Tx(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  yi && yi.inspect && yi.inspect.custom && (pa.exports.prototype[yi.inspect.custom] = function() {
    var e = yi.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/internal/streams/destroy.js
var Da = b((sO, tm) => {
  "use strict";
  var Qn = ke();
  function Rx(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, Qn.nextTick(
    Zn, this, e)) : Qn.nextTick(Zn, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, Qn.nextTick(Zn, r, o)) : Qn.nextTick(
      Zn, r, o) : t && t(o);
    }), this);
  }
  n(Rx, "destroy");
  function Bx() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(Bx, "undestroy");
  function Zn(e, t) {
    e.emit("error", t);
  }
  n(Zn, "emitErrorNT");
  tm.exports = {
    destroy: Rx,
    undestroy: Bx
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_writable.js
var ga = b((uO, lm) => {
  "use strict";
  var $t = ke();
  lm.exports = de;
  function im(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      Jx(t, e);
    };
  }
  n(im, "CorkedRequest");
  var kx = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : $t.nextTick, _r;
  de.WritableState = vi;
  var nm = Object.create(xe());
  nm.inherits = X();
  var Ox = {
    deprecate: ii()
  }, sm = ca(), ts = Kn().Buffer, Px = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function qx(e) {
    return ts.from(e);
  }
  n(qx, "_uint8ArrayToBuffer");
  function Mx(e) {
    return ts.isBuffer(e) || e instanceof Px;
  }
  n(Mx, "_isUint8Array");
  var om = Da();
  nm.inherits(de, sm);
  function jx() {
  }
  n(jx, "nop");
  function vi(e, t) {
    _r = _r || zt(), e = e || {};
    var r = t instanceof _r;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      $x(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new im(this);
  }
  n(vi, "WritableState");
  vi.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(vi.prototype, "buffer", {
        get: Ox.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var es;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (es = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(de, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return es.call(this, e) ? !0 : this !== de ? !1 : e && e._writableState instanceof vi;
    }, "value")
  })) : es = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function de(e) {
    if (_r = _r || zt(), !es.call(de, this) && !(this instanceof _r))
      return new de(e);
    this._writableState = new vi(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), sm.call(this);
  }
  n(de, "Writable");
  de.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function Ix(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), $t.nextTick(t, r);
  }
  n(Ix, "writeAfterEnd");
  function Lx(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), $t.nextTick(i, o), s = !1), s;
  }
  n(Lx, "validChunk");
  de.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && Mx(e);
    return o && !ts.isBuffer(e) && (e = qx(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = jx), i.ended ? Ix(this, r) : (o || Lx(this, i, e, r)) && (i.pendingcb++, s = Ux(this, i, o, e, t, r)), s;
  };
  de.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  de.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && um(this, e));
  };
  de.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function Nx(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = ts.from(t, r)), t;
  }
  n(Nx, "decodeChunk");
  Object.defineProperty(de.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function Ux(e, t, r, i, s, o) {
    if (!r) {
      var u = Nx(t, i, s);
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
      ma(e, t, !1, a, i, s, o);
    return l;
  }
  n(Ux, "writeOrBuffer");
  function ma(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(ma, "doWrite");
  function Hx(e, t, r, i, s) {
    --t.pendingcb, r ? ($t.nextTick(s, i), $t.nextTick(bi, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), bi(e, t));
  }
  n(Hx, "onwriteError");
  function Wx(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(Wx, "onwriteStateUpdate");
  function $x(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (Wx(r), t) Hx(e, r, i, t, s);
    else {
      var o = am(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && um(e, r), i ? kx(rm, e, r, o, s) : rm(e, r, o, s);
    }
  }
  n($x, "onwrite");
  function rm(e, t, r, i) {
    r || zx(e, t), t.pendingcb--, i(), bi(e, t);
  }
  n(rm, "afterWrite");
  function zx(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(zx, "onwriteDrain");
  function um(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, ma(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new im(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (ma(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(um, "clearBuffer");
  de.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  de.prototype._writev = null;
  de.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || Yx(this, i, r);
  };
  function am(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(am, "needFinish");
  function Vx(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), bi(e, t);
    });
  }
  n(Vx, "callFinal");
  function Gx(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, $t.nextTick(Vx, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(Gx, "prefinish");
  function bi(e, t) {
    var r = am(t);
    return r && (Gx(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(bi, "finishMaybe");
  function Yx(e, t, r) {
    t.ending = !0, bi(e, t), r && (t.finished ? $t.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(Yx, "endWritable");
  function Jx(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(Jx, "onCorkedFinish");
  Object.defineProperty(de.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  de.prototype.destroy = om.destroy;
  de.prototype._undestroy = om.undestroy;
  de.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_duplex.js
var zt = b((lO, dm) => {
  "use strict";
  var fm = ke(), Kx = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  dm.exports = ht;
  var hm = Object.create(xe());
  hm.inherits = X();
  var cm = va(), ba = ga();
  hm.inherits(ht, cm);
  for (ya = Kx(ba.prototype), rs = 0; rs < ya.length; rs++)
    is = ya[rs], ht.prototype[is] || (ht.prototype[is] = ba.prototype[is]);
  var ya, is, rs;
  function ht(e) {
    if (!(this instanceof ht)) return new ht(e);
    cm.call(this, e), ba.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", Xx);
  }
  n(ht, "Duplex");
  Object.defineProperty(ht.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function Xx() {
    this.allowHalfOpen || this._writableState.ended || fm.nextTick(Qx, this);
  }
  n(Xx, "onend");
  function Qx(e) {
    e.end();
  }
  n(Qx, "onEndNT");
  Object.defineProperty(ht.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  ht.prototype._destroy = function(e, t) {
    this.push(null), this.end(), fm.nextTick(t, e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_readable.js
var va = b((cO, Fm) => {
  "use strict";
  var Cr = ke();
  Fm.exports = ee;
  var Zx = JD(), wi;
  ee.ReadableState = vm;
  var hO = require("events").EventEmitter, gm = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), Fa = ca(), _i = Kn().Buffer, e2 = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function t2(e) {
    return _i.from(e);
  }
  n(t2, "_uint8ArrayToBuffer");
  function r2(e) {
    return _i.isBuffer(e) || e instanceof e2;
  }
  n(r2, "_isUint8Array");
  var ym = Object.create(xe());
  ym.inherits = X();
  var wa = require("util"), $ = void 0;
  wa && wa.debuglog ? $ = wa.debuglog("stream") : $ = /* @__PURE__ */ n(function() {
  }, "debug");
  var i2 = em(), bm = Da(), Er;
  ym.inherits(ee, Fa);
  var _a = ["error", "close", "destroy", "pause", "resume"];
  function n2(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : Zx(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(n2, "prependListener");
  function vm(e, t) {
    wi = wi || zt(), e = e || {};
    var r = t instanceof wi;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new i2(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (Er || (Er = require("string_decoder/").StringDecoder), this.decoder = new Er(
    e.encoding), this.encoding = e.encoding);
  }
  n(vm, "ReadableState");
  function ee(e) {
    if (wi = wi || zt(), !(this instanceof ee)) return new ee(e);
    this._readableState = new vm(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), Fa.call(this);
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
  ee.prototype.destroy = bm.destroy;
  ee.prototype._undestroy = bm.undestroy;
  ee.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  ee.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = _i.from(e, t), t = ""), i =
    !0), wm(this, e, t, !1, i);
  };
  ee.prototype.unshift = function(e) {
    return wm(this, e, null, !0, !1);
  };
  function wm(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, a2(e, o);
    else {
      var u;
      s || (u = s2(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== _i.prototype && (t = t2(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : Ea(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? Ea(e, o, t, !1) : _m(e, o)) : Ea(e, o, t, !1))) : i || (o.reading = !1);
    }
    return o2(o);
  }
  n(wm, "readableAddChunk");
  function Ea(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && ns(e)), _m(e, t);
  }
  n(Ea, "addChunk");
  function s2(e, t) {
    var r;
    return !r2(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(s2, "chunkInvalid");
  function o2(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(o2, "needMoreData");
  ee.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  ee.prototype.setEncoding = function(e) {
    return Er || (Er = require("string_decoder/").StringDecoder), this._readableState.decoder = new Er(e), this._readableState.encoding = e,
    this;
  };
  var pm = 8388608;
  function u2(e) {
    return e >= pm ? e = pm : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(u2, "computeNewHighWaterMark");
  function Dm(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = u2(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(Dm, "howMuchToRead");
  ee.prototype.read = function(e) {
    $("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return $("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? Ca(this) : ns(this), null;
    if (e = Dm(e, t), e === 0 && t.ended)
      return t.length === 0 && Ca(this), null;
    var i = t.needReadable;
    $("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, $("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, $("reading or ended", i)) : i && ($("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = Dm(r, t)));
    var s;
    return e > 0 ? s = Em(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && Ca(this)), s !== null && this.emit("data", s), s;
  };
  function a2(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, ns(e);
    }
  }
  n(a2, "onEofChunk");
  function ns(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || ($("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? Cr.nextTick(mm, e) : mm(e));
  }
  n(ns, "emitReadable");
  function mm(e) {
    $("emit readable"), e.emit("readable"), xa(e);
  }
  n(mm, "emitReadable_");
  function _m(e, t) {
    t.readingMore || (t.readingMore = !0, Cr.nextTick(l2, e, t));
  }
  n(_m, "maybeReadMore");
  function l2(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && ($("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(l2, "maybeReadMore_");
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
    i.pipesCount += 1, $("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? Cr.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, E) {
      $("onunpipe"), _ === r && E && E.hasUnpiped === !1 && (E.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      $("onend"), e.end();
    }
    n(a, "onend");
    var l = f2(r);
    e.on("drain", l);
    var f = !1;
    function p() {
      $("cleanup"), e.removeListener("close", g), e.removeListener("finish", w), e.removeListener("drain", l), e.removeListener("error", h),
      e.removeListener("unpipe", u), r.removeListener("end", a), r.removeListener("end", y), r.removeListener("data", c), f = !0, i.awaitDrain &&
      (!e._writableState || e._writableState.needDrain) && l();
    }
    n(p, "cleanup");
    var d = !1;
    r.on("data", c);
    function c(_) {
      $("ondata"), d = !1;
      var E = e.write(_);
      E === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && Cm(i.pipes, e) !== -1) && !f && ($("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      $("onerror", _), y(), e.removeListener("error", h), gm(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), n2(e, "error", h);
    function g() {
      e.removeListener("finish", w), y();
    }
    n(g, "onclose"), e.once("close", g);
    function w() {
      $("onfinish"), e.removeListener("close", g), y();
    }
    n(w, "onfinish"), e.once("finish", w);
    function y() {
      $("unpipe"), r.unpipe(e);
    }
    return n(y, "unpipe"), e.emit("pipe", r), i.flowing || ($("pipe resume"), r.resume()), e;
  };
  function f2(e) {
    return function() {
      var t = e._readableState;
      $("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && gm(e, "data") && (t.flowing = !0, xa(e));
    };
  }
  n(f2, "pipeOnDrain");
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
    var u = Cm(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  ee.prototype.on = function(e, t) {
    var r = Fa.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && ns(
      this) : Cr.nextTick(h2, this));
    }
    return r;
  };
  ee.prototype.addListener = ee.prototype.on;
  function h2(e) {
    $("readable nexttick read 0"), e.read(0);
  }
  n(h2, "nReadingNextTick");
  ee.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || ($("resume"), e.flowing = !0, c2(this, e)), this;
  };
  function c2(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, Cr.nextTick(d2, e, t));
  }
  n(c2, "resume");
  function d2(e, t) {
    t.reading || ($("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), xa(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(d2, "resume_");
  ee.prototype.pause = function() {
    return $("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && ($("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function xa(e) {
    var t = e._readableState;
    for ($("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n(xa, "flow");
  ee.prototype.wrap = function(e) {
    var t = this, r = this._readableState, i = !1;
    e.on("end", function() {
      if ($("wrapped end"), r.decoder && !r.ended) {
        var u = r.decoder.end();
        u && u.length && t.push(u);
      }
      t.push(null);
    }), e.on("data", function(u) {
      if ($("wrapped data"), r.decoder && (u = r.decoder.write(u)), !(r.objectMode && u == null) && !(!r.objectMode && (!u || !u.length))) {
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
    for (var o = 0; o < _a.length; o++)
      e.on(_a[o], this.emit.bind(this, _a[o]));
    return this._read = function(u) {
      $("wrapped _read", u), i && (i = !1, e.resume());
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
  ee._fromList = Em;
  function Em(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = p2(e, t.buffer, t.decoder), r;
  }
  n(Em, "fromList");
  function p2(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? D2(e, t) : m2(e, t), i;
  }
  n(p2, "fromListPartial");
  function D2(e, t) {
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
  n(D2, "copyFromBufferString");
  function m2(e, t) {
    var r = _i.allocUnsafe(e), i = t.head, s = 1;
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
  n(m2, "copyFromBuffer");
  function Ca(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, Cr.nextTick(g2, t, e));
  }
  n(Ca, "endReadable");
  function g2(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(g2, "endReadableNT");
  function Cm(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(Cm, "indexOf");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_transform.js
var Sa = b((pO, Am) => {
  "use strict";
  Am.exports = ct;
  var ss = zt(), Sm = Object.create(xe());
  Sm.inherits = X();
  Sm.inherits(ct, ss);
  function y2(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(y2, "afterTransform");
  function ct(e) {
    if (!(this instanceof ct)) return new ct(e);
    ss.call(this, e), this._transformState = {
      afterTransform: y2.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", b2);
  }
  n(ct, "Transform");
  function b2() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      xm(e, t, r);
    }) : xm(this, null, null);
  }
  n(b2, "prefinish");
  ct.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, ss.prototype.push.call(this, e, t);
  };
  ct.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  ct.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  ct.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  ct.prototype._destroy = function(e, t) {
    var r = this;
    ss.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function xm(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(xm, "done");
});

// ../node_modules/peek-stream/node_modules/readable-stream/lib/_stream_passthrough.js
var km = b((mO, Bm) => {
  "use strict";
  Bm.exports = Ei;
  var Tm = Sa(), Rm = Object.create(xe());
  Rm.inherits = X();
  Rm.inherits(Ei, Tm);
  function Ei(e) {
    if (!(this instanceof Ei)) return new Ei(e);
    Tm.call(this, e);
  }
  n(Ei, "PassThrough");
  Ei.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/peek-stream/node_modules/readable-stream/readable.js
var Om = b((be, os) => {
  var Xe = require("stream");
  process.env.READABLE_STREAM === "disable" && Xe ? (os.exports = Xe, be = os.exports = Xe.Readable, be.Readable = Xe.Readable, be.Writable =
  Xe.Writable, be.Duplex = Xe.Duplex, be.Transform = Xe.Transform, be.PassThrough = Xe.PassThrough, be.Stream = Xe) : (be = os.exports = va(),
  be.Stream = Xe || be, be.Readable = be, be.Writable = ga(), be.Duplex = zt(), be.Transform = Sa(), be.PassThrough = km());
});

// ../node_modules/stream-shift/index.js
var Aa = b((yO, Pm) => {
  Pm.exports = v2;
  function v2(e) {
    var t = e._readableState;
    return t ? t.objectMode || typeof e._duplexState == "number" ? e.read() : e.read(w2(t)) : null;
  }
  n(v2, "shift");
  function w2(e) {
    return e.buffer.length ? e.buffer.head ? e.buffer.head.data.length : e.buffer[0].length : e.length;
  }
  n(w2, "getStateLength");
});

// ../node_modules/peek-stream/node_modules/duplexify/index.js
var Lm = b((vO, Im) => {
  var us = Om(), qm = fr(), _2 = X(), E2 = Aa(), Mm = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([0]) : new Buffer([0]), Ta = /* @__PURE__ */ n(
  function(e, t) {
    e._corked ? e.once("uncork", t) : t();
  }, "onuncork"), C2 = /* @__PURE__ */ n(function(e, t) {
    e._autoDestroy && e.destroy(t);
  }, "autoDestroy"), jm = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r ? C2(e, r.message === "premature close" ? null : r) : t && !e._ended && e.end();
    };
  }, "destroyer"), F2 = /* @__PURE__ */ n(function(e, t) {
    if (!e || e._writableState && e._writableState.finished) return t();
    if (e._writableState) return e.end(t);
    e.end(), t();
  }, "end"), x2 = /* @__PURE__ */ n(function(e) {
    return new us.Readable({ objectMode: !0, highWaterMark: 16 }).wrap(e);
  }, "toStreams2"), ve = /* @__PURE__ */ n(function(e, t, r) {
    if (!(this instanceof ve)) return new ve(e, t, r);
    us.Duplex.call(this, r), this._writable = null, this._readable = null, this._readable2 = null, this._autoDestroy = !r || r.autoDestroy !==
    !1, this._forwardDestroy = !r || r.destroy !== !1, this._forwardEnd = !r || r.end !== !1, this._corked = 1, this._ondrain = null, this._drained =
    !1, this._forwarding = !1, this._unwrite = null, this._unread = null, this._ended = !1, this.destroyed = !1, e && this.setWritable(e), t &&
    this.setReadable(t);
  }, "Duplexify");
  _2(ve, us.Duplex);
  ve.obj = function(e, t, r) {
    return r || (r = {}), r.objectMode = !0, r.highWaterMark = 16, new ve(e, t, r);
  };
  ve.prototype.cork = function() {
    ++this._corked === 1 && this.emit("cork");
  };
  ve.prototype.uncork = function() {
    this._corked && --this._corked === 0 && this.emit("uncork");
  };
  ve.prototype.setWritable = function(e) {
    if (this._unwrite && this._unwrite(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.end();
      return;
    }
    var t = this, r = qm(e, { writable: !0, readable: !1 }, jm(this, this._forwardEnd)), i = /* @__PURE__ */ n(function() {
      var o = t._ondrain;
      t._ondrain = null, o && o();
    }, "ondrain"), s = /* @__PURE__ */ n(function() {
      t._writable.removeListener("drain", i), r();
    }, "clear");
    this._unwrite && process.nextTick(i), this._writable = e, this._writable.on("drain", i), this._unwrite = s, this.uncork();
  };
  ve.prototype.setReadable = function(e) {
    if (this._unread && this._unread(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.push(null), this.resume();
      return;
    }
    var t = this, r = qm(e, { writable: !1, readable: !0 }, jm(this)), i = /* @__PURE__ */ n(function() {
      t._forward();
    }, "onreadable"), s = /* @__PURE__ */ n(function() {
      t.push(null);
    }, "onend"), o = /* @__PURE__ */ n(function() {
      t._readable2.removeListener("readable", i), t._readable2.removeListener("end", s), r();
    }, "clear");
    this._drained = !0, this._readable = e, this._readable2 = e._readableState ? e : x2(e), this._readable2.on("readable", i), this._readable2.
    on("end", s), this._unread = o, this._forward();
  };
  ve.prototype._read = function() {
    this._drained = !0, this._forward();
  };
  ve.prototype._forward = function() {
    if (!(this._forwarding || !this._readable2 || !this._drained)) {
      this._forwarding = !0;
      for (var e; this._drained && (e = E2(this._readable2)) !== null; )
        this.destroyed || (this._drained = this.push(e));
      this._forwarding = !1;
    }
  };
  ve.prototype.destroy = function(e) {
    if (!this.destroyed) {
      this.destroyed = !0;
      var t = this;
      process.nextTick(function() {
        t._destroy(e);
      });
    }
  };
  ve.prototype._destroy = function(e) {
    if (e) {
      var t = this._ondrain;
      this._ondrain = null, t ? t(e) : this.emit("error", e);
    }
    this._forwardDestroy && (this._readable && this._readable.destroy && this._readable.destroy(), this._writable && this._writable.destroy &&
    this._writable.destroy()), this.emit("close");
  };
  ve.prototype._write = function(e, t, r) {
    if (this.destroyed) return r();
    if (this._corked) return Ta(this, this._write.bind(this, e, t, r));
    if (e === Mm) return this._finish(r);
    if (!this._writable) return r();
    this._writable.write(e) === !1 ? this._ondrain = r : r();
  };
  ve.prototype._finish = function(e) {
    var t = this;
    this.emit("preend"), Ta(this, function() {
      F2(t._forwardEnd && t._writable, function() {
        t._writableState.prefinished === !1 && (t._writableState.prefinished = !0), t.emit("prefinish"), Ta(t, e);
      });
    });
  };
  ve.prototype.end = function(e, t, r) {
    return typeof e == "function" ? this.end(null, null, e) : typeof t == "function" ? this.end(e, null, t) : (this._ended = !0, e && this.write(
    e), this._writableState.ending || this.write(Mm), us.Writable.prototype.end.call(this, r));
  };
  Im.exports = ve;
});

// ../node_modules/through2/node_modules/isarray/index.js
var Um = b((_O, Nm) => {
  var S2 = {}.toString;
  Nm.exports = Array.isArray || function(e) {
    return S2.call(e) == "[object Array]";
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/stream.js
var Ra = b((EO, Hm) => {
  Hm.exports = require("stream");
});

// ../node_modules/through2/node_modules/safe-buffer/index.js
var ls = b((Ba, $m) => {
  var as = require("buffer"), dt = as.Buffer;
  function Wm(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(Wm, "copyProps");
  dt.from && dt.alloc && dt.allocUnsafe && dt.allocUnsafeSlow ? $m.exports = as : (Wm(as, Ba), Ba.Buffer = Fr);
  function Fr(e, t, r) {
    return dt(e, t, r);
  }
  n(Fr, "SafeBuffer");
  Wm(dt, Fr);
  Fr.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return dt(e, t, r);
  };
  Fr.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = dt(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  Fr.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return dt(e);
  };
  Fr.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return as.SlowBuffer(e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/BufferList.js
var Vm = b((FO, ka) => {
  "use strict";
  function A2(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(A2, "_classCallCheck");
  var zm = ls().Buffer, Ci = require("util");
  function T2(e, t, r) {
    e.copy(t, r);
  }
  n(T2, "copyBuffer");
  ka.exports = function() {
    function e() {
      A2(this, e), this.head = null, this.tail = null, this.length = 0;
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
      if (this.length === 0) return zm.alloc(0);
      for (var i = zm.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        T2(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  Ci && Ci.inspect && Ci.inspect.custom && (ka.exports.prototype[Ci.inspect.custom] = function() {
    var e = Ci.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/through2/node_modules/readable-stream/lib/internal/streams/destroy.js
var Oa = b((SO, Gm) => {
  "use strict";
  var fs = ke();
  function R2(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, fs.nextTick(
    hs, this, e)) : fs.nextTick(hs, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, fs.nextTick(hs, r, o)) : fs.nextTick(
      hs, r, o) : t && t(o);
    }), this);
  }
  n(R2, "destroy");
  function B2() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n(B2, "undestroy");
  function hs(e, t) {
    e.emit("error", t);
  }
  n(hs, "emitErrorNT");
  Gm.exports = {
    destroy: R2,
    undestroy: B2
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_writable.js
var qa = b((TO, tg) => {
  "use strict";
  var Vt = ke();
  tg.exports = pe;
  function Jm(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      J2(t, e);
    };
  }
  n(Jm, "CorkedRequest");
  var k2 = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : Vt.nextTick, xr;
  pe.WritableState = xi;
  var Km = Object.create(xe());
  Km.inherits = X();
  var O2 = {
    deprecate: ii()
  }, Xm = Ra(), ds = ls().Buffer, P2 = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function q2(e) {
    return ds.from(e);
  }
  n(q2, "_uint8ArrayToBuffer");
  function M2(e) {
    return ds.isBuffer(e) || e instanceof P2;
  }
  n(M2, "_isUint8Array");
  var Qm = Oa();
  Km.inherits(pe, Xm);
  function j2() {
  }
  n(j2, "nop");
  function xi(e, t) {
    xr = xr || Gt(), e = e || {};
    var r = t instanceof xr;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      $2(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new Jm(this);
  }
  n(xi, "WritableState");
  xi.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(xi.prototype, "buffer", {
        get: O2.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var cs;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (cs = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(pe, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return cs.call(this, e) ? !0 : this !== pe ? !1 : e && e._writableState instanceof xi;
    }, "value")
  })) : cs = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function pe(e) {
    if (xr = xr || Gt(), !cs.call(pe, this) && !(this instanceof xr))
      return new pe(e);
    this._writableState = new xi(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), Xm.call(this);
  }
  n(pe, "Writable");
  pe.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function I2(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), Vt.nextTick(t, r);
  }
  n(I2, "writeAfterEnd");
  function L2(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), Vt.nextTick(i, o), s = !1), s;
  }
  n(L2, "validChunk");
  pe.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && M2(e);
    return o && !ds.isBuffer(e) && (e = q2(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = j2), i.ended ? I2(this, r) : (o || L2(this, i, e, r)) && (i.pendingcb++, s = U2(this, i, o, e, t, r)), s;
  };
  pe.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  pe.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && Zm(this, e));
  };
  pe.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function N2(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = ds.from(t, r)), t;
  }
  n(N2, "decodeChunk");
  Object.defineProperty(pe.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function U2(e, t, r, i, s, o) {
    if (!r) {
      var u = N2(t, i, s);
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
      Pa(e, t, !1, a, i, s, o);
    return l;
  }
  n(U2, "writeOrBuffer");
  function Pa(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(Pa, "doWrite");
  function H2(e, t, r, i, s) {
    --t.pendingcb, r ? (Vt.nextTick(s, i), Vt.nextTick(Fi, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), Fi(e, t));
  }
  n(H2, "onwriteError");
  function W2(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(W2, "onwriteStateUpdate");
  function $2(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (W2(r), t) H2(e, r, i, t, s);
    else {
      var o = eg(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && Zm(e, r), i ? k2(Ym, e, r, o, s) : Ym(e, r, o, s);
    }
  }
  n($2, "onwrite");
  function Ym(e, t, r, i) {
    r || z2(e, t), t.pendingcb--, i(), Fi(e, t);
  }
  n(Ym, "afterWrite");
  function z2(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(z2, "onwriteDrain");
  function Zm(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, Pa(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new Jm(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (Pa(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(Zm, "clearBuffer");
  pe.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  pe.prototype._writev = null;
  pe.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || Y2(this, i, r);
  };
  function eg(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(eg, "needFinish");
  function V2(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), Fi(e, t);
    });
  }
  n(V2, "callFinal");
  function G2(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, Vt.nextTick(V2, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(G2, "prefinish");
  function Fi(e, t) {
    var r = eg(t);
    return r && (G2(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(Fi, "finishMaybe");
  function Y2(e, t, r) {
    t.ending = !0, Fi(e, t), r && (t.finished ? Vt.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(Y2, "endWritable");
  function J2(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(J2, "onCorkedFinish");
  Object.defineProperty(pe.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  pe.prototype.destroy = Qm.destroy;
  pe.prototype._undestroy = Qm.undestroy;
  pe.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_duplex.js
var Gt = b((BO, sg) => {
  "use strict";
  var rg = ke(), K2 = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  sg.exports = pt;
  var ig = Object.create(xe());
  ig.inherits = X();
  var ng = Ia(), ja = qa();
  ig.inherits(pt, ng);
  for (Ma = K2(ja.prototype), ps = 0; ps < Ma.length; ps++)
    Ds = Ma[ps], pt.prototype[Ds] || (pt.prototype[Ds] = ja.prototype[Ds]);
  var Ma, Ds, ps;
  function pt(e) {
    if (!(this instanceof pt)) return new pt(e);
    ng.call(this, e), ja.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", X2);
  }
  n(pt, "Duplex");
  Object.defineProperty(pt.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function X2() {
    this.allowHalfOpen || this._writableState.ended || rg.nextTick(Q2, this);
  }
  n(X2, "onend");
  function Q2(e) {
    e.end();
  }
  n(Q2, "onEndNT");
  Object.defineProperty(pt.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  pt.prototype._destroy = function(e, t) {
    this.push(null), this.end(), rg.nextTick(t, e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_readable.js
var Ia = b((PO, gg) => {
  "use strict";
  var Ar = ke();
  gg.exports = te;
  var Z2 = Um(), Si;
  te.ReadableState = cg;
  var OO = require("events").EventEmitter, lg = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), Wa = Ra(), Ai = ls().Buffer, eS = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function tS(e) {
    return Ai.from(e);
  }
  n(tS, "_uint8ArrayToBuffer");
  function rS(e) {
    return Ai.isBuffer(e) || e instanceof eS;
  }
  n(rS, "_isUint8Array");
  var fg = Object.create(xe());
  fg.inherits = X();
  var La = require("util"), z = void 0;
  La && La.debuglog ? z = La.debuglog("stream") : z = /* @__PURE__ */ n(function() {
  }, "debug");
  var iS = Vm(), hg = Oa(), Sr;
  fg.inherits(te, Wa);
  var Na = ["error", "close", "destroy", "pause", "resume"];
  function nS(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : Z2(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(nS, "prependListener");
  function cg(e, t) {
    Si = Si || Gt(), e = e || {};
    var r = t instanceof Si;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new iS(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (Sr || (Sr = require("string_decoder/").StringDecoder), this.decoder = new Sr(
    e.encoding), this.encoding = e.encoding);
  }
  n(cg, "ReadableState");
  function te(e) {
    if (Si = Si || Gt(), !(this instanceof te)) return new te(e);
    this._readableState = new cg(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), Wa.call(this);
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
  te.prototype.destroy = hg.destroy;
  te.prototype._undestroy = hg.undestroy;
  te.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  te.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = Ai.from(e, t), t = ""), i =
    !0), dg(this, e, t, !1, i);
  };
  te.prototype.unshift = function(e) {
    return dg(this, e, null, !0, !1);
  };
  function dg(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, aS(e, o);
    else {
      var u;
      s || (u = sS(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== Ai.prototype && (t = tS(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : Ua(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? Ua(e, o, t, !1) : pg(e, o)) : Ua(e, o, t, !1))) : i || (o.reading = !1);
    }
    return oS(o);
  }
  n(dg, "readableAddChunk");
  function Ua(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && ms(e)), pg(e, t);
  }
  n(Ua, "addChunk");
  function sS(e, t) {
    var r;
    return !rS(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(sS, "chunkInvalid");
  function oS(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(oS, "needMoreData");
  te.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  te.prototype.setEncoding = function(e) {
    return Sr || (Sr = require("string_decoder/").StringDecoder), this._readableState.decoder = new Sr(e), this._readableState.encoding = e,
    this;
  };
  var og = 8388608;
  function uS(e) {
    return e >= og ? e = og : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(uS, "computeNewHighWaterMark");
  function ug(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = uS(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(ug, "howMuchToRead");
  te.prototype.read = function(e) {
    z("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return z("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? Ha(this) : ms(this), null;
    if (e = ug(e, t), e === 0 && t.ended)
      return t.length === 0 && Ha(this), null;
    var i = t.needReadable;
    z("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, z("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, z("reading or ended", i)) : i && (z("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = ug(r, t)));
    var s;
    return e > 0 ? s = Dg(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && Ha(this)), s !== null && this.emit("data", s), s;
  };
  function aS(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, ms(e);
    }
  }
  n(aS, "onEofChunk");
  function ms(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || (z("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? Ar.nextTick(ag, e) : ag(e));
  }
  n(ms, "emitReadable");
  function ag(e) {
    z("emit readable"), e.emit("readable"), $a(e);
  }
  n(ag, "emitReadable_");
  function pg(e, t) {
    t.readingMore || (t.readingMore = !0, Ar.nextTick(lS, e, t));
  }
  n(pg, "maybeReadMore");
  function lS(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (z("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(lS, "maybeReadMore_");
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
    i.pipesCount += 1, z("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? Ar.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, E) {
      z("onunpipe"), _ === r && E && E.hasUnpiped === !1 && (E.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      z("onend"), e.end();
    }
    n(a, "onend");
    var l = fS(r);
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
      var E = e.write(_);
      E === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && mg(i.pipes, e) !== -1) && !f && (z("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      z("onerror", _), y(), e.removeListener("error", h), lg(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), nS(e, "error", h);
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
  function fS(e) {
    return function() {
      var t = e._readableState;
      z("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && lg(e, "data") && (t.flowing = !0, $a(e));
    };
  }
  n(fS, "pipeOnDrain");
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
    var u = mg(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  te.prototype.on = function(e, t) {
    var r = Wa.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && ms(
      this) : Ar.nextTick(hS, this));
    }
    return r;
  };
  te.prototype.addListener = te.prototype.on;
  function hS(e) {
    z("readable nexttick read 0"), e.read(0);
  }
  n(hS, "nReadingNextTick");
  te.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (z("resume"), e.flowing = !0, cS(this, e)), this;
  };
  function cS(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, Ar.nextTick(dS, e, t));
  }
  n(cS, "resume");
  function dS(e, t) {
    t.reading || (z("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), $a(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(dS, "resume_");
  te.prototype.pause = function() {
    return z("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (z("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function $a(e) {
    var t = e._readableState;
    for (z("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n($a, "flow");
  te.prototype.wrap = function(e) {
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
    for (var o = 0; o < Na.length; o++)
      e.on(Na[o], this.emit.bind(this, Na[o]));
    return this._read = function(u) {
      z("wrapped _read", u), i && (i = !1, e.resume());
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
  te._fromList = Dg;
  function Dg(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = pS(e, t.buffer, t.decoder), r;
  }
  n(Dg, "fromList");
  function pS(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? DS(e, t) : mS(e, t), i;
  }
  n(pS, "fromListPartial");
  function DS(e, t) {
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
  n(DS, "copyFromBufferString");
  function mS(e, t) {
    var r = Ai.allocUnsafe(e), i = t.head, s = 1;
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
  n(mS, "copyFromBuffer");
  function Ha(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, Ar.nextTick(gS, t, e));
  }
  n(Ha, "endReadable");
  function gS(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(gS, "endReadableNT");
  function mg(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(mg, "indexOf");
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_transform.js
var za = b((MO, vg) => {
  "use strict";
  vg.exports = Dt;
  var gs = Gt(), bg = Object.create(xe());
  bg.inherits = X();
  bg.inherits(Dt, gs);
  function yS(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(yS, "afterTransform");
  function Dt(e) {
    if (!(this instanceof Dt)) return new Dt(e);
    gs.call(this, e), this._transformState = {
      afterTransform: yS.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", bS);
  }
  n(Dt, "Transform");
  function bS() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      yg(e, t, r);
    }) : yg(this, null, null);
  }
  n(bS, "prefinish");
  Dt.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, gs.prototype.push.call(this, e, t);
  };
  Dt.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  Dt.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  Dt.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  Dt.prototype._destroy = function(e, t) {
    var r = this;
    gs.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function yg(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(yg, "done");
});

// ../node_modules/through2/node_modules/readable-stream/lib/_stream_passthrough.js
var Cg = b((IO, Eg) => {
  "use strict";
  Eg.exports = Ti;
  var wg = za(), _g = Object.create(xe());
  _g.inherits = X();
  _g.inherits(Ti, wg);
  function Ti(e) {
    if (!(this instanceof Ti)) return new Ti(e);
    wg.call(this, e);
  }
  n(Ti, "PassThrough");
  Ti.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/through2/node_modules/readable-stream/readable.js
var Fg = b((we, ys) => {
  var Qe = require("stream");
  process.env.READABLE_STREAM === "disable" && Qe ? (ys.exports = Qe, we = ys.exports = Qe.Readable, we.Readable = Qe.Readable, we.Writable =
  Qe.Writable, we.Duplex = Qe.Duplex, we.Transform = Qe.Transform, we.PassThrough = Qe.PassThrough, we.Stream = Qe) : (we = ys.exports = Ia(),
  we.Stream = Qe || we, we.Readable = we, we.Writable = qa(), we.Duplex = Gt(), we.Transform = za(), we.PassThrough = Cg());
});

// ../node_modules/xtend/immutable.js
var Sg = b((NO, xg) => {
  xg.exports = wS;
  var vS = Object.prototype.hasOwnProperty;
  function wS() {
    for (var e = {}, t = 0; t < arguments.length; t++) {
      var r = arguments[t];
      for (var i in r)
        vS.call(r, i) && (e[i] = r[i]);
    }
    return e;
  }
  n(wS, "extend");
});

// ../node_modules/through2/through2.js
var Ga = b((HO, bs) => {
  var Ag = Fg().Transform, Tg = require("util").inherits, Rg = Sg();
  function Tr(e) {
    Ag.call(this, e), this._destroyed = !1;
  }
  n(Tr, "DestroyableTransform");
  Tg(Tr, Ag);
  Tr.prototype.destroy = function(e) {
    if (!this._destroyed) {
      this._destroyed = !0;
      var t = this;
      process.nextTick(function() {
        e && t.emit("error", e), t.emit("close");
      });
    }
  };
  function _S(e, t, r) {
    r(null, e);
  }
  n(_S, "noop");
  function Va(e) {
    return function(t, r, i) {
      return typeof t == "function" && (i = r, r = t, t = {}), typeof r != "function" && (r = _S), typeof i != "function" && (i = null), e(t,
      r, i);
    };
  }
  n(Va, "through2");
  bs.exports = Va(function(e, t, r) {
    var i = new Tr(e);
    return i._transform = t, r && (i._flush = r), i;
  });
  bs.exports.ctor = Va(function(e, t, r) {
    function i(s) {
      if (!(this instanceof i))
        return new i(s);
      this.options = Rg(e, s), Tr.call(this, this.options);
    }
    return n(i, "Through2"), Tg(i, Tr), i.prototype._transform = t, r && (i.prototype._flush = r), i;
  });
  bs.exports.obj = Va(function(e, t, r) {
    var i = new Tr(Rg({ objectMode: !0, highWaterMark: 16 }, e));
    return i._transform = t, r && (i._flush = r), i;
  });
});

// ../node_modules/buffer-from/index.js
var kg = b(($O, Bg) => {
  var ES = Object.prototype.toString, Ya = typeof Buffer < "u" && typeof Buffer.alloc == "function" && typeof Buffer.allocUnsafe == "functio\
n" && typeof Buffer.from == "function";
  function CS(e) {
    return ES.call(e).slice(8, -1) === "ArrayBuffer";
  }
  n(CS, "isArrayBuffer");
  function FS(e, t, r) {
    t >>>= 0;
    var i = e.byteLength - t;
    if (i < 0)
      throw new RangeError("'offset' is out of bounds");
    if (r === void 0)
      r = i;
    else if (r >>>= 0, r > i)
      throw new RangeError("'length' is out of bounds");
    return Ya ? Buffer.from(e.slice(t, t + r)) : new Buffer(new Uint8Array(e.slice(t, t + r)));
  }
  n(FS, "fromArrayBuffer");
  function xS(e, t) {
    if ((typeof t != "string" || t === "") && (t = "utf8"), !Buffer.isEncoding(t))
      throw new TypeError('"encoding" must be a valid string encoding');
    return Ya ? Buffer.from(e, t) : new Buffer(e, t);
  }
  n(xS, "fromString");
  function SS(e, t, r) {
    if (typeof e == "number")
      throw new TypeError('"value" argument must not be a number');
    return CS(e) ? FS(e, t, r) : typeof e == "string" ? xS(e, t) : Ya ? Buffer.from(e) : new Buffer(e);
  }
  n(SS, "bufferFrom");
  Bg.exports = SS;
});

// ../node_modules/peek-stream/index.js
var qg = b((VO, Pg) => {
  var AS = Lm(), TS = Ga(), RS = kg(), BS = /* @__PURE__ */ n(function(e) {
    return !Buffer.isBuffer(e) && typeof e != "string";
  }, "isObject"), Og = /* @__PURE__ */ n(function(e, t) {
    if (typeof e == "number" && (e = { maxBuffer: e }), typeof e == "function") return Og(null, e);
    e || (e = {});
    var r = typeof e.maxBuffer == "number" ? e.maxBuffer : 65535, i = e.strict, s = e.newline !== !1, o = [], u = 0, a = AS.obj(), l = TS.obj(
    { highWaterMark: 1 }, function(d, c, h) {
      if (BS(d)) return p(d, null, h);
      if (Buffer.isBuffer(d) || (d = RS(d)), s) {
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
  Pg.exports = Og;
});

// ../node_modules/pumpify/node_modules/pump/index.js
var Ig = b((YO, jg) => {
  var kS = Fn(), OS = fr(), Ja = require("fs"), Ri = /* @__PURE__ */ n(function() {
  }, "noop"), PS = /^v?\.0/.test(process.version), vs = /* @__PURE__ */ n(function(e) {
    return typeof e == "function";
  }, "isFn"), qS = /* @__PURE__ */ n(function(e) {
    return !PS || !Ja ? !1 : (e instanceof (Ja.ReadStream || Ri) || e instanceof (Ja.WriteStream || Ri)) && vs(e.close);
  }, "isFS"), MS = /* @__PURE__ */ n(function(e) {
    return e.setHeader && vs(e.abort);
  }, "isRequest"), jS = /* @__PURE__ */ n(function(e, t, r, i) {
    i = kS(i);
    var s = !1;
    e.on("close", function() {
      s = !0;
    }), OS(e, { readable: t, writable: r }, function(u) {
      if (u) return i(u);
      s = !0, i();
    });
    var o = !1;
    return function(u) {
      if (!s && !o) {
        if (o = !0, qS(e)) return e.close(Ri);
        if (MS(e)) return e.abort();
        if (vs(e.destroy)) return e.destroy();
        i(u || new Error("stream was destroyed"));
      }
    };
  }, "destroyer"), Mg = /* @__PURE__ */ n(function(e) {
    e();
  }, "call"), IS = /* @__PURE__ */ n(function(e, t) {
    return e.pipe(t);
  }, "pipe"), LS = /* @__PURE__ */ n(function() {
    var e = Array.prototype.slice.call(arguments), t = vs(e[e.length - 1] || Ri) && e.pop() || Ri;
    if (Array.isArray(e[0]) && (e = e[0]), e.length < 2) throw new Error("pump requires two streams per minimum");
    var r, i = e.map(function(s, o) {
      var u = o < e.length - 1, a = o > 0;
      return jS(s, u, a, function(l) {
        r || (r = l), l && i.forEach(Mg), !u && (i.forEach(Mg), t(r));
      });
    });
    e.reduce(IS);
  }, "pump");
  jg.exports = LS;
});

// ../node_modules/pumpify/node_modules/isarray/index.js
var Ng = b((KO, Lg) => {
  var NS = {}.toString;
  Lg.exports = Array.isArray || function(e) {
    return NS.call(e) == "[object Array]";
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/stream.js
var Ka = b((XO, Ug) => {
  Ug.exports = require("stream");
});

// ../node_modules/pumpify/node_modules/safe-buffer/index.js
var _s = b((Xa, Wg) => {
  var ws = require("buffer"), mt = ws.Buffer;
  function Hg(e, t) {
    for (var r in e)
      t[r] = e[r];
  }
  n(Hg, "copyProps");
  mt.from && mt.alloc && mt.allocUnsafe && mt.allocUnsafeSlow ? Wg.exports = ws : (Hg(ws, Xa), Xa.Buffer = Rr);
  function Rr(e, t, r) {
    return mt(e, t, r);
  }
  n(Rr, "SafeBuffer");
  Hg(mt, Rr);
  Rr.from = function(e, t, r) {
    if (typeof e == "number")
      throw new TypeError("Argument must not be a number");
    return mt(e, t, r);
  };
  Rr.alloc = function(e, t, r) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    var i = mt(e);
    return t !== void 0 ? typeof r == "string" ? i.fill(t, r) : i.fill(t) : i.fill(0), i;
  };
  Rr.allocUnsafe = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return mt(e);
  };
  Rr.allocUnsafeSlow = function(e) {
    if (typeof e != "number")
      throw new TypeError("Argument must be a number");
    return ws.SlowBuffer(e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/BufferList.js
var zg = b((ZO, Qa) => {
  "use strict";
  function US(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  n(US, "_classCallCheck");
  var $g = _s().Buffer, Bi = require("util");
  function HS(e, t, r) {
    e.copy(t, r);
  }
  n(HS, "copyBuffer");
  Qa.exports = function() {
    function e() {
      US(this, e), this.head = null, this.tail = null, this.length = 0;
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
      if (this.length === 0) return $g.alloc(0);
      for (var i = $g.allocUnsafe(r >>> 0), s = this.head, o = 0; s; )
        HS(s.data, i, o), o += s.data.length, s = s.next;
      return i;
    }, "concat"), e;
  }();
  Bi && Bi.inspect && Bi.inspect.custom && (Qa.exports.prototype[Bi.inspect.custom] = function() {
    var e = Bi.inspect({ length: this.length });
    return this.constructor.name + " " + e;
  });
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/internal/streams/destroy.js
var Za = b((tP, Vg) => {
  "use strict";
  var Es = ke();
  function WS(e, t) {
    var r = this, i = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
    return i || s ? (t ? t(e) : e && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, Es.nextTick(
    Cs, this, e)) : Es.nextTick(Cs, this, e)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this.
    _writableState.destroyed = !0), this._destroy(e || null, function(o) {
      !t && o ? r._writableState ? r._writableState.errorEmitted || (r._writableState.errorEmitted = !0, Es.nextTick(Cs, r, o)) : Es.nextTick(
      Cs, r, o) : t && t(o);
    }), this);
  }
  n(WS, "destroy");
  function $S() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.
    endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending =
    !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted =
    !1);
  }
  n($S, "undestroy");
  function Cs(e, t) {
    e.emit("error", t);
  }
  n(Cs, "emitErrorNT");
  Vg.exports = {
    destroy: WS,
    undestroy: $S
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_writable.js
var tl = b((iP, ey) => {
  "use strict";
  var Yt = ke();
  ey.exports = De;
  function Yg(e) {
    var t = this;
    this.next = null, this.entry = null, this.finish = function() {
      a3(t, e);
    };
  }
  n(Yg, "CorkedRequest");
  var zS = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : Yt.nextTick, Br;
  De.WritableState = Oi;
  var Jg = Object.create(xe());
  Jg.inherits = X();
  var VS = {
    deprecate: ii()
  }, Kg = Ka(), xs = _s().Buffer, GS = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array ||
  function() {
  };
  function YS(e) {
    return xs.from(e);
  }
  n(YS, "_uint8ArrayToBuffer");
  function JS(e) {
    return xs.isBuffer(e) || e instanceof GS;
  }
  n(JS, "_isUint8Array");
  var Xg = Za();
  Jg.inherits(De, Kg);
  function KS() {
  }
  n(KS, "nop");
  function Oi(e, t) {
    Br = Br || Jt(), e = e || {};
    var r = t instanceof Br;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.writableObjectMode);
    var i = e.highWaterMark, s = e.writableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed =
    !1;
    var u = e.decodeStrings === !1;
    this.decodeStrings = !u, this.defaultEncoding = e.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync =
    !0, this.bufferProcessing = !1, this.onwrite = function(a) {
      i3(t, a);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished =
    !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new Yg(this);
  }
  n(Oi, "WritableState");
  Oi.prototype.getBuffer = /* @__PURE__ */ n(function() {
    for (var t = this.bufferedRequest, r = []; t; )
      r.push(t), t = t.next;
    return r;
  }, "getBuffer");
  (function() {
    try {
      Object.defineProperty(Oi.prototype, "buffer", {
        get: VS.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var Fs;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (Fs = Function.prototype[Symbol.
  hasInstance], Object.defineProperty(De, Symbol.hasInstance, {
    value: /* @__PURE__ */ n(function(e) {
      return Fs.call(this, e) ? !0 : this !== De ? !1 : e && e._writableState instanceof Oi;
    }, "value")
  })) : Fs = /* @__PURE__ */ n(function(e) {
    return e instanceof this;
  }, "realHasInstance");
  function De(e) {
    if (Br = Br || Jt(), !Fs.call(De, this) && !(this instanceof Br))
      return new De(e);
    this._writableState = new Oi(e, this), this.writable = !0, e && (typeof e.write == "function" && (this._write = e.write), typeof e.writev ==
    "function" && (this._writev = e.writev), typeof e.destroy == "function" && (this._destroy = e.destroy), typeof e.final == "function" && (this.
    _final = e.final)), Kg.call(this);
  }
  n(De, "Writable");
  De.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function XS(e, t) {
    var r = new Error("write after end");
    e.emit("error", r), Yt.nextTick(t, r);
  }
  n(XS, "writeAfterEnd");
  function QS(e, t, r, i) {
    var s = !0, o = !1;
    return r === null ? o = new TypeError("May not write null values to stream") : typeof r != "string" && r !== void 0 && !t.objectMode && (o =
    new TypeError("Invalid non-string/buffer chunk")), o && (e.emit("error", o), Yt.nextTick(i, o), s = !1), s;
  }
  n(QS, "validChunk");
  De.prototype.write = function(e, t, r) {
    var i = this._writableState, s = !1, o = !i.objectMode && JS(e);
    return o && !xs.isBuffer(e) && (e = YS(e)), typeof t == "function" && (r = t, t = null), o ? t = "buffer" : t || (t = i.defaultEncoding),
    typeof r != "function" && (r = KS), i.ended ? XS(this, r) : (o || QS(this, i, e, r)) && (i.pendingcb++, s = e3(this, i, o, e, t, r)), s;
  };
  De.prototype.cork = function() {
    var e = this._writableState;
    e.corked++;
  };
  De.prototype.uncork = function() {
    var e = this._writableState;
    e.corked && (e.corked--, !e.writing && !e.corked && !e.bufferProcessing && e.bufferedRequest && Qg(this, e));
  };
  De.prototype.setDefaultEncoding = /* @__PURE__ */ n(function(t) {
    if (typeof t == "string" && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "\
utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t);
    return this._writableState.defaultEncoding = t, this;
  }, "setDefaultEncoding");
  function ZS(e, t, r) {
    return !e.objectMode && e.decodeStrings !== !1 && typeof t == "string" && (t = xs.from(t, r)), t;
  }
  n(ZS, "decodeChunk");
  Object.defineProperty(De.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function e3(e, t, r, i, s, o) {
    if (!r) {
      var u = ZS(t, i, s);
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
      el(e, t, !1, a, i, s, o);
    return l;
  }
  n(e3, "writeOrBuffer");
  function el(e, t, r, i, s, o, u) {
    t.writelen = i, t.writecb = u, t.writing = !0, t.sync = !0, r ? e._writev(s, t.onwrite) : e._write(s, o, t.onwrite), t.sync = !1;
  }
  n(el, "doWrite");
  function t3(e, t, r, i, s) {
    --t.pendingcb, r ? (Yt.nextTick(s, i), Yt.nextTick(ki, e, t), e._writableState.errorEmitted = !0, e.emit("error", i)) : (s(i), e._writableState.
    errorEmitted = !0, e.emit("error", i), ki(e, t));
  }
  n(t3, "onwriteError");
  function r3(e) {
    e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0;
  }
  n(r3, "onwriteStateUpdate");
  function i3(e, t) {
    var r = e._writableState, i = r.sync, s = r.writecb;
    if (r3(r), t) t3(e, r, i, t, s);
    else {
      var o = Zg(r);
      !o && !r.corked && !r.bufferProcessing && r.bufferedRequest && Qg(e, r), i ? zS(Gg, e, r, o, s) : Gg(e, r, o, s);
    }
  }
  n(i3, "onwrite");
  function Gg(e, t, r, i) {
    r || n3(e, t), t.pendingcb--, i(), ki(e, t);
  }
  n(Gg, "afterWrite");
  function n3(e, t) {
    t.length === 0 && t.needDrain && (t.needDrain = !1, e.emit("drain"));
  }
  n(n3, "onwriteDrain");
  function Qg(e, t) {
    t.bufferProcessing = !0;
    var r = t.bufferedRequest;
    if (e._writev && r && r.next) {
      var i = t.bufferedRequestCount, s = new Array(i), o = t.corkedRequestsFree;
      o.entry = r;
      for (var u = 0, a = !0; r; )
        s[u] = r, r.isBuf || (a = !1), r = r.next, u += 1;
      s.allBuffers = a, el(e, t, !0, t.length, s, "", o.finish), t.pendingcb++, t.lastBufferedRequest = null, o.next ? (t.corkedRequestsFree =
      o.next, o.next = null) : t.corkedRequestsFree = new Yg(t), t.bufferedRequestCount = 0;
    } else {
      for (; r; ) {
        var l = r.chunk, f = r.encoding, p = r.callback, d = t.objectMode ? 1 : l.length;
        if (el(e, t, !1, d, l, f, p), r = r.next, t.bufferedRequestCount--, t.writing)
          break;
      }
      r === null && (t.lastBufferedRequest = null);
    }
    t.bufferedRequest = r, t.bufferProcessing = !1;
  }
  n(Qg, "clearBuffer");
  De.prototype._write = function(e, t, r) {
    r(new Error("_write() is not implemented"));
  };
  De.prototype._writev = null;
  De.prototype.end = function(e, t, r) {
    var i = this._writableState;
    typeof e == "function" ? (r = e, e = null, t = null) : typeof t == "function" && (r = t, t = null), e != null && this.write(e, t), i.corked &&
    (i.corked = 1, this.uncork()), i.ending || u3(this, i, r);
  };
  function Zg(e) {
    return e.ending && e.length === 0 && e.bufferedRequest === null && !e.finished && !e.writing;
  }
  n(Zg, "needFinish");
  function s3(e, t) {
    e._final(function(r) {
      t.pendingcb--, r && e.emit("error", r), t.prefinished = !0, e.emit("prefinish"), ki(e, t);
    });
  }
  n(s3, "callFinal");
  function o3(e, t) {
    !t.prefinished && !t.finalCalled && (typeof e._final == "function" ? (t.pendingcb++, t.finalCalled = !0, Yt.nextTick(s3, e, t)) : (t.prefinished =
    !0, e.emit("prefinish")));
  }
  n(o3, "prefinish");
  function ki(e, t) {
    var r = Zg(t);
    return r && (o3(e, t), t.pendingcb === 0 && (t.finished = !0, e.emit("finish"))), r;
  }
  n(ki, "finishMaybe");
  function u3(e, t, r) {
    t.ending = !0, ki(e, t), r && (t.finished ? Yt.nextTick(r) : e.once("finish", r)), t.ended = !0, e.writable = !1;
  }
  n(u3, "endWritable");
  function a3(e, t, r) {
    var i = e.entry;
    for (e.entry = null; i; ) {
      var s = i.callback;
      t.pendingcb--, s(r), i = i.next;
    }
    t.corkedRequestsFree.next = e;
  }
  n(a3, "onCorkedFinish");
  Object.defineProperty(De.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._writableState && (this._writableState.destroyed = e);
    }, "set")
  });
  De.prototype.destroy = Xg.destroy;
  De.prototype._undestroy = Xg.undestroy;
  De.prototype._destroy = function(e, t) {
    this.end(), t(e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_duplex.js
var Jt = b((sP, ny) => {
  "use strict";
  var ty = ke(), l3 = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      t.push(r);
    return t;
  };
  ny.exports = gt;
  var ry = Object.create(xe());
  ry.inherits = X();
  var iy = nl(), il = tl();
  ry.inherits(gt, iy);
  for (rl = l3(il.prototype), Ss = 0; Ss < rl.length; Ss++)
    As = rl[Ss], gt.prototype[As] || (gt.prototype[As] = il.prototype[As]);
  var rl, As, Ss;
  function gt(e) {
    if (!(this instanceof gt)) return new gt(e);
    iy.call(this, e), il.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.
    allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", f3);
  }
  n(gt, "Duplex");
  Object.defineProperty(gt.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: /* @__PURE__ */ n(function() {
      return this._writableState.highWaterMark;
    }, "get")
  });
  function f3() {
    this.allowHalfOpen || this._writableState.ended || ty.nextTick(h3, this);
  }
  n(f3, "onend");
  function h3(e) {
    e.end();
  }
  n(h3, "onEndNT");
  Object.defineProperty(gt.prototype, "destroyed", {
    get: /* @__PURE__ */ n(function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    }, "get"),
    set: /* @__PURE__ */ n(function(e) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e, this._writableState.destroyed =
      e);
    }, "set")
  });
  gt.prototype._destroy = function(e, t) {
    this.push(null), this.end(), ty.nextTick(t, e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_readable.js
var nl = b((aP, my) => {
  "use strict";
  var Or = ke();
  my.exports = re;
  var c3 = Ng(), Pi;
  re.ReadableState = hy;
  var uP = require("events").EventEmitter, ay = /* @__PURE__ */ n(function(e, t) {
    return e.listeners(t).length;
  }, "EElistenerCount"), ll = Ka(), qi = _s().Buffer, d3 = (typeof global < "u" ? global : typeof window < "u" ? window : typeof self < "u" ?
  self : {}).Uint8Array || function() {
  };
  function p3(e) {
    return qi.from(e);
  }
  n(p3, "_uint8ArrayToBuffer");
  function D3(e) {
    return qi.isBuffer(e) || e instanceof d3;
  }
  n(D3, "_isUint8Array");
  var ly = Object.create(xe());
  ly.inherits = X();
  var sl = require("util"), V = void 0;
  sl && sl.debuglog ? V = sl.debuglog("stream") : V = /* @__PURE__ */ n(function() {
  }, "debug");
  var m3 = zg(), fy = Za(), kr;
  ly.inherits(re, ll);
  var ol = ["error", "close", "destroy", "pause", "resume"];
  function g3(e, t, r) {
    if (typeof e.prependListener == "function") return e.prependListener(t, r);
    !e._events || !e._events[t] ? e.on(t, r) : c3(e._events[t]) ? e._events[t].unshift(r) : e._events[t] = [r, e._events[t]];
  }
  n(g3, "prependListener");
  function hy(e, t) {
    Pi = Pi || Jt(), e = e || {};
    var r = t instanceof Pi;
    this.objectMode = !!e.objectMode, r && (this.objectMode = this.objectMode || !!e.readableObjectMode);
    var i = e.highWaterMark, s = e.readableHighWaterMark, o = this.objectMode ? 16 : 16 * 1024;
    i || i === 0 ? this.highWaterMark = i : r && (s || s === 0) ? this.highWaterMark = s : this.highWaterMark = o, this.highWaterMark = Math.
    floor(this.highWaterMark), this.buffer = new m3(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended =
    !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening =
    !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = e.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore =
    !1, this.decoder = null, this.encoding = null, e.encoding && (kr || (kr = require("string_decoder/").StringDecoder), this.decoder = new kr(
    e.encoding), this.encoding = e.encoding);
  }
  n(hy, "ReadableState");
  function re(e) {
    if (Pi = Pi || Jt(), !(this instanceof re)) return new re(e);
    this._readableState = new hy(e, this), this.readable = !0, e && (typeof e.read == "function" && (this._read = e.read), typeof e.destroy ==
    "function" && (this._destroy = e.destroy)), ll.call(this);
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
  re.prototype.destroy = fy.destroy;
  re.prototype._undestroy = fy.undestroy;
  re.prototype._destroy = function(e, t) {
    this.push(null), t(e);
  };
  re.prototype.push = function(e, t) {
    var r = this._readableState, i;
    return r.objectMode ? i = !0 : typeof e == "string" && (t = t || r.defaultEncoding, t !== r.encoding && (e = qi.from(e, t), t = ""), i =
    !0), cy(this, e, t, !1, i);
  };
  re.prototype.unshift = function(e) {
    return cy(this, e, null, !0, !1);
  };
  function cy(e, t, r, i, s) {
    var o = e._readableState;
    if (t === null)
      o.reading = !1, w3(e, o);
    else {
      var u;
      s || (u = y3(o, t)), u ? e.emit("error", u) : o.objectMode || t && t.length > 0 ? (typeof t != "string" && !o.objectMode && Object.getPrototypeOf(
      t) !== qi.prototype && (t = p3(t)), i ? o.endEmitted ? e.emit("error", new Error("stream.unshift() after end event")) : ul(e, o, t, !0) :
      o.ended ? e.emit("error", new Error("stream.push() after EOF")) : (o.reading = !1, o.decoder && !r ? (t = o.decoder.write(t), o.objectMode ||
      t.length !== 0 ? ul(e, o, t, !1) : dy(e, o)) : ul(e, o, t, !1))) : i || (o.reading = !1);
    }
    return b3(o);
  }
  n(cy, "readableAddChunk");
  function ul(e, t, r, i) {
    t.flowing && t.length === 0 && !t.sync ? (e.emit("data", r), e.read(0)) : (t.length += t.objectMode ? 1 : r.length, i ? t.buffer.unshift(
    r) : t.buffer.push(r), t.needReadable && Ts(e)), dy(e, t);
  }
  n(ul, "addChunk");
  function y3(e, t) {
    var r;
    return !D3(t) && typeof t != "string" && t !== void 0 && !e.objectMode && (r = new TypeError("Invalid non-string/buffer chunk")), r;
  }
  n(y3, "chunkInvalid");
  function b3(e) {
    return !e.ended && (e.needReadable || e.length < e.highWaterMark || e.length === 0);
  }
  n(b3, "needMoreData");
  re.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  };
  re.prototype.setEncoding = function(e) {
    return kr || (kr = require("string_decoder/").StringDecoder), this._readableState.decoder = new kr(e), this._readableState.encoding = e,
    this;
  };
  var sy = 8388608;
  function v3(e) {
    return e >= sy ? e = sy : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e;
  }
  n(v3, "computeNewHighWaterMark");
  function oy(e, t) {
    return e <= 0 || t.length === 0 && t.ended ? 0 : t.objectMode ? 1 : e !== e ? t.flowing && t.length ? t.buffer.head.data.length : t.length :
    (e > t.highWaterMark && (t.highWaterMark = v3(e)), e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0, 0));
  }
  n(oy, "howMuchToRead");
  re.prototype.read = function(e) {
    V("read", e), e = parseInt(e, 10);
    var t = this._readableState, r = e;
    if (e !== 0 && (t.emittedReadable = !1), e === 0 && t.needReadable && (t.length >= t.highWaterMark || t.ended))
      return V("read: emitReadable", t.length, t.ended), t.length === 0 && t.ended ? al(this) : Ts(this), null;
    if (e = oy(e, t), e === 0 && t.ended)
      return t.length === 0 && al(this), null;
    var i = t.needReadable;
    V("need readable", i), (t.length === 0 || t.length - e < t.highWaterMark) && (i = !0, V("length less than watermark", i)), t.ended || t.
    reading ? (i = !1, V("reading or ended", i)) : i && (V("do read"), t.reading = !0, t.sync = !0, t.length === 0 && (t.needReadable = !0),
    this._read(t.highWaterMark), t.sync = !1, t.reading || (e = oy(r, t)));
    var s;
    return e > 0 ? s = py(e, t) : s = null, s === null ? (t.needReadable = !0, e = 0) : t.length -= e, t.length === 0 && (t.ended || (t.needReadable =
    !0), r !== e && t.ended && al(this)), s !== null && this.emit("data", s), s;
  };
  function w3(e, t) {
    if (!t.ended) {
      if (t.decoder) {
        var r = t.decoder.end();
        r && r.length && (t.buffer.push(r), t.length += t.objectMode ? 1 : r.length);
      }
      t.ended = !0, Ts(e);
    }
  }
  n(w3, "onEofChunk");
  function Ts(e) {
    var t = e._readableState;
    t.needReadable = !1, t.emittedReadable || (V("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? Or.nextTick(uy, e) : uy(e));
  }
  n(Ts, "emitReadable");
  function uy(e) {
    V("emit readable"), e.emit("readable"), fl(e);
  }
  n(uy, "emitReadable_");
  function dy(e, t) {
    t.readingMore || (t.readingMore = !0, Or.nextTick(_3, e, t));
  }
  n(dy, "maybeReadMore");
  function _3(e, t) {
    for (var r = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (V("maybeReadMore read 0"), e.read(0), r !==
    t.length); )
      r = t.length;
    t.readingMore = !1;
  }
  n(_3, "maybeReadMore_");
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
    i.pipesCount += 1, V("pipe count=%d opts=%j", i.pipesCount, t);
    var s = (!t || t.end !== !1) && e !== process.stdout && e !== process.stderr, o = s ? a : y;
    i.endEmitted ? Or.nextTick(o) : r.once("end", o), e.on("unpipe", u);
    function u(_, E) {
      V("onunpipe"), _ === r && E && E.hasUnpiped === !1 && (E.hasUnpiped = !0, p());
    }
    n(u, "onunpipe");
    function a() {
      V("onend"), e.end();
    }
    n(a, "onend");
    var l = E3(r);
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
      var E = e.write(_);
      E === !1 && !d && ((i.pipesCount === 1 && i.pipes === e || i.pipesCount > 1 && Dy(i.pipes, e) !== -1) && !f && (V("false write respons\
e, pause", i.awaitDrain), i.awaitDrain++, d = !0), r.pause());
    }
    n(c, "ondata");
    function h(_) {
      V("onerror", _), y(), e.removeListener("error", h), ay(e, "error") === 0 && e.emit("error", _);
    }
    n(h, "onerror"), g3(e, "error", h);
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
  function E3(e) {
    return function() {
      var t = e._readableState;
      V("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, t.awaitDrain === 0 && ay(e, "data") && (t.flowing = !0, fl(e));
    };
  }
  n(E3, "pipeOnDrain");
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
    var u = Dy(t.pipes, e);
    return u === -1 ? this : (t.pipes.splice(u, 1), t.pipesCount -= 1, t.pipesCount === 1 && (t.pipes = t.pipes[0]), e.emit("unpipe", this, r),
    this);
  };
  re.prototype.on = function(e, t) {
    var r = ll.prototype.on.call(this, e, t);
    if (e === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (e === "readable") {
      var i = this._readableState;
      !i.endEmitted && !i.readableListening && (i.readableListening = i.needReadable = !0, i.emittedReadable = !1, i.reading ? i.length && Ts(
      this) : Or.nextTick(C3, this));
    }
    return r;
  };
  re.prototype.addListener = re.prototype.on;
  function C3(e) {
    V("readable nexttick read 0"), e.read(0);
  }
  n(C3, "nReadingNextTick");
  re.prototype.resume = function() {
    var e = this._readableState;
    return e.flowing || (V("resume"), e.flowing = !0, F3(this, e)), this;
  };
  function F3(e, t) {
    t.resumeScheduled || (t.resumeScheduled = !0, Or.nextTick(x3, e, t));
  }
  n(F3, "resume");
  function x3(e, t) {
    t.reading || (V("resume read 0"), e.read(0)), t.resumeScheduled = !1, t.awaitDrain = 0, e.emit("resume"), fl(e), t.flowing && !t.reading &&
    e.read(0);
  }
  n(x3, "resume_");
  re.prototype.pause = function() {
    return V("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (V("pause"), this._readableState.flowing =
    !1, this.emit("pause")), this;
  };
  function fl(e) {
    var t = e._readableState;
    for (V("flow", t.flowing); t.flowing && e.read() !== null; )
      ;
  }
  n(fl, "flow");
  re.prototype.wrap = function(e) {
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
    for (var o = 0; o < ol.length; o++)
      e.on(ol[o], this.emit.bind(this, ol[o]));
    return this._read = function(u) {
      V("wrapped _read", u), i && (i = !1, e.resume());
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
  re._fromList = py;
  function py(e, t) {
    if (t.length === 0) return null;
    var r;
    return t.objectMode ? r = t.buffer.shift() : !e || e >= t.length ? (t.decoder ? r = t.buffer.join("") : t.buffer.length === 1 ? r = t.buffer.
    head.data : r = t.buffer.concat(t.length), t.buffer.clear()) : r = S3(e, t.buffer, t.decoder), r;
  }
  n(py, "fromList");
  function S3(e, t, r) {
    var i;
    return e < t.head.data.length ? (i = t.head.data.slice(0, e), t.head.data = t.head.data.slice(e)) : e === t.head.data.length ? i = t.shift() :
    i = r ? A3(e, t) : T3(e, t), i;
  }
  n(S3, "fromListPartial");
  function A3(e, t) {
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
  n(A3, "copyFromBufferString");
  function T3(e, t) {
    var r = qi.allocUnsafe(e), i = t.head, s = 1;
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
  n(T3, "copyFromBuffer");
  function al(e) {
    var t = e._readableState;
    if (t.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    t.endEmitted || (t.ended = !0, Or.nextTick(R3, t, e));
  }
  n(al, "endReadable");
  function R3(e, t) {
    !e.endEmitted && e.length === 0 && (e.endEmitted = !0, t.readable = !1, t.emit("end"));
  }
  n(R3, "endReadableNT");
  function Dy(e, t) {
    for (var r = 0, i = e.length; r < i; r++)
      if (e[r] === t) return r;
    return -1;
  }
  n(Dy, "indexOf");
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_transform.js
var hl = b((fP, by) => {
  "use strict";
  by.exports = yt;
  var Rs = Jt(), yy = Object.create(xe());
  yy.inherits = X();
  yy.inherits(yt, Rs);
  function B3(e, t) {
    var r = this._transformState;
    r.transforming = !1;
    var i = r.writecb;
    if (!i)
      return this.emit("error", new Error("write callback called multiple times"));
    r.writechunk = null, r.writecb = null, t != null && this.push(t), i(e);
    var s = this._readableState;
    s.reading = !1, (s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
  }
  n(B3, "afterTransform");
  function yt(e) {
    if (!(this instanceof yt)) return new yt(e);
    Rs.call(this, e), this._transformState = {
      afterTransform: B3.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, e && (typeof e.transform == "function" && (this._transform = e.
    transform), typeof e.flush == "function" && (this._flush = e.flush)), this.on("prefinish", k3);
  }
  n(yt, "Transform");
  function k3() {
    var e = this;
    typeof this._flush == "function" ? this._flush(function(t, r) {
      gy(e, t, r);
    }) : gy(this, null, null);
  }
  n(k3, "prefinish");
  yt.prototype.push = function(e, t) {
    return this._transformState.needTransform = !1, Rs.prototype.push.call(this, e, t);
  };
  yt.prototype._transform = function(e, t, r) {
    throw new Error("_transform() is not implemented");
  };
  yt.prototype._write = function(e, t, r) {
    var i = this._transformState;
    if (i.writecb = r, i.writechunk = e, i.writeencoding = t, !i.transforming) {
      var s = this._readableState;
      (i.needTransform || s.needReadable || s.length < s.highWaterMark) && this._read(s.highWaterMark);
    }
  };
  yt.prototype._read = function(e) {
    var t = this._transformState;
    t.writechunk !== null && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) :
    t.needTransform = !0;
  };
  yt.prototype._destroy = function(e, t) {
    var r = this;
    Rs.prototype._destroy.call(this, e, function(i) {
      t(i), r.emit("close");
    });
  };
  function gy(e, t, r) {
    if (t) return e.emit("error", t);
    if (r != null && e.push(r), e._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (e._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return e.push(null);
  }
  n(gy, "done");
});

// ../node_modules/pumpify/node_modules/readable-stream/lib/_stream_passthrough.js
var Ey = b((cP, _y) => {
  "use strict";
  _y.exports = Mi;
  var vy = hl(), wy = Object.create(xe());
  wy.inherits = X();
  wy.inherits(Mi, vy);
  function Mi(e) {
    if (!(this instanceof Mi)) return new Mi(e);
    vy.call(this, e);
  }
  n(Mi, "PassThrough");
  Mi.prototype._transform = function(e, t, r) {
    r(null, e);
  };
});

// ../node_modules/pumpify/node_modules/readable-stream/readable.js
var Cy = b((_e, Bs) => {
  var Ze = require("stream");
  process.env.READABLE_STREAM === "disable" && Ze ? (Bs.exports = Ze, _e = Bs.exports = Ze.Readable, _e.Readable = Ze.Readable, _e.Writable =
  Ze.Writable, _e.Duplex = Ze.Duplex, _e.Transform = Ze.Transform, _e.PassThrough = Ze.PassThrough, _e.Stream = Ze) : (_e = Bs.exports = nl(),
  _e.Stream = Ze || _e, _e.Readable = _e, _e.Writable = tl(), _e.Duplex = Jt(), _e.Transform = hl(), _e.PassThrough = Ey());
});

// ../node_modules/pumpify/node_modules/duplexify/index.js
var Ty = b((pP, Ay) => {
  var ks = Cy(), Fy = fr(), O3 = X(), P3 = Aa(), xy = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([0]) : new Buffer([0]), cl = /* @__PURE__ */ n(
  function(e, t) {
    e._corked ? e.once("uncork", t) : t();
  }, "onuncork"), q3 = /* @__PURE__ */ n(function(e, t) {
    e._autoDestroy && e.destroy(t);
  }, "autoDestroy"), Sy = /* @__PURE__ */ n(function(e, t) {
    return function(r) {
      r ? q3(e, r.message === "premature close" ? null : r) : t && !e._ended && e.end();
    };
  }, "destroyer"), M3 = /* @__PURE__ */ n(function(e, t) {
    if (!e || e._writableState && e._writableState.finished) return t();
    if (e._writableState) return e.end(t);
    e.end(), t();
  }, "end"), j3 = /* @__PURE__ */ n(function(e) {
    return new ks.Readable({ objectMode: !0, highWaterMark: 16 }).wrap(e);
  }, "toStreams2"), Ee = /* @__PURE__ */ n(function(e, t, r) {
    if (!(this instanceof Ee)) return new Ee(e, t, r);
    ks.Duplex.call(this, r), this._writable = null, this._readable = null, this._readable2 = null, this._autoDestroy = !r || r.autoDestroy !==
    !1, this._forwardDestroy = !r || r.destroy !== !1, this._forwardEnd = !r || r.end !== !1, this._corked = 1, this._ondrain = null, this._drained =
    !1, this._forwarding = !1, this._unwrite = null, this._unread = null, this._ended = !1, this.destroyed = !1, e && this.setWritable(e), t &&
    this.setReadable(t);
  }, "Duplexify");
  O3(Ee, ks.Duplex);
  Ee.obj = function(e, t, r) {
    return r || (r = {}), r.objectMode = !0, r.highWaterMark = 16, new Ee(e, t, r);
  };
  Ee.prototype.cork = function() {
    ++this._corked === 1 && this.emit("cork");
  };
  Ee.prototype.uncork = function() {
    this._corked && --this._corked === 0 && this.emit("uncork");
  };
  Ee.prototype.setWritable = function(e) {
    if (this._unwrite && this._unwrite(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.end();
      return;
    }
    var t = this, r = Fy(e, { writable: !0, readable: !1 }, Sy(this, this._forwardEnd)), i = /* @__PURE__ */ n(function() {
      var o = t._ondrain;
      t._ondrain = null, o && o();
    }, "ondrain"), s = /* @__PURE__ */ n(function() {
      t._writable.removeListener("drain", i), r();
    }, "clear");
    this._unwrite && process.nextTick(i), this._writable = e, this._writable.on("drain", i), this._unwrite = s, this.uncork();
  };
  Ee.prototype.setReadable = function(e) {
    if (this._unread && this._unread(), this.destroyed) {
      e && e.destroy && e.destroy();
      return;
    }
    if (e === null || e === !1) {
      this.push(null), this.resume();
      return;
    }
    var t = this, r = Fy(e, { writable: !1, readable: !0 }, Sy(this)), i = /* @__PURE__ */ n(function() {
      t._forward();
    }, "onreadable"), s = /* @__PURE__ */ n(function() {
      t.push(null);
    }, "onend"), o = /* @__PURE__ */ n(function() {
      t._readable2.removeListener("readable", i), t._readable2.removeListener("end", s), r();
    }, "clear");
    this._drained = !0, this._readable = e, this._readable2 = e._readableState ? e : j3(e), this._readable2.on("readable", i), this._readable2.
    on("end", s), this._unread = o, this._forward();
  };
  Ee.prototype._read = function() {
    this._drained = !0, this._forward();
  };
  Ee.prototype._forward = function() {
    if (!(this._forwarding || !this._readable2 || !this._drained)) {
      this._forwarding = !0;
      for (var e; this._drained && (e = P3(this._readable2)) !== null; )
        this.destroyed || (this._drained = this.push(e));
      this._forwarding = !1;
    }
  };
  Ee.prototype.destroy = function(e) {
    if (!this.destroyed) {
      this.destroyed = !0;
      var t = this;
      process.nextTick(function() {
        t._destroy(e);
      });
    }
  };
  Ee.prototype._destroy = function(e) {
    if (e) {
      var t = this._ondrain;
      this._ondrain = null, t ? t(e) : this.emit("error", e);
    }
    this._forwardDestroy && (this._readable && this._readable.destroy && this._readable.destroy(), this._writable && this._writable.destroy &&
    this._writable.destroy()), this.emit("close");
  };
  Ee.prototype._write = function(e, t, r) {
    if (this.destroyed) return r();
    if (this._corked) return cl(this, this._write.bind(this, e, t, r));
    if (e === xy) return this._finish(r);
    if (!this._writable) return r();
    this._writable.write(e) === !1 ? this._ondrain = r : r();
  };
  Ee.prototype._finish = function(e) {
    var t = this;
    this.emit("preend"), cl(this, function() {
      M3(t._forwardEnd && t._writable, function() {
        t._writableState.prefinished === !1 && (t._writableState.prefinished = !0), t.emit("prefinish"), cl(t, e);
      });
    });
  };
  Ee.prototype.end = function(e, t, r) {
    return typeof e == "function" ? this.end(null, null, e) : typeof t == "function" ? this.end(e, null, t) : (this._ended = !0, e && this.write(
    e), this._writableState.ending || this.write(xy), ks.Writable.prototype.end.call(this, r));
  };
  Ay.exports = Ee;
});

// ../node_modules/pumpify/index.js
var ky = b((mP, Os) => {
  var I3 = Ig(), L3 = X(), Ry = Ty(), By = /* @__PURE__ */ n(function(e) {
    return e.length ? Array.isArray(e[0]) ? e[0] : Array.prototype.slice.call(e) : [];
  }, "toArray"), dl = /* @__PURE__ */ n(function(e) {
    var t = /* @__PURE__ */ n(function() {
      var r = By(arguments);
      if (!(this instanceof t)) return new t(r);
      Ry.call(this, null, null, e), r.length && this.setPipeline(r);
    }, "Pumpify");
    return L3(t, Ry), t.prototype.setPipeline = function() {
      var r = By(arguments), i = this, s = !1, o = r[0], u = r[r.length - 1];
      u = u.readable ? u : null, o = o.writable ? o : null;
      var a = /* @__PURE__ */ n(function() {
        r[0].emit("error", new Error("stream was destroyed"));
      }, "onclose");
      if (this.on("close", a), this.on("prefinish", function() {
        s || i.cork();
      }), I3(r, function(l) {
        if (i.removeListener("close", a), l) return i.destroy(l.message === "premature close" ? null : l);
        s = !0, i._autoDestroy === !1 && (i._autoDestroy = !0), i.uncork();
      }), this.destroyed) return a();
      this.setWritable(o), this.setReadable(u);
    }, t;
  }, "define");
  Os.exports = dl({ autoDestroy: !1, destroy: !1 });
  Os.exports.obj = dl({ autoDestroy: !1, destroy: !1, objectMode: !0, highWaterMark: 16 });
  Os.exports.ctor = dl;
});

// ../node_modules/is-gzip/index.js
var Py = b((yP, Oy) => {
  "use strict";
  Oy.exports = function(e) {
    return !e || e.length < 3 ? !1 : e[0] === 31 && e[1] === 139 && e[2] === 8;
  };
});

// ../node_modules/is-deflate/index.js
var My = b((bP, qy) => {
  "use strict";
  qy.exports = function(e) {
    return !e || e.length < 2 ? !1 : e[0] === 120 && (e[1] === 1 || e[1] === 156 || e[1] === 218);
  };
});

// ../node_modules/gunzip-maybe/index.js
var Ny = b((vP, Ly) => {
  var jy = require("zlib"), N3 = qg(), U3 = Ga(), Iy = ky(), H3 = Py(), W3 = My(), $3 = /* @__PURE__ */ n(function(e) {
    return H3(e) ? 1 : W3(e) ? 2 : 0;
  }, "isCompressed"), pl = /* @__PURE__ */ n(function(e) {
    return e === void 0 && (e = 3), N3({ newline: !1, maxBuffer: 10 }, function(t, r) {
      if (e < 0) return r(new Error("Maximum recursion reached"));
      switch ($3(t)) {
        case 1:
          r(null, Iy(jy.createGunzip(), pl(e - 1)));
          break;
        case 2:
          r(null, Iy(jy.createInflate(), pl(e - 1)));
          break;
        default:
          r(null, U3());
      }
    });
  }, "gunzip");
  Ly.exports = pl;
});

// ../node_modules/@ndelangen/get-tarball/dist/index.js
var qb = b((CP, Pb) => {
  "use strict";
  var z3 = Object.create, $s = Object.defineProperty, V3 = Object.getOwnPropertyDescriptor, hb = Object.getOwnPropertyNames, G3 = Object.getPrototypeOf,
  Y3 = Object.prototype.hasOwnProperty, H = /* @__PURE__ */ n((e, t) => /* @__PURE__ */ n(function() {
    return t || (0, e[hb(e)[0]])((t = { exports: {} }).exports, t), t.exports;
  }, "__require"), "__commonJS"), J3 = /* @__PURE__ */ n((e, t) => {
    for (var r in t)
      $s(e, r, { get: t[r], enumerable: !0 });
  }, "__export"), cb = /* @__PURE__ */ n((e, t, r, i) => {
    if (t && typeof t == "object" || typeof t == "function")
      for (let s of hb(t))
        !Y3.call(e, s) && s !== r && $s(e, s, { get: /* @__PURE__ */ n(() => t[s], "get"), enumerable: !(i = V3(t, s)) || i.enumerable });
    return e;
  }, "__copyProps"), me = /* @__PURE__ */ n((e, t, r) => (r = e != null ? z3(G3(e)) : {}, cb(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    t || !e || !e.__esModule ? $s(r, "default", { value: e, enumerable: !0 }) : r,
    e
  )), "__toESM"), K3 = /* @__PURE__ */ n((e) => cb($s({}, "__esModule", { value: !0 }), e), "__toCommonJS"), X3 = H({
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
  }), Q3 = H({
    "node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js"(e, t) {
      "use strict";
      var { PassThrough: r } = require("stream");
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
  }), db = H({
    "node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js"(e, t) {
      "use strict";
      var { constants: r } = require("buffer"), i = require("stream"), { promisify: s } = require("util"), o = Q3(), u = s(i.pipeline), a = class extends Error {
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
  }), Z3 = H({
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
          _fromObject: E
        } = {}) {
          if (E) {
            this._fromObject(E);
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
  }), e1 = H({
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
  }), t1 = H({
    "node_modules/.pnpm/keyv@4.5.2/node_modules/keyv/src/index.js"(e, t) {
      "use strict";
      var r = require("events"), i = e1(), s = /* @__PURE__ */ n((a) => {
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
          return new (require(l[f]))(a);
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
  }), r1 = H({
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
  }), i1 = H({
    "node_modules/.pnpm/decompress-response@6.0.0/node_modules/decompress-response/index.js"(e, t) {
      "use strict";
      var { Transform: r, PassThrough: i } = require("stream"), s = require("zlib"), o = r1();
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
  }), pb = H({
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
  }), Db = H({
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
  }), Mr = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/agent.js"(e, t) {
      "use strict";
      var { URL: r } = require("url"), i = require("events"), s = require("tls"), o = require("http2"), u = pb(), a = Db(), l = Symbol("curr\
entStreamCount"), f = Symbol("request"), p = Symbol("cachedOriginSet"), d = Symbol("gracefullyClosing"), c = Symbol("length"), h = [
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
      ], g = /* @__PURE__ */ n((x, F, C) => {
        let B = 0, P = x.length;
        for (; B < P; ) {
          let k = B + P >>> 1;
          C(x[k], F) ? B = k + 1 : P = k;
        }
        return B;
      }, "getSortedIndex"), w = /* @__PURE__ */ n((x, F) => x.remoteSettings.maxConcurrentStreams > F.remoteSettings.maxConcurrentStreams, "\
compareSessions"), y = /* @__PURE__ */ n((x, F) => {
        for (let C = 0; C < x.length; C++) {
          let B = x[C];
          // Unfortunately `.every()` returns true for an empty array
          B[p].length > 0 && B[p].length < F[p].length && B[p].every((P) => F[p].includes(P)) && B[l] + F[l] <= F.remoteSettings.maxConcurrentStreams &&
          E(B);
        }
      }, "closeCoveredSessions"), _ = /* @__PURE__ */ n((x, F) => {
        for (let C = 0; C < x.length; C++) {
          let B = x[C];
          if (F[p].length > 0 && F[p].length < B[p].length && F[p].every((P) => B[p].includes(P)) && F[l] + B[l] <= B.remoteSettings.maxConcurrentStreams)
            return E(F), !0;
        }
        return !1;
      }, "closeSessionIfCovered"), E = /* @__PURE__ */ n((x) => {
        x[d] = !0, x[l] === 0 && x.close();
      }, "gracefullyClose"), v = class extends i {
        static {
          n(this, "Agent");
        }
        constructor({ timeout: x = 0, maxSessions: F = Number.POSITIVE_INFINITY, maxEmptySessions: C = 10, maxCachedTlsSessions: B = 100 } = {}) {
          super(), this.sessions = {}, this.queue = {}, this.timeout = x, this.maxSessions = F, this.maxEmptySessions = C, this._emptySessionCount =
          0, this._sessionCount = 0, this.settings = {
            enablePush: !1,
            initialWindowSize: 1024 * 1024 * 32
            // 32MB, see https://github.com/nodejs/node/issues/38426
          }, this.tlsSessionCache = new u({ maxSize: B });
        }
        get protocol() {
          return "https:";
        }
        normalizeOptions(x) {
          let F = "";
          for (let C = 0; C < h.length; C++) {
            let B = h[C];
            F += ":", x && x[B] !== void 0 && (F += x[B]);
          }
          return F;
        }
        _processQueue() {
          if (this._sessionCount >= this.maxSessions) {
            this.closeEmptySessions(this.maxSessions - this._sessionCount + 1);
            return;
          }
          for (let x in this.queue)
            for (let F in this.queue[x]) {
              let C = this.queue[x][F];
              C.completed || (C.completed = !0, C());
            }
        }
        _isBetterSession(x, F) {
          return x > F;
        }
        _accept(x, F, C, B) {
          let P = 0;
          for (; P < F.length && x[l] < x.remoteSettings.maxConcurrentStreams; )
            F[P].resolve(x), P++;
          F.splice(0, P), F.length > 0 && (this.getSession(C, B, F), F.length = 0);
        }
        getSession(x, F, C) {
          return new Promise((B, P) => {
            Array.isArray(C) && C.length > 0 ? (C = [...C], B()) : C = [{ resolve: B, reject: P }];
            try {
              if (typeof x == "string")
                x = new r(x);
              else if (!(x instanceof r))
                throw new TypeError("The `origin` argument needs to be a string or an URL object");
              if (F) {
                let { servername: O } = F, { hostname: T } = x;
                if (O && T !== O)
                  throw new Error(`Origin ${T} differs from servername ${O}`);
              }
            } catch (O) {
              for (let T = 0; T < C.length; T++)
                C[T].reject(O);
              return;
            }
            let k = this.normalizeOptions(F), M = x.origin;
            if (k in this.sessions) {
              let O = this.sessions[k], T = -1, q = -1, ne;
              for (let W = 0; W < O.length; W++) {
                let R = O[W], ge = R.remoteSettings.maxConcurrentStreams;
                if (ge < T)
                  break;
                if (!R[p].includes(M))
                  continue;
                let L = R[l];
                L >= ge || R[d] || R.destroyed || (ne || (T = ge), this._isBetterSession(L, q) && (ne = R, q = L));
              }
              if (ne) {
                this._accept(ne, C, M, F);
                return;
              }
            }
            if (k in this.queue) {
              if (M in this.queue[k]) {
                this.queue[k][M].listeners.push(...C);
                return;
              }
            } else
              this.queue[k] = {
                [c]: 0
              };
            let U = /* @__PURE__ */ n(() => {
              k in this.queue && this.queue[k][M] === he && (delete this.queue[k][M], --this.queue[k][c] === 0 && delete this.queue[k]);
            }, "removeFromQueue"), he = /* @__PURE__ */ n(async () => {
              this._sessionCount++;
              let O = `${M}:${k}`, T = !1, q;
              try {
                let ne = { ...F };
                ne.settings === void 0 && (ne.settings = this.settings), ne.session === void 0 && (ne.session = this.tlsSessionCache.get(O)),
                q = await (ne.createConnection || this.createConnection).call(this, x, ne), ne.createConnection = () => q;
                let R = o.connect(x, ne);
                R[l] = 0, R[d] = !1;
                let ge = /* @__PURE__ */ n(() => {
                  let { socket: I } = R, Z;
                  return I.servername === !1 ? (I.servername = I.remoteAddress, Z = R.originSet, I.servername = !1) : Z = R.originSet, Z;
                }, "getOriginSet"), L = /* @__PURE__ */ n(() => R[l] < R.remoteSettings.maxConcurrentStreams, "isFree");
                R.socket.once("session", (I) => {
                  this.tlsSessionCache.set(O, I);
                }), R.once("error", (I) => {
                  for (let Z = 0; Z < C.length; Z++)
                    C[Z].reject(I);
                  this.tlsSessionCache.delete(O);
                }), R.setTimeout(this.timeout, () => {
                  R.destroy();
                }), R.once("close", () => {
                  if (this._sessionCount--, T) {
                    this._emptySessionCount--;
                    let I = this.sessions[k];
                    I.length === 1 ? delete this.sessions[k] : I.splice(I.indexOf(R), 1);
                  } else {
                    U();
                    let I = new Error("Session closed without receiving a SETTINGS frame");
                    I.code = "HTTP2WRAPPER_NOSETTINGS";
                    for (let Z = 0; Z < C.length; Z++)
                      C[Z].reject(I);
                  }
                  this._processQueue();
                });
                let Ur = /* @__PURE__ */ n(() => {
                  let I = this.queue[k];
                  if (!I)
                    return;
                  let Z = R[p];
                  for (let He = 0; He < Z.length; He++) {
                    let Hr = Z[He];
                    if (Hr in I) {
                      let { listeners: df, completed: sv } = I[Hr], nn = 0;
                      for (; nn < df.length && L(); )
                        df[nn].resolve(R), nn++;
                      if (I[Hr].listeners.splice(0, nn), I[Hr].listeners.length === 0 && !sv && (delete I[Hr], --I[c] === 0)) {
                        delete this.queue[k];
                        break;
                      }
                      if (!L())
                        break;
                    }
                  }
                }, "processListeners");
                R.on("origin", () => {
                  R[p] = ge() || [], R[d] = !1, _(this.sessions[k], R), !(R[d] || !L()) && (Ur(), L() && y(this.sessions[k], R));
                }), R.once("remoteSettings", () => {
                  if (he.destroyed) {
                    let I = new Error("Agent has been destroyed");
                    for (let Z = 0; Z < C.length; Z++)
                      C[Z].reject(I);
                    R.destroy();
                    return;
                  }
                  if (R.setLocalWindowSize && R.setLocalWindowSize(1024 * 1024 * 4), R[p] = ge() || [], R.socket.encrypted) {
                    let I = R[p][0];
                    if (I !== M) {
                      let Z = new Error(`Requested origin ${M} does not match server ${I}`);
                      for (let He = 0; He < C.length; He++)
                        C[He].reject(Z);
                      R.destroy();
                      return;
                    }
                  }
                  U();
                  {
                    let I = this.sessions;
                    if (k in I) {
                      let Z = I[k];
                      Z.splice(g(Z, R, w), 0, R);
                    } else
                      I[k] = [R];
                  }
                  T = !0, this._emptySessionCount++, this.emit("session", R), this._accept(R, C, M, F), R[l] === 0 && this._emptySessionCount >
                  this.maxEmptySessions && this.closeEmptySessions(this._emptySessionCount - this.maxEmptySessions), R.on("remoteSettings", () => {
                    L() && (Ur(), L() && y(this.sessions[k], R));
                  });
                }), R[f] = R.request, R.request = (I, Z) => {
                  if (R[d])
                    throw new Error("The session is gracefully closing. No new streams are allowed.");
                  let He = R[f](I, Z);
                  return R.ref(), R[l]++ === 0 && this._emptySessionCount--, He.once("close", () => {
                    if (--R[l] === 0 && (this._emptySessionCount++, R.unref(), this._emptySessionCount > this.maxEmptySessions || R[d])) {
                      R.close();
                      return;
                    }
                    R.destroyed || R.closed || L() && !_(this.sessions[k], R) && (y(this.sessions[k], R), Ur(), R[l] === 0 && this._processQueue());
                  }), He;
                };
              } catch (ne) {
                U(), this._sessionCount--;
                for (let W = 0; W < C.length; W++)
                  C[W].reject(ne);
              }
            }, "entry");
            he.listeners = C, he.completed = !1, he.destroyed = !1, this.queue[k][M] = he, this.queue[k][c]++, this._processQueue();
          });
        }
        request(x, F, C, B) {
          return new Promise((P, k) => {
            this.getSession(x, F, [{
              reject: k,
              resolve: /* @__PURE__ */ n((M) => {
                try {
                  let U = M.request(C, B);
                  a(U), P(U);
                } catch (U) {
                  k(U);
                }
              }, "resolve")
            }]);
          });
        }
        async createConnection(x, F) {
          return v.connect(x, F);
        }
        static connect(x, F) {
          F.ALPNProtocols = ["h2"];
          let C = x.port || 443, B = x.hostname;
          typeof F.servername > "u" && (F.servername = B);
          let P = s.connect(C, B, F);
          return F.socket && (P._peername = {
            family: void 0,
            address: void 0,
            port: C
          }), P;
        }
        closeEmptySessions(x = Number.POSITIVE_INFINITY) {
          let F = 0, { sessions: C } = this;
          for (let B in C) {
            let P = C[B];
            for (let k = 0; k < P.length; k++) {
              let M = P[k];
              if (M[l] === 0 && (F++, M.close(), F >= x))
                return F;
            }
          }
          return F;
        }
        destroy(x) {
          let { sessions: F, queue: C } = this;
          for (let B in F) {
            let P = F[B];
            for (let k = 0; k < P.length; k++)
              P[k].destroy(x);
          }
          for (let B in C) {
            let P = C[B];
            for (let k in P)
              P[k].destroyed = !0;
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
  }), mb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/incoming-message.js"(e, t) {
      "use strict";
      var { Readable: r } = require("stream"), i = class extends r {
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
  }), n1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/proxy-events.js"(e, t) {
      "use strict";
      t.exports = (r, i, s) => {
        for (let o of s)
          r.on(o, (...u) => i.emit(o, ...u));
      };
    }
  }), zs = H({
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
  }), s1 = H({
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
  }), gb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/validate-header-name.js"(e, t) {
      "use strict";
      var { ERR_INVALID_HTTP_TOKEN: r } = zs(), i = s1(), s = /^[\^`\-\w!#$%&*+.|~]+$/;
      t.exports = (o) => {
        if (typeof o != "string" || !s.test(o) && !i(o))
          throw new r("Header name", o);
      };
    }
  }), yb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/validate-header-value.js"(e, t) {
      "use strict";
      var {
        ERR_HTTP_INVALID_HEADER_VALUE: r,
        ERR_INVALID_CHAR: i
      } = zs(), s = /[^\t\u0020-\u007E\u0080-\u00FF]/;
      t.exports = (o, u) => {
        if (typeof u > "u")
          throw new r(u, o);
        if (s.test(u))
          throw new i("header content", o);
      };
    }
  }), o1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/proxy-socket-handler.js"(e, t) {
      "use strict";
      var { ERR_HTTP2_NO_SOCKET_MANIPULATION: r } = zs(), i = {
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
  }), bb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/client-request.js"(e, t) {
      "use strict";
      var { URL: r, urlToHttpOptions: i } = require("url"), s = require("http2"), { Writable: o } = require("stream"), { Agent: u, globalAgent: a } = Mr(),
      l = mb(), f = n1(), {
        ERR_INVALID_ARG_TYPE: p,
        ERR_INVALID_PROTOCOL: d,
        ERR_HTTP_HEADERS_SENT: c
      } = zs(), h = gb(), g = yb(), w = o1(), {
        HTTP2_HEADER_STATUS: y,
        HTTP2_HEADER_METHOD: _,
        HTTP2_HEADER_PATH: E,
        HTTP2_HEADER_AUTHORITY: v,
        HTTP2_METHOD_CONNECT: x
      } = s.constants, F = Symbol("headers"), C = Symbol("origin"), B = Symbol("session"), P = Symbol("options"), k = Symbol("flushedHeaders"),
      M = Symbol("jobs"), U = Symbol("pendingAgentPromise"), he = class extends o {
        static {
          n(this, "ClientRequest");
        }
        constructor(O, T, q) {
          if (super({
            autoDestroy: !1,
            emitClose: !1
          }), typeof O == "string" ? O = i(new r(O)) : O instanceof r ? O = i(O) : O = { ...O }, typeof T == "function" || T === void 0 ? (q =
          T, T = O) : T = Object.assign(O, T), T.h2session) {
            if (this[B] = T.h2session, this[B].destroyed)
              throw new Error("The session has been closed already");
            this.protocol = this[B].socket.encrypted ? "https:" : "http:";
          } else if (T.agent === !1)
            this.agent = new u({ maxEmptySessions: 0 });
          else if (typeof T.agent > "u" || T.agent === null)
            this.agent = a;
          else if (typeof T.agent.request == "function")
            this.agent = T.agent;
          else
            throw new p("options.agent", ["http2wrapper.Agent-like Object", "undefined", "false"], T.agent);
          if (this.agent && (this.protocol = this.agent.protocol), T.protocol && T.protocol !== this.protocol)
            throw new d(T.protocol, this.protocol);
          T.port || (T.port = T.defaultPort || this.agent && this.agent.defaultPort || 443), T.host = T.hostname || T.host || "localhost", delete T.
          hostname;
          let { timeout: ne } = T;
          T.timeout = void 0, this[F] = /* @__PURE__ */ Object.create(null), this[M] = [], this[U] = void 0, this.socket = null, this.connection =
          null, this.method = T.method || "GET", this.method === "CONNECT" && (T.path === "/" || T.path === void 0) || (this.path = T.path),
          this.res = null, this.aborted = !1, this.reusedSocket = !1;
          let { headers: W } = T;
          if (W)
            for (let ge in W)
              this.setHeader(ge, W[ge]);
          T.auth && !("authorization" in this[F]) && (this[F].authorization = "Basic " + Buffer.from(T.auth).toString("base64")), T.session =
          T.tlsSession, T.path = T.socketPath, this[P] = T, this[C] = new r(`${this.protocol}//${T.servername || T.host}:${T.port}`);
          let R = T._reuseSocket;
          R && (T.createConnection = (...ge) => R.destroyed ? this.agent.createConnection(...ge) : R, this.agent.getSession(this[C], this[P]).
          catch(() => {
          })), ne && this.setTimeout(ne), q && this.once("response", q), this[k] = !1;
        }
        get method() {
          return this[F][_];
        }
        set method(O) {
          O && (this[F][_] = O.toUpperCase());
        }
        get path() {
          let O = this.method === "CONNECT" ? v : E;
          return this[F][O];
        }
        set path(O) {
          if (O) {
            let T = this.method === "CONNECT" ? v : E;
            this[F][T] = O;
          }
        }
        get host() {
          return this[C].hostname;
        }
        set host(O) {
        }
        get _mustNotHaveABody() {
          return this.method === "GET" || this.method === "HEAD" || this.method === "DELETE";
        }
        _write(O, T, q) {
          if (this._mustNotHaveABody) {
            q(new Error("The GET, HEAD and DELETE methods must NOT have a body"));
            return;
          }
          this.flushHeaders();
          let ne = /* @__PURE__ */ n(() => this._request.write(O, T, q), "callWrite");
          this._request ? ne() : this[M].push(ne);
        }
        _final(O) {
          this.flushHeaders();
          let T = /* @__PURE__ */ n(() => {
            if (this._mustNotHaveABody || this.method === "CONNECT") {
              O();
              return;
            }
            this._request.end(O);
          }, "callEnd");
          this._request ? T() : this[M].push(T);
        }
        abort() {
          this.res && this.res.complete || (this.aborted || process.nextTick(() => this.emit("abort")), this.aborted = !0, this.destroy());
        }
        async _destroy(O, T) {
          this.res && this.res._dump(), this._request ? this._request.destroy() : process.nextTick(() => {
            this.emit("close");
          });
          try {
            await this[U];
          } catch (q) {
            this.aborted && (O = q);
          }
          T(O);
        }
        async flushHeaders() {
          if (this[k] || this.destroyed)
            return;
          this[k] = !0;
          let O = this.method === x, T = /* @__PURE__ */ n((q) => {
            if (this._request = q, this.destroyed) {
              q.destroy();
              return;
            }
            O || f(q, this, ["timeout", "continue"]), q.once("error", (W) => {
              this.destroy(W);
            }), q.once("aborted", () => {
              let { res: W } = this;
              W ? (W.aborted = !0, W.emit("aborted"), W.destroy()) : this.destroy(new Error("The server aborted the HTTP/2 stream"));
            });
            let ne = /* @__PURE__ */ n((W, R, ge) => {
              let L = new l(this.socket, q.readableHighWaterMark);
              this.res = L, L.url = `${this[C].origin}${this.path}`, L.req = this, L.statusCode = W[y], L.headers = W, L.rawHeaders = ge, L.
              once("end", () => {
                L.complete = !0, L.socket = null, L.connection = null;
              }), O ? (L.upgrade = !0, this.emit("connect", L, q, Buffer.alloc(0)) ? this.emit("close") : q.destroy()) : (q.on("data", (Ur) => {
                !L._dumped && !L.push(Ur) && q.pause();
              }), q.once("end", () => {
                this.aborted || L.push(null);
              }), this.emit("response", L) || L._dump());
            }, "onResponse");
            q.once("response", ne), q.once("headers", (W) => this.emit("information", { statusCode: W[y] })), q.once("trailers", (W, R, ge) => {
              let { res: L } = this;
              if (L === null) {
                ne(W, R, ge);
                return;
              }
              L.trailers = W, L.rawTrailers = ge;
            }), q.once("close", () => {
              let { aborted: W, res: R } = this;
              if (R) {
                W && (R.aborted = !0, R.emit("aborted"), R.destroy());
                let ge = /* @__PURE__ */ n(() => {
                  R.emit("close"), this.destroy(), this.emit("close");
                }, "finish");
                R.readable ? R.once("end", ge) : ge();
                return;
              }
              if (!this.destroyed) {
                this.destroy(new Error("The HTTP/2 stream has been early terminated")), this.emit("close");
                return;
              }
              this.destroy(), this.emit("close");
            }), this.socket = new Proxy(q, w);
            for (let W of this[M])
              W();
            this[M].length = 0, this.emit("socket", this.socket);
          }, "onStream");
          if (!(v in this[F]) && !O && (this[F][v] = this[C].host), this[B])
            try {
              T(this[B].request(this[F]));
            } catch (q) {
              this.destroy(q);
            }
          else {
            this.reusedSocket = !0;
            try {
              let q = this.agent.request(this[C], this[P], this[F]);
              this[U] = q, T(await q), this[U] = !1;
            } catch (q) {
              this[U] = !1, this.destroy(q);
            }
          }
        }
        get connection() {
          return this.socket;
        }
        set connection(O) {
          this.socket = O;
        }
        getHeaderNames() {
          return Object.keys(this[F]);
        }
        hasHeader(O) {
          if (typeof O != "string")
            throw new p("name", "string", O);
          return !!this[F][O.toLowerCase()];
        }
        getHeader(O) {
          if (typeof O != "string")
            throw new p("name", "string", O);
          return this[F][O.toLowerCase()];
        }
        get headersSent() {
          return this[k];
        }
        removeHeader(O) {
          if (typeof O != "string")
            throw new p("name", "string", O);
          if (this.headersSent)
            throw new c("remove");
          delete this[F][O.toLowerCase()];
        }
        setHeader(O, T) {
          if (this.headersSent)
            throw new c("set");
          h(O), g(O, T);
          let q = O.toLowerCase();
          if (q === "connection") {
            if (T.toLowerCase() === "keep-alive")
              return;
            throw new Error(`Invalid 'connection' header: ${T}`);
          }
          q === "host" && this.method === "CONNECT" ? this[F][v] = T : this[F][q] = T;
        }
        setNoDelay() {
        }
        setSocketKeepAlive() {
        }
        setTimeout(O, T) {
          let q = /* @__PURE__ */ n(() => this._request.setTimeout(O, T), "applyTimeout");
          return this._request ? q() : this[M].push(q), this;
        }
        get maxHeadersCount() {
          if (!this.destroyed && this._request)
            return this._request.session.localSettings.maxHeaderListSize;
        }
        set maxHeadersCount(O) {
        }
      };
      t.exports = he;
    }
  }), u1 = H({
    "node_modules/.pnpm/resolve-alpn@1.2.1/node_modules/resolve-alpn/index.js"(e, t) {
      "use strict";
      var r = require("tls");
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
  }), a1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/calculate-server-name.js"(e, t) {
      "use strict";
      var { isIP: r } = require("net"), i = require("assert"), s = /* @__PURE__ */ n((o) => {
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
  }), l1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/auto.js"(e, t) {
      "use strict";
      var { URL: r, urlToHttpOptions: i } = require("url"), s = require("http"), o = require("https"), u = u1(), a = pb(), { Agent: l, globalAgent: f } = Mr(),
      p = bb(), d = a1(), c = Db(), h = new a({ maxSize: 100 }), g = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ n((E, v, x) => {
        v._httpMessage = { shouldKeepAlive: !0 };
        let F = /* @__PURE__ */ n(() => {
          E.emit("free", v, x);
        }, "onFree");
        v.on("free", F);
        let C = /* @__PURE__ */ n(() => {
          E.removeSocket(v, x);
        }, "onClose");
        v.on("close", C);
        let B = /* @__PURE__ */ n(() => {
          let { freeSockets: k } = E;
          for (let M of Object.values(k))
            if (M.includes(v)) {
              v.destroy();
              return;
            }
        }, "onTimeout");
        v.on("timeout", B);
        let P = /* @__PURE__ */ n(() => {
          E.removeSocket(v, x), v.off("close", C), v.off("free", F), v.off("timeout", B), v.off("agentRemove", P);
        }, "onRemove");
        v.on("agentRemove", P), E.emit("free", v, x);
      }, "installSocket"), y = /* @__PURE__ */ n((E, v = /* @__PURE__ */ new Map(), x = void 0) => async (F) => {
        let C = `${F.host}:${F.port}:${F.ALPNProtocols.sort()}`;
        if (!E.has(C)) {
          if (v.has(C))
            return { alpnProtocol: (await v.get(C)).alpnProtocol };
          let { path: B } = F;
          F.path = F.socketPath;
          let P = u(F, x);
          v.set(C, P);
          try {
            let k = await P;
            return E.set(C, k.alpnProtocol), v.delete(C), F.path = B, k;
          } catch (k) {
            throw v.delete(C), F.path = B, k;
          }
        }
        return { alpnProtocol: E.get(C) };
      }, "createResolveProtocol"), _ = y(h, g);
      t.exports = async (E, v, x) => {
        if (typeof E == "string" ? E = i(new r(E)) : E instanceof r ? E = i(E) : E = { ...E }, typeof v == "function" || v === void 0 ? (x =
        v, v = E) : v = Object.assign(E, v), v.ALPNProtocols = v.ALPNProtocols || ["h2", "http/1.1"], !Array.isArray(v.ALPNProtocols) || v.ALPNProtocols.
        length === 0)
          throw new Error("The `ALPNProtocols` option must be an Array with at least one entry");
        v.protocol = v.protocol || "https:";
        let F = v.protocol === "https:";
        v.host = v.hostname || v.host || "localhost", v.session = v.tlsSession, v.servername = v.servername || d(v.headers && v.headers.host ||
        v.host), v.port = v.port || (F ? 443 : 80), v._defaultAgent = F ? o.globalAgent : s.globalAgent;
        let C = v.resolveProtocol || _, { agent: B } = v;
        if (B !== void 0 && B !== !1 && B.constructor.name !== "Object")
          throw new Error("The `options.agent` can be only an object `http`, `https` or `http2` properties");
        if (F) {
          v.resolveSocket = !0;
          let { socket: P, alpnProtocol: k, timeout: M } = await C(v);
          if (M) {
            P && P.destroy();
            let he = new Error(`Timed out resolving ALPN: ${v.timeout} ms`);
            throw he.code = "ETIMEDOUT", he.ms = v.timeout, he;
          }
          P && v.createConnection && (P.destroy(), P = void 0), delete v.resolveSocket;
          let U = k === "h2";
          if (B && (B = U ? B.http2 : B.https, v.agent = B), B === void 0 && (B = U ? f : o.globalAgent), P)
            if (B === !1)
              P.destroy();
            else {
              let he = (U ? l : o.Agent).prototype.createConnection;
              B.createConnection === he ? U ? v._reuseSocket = P : w(B, P, v) : P.destroy();
            }
          if (U)
            return c(new p(v, x));
        } else B && (v.agent = B.http);
        return c(s.request(v, x));
      }, t.exports.protocolCache = h, t.exports.resolveProtocol = _, t.exports.createResolveProtocol = y;
    }
  }), vb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/utils/js-stream-socket.js"(e, t) {
      "use strict";
      var r = require("stream"), i = require("tls"), s = new i.TLSSocket(new r.PassThrough())._handle._parentWrap.constructor;
      t.exports = s;
    }
  }), wb = H({
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
  }), f1 = H({
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
  }), _b = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/initialize.js"(e, t) {
      "use strict";
      var { URL: r } = require("url"), i = f1();
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
  }), xl = H({
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
  }), h1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h1-over-h2.js"(e, t) {
      "use strict";
      var r = require("tls"), i = require("http"), s = require("https"), o = vb(), { globalAgent: u } = Mr(), a = wb(), l = _b(), f = xl(), p = /* @__PURE__ */ n(
      (h, g, w) => {
        (async () => {
          try {
            let { proxyOptions: y } = h, { url: _, headers: E, raw: v } = y, x = await u.request(_, y, {
              ...f(h),
              ...E,
              ":method": "CONNECT",
              ":authority": `${g.host}:${g.port}`
            });
            x.once("error", w), x.once("response", (F) => {
              let C = F[":status"];
              if (C !== 200) {
                w(new a(C, ""));
                return;
              }
              let B = h instanceof s.Agent;
              if (v && B) {
                g.socket = x;
                let k = r.connect(g);
                k.once("close", () => {
                  x.destroy();
                }), w(null, k);
                return;
              }
              let P = new o(x);
              P.encrypted = !1, P._handle.getpeername = (k) => {
                k.family = void 0, k.address = void 0, k.port = void 0;
              }, w(null, P);
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
  }), Eb = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-hx.js"(e, t) {
      "use strict";
      var { Agent: r } = Mr(), i = vb(), s = wb(), o = _b(), u = class extends r {
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
  }), c1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-h2.js"(e, t) {
      "use strict";
      var { globalAgent: r } = Mr(), i = Eb(), s = xl(), o = /* @__PURE__ */ n((a) => new Promise((l, f) => {
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
  }), d1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/proxies/h2-over-h1.js"(e, t) {
      "use strict";
      var r = require("http"), i = require("https"), s = Eb(), o = xl(), u = /* @__PURE__ */ n((l) => new Promise((f, p) => {
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
  }), p1 = H({
    "node_modules/.pnpm/http2-wrapper@2.2.0/node_modules/http2-wrapper/source/index.js"(e, t) {
      "use strict";
      var r = require("http2"), {
        Agent: i,
        globalAgent: s
      } = Mr(), o = bb(), u = mb(), a = l1(), {
        HttpOverHttp2: l,
        HttpsOverHttp2: f
      } = h1(), p = c1(), {
        Http2OverHttp: d,
        Http2OverHttps: c
      } = d1(), h = gb(), g = yb(), w = /* @__PURE__ */ n((_, E, v) => new o(_, E, v), "request"), y = /* @__PURE__ */ n((_, E, v) => {
        let x = new o(_, E, v);
        return x.end(), x;
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
  }), Cb = {};
  J3(Cb, {
    default: /* @__PURE__ */ n(() => DT, "default")
  });
  Pb.exports = K3(Cb);
  var D1 = require("http"), m1 = require("https"), Fb = [
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
  function g1(e) {
    return Fb.includes(e);
  }
  n(g1, "isTypedArrayName");
  var y1 = [
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
    ...Fb
  ];
  function b1(e) {
    return y1.includes(e);
  }
  n(b1, "isObjectTypeName");
  var v1 = [
    "null",
    "undefined",
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol"
  ];
  function w1(e) {
    return v1.includes(e);
  }
  n(w1, "isPrimitiveTypeName");
  function jr(e) {
    return (t) => typeof t === e;
  }
  n(jr, "isOfType");
  var { toString: _1 } = Object.prototype, $i = /* @__PURE__ */ n((e) => {
    let t = _1.call(e).slice(8, -1);
    if (/HTML\w+Element/.test(t) && D.domElement(e))
      return "HTMLElement";
    if (b1(t))
      return t;
  }, "getObjectType"), J = /* @__PURE__ */ n((e) => (t) => $i(t) === e, "isObjectOfType");
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
    let t = $i(e);
    if (t)
      return t;
    if (e instanceof String || e instanceof Boolean || e instanceof Number)
      throw new TypeError("Please don't use object wrappers for primitive types");
    return "Object";
  }
  n(D, "is");
  D.undefined = jr("undefined");
  D.string = jr("string");
  var E1 = jr("number");
  D.number = (e) => E1(e) && !D.nan(e);
  D.bigint = jr("bigint");
  D.function_ = jr("function");
  D.null_ = (e) => e === null;
  D.class_ = (e) => D.function_(e) && e.toString().startsWith("class ");
  D.boolean = (e) => e === !0 || e === !1;
  D.symbol = jr("symbol");
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
  var C1 = /* @__PURE__ */ n((e) => D.function_(e?.then) && D.function_(e?.catch), "hasPromiseApi");
  D.promise = (e) => D.nativePromise(e) || C1(e);
  D.generatorFunction = J("GeneratorFunction");
  D.asyncGeneratorFunction = (e) => $i(e) === "AsyncGeneratorFunction";
  D.asyncFunction = (e) => $i(e) === "AsyncFunction";
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
  D.primitive = (e) => D.null_(e) || w1(typeof e);
  D.integer = (e) => Number.isInteger(e);
  D.safeInteger = (e) => Number.isSafeInteger(e);
  D.plainObject = (e) => {
    if (typeof e != "object" || e === null)
      return !1;
    let t = Object.getPrototypeOf(e);
    return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in
    e);
  };
  D.typedArray = (e) => g1($i(e));
  var F1 = /* @__PURE__ */ n((e) => D.safeInteger(e) && e >= 0, "isValidLength");
  D.arrayLike = (e) => !D.nullOrUndefined(e) && !D.function_(e) && F1(e.length);
  D.inRange = (e, t) => {
    if (D.number(t))
      return e >= Math.min(0, t) && e <= Math.max(t, 0);
    if (D.array(t) && t.length === 2)
      return e >= Math.min(...t) && e <= Math.max(...t);
    throw new TypeError(`Invalid range: ${JSON.stringify(t)}`);
  };
  var x1 = 1, S1 = [
    "innerHTML",
    "ownerDocument",
    "style",
    "attributes",
    "nodeValue"
  ];
  D.domElement = (e) => D.object(e) && e.nodeType === x1 && D.string(e.nodeName) && !D.plainObject(e) && S1.every((t) => t in e);
  D.observable = (e) => {
    var t, r;
    return e ? e === ((t = e[Symbol.observable]) == null ? void 0 : t.call(e)) || e === ((r = e["@@observable"]) == null ? void 0 : r.call(e)) :
    !1;
  };
  D.nodeStream = (e) => D.object(e) && D.function_(e.pipe) && !D.observable(e);
  D.infinite = (e) => e === Number.POSITIVE_INFINITY || e === Number.NEGATIVE_INFINITY;
  var xb = /* @__PURE__ */ n((e) => (t) => D.integer(t) && Math.abs(t % 2) === e, "isAbsoluteMod2");
  D.evenInteger = xb(0);
  D.oddInteger = xb(1);
  D.emptyArray = (e) => D.array(e) && e.length === 0;
  D.nonEmptyArray = (e) => D.array(e) && e.length > 0;
  D.emptyString = (e) => D.string(e) && e.length === 0;
  var A1 = /* @__PURE__ */ n((e) => D.string(e) && !/\S/.test(e), "isWhiteSpaceString");
  D.emptyStringOrWhitespace = (e) => D.emptyString(e) || A1(e);
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
  var Sb = /* @__PURE__ */ n((e, t, r) => {
    if (!D.function_(t))
      throw new TypeError(`Invalid predicate: ${JSON.stringify(t)}`);
    if (r.length === 0)
      throw new TypeError("Invalid number of values");
    return e.call(r, t);
  }, "predicateOnArray");
  D.any = (e, ...t) => (D.array(e) ? e : [e]).some((i) => Sb(Array.prototype.some, i, t));
  D.all = (e, ...t) => Sb(Array.prototype.every, e, t);
  var A = /* @__PURE__ */ n((e, t, r, i = {}) => {
    if (!e) {
      let { multipleValues: s } = i, o = s ? `received values of types ${[
        ...new Set(r.map((u) => `\`${D(u)}\``))
      ].join(", ")}` : `received value of type \`${D(r)}\``;
      throw new TypeError(`Expected value which is \`${t}\`, ${o}.`);
    }
  }, "assertType"), S = {
    // Unknowns.
    undefined: /* @__PURE__ */ n((e) => A(D.undefined(e), "undefined", e), "undefined"),
    string: /* @__PURE__ */ n((e) => A(D.string(e), "string", e), "string"),
    number: /* @__PURE__ */ n((e) => A(D.number(e), "number", e), "number"),
    bigint: /* @__PURE__ */ n((e) => A(D.bigint(e), "bigint", e), "bigint"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    function_: /* @__PURE__ */ n((e) => A(D.function_(e), "Function", e), "function_"),
    null_: /* @__PURE__ */ n((e) => A(D.null_(e), "null", e), "null_"),
    class_: /* @__PURE__ */ n((e) => A(D.class_(e), "Class", e), "class_"),
    boolean: /* @__PURE__ */ n((e) => A(D.boolean(e), "boolean", e), "boolean"),
    symbol: /* @__PURE__ */ n((e) => A(D.symbol(e), "symbol", e), "symbol"),
    numericString: /* @__PURE__ */ n((e) => A(D.numericString(e), "string with a number", e), "numericString"),
    array: /* @__PURE__ */ n((e, t) => {
      A(D.array(e), "Array", e), t && e.forEach(t);
    }, "array"),
    buffer: /* @__PURE__ */ n((e) => A(D.buffer(e), "Buffer", e), "buffer"),
    blob: /* @__PURE__ */ n((e) => A(D.blob(e), "Blob", e), "blob"),
    nullOrUndefined: /* @__PURE__ */ n((e) => A(D.nullOrUndefined(e), "null or undefined", e), "nullOrUndefined"),
    object: /* @__PURE__ */ n((e) => A(D.object(e), "Object", e), "object"),
    iterable: /* @__PURE__ */ n((e) => A(D.iterable(e), "Iterable", e), "iterable"),
    asyncIterable: /* @__PURE__ */ n((e) => A(D.asyncIterable(e), "AsyncIterable", e), "asyncIterable"),
    generator: /* @__PURE__ */ n((e) => A(D.generator(e), "Generator", e), "generator"),
    asyncGenerator: /* @__PURE__ */ n((e) => A(D.asyncGenerator(e), "AsyncGenerator", e), "asyncGenerator"),
    nativePromise: /* @__PURE__ */ n((e) => A(D.nativePromise(e), "native Promise", e), "nativePromise"),
    promise: /* @__PURE__ */ n((e) => A(D.promise(e), "Promise", e), "promise"),
    generatorFunction: /* @__PURE__ */ n((e) => A(D.generatorFunction(e), "GeneratorFunction", e), "generatorFunction"),
    asyncGeneratorFunction: /* @__PURE__ */ n((e) => A(D.asyncGeneratorFunction(e), "AsyncGeneratorFunction", e), "asyncGeneratorFunction"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    asyncFunction: /* @__PURE__ */ n((e) => A(D.asyncFunction(e), "AsyncFunction", e), "asyncFunction"),
    // eslint-disable-next-line @typescript-eslint/ban-types
    boundFunction: /* @__PURE__ */ n((e) => A(D.boundFunction(e), "Function", e), "boundFunction"),
    regExp: /* @__PURE__ */ n((e) => A(D.regExp(e), "RegExp", e), "regExp"),
    date: /* @__PURE__ */ n((e) => A(D.date(e), "Date", e), "date"),
    error: /* @__PURE__ */ n((e) => A(D.error(e), "Error", e), "error"),
    map: /* @__PURE__ */ n((e) => A(D.map(e), "Map", e), "map"),
    set: /* @__PURE__ */ n((e) => A(D.set(e), "Set", e), "set"),
    weakMap: /* @__PURE__ */ n((e) => A(D.weakMap(e), "WeakMap", e), "weakMap"),
    weakSet: /* @__PURE__ */ n((e) => A(D.weakSet(e), "WeakSet", e), "weakSet"),
    weakRef: /* @__PURE__ */ n((e) => A(D.weakRef(e), "WeakRef", e), "weakRef"),
    int8Array: /* @__PURE__ */ n((e) => A(D.int8Array(e), "Int8Array", e), "int8Array"),
    uint8Array: /* @__PURE__ */ n((e) => A(D.uint8Array(e), "Uint8Array", e), "uint8Array"),
    uint8ClampedArray: /* @__PURE__ */ n((e) => A(D.uint8ClampedArray(e), "Uint8ClampedArray", e), "uint8ClampedArray"),
    int16Array: /* @__PURE__ */ n((e) => A(D.int16Array(e), "Int16Array", e), "int16Array"),
    uint16Array: /* @__PURE__ */ n((e) => A(D.uint16Array(e), "Uint16Array", e), "uint16Array"),
    int32Array: /* @__PURE__ */ n((e) => A(D.int32Array(e), "Int32Array", e), "int32Array"),
    uint32Array: /* @__PURE__ */ n((e) => A(D.uint32Array(e), "Uint32Array", e), "uint32Array"),
    float32Array: /* @__PURE__ */ n((e) => A(D.float32Array(e), "Float32Array", e), "float32Array"),
    float64Array: /* @__PURE__ */ n((e) => A(D.float64Array(e), "Float64Array", e), "float64Array"),
    bigInt64Array: /* @__PURE__ */ n((e) => A(D.bigInt64Array(e), "BigInt64Array", e), "bigInt64Array"),
    bigUint64Array: /* @__PURE__ */ n((e) => A(D.bigUint64Array(e), "BigUint64Array", e), "bigUint64Array"),
    arrayBuffer: /* @__PURE__ */ n((e) => A(D.arrayBuffer(e), "ArrayBuffer", e), "arrayBuffer"),
    sharedArrayBuffer: /* @__PURE__ */ n((e) => A(D.sharedArrayBuffer(e), "SharedArrayBuffer", e), "sharedArrayBuffer"),
    dataView: /* @__PURE__ */ n((e) => A(D.dataView(e), "DataView", e), "dataView"),
    enumCase: /* @__PURE__ */ n((e, t) => A(D.enumCase(e, t), "EnumCase", e), "enumCase"),
    urlInstance: /* @__PURE__ */ n((e) => A(D.urlInstance(e), "URL", e), "urlInstance"),
    urlString: /* @__PURE__ */ n((e) => A(D.urlString(e), "string with a URL", e), "urlString"),
    truthy: /* @__PURE__ */ n((e) => A(D.truthy(e), "truthy", e), "truthy"),
    falsy: /* @__PURE__ */ n((e) => A(D.falsy(e), "falsy", e), "falsy"),
    nan: /* @__PURE__ */ n((e) => A(D.nan(e), "NaN", e), "nan"),
    primitive: /* @__PURE__ */ n((e) => A(D.primitive(e), "primitive", e), "primitive"),
    integer: /* @__PURE__ */ n((e) => A(D.integer(e), "integer", e), "integer"),
    safeInteger: /* @__PURE__ */ n((e) => A(D.safeInteger(e), "integer", e), "safeInteger"),
    plainObject: /* @__PURE__ */ n((e) => A(D.plainObject(e), "plain object", e), "plainObject"),
    typedArray: /* @__PURE__ */ n((e) => A(D.typedArray(e), "TypedArray", e), "typedArray"),
    arrayLike: /* @__PURE__ */ n((e) => A(D.arrayLike(e), "array-like", e), "arrayLike"),
    domElement: /* @__PURE__ */ n((e) => A(D.domElement(e), "HTMLElement", e), "domElement"),
    observable: /* @__PURE__ */ n((e) => A(D.observable(e), "Observable", e), "observable"),
    nodeStream: /* @__PURE__ */ n((e) => A(D.nodeStream(e), "Node.js Stream", e), "nodeStream"),
    infinite: /* @__PURE__ */ n((e) => A(D.infinite(e), "infinite number", e), "infinite"),
    emptyArray: /* @__PURE__ */ n((e) => A(D.emptyArray(e), "empty array", e), "emptyArray"),
    nonEmptyArray: /* @__PURE__ */ n((e) => A(D.nonEmptyArray(e), "non-empty array", e), "nonEmptyArray"),
    emptyString: /* @__PURE__ */ n((e) => A(D.emptyString(e), "empty string", e), "emptyString"),
    emptyStringOrWhitespace: /* @__PURE__ */ n((e) => A(D.emptyStringOrWhitespace(e), "empty string or whitespace", e), "emptyStringOrWhites\
pace"),
    nonEmptyString: /* @__PURE__ */ n((e) => A(D.nonEmptyString(e), "non-empty string", e), "nonEmptyString"),
    nonEmptyStringAndNotWhitespace: /* @__PURE__ */ n((e) => A(D.nonEmptyStringAndNotWhitespace(e), "non-empty string and not whitespace", e),
    "nonEmptyStringAndNotWhitespace"),
    emptyObject: /* @__PURE__ */ n((e) => A(D.emptyObject(e), "empty object", e), "emptyObject"),
    nonEmptyObject: /* @__PURE__ */ n((e) => A(D.nonEmptyObject(e), "non-empty object", e), "nonEmptyObject"),
    emptySet: /* @__PURE__ */ n((e) => A(D.emptySet(e), "empty set", e), "emptySet"),
    nonEmptySet: /* @__PURE__ */ n((e) => A(D.nonEmptySet(e), "non-empty set", e), "nonEmptySet"),
    emptyMap: /* @__PURE__ */ n((e) => A(D.emptyMap(e), "empty map", e), "emptyMap"),
    nonEmptyMap: /* @__PURE__ */ n((e) => A(D.nonEmptyMap(e), "non-empty map", e), "nonEmptyMap"),
    propertyKey: /* @__PURE__ */ n((e) => A(D.propertyKey(e), "PropertyKey", e), "propertyKey"),
    formData: /* @__PURE__ */ n((e) => A(D.formData(e), "FormData", e), "formData"),
    urlSearchParams: /* @__PURE__ */ n((e) => A(D.urlSearchParams(e), "URLSearchParams", e), "urlSearchParams"),
    // Numbers.
    evenInteger: /* @__PURE__ */ n((e) => A(D.evenInteger(e), "even integer", e), "evenInteger"),
    oddInteger: /* @__PURE__ */ n((e) => A(D.oddInteger(e), "odd integer", e), "oddInteger"),
    // Two arguments.
    directInstanceOf: /* @__PURE__ */ n((e, t) => A(D.directInstanceOf(e, t), "T", e), "directInstanceOf"),
    inRange: /* @__PURE__ */ n((e, t) => A(D.inRange(e, t), "in range", e), "inRange"),
    // Variadic functions.
    any: /* @__PURE__ */ n((e, ...t) => A(D.any(e, ...t), "predicate returns truthy for any value", t, { multipleValues: !0 }), "any"),
    all: /* @__PURE__ */ n((e, ...t) => A(D.all(e, ...t), "predicate returns truthy for all values", t, { multipleValues: !0 }), "all")
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
  Object.defineProperties(S, {
    class: {
      value: S.class_
    },
    function: {
      value: S.function_
    },
    null: {
      value: S.null_
    }
  });
  var m = D, T1 = require("events"), R1 = class extends Error {
    static {
      n(this, "CancelError");
    }
    constructor(e) {
      super(e || "Promise was canceled"), this.name = "CancelError";
    }
    get isCanceled() {
      return !0;
    }
  }, Sl = class {
    static {
      n(this, "PCancelable");
    }
    static fn(e) {
      return (...t) => new Sl((r, i, s) => {
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
        this._rejectOnCancel && this._reject(new R1(e));
      }
    }
    get isCanceled() {
      return this._isCanceled;
    }
  };
  Object.setPrototypeOf(Sl.prototype, Promise.prototype);
  function B1(e) {
    return m.object(e) && "_onResponse" in e;
  }
  n(B1, "isRequest");
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
      t.input, B1(r) ? (Object.defineProperty(this, "request", {
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
  }, k1 = class extends ye {
    static {
      n(this, "MaxRedirectsError");
    }
    constructor(e) {
      super(`Redirected ${e.options.maxRedirects} times. Aborting.`, {}, e), this.name = "MaxRedirectsError", this.code = "ERR_TOO_MANY_REDI\
RECTS";
    }
  }, Hs = class extends ye {
    static {
      n(this, "HTTPError");
    }
    constructor(e) {
      super(`Response code ${e.statusCode} (${e.statusMessage})`, {}, e.request), this.name = "HTTPError", this.code = "ERR_NON_2XX_3XX_RESP\
ONSE";
    }
  }, O1 = class extends ye {
    static {
      n(this, "CacheError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "CacheError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_CACHE_ACCESS" : this.code;
    }
  }, Uy = class extends ye {
    static {
      n(this, "UploadError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "UploadError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_UPLOAD" : this.code;
    }
  }, P1 = class extends ye {
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
  }, Hy = class extends ye {
    static {
      n(this, "ReadError");
    }
    constructor(e, t) {
      super(e.message, e, t), this.name = "ReadError", this.code = this.code === "ERR_GOT_REQUEST_ERROR" ? "ERR_READING_RESPONSE_STREAM" : this.
      code;
    }
  }, q1 = class extends ye {
    static {
      n(this, "RetryError");
    }
    constructor(e) {
      super("Retrying", {}, e), this.name = "RetryError", this.code = "ERR_RETRYING";
    }
  }, M1 = class extends ye {
    static {
      n(this, "AbortError");
    }
    constructor(e) {
      super("This operation was aborted.", {}, e), this.code = "ERR_ABORTED", this.name = "AbortError";
    }
  }, Ab = me(require("process"), 1), Dl = require("buffer"), j1 = require("stream"), Wy = require("url"), ml = me(require("http"), 1), I1 = require("events"),
  L1 = require("util"), N1 = me(X3(), 1), U1 = /* @__PURE__ */ n((e) => {
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
      u.once(I1.errorMonitor, () => {
        t.error = Date.now(), t.phases.total = t.error - t.start;
      });
    }, "handleError");
    r(e);
    let i = /* @__PURE__ */ n(() => {
      t.abort = Date.now(), t.phases.total = t.abort - t.start;
    }, "onAbort");
    e.prependOnceListener("abort", i);
    let s = /* @__PURE__ */ n((u) => {
      if (t.socket = Date.now(), t.phases.wait = t.socket - t.start, L1.types.isProxy(u))
        return;
      let a = /* @__PURE__ */ n(() => {
        t.lookup = Date.now(), t.phases.dns = t.lookup - t.socket;
      }, "lookupListener");
      u.prependOnceListener("lookup", a), (0, N1.default)(u, {
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
  }, "timer"), H1 = U1, W1 = me(require("events"), 1), Ps = me(require("url"), 1), $1 = me(require("crypto"), 1), Tb = me(require("stream"),
  1), z1 = "text/plain", V1 = "us-ascii", gl = /* @__PURE__ */ n((e, t) => t.some((r) => r instanceof RegExp ? r.test(e) : r === e), "testPa\
rameter"), G1 = /* @__PURE__ */ new Set([
    "https:",
    "http:",
    "file:"
  ]), Y1 = /* @__PURE__ */ n((e) => {
    try {
      let { protocol: t } = new URL(e);
      return t.endsWith(":") && !G1.has(t);
    } catch {
      return !1;
    }
  }, "hasCustomProtocol"), J1 = /* @__PURE__ */ n((e, { stripHash: t }) => {
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
        return h === "charset" && (g = g.toLowerCase(), g === V1) ? "" : `${h}${g ? `=${g}` : ""}`;
      }).filter(Boolean)
    ];
    return l && d.push("base64"), (d.length > 0 || f && f !== z1) && d.unshift(f), `data:${d.join(";")},${l ? o.trim() : o}${u ? `#${u}` : ""}`;
  }, "normalizeDataURL");
  function K1(e, t) {
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
      return J1(e, t);
    if (Y1(e))
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
      gl(a, t.removeDirectoryIndex) && (u = u.slice(0, -1), s.pathname = u.slice(1).join("/") + "/");
    }
    if (s.hostname && (s.hostname = s.hostname.replace(/\.$/, ""), t.stripWWW && /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(s.
    hostname) && (s.hostname = s.hostname.replace(/^www\./, ""))), Array.isArray(t.removeQueryParameters))
      for (let u of [...s.searchParams.keys()])
        gl(u, t.removeQueryParameters) && s.searchParams.delete(u);
    if (!Array.isArray(t.keepQueryParameters) && t.removeQueryParameters === !0 && (s.search = ""), Array.isArray(t.keepQueryParameters) && t.
    keepQueryParameters.length > 0)
      for (let u of [...s.searchParams.keys()])
        gl(u, t.keepQueryParameters) || s.searchParams.delete(u);
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
  n(K1, "normalizeUrl");
  var X1 = me(db(), 1), yl = me(Z3(), 1), Q1 = require("stream");
  function Fl(e) {
    return Object.fromEntries(Object.entries(e).map(([t, r]) => [t.toLowerCase(), r]));
  }
  n(Fl, "lowercaseKeys");
  var $y = class extends Q1.Readable {
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
      }), this.statusCode = e, this.headers = Fl(t), this.body = r, this.url = i;
    }
  }, qs = me(t1(), 1), Z1 = [
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
  function eA(e, t) {
    if (t._readableState.autoDestroy)
      throw new Error("The second stream must have the `autoDestroy` option set to `false`");
    let r = /* @__PURE__ */ new Set([...Object.keys(e), ...Z1]), i = {};
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
  n(eA, "mimicResponse");
  var tA = class extends Error {
    static {
      n(this, "RequestError2");
    }
    constructor(e) {
      super(e.message), Object.assign(this, e);
    }
  }, Wi = class extends Error {
    static {
      n(this, "CacheError2");
    }
    constructor(e) {
      super(e.message), Object.assign(this, e);
    }
  }, rA = class {
    static {
      n(this, "CacheableRequest");
    }
    constructor(e, t) {
      this.hooks = /* @__PURE__ */ new Map(), this.request = () => (r, i) => {
        let s;
        if (typeof r == "string")
          s = bl(Ps.default.parse(r)), r = {};
        else if (r instanceof Ps.default.URL)
          s = bl(Ps.default.parse(r.toString())), r = {};
        else {
          let [d, ...c] = (r.path ?? "").split("?"), h = c.length > 0 ? `?${c.join("?")}` : "";
          s = bl({ ...r, pathname: d, search: h });
        }
        r = {
          headers: {},
          method: "GET",
          cache: !0,
          strictTtl: !1,
          automaticFailover: !1,
          ...r,
          ...sA(s)
        }, r.headers = Object.fromEntries(iA(r.headers).map(([d, c]) => [d.toLowerCase(), c]));
        let o = new W1.default(), u = K1(Ps.default.format(s), {
          stripWWW: !1,
          removeTrailingSlash: !1,
          stripAuthentication: !1
        }), a = `${r.method}:${u}`;
        r.body && r.method !== void 0 && ["POST", "PATCH", "PUT"].includes(r.method) && (r.body instanceof Tb.default.Readable ? r.cache = !1 :
        a += `:${$1.default.createHash("md5").update(r.body).digest("hex")}`);
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
              let E = yl.default.fromObject(l.cachePolicy).revalidatedPolicy(d, y);
              if (!E.modified) {
                y.resume(), await new Promise((x) => {
                  y.once("end", x);
                });
                let v = zy(E.policy.responseHeaders());
                y = new $y({ statusCode: l.statusCode, headers: v, body: l.body, url: l.url }), y.cachePolicy = E.policy, y.fromCache = !0;
              }
            }
            y.fromCache || (y.cachePolicy = new yl.default(d, y, d), y.fromCache = !1);
            let _;
            d.cache && y.cachePolicy.storable() ? (_ = nA(y), (async () => {
              try {
                let E = X1.default.buffer(y);
                await Promise.race([
                  g,
                  new Promise((C) => y.once("end", C)),
                  new Promise((C) => y.once("close", C))
                  // eslint-disable-line no-promise-executor-return
                ]);
                let v = await E, x = {
                  url: y.url,
                  statusCode: y.fromCache ? l.statusCode : y.statusCode,
                  body: v,
                  cachePolicy: y.cachePolicy.toObject()
                }, F = d.strictTtl ? y.cachePolicy.timeToLive() : void 0;
                if (d.maxTtl && (F = F ? Math.min(F, d.maxTtl) : d.maxTtl), this.hooks.size > 0)
                  for (let C of this.hooks.keys())
                    x = await this.runHook(C, x, y);
                await this.cache.set(a, x, F);
              } catch (E) {
                o.emit("error", new Wi(E));
              }
            })()) : d.cache && l && (async () => {
              try {
                await this.cache.delete(a);
              } catch (E) {
                o.emit("error", new Wi(E));
              }
            })(), o.emit("response", _ ?? y), typeof i == "function" && i(_ ?? y);
          }, "handler");
          try {
            let y = this.cacheRequest(d, w);
            y.once("error", h), y.once("abort", h), y.once("destroy", h), o.emit("request", y);
          } catch (y) {
            o.emit("error", new tA(y));
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
            let w = yl.default.fromObject(g.cachePolicy);
            if (w.satisfiesWithoutRevalidation(h) && !h.forceRefresh) {
              let y = zy(w.responseHeaders()), _ = new $y({ statusCode: g.statusCode, headers: y, body: g.body, url: g.url });
              _.cachePolicy = w, _.fromCache = !0, o.emit("response", _), typeof i == "function" && i(_);
            } else w.satisfiesWithoutRevalidation(h) && Date.now() >= w.timeToLive() && h.forceRefresh ? (await this.cache.delete(a), h.headers =
            w.revalidationHeaders(h), p(h)) : (l = g, h.headers = w.revalidationHeaders(h), p(h));
          }, "get"), c = /* @__PURE__ */ n((h) => o.emit("error", new Wi(h)), "errorHandler");
          if (this.cache instanceof qs.default) {
            let h = this.cache;
            h.once("error", c), o.on("error", () => h.removeListener("error", c)), o.on("response", () => h.removeListener("error", c));
          }
          try {
            await d(r);
          } catch (h) {
            r.automaticFailover && !f && p(r), o.emit("error", new Wi(h));
          }
        })(), o;
      }, this.addHook = (r, i) => {
        this.hooks.has(r) || this.hooks.set(r, i);
      }, this.removeHook = (r) => this.hooks.delete(r), this.getHook = (r) => this.hooks.get(r), this.runHook = async (r, ...i) => {
        var s;
        return (s = this.hooks.get(r)) == null ? void 0 : s(...i);
      }, t instanceof qs.default ? this.cache = t : typeof t == "string" ? this.cache = new qs.default({
        uri: t,
        namespace: "cacheable-request"
      }) : this.cache = new qs.default({
        store: t,
        namespace: "cacheable-request"
      }), this.request = this.request.bind(this), this.cacheRequest = e;
    }
  }, iA = Object.entries, nA = /* @__PURE__ */ n((e) => {
    let t = new Tb.PassThrough({ autoDestroy: !1 });
    return eA(e, t), e.pipe(t);
  }, "cloneResponse"), sA = /* @__PURE__ */ n((e) => {
    let t = { ...e };
    return t.path = `${e.pathname || "/"}${e.search || ""}`, delete t.pathname, delete t.search, t;
  }, "urlObjectToRequestOptions"), bl = /* @__PURE__ */ n((e) => (
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
  ), "normalizeUrlObject"), zy = /* @__PURE__ */ n((e) => {
    let t = [];
    for (let r of Object.keys(e))
      t[r.toLowerCase()] = e[r];
    return t;
  }, "convertHeaders"), oA = rA, uA = me(i1(), 1), aA = me(db(), 1), bt = /* @__PURE__ */ n((e) => typeof e == "function", "isFunction"), lA = /* @__PURE__ */ n(
  (e) => bt(e[Symbol.asyncIterator]), "isAsyncIterable");
  async function* fA(e) {
    let t = e.getReader();
    for (; ; ) {
      let { done: r, value: i } = await t.read();
      if (r)
        break;
      yield i;
    }
  }
  n(fA, "readStream");
  var hA = /* @__PURE__ */ n((e) => {
    if (lA(e))
      return e;
    if (bt(e.getReader))
      return fA(e);
    throw new TypeError("Unsupported data source: Expected either ReadableStream or async iterable.");
  }, "getStreamIterator"), Vy = "abcdefghijklmnopqrstuvwxyz0123456789";
  function cA() {
    let e = 16, t = "";
    for (; e--; )
      t += Vy[Math.random() * Vy.length << 0];
    return t;
  }
  n(cA, "createBoundary");
  var Gy = /* @__PURE__ */ n((e) => String(e).replace(/\r|\n/g, (t, r, i) => t === "\r" && i[r + 1] !== `
` || t === `
` && i[r - 1] !== "\r" ? `\r
` : t), "normalizeValue"), dA = /* @__PURE__ */ n((e) => Object.prototype.toString.call(e).slice(8, -1).toLowerCase(), "getType");
  function Yy(e) {
    if (dA(e) !== "object")
      return !1;
    let t = Object.getPrototypeOf(e);
    return t == null ? !0 : (t.constructor && t.constructor.toString()) === Object.toString();
  }
  n(Yy, "isPlainObject");
  function Jy(e, t) {
    if (typeof t == "string") {
      for (let [r, i] of Object.entries(e))
        if (t.toLowerCase() === r.toLowerCase())
          return i;
    }
  }
  n(Jy, "getProperty");
  var pA = /* @__PURE__ */ n((e) => new Proxy(e, {
    get: /* @__PURE__ */ n((t, r) => Jy(t, r), "get"),
    has: /* @__PURE__ */ n((t, r) => Jy(t, r) !== void 0, "has")
  }), "proxyHeaders"), Al = /* @__PURE__ */ n((e) => !!(e && bt(e.constructor) && e[Symbol.toStringTag] === "FormData" && bt(e.append) && bt(
  e.getAll) && bt(e.entries) && bt(e[Symbol.iterator])), "isFormData"), Ky = /* @__PURE__ */ n((e) => String(e).replace(/\r/g, "%0D").replace(
  /\n/g, "%0A").replace(/"/g, "%22"), "escapeName"), Kt = /* @__PURE__ */ n((e) => !!(e && typeof e == "object" && bt(e.constructor) && e[Symbol.
  toStringTag] === "File" && bt(e.stream) && e.name != null), "isFile"), ji = /* @__PURE__ */ n(function(e, t, r, i, s) {
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
  }, "__classPrivateFieldGet"), Ii, Ot, Li, Ms, Ni, Xt, Ui, Hi, js, vl, Xy, DA = {
    enableAdditionalHeaders: !1
  }, Is = { writable: !1, configurable: !1 }, mA = class {
    static {
      n(this, "FormDataEncoder");
    }
    constructor(e, t, r) {
      if (Ii.add(this), Ot.set(this, `\r
`), Li.set(this, void 0), Ms.set(this, void 0), Ni.set(this, "-".repeat(2)), Xt.set(this, new TextEncoder()), Ui.set(this, void 0), Hi.set(this,
      void 0), js.set(this, void 0), !Al(e))
        throw new TypeError("Expected first argument to be a FormData instance.");
      let i;
      if (Yy(t) ? r = t : i = t, i || (i = cA()), typeof i != "string")
        throw new TypeError("Expected boundary argument to be a string.");
      if (r && !Yy(r))
        throw new TypeError("Expected options argument to be an object.");
      ji(this, Hi, Array.from(e.entries()), "f"), ji(this, js, { ...DA, ...r }, "f"), ji(this, Li, ie(this, Xt, "f").encode(ie(this, Ot, "f")),
      "f"), ji(this, Ms, ie(this, Li, "f").byteLength, "f"), this.boundary = `form-data-boundary-${i}`, this.contentType = `multipart/form-d\
ata; boundary=${this.boundary}`, ji(this, Ui, ie(this, Xt, "f").encode(`${ie(this, Ni, "f")}${this.boundary}${ie(this, Ni, "f")}${ie(this, Ot,
      "f").repeat(2)}`), "f");
      let s = {
        "Content-Type": this.contentType
      }, o = ie(this, Ii, "m", Xy).call(this);
      o && (this.contentLength = o, s["Content-Length"] = o), this.headers = pA(Object.freeze(s)), Object.defineProperties(this, {
        boundary: Is,
        contentType: Is,
        contentLength: Is,
        headers: Is
      });
    }
    getContentLength() {
      return this.contentLength == null ? void 0 : Number(this.contentLength);
    }
    *values() {
      for (let [e, t] of ie(this, Hi, "f")) {
        let r = Kt(t) ? t : ie(this, Xt, "f").encode(Gy(t));
        yield ie(this, Ii, "m", vl).call(this, e, r), yield r, yield ie(this, Li, "f");
      }
      yield ie(this, Ui, "f");
    }
    async *encode() {
      for (let e of this.values())
        Kt(e) ? yield* hA(e.stream()) : yield e;
    }
    [(Ot = /* @__PURE__ */ new WeakMap(), Li = /* @__PURE__ */ new WeakMap(), Ms = /* @__PURE__ */ new WeakMap(), Ni = /* @__PURE__ */ new WeakMap(),
    Xt = /* @__PURE__ */ new WeakMap(), Ui = /* @__PURE__ */ new WeakMap(), Hi = /* @__PURE__ */ new WeakMap(), js = /* @__PURE__ */ new WeakMap(),
    Ii = /* @__PURE__ */ new WeakSet(), vl = /* @__PURE__ */ n(function(t, r) {
      let i = "";
      i += `${ie(this, Ni, "f")}${this.boundary}${ie(this, Ot, "f")}`, i += `Content-Disposition: form-data; name="${Ky(t)}"`, Kt(r) && (i +=
      `; filename="${Ky(r.name)}"${ie(this, Ot, "f")}`, i += `Content-Type: ${r.type || "application/octet-stream"}`);
      let s = Kt(r) ? r.size : r.byteLength;
      return ie(this, js, "f").enableAdditionalHeaders === !0 && s != null && !isNaN(s) && (i += `${ie(this, Ot, "f")}Content-Length: ${Kt(r) ?
      r.size : r.byteLength}`), ie(this, Xt, "f").encode(`${i}${ie(this, Ot, "f").repeat(2)}`);
    }, "_FormDataEncoder_getFieldHeader2"), Xy = /* @__PURE__ */ n(function() {
      let t = 0;
      for (let [r, i] of ie(this, Hi, "f")) {
        let s = Kt(i) ? i : ie(this, Xt, "f").encode(Gy(i)), o = Kt(s) ? s.size : s.byteLength;
        if (o == null || isNaN(o))
          return;
        t += ie(this, Ii, "m", vl).call(this, r, s).byteLength, t += o, t += ie(this, Ms, "f");
      }
      return String(t + ie(this, Ui, "f").byteLength);
    }, "_FormDataEncoder_getContentLength2"), Symbol.iterator)]() {
      return this.values();
    }
    [Symbol.asyncIterator]() {
      return this.encode();
    }
  }, gA = require("buffer"), yA = require("util");
  function Rb(e) {
    return m.nodeStream(e) && m.function_(e.getBoundary);
  }
  n(Rb, "isFormData2");
  async function bA(e, t) {
    if (t && "content-length" in t)
      return Number(t["content-length"]);
    if (!e)
      return 0;
    if (m.string(e))
      return gA.Buffer.byteLength(e);
    if (m.buffer(e))
      return e.length;
    if (Rb(e))
      return (0, yA.promisify)(e.getLength.bind(e))();
  }
  n(bA, "getBodySize");
  function Bb(e, t, r) {
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
  n(Bb, "proxyEvents");
  var vA = me(require("net"), 1);
  function wA() {
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
  n(wA, "unhandle");
  var Qy = Symbol("reentry"), _A = /* @__PURE__ */ n(() => {
  }, "noop"), kb = class extends Error {
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
  function EA(e, t, r) {
    if (Qy in e)
      return _A;
    e[Qy] = !0;
    let i = [], { once: s, unhandleAll: o } = wA(), u = /* @__PURE__ */ n((w, y, _) => {
      var E;
      let v = setTimeout(y, w, w, _);
      (E = v.unref) == null || E.call(v);
      let x = /* @__PURE__ */ n(() => {
        clearTimeout(v);
      }, "cancel");
      return i.push(x), x;
    }, "addTimeout"), { host: a, hostname: l } = r, f = /* @__PURE__ */ n((w, y) => {
      e.destroy(new kb(w, y));
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
        let _ = !!(y ?? vA.default.isIP(l ?? a ?? "") !== 0);
        if (d && !_ && typeof w.address().address > "u") {
          let E = u(t.lookup, f, "lookup");
          s(w, "lookup", E);
        }
        if (c) {
          let E = /* @__PURE__ */ n(() => u(t.connect, f, "connect"), "timeConnect");
          _ ? s(w, "connect", E()) : s(w, "lookup", (v) => {
            v === null && s(w, "connect", E());
          });
        }
        h && r.protocol === "https:" && s(w, "connect", () => {
          let E = u(t.secureConnect, f, "secureConnect");
          s(w, "secureConnect", E);
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
  n(EA, "timedOut");
  function CA(e) {
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
  n(CA, "urlToOptions");
  var FA = class {
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
  }, xA = /* @__PURE__ */ n(({ attemptCount: e, retryOptions: t, error: r, retryAfter: i, computedValue: s }) => {
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
  }, "calculateRetryDelay"), SA = xA, AA = me(require("process"), 1), wl = require("util"), Qt = require("url"), TA = require("tls"), RA = me(
  require("http"), 1), BA = me(require("https"), 1), qr = require("dns"), _l = require("util"), kA = me(require("os"), 1), { Resolver: Zy } = qr.
  promises, Pr = Symbol("cacheableLookupCreateConnection"), El = Symbol("cacheableLookupInstance"), eb = Symbol("expires"), OA = typeof qr.ALL ==
  "number", tb = /* @__PURE__ */ n((e) => {
    if (!(e && typeof e.createConnection == "function"))
      throw new Error("Expected an Agent instance as the first argument");
  }, "verifyAgent"), PA = /* @__PURE__ */ n((e) => {
    for (let t of e)
      t.family !== 6 && (t.address = `::ffff:${t.address}`, t.family = 6);
  }, "map4to6"), rb = /* @__PURE__ */ n(() => {
    let e = !1, t = !1;
    for (let r of Object.values(kA.default.networkInterfaces()))
      for (let i of r)
        if (!i.internal && (i.family === "IPv6" ? t = !0 : e = !0, e && t))
          return { has4: e, has6: t };
    return { has4: e, has6: t };
  }, "getIfaceInfo"), qA = /* @__PURE__ */ n((e) => Symbol.iterator in e, "isIterable"), Ls = /* @__PURE__ */ n((e) => e.catch((t) => {
    if (t.code === "ENODATA" || t.code === "ENOTFOUND" || t.code === "ENOENT")
      return [];
    throw t;
  }), "ignoreNoResultErrors"), ib = { ttl: !0 }, MA = { all: !0 }, jA = { all: !0, family: 4 }, IA = { all: !0, family: 6 }, LA = class {
    static {
      n(this, "CacheableLookup");
    }
    constructor({
      cache: e = /* @__PURE__ */ new Map(),
      maxTtl: t = 1 / 0,
      fallbackDuration: r = 3600,
      errorTtl: i = 0.15,
      resolver: s = new Zy(),
      lookup: o = qr.lookup
    } = {}) {
      if (this.maxTtl = t, this.errorTtl = i, this._cache = e, this._resolver = s, this._dnsLookup = o && (0, _l.promisify)(o), this.stats =
      {
        cache: 0,
        query: 0
      }, this._resolver instanceof Zy ? (this._resolve4 = this._resolver.resolve4.bind(this._resolver), this._resolve6 = this._resolver.resolve6.
      bind(this._resolver)) : (this._resolve4 = (0, _l.promisify)(this._resolver.resolve4.bind(this._resolver)), this._resolve6 = (0, _l.promisify)(
      this._resolver.resolve6.bind(this._resolver))), this._iface = rb(), this._pending = {}, this._nextRemovalTime = !1, this._hostnamesToFallback =
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
        t.hints & qr.V4MAPPED && (OA && t.hints & qr.ALL || i.length === 0) ? PA(r) : r = i;
      } else t.family === 4 && (r = r.filter((i) => i.family === 4));
      if (t.hints & qr.ADDRCONFIG) {
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
        Ls(this._resolve4(e, ib)),
        Ls(this._resolve6(e, ib))
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
          Ls(this._dnsLookup(e, jA)),
          Ls(this._dnsLookup(e, IA))
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
        r = Math.min(r, this.maxTtl) * 1e3, t[eb] = Date.now() + r;
        try {
          await this._cache.set(e, t, r);
        } catch (i) {
          this.lookupAsync = async () => {
            let s = new Error("Cache Error. Please recreate the CacheableLookup instance.");
            throw s.cause = i, s;
          };
        }
        qA(this._cache) && this._tick(r);
      }
    }
    async queryAndCache(e) {
      if (this._hostnamesToFallback.has(e))
        return this._dnsLookup(e, MA);
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
          let u = o[eb];
          i >= u ? this._cache.delete(s) : u < r && (r = u);
        }
        r !== 1 / 0 && this._tick(r - i);
      }, e), this._removalTimeout.unref && this._removalTimeout.unref());
    }
    install(e) {
      if (tb(e), Pr in e)
        throw new Error("CacheableLookup has been already installed");
      e[Pr] = e.createConnection, e[El] = this, e.createConnection = (t, r) => ("lookup" in t || (t.lookup = this.lookup), e[Pr](t, r));
    }
    uninstall(e) {
      if (tb(e), e[Pr]) {
        if (e[El] !== this)
          throw new Error("The agent is not owned by this CacheableLookup instance");
        e.createConnection = e[Pr], delete e[Pr], delete e[El];
      }
    }
    updateInterfaceInfo() {
      let { _iface: e } = this;
      this._iface = rb(), (e.has4 && !this._iface.has4 || e.has6 && !this._iface.has6) && this._cache.clear();
    }
    clear(e) {
      if (e) {
        this._cache.delete(e);
        return;
      }
      this._cache.clear();
    }
  }, NA = me(p1(), 1);
  function UA(e) {
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
  n(UA, "parseLinkHeader");
  var [nb, HA] = AA.default.versions.node.split(".").map(Number);
  function WA(e) {
    for (let t in e) {
      let r = e[t];
      S.any([m.string, m.number, m.boolean, m.null_, m.undefined], r);
    }
  }
  n(WA, "validateSearchParameters");
  var $A = /* @__PURE__ */ new Map(), Ns, zA = /* @__PURE__ */ n(() => Ns || (Ns = new LA(), Ns), "getGlobalDnsCache"), VA = {
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
        let i = UA(t).find((s) => s.parameters.rel === "next" || s.parameters.rel === '"next"');
        return i ? {
          url: new Qt.URL(i.reference, e.url)
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
  }, GA = /* @__PURE__ */ n((e) => {
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
      searchParams: e.searchParams ? new Qt.URLSearchParams(e.searchParams) : void 0,
      pagination: { ...e.pagination }
    };
    return i.url !== void 0 && (i.prefixUrl = ""), i;
  }, "cloneInternals"), YA = /* @__PURE__ */ n((e) => {
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
  }, "cloneRaw"), JA = /* @__PURE__ */ n((e) => {
    let t = [e.timeout.socket, e.timeout.connect, e.timeout.lookup, e.timeout.request, e.timeout.secureConnect].filter((r) => typeof r == "n\
umber");
    if (t.length > 0)
      return Math.min(...t);
  }, "getHttp2TimeoutOption"), sb = /* @__PURE__ */ n((e, t, r) => {
    var i;
    let s = (i = e.hooks) == null ? void 0 : i.init;
    if (s)
      for (let o of s)
        o(t, r);
  }, "init"), vt = class {
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
      }), S.any([m.string, m.urlInstance, m.object, m.undefined], e), S.any([m.object, m.undefined], t), S.any([m.object, m.undefined], r), e instanceof
      vt || t instanceof vt)
        throw new TypeError("The defaults must be passed as the third argument");
      this._internals = GA(r?._internals ?? r ?? VA), this._init = [...r?._init ?? []], this._merging = !1, this._unixOptions = void 0;
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
        if (e instanceof vt) {
          for (let t of e._init)
            this.merge(t);
          return;
        }
        e = YA(e), sb(this, e, this), sb(e, e, this), this._merging = !0, "isStream" in e && (this.isStream = e.isStream);
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
      S.any([m.function_, m.undefined], e), this._internals.request = e;
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
      S.plainObject(e);
      for (let t in e) {
        if (!(t in this._internals.agent))
          throw new TypeError(`Unexpected agent option: ${t}`);
        S.any([m.object, m.undefined], e[t]);
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
      S.boolean(e), this._internals.decompress = e;
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
      S.plainObject(e);
      for (let t in e) {
        if (!(t in this._internals.timeout))
          throw new Error(`Unexpected timeout option: ${t}`);
        S.any([m.number, m.undefined], e[t]);
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
      if (S.any([m.string, m.urlInstance], e), e === "") {
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
      S.any([m.string, m.buffer, m.nodeStream, m.generator, m.asyncGenerator, Al, m.undefined], e), m.nodeStream(e) && S.truthy(e.readable),
      e !== void 0 && (S.undefined(this._internals.form), S.undefined(this._internals.json)), this._internals.body = e;
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
      S.any([m.plainObject, m.undefined], e), e !== void 0 && (S.undefined(this._internals.body), S.undefined(this._internals.json)), this._internals.
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
      e !== void 0 && (S.undefined(this._internals.body), S.undefined(this._internals.form)), this._internals.json = e;
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
      if (S.any([m.string, m.urlInstance, m.undefined], e), e === void 0) {
        this._internals.url = void 0;
        return;
      }
      if (m.string(e) && e.startsWith("/"))
        throw new Error("`url` must not start with a slash");
      let t = `${this.prefixUrl}${e.toString()}`, r = new Qt.URL(t);
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
      if (S.any([m.object, m.undefined], e), e === void 0) {
        this._internals.cookieJar = void 0;
        return;
      }
      let { setCookie: t, getCookieString: r } = e;
      S.function_(t), S.function_(r), t.length === 4 && r.length === 0 ? (t = (0, wl.promisify)(t.bind(e)), r = (0, wl.promisify)(r.bind(e)),
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
      S.object(e), this._internals.signal = e;
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
      S.boolean(e), this._internals.ignoreInvalidCookies = e;
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
      new Qt.URLSearchParams()), this._internals.searchParams);
    }
    set searchParams(e) {
      S.any([m.string, m.object, m.undefined], e);
      let t = this._internals.url;
      if (e === void 0) {
        this._internals.searchParams = void 0, t && (t.search = "");
        return;
      }
      let r = this.searchParams, i;
      if (m.string(e))
        i = new Qt.URLSearchParams(e);
      else if (e instanceof Qt.URLSearchParams)
        i = e;
      else {
        WA(e), i = new Qt.URLSearchParams();
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
      S.any([m.function_, m.undefined], e), this._internals.dnsLookup = e;
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
      S.any([m.object, m.boolean, m.undefined], e), e === !0 ? this._internals.dnsCache = zA() : e === !1 ? this._internals.dnsCache = void 0 :
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
      S.object(e), this._merging ? Object.assign(this._internals.context, e) : this._internals.context = { ...e };
    }
    /**
    Hooks allow modifications during the request lifecycle.
    Hook functions may be async and are run serially.
    */
    get hooks() {
      return this._internals.hooks;
    }
    set hooks(e) {
      S.object(e);
      for (let t in e) {
        if (!(t in this._internals.hooks))
          throw new Error(`Unexpected hook event: ${t}`);
        let r = t, i = e[r];
        if (S.any([m.array, m.undefined], i), i)
          for (let s of i)
            S.function_(s);
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
      S.boolean(e), this._internals.followRedirect = e;
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
      S.number(e), this._internals.maxRedirects = e;
    }
    /**
        A cache adapter instance for storing cached response data.
    
        @default false
        */
    get cache() {
      return this._internals.cache;
    }
    set cache(e) {
      S.any([m.object, m.string, m.boolean, m.undefined], e), e === !0 ? this._internals.cache = $A : e === !1 ? this._internals.cache = void 0 :
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
      S.boolean(e), this._internals.throwHttpErrors = e;
    }
    get username() {
      let e = this._internals.url, t = e ? e.username : this._internals.username;
      return decodeURIComponent(t);
    }
    set username(e) {
      S.string(e);
      let t = this._internals.url, r = encodeURIComponent(e);
      t ? t.username = r : this._internals.username = r;
    }
    get password() {
      let e = this._internals.url, t = e ? e.password : this._internals.password;
      return decodeURIComponent(t);
    }
    set password(e) {
      S.string(e);
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
      S.boolean(e), this._internals.http2 = e;
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
      S.boolean(e), this._internals.allowGetBody = e;
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
      S.plainObject(e), this._merging ? Object.assign(this._internals.headers, Fl(e)) : this._internals.headers = Fl(e);
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
      S.boolean(e), this._internals.methodRewriting = e;
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
      S.function_(e), this._internals.parseJson = e;
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
      S.function_(e), this._internals.stringifyJson = e;
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
      if (S.plainObject(e), S.any([m.function_, m.undefined], e.calculateDelay), S.any([m.number, m.undefined], e.maxRetryAfter), S.any([m.number,
      m.undefined], e.limit), S.any([m.array, m.undefined], e.methods), S.any([m.array, m.undefined], e.statusCodes), S.any([m.array, m.undefined],
      e.errorCodes), S.any([m.number, m.undefined], e.noise), e.noise && Math.abs(e.noise) > 100)
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
      S.any([m.string, m.undefined], e), this._internals.localAddress = e;
    }
    /**
        The HTTP method used to make the request.
    
        @default 'GET'
        */
    get method() {
      return this._internals.method;
    }
    set method(e) {
      S.string(e), this._internals.method = e.toUpperCase();
    }
    get createConnection() {
      return this._internals.createConnection;
    }
    set createConnection(e) {
      S.any([m.function_, m.undefined], e), this._internals.createConnection = e;
    }
    /**
        From `http-cache-semantics`
    
        @default {}
        */
    get cacheOptions() {
      return this._internals.cacheOptions;
    }
    set cacheOptions(e) {
      S.plainObject(e), S.any([m.boolean, m.undefined], e.shared), S.any([m.number, m.undefined], e.cacheHeuristic), S.any([m.number, m.undefined],
      e.immutableMinTimeToLive), S.any([m.boolean, m.undefined], e.ignoreCargoCult);
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
      S.plainObject(e), S.any([m.boolean, m.undefined], e.rejectUnauthorized), S.any([m.function_, m.undefined], e.checkServerIdentity), S.any(
      [m.string, m.object, m.array, m.undefined], e.certificateAuthority), S.any([m.string, m.object, m.array, m.undefined], e.key), S.any([
      m.string, m.object, m.array, m.undefined], e.certificate), S.any([m.string, m.undefined], e.passphrase), S.any([m.string, m.buffer, m.
      array, m.undefined], e.pfx), S.any([m.array, m.undefined], e.alpnProtocols), S.any([m.string, m.undefined], e.ciphers), S.any([m.string,
      m.buffer, m.undefined], e.dhparam), S.any([m.string, m.undefined], e.signatureAlgorithms), S.any([m.string, m.undefined], e.minVersion),
      S.any([m.string, m.undefined], e.maxVersion), S.any([m.boolean, m.undefined], e.honorCipherOrder), S.any([m.number, m.undefined], e.tlsSessionLifetime),
      S.any([m.string, m.undefined], e.ecdhCurve), S.any([m.string, m.buffer, m.array, m.undefined], e.certificateRevocationLists);
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
      S.any([m.string, m.undefined], e), this._internals.encoding = e;
    }
    /**
        When set to `true` the promise will return the Response body instead of the Response object.
    
        @default false
        */
    get resolveBodyOnly() {
      return this._internals.resolveBodyOnly;
    }
    set resolveBodyOnly(e) {
      S.boolean(e), this._internals.resolveBodyOnly = e;
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
      S.boolean(e), this._internals.isStream = e;
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
      S.object(e), this._merging ? Object.assign(this._internals.pagination, e) : this._internals.pagination = e;
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
      S.boolean(e), this._internals.setHost = e;
    }
    get maxHeaderSize() {
      return this._internals.maxHeaderSize;
    }
    set maxHeaderSize(e) {
      S.any([m.number, m.undefined], e), this._internals.maxHeaderSize = e;
    }
    get enableUnixSockets() {
      return this._internals.enableUnixSockets;
    }
    set enableUnixSockets(e) {
      S.boolean(e), this._internals.enableUnixSockets = e;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    toJSON() {
      return { ...this._internals };
    }
    [Symbol.for("nodejs.util.inspect.custom")](e, t) {
      return (0, wl.inspect)(this._internals, t);
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
        checkServerIdentity: s.checkServerIdentity ?? TA.checkServerIdentity,
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
        timeout: t.http2 ? JA(t) : void 0,
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
            if (nb < 15 || nb === 15 && HA < 10) {
              let t = new Error("To use the `http2` option, install Node.js 15.10.0 or above");
              throw t.code = "EUNSUPPORTED", t;
            }
            return NA.default.auto;
          }
          return BA.default.request;
        }
        return RA.default.request;
      }
    }
    freeze() {
      let e = this._internals;
      Object.freeze(e), Object.freeze(e.hooks), Object.freeze(e.hooks.afterResponse), Object.freeze(e.hooks.beforeError), Object.freeze(e.hooks.
      beforeRedirect), Object.freeze(e.hooks.beforeRequest), Object.freeze(e.hooks.beforeRetry), Object.freeze(e.hooks.init), Object.freeze(
      e.https), Object.freeze(e.cacheOptions), Object.freeze(e.agent), Object.freeze(e.headers), Object.freeze(e.timeout), Object.freeze(e.retry),
      Object.freeze(e.retry.errorCodes), Object.freeze(e.retry.methods), Object.freeze(e.retry.statusCodes);
    }
  }, Ws = /* @__PURE__ */ n((e) => {
    let { statusCode: t } = e, r = e.request.options.followRedirect ? 299 : 399;
    return t >= 200 && t <= r || t === 304;
  }, "isResponseOk"), ob = class extends ye {
    static {
      n(this, "ParseError");
    }
    constructor(e, t) {
      let { options: r } = t.request;
      super(`${e.message} in "${r.url.toString()}"`, e, t.request), this.name = "ParseError", this.code = "ERR_BODY_PARSE_FAILURE";
    }
  }, ub = /* @__PURE__ */ n((e, t, r, i) => {
    let { rawBody: s } = e;
    try {
      if (t === "text")
        return s.toString(i);
      if (t === "json")
        return s.length === 0 ? "" : r(s.toString(i));
      if (t === "buffer")
        return s;
    } catch (o) {
      throw new ob(o, e);
    }
    throw new ob({
      message: `Unknown body type '${t}'`,
      name: "Error"
    }, e);
  }, "parseBody");
  function KA(e) {
    return e.writable && !e.writableEnded;
  }
  n(KA, "isClientRequest");
  var XA = KA;
  function ab(e) {
    return e.protocol === "unix:" || e.hostname === "unix";
  }
  n(ab, "isUnixSocketURL");
  var QA = m.string(Ab.default.versions.brotli), ZA = /* @__PURE__ */ new Set(["GET", "HEAD"]), Cl = new FA(), eT = /* @__PURE__ */ new Set(
  [300, 301, 302, 303, 304, 307, 308]), tT = [
    "socket",
    "connect",
    "continue",
    "information",
    "upgrade"
  ], Us = /* @__PURE__ */ n(() => {
  }, "noop2"), Tl = class extends j1.Duplex {
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
      _cannotHaveBody = !1, this._unproxyEvents = Us, this._triggerRead = !1, this._cancelTimeouts = Us, this._removeListeners = Us, this._jobs =
      [], this._flushed = !1, this._requestInitialized = !1, this._aborted = !1, this.redirectUrls = [], this.retryCount = 0, this._stopRetry =
      Us, this.on("pipe", (s) => {
        s.headers && Object.assign(this.options.headers, s.headers);
      }), this.on("newListener", (s) => {
        if (s === "retry" && this.listenerCount("retry") > 0)
          throw new Error("A retry listener has been attached already.");
      });
      try {
        if (this.options = new vt(e, t, r), !this.options.url) {
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
        this._flushed ? this._beforeError(new Uy(s, this)) : this.flush = async () => {
          this.flush = async () => {
          }, this._beforeError(new Uy(s, this));
        };
      }), this.options.signal) {
        let s = /* @__PURE__ */ n(() => {
          this.destroy(new M1(this));
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
              computedValue: SA({
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
              let f = new Tl(r.url, l, r);
              return f.retryCount = this.retryCount + 1, Ab.default.nextTick(() => {
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
      return e instanceof ml.ServerResponse && this._pipedServerResponses.add(e), super.pipe(e, t);
    }
    unpipe(e) {
      return e instanceof ml.ServerResponse && this._pipedServerResponses.delete(e), super.unpipe(e), this;
    }
    async _finalizeBody() {
      let { options: e } = this, { headers: t } = e, r = !m.undefined(e.form), i = !m.undefined(e.json), s = !m.undefined(e.body), o = ZA.has(
      e.method) && !(e.method === "GET" && e.allowGetBody);
      if (this._cannotHaveBody = o, r || i || s) {
        if (o)
          throw new TypeError(`The \`${e.method}\` method cannot be used with a body`);
        let u = !m.string(t["content-type"]);
        if (s) {
          if (Al(e.body)) {
            let l = new mA(e.body);
            u && (t["content-type"] = l.headers["Content-Type"]), "Content-Length" in l.headers && (t["content-length"] = l.headers["Content\
-Length"]), e.body = l.encode();
          }
          Rb(e.body) && u && (t["content-type"] = `multipart/form-data; boundary=${e.body.getBoundary()}`);
        } else if (r) {
          u && (t["content-type"] = "application/x-www-form-urlencoded");
          let { form: l } = e;
          e.form = void 0, e.body = new Wy.URLSearchParams(l).toString();
        } else {
          u && (t["content-type"] = "application/json");
          let { json: l } = e;
          e.json = void 0, e.body = e.stringifyJson(l);
        }
        let a = await bA(e.body, e.headers);
        m.undefined(t["content-length"]) && m.undefined(t["transfer-encoding"]) && !o && !m.undefined(a) && (t["content-length"] = String(a));
      }
      e.responseType === "json" && !("accept" in e.headers) && (e.headers.accept = "application/json"), this._bodySize = Number(t["content-l\
ength"]) || void 0;
    }
    async _onResponseBase(e) {
      if (this.isAborted)
        return;
      let { options: t } = this, { url: r } = t;
      this._nativeResponse = e, t.decompress && (e = (0, uA.default)(e));
      let i = e.statusCode, s = e;
      s.statusMessage = s.statusMessage ? s.statusMessage : ml.default.STATUS_CODES[i], s.url = t.url.toString(), s.requestUrl = this.requestUrl,
      s.redirectUrls = this.redirectUrls, s.request = this, s.isFromCache = this._nativeResponse.fromCache ?? !1, s.ip = this.ip, s.retryCount =
      this.retryCount, s.ok = Ws(s), this._isFromCache = s.isFromCache, this._responseSize = Number(e.headers["content-length"]) || void 0, this.
      response = s, e.once("end", () => {
        this._responseSize = this._downloadedSize, this.emit("downloadProgress", this.downloadProgress);
      }), e.once("error", (u) => {
        this._aborted = !0, e.destroy(), this._beforeError(new Hy(u, this));
      }), e.once("aborted", () => {
        this._aborted = !0, this._beforeError(new Hy({
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
        if (t.followRedirect && e.headers.location && eT.has(i)) {
          if (e.resume(), this._cancelTimeouts(), this._unproxyEvents(), this.redirectUrls.length >= t.maxRedirects) {
            this._beforeError(new k1(this));
            return;
          }
          this._request = void 0;
          let u = new vt(void 0, void 0, this.options), a = i === 303 && u.method !== "GET" && u.method !== "HEAD", l = i !== 307 && i !== 308,
          f = u.methodRewriting && l;
          (a || f) && (u.method = "GET", u.body = void 0, u.json = void 0, u.form = void 0, delete u.headers["content-length"]);
          try {
            let p = Dl.Buffer.from(e.headers.location, "binary").toString(), d = new Wy.URL(p, r);
            if (!ab(r) && ab(d)) {
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
        if (t.isStream && t.throwHttpErrors && !Ws(s)) {
          this._beforeError(new Hs(s));
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
        let t = await (0, aA.buffer)(e);
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
      H1(e), this.options.http2 && e.setTimeout(0), this._cancelTimeouts = EA(e, r, i);
      let s = t.cache ? "cacheableResponse" : "response";
      e.once(s, (o) => {
        this._onResponse(o);
      }), e.once("error", (o) => {
        this._aborted = !0, e.destroy(), o = o instanceof kb ? new P1(o, this.timings, this) : new ye(o.message, o, this), this._beforeError(
        o);
      }), this._unproxyEvents = Bb(e, this, tT), this._request = e, this.emit("uploadProgress", this.uploadProgress), this._sendBody(), this.
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
      if (!Cl.has(e)) {
        let t = new oA((r, i) => {
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
        Cl.set(e, t.request());
      }
    }
    async _createCacheableRequest(e, t) {
      return new Promise((r, i) => {
        Object.assign(t, CA(e));
        let s, o = Cl.get(t.cache)(t, async (u) => {
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
      if (e.decompress && m.undefined(t["accept-encoding"]) && (t["accept-encoding"] = QA ? "gzip, deflate, br" : "gzip, deflate"), r || i) {
        let l = Dl.Buffer.from(`${r}:${i}`).toString("base64");
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
        XA(l) ? this._onRequest(l) : this.writable ? (this.once("finish", () => {
          this._onResponse(l);
        }), this._sendBody()) : this._onResponse(l);
      } catch (l) {
        throw l instanceof Wi ? new O1(l, this) : l;
      }
    }
    async _error(e) {
      try {
        if (!(e instanceof Hs && !this.options.throwHttpErrors))
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
          this._uploadedSize += Dl.Buffer.byteLength(e, t);
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
  }, rT = class extends ye {
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
  }, iT = [
    "request",
    "response",
    "redirect",
    "uploadProgress",
    "downloadProgress"
  ];
  function lb(e) {
    let t, r, i, s = new T1.EventEmitter(), o = new Sl((a, l, f) => {
      f(() => {
        t.destroy();
      }), f.shouldReject = !1, f(() => {
        l(new rT(t));
      });
      let p = /* @__PURE__ */ n((d) => {
        var c;
        f(() => {
        });
        let h = e ?? new Tl(void 0, void 0, i);
        h.retryCount = d, h._noPipe = !0, t = h, h.once("response", async (y) => {
          let _ = (y.headers["content-encoding"] ?? "").toLowerCase(), E = _ === "gzip" || _ === "deflate" || _ === "br", { options: v } = h;
          if (E && !v.decompress)
            y.body = y.rawBody;
          else
            try {
              y.body = ub(y, v.responseType, v.parseJson, v.encoding);
            } catch (x) {
              if (y.body = y.rawBody.toString(), Ws(y)) {
                h._beforeError(x);
                return;
              }
            }
          try {
            let x = v.hooks.afterResponse;
            for (let [F, C] of x.entries())
              if (y = await C(y, async (B) => {
                throw v.merge(B), v.prefixUrl = "", B.url && (v.url = B.url), v.hooks.afterResponse = v.hooks.afterResponse.slice(0, F), new q1(
                h);
              }), !(m.object(y) && m.number(y.statusCode) && !m.nullOrUndefined(y.body)))
                throw new TypeError("The `afterResponse` hook returned an invalid value");
          } catch (x) {
            h._beforeError(x);
            return;
          }
          if (r = y, !Ws(y)) {
            h._beforeError(new Hs(y));
            return;
          }
          h.destroy(), a(h.options.resolveBodyOnly ? y.body : y);
        });
        let g = /* @__PURE__ */ n((y) => {
          if (o.isCanceled)
            return;
          let { options: _ } = h;
          if (y instanceof Hs && !_.throwHttpErrors) {
            let { response: E } = y;
            h.destroy(), a(h.options.resolveBodyOnly ? E.body : E);
            return;
          }
          l(y);
        }, "onError");
        h.once("error", g);
        let w = (c = h.options) == null ? void 0 : c.body;
        h.once("retry", (y, _) => {
          e = void 0;
          let E = h.options.body;
          if (w === E && m.nodeStream(E)) {
            _.message = "Cannot retry with consumed body stream", g(_);
            return;
          }
          i = h.options, p(y);
        }), Bb(h, s, iT), m.undefined(e) && h.flush();
      }, "makeRequest");
      p(0);
    });
    o.on = (a, l) => (s.on(a, l), o), o.off = (a, l) => (s.off(a, l), o);
    let u = /* @__PURE__ */ n((a) => {
      let l = (async () => {
        await o;
        let { options: f } = r.request;
        return ub(r, a, f.parseJson, f.encoding);
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
  n(lb, "asPromise");
  var nT = /* @__PURE__ */ n(async (e) => new Promise((t) => {
    setTimeout(t, e);
  }), "delay"), sT = /* @__PURE__ */ n((e) => m.function_(e), "isGotInstance"), oT = [
    "get",
    "post",
    "put",
    "patch",
    "head",
    "delete"
  ], Ob = /* @__PURE__ */ n((e) => {
    e = {
      options: new vt(void 0, void 0, e.options),
      handlers: [...e.handlers],
      mutableDefaults: e.mutableDefaults
    }, Object.defineProperty(e, "mutableDefaults", {
      enumerable: !0,
      configurable: !1,
      writable: !1
    });
    let t = /* @__PURE__ */ n((i, s, o = e.options) => {
      let u = new Tl(i, s, o), a, l = /* @__PURE__ */ n((d) => (u.options = d, u._noPipe = !d.isStream, u.flush(), d.isStream ? u : (a || (a =
      lb(u)), a)), "lastHandler"), f = 0, p = /* @__PURE__ */ n((d) => {
        let h = (e.handlers[f++] ?? l)(d, p);
        if (m.promise(h) && !u.options.isStream && (a || (a = lb(u)), h !== a)) {
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
      let s = new vt(void 0, void 0, e.options), o = [...e.handlers], u;
      for (let a of i)
        sT(a) ? (s.merge(a.defaults.options), o.push(...a.defaults.handlers), u = a.defaults.mutableDefaults) : (s.merge(a), a.handlers && o.
        push(...a.handlers), u = a.mutableDefaults);
      return Ob({
        options: s,
        handlers: o,
        mutableDefaults: !!u
      });
    };
    let r = /* @__PURE__ */ n(async function* (i, s) {
      let o = new vt(i, s, e.options);
      o.resolveBodyOnly = !1;
      let { pagination: u } = o;
      S.function_(u.transform), S.function_(u.shouldContinue), S.function_(u.filter), S.function_(u.paginate), S.number(u.countLimit), S.number(
      u.requestLimit), S.number(u.backoff);
      let a = [], { countLimit: l } = u, f = 0;
      for (; f < u.requestLimit; ) {
        f !== 0 && await nT(u.backoff);
        let p = await t(void 0, void 0, o), d = await u.transform(p), c = [];
        S.array(d);
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
        h === p.request.options ? o = p.request.options : (o.merge(h), S.any([m.urlInstance, m.undefined], h.url), h.url !== void 0 && (o.prefixUrl =
        "", o.url = h.url)), f++;
      }
    }, "paginateEach");
    t.paginate = r, t.paginate.all = async (i, s) => {
      let o = [];
      for await (let u of r(i, s))
        o.push(u);
      return o;
    }, t.paginate.each = r, t.stream = (i, s) => t(i, { ...s, isStream: !0 });
    for (let i of oT)
      t[i] = (s, o) => t(s, { ...o, method: i }), t.stream[i] = (s, o) => t(s, { ...o, method: i, isStream: !0 });
    return e.mutableDefaults || (Object.freeze(e.handlers), e.options.freeze()), Object.defineProperty(t, "defaults", {
      value: e,
      writable: !1,
      configurable: !1,
      enumerable: !0
    }), t;
  }, "create"), uT = Ob, aT = {
    options: new vt(),
    handlers: [],
    mutableDefaults: !1
  }, lT = uT(aT), fT = lT, hT = me(xu()), cT = GD(), dT = me(Ny()), fb = {
    keepAlive: !0,
    maxSockets: 20
  }, pT = {
    http: new D1.Agent(fb),
    https: new m1.Agent(fb)
  };
  async function DT({ url: e, gotOpts: t, extractOpts: r, dir: i }) {
    return new Promise((s, o) => {
      let u = /* @__PURE__ */ n((a) => {
        a ? o(a) : s();
      }, "callback");
      (0, hT.default)(
        fT.stream(e, Object.assign({ agent: pT }, t)),
        (0, dT.default)(),
        (0, cT.extract)(i, r),
        u
      );
    });
  }
  n(DT, "download");
});

// ../node_modules/get-npm-tarball-url/lib/index.js
var Ib = b((uq, jb) => {
  var Rl = Object.defineProperty, mT = Object.getOwnPropertyDescriptor, gT = Object.getOwnPropertyNames, yT = Object.prototype.hasOwnProperty,
  bT = /* @__PURE__ */ n((e, t) => {
    for (var r in t)
      Rl(e, r, { get: t[r], enumerable: !0 });
  }, "__export"), vT = /* @__PURE__ */ n((e, t, r, i) => {
    if (t && typeof t == "object" || typeof t == "function")
      for (let s of gT(t))
        !yT.call(e, s) && s !== r && Rl(e, s, { get: /* @__PURE__ */ n(() => t[s], "get"), enumerable: !(i = mT(t, s)) || i.enumerable });
    return e;
  }, "__copyProps"), wT = /* @__PURE__ */ n((e) => vT(Rl({}, "__esModule", { value: !0 }), e), "__toCommonJS"), Mb = {};
  bT(Mb, {
    default: /* @__PURE__ */ n(() => _T, "default")
  });
  jb.exports = wT(Mb);
  function _T(e, t, r) {
    let i;
    r?.registry ? i = r.registry.endsWith("/") ? r.registry : `${r.registry}/` : i = "https://registry.npmjs.org/";
    let s = CT(e);
    return `${i}${e}/-/${s}-${ET(t)}.tgz`;
  }
  n(_T, "src_default");
  function ET(e) {
    let t = e.indexOf("+");
    return t === -1 ? e : e.substring(0, t);
  }
  n(ET, "removeBuildMetadataFromVersion");
  function CT(e) {
    return e[0] !== "@" ? e : e.split("/")[1];
  }
  n(CT, "getScopelessName");
});

// ../node_modules/eastasianwidth/eastasianwidth.js
var Js = b((Bq, Ul) => {
  var qt = {};
  typeof Ul > "u" ? window.eastasianwidth = qt : Ul.exports = qt;
  qt.eastAsianWidth = function(e) {
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
  qt.characterLength = function(e) {
    var t = this.eastAsianWidth(e);
    return t == "F" || t == "W" || t == "A" ? 2 : 1;
  };
  function Qb(e) {
    return e.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  }
  n(Qb, "stringToArray");
  qt.length = function(e) {
    for (var t = Qb(e), r = 0, i = 0; i < t.length; i++)
      r = r + this.characterLength(t[i]);
    return r;
  };
  qt.slice = function(e, t, r) {
    textLen = qt.length(e), t = t || 0, r = r || 1, t < 0 && (t = textLen + t), r < 0 && (r = textLen + r);
    for (var i = "", s = 0, o = Qb(e), u = 0; u < o.length; u++) {
      var a = o[u], l = qt.length(a);
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
var Ks = b((Oq, Zb) => {
  "use strict";
  Zb.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// ../node_modules/cli-boxes/boxes.json
var D0 = b((iM, pR) => {
  pR.exports = {
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
var Yl = b((nM, Gl) => {
  "use strict";
  var m0 = D0();
  Gl.exports = m0;
  Gl.exports.default = m0;
});

// ../node_modules/string-width/node_modules/ansi-regex/index.js
var _0 = b((uM, w0) => {
  "use strict";
  w0.exports = ({ onlyFirst: e = !1 } = {}) => {
    let t = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(t, e ? void 0 : "g");
  };
});

// ../node_modules/string-width/node_modules/strip-ansi/index.js
var C0 = b((aM, E0) => {
  "use strict";
  var wR = _0();
  E0.exports = (e) => typeof e == "string" ? e.replace(wR(), "") : e;
});

// ../node_modules/is-fullwidth-code-point/index.js
var x0 = b((lM, Xl) => {
  "use strict";
  var F0 = /* @__PURE__ */ n((e) => Number.isNaN(e) ? !1 : e >= 4352 && (e <= 4447 || // Hangul Jamo
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
  Xl.exports = F0;
  Xl.exports.default = F0;
});

// ../node_modules/string-width/node_modules/emoji-regex/index.js
var A0 = b((hM, S0) => {
  "use strict";
  S0.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// ../node_modules/string-width/index.js
var R0 = b((cM, Ql) => {
  "use strict";
  var _R = C0(), ER = x0(), CR = A0(), T0 = /* @__PURE__ */ n((e) => {
    if (typeof e != "string" || e.length === 0 || (e = _R(e), e.length === 0))
      return 0;
    e = e.replace(CR(), "  ");
    let t = 0;
    for (let r = 0; r < e.length; r++) {
      let i = e.codePointAt(r);
      i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879 || (i > 65535 && r++, t += ER(i) ? 2 : 1);
    }
    return t;
  }, "stringWidth");
  Ql.exports = T0;
  Ql.exports.default = T0;
});

// ../node_modules/ansi-align/index.js
var k0 = b((pM, B0) => {
  "use strict";
  var FR = R0();
  function rr(e, t) {
    if (!e) return e;
    t = t || {};
    let r = t.align || "center";
    if (r === "left") return e;
    let i = t.split || `
`, s = t.pad || " ", o = r !== "right" ? xR : SR, u = !1;
    Array.isArray(e) || (u = !0, e = String(e).split(i));
    let a, l = 0;
    return e = e.map(function(f) {
      return f = String(f), a = FR(f), l = Math.max(a, l), {
        str: f,
        width: a
      };
    }).map(function(f) {
      return new Array(o(l, f.width) + 1).join(s) + f.str;
    }), u ? e.join(i) : e;
  }
  n(rr, "ansiAlign");
  rr.left = /* @__PURE__ */ n(function(t) {
    return rr(t, { align: "left" });
  }, "left");
  rr.center = /* @__PURE__ */ n(function(t) {
    return rr(t, { align: "center" });
  }, "center");
  rr.right = /* @__PURE__ */ n(function(t) {
    return rr(t, { align: "right" });
  }, "right");
  B0.exports = rr;
  function xR(e, t) {
    return Math.floor((e - t) / 2);
  }
  n(xR, "halfDiff");
  function SR(e, t) {
    return e - t;
  }
  n(SR, "fullDiff");
});

// ../node_modules/ts-dedent/dist/index.js
var of = b((Zi) => {
  "use strict";
  Object.defineProperty(Zi, "__esModule", { value: !0 });
  Zi.dedent = void 0;
  function Y0(e) {
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
  n(Y0, "dedent");
  Zi.dedent = Y0;
  Zi.default = Y0;
});

// src/cli/index.ts
var i8 = {};
hv(i8, {
  ANGULAR_JSON_PATH: () => en,
  AngularJSON: () => uf,
  CommunityBuilder: () => Nb,
  CoreBuilder: () => kl,
  CoreWebpackCompilers: () => Lb,
  ProjectType: () => Gs,
  SUPPORTED_ESLINT_EXTENSIONS: () => iv,
  SUPPORTED_RENDERERS: () => xT,
  SupportedLanguage: () => Ol,
  addToDevDependenciesIfNotPresent: () => MT,
  adjustTemplate: () => Gb,
  builderNameToCoreBuilder: () => AT,
  cliStoriesTargetPath: () => Vb,
  coerceSemver: () => UT,
  compilerNameToCoreCompiler: () => ST,
  compoDocPreviewPrefix: () => VR,
  configureEslintPlugin: () => t8,
  copyTemplate: () => jT,
  copyTemplateFiles: () => LT,
  detect: () => QT,
  detectBuilder: () => YT,
  detectFrameworkPreset: () => Xb,
  detectLanguage: () => XT,
  detectPnp: () => KT,
  externalFrameworks: () => Bl,
  extractEslintInfo: () => e8,
  findEslintFile: () => nv,
  frameworkToDefaultBuilder: () => IT,
  frameworkToRenderer: () => $b,
  getBabelDependencies: () => qT,
  getRendererDir: () => Il,
  getStorybookVersionSpecifier: () => NT,
  getVersionSafe: () => zb,
  hasStorybookDependencies: () => HT,
  installableProjectTypes: () => RT,
  isNxProject: () => Ll,
  isStorybookInstantiated: () => JT,
  normalizeExtends: () => io,
  promptForCompoDocs: () => GR,
  readFileAsJson: () => OT,
  suggestESLintPlugin: () => r8,
  supportedTemplates: () => Pl,
  unsupportedTemplate: () => ql,
  writeFileAsJson: () => PT
});
module.exports = cv(i8);

// src/cli/detect.ts
var Vi = require("node:fs"), Yb = require("node:path"), Gi = require("@storybook/core/common"), Jb = require("@storybook/core/node-logger");

// node_modules/find-up/index.js
var nr = Y(require("node:path"), 1);

// ../node_modules/locate-path/index.js
var Df = Y(require("node:process"), 1), mf = Y(require("node:path"), 1), sn = Y(require("node:fs"), 1), gf = require("node:url");
var yf = {
  directory: "isDirectory",
  file: "isFile"
};
function dv(e) {
  if (!Object.hasOwnProperty.call(yf, e))
    throw new Error(`Invalid type specified: ${e}`);
}
n(dv, "checkType");
var pv = /* @__PURE__ */ n((e, t) => t[yf[e]](), "matchType"), Dv = /* @__PURE__ */ n((e) => e instanceof URL ? (0, gf.fileURLToPath)(e) : e,
"toPath");
function so(e, {
  cwd: t = Df.default.cwd(),
  type: r = "file",
  allowSymlinks: i = !0
} = {}) {
  dv(r), t = Dv(t);
  let s = i ? sn.default.statSync : sn.default.lstatSync;
  for (let o of e)
    try {
      let u = s(mf.default.resolve(t, o), {
        throwIfNoEntry: !1
      });
      if (!u)
        continue;
      if (pv(r, u))
        return o;
    } catch {
    }
}
n(so, "locatePathSync");

// ../node_modules/unicorn-magic/node.js
var bf = require("node:url");
function oo(e) {
  return e instanceof URL ? (0, bf.fileURLToPath)(e) : e;
}
n(oo, "toPath");

// node_modules/path-exists/index.js
var vf = Y(require("node:fs"), 1);

// node_modules/find-up/index.js
var mv = Symbol("findUpStop");
function gv(e, t = {}) {
  let r = nr.default.resolve(oo(t.cwd) ?? ""), { root: i } = nr.default.parse(r), s = nr.default.resolve(r, oo(t.stopAt) ?? i), o = t.limit ??
  Number.POSITIVE_INFINITY, u = [e].flat(), a = /* @__PURE__ */ n((f) => {
    if (typeof e != "function")
      return so(u, f);
    let p = e(f.cwd);
    return typeof p == "string" ? so([p], f) : p;
  }, "runMatcher"), l = [];
  for (; ; ) {
    let f = a({ ...t, cwd: r });
    if (f === mv || (f && l.push(nr.default.resolve(r, f)), r === s || l.length >= o))
      break;
    r = nr.default.dirname(r);
  }
  return l;
}
n(gv, "findUpMultipleSync");
function sr(e, t = {}) {
  return gv(e, { ...t, limit: 1 })[0];
}
n(sr, "findUpSync");

// src/cli/detect.ts
var Kb = Y(_n(), 1), Pt = Y(require("semver"), 1);

// src/cli/helpers.ts
var Se = require("node:fs"), Zt = require("node:fs/promises"), Ne = require("node:path"), Ub = require("@storybook/core/common"), Hb = require("@storybook/core/common");
var Wb = Y(vu(), 1), er = require("semver");

// ../node_modules/strip-json-comments/index.js
var wu = Symbol("singleComment"), Qd = Symbol("multiComment"), FE = /* @__PURE__ */ n(() => "", "stripWithoutWhitespace"), xE = /* @__PURE__ */ n(
(e, t, r) => e.slice(t, r).replace(/\S/g, " "), "stripWithWhitespace"), SE = /* @__PURE__ */ n((e, t) => {
  let r = t - 1, i = 0;
  for (; e[r] === "\\"; )
    r -= 1, i += 1;
  return !!(i % 2);
}, "isEscaped");
function _u(e, { whitespace: t = !0, trailingCommas: r = !1 } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof e}\``);
  let i = t ? xE : FE, s = !1, o = !1, u = 0, a = "", l = "", f = -1;
  for (let p = 0; p < e.length; p++) {
    let d = e[p], c = e[p + 1];
    if (!o && d === '"' && (SE(e, p) || (s = !s)), !s)
      if (!o && d + c === "//")
        a += e.slice(u, p), u = p, o = wu, p++;
      else if (o === wu && d + c === `\r
`) {
        p++, o = !1, a += i(e, u, p), u = p;
        continue;
      } else if (o === wu && d === `
`)
        o = !1, a += i(e, u, p), u = p;
      else if (!o && d + c === "/*") {
        a += e.slice(u, p), u = p, o = Qd, p++;
        continue;
      } else if (o === Qd && d + c === "*/") {
        p++, o = !1, a += i(e, u, p + 1), u = p + 1;
        continue;
      } else r && !o && (f !== -1 ? d === "}" || d === "]" ? (a += e.slice(u, p), l += i(a, 0, 1) + a.slice(1), a = "", u = p, f = -1) : d !==
      " " && d !== "	" && d !== "\r" && d !== `
` && (a += e.slice(u, p), u = p, f = -1) : d === "," && (l += a + e.slice(u, p), a = "", u = p, f = p));
  }
  return l + a + (o ? i(e.slice(u)) : e.slice(u));
}
n(_u, "stripJsonComments");

// ../node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var AE = process.env.NODE_ENV === "production", Eu = "Invariant failed";
function ti(e, t) {
  if (!e) {
    if (AE)
      throw new Error(Eu);
    var r = typeof t == "function" ? t() : t, i = r ? "".concat(Eu, ": ").concat(r) : Eu;
    throw new Error(i);
  }
}
n(ti, "invariant");

// src/cli/dirs.ts
var zi = require("node:path"), Ys = require("@storybook/core/common"), Ml = Y(qb(), 1), jl = Y(Ib(), 1);

// src/cli/project_types.ts
var Vs = require("semver");
function FT(e, t) {
  return (0, Vs.validRange)(e) ? (0, Vs.minVersion)(e)?.major === t : !1;
}
n(FT, "eqMajor");
var Bl = [
  { name: "qwik", packageName: "storybook-framework-qwik" },
  { name: "solid", frameworks: ["storybook-solidjs-vite"], renderer: "storybook-solidjs" },
  {
    name: "nuxt",
    packageName: "@storybook-vue/nuxt",
    frameworks: ["@storybook-vue/nuxt"],
    renderer: "@storybook/vue3"
  }
], xT = [
  "react",
  "react-native",
  "vue3",
  "angular",
  "ember",
  "preact",
  "svelte",
  "qwik",
  "solid"
], Gs = /* @__PURE__ */ ((C) => (C.UNDETECTED = "UNDETECTED", C.UNSUPPORTED = "UNSUPPORTED", C.REACT = "REACT", C.REACT_SCRIPTS = "REACT_SCR\
IPTS", C.REACT_NATIVE = "REACT_NATIVE", C.REACT_NATIVE_WEB = "REACT_NATIVE_WEB", C.REACT_PROJECT = "REACT_PROJECT", C.WEBPACK_REACT = "WEBPA\
CK_REACT", C.NEXTJS = "NEXTJS", C.VUE3 = "VUE3", C.NUXT = "NUXT", C.ANGULAR = "ANGULAR", C.EMBER = "EMBER", C.WEB_COMPONENTS = "WEB_COMPONEN\
TS", C.HTML = "HTML", C.QWIK = "QWIK", C.PREACT = "PREACT", C.SVELTE = "SVELTE", C.SVELTEKIT = "SVELTEKIT", C.SERVER = "SERVER", C.NX = "NX",
C.SOLID = "SOLID", C))(Gs || {}), kl = /* @__PURE__ */ ((r) => (r.Webpack5 = "webpack5", r.Vite = "vite", r))(kl || {}), Lb = /* @__PURE__ */ ((r) => (r.
Babel = "babel", r.SWC = "swc", r))(Lb || {}), Nb = /* @__PURE__ */ ((t) => (t.Rsbuild = "rsbuild", t))(Nb || {}), ST = {
  "@storybook/addon-webpack5-compiler-babel": "babel",
  "@storybook/addon-webpack5-compiler-swc": "swc"
}, AT = {
  "@storybook/builder-webpack5": "webpack5",
  "@storybook/builder-vite": "vite"
}, Ol = /* @__PURE__ */ ((i) => (i.JAVASCRIPT = "javascript", i.TYPESCRIPT_3_8 = "typescript-3-8", i.TYPESCRIPT_4_9 = "typescript-4-9", i))(
Ol || {}), Pl = [
  {
    preset: "NUXT",
    dependencies: ["nuxt"],
    matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.every(Boolean) ?? !0, "matcherFunction")
  },
  {
    preset: "VUE3",
    dependencies: {
      // This Vue template works with Vue 3
      vue: /* @__PURE__ */ n((e) => e === "next" || FT(e, 3), "vue")
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
], ql = {
  preset: "UNSUPPORTED",
  dependencies: {},
  matcherFunction: /* @__PURE__ */ n(({ dependencies: e }) => e?.some(Boolean) ?? !1, "matcherFunction")
}, TT = [
  "UNDETECTED",
  "UNSUPPORTED",
  "NX"
], RT = Object.values(Gs).filter((e) => !TT.includes(e)).map((e) => e.toLowerCase());

// src/cli/dirs.ts
var BT = /* @__PURE__ */ n(async (e, t) => {
  let r = await (0, Ys.temporaryDirectory)(), s = Ys.versions[t] || await e.latestVersion(t), o = jl.default.default || jl.default, u = Ml.default.
  default || Ml.default, a = o(t, s, {
    registry: await e.getRegistryURL()
  });
  return await u({ url: a, dir: r }), (0, zi.join)(r, "package");
}, "resolveUsingBranchInstall");
async function Il(e, t) {
  let r = Bl.find((u) => u.name === t), i = r?.packageName || r?.renderer || `@storybook/${t}`, s = (0, zi.join)(i, "package.json"), o = [];
  try {
    return (0, zi.dirname)(
      require.resolve(s, {
        paths: [process.cwd()]
      })
    );
  } catch (u) {
    ti(u instanceof Error), o.push(u);
  }
  try {
    return await BT(e, i);
  } catch (u) {
    ti(u instanceof Error), o.push(u);
  }
  throw new Error(`Cannot find ${s}, ${o.map((u) => u.stack).join(`

`)}`);
}
n(Il, "getRendererDir");

// src/cli/helpers.ts
var kT = console;
function OT(e, t) {
  let r = (0, Ne.resolve)(e);
  if (!(0, Se.existsSync)(r))
    return !1;
  let i = (0, Se.readFileSync)(r, "utf8"), s = t ? _u(i) : i;
  try {
    return JSON.parse(s);
  } catch (o) {
    throw kT.error(Wb.default.red(`Invalid json in file: ${r}`)), o;
  }
}
n(OT, "readFileAsJson");
var PT = /* @__PURE__ */ n((e, t) => {
  let r = (0, Ne.resolve)(e);
  return (0, Se.existsSync)(r) ? ((0, Se.writeFileSync)(r, `${JSON.stringify(t, null, 2)}
`), !0) : !1;
}, "writeFileAsJson");
async function qT(e, t) {
  let r = [], i = "^8.0.0-0", s = t.dependencies["babel-core"] || t.devDependencies["babel-core"];
  if (s) {
    let o = await e.latestVersion(
      "babel-core",
      s
    );
    (0, er.satisfies)(o, "^6.0.0") && (i = "^7.0.0");
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
n(qT, "getBabelDependencies");
function MT(e, t, r) {
  !e.dependencies?.[t] && !e.devDependencies?.[t] && (e.devDependencies ? e.devDependencies[t] = r : e.devDependencies = {
    [t]: r
  });
}
n(MT, "addToDevDependenciesIfNotPresent");
function jT(e, t = ".") {
  let r = (0, Ne.resolve)(e, "template-csf/");
  if (!(0, Se.existsSync)(r))
    throw new Error("Couldn't find template dir");
  (0, Se.cpSync)(r, t, { recursive: !0 });
}
n(jT, "copyTemplate");
var $b = Ub.frameworkToRenderer, IT = {
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
async function zb(e, t) {
  try {
    let r = await e.getInstalledVersion(t);
    return r || (r = (await e.getAllDependencies())[t] ?? ""), (0, er.coerce)(r, { includePrerelease: !0 })?.toString();
  } catch {
  }
}
n(zb, "getVersionSafe");
var Vb = /* @__PURE__ */ n(async () => (0, Se.existsSync)("./src") ? "./src/stories" : "./stories", "cliStoriesTargetPath");
async function LT({
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
    let p = await zb(e, "svelte");
    p && (0, er.major)(p) >= 5 && (u = {
      // keeping this for backwards compatibility in case community packages are using it
      typescript: "ts",
      javascript: "svelte-5-js",
      "typescript-3-8": "svelte-5-ts-3-8",
      "typescript-4-9": "svelte-5-ts-4-9"
    });
  }
  let a = /* @__PURE__ */ n(async () => {
    let p = await Il(e, t), d = (0, Ne.join)(p, "template", "cli"), c = (0, Ne.join)(d, u[r]), h = (0, Ne.join)(d, u.javascript), g = (0, Ne.join)(
    d, u.typescript), w = (0, Ne.join)(d, u["typescript-3-8"]);
    if ((0, Se.existsSync)(c))
      return c;
    if (r === "typescript-4-9" && (0, Se.existsSync)(w))
      return w;
    if ((0, Se.existsSync)(g))
      return g;
    if ((0, Se.existsSync)(h))
      return h;
    if ((0, Se.existsSync)(d))
      return d;
    throw new Error(`Unsupported renderer: ${t} (${p})`);
  }, "templatePath"), l = i ?? await Vb(), f = /* @__PURE__ */ n((p) => o.includes("docs") || !p.endsWith(".mdx"), "filter");
  if (s && await (0, Zt.cp)(s, l, { recursive: !0, filter: f }), await (0, Zt.cp)(await a(), l, { recursive: !0, filter: f }), s && o.includes(
  "docs")) {
    let p = $b[t] || "react";
    p === "vue3" && (p = "vue"), await Gb((0, Ne.join)(l, "Configure.mdx"), { renderer: p });
  }
}
n(LT, "copyTemplateFiles");
async function Gb(e, t) {
  let r = await (0, Zt.readFile)(e, { encoding: "utf8" });
  Object.keys(t).forEach((i) => {
    r = r.replaceAll(`{{${i}}}`, `${t[i]}`);
  }), await (0, Zt.writeFile)(e, r);
}
n(Gb, "adjustTemplate");
function NT(e) {
  let t = {
    ...e.dependencies,
    ...e.devDependencies,
    ...e.optionalDependencies
  }, r = Object.keys(t).find((i) => Hb.versions[i]);
  if (!r)
    throw new Error("Couldn't find any official storybook packages in package.json");
  return t[r];
}
n(NT, "getStorybookVersionSpecifier");
async function Ll() {
  return sr("nx.json");
}
n(Ll, "isNxProject");
function UT(e) {
  let t = (0, er.coerce)(e);
  return ti(t != null, `Could not coerce ${e} into a semver.`), t;
}
n(UT, "coerceSemver");
async function HT(e) {
  let t = await e.getAllDependencies();
  return Object.keys(t).some((r) => r.includes("storybook"));
}
n(HT, "hasStorybookDependencies");

// src/cli/detect.ts
var WT = ["vite.config.ts", "vite.config.js", "vite.config.mjs"], $T = ["webpack.config.js"], zT = /* @__PURE__ */ n((e, t, r) => {
  let i = e.dependencies?.[t] || e.devDependencies?.[t];
  return i && typeof r == "function" ? r(i) : !!i;
}, "hasDependency"), VT = /* @__PURE__ */ n((e, t, r) => {
  let i = e.peerDependencies?.[t];
  return i && typeof r == "function" ? r(i) : !!i;
}, "hasPeerDependency"), GT = /* @__PURE__ */ n((e, t) => {
  let r = {
    dependencies: [!1],
    peerDependencies: [!1],
    files: [!1]
  }, { preset: i, files: s, dependencies: o, peerDependencies: u, matcherFunction: a } = t, l = [];
  Array.isArray(o) ? l = o.map((p) => [p, void 0]) : typeof o == "object" && (l = Object.entries(o)), l.length > 0 && (r.dependencies = l.map(
    ([p, d]) => zT(e, p, d)
  ));
  let f = [];
  return Array.isArray(u) ? f = u.map((p) => [p, void 0]) : typeof u == "object" && (f = Object.entries(u)), f.length > 0 && (r.peerDependencies =
  f.map(
    ([p, d]) => VT(e, p, d)
  )), Array.isArray(s) && s.length > 0 && (r.files = s.map((p) => (0, Vi.existsSync)(p))), a(r) ? i : null;
}, "getFrameworkPreset");
function Xb(e = {}) {
  let t = [...Pl, ql].find((r) => GT(e, r) !== null);
  return t ? t.preset : "UNDETECTED";
}
n(Xb, "detectFrameworkPreset");
async function YT(e, t) {
  let r = sr(WT), i = sr($T), s = await e.getAllDependencies();
  if (r || s.vite && s.webpack === void 0)
    return (0, Gi.commandLog)("Detected Vite project. Setting builder to Vite")(), "vite";
  if (i || (s.webpack || s["@nuxt/webpack-builder"]) && s.vite !== void 0)
    return (0, Gi.commandLog)("Detected webpack project. Setting builder to webpack")(), "webpack5";
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
      let { builder: o } = await (0, Kb.default)(
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
            throw new Gi.HandledError("Canceled by the user");
          }, "onCancel")
        }
      );
      return o;
  }
}
n(YT, "detectBuilder");
function JT(e = (0, Yb.resolve)(process.cwd(), ".storybook")) {
  return (0, Vi.existsSync)(e);
}
n(JT, "isStorybookInstantiated");
async function KT() {
  return !!sr([".pnp.js", ".pnp.cjs"]);
}
n(KT, "detectPnp");
async function XT(e) {
  let t = "javascript";
  if ((0, Vi.existsSync)("jsconfig.json"))
    return t;
  let r = await e.getAllDependencies().then((l) => !!l.typescript), i = await e.getPackageVersion("typescript"), s = await e.getPackageVersion(
  "prettier"), o = await e.getPackageVersion(
    "@babel/plugin-transform-typescript"
  ), u = await e.getPackageVersion(
    "@typescript-eslint/parser"
  ), a = await e.getPackageVersion("eslint-plugin-storybook");
  return r && i ? Pt.default.gte(i, "4.9.0") && (!s || Pt.default.gte(s, "2.8.0")) && (!o || Pt.default.gte(o, "7.20.0")) && (!u || Pt.default.
  gte(u, "5.44.0")) && (!a || Pt.default.gte(a, "0.6.8")) ? t = "typescript-4-9" : Pt.default.gte(i, "3.8.0") ? t = "typescript-3-8" : Pt.default.
  lt(i, "3.8.0") && Jb.logger.warn("Detected TypeScript < 3.8, populating with JavaScript examples") : (0, Vi.existsSync)("tsconfig.json") &&
  (t = "typescript-4-9"), t;
}
n(XT, "detectLanguage");
async function QT(e, t = {}) {
  let r = await e.retrievePackageJson();
  return r ? await Ll() ? "NX" : t.html ? "HTML" : Xb(r) : "UNDETECTED";
}
n(QT, "detect");

// src/cli/angular/helpers.ts
var Nr = require("node:fs"), J0 = require("node:path"), K0 = require("@storybook/core/node-logger"), X0 = require("@storybook/core/server-errors");

// ../node_modules/boxen/index.js
var Ki = Y(require("node:process"), 1);

// ../node_modules/ansi-regex/index.js
function Nl({ onlyFirst: e = !1 } = {}) {
  let t = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|");
  return new RegExp(t, e ? void 0 : "g");
}
n(Nl, "ansiRegex");

// ../node_modules/strip-ansi/index.js
var ZT = Nl();
function wt(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected a \`string\`, got \`${typeof e}\``);
  return e.replace(ZT, "");
}
n(wt, "stripAnsi");

// ../node_modules/boxen/node_modules/string-width/index.js
var e0 = Y(Js(), 1), t0 = Y(Ks(), 1);
function et(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, t0.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (e0.default.eastAsianWidth(s)) {
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
n(et, "stringWidth");

// ../node_modules/boxen/node_modules/chalk/source/vendor/ansi-styles/index.js
var r0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${t + e}m`, "wrapAnsi16"), i0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${38 + e};5;${t}\
m`, "wrapAnsi256"), n0 = /* @__PURE__ */ n((e = 0) => (t, r, i) => `\x1B[${38 + e};2;${t};${r};${i}m`, "wrapAnsi16m"), se = {
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
}, jq = Object.keys(se.modifier), eR = Object.keys(se.color), tR = Object.keys(se.bgColor), Iq = [...eR, ...tR];
function rR() {
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
  }), se.color.close = "\x1B[39m", se.bgColor.close = "\x1B[49m", se.color.ansi = r0(), se.color.ansi256 = i0(), se.color.ansi16m = n0(), se.
  bgColor.ansi = r0(10), se.bgColor.ansi256 = i0(10), se.bgColor.ansi16m = n0(10), Object.defineProperties(se, {
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
n(rR, "assembleStyles");
var iR = rR(), Ue = iR;

// ../node_modules/boxen/node_modules/chalk/source/vendor/supports-color/index.js
var Qs = Y(require("node:process"), 1), o0 = Y(require("node:os"), 1), Hl = Y(require("node:tty"), 1);
function Me(e, t = globalThis.Deno ? globalThis.Deno.args : Qs.default.argv) {
  let r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", i = t.indexOf(r + e), s = t.indexOf("--");
  return i !== -1 && (s === -1 || i < s);
}
n(Me, "hasFlag");
var { env: fe } = Qs.default, Xs;
Me("no-color") || Me("no-colors") || Me("color=false") || Me("color=never") ? Xs = 0 : (Me("color") || Me("colors") || Me("color=true") || Me(
"color=always")) && (Xs = 1);
function nR() {
  if ("FORCE_COLOR" in fe)
    return fe.FORCE_COLOR === "true" ? 1 : fe.FORCE_COLOR === "false" ? 0 : fe.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(fe.FORCE_COLOR,
    10), 3);
}
n(nR, "envForceColor");
function sR(e) {
  return e === 0 ? !1 : {
    level: e,
    hasBasic: !0,
    has256: e >= 2,
    has16m: e >= 3
  };
}
n(sR, "translateLevel");
function oR(e, { streamIsTTY: t, sniffFlags: r = !0 } = {}) {
  let i = nR();
  i !== void 0 && (Xs = i);
  let s = r ? Xs : i;
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
  if (Qs.default.platform === "win32") {
    let u = o0.default.release().split(".");
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
n(oR, "_supportsColor");
function s0(e, t = {}) {
  let r = oR(e, {
    streamIsTTY: e && e.isTTY,
    ...t
  });
  return sR(r);
}
n(s0, "createSupportsColor");
var uR = {
  stdout: s0({ isTTY: Hl.default.isatty(1) }),
  stderr: s0({ isTTY: Hl.default.isatty(2) })
}, u0 = uR;

// ../node_modules/boxen/node_modules/chalk/source/utilities.js
function a0(e, t, r) {
  let i = e.indexOf(t);
  if (i === -1)
    return e;
  let s = t.length, o = 0, u = "";
  do
    u += e.slice(o, i) + t + r, o = i + s, i = e.indexOf(t, o);
  while (i !== -1);
  return u += e.slice(o), u;
}
n(a0, "stringReplaceAll");
function l0(e, t, r, i) {
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
n(l0, "stringEncaseCRLFWithFirstIndex");

// ../node_modules/boxen/node_modules/chalk/source/index.js
var { stdout: f0, stderr: h0 } = u0, Wl = Symbol("GENERATOR"), Ir = Symbol("STYLER"), Yi = Symbol("IS_EMPTY"), c0 = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
], Lr = /* @__PURE__ */ Object.create(null), aR = /* @__PURE__ */ n((e, t = {}) => {
  if (t.level && !(Number.isInteger(t.level) && t.level >= 0 && t.level <= 3))
    throw new Error("The `level` option should be an integer from 0 to 3");
  let r = f0 ? f0.level : 0;
  e.level = t.level === void 0 ? r : t.level;
}, "applyOptions");
var lR = /* @__PURE__ */ n((e) => {
  let t = /* @__PURE__ */ n((...r) => r.join(" "), "chalk");
  return aR(t, e), Object.setPrototypeOf(t, Ji.prototype), t;
}, "chalkFactory");
function Ji(e) {
  return lR(e);
}
n(Ji, "createChalk");
Object.setPrototypeOf(Ji.prototype, Function.prototype);
for (let [e, t] of Object.entries(Ue))
  Lr[e] = {
    get() {
      let r = Zs(this, zl(t.open, t.close, this[Ir]), this[Yi]);
      return Object.defineProperty(this, e, { value: r }), r;
    }
  };
Lr.visible = {
  get() {
    let e = Zs(this, this[Ir], !0);
    return Object.defineProperty(this, "visible", { value: e }), e;
  }
};
var $l = /* @__PURE__ */ n((e, t, r, ...i) => e === "rgb" ? t === "ansi16m" ? Ue[r].ansi16m(...i) : t === "ansi256" ? Ue[r].ansi256(Ue.rgbToAnsi256(
...i)) : Ue[r].ansi(Ue.rgbToAnsi(...i)) : e === "hex" ? $l("rgb", t, r, ...Ue.hexToRgb(...i)) : Ue[r][e](...i), "getModelAnsi"), fR = ["rgb",
"hex", "ansi256"];
for (let e of fR) {
  Lr[e] = {
    get() {
      let { level: r } = this;
      return function(...i) {
        let s = zl($l(e, c0[r], "color", ...i), Ue.color.close, this[Ir]);
        return Zs(this, s, this[Yi]);
      };
    }
  };
  let t = "bg" + e[0].toUpperCase() + e.slice(1);
  Lr[t] = {
    get() {
      let { level: r } = this;
      return function(...i) {
        let s = zl($l(e, c0[r], "bgColor", ...i), Ue.bgColor.close, this[Ir]);
        return Zs(this, s, this[Yi]);
      };
    }
  };
}
var hR = Object.defineProperties(() => {
}, {
  ...Lr,
  level: {
    enumerable: !0,
    get() {
      return this[Wl].level;
    },
    set(e) {
      this[Wl].level = e;
    }
  }
}), zl = /* @__PURE__ */ n((e, t, r) => {
  let i, s;
  return r === void 0 ? (i = e, s = t) : (i = r.openAll + e, s = t + r.closeAll), {
    open: e,
    close: t,
    openAll: i,
    closeAll: s,
    parent: r
  };
}, "createStyler"), Zs = /* @__PURE__ */ n((e, t, r) => {
  let i = /* @__PURE__ */ n((...s) => cR(i, s.length === 1 ? "" + s[0] : s.join(" ")), "builder");
  return Object.setPrototypeOf(i, hR), i[Wl] = e, i[Ir] = t, i[Yi] = r, i;
}, "createBuilder"), cR = /* @__PURE__ */ n((e, t) => {
  if (e.level <= 0 || !t)
    return e[Yi] ? "" : t;
  let r = e[Ir];
  if (r === void 0)
    return t;
  let { openAll: i, closeAll: s } = r;
  if (t.includes("\x1B"))
    for (; r !== void 0; )
      t = a0(t, r.close, r.open), r = r.parent;
  let o = t.indexOf(`
`);
  return o !== -1 && (t = l0(t, s, i, o)), i + t + s;
}, "applyStyle");
Object.defineProperties(Ji.prototype, Lr);
var dR = Ji(), Yq = Ji({ level: h0 ? h0.level : 0 });
var tr = dR;

// ../node_modules/widest-line/node_modules/string-width/index.js
var d0 = Y(Js(), 1), p0 = Y(Ks(), 1);
function Vl(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, p0.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (d0.default.eastAsianWidth(s)) {
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
n(Vl, "stringWidth");

// ../node_modules/widest-line/index.js
function eo(e) {
  let t = 0;
  for (let r of e.split(`
`))
    t = Math.max(t, Vl(r));
  return t;
}
n(eo, "widestLine");

// ../node_modules/boxen/index.js
var V0 = Y(Yl(), 1);

// ../node_modules/boxen/node_modules/camelcase/index.js
var DR = /[\p{Lu}]/u, mR = /[\p{Ll}]/u, g0 = /^[\p{Lu}](?![\p{Lu}])/gu, v0 = /([\p{Alpha}\p{N}_]|$)/u, Jl = /[_.\- ]+/, gR = new RegExp("^" +
Jl.source), y0 = new RegExp(Jl.source + v0.source, "gu"), b0 = new RegExp("\\d+" + v0.source, "gu"), yR = /* @__PURE__ */ n((e, t, r, i) => {
  let s = !1, o = !1, u = !1, a = !1;
  for (let l = 0; l < e.length; l++) {
    let f = e[l];
    a = l > 2 ? e[l - 3] === "-" : !0, s && DR.test(f) ? (e = e.slice(0, l) + "-" + e.slice(l), s = !1, u = o, o = !0, l++) : o && u && mR.test(
    f) && (!a || i) ? (e = e.slice(0, l - 1) + "-" + e.slice(l - 1), u = o, o = !1, s = !0) : (s = t(f) === f && r(f) !== f, u = o, o = r(f) ===
    f && t(f) !== f);
  }
  return e;
}, "preserveCamelCase"), bR = /* @__PURE__ */ n((e, t) => (g0.lastIndex = 0, e.replace(g0, (r) => t(r))), "preserveConsecutiveUppercase"), vR = /* @__PURE__ */ n(
(e, t) => (y0.lastIndex = 0, b0.lastIndex = 0, e.replace(y0, (r, i) => t(i)).replace(b0, (r) => t(r))), "postProcess");
function Kl(e, t) {
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
  return e.length === 1 ? Jl.test(e) ? "" : t.pascalCase ? i(e) : r(e) : (e !== r(e) && (e = yR(e, r, i, t.preserveConsecutiveUppercase)), e =
  e.replace(gR, ""), e = t.preserveConsecutiveUppercase ? bR(e, r) : r(e), t.pascalCase && (e = i(e.charAt(0)) + e.slice(1)), vR(e, i));
}
n(Kl, "camelCase");

// ../node_modules/boxen/index.js
var rf = Y(k0(), 1);

// ../node_modules/wrap-ansi/node_modules/string-width/index.js
var O0 = Y(Js(), 1), P0 = Y(Ks(), 1);
function ir(e, t = {}) {
  if (typeof e != "string" || e.length === 0 || (t = {
    ambiguousIsNarrow: !0,
    ...t
  }, e = wt(e), e.length === 0))
    return 0;
  e = e.replace((0, P0.default)(), "  ");
  let r = t.ambiguousIsNarrow ? 1 : 2, i = 0;
  for (let s of e) {
    let o = s.codePointAt(0);
    if (o <= 31 || o >= 127 && o <= 159 || o >= 768 && o <= 879)
      continue;
    switch (O0.default.eastAsianWidth(s)) {
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
n(ir, "stringWidth");

// ../node_modules/wrap-ansi/node_modules/ansi-styles/index.js
var q0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${t + e}m`, "wrapAnsi16"), M0 = /* @__PURE__ */ n((e = 0) => (t) => `\x1B[${38 + e};5;${t}\
m`, "wrapAnsi256"), j0 = /* @__PURE__ */ n((e = 0) => (t, r, i) => `\x1B[${38 + e};2;${t};${r};${i}m`, "wrapAnsi16m"), oe = {
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
}, bM = Object.keys(oe.modifier), AR = Object.keys(oe.color), TR = Object.keys(oe.bgColor), vM = [...AR, ...TR];
function RR() {
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
  }), oe.color.close = "\x1B[39m", oe.bgColor.close = "\x1B[49m", oe.color.ansi = q0(), oe.color.ansi256 = M0(), oe.color.ansi16m = j0(), oe.
  bgColor.ansi = q0(10), oe.bgColor.ansi256 = M0(10), oe.bgColor.ansi16m = j0(10), Object.defineProperties(oe, {
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
n(RR, "assembleStyles");
var BR = RR(), I0 = BR;

// ../node_modules/wrap-ansi/index.js
var to = /* @__PURE__ */ new Set([
  "\x1B",
  "\x9B"
]), kR = 39, ef = "\x07", U0 = "[", OR = "]", H0 = "m", tf = `${OR}8;;`, L0 = /* @__PURE__ */ n((e) => `${to.values().next().value}${U0}${e}${H0}`,
"wrapAnsiCode"), N0 = /* @__PURE__ */ n((e) => `${to.values().next().value}${tf}${e}${ef}`, "wrapAnsiHyperlink"), PR = /* @__PURE__ */ n((e) => e.
split(" ").map((t) => ir(t)), "wordLengths"), Zl = /* @__PURE__ */ n((e, t, r) => {
  let i = [...t], s = !1, o = !1, u = ir(wt(e[e.length - 1]));
  for (let [a, l] of i.entries()) {
    let f = ir(l);
    if (u + f <= r ? e[e.length - 1] += l : (e.push(l), u = 0), to.has(l) && (s = !0, o = i.slice(a + 1).join("").startsWith(tf)), s) {
      o ? l === ef && (s = !1, o = !1) : l === H0 && (s = !1);
      continue;
    }
    u += f, u === r && a < i.length - 1 && (e.push(""), u = 0);
  }
  !u && e[e.length - 1].length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
}, "wrapWord"), qR = /* @__PURE__ */ n((e) => {
  let t = e.split(" "), r = t.length;
  for (; r > 0 && !(ir(t[r - 1]) > 0); )
    r--;
  return r === t.length ? e : t.slice(0, r).join(" ") + t.slice(r).join("");
}, "stringVisibleTrimSpacesRight"), MR = /* @__PURE__ */ n((e, t, r = {}) => {
  if (r.trim !== !1 && e.trim() === "")
    return "";
  let i = "", s, o, u = PR(e), a = [""];
  for (let [f, p] of e.split(" ").entries()) {
    r.trim !== !1 && (a[a.length - 1] = a[a.length - 1].trimStart());
    let d = ir(a[a.length - 1]);
    if (f !== 0 && (d >= t && (r.wordWrap === !1 || r.trim === !1) && (a.push(""), d = 0), (d > 0 || r.trim === !1) && (a[a.length - 1] += "\
 ", d++)), r.hard && u[f] > t) {
      let c = t - d, h = 1 + Math.floor((u[f] - c - 1) / t);
      Math.floor((u[f] - 1) / t) < h && a.push(""), Zl(a, p, t);
      continue;
    }
    if (d + u[f] > t && d > 0 && u[f] > 0) {
      if (r.wordWrap === !1 && d < t) {
        Zl(a, p, t);
        continue;
      }
      a.push("");
    }
    if (d + u[f] > t && r.wordWrap === !1) {
      Zl(a, p, t);
      continue;
    }
    a[a.length - 1] += p;
  }
  r.trim !== !1 && (a = a.map((f) => qR(f)));
  let l = [...a.join(`
`)];
  for (let [f, p] of l.entries()) {
    if (i += p, to.has(p)) {
      let { groups: c } = new RegExp(`(?:\\${U0}(?<code>\\d+)m|\\${tf}(?<uri>.*)${ef})`).exec(l.slice(f).join("")) || { groups: {} };
      if (c.code !== void 0) {
        let h = Number.parseFloat(c.code);
        s = h === kR ? void 0 : h;
      } else c.uri !== void 0 && (o = c.uri.length === 0 ? void 0 : c.uri);
    }
    let d = I0.codes.get(Number(s));
    l[f + 1] === `
` ? (o && (i += N0("")), s && d && (i += L0(d))) : p === `
` && (s && d && (i += L0(s)), o && (i += N0(o)));
  }
  return i;
}, "exec");
function ro(e, t, r) {
  return String(e).normalize().replace(/\r\n/g, `
`).split(`
`).map((i) => MR(i, t, r)).join(`
`);
}
n(ro, "wrapAnsi");

// ../node_modules/boxen/index.js
var zR = Y(Yl(), 1);
var Mt = `
`, Ae = " ", Xi = "none", G0 = /* @__PURE__ */ n(() => {
  let { env: e, stdout: t, stderr: r } = Ki.default;
  return t?.columns ? t.columns : r?.columns ? r.columns : e.COLUMNS ? Number.parseInt(e.COLUMNS, 10) : 80;
}, "terminalColumns"), W0 = /* @__PURE__ */ n((e) => typeof e == "number" ? {
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
}, "getObject"), Qi = /* @__PURE__ */ n((e) => e === Xi ? 0 : 2, "getBorderWidth"), jR = /* @__PURE__ */ n((e) => {
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
  if (e === Xi) {
    e = {};
    for (let i of t)
      e[i] = "";
  }
  if (typeof e == "string") {
    if (r = V0.default[e], !r)
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
}, "getBorderChars"), IR = /* @__PURE__ */ n((e, t, r) => {
  let i = "", s = et(e);
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
}, "makeTitle"), LR = /* @__PURE__ */ n((e, { padding: t, width: r, textAlignment: i, height: s }) => {
  e = (0, rf.default)(e, { align: i });
  let o = e.split(Mt), u = eo(e), a = r - t.left - t.right;
  if (u > a) {
    let p = [];
    for (let d of o) {
      let c = ro(d, a, { hard: !0 }), g = (0, rf.default)(c, { align: i }).split(`
`), w = Math.max(...g.map((y) => et(y)));
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
    if (r - et(p) > 0)
      switch (i) {
        case "center":
          return p + Ae.repeat(r - et(p));
        case "right":
          return p + Ae.repeat(r - et(p));
        default:
          return p + Ae.repeat(r - et(p));
      }
    return p;
  }), t.top > 0 && (o = [...Array.from({ length: t.top }).fill(Ae.repeat(r)), ...o]), t.bottom > 0 && (o = [...o, ...Array.from({ length: t.
  bottom }).fill(Ae.repeat(r))]), s && o.length > s ? o = o.slice(0, s) : s && o.length < s && (o = [...o, ...Array.from({ length: s - o.length }).
  fill(Ae.repeat(r))]), o.join(Mt);
}, "makeContentText"), NR = /* @__PURE__ */ n((e, t, r) => {
  let i = /* @__PURE__ */ n((p) => {
    let d = r.borderColor ? WR(r.borderColor)(p) : p;
    return r.dimBorder ? tr.dim(d) : d;
  }, "colorizeBorder"), s = /* @__PURE__ */ n((p) => r.backgroundColor ? $R(r.backgroundColor)(p) : p, "colorizeContent"), o = jR(r.borderStyle),
  u = G0(), a = Ae.repeat(r.margin.left);
  if (r.float === "center") {
    let p = Math.max((u - t - Qi(r.borderStyle)) / 2, 0);
    a = Ae.repeat(p);
  } else if (r.float === "right") {
    let p = Math.max(u - t - r.margin.right - Qi(r.borderStyle), 0);
    a = Ae.repeat(p);
  }
  let l = "";
  r.margin.top && (l += Mt.repeat(r.margin.top)), (r.borderStyle !== Xi || r.title) && (l += i(a + o.topLeft + (r.title ? IR(r.title, o.top.
  repeat(t), r.titleAlignment) : o.top.repeat(t)) + o.topRight) + Mt);
  let f = e.split(Mt);
  return l += f.map((p) => a + i(o.left) + s(p) + i(o.right)).join(Mt), r.borderStyle !== Xi && (l += Mt + i(a + o.bottomLeft + o.bottom.repeat(
  t) + o.bottomRight)), r.margin.bottom && (l += Mt.repeat(r.margin.bottom)), l;
}, "boxContent"), UR = /* @__PURE__ */ n((e) => {
  if (e.fullscreen && Ki.default?.stdout) {
    let t = [Ki.default.stdout.columns, Ki.default.stdout.rows];
    typeof e.fullscreen == "function" && (t = e.fullscreen(...t)), e.width || (e.width = t[0]), e.height || (e.height = t[1]);
  }
  return e.width && (e.width = Math.max(1, e.width - Qi(e.borderStyle))), e.height && (e.height = Math.max(1, e.height - Qi(e.borderStyle))),
  e;
}, "sanitizeOptions"), $0 = /* @__PURE__ */ n((e, t) => t === Xi ? e : ` ${e} `, "formatTitle"), HR = /* @__PURE__ */ n((e, t) => {
  t = UR(t);
  let r = t.width !== void 0, i = G0(), s = Qi(t.borderStyle), o = i - t.margin.left - t.margin.right - s, u = eo(ro(e, i - s, { hard: !0, trim: !1 })) +
  t.padding.left + t.padding.right;
  if (t.title && r ? (t.title = t.title.slice(0, Math.max(0, t.width - 2)), t.title && (t.title = $0(t.title, t.borderStyle))) : t.title && (t.
  title = t.title.slice(0, Math.max(0, o - 2)), t.title && (t.title = $0(t.title, t.borderStyle), et(t.title) > u && (t.width = et(t.title)))),
  t.width = t.width ? t.width : u, !r) {
    if (t.margin.left && t.margin.right && t.width > o) {
      let l = (i - t.width - s) / (t.margin.left + t.margin.right);
      t.margin.left = Math.max(0, Math.floor(t.margin.left * l)), t.margin.right = Math.max(0, Math.floor(t.margin.right * l));
    }
    t.width = Math.min(t.width, i - s - t.margin.left - t.margin.right);
  }
  return t.width - (t.padding.left + t.padding.right) <= 0 && (t.padding.left = 0, t.padding.right = 0), t.height && t.height - (t.padding.top +
  t.padding.bottom) <= 0 && (t.padding.top = 0, t.padding.bottom = 0), t;
}, "determineDimensions"), nf = /* @__PURE__ */ n((e) => e.match(/^#(?:[0-f]{3}){1,2}$/i), "isHex"), z0 = /* @__PURE__ */ n((e) => typeof e ==
"string" && (tr[e] ?? nf(e)), "isColorValid"), WR = /* @__PURE__ */ n((e) => nf(e) ? tr.hex(e) : tr[e], "getColorFn"), $R = /* @__PURE__ */ n(
(e) => nf(e) ? tr.bgHex(e) : tr[Kl(["bg", e])], "getBGColorFn");
function sf(e, t) {
  if (t = {
    padding: 0,
    borderStyle: "single",
    dimBorder: !1,
    textAlignment: "left",
    float: "left",
    titleAlignment: "left",
    ...t
  }, t.align && (t.textAlignment = t.align), t.borderColor && !z0(t.borderColor))
    throw new Error(`${t.borderColor} is not a valid borderColor`);
  if (t.backgroundColor && !z0(t.backgroundColor))
    throw new Error(`${t.backgroundColor} is not a valid backgroundColor`);
  return t.padding = W0(t.padding), t.margin = W0(t.margin), t = HR(e, t), e = LR(e, t), NR(e, t.width, t);
}
n(sf, "boxen");

// src/cli/angular/helpers.ts
var af = Y(_n(), 1), lf = Y(of(), 1);
var en = "angular.json", VR = lf.dedent`
  import { setCompodocJson } from "@storybook/addon-docs/angular";
  import docJson from "../documentation.json";
  setCompodocJson(docJson);
`.trimStart(), GR = /* @__PURE__ */ n(async () => {
  K0.logger.plain(
    // Create a text which explains the user why compodoc is necessary
    sf(
      lf.dedent`
      Compodoc is a great tool to generate documentation for your Angular projects.
      Storybook can use the documentation generated by Compodoc to extract argument definitions
      and JSDOC comments to display them in the Storybook UI. We highly recommend using Compodoc for
      your Angular projects to get the best experience out of Storybook.
    `,
      { title: "Compodoc", borderStyle: "round", padding: 1, borderColor: "#F1618C" }
    )
  );
  let { useCompoDoc: e } = await (0, af.default)({
    type: "confirm",
    name: "useCompoDoc",
    message: "Do you want to use Compodoc for documentation?"
  });
  return e;
}, "promptForCompoDocs"), uf = class {
  static {
    n(this, "AngularJSON");
  }
  constructor() {
    if (!(0, Nr.existsSync)(en))
      throw new X0.MissingAngularJsonError({ path: (0, J0.join)(process.cwd(), en) });
    let t = (0, Nr.readFileSync)(en, "utf8");
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
      let { projectName: t } = await (0, af.default)({
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
    (0, Nr.writeFileSync)(en, JSON.stringify(this.json, null, 2));
  }
};

// src/cli/eslintPlugin.ts
var hf = require("node:fs"), rn = require("node:fs/promises"), cf = require("@storybook/core/common"), no = require("@storybook/core/csf-tools");

// ../node_modules/detect-indent/index.js
var YR = /^(?:( )+|\t+)/, tn = "space", Z0 = "tab";
function Q0(e, t) {
  let r = /* @__PURE__ */ new Map(), i = 0, s, o;
  for (let u of e.split(/\n/g)) {
    if (!u)
      continue;
    let a, l, f, p, d, c = u.match(YR);
    if (c === null)
      i = 0, s = "";
    else {
      if (a = c[0].length, l = c[1] ? tn : Z0, t && l === tn && a === 1)
        continue;
      l !== s && (i = 0), s = l, f = 1, p = 0;
      let h = a - i;
      if (i = a, h === 0)
        f = 0, p = 1;
      else {
        let g = h > 0 ? h : -h;
        o = JR(l, g);
      }
      d = r.get(o), d = d === void 0 ? [1, 0] : [d[0] + f, d[1] + p], r.set(o, d);
    }
  }
  return r;
}
n(Q0, "makeIndentsMap");
function JR(e, t) {
  return (e === tn ? "s" : "t") + String(t);
}
n(JR, "encodeIndentsKey");
function KR(e) {
  let r = e[0] === "s" ? tn : Z0, i = Number(e.slice(1));
  return { type: r, amount: i };
}
n(KR, "decodeIndentsKey");
function XR(e) {
  let t, r = 0, i = 0;
  for (let [s, [o, u]] of e)
    (o > r || o === r && u > i) && (r = o, i = u, t = s);
  return t;
}
n(XR, "getMostUsedKey");
function QR(e, t) {
  return (e === tn ? " " : "	").repeat(t);
}
n(QR, "makeIndentString");
function ff(e) {
  if (typeof e != "string")
    throw new TypeError("Expected a string");
  let t = Q0(e, !0);
  t.size === 0 && (t = Q0(e, !1));
  let r = XR(t), i, s = 0, o = "";
  return r !== void 0 && ({ type: i, amount: s } = KR(r), o = QR(i, s)), {
    amount: s,
    type: i,
    indent: o
  };
}
n(ff, "detectIndent");

// src/cli/eslintPlugin.ts
var ev = Y(vu(), 1), tv = Y(_n(), 1), rv = Y(of(), 1);
var iv = ["js", "cjs", "json"], ZR = ["yaml", "yml"], nv = /* @__PURE__ */ n(() => {
  let e = ".eslintrc", t = ZR.find(
    (i) => (0, hf.existsSync)(`${e}.${i}`)
  );
  if (t)
    throw new Error(t);
  let r = iv.find(
    (i) => (0, hf.existsSync)(`${e}.${i}`)
  );
  return r ? `${e}.${r}` : null;
}, "findEslintFile");
async function e8(e) {
  let t = await e.getAllDependencies(), r = await e.retrievePackageJson(), i = null;
  try {
    i = nv();
  } catch {
  }
  let s = !!t["eslint-plugin-storybook"];
  return { hasEslint: t.eslint || i || r.eslintConfig, isStorybookPluginInstalled: s, eslintConfigFile: i };
}
n(e8, "extractEslintInfo");
var io = /* @__PURE__ */ n((e) => {
  if (!e)
    return [];
  if (typeof e == "string")
    return [e];
  if (Array.isArray(e))
    return e;
  throw new Error(`Invalid eslint extends ${e}`);
}, "normalizeExtends");
async function t8(e, t) {
  if (e)
    if ((0, cf.paddedLog)(`Configuring Storybook ESLint plugin at ${e}`), e.endsWith("json")) {
      let r = JSON.parse(await (0, rn.readFile)(e, { encoding: "utf8" })), i = io(r.extends).filter(Boolean);
      r.extends = [...i, "plugin:storybook/recommended"];
      let s = await (0, rn.readFile)(e, { encoding: "utf8" }), o = ff(s).amount || 2;
      await (0, rn.writeFile)(e, JSON.stringify(r, void 0, o));
    } else {
      let r = await (0, no.readConfig)(e), i = io(r.getFieldValue(["extends"])).filter(Boolean);
      r.setFieldValue(["extends"], [...i, "plugin:storybook/recommended"]), await (0, no.writeConfig)(r);
    }
  else {
    (0, cf.paddedLog)("Configuring eslint-plugin-storybook in your package.json");
    let r = await t.retrievePackageJson(), i = io(r.eslintConfig?.extends).filter(Boolean);
    await t.writePackageJson({
      ...r,
      eslintConfig: {
        ...r.eslintConfig,
        extends: [...i, "plugin:storybook/recommended"]
      }
    });
  }
}
n(t8, "configureEslintPlugin");
var r8 = /* @__PURE__ */ n(async () => {
  let { shouldInstall: e } = await (0, tv.default)({
    type: "confirm",
    name: "shouldInstall",
    message: rv.dedent`
        We have detected that you're using ESLint. Storybook provides a plugin that gives the best experience with Storybook and helps follow best practices: ${ev.default.
    yellow(
      "https://github.com/storybookjs/eslint-plugin-storybook#readme"
    )}

        Would you like to install it?
      `,
    initial: !0
  });
  return e;
}, "suggestESLintPlugin");
