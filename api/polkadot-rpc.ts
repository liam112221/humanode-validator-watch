/**
 * Polkadot RPC Helper for Vercel Serverless
 * Replaces @polkadot/api with direct HTTP RPC calls
 */

const RPC_ENDPOINT = 'https://explorer-rpc-http.mainnet.stages.humanode.io';

interface RpcResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

/**
 * Make RPC call to Polkadot node
 */
async function rpcCall<T = any>(method: string, params: any[] = []): Promise<T | null> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      console.error(`RPC call failed: ${response.statusText}`);
      return null;
    }

    const data: RpcResponse<T> = await response.json();

    if (data.error) {
      console.error(`RPC error: ${data.error.message}`);
      return null;
    }

    return data.result || null;
  } catch (error) {
    console.error(`RPC call exception:`, error);
    return null;
  }
}

/**
 * Get current epoch/session index
 */
export async function getCurrentEpoch(): Promise<number> {
  const result = await rpcCall<string>('state_call', ['SessionApi_session_index', '0x']);
  if (!result) return -1;

  // Convert hex to number
  return parseInt(result, 16);
}

/**
 * Get current session progress
 */
export async function getSessionProgress(): Promise<{
  currentIndex: number;
  sessionLength: number;
  sessionProgress: number;
} | null> {
  try {
    // Get current epoch
    const currentIndex = await getCurrentEpoch();
    if (currentIndex === -1) return null;

    // Get session length (typical 4 hours in blocks, 6s per block = 2400 blocks)
    const sessionLengthHex = await rpcCall<string>('state_call', ['SessionApi_session_length', '0x']);
    const sessionLength = sessionLengthHex ? parseInt(sessionLengthHex, 16) : 2400;

    // Get current block header
    const header = await rpcCall<{ number: string }>('chain_getHeader', []);
    const currentBlock = header ? parseInt(header.number, 16) : 0;

    // Calculate session progress
    const sessionProgress = currentBlock % sessionLength;

    return {
      currentIndex,
      sessionLength,
      sessionProgress,
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
    const result = await rpcCall<string[]>('state_call', ['SessionApi_validators', '0x']);
    if (!result) return [];

    return result.map(v => {
      // Convert hex address to string if needed
      if (v.startsWith('0x')) {
        return v;
      }
      return v;
    });
  } catch (error) {
    console.error('Error getting validators:', error);
    return [];
  }
}

/**
 * Get block hash by number
 */
export async function getBlockHash(blockNumber: number): Promise<string | null> {
  const result = await rpcCall<string>('chain_getBlockHash', [blockNumber]);
  return result;
}

/**
 * Get block by hash
 */
export async function getBlock(blockHash: string): Promise<any> {
  const result = await rpcCall<any>('chain_getBlock', [blockHash]);
  return result;
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
    // Get current session info
    const sessionInfo = await getSessionProgress();
    if (!sessionInfo) {
      return { firstBlock: null, sessionLength: null, epochStartTime: null };
    }

    // Get current block header
    const header = await rpcCall<{ number: string }>('chain_getHeader', []);
    if (!header) {
      return { firstBlock: null, sessionLength: null, epochStartTime: null };
    }

    const currentBlockNumber = parseInt(header.number, 16);
    const currentEpochOnChain = sessionInfo.currentIndex;
    const sessionProgress = sessionInfo.sessionProgress;
    const sessionLength = sessionInfo.sessionLength;

    let firstBlock: number | null = null;

    // Calculate first block of target epoch
    if (targetEpoch === currentEpochOnChain) {
      firstBlock = Math.max(1, currentBlockNumber - sessionProgress);
    } else if (targetEpoch < currentEpochOnChain) {
      const epochsDiff = currentEpochOnChain - targetEpoch;
      firstBlock = Math.max(1, currentBlockNumber - sessionProgress - (epochsDiff * sessionLength));
    } else {
      // Future epoch, can't calculate yet
      console.log(`Target epoch ${targetEpoch} is in the future`);
    }

    let epochStartTime: string | null = null;
    if (firstBlock) {
      try {
        const blockHash = await getBlockHash(firstBlock);
        if (blockHash) {
          const block = await getBlock(blockHash);
          if (block && block.block && block.block.extrinsics) {
            // Find timestamp extrinsic
            const timestampExtrinsic = block.block.extrinsics.find((ex: any) => {
              try {
                return ex.method && ex.method.section === 'timestamp' && ex.method.method === 'set';
              } catch {
                return false;
              }
            });

            if (timestampExtrinsic && timestampExtrinsic.method && timestampExtrinsic.method.args) {
              const timestampMs = timestampExtrinsic.method.args[0];
              epochStartTime = new Date(timestampMs).toISOString();
            }
          }
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
