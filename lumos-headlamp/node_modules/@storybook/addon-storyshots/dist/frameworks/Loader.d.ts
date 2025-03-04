/// <reference types="node" />
import type { Renderer, Addon_Loadable } from '@storybook/types';
import type { ClientApi as ClientApiClass } from '@storybook/preview-api';
import type { StoryshotsOptions } from '../api/StoryshotsOptions';
import type { SupportedFramework } from './SupportedFramework';
export type RenderTree = (story: any, context?: any, options?: any) => any;
export interface ClientApi<TRenderer extends Renderer> extends ClientApiClass<Renderer> {
    configure(loader: Addon_Loadable, module: NodeModule | false, showDeprecationWarning?: boolean): void;
    forceReRender(): void;
}
export interface Loader {
    load: (options: StoryshotsOptions) => {
        framework: SupportedFramework;
        renderTree: RenderTree;
        renderShallowTree: any;
        storybook: ClientApi<Renderer>;
    };
    test: (options: StoryshotsOptions) => boolean;
}
