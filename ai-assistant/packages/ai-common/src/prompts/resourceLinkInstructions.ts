/*
 * Copyright 2025 The Kubernetes Authors
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

/**
 * Prompt link instructions for AI prompts.
 *
 * This module is Node.js-safe — it contains only string constants with no
 * dependency on `@kinvolk/headlamp-plugin` or browser globals.
 *
 * The companion `getHeadlampLink` helper that resolves actual Headlamp
 * navigation URLs lives in the plugin's own source tree (it needs access to
 * `@kinvolk/headlamp-plugin` and `window`), not in this package.
 */

const HEADLAMP_LINK_HOST = 'headlamp';
const HEADLAMP_RESOURCE_DETAILS_LINK = 'resource-details';
const HEADLAMP_CLUSTER_LINK = 'cluster';

/**
 * Instructions that tell prompts how to format Headlamp resource and cluster links.
 */
export const resourceLinkInstructions = `RESOURCE LINKING:
- When you mention a Kubernetes resource (such as a Pod, Deployment, Service, etc.) in your response, ALWAYS format the resource name as a markdown link using this pattern:
  [RESOURCE_NAME](https://${HEADLAMP_LINK_HOST}/${HEADLAMP_RESOURCE_DETAILS_LINK}?cluster=CLUSTER&kind=KIND&resource=RESOURCE_NAME&ns=NAMESPACE)
- Always use the resource name as the markdown link text, not the cluster, namespace, or kind.
- Replace RESOURCE_NAME, CLUSTER, KIND, and NAMESPACE (only for namespaced resources) with the actual values for the resource.
- NEVER surround links with backquotes (\`)!
- When you mention an existing cluster, ALWAYS format the cluster name as a markdown link using this pattern:
  [CLUSTER_NAME](https://${HEADLAMP_LINK_HOST}/${HEADLAMP_CLUSTER_LINK}?cluster=CLUSTER)
`;
