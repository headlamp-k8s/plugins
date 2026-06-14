import {
  toolApprovalManager,
  ToolApprovalRequest,
} from '@headlamp-k8s/ai-common/approval/ToolApprovalManager';
import { useCallback, useEffect, useState } from 'react';

/** State and handlers returned by {@link useToolApproval}. */
export interface UseToolApprovalResult {
  /** Whether the approval UI should be visible. */
  showApprovalDialog: boolean;
  /** Current approval request awaiting a user decision. */
  pendingRequest: ToolApprovalRequest | null;
  /** Approves a subset of tools for the pending request. */
  handleApprove: (approvedToolIds: string[], rememberChoice?: boolean) => void;
  /** Rejects the pending request. */
  handleDeny: () => void;
  /** Closes the approval UI, treating it as a denial. */
  handleClose: () => void;
  /** Whether approval actions are currently being processed. */
  isProcessing: boolean;
}

/** Connects React state to the shared tool approval manager for dialog-driven approvals. */
export const useToolApproval = (): UseToolApprovalResult => {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<ToolApprovalRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen for approval requests from the manager
  useEffect(() => {
    const handleApprovalRequest = (request: ToolApprovalRequest) => {
      setPendingRequest(request);
      setShowApprovalDialog(true);
      setIsProcessing(false);
    };

    toolApprovalManager.on('approval-requested', handleApprovalRequest);

    return () => {
      toolApprovalManager.off('approval-requested', handleApprovalRequest);
    };
  }, []);

  const handleApprove = useCallback(
    (approvedToolIds: string[], rememberChoice = false) => {
      if (!pendingRequest) return;

      setIsProcessing(true);
      toolApprovalManager.approveTools(pendingRequest.requestId, approvedToolIds, rememberChoice);

      // Close dialog after a brief delay to show processing state
      setTimeout(() => {
        setShowApprovalDialog(false);
        setPendingRequest(null);
        setIsProcessing(false);
      }, 500);
    },
    [pendingRequest]
  );

  const handleDeny = useCallback(() => {
    if (!pendingRequest) return;

    toolApprovalManager.denyTools(pendingRequest.requestId);
    setShowApprovalDialog(false);
    setPendingRequest(null);
    setIsProcessing(false);
  }, [pendingRequest]);

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
