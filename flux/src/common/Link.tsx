import { Box, Link as MuiLink } from '@mui/material';
import React from 'react';

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

  const LinkComponent = () => (
    <MuiLink href={href} target="_blank">
      {url}
    </MuiLink>
  );

  if (wrap) {
    return (
      <Box sx={{ overflowWrap: 'anywhere' }}>
        <LinkComponent />
      </Box>
    );
  }

  return <LinkComponent />;
}
