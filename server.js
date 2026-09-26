const express = require('express');
const axios = require('axios');
const app = express();

// Set target host (try vidcore.org or vidcore.io if one is down)
const TARGET_HOST = 'https://vidsrc.to';

// Standardized browser headers to avoid instant bot/datacenter blocks
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Upgrade-Insecure-Requests': '1',
    'Referer': `${TARGET_HOST}/`
};

async function proxyVidcore(targetUrl, res) {
    try {
        const response = await axios.get(targetUrl, {
            headers: BROWSER_HEADERS,
            responseType: 'text',
            maxRedirects: 5,
            timeout: 10000 // 10s timeout
        });

        // Strip headers that prevent embedding inside iframes
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', 'text/html');

        res.status(200).send(response.data);
    } catch (err) {
        console.error(`[Proxy Error] Request to ${targetUrl} failed:`, err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
        
        // If target site returns an error response body, surface it for debugging
        if (err.response) {
            return res.status(err.response.status).send(`Upstream returned status ${err.response.status}`);
        }
        res.status(502).send('Stream unavailable or proxy connection refused.');
    }
}

// Route for Movies: /movie/:id
app.get('/movie/:id', async (req, res) => {
    const { id } = req.params;
    const targetUrl = `${TARGET_HOST}/embed/movie/${id}`;
    await proxyVidcore(targetUrl, res);
});

// Route for TV Shows: /tv/:id/:season/:episode
app.get('/tv/:id/:season/:episode', async (req, res) => {
    const { id, season, episode } = req.params;
    const targetUrl = `${TARGET_HOST}/embed/tv/${id}/${season}/${episode}`;
    await proxyVidcore(targetUrl, res);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
