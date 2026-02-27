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

export interface DiagnosisResult {
  /** Matches EventDigest.uid */
  eventUid: string;
  /** The event digest this diagnosis is for */
  event: EventDigest;
  /** The AI-generated diagnosis text */
  diagnosis: string;
  /** Timestamp when the diagnosis was generated */
  diagnosedAt: number;
  /** Whether diagnosis is currently loading */
  loading: boolean;
  /** Error message if diagnosis failed */
  error?: string;
}

type DiagnoseFn = (prompt: string) => Promise<string>;

export class ProactiveDiagnosisManager extends EventEmitter {
  /** uid → DiagnosisResult */
  private cache = new Map<string, DiagnosisResult>();
  /** Interval handle */
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  /** Whether a diagnosis cycle is currently running */
  private running = false;
  /** The function to call to get a diagnosis from the AI */
  private diagnoseFn: DiagnoseFn | null = null;
  /** Interval in ms (default 5 minutes) */
  private intervalMs = 5 * 60 * 1000;
  /** Whether proactive diagnosis is enabled */
  private enabled = false;
  /** The event UID the user wants to scroll to */
  private _scrollToEventUid: string | null = null;

  /**
   * Set the diagnosis function. This is called by the modal/AI manager
   * when the AI infrastructure is ready.
   */
  setDiagnoseFn(fn: DiagnoseFn | null) {
    this.diagnoseFn = fn;
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
      const toDiagnose = events.filter(event => !this.hasDiagnosis(event.uid));

      if (toDiagnose.length === 0) {
        return;
      }

      // Mark all as loading first
      for (const event of toDiagnose) {
        const loadingResult: DiagnosisResult = {
          eventUid: event.uid,
          event,
          diagnosis: '',
          diagnosedAt: Date.now(),
          loading: true,
        };
        this.cache.set(event.uid, loadingResult);
        this.emit('diagnosis-update', loadingResult);
      }

      // Process sequentially — the Holmes server can only handle one
      // SSE stream at a time (concurrent requests cause AbortError).
      const diagnoseFn = this.diagnoseFn;

      for (const event of toDiagnose) {
        try {
          const prompt = this.buildPrompt(event);
          const diagnosis = await diagnoseFn(prompt);

          const result: DiagnosisResult = {
            eventUid: event.uid,
            event,
            diagnosis,
            diagnosedAt: Date.now(),
            loading: false,
          };
          this.cache.set(event.uid, result);
          this.emit('diagnosis-update', result);
        } catch (err: any) {
          const errorResult: DiagnosisResult = {
            eventUid: event.uid,
            event,
            diagnosis: '',
            diagnosedAt: Date.now(),
            loading: false,
            error: err?.message || 'Diagnosis failed',
          };
          this.cache.set(event.uid, errorResult);
          this.emit('diagnosis-update', errorResult);
        }
      }
    } finally {
      this.running = false;
      this.emit('cycle-end');
    }
  }

  /**
   * Force a diagnosis for a single event (used when clicking from the table).
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

    // Mark as loading
    const loadingResult: DiagnosisResult = {
      eventUid: event.uid,
      event,
      diagnosis: '',
      diagnosedAt: Date.now(),
      loading: true,
    };
    this.cache.set(event.uid, loadingResult);
    this.emit('diagnosis-update', loadingResult);

    try {
      const prompt = this.buildPrompt(event);
      const diagnosis = await this.diagnoseFn(prompt);

      const result: DiagnosisResult = {
        eventUid: event.uid,
        event,
        diagnosis,
        diagnosedAt: Date.now(),
        loading: false,
      };
      this.cache.set(event.uid, result);
      this.emit('diagnosis-update', result);
      return result;
    } catch (err: any) {
      const errorResult: DiagnosisResult = {
        eventUid: event.uid,
        event,
        diagnosis: '',
        diagnosedAt: Date.now(),
        loading: false,
        error: err?.message || 'Diagnosis failed',
      };
      this.cache.set(event.uid, errorResult);
      this.emit('diagnosis-update', errorResult);
      return errorResult;
    }
  }

  /**
   * Build a diagnosis prompt for a single event.
   */
  private buildPrompt(event: EventDigest): string {
    return (
      `Diagnose this Kubernetes ${event.type} event and find the root cause:\n` +
      `- Event: ${event.name}\n` +
      `- Type: ${event.type}\n` +
      `- Reason: ${event.reason}\n` +
      `- Message: ${event.message}\n` +
      `- Involved Object: ${event.objectKind}/${event.objectName}` +
      (event.objectNamespace ? ` in namespace ${event.objectNamespace}` : '') +
      `\n- Last Seen: ${event.lastTimestamp}\n` +
      `\nPlease analyze the root cause and suggest specific remediation steps.`
    );
  }

  /**
   * Clear all cached diagnoses.
   */
  clearCache() {
    this.cache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Extract top N Warning/Error events from a list, sorted by lastTimestamp (most recent first).
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

    return warningOrError.slice(0, limit).map((e: any) => {
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
