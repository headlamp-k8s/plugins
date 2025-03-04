import ESM_COMPAT_Module from "node:module";
import { fileURLToPath as ESM_COMPAT_fileURLToPath } from 'node:url';
import { dirname as ESM_COMPAT_dirname } from 'node:path';
const __filename = ESM_COMPAT_fileURLToPath(import.meta.url);
const __dirname = ESM_COMPAT_dirname(__filename);
const require = ESM_COMPAT_Module.createRequire(import.meta.url);
var Ui = Object.create;
var Ze = Object.defineProperty;
var $i = Object.getOwnPropertyDescriptor;
var qi = Object.getOwnPropertyNames;
var Wi = Object.getPrototypeOf, Hi = Object.prototype.hasOwnProperty;
var o = (e, t) => Ze(e, "name", { value: t, configurable: !0 }), y = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(e, {
  get: (t, r) => (typeof require < "u" ? require : t)[r]
}) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var p = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Vi = (e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let i of qi(t))
      !Hi.call(e, i) && i !== r && Ze(e, i, { get: () => t[i], enumerable: !(n = $i(t, i)) || n.enumerable });
  return e;
};
var R = (e, t, r) => (r = e != null ? Ui(Wi(e)) : {}, Vi(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? Ze(r, "default", { value: e, enumerable: !0 }) : r,
  e
));

// ../node_modules/picocolors/picocolors.js
var pr = p((Bl, Qe) => {
  var lr = process.argv || [], ce = process.env, zi = !("NO_COLOR" in ce || lr.includes("--no-color")) && ("FORCE_COLOR" in ce || lr.includes(
  "--color") || process.platform === "win32" || y != null && y("tty").isatty(1) && ce.TERM !== "dumb" || "CI" in ce), Ji = /* @__PURE__ */ o(
  (e, t, r = e) => (n) => {
    let i = "" + n, s = i.indexOf(t, e.length);
    return ~s ? e + Ki(i, t, r, s) + t : e + i + t;
  }, "formatter"), Ki = /* @__PURE__ */ o((e, t, r, n) => {
    let i = "", s = 0;
    do
      i += e.substring(s, n) + r, s = n + t.length, n = e.indexOf(t, s);
    while (~n);
    return i + e.substring(s);
  }, "replaceClose"), fr = /* @__PURE__ */ o((e = zi) => {
    let t = e ? Ji : () => String;
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
  Qe.exports = fr();
  Qe.exports.createColors = fr;
});

// ../node_modules/isexe/windows.js
var Pr = p((Wl, vr) => {
  vr.exports = wr;
  wr.sync = Yi;
  var xr = y("fs");
  function Xi(e, t) {
    var r = t.pathExt !== void 0 ? t.pathExt : process.env.PATHEXT;
    if (!r || (r = r.split(";"), r.indexOf("") !== -1))
      return !0;
    for (var n = 0; n < r.length; n++) {
      var i = r[n].toLowerCase();
      if (i && e.substr(-i.length).toLowerCase() === i)
        return !0;
    }
    return !1;
  }
  o(Xi, "checkPathExt");
  function Sr(e, t, r) {
    return !e.isSymbolicLink() && !e.isFile() ? !1 : Xi(t, r);
  }
  o(Sr, "checkStat");
  function wr(e, t, r) {
    xr.stat(e, function(n, i) {
      r(n, n ? !1 : Sr(i, e, t));
    });
  }
  o(wr, "isexe");
  function Yi(e, t) {
    return Sr(xr.statSync(e), e, t);
  }
  o(Yi, "sync");
});

// ../node_modules/isexe/mode.js
var Cr = p((Vl, Ir) => {
  Ir.exports = Tr;
  Tr.sync = Zi;
  var Er = y("fs");
  function Tr(e, t, r) {
    Er.stat(e, function(n, i) {
      r(n, n ? !1 : kr(i, t));
    });
  }
  o(Tr, "isexe");
  function Zi(e, t) {
    return kr(Er.statSync(e), t);
  }
  o(Zi, "sync");
  function kr(e, t) {
    return e.isFile() && Qi(e, t);
  }
  o(kr, "checkStat");
  function Qi(e, t) {
    var r = e.mode, n = e.uid, i = e.gid, s = t.uid !== void 0 ? t.uid : process.getuid && process.getuid(), a = t.gid !== void 0 ? t.gid : process.
    getgid && process.getgid(), c = parseInt("100", 8), u = parseInt("010", 8), l = parseInt("001", 8), f = c | u, x = r & l || r & u && i ===
    a || r & c && n === s || r & f && s === 0;
    return x;
  }
  o(Qi, "checkMode");
});

// ../node_modules/isexe/index.js
var Ar = p((Kl, Or) => {
  var Jl = y("fs"), fe;
  process.platform === "win32" || global.TESTING_WINDOWS ? fe = Pr() : fe = Cr();
  Or.exports = et;
  et.sync = es;
  function et(e, t, r) {
    if (typeof t == "function" && (r = t, t = {}), !r) {
      if (typeof Promise != "function")
        throw new TypeError("callback not provided");
      return new Promise(function(n, i) {
        et(e, t || {}, function(s, a) {
          s ? i(s) : n(a);
        });
      });
    }
    fe(e, t || {}, function(n, i) {
      n && (n.code === "EACCES" || t && t.ignoreErrors) && (n = null, i = !1), r(n, i);
    });
  }
  o(et, "isexe");
  function es(e, t) {
    try {
      return fe.sync(e, t || {});
    } catch (r) {
      if (t && t.ignoreErrors || r.code === "EACCES")
        return !1;
      throw r;
    }
  }
  o(es, "sync");
});

// ../node_modules/cross-spawn/node_modules/which/which.js
var Dr = p((Yl, Br) => {
  var M = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys", Rr = y("path"), ts = M ? ";" : "\
:", _r = Ar(), Gr = /* @__PURE__ */ o((e) => Object.assign(new Error(`not found: ${e}`), { code: "ENOENT" }), "getNotFoundError"), jr = /* @__PURE__ */ o(
  (e, t) => {
    let r = t.colon || ts, n = e.match(/\//) || M && e.match(/\\/) ? [""] : [
      // windows always checks the cwd first
      ...M ? [process.cwd()] : [],
      ...(t.path || process.env.PATH || /* istanbul ignore next: very unusual */
      "").split(r)
    ], i = M ? t.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "", s = M ? i.split(r) : [""];
    return M && e.indexOf(".") !== -1 && s[0] !== "" && s.unshift(""), {
      pathEnv: n,
      pathExt: s,
      pathExtExe: i
    };
  }, "getPathInfo"), Nr = /* @__PURE__ */ o((e, t, r) => {
    typeof t == "function" && (r = t, t = {}), t || (t = {});
    let { pathEnv: n, pathExt: i, pathExtExe: s } = jr(e, t), a = [], c = /* @__PURE__ */ o((l) => new Promise((f, x) => {
      if (l === n.length)
        return t.all && a.length ? f(a) : x(Gr(e));
      let b = n[l], m = /^".*"$/.test(b) ? b.slice(1, -1) : b, g = Rr.join(m, e), h = !m && /^\.[\\\/]/.test(e) ? e.slice(0, 2) + g : g;
      f(u(h, l, 0));
    }), "step"), u = /* @__PURE__ */ o((l, f, x) => new Promise((b, m) => {
      if (x === i.length)
        return b(c(f + 1));
      let g = i[x];
      _r(l + g, { pathExt: s }, (h, S) => {
        if (!h && S)
          if (t.all)
            a.push(l + g);
          else
            return b(l + g);
        return b(u(l, f, x + 1));
      });
    }), "subStep");
    return r ? c(0).then((l) => r(null, l), r) : c(0);
  }, "which"), rs = /* @__PURE__ */ o((e, t) => {
    t = t || {};
    let { pathEnv: r, pathExt: n, pathExtExe: i } = jr(e, t), s = [];
    for (let a = 0; a < r.length; a++) {
      let c = r[a], u = /^".*"$/.test(c) ? c.slice(1, -1) : c, l = Rr.join(u, e), f = !u && /^\.[\\\/]/.test(e) ? e.slice(0, 2) + l : l;
      for (let x = 0; x < n.length; x++) {
        let b = f + n[x];
        try {
          if (_r.sync(b, { pathExt: i }))
            if (t.all)
              s.push(b);
            else
              return b;
        } catch {
        }
      }
    }
    if (t.all && s.length)
      return s;
    if (t.nothrow)
      return null;
    throw Gr(e);
  }, "whichSync");
  Br.exports = Nr;
  Nr.sync = rs;
});

// ../node_modules/path-key/index.js
var rt = p((Ql, tt) => {
  "use strict";
  var Mr = /* @__PURE__ */ o((e = {}) => {
    let t = e.env || process.env;
    return (e.platform || process.platform) !== "win32" ? "PATH" : Object.keys(t).reverse().find((n) => n.toUpperCase() === "PATH") || "Path";
  }, "pathKey");
  tt.exports = Mr;
  tt.exports.default = Mr;
});

// ../node_modules/cross-spawn/lib/util/resolveCommand.js
var $r = p((tf, Ur) => {
  "use strict";
  var Lr = y("path"), ns = Dr(), os = rt();
  function Fr(e, t) {
    let r = e.options.env || process.env, n = process.cwd(), i = e.options.cwd != null, s = i && process.chdir !== void 0 && !process.chdir.
    disabled;
    if (s)
      try {
        process.chdir(e.options.cwd);
      } catch {
      }
    let a;
    try {
      a = ns.sync(e.command, {
        path: r[os({ env: r })],
        pathExt: t ? Lr.delimiter : void 0
      });
    } catch {
    } finally {
      s && process.chdir(n);
    }
    return a && (a = Lr.resolve(i ? e.options.cwd : "", a)), a;
  }
  o(Fr, "resolveCommandAttempt");
  function is(e) {
    return Fr(e) || Fr(e, !0);
  }
  o(is, "resolveCommand");
  Ur.exports = is;
});

// ../node_modules/cross-spawn/lib/util/escape.js
var qr = p((nf, ot) => {
  "use strict";
  var nt = /([()\][%!^"`<>&|;, *?])/g;
  function ss(e) {
    return e = e.replace(nt, "^$1"), e;
  }
  o(ss, "escapeCommand");
  function as(e, t) {
    return e = `${e}`, e = e.replace(/(\\*)"/g, '$1$1\\"'), e = e.replace(/(\\*)$/, "$1$1"), e = `"${e}"`, e = e.replace(nt, "^$1"), t && (e =
    e.replace(nt, "^$1")), e;
  }
  o(as, "escapeArgument");
  ot.exports.command = ss;
  ot.exports.argument = as;
});

// ../node_modules/shebang-regex/index.js
var Hr = p((sf, Wr) => {
  "use strict";
  Wr.exports = /^#!(.*)/;
});

// ../node_modules/shebang-command/index.js
var zr = p((af, Vr) => {
  "use strict";
  var cs = Hr();
  Vr.exports = (e = "") => {
    let t = e.match(cs);
    if (!t)
      return null;
    let [r, n] = t[0].replace(/#! ?/, "").split(" "), i = r.split("/").pop();
    return i === "env" ? n : n ? `${i} ${n}` : i;
  };
});

// ../node_modules/cross-spawn/lib/util/readShebang.js
var Kr = p((cf, Jr) => {
  "use strict";
  var it = y("fs"), us = zr();
  function ls(e) {
    let r = Buffer.alloc(150), n;
    try {
      n = it.openSync(e, "r"), it.readSync(n, r, 0, 150, 0), it.closeSync(n);
    } catch {
    }
    return us(r.toString());
  }
  o(ls, "readShebang");
  Jr.exports = ls;
});

// ../node_modules/cross-spawn/lib/parse.js
var Qr = p((lf, Zr) => {
  "use strict";
  var fs = y("path"), Xr = $r(), Yr = qr(), ps = Kr(), ds = process.platform === "win32", ms = /\.(?:com|exe)$/i, hs = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function ys(e) {
    e.file = Xr(e);
    let t = e.file && ps(e.file);
    return t ? (e.args.unshift(e.file), e.command = t, Xr(e)) : e.file;
  }
  o(ys, "detectShebang");
  function gs(e) {
    if (!ds)
      return e;
    let t = ys(e), r = !ms.test(t);
    if (e.options.forceShell || r) {
      let n = hs.test(t);
      e.command = fs.normalize(e.command), e.command = Yr.command(e.command), e.args = e.args.map((s) => Yr.argument(s, n));
      let i = [e.command].concat(e.args).join(" ");
      e.args = ["/d", "/s", "/c", `"${i}"`], e.command = process.env.comspec || "cmd.exe", e.options.windowsVerbatimArguments = !0;
    }
    return e;
  }
  o(gs, "parseNonShell");
  function bs(e, t, r) {
    t && !Array.isArray(t) && (r = t, t = null), t = t ? t.slice(0) : [], r = Object.assign({}, r);
    let n = {
      command: e,
      args: t,
      options: r,
      file: void 0,
      original: {
        command: e,
        args: t
      }
    };
    return r.shell ? n : gs(n);
  }
  o(bs, "parse");
  Zr.exports = bs;
});

// ../node_modules/cross-spawn/lib/enoent.js
var rn = p((pf, tn) => {
  "use strict";
  var st = process.platform === "win32";
  function at(e, t) {
    return Object.assign(new Error(`${t} ${e.command} ENOENT`), {
      code: "ENOENT",
      errno: "ENOENT",
      syscall: `${t} ${e.command}`,
      path: e.command,
      spawnargs: e.args
    });
  }
  o(at, "notFoundError");
  function xs(e, t) {
    if (!st)
      return;
    let r = e.emit;
    e.emit = function(n, i) {
      if (n === "exit") {
        let s = en(i, t, "spawn");
        if (s)
          return r.call(e, "error", s);
      }
      return r.apply(e, arguments);
    };
  }
  o(xs, "hookChildProcess");
  function en(e, t) {
    return st && e === 1 && !t.file ? at(t.original, "spawn") : null;
  }
  o(en, "verifyENOENT");
  function Ss(e, t) {
    return st && e === 1 && !t.file ? at(t.original, "spawnSync") : null;
  }
  o(Ss, "verifyENOENTSync");
  tn.exports = {
    hookChildProcess: xs,
    verifyENOENT: en,
    verifyENOENTSync: Ss,
    notFoundError: at
  };
});

// ../node_modules/cross-spawn/index.js
var lt = p((mf, L) => {
  "use strict";
  var nn = y("child_process"), ct = Qr(), ut = rn();
  function on(e, t, r) {
    let n = ct(e, t, r), i = nn.spawn(n.command, n.args, n.options);
    return ut.hookChildProcess(i, n), i;
  }
  o(on, "spawn");
  function ws(e, t, r) {
    let n = ct(e, t, r), i = nn.spawnSync(n.command, n.args, n.options);
    return i.error = i.error || ut.verifyENOENTSync(i.status, n), i;
  }
  o(ws, "spawnSync");
  L.exports = on;
  L.exports.spawn = on;
  L.exports.sync = ws;
  L.exports._parse = ct;
  L.exports._enoent = ut;
});

// ../node_modules/execa/node_modules/strip-final-newline/index.js
var an = p((yf, sn) => {
  "use strict";
  sn.exports = (e) => {
    let t = typeof e == "string" ? `
` : 10, r = typeof e == "string" ? "\r" : 13;
    return e[e.length - 1] === t && (e = e.slice(0, e.length - 1)), e[e.length - 1] === r && (e = e.slice(0, e.length - 1)), e;
  };
});

// ../node_modules/npm-run-path/index.js
var ln = p((gf, K) => {
  "use strict";
  var J = y("path"), cn = rt(), un = /* @__PURE__ */ o((e) => {
    e = {
      cwd: process.cwd(),
      path: process.env[cn()],
      execPath: process.execPath,
      ...e
    };
    let t, r = J.resolve(e.cwd), n = [];
    for (; t !== r; )
      n.push(J.join(r, "node_modules/.bin")), t = r, r = J.resolve(r, "..");
    let i = J.resolve(e.cwd, e.execPath, "..");
    return n.push(i), n.concat(e.path).join(J.delimiter);
  }, "npmRunPath");
  K.exports = un;
  K.exports.default = un;
  K.exports.env = (e) => {
    e = {
      env: process.env,
      ...e
    };
    let t = { ...e.env }, r = cn({ env: t });
    return e.path = t[r], t[r] = K.exports(e), t;
  };
});

// ../node_modules/mimic-fn/index.js
var pn = p((xf, ft) => {
  "use strict";
  var fn = /* @__PURE__ */ o((e, t) => {
    for (let r of Reflect.ownKeys(t))
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    return e;
  }, "mimicFn");
  ft.exports = fn;
  ft.exports.default = fn;
});

// ../node_modules/onetime/index.js
var mn = p((wf, de) => {
  "use strict";
  var vs = pn(), pe = /* @__PURE__ */ new WeakMap(), dn = /* @__PURE__ */ o((e, t = {}) => {
    if (typeof e != "function")
      throw new TypeError("Expected a function");
    let r, n = 0, i = e.displayName || e.name || "<anonymous>", s = /* @__PURE__ */ o(function(...a) {
      if (pe.set(s, ++n), n === 1)
        r = e.apply(this, a), e = null;
      else if (t.throw === !0)
        throw new Error(`Function \`${i}\` can only be called once`);
      return r;
    }, "onetime");
    return vs(s, e), pe.set(s, n), s;
  }, "onetime");
  de.exports = dn;
  de.exports.default = dn;
  de.exports.callCount = (e) => {
    if (!pe.has(e))
      throw new Error(`The given function \`${e.name}\` is not wrapped by the \`onetime\` package`);
    return pe.get(e);
  };
});

// ../node_modules/execa/node_modules/human-signals/build/src/core.js
var hn = p((me) => {
  "use strict";
  Object.defineProperty(me, "__esModule", { value: !0 });
  me.SIGNALS = void 0;
  var Ps = [
    {
      name: "SIGHUP",
      number: 1,
      action: "terminate",
      description: "Terminal closed",
      standard: "posix"
    },
    {
      name: "SIGINT",
      number: 2,
      action: "terminate",
      description: "User interruption with CTRL-C",
      standard: "ansi"
    },
    {
      name: "SIGQUIT",
      number: 3,
      action: "core",
      description: "User interruption with CTRL-\\",
      standard: "posix"
    },
    {
      name: "SIGILL",
      number: 4,
      action: "core",
      description: "Invalid machine instruction",
      standard: "ansi"
    },
    {
      name: "SIGTRAP",
      number: 5,
      action: "core",
      description: "Debugger breakpoint",
      standard: "posix"
    },
    {
      name: "SIGABRT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "ansi"
    },
    {
      name: "SIGIOT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "bsd"
    },
    {
      name: "SIGBUS",
      number: 7,
      action: "core",
      description: "Bus error due to misaligned, non-existing address or paging error",
      standard: "bsd"
    },
    {
      name: "SIGEMT",
      number: 7,
      action: "terminate",
      description: "Command should be emulated but is not implemented",
      standard: "other"
    },
    {
      name: "SIGFPE",
      number: 8,
      action: "core",
      description: "Floating point arithmetic error",
      standard: "ansi"
    },
    {
      name: "SIGKILL",
      number: 9,
      action: "terminate",
      description: "Forced termination",
      standard: "posix",
      forced: !0
    },
    {
      name: "SIGUSR1",
      number: 10,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGSEGV",
      number: 11,
      action: "core",
      description: "Segmentation fault",
      standard: "ansi"
    },
    {
      name: "SIGUSR2",
      number: 12,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGPIPE",
      number: 13,
      action: "terminate",
      description: "Broken pipe or socket",
      standard: "posix"
    },
    {
      name: "SIGALRM",
      number: 14,
      action: "terminate",
      description: "Timeout or timer",
      standard: "posix"
    },
    {
      name: "SIGTERM",
      number: 15,
      action: "terminate",
      description: "Termination",
      standard: "ansi"
    },
    {
      name: "SIGSTKFLT",
      number: 16,
      action: "terminate",
      description: "Stack is empty or overflowed",
      standard: "other"
    },
    {
      name: "SIGCHLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "posix"
    },
    {
      name: "SIGCLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "other"
    },
    {
      name: "SIGCONT",
      number: 18,
      action: "unpause",
      description: "Unpaused",
      standard: "posix",
      forced: !0
    },
    {
      name: "SIGSTOP",
      number: 19,
      action: "pause",
      description: "Paused",
      standard: "posix",
      forced: !0
    },
    {
      name: "SIGTSTP",
      number: 20,
      action: "pause",
      description: 'Paused using CTRL-Z or "suspend"',
      standard: "posix"
    },
    {
      name: "SIGTTIN",
      number: 21,
      action: "pause",
      description: "Background process cannot read terminal input",
      standard: "posix"
    },
    {
      name: "SIGBREAK",
      number: 21,
      action: "terminate",
      description: "User interruption with CTRL-BREAK",
      standard: "other"
    },
    {
      name: "SIGTTOU",
      number: 22,
      action: "pause",
      description: "Background process cannot write to terminal output",
      standard: "posix"
    },
    {
      name: "SIGURG",
      number: 23,
      action: "ignore",
      description: "Socket received out-of-band data",
      standard: "bsd"
    },
    {
      name: "SIGXCPU",
      number: 24,
      action: "core",
      description: "Process timed out",
      standard: "bsd"
    },
    {
      name: "SIGXFSZ",
      number: 25,
      action: "core",
      description: "File too big",
      standard: "bsd"
    },
    {
      name: "SIGVTALRM",
      number: 26,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGPROF",
      number: 27,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGWINCH",
      number: 28,
      action: "ignore",
      description: "Terminal window size changed",
      standard: "bsd"
    },
    {
      name: "SIGIO",
      number: 29,
      action: "terminate",
      description: "I/O is available",
      standard: "other"
    },
    {
      name: "SIGPOLL",
      number: 29,
      action: "terminate",
      description: "Watched event",
      standard: "other"
    },
    {
      name: "SIGINFO",
      number: 29,
      action: "ignore",
      description: "Request for process information",
      standard: "other"
    },
    {
      name: "SIGPWR",
      number: 30,
      action: "terminate",
      description: "Device running out of power",
      standard: "systemv"
    },
    {
      name: "SIGSYS",
      number: 31,
      action: "core",
      description: "Invalid system call",
      standard: "other"
    },
    {
      name: "SIGUNUSED",
      number: 31,
      action: "terminate",
      description: "Invalid system call",
      standard: "other"
    }
  ];
  me.SIGNALS = Ps;
});

// ../node_modules/execa/node_modules/human-signals/build/src/realtime.js
var pt = p((F) => {
  "use strict";
  Object.defineProperty(F, "__esModule", { value: !0 });
  F.SIGRTMAX = F.getRealtimeSignals = void 0;
  var Es = /* @__PURE__ */ o(function() {
    let e = gn - yn + 1;
    return Array.from({ length: e }, Ts);
  }, "getRealtimeSignals");
  F.getRealtimeSignals = Es;
  var Ts = /* @__PURE__ */ o(function(e, t) {
    return {
      name: `SIGRT${t + 1}`,
      number: yn + t,
      action: "terminate",
      description: "Application-specific signal (realtime)",
      standard: "posix"
    };
  }, "getRealtimeSignal"), yn = 34, gn = 64;
  F.SIGRTMAX = gn;
});

// ../node_modules/execa/node_modules/human-signals/build/src/signals.js
var bn = p((he) => {
  "use strict";
  Object.defineProperty(he, "__esModule", { value: !0 });
  he.getSignals = void 0;
  var ks = y("os"), Is = hn(), Cs = pt(), Os = /* @__PURE__ */ o(function() {
    let e = (0, Cs.getRealtimeSignals)();
    return [...Is.SIGNALS, ...e].map(As);
  }, "getSignals");
  he.getSignals = Os;
  var As = /* @__PURE__ */ o(function({
    name: e,
    number: t,
    description: r,
    action: n,
    forced: i = !1,
    standard: s
  }) {
    let {
      signals: { [e]: a }
    } = ks.constants, c = a !== void 0;
    return { name: e, number: c ? a : t, description: r, supported: c, action: n, forced: i, standard: s };
  }, "normalizeSignal");
});

// ../node_modules/execa/node_modules/human-signals/build/src/main.js
var Sn = p((U) => {
  "use strict";
  Object.defineProperty(U, "__esModule", { value: !0 });
  U.signalsByNumber = U.signalsByName = void 0;
  var Rs = y("os"), xn = bn(), _s = pt(), Gs = /* @__PURE__ */ o(function() {
    return (0, xn.getSignals)().reduce(js, {});
  }, "getSignalsByName"), js = /* @__PURE__ */ o(function(e, { name: t, number: r, description: n, supported: i, action: s, forced: a, standard: c }) {
    return {
      ...e,
      [t]: { name: t, number: r, description: n, supported: i, action: s, forced: a, standard: c }
    };
  }, "getSignalByName"), Ns = Gs();
  U.signalsByName = Ns;
  var Bs = /* @__PURE__ */ o(function() {
    let e = (0, xn.getSignals)(), t = _s.SIGRTMAX + 1, r = Array.from({ length: t }, (n, i) => Ds(i, e));
    return Object.assign({}, ...r);
  }, "getSignalsByNumber"), Ds = /* @__PURE__ */ o(function(e, t) {
    let r = Ms(e, t);
    if (r === void 0)
      return {};
    let { name: n, description: i, supported: s, action: a, forced: c, standard: u } = r;
    return {
      [e]: {
        name: n,
        number: e,
        description: i,
        supported: s,
        action: a,
        forced: c,
        standard: u
      }
    };
  }, "getSignalByNumber"), Ms = /* @__PURE__ */ o(function(e, t) {
    let r = t.find(({ name: n }) => Rs.constants.signals[n] === e);
    return r !== void 0 ? r : t.find((n) => n.number === e);
  }, "findSignalByNumber"), Ls = Bs();
  U.signalsByNumber = Ls;
});

// ../node_modules/execa/lib/error.js
var vn = p((Af, wn) => {
  "use strict";
  var { signalsByName: Fs } = Sn(), Us = /* @__PURE__ */ o(({ timedOut: e, timeout: t, errorCode: r, signal: n, signalDescription: i, exitCode: s,
  isCanceled: a }) => e ? `timed out after ${t} milliseconds` : a ? "was canceled" : r !== void 0 ? `failed with ${r}` : n !== void 0 ? `was\
 killed with ${n} (${i})` : s !== void 0 ? `failed with exit code ${s}` : "failed", "getErrorPrefix"), $s = /* @__PURE__ */ o(({
    stdout: e,
    stderr: t,
    all: r,
    error: n,
    signal: i,
    exitCode: s,
    command: a,
    escapedCommand: c,
    timedOut: u,
    isCanceled: l,
    killed: f,
    parsed: { options: { timeout: x } }
  }) => {
    s = s === null ? void 0 : s, i = i === null ? void 0 : i;
    let b = i === void 0 ? void 0 : Fs[i].description, m = n && n.code, h = `Command ${Us({ timedOut: u, timeout: x, errorCode: m, signal: i,
    signalDescription: b, exitCode: s, isCanceled: l })}: ${a}`, S = Object.prototype.toString.call(n) === "[object Error]", T = S ? `${h}
${n.message}` : h, E = [T, t, e].filter(Boolean).join(`
`);
    return S ? (n.originalMessage = n.message, n.message = E) : n = new Error(E), n.shortMessage = T, n.command = a, n.escapedCommand = c, n.
    exitCode = s, n.signal = i, n.signalDescription = b, n.stdout = e, n.stderr = t, r !== void 0 && (n.all = r), "bufferedData" in n && delete n.
    bufferedData, n.failed = !0, n.timedOut = !!u, n.isCanceled = l, n.killed = f && !u, n;
  }, "makeError");
  wn.exports = $s;
});

// ../node_modules/execa/lib/stdio.js
var En = p((_f, dt) => {
  "use strict";
  var ye = ["stdin", "stdout", "stderr"], qs = /* @__PURE__ */ o((e) => ye.some((t) => e[t] !== void 0), "hasAlias"), Pn = /* @__PURE__ */ o(
  (e) => {
    if (!e)
      return;
    let { stdio: t } = e;
    if (t === void 0)
      return ye.map((n) => e[n]);
    if (qs(e))
      throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${ye.map((n) => `\`${n}\``).join(", ")}`);
    if (typeof t == "string")
      return t;
    if (!Array.isArray(t))
      throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof t}\``);
    let r = Math.max(t.length, ye.length);
    return Array.from({ length: r }, (n, i) => t[i]);
  }, "normalizeStdio");
  dt.exports = Pn;
  dt.exports.node = (e) => {
    let t = Pn(e);
    return t === "ipc" ? "ipc" : t === void 0 || typeof t == "string" ? [t, t, t, "ipc"] : t.includes("ipc") ? t : [...t, "ipc"];
  };
});

// ../node_modules/signal-exit/signals.js
var Tn = p((jf, ge) => {
  ge.exports = [
    "SIGABRT",
    "SIGALRM",
    "SIGHUP",
    "SIGINT",
    "SIGTERM"
  ];
  process.platform !== "win32" && ge.exports.push(
    "SIGVTALRM",
    "SIGXCPU",
    "SIGXFSZ",
    "SIGUSR2",
    "SIGTRAP",
    "SIGSYS",
    "SIGQUIT",
    "SIGIOT"
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  );
  process.platform === "linux" && ge.exports.push(
    "SIGIO",
    "SIGPOLL",
    "SIGPWR",
    "SIGSTKFLT",
    "SIGUNUSED"
  );
});

// ../node_modules/signal-exit/index.js
var An = p((Nf, W) => {
  var w = global.process, _ = /* @__PURE__ */ o(function(e) {
    return e && typeof e == "object" && typeof e.removeListener == "function" && typeof e.emit == "function" && typeof e.reallyExit == "func\
tion" && typeof e.listeners == "function" && typeof e.kill == "function" && typeof e.pid == "number" && typeof e.on == "function";
  }, "processOk");
  _(w) ? (kn = y("assert"), $ = Tn(), In = /^win/i.test(w.platform), X = y("events"), typeof X != "function" && (X = X.EventEmitter), w.__signal_exit_emitter__ ?
  P = w.__signal_exit_emitter__ : (P = w.__signal_exit_emitter__ = new X(), P.count = 0, P.emitted = {}), P.infinite || (P.setMaxListeners(1 / 0),
  P.infinite = !0), W.exports = function(e, t) {
    if (!_(global.process))
      return function() {
      };
    kn.equal(typeof e, "function", "a callback must be provided for exit handler"), q === !1 && mt();
    var r = "exit";
    t && t.alwaysLast && (r = "afterexit");
    var n = /* @__PURE__ */ o(function() {
      P.removeListener(r, e), P.listeners("exit").length === 0 && P.listeners("afterexit").length === 0 && be();
    }, "remove");
    return P.on(r, e), n;
  }, be = /* @__PURE__ */ o(function() {
    !q || !_(global.process) || (q = !1, $.forEach(function(t) {
      try {
        w.removeListener(t, xe[t]);
      } catch {
      }
    }), w.emit = Se, w.reallyExit = ht, P.count -= 1);
  }, "unload"), W.exports.unload = be, G = /* @__PURE__ */ o(function(t, r, n) {
    P.emitted[t] || (P.emitted[t] = !0, P.emit(t, r, n));
  }, "emit"), xe = {}, $.forEach(function(e) {
    xe[e] = /* @__PURE__ */ o(function() {
      if (_(global.process)) {
        var r = w.listeners(e);
        r.length === P.count && (be(), G("exit", null, e), G("afterexit", null, e), In && e === "SIGHUP" && (e = "SIGINT"), w.kill(w.pid, e));
      }
    }, "listener");
  }), W.exports.signals = function() {
    return $;
  }, q = !1, mt = /* @__PURE__ */ o(function() {
    q || !_(global.process) || (q = !0, P.count += 1, $ = $.filter(function(t) {
      try {
        return w.on(t, xe[t]), !0;
      } catch {
        return !1;
      }
    }), w.emit = On, w.reallyExit = Cn);
  }, "load"), W.exports.load = mt, ht = w.reallyExit, Cn = /* @__PURE__ */ o(function(t) {
    _(global.process) && (w.exitCode = t || /* istanbul ignore next */
    0, G("exit", w.exitCode, null), G("afterexit", w.exitCode, null), ht.call(w, w.exitCode));
  }, "processReallyExit"), Se = w.emit, On = /* @__PURE__ */ o(function(t, r) {
    if (t === "exit" && _(global.process)) {
      r !== void 0 && (w.exitCode = r);
      var n = Se.apply(this, arguments);
      return G("exit", w.exitCode, null), G("afterexit", w.exitCode, null), n;
    } else
      return Se.apply(this, arguments);
  }, "processEmit")) : W.exports = function() {
    return function() {
    };
  };
  var kn, $, In, X, P, be, G, xe, q, mt, ht, Cn, Se, On;
});

// ../node_modules/execa/lib/kill.js
var _n = p((Df, Rn) => {
  "use strict";
  var Ws = y("os"), Hs = An(), Vs = 1e3 * 5, zs = /* @__PURE__ */ o((e, t = "SIGTERM", r = {}) => {
    let n = e(t);
    return Js(e, t, r, n), n;
  }, "spawnedKill"), Js = /* @__PURE__ */ o((e, t, r, n) => {
    if (!Ks(t, r, n))
      return;
    let i = Ys(r), s = setTimeout(() => {
      e("SIGKILL");
    }, i);
    s.unref && s.unref();
  }, "setKillTimeout"), Ks = /* @__PURE__ */ o((e, { forceKillAfterTimeout: t }, r) => Xs(e) && t !== !1 && r, "shouldForceKill"), Xs = /* @__PURE__ */ o(
  (e) => e === Ws.constants.signals.SIGTERM || typeof e == "string" && e.toUpperCase() === "SIGTERM", "isSigterm"), Ys = /* @__PURE__ */ o(({
  forceKillAfterTimeout: e = !0 }) => {
    if (e === !0)
      return Vs;
    if (!Number.isFinite(e) || e < 0)
      throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${e}\` (${typeof e})`);
    return e;
  }, "getForceKillAfterTimeout"), Zs = /* @__PURE__ */ o((e, t) => {
    e.kill() && (t.isCanceled = !0);
  }, "spawnedCancel"), Qs = /* @__PURE__ */ o((e, t, r) => {
    e.kill(t), r(Object.assign(new Error("Timed out"), { timedOut: !0, signal: t }));
  }, "timeoutKill"), ea = /* @__PURE__ */ o((e, { timeout: t, killSignal: r = "SIGTERM" }, n) => {
    if (t === 0 || t === void 0)
      return n;
    let i, s = new Promise((c, u) => {
      i = setTimeout(() => {
        Qs(e, r, u);
      }, t);
    }), a = n.finally(() => {
      clearTimeout(i);
    });
    return Promise.race([s, a]);
  }, "setupTimeout"), ta = /* @__PURE__ */ o(({ timeout: e }) => {
    if (e !== void 0 && (!Number.isFinite(e) || e < 0))
      throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${e}\` (${typeof e})`);
  }, "validateTimeout"), ra = /* @__PURE__ */ o(async (e, { cleanup: t, detached: r }, n) => {
    if (!t || r)
      return n;
    let i = Hs(() => {
      e.kill();
    });
    return n.finally(() => {
      i();
    });
  }, "setExitHandler");
  Rn.exports = {
    spawnedKill: zs,
    spawnedCancel: Zs,
    setupTimeout: ea,
    validateTimeout: ta,
    setExitHandler: ra
  };
});

// ../node_modules/is-stream/index.js
var jn = p((Lf, Gn) => {
  "use strict";
  var k = /* @__PURE__ */ o((e) => e !== null && typeof e == "object" && typeof e.pipe == "function", "isStream");
  k.writable = (e) => k(e) && e.writable !== !1 && typeof e._write == "function" && typeof e._writableState == "object";
  k.readable = (e) => k(e) && e.readable !== !1 && typeof e._read == "function" && typeof e._readableState == "object";
  k.duplex = (e) => k.writable(e) && k.readable(e);
  k.transform = (e) => k.duplex(e) && typeof e._transform == "function";
  Gn.exports = k;
});

// ../node_modules/get-stream/buffer-stream.js
var Bn = p((Uf, Nn) => {
  "use strict";
  var { PassThrough: na } = y("stream");
  Nn.exports = (e) => {
    e = { ...e };
    let { array: t } = e, { encoding: r } = e, n = r === "buffer", i = !1;
    t ? i = !(r || n) : r = r || "utf8", n && (r = null);
    let s = new na({ objectMode: i });
    r && s.setEncoding(r);
    let a = 0, c = [];
    return s.on("data", (u) => {
      c.push(u), i ? a = c.length : a += u.length;
    }), s.getBufferedValue = () => t ? c : n ? Buffer.concat(c, a) : c.join(""), s.getBufferedLength = () => a, s;
  };
});

// ../node_modules/get-stream/index.js
var Dn = p(($f, Y) => {
  "use strict";
  var { constants: oa } = y("buffer"), ia = y("stream"), { promisify: sa } = y("util"), aa = Bn(), ca = sa(ia.pipeline), we = class extends Error {
    static {
      o(this, "MaxBufferError");
    }
    constructor() {
      super("maxBuffer exceeded"), this.name = "MaxBufferError";
    }
  };
  async function yt(e, t) {
    if (!e)
      throw new Error("Expected a stream");
    t = {
      maxBuffer: 1 / 0,
      ...t
    };
    let { maxBuffer: r } = t, n = aa(t);
    return await new Promise((i, s) => {
      let a = /* @__PURE__ */ o((c) => {
        c && n.getBufferedLength() <= oa.MAX_LENGTH && (c.bufferedData = n.getBufferedValue()), s(c);
      }, "rejectPromise");
      (async () => {
        try {
          await ca(e, n), i();
        } catch (c) {
          a(c);
        }
      })(), n.on("data", () => {
        n.getBufferedLength() > r && a(new we());
      });
    }), n.getBufferedValue();
  }
  o(yt, "getStream");
  Y.exports = yt;
  Y.exports.buffer = (e, t) => yt(e, { ...t, encoding: "buffer" });
  Y.exports.array = (e, t) => yt(e, { ...t, array: !0 });
  Y.exports.MaxBufferError = we;
});

// ../node_modules/merge-stream/index.js
var gt = p((Wf, Mn) => {
  "use strict";
  var { PassThrough: ua } = y("stream");
  Mn.exports = function() {
    var e = [], t = new ua({ objectMode: !0 });
    return t.setMaxListeners(0), t.add = r, t.isEmpty = n, t.on("unpipe", i), Array.prototype.slice.call(arguments).forEach(r), t;
    function r(s) {
      return Array.isArray(s) ? (s.forEach(r), this) : (e.push(s), s.once("end", i.bind(null, s)), s.once("error", t.emit.bind(t, "error")),
      s.pipe(t, { end: !1 }), this);
    }
    o(r, "add");
    function n() {
      return e.length == 0;
    }
    o(n, "isEmpty");
    function i(s) {
      e = e.filter(function(a) {
        return a !== s;
      }), !e.length && t.readable && t.end();
    }
    o(i, "remove");
  };
});

// ../node_modules/execa/lib/stream.js
var $n = p((Vf, Un) => {
  "use strict";
  var Fn = jn(), Ln = Dn(), la = gt(), fa = /* @__PURE__ */ o((e, t) => {
    t === void 0 || e.stdin === void 0 || (Fn(t) ? t.pipe(e.stdin) : e.stdin.end(t));
  }, "handleInput"), pa = /* @__PURE__ */ o((e, { all: t }) => {
    if (!t || !e.stdout && !e.stderr)
      return;
    let r = la();
    return e.stdout && r.add(e.stdout), e.stderr && r.add(e.stderr), r;
  }, "makeAllStream"), bt = /* @__PURE__ */ o(async (e, t) => {
    if (e) {
      e.destroy();
      try {
        return await t;
      } catch (r) {
        return r.bufferedData;
      }
    }
  }, "getBufferedData"), xt = /* @__PURE__ */ o((e, { encoding: t, buffer: r, maxBuffer: n }) => {
    if (!(!e || !r))
      return t ? Ln(e, { encoding: t, maxBuffer: n }) : Ln.buffer(e, { maxBuffer: n });
  }, "getStreamPromise"), da = /* @__PURE__ */ o(async ({ stdout: e, stderr: t, all: r }, { encoding: n, buffer: i, maxBuffer: s }, a) => {
    let c = xt(e, { encoding: n, buffer: i, maxBuffer: s }), u = xt(t, { encoding: n, buffer: i, maxBuffer: s }), l = xt(r, { encoding: n, buffer: i,
    maxBuffer: s * 2 });
    try {
      return await Promise.all([a, c, u, l]);
    } catch (f) {
      return Promise.all([
        { error: f, signal: f.signal, timedOut: f.timedOut },
        bt(e, c),
        bt(t, u),
        bt(r, l)
      ]);
    }
  }, "getSpawnedResult"), ma = /* @__PURE__ */ o(({ input: e }) => {
    if (Fn(e))
      throw new TypeError("The `input` option cannot be a stream in sync mode");
  }, "validateInputSync");
  Un.exports = {
    handleInput: fa,
    makeAllStream: pa,
    getSpawnedResult: da,
    validateInputSync: ma
  };
});

// ../node_modules/execa/lib/promise.js
var Wn = p((Jf, qn) => {
  "use strict";
  var ha = (async () => {
  })().constructor.prototype, ya = ["then", "catch", "finally"].map((e) => [
    e,
    Reflect.getOwnPropertyDescriptor(ha, e)
  ]), ga = /* @__PURE__ */ o((e, t) => {
    for (let [r, n] of ya) {
      let i = typeof t == "function" ? (...s) => Reflect.apply(n.value, t(), s) : n.value.bind(t);
      Reflect.defineProperty(e, r, { ...n, value: i });
    }
    return e;
  }, "mergePromise"), ba = /* @__PURE__ */ o((e) => new Promise((t, r) => {
    e.on("exit", (n, i) => {
      t({ exitCode: n, signal: i });
    }), e.on("error", (n) => {
      r(n);
    }), e.stdin && e.stdin.on("error", (n) => {
      r(n);
    });
  }), "getSpawnedPromise");
  qn.exports = {
    mergePromise: ga,
    getSpawnedPromise: ba
  };
});

// ../node_modules/execa/lib/command.js
var zn = p((Xf, Vn) => {
  "use strict";
  var Hn = /* @__PURE__ */ o((e, t = []) => Array.isArray(t) ? [e, ...t] : [e], "normalizeArgs"), xa = /^[\w.-]+$/, Sa = /"/g, wa = /* @__PURE__ */ o(
  (e) => typeof e != "string" || xa.test(e) ? e : `"${e.replace(Sa, '\\"')}"`, "escapeArg"), va = /* @__PURE__ */ o((e, t) => Hn(e, t).join(
  " "), "joinCommand"), Pa = /* @__PURE__ */ o((e, t) => Hn(e, t).map((r) => wa(r)).join(" "), "getEscapedCommand"), Ea = / +/g, Ta = /* @__PURE__ */ o(
  (e) => {
    let t = [];
    for (let r of e.trim().split(Ea)) {
      let n = t[t.length - 1];
      n && n.endsWith("\\") ? t[t.length - 1] = `${n.slice(0, -1)} ${r}` : t.push(r);
    }
    return t;
  }, "parseCommand");
  Vn.exports = {
    joinCommand: va,
    getEscapedCommand: Pa,
    parseCommand: Ta
  };
});

// ../node_modules/execa/index.js
var eo = p((Zf, H) => {
  "use strict";
  var ka = y("path"), St = y("child_process"), Ia = lt(), Ca = an(), Oa = ln(), Aa = mn(), ve = vn(), Kn = En(), { spawnedKill: Ra, spawnedCancel: _a,
  setupTimeout: Ga, validateTimeout: ja, setExitHandler: Na } = _n(), { handleInput: Ba, getSpawnedResult: Da, makeAllStream: Ma, validateInputSync: La } = $n(),
  { mergePromise: Jn, getSpawnedPromise: Fa } = Wn(), { joinCommand: Xn, parseCommand: Yn, getEscapedCommand: Zn } = zn(), Ua = 1e3 * 1e3 * 100,
  $a = /* @__PURE__ */ o(({ env: e, extendEnv: t, preferLocal: r, localDir: n, execPath: i }) => {
    let s = t ? { ...process.env, ...e } : e;
    return r ? Oa.env({ env: s, cwd: n, execPath: i }) : s;
  }, "getEnv"), Qn = /* @__PURE__ */ o((e, t, r = {}) => {
    let n = Ia._parse(e, t, r);
    return e = n.command, t = n.args, r = n.options, r = {
      maxBuffer: Ua,
      buffer: !0,
      stripFinalNewline: !0,
      extendEnv: !0,
      preferLocal: !1,
      localDir: r.cwd || process.cwd(),
      execPath: process.execPath,
      encoding: "utf8",
      reject: !0,
      cleanup: !0,
      all: !1,
      windowsHide: !0,
      ...r
    }, r.env = $a(r), r.stdio = Kn(r), process.platform === "win32" && ka.basename(e, ".exe") === "cmd" && t.unshift("/q"), { file: e, args: t,
    options: r, parsed: n };
  }, "handleArguments"), Z = /* @__PURE__ */ o((e, t, r) => typeof t != "string" && !Buffer.isBuffer(t) ? r === void 0 ? void 0 : "" : e.stripFinalNewline ?
  Ca(t) : t, "handleOutput"), Pe = /* @__PURE__ */ o((e, t, r) => {
    let n = Qn(e, t, r), i = Xn(e, t), s = Zn(e, t);
    ja(n.options);
    let a;
    try {
      a = St.spawn(n.file, n.args, n.options);
    } catch (m) {
      let g = new St.ChildProcess(), h = Promise.reject(ve({
        error: m,
        stdout: "",
        stderr: "",
        all: "",
        command: i,
        escapedCommand: s,
        parsed: n,
        timedOut: !1,
        isCanceled: !1,
        killed: !1
      }));
      return Jn(g, h);
    }
    let c = Fa(a), u = Ga(a, n.options, c), l = Na(a, n.options, u), f = { isCanceled: !1 };
    a.kill = Ra.bind(null, a.kill.bind(a)), a.cancel = _a.bind(null, a, f);
    let b = Aa(/* @__PURE__ */ o(async () => {
      let [{ error: m, exitCode: g, signal: h, timedOut: S }, T, E, I] = await Da(a, n.options, l), O = Z(n.options, T), A = Z(n.options, E),
      d = Z(n.options, I);
      if (m || g !== 0 || h !== null) {
        let v = ve({
          error: m,
          exitCode: g,
          signal: h,
          stdout: O,
          stderr: A,
          all: d,
          command: i,
          escapedCommand: s,
          parsed: n,
          timedOut: S,
          isCanceled: f.isCanceled,
          killed: a.killed
        });
        if (!n.options.reject)
          return v;
        throw v;
      }
      return {
        command: i,
        escapedCommand: s,
        exitCode: 0,
        stdout: O,
        stderr: A,
        all: d,
        failed: !1,
        timedOut: !1,
        isCanceled: !1,
        killed: !1
      };
    }, "handlePromise"));
    return Ba(a, n.options.input), a.all = Ma(a, n.options), Jn(a, b);
  }, "execa");
  H.exports = Pe;
  H.exports.sync = (e, t, r) => {
    let n = Qn(e, t, r), i = Xn(e, t), s = Zn(e, t);
    La(n.options);
    let a;
    try {
      a = St.spawnSync(n.file, n.args, n.options);
    } catch (l) {
      throw ve({
        error: l,
        stdout: "",
        stderr: "",
        all: "",
        command: i,
        escapedCommand: s,
        parsed: n,
        timedOut: !1,
        isCanceled: !1,
        killed: !1
      });
    }
    let c = Z(n.options, a.stdout, a.error), u = Z(n.options, a.stderr, a.error);
    if (a.error || a.status !== 0 || a.signal !== null) {
      let l = ve({
        stdout: c,
        stderr: u,
        error: a.error,
        signal: a.signal,
        exitCode: a.status,
        command: i,
        escapedCommand: s,
        parsed: n,
        timedOut: a.error && a.error.code === "ETIMEDOUT",
        isCanceled: !1,
        killed: a.signal !== null
      });
      if (!n.options.reject)
        return l;
      throw l;
    }
    return {
      command: i,
      escapedCommand: s,
      exitCode: 0,
      stdout: c,
      stderr: u,
      failed: !1,
      timedOut: !1,
      isCanceled: !1,
      killed: !1
    };
  };
  H.exports.command = (e, t) => {
    let [r, ...n] = Yn(e);
    return Pe(r, n, t);
  };
  H.exports.commandSync = (e, t) => {
    let [r, ...n] = Yn(e);
    return Pe.sync(r, n, t);
  };
  H.exports.node = (e, t, r = {}) => {
    t && !Array.isArray(t) && typeof t == "object" && (r = t, t = []);
    let n = Kn.node(r), i = process.execArgv.filter((c) => !c.startsWith("--inspect")), {
      nodePath: s = process.execPath,
      nodeOptions: a = i
    } = r;
    return Pe(
      s,
      [
        ...a,
        e,
        ...Array.isArray(t) ? t : []
      ],
      {
        ...r,
        stdin: void 0,
        stdout: void 0,
        stderr: void 0,
        stdio: n,
        shell: !1
      }
    );
  };
});

// ../node_modules/detect-package-manager/dist/index.js
var oo = p((no) => {
  var qa = Object.create, ke = Object.defineProperty, Wa = Object.getOwnPropertyDescriptor, Ha = Object.getOwnPropertyNames, Va = Object.getPrototypeOf,
  za = Object.prototype.hasOwnProperty, to = /* @__PURE__ */ o((e) => ke(e, "__esModule", { value: !0 }), "__markAsModule"), Ja = /* @__PURE__ */ o(
  (e, t) => {
    to(e);
    for (var r in t)
      ke(e, r, { get: t[r], enumerable: !0 });
  }, "__export"), Ka = /* @__PURE__ */ o((e, t, r) => {
    if (t && typeof t == "object" || typeof t == "function")
      for (let n of Ha(t))
        !za.call(e, n) && n !== "default" && ke(e, n, { get: /* @__PURE__ */ o(() => t[n], "get"), enumerable: !(r = Wa(t, n)) || r.enumerable });
    return e;
  }, "__reExport"), vt = /* @__PURE__ */ o((e) => Ka(to(ke(e != null ? qa(Va(e)) : {}, "default", e && e.__esModule && "default" in e ? { get: /* @__PURE__ */ o(
  () => e.default, "get"), enumerable: !0 } : { value: e, enumerable: !0 })), e), "__toModule");
  Ja(no, {
    clearCache: /* @__PURE__ */ o(() => ec, "clearCache"),
    detect: /* @__PURE__ */ o(() => Za, "detect"),
    getNpmVersion: /* @__PURE__ */ o(() => Qa, "getNpmVersion")
  });
  var Xa = vt(y("fs")), Ee = vt(y("path")), ro = vt(eo());
  async function Te(e) {
    try {
      return await Xa.promises.access(e), !0;
    } catch {
      return !1;
    }
  }
  o(Te, "pathExists");
  var j = /* @__PURE__ */ new Map();
  function wt(e) {
    let t = `has_global_${e}`;
    return j.has(t) ? Promise.resolve(j.get(t)) : (0, ro.default)(e, ["--version"]).then((r) => /^\d+.\d+.\d+$/.test(r.stdout)).then((r) => (j.
    set(t, r), r)).catch(() => !1);
  }
  o(wt, "hasGlobalInstallation");
  function Ya(e = ".") {
    let t = `lockfile_${e}`;
    return j.has(t) ? Promise.resolve(j.get(t)) : Promise.all([
      Te((0, Ee.resolve)(e, "yarn.lock")),
      Te((0, Ee.resolve)(e, "package-lock.json")),
      Te((0, Ee.resolve)(e, "pnpm-lock.yaml")),
      Te((0, Ee.resolve)(e, "bun.lockb"))
    ]).then(([r, n, i, s]) => {
      let a = null;
      return r ? a = "yarn" : i ? a = "pnpm" : s ? a = "bun" : n && (a = "npm"), j.set(t, a), a;
    });
  }
  o(Ya, "getTypeofLockFile");
  var Za = /* @__PURE__ */ o(async ({
    cwd: e,
    includeGlobalBun: t
  } = {}) => {
    let r = await Ya(e);
    if (r)
      return r;
    let [n, i, s] = await Promise.all([
      wt("yarn"),
      wt("pnpm"),
      t && wt("bun")
    ]);
    return n ? "yarn" : i ? "pnpm" : s ? "bun" : "npm";
  }, "detect");
  function Qa(e) {
    return (0, ro.default)(e || "npm", ["--version"]).then((t) => t.stdout);
  }
  o(Qa, "getNpmVersion");
  function ec() {
    return j.clear();
  }
  o(ec, "clearCache");
});

// ../node_modules/walk-up-path/dist/cjs/index.js
var so = p((Ie) => {
  "use strict";
  Object.defineProperty(Ie, "__esModule", { value: !0 });
  Ie.walkUp = void 0;
  var io = y("path"), tc = /* @__PURE__ */ o(function* (e) {
    for (e = (0, io.resolve)(e); e; ) {
      yield e;
      let t = (0, io.dirname)(e);
      if (t === e)
        break;
      e = t;
    }
  }, "walkUp");
  Ie.walkUp = tc;
});

// ../node_modules/common-path-prefix/index.js
var ii = p((Om, oi) => {
  "use strict";
  var { sep: Ru } = y("path"), _u = /* @__PURE__ */ o((e) => {
    for (let t of e) {
      let r = /(\/|\\)/.exec(t);
      if (r !== null) return r[0];
    }
    return Ru;
  }, "determineSeparator");
  oi.exports = /* @__PURE__ */ o(function(t, r = _u(t)) {
    let [n = "", ...i] = t;
    if (n === "" || i.length === 0) return "";
    let s = n.split(r), a = s.length;
    for (let u of i) {
      let l = u.split(r);
      for (let f = 0; f < a; f++)
        l[f] !== s[f] && (a = f);
      if (a === 0) return "";
    }
    let c = s.slice(0, a).join(r);
    return c.endsWith(r) ? c : c + r;
  }, "commonPathPrefix");
});

// ../node_modules/fetch-retry/index.js
var Oi = p((ig, Ci) => {
  "use strict";
  Ci.exports = function(e, t) {
    if (t = t || {}, typeof e != "function")
      throw new C("fetch must be a function");
    if (typeof t != "object")
      throw new C("defaults must be an object");
    if (t.retries !== void 0 && !Ke(t.retries))
      throw new C("retries must be a positive integer");
    if (t.retryDelay !== void 0 && !Ke(t.retryDelay) && typeof t.retryDelay != "function")
      throw new C("retryDelay must be a positive integer or a function returning a positive integer");
    if (t.retryOn !== void 0 && !Array.isArray(t.retryOn) && typeof t.retryOn != "function")
      throw new C("retryOn property expects an array or function");
    var r = {
      retries: 3,
      retryDelay: 1e3,
      retryOn: []
    };
    return t = Object.assign(r, t), /* @__PURE__ */ o(function(i, s) {
      var a = t.retries, c = t.retryDelay, u = t.retryOn;
      if (s && s.retries !== void 0)
        if (Ke(s.retries))
          a = s.retries;
        else
          throw new C("retries must be a positive integer");
      if (s && s.retryDelay !== void 0)
        if (Ke(s.retryDelay) || typeof s.retryDelay == "function")
          c = s.retryDelay;
        else
          throw new C("retryDelay must be a positive integer or a function returning a positive integer");
      if (s && s.retryOn)
        if (Array.isArray(s.retryOn) || typeof s.retryOn == "function")
          u = s.retryOn;
        else
          throw new C("retryOn property expects an array or function");
      return new Promise(function(l, f) {
        var x = /* @__PURE__ */ o(function(m) {
          var g = typeof Request < "u" && i instanceof Request ? i.clone() : i;
          e(g, s).then(function(h) {
            if (Array.isArray(u) && u.indexOf(h.status) === -1)
              l(h);
            else if (typeof u == "function")
              try {
                return Promise.resolve(u(m, null, h)).then(function(S) {
                  S ? b(m, null, h) : l(h);
                }).catch(f);
              } catch (S) {
                f(S);
              }
            else
              m < a ? b(m, null, h) : l(h);
          }).catch(function(h) {
            if (typeof u == "function")
              try {
                Promise.resolve(u(m, h, null)).then(function(S) {
                  S ? b(m, h, null) : f(h);
                }).catch(function(S) {
                  f(S);
                });
              } catch (S) {
                f(S);
              }
            else m < a ? b(m, h, null) : f(h);
          });
        }, "wrappedFetch");
        function b(m, g, h) {
          var S = typeof c == "function" ? c(m, g, h) : c;
          setTimeout(function() {
            x(++m);
          }, S);
        }
        o(b, "retry"), x(0);
      });
    }, "fetchRetry");
  };
  function Ke(e) {
    return Number.isInteger(e) && e >= 0;
  }
  o(Ke, "isPositiveInteger");
  function C(e) {
    this.name = "ArgumentError", this.message = e;
  }
  o(C, "ArgumentError");
});

// src/telemetry/index.ts
import { logger as Fi } from "@storybook/core/node-logger";

// src/telemetry/notify.ts
var ue = R(pr(), 1);
import { cache as dr } from "@storybook/core/common";
var mr = "telemetry-notification-date", D = console, hr = /* @__PURE__ */ o(async () => {
  await dr.get(mr, null) || (dr.set(mr, Date.now()), D.log(), D.log(
    `${ue.default.magenta(
      ue.default.bold("attention")
    )} => Storybook now collects completely anonymous telemetry regarding usage.`
  ), D.log("This information is used to shape Storybook's roadmap and prioritize features."), D.log(
    "You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:"
  ), D.log(ue.default.cyan("https://storybook.js.org/telemetry")), D.log());
}, "notify");

// src/telemetry/sanitize.ts
import br from "node:path";
function yr(e) {
  return e.replace(/[-[/{}()*+?.\\^$|]/g, "\\$&");
}
o(yr, "regexpEscape");
function gr(e = "") {
  return e.replace(/\u001B\[[0-9;]*m/g, "");
}
o(gr, "removeAnsiEscapeCodes");
function z(e, t = br.sep) {
  if (!e)
    return e;
  let r = process.cwd().split(t);
  for (; r.length > 1; ) {
    let n = r.join(t), i = new RegExp(yr(n), "gi");
    e = e.replace(i, "$SNIP");
    let s = r.join(t + t), a = new RegExp(yr(s), "gi");
    e = e.replace(a, "$SNIP"), r.pop();
  }
  return e;
}
o(z, "cleanPaths");
function le(e, t = br.sep) {
  try {
    e = {
      ...JSON.parse(JSON.stringify(e)),
      message: gr(e.message),
      stack: gr(e.stack),
      cause: e.cause,
      name: e.name
    };
    let r = z(JSON.stringify(e), t);
    return JSON.parse(r);
  } catch (r) {
    return `Sanitization error: ${r?.message}`;
  }
}
o(le, "sanitizeError");

// src/telemetry/storybook-metadata.ts
var Je = R(oo(), 1);
import { dirname as cl } from "node:path";
import {
  getProjectRoot as ul,
  getStorybookConfiguration as ll,
  getStorybookInfo as fl,
  loadMainConfig as pl
} from "@storybook/core/common";
import { readConfig as dl } from "@storybook/core/csf-tools";

// ../node_modules/fd-package-json/dist/esm/main.js
var ao = R(so(), 1);
import { resolve as rc } from "node:path";
import { stat as nc, readFile as oc } from "node:fs/promises";
import { statSync as ap, readFileSync as cp } from "node:fs";
async function ic(e) {
  try {
    return (await nc(e)).isFile();
  } catch {
    return !1;
  }
}
o(ic, "fileExists");
async function Pt(e) {
  for (let t of (0, ao.walkUp)(e)) {
    let r = rc(t, "package.json");
    if (await ic(r))
      return r;
  }
  return null;
}
o(Pt, "findPackagePath");
async function co(e) {
  let t = await Pt(e);
  if (!t)
    return null;
  try {
    let r = await oc(t, { encoding: "utf8" });
    return JSON.parse(r);
  } catch {
    return null;
  }
}
o(co, "findPackage");

// src/telemetry/get-application-file-count.ts
import { sep as zu } from "node:path";

// src/telemetry/exec-command-count-lines.ts
import { createInterface as Eu } from "node:readline";

// node_modules/execa/index.js
var Jo = R(lt(), 1);
import { Buffer as bu } from "node:buffer";
import xu from "node:path";
import Jt from "node:child_process";
import Ue from "node:process";

// ../node_modules/strip-final-newline/index.js
function Et(e) {
  let t = typeof e == "string" ? `
` : 10, r = typeof e == "string" ? "\r" : 13;
  return e[e.length - 1] === t && (e = e.slice(0, -1)), e[e.length - 1] === r && (e = e.slice(0, -1)), e;
}
o(Et, "stripFinalNewline");

// node_modules/npm-run-path/index.js
import Oe from "node:process";
import Q from "node:path";
import sc from "node:url";

// node_modules/path-key/index.js
function Ce(e = {}) {
  let {
    env: t = process.env,
    platform: r = process.platform
  } = e;
  return r !== "win32" ? "PATH" : Object.keys(t).reverse().find((n) => n.toUpperCase() === "PATH") || "Path";
}
o(Ce, "pathKey");

// node_modules/npm-run-path/index.js
function ac(e = {}) {
  let {
    cwd: t = Oe.cwd(),
    path: r = Oe.env[Ce()],
    execPath: n = Oe.execPath
  } = e, i, s = t instanceof URL ? sc.fileURLToPath(t) : t, a = Q.resolve(s), c = [];
  for (; i !== a; )
    c.push(Q.join(a, "node_modules/.bin")), i = a, a = Q.resolve(a, "..");
  return c.push(Q.resolve(s, n, "..")), [...c, r].join(Q.delimiter);
}
o(ac, "npmRunPath");
function uo({ env: e = Oe.env, ...t } = {}) {
  e = { ...e };
  let r = Ce({ env: e });
  return t.path = e[r], e[r] = ac(t), e;
}
o(uo, "npmRunPathEnv");

// node_modules/mimic-fn/index.js
var cc = /* @__PURE__ */ o((e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  let i = Object.getOwnPropertyDescriptor(e, r), s = Object.getOwnPropertyDescriptor(t, r);
  !uc(i, s) && n || Object.defineProperty(e, r, s);
}, "copyProperty"), uc = /* @__PURE__ */ o(function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable &&
  (e.writable || e.value === t.value);
}, "canCopyProperty"), lc = /* @__PURE__ */ o((e, t) => {
  let r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, "changePrototype"), fc = /* @__PURE__ */ o((e, t) => `/* Wrapped ${e}*/
${t}`, "wrappedToString"), pc = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), dc = Object.getOwnPropertyDescriptor(Function.
prototype.toString, "name"), mc = /* @__PURE__ */ o((e, t, r) => {
  let n = r === "" ? "" : `with ${r.trim()}() `, i = fc.bind(null, n, t.toString());
  Object.defineProperty(i, "name", dc), Object.defineProperty(e, "toString", { ...pc, value: i });
}, "changeToString");
function Tt(e, t, { ignoreNonConfigurable: r = !1 } = {}) {
  let { name: n } = e;
  for (let i of Reflect.ownKeys(t))
    cc(e, t, i, r);
  return lc(e, t), mc(e, t, n), e;
}
o(Tt, "mimicFunction");

// node_modules/onetime/index.js
var Ae = /* @__PURE__ */ new WeakMap(), lo = /* @__PURE__ */ o((e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError("Expected a function");
  let r, n = 0, i = e.displayName || e.name || "<anonymous>", s = /* @__PURE__ */ o(function(...a) {
    if (Ae.set(s, ++n), n === 1)
      r = e.apply(this, a), e = null;
    else if (t.throw === !0)
      throw new Error(`Function \`${i}\` can only be called once`);
    return r;
  }, "onetime");
  return Tt(s, e), Ae.set(s, n), s;
}, "onetime");
lo.callCount = (e) => {
  if (!Ae.has(e))
    throw new Error(`The given function \`${e.name}\` is not wrapped by the \`onetime\` package`);
  return Ae.get(e);
};
var fo = lo;

// node_modules/execa/lib/error.js
import Ec from "node:process";

// node_modules/human-signals/build/src/main.js
import { constants as bc } from "node:os";

// node_modules/human-signals/build/src/realtime.js
var po = /* @__PURE__ */ o(() => {
  let e = kt - mo + 1;
  return Array.from({ length: e }, hc);
}, "getRealtimeSignals"), hc = /* @__PURE__ */ o((e, t) => ({
  name: `SIGRT${t + 1}`,
  number: mo + t,
  action: "terminate",
  description: "Application-specific signal (realtime)",
  standard: "posix"
}), "getRealtimeSignal"), mo = 34, kt = 64;

// node_modules/human-signals/build/src/signals.js
import { constants as yc } from "node:os";

// node_modules/human-signals/build/src/core.js
var ho = [
  {
    name: "SIGHUP",
    number: 1,
    action: "terminate",
    description: "Terminal closed",
    standard: "posix"
  },
  {
    name: "SIGINT",
    number: 2,
    action: "terminate",
    description: "User interruption with CTRL-C",
    standard: "ansi"
  },
  {
    name: "SIGQUIT",
    number: 3,
    action: "core",
    description: "User interruption with CTRL-\\",
    standard: "posix"
  },
  {
    name: "SIGILL",
    number: 4,
    action: "core",
    description: "Invalid machine instruction",
    standard: "ansi"
  },
  {
    name: "SIGTRAP",
    number: 5,
    action: "core",
    description: "Debugger breakpoint",
    standard: "posix"
  },
  {
    name: "SIGABRT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "ansi"
  },
  {
    name: "SIGIOT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "bsd"
  },
  {
    name: "SIGBUS",
    number: 7,
    action: "core",
    description: "Bus error due to misaligned, non-existing address or paging error",
    standard: "bsd"
  },
  {
    name: "SIGEMT",
    number: 7,
    action: "terminate",
    description: "Command should be emulated but is not implemented",
    standard: "other"
  },
  {
    name: "SIGFPE",
    number: 8,
    action: "core",
    description: "Floating point arithmetic error",
    standard: "ansi"
  },
  {
    name: "SIGKILL",
    number: 9,
    action: "terminate",
    description: "Forced termination",
    standard: "posix",
    forced: !0
  },
  {
    name: "SIGUSR1",
    number: 10,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGSEGV",
    number: 11,
    action: "core",
    description: "Segmentation fault",
    standard: "ansi"
  },
  {
    name: "SIGUSR2",
    number: 12,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGPIPE",
    number: 13,
    action: "terminate",
    description: "Broken pipe or socket",
    standard: "posix"
  },
  {
    name: "SIGALRM",
    number: 14,
    action: "terminate",
    description: "Timeout or timer",
    standard: "posix"
  },
  {
    name: "SIGTERM",
    number: 15,
    action: "terminate",
    description: "Termination",
    standard: "ansi"
  },
  {
    name: "SIGSTKFLT",
    number: 16,
    action: "terminate",
    description: "Stack is empty or overflowed",
    standard: "other"
  },
  {
    name: "SIGCHLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "posix"
  },
  {
    name: "SIGCLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "other"
  },
  {
    name: "SIGCONT",
    number: 18,
    action: "unpause",
    description: "Unpaused",
    standard: "posix",
    forced: !0
  },
  {
    name: "SIGSTOP",
    number: 19,
    action: "pause",
    description: "Paused",
    standard: "posix",
    forced: !0
  },
  {
    name: "SIGTSTP",
    number: 20,
    action: "pause",
    description: 'Paused using CTRL-Z or "suspend"',
    standard: "posix"
  },
  {
    name: "SIGTTIN",
    number: 21,
    action: "pause",
    description: "Background process cannot read terminal input",
    standard: "posix"
  },
  {
    name: "SIGBREAK",
    number: 21,
    action: "terminate",
    description: "User interruption with CTRL-BREAK",
    standard: "other"
  },
  {
    name: "SIGTTOU",
    number: 22,
    action: "pause",
    description: "Background process cannot write to terminal output",
    standard: "posix"
  },
  {
    name: "SIGURG",
    number: 23,
    action: "ignore",
    description: "Socket received out-of-band data",
    standard: "bsd"
  },
  {
    name: "SIGXCPU",
    number: 24,
    action: "core",
    description: "Process timed out",
    standard: "bsd"
  },
  {
    name: "SIGXFSZ",
    number: 25,
    action: "core",
    description: "File too big",
    standard: "bsd"
  },
  {
    name: "SIGVTALRM",
    number: 26,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGPROF",
    number: 27,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGWINCH",
    number: 28,
    action: "ignore",
    description: "Terminal window size changed",
    standard: "bsd"
  },
  {
    name: "SIGIO",
    number: 29,
    action: "terminate",
    description: "I/O is available",
    standard: "other"
  },
  {
    name: "SIGPOLL",
    number: 29,
    action: "terminate",
    description: "Watched event",
    standard: "other"
  },
  {
    name: "SIGINFO",
    number: 29,
    action: "ignore",
    description: "Request for process information",
    standard: "other"
  },
  {
    name: "SIGPWR",
    number: 30,
    action: "terminate",
    description: "Device running out of power",
    standard: "systemv"
  },
  {
    name: "SIGSYS",
    number: 31,
    action: "core",
    description: "Invalid system call",
    standard: "other"
  },
  {
    name: "SIGUNUSED",
    number: 31,
    action: "terminate",
    description: "Invalid system call",
    standard: "other"
  }
];

// node_modules/human-signals/build/src/signals.js
var It = /* @__PURE__ */ o(() => {
  let e = po();
  return [...ho, ...e].map(gc);
}, "getSignals"), gc = /* @__PURE__ */ o(({
  name: e,
  number: t,
  description: r,
  action: n,
  forced: i = !1,
  standard: s
}) => {
  let {
    signals: { [e]: a }
  } = yc, c = a !== void 0;
  return { name: e, number: c ? a : t, description: r, supported: c, action: n, forced: i, standard: s };
}, "normalizeSignal");

// node_modules/human-signals/build/src/main.js
var xc = /* @__PURE__ */ o(() => {
  let e = It();
  return Object.fromEntries(e.map(Sc));
}, "getSignalsByName"), Sc = /* @__PURE__ */ o(({
  name: e,
  number: t,
  description: r,
  supported: n,
  action: i,
  forced: s,
  standard: a
}) => [e, { name: e, number: t, description: r, supported: n, action: i, forced: s, standard: a }], "getSignalByName"), yo = xc(), wc = /* @__PURE__ */ o(
() => {
  let e = It(), t = kt + 1, r = Array.from(
    { length: t },
    (n, i) => vc(i, e)
  );
  return Object.assign({}, ...r);
}, "getSignalsByNumber"), vc = /* @__PURE__ */ o((e, t) => {
  let r = Pc(e, t);
  if (r === void 0)
    return {};
  let { name: n, description: i, supported: s, action: a, forced: c, standard: u } = r;
  return {
    [e]: {
      name: n,
      number: e,
      description: i,
      supported: s,
      action: a,
      forced: c,
      standard: u
    }
  };
}, "getSignalByNumber"), Pc = /* @__PURE__ */ o((e, t) => {
  let r = t.find(({ name: n }) => bc.signals[n] === e);
  return r !== void 0 ? r : t.find((n) => n.number === e);
}, "findSignalByNumber"), Dp = wc();

// node_modules/execa/lib/error.js
var Tc = /* @__PURE__ */ o(({ timedOut: e, timeout: t, errorCode: r, signal: n, signalDescription: i, exitCode: s, isCanceled: a }) => e ? `\
timed out after ${t} milliseconds` : a ? "was canceled" : r !== void 0 ? `failed with ${r}` : n !== void 0 ? `was killed with ${n} (${i})` :
s !== void 0 ? `failed with exit code ${s}` : "failed", "getErrorPrefix"), ee = /* @__PURE__ */ o(({
  stdout: e,
  stderr: t,
  all: r,
  error: n,
  signal: i,
  exitCode: s,
  command: a,
  escapedCommand: c,
  timedOut: u,
  isCanceled: l,
  killed: f,
  parsed: { options: { timeout: x, cwd: b = Ec.cwd() } }
}) => {
  s = s === null ? void 0 : s, i = i === null ? void 0 : i;
  let m = i === void 0 ? void 0 : yo[i].description, g = n && n.code, S = `Command ${Tc({ timedOut: u, timeout: x, errorCode: g, signal: i, signalDescription: m,
  exitCode: s, isCanceled: l })}: ${a}`, T = Object.prototype.toString.call(n) === "[object Error]", E = T ? `${S}
${n.message}` : S, I = [E, t, e].filter(Boolean).join(`
`);
  return T ? (n.originalMessage = n.message, n.message = I) : n = new Error(I), n.shortMessage = E, n.command = a, n.escapedCommand = c, n.exitCode =
  s, n.signal = i, n.signalDescription = m, n.stdout = e, n.stderr = t, n.cwd = b, r !== void 0 && (n.all = r), "bufferedData" in n && delete n.
  bufferedData, n.failed = !0, n.timedOut = !!u, n.isCanceled = l, n.killed = f && !u, n;
}, "makeError");

// node_modules/execa/lib/stdio.js
var Re = ["stdin", "stdout", "stderr"], kc = /* @__PURE__ */ o((e) => Re.some((t) => e[t] !== void 0), "hasAlias"), go = /* @__PURE__ */ o((e) => {
  if (!e)
    return;
  let { stdio: t } = e;
  if (t === void 0)
    return Re.map((n) => e[n]);
  if (kc(e))
    throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${Re.map((n) => `\`${n}\``).join(", ")}`);
  if (typeof t == "string")
    return t;
  if (!Array.isArray(t))
    throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof t}\``);
  let r = Math.max(t.length, Re.length);
  return Array.from({ length: r }, (n, i) => t[i]);
}, "normalizeStdio");

// node_modules/execa/lib/kill.js
import Oc from "node:os";

// node_modules/signal-exit/dist/mjs/signals.js
var N = [];
N.push("SIGHUP", "SIGINT", "SIGTERM");
process.platform !== "win32" && N.push(
  "SIGALRM",
  "SIGABRT",
  "SIGVTALRM",
  "SIGXCPU",
  "SIGXFSZ",
  "SIGUSR2",
  "SIGTRAP",
  "SIGSYS",
  "SIGQUIT",
  "SIGIOT"
  // should detect profiler and enable/disable accordingly.
  // see #21
  // 'SIGPROF'
);
process.platform === "linux" && N.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");

// node_modules/signal-exit/dist/mjs/index.js
var _e = /* @__PURE__ */ o((e) => !!e && typeof e == "object" && typeof e.removeListener == "function" && typeof e.emit == "function" && typeof e.
reallyExit == "function" && typeof e.listeners == "function" && typeof e.kill == "function" && typeof e.pid == "number" && typeof e.on == "f\
unction", "processOk"), Ct = Symbol.for("signal-exit emitter"), Ot = globalThis, Ic = Object.defineProperty.bind(Object), At = class {
  static {
    o(this, "Emitter");
  }
  emitted = {
    afterExit: !1,
    exit: !1
  };
  listeners = {
    afterExit: [],
    exit: []
  };
  count = 0;
  id = Math.random();
  constructor() {
    if (Ot[Ct])
      return Ot[Ct];
    Ic(Ot, Ct, {
      value: this,
      writable: !1,
      enumerable: !1,
      configurable: !1
    });
  }
  on(t, r) {
    this.listeners[t].push(r);
  }
  removeListener(t, r) {
    let n = this.listeners[t], i = n.indexOf(r);
    i !== -1 && (i === 0 && n.length === 1 ? n.length = 0 : n.splice(i, 1));
  }
  emit(t, r, n) {
    if (this.emitted[t])
      return !1;
    this.emitted[t] = !0;
    let i = !1;
    for (let s of this.listeners[t])
      i = s(r, n) === !0 || i;
    return t === "exit" && (i = this.emit("afterExit", r, n) || i), i;
  }
}, Ge = class {
  static {
    o(this, "SignalExitBase");
  }
}, Cc = /* @__PURE__ */ o((e) => ({
  onExit(t, r) {
    return e.onExit(t, r);
  },
  load() {
    return e.load();
  },
  unload() {
    return e.unload();
  }
}), "signalExitWrap"), Rt = class extends Ge {
  static {
    o(this, "SignalExitFallback");
  }
  onExit() {
    return () => {
    };
  }
  load() {
  }
  unload() {
  }
}, _t = class extends Ge {
  static {
    o(this, "SignalExit");
  }
  // "SIGHUP" throws an `ENOSYS` error on Windows,
  // so use a supported signal instead
  /* c8 ignore start */
  #s = Gt.platform === "win32" ? "SIGINT" : "SIGHUP";
  /* c8 ignore stop */
  #t = new At();
  #e;
  #o;
  #i;
  #n = {};
  #r = !1;
  constructor(t) {
    super(), this.#e = t, this.#n = {};
    for (let r of N)
      this.#n[r] = () => {
        let n = this.#e.listeners(r), { count: i } = this.#t, s = t;
        if (typeof s.__signal_exit_emitter__ == "object" && typeof s.__signal_exit_emitter__.count == "number" && (i += s.__signal_exit_emitter__.
        count), n.length === i) {
          this.unload();
          let a = this.#t.emit("exit", null, r), c = r === "SIGHUP" ? this.#s : r;
          a || t.kill(t.pid, c);
        }
      };
    this.#i = t.reallyExit, this.#o = t.emit;
  }
  onExit(t, r) {
    if (!_e(this.#e))
      return () => {
      };
    this.#r === !1 && this.load();
    let n = r?.alwaysLast ? "afterExit" : "exit";
    return this.#t.on(n, t), () => {
      this.#t.removeListener(n, t), this.#t.listeners.exit.length === 0 && this.#t.listeners.afterExit.length === 0 && this.unload();
    };
  }
  load() {
    if (!this.#r) {
      this.#r = !0, this.#t.count += 1;
      for (let t of N)
        try {
          let r = this.#n[t];
          r && this.#e.on(t, r);
        } catch {
        }
      this.#e.emit = (t, ...r) => this.#c(t, ...r), this.#e.reallyExit = (t) => this.#a(t);
    }
  }
  unload() {
    this.#r && (this.#r = !1, N.forEach((t) => {
      let r = this.#n[t];
      if (!r)
        throw new Error("Listener not defined for signal: " + t);
      try {
        this.#e.removeListener(t, r);
      } catch {
      }
    }), this.#e.emit = this.#o, this.#e.reallyExit = this.#i, this.#t.count -= 1);
  }
  #a(t) {
    return _e(this.#e) ? (this.#e.exitCode = t || 0, this.#t.emit("exit", this.#e.exitCode, null), this.#i.call(this.#e, this.#e.exitCode)) :
    0;
  }
  #c(t, ...r) {
    let n = this.#o;
    if (t === "exit" && _e(this.#e)) {
      typeof r[0] == "number" && (this.#e.exitCode = r[0]);
      let i = n.call(this.#e, t, ...r);
      return this.#t.emit("exit", this.#e.exitCode, null), i;
    } else
      return n.call(this.#e, t, ...r);
  }
}, Gt = globalThis.process, {
  /**
   * Called when the process is exiting, whether via signal, explicit
   * exit, or running out of stuff to do.
   *
   * If the global process object is not suitable for instrumentation,
   * then this will be a no-op.
   *
   * Returns a function that may be used to unload signal-exit.
   */
  onExit: bo,
  /**
   * Load the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  load: Jp,
  /**
   * Unload the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  unload: Kp
} = Cc(_e(Gt) ? new _t(Gt) : new Rt());

// node_modules/execa/lib/kill.js
var Ac = 1e3 * 5, xo = /* @__PURE__ */ o((e, t = "SIGTERM", r = {}) => {
  let n = e(t);
  return Rc(e, t, r, n), n;
}, "spawnedKill"), Rc = /* @__PURE__ */ o((e, t, r, n) => {
  if (!_c(t, r, n))
    return;
  let i = jc(r), s = setTimeout(() => {
    e("SIGKILL");
  }, i);
  s.unref && s.unref();
}, "setKillTimeout"), _c = /* @__PURE__ */ o((e, { forceKillAfterTimeout: t }, r) => Gc(e) && t !== !1 && r, "shouldForceKill"), Gc = /* @__PURE__ */ o(
(e) => e === Oc.constants.signals.SIGTERM || typeof e == "string" && e.toUpperCase() === "SIGTERM", "isSigterm"), jc = /* @__PURE__ */ o(({ forceKillAfterTimeout: e = !0 }) => {
  if (e === !0)
    return Ac;
  if (!Number.isFinite(e) || e < 0)
    throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${e}\` (${typeof e})`);
  return e;
}, "getForceKillAfterTimeout"), So = /* @__PURE__ */ o((e, t) => {
  e.kill() && (t.isCanceled = !0);
}, "spawnedCancel"), Nc = /* @__PURE__ */ o((e, t, r) => {
  e.kill(t), r(Object.assign(new Error("Timed out"), { timedOut: !0, signal: t }));
}, "timeoutKill"), wo = /* @__PURE__ */ o((e, { timeout: t, killSignal: r = "SIGTERM" }, n) => {
  if (t === 0 || t === void 0)
    return n;
  let i, s = new Promise((c, u) => {
    i = setTimeout(() => {
      Nc(e, r, u);
    }, t);
  }), a = n.finally(() => {
    clearTimeout(i);
  });
  return Promise.race([s, a]);
}, "setupTimeout"), vo = /* @__PURE__ */ o(({ timeout: e }) => {
  if (e !== void 0 && (!Number.isFinite(e) || e < 0))
    throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${e}\` (${typeof e})`);
}, "validateTimeout"), Po = /* @__PURE__ */ o(async (e, { cleanup: t, detached: r }, n) => {
  if (!t || r)
    return n;
  let i = bo(() => {
    e.kill();
  });
  return n.finally(() => {
    i();
  });
}, "setExitHandler");

// node_modules/execa/lib/pipe.js
import { createWriteStream as Bc } from "node:fs";
import { ChildProcess as Dc } from "node:child_process";

// node_modules/is-stream/index.js
function je(e) {
  return e !== null && typeof e == "object" && typeof e.pipe == "function";
}
o(je, "isStream");
function jt(e) {
  return je(e) && e.writable !== !1 && typeof e._write == "function" && typeof e._writableState == "object";
}
o(jt, "isWritableStream");

// node_modules/execa/lib/pipe.js
var Mc = /* @__PURE__ */ o((e) => e instanceof Dc && typeof e.then == "function", "isExecaChildProcess"), Nt = /* @__PURE__ */ o((e, t, r) => {
  if (typeof r == "string")
    return e[t].pipe(Bc(r)), e;
  if (jt(r))
    return e[t].pipe(r), e;
  if (!Mc(r))
    throw new TypeError("The second argument must be a string, a stream or an Execa child process.");
  if (!jt(r.stdin))
    throw new TypeError("The target child process's stdin must be available.");
  return e[t].pipe(r.stdin), r;
}, "pipeToTarget"), Eo = /* @__PURE__ */ o((e) => {
  e.stdout !== null && (e.pipeStdout = Nt.bind(void 0, e, "stdout")), e.stderr !== null && (e.pipeStderr = Nt.bind(void 0, e, "stderr")), e.
  all !== void 0 && (e.pipeAll = Nt.bind(void 0, e, "all"));
}, "addPipeMethods");

// node_modules/execa/lib/stream.js
import { createReadStream as ru, readFileSync as nu } from "node:fs";
import { setTimeout as ou } from "node:timers/promises";

// node_modules/get-stream/source/contents.js
var te = /* @__PURE__ */ o(async (e, { init: t, convertChunk: r, getSize: n, truncateChunk: i, addChunk: s, getFinalChunk: a, finalize: c }, {
maxBuffer: u = Number.POSITIVE_INFINITY } = {}) => {
  if (!Fc(e))
    throw new Error("The first argument must be a Readable, a ReadableStream, or an async iterable.");
  let l = t();
  l.length = 0;
  try {
    for await (let f of e) {
      let x = Uc(f), b = r[x](f, l);
      Io({ convertedChunk: b, state: l, getSize: n, truncateChunk: i, addChunk: s, maxBuffer: u });
    }
    return Lc({ state: l, convertChunk: r, getSize: n, truncateChunk: i, addChunk: s, getFinalChunk: a, maxBuffer: u }), c(l);
  } catch (f) {
    throw f.bufferedData = c(l), f;
  }
}, "getStreamContents"), Lc = /* @__PURE__ */ o(({ state: e, getSize: t, truncateChunk: r, addChunk: n, getFinalChunk: i, maxBuffer: s }) => {
  let a = i(e);
  a !== void 0 && Io({ convertedChunk: a, state: e, getSize: t, truncateChunk: r, addChunk: n, maxBuffer: s });
}, "appendFinalChunk"), Io = /* @__PURE__ */ o(({ convertedChunk: e, state: t, getSize: r, truncateChunk: n, addChunk: i, maxBuffer: s }) => {
  let a = r(e), c = t.length + a;
  if (c <= s) {
    To(e, t, i, c);
    return;
  }
  let u = n(e, s - t.length);
  throw u !== void 0 && To(u, t, i, s), new Ne();
}, "appendChunk"), To = /* @__PURE__ */ o((e, t, r, n) => {
  t.contents = r(e, t, n), t.length = n;
}, "addNewChunk"), Fc = /* @__PURE__ */ o((e) => typeof e == "object" && e !== null && typeof e[Symbol.asyncIterator] == "function", "isAsyn\
cIterable"), Uc = /* @__PURE__ */ o((e) => {
  let t = typeof e;
  if (t === "string")
    return "string";
  if (t !== "object" || e === null)
    return "others";
  if (globalThis.Buffer?.isBuffer(e))
    return "buffer";
  let r = ko.call(e);
  return r === "[object ArrayBuffer]" ? "arrayBuffer" : r === "[object DataView]" ? "dataView" : Number.isInteger(e.byteLength) && Number.isInteger(
  e.byteOffset) && ko.call(e.buffer) === "[object ArrayBuffer]" ? "typedArray" : "others";
}, "getChunkType"), { toString: ko } = Object.prototype, Ne = class extends Error {
  static {
    o(this, "MaxBufferError");
  }
  name = "MaxBufferError";
  constructor() {
    super("maxBuffer exceeded");
  }
};

// node_modules/get-stream/source/utils.js
var Bt = /* @__PURE__ */ o((e) => e, "identity"), Dt = /* @__PURE__ */ o(() => {
}, "noop"), Mt = /* @__PURE__ */ o(({ contents: e }) => e, "getContentsProp"), Be = /* @__PURE__ */ o((e) => {
  throw new Error(`Streams in object mode are not supported: ${String(e)}`);
}, "throwObjectStream"), De = /* @__PURE__ */ o((e) => e.length, "getLengthProp");

// node_modules/get-stream/source/array-buffer.js
async function Lt(e, t) {
  return te(e, Xc, t);
}
o(Lt, "getStreamAsArrayBuffer");
var $c = /* @__PURE__ */ o(() => ({ contents: new ArrayBuffer(0) }), "initArrayBuffer"), qc = /* @__PURE__ */ o((e) => Wc.encode(e), "useTex\
tEncoder"), Wc = new TextEncoder(), Co = /* @__PURE__ */ o((e) => new Uint8Array(e), "useUint8Array"), Oo = /* @__PURE__ */ o((e) => new Uint8Array(
e.buffer, e.byteOffset, e.byteLength), "useUint8ArrayWithOffset"), Hc = /* @__PURE__ */ o((e, t) => e.slice(0, t), "truncateArrayBufferChunk"),
Vc = /* @__PURE__ */ o((e, { contents: t, length: r }, n) => {
  let i = _o() ? Jc(t, n) : zc(t, n);
  return new Uint8Array(i).set(e, r), i;
}, "addArrayBufferChunk"), zc = /* @__PURE__ */ o((e, t) => {
  if (t <= e.byteLength)
    return e;
  let r = new ArrayBuffer(Ro(t));
  return new Uint8Array(r).set(new Uint8Array(e), 0), r;
}, "resizeArrayBufferSlow"), Jc = /* @__PURE__ */ o((e, t) => {
  if (t <= e.maxByteLength)
    return e.resize(t), e;
  let r = new ArrayBuffer(t, { maxByteLength: Ro(t) });
  return new Uint8Array(r).set(new Uint8Array(e), 0), r;
}, "resizeArrayBuffer"), Ro = /* @__PURE__ */ o((e) => Ao ** Math.ceil(Math.log(e) / Math.log(Ao)), "getNewContentsLength"), Ao = 2, Kc = /* @__PURE__ */ o(
({ contents: e, length: t }) => _o() ? e : e.slice(0, t), "finalizeArrayBuffer"), _o = /* @__PURE__ */ o(() => "resize" in ArrayBuffer.prototype,
"hasArrayBufferResize"), Xc = {
  init: $c,
  convertChunk: {
    string: qc,
    buffer: Co,
    arrayBuffer: Co,
    dataView: Oo,
    typedArray: Oo,
    others: Be
  },
  getSize: De,
  truncateChunk: Hc,
  addChunk: Vc,
  getFinalChunk: Dt,
  finalize: Kc
};

// node_modules/get-stream/source/buffer.js
async function Me(e, t) {
  if (!("Buffer" in globalThis))
    throw new Error("getStreamAsBuffer() is only supported in Node.js");
  try {
    return Go(await Lt(e, t));
  } catch (r) {
    throw r.bufferedData !== void 0 && (r.bufferedData = Go(r.bufferedData)), r;
  }
}
o(Me, "getStreamAsBuffer");
var Go = /* @__PURE__ */ o((e) => globalThis.Buffer.from(e), "arrayBufferToNodeBuffer");

// node_modules/get-stream/source/string.js
async function Ft(e, t) {
  return te(e, tu, t);
}
o(Ft, "getStreamAsString");
var Yc = /* @__PURE__ */ o(() => ({ contents: "", textDecoder: new TextDecoder() }), "initString"), Le = /* @__PURE__ */ o((e, { textDecoder: t }) => t.
decode(e, { stream: !0 }), "useTextDecoder"), Zc = /* @__PURE__ */ o((e, { contents: t }) => t + e, "addStringChunk"), Qc = /* @__PURE__ */ o(
(e, t) => e.slice(0, t), "truncateStringChunk"), eu = /* @__PURE__ */ o(({ textDecoder: e }) => {
  let t = e.decode();
  return t === "" ? void 0 : t;
}, "getFinalStringChunk"), tu = {
  init: Yc,
  convertChunk: {
    string: Bt,
    buffer: Le,
    arrayBuffer: Le,
    dataView: Le,
    typedArray: Le,
    others: Be
  },
  getSize: De,
  truncateChunk: Qc,
  addChunk: Zc,
  getFinalChunk: eu,
  finalize: Mt
};

// node_modules/execa/lib/stream.js
var jo = R(gt(), 1);
var No = /* @__PURE__ */ o((e) => {
  if (e !== void 0)
    throw new TypeError("The `input` and `inputFile` options cannot be both set.");
}, "validateInputOptions"), iu = /* @__PURE__ */ o(({ input: e, inputFile: t }) => typeof t != "string" ? e : (No(e), nu(t)), "getInputSync"),
Bo = /* @__PURE__ */ o((e) => {
  let t = iu(e);
  if (je(t))
    throw new TypeError("The `input` option cannot be a stream in sync mode");
  return t;
}, "handleInputSync"), su = /* @__PURE__ */ o(({ input: e, inputFile: t }) => typeof t != "string" ? e : (No(e), ru(t)), "getInput"), Do = /* @__PURE__ */ o(
(e, t) => {
  let r = su(t);
  r !== void 0 && (je(r) ? r.pipe(e.stdin) : e.stdin.end(r));
}, "handleInput"), Mo = /* @__PURE__ */ o((e, { all: t }) => {
  if (!t || !e.stdout && !e.stderr)
    return;
  let r = (0, jo.default)();
  return e.stdout && r.add(e.stdout), e.stderr && r.add(e.stderr), r;
}, "makeAllStream"), Ut = /* @__PURE__ */ o(async (e, t) => {
  if (!(!e || t === void 0)) {
    await ou(0), e.destroy();
    try {
      return await t;
    } catch (r) {
      return r.bufferedData;
    }
  }
}, "getBufferedData"), $t = /* @__PURE__ */ o((e, { encoding: t, buffer: r, maxBuffer: n }) => {
  if (!(!e || !r))
    return t === "utf8" || t === "utf-8" ? Ft(e, { maxBuffer: n }) : t === null || t === "buffer" ? Me(e, { maxBuffer: n }) : au(e, n, t);
}, "getStreamPromise"), au = /* @__PURE__ */ o(async (e, t, r) => (await Me(e, { maxBuffer: t })).toString(r), "applyEncoding"), Lo = /* @__PURE__ */ o(
async ({ stdout: e, stderr: t, all: r }, { encoding: n, buffer: i, maxBuffer: s }, a) => {
  let c = $t(e, { encoding: n, buffer: i, maxBuffer: s }), u = $t(t, { encoding: n, buffer: i, maxBuffer: s }), l = $t(r, { encoding: n, buffer: i,
  maxBuffer: s * 2 });
  try {
    return await Promise.all([a, c, u, l]);
  } catch (f) {
    return Promise.all([
      { error: f, signal: f.signal, timedOut: f.timedOut },
      Ut(e, c),
      Ut(t, u),
      Ut(r, l)
    ]);
  }
}, "getSpawnedResult");

// node_modules/execa/lib/promise.js
var cu = (async () => {
})().constructor.prototype, uu = ["then", "catch", "finally"].map((e) => [
  e,
  Reflect.getOwnPropertyDescriptor(cu, e)
]), qt = /* @__PURE__ */ o((e, t) => {
  for (let [r, n] of uu) {
    let i = typeof t == "function" ? (...s) => Reflect.apply(n.value, t(), s) : n.value.bind(t);
    Reflect.defineProperty(e, r, { ...n, value: i });
  }
}, "mergePromise"), Fo = /* @__PURE__ */ o((e) => new Promise((t, r) => {
  e.on("exit", (n, i) => {
    t({ exitCode: n, signal: i });
  }), e.on("error", (n) => {
    r(n);
  }), e.stdin && e.stdin.on("error", (n) => {
    r(n);
  });
}), "getSpawnedPromise");

// node_modules/execa/lib/command.js
import { Buffer as lu } from "node:buffer";
import { ChildProcess as fu } from "node:child_process";
var qo = /* @__PURE__ */ o((e, t = []) => Array.isArray(t) ? [e, ...t] : [e], "normalizeArgs"), pu = /^[\w.-]+$/, du = /* @__PURE__ */ o((e) => typeof e !=
"string" || pu.test(e) ? e : `"${e.replaceAll('"', '\\"')}"`, "escapeArg"), Wt = /* @__PURE__ */ o((e, t) => qo(e, t).join(" "), "joinComman\
d"), Ht = /* @__PURE__ */ o((e, t) => qo(e, t).map((r) => du(r)).join(" "), "getEscapedCommand"), Wo = / +/g, Ho = /* @__PURE__ */ o((e) => {
  let t = [];
  for (let r of e.trim().split(Wo)) {
    let n = t.at(-1);
    n && n.endsWith("\\") ? t[t.length - 1] = `${n.slice(0, -1)} ${r}` : t.push(r);
  }
  return t;
}, "parseCommand"), Uo = /* @__PURE__ */ o((e) => {
  let t = typeof e;
  if (t === "string")
    return e;
  if (t === "number")
    return String(e);
  if (t === "object" && e !== null && !(e instanceof fu) && "stdout" in e) {
    let r = typeof e.stdout;
    if (r === "string")
      return e.stdout;
    if (lu.isBuffer(e.stdout))
      return e.stdout.toString();
    throw new TypeError(`Unexpected "${r}" stdout in template expression`);
  }
  throw new TypeError(`Unexpected "${t}" in template expression`);
}, "parseExpression"), $o = /* @__PURE__ */ o((e, t, r) => r || e.length === 0 || t.length === 0 ? [...e, ...t] : [
  ...e.slice(0, -1),
  `${e.at(-1)}${t[0]}`,
  ...t.slice(1)
], "concatTokens"), mu = /* @__PURE__ */ o(({ templates: e, expressions: t, tokens: r, index: n, template: i }) => {
  let s = i ?? e.raw[n], a = s.split(Wo).filter(Boolean), c = $o(
    r,
    a,
    s.startsWith(" ")
  );
  if (n === t.length)
    return c;
  let u = t[n], l = Array.isArray(u) ? u.map((f) => Uo(f)) : [Uo(u)];
  return $o(
    c,
    l,
    s.endsWith(" ")
  );
}, "parseTemplate"), Vt = /* @__PURE__ */ o((e, t) => {
  let r = [];
  for (let [n, i] of e.entries())
    r = mu({ templates: e, expressions: t, tokens: r, index: n, template: i });
  return r;
}, "parseTemplates");

// node_modules/execa/lib/verbose.js
import { debuglog as hu } from "node:util";
import yu from "node:process";
var Vo = hu("execa").enabled, Fe = /* @__PURE__ */ o((e, t) => String(e).padStart(t, "0"), "padField"), gu = /* @__PURE__ */ o(() => {
  let e = /* @__PURE__ */ new Date();
  return `${Fe(e.getHours(), 2)}:${Fe(e.getMinutes(), 2)}:${Fe(e.getSeconds(), 2)}.${Fe(e.getMilliseconds(), 3)}`;
}, "getTimestamp"), zt = /* @__PURE__ */ o((e, { verbose: t }) => {
  t && yu.stderr.write(`[${gu()}] ${e}
`);
}, "logCommand");

// node_modules/execa/index.js
var Su = 1e3 * 1e3 * 100, wu = /* @__PURE__ */ o(({ env: e, extendEnv: t, preferLocal: r, localDir: n, execPath: i }) => {
  let s = t ? { ...Ue.env, ...e } : e;
  return r ? uo({ env: s, cwd: n, execPath: i }) : s;
}, "getEnv"), Ko = /* @__PURE__ */ o((e, t, r = {}) => {
  let n = Jo.default._parse(e, t, r);
  return e = n.command, t = n.args, r = n.options, r = {
    maxBuffer: Su,
    buffer: !0,
    stripFinalNewline: !0,
    extendEnv: !0,
    preferLocal: !1,
    localDir: r.cwd || Ue.cwd(),
    execPath: Ue.execPath,
    encoding: "utf8",
    reject: !0,
    cleanup: !0,
    all: !1,
    windowsHide: !0,
    verbose: Vo,
    ...r
  }, r.env = wu(r), r.stdio = go(r), Ue.platform === "win32" && xu.basename(e, ".exe") === "cmd" && t.unshift("/q"), { file: e, args: t, options: r,
  parsed: n };
}, "handleArguments"), re = /* @__PURE__ */ o((e, t, r) => typeof t != "string" && !bu.isBuffer(t) ? r === void 0 ? void 0 : "" : e.stripFinalNewline ?
Et(t) : t, "handleOutput");
function Xo(e, t, r) {
  let n = Ko(e, t, r), i = Wt(e, t), s = Ht(e, t);
  zt(s, n.options), vo(n.options);
  let a;
  try {
    a = Jt.spawn(n.file, n.args, n.options);
  } catch (m) {
    let g = new Jt.ChildProcess(), h = Promise.reject(ee({
      error: m,
      stdout: "",
      stderr: "",
      all: "",
      command: i,
      escapedCommand: s,
      parsed: n,
      timedOut: !1,
      isCanceled: !1,
      killed: !1
    }));
    return qt(g, h), g;
  }
  let c = Fo(a), u = wo(a, n.options, c), l = Po(a, n.options, u), f = { isCanceled: !1 };
  a.kill = xo.bind(null, a.kill.bind(a)), a.cancel = So.bind(null, a, f);
  let b = fo(/* @__PURE__ */ o(async () => {
    let [{ error: m, exitCode: g, signal: h, timedOut: S }, T, E, I] = await Lo(a, n.options, l), O = re(n.options, T), A = re(n.options, E),
    d = re(n.options, I);
    if (m || g !== 0 || h !== null) {
      let v = ee({
        error: m,
        exitCode: g,
        signal: h,
        stdout: O,
        stderr: A,
        all: d,
        command: i,
        escapedCommand: s,
        parsed: n,
        timedOut: S,
        isCanceled: f.isCanceled || (n.options.signal ? n.options.signal.aborted : !1),
        killed: a.killed
      });
      if (!n.options.reject)
        return v;
      throw v;
    }
    return {
      command: i,
      escapedCommand: s,
      exitCode: 0,
      stdout: O,
      stderr: A,
      all: d,
      failed: !1,
      timedOut: !1,
      isCanceled: !1,
      killed: !1
    };
  }, "handlePromise"));
  return Do(a, n.options), a.all = Mo(a, n.options), Eo(a), qt(a, b), a;
}
o(Xo, "execa");
function vu(e, t, r) {
  let n = Ko(e, t, r), i = Wt(e, t), s = Ht(e, t);
  zt(s, n.options);
  let a = Bo(n.options), c;
  try {
    c = Jt.spawnSync(n.file, n.args, { ...n.options, input: a });
  } catch (f) {
    throw ee({
      error: f,
      stdout: "",
      stderr: "",
      all: "",
      command: i,
      escapedCommand: s,
      parsed: n,
      timedOut: !1,
      isCanceled: !1,
      killed: !1
    });
  }
  let u = re(n.options, c.stdout, c.error), l = re(n.options, c.stderr, c.error);
  if (c.error || c.status !== 0 || c.signal !== null) {
    let f = ee({
      stdout: u,
      stderr: l,
      error: c.error,
      signal: c.signal,
      exitCode: c.status,
      command: i,
      escapedCommand: s,
      parsed: n,
      timedOut: c.error && c.error.code === "ETIMEDOUT",
      isCanceled: !1,
      killed: c.signal !== null
    });
    if (!n.options.reject)
      return f;
    throw f;
  }
  return {
    command: i,
    escapedCommand: s,
    exitCode: 0,
    stdout: u,
    stderr: l,
    failed: !1,
    timedOut: !1,
    isCanceled: !1,
    killed: !1
  };
}
o(vu, "execaSync");
var Pu = /* @__PURE__ */ o(({ input: e, inputFile: t, stdio: r }) => e === void 0 && t === void 0 && r === void 0 ? { stdin: "inherit" } : {},
"normalizeScriptStdin"), zo = /* @__PURE__ */ o((e = {}) => ({
  preferLocal: !0,
  ...Pu(e),
  ...e
}), "normalizeScriptOptions");
function Yo(e) {
  function t(r, ...n) {
    if (!Array.isArray(r))
      return Yo({ ...e, ...r });
    let [i, ...s] = Vt(r, n);
    return Xo(i, s, zo(e));
  }
  return o(t, "$"), t.sync = (r, ...n) => {
    if (!Array.isArray(r))
      throw new TypeError("Please use $(options).sync`command` instead of $.sync(options)`command`.");
    let [i, ...s] = Vt(r, n);
    return vu(i, s, zo(e));
  }, t;
}
o(Yo, "create$");
var dm = Yo();
function Zo(e, t) {
  let [r, ...n] = Ho(e);
  return Xo(r, n, t);
}
o(Zo, "execaCommand");

// src/telemetry/exec-command-count-lines.ts
async function $e(e, t) {
  let r = Zo(e, { shell: !0, buffer: !1, ...t });
  if (!r.stdout)
    throw new Error("Unexpected missing stdout");
  let n = 0, i = Eu(r.stdout);
  return i.on("line", () => {
    n += 1;
  }), await r, i.close(), n;
}
o($e, "execCommandCountLines");

// ../node_modules/slash/index.js
function Kt(e) {
  return e.startsWith("\\\\?\\") ? e : e.replace(/\\/g, "/");
}
o(Kt, "slash");

// src/common/utils/file-cache.ts
import { createHash as Qo, randomBytes as Tu } from "node:crypto";
import { mkdirSync as Xt, readFileSync as ku, readdirSync as Iu, rmSync as ei, writeFileSync as Cu } from "node:fs";
import { readFile as ti, readdir as ri, rm as ni, writeFile as Ou } from "node:fs/promises";
import { tmpdir as Au } from "node:os";
import { join as ne } from "node:path";
var Yt = class {
  static {
    o(this, "FileSystemCache");
  }
  constructor(t = {}) {
    this.prefix = (t.ns || t.prefix || "") + "-", this.hash_alg = t.hash_alg || "md5", this.cache_dir = t.basePath || ne(Au(), Tu(15).toString(
    "base64").replace(/\//g, "-")), this.ttl = t.ttl || 0, Qo(this.hash_alg), Xt(this.cache_dir, { recursive: !0 });
  }
  generateHash(t) {
    return ne(this.cache_dir, this.prefix + Qo(this.hash_alg).update(t).digest("hex"));
  }
  isExpired(t, r) {
    return t.ttl != null && r > t.ttl;
  }
  parseCacheData(t, r) {
    let n = JSON.parse(t);
    return this.isExpired(n, Date.now()) ? r : n.content;
  }
  parseSetData(t, r, n = {}) {
    let i = n.ttl ?? this.ttl;
    return JSON.stringify({ key: t, content: r, ...i && { ttl: Date.now() + i * 1e3 } });
  }
  async get(t, r) {
    try {
      let n = await ti(this.generateHash(t), "utf8");
      return this.parseCacheData(n, r);
    } catch {
      return r;
    }
  }
  getSync(t, r) {
    try {
      let n = ku(this.generateHash(t), "utf8");
      return this.parseCacheData(n, r);
    } catch {
      return r;
    }
  }
  async set(t, r, n = {}) {
    let i = typeof n == "number" ? { ttl: n } : n;
    Xt(this.cache_dir, { recursive: !0 }), await Ou(this.generateHash(t), this.parseSetData(t, r, i), {
      encoding: i.encoding || "utf8"
    });
  }
  setSync(t, r, n = {}) {
    let i = typeof n == "number" ? { ttl: n } : n;
    Xt(this.cache_dir, { recursive: !0 }), Cu(this.generateHash(t), this.parseSetData(t, r, i), {
      encoding: i.encoding || "utf8"
    });
  }
  async setMany(t, r) {
    await Promise.all(t.map((n) => this.set(n.key, n.content ?? n.value, r)));
  }
  setManySync(t, r) {
    t.forEach((n) => this.setSync(n.key, n.content ?? n.value, r));
  }
  async remove(t) {
    await ni(this.generateHash(t), { force: !0 });
  }
  removeSync(t) {
    ei(this.generateHash(t), { force: !0 });
  }
  async clear() {
    let t = await ri(this.cache_dir);
    await Promise.all(
      t.filter((r) => r.startsWith(this.prefix)).map((r) => ni(ne(this.cache_dir, r), { force: !0 }))
    );
  }
  clearSync() {
    Iu(this.cache_dir).filter((t) => t.startsWith(this.prefix)).forEach((t) => ei(ne(this.cache_dir, t), { force: !0 }));
  }
  async getAll() {
    let t = Date.now(), r = await ri(this.cache_dir);
    return (await Promise.all(
      r.filter((i) => i.startsWith(this.prefix)).map((i) => ti(ne(this.cache_dir, i), "utf8"))
    )).map((i) => JSON.parse(i)).filter((i) => i.content && !this.isExpired(i, t));
  }
  async load() {
    return {
      files: (await this.getAll()).map((r) => ({
        path: this.generateHash(r.key),
        value: r.content,
        key: r.key
      }))
    };
  }
};
function Zt(e) {
  return new Yt(e);
}
o(Zt, "createFileSystemCache");

// src/common/utils/resolve-path-in-sb-cache.ts
import { join as di } from "node:path";

// ../node_modules/find-cache-dir/index.js
var pi = R(ii(), 1);
import Wu from "node:process";
import oe from "node:path";
import We from "node:fs";

// ../node_modules/pkg-dir/index.js
import qu from "node:path";

// ../node_modules/pkg-dir/node_modules/find-up/index.js
import qe from "node:path";
import { fileURLToPath as Lu } from "node:url";

// ../node_modules/locate-path/index.js
import Gu from "node:process";
import ju from "node:path";
import si, { promises as Hm } from "node:fs";
import { fileURLToPath as Nu } from "node:url";
var ai = {
  directory: "isDirectory",
  file: "isFile"
};
function Bu(e) {
  if (!Object.hasOwnProperty.call(ai, e))
    throw new Error(`Invalid type specified: ${e}`);
}
o(Bu, "checkType");
var Du = /* @__PURE__ */ o((e, t) => t[ai[e]](), "matchType"), Mu = /* @__PURE__ */ o((e) => e instanceof URL ? Nu(e) : e, "toPath");
function Qt(e, {
  cwd: t = Gu.cwd(),
  type: r = "file",
  allowSymlinks: n = !0
} = {}) {
  Bu(r), t = Mu(t);
  let i = n ? si.statSync : si.lstatSync;
  for (let s of e)
    try {
      let a = i(ju.resolve(t, s), {
        throwIfNoEntry: !1
      });
      if (!a)
        continue;
      if (Du(r, a))
        return s;
    } catch {
    }
}
o(Qt, "locatePathSync");

// ../node_modules/pkg-dir/node_modules/path-exists/index.js
import Ym, { promises as Zm } from "node:fs";

// ../node_modules/pkg-dir/node_modules/find-up/index.js
var Fu = /* @__PURE__ */ o((e) => e instanceof URL ? Lu(e) : e, "toPath"), Uu = Symbol("findUpStop");
function $u(e, t = {}) {
  let r = qe.resolve(Fu(t.cwd) || ""), { root: n } = qe.parse(r), i = t.stopAt || n, s = t.limit || Number.POSITIVE_INFINITY, a = [e].flat(),
  c = /* @__PURE__ */ o((l) => {
    if (typeof e != "function")
      return Qt(a, l);
    let f = e(l.cwd);
    return typeof f == "string" ? Qt([f], l) : f;
  }, "runMatcher"), u = [];
  for (; ; ) {
    let l = c({ ...t, cwd: r });
    if (l === Uu || (l && u.push(qe.resolve(r, l)), r === i || u.length >= s))
      break;
    r = qe.dirname(r);
  }
  return u;
}
o($u, "findUpMultipleSync");
function ci(e, t = {}) {
  return $u(e, { ...t, limit: 1 })[0];
}
o(ci, "findUpSync");

// ../node_modules/pkg-dir/index.js
function ui({ cwd: e } = {}) {
  let t = ci("package.json", { cwd: e });
  return t && qu.dirname(t);
}
o(ui, "packageDirectorySync");

// ../node_modules/find-cache-dir/index.js
var { env: er, cwd: Hu } = Wu, li = /* @__PURE__ */ o((e) => {
  try {
    return We.accessSync(e, We.constants.W_OK), !0;
  } catch {
    return !1;
  }
}, "isWritable");
function fi(e, t) {
  return t.create && We.mkdirSync(e, { recursive: !0 }), e;
}
o(fi, "useDirectory");
function Vu(e) {
  let t = oe.join(e, "node_modules");
  if (!(!li(t) && (We.existsSync(t) || !li(oe.join(e)))))
    return t;
}
o(Vu, "getNodeModuleDirectory");
function tr(e = {}) {
  if (er.CACHE_DIR && !["true", "false", "1", "0"].includes(er.CACHE_DIR))
    return fi(oe.join(er.CACHE_DIR, e.name), e);
  let { cwd: t = Hu(), files: r } = e;
  if (r) {
    if (!Array.isArray(r))
      throw new TypeError(`Expected \`files\` option to be an array, got \`${typeof r}\`.`);
    t = (0, pi.default)(r.map((i) => oe.resolve(t, i)));
  }
  if (t = ui({ cwd: t }), !(!t || !Vu(t)))
    return fi(oe.join(t, "node_modules", ".cache", e.name), e);
}
o(tr, "findCacheDirectory");

// src/common/utils/resolve-path-in-sb-cache.ts
function mi(e, t = "default") {
  let r = tr({ name: "storybook" });
  return r ||= di(process.cwd(), "node_modules", ".cache", "storybook"), di(r, t, e);
}
o(mi, "resolvePathInStorybookCache");

// src/telemetry/run-telemetry-operation.ts
var hi = Zt({
  basePath: mi("telemetry"),
  ns: "storybook",
  ttl: 24 * 60 * 60 * 1e3
  // 24h
}), He = /* @__PURE__ */ o(async (e, t) => {
  let r = await hi.get(e);
  return r === void 0 && (r = await t(), r !== void 0 && await hi.set(e, r)), r;
}, "runTelemetryOperation");

// src/telemetry/get-application-file-count.ts
var Ju = ["page", "screen"], Ku = ["js", "jsx", "ts", "tsx"], Xu = /* @__PURE__ */ o(async (e) => {
  let r = Ju.flatMap((n) => [
    n,
    [n[0].toUpperCase(), ...n.slice(1)].join("")
  ]).flatMap(
    (n) => Ku.map((i) => `"${e}${zu}*${n}*.${i}"`)
  );
  try {
    let n = `git ls-files -- ${r.join(" ")}`;
    return await $e(n);
  } catch {
    return;
  }
}, "getApplicationFilesCountUncached"), yi = /* @__PURE__ */ o(async (e) => He(
  "applicationFiles",
  async () => Xu(e)
), "getApplicationFileCount");

// src/telemetry/get-chromatic-version.ts
function gi(e) {
  let t = e.dependencies?.chromatic || e.devDependencies?.chromatic || e.peerDependencies?.chromatic;
  return t || (e.scripts && Object.values(e.scripts).find((r) => r?.match(/chromatic/)) ? "latest" : void 0);
}
o(gi, "getChromaticVersionSpecifier");

// src/telemetry/get-framework-info.ts
import { normalize as Qu } from "node:path";
import { frameworkPackages as el } from "@storybook/core/common";

// src/telemetry/package-json.ts
import { readFile as Yu } from "node:fs/promises";
import { join as Zu } from "node:path";
var rr = /* @__PURE__ */ o(async (e) => {
  let t = Object.keys(e);
  return Promise.all(t.map(Ve));
}, "getActualPackageVersions"), Ve = /* @__PURE__ */ o(async (e) => {
  try {
    let t = await nr(e);
    return {
      name: e,
      version: t.version
    };
  } catch {
    return { name: e, version: null };
  }
}, "getActualPackageVersion"), nr = /* @__PURE__ */ o(async (e) => {
  let t = y.resolve(Zu(e, "package.json"), {
    paths: [process.cwd()]
  });
  return JSON.parse(await Yu(t, { encoding: "utf8" }));
}, "getActualPackageJson");

// src/telemetry/get-framework-info.ts
var tl = [
  "html",
  "react",
  "svelte",
  "vue3",
  "preact",
  "server",
  "vue",
  "web-components",
  "angular",
  "ember"
], rl = ["builder-webpack5", "builder-vite"];
function bi(e, t) {
  let { name: r = "", version: n, dependencies: i, devDependencies: s, peerDependencies: a } = e, c = {
    // We include the framework itself because it may be a renderer too (e.g. angular)
    [r]: n,
    ...i,
    ...s,
    ...a
  };
  return t.map((u) => `@storybook/${u}`).find((u) => c[u]);
}
o(bi, "findMatchingPackage");
var nl = /* @__PURE__ */ o((e) => {
  let t = Qu(e).replace(new RegExp(/\\/, "g"), "/");
  return Object.keys(el).find((n) => t.endsWith(n)) || z(e).replace(/.*node_modules[\\/]/, "");
}, "getFrameworkPackageName");
async function xi(e) {
  if (!e?.framework)
    return {};
  let t = typeof e.framework == "string" ? e.framework : e.framework?.name;
  if (!t)
    return {};
  let r = await nr(t);
  if (!r)
    return {};
  let n = bi(r, rl), i = bi(r, tl), s = nl(t), a = typeof e.framework == "object" ? e.framework.options : {};
  return {
    framework: {
      name: s,
      options: a
    },
    builder: n,
    renderer: i
  };
}
o(xi, "getFrameworkInfo");

// src/telemetry/get-has-router-package.ts
var ol = /* @__PURE__ */ new Set([
  "react-router",
  "react-router-dom",
  "remix",
  "@tanstack/react-router",
  "expo-router",
  "@reach/router",
  "react-easy-router",
  "@remix-run/router",
  "wouter",
  "wouter-preact",
  "preact-router",
  "vue-router",
  "unplugin-vue-router",
  "@angular/router",
  "@solidjs/router",
  // metaframeworks that imply routing
  "next",
  "react-scripts",
  "gatsby",
  "nuxt",
  "@sveltejs/kit"
]);
function Si(e) {
  return Object.keys(e?.dependencies ?? {}).some(
    (t) => ol.has(t)
  );
}
o(Si, "getHasRouterPackage");

// src/telemetry/get-monorepo-type.ts
import { existsSync as wi, readFileSync as il } from "node:fs";
import { join as or } from "node:path";
import { getProjectRoot as sl } from "@storybook/core/common";
var vi = {
  Nx: "nx.json",
  Turborepo: "turbo.json",
  Lerna: "lerna.json",
  Rush: "rush.json",
  Lage: "lage.config.json"
}, Pi = /* @__PURE__ */ o(() => {
  let e = sl();
  if (!e)
    return;
  let r = Object.keys(vi).find((i) => {
    let s = or(e, vi[i]);
    return wi(s);
  });
  if (r)
    return r;
  if (!wi(or(e, "package.json")))
    return;
  if (JSON.parse(
    il(or(e, "package.json"), { encoding: "utf8" })
  )?.workspaces)
    return "Workspaces";
}, "getMonorepoType");

// src/telemetry/get-portable-stories-usage.ts
var al = /* @__PURE__ */ o(async (e) => {
  try {
    let t = "git grep -l composeStor" + (e ? ` -- ${e}` : "");
    return await $e(t);
  } catch (t) {
    return t.exitCode === 1 ? 0 : void 0;
  }
}, "getPortableStoriesFileCountUncached"), Ei = /* @__PURE__ */ o(async (e) => He(
  "portableStories",
  async () => al(e)
), "getPortableStoriesFileCount");

// src/telemetry/storybook-metadata.ts
var Ti = {
  next: "Next",
  "react-scripts": "CRA",
  gatsby: "Gatsby",
  "@nuxtjs/storybook": "nuxt",
  "@nrwl/storybook": "nx",
  "@vue/cli-service": "vue-cli",
  "@sveltejs/kit": "sveltekit"
}, ki = /* @__PURE__ */ o((e) => z(e).replace(/\/dist\/.*/, "").replace(/\.[mc]?[tj]?s[x]?$/, "").replace(/\/register$/, "").replace(/\/manager$/,
"").replace(/\/preset$/, ""), "sanitizeAddonName"), ml = /* @__PURE__ */ o(async ({
  packageJsonPath: e,
  packageJson: t,
  mainConfig: r
}) => {
  let n = {
    generatedAt: (/* @__PURE__ */ new Date()).getTime(),
    hasCustomBabel: !1,
    hasCustomWebpack: !1,
    hasStaticDirs: !1,
    hasStorybookEslint: !1,
    refCount: 0
  }, i = {
    ...t?.dependencies,
    ...t?.devDependencies,
    ...t?.peerDependencies
  }, s = Object.keys(i).find((d) => !!Ti[d]);
  if (s) {
    let { version: d } = await Ve(s);
    n.metaFramework = {
      name: Ti[s],
      packageName: s,
      version: d
    };
  }
  let a = [
    "playwright",
    "vitest",
    "jest",
    "cypress",
    "nightwatch",
    "webdriver",
    "@web/test-runner",
    "puppeteer",
    "karma",
    "jasmine",
    "chai",
    "testing-library",
    "@ngneat/spectator",
    "wdio",
    "msw",
    "miragejs",
    "sinon"
  ], c = Object.keys(i).filter(
    (d) => a.find((v) => d.includes(v))
  );
  n.testPackages = Object.fromEntries(
    await Promise.all(
      c.map(async (d) => [d, (await Ve(d))?.version])
    )
  ), n.hasRouterPackage = Si(t);
  let u = Pi();
  u && (n.monorepo = u);
  try {
    let d = await (0, Je.detect)({ cwd: ul() }), v = await (0, Je.getNpmVersion)(d);
    n.packageManager = {
      type: d,
      version: v
    };
  } catch {
  }
  n.hasCustomBabel = !!r.babel, n.hasCustomWebpack = !!r.webpackFinal, n.hasStaticDirs = !!r.staticDirs, typeof r.typescript == "object" && (n.
  typescriptOptions = r.typescript);
  let l = await xi(r);
  typeof r.refs == "object" && (n.refCount = Object.keys(r.refs).length), typeof r.features == "object" && (n.features = r.features);
  let f = {};
  r.addons && r.addons.forEach((d) => {
    let v, ae;
    typeof d == "string" ? v = ki(d) : (d.name.includes("addon-essentials") && (ae = d.options), v = ki(d.name)), f[v] = {
      options: ae,
      version: void 0
    };
  });
  let x = gi(t);
  x && (f.chromatic = {
    version: void 0,
    versionSpecifier: x,
    options: void 0
  }), (await rr(f)).forEach(({ name: d, version: v }) => {
    f[d].version = v;
  });
  let m = Object.keys(f), g = Object.keys(i).filter((d) => d.includes("storybook") && !m.includes(d)).reduce((d, v) => ({
    ...d,
    [v]: { version: void 0 }
  }), {});
  (await rr(g)).forEach(({ name: d, version: v }) => {
    g[d].version = v;
  });
  let S = i.typescript ? "typescript" : "javascript", T = !!i["eslint-plugin-storybook"], E = fl(t);
  try {
    let { previewConfig: d } = E;
    if (d) {
      let v = await dl(d), ae = !!(v.getFieldNode(["globals"]) || v.getFieldNode(["globalTypes"]));
      n.preview = { ...n.preview, usesGlobals: ae };
    }
  } catch {
  }
  let I = g[E.frameworkPackage]?.version, O = await Ei(), A = await yi(cl(e));
  return {
    ...n,
    ...l,
    portableStoriesFileCount: O,
    applicationFileCount: A,
    storybookVersion: I,
    storybookVersionSpecifier: E.version,
    language: S,
    storybookPackages: g,
    addons: f,
    hasStorybookEslint: T
  };
}, "computeStorybookMetadata");
async function hl() {
  let e = await Pt(process.cwd());
  return e ? {
    packageJsonPath: e,
    packageJson: await co(e) || {}
  } : {
    packageJsonPath: process.cwd(),
    packageJson: {}
  };
}
o(hl, "getPackageJsonDetails");
var ze, Ii = /* @__PURE__ */ o(async (e) => {
  if (ze)
    return ze;
  let { packageJson: t, packageJsonPath: r } = await hl(), n = (e || ll(
    String(t?.scripts?.storybook || ""),
    "-c",
    "--config-dir"
  )) ?? ".storybook", i = await pl({ configDir: n });
  return ze = await ml({ mainConfig: i, packageJson: t, packageJsonPath: r }), ze;
}, "getStorybookMetadata");

// src/telemetry/telemetry.ts
var Mi = R(Oi(), 1);
import * as Di from "node:os";

// ../node_modules/nanoid/index.js
import { randomFillSync as Ri } from "crypto";

// ../node_modules/nanoid/url-alphabet/index.js
var Ai = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// ../node_modules/nanoid/index.js
var yl = 128, B, V, gl = /* @__PURE__ */ o((e) => {
  !B || B.length < e ? (B = Buffer.allocUnsafe(e * yl), Ri(B), V = 0) : V + e > B.length && (Ri(B), V = 0), V += e;
}, "fillPool");
var ie = /* @__PURE__ */ o((e = 21) => {
  gl(e -= 0);
  let t = "";
  for (let r = V - e; r < V; r++)
    t += Ai[B[r] & 63];
  return t;
}, "nanoid");

// src/telemetry/anonymous-id.ts
import { relative as xl } from "node:path";
import { getProjectRoot as Sl } from "@storybook/core/common";
import { execSync as wl } from "child_process";

// src/telemetry/one-way-hash.ts
import { createHash as bl } from "crypto";
var ir = /* @__PURE__ */ o((e) => {
  let t = bl("sha256");
  return t.update("storybook-telemetry-salt"), t.update(e), t.digest("hex");
}, "oneWayHash");

// src/telemetry/anonymous-id.ts
function vl(e) {
  let n = e.trim().replace(/#.*$/, "").replace(/^.*@/, "").replace(/^.*\/\//, "");
  return (n.endsWith(".git") ? n : `${n}.git`).replace(":", "/");
}
o(vl, "normalizeGitUrl");
function Pl(e, t) {
  return `${vl(e)}${Kt(t)}`;
}
o(Pl, "unhashedProjectId");
var Xe, _i = /* @__PURE__ */ o(() => {
  if (Xe)
    return Xe;
  try {
    let e = Sl(), t = xl(e, process.cwd()), r = wl("git config --local --get remote.origin.url", {
      timeout: 1e3,
      stdio: "pipe"
    });
    Xe = ir(Pl(String(r), t));
  } catch {
  }
  return Xe;
}, "getAnonymousProjectId");

// src/telemetry/event-cache.ts
import { cache as ar } from "@storybook/core/common";
var sr = Promise.resolve(), El = /* @__PURE__ */ o(async (e, t) => {
  let r = await ar.get("lastEvents") || {};
  r[e] = { body: t, timestamp: Date.now() }, await ar.set("lastEvents", r);
}, "setHelper"), ji = /* @__PURE__ */ o(async (e, t) => (await sr, sr = El(e, t), sr), "set");
var Tl = /* @__PURE__ */ o((e) => {
  let { body: t, timestamp: r } = e;
  return {
    timestamp: r,
    eventType: t?.eventType,
    eventId: t?.eventId,
    sessionId: t?.sessionId
  };
}, "upgradeFields"), kl = ["init", "upgrade"], Il = ["build", "dev", "error"], Gi = /* @__PURE__ */ o((e, t) => {
  let r = t.map((n) => e?.[n]).filter(Boolean).sort((n, i) => i.timestamp - n.timestamp);
  return r.length > 0 ? r[0] : void 0;
}, "lastEvent"), Cl = /* @__PURE__ */ o(async (e = void 0) => {
  let t = e || await ar.get("lastEvents") || {}, r = Gi(t, kl), n = Gi(t, Il);
  if (r)
    return !n?.timestamp || r.timestamp > n.timestamp ? Tl(r) : void 0;
}, "getPrecedingUpgrade");

// src/telemetry/fetch.ts
var Ni = global.fetch;

// src/telemetry/session-id.ts
import { cache as Bi } from "@storybook/core/common";
var Ol = 1e3 * 60 * 60 * 2, se;
var cr = /* @__PURE__ */ o(async () => {
  let e = Date.now();
  if (!se) {
    let t = await Bi.get("session");
    t && t.lastUsed >= e - Ol ? se = t.id : se = ie();
  }
  return await Bi.set("session", { id: se, lastUsed: e }), se;
}, "getSessionId");

// src/telemetry/telemetry.ts
var Al = (0, Mi.default)(Ni), Rl = process.env.STORYBOOK_TELEMETRY_URL || "https://storybook.js.org/event-log", Ye = [], _l = /* @__PURE__ */ o(
(e, t) => {
  ur[e] = t;
}, "addToGlobalContext"), Gl = /* @__PURE__ */ o(() => {
  try {
    let e = Di.platform();
    return e === "win32" ? "Windows" : e === "darwin" ? "macOS" : e === "linux" ? "Linux" : `Other: ${e}`;
  } catch {
    return "Unknown";
  }
}, "getOperatingSystem"), ur = {
  inCI: !!process.env.CI,
  isTTY: process.stdout.isTTY,
  platform: Gl(),
  nodeVersion: process.versions.node
}, jl = /* @__PURE__ */ o(async (e, t, r) => {
  let { eventType: n, payload: i, metadata: s, ...a } = e, c = await cr(), u = ie(), l = { ...a, eventType: n, eventId: u, sessionId: c, metadata: s,
  payload: i, context: t };
  return Al(Rl, {
    method: "post",
    body: JSON.stringify(l),
    headers: { "Content-Type": "application/json" },
    retries: 3,
    retryOn: [503, 504],
    retryDelay: /* @__PURE__ */ o((f) => 2 ** f * (typeof r?.retryDelay == "number" && !Number.isNaN(r?.retryDelay) ? r.retryDelay : 1e3), "\
retryDelay")
  });
}, "prepareRequest");
async function Li(e, t = { retryDelay: 1e3, immediate: !1 }) {
  let { eventType: r, payload: n, metadata: i, ...s } = e, a = t.stripMetadata ? ur : {
    ...ur,
    anonymousId: _i()
  }, c;
  try {
    c = jl(e, a, t), Ye.push(c), t.immediate ? await Promise.all(Ye) : await c;
    let u = await cr(), l = ie(), f = { ...s, eventType: r, eventId: l, sessionId: u, metadata: i, payload: n, context: a };
    await ji(r, f);
  } catch {
  } finally {
    Ye = Ye.filter((u) => u !== c);
  }
}
o(Li, "sendTelemetry");

// src/telemetry/index.ts
var $g = /* @__PURE__ */ o((e) => e.startsWith("example-button--") || e.startsWith("example-header--") || e.startsWith("example-page--"), "i\
sExampleStoryId"), qg = /* @__PURE__ */ o(async (e, t = {}, r = {}) => {
  e !== "boot" && r.notify !== !1 && await hr();
  let n = {
    eventType: e,
    payload: t
  };
  try {
    r?.stripMetadata || (n.metadata = await Ii(r?.configDir));
  } catch (i) {
    n.payload.metadataErrorMessage = le(i).message, r?.enableCrashReports && (n.payload.metadataError = le(i));
  } finally {
    let { error: i } = n.payload;
    i && (n.payload.error = le(i)), (!n.payload.error || r?.enableCrashReports) && (process.env?.STORYBOOK_TELEMETRY_DEBUG && (Fi.info(`
[telemetry]`), Fi.info(JSON.stringify(n, null, 2))), await Li(n, r));
  }
}, "telemetry");
export {
  _l as addToGlobalContext,
  z as cleanPaths,
  ml as computeStorybookMetadata,
  Cl as getPrecedingUpgrade,
  Ii as getStorybookMetadata,
  $g as isExampleStoryId,
  Ti as metaFrameworks,
  ir as oneWayHash,
  gr as removeAnsiEscapeCodes,
  ki as sanitizeAddonName,
  le as sanitizeError,
  qg as telemetry
};
