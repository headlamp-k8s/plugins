import {
  EmptyContent,
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Grid, Link, Paper, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchOpencostData, isOpenCostInstalled } from './request';
import { getDisplayCurrency, getDisplayTimespan, getServiceDetails } from './utils';

interface ChartProps {
  data: {
    date: string;
    cpuCost: number;
    ramCost: number;
    pvCost: number;
    gpuCost: number;
  }[];
}

function Chart(props: ChartProps) {
  const { data } = props;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={date => new Date(date).toLocaleDateString()} />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="cpuCost" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="ramCost" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
        <Area type="monotone" dataKey="pvCost" stackId="1" stroke="#ffc658" fill="#ffc658" />
        <Area type="monotone" dataKey="gpuCost" stackId="1" stroke="#ff0000" fill="#ff0000" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TimespanDropDown(props: { default; onChange(event): void }) {
  return (
    <Select value={props.default} onChange={e => props.onChange(e)}>
      <MenuItem value={'today'}>Today</MenuItem>
      <MenuItem value={'yesterday'}>Yesterday</MenuItem>
      <MenuItem value={'24h'}>24 hours</MenuItem>
      <MenuItem value={'48h'}>48 hours</MenuItem>
      <MenuItem value={'week'}>Week</MenuItem>
      <MenuItem value={'lastweek'}>Last week</MenuItem>
      <MenuItem value={'7d'}>7 days</MenuItem>
      <MenuItem value={'14d'}>14 days</MenuItem>
    </Select>
  );
}

const learnMoreLink = 'https://github.com/headlamp-k8s/plugins/tree/main/opencost#readme';

export function OpencostDetailSection({ resource, type }) {
  const [accumulatedData, setAccumulatedData] = useState(null);
  const [tsData, setTsData] = useState(null);
  const [installed, setInstalled] = useState(true);
  const [displayTimespan, setDisplayTimespan] = useState(getDisplayTimespan());

  useEffect(() => {
    const fetchData = async () => {
      const [isInstalled] = await isOpenCostInstalled();
      setInstalled(isInstalled);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!installed) {
      return;
    }
    const fetchData = async () => {
      const [namespace, serviceName] = await getServiceDetails();
      const accumulatedData = await fetchOpencostData(
        namespace,
        serviceName,
        displayTimespan,
        type,
        true
      );
      if (accumulatedData?.data[0]?.[resource.jsonData?.metadata?.name]) {
        setAccumulatedData(accumulatedData?.data[0]?.[resource.jsonData?.metadata?.name]);
      } else {
        setAccumulatedData({});
      }
      const tsData = await fetchOpencostData(namespace, serviceName, displayTimespan, type, false);
      const processedData = [];
      const currentDate = new Date();
      let startDate = new Date(currentDate);
      if (displayTimespan === 'yesterday') {
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
      } else if (displayTimespan === 'lastweek') {
        // find last saturday
        startDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() - 1));
        // startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
      }

      startDate.setDate(currentDate.getDate() - tsData.data.length + 1);
      tsData.data.forEach(day => {
        if (day.hasOwnProperty(resource.jsonData?.metadata?.name)) {
          processedData.push({
            date: new Date(startDate.getTime()),
            cpuCost: day[resource.jsonData?.metadata?.name].cpuCost,
            ramCost: day[resource.jsonData?.metadata?.name].ramCost,
            pvCost: day[resource.jsonData?.metadata?.name].pvCost,
            gpuCost: day[resource.jsonData?.metadata?.name].gpuCost,
          });
        } else if (Object.keys(day).length === 0) {
          processedData.push({
            date: new Date(startDate.getTime()),
            cpuCost: 0,
            ramCost: 0,
            pvCost: 0,
            gpuCost: 0,
          });
        }
        startDate.setDate(startDate.getDate() + 1);
      });
      setTsData(processedData);
    };

    fetchData();
  }, [displayTimespan]);

  const handleDisplayTimespanChange = timespan => {
    setDisplayTimespan(timespan);
    setTsData(null);
    setAccumulatedData(null);
  };

  return (
    <OpencostDetailSectionPure
      installed={installed}
      displayTimespan={displayTimespan}
      tsData={tsData}
      accumulatedData={accumulatedData}
      learnMoreLink={learnMoreLink}
      displayCurrency={getDisplayCurrency()}
      handleDisplayTimespanChange={handleDisplayTimespanChange}
    />
  );
}

interface AccumulatedData {
  cpuCost: number;
  ramCost: number;
  pvCost: number;
  gpuCost: number;
  totalCost: number;
  totalEfficiency: number;
}

interface OpencostDetailSectionPureProps {
  installed: boolean;
  displayTimespan: string;
  tsData: ChartProps['data'] | null;
  accumulatedData: AccumulatedData | {} | null;
  learnMoreLink: string;
  displayCurrency: string;
  handleDisplayTimespanChange: (timespan: string) => void;
}

export function OpencostDetailSectionPure(props: OpencostDetailSectionPureProps) {
  const {
    installed,
    displayTimespan,
    tsData,
    accumulatedData,
    learnMoreLink,
    displayCurrency,
    handleDisplayTimespanChange,
  } = props;

  let content = null;

  if (installed) {
    if (
      (accumulatedData === null || Object.keys(accumulatedData).length === 0) &&
      tsData?.length === 0
    ) {
      content = (
        <Paper variant="outlined">
          <EmptyContent>{'No data to be shown.'}</EmptyContent>
        </Paper>
      );
    } else if (accumulatedData && tsData) {
      content = (
        <Box sx={{ paddingRight: '16px', paddingLeft: '16px' }}>
          <Chart data={tsData} />
          <NameValueTable
            rows={[
              {
                name: 'CPU',
                value: (accumulatedData as AccumulatedData)?.cpuCost
                  ? `${displayCurrency} ${(accumulatedData as AccumulatedData)?.cpuCost}`
                  : 'N/A',
              },
              {
                name: 'RAM',
                value: (accumulatedData as AccumulatedData)?.ramCost
                  ? `${displayCurrency} ${(accumulatedData as AccumulatedData)?.ramCost}`
                  : 'N/A',
              },
              {
                name: 'PV',
                value: (accumulatedData as AccumulatedData)?.pvCost
                  ? `${displayCurrency} ${(accumulatedData as AccumulatedData)?.pvCost}`
                  : 'N/A',
              },
              {
                name: 'GPU',
                value: (accumulatedData as AccumulatedData)?.gpuCost
                  ? `${displayCurrency} ${(accumulatedData as AccumulatedData)?.gpuCost}`
                  : 'N/A',
              },
              {
                name: 'Total',
                value: (accumulatedData as AccumulatedData)?.totalCost
                  ? `${displayCurrency} ${(accumulatedData as AccumulatedData)?.totalCost}`
                  : 'N/A',
              },
              {
                name: 'Efficiency (%)',
                value: (accumulatedData as AccumulatedData)?.totalEfficiency
                  ? `${(accumulatedData as AccumulatedData)?.totalEfficiency * 100}`
                  : 'N/A',
              },
            ]}
          />
        </Box>
      );
    } else {
      content = (
        <Box sx={{ width: '100%' }}>
          <Loader title="Fetching Data" />
        </Box>
      );
    }
  } else {
    content = (
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5"> Install Opencost for accessing cost info</Typography>
        </Grid>
        <Typography>
          <Link href={learnMoreLink} target="_blank">
            Learn more about enabling Opencost.
          </Link>
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid spacing={2}>
      <SectionBox
        title={
          <div id="opencost-plugin-cost-section">
            <SectionHeader
              title="Cost"
              actions={[
                installed && (
                  <TimespanDropDown
                    default={displayTimespan}
                    onChange={event => handleDisplayTimespanChange(event.target.value)}
                  />
                ),
              ]}
            />
          </div>
        }
      />
      <Box sx={{ paddingLeft: '16px', paddingRight: '16px' }}>{content}</Box>
    </Grid>
  );
}
