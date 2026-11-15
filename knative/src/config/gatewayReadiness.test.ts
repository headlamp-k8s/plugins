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

import { evaluateGatewayReadiness, evaluateServiceReadiness } from './gatewayReadiness';

describe('evaluateGatewayReadiness', () => {
  it('is ready when the Gateway is accepted and programmed', () => {
    expect(
      evaluateGatewayReadiness({
        addresses: [{ value: '192.0.2.10' }],
        conditions: [
          { type: 'Accepted', status: 'True' },
          { type: 'Programmed', status: 'True' },
        ],
      })
    ).toEqual({
      state: 'ready',
      summary: 'Accepted and programmed.',
      addresses: ['192.0.2.10'],
    });
  });

  it('uses the Programmed failure reason when an address is not assigned', () => {
    const programmed = {
      type: 'Programmed',
      status: 'False',
      reason: 'AddressNotAssigned',
      message: 'No addresses have been assigned to the Gateway',
    };

    expect(
      evaluateGatewayReadiness({
        conditions: [{ type: 'Accepted', status: 'True' }, programmed],
      })
    ).toEqual({
      state: 'not-ready',
      summary: 'Programmed=False.',
      condition: programmed,
      addresses: [],
    });
  });

  it('is unknown while required conditions are missing or unknown', () => {
    expect(evaluateGatewayReadiness(undefined)).toMatchObject({
      state: 'unknown',
      summary: 'Waiting for Gateway conditions: Accepted, Programmed.',
    });
    expect(
      evaluateGatewayReadiness({
        conditions: [
          { type: 'Accepted', status: 'True' },
          { type: 'Programmed', status: 'Unknown', reason: 'Pending' },
        ],
      })
    ).toMatchObject({ state: 'unknown', summary: 'Programmed=Unknown.' });
  });
});

describe('evaluateServiceReadiness', () => {
  it('reports an assigned LoadBalancer address', () => {
    expect(
      evaluateServiceReadiness({
        spec: { type: 'LoadBalancer', ports: [{ port: 80, nodePort: 30080 }] },
        status: { loadBalancer: { ingress: [{ ip: '192.0.2.20' }] } },
      })
    ).toEqual({
      state: 'ready',
      summary: 'External address assigned.',
      serviceType: 'LoadBalancer',
      addresses: ['192.0.2.20'],
      ports: ['80:30080/TCP'],
    });
  });

  it('reports a pending LoadBalancer without an external address', () => {
    expect(
      evaluateServiceReadiness({
        spec: { type: 'LoadBalancer', ports: [{ port: 80, nodePort: 30080 }] },
        status: { loadBalancer: {} },
      })
    ).toMatchObject({
      state: 'not-ready',
      summary: 'External address pending.',
      ports: ['80:30080/TCP'],
    });
  });

  it('accepts spec.externalIPs as LoadBalancer addresses', () => {
    expect(
      evaluateServiceReadiness({
        spec: { type: 'LoadBalancer', externalIPs: ['198.51.100.5'] },
      })
    ).toMatchObject({ state: 'ready', addresses: ['198.51.100.5'] });
  });

  it('uses assigned NodePorts without requiring a LoadBalancer address', () => {
    expect(
      evaluateServiceReadiness({
        spec: {
          type: 'NodePort',
          ports: [
            { port: 80, nodePort: 30080, protocol: 'TCP' },
            { port: 443, nodePort: 30443, protocol: 'TCP' },
          ],
        },
      })
    ).toEqual({
      state: 'ready',
      summary: 'NodePorts assigned.',
      serviceType: 'NodePort',
      addresses: [],
      ports: ['80:30080/TCP', '443:30443/TCP'],
    });
  });

  it('reports a NodePort with an unassigned port as pending', () => {
    expect(
      evaluateServiceReadiness({
        spec: { type: 'NodePort', ports: [{ port: 80 }] },
      })
    ).toMatchObject({ state: 'not-ready', summary: 'NodePort assignment pending.' });
  });

  it('uses the assigned ClusterIP for a local gateway Service', () => {
    expect(
      evaluateServiceReadiness({
        spec: { type: 'ClusterIP', clusterIP: '10.96.0.10', ports: [{ port: 80 }] },
      })
    ).toEqual({
      state: 'ready',
      summary: 'ClusterIP assigned.',
      serviceType: 'ClusterIP',
      addresses: ['10.96.0.10'],
      ports: ['80/TCP'],
    });
  });
});
