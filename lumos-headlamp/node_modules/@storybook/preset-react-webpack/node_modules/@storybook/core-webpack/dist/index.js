"use strict";var __create=Object.create;var __defProp=Object.defineProperty;var __getOwnPropDesc=Object.getOwnPropertyDescriptor;var __getOwnPropNames=Object.getOwnPropertyNames;var __getProtoOf=Object.getPrototypeOf,__hasOwnProp=Object.prototype.hasOwnProperty;var __export=(target,all)=>{for(var name in all)__defProp(target,name,{get:all[name],enumerable:!0})},__copyProps=(to,from,except,desc)=>{if(from&&typeof from=="object"||typeof from=="function")for(let key of __getOwnPropNames(from))!__hasOwnProp.call(to,key)&&key!==except&&__defProp(to,key,{get:()=>from[key],enumerable:!(desc=__getOwnPropDesc(from,key))||desc.enumerable});return to};var __toESM=(mod,isNodeMode,target)=>(target=mod!=null?__create(__getProtoOf(mod)):{},__copyProps(isNodeMode||!mod||!mod.__esModule?__defProp(target,"default",{value:mod,enumerable:!0}):target,mod)),__toCommonJS=mod=>__copyProps(__defProp({},"__esModule",{value:!0}),mod);var src_exports={};__export(src_exports,{checkWebpackVersion:()=>checkWebpackVersion,loadCustomWebpackConfig:()=>loadCustomWebpackConfig,mergeConfigs:()=>mergeConfigs,toImportFn:()=>toImportFn,toImportFnPart:()=>toImportFnPart,toRequireContext:()=>toRequireContext,toRequireContextString:()=>toRequireContextString,webpackIncludeRegexp:()=>webpackIncludeRegexp});module.exports=__toCommonJS(src_exports);var import_path=__toESM(require("path")),import_core_common=require("@storybook/core-common"),webpackConfigs=["webpack.config","webpackfile"],loadCustomWebpackConfig=configDir=>(0,import_core_common.serverRequire)(webpackConfigs.map(configName=>import_path.default.resolve(configDir,configName)));var import_node_logger=require("@storybook/node-logger"),import_ts_dedent=require("ts-dedent"),checkWebpackVersion=(webpack,specifier,caption)=>{if(!webpack.version){import_node_logger.logger.info("Skipping webpack version check, no version available");return}webpack.version!==specifier&&import_node_logger.logger.warn(import_ts_dedent.dedent`
      Unexpected webpack version in ${caption}:
      - Received '${webpack.version}'
      - Expected '${specifier}'

      If you're using Webpack 5 in SB6.2 and upgrading, consider: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#webpack-5-manager-build

      For more info about Webpack 5 support: https://gist.github.com/shilman/8856ea1786dcd247139b47b270912324#troubleshooting
    `)};function mergePluginsField(defaultPlugins=[],customPlugins=[]){return[...defaultPlugins,...customPlugins]}function mergeRulesField(defaultRules=[],customRules=[]){return[...defaultRules,...customRules]}function mergeExtensionsField({extensions:defaultExtensions=[]},{extensions:customExtensions=[]}){return[...defaultExtensions,...customExtensions]}function mergeAliasField({alias:defaultAlias={}},{alias:customAlias={}}){return{...defaultAlias,...customAlias}}function mergeModuleField(a,b){return{...a,...b,rules:mergeRulesField(a.rules||[],b.rules||[])}}function mergeResolveField({resolve:defaultResolve={}},{resolve:customResolve={}}){return{...defaultResolve,...customResolve,alias:mergeAliasField(defaultResolve,customResolve),extensions:mergeExtensionsField(defaultResolve,customResolve)}}function mergeOptimizationField({optimization:defaultOptimization={}},{optimization:customOptimization={}}){return{...defaultOptimization,...customOptimization}}function mergeConfigs(config,customConfig){return{...customConfig,...config,devtool:customConfig.devtool||config.devtool,plugins:mergePluginsField(config.plugins,customConfig.plugins),module:mergeModuleField(config.module||{},customConfig.module||{}),resolve:mergeResolveField(config,customConfig),optimization:mergeOptimizationField(config,customConfig)}}var import_ts_dedent2=require("ts-dedent"),import_core_common2=require("@storybook/core-common");function importPipeline(){let importGate=Promise.resolve();return async importFn=>{await importGate;let moduleExportsPromise=importFn();return importGate=importGate.then(async()=>{await moduleExportsPromise}),moduleExportsPromise}}function webpackIncludeRegexp(specifier){let{directory,files}=specifier,directoryWithoutLeadingDots=directory.replace(/^(\.+\/)+/,"/"),webpackIncludeGlob=[".",".."].includes(directory)?files:`${directoryWithoutLeadingDots}/${files}`,webpackIncludeRegexpWithCaret=(0,import_core_common2.globToRegexp)(webpackIncludeGlob);return new RegExp(webpackIncludeRegexpWithCaret.source.replace(/^\^/,""))}function toImportFnPart(specifier){let{directory,importPathMatcher}=specifier;return import_ts_dedent2.dedent`
      async (path) => {
        if (!${importPathMatcher}.exec(path)) {
          return;
        }

        const pathRemainder = path.substring(${directory.length+1});
        return import(
          /* webpackChunkName: "[request]" */
          /* webpackInclude: ${webpackIncludeRegexp(specifier)} */
          '${directory}/' + pathRemainder
        );
      }

  `}function toImportFn(stories,{needPipelinedImport}={}){let pipelinedImport="const pipeline = (x) => x();";return needPipelinedImport&&(pipelinedImport=`
      const importPipeline = ${importPipeline};
      const pipeline = importPipeline();
    `),import_ts_dedent2.dedent`
    ${pipelinedImport}

    const importers = [
      ${stories.map(toImportFnPart).join(`,
`)}
    ];

    export async function importFn(path) {
      for (let i = 0; i < importers.length; i++) {
        const moduleExports = await pipeline(() => importers[i](path));
        if (moduleExports) {
          return moduleExports;
        }
      }
    }
  `}var import_core_common3=require("@storybook/core-common"),toRequireContext=specifier=>{let{directory,files}=specifier,match=(0,import_core_common3.globToRegexp)(`./${files}`);return{path:directory,recursive:files.includes("**")||files.split("/").length>1,match}},toRequireContextString=specifier=>{let{path:p,recursive:r,match:m}=toRequireContext(specifier);return`require.context('${p}', ${r}, ${m})`};0&&(module.exports={checkWebpackVersion,loadCustomWebpackConfig,mergeConfigs,toImportFn,toImportFnPart,toRequireContext,toRequireContextString,webpackIncludeRegexp});
