import { Icon } from '@iconify/react';
import { ConfigStore, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as RouterLink,
  Loader,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { HoverInfoLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  FormControlLabel,
  Link,
  Pagination,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { getCatalogConfig } from '../../api/catalogConfig';
import { fetchChartIcon, fetchChartsFromArtifact } from '../../api/charts';
import { PAGE_OFFSET_COUNT_FOR_CHARTS, VANILLA_HELM_REPO } from '../../constants/catalog';
import { AvailableComponentVersions } from '../../helpers/catalog';
import { EditorDialog } from './EditorDialog';

interface AppCatalogConfig {
  /**
   * Show only verified packages. If set to false shows all the packages
   */
  showOnlyVerified: boolean;
}

export const store = new ConfigStore<AppCatalogConfig>('app-catalog');
const useStoreConfig = store.useConfig();

// Define a global variable to hold the available versions of the components in the catalog
declare global {
  var AVAILABLE_VERSIONS: Map<any, any[]>;
}

interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

function Search({ search, setSearch }: SearchProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(search);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSearch(inputValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, setSearch]);

  return (
    <TextField
      sx={{
        width: '20vw',
        margin: '0 1rem',
      }}
      id="outlined-basic"
      label={t('Search')}
      value={inputValue}
      onChange={event => {
        setInputValue(event.target.value);
      }}
    />
  );
}

interface CategoryForChartsProps {
  helmChartCategoryList: { title: string; value: number }[];
  chartCategory: { title: string; value: number };
  setChartCategory: React.Dispatch<React.SetStateAction<{ title: string; value: number }>>;
}

function CategoryForCharts({
  helmChartCategoryList,
  chartCategory,
  setChartCategory,
}: CategoryForChartsProps) {
  const { t } = useTranslation();
  return (
    <Autocomplete
      sx={{
        width: '20vw',
      }}
      options={helmChartCategoryList}
      getOptionLabel={option => option?.title ?? helmChartCategoryList[0].title}
      defaultValue={helmChartCategoryList[0]}
      value={chartCategory}
      onChange={(event, newValue) => {
        // @ts-ignore
        setChartCategory(oldValue => {
          if ((newValue?.value ?? helmChartCategoryList[0].value) === oldValue.value) {
            return oldValue;
          }
          return newValue ?? helmChartCategoryList[0];
        });
      }}
      renderInput={params => {
        if (process.env.NODE_ENV === 'test') {
          // To keep the ids stable under test.
          params.id = params.id ? params.id.replace(/[0-9]/g, '') : params.id;
          params.inputProps.id = params.inputProps.id
            ? params.inputProps.id.replace(/[0-9]/g, '')
            : params.inputProps.id;
          params.InputLabelProps.id = params.InputLabelProps.id
            ? params.InputLabelProps.id.replace(/[0-9]/g, '')
            : params.InputLabelProps.id;
          // params.InputLabelProps.htmlFor = params.InputLabelProps.htmlFor
          //   ? params.InputLabelProps.htmlFor.replace(/[0-9]/g, '')
          //   : params.InputLabelProps.htmlFor;
        }
        return <TextField {...params} label={t('Categories')} placeholder={t('Favorites')} />;
      }}
    />
  );
}

interface OnlyVerifiedSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function OnlyVerifiedSwitch({ checked, onChange }: OnlyVerifiedSwitchProps) {
  const { t } = useTranslation();
  return (
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={checked}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.checked);
          }}
        />
      }
      sx={{ gap: 1 }}
      label={
        <HoverInfoLabel
          label={t('Only verified')}
          hoverInfo={t('Show charts from verified publishers only')}
        />
      }
    />
  );
}

export function ChartsList({ fetchCharts = fetchChartsFromArtifact }) {
  const { t } = useTranslation();
  const helmChartCategoryList = [
    { title: t('All'), value: 0 },
    { title: t('AI / Machine learning'), value: 1 },
    { title: t('Database'), value: 2 },
    { title: t('Integration and delivery'), value: 3 },
    { title: t('Monitoring and logging'), value: 4 },
    { title: t('Networking'), value: 5 },
    { title: t('Security'), value: 6 },
    { title: t('Storage'), value: 7 },
    { title: t('Streaming and messaging'), value: 8 },
  ];
  const [charts, setCharts] = useState<any | null>(null);
  const [openEditor, setEditorOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [chartsTotalCount, setChartsTotalCount] = useState(0);
  const [chartCategory, setChartCategory] = useState(helmChartCategoryList[0]);
  const [search, setSearch] = useState('');
  const [selectedChartForInstall, setSelectedChartForInstall] = useState<any | null>(null);
  const [iconUrls, setIconUrls] = useState<{ [url: string]: string }>({}); // New state for multiple icon URLs

  // Keep the config in sync so both the main page toggle and the settings view share the same value.
  // Default to true when no user preference has been stored yet.
  const config = useStoreConfig();
  const showOnlyVerified = config?.showOnlyVerified ?? true;
  const chartCfg = getCatalogConfig();

  // note: When the users changes the chartCategory or search, then we always go back to the first page
  useEffect(() => {
    setPage(1);
  }, [chartCategory, search]);

  // note: When the page changes, we fetch the charts, this will run as a reaction to the previous useEffect
  useEffect(
    function fetchChartsOnPageChange() {
      store.set({ showOnlyVerified: showOnlyVerified });

      async function fetchData() {
        try {
          const { data, total } = await fetchCharts(search, showOnlyVerified, chartCategory, page);
          if (chartCfg.chartProfile === VANILLA_HELM_REPO) {
            setCharts(data.entries);
            setChartsTotalCount(parseInt(total));
            // Capture available versions from the response and set AVAILABLE_VERSIONS
            globalThis.AVAILABLE_VERSIONS = AvailableComponentVersions(data.entries);
          } else {
            setCharts(Object.fromEntries(data.packages.map((chart: any) => [chart.name, chart])));
            setChartsTotalCount(parseInt(total));
          }
        } catch (err) {
          console.error('Error fetching charts', err);
          setCharts({});
        }
      }
      fetchData();
    },
    [page, chartCategory, search, showOnlyVerified]
  );

  type HelmIndex = Record<string, any[]>;
  useEffect(() => {
    if (charts && Object.keys(charts).length > 0) {
      const fetchIcons = async () => {
        try {
          const iconUrls = {};
          // charts is a map of name -> chart[]
          const list = Object.values(charts as HelmIndex).flat();
          const iconPromises = list.map(async (chart: any) => {
            // const iconPromises = Object.values(charts).flatMap(chartArray =>
            //   chartArray.map(async chart => {
            const iconURL = chart.icon ?? '';
            if (iconURL === '') {
              return;
            }
            const isURL = urlString => {
              try {
                new URL(urlString);
                return true;
              } catch (e) {
                return false;
              }
            };
            if (isURL(iconURL)) {
              // may be an external icon URL, so, just use as is
              iconUrls[iconURL] = iconURL;
            } else {
              const fetchIcon = async () => {
                try {
                  const response = await fetchChartIcon(iconURL);
                  const contentType = response.headers?.get('Content-Type');
                  if (
                    contentType.includes('image/svg+xml') ||
                    contentType.includes('text/xml') ||
                    contentType.includes('text/plain')
                  ) {
                    const txt = await response.text();
                    const reader = new FileReader();
                    await new Promise((resolve, reject) => {
                      reader.onloadend = () => resolve(reader.result);
                      reader.onerror = reject;
                      reader.readAsText(new Blob([txt], { type: 'text/plain' }));
                    });
                    iconUrls[iconURL] = `data:image/svg+xml;utf8,${encodeURIComponent(txt)}`;
                  } else if (contentType.includes('image/')) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const result = await new Promise((resolve, reject) => {
                      reader.onloadend = () => resolve(reader.result);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });
                    iconUrls[iconURL] = result as string;
                  }
                } catch (error) {
                  console.error('failed to fetch icon:', error);
                }
              };
              await fetchIcon();
            }
          }); //end of chartArray
          // ); // end of of iconPromisses
          await Promise.all(iconPromises);
          setIconUrls(iconUrls);
        } catch (error) {
          console.error('Error fetching icons:', error);
        }
      };
      fetchIcons();
    }
  }, [charts]);

  return (
    <>
      <EditorDialog
        openEditor={openEditor}
        chart={selectedChartForInstall}
        handleEditor={(open: boolean) => setEditorOpen(open)}
        chartProfile={VANILLA_HELM_REPO}
      />
      <SectionHeader
        title={t('Applications')}
        titleSideActions={[
          <Box key="verified-switch" pl={2}>
            <OnlyVerifiedSwitch
              checked={showOnlyVerified}
              onChange={(isChecked: boolean) => {
                store.set({ showOnlyVerified: isChecked });
                setPage(1);
              }}
            />
          </Box>,
        ]}
        actions={[
          <Search search={search} setSearch={setSearch} />,
          <CategoryForCharts
            helmChartCategoryList={helmChartCategoryList}
            chartCategory={chartCategory}
            setChartCategory={setChartCategory}
          />,
        ]}
      />
      <Box>
        {!charts ? (
          <Box
            sx={{
              margin: '0 auto',
            }}
          >
            <Loader title="" />
          </Box>
        ) : charts.length === 0 ? (
          <Box mt={2} mx={2}>
            <Typography variant="h5" component="h2">
              {search
                ? t('No charts found for search term: {{ search }}', { search })
                : t('No charts found for category: {{ category }}', {
                    category: chartCategory.title,
                  })}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fit, minmax(260px, 1fr))',
                md: 'repeat(auto-fit, minmax(320px, 1fr))',
              },
              gap: 3,
              m: 2,
            }}
          >
            {
              // Filter out the charts meeting the value entered for search field and display only the matching charts
              Object.keys(
                Object.keys(charts)
                  .filter(key => key.includes(search))
                  .reduce((obj, key) => {
                    return Object.assign(obj, {
                      [key]: charts[key],
                    });
                  }, {})
              ).map(chartName => {
                // When a chart contains multiple versions, only display the first version
                return (
                  Array.isArray(charts[chartName])
                    ? charts[chartName]?.slice?.(0, 1) || []
                    : [charts[chartName]]
                ).map(chart => {
                  return (
                    <Card
                      key={`${chart.name}-${chart.version}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxShadow: 3,
                      }}
                    >
                      <Box
                        height="60px"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        marginTop="15px"
                      >
                        {chartCfg.chartProfile === VANILLA_HELM_REPO
                          ? iconUrls[chart.icon] && (
                              <CardMedia
                                image={iconUrls[chart.icon]}
                                alt={`${chart.name} logo`}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  m: 2,
                                  alignSelf: 'flex-start',
                                  objectFit: 'contain',
                                }}
                                component="img"
                              />
                            )
                          : chart.logo_image_id && (
                              <CardMedia
                                image={`https://artifacthub.io/image/${chart.logo_image_id}`}
                                alt={`${chart.name} logo`}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  m: 2,
                                  alignSelf: 'flex-start',
                                  objectFit: 'contain',
                                }}
                                component="img"
                              />
                            )}
                        <Box
                          display="flex"
                          alignItems="center"
                          marginLeft="auto"
                          marginRight="10px"
                        >
                          {(chart?.cncf || chart?.repository?.cncf) && (
                            <Tooltip title={t('CNCF Project')}>
                              <Icon
                                icon="simple-icons:cncf"
                                style={{
                                  marginLeft: '0.5em',
                                  fontSize: '20px',
                                }}
                              />
                            </Tooltip>
                          )}
                          {(chart?.official || chart?.repository?.official) && (
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
                          {chart?.repository?.verified_publisher && (
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
                          my: 2,
                          pt: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          flexGrow: 1,
                        }}
                      >
                        <Box
                          sx={{
                            wordBreak: 'break-word',
                          }}
                        >
                          <Tooltip title={chart.name}>
                            <Typography component="h2" variant="h5">
                              {/* TODO: The app-catalog using artifacthub.io loads the details about the chart with an option to install the chart
                                    Fix this for vanilla helm repo */}
                              {chartCfg.chartProfile === VANILLA_HELM_REPO ? (
                                chart.name
                              ) : (
                                <RouterLink
                                  routeName="/helm/:repoName/charts/:chartName"
                                  params={{
                                    chartName: chart.name,
                                    repoName: chart?.repository?.name,
                                  }}
                                >
                                  {chart.name}
                                </RouterLink>
                              )}
                            </Typography>
                          </Tooltip>
                        </Box>
                        <Box display="flex" justifyContent="space-between" my={1}>
                          {/* If the chart.version contains v prefix, remove it */}
                          {chart.version.startsWith('v') ? (
                            <Typography>{chart.version}</Typography>
                          ) : (
                            <Typography>v{chart.version}</Typography>
                          )}
                          <Box
                            marginLeft={1}
                            sx={{
                              wordBreak: 'break-word',
                            }}
                          >
                            <Tooltip title={chart?.repository?.name || ''}>
                              <Typography>{chart?.repository?.name || ''}</Typography>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Divider />
                        <Box mt={1}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word',
                              minHeight: '72px',
                              maxHeight: '72px',
                            }}
                          >
                            {chart?.description?.slice(0, 100)}
                            {chart?.description?.length > 100 && (
                              <Tooltip title={chart?.description}>
                                <span>…</span>
                              </Tooltip>
                            )}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions
                        sx={{
                          justifyContent: 'space-between',
                          px: 3,
                          py: 2,
                          gap: 1,
                          flexWrap: 'wrap',
                          mt: 'auto',
                        }}
                      >
                        <Button
                          sx={{
                            backgroundColor: '#000',
                            color: 'white',
                            textTransform: 'none',
                            '&:hover': {
                              background: '#605e5c',
                            },
                          }}
                          onClick={() => {
                            setSelectedChartForInstall(chart);
                            setEditorOpen(true);
                          }}
                        >
                          {t('Install')}
                        </Button>
                        {/*
                            Provide Learn More link only when the chart has source
                            When there are multiple sources for a chart, use the first source for the link, rather than using comma separated values
                    */}
                        {chartCfg.chartProfile === VANILLA_HELM_REPO ? (
                          !chart?.sources ? (
                            ''
                          ) : chart?.sources?.length === 1 ? (
                            <Link href={chart?.sources} target="_blank">
                              {t('Learn More')}
                            </Link>
                          ) : (
                            <Link href={chart?.sources[0]} target="_blank">
                              {t('Learn More')}
                            </Link>
                          )
                        ) : (
                          <Link href={chart?.repository?.url} target="_blank">
                            {t('Learn More')}
                          </Link>
                        )}
                      </CardActions>
                    </Card>
                  );
                });
              })
            }
          </Box>
        )}
      </Box>
      {charts && charts.length !== 0 && (
        <Box mt={2} mx="auto" maxWidth="max-content">
          <Pagination
            size="large"
            shape="rounded"
            page={page}
            count={Math.ceil(chartsTotalCount / PAGE_OFFSET_COUNT_FOR_CHARTS)}
            color="primary"
            onChange={(e, page: number) => {
              setPage(page);
            }}
          />
        </Box>
      )}
      {chartCfg.chartProfile !== VANILLA_HELM_REPO && (
        <Box textAlign="right">
          <Link href="https://artifacthub.io/" target="_blank">
            {t('Powered by ArtifactHub')}
          </Link>
        </Box>
      )}
    </>
  );
}
