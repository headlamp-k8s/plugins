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

import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';
import type { Traffic } from './kservice';
import { getServingLabel } from './resourceData';

interface KnativeRouteResource extends KubeObjectInterface {
  spec?: {
    traffic?: Traffic[];
  };
  status?: ConditionedStatus & {
    url?: string;
    address?: { url?: string; name?: string };
    traffic?: Traffic[];
  };
}

export class KnativeRoute extends ConditionedKnativeCustomResource<KnativeRouteResource> {
  static kind = 'Route';
  static apiName = 'routes';
  static apiVersion = 'serving.knative.dev/v1';
  static isNamespaced = true;

  get url(): string | undefined {
    return this.status?.url || this.status?.address?.url;
  }

  get parentService(): string | undefined {
    return getServingLabel(this.metadata, 'serving.knative.dev/service');
  }

  get traffic(): Traffic[] {
    return this.status?.traffic || this.spec?.traffic || [];
  }
}
