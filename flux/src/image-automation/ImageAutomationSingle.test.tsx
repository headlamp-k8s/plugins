import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  imageRepositoryLink,
  ImageRepositoryRefResource,
  policyNameLink,
} from './ImageAutomationSingle';

vi.mock('../common/Resources', () => ({
  ImagePolicy: { pluralName: 'imagepolicies' },
  ImageRepository: { pluralName: 'imagerepositories' },
  ImageUpdateAutomation: { pluralName: 'imageupdateautomations' },
}));
vi.mock('../helpers/index', () => ({
  ObjectEvents: () => null,
}));
vi.mock('../actions/index', () => ({
  ResumeAction: () => null,
  SuspendAction: () => null,
  SyncAction: () => null,
}));
vi.mock('../common/StatusLabel', () => ({
  default: () => null,
}));

describe('imageRepositoryLink', () => {
  it('renders a HeadlampLink with explicit namespace and imagerepositories route', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: 'podinfo',
            namespace: 'custom-ns',
          },
        },
        metadata: {
          namespace: 'default',
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(true);

    const link = result as React.ReactElement<{
      routeName: string;
      params: { name: string; namespace: string; pluralName: string };
      children: React.ReactNode;
    }>;
    expect(link.props.routeName).toBe('image');
    expect(link.props.params).toEqual({
      name: 'podinfo',
      namespace: 'custom-ns',
      pluralName: 'imagerepositories',
    });
    expect(link.props.children).toBe('podinfo');
  });

  it('renders a HeadlampLink falling back to metadata.namespace when ref namespace is omitted', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: 'podinfo',
          },
        },
        metadata: {
          namespace: 'flux-system',
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(true);

    const link = result as React.ReactElement<{
      routeName: string;
      params: { name: string; namespace: string; pluralName: string };
      children: React.ReactNode;
    }>;
    expect(link.props.routeName).toBe('image');
    expect(link.props.params).toEqual({
      name: 'podinfo',
      namespace: 'flux-system',
      pluralName: 'imagerepositories',
    });
    expect(link.props.children).toBe('podinfo');
  });

  it('renders a HeadlampLink falling back to top-level metadata.namespace when jsonData metadata is missing', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: 'podinfo',
          },
        },
      },
      metadata: {
        namespace: 'fallback-ns',
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(true);

    const link = result as React.ReactElement<{
      routeName: string;
      params: { name: string; namespace: string; pluralName: string };
    }>;
    expect(link.props.params).toEqual({
      name: 'podinfo',
      namespace: 'fallback-ns',
      pluralName: 'imagerepositories',
    });
  });

  it('renders plain text name when both ref namespace and metadata namespace are missing', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: 'cluster-scoped-repo',
          },
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('cluster-scoped-repo');
  });

  it('renders plain text name when ref namespace is empty string', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: 'cluster-scoped-repo',
            namespace: '',
          },
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('cluster-scoped-repo');
  });

  it('renders fallback "-" when repository name is missing', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            namespace: 'flux-system',
          },
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('-');
  });

  it('renders fallback "-" when repository name is empty string', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {
          imageRepositoryRef: {
            name: '',
            namespace: 'flux-system',
          },
        },
      },
    };

    const result = imageRepositoryLink(resource);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('-');
  });

  it('renders fallback "-" when imageRepositoryRef is missing', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {
        spec: {},
      },
    };

    expect(imageRepositoryLink(resource)).toBe('-');
  });

  it('renders fallback "-" when spec is missing', () => {
    const resource: ImageRepositoryRefResource = {
      jsonData: {},
    };

    expect(imageRepositoryLink(resource)).toBe('-');
  });

  it('renders fallback "-" when resource is undefined or null', () => {
    expect(imageRepositoryLink(undefined)).toBe('-');
    expect(imageRepositoryLink(null)).toBe('-');
  });
});

describe('policyNameLink', () => {
  it('renders a HeadlampLink with name, namespace, and imagepolicies route', () => {
    const result = policyNameLink('latest-semver', 'flux-system');
    expect(React.isValidElement(result)).toBe(true);

    const link = result as React.ReactElement<{
      routeName: string;
      params: { name: string; namespace: string; pluralName: string };
      children: React.ReactNode;
    }>;
    expect(link.props.routeName).toBe('image');
    expect(link.props.params).toEqual({
      name: 'latest-semver',
      namespace: 'flux-system',
      pluralName: 'imagepolicies',
    });
    expect(link.props.children).toBe('latest-semver');
  });

  it('renders plain text policy name when namespace is undefined', () => {
    const result = policyNameLink('latest-semver', undefined);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('latest-semver');
  });

  it('renders plain text policy name when namespace is empty string', () => {
    const result = policyNameLink('latest-semver', '');
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('latest-semver');
  });

  it('renders fallback "-" when policy name is undefined', () => {
    const result = policyNameLink(undefined, 'flux-system');
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('-');
  });

  it('renders fallback "-" when policy name is empty string', () => {
    const result = policyNameLink('', 'flux-system');
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('-');
  });

  it('renders fallback "-" when both policy name and namespace are undefined', () => {
    const result = policyNameLink(undefined, undefined);
    expect(React.isValidElement(result)).toBe(false);
    expect(result).toBe('-');
  });
});
