/**
 * KuroStop Milestone Logger.
 * Emits milestones with standardized prefixes.
 * In Release builds on iOS, console.warn and console.error ensure output
 * is preserved in Apple Unified Logging (os_log) and captured by simctl log stream.
 */

export function logMilestone(milestone: string, detail?: Record<string, unknown>): void {
  const detailStr = detail ? ` ${JSON.stringify(detail)}` : '';
  const message = `[KuroStop-Milestone] ${milestone}${detailStr}`;
  // Standard log for development/debug
  console.log(message);
  // Warning level ensures it is not filtered out in native iOS Release log streams
  console.warn(message);
}
