import { LoaderContext } from 'webpack';
import { TransformOptions } from '@babel/core';

declare function reactDocgenLoader(this: LoaderContext<{
    babelOptions: TransformOptions;
    debug: boolean;
}>, source: string): Promise<void>;

export { reactDocgenLoader as default };
