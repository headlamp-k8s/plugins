export interface PluginOptions {
    /**
     * The name of this plugin class. Defaults to this.constructor.name.
     */
    name?: string;
    /**
     * A descriptive annotation. Useful for debugging, to tell multiple instances of the same plugin apart.
     */
    annotation?: string;
    /**
     * If true, the output directory is not automatically emptied between builds.
     */
    persistentOutput?: boolean;
    /**
     * If true, a cache directory is created automatically and the path is set at cachePath.
     * If false, a cache directory is not created and this.cachePath is undefined. Defaults to true
     */
    needsCache?: boolean;
    /**
     * If true, memoization will not be applied and the build method will always be called regardless if the inputNodes have changed. Defaults to false.
     */
    volatile?: boolean;
    /**
     * If true, a change object will be passed to the build method which contains
     * information about which input has changed since the last build. Defaults to false.
     */
    trackInputChanges?: boolean;
}
export declare type MapSeriesIterator<T> = (item: T, index: number, array: T[]) => Promise<T> | T;
