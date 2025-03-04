"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePatch = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("./path");
const spawnSafe_1 = require("./spawnSafe");
const filterFiles_1 = require("./filterFiles");
const fs_extra_1 = require("fs-extra");
const rimraf_1 = require("rimraf");
const fs_extra_2 = require("fs-extra");
const tmp_1 = require("tmp");
const patchFs_1 = require("./patchFs");
const PackageDetails_1 = require("./PackageDetails");
const resolveRelativeFileDependencies_1 = require("./resolveRelativeFileDependencies");
const getPackageResolution_1 = require("./getPackageResolution");
const parse_1 = require("./patch/parse");
const zlib_1 = require("zlib");
const getPackageVersion_1 = require("./getPackageVersion");
const createIssue_1 = require("./createIssue");
function printNoPackageFoundError(packageName, packageJsonPath) {
    console.error(`No such package ${packageName}

  File not found: ${packageJsonPath}`);
}
function makePatch({ packagePathSpecifier, appPath, packageManager, includePaths, excludePaths, patchDir, createIssue, }) {
    const packageDetails = PackageDetails_1.getPatchDetailsFromCliString(packagePathSpecifier);
    if (!packageDetails) {
        console.error("No such package", packagePathSpecifier);
        return;
    }
    const appPackageJson = require(path_1.join(appPath, "package.json"));
    const packagePath = path_1.join(appPath, packageDetails.path);
    const packageJsonPath = path_1.join(packagePath, "package.json");
    if (!fs_extra_1.existsSync(packageJsonPath)) {
        printNoPackageFoundError(packagePathSpecifier, packageJsonPath);
        process.exit(1);
    }
    const tmpRepo = tmp_1.dirSync({ unsafeCleanup: true });
    const tmpRepoPackagePath = path_1.join(tmpRepo.name, packageDetails.path);
    const tmpRepoNpmRoot = tmpRepoPackagePath.slice(0, -`/node_modules/${packageDetails.name}`.length);
    const tmpRepoPackageJsonPath = path_1.join(tmpRepoNpmRoot, "package.json");
    try {
        const patchesDir = path_1.resolve(path_1.join(appPath, patchDir));
        console.info(chalk_1.default.grey("•"), "Creating temporary folder");
        // make a blank package.json
        fs_extra_1.mkdirpSync(tmpRepoNpmRoot);
        fs_extra_1.writeFileSync(tmpRepoPackageJsonPath, JSON.stringify({
            dependencies: {
                [packageDetails.name]: getPackageResolution_1.getPackageResolution({
                    packageDetails,
                    packageManager,
                    appPath,
                }),
            },
            resolutions: resolveRelativeFileDependencies_1.resolveRelativeFileDependencies(appPath, appPackageJson.resolutions || {}),
        }));
        const packageVersion = getPackageVersion_1.getPackageVersion(path_1.join(path_1.resolve(packageDetails.path), "package.json"));
        [".npmrc", ".yarnrc", ".yarn"].forEach((rcFile) => {
            const rcPath = path_1.join(appPath, rcFile);
            if (fs_extra_1.existsSync(rcPath)) {
                fs_extra_2.copySync(rcPath, path_1.join(tmpRepo.name, rcFile), { dereference: true });
            }
        });
        if (packageManager === "yarn") {
            console.info(chalk_1.default.grey("•"), `Installing ${packageDetails.name}@${packageVersion} with yarn`);
            try {
                // try first without ignoring scripts in case they are required
                // this works in 99.99% of cases
                spawnSafe_1.spawnSafeSync(`yarn`, ["install", "--ignore-engines"], {
                    cwd: tmpRepoNpmRoot,
                    logStdErrOnError: false,
                });
            }
            catch (e) {
                // try again while ignoring scripts in case the script depends on
                // an implicit context which we havn't reproduced
                spawnSafe_1.spawnSafeSync(`yarn`, ["install", "--ignore-engines", "--ignore-scripts"], {
                    cwd: tmpRepoNpmRoot,
                });
            }
        }
        else {
            console.info(chalk_1.default.grey("•"), `Installing ${packageDetails.name}@${packageVersion} with npm`);
            try {
                // try first without ignoring scripts in case they are required
                // this works in 99.99% of cases
                spawnSafe_1.spawnSafeSync(`npm`, ["i", "--force"], {
                    cwd: tmpRepoNpmRoot,
                    logStdErrOnError: false,
                    stdio: "ignore",
                });
            }
            catch (e) {
                // try again while ignoring scripts in case the script depends on
                // an implicit context which we havn't reproduced
                spawnSafe_1.spawnSafeSync(`npm`, ["i", "--ignore-scripts", "--force"], {
                    cwd: tmpRepoNpmRoot,
                    stdio: "ignore",
                });
            }
        }
        const git = (...args) => spawnSafe_1.spawnSafeSync("git", args, {
            cwd: tmpRepo.name,
            env: Object.assign(Object.assign({}, process.env), { HOME: tmpRepo.name }),
            maxBuffer: 1024 * 1024 * 100,
        });
        // remove nested node_modules just to be safe
        rimraf_1.sync(path_1.join(tmpRepoPackagePath, "node_modules"));
        // remove .git just to be safe
        rimraf_1.sync(path_1.join(tmpRepoPackagePath, ".git"));
        // commit the package
        console.info(chalk_1.default.grey("•"), "Diffing your files with clean files");
        fs_extra_1.writeFileSync(path_1.join(tmpRepo.name, ".gitignore"), "!/node_modules\n\n");
        git("init");
        git("config", "--local", "user.name", "patch-package");
        git("config", "--local", "user.email", "patch@pack.age");
        // remove ignored files first
        filterFiles_1.removeIgnoredFiles(tmpRepoPackagePath, includePaths, excludePaths);
        git("add", "-f", packageDetails.path);
        git("commit", "--allow-empty", "-m", "init");
        // replace package with user's version
        rimraf_1.sync(tmpRepoPackagePath);
        // pnpm installs packages as symlinks, copySync would copy only the symlink
        fs_extra_2.copySync(fs_extra_1.realpathSync(packagePath), tmpRepoPackagePath);
        // remove nested node_modules just to be safe
        rimraf_1.sync(path_1.join(tmpRepoPackagePath, "node_modules"));
        // remove .git just to be safe
        rimraf_1.sync(path_1.join(tmpRepoPackagePath, ".git"));
        // also remove ignored files like before
        filterFiles_1.removeIgnoredFiles(tmpRepoPackagePath, includePaths, excludePaths);
        // stage all files
        git("add", "-f", packageDetails.path);
        // get diff of changes
        const diffResult = git("diff", "--cached", "--no-color", "--ignore-space-at-eol", "--no-ext-diff", "--src-prefix=a/", "--dst-prefix=b/");
        if (diffResult.stdout.length === 0) {
            console.warn(`⁉️  Not creating patch file for package '${packagePathSpecifier}'`);
            console.warn(`⁉️  There don't appear to be any changes.`);
            process.exit(1);
            return;
        }
        try {
            parse_1.parsePatchFile(diffResult.stdout.toString());
        }
        catch (e) {
            if (e.message.includes("Unexpected file mode string: 120000")) {
                console.error(`
⛔️ ${chalk_1.default.red.bold("ERROR")}

  Your changes involve creating symlinks. patch-package does not yet support
  symlinks.
  
  ️Please use ${chalk_1.default.bold("--include")} and/or ${chalk_1.default.bold("--exclude")} to narrow the scope of your patch if
  this was unintentional.
`);
            }
            else {
                const outPath = "./patch-package-error.json.gz";
                fs_extra_1.writeFileSync(outPath, zlib_1.gzipSync(JSON.stringify({
                    error: { message: e.message, stack: e.stack },
                    patch: diffResult.stdout.toString(),
                })));
                console.error(`
⛔️ ${chalk_1.default.red.bold("ERROR")}
        
  patch-package was unable to read the patch-file made by git. This should not
  happen.
  
  A diagnostic file was written to
  
    ${outPath}
  
  Please attach it to a github issue
  
    https://github.com/ds300/patch-package/issues/new?title=New+patch+parse+failed&body=Please+attach+the+diagnostic+file+by+dragging+it+into+here+🙏
  
  Note that this diagnostic file will contain code from the package you were
  attempting to patch.

`);
            }
            process.exit(1);
            return;
        }
        // maybe delete existing
        patchFs_1.getPatchFiles(patchDir).forEach((filename) => {
            const deets = PackageDetails_1.getPackageDetailsFromPatchFilename(filename);
            if (deets && deets.path === packageDetails.path) {
                fs_extra_1.unlinkSync(path_1.join(patchDir, filename));
            }
        });
        const patchFileName = createPatchFileName({
            packageDetails,
            packageVersion,
        });
        const patchPath = path_1.join(patchesDir, patchFileName);
        if (!fs_extra_1.existsSync(path_1.dirname(patchPath))) {
            // scoped package
            fs_extra_1.mkdirSync(path_1.dirname(patchPath));
        }
        fs_extra_1.writeFileSync(patchPath, diffResult.stdout);
        console.log(`${chalk_1.default.green("✔")} Created file ${path_1.join(patchDir, patchFileName)}\n`);
        if (createIssue) {
            createIssue_1.openIssueCreationLink({
                packageDetails,
                patchFileContents: diffResult.stdout.toString(),
                packageVersion,
            });
        }
        else {
            createIssue_1.maybePrintIssueCreationPrompt(packageDetails, packageManager);
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
    finally {
        tmpRepo.removeCallback();
    }
}
exports.makePatch = makePatch;
function createPatchFileName({ packageDetails, packageVersion, }) {
    const packageNames = packageDetails.packageNames
        .map((name) => name.replace(/\//g, "+"))
        .join("++");
    return `${packageNames}+${packageVersion}.patch`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZVBhdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21ha2VQYXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBeUI7QUFDekIsaUNBQStDO0FBQy9DLDJDQUEyQztBQUUzQywrQ0FBa0Q7QUFDbEQsdUNBT2lCO0FBQ2pCLG1DQUF1QztBQUN2Qyx1Q0FBbUM7QUFDbkMsNkJBQTZCO0FBQzdCLHVDQUF5QztBQUN6QyxxREFJeUI7QUFDekIsdUZBQW1GO0FBQ25GLGlFQUE2RDtBQUM3RCx5Q0FBOEM7QUFDOUMsK0JBQStCO0FBQy9CLDJEQUF1RDtBQUN2RCwrQ0FHc0I7QUFFdEIsU0FBUyx3QkFBd0IsQ0FDL0IsV0FBbUIsRUFDbkIsZUFBdUI7SUFFdkIsT0FBTyxDQUFDLEtBQUssQ0FDWCxtQkFBbUIsV0FBVzs7b0JBRWQsZUFBZSxFQUFFLENBQ2xDLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLEVBQ3hCLG9CQUFvQixFQUNwQixPQUFPLEVBQ1AsY0FBYyxFQUNkLFlBQVksRUFDWixZQUFZLEVBQ1osUUFBUSxFQUNSLFdBQVcsR0FTWjtJQUNDLE1BQU0sY0FBYyxHQUFHLDZDQUE0QixDQUFDLG9CQUFvQixDQUFDLENBQUE7SUFFekUsSUFBSSxDQUFDLGNBQWMsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLG9CQUFvQixDQUFDLENBQUE7UUFDdEQsT0FBTTtLQUNQO0lBQ0QsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLFdBQUksQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQTtJQUM3RCxNQUFNLFdBQVcsR0FBRyxXQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN0RCxNQUFNLGVBQWUsR0FBRyxXQUFJLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBRXpELElBQUksQ0FBQyxxQkFBVSxD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QTtTQUNIO2FBQU07WUFDTCwyQ0FBNkIsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUE7U0FDOUQ7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNoQixNQUFNLENBQUMsQ0FBQTtLQUNSO1lBQVM7UUFDUixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUE7S0FDekI7QUFDSCxDQUFDO0FBblJELDhCQW1SQztBQUVELFNBQVMsbUJBQW1CLENBQUMsRUFDM0IsY0FBYyxFQUNkLGNBQWMsR0FJZjtJQUNDLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxZQUFZO1NBQzdDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRWIsT0FBTyxHQUFHLFlBQVksSUFBSSxjQUFjLFFBQVEsQ0FBQTtBQUNsRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiXG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSBcIi4vcGF0aFwiXG5pbXBvcnQgeyBzcGF3blNhZmVTeW5jIH0gZnJvbSBcIi4vc3Bhd25TYWZlXCJcbmltcG9ydCB7IFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSBcIi4vZGV0ZWN0UGFja2FnZU1hbmFnZXJcIlxuaW1wb3J0IHsgcmVtb3ZlSWdub3JlZEZpbGVzIH0gZnJvbSBcIi4vZmlsdGVyRmlsZXNcIlxuaW1wb3J0IHtcbiAgd3JpdGVGaWxlU3luYyxcbiAgZXhpc3RzU3luYyxcbiAgbWtkaXJTeW5jLFxuICB1bmxpbmtTeW5jLFxuICBta2RpcnBTeW5jLFxuICByZWFscGF0aFN5bmMsXG59IGZyb20gXCJmcy1leHRyYVwiXG5pbXBvcnQgeyBzeW5jIGFzIHJpbXJhZiB9IGZyb20gXCJyaW1yYWZcIlxuaW1wb3J0IHsgY29weVN5bmMgfSBmcm9tIFwiZnMtZXh0cmFcIlxuaW1wb3J0IHsgZGlyU3luYyB9IGZyb20gXCJ0bXBcIlxuaW1wb3J0IHsgZ2V0UGF0Y2hGaWxlcyB9IGZyb20gXCIuL3BhdGNoRnNcIlxuaW1wb3J0IHtcbiAgZ2V0UGF0Y2hEZXRhaWxzRnJvbUNsaVN0cmluZyxcbiAgZ2V0UGFja2FnZURldGFpbHNGcm9tUGF0Y2hGaWxlbmFtZSxcbiAgUGFja2FnZURldGFpbHMsXG59IGZyb20gXCIuL1BhY2thZ2VEZXRhaWxzXCJcbmltcG9ydCB7IHJlc29sdmVSZWxhdGl2ZUZpbGVEZXBlbmRlbmNpZXMgfSBmcm9tIFwiLi9yZXNvbHZlUmVsYXRpdmVGaWxlRGVwZW5kZW5jaWVzXCJcbmltcG9ydCB7IGdldFBhY2thZ2VSZXNvbHV0aW9uIH0gZnJvbSBcIi4vZ2V0UGFja2FnZVJlc29sdXRpb25cIlxuaW1wb3J0IHsgcGFyc2VQYXRjaEZpbGUgfSBmcm9tIFwiLi9wYXRjaC9wYXJzZVwiXG5pbXBvcnQgeyBnemlwU3luYyB9IGZyb20gXCJ6bGliXCJcbmltcG9ydCB7IGdldFBhY2thZ2VWZXJzaW9uIH0gZnJvbSBcIi4vZ2V0UGFja2FnZVZlcnNpb25cIlxuaW1wb3J0IHtcbiAgbWF5YmVQcmludElzc3VlQ3JlYXRpb25Qcm9tcHQsXG4gIG9wZW5Jc3N1ZUNyZWF0aW9uTGluayxcbn0gZnJvbSBcIi4vY3JlYXRlSXNzdWVcIlxuXG5mdW5jdGlvbiBwcmludE5vUGFja2FnZUZvdW5kRXJyb3IoXG4gIHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gIHBhY2thZ2VKc29uUGF0aDogc3RyaW5nLFxuKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgYE5vIHN1Y2ggcGFja2FnZSAke3BhY2thZ2VOYW1lfVxuXG4gIEZpbGUgbm90IGZvdW5kOiAke3BhY2thZ2VKc29uUGF0aH1gLFxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlUGF0Y2goe1xuICBwYWNrYWdlUGF0aFNwZWNpZmllcixcbiAgYXBwUGF0aCxcbiAgcGFja2FnZU1hbmFnZXIsXG4gIGluY2x1ZGVQYXRocyxcbiAgZXhjbHVkZVBhdGhzLFxuICBwYXRjaERpcixcbiAgY3JlYXRlSXNzdWUsXG59OiB7XG4gIHBhY2thZ2VQYXRoU3BlY2lmaWVyOiBzdHJpbmdcbiAgYXBwUGF0aDogc3RyaW5nXG4gIHBhY2thZ2VNYW5hZ2VyOiBQYWNrYWdlTWFuYWdlclxuICBpbmNsdWRlUGF0aHM6IFJlZ0V4cFxuICBleGNsdWRlUGF0aHM6IFJlZ0V4cFxuICBwYXRjaERpcjogc3RyaW5nXG4gIGNyZWF0ZUlzc3VlOiBib29sZWFuXG59KSB7XG4gIGNvbnN0IHBhY2thZ2VEZXRhaWxzID0gZ2V0UGF0Y2hEZXRhaWxzRnJvbUNsaVN0cmluZyhwYWNrYWdlUGF0aFNwZWNpZmllcilcblxuICBpZiAoIXBhY2thZ2VEZXRhaWxzKSB7XG4gICAgY29uc29sZS5lcnJvcihcIk5vIHN1Y2ggcGFja2FnZVwiLCBwYWNrYWdlUGF0aFNwZWNpZmllcilcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBhcHBQYWNrYWdlSnNvbiA9IHJlcXVpcmUoam9pbihhcHBQYXRoLCBcInBhY2thZ2UuanNvblwiKSlcbiAgY29uc3QgcGFja2FnZVBhdGggPSBqb2luKGFwcFBhdGgsIHBhY2thZ2VEZXRhaWxzLnBhdGgpXG4gIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IGpvaW4ocGFja2FnZVBhdGgsIFwicGFja2FnZS5qc29uXCIpXG5cbiAgaWYgKCFleGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICBwcmludE5vUGFja2FnZUZvdW5kRXJyb3IocGFja2FnZVBhdGhTcGVjaWZpZXIsIHBhY2thZ2VKc29uUGF0aClcbiAgICBwcm9jZXNzLmV4aXQoMSlcbiAgfVxuXG4gIGNvbnN0IHRtcFJlcG8gPSBkaXJTeW5jKHsgdW5zYWZlQ2xlYW51cDogdHJ1ZSB9KVxuICBjb25zdCB0bXBSZXBvUGFja2FnZVBhdGggPSBqb2luKHRtcFJlcG8ubmFtZSwgcGFja2FnZURldGFpbHMucGF0aClcbiAgY29uc3QgdG1wUmVwb05wbVJvb3QgPSB0bXBSZXBvUGFja2FnZVBhdGguc2xpY2UoXG4gICAgMCxcbiAgICAtYC9ub2RlX21vZHVsZXMvJHtwYWNrYWdlRGV0YWlscy5uYW1lfWAubGVuZ3RoLFxuICApXG5cbiAgY29uc3QgdG1wUmVwb1BhY2thZ2VKc29uUGF0aCA9IGpvaW4odG1wUmVwb05wbVJvb3QsIFwicGFja2FnZS5qc29uXCIpXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXRjaGVzRGlyID0gcmVzb2x2ZShqb2luKGFwcFBhdGgsIHBhdGNoRGlyKSlcblxuICAgIGNvbnNvbGUuaW5mbyhjaGFsay5ncmV5KFwi4oCiXCIpLCBcIkNyZWF0aW5nIHRlbXBvcmFyeSBmb2xkZXJcIilcblxuICAgIC8vIG1ha2UgYSBibGFuayBwYWNrYWdlLmpzb25cbiAgICBta2RpcnBTeW5jKHRtcFJlcG9OcG1Sb290KVxuICAgIHdyaXRlRmlsZVN5bmMoXG4gICAgICB0bXBSZXBvUGFja2FnZUpzb25QYXRoLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBkZXBlbmRlbmNpZXM6IHtcbiAgICAgICAgICBbcGFja2FnZURldGFpbHMubmFtZV06IGdldFBhY2thZ2VSZXNvbHV0aW9uKHtcbiAgICAgICAgICAgIHBhY2thZ2VEZXRhaWxzLFxuICAgICAgICAgICAgcGFja2FnZU1hbmFnZXIsXG4gICAgICAgICAgICBhcHBQYXRoLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICByZXNvbHV0aW9uczogcmVzb2x2ZVJlbGF0aXZlRmlsZURlcGVuZGVuY2llcyhcbiAgICAgICAgICBhcHBQYXRoLFxuICAgICAgICAgIGFwcFBhY2thZ2VKc29uLnJlc29sdXRpb25zIHx8IHt9LFxuICAgICAgICApLFxuICAgICAgfSksXG4gICAgKVxuXG4gICAgY29uc3QgcGFja2FnZVZlcnNpb24gPSBnZXRQYWNrYWdlVmVyc2lvbihcbiAgICAgIGpvaW4ocmVzb2x2ZShwYWNrYWdlRGV0YWlscy5wYXRoKSwgXCJwYWNrYWdlLmpzb25cIiksXG4gICAgKVxuXG4gICAgICAvLyBjb3B5IC5ucG1yYy8ueWFybnJjIGluIGNhc2UgcGFja2FnZXMgYXJlIGhvc3RlZCBpbiBwcml2YXRlIHJlZ2lzdHJ5XG4gICAgICAvLyBjb3B5IC55YXJuIGRpcmVjdG9yeSBhcyB3ZWxsIHRvIGVuc3VyZSBpbnN0YWxsYXRpb25zIHdvcmsgaW4geWFybiAyXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6YWxpZ25cbiAgICAgIDtbXCIubnBtcmNcIiwgXCIueWFybnJjXCIsIFwiLnlhcm5cIl0uZm9yRWFjaCgocmNGaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IHJjUGF0aCA9IGpvaW4oYXBwUGF0aCwgcmNGaWxlKVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhyY1BhdGgpKSB7XG4gICAgICAgICAgY29weVN5bmMocmNQYXRoLCBqb2luKHRtcFJlcG8ubmFtZSwgcmNGaWxlKSwgeyBkZXJlZmVyZW5jZTogdHJ1ZSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgaWYgKHBhY2thZ2VNYW5hZ2VyID09PSBcInlhcm5cIikge1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBjaGFsay5ncmV5KFwi4oCiXCIpLFxuICAgICAgICBgSW5zdGFsbGluZyAke3BhY2thZ2VEZXRhaWxzLm5hbWV9QCR7cGFja2FnZVZlcnNpb259IHdpdGggeWFybmAsXG4gICAgICApXG4gICAgICB0cnkge1xuICAgICAgICAvLyB0cnkgZmlyc3Qgd2l0aG91dCBpZ25vcmluZyBzY3JpcHRzIGluIGNhc2UgdGhleSBhcmUgcmVxdWlyZWRcbiAgICAgICAgLy8gdGhpcyB3b3JrcyBpbiA5OS45OSUgb2YgY2FzZXNcbiAgICAgICAgc3Bhd25TYWZlU3luYyhgeWFybmAsIFtcImluc3RhbGxcIiwgXCItLWlnbm9yZS1lbmdpbmVzXCJdLCB7XG4gICAgICAgICAgY3dkOiB0bXBSZXBvTnBtUm9vdCxcbiAgICAgICAgICBsb2dTdGRFcnJPbkVycm9yOiBmYWxzZSxcbiAgICAgICAgfSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gdHJ5IGFnYWluIHdoaWxlIGlnbm9yaW5nIHNjcmlwdHMgaW4gY2FzZSB0aGUgc2NyaXB0IGRlcGVuZHMgb25cbiAgICAgICAgLy8gYW4gaW1wbGljaXQgY29udGV4dCB3aGljaCB3ZSBoYXZuJ3QgcmVwcm9kdWNlZFxuICAgICAgICBzcGF3blNhZmVTeW5jKFxuICAgICAgICAgIGB5YXJuYCxcbiAgICAgICAgICBbXCJpbnN0YWxsXCIsIFwiLS1pZ25vcmUtZW5naW5lc1wiLCBcIi0taWdub3JlLXNjcmlwdHNcIl0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgY3dkOiB0bXBSZXBvTnBtUm9vdCxcbiAgICAgICAgICB9LFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgY2hhbGsuZ3JleShcIuKAolwiKSxcbiAgICAgICAgYEluc3RhbGxpbmcgJHtwYWNrYWdlRGV0YWlscy5uYW1lfUAke3BhY2thZ2VWZXJzaW9ufSB3aXRoIG5wbWAsXG4gICAgICApXG4gICAgICB0cnkge1xuICAgICAgICAvLyB0cnkgZmlyc3Qgd2l0aG91dCBpZ25vcmluZyBzY3JpcHRzIGluIGNhc2UgdGhleSBhcmUgcmVxdWlyZWRcbiAgICAgICAgLy8gdGhpcyB3b3JrcyBpbiA5OS45OSUgb2YgY2FzZXNcbiAgICAgICAgc3Bhd25TYWZlU3luYyhgbnBtYCwgW1wiaVwiLCBcIi0tZm9yY2VcIl0sIHtcbiAgICAgICAgICBjd2Q6IHRtcFJlcG9OcG1Sb290LFxuICAgICAgICAgIGxvZ1N0ZEVyck9uRXJyb3I6IGZhbHNlLFxuICAgICAgICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyB0cnkgYWdhaW4gd2hpbGUgaWdub3Jpbmcgc2NyaXB0cyBpbiBjYXNlIHRoZSBzY3JpcHQgZGVwZW5kcyBvblxuICAgICAgICAvLyBhbiBpbXBsaWNpdCBjb250ZXh0IHdoaWNoIHdlIGhhdm4ndCByZXByb2R1Y2VkXG4gICAgICAgIHNwYXduU2FmZVN5bmMoYG5wbWAsIFtcImlcIiwgXCItLWlnbm9yZS1zY3JpcHRzXCIsIFwiLS1mb3JjZVwiXSwge1xuICAgICAgICAgIGN3ZDogdG1wUmVwb05wbVJvb3QsXG4gICAgICAgICAgc3RkaW86IFwiaWdub3JlXCIsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZ2l0ID0gKC4uLmFyZ3M6IHN0cmluZ1tdKSA9PlxuICAgICAgc3Bhd25TYWZlU3luYyhcImdpdFwiLCBhcmdzLCB7XG4gICAgICAgIGN3ZDogdG1wUmVwby5uYW1lLFxuICAgICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIEhPTUU6IHRtcFJlcG8ubmFtZSB9LFxuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogMTAwLFxuICAgICAgfSlcblxuICAgIC8vIHJlbW92ZSBuZXN0ZWQgbm9kZV9tb2R1bGVzIGp1c3QgdG8gYmUgc2FmZVxuICAgIHJpbXJhZihqb2luKHRtcFJlcG9QYWNrYWdlUGF0aCwgXCJub2RlX21vZHVsZXNcIikpXG4gICAgLy8gcmVtb3ZlIC5naXQganVzdCB0byBiZSBzYWZlXG4gICAgcmltcmFmKGpvaW4odG1wUmVwb1BhY2thZ2VQYXRoLCBcIi5naXRcIikpXG5cbiAgICAvLyBjb21taXQgdGhlIHBhY2thZ2VcbiAgICBjb25zb2xlLmluZm8oY2hhbGsuZ3JleShcIuKAolwiKSwgXCJEaWZmaW5nIHlvdXIgZmlsZXMgd2l0aCBjbGVhbiBmaWxlc1wiKVxuICAgIHdyaXRlRmlsZVN5bmMoam9pbih0bXBSZXBvLm5hbWUsIFwiLmdpdGlnbm9yZVwiKSwgXCIhL25vZGVfbW9kdWxlc1xcblxcblwiKVxuICAgIGdpdChcImluaXRcIilcbiAgICBnaXQoXCJjb25maWdcIiwgXCItLWxvY2FsXCIsIFwidXNlci5uYW1lXCIsIFwicGF0Y2gtcGFja2FnZVwiKVxuICAgIGdpdChcImNvbmZpZ1wiLCBcIi0tbG9jYWxcIiwgXCJ1c2VyLmVtYWlsXCIsIFwicGF0Y2hAcGFjay5hZ2VcIilcblxuICAgIC8vIHJlbW92ZSBpZ25vcmVkIGZpbGVzIGZpcnN0XG4gICAgcmVtb3ZlSWdub3JlZEZpbGVzKHRtcFJlcG9QYWNrYWdlUGF0aCwgaW5jbHVkZVBhdGhzLCBleGNsdWRlUGF0aHMpXG5cbiAgICBnaXQoXCJhZGRcIiwgXCItZlwiLCBwYWNrYWdlRGV0YWlscy5wYXRoKVxuICAgIGdpdChcImNvbW1pdFwiLCBcIi0tYWxsb3ctZW1wdHlcIiwgXCItbVwiLCBcImluaXRcIilcblxuICAgIC8vIHJlcGxhY2UgcGFja2FnZSB3aXRoIHVzZXIncyB2ZXJzaW9uXG4gICAgcmltcmFmKHRtcFJlcG9QYWNrYWdlUGF0aClcblxuICAgIC8vIHBucG0gaW5zdGFsbHMgcGFja2FnZXMgYXMgc3ltbGlua3MsIGNvcHlTeW5jIHdvdWxkIGNvcHkgb25seSB0aGUgc3ltbGlua1xuICAgIGNvcHlTeW5jKHJlYWxwYXRoU3luYyhwYWNrYWdlUGF0aCksIHRtcFJlcG9QYWNrYWdlUGF0aClcblxuICAgIC8vIHJlbW92ZSBuZXN0ZWQgbm9kZV9tb2R1bGVzIGp1c3QgdG8gYmUgc2FmZVxuICAgIHJpbXJhZihqb2luKHRtcFJlcG9QYWNrYWdlUGF0aCwgXCJub2RlX21vZHVsZXNcIikpXG4gICAgLy8gcmVtb3ZlIC5naXQganVzdCB0byBiZSBzYWZlXG4gICAgcmltcmFmKGpvaW4odG1wUmVwb1BhY2thZ2VQYXRoLCBcIi5naXRcIikpXG5cbiAgICAvLyBhbHNvIHJlbW92ZSBpZ25vcmVkIGZpbGVzIGxpa2UgYmVmb3JlXG4gICAgcmVtb3ZlSWdub3JlZEZpbGVzKHRtcFJlcG9QYWNrYWdlUGF0aCwgaW5jbHVkZVBhdGhzLCBleGNsdWRlUGF0aHMpXG5cbiAgICAvLyBzdGFnZSBhbGwgZmlsZXNcbiAgICBnaXQoXCJhZGRcIiwgXCItZlwiLCBwYWNrYWdlRGV0YWlscy5wYXRoKVxuXG4gICAgLy8gZ2V0IGRpZmYgb2YgY2hhbmdlc1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBnaXQoXG4gICAgICBcImRpZmZcIixcbiAgICAgIFwiLS1jYWNoZWRcIixcbiAgICAgIFwiLS1uby1jb2xvclwiLFxuICAgICAgXCItLWlnbm9yZS1zcGFjZS1hdC1lb2xcIixcbiAgICAgIFwiLS1uby1leHQtZGlmZlwiLFxuICAgICAgXCItLXNyYy1wcmVmaXg9YS9cIixcbiAgICAgIFwiLS1kc3QtcHJlZml4PWIvXCJcbiAgICApXG5cbiAgICBpZiAoZGlmZlJlc3VsdC5zdGRvdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGDigYnvuI8gIE5vdCBjcmVhdGluZyBwYXRjaCBmaWxlIGZvciBwYWNrYWdlICcke3BhY2thZ2VQYXRoU3BlY2lmaWVyfSdgLFxuICAgICAgKVxuICAgICAgY29uc29sZS53YXJuKGDigYnvuI8gIFRoZXJlIGRvbid0IGFwcGVhciB0byBiZSBhbnkgY2hhbmdlcy5gKVxuICAgICAgcHJvY2Vzcy5leGl0KDEpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcGFyc2VQYXRjaEZpbGUoZGlmZlJlc3VsdC5zdGRvdXQudG9TdHJpbmcoKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIChlIGFzIEVycm9yKS5tZXNzYWdlLmluY2x1ZGVzKFwiVW5leHBlY3RlZCBmaWxlIG1vZGUgc3RyaW5nOiAxMjAwMDBcIilcbiAgICAgICkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBcbuKblO+4jyAke2NoYWxrLnJlZC5ib2xkKFwiRVJST1JcIil9XG5cbiAgWW91ciBjaGFuZ2VzIGludm9sdmUgY3JlYXRpbmcgc3ltbGlua3MuIHBhdGNoLXBhY2thZ2UgZG9lcyBub3QgeWV0IHN1cHBvcnRcbiAgc3ltbGlua3MuXG4gIFxuICDvuI9QbGVhc2UgdXNlICR7Y2hhbGsuYm9sZChcIi0taW5jbHVkZVwiKX0gYW5kL29yICR7Y2hhbGsuYm9sZChcbiAgICAgICAgICBcIi0tZXhjbHVkZVwiLFxuICAgICAgICApfSB0byBuYXJyb3cgdGhlIHNjb3BlIG9mIHlvdXIgcGF0Y2ggaWZcbiAgdGhpcyB3YXMgdW5pbnRlbnRpb25hbC5cbmApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBvdXRQYXRoID0gXCIuL3BhdGNoLXBhY2thZ2UtZXJyb3IuanNvbi5nelwiXG4gICAgICAgIHdyaXRlRmlsZVN5bmMoXG4gICAgICAgICAgb3V0UGF0aCxcbiAgICAgICAgICBnemlwU3luYyhcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6IHsgbWVzc2FnZTogZS5tZXNzYWdlLCBzdGFjazogZS5zdGFjayB9LFxuICAgICAgICAgICAgICBwYXRjaDogZGlmZlJlc3VsdC5zdGRvdXQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgIClcbiAgICAgICAgY29uc29sZS5lcnJvcihgXG7im5TvuI8gJHtjaGFsay5yZWQuYm9sZChcIkVSUk9SXCIpfVxuICAgICAgICBcbiAgcGF0Y2gtcGFja2FnZSB3YXMgdW5hYmxlIHRvIHJlYWQgdGhlIHBhdGNoLWZpbGUgbWFkZSBieSBnaXQuIFRoaXMgc2hvdWxkIG5vdFxuICBoYXBwZW4uXG4gIFxuICBBIGRpYWdub3N0aWMgZmlsZSB3YXMgd3JpdHRlbiB0b1xuICBcbiAgICAke291dFBhdGh9XG4gIFxuICBQbGVhc2UgYXR0YWNoIGl0IHRvIGEgZ2l0aHViIGlzc3VlXG4gIFxuICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9kczMwMC9wYXRjaC1wYWNrYWdlL2lzc3Vlcy9uZXc/dGl0bGU9TmV3K3BhdGNoK3BhcnNlK2ZhaWxlZCZib2R5PVBsZWFzZSthdHRhY2grdGhlK2RpYWdub3N0aWMrZmlsZStieStkcmFnZ2luZytpdCtpbnRvK2hlcmUr8J+Zj1xuICBcbiAgTm90ZSB0aGF0IHRoaXMgZGlhZ25vc3RpYyBmaWxlIHdpbGwgY29udGFpbiBjb2RlIGZyb20gdGhlIHBhY2thZ2UgeW91IHdlcmVcbiAgYXR0ZW1wdGluZyB0byBwYXRjaC5cblxuYClcbiAgICAgIH1cbiAgICAgIHByb2Nlc3MuZXhpdCgxKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gbWF5YmUgZGVsZXRlIGV4aXN0aW5nXG4gICAgZ2V0UGF0Y2hGaWxlcyhwYXRjaERpcikuZm9yRWFjaCgoZmlsZW5hbWUpID0+IHtcbiAgICAgIGNvbnN0IGRlZXRzID0gZ2V0UGFja2FnZURldGFpbHNGcm9tUGF0Y2hGaWxlbmFtZShmaWxlbmFtZSlcbiAgICAgIGlmIChkZWV0cyAmJiBkZWV0cy5wYXRoID09PSBwYWNrYWdlRGV0YWlscy5wYXRoKSB7XG4gICAgICAgIHVubGlua1N5bmMoam9pbihwYXRjaERpciwgZmlsZW5hbWUpKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBwYXRjaEZpbGVOYW1lID0gY3JlYXRlUGF0Y2hGaWxlTmFtZSh7XG4gICAgICBwYWNrYWdlRGV0YWlscyxcbiAgICAgIHBhY2thZ2VWZXJzaW9uLFxuICAgIH0pXG5cbiAgICBjb25zdCBwYXRjaFBhdGggPSBqb2luKHBhdGNoZXNEaXIsIHBhdGNoRmlsZU5hbWUpXG4gICAgaWYgKCFleGlzdHNTeW5jKGRpcm5hbWUocGF0Y2hQYXRoKSkpIHtcbiAgICAgIC8vIHNjb3BlZCBwYWNrYWdlXG4gICAgICBta2RpclN5bmMoZGlybmFtZShwYXRjaFBhdGgpKVxuICAgIH1cbiAgICB3cml0ZUZpbGVTeW5jKHBhdGNoUGF0aCwgZGlmZlJlc3VsdC5zdGRvdXQpXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgJHtjaGFsay5ncmVlbihcIuKclFwiKX0gQ3JlYXRlZCBmaWxlICR7am9pbihwYXRjaERpciwgcGF0Y2hGaWxlTmFtZSl9XFxuYCxcbiAgICApXG4gICAgaWYgKGNyZWF0ZUlzc3VlKSB7XG4gICAgICBvcGVuSXNzdWVDcmVhdGlvbkxpbmsoe1xuICAgICAgICBwYWNrYWdlRGV0YWlscyxcbiAgICAgICAgcGF0Y2hGaWxlQ29udGVudHM6IGRpZmZSZXN1bHQuc3Rkb3V0LnRvU3RyaW5nKCksXG4gICAgICAgIHBhY2thZ2VWZXJzaW9uLFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgbWF5YmVQcmludElzc3VlQ3JlYXRpb25Qcm9tcHQocGFja2FnZURldGFpbHMsIHBhY2thZ2VNYW5hZ2VyKVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB0aHJvdyBlXG4gIH0gZmluYWxseSB7XG4gICAgdG1wUmVwby5yZW1vdmVDYWxsYmFjaygpXG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUGF0Y2hGaWxlTmFtZSh7XG4gIHBhY2thZ2VEZXRhaWxzLFxuICBwYWNrYWdlVmVyc2lvbixcbn06IHtcbiAgcGFja2FnZURldGFpbHM6IFBhY2thZ2VEZXRhaWxzXG4gIHBhY2thZ2VWZXJzaW9uOiBzdHJpbmdcbn0pIHtcbiAgY29uc3QgcGFja2FnZU5hbWVzID0gcGFja2FnZURldGFpbHMucGFja2FnZU5hbWVzXG4gICAgLm1hcCgobmFtZSkgPT4gbmFtZS5yZXBsYWNlKC9cXC8vZywgXCIrXCIpKVxuICAgIC5qb2luKFwiKytcIilcblxuICByZXR1cm4gYCR7cGFja2FnZU5hbWVzfSske3BhY2thZ2VWZXJzaW9ufS5wYXRjaGBcbn1cbiJdfQ==