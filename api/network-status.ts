import { readJSON } from '../storage/storage.js';
import { getSessionProgress } from './polkadot-rpc.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/network-status
 * Returns current network epoch progress (read-only, no storage writes)
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    const constants = await readJSON<any>('data/config/global_constants.json') || {
      AVG_BLOCK_TIME_SECONDS: 6,
    };

    const sessionInfo = await getSessionProgress();
    if (!sessionInfo) {
      return errorResponse('Failed to get session progress');
    }

    const {
      currentIndex,
      sessionLength,
      sessionProgress,
      currentBlock,
    } = sessionInfo;

    const blocksInEpoch = sessionLength;
    const currentBlockInEpoch = sessionProgress;
    const remainingBlocksInEpoch = Math.max(0, blocksInEpoch - currentBlockInEpoch);
    const percentageCompleted =
      blocksInEpoch > 0 ? (currentBlockInEpoch / blocksInEpoch) * 100 : 0;

    const avgBlockTimeSeconds = constants.AVG_BLOCK_TIME_SECONDS || 6;
    const nextEpochETASec = remainingBlocksInEpoch * avgBlockTimeSeconds;
    const estimatedEpochCompletionTime = new Date(
      Date.now() + nextEpochETASec * 1000
    ).toISOString();

    return jsonResponse({
      webServerEpochProgress: {
        currentEpochSystem: currentIndex,
        blocksInEpoch,
        currentBlockInEpoch,
        remainingBlocksInEpoch,
        percentageCompleted,
        nextEpochETASec,
        estimatedEpochCompletionTime,
        currentAbsoluteBlock: currentBlock,
        error: null as string | null,
      },
      checkIntervalMinutes: 1,
      epochManagementIntervalMinutes: 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[network-status] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
