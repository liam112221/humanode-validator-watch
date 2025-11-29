/**
 * Calculation utilities
 * Used for validator statistics and metrics
 */

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
}

/**
 * Count status occurrences
 */
export function countStatus(data: Record<string, any>, status: string): number {
  return Object.values(data).filter((item: any) => item.status === status).length;
}

/**
 * Calculate uptime percentage
 */
export function calculateUptimePercentage(
  totalEpochs: number,
  failedEpochs: number
): number {
  if (totalEpochs === 0) return 0;
  const successfulEpochs = totalEpochs - failedEpochs;
  return calculatePercentage(successfulEpochs, totalEpochs);
}
