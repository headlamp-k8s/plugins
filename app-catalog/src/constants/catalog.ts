export const VANILLA_HELM_REPO = 'VANILLA_HELM_REPOSITORY';
export const COMMUNITY_REPO = 'COMMUNITY_REPOSITORY';
// Replace the token with the URL prefix to values.yaml for a component on ${CUSTOM_CHART_VALUES_PREFIX}/${packageID}/${packageVersion}/values.yaml
// This is used only for the catalog provided by a vanilla Helm repository.
// For the default behavior when this token is not replaced during deployment, please take a look at the global variable CHART_VALUES_PREFIX and its
// usage in src/api/catalogs.tsx
export const CUSTOM_CHART_VALUES_PREFIX = 'CUSTOM_CHART_VALUES_PREFIX';

// The name of the helm repository added before installing an application, while using vanilla helm repository
export const APP_CATALOG_HELM_REPOSITORY = 'app-catalog';

export const PAGE_OFFSET_COUNT_FOR_CHARTS = 9;

// Constants for the supported protocols
export const HELM_PROTOCOL = 'helm';
export const ARTIFACTHUB_PROTOCOL = 'artifacthub';
