import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Popover, useTheme } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import {
  KeyboardEvent,
  ReactNode,
  SVGProps,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint, getTimeRangeAndStepSize, PLUGIN_NAME } from '../../../util';
import {
  groupReferenceLines,
  referenceGroupLabel,
  referenceLineId,
  revisionMarkerLayout,
} from './groupReferenceLines';

/**
 * Props for the Chart component.
 * @interface ChartProps
 * @property {Array<Object>} plots - Array of plot configurations.
 * @property {string} plots[].query - The Prometheus query string.
 * @property {string} plots[].name - Display name for the plot.
 * @property {string} plots[].fillColor - Fill color for the plot area.
 * @property {string} plots[].strokeColor - Stroke color for the plot line.
 * @property {Function} plots[].dataProcessor - Function to process the raw metrics data.
 * @property {Array<Object>} referenceLines - Array of reference line configurations.
 * @property {number} [referenceLines[].x] - X-axis value for a vertical reference line.
 * @property {number} [referenceLines[].y] - Y-axis value for a horizontal reference line.
 * @property {string} referenceLines[].label - Label to display alongside the reference line.
 * @property {string} referenceLines[].stroke - Color of the reference line (can be omitted to use default).
 * @property {string} [referenceLines[].strokeDasharray] - Optional stroke pattern (e.g. "3 3" for dashed lines).
 * @property {Function} fetchMetrics - Function to fetch metrics data from Prometheus.
 * @property {string} interval - Time interval for the chart (e.g. '10m', '1h', '24h').
 * @property {string} prometheusPrefix - URL prefix for Prometheus API calls.
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data.
 * @property {Object} xAxisProps - Props to pass to the X axis component.
 * @property {Object} yAxisProps - Props to pass to the Y axis component.
 * @property {Function} [CustomTooltip] - Optional custom tooltip component.
 */
export interface ChartProps {
  plots: Array<{
    query: string;
    name: string;
    fillColor: string;
    strokeColor: string;
    dataProcessor: (data: any) => ChartDataPoint[];
    stackId?: string | null;
  }>;
  referenceLines?: Array<{
    x?: number;
    y?: number;
    label: string;
    stroke: string;
    strokeDasharray?: string;
    tooltip?: ReactNode;
    tooltipFooter?: ReactNode;
  }>;
  fetchMetrics: (query: object) => Promise<any>;
  interval: string;
  resolution: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
  xAxisProps: {
    [key: string]: any;
  };
  yAxisProps: {
    [key: string]: any;
  };
  CustomTooltip?: ({ active, payload, label }) => JSX.Element | null;
  subPath?: string;
}

type MarkerCoordinates = Pick<
  SVGProps<SVGLineElement>,
  'stroke' | 'strokeWidth' | 'strokeDasharray' | 'strokeOpacity' | 'clipPath'
> & { x1: number; y1: number; x2: number; y2: number };

function scrollRevisionDetails(event: KeyboardEvent, element: HTMLElement | null) {
  if (
    !element ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    element.scrollHeight <= element.clientHeight
  )
    return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select'))
  )
    return;
  const page = Math.max(element.clientHeight - 40, 40);
  const offsets = {
    ArrowDown: element.scrollTop + 40,
    ArrowUp: element.scrollTop - 40,
    PageDown: element.scrollTop + page,
    PageUp: element.scrollTop - page,
    Home: 0,
    End: element.scrollHeight - element.clientHeight,
  };
  if (!Object.prototype.hasOwnProperty.call(offsets, event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  element.scrollTop = Math.max(
    0,
    Math.min(
      offsets[event.key as keyof typeof offsets],
      element.scrollHeight - element.clientHeight
    )
  );
}

function RevisionMarkerShape({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth,
  strokeDasharray,
  strokeOpacity,
  clipPath,
  label,
  tooltip,
  markerId,
  onOpen,
  onClose,
}: MarkerCoordinates & {
  label: string;
  tooltip: ReactNode;
  markerId: string;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const { t } = useTranslation(PLUGIN_NAME);
  const theme = useTheme();
  const position = { x1, y1, x2, y2, clipPath };
  const [labelElement, setLabelElement] = useState<SVGTextElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const markerElement = useRef<SVGGElement>(null);
  const previewElement = useRef<HTMLDivElement>(null);
  const contentElement = useRef<HTMLDivElement>(null);
  const restoringFocus = useRef(false);
  const restoreAfterClose = useRef(true);
  const id = useId();
  const previewId = `${id}-preview`;
  const dialogId = `${id}-details`;
  const instructionsId = `${id}-instructions`;
  const popoverId = `${markerId}:popover`;
  useEffect(
    () => () => {
      onClose(markerId);
      onClose(popoverId);
    },
    [markerId, popoverId, onClose]
  );
  const openPopover = () => {
    restoringFocus.current = false;
    restoreAfterClose.current = true;
    setTooltipOpen(false);
    onClose(markerId);
    setPopoverOpen(true);
    onOpen(popoverId);
  };
  const closePopover = (restoreFocus = true) => {
    restoreAfterClose.current = restoreFocus;
    setPopoverOpen(false);
    onClose(popoverId);
  };
  const restoreMarkerFocus = () => {
    restoringFocus.current = true;
    markerElement.current?.focus({ preventScroll: true });
  };
  const closePreview = (restoreFocus = true) => {
    setTooltipOpen(false);
    onClose(markerId);
    if (restoreFocus && previewElement.current?.contains(document.activeElement))
      restoreMarkerFocus();
  };
  const openPreview = () => {
    if (!popoverOpen && !restoringFocus.current) {
      setTooltipOpen(true);
      onOpen(markerId);
    }
  };
  const focusOutline = {
    '&:focus-visible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: 2 },
  };
  return (
    <>
      <desc id={instructionsId}>
        {t(
          'Revision marker. Use Up/Down, Page Up/Down, Home/End to scroll details. Press Enter or Space to open details. Escape closes details.'
        )}
      </desc>
      <MuiTooltip
        id={previewId}
        open={tooltipOpen && !popoverOpen}
        title={tooltip}
        describeChild
        disableFocusListener
        arrow
        placement="right-start"
        leaveDelay={300}
        PopperProps={{
          role: tooltipOpen && !popoverOpen ? 'dialog' : 'presentation',
          'aria-label': label,
          'aria-modal': false,
          'aria-hidden': !tooltipOpen || popoverOpen,
          anchorEl: labelElement
            ? { getBoundingClientRect: () => labelElement.getBoundingClientRect() }
            : undefined,
        }}
        onOpen={openPreview}
        onClose={event => {
          const active = document.activeElement;
          if (
            event.type !== 'keydown' &&
            (previewElement.current?.contains(active) || markerElement.current === active)
          )
            return;
          closePreview();
        }}
        componentsProps={{
          tooltip: {
            ref: previewElement,
            tabIndex: 0,
            role: 'region',
            'aria-label': label,
            onKeyDown: event => scrollRevisionDetails(event, previewElement.current),
            onBlur: event => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                event.relatedTarget !== markerElement.current
              )
                closePreview(false);
            },
            onClick: event => {
              if (event.target instanceof Element && event.target.closest('a[href]'))
                closePreview(false);
            },
            sx: {
              whiteSpace: 'pre-line',
              maxHeight: 'min(320px, calc(100dvh - 32px))',
              overflowY: 'auto',
              overflowWrap: 'anywhere',
              overscrollBehavior: 'contain',
              ...focusOutline,
            },
          },
        }}
      >
        <Box
          component="g"
          ref={markerElement}
          tabIndex={0}
          role="button"
          aria-label={label}
          aria-describedby={instructionsId}
          aria-haspopup="dialog"
          aria-expanded={tooltipOpen || popoverOpen}
          aria-controls={popoverOpen ? dialogId : tooltipOpen ? previewId : undefined}
          sx={{ cursor: 'pointer', ...focusOutline }}
          onFocus={openPreview}
          onBlur={event => {
            restoringFocus.current = false;
            if (!previewElement.current?.contains(event.relatedTarget)) closePreview(false);
          }}
          onMouseEnter={() => {
            restoringFocus.current = false;
          }}
          onClick={event => {
            event.currentTarget.focus();
            openPopover();
          }}
          onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (!event.repeat) openPopover();
            } else if (tooltipOpen) {
              scrollRevisionDetails(event, previewElement.current);
            }
          }}
        >
          <line
            {...position}
            stroke="transparent"
            strokeWidth={revisionMarkerLayout.hitTargetWidth}
            pointerEvents="stroke"
          />
          <line
            {...position}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeOpacity={strokeOpacity}
            pointerEvents="none"
          />
          <text
            ref={setLabelElement}
            x={x1 - revisionMarkerLayout.labelOffset}
            y={Math.min(y1, y2) + revisionMarkerLayout.fontSize + 2}
            fill={theme.palette.text.primary}
            fontSize={revisionMarkerLayout.fontSize}
            textAnchor="end"
          >
            {label}
          </text>
        </Box>
      </MuiTooltip>
      <Popover
        open={popoverOpen}
        anchorEl={labelElement}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={() => closePopover()}
        disableRestoreFocus
        PaperProps={{
          id: dialogId,
          role: 'dialog',
          'aria-label': label,
          'aria-modal': true,
          sx: { width: 432, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden' },
        }}
        TransitionProps={{
          onEntered: () =>
            contentElement.current?.querySelector<HTMLElement>('a[href], button')?.focus(),
          onExited: () => {
            if (restoreAfterClose.current) restoreMarkerFocus();
          },
        }}
      >
        <Box
          ref={contentElement}
          tabIndex={0}
          role="region"
          aria-label={label}
          p={2}
          sx={{
            maxHeight: 'min(70dvh, calc(100dvh - 64px))',
            overflowY: 'auto',
            overflowWrap: 'anywhere',
            overscrollBehavior: 'contain',
            ...focusOutline,
            '&:focus-visible': { ...focusOutline['&:focus-visible'], outlineOffset: -2 },
          }}
          onKeyDown={event => scrollRevisionDetails(event, contentElement.current)}
          onClick={event => {
            if (event.target instanceof Element && event.target.closest('a[href]'))
              closePopover(false);
          }}
        >
          {tooltip}
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button onClick={() => closePopover()}>{t('Close', { ns: 'translation' })}</Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

export default function Chart(props: ChartProps) {
  const { t } = useTranslation(PLUGIN_NAME);

  enum ChartState {
    LOADING,
    ERROR,
    NO_DATA,
    SUCCESS,
  }
  const { fetchMetrics, xAxisProps, yAxisProps } = props;
  const [metrics, setMetrics] = useState<Array<any>>([]);
  const [state, setState] = useState<ChartState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openReferenceTooltips, setOpenReferenceTooltips] = useState<Set<string>>(() => new Set());
  const openReferenceTooltip = useCallback(
    (id: string) =>
      setOpenReferenceTooltips(current => (current.has(id) ? current : new Set([...current, id]))),
    []
  );
  const closeReferenceTooltip = useCallback(
    (id: string) =>
      setOpenReferenceTooltips(current => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      }),
    []
  );
  const [displayedRange, setDisplayedRange] = useState(() =>
    getTimeRangeAndStepSize(props.interval, props.resolution)
  );
  const [chartWidth, setChartWidth] = useState(0);
  const requestVersion = useRef(0);
  const pendingRequestVersion = useRef<number | null>(null);
  const theme = useTheme();

  const fetchMetricsData = async (
    plots: Array<{ query: string; name: string; dataProcessor: (data: any) => any }>,
    firstLoad: boolean = false
  ) => {
    if (!firstLoad && pendingRequestVersion.current !== null) return;
    const version = ++requestVersion.current;
    pendingRequestVersion.current = version;
    try {
      const currentTimeRange = getTimeRangeAndStepSize(props.interval, props.resolution);
      const fetchedMetrics: {
        [key: string]: {
          data: { timestamp: number; y: number }[];
          state: ChartState;
        };
      } = {};

      if (firstLoad) {
        setState(ChartState.LOADING);
      }

      // clear any previous errors on refresh
      if (!firstLoad) {
        setError(null);
      }

      for (const plot of plots) {
        var response;
        try {
          response = await fetchMetrics({
            prefix: props.prometheusPrefix,
            query: plot.query,
            from: currentTimeRange.from,
            to: currentTimeRange.to,
            step: currentTimeRange.step,
            subPath: props.subPath,
          });
          if (version !== requestVersion.current) return;
        } catch (e) {
          if (version !== requestVersion.current) return;
          fetchedMetrics[plot.name] = { data: [], state: ChartState.ERROR };
          setError(e.message);
          setState(ChartState.ERROR);
          break;
        }
        if (response.status !== 'success') {
          fetchedMetrics[plot.name] = { data: [], state: ChartState.ERROR };
          continue;
        }

        if (version !== requestVersion.current) return;
        if (response['data']['result'].length === 0) {
          fetchedMetrics[plot.name] = { data: [], state: ChartState.NO_DATA };
          continue;
        }

        const data = plot.dataProcessor(response);
        fetchedMetrics[plot.name] = { data: data, state: ChartState.SUCCESS };
      }

      if (version !== requestVersion.current) return;
      setDisplayedRange(currentTimeRange);
      // if all the plots are in no data state, set the state to no data
      if (Object.values(fetchedMetrics).every(plot => plot.state === ChartState.NO_DATA)) {
        setState(ChartState.NO_DATA);
        setMetrics([]);
      }
      // if any plot has a real error, set the state to error
      else if (Object.values(fetchedMetrics).some(plot => plot.state === ChartState.ERROR)) {
        setError(previousError => previousError ?? t('Failed to load chart data.'));
        setState(ChartState.ERROR);
      }
      // otherwise merge SUCCESS plots together; treat NO_DATA plots as empty
      else {
        const mergedDataMap: Record<number, any> = {};

        for (const plotName of Object.keys(fetchedMetrics)) {
          if (fetchedMetrics[plotName].state === ChartState.SUCCESS) {
            fetchedMetrics[plotName].data.forEach(element => {
              if (!mergedDataMap[element.timestamp]) {
                mergedDataMap[element.timestamp] = { timestamp: element.timestamp };
              }
              mergedDataMap[element.timestamp][plotName] = element.y ?? null;
            });
          }
        }

        const mergedData = Object.values(mergedDataMap).map(element => {
          for (const plotName of Object.keys(fetchedMetrics)) {
            if (element[plotName] === undefined) {
              element[plotName] = null;
            }
          }
          return element;
        });

        mergedData.sort((a, b) => a.timestamp - b.timestamp);

        setMetrics(mergedData);
        setState(ChartState.SUCCESS);
      }
    } finally {
      if (pendingRequestVersion.current === version) pendingRequestVersion.current = null;
    }
  };

  // Fetch data on initial load and when key parameters change
  useEffect(() => {
    fetchMetricsData(props.plots, true);
    return () => {
      requestVersion.current++;
    };
  }, [
    props.interval,
    props.resolution,
    props.prometheusPrefix,
    props.subPath,
    JSON.stringify(props.plots),
  ]);

  // if reload is true, set up a timer to refresh data every 10 seconds
  // Set up a timer to refresh data every 10 seconds
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (props.autoRefresh) {
      refreshInterval = setInterval(() => {
        fetchMetricsData(props.plots, false);
      }, 10000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [
    props.autoRefresh,
    props.interval,
    props.resolution,
    props.prometheusPrefix,
    props.subPath,
    JSON.stringify(props.plots),
  ]);

  // Calculate time range for XAxis domain
  const { from: fromTimestamp, to: toTimestamp } = displayedRange;
  const plotWidth = Math.max(
    chartWidth - (typeof yAxisProps.width === 'number' ? yAxisProps.width : 60) - 10,
    1
  );
  const referenceGroups = groupReferenceLines(
    props.referenceLines ?? [],
    fromTimestamp,
    toTimestamp,
    plotWidth
  );

  let chartContent;

  if (state === ChartState.SUCCESS) {
    chartContent = (
      <AreaChart
        data={metrics}
        role="group"
        aria-label={t('Metrics chart')}
        style={{ fontSize: 14 }}
      >
        <XAxis
          stroke={theme.palette.chartStyles.labelColor}
          fontSize={12}
          {...xAxisProps}
          type="number"
          domain={[fromTimestamp, toTimestamp]}
          allowDataOverflow
        />
        <YAxis fontSize={14} stroke={theme.palette.chartStyles.labelColor} {...yAxisProps} />
        {props.CustomTooltip === undefined ? (
          <Tooltip active={openReferenceTooltips.size ? false : undefined} />
        ) : (
          <Tooltip
            active={openReferenceTooltips.size ? false : undefined}
            content={props.CustomTooltip}
          />
        )}
        <Legend />
        <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} vertical={false} />
        {props.plots.map(plot => (
          <Area
            key={plot.name}
            {...(plot.stackId === undefined
              ? { stackId: '1' }
              : plot.stackId !== null
              ? { stackId: plot.stackId }
              : {})}
            type="step"
            dataKey={plot.name}
            stroke={plot.strokeColor}
            strokeWidth={2}
            fill={plot.fillColor}
            activeDot={{ r: 2 }}
            animationDuration={props.autoRefresh ? 0 : 400} // Disable animation when refreshing
          />
        ))}
        {referenceGroups.flatMap(group => {
          const line = group[0];
          const tooltip =
            line.tooltip === undefined ? undefined : (
              <Box>
                {group.map(member => (
                  <Box
                    key={referenceLineId(member)}
                    sx={{
                      '&:not(:last-child)': {
                        mb: 1,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    {member.tooltip}
                  </Box>
                ))}
                {line.tooltipFooter && <Box mt={1}>{line.tooltipFooter}</Box>}
              </Box>
            );
          const markerId = referenceLineId(line);
          return [
            ...group
              .slice(1)
              .map(member => (
                <ReferenceLine
                  key={`position:${referenceLineId(member)}`}
                  x={member.x}
                  y={member.y}
                  stroke={member.stroke ?? '#999'}
                  strokeDasharray={member.strokeDasharray || '15 15'}
                  ifOverflow="discard"
                  pointerEvents="none"
                />
              )),
            <ReferenceLine
              key={markerId}
              x={line.x}
              y={line.y}
              stroke={line.stroke ?? '#999'}
              ifOverflow="discard"
              strokeDasharray={line.strokeDasharray || '15 15'}
              shape={
                tooltip
                  ? (coordinates: MarkerCoordinates) => (
                      <RevisionMarkerShape
                        {...coordinates}
                        label={referenceGroupLabel(group)}
                        tooltip={tooltip}
                        markerId={markerId}
                        onOpen={openReferenceTooltip}
                        onClose={closeReferenceTooltip}
                      />
                    )
                  : undefined
              }
              label={
                tooltip
                  ? undefined
                  : {
                      value: line.label,
                      fontSize: 15,
                      fill: line.stroke,
                      position: line.x === undefined ? undefined : 'insideTopLeft',
                    }
              }
            />,
          ];
        })}
      </AreaChart>
    );
  } else if (state === ChartState.LOADING) {
    chartContent = <Loader title={t('Fetching Data')} />;
  } else if (state === ChartState.ERROR) {
    chartContent = (
      <Box
        width="100%"
        height="100%"
        p={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box>
          <EmptyContent color="error">{t('Error: {{ error }}', { error })}</EmptyContent>
        </Box>
      </Box>
    );
  } else {
    chartContent = (
      <Box
        width="100%"
        height="100%"
        p={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box>
          <EmptyContent>{t('No Data')}</EmptyContent>
        </Box>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" onResize={width => setChartWidth(width)}>
      {chartContent}
    </ResponsiveContainer>
  );
}
