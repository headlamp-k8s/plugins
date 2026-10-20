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

// Minimal stand-in for @kinvolk/headlamp-plugin's KubeObject, used only in tests.
//
// The real KubeObject lives under lib/lib/k8s/cluster.js, but importing it (even
// via an alias) pulls in the full k8s module barrel (ClusterRole, Pod, etc.),
// which fails to load outside of a full Headlamp app bootstrap. Resource classes
// only need jsonData/cluster bookkeeping from KubeObject, so this stub provides
// just that, letting resource classes (which mostly add typed getters over
// jsonData) be unit tested directly.
export class KubeObject<T = any> {
  jsonData: T;
  private _clusterName: string;

  constructor(json: T, cluster?: string) {
    this.jsonData = json;
    this._clusterName = cluster || '';
  }

  get cluster() {
    return this._clusterName;
  }

  set cluster(cluster: string) {
    this._clusterName = cluster;
  }
}

export type KubeObjectInterface = Record<string, unknown>;
