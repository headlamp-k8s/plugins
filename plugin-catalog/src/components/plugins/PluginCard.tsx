import { Icon, InlineIcon } from '@iconify/react';
import { PluginManager, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link as HeadlampRouterLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  Link,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { PluginPackage } from './List';
import PluginIcon from './plugin-icon.svg';
import { pollPluginManagerStatus } from './pluginManagerAction';

export interface PluginCardProps {
  plugin: PluginPackage;
}

function pluginSnackbarAction(closeCallback: () => void, t: (key: string) => string) {
  return (
    <>
      <Button
        color="inherit"
        onClick={() => {
          window.location.reload();
        }}
      >
        {t('Reload Now')}
      </Button>
      <Button color="inherit" onClick={closeCallback}>
        {t('Close')}
      </Button>
    </>
  );
}

const actionButtonSx = {
  backgroundColor: '#000',
  color: 'white',
  textTransform: 'none' as const,
  '&:hover': {
    color: 'inherit',
  },
};

export function PluginCard(props: PluginCardProps) {
  const { plugin } = props;
  const { t } = useTranslation();
  const [currentAction, setCurrentAction] = useState<'Install' | 'Update' | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const repoName = plugin.repository?.name || '';
  const identifier = `${repoName}_${plugin.name}`;
  const artifactHubURL = `https://artifacthub.io/packages/headlamp/${repoName}/${plugin.name}`;

  useEffect(() => {
    let cancelled = false;

    async function pollStatus() {
      if (!currentAction) {
        return;
      }

      try {
        const status = await pollPluginManagerStatus(identifier, {
          isCancelled: () => cancelled,
          shouldContinue: () => !!currentAction,
        });

        if (cancelled || !status) {
          return;
        }

        if (status.type === 'error' && status.message === 'No such operation in progress') {
          setCurrentAction(null);
          return;
        }

        if (status.type === 'error' || status.type === 'success') {
          setCurrentAction(null);
          setAlertMessage(
            status.type === 'success'
              ? t('{{action}} completed successfully.', { action: t(currentAction) })
              : t('Error: {{message}}', { message: status.message })
          );
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentAction(null);
          setAlertMessage(t('An unexpected error occurred: {{error}}', { error: String(error) }));
        }
      }
    }

    pollStatus();

    return () => {
      cancelled = true;
    };
  }, [currentAction, identifier, t]);

  const handleInstall = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentAction('Install');
    PluginManager.install(identifier, plugin.display_name || plugin.name, artifactHubURL);
  };

  const handleUpdate = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentAction('Update');
    // Prefer the name from List's install scan so we do not call PluginManager.list() again.
    PluginManager.update(
      identifier,
      plugin.installedPluginName || plugin.display_name || plugin.name
    );
  };

  const handleCancel = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    PluginManager.cancel(identifier);
    setCurrentAction(null);
  };

  let actionContent: React.ReactNode;
  if (currentAction) {
    actionContent = (
      <Button
        variant="contained"
        onClick={handleCancel}
        sx={actionButtonSx}
        size="small"
        aria-label={t('Cancel')}
      >
        <CircularProgress color="inherit" size={18} aria-hidden />
      </Button>
    );
  } else if (!plugin.isInstalled) {
    actionContent = (
      <Button variant="contained" onClick={handleInstall} sx={actionButtonSx} size="small">
        {t('Install')}
      </Button>
    );
  } else if (plugin.isUpdateAvailable) {
    actionContent = (
      <Button variant="contained" onClick={handleUpdate} sx={actionButtonSx} size="small">
        {t('Update')}
      </Button>
    );
  } else {
    actionContent = <Typography>{t('Installed')}</Typography>;
  }

  return (
    <Box maxWidth="30%" width="400px" m={1}>
      <Snackbar
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'rgb(49, 49, 49)',
            color: '#fff',
          },
        }}
        open={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        message={
          <Tooltip title={alertMessage || ''} arrow>
            <Typography>
              {alertMessage ? alertMessage.substring(0, Math.min(50, alertMessage.length)) : null}
            </Typography>
          </Tooltip>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={pluginSnackbarAction(() => setAlertMessage(null), t)}
      />
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box
          height="60px"
          display="flex"
          alignItems="center"
          marginTop="15px"
          justifyContent="space-between"
        >
          {plugin.logo_image_id ? (
            <CardMedia
              image={`https://artifacthub.io/image/${plugin.logo_image_id}`}
              sx={{
                width: '60px',
                margin: '1rem',
                alignSelf: 'flex-start',
              }}
              component="img"
            />
          ) : (
            <PluginIcon
              style={{
                height: '60px',
                width: '60px',
                margin: '1rem',
                alignSelf: 'flex-start',
              }}
            />
          )}
          <Box display="flex" alignItems="center" justifyContent="space-around" marginRight="10px">
            {(plugin.official || plugin.repository.official) && (
              <Tooltip title={t('Official Chart')}>
                <Icon
                  icon="mdi:star-circle"
                  style={{
                    marginLeft: '0.5em',
                    fontSize: '22px',
                  }}
                />
              </Tooltip>
            )}
            {plugin.repository.verified_publisher && (
              <Tooltip title={t('Verified Publisher')}>
                <Icon
                  icon="mdi:check-decagram"
                  style={{
                    marginLeft: '0.5em',
                    fontSize: '22px',
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
        <CardContent
          sx={{
            margin: '1rem 0rem',
            paddingTop: 0,
            paddingBottom: 0,
            marginBottom: 0,
            flex: 1,
          }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography
              component="h5"
              variant="h5"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {(() => {
                const displayName = plugin.display_name || plugin.name || '';
                const needsTooltip = displayName.length > 20;
                const link = (
                  <Box component="span" sx={{ display: 'inline-block' }}>
                    <HeadlampRouterLink
                      routeName="/plugin-catalog/:repoName/:pluginName"
                      params={{ repoName: plugin.repository?.name, pluginName: plugin.name }}
                    >
                      {displayName}
                    </HeadlampRouterLink>
                  </Box>
                );
                return needsTooltip ? <Tooltip title={displayName}>{link}</Tooltip> : link;
              })()}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography>v{plugin.version}</Typography>
            <Box
              marginLeft={1}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {plugin?.repository && (
                <>
                  <InlineIcon icon="mdi:building" />{' '}
                  <Link href={plugin.repository.url} target="_blank">
                    {plugin.repository.organization_name || plugin.repository.name}
                  </Link>
                </>
              )}
            </Box>
          </Box>
          <Divider />
          <Box mt={1}>
            <Typography>
              {(() => {
                const desc = plugin?.description || '';
                const needsTooltip = desc.length >= 180;
                const content = (
                  <Box
                    component="span"
                    sx={theme => ({
                      display: 'block',
                      lineHeight: '1.2',
                      maxHeight: 'calc(1.2em * 5)', // max 5 lines
                      overflow: 'hidden',
                      position: 'relative',
                      // Add a subtle fade at the bottom so users know the text is truncated.
                      '&::after': needsTooltip && {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '1.2em',
                        pointerEvents: 'none',
                        background: `linear-gradient(to bottom, rgba(0,0,0,0), ${theme.palette.background.paper})`,
                      },
                    })}
                  >
                    {desc}
                  </Box>
                );

                return needsTooltip ? <Tooltip title={desc}>{content}</Tooltip> : content;
              })()}
            </Typography>
          </Box>
        </CardContent>
        <CardActions
          sx={{
            justifyContent: 'flex-end',
            marginTop: 'auto',
            padding: '14px',
          }}
        >
          {actionContent}
        </CardActions>
      </Card>
    </Box>
  );
}
