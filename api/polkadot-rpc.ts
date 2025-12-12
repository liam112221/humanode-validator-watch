import { ApiPromise, HttpProvider } from '@polkadot/api';

const RPC_ENDPOINT = 'https://explorer-rpc-http.mainnet.stages.humanode.io';

let apiInstance: ApiPromise | null = null;

async function getApi(): Promise<ApiPromise> {
  if (!apiInstance) {
    const provider = new HttpProvider(RPC_ENDPOINT);
    
    // Create API instance with warnings suppressed
    const connectionPromise = ApiPromise.create({ provider, noInitWarn: true });
    
    // Force timeout after 10 seconds to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Polkadot RPC Connection Timeout (10s)')), 10000)
    );

    try {
      console.log('[System] Connecting to Polkadot RPC...');
      // Race: whichever finishes first wins
      apiInstance = await Promise.race([connectionPromise, timeoutPromise]);
      console.log('[System] Connected to RPC.');
    } catch (error) {
      console.error('[System] RPC Connection Failed:', error);
      throw error;
    }
  }
  return apiInstance;
}

/**
 * Get current epoch/session index
 */
export async function getCurrentEpoch(): Promise<number> {
  try {
    const api = await getApi();
    const index = await api.query.session.currentIndex();
    return Number(index.toString());
  } catch (error) {
    console.error('Error getting current epoch:', error);
    return -1;
  }
}

/**
 * Get current session progress
 */
export async function getSessionProgress(): Promise<{
  currentIndex: number;
  sessionLength: number;
  sessionProgress: number;
  currentBlock: number;
} | null> {
  try {
    const api = await getApi();

    // Get current epoch
    const currentIndex = await getCurrentEpoch();
    if (currentIndex === -1) return null;

    // Get session length (blocks per epoch) from BABE constants
    const sessionLength = Number(api.consts.babe.epochDuration.toString());

    // Get current block header
    const header = await api.rpc.chain.getHeader();
    const currentBlock = Number(header.number.toString());

    // Calculate session progress
    const sessionProgress = currentBlock % sessionLength;

    return {
      currentIndex,
      sessionLength,
      sessionProgress,
      currentBlock,
    };
  } catch (error) {
    console.error('Error getting session progress:', error);
    return null;
  }
}

/**
 * Get active validators list
 */
export async function getActiveValidators(): Promise<string[]> {
  try {
    const api = await getApi();
    const validators = await api.query.session.validators();
    return (validators as any).map((v: any) => v.toString());
  } catch (error) {
    console.error('Error getting validators:', error);
    return [];
  }
}

/** 
 * Get block timestamp from first block of epoch
 * This is a critical function for epoch start time
 */
export async function getFirstBlockOfEpochDetails(targetEpoch: number): Promise<{
  firstBlock: number | null;
  sessionLength: number | null;
  epochStartTime: string | null;
}> {
  try {
    const api = await getApi();

    // Get current epoch and block info
    const currentEpochOnChain = await getCurrentEpoch();
    if (currentEpochOnChain === -1) {
      return { firstBlock: null, sessionLength: null, epochStartTime: null };
    }

    const header = await api.rpc.chain.getHeader();
    const currentBlockNumber = Number(header.number.toString());

    const sessionLength = Number(api.consts.babe.epochDuration.toString());

    // Derive offset between epoch index and block number division
    const floorDiv = Math.floor(currentBlockNumber / sessionLength);
    const epochOffset = currentEpochOnChain - floorDiv;

    let firstBlock: number | null = null;

    // Calculate first block of target epoch
    if (targetEpoch <= currentEpochOnChain) {
      const estimatedFirst = (targetEpoch - epochOffset) * sessionLength;
      firstBlock = Math.max(1, estimatedFirst);
    } else {
      // Future epoch, can't calculate yet
      console.log(`Target epoch ${targetEpoch} is in the future`);
    }

    let epochStartTime: string | null = null;
    if (firstBlock) {
      try {
        const blockHash = await api.rpc.chain.getBlockHash(firstBlock);
        const block = await api.rpc.chain.getBlock(blockHash);

        // Find timestamp extrinsic
        const timestampExtrinsic = block.block.extrinsics.find((ex) => {
          const { method } = ex;
          return method.section === 'timestamp' && method.method === 'set';
        });

        if (timestampExtrinsic) {
          const timestampArg = timestampExtrinsic.method.args[0] as any;
          const timestampMs = typeof timestampArg.toNumber === 'function'
            ? timestampArg.toNumber()
            : Number(timestampArg.toString());
          epochStartTime = new Date(timestampMs).toISOString();
        }
      } catch (blockError) {
        console.error(`Error fetching block details for ${firstBlock}:`, blockError);
      }
    }

    return { firstBlock, sessionLength, epochStartTime };
  } catch (error) {
    console.error('Error in getFirstBlockOfEpochDetails:', error);
    return { firstBlock: null, sessionLength: null, epochStartTime: null };
  }
}

/**
 * Disconnect the API
 */
export async function disconnect(): Promise<void> {
  if (apiInstance) {
    try {
      console.log('[System] Disconnecting RPC...');
      await apiInstance.disconnect();
      console.log('[System] RPC Disconnected.');
    } catch (err) {
      console.error('[System] Error disconnecting RPC:', err);
    }
    apiInstance = null;
  }
}
