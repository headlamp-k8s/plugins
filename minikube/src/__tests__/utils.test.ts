import { generateClusterName, isValidClusterName } from '../CommandCluster/CommandDialog';
import { detectOS } from '../CommandCluster/DriverSelect';
import { isElectron, isMinikube } from '../index';

describe('isElectron', () => {
  it('returns false in a standard browser environment', () => {
    expect(isElectron()).toBe(false);
  });

  it('returns true when userAgent contains Electron', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Electron/25.0.0',
      configurable: true,
    });
    expect(isElectron()).toBe(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });
});

describe('isMinikube', () => {
  it('returns true for a minikube cluster', () => {
    const cluster = {
      meta_data: {
        extensions: {
          context_info: { provider: 'minikube.sigs.k8s.io' },
        },
      },
    };
    expect(isMinikube(cluster)).toBe(true);
  });

  it('returns false for a non-minikube cluster', () => {
    const cluster = {
      meta_data: {
        extensions: {
          context_info: { provider: 'eks.aws' },
        },
      },
    };
    expect(isMinikube(cluster)).toBe(false);
  });

  it('returns false when meta_data is missing', () => {
    expect(isMinikube({})).toBe(false);
  });

  it('returns false when nested fields are undefined', () => {
    expect(isMinikube({ meta_data: {} })).toBe(false);
    expect(isMinikube({ meta_data: { extensions: {} } })).toBe(false);
    expect(isMinikube({ meta_data: { extensions: { context_info: {} } } })).toBe(false);
  });
});

describe('detectOS', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  it('returns linux for Linux platform', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Linux x86_64',
      configurable: true,
    });
    expect(detectOS()).toBe('linux');
  });

  it('returns macos for Mac platform', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
    expect(detectOS()).toBe('macos');
  });

  it('returns windows for Win platform', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    expect(detectOS()).toBe('windows');
  });

  it('returns unknown for unrecognized platform', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'UnknownOS',
      configurable: true,
    });
    expect(detectOS()).toBe('unknown');
  });
});

describe('isValidClusterName', () => {
  it('returns null for valid names', () => {
    expect(isValidClusterName('minikube')).toBeNull();
    expect(isValidClusterName('my-cluster-1')).toBeNull();
    expect(isValidClusterName('a')).toBeNull();
    expect(isValidClusterName('test123')).toBeNull();
  });

  it('returns error for empty name', () => {
    expect(isValidClusterName('')).toBe('Cluster name is required');
  });

  it('returns error for name starting with a hyphen', () => {
    expect(isValidClusterName('-bad')).toBeTruthy();
  });

  it('returns error for name containing spaces', () => {
    expect(isValidClusterName('my cluster')).toBeTruthy();
  });

  it('returns error for name containing special characters', () => {
    expect(isValidClusterName('my_cluster!')).toBeTruthy();
  });

  it('returns error for name ending with a hyphen', () => {
    expect(isValidClusterName('my-cluster-')).toBeTruthy();
  });

  it('returns error for name exceeding 63 characters', () => {
    expect(isValidClusterName('a'.repeat(64))).toBeTruthy();
  });

  it('accepts name at exactly 63 characters', () => {
    expect(isValidClusterName('a'.repeat(63))).toBeNull();
  });
});

describe('generateClusterName', () => {
  it('returns "minikube" when no existing names', () => {
    expect(generateClusterName([])).toBe('minikube');
  });

  it('returns "minikube" when existing names do not conflict', () => {
    expect(generateClusterName(['other-cluster'])).toBe('minikube');
  });

  it('returns "minikube-1" when "minikube" exists', () => {
    expect(generateClusterName(['minikube'])).toBe('minikube-1');
  });

  it('increments counter for multiple conflicts', () => {
    expect(generateClusterName(['minikube', 'minikube-1'])).toBe('minikube-2');
    expect(generateClusterName(['minikube', 'minikube-1', 'minikube-2'])).toBe('minikube-3');
  });
});
