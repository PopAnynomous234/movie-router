const express = require('express');
const cloudscraper = require('cloudscraper'); // Helps bypass basic Cloudflare checks
const app = express();

// List of upstream stream providers to cycle through
const PROVIDERS = [
    // 1. AutoEmbed
    (id, type, s, e) => type === 'tv' ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` : `https://player.autoembed.cc/embed/movie/${id}`,
    // 2. Embed.su
    (id, type, s, e) => type === 'tv' ? `https://embed.su/embed/tv/${id}/${s}/${e}` : `https://embed.su/embed/movie/${id}`,
    // 3. VidSrc.pm
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.pm/embed/tv/${id}/${s}/${e}` : `https://vidsrc.pm/embed/movie/${id}`,
    // 4. VidSrc.to
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}` : `https://vidsrc.to/embed/movie/${id}`,
    // 5. VidSrc.me
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` : `https://vidsrc.me/embed/movie?tmdb=${id}`,
    // 6. SmashyStream
    (id, type, s, e) => type === 'tv' ? `https://embed.smashystream.com/playere.php?tmdb=${id}&s=${s}&e=${e}` : `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    // 7. MultiEmbed
    (id, type, s, e) => type === 'tv' ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    // 8. 2Embed.cc
    (id, type, s, e) => type === 'tv' ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${id}`,
    // 9. VidCore
    (id, type, s, e) => type === 'tv' ? `https://vidcore.org/embed/tv/${id}/${s}/${e}` : `https://vidcore.org/embed/movie/${id}`,
    // 10. Rive Stream
    (id, type, s, e) => type === 'tv' ? `https://rive.stream/embed?type=tv&id=${id}&s=${s}&e=${e}` : `https://rive.stream/embed?type=movie&id=${id}`,
    // 11. VidSrc.xyz
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` : `https://vidsrc.xyz/embed/movie/${id}`,
    // 12. VidSrc.in
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.in/embed/tv/${id}/${s}/${e}` : `https://vidsrc.in/embed/movie/${id}`,
    // 13. VidSrc.vip
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.vip/embed/tv/${id}/${s}/${e}` : `https://vidsrc.vip/embed/movie/${id}`,
    // 14. NontonGo
    (id, type, s, e) => type === 'tv' ? `https://www.nontongo.win/embed/tv/${id}/${s}/${e}` : `https://www.nontongo.win/embed/movie/${id}`,
    // 15. SuperEmbed
    (id, type, s, e) => type === 'tv' ? `https://multiembed.mov/directstream.php?video_id=${id}&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${id}`,
    // 16. MoviesAPI
    (id, type, s, e) => type === 'tv' ? `https://moviesapi.club/tv/${id}-${s}-${e}` : `https://moviesapi.club/movie/${id}`,
    // 17. VidSrc.net
    (id, type, s, e) => type === 'tv' ? `https://vidsrc.net/embed/tv/${id}/${s}/${e}` : `https://vidsrc.net/embed/movie/${id}`,
    // 18. 111Movies
    (id, type, s, e) => type === 'tv' ? `https://111movies.com/tv/${id}/${s}/${e}` : `https://111movies.com/movie/${id}`,
    // 19. Blackvid
    (id, type, s, e) => type === 'tv' ? `https://blackvid.space/embed?tmdb=${id}&season=${s}&episode=${e}` : `https://blackvid.space/embed?tmdb=${id}`,
    // 20. MovieEps
    (id, type, s, e) => type === 'tv' ? `https://movieeps.com/embed/tv/${id}/${s}/${e}` : `https://movieeps.com/embed/movie/${id}`
];

async function fetchFirstWorkingStream(id, type, season, episode) {
    for (const getUrl of PROVIDERS) {
        const targetUrl = getUrl(id, type, season, episode);
        try {
            const html = await cloudscraper.get(targetUrl);
            return html;
        } catch (err) {
            console.log(`[Provider Failed] ${targetUrl} - trying next...`);
        }
    }
    throw new Error('All stream providers failed.');
}

app.get('/movie/:id', async (req, res) => {
    try {
        const html = await fetchFirstWorkingStream(req.params.id, 'movie');
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(502).send('Unable to load stream from any provider.');
    }
});

app.get('/tv/:id/:season/:episode', async (req, res) => {
    const { id, season, episode } = req.params;
    try {
        const html = await fetchFirstWorkingStream(id, 'tv', season, episode);
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(502).send('Unable to load stream from any provider.');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy active on port ${PORT}`));
