/**
 * Karpenter Schema Documentation
 *
 * This schema was derived from:
 * 1. Official Karpenter Documentation:
 *    - https://karpenter.sh/docs/getting-started/
 *    - https://karpenter.sh/docs/getting-started/getting-started-with-karpenter/
 *    - https://karpenter.sh/docs/concepts/nodeclasses/
 *    - https://karpenter.sh/docs/concepts/nodepools/
 *
 * 2. Examining the actual CRD configurations and jsonData:
 *    - EC2NodeClass CRD (karpenter.k8s.aws/v1)
 *    - NodePool CRD (karpenter.sh/v1)
 *    - AKSNodeClass CRD (karpenter.azure.com/v1beta1)
 *
 * 3. Actual CRD definitions:
 *    - EC2NodeClass CRD: https://github.com/aws/karpenter-provider-aws/blob/main/pkg/apis/v1/ec2nodeclass.go
 *    - AKSNodeClass CRD: https://github.com/Azure/karpenter-provider-azure/blob/main/pkg/apis/v1beta1/aksnodeclass.go
 *
 * Note: There is no official JSON schema documentation from Karpenter.
 * The schema here represents our best understanding of the valid configurations
 *
 * To update this schema in the future:
 * 1. Check the CRD definitions for any new/changed fields
 * 2. Review any schema changes in new Karpenter releases:
 *    - https://github.com/aws/karpenter-provider-aws/releases
 *    - https://github.com/Azure/karpenter-provider-azure/releases
 *
 */

export const KARPENTER_SCHEMAS = {
  'EC2NodeClass-schema': {
    type: 'object',
    properties: {
      apiVersion: { const: 'karpenter.k8s.aws/v1' },
      kind: { const: 'EC2NodeClass' },
      metadata: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$' },
          annotations: {
            type: 'object',
            properties: {
              'karpenter.k8s.aws/ec2nodeclass-hash': { type: 'string' },
              'karpenter.k8s.aws/ec2nodeclass-hash-version': { type: 'string' },
              'kubectl.kubernetes.io/last-applied-configuration': { type: 'string' },
            },
          },
          finalizers: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      spec: {
        type: 'object',
        required: ['subnetSelectorTerms', 'securityGroupSelectorTerms'],
        properties: {
          amiSelectorTerms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                alias: { type: 'string' },
                id: { type: 'string' },
                name: { type: 'string' },
                owner: { type: 'string' },
                tags: { type: 'object' },
              },
            },
          },
          metadataOptions: {
            type: 'object',
            properties: {
              httpEndpoint: { type: 'string' },
              httpProtocolIPv6: { type: 'string' },
              httpPutResponseHopLimit: { type: 'integer', minimum: 1 },
              httpTokens: { type: 'string' },
            },
          },
          role: { type: 'string' },
          instanceProfile: { type: 'string' },
          subnetSelectorTerms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tags: { type: 'object' },
                id: { type: 'string' },
              },
            },
          },
          securityGroupSelectorTerms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tags: { type: 'object' },
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      status: {
        type: 'object',
        properties: {
          subnets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                zone: { type: 'string' },
                zoneID: { type: 'string' },
              },
            },
          },
          securityGroups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          amis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                requirements: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      operator: {
                        type: 'string',
                      },
                      values: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          instanceProfile: { type: 'string' },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'status'],
              properties: {
                type: {
                  type: 'string',
                },
                status: {
                  type: 'string',
                },
                lastTransitionTime: { type: 'string', format: 'date-time' },
                message: { type: 'string' },
                reason: { type: 'string' },
                observedGeneration: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  'AKSNodeClass-schema': {
    type: 'object',
    properties: {
      apiVersion: { const: 'karpenter.azure.com/v1beta1' },
      kind: { const: 'AKSNodeClass' },
      metadata: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$' },
          annotations: {
            type: 'object',
            properties: {
              'karpenter.azure.com/aksnodeclass-hash': { type: 'string' },
              'karpenter.azure.com/aksnodeclass-hash-version': { type: 'string' },
              'kubectl.kubernetes.io/last-applied-configuration': { type: 'string' },
            },
          },
          finalizers: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      spec: {
        type: 'object',
        required: ['imageFamily'],
        properties: {
          imageFamily: {
            type: 'string',
          },
          osDiskSizeGB: {
            type: 'integer',
            minimum: 30,
            maximum: 2048,
          },
          tags: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          osDiskPolicy: {
            type: 'string',
          },
          userData: {
            type: 'string',
          },
        },
      },
      status: {
        type: 'object',
        properties: {
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'status'],
              properties: {
                type: {
                  type: 'string',
                },
                status: {
                  type: 'string',
                },
                lastTransitionTime: { type: 'string', format: 'date-time' },
                message: { type: 'string' },
                reason: { type: 'string' },
                observedGeneration: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  'Nodepool-schema': {
    type: 'object',
    properties: {
      apiVersion: { const: 'karpenter.sh/v1' },
      kind: { const: 'NodePool' },
      metadata: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$' },
          annotations: {
            type: 'object',
            properties: {
              'karpenter.sh/nodepool-hash': { type: 'string' },
              'karpenter.sh/nodepool-hash-version': { type: 'string' },
              'kubectl.kubernetes.io/last-applied-configuration': { type: 'string' },
            },
          },
        },
      },
      spec: {
        type: 'object',
        required: ['template'],
        properties: {
          disruption: {
            type: 'object',
            properties: {
              budgets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nodes: { type: 'string', pattern: '^[0-9]+%?$' },
                  },
                },
              },
              consolidateAfter: {
                type: 'string',
                pattern: '^[0-9]+(s|m|h)$',
              },
              consolidationPolicy: {
                type: 'string',
              },
            },
          },
          limits: {
            type: 'object',
            properties: {
              cpu: { type: 'number', minimum: 0 },
              memory: { type: 'string', pattern: '^[0-9]+(Gi|Mi)?$' },
            },
          },
          template: {
            type: 'object',
            required: ['spec'],
            properties: {
              spec: {
                type: 'object',
                required: ['nodeClassRef', 'requirements'],
                properties: {
                  expireAfter: {
                    type: 'string',
                  },
                  nodeClassRef: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: { type: 'string' },
                      kind: { type: 'string' },
                      group: { type: 'string' },
                    },
                  },
                  requirements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['key', 'operator'],
                      properties: {
                        key: { type: 'string' },
                        operator: {
                          type: 'string',
                        },
                        values: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      status: {
        type: 'object',
        properties: {
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'status'],
              properties: {
                type: {
                  type: 'string',
                },
                status: { type: 'string' },
                lastTransitionTime: { type: 'string', format: 'date-time' },
                message: { type: 'string' },
                reason: { type: 'string' },
                observedGeneration: { type: 'integer' },
              },
            },
          },
          nodeClassObservedGeneration: { type: 'integer' },
          resources: {
            type: 'object',
            properties: {
              cpu: { type: 'string' },
              memory: { type: 'string' },
              ephemeralStorage: { type: 'string' },
              nodes: { type: 'string' },
              pods: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const getSchemaKey = (cloudProvider?: string, resourceKind?: string): string => {
  if (resourceKind) {
    const schemaKey = `${resourceKind}-schema`;
    if (KARPENTER_SCHEMAS[schemaKey]) {
      return schemaKey;
    }
  }

  switch (cloudProvider) {
    case 'AWS':
      return 'EC2NodeClass-schema';
    case 'AZURE':
      return 'AKSNodeClass-schema';
    default:
      return 'EC2NodeClass-schema';
  }
};
