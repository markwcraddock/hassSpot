// Import required libraries
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Spotify API credentials
const spotifyApi = new SpotifyWebApi({
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    redirectUri: 'http://localhost:3001/callback'
});

// Authenticate with Spotify
app.get('/login', (req, res) => {
    const scopes = ['user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private', 'user-read-currently-playing', 'user-library-read'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
    const { code } = req.query;
    spotifyApi.authorizationCodeGrant(code).then(data => {
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        res.send('Authentication successful! You can now use the app.');
    }).catch(err => {
        console.error('Error during authentication:', err);
        res.status(500).send('Authentication failed');
    });
});

// List all playlists
app.get('/playlists', async (req, res) => {
    try {
        const playlists = await spotifyApi.getUserPlaylists();
        res.json(playlists.body);
    } catch (err) {
        console.error('Error fetching playlists:', err);
        res.status(500).send('Failed to fetch playlists');
    }
});

// Search for a track
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).send('Query parameter is required');
    try {
        const results = await spotifyApi.searchTracks(query);
        res.json(results.body.tracks.items);
    } catch (err) {
        console.error('Error searching tracks:', err);
        res.status(500).send('Failed to search tracks');
    }
});

// Play a track, artist, or playlist on a device
app.post('/play', async (req, res) => {
    const { uri, deviceId } = req.body;
    if (!uri || !deviceId) return res.status(400).send('URI and deviceId are required');
    try {
        await spotifyApi.play({
            device_id: deviceId,
            context_uri: uri
        });
        res.send('Playback started successfully');
    } catch (err) {
        console.error('Error starting playback:', err);
        res.status(500).send('Failed to start playback');
    }
});

// Stop playback on a device
app.post('/stop', async (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).send('deviceId is required');
    try {
        await spotifyApi.pause({ device_id: deviceId });
        res.send('Playback stopped successfully');
    } catch (err) {
        console.error('Error stopping playback:', err);
        res.status(500).send('Failed to stop playback');
    }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Spotify Node.js app is running on http://localhost:${PORT}`);
});
