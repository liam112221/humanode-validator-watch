import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import all API handlers (Web Standard)
// @ts-ignore
import dashboardHandler from './api/dashboard.js';
// @ts-ignore
import dataLatestHandler from './api/data-latest.js';
// @ts-ignore
import metadataHandler from './api/metadata.js';
// @ts-ignore
import networkStatusHandler from './api/network-status.js';
// @ts-ignore
import phrasedataHandler from './api/phrasedata.js';
// @ts-ignore
import recapHandler from './api/recap.js';
// @ts-ignore
import runEpochHandler from './api/run-epoch.js';
// @ts-ignore
import runMonitorHandler from './api/run-monitor.js';
// @ts-ignore
import runUptimeHandler from './api/run-uptime.js';
// @ts-ignore
import validatorHandler from './api/validator.js';

// Adapter: Convert Vercel Request/Response to Web Standard
const adaptToWebStandard = async (
    req: VercelRequest,
    res: VercelResponse,
    handler: Function
) => {
    try {
        const url = new URL(req.url || '', `https://${req.headers.host}`);

        const requestInit: RequestInit = {
            method: req.method || 'GET',
            headers: req.headers as HeadersInit,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            requestInit.body = typeof req.body === 'object'
                ? JSON.stringify(req.body)
                : req.body;
        }

        const webRequest = new Request(url, requestInit);
        const webResponse = await handler(webRequest);

        // Set response headers
        webResponse.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value);
        });

        // Get response body
        const contentType = webResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const data = await webResponse.json();
            res.status(webResponse.status).json(data);
        } else {
            const text = await webResponse.text();
            res.status(webResponse.status).send(text);
        }

    } catch (error: any) {
        console.error('[Vercel Handler Error]:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

// Export named functions for Vercel routing
export async function dashboard(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, dashboardHandler);
}

export async function dataLatest(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, dataLatestHandler);
}

export async function metadata(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, metadataHandler);
}

export async function networkStatus(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, networkStatusHandler);
}

export async function phrasedata(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, phrasedataHandler);
}

export async function recap(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, recapHandler);
}

export async function runEpoch(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, runEpochHandler);
}

export async function runMonitor(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, runMonitorHandler);
}

export async function runUptime(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, runUptimeHandler);
}

export async function validator(req: VercelRequest, res: VercelResponse) {
    return adaptToWebStandard(req, res, validatorHandler);
}
