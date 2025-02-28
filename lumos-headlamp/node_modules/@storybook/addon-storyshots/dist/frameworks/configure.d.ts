import type { Renderer } from '@storybook/types';
import type { ClientApi } from './Loader';
import type { StoryshotsOptions } from '../api/StoryshotsOptions';
export declare const getPreviewFile: (configDir: string) => string | false;
export declare const getMainFile: (configDir: string) => string | false;
declare function configure<TRenderer extends Renderer>(options: {
    storybook: ClientApi<TRenderer>;
} & StoryshotsOptions): void;
export default configure;
