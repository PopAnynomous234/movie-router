const express = require('express');
const axios = require('axios');
const app = express();

const TARGET_HOST = 'https://vidcore.io'; // Upstream embed provider

// Helper function to fetch and proxy stream HTML
async function proxyVidcore(targetUrl, res) {
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `${TARGET_HOST}/`
            },
            responseType: 'text'
        });

        // Remove headers preventing iframe embedding
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', 'text/html');

        res.status(200).send(response.data);
    } catch (err) {
        console.error('Error fetching stream:', err.message);
        res.status(502).send('Stream unavailable or upstream proxy error.');
    }
}

// 1. Route for Movies: /movie/:id
app.get('/movie/:id', async (req, res) => {
    const { id } = req.params;
    const targetUrl = `${TARGET_HOST}/embed/movie/${id}`;
    await proxyVidcore(targetUrl, res);
});

// 2. Route for TV Shows: /tv/:id/:season/:episode
app.get('/tv/:id/:season/:episode', async (req, res) => {
    const { id, season, episode } = req.params;
    const targetUrl = `${TARGET_HOST}/embed/tv/${id}/${season}/${episode}`;
    await proxyVidcore(targetUrl, res);
});

// Fallback listener for dynamic port binding (Render/Koyeb)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
