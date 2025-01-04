// Import required libraries
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Spotify API credentials
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
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

// List all devices
app.get('/devices', async (req, res) => {
  try {
      const devices = await spotifyApi.getMyDevices();
      res.json(devices.body);
  } catch (err) {
      console.error('Error fetching devices:', err);
      res.status(500).send('Failed to fetch devices');
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
app.get('/play', async (req, res) => {
    const { uri, deviceId } = req.query;
    if (!uri || !deviceId) return res.status(400).send('both URI and deviceId are required');
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
app.get('/stop', async (req, res) => {
    const { deviceId } = req.query;
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Spotify Node.js app is running on http://localhost:${PORT}`);
});

/*
Environment Variables:
Create a `.env` file in the project root with the following content:

CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:3001/callback
PORT=3001

Docker Instructions:
1. Create a `Dockerfile` in your project root with the following content:

```
FROM node:20
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "app.js"]
```

2. Build the Docker image:
   docker build -t spotify-node-app .

3. Run the container locally for testing:
   docker run -p 3001:3001 --env-file .env spotify-node-app

4. Move to Home Assistant:
   - Export the image: docker save spotify-node-app > spotify-node-app.tar
   - Copy to Home Assistant instance and load:
     docker load < spotify-node-app.tar
   - Run on Home Assistant with the same environment variables.
*/
