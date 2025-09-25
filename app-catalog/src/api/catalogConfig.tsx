declare global {
  var CHART_URL_PREFIX: string;
  var CHART_PROFILE: string;
  var CHART_VALUES_PREFIX: string;
  var CATALOG_NAMESPACE: string;
  var CATALOG_NAME: string;
}

export type ChartConfig = {
  chartURLPrefix: string;
  chartProfile: string;
  chartValuesPrefix: string;
  catalogNamespace: string;
  catalogName: string;
};

const catalogConfig: ChartConfig = {
  chartURLPrefix: '',
  chartProfile: '',
  chartValuesPrefix: '',
  catalogNamespace: '',
  catalogName: '',
};

export function setChartValuesPrefix(valuesPrefix: string) {
  catalogConfig.chartValuesPrefix = valuesPrefix;
}

export function setCatalogConfig(update: Partial<ChartConfig>) {
  Object.assign(catalogConfig, update);
}

export function getCatalogConfig(): Readonly<ChartConfig> {
  return catalogConfig;
}
