import type { StoryshotsOptions } from '../api/StoryshotsOptions';
declare function loadFramework(options: StoryshotsOptions): {
    framework: import("./SupportedFramework").SupportedFramework;
    renderTree: import("./Loader").RenderTree;
    renderShallowTree: any;
    storybook: import("./Loader").ClientApi<import("lib/types/dist").Renderer>;
};
export default loadFramework;
