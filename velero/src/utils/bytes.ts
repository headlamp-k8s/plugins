/** Formats a byte count for datamover progress display. */
export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) {
    return '0 B';
  }
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Formats bytes-done / total for PVB / DataUpload style progress. */
export function formatByteProgress(done?: number, total?: number): string {
  if (total === undefined || total === null) {
    return 'N/A';
  }
  return `${formatBytes(done ?? 0)} / ${formatBytes(total)}`;
}
