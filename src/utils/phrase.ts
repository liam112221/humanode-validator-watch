/**
 * Phrase calculation utilities
 * Used for determining phrase numbers and boundaries
 */

/**
 * Calculate phrase number from epoch
 */
export function calculatePhraseNumber(
  epoch: number,
  firstPhraseStartEpoch: number,
  phraseDurationEpochs: number
): number {
  if (epoch < firstPhraseStartEpoch) return -1;
  return Math.floor((epoch - firstPhraseStartEpoch) / phraseDurationEpochs);
}

/**
 * Calculate phrase start epoch
 */
export function calculatePhraseStartEpoch(
  phraseNumber: number,
  firstPhraseStartEpoch: number,
  phraseDurationEpochs: number
): number {
  return firstPhraseStartEpoch + (phraseNumber * phraseDurationEpochs);
}

/**
 * Calculate phrase end epoch
 */
export function calculatePhraseEndEpoch(
  phraseNumber: number,
  firstPhraseStartEpoch: number,
  phraseDurationEpochs: number
): number {
  return calculatePhraseStartEpoch(phraseNumber, firstPhraseStartEpoch, phraseDurationEpochs) + phraseDurationEpochs - 1;
}

/**
 * Check if epoch is within a phrase
 */
export function isEpochInPhrase(
  epoch: number,
  phraseNumber: number,
  firstPhraseStartEpoch: number,
  phraseDurationEpochs: number
): boolean {
  const startEpoch = calculatePhraseStartEpoch(phraseNumber, firstPhraseStartEpoch, phraseDurationEpochs);
  const endEpoch = calculatePhraseEndEpoch(phraseNumber, firstPhraseStartEpoch, phraseDurationEpochs);
  return epoch >= startEpoch && epoch <= endEpoch;
}
