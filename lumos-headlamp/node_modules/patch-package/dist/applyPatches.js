"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPatch = exports.applyPatchesForApp = void 0;
const chalk_1 = __importDefault(require("chalk"));
const patchFs_1 = require("./patchFs");
const apply_1 = require("./patch/apply");
const fs_extra_1 = require("fs-extra");
const path_1 = require("./path");
const path_2 = require("path");
const PackageDetails_1 = require("./PackageDetails");
const reverse_1 = require("./patch/reverse");
const semver_1 = __importDefault(require("semver"));
const read_1 = require("./patch/read");
const packageIsDevDependency_1 = require("./packageIsDevDependency");
class PatchApplicationError extends Error {
    constructor(msg) {
        super(msg);
    }
}
function findPatchFiles(patchesDirectory) {
    if (!fs_extra_1.existsSync(patchesDirectory)) {
        return [];
    }
    return patchFs_1.getPatchFiles(patchesDirectory);
}
function getInstalledPackageVersion({ appPath, path, pathSpecifier, isDevOnly, patchFilename, }) {
    const packageDir = path_1.join(appPath, path);
    if (!fs_extra_1.existsSync(packageDir)) {
        if (process.env.NODE_ENV === "production" && isDevOnly) {
            return null;
        }
        let err = `${chalk_1.default.red("Error:")} Patch file found for package ${path_2.posix.basename(pathSpecifier)}` + ` which is not present at ${path_1.relative(".", packageDir)}`;
        if (!isDevOnly && process.env.NODE_ENV === "production") {
            err += `

  If this package is a dev dependency, rename the patch file to
  
    ${chalk_1.default.bold(patchFilename.replace(".patch", ".dev.patch"))}
`;
        }
        throw new PatchApplicationError(err);
    }
    const { version } = require(path_1.join(packageDir, "package.json"));
    // normalize version for `npm ci`
    const result = semver_1.default.valid(version);
    if (result === null) {
        throw new PatchApplicationError(`${chalk_1.default.red("Error:")} Version string '${version}' cannot be parsed from ${path_1.join(packageDir, "package.json")}`);
    }
    return result;
}
function applyPatchesForApp({ appPath, reverse, patchDir, shouldExitWithError, shouldExitWithWarning, }) {
    const patchesDirectory = path_1.join(appPath, patchDir);
    const files = findPatchFiles(patchesDirectory);
    if (files.length === 0) {
        console.error(chalk_1.default.blueBright("No patch files found"));
        return;
    }
    const errors = [];
    const warnings = [];
    for (const filename of files) {
        try {
            const packageDetails = PackageDetails_1.getPackageDetailsFromPatchFilename(filename);
            if (!packageDetails) {
                warnings.push(`Unrecognized patch file in patches directory ${filename}`);
                continue;
            }
            const { name, version, path, pathSpecifier, isDevOnly, patchFilename, } = packageDetails;
            const installedPackageVersion = getInstalledPackageVersion({
                appPath,
                path,
                pathSpecifier,
                isDevOnly: isDevOnly ||
                    // check for direct-dependents in prod
                    (process.env.NODE_ENV === "production" &&
                        packageIsDevDependency_1.packageIsDevDependency({ appPath, packageDetails })),
                patchFilename,
            });
            if (!installedPackageVersion) {
                // it's ok we're in production mode and this is a dev only package
                console.log(`Skipping dev-only ${chalk_1.default.bold(pathSpecifier)}@${version} ${chalk_1.default.blue("✔")}`);
                continue;
            }
            if (applyPatch({
                patchFilePath: path_1.resolve(patchesDirectory, filename),
                reverse,
                packageDetails,
                patchDir,
            })) {
                // yay patch was applied successfully
                // print warning if version mismatch
                if (installedPackageVersion !== version) {
                    warnings.push(createVersionMismatchWarning({
                        packageName: name,
                        actualVersion: installedPackageVersion,
                        originalVersion: version,
                        pathSpecifier,
                        path,
                    }));
                }
                console.log(`${chalk_1.default.bold(pathSpecifier)}@${version} ${chalk_1.default.green("✔")}`);
            }
            else if (installedPackageVersion === version) {
                // completely failed to apply patch
                // TODO: propagate useful error messages from patch application
                errors.push(createBrokenPatchFileError({
                    packageName: name,
                    patchFileName: filename,
                    pathSpecifier,
                    path,
                }));
            }
            else {
                errors.push(createPatchApplictionFailureError({
                    packageName: name,
                    actualVersion: installedPackageVersion,
                    originalVersion: version,
                    patchFileName: filename,
                    path,
                    pathSpecifier,
                }));
            }
        }
        catch (error) {
            if (error instanceof PatchApplicationError) {
                errors.push(error.message);
            }
            else {
                errors.push(createUnexpectedError({ filename, error }));
            }
        }
    }
    for (const warning of warnings) {
        console.warn(warning);
    }
    for (const error of errors) {
        console.error(error);
    }
    const problemsSummary = [];
    if (warnings.length) {
        problemsSummary.push(chalk_1.default.yellow(`${warnings.length} warning(s)`));
    }
    if (errors.length) {
        problemsSummary.push(chalk_1.default.red(`${errors.length} error(s)`));
    }
    if (problemsSummary.length) {
        console.error("---");
        console.error("patch-package finished with", problemsSummary.join(", ") + ".");
    }
    if (errors.length && shouldExitWithError) {
        process.exit(1);
    }
    if (warnings.length && shouldExitWithWarning) {
        process.exit(1);
    }
    process.exit(0);
}
exports.applyPatchesForApp = applyPatchesForApp;
function applyPatch({ patchFilePath, reverse, packageDetails, patchDir, }) {
    const patch = read_1.readPatch({ patchFilePath, packageDetails, patchDir });
    try {
        apply_1.executeEffects(reverse ? reverse_1.reversePatch(patch) : patch, { dryRun: false });
    }
    catch (e) {
        try {
            apply_1.executeEffects(reverse ? patch : reverse_1.reversePatch(patch), { dryRun: true });
        }
        catch (e) {
            return false;
        }
    }
    return true;
}
exports.applyPatch = applyPatch;
function createVersionMismatchWarning({ packageName, actualVersion, originalVersion, pathSpecifier, path, }) {
    return `
${chalk_1.default.yellow("Warning:")} patch-package detected a patch file version mismatch

  Don't worry! This is probably fine. The patch was still applied
  successfully. Here's the deets:

  Patch file created for

    ${packageName}@${chalk_1.default.bold(originalVersion)}

  applied to

    ${packageName}@${chalk_1.default.bold(actualVersion)}
  
  At path
  
    ${path}

  This warning is just to give you a heads-up. There is a small chance of
  breakage even though the patch was applied successfully. Make sure the package
  still behaves like you expect (you wrote tests, right?) and then run

    ${chalk_1.default.bold(`patch-package ${pathSpecifier}`)}

  to update the version in the patch file name and make this warning go away.
`;
}
function createBrokenPatchFileError({ packageName, patchFileName, path, pathSpecifier, }) {
    return `
${chalk_1.default.red.bold("**ERROR**")} ${chalk_1.default.red(`Failed to apply patch for package ${chalk_1.default.bold(packageName)} at path`)}
  
    ${path}

  This error was caused because patch-package cannot apply the following patch file:

    patches/${patchFileName}

  Try removing node_modules and trying again. If that doesn't work, maybe there was
  an accidental change made to the patch file? Try recreating it by manually
  editing the appropriate files and running:
  
    patch-package ${pathSpecifier}
  
  If that doesn't work, then it's a bug in patch-package, so please submit a bug
  report. Thanks!

    https://github.com/ds300/patch-package/issues
    
`;
}
function createPatchApplictionFailureError({ packageName, actualVersion, originalVersion, patchFileName, path, pathSpecifier, }) {
    return `
${chalk_1.default.red.bold("**ERROR**")} ${chalk_1.default.red(`Failed to apply patch for package ${chalk_1.default.bold(packageName)} at path`)}
  
    ${path}

  This error was caused because ${chalk_1.default.bold(packageName)} has changed since you
  made the patch file for it. This introduced conflicts with your patch,
  just like a merge conflict in Git when separate incompatible changes are
  made to the same piece of code.

  Maybe this means your patch file is no longer necessary, in which case
  hooray! Just delete it!

  Otherwise, you need to generate a new patch file.

  To generate a new one, just repeat the steps you made to generate the first
  one.

  i.e. manually make the appropriate file changes, then run 

    patch-package ${pathSpecifier}

  Info:
    Patch file: patches/${patchFileName}
    Patch was made for version: ${chalk_1.default.green.bold(originalVersion)}
    Installed version: ${chalk_1.default.red.bold(actualVersion)}
`;
}
function createUnexpectedError({ filename, error, }) {
    return `
${chalk_1.default.red.bold("**ERROR**")} ${chalk_1.default.red(`Failed to apply patch file ${chalk_1.default.bold(filename)}`)}
  
${error.stack}

  `;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHlQYXRjaGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcGx5UGF0Y2hlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBeUI7QUFDekIsdUNBQXlDO0FBQ3pDLHlDQUE4QztBQUM5Qyx1Q0FBcUM7QUFDckMsaUNBQWdEO0FBQ2hELCtCQUE0QjtBQUM1QixxREFHeUI7QUFDekIsNkNBQThDO0FBQzlDLG9EQUEyQjtBQUMzQix1Q0FBd0M7QUFDeEMscUVBQWlFO0FBRWpFLE1BQU0scUJBQXNCLFNBQVEsS0FBSztJQUN2QyxZQUFZLEdBQVc7UUFDckIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ1osQ0FBQztDQUNGO0FBRUQsU0FBUyxjQUFjLENBQUMsZ0JBQXdCO0lBQzlDLElBQUksQ0FBQyxxQkFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7UUFDakMsT0FBTyxFQUFFLENBQUE7S0FDVjtJQUVELE9BQU8sdUJBQWEsQ0FBQyxnQkFBZ0IsQ0FBYSxDQUFBO0FBQ3BELENBQUM7QUFFRCxTQUFTLDBCQUEwQixDQUFDLEVBQ2xDLE9BQU8sRUFDUCxJQUFJLEVBQ0osYUFBYSxFQUNiLFNBQVMsRUFDVCxhQUFhLEdBT2Q7SUFDQyxNQUFNLFVBQVUsR0FBRyxXQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3RDLElBQUksQ0FBQyxxQkFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzNCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxJQUFJLFNBQVMsRUFBRTtZQUN0RCxPQUFPLElBQUksQ0FBQTtTQUNaO1FBRUQsSUFBSSxHQUFHLEdBQ0wsR0FBRyxlQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsWUFBSyxDQUFDLFFBQVEsQ0FDbkUsYUFBYSxDQUNkLEVBQUUsR0FBRyw0QkFBNEIsZUFBUSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMs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LENBQUMsSUFBSSxlQUFLLENBQUMsR0FBRyxDQUN0QyxxQ0FBcUMsZUFBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUN2RTs7TUFFRyxJQUFJOzs7O2NBSUksYUFBYTs7Ozs7O29CQU1QLGFBQWE7Ozs7Ozs7Q0FPaEMsQ0FBQTtBQUNELENBQUM7QUFFRCxTQUFTLGlDQUFpQyxDQUFDLEVBQ3pDLFdBQVcsRUFDWCxhQUFhLEVBQ2IsZUFBZSxFQUNmLGFBQWEsRUFDYixJQUFJLEVBQ0osYUFBYSxHQVFkO0lBQ0MsT0FBTztFQUNQLGVBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLGVBQUssQ0FBQyxHQUFHLENBQ3RDLHFDQUFxQyxlQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQ3ZFOztNQUVHLElBQUk7O2tDQUV3QixlQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O29CQWVyQyxhQUFhOzs7MEJBR1AsYUFBYTtrQ0FDTCxlQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7eUJBQzFDLGVBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztDQUNyRCxDQUFBO0FBQ0QsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsRUFDN0IsUUFBUSxFQUNSLEtBQUssR0FJTjtJQUNDLE9BQU87RUFDUCxlQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxlQUFLLENBQUMsR0FBRyxDQUN0Qyw4QkFBOEIsZUFBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUNyRDs7RUFFRCxLQUFLLENBQUMsS0FBSzs7R0FFVixDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIlxuaW1wb3J0IHsgZ2V0UGF0Y2hGaWxlcyB9IGZyb20gXCIuL3BhdGNoRnNcIlxuaW1wb3J0IHsgZXhlY3V0ZUVmZmVjdHMgfSBmcm9tIFwiLi9wYXRjaC9hcHBseVwiXG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImZzLWV4dHJhXCJcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUsIHJlbGF0aXZlIH0gZnJvbSBcIi4vcGF0aFwiXG5pbXBvcnQgeyBwb3NpeCB9IGZyb20gXCJwYXRoXCJcbmltcG9ydCB7XG4gIGdldFBhY2thZ2VEZXRhaWxzRnJvbVBhdGNoRmlsZW5hbWUsXG4gIFBhY2thZ2VEZXRhaWxzLFxufSBmcm9tIFwiLi9QYWNrYWdlRGV0YWlsc1wiXG5pbXBvcnQgeyByZXZlcnNlUGF0Y2ggfSBmcm9tIFwiLi9wYXRjaC9yZXZlcnNlXCJcbmltcG9ydCBzZW12ZXIgZnJvbSBcInNlbXZlclwiXG5pbXBvcnQgeyByZWFkUGF0Y2ggfSBmcm9tIFwiLi9wYXRjaC9yZWFkXCJcbmltcG9ydCB7IHBhY2thZ2VJc0RldkRlcGVuZGVuY3kgfSBmcm9tIFwiLi9wYWNrYWdlSXNEZXZEZXBlbmRlbmN5XCJcblxuY2xhc3MgUGF0Y2hBcHBsaWNhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihtc2c6IHN0cmluZykge1xuICAgIHN1cGVyKG1zZylcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kUGF0Y2hGaWxlcyhwYXRjaGVzRGlyZWN0b3J5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGlmICghZXhpc3RzU3luYyhwYXRjaGVzRGlyZWN0b3J5KSkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgcmV0dXJuIGdldFBhdGNoRmlsZXMocGF0Y2hlc0RpcmVjdG9yeSkgYXMgc3RyaW5nW11cbn1cblxuZnVuY3Rpb24gZ2V0SW5zdGFsbGVkUGFja2FnZVZlcnNpb24oe1xuICBhcHBQYXRoLFxuICBwYXRoLFxuICBwYXRoU3BlY2lmaWVyLFxuICBpc0Rldk9ubHksXG4gIHBhdGNoRmlsZW5hbWUsXG59OiB7XG4gIGFwcFBhdGg6IHN0cmluZ1xuICBwYXRoOiBzdHJpbmdcbiAgcGF0aFNwZWNpZmllcjogc3RyaW5nXG4gIGlzRGV2T25seTogYm9vbGVhblxuICBwYXRjaEZpbGVuYW1lOiBzdHJpbmdcbn0pOiBudWxsIHwgc3RyaW5nIHtcbiAgY29uc3QgcGFja2FnZURpciA9IGpvaW4oYXBwUGF0aCwgcGF0aClcbiAgaWYgKCFleGlzdHNTeW5jKHBhY2thZ2VEaXIpKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIiAmJiBpc0Rldk9ubHkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgbGV0IGVyciA9XG4gICAgICBgJHtjaGFsay5yZWQoXCJFcnJvcjpcIil9IFBhdGNoIGZpbGUgZm91bmQgZm9yIHBhY2thZ2UgJHtwb3NpeC5iYXNlbmFtZShcbiAgICAgICAgcGF0aFNwZWNpZmllcixcbiAgICAgICl9YCArIGAgd2hpY2ggaXMgbm90IHByZXNlbnQgYXQgJHtyZWxhdGl2ZShcIi5cIiwgcGFja2FnZURpcil9YFxuXG4gICAgaWYgKCFpc0Rldk9ubHkgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICBlcnIgKz0gYFxuXG4gIElmIHRoaXMgcGFja2FnZSBpcyBhIGRldiBkZXBlbmRlbmN5LCByZW5hbWUgdGhlIHBhdGNoIGZpbGUgdG9cbiAgXG4gICAgJHtjaGFsay5ib2xkKHBhdGNoRmlsZW5hbWUucmVwbGFjZShcIi5wYXRjaFwiLCBcIi5kZXYucGF0Y2hcIikpfVxuYFxuICAgIH1cbiAgICB0aHJvdyBuZXcgUGF0Y2hBcHBsaWNhdGlvbkVycm9yKGVycilcbiAgfVxuXG4gIGNvbnN0IHsgdmVyc2lvbiB9ID0gcmVxdWlyZShqb2luKHBhY2thZ2VEaXIsIFwicGFja2FnZS5qc29uXCIpKVxuICAvLyBub3JtYWxpemUgdmVyc2lvbiBmb3IgYG5wbSBjaWBcbiAgY29uc3QgcmVzdWx0ID0gc2VtdmVyLnZhbGlkKHZlcnNpb24pXG4gIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgUGF0Y2hBcHBsaWNhdGlvbkVycm9yKFxuICAgICAgYCR7Y2hhbGsucmVkKFxuICAgICAgICBcIkVycm9yOlwiLFxuICAgICAgKX0gVmVyc2lvbiBzdHJpbmcgJyR7dmVyc2lvbn0nIGNhbm5vdCBiZSBwYXJzZWQgZnJvbSAke2pvaW4oXG4gICAgICAgIHBhY2thZ2VEaXIsXG4gICAgICAgIFwicGFja2FnZS5qc29uXCIsXG4gICAgICApfWAsXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdCBhcyBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0Y2hlc0ZvckFwcCh7XG4gIGFwcFBhdGgsXG4gIHJldmVyc2UsXG4gIHBhdGNoRGlyLFxuICBzaG91bGRFeGl0V2l0aEVycm9yLFxuICBzaG91bGRFeGl0V2l0aFdhcm5pbmcsXG59OiB7XG4gIGFwcFBhdGg6IHN0cmluZ1xuICByZXZlcnNlOiBib29sZWFuXG4gIHBhdGNoRGlyOiBzdHJpbmdcbiAgc2hvdWxkRXhpdFdpdGhFcnJvcjogYm9vbGVhblxuICBzaG91bGRFeGl0V2l0aFdhcm5pbmc6IGJvb2xlYW5cbn0pOiB2b2lkIHtcbiAgY29uc3QgcGF0Y2hlc0RpcmVjdG9yeSA9IGpvaW4oYXBwUGF0aCwgcGF0Y2hEaXIpXG4gIGNvbnN0IGZpbGVzID0gZmluZFBhdGNoRmlsZXMocGF0Y2hlc0RpcmVjdG9yeSlcblxuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS5lcnJvcihjaGFsay5ibHVlQnJpZ2h0KFwiTm8gcGF0Y2ggZmlsZXMgZm91bmRcIikpXG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW11cbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW11cblxuICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhY2thZ2VEZXRhaWxzID0gZ2V0UGFja2FnZURldGFpbHNGcm9tUGF0Y2hGaWxlbmFtZShmaWxlbmFtZSlcblxuICAgICAgaWYgKCFwYWNrYWdlRGV0YWlscykge1xuICAgICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICAgIGBVbnJlY29nbml6ZWQgcGF0Y2ggZmlsZSBpbiBwYXRjaGVzIGRpcmVjdG9yeSAke2ZpbGVuYW1lfWAsXG4gICAgICAgIClcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBuYW1lLFxuICAgICAgICB2ZXJzaW9uLFxuICAgICAgICBwYXRoLFxuICAgICAgICBwYXRoU3BlY2lmaWVyLFxuICAgICAgICBpc0Rldk9ubHksXG4gICAgICAgIHBhdGNoRmlsZW5hbWUsXG4gICAgICB9ID0gcGFja2FnZURldGFpbHNcblxuICAgICAgY29uc3QgaW5zdGFsbGVkUGFja2FnZVZlcnNpb24gPSBnZXRJbnN0YWxsZWRQYWNrYWdlVmVyc2lvbih7XG4gICAgICAgIGFwcFBhdGgsXG4gICAgICAgIHBhdGgsXG4gICAgICAgIHBhdGhTcGVjaWZpZXIsXG4gICAgICAgIGlzRGV2T25seTpcbiAgICAgICAgICBpc0Rldk9ubHkgfHxcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZGlyZWN0LWRlcGVuZGVudHMgaW4gcHJvZFxuICAgICAgICAgIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCIgJiZcbiAgICAgICAgICAgIHBhY2thZ2VJc0RldkRlcGVuZGVuY3koeyBhcHBQYXRoLCBwYWNrYWdlRGV0YWlscyB9KSksXG4gICAgICAgIHBhdGNoRmlsZW5hbWUsXG4gICAgICB9KVxuICAgICAgaWYgKCFpbnN0YWxsZWRQYWNrYWdlVmVyc2lvbikge1xuICAgICAgICAvLyBpdCdzIG9rIHdlJ3JlIGluIHByb2R1Y3Rpb24gbW9kZSBhbmQgdGhpcyBpcyBhIGRldiBvbmx5IHBhY2thZ2VcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYFNraXBwaW5nIGRldi1vbmx5ICR7Y2hhbGsuYm9sZChcbiAgICAgICAgICAgIHBhdGhTcGVjaWZpZXIsXG4gICAgICAgICAgKX1AJHt2ZXJzaW9ufSAke2NoYWxrLmJsdWUoXCLinJRcIil9YCxcbiAgICAgICAgKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGFwcGx5UGF0Y2goe1xuICAgICAgICAgIHBhdGNoRmlsZVBhdGg6IHJlc29sdmUocGF0Y2hlc0RpcmVjdG9yeSwgZmlsZW5hbWUpIGFzIHN0cmluZyxcbiAgICAgICAgICByZXZlcnNlLFxuICAgICAgICAgIHBhY2thZ2VEZXRhaWxzLFxuICAgICAgICAgIHBhdGNoRGlyLFxuICAgICAgICB9KVxuICAgICAgKSB7XG4gICAgICAgIC8vIHlheSBwYXRjaCB3YXMgYXBwbGllZCBzdWNjZXNzZnVsbHlcbiAgICAgICAgLy8gcHJpbnQgd2FybmluZyBpZiB2ZXJzaW9uIG1pc21hdGNoXG4gICAgICAgIGlmIChpbnN0YWxsZWRQYWNrYWdlVmVyc2lvbiAhPT0gdmVyc2lvbikge1xuICAgICAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgICAgICBjcmVhdGVWZXJzaW9uTWlzbWF0Y2hXYXJuaW5nKHtcbiAgICAgICAgICAgICAgcGFja2FnZU5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgIGFjdHVhbFZlcnNpb246IGluc3RhbGxlZFBhY2thZ2VWZXJzaW9uLFxuICAgICAgICAgICAgICBvcmlnaW5hbFZlcnNpb246IHZlcnNpb24sXG4gICAgICAgICAgICAgIHBhdGhTcGVjaWZpZXIsXG4gICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYCR7Y2hhbGsuYm9sZChwYXRoU3BlY2lmaWVyKX1AJHt2ZXJzaW9ufSAke2NoYWxrLmdyZWVuKFwi4pyUXCIpfWAsXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSBpZiAoaW5zdGFsbGVkUGFja2FnZVZlcnNpb24gPT09IHZlcnNpb24pIHtcbiAgICAgICAgLy8gY29tcGxldGVseSBmYWlsZWQgdG8gYXBwbHkgcGF0Y2hcbiAgICAgICAgLy8gVE9ETzogcHJvcGFnYXRlIHVzZWZ1bCBlcnJvciBtZXNzYWdlcyBmcm9tIHBhdGNoIGFwcGxpY2F0aW9uXG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgIGNyZWF0ZUJyb2tlblBhdGNoRmlsZUVycm9yKHtcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lOiBuYW1lLFxuICAgICAgICAgICAgcGF0Y2hGaWxlTmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBwYXRoU3BlY2lmaWVyLFxuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgY3JlYXRlUGF0Y2hBcHBsaWN0aW9uRmFpbHVyZUVycm9yKHtcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lOiBuYW1lLFxuICAgICAgICAgICAgYWN0dWFsVmVyc2lvbjogaW5zdGFsbGVkUGFja2FnZVZlcnNpb24sXG4gICAgICAgICAgICBvcmlnaW5hbFZlcnNpb246IHZlcnNpb24sXG4gICAgICAgICAgICBwYXRjaEZpbGVOYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICBwYXRoU3BlY2lmaWVyLFxuICAgICAgICAgIH0pLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFBhdGNoQXBwbGljYXRpb25FcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnJvci5tZXNzYWdlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLnB1c2goY3JlYXRlVW5leHBlY3RlZEVycm9yKHsgZmlsZW5hbWUsIGVycm9yIH0pKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qgd2FybmluZyBvZiB3YXJuaW5ncykge1xuICAgIGNvbnNvbGUud2Fybih3YXJuaW5nKVxuICB9XG4gIGZvciAoY29uc3QgZXJyb3Igb2YgZXJyb3JzKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgfVxuXG4gIGNvbnN0IHByb2JsZW1zU3VtbWFyeSA9IFtdXG4gIGlmICh3YXJuaW5ncy5sZW5ndGgpIHtcbiAgICBwcm9ibGVtc1N1bW1hcnkucHVzaChjaGFsay55ZWxsb3coYCR7d2FybmluZ3MubGVuZ3RofSB3YXJuaW5nKHMpYCkpXG4gIH1cbiAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICBwcm9ibGVtc1N1bW1hcnkucHVzaChjaGFsay5yZWQoYCR7ZXJyb3JzLmxlbmd0aH0gZXJyb3IocylgKSlcbiAgfVxuXG4gIGlmIChwcm9ibGVtc1N1bW1hcnkubGVuZ3RoKSB7XG4gICAgY29uc29sZS5lcnJvcihcIi0tLVwiKVxuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICBcInBhdGNoLXBhY2thZ2UgZmluaXNoZWQgd2l0aFwiLFxuICAgICAgcHJvYmxlbXNTdW1tYXJ5LmpvaW4oXCIsIFwiKSArIFwiLlwiLFxuICAgIClcbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoICYmIHNob3VsZEV4aXRXaXRoRXJyb3IpIHtcbiAgICBwcm9jZXNzLmV4aXQoMSlcbiAgfVxuXG4gIGlmICh3YXJuaW5ncy5sZW5ndGggJiYgc2hvdWxkRXhpdFdpdGhXYXJuaW5nKSB7XG4gICAgcHJvY2Vzcy5leGl0KDEpXG4gIH1cblxuICBwcm9jZXNzLmV4aXQoMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0Y2goe1xuICBwYXRjaEZpbGVQYXRoLFxuICByZXZlcnNlLFxuICBwYWNrYWdlRGV0YWlscyxcbiAgcGF0Y2hEaXIsXG59OiB7XG4gIHBhdGNoRmlsZVBhdGg6IHN0cmluZ1xuICByZXZlcnNlOiBib29sZWFuXG4gIHBhY2thZ2VEZXRhaWxzOiBQYWNrYWdlRGV0YWlsc1xuICBwYXRjaERpcjogc3RyaW5nXG59KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhdGNoID0gcmVhZFBhdGNoKHsgcGF0Y2hGaWxlUGF0aCwgcGFja2FnZURldGFpbHMsIHBhdGNoRGlyIH0pXG4gIHRyeSB7XG4gICAgZXhlY3V0ZUVmZmVjdHMocmV2ZXJzZSA/IHJldmVyc2VQYXRjaChwYXRjaCkgOiBwYXRjaCwgeyBkcnlSdW46IGZhbHNlIH0pXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0cnkge1xuICAgICAgZXhlY3V0ZUVmZmVjdHMocmV2ZXJzZSA/IHBhdGNoIDogcmV2ZXJzZVBhdGNoKHBhdGNoKSwgeyBkcnlSdW46IHRydWUgfSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBjcmVhdGVWZXJzaW9uTWlzbWF0Y2hXYXJuaW5nKHtcbiAgcGFja2FnZU5hbWUsXG4gIGFjdHVhbFZlcnNpb24sXG4gIG9yaWdpbmFsVmVyc2lvbixcbiAgcGF0aFNwZWNpZmllcixcbiAgcGF0aCxcbn06IHtcbiAgcGFja2FnZU5hbWU6IHN0cmluZ1xuICBhY3R1YWxWZXJzaW9uOiBzdHJpbmdcbiAgb3JpZ2luYWxWZXJzaW9uOiBzdHJpbmdcbiAgcGF0aFNwZWNpZmllcjogc3RyaW5nXG4gIHBhdGg6IHN0cmluZ1xufSkge1xuICByZXR1cm4gYFxuJHtjaGFsay55ZWxsb3coXCJXYXJuaW5nOlwiKX0gcGF0Y2gtcGFja2FnZSBkZXRlY3RlZCBhIHBhdGNoIGZpbGUgdmVyc2lvbiBtaXNtYXRjaFxuXG4gIERvbid0IHdvcnJ5ISBUaGlzIGlzIHByb2JhYmx5IGZpbmUuIFRoZSBwYXRjaCB3YXMgc3RpbGwgYXBwbGllZFxuICBzdWNjZXNzZnVsbHkuIEhlcmUncyB0aGUgZGVldHM6XG5cbiAgUGF0Y2ggZmlsZSBjcmVhdGVkIGZvclxuXG4gICAgJHtwYWNrYWdlTmFtZX1AJHtjaGFsay5ib2xkKG9yaWdpbmFsVmVyc2lvbil9XG5cbiAgYXBwbGllZCB0b1xuXG4gICAgJHtwYWNrYWdlTmFtZX1AJHtjaGFsay5ib2xkKGFjdHVhbFZlcnNpb24pfVxuICBcbiAgQXQgcGF0aFxuICBcbiAgICAke3BhdGh9XG5cbiAgVGhpcyB3YXJuaW5nIGlzIGp1c3QgdG8gZ2l2ZSB5b3UgYSBoZWFkcy11cC4gVGhlcmUgaXMgYSBzbWFsbCBjaGFuY2Ugb2ZcbiAgYnJlYWthZ2UgZXZlbiB0aG91Z2ggdGhlIHBhdGNoIHdhcyBhcHBsaWVkIHN1Y2Nlc3NmdWxseS4gTWFrZSBzdXJlIHRoZSBwYWNrYWdlXG4gIHN0aWxsIGJlaGF2ZXMgbGlrZSB5b3UgZXhwZWN0ICh5b3Ugd3JvdGUgdGVzdHMsIHJpZ2h0PykgYW5kIHRoZW4gcnVuXG5cbiAgICAke2NoYWxrLmJvbGQoYHBhdGNoLXBhY2thZ2UgJHtwYXRoU3BlY2lmaWVyfWApfVxuXG4gIHRvIHVwZGF0ZSB0aGUgdmVyc2lvbiBpbiB0aGUgcGF0Y2ggZmlsZSBuYW1lIGFuZCBtYWtlIHRoaXMgd2FybmluZyBnbyBhd2F5LlxuYFxufVxuXG5mdW5jdGlvbiBjcmVhdGVCcm9rZW5QYXRjaEZpbGVFcnJvcih7XG4gIHBhY2thZ2VOYW1lLFxuICBwYXRjaEZpbGVOYW1lLFxuICBwYXRoLFxuICBwYXRoU3BlY2lmaWVyLFxufToge1xuICBwYWNrYWdlTmFtZTogc3RyaW5nXG4gIHBhdGNoRmlsZU5hbWU6IHN0cmluZ1xuICBwYXRoOiBzdHJpbmdcbiAgcGF0aFNwZWNpZmllcjogc3RyaW5nXG59KSB7XG4gIHJldHVybiBgXG4ke2NoYWxrLnJlZC5ib2xkKFwiKipFUlJPUioqXCIpfSAke2NoYWxrLnJlZChcbiAgICBgRmFpbGVkIHRvIGFwcGx5IHBhdGNoIGZvciBwYWNrYWdlICR7Y2hhbGsuYm9sZChwYWNrYWdlTmFtZSl9IGF0IHBhdGhgLFxuICApfVxuICBcbiAgICAke3BhdGh9XG5cbiAgVGhpcyBlcnJvciB3YXMgY2F1c2VkIGJlY2F1c2UgcGF0Y2gtcGFja2FnZSBjYW5ub3QgYXBwbHkgdGhlIGZvbGxvd2luZyBwYXRjaCBmaWxlOlxuXG4gICAgcGF0Y2hlcy8ke3BhdGNoRmlsZU5hbWV9XG5cbiAgVHJ5IHJlbW92aW5nIG5vZGVfbW9kdWxlcyBhbmQgdHJ5aW5nIGFnYWluLiBJZiB0aGF0IGRvZXNuJ3Qgd29yaywgbWF5YmUgdGhlcmUgd2FzXG4gIGFuIGFjY2lkZW50YWwgY2hhbmdlIG1hZGUgdG8gdGhlIHBhdGNoIGZpbGU/IFRyeSByZWNyZWF0aW5nIGl0IGJ5IG1hbnVhbGx5XG4gIGVkaXRpbmcgdGhlIGFwcHJvcHJpYXRlIGZpbGVzIGFuZCBydW5uaW5nOlxuICBcbiAgICBwYXRjaC1wYWNrYWdlICR7cGF0aFNwZWNpZmllcn1cbiAgXG4gIElmIHRoYXQgZG9lc24ndCB3b3JrLCB0aGVuIGl0J3MgYSBidWcgaW4gcGF0Y2gtcGFja2FnZSwgc28gcGxlYXNlIHN1Ym1pdCBhIGJ1Z1xuICByZXBvcnQuIFRoYW5rcyFcblxuICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9kczMwMC9wYXRjaC1wYWNrYWdlL2lzc3Vlc1xuICAgIFxuYFxufVxuXG5mdW5jdGlvbiBjcmVhdGVQYXRjaEFwcGxpY3Rpb25GYWlsdXJlRXJyb3Ioe1xuICBwYWNrYWdlTmFtZSxcbiAgYWN0dWFsVmVyc2lvbixcbiAgb3JpZ2luYWxWZXJzaW9uLFxuICBwYXRjaEZpbGVOYW1lLFxuICBwYXRoLFxuICBwYXRoU3BlY2lmaWVyLFxufToge1xuICBwYWNrYWdlTmFtZTogc3RyaW5nXG4gIGFjdHVhbFZlcnNpb246IHN0cmluZ1xuICBvcmlnaW5hbFZlcnNpb246IHN0cmluZ1xuICBwYXRjaEZpbGVOYW1lOiBzdHJpbmdcbiAgcGF0aDogc3RyaW5nXG4gIHBhdGhTcGVjaWZpZXI6IHN0cmluZ1xufSkge1xuICByZXR1cm4gYFxuJHtjaGFsay5yZWQuYm9sZChcIioqRVJST1IqKlwiKX0gJHtjaGFsay5yZWQoXG4gICAgYEZhaWxlZCB0byBhcHBseSBwYXRjaCBmb3IgcGFja2FnZSAke2NoYWxrLmJvbGQocGFja2FnZU5hbWUpfSBhdCBwYXRoYCxcbiAgKX1cbiAgXG4gICAgJHtwYXRofVxuXG4gIFRoaXMgZXJyb3Igd2FzIGNhdXNlZCBiZWNhdXNlICR7Y2hhbGsuYm9sZChwYWNrYWdlTmFtZSl9IGhhcyBjaGFuZ2VkIHNpbmNlIHlvdVxuICBtYWRlIHRoZSBwYXRjaCBmaWxlIGZvciBpdC4gVGhpcyBpbnRyb2R1Y2VkIGNvbmZsaWN0cyB3aXRoIHlvdXIgcGF0Y2gsXG4gIGp1c3QgbGlrZSBhIG1lcmdlIGNvbmZsaWN0IGluIEdpdCB3aGVuIHNlcGFyYXRlIGluY29tcGF0aWJsZSBjaGFuZ2VzIGFyZVxuICBtYWRlIHRvIHRoZSBzYW1lIHBpZWNlIG9mIGNvZGUuXG5cbiAgTWF5YmUgdGhpcyBtZWFucyB5b3VyIHBhdGNoIGZpbGUgaXMgbm8gbG9uZ2VyIG5lY2Vzc2FyeSwgaW4gd2hpY2ggY2FzZVxuICBob29yYXkhIEp1c3QgZGVsZXRlIGl0IVxuXG4gIE90aGVyd2lzZSwgeW91IG5lZWQgdG8gZ2VuZXJhdGUgYSBuZXcgcGF0Y2ggZmlsZS5cblxuICBUbyBnZW5lcmF0ZSBhIG5ldyBvbmUsIGp1c3QgcmVwZWF0IHRoZSBzdGVwcyB5b3UgbWFkZSB0byBnZW5lcmF0ZSB0aGUgZmlyc3RcbiAgb25lLlxuXG4gIGkuZS4gbWFudWFsbHkgbWFrZSB0aGUgYXBwcm9wcmlhdGUgZmlsZSBjaGFuZ2VzLCB0aGVuIHJ1biBcblxuICAgIHBhdGNoLXBhY2thZ2UgJHtwYXRoU3BlY2lmaWVyfVxuXG4gIEluZm86XG4gICAgUGF0Y2ggZmlsZTogcGF0Y2hlcy8ke3BhdGNoRmlsZU5hbWV9XG4gICAgUGF0Y2ggd2FzIG1hZGUgZm9yIHZlcnNpb246ICR7Y2hhbGsuZ3JlZW4uYm9sZChvcmlnaW5hbFZlcnNpb24pfVxuICAgIEluc3RhbGxlZCB2ZXJzaW9uOiAke2NoYWxrLnJlZC5ib2xkKGFjdHVhbFZlcnNpb24pfVxuYFxufVxuXG5mdW5jdGlvbiBjcmVhdGVVbmV4cGVjdGVkRXJyb3Ioe1xuICBmaWxlbmFtZSxcbiAgZXJyb3IsXG59OiB7XG4gIGZpbGVuYW1lOiBzdHJpbmdcbiAgZXJyb3I6IEVycm9yXG59KSB7XG4gIHJldHVybiBgXG4ke2NoYWxrLnJlZC5ib2xkKFwiKipFUlJPUioqXCIpfSAke2NoYWxrLnJlZChcbiAgICBgRmFpbGVkIHRvIGFwcGx5IHBhdGNoIGZpbGUgJHtjaGFsay5ib2xkKGZpbGVuYW1lKX1gLFxuICApfVxuICBcbiR7ZXJyb3Iuc3RhY2t9XG5cbiAgYFxufVxuIl19