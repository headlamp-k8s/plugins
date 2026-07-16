import {
  toolApprovalManager,
  ToolApprovalRequest,
} from '@headlamp-k8s/ai-common/tools/approval/ToolApprovalManager';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Checks whether an event payload is a tool approval request.
 *
 * @param value - Event payload to inspect.
 * @returns Whether the payload has the required request fields.
 */
function isToolApprovalRequest(value: unknown): value is ToolApprovalRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'requestId' in value &&
    typeof value.requestId === 'string' &&
    'toolCalls' in value &&
    Array.isArray(value.toolCalls) &&
    'resolve' in value &&
    typeof value.resolve === 'function' &&
    'reject' in value &&
    typeof value.reject === 'function'
  );
}

/** State and handlers returned by {@link useToolApproval}. */
export interface UseToolApprovalResult {
  /** Whether the approval UI should be visible. */
  showApprovalDialog: boolean;
  /** Current approval request awaiting a user decision. */
  pendingRequest: ToolApprovalRequest | null;
  /**
   * Approves a subset of tools for the pending request.
   *
   * @param approvedToolIds - IDs of the tools the user approved.
   * @param rememberChoice - Whether to remember the approval for the session.
   * @returns No value.
   */
  handleApprove: (approvedToolIds: string[], rememberChoice?: boolean) => void;
  /**
   * Rejects the pending request.
   *
   * @returns No value.
   */
  handleDeny: () => void;
  /**
   * Closes the approval UI, treating it as a denial.
   *
   * @returns No value.
   */
  handleClose: () => void;
  /** Whether approval actions are currently being processed. */
  isProcessing: boolean;
}

/**
 * Connects React state to the shared tool approval manager for dialog-driven approvals.
 *
 * @returns Approval dialog state and decision handlers.
 */
export const useToolApproval = (): UseToolApprovalResult => {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<ToolApprovalRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Cancels a pending delayed dialog close.
   *
   * @returns No value.
   */
  const clearCloseTimeout = useCallback((): void => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Listen for approval requests from the manager
  useEffect(() => {
    /**
     * Displays a valid approval request emitted by the manager.
     *
     * @param args - Untrusted event arguments whose first item may be a request.
     * @returns No value.
     */
    const handleApprovalRequest = (...args: unknown[]): void => {
      const request = args[0];
      if (!isToolApprovalRequest(request)) return;

      clearCloseTimeout();
      setPendingRequest(request);
      setShowApprovalDialog(true);
      setIsProcessing(false);
    };

    toolApprovalManager.on('approval-requested', handleApprovalRequest);

    return () => {
      toolApprovalManager.off('approval-requested', handleApprovalRequest);
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  /**
   * Approves selected tools and briefly shows the processing state.
   *
   * @param approvedToolIds - IDs of the tools the user approved.
   * @param rememberChoice - Whether to remember the approval for the session.
   * @returns No value.
   */
  const handleApprove = useCallback(
    (approvedToolIds: string[], rememberChoice = false): void => {
      if (!pendingRequest) return;

      clearCloseTimeout();
      setIsProcessing(true);
      toolApprovalManager.approveTools(pendingRequest.requestId, approvedToolIds, rememberChoice);

      // Close dialog after a brief delay to show processing state
      closeTimeoutRef.current = setTimeout(() => {
        closeTimeoutRef.current = null;
        setShowApprovalDialog(false);
        setPendingRequest(null);
        setIsProcessing(false);
      }, 500);
    },
    [clearCloseTimeout, pendingRequest]
  );

  /**
   * Denies the current request and closes the approval dialog.
   *
   * @returns No value.
   */
  const handleDeny = useCallback(() => {
    if (!pendingRequest) return;

    clearCloseTimeout();
    toolApprovalManager.denyTools(pendingRequest.requestId);
    setShowApprovalDialog(false);
    setPendingRequest(null);
    setIsProcessing(false);
  }, [clearCloseTimeout, pendingRequest]);

  /**
   * Treats dismissing the approval dialog as a denial.
   *
   * @returns No value.
   */
  const handleClose = useCallback(() => {
    // Close is essentially a denial - user dismissed the dialog
    handleDeny();
  }, [handleDeny]);

  return {
    showApprovalDialog,
    pendingRequest,
    handleApprove,
    handleDeny,
    handleClose,
    isProcessing,
  };
};
