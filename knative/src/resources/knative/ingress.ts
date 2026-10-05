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
import { collectIngressHosts, getFirstOwner } from './resourceData';

interface KnativeIngressResource extends KubeObjectInterface {
  spec?: {
    httpOption?: string;
    rules?: Array<{
      hosts?: string[];
      visibility?: string;
      http?: {
        paths?: Array<{
          splits?: Array<{
            percent?: number;
            serviceName?: string;
            serviceNamespace?: string;
          }>;
        }>;
      };
    }>;
    tls?: Array<{
      hosts?: string[];
      secretName?: string;
      secretNamespace?: string;
    }>;
  };
  status?: ConditionedStatus;
}

export class KnativeIngress extends ConditionedKnativeCustomResource<KnativeIngressResource> {
  static kind = 'Ingress';
  static apiName = 'ingresses';
  static apiVersion = 'networking.internal.knative.dev/v1alpha1';
  static isNamespaced = true;

  get hosts(): string[] {
    return collectIngressHosts(this.spec?.rules);
  }

  get owner() {
    return getFirstOwner(this.metadata);
  }
}
