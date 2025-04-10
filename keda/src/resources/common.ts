export enum StatusConditionType {
  READY = 'Ready',
  ACTIVE = 'Active',
  FALLBACK = 'Fallback',
  PAUSED = 'Paused',
}

export enum StatusType {
  TRUE = 'True',
  FALSE = 'False',
  UNKNOWN = 'Unknown',
}

export type Conditions = Array<{
  type: StatusConditionType;
  status: StatusType;
  reason?: string;
  message?: string;
}>;

export enum KedaTriggerMetricType {
  AVERAGEVALUE = 'AverageValue',
  VALUE = 'Value',
  UTILIZATION = 'Utilization',
}

export interface KedaTrigger {
  name?: string;
  type: string;
  metadata: {
    [key: string]: string;
  };
  authenticationRef?: {
    name: string;
    kind?: string;
  };
  useCachedMetrics?: boolean;
  metricType?: KedaTriggerMetricType;
}
