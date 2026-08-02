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

import { Router } from '@kinvolk/headlamp-plugin/lib';

type KnativeResourceClass = {
  kind: string;
  apiName: string;
  apiVersion: string | string[];
  isNamespaced: boolean;
};

export function getKnativeCrdName(resourceClass: KnativeResourceClass): string {
  const apiVersion = Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion[0]
    : resourceClass.apiVersion;
  const group = apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
  return group ? `${resourceClass.apiName}.${group}` : resourceClass.apiName;
}

export function getKnativeCustomResourceDetailsLink({
  resourceClass,
  name,
  namespace,
  cluster,
}: {
  resourceClass: KnativeResourceClass;
  name: string;
  namespace?: string;
  cluster?: string;
}): string {
  return Router.createRouteURL('customresource', {
    cluster,
    crd: getKnativeCrdName(resourceClass),
    namespace: resourceClass.isNamespaced ? namespace || 'default' : '-',
    crName: name,
  });
}

export function getKnativeCustomResourceListLink({
  resourceClass,
  cluster,
}: {
  resourceClass: KnativeResourceClass;
  cluster?: string;
}): string {
  return Router.createRouteURL('customresources', {
    cluster,
    crd: getKnativeCrdName(resourceClass),
  });
}
