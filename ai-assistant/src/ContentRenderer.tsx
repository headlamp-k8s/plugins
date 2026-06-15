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

import type {
  ContentRendererProps as BaseProps,
  LinkRendererProps,
} from '@headlamp-k8s/ai-ui/components/chat/ContentRenderer';
import ContentRendererBase from '@headlamp-k8s/ai-ui/components/chat/ContentRenderer';
import { Link as MuiLink } from '@mui/material';
import React from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import { getHeadlampLink } from './headlampLink';

/**
 * Headlamp link renderer for markdown content.
 *
 * Resolves Kubernetes resource links via headlamp-plugin's `Link` component
 * and uses `react-router-dom` for internal navigation. Falls back to
 * external links for non-headlamp URLs.
 */
const HeadlampLinkRenderer = React.memo(({ href, children, ...props }: LinkRendererProps) => {
  const history = useHistory();

  // Check if it's a resource details link
  // Wrapped in try-catch because headlamp-plugin imports (ResourceClasses)
  // may be undefined depending on plugin externalization
  let headlampLinkDetails;
  try {
    headlampLinkDetails = getHeadlampLink(href);
  } catch {
    // Fall through to external link rendering
    headlampLinkDetails = { isHeadlampLink: false, url: '', kubeObject: null };
  }
  if (headlampLinkDetails.isHeadlampLink) {
    // Use RouterLink for all Headlamp links to avoid headlampEventSlice crash
    // where DefaultHeadlampEvents is undefined
    if (headlampLinkDetails.url) {
      return (
        <MuiLink
          {...props}
          to={headlampLinkDetails.url}
          component={RouterLink}
          onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            history.push(headlampLinkDetails.url);
          }}
        >
          {children}
        </MuiLink>
      );
    }

    // The link is not supported in Headlamp so likely the LLM made it up
    return <em>{children}</em>;
  }

  return (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </MuiLink>
  );
});
HeadlampLinkRenderer.displayName = 'HeadlampLinkRenderer';

type ContentRendererProps = Omit<BaseProps, 'LinkRendererSlot'>;

/**
 * ContentRenderer with headlamp-plugin link resolution.
 *
 * Thin wrapper around the framework-agnostic ContentRenderer from ai-ui
 * that injects the HeadlampLinkRenderer for Kubernetes resource links.
 */
const ContentRenderer: React.FC<ContentRendererProps> = React.memo(
  props => <ContentRendererBase {...props} LinkRendererSlot={HeadlampLinkRenderer} />,
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.onYamlDetected === nextProps.onYamlDetected &&
      prevProps.onRetryTool === nextProps.onRetryTool &&
      prevProps.promptWidth === nextProps.promptWidth
    );
  }
);

ContentRenderer.displayName = 'ContentRenderer';

export default ContentRenderer;
