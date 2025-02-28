import { PackageJsonWithMaybeDeps, JsPackageManager, PackageJsonWithDepsAndDevDeps, PackageJson } from '@storybook/core/common';
import { SupportedFrameworks, SupportedRenderers as SupportedRenderers$1 } from '@storybook/core/types';
import * as semver from 'semver';

/** A list of all frameworks that are supported, but use a package outside the storybook monorepo */
type ExternalFramework = {
    name: SupportedFrameworks;
    packageName?: string;
    frameworks?: string[];
    renderer?: string;
};
declare const externalFrameworks: ExternalFramework[];
/** @deprecated Please use `SupportedRenderers` from `@storybook/types` instead */
type SupportedRenderers = SupportedRenderers$1;
declare const SUPPORTED_RENDERERS: SupportedRenderers[];
declare enum ProjectType {
    UNDETECTED = "UNDETECTED",
    UNSUPPORTED = "UNSUPPORTED",
    REACT = "REACT",
    REACT_SCRIPTS = "REACT_SCRIPTS",
    REACT_NATIVE = "REACT_NATIVE",
    REACT_NATIVE_WEB = "REACT_NATIVE_WEB",
    REACT_PROJECT = "REACT_PROJECT",
    WEBPACK_REACT = "WEBPACK_REACT",
    NEXTJS = "NEXTJS",
    VUE3 = "VUE3",
    NUXT = "NUXT",
    ANGULAR = "ANGULAR",
    EMBER = "EMBER",
    WEB_COMPONENTS = "WEB_COMPONENTS",
    HTML = "HTML",
    QWIK = "QWIK",
    PREACT = "PREACT",
    SVELTE = "SVELTE",
    SVELTEKIT = "SVELTEKIT",
    SERVER = "SERVER",
    NX = "NX",
    SOLID = "SOLID"
}
declare enum CoreBuilder {
    Webpack5 = "webpack5",
    Vite = "vite"
}
declare enum CoreWebpackCompilers {
    Babel = "babel",
    SWC = "swc"
}
declare enum CommunityBuilder {
    Rsbuild = "rsbuild"
}
declare const compilerNameToCoreCompiler: Record<string, CoreWebpackCompilers>;
declare const builderNameToCoreBuilder: Record<string, CoreBuilder>;
type Builder = CoreBuilder | (string & {});
declare enum SupportedLanguage {
    JAVASCRIPT = "javascript",
    TYPESCRIPT_3_8 = "typescript-3-8",
    TYPESCRIPT_4_9 = "typescript-4-9"
}
type TemplateMatcher = {
    files?: boolean[];
    dependencies?: boolean[];
    peerDependencies?: boolean[];
};
type TemplateConfiguration = {
    preset: ProjectType;
    /** Will be checked both against dependencies and devDependencies */
    dependencies?: string[] | {
        [dependency: string]: (version: string) => boolean;
    };
    peerDependencies?: string[] | {
        [dependency: string]: (version: string) => boolean;
    };
    files?: string[];
    matcherFunction: (matcher: TemplateMatcher) => boolean;
};
/**
 * Configuration to match a storybook preset template.
 *
 * This has to be an array sorted in order of specificity/priority. Reason: both REACT and
 * WEBPACK_REACT have react as dependency, therefore WEBPACK_REACT has to come first, as it's more
 * specific.
 */
declare const supportedTemplates: TemplateConfiguration[];
declare const unsupportedTemplate: TemplateConfiguration;
declare const installableProjectTypes: string[];

declare function detectFrameworkPreset(packageJson?: PackageJsonWithMaybeDeps): ProjectType | null;
/**
 * Attempts to detect which builder to use, by searching for a vite config file or webpack
 * installation. If neither are found it will choose the default builder based on the project type.
 *
 * @returns CoreBuilder
 */
declare function detectBuilder(packageManager: JsPackageManager, projectType: ProjectType): Promise<any>;
declare function isStorybookInstantiated(configDir?: string): boolean;
declare function detectPnp(): Promise<boolean>;
declare function detectLanguage(packageManager: JsPackageManager): Promise<SupportedLanguage>;
declare function detect(packageManager: JsPackageManager, options?: {
    force?: boolean;
    html?: boolean;
}): Promise<ProjectType | null>;

declare function readFileAsJson(jsonPath: string, allowComments?: boolean): any;
declare const writeFileAsJson: (jsonPath: string, content: unknown) => boolean;
/**
 * Detect if any babel dependencies need to be added to the project This is currently used by
 * react-native generator
 *
 * @example
 *
 * ```ts
 * const babelDependencies = await getBabelDependencies(
 *   packageManager,
 *   npmOptions,
 *   packageJson
 * ); // you can then spread the result when using installDependencies
 * installDependencies(npmOptions, [
 *   `@storybook/react@${storybookVersion}`,
 *   ...babelDependencies,
 * ]);
 * ```
 *
 * @param {Object} packageJson The current package.json so we can inspect its contents
 * @returns {Array} Contains the packages and versions that need to be installed
 */
declare function getBabelDependencies(packageManager: JsPackageManager, packageJson: PackageJsonWithDepsAndDevDeps): Promise<string[]>;
declare function addToDevDependenciesIfNotPresent(packageJson: PackageJson, name: string, packageVersion: string): void;
declare function copyTemplate(templateRoot: string, destination?: string): void;
type CopyTemplateFilesOptions = {
    packageManager: JsPackageManager;
    renderer: SupportedFrameworks | SupportedRenderers$1;
    language: SupportedLanguage;
    commonAssetsDir?: string;
    destination?: string;
    features: string[];
};
/** @deprecated Please use `frameworkToRenderer` from `@storybook/core-common` instead */
declare const frameworkToRenderer: Record<"angular" | "ember" | "experimental-nextjs-vite" | "html-vite" | "html-webpack5" | "nextjs" | "preact-vite" | "preact-webpack5" | "react-native-web-vite" | "react-vite" | "react-webpack5" | "server-webpack5" | "svelte-vite" | "svelte-webpack5" | "sveltekit" | "vue3-vite" | "vue3-webpack5" | "web-components-vite" | "web-components-webpack5" | "qwik" | "solid" | "nuxt" | "react-rsbuild" | "vue3-rsbuild" | "react" | "react-native" | "vue3" | "preact" | "svelte" | "html" | "web-components" | "server", SupportedRenderers$1 | "vue">;
declare const frameworkToDefaultBuilder: Record<SupportedFrameworks, CoreBuilder | CommunityBuilder>;
/**
 * Return the installed version of a package, or the coerced version specifier from package.json if
 * it's a dependency but not installed (e.g. in a fresh project)
 */
declare function getVersionSafe(packageManager: JsPackageManager, packageName: string): Promise<string | undefined>;
declare const cliStoriesTargetPath: () => Promise<"./src/stories" | "./stories">;
declare function copyTemplateFiles({ packageManager, renderer, language, destination, commonAssetsDir, features, }: CopyTemplateFilesOptions): Promise<void>;
declare function adjustTemplate(templatePath: string, templateData: Record<string, any>): Promise<void>;
declare function getStorybookVersionSpecifier(packageJson: PackageJsonWithDepsAndDevDeps): string | undefined;
declare function isNxProject(): Promise<string | undefined>;
declare function coerceSemver(version: string): semver.SemVer;
declare function hasStorybookDependencies(packageManager: JsPackageManager): Promise<boolean>;

declare const ANGULAR_JSON_PATH = "angular.json";
declare const compoDocPreviewPrefix: string;
declare const promptForCompoDocs: () => Promise<boolean>;
declare class AngularJSON {
    json: {
        projects: Record<string, {
            root: string;
            projectType: string;
            architect: Record<string, any>;
        }>;
    };
    constructor();
    get projects(): Record<string, {
        root: string;
        projectType: string;
        architect: Record<string, any>;
    }>;
    get projectsWithoutStorybook(): string[];
    get hasStorybookBuilder(): boolean;
    get rootProject(): {
        root: string;
        projectType: string;
        architect: Record<string, any>;
    } | null;
    getProjectSettingsByName(projectName: string): {
        root: string;
        projectType: string;
        architect: Record<string, any>;
    };
    getProjectName(): Promise<any>;
    addStorybookEntries({ angularProjectName, storybookFolder, useCompodoc, root, }: {
        angularProjectName: string;
        storybookFolder: string;
        useCompodoc: boolean;
        root: string;
    }): void;
    write(): void;
}

declare function getRendererDir(packageManager: JsPackageManager, renderer: SupportedFrameworks | SupportedRenderers): Promise<string>;

type NpmOptions = {
    skipInstall?: boolean;
    installAsDevDependencies?: boolean;
};

declare const SUPPORTED_ESLINT_EXTENSIONS: string[];
declare const findEslintFile: () => string | null;
declare function extractEslintInfo(packageManager: JsPackageManager): Promise<{
    hasEslint: boolean;
    isStorybookPluginInstalled: boolean;
    eslintConfigFile: string | null;
}>;
declare const normalizeExtends: (existingExtends: any) => string[];
declare function configureEslintPlugin(eslintFile: string | undefined, packageManager: JsPackageManager): Promise<void>;
declare const suggestESLintPlugin: () => Promise<boolean>;

export { ANGULAR_JSON_PATH, AngularJSON, type Builder, CommunityBuilder, CoreBuilder, CoreWebpackCompilers, type ExternalFramework, type NpmOptions, ProjectType, SUPPORTED_ESLINT_EXTENSIONS, SUPPORTED_RENDERERS, SupportedLanguage, type SupportedRenderers, type TemplateConfiguration, type TemplateMatcher, addToDevDependenciesIfNotPresent, adjustTemplate, builderNameToCoreBuilder, cliStoriesTargetPath, coerceSemver, compilerNameToCoreCompiler, compoDocPreviewPrefix, configureEslintPlugin, copyTemplate, copyTemplateFiles, detect, detectBuilder, detectFrameworkPreset, detectLanguage, detectPnp, externalFrameworks, extractEslintInfo, findEslintFile, frameworkToDefaultBuilder, frameworkToRenderer, getBabelDependencies, getRendererDir, getStorybookVersionSpecifier, getVersionSafe, hasStorybookDependencies, installableProjectTypes, isNxProject, isStorybookInstantiated, normalizeExtends, promptForCompoDocs, readFileAsJson, suggestESLintPlugin, supportedTemplates, unsupportedTemplate, writeFileAsJson };
