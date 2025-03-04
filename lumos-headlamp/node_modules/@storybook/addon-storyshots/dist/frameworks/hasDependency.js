"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const read_pkg_up_1 = __importDefault(require("read-pkg-up"));
const { packageJson: { dependencies, devDependencies } = {
    dependencies: undefined,
    devDependencies: undefined,
}, } = read_pkg_up_1.default.sync() || {};
function hasDependency(name) {
    return Boolean((devDependencies && devDependencies[name]) ||
        (dependencies && dependencies[name]) ||
        fs_1.default.existsSync(path_1.default.join('node_modules', name, 'package.json')));
}
exports.default = hasDependency;
