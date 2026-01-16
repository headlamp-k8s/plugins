/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import { Box, Button, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { throttle } from 'lodash';
import React, {
  createContext,
  ReactNode,
  RefObject,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * ID of the container element that Activities will be rendered relative to.
 *
 * The knative plugin is responsible for rendering an element with this ID.
 */
export const KNATIVE_ACTIVITY_CONTAINER_ID = 'knative-activity-main';

type ContainerRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getVisibleContainerRect(container: HTMLElement): ContainerRect {
  const rect = container.getBoundingClientRect();

  // Clamp to viewport so "snap to edges" stays within the visible area
  // even when the container (or page) becomes taller than the viewport.
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : rect.right;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : rect.bottom;

  const top = Math.max(rect.top, 0);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, viewportWidth);
  const bottom = Math.min(rect.bottom, viewportHeight);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/** Activity position relative to the main container */
type ActivityLocation =
  | 'full'
  | 'split-left'
  | 'split-right'
  | 'split-top'
  | 'split-bottom'
  | 'window';

/** Independent screen or a page rendered on top of the app */
interface ActivityDescriptor {
  /** Unique ID */
  id: string;
  /** Content to display inside the activity */
  content: ReactNode;
  /** Current activity location */
  location: ActivityLocation;
  /** Title to render in the taskbar and in window */
  title?: ReactNode;
  /** Hides title from the window header */
  hideTitleInHeader?: boolean;
  /** Activity icon, optional but highly recommended */
  icon?: ReactNode;
  /** Whether this activity is minimized to the taskbar */
  minimized?: boolean;
  /**
   * Temporary activity will be closed if another activity is opened
   * It will turn into permanent one if user interacts with it
   */
  temporary?: boolean;
  /** Cluster of the launched activity */
  cluster?: string;
}

interface ActivityState {
  /** History of opened activities, list of IDs */
  history: string[];
  /** Map of all open activities, key is the ID */
  activities: Record<string, ActivityDescriptor>;
}

const initialState: ActivityState = {
  history: [],
  activities: {},
};

type ActivityAction =
  | { type: 'launch'; activity: ActivityDescriptor }
  | { type: 'close'; id: string }
  | { type: 'update'; id: string; diff: Partial<ActivityDescriptor> }
  | { type: 'reset' };

function activityReducer(state: ActivityState, action: ActivityAction): ActivityState {
  switch (action.type) {
    case 'launch': {
      const next: ActivityState = {
        history: [...state.history],
        activities: { ...state.activities },
      };

      const activity = action.activity;

      // Add to history when not minimized
      if (!activity.minimized) {
        next.history = next.history.filter(it => it !== activity.id);
        next.history.push(activity.id);
      }

      // Close other temporary activities
      Object.values(next.activities).forEach(existing => {
        if (existing.temporary) {
          delete next.activities[existing.id];
          next.history = next.history.filter(it => it !== existing.id);
        }
      });

      if (!next.activities[activity.id]) {
        // New activity, add it to the state
        next.activities[activity.id] = activity;
      } else {
        // Existing activity, un-minimize it
        next.activities[activity.id] = {
          ...next.activities[activity.id],
          minimized: false,
        };
      }

      // Make it fullscreen on small windows
      if (typeof window !== 'undefined' && window.innerWidth < 1280) {
        next.activities[activity.id] = {
          ...next.activities[activity.id],
          location: 'full',
        };
      }

      return next;
    }
    case 'close': {
      const next: ActivityState = {
        history: state.history.filter(it => it !== action.id),
        activities: { ...state.activities },
      };

      delete next.activities[action.id];
      return next;
    }
    case 'update': {
      const { id, diff } = action;

      if (!state.activities[id]) {
        return state;
      }

      const next: ActivityState = {
        history: [...state.history],
        activities: { ...state.activities },
      };

      // Bump this activity in history when not minimized
      if (!diff.minimized) {
        next.history = next.history.filter(it => it !== id);
        next.history.push(id);
      }

      // Remove from history if it's minimized
      if (diff.minimized) {
        next.history = next.history.filter(it => it !== id);
      }

      next.activities[id] = {
        ...next.activities[id],
        ...diff,
      };

      return next;
    }
    case 'reset': {
      return initialState;
    }
    default:
      return state;
  }
}

// Contexts holding all activities and dispatch
const ActivitiesStateContext = createContext<ActivityState | undefined>(undefined);

// Exposed context for the currently rendered activity (inside a window)
const ActivityContext = createContext<ActivityDescriptor | undefined>(undefined);

// Global dispatch handle so that Activity.launch / close / update can be called from anywhere.
let externalDispatch: React.Dispatch<ActivityAction> | undefined;

function useActivitiesState(): ActivityState {
  const ctx = useContext(ActivitiesStateContext);

  if (!ctx) {
    throw new Error('ActivitiesStateContext is not available. Wrap tree with ActivitiesProvider.');
  }

  return ctx;
}

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = React.useReducer(activityReducer, initialState);

  useEffect(() => {
    externalDispatch = dispatch;
    return () => {
      if (externalDispatch === dispatch) {
        externalDispatch = undefined;
      }
    };
  }, [dispatch]);

  return (
    <ActivitiesStateContext.Provider value={state}>{children}</ActivitiesStateContext.Provider>
  );
}

function dispatchAction(action: ActivityAction) {
  if (!externalDispatch) {
    // Outside of provider, do nothing.
    // This makes Activity.* safe to call even when provider is not mounted.
    return;
  }

  externalDispatch(action);

  // Dispatch resize event so the content adjusts (similar to upstream implementation)
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      window?.dispatchEvent?.(new Event('resize'));
    }, 200);
  }
}

export const Activity = {
  /** Launches new Activity */
  launch(activity: ActivityDescriptor) {
    dispatchAction({ type: 'launch', activity });
  },
  /** Closes activity */
  close(id: string) {
    dispatchAction({ type: 'close', id });
  },
  /** Update existing activity with a partial changes */
  update(id: string, diff: Partial<ActivityDescriptor>) {
    dispatchAction({ type: 'update', id, diff });
  },
  reset() {
    dispatchAction({ type: 'reset' });
  },
};

/** Control activity from within, requires to be used within an existing Activity */
export function useActivity() {
  const activity = useContext(ActivityContext);

  if (!activity) {
    throw new Error('useActivity must be used within an Activity window.');
  }

  const update = (changes: Partial<ActivityDescriptor>) => Activity.update(activity.id, changes);

  return [activity, update] as const;
}

/** Renders a single activity */
function SingleActivityRenderer({
  activity,
  zIndex,
  index,
  isOverview,
  onClick,
}: {
  activity: ActivityDescriptor;
  zIndex: number;
  /** Index of this activity within a list of all activities */
  index: number;
  /** Render in a small window for the overview state */
  isOverview: boolean;
  /** Click event callback */
  onClick: React.PointerEventHandler<HTMLDivElement>;
}) {
  const { id, minimized, location, content, title, hideTitleInHeader, icon, cluster } = activity;
  const activityElementRef = useRef<HTMLDivElement | null>(null);
  const containerElementRef = useRef<HTMLElement | null>(null);
  const [containerRect, setContainerRect] = useState<ContainerRect | null>(null);
  const [placementMenuAnchorEl, setPlacementMenuAnchorEl] = useState<HTMLElement | null>(null);
  const isPlacementMenuOpen = Boolean(placementMenuAnchorEl);

  useEffect(() => {
    containerElementRef.current = document.getElementById(KNATIVE_ACTIVITY_CONTAINER_ID);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = throttle(() => {
      const container = containerElementRef.current;
      if (!container) {
        setContainerRect(null);
        return;
      }
      setContainerRect(getVisibleContainerRect(container));
    }, 50);

    update();

    window.addEventListener('resize', update);
    // Capture scroll from any scroll container (body or nested) to keep Activities aligned.
    window.addEventListener('scroll', update, true);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      update.cancel();
    };
  }, []);

  // Styles of different activity locations
  const locationStyles = {
    full: {
      borderColor: 'transparent',
      boxShadow: 'none',
      borderRadius: 0,
      position: 'absolute',
      left: 0,
      width: '100%',
      height: '100%',
    },
    'split-right': {
      position: 'absolute',
      transform: 'translateX(100%)',
      width: '50%',
      height: '100%',
    },
    'split-left': {
      position: 'absolute',
      width: '50%',
      height: '100%',
    },
    'split-top': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '50%',
    },
    'split-bottom': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '50%',
    },
    window: {
      position: 'absolute',
      width: '50%',
      height: '70%',
      border: '1px solid',
      borderTop: '1px solid',
      borderBottom: '1px solid',
      borderRadius: '10px',
    },
  }[location ?? 'full'];

  // Reset styles when switching to window location
  useEffect(() => {
    const container = activityElementRef.current;
    if (!container) return;

    if (location !== 'window') {
      container.style.transform = '';
      container.style.width = '';
      container.style.height = '';
    }
  }, [location]);

  // Toggle overview styles
  useEffect(() => {
    const activityEl = activityElementRef.current;
    const container = containerElementRef.current;
    if (!activityEl || !container) return;

    let oldTranslation: string | undefined;
    let oldHeight: string | undefined;
    let oldWidth: string | undefined;

    if (isOverview) {
      const cols = 3;
      const rows = 5;
      const gapPx = 20;
      const box = getVisibleContainerRect(container);
      const x = (box.width / cols) * (index % 3) + gapPx;
      const y = (box.height / rows) * Math.floor(index / 3) + gapPx;
      const width = box.width / cols - gapPx * (cols - 2);
      const height = box.height / rows - gapPx * (rows - 2);

      oldTranslation = activityEl.style.transform ?? '';
      oldHeight = activityEl.style.height;
      oldWidth = activityEl.style.width;

      activityEl.style.width = width + 'px';
      activityEl.style.height = height + 'px';
      activityEl.style.transform = `translate(${x}px, ${y}px)`;
    }

    return () => {
      if (oldTranslation !== undefined) {
        activityEl.style.transform = oldTranslation;
        activityEl.style.width = oldWidth ?? '';
        activityEl.style.height = oldHeight ?? '';
      }
    };
  }, [isOverview, index]);

  // Move focus inside the Activity
  useEffect(() => {
    if (!minimized && activityElementRef.current) {
      // Find first focusable element
      const focusableElements = activityElementRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement | undefined;
      if (firstElement && typeof firstElement.focus === 'function') {
        firstElement.focus();
      }
    }
  }, [minimized]);

  // Save last used location
  const lastNonFullscreenLocation = useRef<ActivityLocation>();
  useEffect(() => {
    if (location !== 'full') {
      lastNonFullscreenLocation.current = location;
    }
  }, [location]);

  return (
    <ActivityContext.Provider value={activity}>
      <Box
        role="complementary"
        sx={{
          display: minimized && !isOverview ? 'none' : undefined,
          position: 'fixed',
          top: containerRect?.top ?? 0,
          left: containerRect?.left ?? 0,
          width: containerRect?.width ?? '100%',
          height: containerRect?.height ?? '100%',
          zIndex: zIndex ?? 3,
          // Do not block interactions with the underlying page.
          // Only the Activity window itself should be interactive.
          pointerEvents: 'none',
        }}
      >
        <Box
          ref={activityElementRef}
          onPointerDownCapture={(e: React.PointerEvent<HTMLDivElement>) => {
            if (isOverview) {
              e.stopPropagation();
              e.preventDefault();
            }
            Activity.update(id, { temporary: false });
            onClick(e);
          }}
          sx={(theme: Theme) => ({
            display: 'flex',
            opacity: minimized && !isOverview ? 0 : 1,
            flexDirection: 'column',
            background: theme.palette.background.default,
            pointerEvents: 'auto',
            border: '1px solid',
            borderTop: 'none',
            borderBottom: 'none',
            willChange: 'top, left, width, height',
            zIndex: zIndex ?? 3,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0px 0px 15px rgba(0,0,0,0.15)'
                : '0px 0px 15px rgba(0,0,0,0.7)',
            ...locationStyles,
            ...(isOverview
              ? {
                  borderRadius: '20px',
                  cursor: 'pointer',
                  ':hover': {
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0px 0px 15px rgba(0,0,0,0.25)'
                        : '0px 0px 15px rgba(0,0,0,0.17)',
                  },
                }
              : {}),
            borderColor: theme.palette.divider,
            transitionDuration: '0.25s',
            transitionProperty: 'width,height,left,top,transform',
          })}
        >
          {isOverview && (
            <Box
              sx={{
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 1,
                gap: 1,
                height: '100%',
              }}
            >
              <Box sx={{ width: '48px', height: '48px', flexShrink: 0 }}>{icon}</Box> {title}
            </Box>
          )}
          <>
            {!minimized && !isOverview && null}

            <Box
              sx={{
                display: isOverview ? 'none' : 'flex',
                gap: 1,
                alignItems: 'center',
                height: '40px',
                padding: '0 16px',
                flexShrink: 0,
              }}
            >
              {!hideTitleInHeader && (
                <>
                  <Box sx={{ width: '18px', height: '18px' }}>{icon}</Box>
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: 14,
                      maxWidth: 'calc(45% - 60px)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                    title={typeof title === 'string' ? title : undefined}
                  >
                    {title}
                  </Typography>
                </>
              )}
              <Box sx={{ marginRight: 'auto' }} />

              {cluster && (
                <Box
                  sx={(theme: Theme) => ({
                    fontSize: '0.875rem',
                    paddingX: 0.5,
                    color: theme.palette.text.secondary,
                  })}
                >
                  <Icon icon="mdi:hexagon-multiple-outline" />
                  {cluster}
                </Box>
              )}
              {!isOverview && (
                <>
                  <IconButton
                    size="small"
                    title="Window"
                    aria-label="Window"
                    aria-haspopup="menu"
                    aria-expanded={isPlacementMenuOpen ? 'true' : undefined}
                    onClick={event => setPlacementMenuAnchorEl(event.currentTarget)}
                  >
                    <Icon icon="mdi:dock-window" />
                  </IconButton>
                  <Menu
                    anchorEl={placementMenuAnchorEl}
                    open={isPlacementMenuOpen}
                    onClose={() => setPlacementMenuAnchorEl(null)}
                    MenuListProps={{ 'aria-label': 'Window' }}
                  >
                    <MenuItem
                      selected={location === 'split-left'}
                      disabled={location === 'split-left'}
                      onClick={() => {
                        Activity.update(id, { location: 'split-left' });
                        setPlacementMenuAnchorEl(null);
                      }}
                    >
                      <Box sx={{ width: 22, height: 22, marginRight: 1, display: 'flex' }}>
                        <Icon icon="mdi:dock-left" />
                      </Box>
                      Snap Left
                    </MenuItem>
                    <MenuItem
                      selected={location === 'split-right'}
                      disabled={location === 'split-right'}
                      onClick={() => {
                        Activity.update(id, { location: 'split-right' });
                        setPlacementMenuAnchorEl(null);
                      }}
                    >
                      <Box sx={{ width: 22, height: 22, marginRight: 1, display: 'flex' }}>
                        <Icon icon="mdi:dock-right" />
                      </Box>
                      Snap Right
                    </MenuItem>
                    <MenuItem
                      selected={location === 'split-top'}
                      disabled={location === 'split-top'}
                      onClick={() => {
                        Activity.update(id, { location: 'split-top' });
                        setPlacementMenuAnchorEl(null);
                      }}
                    >
                      <Box sx={{ width: 22, height: 22, marginRight: 1, display: 'flex' }}>
                        <Icon icon="mdi:dock-top" />
                      </Box>
                      Snap Top
                    </MenuItem>
                    <MenuItem
                      selected={location === 'split-bottom'}
                      disabled={location === 'split-bottom'}
                      onClick={() => {
                        Activity.update(id, { location: 'split-bottom' });
                        setPlacementMenuAnchorEl(null);
                      }}
                    >
                      <Box sx={{ width: 22, height: 22, marginRight: 1, display: 'flex' }}>
                        <Icon icon="mdi:dock-bottom" />
                      </Box>
                      Snap Bottom
                    </MenuItem>
                    <MenuItem
                      selected={location === 'full'}
                      disabled={location === 'full'}
                      onClick={() => {
                        Activity.update(id, { location: 'full' });
                        setPlacementMenuAnchorEl(null);
                      }}
                    >
                      <Box sx={{ width: 22, height: 22, marginRight: 1, display: 'flex' }}>
                        <Icon icon="mdi:fullscreen" />
                      </Box>
                      Fullscreen
                    </MenuItem>
                  </Menu>
                  <IconButton
                    onClick={() => {
                      Activity.update(id, { minimized: true });
                    }}
                    size="small"
                    title="Minimize"
                  >
                    <Icon icon="mdi:minimize" />
                  </IconButton>
                  <IconButton onClick={() => Activity.close(id)} size="small" title="Close">
                    <Icon icon="mdi:close" />
                  </IconButton>
                </>
              )}
            </Box>
            <Suspense fallback={null}>
              <Box
                sx={{
                  display: isOverview ? 'none' : 'flex',
                  overflowY: 'auto',
                  scrollbarGutter: 'stable',
                  scrollbarWidth: 'thin',
                  flexGrow: 1,
                  flexDirection: 'column',
                }}
              >
                {content}
              </Box>
            </Suspense>
            {location === 'window' && <ActivityResizer activityElementRef={activityElementRef} />}
          </>
        </Box>
      </Box>
    </ActivityContext.Provider>
  );
}

const minHeight = 200;
const minWidth = 400;

/** Corner resize component */
function ActivityResizer({ activityElementRef }: { activityElementRef: RefObject<HTMLElement> }) {
  return (
    <Box
      sx={{
        width: '44px',
        height: '44px',
        position: 'absolute',
        zIndex: 1,
        bottom: '-10px',
        right: '-10px',
        padding: '0 12px 12px 0',
        cursor: 'nwse-resize',
        touchAction: 'none',
      }}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();

        const activityElement = activityElementRef.current;
        if (!activityElement) return;

        const onMoveCallback = throttle(() => {
          window?.dispatchEvent?.(new Event('resize'));
        }, 100);

        const pointerX = e.clientX;
        const pointerY = e.clientY;

        const startWidth = activityElement.getBoundingClientRect().width;
        const startHeight = activityElement.getBoundingClientRect().height;

        // Disable transition while resizing
        const oldTransitionDuration = activityElement.style.transitionDuration;
        activityElement.style.transitionDuration = '0s';

        const handleMove = (event: PointerEvent) => {
          const dx = event.clientX - pointerX;
          const dy = event.clientY - pointerY;
          const width = Math.max(minWidth, startWidth + dx);
          const height = Math.max(minHeight, startHeight + dy);

          activityElement.style.width = width + 'px';
          activityElement.style.height = height + 'px';

          onMoveCallback();
        };

        document.addEventListener('pointermove', handleMove);

        document.addEventListener(
          'pointerup',
          () => {
            document.removeEventListener('pointermove', handleMove);
            activityElement.style.transitionDuration = oldTransitionDuration;
          },
          { once: true }
        );
      }}
    >
      <Icon
        icon="mdi:resize-bottom-right"
        width="100%"
        height="100%"
        style={{ pointerEvents: 'none', opacity: 0.6 }}
      />
    </Box>
  );
}

/** Renders all activities and the taskbar */
export const ActivitiesRenderer = React.memo(function ActivitiesRenderer() {
  const { activities, history } = useActivitiesState();
  const list = Object.values(activities);
  const [isOverview, setIsOverview] = useState(false);

  useEffect(() => {
    if (list.length === 0 && isOverview) {
      setIsOverview(false);
    }
  }, [list, isOverview]);

  return (
    <>
      <Box
        sx={{
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(5px) saturate(1.2)',
          gridColumn: '1/2',
          gridRow: '1/2',
          position: 'absolute',
          inset: 0,
          display: isOverview ? 'block' : 'none',
          zIndex: 1,
        }}
      />
      {list.map((it, i) => (
        <SingleActivityRenderer
          key={it.id}
          activity={it}
          zIndex={4 + history.indexOf(it.id)}
          index={i}
          isOverview={isOverview}
          onClick={() => {
            if (isOverview) {
              setIsOverview(false);
              Activity.update(it.id, { minimized: false });
            }
          }}
        />
      ))}
      {isOverview && (
        <Box
          sx={{
            zIndex: 1,
            gridColumn: '1/2',
            gridRow: '1/2',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Button
            size="large"
            variant="contained"
            startIcon={<Icon icon="mdi:close-box-multiple-outline" />}
            onClick={() => {
              Activity.reset();
              setIsOverview(false);
            }}
            sx={{
              margin: 5,
              lineHeight: 1,
            }}
          >
            Close All
          </Button>
        </Box>
      )}
      <ActivityBar setIsOverview={setIsOverview} />
    </>
  );
});

/** Taskbar with all current activities */
const ActivityBar = React.memo(function ActivityBar({
  setIsOverview,
}: {
  setIsOverview: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { activities, history } = useActivitiesState();
  const list = Object.values(activities);
  const lastElement = history.length > 0 ? history[history.length - 1] : undefined;

  if (list.length === 0) return null;

  return (
    <Box
      sx={(theme: Theme) => ({
        background: theme.palette.background.paper,
        borderTop: '1px solid',
        borderColor: theme.palette.divider,
        gridRow: '2 / 3',
        gridColumn: '1 / 2',
        paddingLeft: 1,
        zIndex: 10,
        position: 'relative',
        alignItems: 'center',
        display: 'flex',
        minHeight: '56px',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
      })}
    >
      {[...list].reverse().map(it => (
        <Box
          key={it.id}
          sx={(theme: Theme) => ({
            display: 'flex',
            alignItems: 'center',
            padding: '3px',
            height: '100%',
            position: 'relative',
            border: '1px solid',
            borderTop: 0,
            borderColor: lastElement === it.id ? theme.palette.divider : 'transparent',
            background: lastElement === it.id ? theme.palette.background.default : 'transparent',
          })}
        >
          <Button
            sx={{
              height: '100%',
              padding: '0px 5px 0 10px',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              justifyContent: 'start',
            }}
            onClick={() => {
              // Minimize or show Activity, unless it's not active then bring it to front
              Activity.update(it.id, { minimized: it.id !== lastElement ? false : !it.minimized });
            }}
            onMouseDown={event => {
              if (event.button === 1) {
                Activity.close(it.id);
              }
            }}
          >
            <Box sx={{ width: '22px', height: '22px', flexShrink: 0, marginRight: 1 }}>
              {it.icon}
            </Box>
            <Box
              sx={{
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                overflow: 'hidden',
              }}
            >
              {it.cluster && <Box sx={{ opacity: 0.7 }}>{it.cluster}</Box>}{' '}
              <Box
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontStyle: it.temporary ? 'italic' : undefined,
                }}
              >
                {it.title ?? 'Something'}
              </Box>
            </Box>
          </Button>
          <IconButton
            size="small"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              Activity.close(it.id);
            }}
            sx={{ width: '42px', height: '100%', borderRadius: 1, flexShrink: 0 }}
            aria-label="Close"
          >
            <Icon icon="mdi:close" />
          </IconButton>
        </Box>
      ))}
      <Box
        sx={(theme: Theme) => ({
          marginLeft: 'auto',
          flexShrink: 0,
          position: 'sticky',
          right: 0,
          background: theme.palette.background.paper,
        })}
      >
        <Tooltip title="Overview">
          <IconButton onClick={() => setIsOverview(it => !it)} aria-label="Overview">
            <Icon icon="mdi:grid-large" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});
