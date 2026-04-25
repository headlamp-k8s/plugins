/**
 * Configuration object for chart settings.
 *
 * @property chartURLPrefix - The prefix for chart URLs.
 * @property chartProfile - The profile for charts.
 * @property chartValuesPrefix - The prefix for chart values.
 * @property catalogNamespace - The namespace for the catalog.
 * @property catalogName - The name of the catalog.
 */
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

/**
 * Sets the prefix for chart values in the catalog configuration.
 * @param valuesPrefix - The prefix to be used for chart values.
 * @param valuesPrefix - The new prefix for chart values.
 */
export function setChartValuesPrefix(valuesPrefix: string) {
  catalogConfig.chartValuesPrefix = valuesPrefix;
}

/**
 * Updates the catalog configuration with the provided partial configuration.
 *
 * @param update - A partial ChartConfig object containing the properties to be updated.
 */
export function setCatalogConfig(update: Partial<ChartConfig>) {
  Object.assign(catalogConfig, update);
}

/**
 * Retrieves the current catalog configuration.
 *
 * @returns {Readonly<ChartConfig>} The current catalog configuration.
 */
export function getCatalogConfig(): Readonly<ChartConfig> {
  return catalogConfig;
}
