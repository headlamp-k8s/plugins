"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const process_1 = __importDefault(require("process"));
const minimist_1 = __importDefault(require("minimist"));
const applyPatches_1 = require("./applyPatches");
const getAppRootPath_1 = require("./getAppRootPath");
const makePatch_1 = require("./makePatch");
const makeRegExp_1 = require("./makeRegExp");
const detectPackageManager_1 = require("./detectPackageManager");
const path_1 = require("./path");
const path_2 = require("path");
const slash = require("slash");
const is_ci_1 = __importDefault(require("is-ci"));
const appPath = getAppRootPath_1.getAppRootPath();
const argv = minimist_1.default(process_1.default.argv.slice(2), {
    boolean: [
        "use-yarn",
        "case-sensitive-path-filtering",
        "reverse",
        "help",
        "version",
        "error-on-fail",
        "error-on-warn",
        "create-issue",
    ],
    string: ["patch-dir"],
});
const packageNames = argv._;
console.log(chalk_1.default.bold("patch-package"), 
// tslint:disable-next-line:no-var-requires
require(path_1.join(__dirname, "../package.json")).version);
if (argv.version || argv.v) {
    // noop
}
else if (argv.help || argv.h) {
    printHelp();
}
else {
    const patchDir = slash(path_2.normalize((argv["patch-dir"] || "patches") + path_2.sep));
    if (patchDir.startsWith("/")) {
        throw new Error("--patch-dir must be a relative path");
    }
    if (packageNames.length) {
        const includePaths = makeRegExp_1.makeRegExp(argv.include, "include", /.*/, argv["case-sensitive-path-filtering"]);
        const excludePaths = makeRegExp_1.makeRegExp(argv.exclude, "exclude", /^package\.json$/, argv["case-sensitive-path-filtering"]);
        const packageManager = detectPackageManager_1.detectPackageManager(appPath, argv["use-yarn"] ? "yarn" : null);
        const createIssue = argv["create-issue"];
        packageNames.forEach((packagePathSpecifier) => {
            makePatch_1.makePatch({
                packagePathSpecifier,
                appPath,
                packageManager,
                includePaths,
                excludePaths,
                patchDir,
                createIssue,
            });
        });
    }
    else {
        console.log("Applying patches...");
        const reverse = !!argv["reverse"];
        // don't want to exit(1) on postinsall locally.
        // see https://github.com/ds300/patch-package/issues/86
        const shouldExitWithError = !!argv["error-on-fail"] || is_ci_1.default || process_1.default.env.NODE_ENV === "test";
        const shouldExitWithWarning = !!argv["error-on-warn"];
        applyPatches_1.applyPatchesForApp({
            appPath,
            reverse,
            patchDir,
            shouldExitWithError,
            shouldExitWithWarning,
        });
    }
}
function printHelp() {
    console.log(`
Usage:

  1. Patching packages
  ====================

    ${chalk_1.default.bold("patch-package")}

  Without arguments, the ${chalk_1.default.bold("patch-package")} command will attempt to find and apply
  patch files to your project. It looks for files named like

     ./patches/<package-name>+<version>.patch

  Options:

    ${chalk_1.default.bold("--patch-dir <dirname>")}

      Specify the name for the directory in which the patch files are located.
      
    ${chalk_1.default.bold("--error-on-fail")}
    
      Forces patch-package to exit with code 1 after failing.
    
      When running locally patch-package always exits with 0 by default.
      This happens even after failing to apply patches because otherwise 
      yarn.lock and package.json might get out of sync with node_modules,
      which can be very confusing.
      
      --error-on-fail is ${chalk_1.default.bold("switched on")} by default on CI.
      
      See https://github.com/ds300/patch-package/issues/86 for background.
      
    ${chalk_1.default.bold("--error-on-warn")}
    
      Forces patch-package to exit with code 1 after warning.
      
      See https://github.com/ds300/patch-package/issues/314 for background.

    ${chalk_1.default.bold("--reverse")}
        
      Un-applies all patches.

      Note that this will fail if the patched files have changed since being
      patched. In that case, you'll probably need to re-install 'node_modules'.

      This option was added to help people using CircleCI avoid an issue around caching
      and patch file updates (https://github.com/ds300/patch-package/issues/37),
      but might be useful in other contexts too.
      

  2. Creating patch files
  =======================

    ${chalk_1.default.bold("patch-package")} <package-name>${chalk_1.default.italic("[ <package-name>]")}

  When given package names as arguments, patch-package will create patch files
  based on any changes you've made to the versions installed by yarn/npm.

  Options:
  
    ${chalk_1.default.bold("--create-issue")}
    
       For packages whose source is hosted on GitHub this option opens a web
       browser with a draft issue based on your diff.

    ${chalk_1.default.bold("--use-yarn")}

        By default, patch-package checks whether you use npm or yarn based on
        which lockfile you have. If you have both, it uses npm by default.
        Set this option to override that default and always use yarn.

    ${chalk_1.default.bold("--exclude <regexp>")}

        Ignore paths matching the regexp when creating patch files.
        Paths are relative to the root dir of the package to be patched.

        Default: 'package\\.json$'

    ${chalk_1.default.bold("--include <regexp>")}

        Only consider paths matching the regexp when creating patch files.
        Paths are relative to the root dir of the package to be patched.

        Default '.*'

    ${chalk_1.default.bold("--case-sensitive-path-filtering")}

        Make regexps used in --include or --exclude filters case-sensitive.
    
    ${chalk_1.default.bold("--patch-dir")}

        Specify the name for the directory in which to put the patch files.
`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBeUI7QUFDekIsc0RBQTZCO0FBQzdCLHdEQUErQjtBQUUvQixpREFBbUQ7QUFDbkQscURBQWlEO0FBQ2pELDJDQUF1QztBQUN2Qyw2Q0FBeUM7QUFDekMsaUVBQTZEO0FBQzdELGlDQUE2QjtBQUM3QiwrQkFBcUM7QUFDckMsK0JBQStCO0FBQy9CLGtEQUF3QjtBQUV4QixNQUFNLE9BQU8sR0FBRywrQkFBYyxFQUFFLENBQUE7QUFDaEMsTUFBTSxJQUFJLEdBQUcsa0JBQVEsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDM0MsT0FBTyxFQUFFO1FBQ1AsVUFBVTtRQUNWLCtCQUErQjtRQUMvQixTQUFTO1FBQ1QsTUFBTTtRQUNOLFNBQVM7UUFDVCxlQUFlO1FBQ2YsZUFBZTtRQUNmLGNBQWM7S0FDZjtJQUNELE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQztDQUN0QixDQUFDLENBQUE7QUFDRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBO0FBRTNCLE9BQU8sQ0FBQyxHQUFHLENBQ1QsZUFBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDM0IsMkNBQTJDO0FBQzNDLE9BQU8sQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQ3BELENBQUE7QUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRTtJQUMxQixPQUFPO0NBQ1I7S0FBTSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRTtJQUM5QixTQUFTLEVBQUUsQ0FBQTtDQUNaO0tBQU07SUFDTCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsZ0JBQVMsQ0FBQyxDQUFD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Q0FBQyxhQUFhLENBQUM7OztDQUc5QixDQUFDLENBQUE7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiXG5pbXBvcnQgcHJvY2VzcyBmcm9tIFwicHJvY2Vzc1wiXG5pbXBvcnQgbWluaW1pc3QgZnJvbSBcIm1pbmltaXN0XCJcblxuaW1wb3J0IHsgYXBwbHlQYXRjaGVzRm9yQXBwIH0gZnJvbSBcIi4vYXBwbHlQYXRjaGVzXCJcbmltcG9ydCB7IGdldEFwcFJvb3RQYXRoIH0gZnJvbSBcIi4vZ2V0QXBwUm9vdFBhdGhcIlxuaW1wb3J0IHsgbWFrZVBhdGNoIH0gZnJvbSBcIi4vbWFrZVBhdGNoXCJcbmltcG9ydCB7IG1ha2VSZWdFeHAgfSBmcm9tIFwiLi9tYWtlUmVnRXhwXCJcbmltcG9ydCB7IGRldGVjdFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSBcIi4vZGV0ZWN0UGFja2FnZU1hbmFnZXJcIlxuaW1wb3J0IHsgam9pbiB9IGZyb20gXCIuL3BhdGhcIlxuaW1wb3J0IHsgbm9ybWFsaXplLCBzZXAgfSBmcm9tIFwicGF0aFwiXG5pbXBvcnQgc2xhc2ggPSByZXF1aXJlKFwic2xhc2hcIilcbmltcG9ydCBpc0NpIGZyb20gXCJpcy1jaVwiXG5cbmNvbnN0IGFwcFBhdGggPSBnZXRBcHBSb290UGF0aCgpXG5jb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpLCB7XG4gIGJvb2xlYW46IFtcbiAgICBcInVzZS15YXJuXCIsXG4gICAgXCJjYXNlLXNlbnNpdGl2ZS1wYXRoLWZpbHRlcmluZ1wiLFxuICAgIFwicmV2ZXJzZVwiLFxuICAgIFwiaGVscFwiLFxuICAgIFwidmVyc2lvblwiLFxuICAgIFwiZXJyb3Itb24tZmFpbFwiLFxuICAgIFwiZXJyb3Itb24td2FyblwiLFxuICAgIFwiY3JlYXRlLWlzc3VlXCIsXG4gIF0sXG4gIHN0cmluZzogW1wicGF0Y2gtZGlyXCJdLFxufSlcbmNvbnN0IHBhY2thZ2VOYW1lcyA9IGFyZ3YuX1xuXG5jb25zb2xlLmxvZyhcbiAgY2hhbGsuYm9sZChcInBhdGNoLXBhY2thZ2VcIiksXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby12YXItcmVxdWlyZXNcbiAgcmVxdWlyZShqb2luKF9fZGlybmFtZSwgXCIuLi9wYWNrYWdlLmpzb25cIikpLnZlcnNpb24sXG4pXG5cbmlmIChhcmd2LnZlcnNpb24gfHwgYXJndi52KSB7XG4gIC8vIG5vb3Bcbn0gZWxzZSBpZiAoYXJndi5oZWxwIHx8IGFyZ3YuaCkge1xuICBwcmludEhlbHAoKVxufSBlbHNlIHtcbiAgY29uc3QgcGF0Y2hEaXIgPSBzbGFzaChub3JtYWxpemUoKGFyZ3ZbXCJwYXRjaC1kaXJcIl0gfHwgXCJwYXRjaGVzXCIpICsgc2VwKSlcbiAgaWYgKHBhdGNoRGlyLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiLS1wYXRjaC1kaXIgbXVzdCBiZSBhIHJlbGF0aXZlIHBhdGhcIilcbiAgfVxuICBpZiAocGFja2FnZU5hbWVzLmxlbmd0aCkge1xuICAgIGNvbnN0IGluY2x1ZGVQYXRocyA9IG1ha2VSZWdFeHAoXG4gICAgICBhcmd2LmluY2x1ZGUsXG4gICAgICBcImluY2x1ZGVcIixcbiAgICAgIC8uKi8sXG4gICAgICBhcmd2W1wiY2FzZS1zZW5zaXRpdmUtcGF0aC1maWx0ZXJpbmdcIl0sXG4gICAgKVxuICAgIGNvbnN0IGV4Y2x1ZGVQYXRocyA9IG1ha2VSZWdFeHAoXG4gICAgICBhcmd2LmV4Y2x1ZGUsXG4gICAgICBcImV4Y2x1ZGVcIixcbiAgICAgIC9ecGFja2FnZVxcLmpzb24kLyxcbiAgICAgIGFyZ3ZbXCJjYXNlLXNlbnNpdGl2ZS1wYXRoLWZpbHRlcmluZ1wiXSxcbiAgICApXG4gICAgY29uc3QgcGFja2FnZU1hbmFnZXIgPSBkZXRlY3RQYWNrYWdlTWFuYWdlcihcbiAgICAgIGFwcFBhdGgsXG4gICAgICBhcmd2W1widXNlLXlhcm5cIl0gPyBcInlhcm5cIiA6IG51bGwsXG4gICAgKVxuICAgIGNvbnN0IGNyZWF0ZUlzc3VlID0gYXJndltcImNyZWF0ZS1pc3N1ZVwiXVxuICAgIHBhY2thZ2VOYW1lcy5mb3JFYWNoKChwYWNrYWdlUGF0aFNwZWNpZmllcjogc3RyaW5nKSA9PiB7XG4gICAgICBtYWtlUGF0Y2goe1xuICAgICAgICBwYWNrYWdlUGF0aFNwZWNpZmllcixcbiAgICAgICAgYXBwUGF0aCxcbiAgICAgICAgcGFja2FnZU1hbmFnZXIsXG4gICAgICAgIGluY2x1ZGVQYXRocyxcbiAgICAgICAgZXhjbHVkZVBhdGhzLFxuICAgICAgICBwYXRjaERpcixcbiAgICAgICAgY3JlYXRlSXNzdWUsXG4gICAgICB9KVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coXCJBcHBseWluZyBwYXRjaGVzLi4uXCIpXG4gICAgY29uc3QgcmV2ZXJzZSA9ICEhYXJndltcInJldmVyc2VcIl1cbiAgICAvLyBkb24ndCB3YW50IHRvIGV4aXQoMSkgb24gcG9zdGluc2FsbCBsb2NhbGx5LlxuICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vZHMzMDAvcGF0Y2gtcGFja2FnZS9pc3N1ZXMvODZcbiAgICBjb25zdCBzaG91bGRFeGl0V2l0aEVycm9yID1cbiAgICAgICEhYXJndltcImVycm9yLW9uLWZhaWxcIl0gfHwgaXNDaSB8fCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJ0ZXN0XCJcblxuICAgIGNvbnN0IHNob3VsZEV4aXRXaXRoV2FybmluZyA9ICEhYXJndltcImVycm9yLW9uLXdhcm5cIl1cblxuICAgIGFwcGx5UGF0Y2hlc0ZvckFwcCh7XG4gICAgICBhcHBQYXRoLFxuICAgICAgcmV2ZXJzZSxcbiAgICAgIHBhdGNoRGlyLFxuICAgICAgc2hvdWxkRXhpdFdpdGhFcnJvcixcbiAgICAgIHNob3VsZEV4aXRXaXRoV2FybmluZyxcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIHByaW50SGVscCgpIHtcbiAgY29uc29sZS5sb2coYFxuVXNhZ2U6XG5cbiAgMS4gUGF0Y2hpbmcgcGFja2FnZXNcbiAgPT09PT09PT09PT09PT09PT09PT1cblxuICAgICR7Y2hhbGsuYm9sZChcInBhdGNoLXBhY2thZ2VcIil9XG5cbiAgV2l0aG91dCBhcmd1bWVudHMsIHRoZSAke2NoYWxrLmJvbGQoXG4gICAgXCJwYXRjaC1wYWNrYWdlXCIsXG4gICl9IGNvbW1hbmQgd2lsbCBhdHRlbXB0IHRvIGZpbmQgYW5kIGFwcGx5XG4gIHBhdGNoIGZpbGVzIHRvIHlvdXIgcHJvamVjdC4gSXQgbG9va3MgZm9yIGZpbGVzIG5hbWVkIGxpa2VcblxuICAgICAuL3BhdGNoZXMvPHBhY2thZ2UtbmFtZT4rPHZlcnNpb24+LnBhdGNoXG5cbiAgT3B0aW9uczpcblxuICAgICR7Y2hhbGsuYm9sZChcIi0tcGF0Y2gtZGlyIDxkaXJuYW1lPlwiKX1cblxuICAgICAgU3BlY2lmeSB0aGUgbmFtZSBmb3IgdGhlIGRpcmVjdG9yeSBpbiB3aGljaCB0aGUgcGF0Y2ggZmlsZXMgYXJlIGxvY2F0ZWQuXG4gICAgICBcbiAgICAke2NoYWxrLmJvbGQoXCItLWVycm9yLW9uLWZhaWxcIil9XG4gICAgXG4gICAgICBGb3JjZXMgcGF0Y2gtcGFja2FnZSB0byBleGl0IHdpdGggY29kZSAxIGFmdGVyIGZhaWxpbmcuXG4gICAgXG4gICAgICBXaGVuIHJ1bm5pbmcgbG9jYWxseSBwYXRjaC1wYWNrYWdlIGFsd2F5cyBleGl0cyB3aXRoIDAgYnkgZGVmYXVsdC5cbiAgICAgIFRoaXMgaGFwcGVucyBldmVuIGFmdGVyIGZhaWxpbmcgdG8gYXBwbHkgcGF0Y2hlcyBiZWNhdXNlIG90aGVyd2lzZSBcbiAgICAgIHlhcm4ubG9jayBhbmQgcGFja2FnZS5qc29uIG1pZ2h0IGdldCBvdXQgb2Ygc3luYyB3aXRoIG5vZGVfbW9kdWxlcyxcbiAgICAgIHdoaWNoIGNhbiBiZSB2ZXJ5IGNvbmZ1c2luZy5cbiAgICAgIFxuICAgICAgLS1lcnJvci1vbi1mYWlsIGlzICR7Y2hhbGsuYm9sZChcInN3aXRjaGVkIG9uXCIpfSBieSBkZWZhdWx0IG9uIENJLlxuICAgICAgXG4gICAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2RzMzAwL3BhdGNoLXBhY2thZ2UvaXNzdWVzLzg2IGZvciBiYWNrZ3JvdW5kLlxuICAgICAgXG4gICAgJHtjaGFsay5ib2xkKFwiLS1lcnJvci1vbi13YXJuXCIpfVxuICAgIFxuICAgICAgRm9yY2VzIHBhdGNoLXBhY2thZ2UgdG8gZXhpdCB3aXRoIGNvZGUgMSBhZnRlciB3YXJuaW5nLlxuICAgICAgXG4gICAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2RzMzAwL3BhdGNoLXBhY2thZ2UvaXNzdWVzLzMxNCBmb3IgYmFja2dyb3VuZC5cblxuICAgICR7Y2hhbGsuYm9sZChcIi0tcmV2ZXJzZVwiKX1cbiAgICAgICAgXG4gICAgICBVbi1hcHBsaWVzIGFsbCBwYXRjaGVzLlxuXG4gICAgICBOb3RlIHRoYXQgdGhpcyB3aWxsIGZhaWwgaWYgdGhlIHBhdGNoZWQgZmlsZXMgaGF2ZSBjaGFuZ2VkIHNpbmNlIGJlaW5nXG4gICAgICBwYXRjaGVkLiBJbiB0aGF0IGNhc2UsIHlvdSdsbCBwcm9iYWJseSBuZWVkIHRvIHJlLWluc3RhbGwgJ25vZGVfbW9kdWxlcycuXG5cbiAgICAgIFRoaXMgb3B0aW9uIHdhcyBhZGRlZCB0byBoZWxwIHBlb3BsZSB1c2luZyBDaXJjbGVDSSBhdm9pZCBhbiBpc3N1ZSBhcm91bmQgY2FjaGluZ1xuICAgICAgYW5kIHBhdGNoIGZpbGUgdXBkYXRlcyAoaHR0cHM6Ly9naXRodWIuY29tL2RzMzAwL3BhdGNoLXBhY2thZ2UvaXNzdWVzLzM3KSxcbiAgICAgIGJ1dCBtaWdodCBiZSB1c2VmdWwgaW4gb3RoZXIgY29udGV4dHMgdG9vLlxuICAgICAgXG5cbiAgMi4gQ3JlYXRpbmcgcGF0Y2ggZmlsZXNcbiAgPT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICR7Y2hhbGsuYm9sZChcInBhdGNoLXBhY2thZ2VcIil9IDxwYWNrYWdlLW5hbWU+JHtjaGFsay5pdGFsaWMoXG4gICAgXCJbIDxwYWNrYWdlLW5hbWU+XVwiLFxuICApfVxuXG4gIFdoZW4gZ2l2ZW4gcGFja2FnZSBuYW1lcyBhcyBhcmd1bWVudHMsIHBhdGNoLXBhY2thZ2Ugd2lsbCBjcmVhdGUgcGF0Y2ggZmlsZXNcbiAgYmFzZWQgb24gYW55IGNoYW5nZXMgeW91J3ZlIG1hZGUgdG8gdGhlIHZlcnNpb25zIGluc3RhbGxlZCBieSB5YXJuL25wbS5cblxuICBPcHRpb25zOlxuICBcbiAgICAke2NoYWxrLmJvbGQoXCItLWNyZWF0ZS1pc3N1ZVwiKX1cbiAgICBcbiAgICAgICBGb3IgcGFja2FnZXMgd2hvc2Ugc291cmNlIGlzIGhvc3RlZCBvbiBHaXRIdWIgdGhpcyBvcHRpb24gb3BlbnMgYSB3ZWJcbiAgICAgICBicm93c2VyIHdpdGggYSBkcmFmdCBpc3N1ZSBiYXNlZCBvbiB5b3VyIGRpZmYuXG5cbiAgICAke2NoYWxrLmJvbGQoXCItLXVzZS15YXJuXCIpfVxuXG4gICAgICAgIEJ5IGRlZmF1bHQsIHBhdGNoLXBhY2thZ2UgY2hlY2tzIHdoZXRoZXIgeW91IHVzZSBucG0gb3IgeWFybiBiYXNlZCBvblxuICAgICAgICB3aGljaCBsb2NrZmlsZSB5b3UgaGF2ZS4gSWYgeW91IGhhdmUgYm90aCwgaXQgdXNlcyBucG0gYnkgZGVmYXVsdC5cbiAgICAgICAgU2V0IHRoaXMgb3B0aW9uIHRvIG92ZXJyaWRlIHRoYXQgZGVmYXVsdCBhbmQgYWx3YXlzIHVzZSB5YXJuLlxuXG4gICAgJHtjaGFsay5ib2xkKFwiLS1leGNsdWRlIDxyZWdleHA+XCIpfVxuXG4gICAgICAgIElnbm9yZSBwYXRocyBtYXRjaGluZyB0aGUgcmVnZXhwIHdoZW4gY3JlYXRpbmcgcGF0Y2ggZmlsZXMuXG4gICAgICAgIFBhdGhzIGFyZSByZWxhdGl2ZSB0byB0aGUgcm9vdCBkaXIgb2YgdGhlIHBhY2thZ2UgdG8gYmUgcGF0Y2hlZC5cblxuICAgICAgICBEZWZhdWx0OiAncGFja2FnZVxcXFwuanNvbiQnXG5cbiAgICAke2NoYWxrLmJvbGQoXCItLWluY2x1ZGUgPHJlZ2V4cD5cIil9XG5cbiAgICAgICAgT25seSBjb25zaWRlciBwYXRocyBtYXRjaGluZyB0aGUgcmVnZXhwIHdoZW4gY3JlYXRpbmcgcGF0Y2ggZmlsZXMuXG4gICAgICAgIFBhdGhzIGFyZSByZWxhdGl2ZSB0byB0aGUgcm9vdCBkaXIgb2YgdGhlIHBhY2thZ2UgdG8gYmUgcGF0Y2hlZC5cblxuICAgICAgICBEZWZhdWx0ICcuKidcblxuICAgICR7Y2hhbGsuYm9sZChcIi0tY2FzZS1zZW5zaXRpdmUtcGF0aC1maWx0ZXJpbmdcIil9XG5cbiAgICAgICAgTWFrZSByZWdleHBzIHVzZWQgaW4gLS1pbmNsdWRlIG9yIC0tZXhjbHVkZSBmaWx0ZXJzIGNhc2Utc2Vuc2l0aXZlLlxuICAgIFxuICAgICR7Y2hhbGsuYm9sZChcIi0tcGF0Y2gtZGlyXCIpfVxuXG4gICAgICAgIFNwZWNpZnkgdGhlIG5hbWUgZm9yIHRoZSBkaXJlY3RvcnkgaW4gd2hpY2ggdG8gcHV0IHRoZSBwYXRjaCBmaWxlcy5cbmApXG59XG4iXX0=