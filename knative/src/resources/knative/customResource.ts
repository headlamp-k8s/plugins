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
import {
  getKnativeCustomResourceDetailsLink,
  getKnativeCustomResourceListLink,
} from './customResourceLinks';

export { getKnativeCrdName } from './customResourceLinks';

/**
 * Routes CRD instances to Headlamp's standard Custom Resource list and detail views, unless the
 * class names its own plugin routes in `detailsRoute` and `listRoute`.
 */
export abstract class KnativeCustomResource<T extends KubeObjectInterface> extends KubeObject<T> {
  get metadata() {
    return this.jsonData.metadata;
  }

  get spec(): T['spec'] {
    return this.jsonData.spec;
  }

  get status(): T['status'] {
    return this.jsonData.status;
  }

  /**
   * Builds the link to this resource's detail page.
   *
   * @returns The URL of the class's own detail route when it has one, otherwise of Headlamp's
   * Custom Resource detail view.
   */
  getDetailsLink(): string {
    if (this.detailsRoute !== this._class().kind) {
      return super.getDetailsLink();
    }
    return getKnativeCustomResourceDetailsLink({
      resourceClass: this._class(),
      name: this.getName(),
      namespace: this.getNamespace(),
      cluster: this.cluster,
    });
  }

  /**
   * Builds the link to the list of resources of this kind.
   *
   * @returns The URL of the class's own list route when it has one, otherwise of Headlamp's
   * Custom Resource list view.
   */
  getListLink(): string {
    if (this.listRoute !== this._class().apiName) {
      return super.getListLink();
    }
    return getKnativeCustomResourceListLink({
      resourceClass: this._class(),
      cluster: this.cluster,
    });
  }
}
