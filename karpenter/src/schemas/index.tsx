export const KARPENTER_SCHEMAS = [
  {
    'Nodeclass-schema': {
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
                httpEndpoint: { enum: ['enabled', 'disabled'] },
                httpProtocolIPv6: { enum: ['enabled', 'disabled'] },
                httpPutResponseHopLimit: { type: 'integer', minimum: 1 },
                httpTokens: { enum: ['required', 'optional'] },
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
                          enum: ['In', 'Exists', 'DoesNotExist'],
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
                    enum: [
                      'AMIsReady',
                      'SubnetsReady',
                      'SecurityGroupsReady',
                      'InstanceProfileReady',
                      'ValidationSucceeded',
                      'Ready',
                    ],
                  },
                  status: {
                    type: 'string',
                    enum: ['True', 'False', 'Unknown'],
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
                  enum: ['WhenEmpty', 'WhenUnderutilized', 'WhenEmptyOrUnderutilized'],
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
                      pattern: '^[0-9]+(s|m|h)$',
                    },
                    nodeClassRef: {
                      type: 'object',
                      required: ['name'],
                      properties: {
                        name: { type: 'string' },
                        kind: { const: 'EC2NodeClass' },
                        group: { const: 'karpenter.k8s.aws' },
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
                            enum: ['In', 'NotIn', 'Exists', 'DoesNotExist', 'Gt', 'Lt'],
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
                    enum: [
                      'ValidationSucceeded',
                      'NodeRegistrationHealthy',
                      'NodeClassReady',
                      'Ready',
                    ],
                  },
                  status: { enum: ['True', 'False', 'Unknown'] },
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
  },
];
