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

import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Condition } from './common';

export interface KRevisionResource extends KubeObjectInterface {
  spec?: {
    containerConcurrency?: number;
  };
  status?: {
    conditions?: Condition[];
  };
}

export class KRevision extends KubeObject<KRevisionResource> {
  static kind = 'Revision';
  static apiName = 'revisions';
  static apiVersion = 'serving.knative.dev/v1';
  static isNamespaced = true;

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get readyCondition() {
    return this.status?.conditions?.find((c: Condition) => c.type === 'Ready');
  }

  get isReady(): boolean {
    return this.readyCondition?.status === 'True';
  }
}
