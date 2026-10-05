/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** InferenceService components that run their own pods. */
export type KServeComponent = 'predictor' | 'transformer' | 'explainer';

/** Rate window used by all rate() based queries. */
const RATE_WINDOW = '2m';

/**
 * Escapes a value for use inside a single-quoted PromQL string.
 * @param value - Raw label value.
 * @returns Value safe to embed between single quotes.
 */
function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/**
 * Escapes regular expression metacharacters so a name is matched literally.
 * @param value - Raw name.
 * @returns Regular expression source matching only the given name.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the label selector matching the pods of one InferenceService component.
 *
 * KServe names component pods `<service>-<component>-...` in both deployment modes:
 * `<service>-predictor-<hash>-<hash>` for raw deployments and
 * `<service>-predictor-0000N-deployment-<hash>-<hash>` for Knative (serverless) mode.
 * @param namespace - Namespace of the InferenceService.
 * @param serviceName - Name of the InferenceService.
 * @param component - Component whose pods should be selected.
 * @returns PromQL label matchers without surrounding braces.
 */
export function getKServePodSelector(
  namespace: string,
  serviceName: string,
  component: KServeComponent = 'predictor'
): string {
  const podRegex = `${escapeRegex(serviceName)}-${component}-.*`;
  return `namespace='${escapeLabelValue(namespace)}',pod=~'${escapeLabelValue(podRegex)}'`;
}

/**
 * Builds the PromQL queries for an InferenceService component.
 *
 * The request rate and latency queries use `request_predict_seconds`, a histogram exported by
 * KServe's Python model servers (the `kserve` ModelServer used by the sklearn, xgboost,
 * lightgbm, pmml, paddle and huggingface runtimes, and custom Python models). The same servers
 * also export `request_preprocess_seconds`, `request_postprocess_seconds` and
 * `request_explain_seconds`. Other runtimes such as vLLM, Triton and TorchServe expose
 * metrics under different names, so the request rate and latency charts show "no data" for
 * them; the resource charts use cAdvisor metrics and work for every runtime.
 *
 * Resource queries are summed across all pods of the component, because the shared chart
 * renders one series per query.
 * @param namespace - Namespace of the InferenceService.
 * @param serviceName - Name of the InferenceService.
 * @param component - Component whose pods should be queried.
 * @returns Queries for request rate, latency quantiles, CPU and memory.
 */
export function getKServeQueries(
  namespace: string,
  serviceName: string,
  component: KServeComponent = 'predictor'
) {
  const selector = getKServePodSelector(namespace, serviceName, component);
  const containerSelector = `${selector},container!=''`;
  const latency = (quantile: number) =>
    `histogram_quantile(${quantile}, sum(rate(request_predict_seconds_bucket{${selector}}[${RATE_WINDOW}])) by (le))`;

  return {
    requestRate: `sum(rate(request_predict_seconds_count{${selector}}[${RATE_WINDOW}]))`,
    latencyP50: latency(0.5),
    latencyP95: latency(0.95),
    latencyP99: latency(0.99),
    cpu: `sum(rate(container_cpu_usage_seconds_total{${containerSelector}}[${RATE_WINDOW}]))`,
    memory: `sum(container_memory_working_set_bytes{${containerSelector}})`,
  };
}
