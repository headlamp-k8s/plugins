import { Icon } from '@iconify/react';
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
  const {plugin} = props;

  return (
    <Box maxWidth="30%" width="400px" m={1}>
      <Card>
        <Box
          heigh="60px"
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
            height: '15vh',
            overflow: 'hidden',
            paddingTop: 0,
          }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Tooltip title={plugin.display_name} />
            <Typography
              component="h5"
              variant="h5"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <HeadlampRouterLink
                routeName="/plugin-catalog/:repoName/:pluginName"
                params={{ repoName: plugin.repository?.name, pluginName: plugin.name }}
              >
                {plugin.display_name}
              </HeadlampRouterLink>
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
              <Tooltip title={plugin?.repository?.name || ''}>
                <Typography>{plugin?.repository?.name || ''}</Typography>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          <Box mt={1}>
            <Typography>
              <Tooltip title={plugin?.description}>
                {plugin?.description?.slice(0, 100)}
                {plugin?.description?.length > 100 && (
                  <Typography sx={{ display: 'inline-block' }}>…</Typography>
                )}
              </Tooltip>
            </Typography>
          </Box>
        </CardContent>
        <CardActions
          sx={{
            justifyContent: 'space-between',
            padding: '14px',
          }}
        >
          <Link href={plugin?.repository?.url} target="_blank">
            Learn More
          </Link>
          {plugin.isInstalled && <Typography>Installed</Typography>}
        </CardActions>
      </Card>
    </Box>
  );
}
