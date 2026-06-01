import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import React from 'react';

export default function Flux404(props: Readonly<{ message: string; docs?: string }>) {
  const { message, docs } = props;
  const { t } = useTranslation();

  // return a box with a message that flux is not installed and a link to the flux installation guide
  return (
    <Box
      // center this box and also wrap it in a white background with some box shadow
      sx={{
        padding: '1rem',
        alignItems: 'center',
        margin: '2rem auto',
        maxWidth: '600px',
      }}
    >
      <h1>{t(message)}</h1>
      <p>
        {t('Follow the')}{' '}
        <Link target="_blank" href={docs ?? 'https://fluxcd.io/docs/installation/'}>
          {t('installation guide')}
        </Link>{' '}
        {t('to install flux on your cluster')}
      </p>
    </Box>
  );
}

export function NotSupported(props: { typeName: string }) {
  const { typeName } = props;
  const { t } = useTranslation();
  return (
    <SectionBox title={t(typeName)}>
      <p>{t('Flux installation has no support for {{typeName}}.', { typeName: t(typeName) })}</p>
      <p>
        {t('Follow the')}{' '}
        <Link target="_blank" href="https://fluxcd.io/docs/installation/">
          {t('installation guide')}
        </Link>{' '}
        {t('to support {{typeName}} on your cluster', { typeName: t(typeName) })}
      </p>
    </SectionBox>
  );
}
