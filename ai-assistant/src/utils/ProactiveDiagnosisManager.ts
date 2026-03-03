/**
 * ProactiveDiagnosisManager
 *
 * Manages proactive AI diagnosis of recent Warning/Error Kubernetes events.
 * - Periodically (every 5 minutes) fetches the top 15 warning/error events.
 * - Caches diagnoses keyed by event UID to avoid redundant AI calls.
 * - Emits events so React components can subscribe to updates.
 * - Runs diagnoses sequentially (server aborts concurrent SSE streams).
 */

import { EventEmitter } from 'events';
import { basePrompt } from '../ai/prompts';

export interface EventDigest {
  /** The event UID (metadata.uid) – primary cache key */
  uid: string;
  /** Event name */
  name: string;
  /** Warning / Error */
  type: string;
  /** Reason field */
  reason: string;
  /** Human-readable message */
  message: string;
  /** Involved object kind */
  objectKind: string;
  /** Involved object name */
  objectName: string;
  /** Involved object namespace */
  objectNamespace: string;
  /** Last timestamp of the event */
  lastTimestamp: string;
  /** The raw event JSON for context */
  rawEvent: any;
}

export interface DiagnosisThinkingStep {
  id: string;
  content: string;
  type: 'tool-start' | 'tool-result' | 'intermediate-text' | 'todo-update';
  timestamp: number;
}

export interface DiagnosisResult {
  /** Matches EventDigest.uid */
  eventUid: string;
  /** The event digest this diagnosis is for */
  event: EventDigest;
  /** The AI-generated diagnosis text */
  diagnosis: string;
  /** Timestamp when the diagnosis was generated */
  diagnosedAt: number;
  /** Whether diagnosis is currently loading (actively being processed) */
  loading: boolean;
  /** Whether this event is queued and waiting to be processed */
  pending?: boolean;
  /** Error message if diagnosis failed */
  error?: string;
  /** Intermediate thinking steps accumulated during diagnosis */
  thinkingSteps?: DiagnosisThinkingStep[];
}

/** Callback to report intermediate thinking steps during diagnosis */
export type DiagnosisStepCallback = (step: DiagnosisThinkingStep) => void;

type DiagnoseFn = (prompt: string, onStep?: DiagnosisStepCallback) => Promise<string>;

export class ProactiveDiagnosisManager extends EventEmitter {
  /** uid → DiagnosisResult */
  private cache = new Map<string, DiagnosisResult>();
  /** Interval handle */
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  /** Whether a diagnosis cycle is currently running */
  private running = false;
  /** Queue for single-event diagnosis requests that arrive while a cycle is running */
  private singleEventQueue: Array<{ event: EventDigest; resolve: (r: DiagnosisResult) => void; reject: (e: any) => void }> = [];
  /** The function to call to get a diagnosis from the AI */
  private diagnoseFn: DiagnoseFn | null = null;
  /** Interval in ms (default 5 minutes) */
  private intervalMs = 5 * 60 * 1000;
  /** Whether proactive diagnosis is enabled */
  private enabled = false;
  /** The event UID the user wants to scroll to */
  private _scrollToEventUid: string | null = null;
  /**
   * Persistent set of resource keys (kind/ns/name) that have been
   * successfully diagnosed. Survives cache changes so that a CronJob
   * re-emitting events under new UIDs won't be re-diagnosed.
   */
  private diagnosedResourceKeys = new Set<string>();

  /**
   * Build a unique key for the involved resource of an event.
   * Strips Kubernetes-generated hash suffixes and ignores objectKind so
   * that events across the Deployment → ReplicaSet → Pod hierarchy all
   * map to the same key.
   */
  private static resourceKey(event: EventDigest): string {
    const baseName = ProactiveDiagnosisManager.stripHashSuffixes(event.objectName);
    return `${event.objectNamespace || '_'}/${baseName}`;
  }

  /**
   * Set the diagnosis function. This is called by the modal/AI manager
   * when the AI infrastructure is ready.
   */
  setDiagnoseFn(fn: DiagnoseFn | null) {
    this.diagnoseFn = fn;
  }

  /**
   * Check whether a diagnosis (cycle or single-event) is currently running.
   * Used by the UI to block chat input during active diagnosis.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Start proactive diagnosis polling.
   * Safe to call multiple times – will not create duplicate intervals.
   */
  start() {
    if (this.enabled) return;
    this.enabled = true;
    // Run immediately on start, then every intervalMs
    this.emit('status-change', { enabled: true });
  }

  /**
   * Stop proactive diagnosis polling.
   */
  stop() {
    this.enabled = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.emit('status-change', { enabled: false });
  }

  /**
   * Get all cached diagnosis results (most recent first).
   */
  getAllDiagnoses(): DiagnosisResult[] {
    return Array.from(this.cache.values()).sort((a, b) => b.diagnosedAt - a.diagnosedAt);
  }

  /**
   * Get a single diagnosis by event UID.
   */
  getDiagnosis(eventUid: string): DiagnosisResult | undefined {
    return this.cache.get(eventUid);
  }

  /**
   * Check if a diagnosis is already cached for the given event UID.
   */
  hasDiagnosis(eventUid: string): boolean {
    const result = this.cache.get(eventUid);
    return !!result && !result.loading && !result.error;
  }

  /**
   * Check if a diagnosis (successful, loading, or pending) already exists
   * for the same involved resource (kind/namespace/name), regardless of event UID.
   * Also checks the persistent diagnosedResourceKeys set so that resources
   * are never re-diagnosed even if they generate new event UIDs.
   */
  hasDiagnosisForResource(event: EventDigest): boolean {
    const key = ProactiveDiagnosisManager.resourceKey(event);

    // Fast path: already in the persistent "done" set
    if (this.diagnosedResourceKeys.has(key)) return true;

    // Slower check: still loading / pending in the cache
    for (const cached of this.cache.values()) {
      if (ProactiveDiagnosisManager.resourceKey(cached.event) === key) {
        if (!cached.error) return true;
      }
    }
    return false;
  }

  /**
   * Set the UID of the event the user wants to scroll to.
   * The UI component should consume this and clear it after scrolling.
   */
  setScrollToEventUid(uid: string | null) {
    this._scrollToEventUid = uid;
    if (uid) {
      this.emit('scroll-to-event', uid);
    }
  }

  getScrollToEventUid(): string | null {
    return this._scrollToEventUid;
  }

  clearScrollToEventUid() {
    this._scrollToEventUid = null;
  }

  /**
   * Diagnose a list of events. Skips events that are already cached.
   * Runs diagnoses sequentially — the Holmes ag-ui server aborts previous
   * SSE connections when concurrent requests arrive, so we must process
   * one at a time (same pattern as normal chat).
   */
  async diagnoseEvents(events: EventDigest[]): Promise<void> {
    if (this.running) return;
    if (!this.diagnoseFn) return;

    this.running = true;
    this.emit('cycle-start');

    try {
      // Filter out events that already have a successful diagnosis
      // or that target a resource already being diagnosed / diagnosed
      const toDiagnose = events.filter(event =>
        !this.hasDiagnosis(event.uid) && !this.hasDiagnosisForResource(event)
      );

      if (toDiagnose.length === 0) {
        return;
      }

      // Mark all as pending first (queued, not yet processing)
      for (const event of toDiagnose) {
        const pendingResult: DiagnosisResult = {
          eventUid: event.uid,
          event,
          diagnosis: '',
          diagnosedAt: Date.now(),
          loading: false,
          pending: true,
        };
        this.cache.set(event.uid, pendingResult);
        this.emit('diagnosis-update', pendingResult);
      }

      // Process sequentially — the Holmes server can only handle one
      // SSE stream at a time (concurrent requests cause AbortError).
      const diagnoseFn = this.diagnoseFn;

      for (const event of toDiagnose) {
        // Mark the current event as loading (actively processing)
        const loadingResult: DiagnosisResult = {
          eventUid: event.uid,
          event,
          diagnosis: '',
          diagnosedAt: Date.now(),
          loading: true,
          pending: false,
          thinkingSteps: [],
        };
        this.cache.set(event.uid, loadingResult);
        this.emit('diagnosis-update', loadingResult);

        try {
          const prompt = this.buildPrompt(event);

          // onStep callback: accumulates thinking steps and emits updates
          const onStep: DiagnosisStepCallback = (step) => {
            const current = this.cache.get(event.uid);
            if (current) {
              const updated: DiagnosisResult = {
                ...current,
                thinkingSteps: [...(current.thinkingSteps || []), step],
              };
              this.cache.set(event.uid, updated);
              this.emit('diagnosis-update', updated);
            }
          };

          const diagnosis = await diagnoseFn(prompt, onStep);

          const result: DiagnosisResult = {
            eventUid: event.uid,
            event,
            diagnosis,
            diagnosedAt: Date.now(),
            loading: false,
            pending: false,
            thinkingSteps: this.cache.get(event.uid)?.thinkingSteps || [],
          };
          this.cache.set(event.uid, result);
          // Mark resource as permanently diagnosed so future events for the
          // same resource (under new UIDs) are skipped.
          this.diagnosedResourceKeys.add(ProactiveDiagnosisManager.resourceKey(event));
          this.emit('diagnosis-update', result);
        } catch (err: any) {
          const errorResult: DiagnosisResult = {
            eventUid: event.uid,
            event,
            diagnosis: '',
            diagnosedAt: Date.now(),
            loading: false,
            pending: false,
            error: err?.message || 'Diagnosis failed',
          };
          this.cache.set(event.uid, errorResult);
          this.emit('diagnosis-update', errorResult);
        }
      }
    } finally {
      this.running = false;
      this.emit('cycle-end');
      // Process any queued single-event requests
      this._drainSingleEventQueue();
    }
  }

  /**
   * Force a diagnosis for a single event (used when clicking from the table).
   * If a diagnosis cycle is already running, queues this request and processes it
   * after the current cycle completes.
   */
  async diagnoseSingleEvent(event: EventDigest): Promise<DiagnosisResult> {
    // Return cached result if available
    const cached = this.cache.get(event.uid);
    if (cached && !cached.loading && !cached.error) {
      return cached;
    }

    if (!this.diagnoseFn) {
      throw new Error('Diagnosis function not available');
    }

    // If a cycle is already running, queue this request
    if (this.running) {
      return new Promise<DiagnosisResult>((resolve, reject) => {
        this.singleEventQueue.push({ event, resolve, reject });
      });
    }

    return this._executeSingleDiagnosis(event);
  }

  /**
   * Internal: execute a single-event diagnosis. Sets the running flag and
   * emits cycle events so the UI can block chat input.
   */
  private async _executeSingleDiagnosis(event: EventDigest): Promise<DiagnosisResult> {
    this.running = true;
    this.emit('cycle-start');

    // Mark as loading (actively processing)
    const loadingResult: DiagnosisResult = {
      eventUid: event.uid,
      event,
      diagnosis: '',
      diagnosedAt: Date.now(),
      loading: true,
      pending: false,
      thinkingSteps: [],
    };
    this.cache.set(event.uid, loadingResult);
    this.emit('diagnosis-update', loadingResult);

    try {
      const prompt = this.buildPrompt(event);

      // onStep callback: accumulates thinking steps and emits updates
      const onStep: DiagnosisStepCallback = (step) => {
        const current = this.cache.get(event.uid);
        if (current) {
          const updated: DiagnosisResult = {
            ...current,
            thinkingSteps: [...(current.thinkingSteps || []), step],
          };
          this.cache.set(event.uid, updated);
          this.emit('diagnosis-update', updated);
        }
      };

      const diagnosis = await this.diagnoseFn!(prompt, onStep);

      const result: DiagnosisResult = {
        eventUid: event.uid,
        event,
        diagnosis,
        diagnosedAt: Date.now(),
        loading: false,
        pending: false,
        thinkingSteps: this.cache.get(event.uid)?.thinkingSteps || [],
      };
      this.cache.set(event.uid, result);
      this.diagnosedResourceKeys.add(ProactiveDiagnosisManager.resourceKey(event));
      this.emit('diagnosis-update', result);
      return result;
    } catch (err: any) {
      const errorResult: DiagnosisResult = {
        eventUid: event.uid,
        event,
        diagnosis: '',
        diagnosedAt: Date.now(),
        loading: false,
        pending: false,
        error: err?.message || 'Diagnosis failed',
      };
      this.cache.set(event.uid, errorResult);
      this.emit('diagnosis-update', errorResult);
      return errorResult;
    } finally {
      this.running = false;
      this.emit('cycle-end');
      // Process queued single-event requests
      this._drainSingleEventQueue();
    }
  }

  /**
   * Process queued single-event diagnosis requests one by one.
   */
  private _drainSingleEventQueue() {
    if (this.singleEventQueue.length === 0) return;
    const next = this.singleEventQueue.shift()!;
    this._executeSingleDiagnosis(next.event)
      .then(next.resolve)
      .catch(next.reject);
  }

  /**
   * Build a diagnosis prompt for a single event.
   */
  private buildPrompt(event: EventDigest): string {
    return (
      `## System Context\n` +
      `${basePrompt}\n\n` +
      `---\n\n` +
      `A Kubernetes ${event.type} event has been detected that requires investigation.\n\n` +
      `## Event Details\n` +
      `- **Event UID:** ${event.uid}\n` +
      `- **Event Name:** ${event.name}\n` +
      `- **Type:** ${event.type}\n` +
      `- **Reason:** ${event.reason}\n` +
      `- **Message:** ${event.message}\n` +
      `- **Involved Object:** ${event.objectKind}/${event.objectName}` +
      (event.objectNamespace ? ` in namespace \`${event.objectNamespace}\`` : '') +
      `\n- **Last Seen:** ${event.lastTimestamp}\n` +
      `\nPlease provide a thorough and detailed diagnosis by covering the following:\n\n` +
      `1. **What happened:** Clearly explain what this event means and why it occurred. ` +
      `Describe the issue in plain language so that someone unfamiliar with the internals can understand it.\n` +
      `2. **Root cause analysis:** Investigate and identify the most likely root cause. ` +
      `Examine the involved resource and any related objects (parent Deployments, ReplicaSets, ConfigMaps, Secrets, etc.) to trace the origin of the problem.\n` +
      `3. **Impact:** Explain what effect this issue has on the cluster, the workload, or end users.\n` +
      `4. **Remediation steps:** Provide specific, actionable steps to resolve the issue. ` +
      `Include exact kubectl commands or manifest changes where applicable.\n` +
      `5. **Prevention:** Suggest best practices or configuration changes to prevent this from recurring.\n\n` +
      `## Formatting Instructions\n` +
      `- Format your response in clear Markdown with headers and bullet points for readability.\n` +
      `- When including any YAML (Kubernetes manifests, configuration snippets, etc.), ` +
      `always wrap it in a markdown code block with the \`yaml\` language tag (e.g. \`\`\`yaml ... \`\`\`). ` +
      `The UI automatically parses YAML code blocks and renders them in an interactive editor, ` +
      `so never paste raw YAML outside of a code block.`
    );
  }

  /**
   * Clear all cached diagnoses.
   */
  clearCache() {
    this.cache.clear();
    this.diagnosedResourceKeys.clear();
    this.emit('cache-cleared');
  }

  /**
   * Strip Kubernetes-generated hash suffixes from a resource name to find
   * the "root" workload name. Handles chained suffixes like those on Pods
   * created by ReplicaSets created by Deployments:
   *   myapp-7b8d9c5f6d-xk4z2  →  myapp
   *   myapp-7b8d9c5f6d         →  myapp
   *   myapp                    →  myapp
   *
   * Heuristic: repeatedly strip a trailing `-<segment>` when the segment
   * looks like a generated hash. A segment is considered a hash only if it
   * is 4-10 lowercase-alphanumeric chars AND contains at least one digit.
   * This avoids stripping meaningful name parts like `-server`, `-proxy`,
   * or `-manager` which are purely alphabetic.
   */
  private static stripHashSuffixes(name: string): string {
    let stripped = name;
    // Keep stripping trailing hash-like segments (e.g. -xk4z2, -7b8d9c5f6d)
    // The segment must contain at least one digit to qualify as a hash.
    while (true) {
      const match = stripped.match(/^(.+)-([a-z0-9]{4,10})$/);
      if (match && match[1] && match[2] && /\d/.test(match[2])) {
        stripped = match[1];
      } else {
        break;
      }
    }
    return stripped;
  }

  /**
   * Extract top N Warning/Error events from a list, sorted by lastTimestamp (most recent first).
   * Deduplicates by the root workload name so that events across Deployment →
   * ReplicaSet → Pod hierarchies only consume one slot.
   */
  static extractTopEvents(events: any[], limit = 15): EventDigest[] {
    const warningOrError = events.filter(
      (e: any) => {
        const type = e?.jsonData?.type || e?.type || '';
        return type === 'Warning' || type === 'Error';
      }
    );

    // Sort by lastTimestamp descending
    warningOrError.sort((a: any, b: any) => {
      const tsA = new Date(a?.jsonData?.lastTimestamp || a?.lastTimestamp || 0).getTime();
      const tsB = new Date(b?.jsonData?.lastTimestamp || b?.lastTimestamp || 0).getTime();
      return tsB - tsA;
    });

    // Deduplicate by root workload — strip generated hash suffixes and
    // ignore objectKind so that Pod / ReplicaSet / Deployment events for the
    // same workload collapse into a single slot (the most recent one).
    const seen = new Set<string>();
    const deduped = warningOrError.filter((e: any) => {
      const data = e?.jsonData || e;
      const io = data?.involvedObject || {};
      const baseName = ProactiveDiagnosisManager.stripHashSuffixes(io?.name || '');
      const key = `${io?.namespace || '_'}/${baseName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped.slice(0, limit).map((e: any) => {
      const data = e?.jsonData || e;
      const involvedObject = data?.involvedObject || {};
      return {
        uid: data?.metadata?.uid || `${data?.metadata?.name}-${data?.metadata?.namespace}`,
        name: data?.metadata?.name || 'unknown',
        type: data?.type || 'Warning',
        reason: data?.reason || '',
        message: data?.message || '',
        objectKind: involvedObject?.kind || '',
        objectName: involvedObject?.name || '',
        objectNamespace: involvedObject?.namespace || '',
        lastTimestamp: data?.lastTimestamp || data?.metadata?.creationTimestamp || '',
        rawEvent: data,
      };
    });
  }
}

// Singleton instance
export const proactiveDiagnosisManager = new ProactiveDiagnosisManager();
