import * as React from 'react';
type LocalizationProviderComponent = ((props: LocalizationProviderProps & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The LocalizationProvider component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const LocalizationProvider: LocalizationProviderComponent;
export default LocalizationProvider;
export type LocalizationProviderProps = Record<any, any>;
