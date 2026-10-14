/**
 * Copyright 2026 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A metric observed by Katib, with the minimum, maximum and latest values the
 * trial reported for it.
 * @see {@link https://github.com/kubeflow/katib/blob/master/pkg/apis/controller/common/v1beta1/common_types.go Katib Metric type}
 */
export interface KatibMetric {
  name?: string;
  min?: string;
  max?: string;
  latest?: string;
}

/**
 * Which observed value of a metric Katib uses: "min", "max" or "latest".
 */
export interface KatibMetricStrategy {
  name?: string;
  value?: string;
}

/**
 * The parts of a Katib objective needed to pick a metric's value.
 */
export interface KatibMetricObjective {
  type?: string;
  metricStrategies?: KatibMetricStrategy[];
}

/**
 * Returns the value Katib uses for a metric. The objective's metric strategy for
 * that metric picks min, max or latest; without one, Katib defaults to max for
 * maximize objectives, min for minimize objectives and latest otherwise.
 * @see {@link https://github.com/kubeflow/katib/blob/master/pkg/apis/controller/experiments/v1beta1/experiment_defaults.go Katib metric strategy defaults}
 */
export function getKatibMetricValue(
  metric: KatibMetric | undefined,
  objective?: KatibMetricObjective
): string {
  if (!metric) {
    return '';
  }

  const defaultStrategy =
    objective?.type === 'maximize' ? 'max' : objective?.type === 'minimize' ? 'min' : 'latest';
  const strategy =
    objective?.metricStrategies?.find(item => item.name === metric.name)?.value ?? defaultStrategy;
  const value = strategy === 'max' ? metric.max : strategy === 'min' ? metric.min : metric.latest;

  return value ?? metric.latest ?? '';
}
