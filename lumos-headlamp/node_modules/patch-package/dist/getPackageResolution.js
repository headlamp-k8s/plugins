"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageResolution = void 0;
const path_1 = require("./path");
const PackageDetails_1 = require("./PackageDetails");
const detectPackageManager_1 = require("./detectPackageManager");
const fs_extra_1 = require("fs-extra");
const lockfile_1 = require("@yarnpkg/lockfile");
const yaml_1 = __importDefault(require("yaml"));
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const getPackageVersion_1 = require("./getPackageVersion");
function getPackageResolution({ packageDetails, packageManager, appPath, }) {
    if (packageManager === "yarn") {
        let lockFilePath = "yarn.lock";
        if (!fs_extra_1.existsSync(lockFilePath)) {
            const workspaceRoot = find_yarn_workspace_root_1.default();
            if (!workspaceRoot) {
                throw new Error("Can't find yarn.lock file");
            }
            lockFilePath = path_1.join(workspaceRoot, "yarn.lock");
        }
        if (!fs_extra_1.existsSync(lockFilePath)) {
            throw new Error("Can't find yarn.lock file");
        }
        const lockFileString = fs_extra_1.readFileSync(lockFilePath).toString();
        let appLockFile;
        if (lockFileString.includes("yarn lockfile v1")) {
            const parsedYarnLockFile = lockfile_1.parse(lockFileString);
            if (parsedYarnLockFile.type !== "success") {
                throw new Error("Could not parse yarn v1 lock file");
            }
            else {
                appLockFile = parsedYarnLockFile.object;
            }
        }
        else {
            try {
                appLockFile = yaml_1.default.parse(lockFileString);
            }
            catch (e) {
                console.error(e);
                throw new Error("Could not parse yarn v2 lock file");
            }
        }
        const installedVersion = getPackageVersion_1.getPackageVersion(path_1.join(path_1.resolve(appPath, packageDetails.path), "package.json"));
        const entries = Object.entries(appLockFile).filter(([k, v]) => k.startsWith(packageDetails.name + "@") &&
            // @ts-ignore
            v.version === installedVersion);
        const resolutions = entries.map(([_, v]) => {
            // @ts-ignore
            return v.resolved;
        });
        if (resolutions.length === 0) {
            throw new Error(`\`${packageDetails.pathSpecifier}\`'s installed version is ${installedVersion} but a lockfile entry for it couldn't be found. Your lockfile is likely to be corrupt or you forgot to reinstall your packages.`);
        }
        if (new Set(resolutions).size !== 1) {
            console.warn(`Ambigious lockfile entries for ${packageDetails.pathSpecifier}. Using version ${installedVersion}`);
            return installedVersion;
        }
        if (resolutions[0]) {
            return resolutions[0];
        }
        const resolution = entries[0][0].slice(packageDetails.name.length + 1);
        // resolve relative file path
        if (resolution.startsWith("file:.")) {
            return `file:${path_1.resolve(appPath, resolution.slice("file:".length))}`;
        }
        if (resolution.startsWith("npm:")) {
            return resolution.replace("npm:", "");
        }
        return resolution;
    }
    else {
        const lockfile = require(path_1.join(appPath, packageManager === "npm-shrinkwrap"
            ? "npm-shrinkwrap.json"
            : "package-lock.json"));
        const lockFileStack = [lockfile];
        for (const name of packageDetails.packageNames.slice(0, -1)) {
            const child = lockFileStack[0].dependencies;
            if (child && name in child) {
                lockFileStack.push(child[name]);
            }
        }
        lockFileStack.reverse();
        const relevantStackEntry = lockFileStack.find((entry) => {
            if (entry.dependencies) {
                return entry.dependencies && packageDetails.name in entry.dependencies;
            }
            else if (entry.packages) {
                return entry.packages && packageDetails.path in entry.packages;
            }
            throw new Error("Cannot find dependencies or packages in lockfile");
        });
        const pkg = relevantStackEntry.dependencies
            ? relevantStackEntry.dependencies[packageDetails.name]
            : relevantStackEntry.packages[packageDetails.path];
        return pkg.resolved || pkg.version || pkg.from;
    }
}
exports.getPackageResolution = getPackageResolution;
if (require.main === module) {
    const packageDetails = PackageDetails_1.getPatchDetailsFromCliString(process.argv[2]);
    if (!packageDetails) {
        console.error(`Can't find package ${process.argv[2]}`);
        process.exit(1);
    }
    console.log(getPackageResolution({
        appPath: process.cwd(),
        packageDetails,
        packageManager: detectPackageManager_1.detectPackageManager(process.cwd(), null),
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UGFja2FnZVJlc29sdXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZ2V0UGFja2FnZVJlc29sdXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaUNBQXNDO0FBQ3RDLHFEQUErRTtBQUMvRSxpRUFBNkU7QUFDN0UsdUNBQW1EO0FBQ25ELGdEQUE4RDtBQUM5RCxnREFBdUI7QUFDdkIsd0ZBQXdEO0FBQ3hELDJEQUF1RDtBQUV2RCxTQUFnQixvQkFBb0IsQ0FBQyxFQUNuQyxjQUFjLEVBQ2QsY0FBYyxFQUNkLE9BQU8sR0FLUjtJQUNDLElBQUksY0FBYyxLQUFLLE1BQU0sRUFBRTtRQUM3QixJQUFJLFlBQVksR0FBRyxXQUFXLENBQUE7UUFDOUIsSUFBSSxDQUFDLHFCQUFVLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDN0IsTUFBTSxhQUFhLEdBQUcsa0NBQWlCLEVBQUUsQ0FBQTtZQUN6QyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUE7YUFDN0M7WUFDRCxZQUFZLEdBQUcsV0FBSSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQTtTQUNoRDtRQUNELElBQUksQ0FBQyxxQkFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQTtTQUM3QztRQUNELE1BQU0sY0FBYyxHQUFHLHVCQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDNUQsSUFBSSxXQUFXLENBQUE7UUFDZixJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRTtZQUMvQyxNQUFNLGtCQUFrQixHQUFHLGdCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBQzVELElBQUksa0JBQWtCLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDekMsTUFBTSxJQUFJ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QyxjQUFjLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUNoQjtJQUNELE9BQU8sQ0FBQyxHQUFHLENBQ1Qsb0JBQW9CLENBQUM7UUFDbkIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDdEIsY0FBYztRQUNkLGNBQWMsRUFBRSwyQ0FBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDO0tBQzFELENBQUMsQ0FDSCxDQUFBO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luLCByZXNvbHZlIH0gZnJvbSBcIi4vcGF0aFwiXG5pbXBvcnQgeyBQYWNrYWdlRGV0YWlscywgZ2V0UGF0Y2hEZXRhaWxzRnJvbUNsaVN0cmluZyB9IGZyb20gXCIuL1BhY2thZ2VEZXRhaWxzXCJcbmltcG9ydCB7IFBhY2thZ2VNYW5hZ2VyLCBkZXRlY3RQYWNrYWdlTWFuYWdlciB9IGZyb20gXCIuL2RldGVjdFBhY2thZ2VNYW5hZ2VyXCJcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmcy1leHRyYVwiXG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZVlhcm5Mb2NrRmlsZSB9IGZyb20gXCJAeWFybnBrZy9sb2NrZmlsZVwiXG5pbXBvcnQgeWFtbCBmcm9tIFwieWFtbFwiXG5pbXBvcnQgZmluZFdvcmtzcGFjZVJvb3QgZnJvbSBcImZpbmQteWFybi13b3Jrc3BhY2Utcm9vdFwiXG5pbXBvcnQgeyBnZXRQYWNrYWdlVmVyc2lvbiB9IGZyb20gXCIuL2dldFBhY2thZ2VWZXJzaW9uXCJcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2thZ2VSZXNvbHV0aW9uKHtcbiAgcGFja2FnZURldGFpbHMsXG4gIHBhY2thZ2VNYW5hZ2VyLFxuICBhcHBQYXRoLFxufToge1xuICBwYWNrYWdlRGV0YWlsczogUGFja2FnZURldGFpbHNcbiAgcGFja2FnZU1hbmFnZXI6IFBhY2thZ2VNYW5hZ2VyXG4gIGFwcFBhdGg6IHN0cmluZ1xufSkge1xuICBpZiAocGFja2FnZU1hbmFnZXIgPT09IFwieWFyblwiKSB7XG4gICAgbGV0IGxvY2tGaWxlUGF0aCA9IFwieWFybi5sb2NrXCJcbiAgICBpZiAoIWV4aXN0c1N5bmMobG9ja0ZpbGVQYXRoKSkge1xuICAgICAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IGZpbmRXb3Jrc3BhY2VSb290KClcbiAgICAgIGlmICghd29ya3NwYWNlUm9vdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBmaW5kIHlhcm4ubG9jayBmaWxlXCIpXG4gICAgICB9XG4gICAgICBsb2NrRmlsZVBhdGggPSBqb2luKHdvcmtzcGFjZVJvb3QsIFwieWFybi5sb2NrXCIpXG4gICAgfVxuICAgIGlmICghZXhpc3RzU3luYyhsb2NrRmlsZVBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBmaW5kIHlhcm4ubG9jayBmaWxlXCIpXG4gICAgfVxuICAgIGNvbnN0IGxvY2tGaWxlU3RyaW5nID0gcmVhZEZpbGVTeW5jKGxvY2tGaWxlUGF0aCkudG9TdHJpbmcoKVxuICAgIGxldCBhcHBMb2NrRmlsZVxuICAgIGlmIChsb2NrRmlsZVN0cmluZy5pbmNsdWRlcyhcInlhcm4gbG9ja2ZpbGUgdjFcIikpIHtcbiAgICAgIGNvbnN0IHBhcnNlZFlhcm5Mb2NrRmlsZSA9IHBhcnNlWWFybkxvY2tGaWxlKGxvY2tGaWxlU3RyaW5nKVxuICAgICAgaWYgKHBhcnNlZFlhcm5Mb2NrRmlsZS50eXBlICE9PSBcInN1Y2Nlc3NcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgcGFyc2UgeWFybiB2MSBsb2NrIGZpbGVcIilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcExvY2tGaWxlID0gcGFyc2VkWWFybkxvY2tGaWxlLm9iamVjdFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBhcHBMb2NrRmlsZSA9IHlhbWwucGFyc2UobG9ja0ZpbGVTdHJpbmcpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHBhcnNlIHlhcm4gdjIgbG9jayBmaWxlXCIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFsbGVkVmVyc2lvbiA9IGdldFBhY2thZ2VWZXJzaW9uKFxuICAgICAgam9pbihyZXNvbHZlKGFwcFBhdGgsIHBhY2thZ2VEZXRhaWxzLnBhdGgpLCBcInBhY2thZ2UuanNvblwiKSxcbiAgICApXG5cbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoYXBwTG9ja0ZpbGUpLmZpbHRlcihcbiAgICAgIChbaywgdl0pID0+XG4gICAgICAgIGsuc3RhcnRzV2l0aChwYWNrYWdlRGV0YWlscy5uYW1lICsgXCJAXCIpICYmXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdi52ZXJzaW9uID09PSBpbnN0YWxsZWRWZXJzaW9uLFxuICAgIClcblxuICAgIGNvbnN0IHJlc29sdXRpb25zID0gZW50cmllcy5tYXAoKFtfLCB2XSkgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcmV0dXJuIHYucmVzb2x2ZWRcbiAgICB9KVxuXG4gICAgaWYgKHJlc29sdXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgXFxgJHtwYWNrYWdlRGV0YWlscy5wYXRoU3BlY2lmaWVyfVxcYCdzIGluc3RhbGxlZCB2ZXJzaW9uIGlzICR7aW5zdGFsbGVkVmVyc2lvbn0gYnV0IGEgbG9ja2ZpbGUgZW50cnkgZm9yIGl0IGNvdWxkbid0IGJlIGZvdW5kLiBZb3VyIGxvY2tmaWxlIGlzIGxpa2VseSB0byBiZSBjb3JydXB0IG9yIHlvdSBmb3Jnb3QgdG8gcmVpbnN0YWxsIHlvdXIgcGFja2FnZXMuYCxcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAobmV3IFNldChyZXNvbHV0aW9ucykuc2l6ZSAhPT0gMSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgQW1iaWdpb3VzIGxvY2tmaWxlIGVudHJpZXMgZm9yICR7cGFja2FnZURldGFpbHMucGF0aFNwZWNpZmllcn0uIFVzaW5nIHZlcnNpb24gJHtpbnN0YWxsZWRWZXJzaW9ufWAsXG4gICAgICApXG4gICAgICByZXR1cm4gaW5zdGFsbGVkVmVyc2lvblxuICAgIH1cblxuICAgIGlmIChyZXNvbHV0aW9uc1swXSkge1xuICAgICAgcmV0dXJuIHJlc29sdXRpb25zWzBdXG4gICAgfVxuXG4gICAgY29uc3QgcmVzb2x1dGlvbiA9IGVudHJpZXNbMF1bMF0uc2xpY2UocGFja2FnZURldGFpbHMubmFtZS5sZW5ndGggKyAxKVxuXG4gICAgLy8gcmVzb2x2ZSByZWxhdGl2ZSBmaWxlIHBhdGhcbiAgICBpZiAocmVzb2x1dGlvbi5zdGFydHNXaXRoKFwiZmlsZTouXCIpKSB7XG4gICAgICByZXR1cm4gYGZpbGU6JHtyZXNvbHZlKGFwcFBhdGgsIHJlc29sdXRpb24uc2xpY2UoXCJmaWxlOlwiLmxlbmd0aCkpfWBcbiAgICB9XG5cbiAgICBpZiAocmVzb2x1dGlvbi5zdGFydHNXaXRoKFwibnBtOlwiKSkge1xuICAgICAgcmV0dXJuIHJlc29sdXRpb24ucmVwbGFjZShcIm5wbTpcIiwgXCJcIilcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzb2x1dGlvblxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxvY2tmaWxlID0gcmVxdWlyZShqb2luKFxuICAgICAgYXBwUGF0aCxcbiAgICAgIHBhY2thZ2VNYW5hZ2VyID09PSBcIm5wbS1zaHJpbmt3cmFwXCJcbiAgICAgICAgPyBcIm5wbS1zaHJpbmt3cmFwLmpzb25cIlxuICAgICAgICA6IFwicGFja2FnZS1sb2NrLmpzb25cIixcbiAgICApKVxuICAgIGNvbnN0IGxvY2tGaWxlU3RhY2sgPSBbbG9ja2ZpbGVdXG4gICAgZm9yIChjb25zdCBuYW1lIG9mIHBhY2thZ2VEZXRhaWxzLnBhY2thZ2VOYW1lcy5zbGljZSgwLCAtMSkpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gbG9ja0ZpbGVTdGFja1swXS5kZXBlbmRlbmNpZXNcbiAgICAgIGlmIChjaGlsZCAmJiBuYW1lIGluIGNoaWxkKSB7XG4gICAgICAgIGxvY2tGaWxlU3RhY2sucHVzaChjaGlsZFtuYW1lXSlcbiAgICAgIH1cbiAgICB9XG4gICAgbG9ja0ZpbGVTdGFjay5yZXZlcnNlKClcbiAgICBjb25zdCByZWxldmFudFN0YWNrRW50cnkgPSBsb2NrRmlsZVN0YWNrLmZpbmQoKGVudHJ5KSA9PiB7XG4gICAgICBpZiAoZW50cnkuZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS5kZXBlbmRlbmNpZXMgJiYgcGFja2FnZURldGFpbHMubmFtZSBpbiBlbnRyeS5kZXBlbmRlbmNpZXNcbiAgICAgIH0gZWxzZSBpZiAoZW50cnkucGFja2FnZXMpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5LnBhY2thZ2VzICYmIHBhY2thZ2VEZXRhaWxzLnBhdGggaW4gZW50cnkucGFja2FnZXNcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIGRlcGVuZGVuY2llcyBvciBwYWNrYWdlcyBpbiBsb2NrZmlsZVwiKVxuICAgIH0pXG4gICAgY29uc3QgcGtnID0gcmVsZXZhbnRTdGFja0VudHJ5LmRlcGVuZGVuY2llc1xuICAgICAgPyByZWxldmFudFN0YWNrRW50cnkuZGVwZW5kZW5jaWVzW3BhY2thZ2VEZXRhaWxzLm5hbWVdXG4gICAgICA6IHJlbGV2YW50U3RhY2tFbnRyeS5wYWNrYWdlc1twYWNrYWdlRGV0YWlscy5wYXRoXVxuICAgIHJldHVybiBwa2cucmVzb2x2ZWQgfHwgcGtnLnZlcnNpb24gfHwgcGtnLmZyb21cbiAgfVxufVxuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgY29uc3QgcGFja2FnZURldGFpbHMgPSBnZXRQYXRjaERldGFpbHNGcm9tQ2xpU3RyaW5nKHByb2Nlc3MuYXJndlsyXSlcbiAgaWYgKCFwYWNrYWdlRGV0YWlscykge1xuICAgIGNvbnNvbGUuZXJyb3IoYENhbid0IGZpbmQgcGFja2FnZSAke3Byb2Nlc3MuYXJndlsyXX1gKVxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9XG4gIGNvbnNvbGUubG9nKFxuICAgIGdldFBhY2thZ2VSZXNvbHV0aW9uKHtcbiAgICAgIGFwcFBhdGg6IHByb2Nlc3MuY3dkKCksXG4gICAgICBwYWNrYWdlRGV0YWlscyxcbiAgICAgIHBhY2thZ2VNYW5hZ2VyOiBkZXRlY3RQYWNrYWdlTWFuYWdlcihwcm9jZXNzLmN3ZCgpLCBudWxsKSxcbiAgICB9KSxcbiAgKVxufVxuIl19