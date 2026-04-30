import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';

interface ResourceAttributes {
  group?: string;
  version?: string;
  resource: string;
  subresource?: string;
  verb: string;
  namespace?: string;
}

interface UseSubjectAccessReviewOptions {
  user: string;
  resourceAttributes: ResourceAttributes;
  cluster?: string;
}

interface SubjectAccessReviewResult {
  allowed: boolean | null;
  reason: string;
  isLoading: boolean;
  error: string;
}

export function useSubjectAccessReview({
  user,
  resourceAttributes,
  cluster,
}: UseSubjectAccessReviewOptions): SubjectAccessReviewResult {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    const requestId = ++requestIdRef.current;

    setAllowed(null);
    setReason('');
    setError('');

    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    ApiProxy.clusterRequest(
      '/apis/authorization.k8s.io/v1/subjectaccessreviews',
      {
        method: 'POST',
        cluster,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'SubjectAccessReview',
          apiVersion: 'authorization.k8s.io/v1',
          spec: {
            user,
            resourceAttributes,
          },
        }),
      },
      undefined
    )
      .then(response => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setAllowed(response?.status?.allowed ?? false);
        setReason(response?.status?.reason ?? response?.status?.evaluationError ?? '');
      })
      .catch(err => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setAllowed(null);
        setError(err?.message ?? 'Unable to verify permission.');
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [cluster, resourceAttributes, user]);

  return { allowed, reason, isLoading, error };
}
