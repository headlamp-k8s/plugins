/** Coordinates asynchronous Holmes health checks so only the latest result is applied. */
export class HolmesHealthRequestGate {
  private currentRequestId = 0;

  /**
   * Starts a new request and invalidates every prior request.
   *
   * @returns Identifier for the new current request.
   */
  begin(): number {
    this.currentRequestId += 1;
    return this.currentRequestId;
  }

  /**
   * Invalidates the current request without starting asynchronous work.
   *
   * @returns No value.
   */
  invalidate(): void {
    this.currentRequestId += 1;
  }

  /**
   * Checks whether a request may still update UI state.
   *
   * @param requestId - Identifier returned by {@link begin}.
   * @returns Whether the request is still the most recently started request.
   */
  isCurrent(requestId: number): boolean {
    return this.currentRequestId === requestId;
  }
}
