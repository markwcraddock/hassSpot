// Import required libraries
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Initialize Express
const app = express();
app.use(bodyParser.json());

const HA_CREDS_URL = 'http://homeassistant.local:1880/endpoint/spotcreds';

// In-memory storage for tokens
let spotifyApi = null;

// 🕒 Retry logic for fetching credentials
async function fetchCredentialsWithRetry(retries = 3, delay = 30000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}: Fetching credentials from Home Assistant...`);
            const response = await axios.get(HA_CREDS_URL);
            const creds = response.data;

            if (creds.CLIENT_ID && creds.CLIENT_SECRET && creds.REDIRECT_URI) {
                console.log('✅ Credentials fetched successfully!');
                spotifyApi = new SpotifyWebApi({
                    clientId: creds.CLIENT_ID,
                    clientSecret: creds.CLIENT_SECRET,
                    redirectUri: creds.REDIRECT_URI,
                });
                return;
            }
        } catch (err) {
            console.error(`❌ Attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) {
                console.log(`⏳ Waiting ${delay / 1000} seconds before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.warn('⚠️ Failed to fetch credentials after multiple attempts. Please use /login for manual authentication.');
}

// 🎧 Authenticate with Spotify
app.get('/login', (req, res) => {
    if (!spotifyApi) {
        return res.status(500).send('⚠️ Spotify API not initialized. Please wait for credentials to load.');
    }

    const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'playlist-read-private',
        'user-read-currently-playing',
        'user-library-read'
    ];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
    const { code } = req.query;
    if (!spotifyApi) {
        return res.status(500).send('⚠️ Spotify API not initialized. Please wait for credentials to load.');
    }

    spotifyApi.authorizationCodeGrant(code)
        .then(data => {
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            res.send('✅ Authentication successful! You can now use the app.');
        })
        .catch(err => {
            console.error('❌ Error during authentication:', err);
            res.status(500).send('Authentication failed');
        });
});

// 🔄 Refresh Access Token
async function refreshAccessToken() {
    try {
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('🔄 Access token refreshed');
    } catch (err) {
        console.error('❌ Could not refresh access token', err);
    }
}

// 🛡️ Middleware to ensure a valid token
app.use(async (req, res, next) => {
    if (!spotifyApi) {
        return res.status(500).send('⚠️ Spotify API not initialized. Please wait for credentials to load.');
    }
    if (!spotifyApi.getAccessToken()) {
        return res.status(401).send('⚠️ Spotify API not authenticated. Please use /login.');
    }
    try {
        await spotifyApi.getMe(); // Test token validity
        next();
    } catch (err) {
        console.warn('⚠️ Access token expired. Attempting to refresh...');
        await refreshAccessToken();
        next();
    }
});

// 📚 List all playlists
app.get('/playlists', async (req, res) => {
    try {
        const playlists = await spotifyApi.getUserPlaylists();
        res.json(playlists.body);
    } catch (err) {
        console.error('❌ Error fetching playlists:', err);
        res.status(500).send('Failed to fetch playlists');
    }
});

// 🎧 List all devices
app.get('/devices', async (req, res) => {
    try {
        const devices = await spotifyApi.getMyDevices();
        res.json(devices.body);
    } catch (err) {
        console.error('❌ Error fetching devices:', err);
        res.status(500).send('Failed to fetch devices');
    }
});

// 🔍 Search for a track
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).send('⚠️ Query parameter is required');
    try {
        const results = await spotifyApi.searchTracks(query);
        res.json(results.body.tracks.items);
    } catch (err) {
        console.error('❌ Error searching tracks:', err);
        res.status(500).send('Failed to search tracks');
    }
});

// ▶️ Play a track
app.get('/play', async (req, res) => {
    const { uri, deviceId } = req.query;
    if (!uri || !deviceId) return res.status(400).send('⚠️ URI and deviceId are required');
    try {
        await spotifyApi.play({ device_id: deviceId, context_uri: uri });
        res.send('▶️ Playback started successfully');
    } catch (err) {
        console.error('❌ Error starting playback:', err);
        res.status(500).send('Failed to start playback');
    }
});

// ⏹️ Stop playback
app.get('/stop', async (req, res) => {
    const { deviceId } = req.query;
    if (!deviceId) return res.status(400).send('⚠️ deviceId is required');
    try {
        await spotifyApi.pause({ device_id: deviceId });
        res.send('⏹️ Playback stopped successfully');
    } catch (err) {
        console.error('❌ Error stopping playback:', err);
        res.status(500).send('Failed to stop playback');
    }
});

// 🚀 Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`🚀 Spotify Node.js app is running on http://localhost:${PORT}`);
    await fetchCredentialsWithRetry();
});
