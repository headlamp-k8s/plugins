import * as React from 'react';
import { DevtoolsErrorType } from '@tanstack/query-devtools';
import { QueryClient } from '@tanstack/react-query';

interface DevtoolsPanelOptions {
    /**
     * Custom instance of QueryClient
     */
    client?: QueryClient;
    /**
     * Use this so you can define custom errors that can be shown in the devtools.
     */
    errorTypes?: Array<DevtoolsErrorType>;
    /**
     * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
     */
    styleNonce?: string;
    /**
     * Use this so you can attach the devtool's styles to specific element in the DOM.
     */
    shadowDOMTarget?: ShadowRoot;
    /**
     * Custom styles for the devtools panel
     * @default { height: '500px' }
     * @example { height: '100%' }
     * @example { height: '100%', width: '100%' }
     */
    style?: React.CSSProperties;
    /**
     * Callback function that is called when the devtools panel is closed
     */
    onClose?: () => unknown;
}
declare function ReactQueryDevtoolsPanel(props: DevtoolsPanelOptions): React.ReactElement | null;

type DevtoolsPanel_DevtoolsPanelOptions = DevtoolsPanelOptions;
declare const DevtoolsPanel_ReactQueryDevtoolsPanel: typeof ReactQueryDevtoolsPanel;
declare namespace DevtoolsPanel {
  export { type DevtoolsPanel_DevtoolsPanelOptions as DevtoolsPanelOptions, DevtoolsPanel_ReactQueryDevtoolsPanel as ReactQueryDevtoolsPanel };
}

export { DevtoolsPanel as D, ReactQueryDevtoolsPanel as R, type DevtoolsPanelOptions as a };
