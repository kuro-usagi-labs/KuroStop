/**
 * KuroStop Milestone Logger.
 * Emits milestones with standardized prefixes.
 * In Release builds on iOS, React Native's default RCTLog threshold is RCTLogLevelError (3).
 * Calling console.error ensures milestones are never filtered out by RCTLog
 * and are immediately delivered to Apple Unified Logging (os_log) and simctl log stream.
 */

const milestoneHistory: string[] = [];

export function logMilestone(milestone: string, detail?: Record<string, unknown>): void {
  const detailStr = detail ? ` ${JSON.stringify(detail)}` : '';
  const message = `[KuroStop-Milestone] ${milestone}${detailStr}`;
  milestoneHistory.push(message);

  // Standard log for development/debug
  console.log(message);
  console.warn(message);

  // In iOS Release builds, RCTLog threshold is RCTLogLevelError (3).
  // Emitting console.error guarantees delivery to Apple Unified Logging (os_log).
  // We silence console.error during unit tests and local __DEV__ mode to avoid test noise / redboxes.
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const isUnitTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (!isDev && !isUnitTest) {
    console.error(message);
  }
}

export function getMilestoneHistory(): string[] {
  return [...milestoneHistory];
}

