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
import { Packages } from './List';
import PluginIcon from './plugin-icon.svg';

export function PluginCard(props: Packages) {
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
          {props.logo_image_id ? (
            <CardMedia
              image={`https://artifacthub.io/image/${props.logo_image_id}`}
              style={{
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
            {(props.official || props.repository.official) && (
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
            {props.repository.verified_publisher && (
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
          style={{
            margin: '1rem 0rem',
            height: '15vh',
            overflow: 'hidden',
            paddingTop: 0,
          }}
        >
          <Box
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Tooltip title={props.display_name} />
            <Typography component="h5" variant="h5">
              <HeadlampRouterLink
                routeName="/plugin-catalog/:repoName/:pluginName"
                params={{ repoName: props.repository?.name, pluginName: props.name }}
              >
                {props.display_name}
              </HeadlampRouterLink>
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography>v{props.version}</Typography>
            <Box
              marginLeft={1}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Tooltip title={props?.repository?.name || ''}>
                <Typography>{props?.repository?.name || ''}</Typography>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          <Box mt={1}>
            <Typography>
              <Tooltip title={props?.description}>
                {props?.description?.slice(0, 100)}
                {props?.description?.length > 100 && (
                  <Typography style={{ display: 'inline-block' }}>…</Typography>
                )}
              </Tooltip>
            </Typography>
          </Box>
        </CardContent>
        <CardActions
          style={{
            justifyContent: 'space-between',
            padding: '14px',
          }}
        >
          <Link href={props?.repository?.url} target="_blank">
            Learn More
          </Link>
          {props.isInstalled && <Typography>Installed</Typography>}
        </CardActions>
      </Card>
    </Box>
  );
}
