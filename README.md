# hassSpot
Spotify integration for Home Assistant running on nodejs

# Instructions for docker updates:
docker ps
docker stop **id**
docker rm **id**
docker build -t spot-add-on:latest .
docker run -p 3001:3001 -d --name spot_add_on spot-add-on:latest

docker logs spot_add_on

