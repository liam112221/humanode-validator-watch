import { ApiPromise, WsProvider } from '@polkadot/api';

// ✅ WebSocket endpoint (more reliable than HTTP!)
const RPC_ENDPOINTS = [
  'wss://explorer-rpc-ws.mainnet.stages.humanode.io',
  'https://explorer-rpc-http.mainnet.stages.humanode.io', // Fallback to HTTP
];
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a NEW API instance with WebSocket (more reliable!)
 * ✅ Tries WebSocket first, falls back to HTTP if needed
 * ✅ Retry logic with exponential backoff
 */
async function createApi(): Promise<ApiPromise> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Try each endpoint in order
    for (const endpoint of RPC_ENDPOINTS) {
      const isWebSocket = endpoint.startsWith('wss://') || endpoint.startsWith('ws://');

      let provider: WsProvider | any = null;

      try {
        console.log(`[RPC] Connecting to ${endpoint} (attempt ${attempt}/${MAX_RETRIES})...`);

        if (isWebSocket) {
          // ✅ WebSocket Provider (more reliable for persistent connections)
          provider = new WsProvider(endpoint, false); // false = don't auto-connect
          await provider.connect();
        } else {
          // ✅ HTTP Provider (fallback)
          const { HttpProvider } = await import('@polkadot/api');
          provider = new HttpProvider(endpoint);
        }

        const connectionPromise = ApiPromise.create({
          provider,
          noInitWarn: true
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC Timeout: ${endpoint}`)), CONNECTION_TIMEOUT_MS)
        );

        const api = await Promise.race([connectionPromise, timeoutPromise]);
        console.log(`[RPC] Connected successfully to ${endpoint}`);
        return api;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[RPC] Connection failed to ${endpoint}:`, lastError.message);

        // Cleanup provider on error
        if (provider) {
          try {
            await provider.disconnect();
          } catch (cleanupError) {
            console.error('[RPC] Error during cleanup:', cleanupError);
          }
        }
      }
    }

    // ✅ Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`[RPC] Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Failed to connect to RPC after all retries');
}

/**
 * Execute function with API and GUARANTEED cleanup
 * ✅ This is the magic - auto disconnect even on errors!
 */
async function withApi<T>(fn: (api: ApiPromise) => Promise<T>): Promise<T> {
  let api: ApiPromise | null = null;

  try {
    api = await createApi();

    // Execute the function
    return await fn(api);
  } finally {
    // ✅ GUARANTEED cleanup - runs even on errors/timeouts!
    if (api) {
      try {
        console.log('[RPC] Disconnecting API...');

        // ✅ FIX: Force disconnect with AbortController pattern
        const disconnectPromise = (async () => {
          await api!.disconnect();
        })();

        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.log('[RPC] Disconnect timeout - forcing cleanup...');
            resolve(); // ✅ Resolve instead of reject to continue cleanup
          }, 5000);
        });

        await Promise.race([disconnectPromise, timeoutPromise]);

        // ✅ CRITICAL: Force close provider if disconnect didn't complete
        const provider = (api as any)._provider || (api as any).provider;
        if (provider) {
          if (typeof provider.disconnect === 'function') {
            try {
              console.log('[RPC] Force disconnecting provider...');
              provider.disconnect();
            } catch (e) {
              console.error('[RPC] Error force disconnecting provider:', e);
            }
          }

          // ✅ NUCLEAR OPTION: Destroy WebSocket connection directly
          const ws = (provider as any)._websocket || (provider as any).websocket;
          if (ws && typeof ws.terminate === 'function') {
            console.log('[RPC] Terminating WebSocket connection...');
            ws.terminate();
          } else if (ws && typeof ws.close === 'function') {
            console.log('[RPC] Closing WebSocket connection...');
            ws.close();
          }
        }

        console.log('[RPC] API disconnected successfully.');
      } catch (disconnectErr) {
        console.error('[RPC] Error during disconnect:', disconnectErr);
      }
    }
  }
}

/**
 * ✅ NO LONGER NEEDED - withApi handles all cleanup automatically!
 * Kept for backwards compatibility, but does nothing
 */
export async function disconnect(): Promise<void> {
  console.log('[RPC] disconnect() called but not needed - withApi handles cleanup');
}

/**
 * ✅ BATCH FUNCTION - Get all network data in ONE connection!
 * This is much more efficient than calling individual functions
 */
export async function getAllNetworkData(): Promise<{
  currentEpoch: number;
  activeValidators: string[];
  sessionProgress: {
    currentIndex: number;
    sessionLength: number;
    sessionProgress: number;
    currentBlock: number;
  } | null;
}> {
  try {
    return await withApi(async (api) => {
      console.log('[RPC] Fetching ALL network data in single connection...');

      // ✅ Get everything in parallel using Promise.all (even faster!)
      const [
        sessionIndex,
        validators,
        header,
        sessionLength,
      ] = await Promise.all([
        api.query.session.currentIndex(),
        api.query.session.validators(),
        api.rpc.chain.getHeader(),
        Promise.resolve(Number(api.consts.babe.epochDuration.toString())),
      ]);

      const currentEpoch = Number(sessionIndex.toString());
      const activeValidators = (validators as any).map((v: any) => v.toString());
      const currentBlock = Number(header.number.toString());
      const sessionProgress = currentBlock % sessionLength;

      console.log('[RPC] Network data fetched successfully:', {
        epoch: currentEpoch,
        validators: activeValidators.length,
        block: currentBlock,
        sessionLength,
        sessionProgress,
      });

      return {
        currentEpoch,
        activeValidators,
        sessionProgress: {
          currentIndex: currentEpoch,
          sessionLength,
          sessionProgress,
          currentBlock,
        },
      };
    });
  } catch (error) {
    console.error('[getAllNetworkData] Error:', error);
    return {
      currentEpoch: -1,
      activeValidators: [],
      sessionProgress: null,
    };
  }
}

/**
 * ✅ BATCH FUNCTION - Get epoch details with first block info
 * Used when starting a new epoch
 */
export async function getEpochWithBlockDetails(targetEpoch: number): Promise<{
  currentEpoch: number;
  activeValidators: string[];
  firstBlock: number | null;
  sessionLength: number | null;
  epochStartTime: string | null;
}> {
  try {
    return await withApi(async (api) => {
      console.log(`[RPC] Fetching epoch ${targetEpoch} details in single connection...`);

      // Get basic data first
      const [
        sessionIndex,
        validators,
        header,
        sessionLength,
      ] = await Promise.all([
        api.query.session.currentIndex(),
        api.query.session.validators(),
        api.rpc.chain.getHeader(),
        Promise.resolve(Number(api.consts.babe.epochDuration.toString())),
      ]);

      const currentEpoch = Number(sessionIndex.toString());
      const activeValidators = (validators as any).map((v: any) => v.toString());
      const currentBlock = Number(header.number.toString());

      // Calculate first block of target epoch
      const floorDiv = Math.floor(currentBlock / sessionLength);
      const epochOffset = currentEpoch - floorDiv;

      let firstBlock: number | null = null;
      let epochStartTime: string | null = null;

      if (targetEpoch <= currentEpoch) {
        const estimatedFirst = (targetEpoch - epochOffset) * sessionLength;
        firstBlock = Math.max(1, estimatedFirst);

        // Get timestamp from first block
        try {
          const blockHash = await api.rpc.chain.getBlockHash(firstBlock);
          const block = await api.rpc.chain.getBlock(blockHash);

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
          console.error(`[RPC] Error fetching block details for ${firstBlock}:`, blockError);
        }
      }

      console.log('[RPC] Epoch details fetched successfully:', {
        currentEpoch,
        targetEpoch,
        firstBlock,
        epochStartTime,
      });

      return {
        currentEpoch,
        activeValidators,
        firstBlock,
        sessionLength,
        epochStartTime,
      };
    });
  } catch (error) {
    console.error('[getEpochWithBlockDetails] Error:', error);
    return {
      currentEpoch: -1,
      activeValidators: [],
      firstBlock: null,
      sessionLength: null,
      epochStartTime: null,
    };
  }
}

/**
 * ⚠️ DEPRECATED - Use getAllNetworkData() instead for better performance
 * Get current epoch/session index
 */
export async function getCurrentEpoch(): Promise<number> {
  const data = await getAllNetworkData();
  return data.currentEpoch;
}

/**
 * ⚠️ DEPRECATED - Use getAllNetworkData() instead for better performance
 * Get current session progress
 */
export async function getSessionProgress(): Promise<{
  currentIndex: number;
  sessionLength: number;
  sessionProgress: number;
  currentBlock: number;
} | null> {
  const data = await getAllNetworkData();
  return data.sessionProgress;
}

/**
 * ⚠️ DEPRECATED - Use getAllNetworkData() instead for better performance
 * Get active validators list
 */
export async function getActiveValidators(): Promise<string[]> {
  const data = await getAllNetworkData();
  return data.activeValidators;
}

/** 
 * ⚠️ DEPRECATED - Use getEpochWithBlockDetails() instead for better performance
 * Get block timestamp from first block of epoch
 */
export async function getFirstBlockOfEpochDetails(targetEpoch: number): Promise<{
  firstBlock: number | null;
  sessionLength: number | null;
  epochStartTime: string | null;
}> {
  const data = await getEpochWithBlockDetails(targetEpoch);
  return {
    firstBlock: data.firstBlock,
    sessionLength: data.sessionLength,
    epochStartTime: data.epochStartTime,
  };
}