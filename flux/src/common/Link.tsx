import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import React from 'react';

export const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

/** Link that opens in a new tab and tells assistive technology that it does so. */
export function ExternalLink(props: Omit<MuiLinkProps, 'target' | 'rel'>) {
  const { children, ...otherProps } = props;
  const { t } = useTranslation();

  return (
    <MuiLink {...otherProps} target="_blank" rel="noopener noreferrer">
      {children}
      <Box component="span" sx={visuallyHidden}>
        {` ${t('(opens in a new tab)')}`}
      </Box>
    </MuiLink>
  );
}

export default function Link(props: { url: string; wrap?: boolean }) {
  const { url, wrap = false } = props;

  const href = React.useMemo(() => {
    if (url.startsWith('http')) {
      return url;
    }

    // If no protocol is provided, assume https.
    if (!url.includes('://')) {
      return `https://${url}`;
    }

    const githubSSHPrefix = 'ssh://git@';
    if (url.startsWith(githubSSHPrefix)) {
      const githubURL = url.replace(githubSSHPrefix, 'https://');
      return githubURL;
    }

    const ociPrefix = 'oci://';
    if (url.startsWith(ociPrefix)) {
      const githubURL = url.replace(ociPrefix, 'https://');
      return githubURL;
    }

    return url;
  }, [url]);

  if (!url) {
    return null;
  }

  const LinkComponent = () => <ExternalLink href={href}>{url}</ExternalLink>;

  if (wrap) {
    return (
      <Box sx={{ overflowWrap: 'anywhere' }}>
        <LinkComponent />
      </Box>
    );
  }

  return <LinkComponent />;
}
