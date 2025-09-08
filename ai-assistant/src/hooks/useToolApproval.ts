import { useCallback, useEffect, useState } from 'react';
import { toolApprovalManager, ToolApprovalRequest } from '../utils/ToolApprovalManager';

export interface UseToolApprovalResult {
  showApprovalDialog: boolean;
  pendingRequest: ToolApprovalRequest | null;
  handleApprove: (approvedToolIds: string[], rememberChoice?: boolean) => void;
  handleDeny: () => void;
  handleClose: () => void;
  isProcessing: boolean;
}

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

  const handleApprove = useCallback((approvedToolIds: string[], rememberChoice = false) => {
    if (!pendingRequest) return;

    setIsProcessing(true);
    toolApprovalManager.approveTools(pendingRequest.requestId, approvedToolIds, rememberChoice);
    
    // Close dialog after a brief delay to show processing state
    setTimeout(() => {
      setShowApprovalDialog(false);
      setPendingRequest(null);
      setIsProcessing(false);
    }, 500);
  }, [pendingRequest]);

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
