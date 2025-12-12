import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';

// Import API handlers
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

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.json());
app.use(express.text());

// Adapter function to convert Express req/res to Web Standard Request/Response
const adaptHandler = (handler: Function) => async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const url = new URL(req.originalUrl, `${protocol}://${host}`);

        const requestInit: RequestInit = {
            method: req.method,
            headers: req.headers as HeadersInit,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (typeof req.body === 'object') {
                requestInit.body = JSON.stringify(req.body);
            } else {
                requestInit.body = req.body;
            }
        }

        const webRequest = new Request(url, requestInit);
        const webResponse = await handler(webRequest);

        res.status(webResponse.status);
        webResponse.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value);
        });

        const responseText = await webResponse.text();
        res.send(responseText);

    } catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message || "Unknown error" });
    }
};

// Map Routes
app.all('/api/validator/:address', adaptHandler(validatorHandler));
app.all('/api/validator', adaptHandler(validatorHandler));
app.all('/api/dashboard', adaptHandler(dashboardHandler));
app.all('/api/data-latest', adaptHandler(dataLatestHandler));
app.all('/api/metadata', adaptHandler(metadataHandler));
app.all('/api/network-status', adaptHandler(networkStatusHandler));
app.all('/api/phrasedata', adaptHandler(phrasedataHandler));
app.all('/api/recap', adaptHandler(recapHandler));
app.all('/api/run-epoch', adaptHandler(runEpochHandler));
app.all('/api/run-monitor', adaptHandler(runMonitorHandler));
app.all('/api/run-uptime', adaptHandler(runUptimeHandler));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.get(/(.*)/, (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API Endpoint not found' });
    }
    // Check if dist exists before sending
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath);
});

// ✅ FIX: Only listen in local dev, NOT in Vercel serverless!
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
} else {
    console.log('Running in serverless mode - app.listen() skipped');
}

// ✅ Export app for serverless platforms (Vercel, Netlify, etc.)
export default app;
