import {
  Link as HeadlampRouterLink,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  Link,
  Pagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

function fetchHeadlampPlugins(limit, sort, offset, ts_query) {
  const url = 'https://artifacthub.io/api/v1/packages/search';

  // Construct the query parameters
  const params = {
    kind: '21',
    facets: 'true',
    limit: limit.toString(),
    sort: sort.toString(),
    offset: offset.toString(),
    ts_query: ts_query.toString(),
  };

  // Convert query parameters to string
  const queryString = new URLSearchParams(params).toString();

  // Construct the final URL with query parameters
  const finalUrl = `${url}?${queryString}`;

  // Fetch the data
  return fetch(`http://localhost:4466/externalproxy`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Forward-To': finalUrl,
    },
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .catch(error => {
      throw new Error(`Request failed!${error}`);
    });
}

function PluginCard(props) {
  return (
    <Box maxWidth="30%" width="400px" m={1}>
      <Card>
        <Box heigh="60px" display="flex" alignItems="center" marginTop="15px">
          <CardMedia
            image={`https://artifacthub.io/image/${props.logo_image_id}`}
            style={{
              width: '60px',
              margin: '1rem',
            }}
            component="img"
          />
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
                <span>{props?.repository?.name || ''}</span>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          <Box mt={1}>
            <Typography>
              {props?.description?.slice(0, 100)}
              {props?.description?.length > 100 && (
                <Tooltip title={props?.description}>
                  <span>…</span>
                </Tooltip>
              )}
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
        </CardActions>
      </Card>
    </Box>
  );
}

interface Packages {
  package_id: string;
  name: string;
  normalized_name: string;
  logo_image_id: string;
  stars: number;
  display_name: string;
  description: string;
  version: string;
  deprecated: boolean;
  has_values_schema: boolean;
  signed: boolean;
  production_organizations_count: number;
  ts: number;
  repository: {
    url: string;
    kind: number;
    name: string;
    official: boolean;
    user_alias: string;
    display_name: string;
    repository_id: string;
    scanner_disabled: boolean;
    verified_publisher: boolean;
  };
}

export function PluginList() {
  const [search, setSearch] = useState('');
  const [plugins, setPlugins] = useState<Packages[] | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPlugins(null);
    fetchHeadlampPlugins(PAGE_SIZE, 'stars', (page - 1) * PAGE_SIZE, search).then(async data => {
      setPlugins(data.packages);
      if (data.facets) {
        for (const facet of data.facets) {
          if (facet.filter_key === 'kind') {
            for (const option of facet.options) {
              if (option.id === 21) {
                if (option.total % PAGE_SIZE === 0) {
                  setTotalPages(option.total / PAGE_SIZE);
                } else {
                  setTotalPages(1);
                }
              }
            }
          }
        }
      }
    });
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function Search() {
    return (
      <TextField
        style={{
          width: '20vw',
          margin: '0 1rem',
        }}
        id="outlined-basic"
        label="Search"
        value={search}
        // @todo: Find a better way to handle search autofocus
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onChange={event => {
          setSearch(event.target.value);
        }}
      />
    );
  }

  return (
    <>
      <SectionHeader title="Plugins" actions={[<Search />]} />
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="space-between"
        alignContent="start"
        sx={{ gap: 2 }}
      >
        {plugins?.map(plugin => {
          return <PluginCard {...plugin} />;
        })}
      </Box>
      <Box mt={2} mx="auto" maxWidth="max-content">
        <Pagination
          size="large"
          shape="rounded"
          page={page < 0 ? page : 1}
          count={Math.floor(totalPages)}
          color="primary"
          onChange={(e, page: number) => {
            setPage(page);
          }}
        />
      </Box>
    </>
  );
}
