import { Icon, InlineIcon } from '@iconify/react';
import { Link as HeadlampRouterLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  Link,
  Tooltip,
  Typography,
} from '@mui/material';
import { PluginPackage } from './List';
import PluginIcon from './plugin-icon.svg';

export interface PluginCardProps {
  plugin: PluginPackage;
}

export function PluginCard(props: PluginCardProps) {
  const { plugin } = props;

  return (
    <Box maxWidth="30%" width="400px" m={1}>
      <Card
        sx={{
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
              <Tooltip title="Official Chart">
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
              <Tooltip title="Verified Publisher">
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
            justifyContent: 'space-between',
            padding: '14px',
          }}
        >
          <span></span>
          {plugin.isInstalled && (
            <Typography>{plugin.isUpdateAvailable ? 'Update available' : 'Installed'}</Typography>
          )}
        </CardActions>
      </Card>
    </Box>
  );
}
