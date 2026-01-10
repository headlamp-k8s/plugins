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

import { INGRESS_CLASS_GATEWAY_API } from '../../../../../config/ingress';
import GatewayApiIngressSection from './ingress/gateway-api/GatewayApiIngressSection';

type IngressIntegrationsSectionProps = {
  namespace: string;
  serviceName: string;
  ingressClass: string | null;
  ingressClassLoaded: boolean;
  cluster: string;
};

/**
 * Renders ingress-specific integration sections based on the configured ingress class.
 *
 * To add support for additional ingress providers (e.g., Contour, Istio):
 * 1. Create a new component (e.g., ContourIngressSection.tsx, IstioIngressSection.tsx)
 * 2. Import it in this file
 * 3. Add a case in the switch statement below to handle the new ingress class value
 */
export default function IngressIntegrationsSection({
  namespace,
  serviceName,
  ingressClass,
  ingressClassLoaded,
  cluster,
}: IngressIntegrationsSectionProps) {
  // Only render when ingress class is loaded
  if (!ingressClassLoaded) {
    return null;
  }

  switch (ingressClass) {
    case INGRESS_CLASS_GATEWAY_API:
      return (
        <GatewayApiIngressSection
          namespace={namespace}
          serviceName={serviceName}
          cluster={cluster}
        />
      );

    // Future: Add other ingress providers here
    // case INGRESS_CLASS_CONTOUR:
    //   return <ContourIngressSection namespace={namespace} serviceName={serviceName} />;
    // case INGRESS_CLASS_ISTIO:
    //   return <IstioIngressSection namespace={namespace} serviceName={serviceName} />;

    default:
      // No matching ingress provider found
      return null;
  }
}
