import webpack__default, { Configuration, Stats } from 'webpack';
import { O as Options$1, B as Builder } from './index.d-7a1d21bc.js';
import { StorybookConfig, Options, BuilderResult as BuilderResult$1, TypescriptOptions as TypescriptOptions$1 } from '@storybook/core-webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import 'file-system-cache';
import '@babel/core';
import 'express';
import 'http';

type TypeScriptOptionsBase = Partial<TypescriptOptions$1>;
/**
 * Options for TypeScript usage within Storybook.
 */
interface TypescriptOptions extends TypeScriptOptionsBase {
    /**
     * Configures `fork-ts-checker-webpack-plugin`
     */
    checkOptions?: ConstructorParameters<typeof ForkTsCheckerWebpackPlugin>[0];
}
interface StorybookConfigWebpack extends Omit<StorybookConfig, 'webpack' | 'webpackFinal'> {
    /**
     * Modify or return a custom Webpack config after the Storybook's default configuration
     * has run (mostly used by addons).
     */
    webpack?: (config: Configuration, options: Options) => Configuration | Promise<Configuration>;
    /**
     * Modify or return a custom Webpack config after every addon has run.
     */
    webpackFinal?: (config: Configuration, options: Options) => Configuration | Promise<Configuration>;
}
type BuilderOptions = {
    fsCache?: boolean;
    useSWC?: boolean;
    lazyCompilation?: boolean;
};
interface BuilderResult extends BuilderResult$1 {
    stats?: Stats;
}

declare const getVirtualModules: (options: Options$1) => Promise<{
    virtualModules: Record<string, string>;
    entries: string[];
}>;

declare const printDuration: (startTime: [number, number]) => string;
type WebpackBuilder = Builder<Configuration, Stats>;
type BuilderStartOptions = Parameters<WebpackBuilder['start']>['0'];
declare const executor: {
    get: (options: Options$1) => Promise<typeof webpack__default>;
};
declare const getConfig: WebpackBuilder['getConfig'];
declare const bail: WebpackBuilder['bail'];
declare const start: (options: BuilderStartOptions) => Promise<void | {
    stats?: Stats | undefined;
    totalTime: [number, number];
    bail: (e?: Error | undefined) => Promise<void>;
}>;
declare const build: (options: BuilderStartOptions) => Promise<void | Stats>;
declare const corePresets: string[];
declare const overridePresets: string[];

export { BuilderOptions, BuilderResult, StorybookConfigWebpack, TypescriptOptions, bail, build, corePresets, executor, getConfig, getVirtualModules, overridePresets, printDuration, start };
